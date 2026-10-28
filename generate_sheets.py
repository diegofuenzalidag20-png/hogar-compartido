# -*- coding: utf-8 -*-
"""
Master repair script that:
1. Re-aligns all cross-sheet formula references between 'Dashboard Resumen', 'Control Gastos', and 'Registro y Control Mensual'.
2. Wraps all division formulas in IFERROR to permanently eradicate #DIV/0! and #VALOR!.
3. Ensures all cell coordinates match the actual row numbers in 'Control Gastos'.
4. Keeps the month bar, reserved rows for extra items, and fixed chart labels.
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart import PieChart, BarChart, LineChart, DoughnutChart, Reference
from openpyxl.chart.label import DataLabelList

def build_perfect_workbook():
    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    # PALETA DE COLORES
    C_NAVY_DARK = "0F172A"
    C_NAVY_LIGHT = "1E293B"
    C_BLUE = "1D4ED8"
    C_BLUE_LIGHT = "EFF6FF"
    C_PURPLE = "7E22CE"
    C_PURPLE_LIGHT = "FAF5FF"
    C_EMERALD = "047857"
    C_EMERALD_LIGHT = "ECFDF5"
    C_AMBER = "B45309"
    C_AMBER_LIGHT = "FFFBEB"
    C_GRAY_BG = "F8FAFC"
    C_BORDER = "CBD5E1"
    C_BORDER_DARK = "0F172A"
    C_TEXT_MUTED = "64748B"

    f_title = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    f_subtitle = Font(name="Calibri", size=9.5, italic=True, color="CBD5E1")
    f_sec_header = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    f_col_header = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    f_normal = Font(name="Calibri", size=10, color="1E293B")
    f_bold = Font(name="Calibri", size=10, bold=True, color="1E293B")
    f_total = Font(name="Calibri", size=10, bold=True, color=C_NAVY_DARK)

    fill_title = PatternFill(start_color=C_NAVY_DARK, end_color=C_NAVY_DARK, fill_type="solid")
    fill_subtitle = PatternFill(start_color=C_NAVY_LIGHT, end_color=C_NAVY_LIGHT, fill_type="solid")
    fill_col_head = PatternFill(start_color=C_NAVY_LIGHT, end_color=C_NAVY_LIGHT, fill_type="solid")
    fill_card = PatternFill(start_color=C_GRAY_BG, end_color=C_GRAY_BG, fill_type="solid")
    fill_total = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
    fill_grand_total = PatternFill(start_color="CBD5E1", end_color="CBD5E1", fill_type="solid")

    fill_sec_diego = PatternFill(start_color=C_BLUE, end_color=C_BLUE, fill_type="solid")
    fill_sec_soledad = PatternFill(start_color=C_PURPLE, end_color=C_PURPLE, fill_type="solid")
    fill_sec_ahorro = PatternFill(start_color=C_EMERALD, end_color=C_EMERALD, fill_type="solid")
    fill_sec_operaciones = PatternFill(start_color=C_AMBER, end_color=C_AMBER, fill_type="solid")
    fill_sec_general = PatternFill(start_color=C_NAVY_DARK, end_color=C_NAVY_DARK, fill_type="solid")

    b_thin = Side(style='thin', color=C_BORDER)
    b_double = Side(style='double', color=C_BORDER_DARK)
    b_thick = Side(style='medium', color=C_BORDER_DARK)

    border_cell = Border(left=b_thin, right=b_thin, top=b_thin, bottom=b_thin)
    border_card = Border(left=b_thin, right=b_thin, top=b_thin, bottom=b_thin)
    border_total = Border(top=b_thin, bottom=b_double, left=b_thin, right=b_thin)
    border_grand_total = Border(top=b_thick, bottom=b_double, left=b_thin, right=b_thin)

    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")
    align_left_indent = Alignment(horizontal="left", vertical="center", indent=1)

    fmt_clp = '"$"#,##0'
    fmt_diff_clp = '"+"$#,##0;"-"$#,##0;"$0"'
    fmt_pct = '0.0%'
    fmt_diff_pct = '+0.0%;-0.0%;0.0%'

    # =========================================================================
    # PESTAÑA 4 PRIMERO: Control Gastos (Definición Base de Parámetros)
    # =========================================================================
    ws_ctrl = wb.create_sheet(title="Control Gastos")
    ws_ctrl.views.sheetView[0].showGridLines = True
    ws_ctrl.row_dimensions[1].height = 14

    ws_ctrl.merge_cells("B2:I2")
    ws_ctrl["B2"] = "📋 PRESUPUESTO MAESTRO & MATRIZ DE ASIGNACIÓN — DIEGO & SOLEDAD"
    ws_ctrl["B2"].font = f_title
    ws_ctrl["B2"].fill = fill_title
    ws_ctrl["B2"].alignment = align_center
    ws_ctrl.row_dimensions[2].height = 36

    ws_ctrl.merge_cells("B3:I3")
    ws_ctrl["B3"] = "Parámetros base mensuales acordados y calibrados según los 14 meses de registros reales."
    ws_ctrl["B3"].font = f_subtitle
    ws_ctrl["B3"].fill = fill_subtitle
    ws_ctrl["B3"].alignment = align_center
    ws_ctrl.row_dimensions[3].height = 20

    ws_ctrl.row_dimensions[4].height = 10

    # Sección 1: Ingresos
    ws_ctrl.merge_cells("B5:I5")
    ws_ctrl["B5"] = "1. INGRESOS MENSUALES LÍQUIDOS (BASE MAESTRA)"
    ws_ctrl["B5"].font = f_sec_header
    ws_ctrl["B5"].fill = fill_sec_diego
    ws_ctrl["B5"].alignment = align_left_indent
    ws_ctrl.row_dimensions[5].height = 24

    for i, h in enumerate(["#", "Integrante", "Concepto de Renta", "Monto Líquido", "Medio de Depósito", "% del Total", "Frecuencia", "Notas"], start=2):
        col_l = get_column_letter(i)
        c = ws_ctrl[f"{col_l}6"]
        c.value = h
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if i in [2, 7, 8] else (align_right if i in [5, 7] else align_left)
    ws_ctrl.row_dimensions[6].height = 22

    ctrl_ingresos_data = [
        (11, 1, "Diego", "Sueldo Líquido Diego", 1214038, "Transferencia Banco", "=IFERROR(E11/$E$13, 0)", "Mensual", "Renta líquida contractual"),
        (12, 2, "Soledad", "Sueldo Líquido Soledad (Promedio)", 875000, "Chequera BancoEstado", "=IFERROR(E12/$E$13, 0)", "Mensual", "Rango $850.000 - $900.000"),
    ]
    for r, num, resp, conc, mto, mdo, pct_f, frec, obs in ctrl_ingresos_data:
        ws_ctrl[f"B{r}"] = num
        ws_ctrl[f"C{r}"] = resp
        ws_ctrl[f"D{r}"] = conc
        ws_ctrl[f"E{r}"] = mto
        ws_ctrl[f"F{r}"] = mdo
        ws_ctrl[f"G{r}"] = pct_f
        ws_ctrl[f"H{r}"] = frec
        ws_ctrl[f"I{r}"] = obs
        ws_ctrl.row_dimensions[r].height = 22
        for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
            c = ws_ctrl[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l == "E":
                c.number_format = fmt_clp
                c.alignment = align_right
                c.font = f_bold
            elif col_l == "G":
                c.number_format = fmt_pct
                c.alignment = align_right
            elif col_l in ["B", "C", "H"]:
                c.alignment = align_center
            else:
                c.alignment = align_left

    # Total Ingresos Control Gastos (Fila 13)
    ws_ctrl.merge_cells("B13:D13")
    ws_ctrl["B13"] = "TOTAL INGRESOS HOGAR"
    ws_ctrl["B13"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_ctrl["E13"] = "=SUM(E11:E12)"
    ws_ctrl["E13"].number_format = fmt_clp
    ws_ctrl["E13"].alignment = align_right
    ws_ctrl["G13"] = "=SUM(G11:G12)"
    ws_ctrl["G13"].number_format = fmt_pct
    ws_ctrl["G13"].alignment = align_right
    ws_ctrl["I13"] = "=E13"
    ws_ctrl["I13"].number_format = fmt_clp
    ws_ctrl["I13"].alignment = align_right
    ws_ctrl.row_dimensions[13].height = 24
    for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
        c = ws_ctrl[f"{col_l}13"]
        c.font = f_total
        c.fill = fill_total
        c.border = border_total

    # Sección 2: Fijos Diego (Filas 17 a 24)
    ws_ctrl.row_dimensions[14].height = 10
    ws_ctrl.merge_cells("B15:I15")
    ws_ctrl["B15"] = "2. VIVIENDA & GASTOS FIJOS — DIEGO (CUENTA FAN)"
    ws_ctrl["B15"].font = f_sec_header
    ws_ctrl["B15"].fill = fill_sec_diego
    ws_ctrl["B15"].alignment = align_left_indent
    ws_ctrl.row_dimensions[15].height = 24

    for i, h in enumerate(["#", "Categoría", "Concepto", "Monto Base", "Medio", "% Ingreso", "Frecuencia", "Notas"], start=2):
        col_l = get_column_letter(i)
        c = ws_ctrl[f"{col_l}16"]
        c.value = h
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if i in [2, 7, 8] else (align_right if i in [5, 7] else align_left)
    ws_ctrl.row_dimensions[16].height = 22

    fijos_diego_data = [
        (17, 1, "Vivienda", "Crédito Hipotecario (UF)", 360000, "Cuenta Fan", "=IFERROR(E17/$E$13, 0)", "Mensual", "Alza gradual UF"),
        (18, 2, "Vivienda Huasco", "Arriendo Habitación Huasco", 95000, "Cuenta Fan", "=IFERROR(E18/$E$13, 0)", "Mensual", "Contrato vigente"),
        (19, 3, "Vivienda Huasco", "Servicios Huasco (Luz y Agua)", 7000, "Cuenta Fan", "=IFERROR(E19/$E$13, 0)", "Mensual", "Tarifa fija"),
        (20, 4, "Conectividad", "Internet + Celular (Diego)", 40000, "Cuenta Fan", "=IFERROR(E20/$E$13, 0)", "Mensual", "Plan fijo"),
        (21, 5, "Mascotas", "Comida Michis", 42000, "Cuenta Fan", "=IFERROR(E21/$E$13, 0)", "Mensual", "Promedio 14 meses"),
        (22, 6, "Mascotas", "Arena Sanitaria Michis", 20000, "Cuenta Fan", "=IFERROR(E22/$E$13, 0)", "Mensual", "Promedio 14 meses"),
        (23, 7, "Streaming", "Netflix + Crunchyroll", 16878, "Cuenta Fan", "=IFERROR(E23/$E$13, 0)", "Mensual", "$10.388 + $6.490"),
        (24, 8, "Salud", "Eutirox 137 + Rupatadina", 20382, "Cuenta Fan", "=IFERROR(E24/$E$13, 0)", "Mensual", "$10.000 + $10.382"),
    ]
    for r, num, cat, conc, mto, mdo, pct_f, frec, obs in fijos_diego_data:
        ws_ctrl[f"B{r}"] = num
        ws_ctrl[f"C{r}"] = cat
        ws_ctrl[f"D{r}"] = conc
        ws_ctrl[f"E{r}"] = mto
        ws_ctrl[f"F{r}"] = mdo
        ws_ctrl[f"G{r}"] = pct_f
        ws_ctrl[f"H{r}"] = frec
        ws_ctrl[f"I{r}"] = obs
        ws_ctrl.row_dimensions[r].height = 21
        for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
            c = ws_ctrl[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l == "E":
                c.number_format = fmt_clp
                c.alignment = align_right
                c.font = f_bold
            elif col_l == "G":
                c.number_format = fmt_pct
                c.alignment = align_right
            elif col_l in ["B", "H"]:
                c.alignment = align_center
            else:
                c.alignment = align_left

    # Subtotal Fijos Diego (Fila 25)
    ws_ctrl.merge_cells("B25:D25")
    ws_ctrl["B25"] = "SUBTOTAL VIVIENDA & FIJOS DIEGO"
    ws_ctrl["B25"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_ctrl["E25"] = "=SUM(E17:E24)"
    ws_ctrl["E25"].number_format = fmt_clp
    ws_ctrl["E25"].alignment = align_right
    ws_ctrl["G25"] = "=SUM(G17:G24)"
    ws_ctrl["G25"].number_format = fmt_pct
    ws_ctrl["G25"].alignment = align_right
    ws_ctrl.row_dimensions[25].height = 24
    for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
        c = ws_ctrl[f"{col_l}25"]
        c.font = f_total
        c.fill = fill_total
        c.border = border_total

    # Sección 3: Operaciones Huasco (Filas 29 a 32)
    ws_ctrl.row_dimensions[26].height = 10
    ws_ctrl.merge_cells("B27:I27")
    ws_ctrl["B27"] = "3. OPERACIONES & LOGÍSTICA HUASCO — DIEGO (TENPO)"
    ws_ctrl["B27"].font = f_sec_header
    ws_ctrl["B27"].fill = fill_sec_operaciones
    ws_ctrl["B27"].alignment = align_left_indent
    ws_ctrl.row_dimensions[27].height = 24

    for i, h in enumerate(["#", "Categoría", "Concepto", "Monto Base", "Medio", "% Ingreso", "Frecuencia", "Notas"], start=2):
        col_l = get_column_letter(i)
        c = ws_ctrl[f"{col_l}28"]
        c.value = h
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if i in [2, 7, 8] else (align_right if i in [5, 7] else align_left)
    ws_ctrl.row_dimensions[28].height = 22

    op_diego_data = [
        (29, 9, "Operaciones", "Pasajes Interregionales (8 tramos)", 231500, "Tenpo", "=IFERROR(E29/$E$13, 0)", "Mensual", "Pasajes Huasco"),
        (30, 10, "Operaciones", "Uber (Traslados y retenciones)", 25000, "Tenpo", "=IFERROR(E30/$E$13, 0)", "Mensual", "Margen PayU"),
        (31, 11, "Operaciones", "Metro Valparaíso (EFE)", 10000, "Tenpo", "=IFERROR(E31/$E$13, 0)", "Mensual", "Recargas"),
        (32, 12, "Operaciones", "Snacks Turno (Galletas + Energéticas)", 33500, "Tenpo", "=IFERROR(E32/$E$13, 0)", "Mensual", "Consumo en turno"),
    ]
    for r, num, cat, conc, mto, mdo, pct_f, frec, obs in op_diego_data:
        ws_ctrl[f"B{r}"] = num
        ws_ctrl[f"C{r}"] = cat
        ws_ctrl[f"D{r}"] = conc
        ws_ctrl[f"E{r}"] = mto
        ws_ctrl[f"F{r}"] = mdo
        ws_ctrl[f"G{r}"] = pct_f
        ws_ctrl[f"H{r}"] = frec
        ws_ctrl[f"I{r}"] = obs
        ws_ctrl.row_dimensions[r].height = 21
        for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
            c = ws_ctrl[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l == "E":
                c.number_format = fmt_clp
                c.alignment = align_right
                c.font = f_bold
            elif col_l == "G":
                c.number_format = fmt_pct
                c.alignment = align_right
            elif col_l in ["B", "H"]:
                c.alignment = align_center
            else:
                c.alignment = align_left

    # Subtotal Operaciones (Fila 33)
    ws_ctrl.merge_cells("B33:D33")
    ws_ctrl["B33"] = "SUBTOTAL OPERACIONES TENPO"
    ws_ctrl["B33"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_ctrl["E33"] = "=SUM(E29:E32)"
    ws_ctrl["E33"].number_format = fmt_clp
    ws_ctrl["E33"].alignment = align_right
    ws_ctrl["G33"] = "=SUM(G29:G32)"
    ws_ctrl["G33"].number_format = fmt_pct
    ws_ctrl["G33"].alignment = align_right
    ws_ctrl.row_dimensions[33].height = 24
    for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
        c = ws_ctrl[f"{col_l}33"]
        c.font = f_total
        c.fill = fill_total
        c.border = border_total

    # Sección 4: Bolsillo & Ahorro Diego (Filas 37 y 38)
    ws_ctrl.row_dimensions[34].height = 10
    ws_ctrl.merge_cells("B35:I35")
    ws_ctrl["B35"] = "4. BOLSILLO PERSONAL & AHORRO BLINDADO — DIEGO (MACH & MERCADO PAGO)"
    ws_ctrl["B35"].font = f_sec_header
    ws_ctrl["B35"].fill = fill_sec_ahorro
    ws_ctrl["B35"].alignment = align_left_indent
    ws_ctrl.row_dimensions[35].height = 24

    for i, h in enumerate(["#", "Categoría", "Concepto", "Monto Base", "Medio", "% Ingreso", "Frecuencia", "Notas"], start=2):
        col_l = get_column_letter(i)
        c = ws_ctrl[f"{col_l}36"]
        c.value = h
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if i in [2, 7, 8] else (align_right if i in [5, 7] else align_left)
    ws_ctrl.row_dimensions[36].height = 22

    ahorro_diego_data = [
        (37, 13, "Bolsillo", "Asignación Semanal Mach ($35k x 4)", 140000, "Mach", "=IFERROR(E37/$E$13, 0)", "Semanal", "Modo recuperación"),
        (38, 14, "Ahorro", "Fondo Emergencia Mercado Pago", 130000, "Mercado Pago", "=IFERROR(E38/$E$13, 0)", "Mensual", "Rendimiento diario"),
    ]
    for r, num, cat, conc, mto, mdo, pct_f, frec, obs in ahorro_diego_data:
        ws_ctrl[f"B{r}"] = num
        ws_ctrl[f"C{r}"] = cat
        ws_ctrl[f"D{r}"] = conc
        ws_ctrl[f"E{r}"] = mto
        ws_ctrl[f"F{r}"] = mdo
        ws_ctrl[f"G{r}"] = pct_f
        ws_ctrl[f"H{r}"] = frec
        ws_ctrl[f"I{r}"] = obs
        ws_ctrl.row_dimensions[r].height = 21
        for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
            c = ws_ctrl[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l == "E":
                c.number_format = fmt_clp
                c.alignment = align_right
                c.font = f_bold
            elif col_l == "G":
                c.number_format = fmt_pct
                c.alignment = align_right
            elif col_l in ["B", "H"]:
                c.alignment = align_center
            else:
                c.alignment = align_left

    # Subtotal Ahorro / Bolsillo (Fila 39)
    ws_ctrl.merge_cells("B39:D39")
    ws_ctrl["B39"] = "SUBTOTAL BOLSILLO & AHORRO DIEGO"
    ws_ctrl["B39"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_ctrl["E39"] = "=SUM(E37:E38)"
    ws_ctrl["E39"].number_format = fmt_clp
    ws_ctrl["E39"].alignment = align_right
    ws_ctrl["G39"] = "=SUM(G37:G38)"
    ws_ctrl["G39"].number_format = fmt_pct
    ws_ctrl["G39"].alignment = align_right
    ws_ctrl.row_dimensions[39].height = 24
    for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
        c = ws_ctrl[f"{col_l}39"]
        c.font = f_total
        c.fill = fill_total
        c.border = border_total

    # Sección 5: Hogar Limache & Smart Visa Soledad (Filas 43 a 50)
    ws_ctrl.row_dimensions[40].height = 10
    ws_ctrl.merge_cells("B41:I41")
    ws_ctrl["B41"] = "5. CUENTAS BÁSICAS LIMACHE & COMPROMISOS — SOLEDAD (BANCOESTADO)"
    ws_ctrl["B41"].font = f_sec_header
    ws_ctrl["B41"].fill = fill_sec_soledad
    ws_ctrl["B41"].alignment = align_left_indent
    ws_ctrl.row_dimensions[41].height = 24

    for i, h in enumerate(["#", "Categoría", "Concepto", "Monto Base", "Medio", "% Ingreso", "Frecuencia", "Notas"], start=2):
        col_l = get_column_letter(i)
        c = ws_ctrl[f"{col_l}42"]
        c.value = h
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if i in [2, 7, 8] else (align_right if i in [5, 7] else align_left)
    ws_ctrl.row_dimensions[42].height = 22

    soledad_gastos_data = [
        (43, 15, "Hogar Limache", "Luz (CGE / Chilquinta)", 22500, "BancoEstado", "=IFERROR(E43/$E$13, 0)", "Mensual", "Promedio 14 meses ($22.2k)"),
        (44, 16, "Hogar Limache", "Agua (Esval)", 7200, "BancoEstado", "=IFERROR(E44/$E$13, 0)", "Mensual", "Promedio 14 meses ($7.1k)"),
        (45, 17, "Hogar Limache", "Gas (Lipigas / Abastible)", 20500, "BancoEstado", "=IFERROR(E45/$E$13, 0)", "Mensual", "Promedio 14 meses ($20.1k)"),
        (46, 18, "Conectividad", "Plan Claro (Pareja)", 9500, "BancoEstado", "=IFERROR(E46/$E$13, 0)", "Mensual", "Promedio 14 meses ($9.3k)"),
        (47, 19, "Hogar Limache", "Gasto Común Condominio", 52500, "BancoEstado", "=IFERROR(E47/$E$13, 0)", "Mensual", "Promedio 14 meses ($52.5k)"),
        (48, 20, "Alimentación", "Supermercado Hogar Limache", 125000, "BancoEstado", "=IFERROR(E48/$E$13, 0)", "Mensual", "Presupuesto promedio acordado"),
        (49, 21, "Hogar Limache", "Aseo Domiciliario Municipal", 4550, "BancoEstado", "=IFERROR(E49/$E$13, 0)", "Mensual", "Cuota trimestral $13.6k"),
        (50, 22, "Compromisos", "Tarjeta Smart Visa", 50000, "BancoEstado", "=IFERROR(E50/$E$13, 0)", "Mensual", "Promedio 14 meses (~$46k-$50k)"),
    ]
    for r, num, cat, conc, mto, mdo, pct_f, frec, obs in soledad_gastos_data:
        ws_ctrl[f"B{r}"] = num
        ws_ctrl[f"C{r}"] = cat
        ws_ctrl[f"D{r}"] = conc
        ws_ctrl[f"E{r}"] = mto
        ws_ctrl[f"F{r}"] = mdo
        ws_ctrl[f"G{r}"] = pct_f
        ws_ctrl[f"H{r}"] = frec
        ws_ctrl[f"I{r}"] = obs
        ws_ctrl.row_dimensions[r].height = 21
        for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
            c = ws_ctrl[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l == "E":
                c.number_format = fmt_clp
                c.alignment = align_right
                c.font = f_bold
            elif col_l == "G":
                c.number_format = fmt_pct
                c.alignment = align_right
            elif col_l in ["B", "H"]:
                c.alignment = align_center
            else:
                c.alignment = align_left

    # Subtotal Soledad (Fila 51)
    ws_ctrl.merge_cells("B51:D51")
    ws_ctrl["B51"] = "SUBTOTAL HOGAR LIMACHE & SMART SOLEDAD"
    ws_ctrl["B51"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_ctrl["E51"] = "=SUM(E43:E50)"
    ws_ctrl["E51"].number_format = fmt_clp
    ws_ctrl["E51"].alignment = align_right
    ws_ctrl["G51"] = "=SUM(G43:G50)"
    ws_ctrl["G51"].number_format = fmt_pct
    ws_ctrl["G51"].alignment = align_right
    ws_ctrl.row_dimensions[51].height = 24
    for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
        c = ws_ctrl[f"{col_l}51"]
        c.font = f_total
        c.fill = fill_total
        c.border = border_total

    # Gran Total Gastos Hogar (Fila 53)
    ws_ctrl.row_dimensions[52].height = 10
    ws_ctrl.merge_cells("B53:D53")
    ws_ctrl["B53"] = "GRAN TOTAL PRESUPUESTO GASTOS HOGAR"
    ws_ctrl["B53"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_ctrl["E53"] = "=E25+E33+E39+E51"
    ws_ctrl["E53"].number_format = fmt_clp
    ws_ctrl["E53"].alignment = align_right
    ws_ctrl["G53"] = "=G25+G33+G39+G51"
    ws_ctrl["G53"].number_format = fmt_pct
    ws_ctrl["G53"].alignment = align_right
    ws_ctrl["I53"] = "=E53"
    ws_ctrl["I53"].number_format = fmt_clp
    ws_ctrl["I53"].alignment = align_right
    ws_ctrl.row_dimensions[53].height = 26
    for col_l in ["B", "C", "D", "E", "F", "G", "H", "I"]:
        c = ws_ctrl[f"{col_l}53"]
        c.font = Font(name="Calibri", size=10, bold=True, color=C_NAVY_DARK)
        c.fill = fill_grand_total
        c.border = border_grand_total

    col_widths_ctrl = {
        "A": 3, "B": 4, "C": 18, "D": 34, "E": 18, "F": 22,
        "G": 14, "H": 14, "I": 32
    }
    for col_l, w in col_widths_ctrl.items():
        ws_ctrl.column_dimensions[col_l].width = w

    # =========================================================================
    # PESTAÑA 2: Dashboard Resumen (100% BLINDADO CONTRA ERRORES)
    # =========================================================================
    ws_dash = wb.create_sheet(title="Dashboard Resumen")
    ws_dash.views.sheetView[0].showGridLines = False
    ws_dash.row_dimensions[1].height = 14

    ws_dash.merge_cells("B2:M2")
    ws_dash["B2"] = "📊 PANEL DE CONTROL FINANCIERO CONSOLIDADO — HOGAR DIEGO & SOLEDAD"
    ws_dash["B2"].font = f_title
    ws_dash["B2"].fill = fill_title
    ws_dash["B2"].alignment = align_center
    ws_dash.row_dimensions[2].height = 36

    ws_dash.merge_cells("B3:M3")
    ws_dash["B3"] = "Presupuesto familiar sincronizado • Diego ($1.214.038 | 58.1%) & Soledad ($875.000 | 41.9%) • Total Hogar: $2.089.038"
    ws_dash["B3"].font = f_subtitle
    ws_dash["B3"].fill = fill_subtitle
    ws_dash["B3"].alignment = align_center
    ws_dash.row_dimensions[3].height = 20

    ws_dash.row_dimensions[4].height = 14

    # Tarjetas KPI Dashboard - CON FÓRMULAS DIRECTAS 100% EXACTAS
    dash_kpis = [
        ("B", "C", "INGRESOS FAMILIARES", "='Control Gastos'!E13", "Diego ($1.214k) + Soledad ($875k)", C_BLUE),
        ("D", "E", "GASTOS TOTALES HOGAR", "='Control Gastos'!E53", "Fijos + Operaciones + Limache", "DC2626"),
        ("F", "G", "AHORRO BLINDADO MES", "='Control Gastos'!E38", "Mercado Pago (Rendimiento diario)", C_EMERALD),
        ("H", "I", "COLCHÓN OXÍGENO DIEGO", "=C29-D29", "Margen de seguridad libre Diego", C_AMBER),
        ("J", "K", "MARGEN LIBRE SOLEDAD", "=C30-D30", "Capacidad libre mensual Soledad", C_PURPLE),
        ("L", "M", "SUPERÁVIT TOTAL HOGAR", "=C31-D31", "30.0% tasa de ahorro libre del hogar", C_EMERALD),
    ]

    ws_dash.row_dimensions[5].height = 20
    ws_dash.row_dimensions[6].height = 30
    ws_dash.row_dimensions[7].height = 18

    for c1, c2, title_txt, formula_val, sub_txt, color_txt in dash_kpis:
        ws_dash.merge_cells(f"{c1}5:{c2}5")
        c = ws_dash[f"{c1}5"]
        c.value = title_txt
        c.font = Font(name="Calibri", size=8.5, bold=True, color=color_txt)
        c.fill = fill_card
        c.alignment = align_center

        ws_dash.merge_cells(f"{c1}6:{c2}6")
        c = ws_dash[f"{c1}6"]
        c.value = formula_val
        c.font = Font(name="Calibri", size=16, bold=True, color=color_txt if c1 in ["B", "D", "L"] else C_NAVY_DARK)
        c.fill = fill_card
        c.alignment = align_center
        c.number_format = fmt_clp

        ws_dash.merge_cells(f"{c1}7:{c2}7")
        c = ws_dash[f"{c1}7"]
        c.value = sub_txt
        c.font = Font(name="Calibri", size=8, color=C_TEXT_MUTED)
        c.fill = fill_card
        c.alignment = align_center

        col_start = openpyxl.utils.column_index_from_string(c1)
        col_end = openpyxl.utils.column_index_from_string(c2)
        for r in range(5, 8):
            for col_i in range(col_start, col_end + 1):
                col_letter = get_column_letter(col_i)
                ws_dash[f"{col_letter}{r}"].border = border_card
                ws_dash[f"{col_letter}{r}"].fill = fill_card

    ws_dash.row_dimensions[8].height = 14

    # Tabla 1: Aportes Familiares (Filas 9 a 13)
    ws_dash.merge_cells("B9:F9")
    ws_dash["B9"] = "1. APORTES & ESTRUCTURA DE INGRESOS FAMILIARES"
    ws_dash["B9"].font = f_sec_header
    ws_dash["B9"].fill = fill_sec_diego
    ws_dash["B9"].alignment = align_left_indent
    ws_dash.row_dimensions[9].height = 24
    for col_i in range(2, 7):
        ws_dash.cell(row=9, column=col_i).border = border_cell

    dash_headers_1 = ["Integrante", "% Aporte", "Cuenta de Abono", "Monto Base (CLP)", "Destino / Misión"]
    for i, h in enumerate(dash_headers_1, start=2):
        col_l = get_column_letter(i)
        c = ws_dash[f"{col_l}10"]
        c.value = h
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if i in [2, 3] else (align_right if i == 5 else align_left)
    ws_dash.row_dimensions[10].height = 22

    # Aportes exactos con punteros correctos
    dash_data_1 = [
        (11, "Diego", "='Control Gastos'!G11", "Cuenta Corriente / Vista", "='Control Gastos'!E11", "Vivienda, Operaciones Huasco y Ahorro"),
        (12, "Soledad", "='Control Gastos'!G12", "Chequera BancoEstado", "='Control Gastos'!E12", "Cuentas Hogar Limache y Smart Visa"),
    ]
    for r, nom, pct_f, cta, mto_f, dest in dash_data_1:
        ws_dash[f"B{r}"] = nom
        ws_dash[f"C{r}"] = pct_f
        ws_dash[f"D{r}"] = cta
        ws_dash[f"E{r}"] = mto_f
        ws_dash[f"F{r}"] = dest
        ws_dash.row_dimensions[r].height = 22
        for col_l in ["B", "C", "D", "E", "F"]:
            c = ws_dash[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l == "C":
                c.number_format = fmt_pct
                c.alignment = align_center
            elif col_l == "E":
                c.number_format = fmt_clp
                c.alignment = align_right
                c.font = f_bold
            elif col_l == "B":
                c.font = f_bold
                c.alignment = align_center
            else:
                c.alignment = align_left

    # Total Ingresos (Fila 13)
    ws_dash.merge_cells("B13:C13")
    ws_dash["B13"] = "TOTAL INGRESO FAMILIAR"
    ws_dash["B13"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_dash["D13"] = "100.0%"
    ws_dash["D13"].alignment = align_center
    ws_dash["D13"].number_format = fmt_pct
    ws_dash["E13"] = "=SUM(E11:E12)"
    ws_dash["E13"].number_format = fmt_clp
    ws_dash["E13"].alignment = align_right
    ws_dash["F13"] = "Ingreso neto mensual del hogar"
    ws_dash.row_dimensions[13].height = 24
    for col_l in ["B", "C", "D", "E", "F"]:
        c = ws_dash[f"{col_l}13"]
        c.font = f_total
        c.fill = fill_total
        c.border = border_total

    ws_dash.row_dimensions[14].height = 10
    ws_dash.row_dimensions[15].height = 10

    # Tabla 2: Distribución por Cofre / Destino (Filas 16 a 24)
    ws_dash.merge_cells("B16:F16")
    ws_dash["B16"] = "2. ASIGNACIÓN MENSUAL POR COFRE & CUENTA BANCARIA"
    ws_dash["B16"].font = f_sec_header
    ws_dash["B16"].fill = fill_sec_general
    ws_dash["B16"].alignment = align_left_indent
    ws_dash.row_dimensions[16].height = 24
    for col_i in range(2, 7):
        ws_dash.cell(row=16, column=col_i).border = border_cell

    dash_headers_2 = ["Cofre / Destino", "Responsable", "Cuenta / Medio", "Monto Mensual", "% del Ingreso"]
    for i, h in enumerate(dash_headers_2, start=2):
        col_l = get_column_letter(i)
        c = ws_dash[f"{col_l}17"]
        c.value = h
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if i in [3, 4] else (align_right if i in [5, 6] else align_left)
    ws_dash.row_dimensions[17].height = 22

    # Punteros 100% verificados a Control Gastos y con IFERROR
    dash_data_2 = [
        (18, "Vivienda & Gastos Fijos Diego", "Diego", "Cuenta Fan", "='Control Gastos'!E25", "=IFERROR(E18/$E$13, 0)"),
        (19, "Operaciones & Logística Huasco", "Diego", "Tenpo Prepago", "='Control Gastos'!E33", "=IFERROR(E19/$E$13, 0)"),
        (20, "Bolsillo Personal (Modo Recuperación)", "Diego", "Mach", "='Control Gastos'!E37", "=IFERROR(E20/$E$13, 0)"),
        (21, "Ahorro Blindado / Fondo Reserva", "Diego", "Mercado Pago", "='Control Gastos'!E38", "=IFERROR(E21/$E$13, 0)"),
        (22, "Gastos Hogar & Cuentas Básicas", "Soledad", "Chequera BancoEstado", "=SUM('Control Gastos'!E43:E49)", "=IFERROR(E22/$E$13, 0)"),
        (23, "Tarjeta Smart Visa (Compromiso Pareja)", "Soledad", "BancoEstado", "='Control Gastos'!E50", "=IFERROR(E23/$E$13, 0)"),
    ]
    for r, cof, resp, cta, mto_f, pct_f in dash_data_2:
        ws_dash[f"B{r}"] = cof
        ws_dash[f"C{r}"] = resp
        ws_dash[f"D{r}"] = cta
        ws_dash[f"E{r}"] = mto_f
        ws_dash[f"F{r}"] = pct_f
        ws_dash.row_dimensions[r].height = 22
        for col_l in ["B", "C", "D", "E", "F"]:
            c = ws_dash[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l == "E":
                c.number_format = fmt_clp
                c.alignment = align_right
                c.font = f_bold
            elif col_l == "F":
                c.number_format = fmt_pct
                c.alignment = align_right
            elif col_l in ["C", "D"]:
                c.alignment = align_center
            else:
                c.alignment = align_left

    # Total Asignado (Fila 24)
    ws_dash.merge_cells("B24:D24")
    ws_dash["B24"] = "TOTAL GASTOS & COMPROMISOS HOGAR"
    ws_dash["B24"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_dash["E24"] = "=SUM(E18:E23)"
    ws_dash["E24"].number_format = fmt_clp
    ws_dash["E24"].alignment = align_right
    ws_dash["F24"] = "=SUM(F18:F23)"
    ws_dash["F24"].number_format = fmt_pct
    ws_dash["F24"].alignment = align_right
    ws_dash.row_dimensions[24].height = 24
    for col_l in ["B", "C", "D", "E", "F"]:
        c = ws_dash[f"{col_l}24"]
        c.font = f_total
        c.fill = fill_total
        c.border = border_total

    # Tabla 3: Balances Personales (Filas 27 a 31)
    ws_dash.row_dimensions[25].height = 10
    ws_dash.row_dimensions[26].height = 10

    ws_dash.merge_cells("B27:F27")
    ws_dash["B27"] = "3. BALANCES & CAPACIDAD LIBRE REAL POR INTEGRANTE"
    ws_dash["B27"].font = f_sec_header
    ws_dash["B27"].fill = fill_sec_general
    ws_dash["B27"].alignment = align_left_indent
    ws_dash.row_dimensions[27].height = 24
    for col_i in range(2, 7):
        ws_dash.cell(row=27, column=col_i).border = border_cell

    dash_headers_3 = ["Integrante", "Ingreso Líquido", "Compromisos Asignados", "Margen / Capacidad Libre", "Tasa de Ahorro / Margen"]
    for i, h in enumerate(dash_headers_3, start=2):
        col_l = get_column_letter(i)
        c = ws_dash[f"{col_l}28"]
        c.value = h
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if i == 2 else align_right
    ws_dash.row_dimensions[28].height = 22

    # Punteros 100% numéricos sin restas de texto
    dash_data_3 = [
        (29, "Diego", "=E11", "=SUM(E18:E21)", "=C29-D29", "=IFERROR(E29/C29, 0)"),
        (30, "Soledad", "=E12", "=SUM(E22:E23)", "=C30-D30", "=IFERROR(E30/C30, 0)"),
    ]
    for r, nom, ing_f, gast_f, mrg_f, pct_mrg in dash_data_3:
        ws_dash[f"B{r}"] = nom
        ws_dash[f"C{r}"] = ing_f
        ws_dash[f"D{r}"] = gast_f
        ws_dash[f"E{r}"] = mrg_f
        ws_dash[f"F{r}"] = pct_mrg
        ws_dash.row_dimensions[r].height = 22
        for col_l in ["B", "C", "D", "E", "F"]:
            c = ws_dash[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l in ["C", "D", "E"]:
                c.number_format = fmt_clp
                c.alignment = align_right
                if col_l == "E":
                    c.font = f_bold
            elif col_l == "F":
                c.number_format = fmt_pct
                c.alignment = align_right
                c.font = f_bold
            else:
                c.font = f_bold
                c.alignment = align_center

    # Total Balance Familiar (Fila 31)
    ws_dash["B31"] = "TOTAL HOGAR"
    ws_dash["B31"].alignment = align_center
    ws_dash["C31"] = "=SUM(C29:C30)"
    ws_dash["C31"].number_format = fmt_clp
    ws_dash["C31"].alignment = align_right
    ws_dash["D31"] = "=SUM(D29:D30)"
    ws_dash["D31"].number_format = fmt_clp
    ws_dash["D31"].alignment = align_right
    ws_dash["E31"] = "=SUM(E29:E30)"
    ws_dash["E31"].number_format = fmt_clp
    ws_dash["E31"].alignment = align_right
    ws_dash["F31"] = "=IFERROR(E31/C31, 0)"
    ws_dash["F31"].number_format = fmt_pct
    ws_dash["F31"].alignment = align_right
    ws_dash.row_dimensions[31].height = 26
    for col_l in ["B", "C", "D", "E", "F"]:
        c = ws_dash[f"{col_l}31"]
        c.font = Font(name="Calibri", size=10, bold=True, color=C_EMERALD)
        c.fill = fill_grand_total
        c.border = border_grand_total

    # Gráficos Dashboard
    donut_dash = DoughnutChart()
    donut_dash.title = "Distribución de Gastos por Cofre / Cuenta"
    donut_dash.title.text.font = Font(name="Calibri", size=11, bold=True, color=C_NAVY_DARK)
    labels_d = Reference(ws_dash, min_col=2, min_row=18, max_row=23)
    data_d = Reference(ws_dash, min_col=5, min_row=17, max_row=23)
    donut_dash.add_data(data_d, titles_from_data=True)
    donut_dash.set_categories(labels_d)

    donut_dash.dataLabels = DataLabelList()
    donut_dash.dataLabels.showPercent = True
    donut_dash.dataLabels.showVal = False
    donut_dash.dataLabels.showCatName = False
    donut_dash.dataLabels.showSerName = False
    donut_dash.dataLabels.showLegendKey = False
    donut_dash.legend.legendPos = "r"
    donut_dash.width = 22
    donut_dash.height = 11.5
    ws_dash.add_chart(donut_dash, "H9")

    bar_dash = BarChart()
    bar_dash.title = "Aporte Financiero Real por Integrante (Sueldo Líquido)"
    bar_dash.title.text.font = Font(name="Calibri", size=11, bold=True, color=C_NAVY_DARK)
    bar_dash.y_axis.title = "Monto Mensual (CLP)"
    bar_dash.x_axis.title = "Integrante"
    data_bar_d = Reference(ws_dash, min_col=5, min_row=10, max_row=12)
    labels_bar_d = Reference(ws_dash, min_col=2, min_row=11, max_row=12)
    bar_dash.add_data(data_bar_d, titles_from_data=True)
    bar_dash.set_categories(labels_bar_d)
    bar_dash.legend = None

    bar_dash.dataLabels = DataLabelList()
    bar_dash.dataLabels.showVal = True
    bar_dash.dataLabels.showCatName = False
    bar_dash.dataLabels.showSerName = False
    bar_dash.dataLabels.showLegendKey = False
    bar_dash.y_axis.scaling.max = 1500000
    bar_dash.width = 20
    bar_dash.height = 10
    ws_dash.add_chart(bar_dash, "H26")

    col_widths_dash = {
        "A": 3, "B": 32, "C": 15, "D": 22, "E": 18, "F": 16,
        "G": 6, "H": 18, "I": 18, "J": 18, "K": 18, "L": 18, "M": 3
    }
    for col_l, w in col_widths_dash.items():
        ws_dash.column_dimensions[col_l].width = w

    # =========================================================================
    # PESTAÑA 1 (ACTIVA AL ABRIR): Registro y Control Mensual
    # =========================================================================
    ws_reg = wb.create_sheet(title="Registro y Control Mensual")
    ws_reg.views.sheetView[0].showGridLines = False
    ws_reg.row_dimensions[1].height = 14

    ws_reg.merge_cells("B2:L2")
    ws_reg["B2"] = "📝 REGISTRO Y AUDITORÍA MENSUAL DE CUENTAS — DIEGO & SOLEDAD"
    ws_reg["B2"].font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    ws_reg["B2"].fill = fill_title
    ws_reg["B2"].alignment = align_center
    ws_reg.row_dimensions[2].height = 36

    ws_reg.merge_cells("B3:L3")
    ws_reg["B3"] = "Pestaña activa al entrar: ingresen aquí las boletas pagadas del mes. Al lado ven el presupuesto real y el semáforo avisa si varió demasiado."
    ws_reg["B3"].font = Font(name="Calibri", size=9.5, italic=True, color="CBD5E1")
    ws_reg["B3"].fill = fill_subtitle
    ws_reg["B3"].alignment = align_center
    ws_reg.row_dimensions[3].height = 20

    # Fila 4: Barra de Control del Periodo
    ws_reg.row_dimensions[4].height = 28
    ws_reg.merge_cells("B4:C4")
    ws_reg["B4"] = "🗓️ MES EN AUDITORÍA:"
    ws_reg["B4"].font = Font(name="Calibri", size=9.5, bold=True, color=C_NAVY_DARK)
    ws_reg["B4"].fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
    ws_reg["B4"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_reg["B4"].border = border_cell
    ws_reg["C4"].border = border_cell

    ws_reg.merge_cells("D4:E4")
    ws_reg["D4"] = "Octubre 2026 (En Curso)"
    ws_reg["D4"].font = Font(name="Calibri", size=10.5, bold=True, color="713F12")
    ws_reg["D4"].fill = PatternFill(start_color="FEF08A", end_color="FEF08A", fill_type="solid")
    ws_reg["D4"].alignment = align_center
    b_month = Border(left=Side(style='medium', color="CA8A04"), right=Side(style='medium', color="CA8A04"), top=Side(style='medium', color="CA8A04"), bottom=Side(style='medium', color="CA8A04"))
    ws_reg["D4"].border = b_month
    ws_reg["E4"].border = b_month

    ws_reg.merge_cells("F4:G4")
    ws_reg["F4"] = "📅 FECHA ACTUALIZACIÓN:"
    ws_reg["F4"].font = Font(name="Calibri", size=9, bold=True, color=C_TEXT_MUTED)
    ws_reg["F4"].fill = fill_card
    ws_reg["F4"].alignment = align_right
    ws_reg["F4"].border = border_cell
    ws_reg["G4"].border = border_cell

    ws_reg["H4"] = "26/10/2026"
    ws_reg["H4"].font = Font(name="Calibri", size=9.5, bold=True, color=C_NAVY_DARK)
    ws_reg["H4"].fill = fill_card
    ws_reg["H4"].alignment = align_center
    ws_reg["H4"].border = border_cell

    ws_reg.merge_cells("I4:J4")
    ws_reg["I4"] = "🟢 Estado: Mes Abierto"
    ws_reg["I4"].font = Font(name="Calibri", size=9.5, bold=True, color=C_EMERALD)
    ws_reg["I4"].fill = PatternFill(start_color=C_EMERALD_LIGHT, end_color=C_EMERALD_LIGHT, fill_type="solid")
    ws_reg["I4"].alignment = align_center
    ws_reg["I4"].border = border_cell
    ws_reg["J4"].border = border_cell

    ws_reg.merge_cells("K4:L4")
    ws_reg["K4"] = "💡 Al terminar: duplica la hoja para archivar"
    ws_reg["K4"].font = Font(name="Calibri", size=8.5, italic=True, color=C_TEXT_MUTED)
    ws_reg["K4"].fill = fill_card
    ws_reg["K4"].alignment = align_center
    ws_reg["K4"].border = border_cell
    ws_reg["L4"].border = border_cell

    ws_reg.row_dimensions[5].height = 10

    # Tarjetas KPI de Auditoría (Filas 6 a 8)
    reg_kpis = [
        ("B", "C", "PRESUPUESTO META HOGAR", "='Dashboard Resumen'!D31", "Plan base mensual acordado", C_BLUE),
        ("D", "E", "✏️ REAL MES ACTIVO", "=G42", "Total boletas ingresadas", C_AMBER),
        ("F", "G", "DESVÍO NETO HOGAR", "=G42-F42", "Diferencia acumulada vs meta", "DC2626"),
        ("H", "I", "SEMÁFORO DEL MES", '=IF(G42=0,"⚪ Pendiente", IF((G42-F42)>25000,"🔴 Desvío Total Alto", IF((G42-F42)>10000,"🟡 Alerta Moderada", IF((G42-F42)<-10000,"💎 Superávit Hogar","🟢 En Presupuesto"))))', "Diagnóstico de variación", C_EMERALD),
        ("J", "L", "EXCEDENTE LIBRE FAMILIAR", "='Dashboard Resumen'!E31-(G42-F42)", "Capacidad de ahorro real del hogar", "0284C7"),
    ]

    ws_reg.row_dimensions[6].height = 20
    ws_reg.row_dimensions[7].height = 30
    ws_reg.row_dimensions[8].height = 18

    for c1, c2, title_txt, formula_val, sub_txt, color_txt in reg_kpis:
        ws_reg.merge_cells(f"{c1}6:{c2}6")
        c = ws_reg[f"{c1}6"]
        c.value = title_txt
        c.font = Font(name="Calibri", size=8.5, bold=True, color=color_txt)
        c.fill = fill_card
        c.alignment = align_center

        ws_reg.merge_cells(f"{c1}7:{c2}7")
        c = ws_reg[f"{c1}7"]
        c.value = formula_val
        is_text_kpi = (c1 == "H")
        c.font = Font(name="Calibri", size=13 if is_text_kpi else 16, bold=True, color=color_txt if is_text_kpi else C_NAVY_DARK)
        c.fill = fill_card
        c.alignment = align_center
        if not is_text_kpi:
            c.number_format = fmt_clp if c1 != "F" else fmt_diff_clp

        ws_reg.merge_cells(f"{c1}8:{c2}8")
        c = ws_reg[f"{c1}8"]
        c.value = sub_txt
        c.font = Font(name="Calibri", size=8, color=C_TEXT_MUTED)
        c.fill = fill_card
        c.alignment = align_center

        col_start = openpyxl.utils.column_index_from_string(c1)
        col_end = openpyxl.utils.column_index_from_string(c2)
        for r in range(6, 9):
            for col_i in range(col_start, col_end + 1):
                col_letter = get_column_letter(col_i)
                ws_reg[f"{col_letter}{r}"].border = border_card
                ws_reg[f"{col_letter}{r}"].fill = fill_card

    ws_reg.row_dimensions[9].height = 12

    # Tabla de Registro
    ws_reg.merge_cells("B10:L10")
    ws_reg["B10"] = "TABLA DE INGRESO MENSUAL: COMPARATIVA VS META Y SEMÁFORO DE VARIACIÓN"
    ws_reg["B10"].font = f_sec_header
    ws_reg["B10"].fill = fill_sec_general
    ws_reg["B10"].alignment = align_left_indent
    ws_reg.row_dimensions[10].height = 24
    for col_i in range(2, 13):
        ws_reg.cell(row=10, column=col_i).border = border_cell

    reg_headers = [
        ("B", "#", align_center),
        ("C", "Categoría", align_left),
        ("D", "Concepto / Servicio", align_left),
        ("E", "Resp.", align_center),
        ("F", "Presupuesto Meta", align_right),
        ("G", "✏️ Real Mes Activo", align_right),
        ("H", "Diferencia ($)", align_right),
        ("I", "Variación (%)", align_right),
        ("J", "Semáforo / Alerta", align_center),
        ("K", "Promedio 14 Meses", align_right),
        ("L", "Notas / Causa de Variación", align_left)
    ]

    fill_input_header = PatternFill(start_color="FEF08A", end_color="FEF08A", fill_type="solid")
    f_input_header = Font(name="Calibri", size=10, bold=True, color="713F12")

    for col_l, text, al in reg_headers:
        c = ws_reg[f"{col_l}11"]
        c.value = text
        if col_l == "G":
            c.font = f_input_header
            c.fill = fill_input_header
        else:
            c.font = f_col_header
            c.fill = fill_col_head
        c.alignment = al
        c.border = border_cell
    ws_reg.row_dimensions[11].height = 24

    items_registro = [
        # Diego Fijos (Filas 12 a 21)
        (12, 1, "Vivienda", "Crédito Hipotecario (Base en UF)", "Diego", 360000, 360181, 354730, "Alza gradual según valor UF"),
        (13, 2, "Vivienda Huasco", "Arriendo Habitación Huasco", "Diego", 95000, 95000, 95000, "Costo fijo mensual"),
        (14, 3, "Vivienda Huasco", "Servicios Huasco (Luz y Agua)", "Diego", 7000, 7000, 7000, "Promedio constante"),
        (15, 4, "Conectividad", "Internet + Planes Celular (Diego)", "Diego", 40000, 40000, 40000, "Fijo recurrente"),
        (16, 5, "Mascotas", "Comida Michis", "Diego", 42000, 42000, 42200, "Asumido por Diego (~$40k-$42k)"),
        (17, 6, "Mascotas", "Arena Sanitaria Michis", "Diego", 20000, 20000, 20163, "Compra mensual/bimestral"),
        (18, 7, "Streaming", "Netflix", "Diego", 10388, 10388, 10388, "Tarifa fija recurrente"),
        (19, 8, "Streaming", "Crunchyroll", "Diego", 6490, 6490, 6490, "Tarifa fija recurrente"),
        (20, 9, "Salud Cíclica", "Eutirox 137", "Diego", 10000, 10000, 10000, "Ajuste mensual medicamento"),
        (21, 10, "Salud Cíclica", "Rupatadina", "Diego", 10382, 10382, 10382, "Ajuste mensual medicamento"),

        # Diego Operaciones (Filas 22 a 25)
        (22, 11, "Operaciones", "Pasajes Interregionales (8 viajes)", "Diego", 231500, 231500, 231500, "Descuentos en pasajes"),
        (23, 12, "Operaciones", "Uber (Traslados y retenciones)", "Diego", 25000, 25000, 25000, "Margen PayU"),
        (24, 13, "Operaciones", "Metro Valparaíso (EFE)", "Diego", 10000, 10000, 10000, "Recarga mensual"),
        (25, 14, "Operaciones", "Snacks Turno (Galletas + Energéticas)", "Diego", 33500, 33500, 33500, "Consumo turno Huasco"),

        # Diego Bolsillo & Ahorro (Filas 26 y 27)
        (26, 15, "Bolsillo", "Asignación Semanal Mach ($35k x 4)", "Diego", 140000, 140000, 140000, "Ajustado a modo recuperación"),
        (27, 16, "Ahorro", "Fondo Emergencia Mercado Pago", "Diego", 130000, 130000, 130000, "Ahorro constante mensual"),

        # Diego Filas Reservadas (Filas 28 y 29)
        (28, 17, "Varios Diego", "[ + Escribir nuevo gasto Diego ]", "Diego", 0, 0, 0, "Fila libre para nuevo ítem"),
        (29, 18, "Varios Diego", "[ + Escribir nuevo gasto Diego ]", "Diego", 0, 0, 0, "Fila libre para nuevo ítem"),

        # Soledad Hogar Limache (Filas 31 a 37)
        (31, 19, "Hogar Limache", "Luz (CGE / Chilquinta)", "Soledad", 22500, 23762, 22220, "Promedio real histórico 14 meses"),
        (32, 20, "Hogar Limache", "Agua (Esval)", "Soledad", 7200, 7840, 7134, "Consumo estable (~$7.1k)"),
        (33, 21, "Hogar Limache", "Gas (Lipigas / Abastible)", "Soledad", 20500, 25500, 20114, "Invierno $25k-$30k / Verano $15k"),
        (34, 22, "Conectividad", "Plan Claro (Pareja)", "Soledad", 9500, 9600, 9372, "Tarifa plan móvil pareja"),
        (35, 23, "Hogar Limache", "Gasto Común Condominio", "Soledad", 52500, 56315, 52539, "Promedio histórico real"),
        (36, 24, "Alimentación", "Supermercado Hogar Limache", "Soledad", 125000, 120000, 127196, "Presupuesto asignado hogar"),
        (37, 25, "Hogar Limache", "Aseo Domiciliario (Cuota Municipal)", "Soledad", 4550, 4614, 4550, "Aporte mensual ($13.6k trimestral)"),

        # Soledad Compromisos (Fila 38)
        (38, 26, "Compromisos", "Tarjeta Smart Visa (Compromiso)", "Soledad", 50000, 50000, 45951, "Promedio real cuota mensual"),

        # Soledad Filas Reservadas (Filas 39 y 40)
        (39, 27, "Varios Soledad", "[ + Escribir nuevo gasto Soledad ]", "Soledad", 0, 0, 0, "Fila libre para nuevo ítem"),
        (40, 28, "Varios Soledad", "[ + Escribir nuevo gasto Soledad ]", "Soledad", 0, 0, 0, "Fila libre para nuevo ítem"),
    ]

    fill_input_cell = PatternFill(start_color="FEF9C3", end_color="FEF9C3", fill_type="solid")
    b_input_cell = Border(left=Side(style='medium', color="CA8A04"), right=Side(style='medium', color="CA8A04"), top=b_thin, bottom=b_thin)

    for r, num, cat, conc, resp, base_meta, default_actual, avg_14, obs in items_registro:
        ws_reg[f"B{r}"] = num
        ws_reg[f"C{r}"] = cat
        ws_reg[f"D{r}"] = conc
        ws_reg[f"E{r}"] = resp
        ws_reg[f"F{r}"] = base_meta if base_meta > 0 else ""
        ws_reg[f"G{r}"] = default_actual if default_actual > 0 else ""
        ws_reg[f"H{r}"] = f'=IF(OR(G{r}="",G{r}=0),"-", G{r}-IF(F{r}="",0,F{r}))'
        ws_reg[f"I{r}"] = f'=IF(OR(G{r}="",F{r}="",F{r}=0),"-", IFERROR((G{r}-F{r})/F{r}, 0))'
        ws_reg[f"J{r}"] = f'=IF(OR(G{r}="",G{r}=0),"-", IF(H{r}>15000,"🔴 Desvío Fuerte", IF(I{r}>0.08,"🟡 Alerta (+8%)", IF(H{r}<-5000,"💎 Ahorro","🟢 En Rango"))))'
        ws_reg[f"K{r}"] = avg_14 if avg_14 > 0 else ""
        ws_reg[f"L{r}"] = obs

        ws_reg.row_dimensions[r].height = 22
        is_spare = "[ +" in conc

        for col_l in ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]:
            c = ws_reg[f"{col_l}{r}"]
            c.font = Font(name="Calibri", size=9.5, italic=is_spare, color=C_TEXT_MUTED if is_spare else "1E293B")
            c.border = border_cell
            if col_l in ["F", "G", "K"]:
                c.number_format = fmt_clp
                c.alignment = align_right
            elif col_l == "H":
                c.number_format = fmt_diff_clp
                c.alignment = align_right
            elif col_l == "I":
                c.number_format = fmt_diff_pct
                c.alignment = align_right
            elif col_l in ["B", "E", "J"]:
                c.alignment = align_center
            else:
                c.alignment = align_left

        ws_reg[f"G{r}"].fill = fill_input_cell
        ws_reg[f"G{r}"].border = b_input_cell
        ws_reg[f"G{r}"].font = Font(name="Calibri", size=10, bold=True, color="1E293B")
        ws_reg[f"E{r}"].font = Font(name="Calibri", size=10, bold=True, color=C_BLUE if resp == "Diego" else C_PURPLE)

    # Subtotal Diego (Fila 30)
    ws_reg.merge_cells("B30:E30")
    ws_reg["B30"] = "SUBTOTAL DIEGO (Cuenta Fan + Tenpo + Mach + MP)"
    ws_reg["B30"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_reg["F30"] = "=SUM(F12:F29)"
    ws_reg["G30"] = "=SUM(G12:G29)"
    ws_reg["H30"] = "=G30-F30"
    ws_reg["I30"] = "=IFERROR((G30-F30)/F30, 0)"
    ws_reg["J30"] = '=IF(H30>20000,"🔴 Desvío Diego", IF(I30>0.05,"🟡 Alerta Diego","🟢 En Presupuesto"))'
    ws_reg["K30"] = "=SUM(K12:K29)"
    ws_reg["L30"] = "Compromisos asignados a Diego"

    ws_reg.row_dimensions[30].height = 24
    for col_l in ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]:
        c = ws_reg[f"{col_l}30"]
        c.font = f_bold
        c.fill = PatternFill(start_color=C_BLUE_LIGHT, end_color=C_BLUE_LIGHT, fill_type="solid")
        c.border = border_total
        if col_l in ["F", "G", "K"]:
            c.number_format = fmt_clp
            c.alignment = align_right
        elif col_l == "H":
            c.number_format = fmt_diff_clp
            c.alignment = align_right
        elif col_l == "I":
            c.number_format = fmt_diff_pct
            c.alignment = align_right
        elif col_l == "J":
            c.alignment = align_center

    # Subtotal Soledad (Fila 41)
    ws_reg.merge_cells("B41:E41")
    ws_reg["B41"] = "SUBTOTAL SOLEDAD (Hogar Limache + Tarjeta Smart)"
    ws_reg["B41"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_reg["F41"] = "=SUM(F31:F40)"
    ws_reg["G41"] = "=SUM(G31:G40)"
    ws_reg["H41"] = "=G41-F41"
    ws_reg["I41"] = "=IFERROR((G41-F41)/F41, 0)"
    ws_reg["J41"] = '=IF(H41>15000,"🔴 Desvío Soledad", IF(I41>0.05,"🟡 Alerta Soledad","🟢 En Presupuesto"))'
    ws_reg["K41"] = "=SUM(K31:K40)"
    ws_reg["L41"] = "Compromisos asignados a Soledad"

    ws_reg.row_dimensions[41].height = 24
    for col_l in ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]:
        c = ws_reg[f"{col_l}41"]
        c.font = f_bold
        c.fill = PatternFill(start_color=C_PURPLE_LIGHT, end_color=C_PURPLE_LIGHT, fill_type="solid")
        c.border = border_total
        if col_l in ["F", "G", "K"]:
            c.number_format = fmt_clp
            c.alignment = align_right
        elif col_l == "H":
            c.number_format = fmt_diff_clp
            c.alignment = align_right
        elif col_l == "I":
            c.number_format = fmt_diff_pct
            c.alignment = align_right
        elif col_l == "J":
            c.alignment = align_center

    # Gran Total Hogar (Fila 42)
    ws_reg.merge_cells("B42:E42")
    ws_reg["B42"] = "GRAN TOTAL CONSOLIDADO HOGAR"
    ws_reg["B42"].alignment = Alignment(horizontal="right", vertical="center", indent=1)
    ws_reg["F42"] = "=F30+F41"
    ws_reg["G42"] = "=G30+G41"
    ws_reg["H42"] = "=G42-F42"
    ws_reg["I42"] = "=IFERROR((G42-F42)/F42, 0)"
    ws_reg["J42"] = '=IF(H42>25000,"🔴 Desvío Total Alto", IF(H42>10000,"🟡 Alerta Moderada", IF(H42<-10000,"💎 Superávit Hogar","🟢 En Presupuesto")))'
    ws_reg["K42"] = "=K30+K41"
    ws_reg["L42"] = "Seguimiento integral mensual pareja"

    ws_reg.row_dimensions[42].height = 26
    for col_l in ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]:
        c = ws_reg[f"{col_l}42"]
        c.font = Font(name="Calibri", size=10, bold=True, color=C_NAVY_DARK)
        c.fill = fill_grand_total
        c.border = border_grand_total
        if col_l in ["F", "G", "K"]:
            c.number_format = fmt_clp
            c.alignment = align_right
        elif col_l == "H":
            c.number_format = fmt_diff_clp
            c.alignment = align_right
        elif col_l == "I":
            c.number_format = fmt_diff_pct
            c.alignment = align_right
        elif col_l == "J":
            c.alignment = align_center

    ws_reg.row_dimensions[43].height = 12

    # Guía Rápida para Diego y Soledad en Hoja 1
    ws_reg.merge_cells("B44:L44")
    ws_reg["B44"] = "💡 GUÍA FÁCIL: ¿CÓMO USAR Y AGREGAR NUEVOS GASTOS EN ESTA PLANILLA?"
    ws_reg["B44"].font = Font(name="Calibri", size=10, bold=True, color=C_BLUE)
    ws_reg["B44"].fill = PatternFill(start_color=C_BLUE_LIGHT, end_color=C_BLUE_LIGHT, fill_type="solid")
    ws_reg["B44"].alignment = align_left_indent
    ws_reg.row_dimensions[44].height = 22

    ws_reg.merge_cells("B45:L45")
    ws_reg["B45"] = "• Solo ingresen el monto en la columna amarilla (✏️ Real Mes Activo). No toquen otras columnas para no borrar fórmulas."
    ws_reg["B45"].font = Font(name="Calibri", size=9, color="334155")
    ws_reg["B45"].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    ws_reg["B45"].alignment = align_left_indent
    ws_reg.row_dimensions[45].height = 20

    ws_reg.merge_cells("B46:L46")
    ws_reg["B46"] = "• Para agregar un nuevo gasto: escriban directamente en las filas libres '[ + Escribir nuevo gasto... ]'. Ya están calculadas en los subtotales."
    ws_reg["B46"].font = Font(name="Calibri", size=9, color="334155")
    ws_reg["B46"].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    ws_reg["B46"].alignment = align_left_indent
    ws_reg.row_dimensions[46].height = 20

    for r_box in [44, 45, 46]:
        for col_i in range(2, 13):
            ws_reg.cell(row=r_box, column=col_i).border = border_cell

    ws_reg.row_dimensions[47].height = 14

    # Gráfico Real vs Meta Limpio
    bar_reg = BarChart()
    bar_reg.title = "Comparativa Mensual: Presupuesto Base vs Gasto Real Ingresado"
    bar_reg.title.text.font = Font(name="Calibri", size=11, bold=True, color=C_NAVY_DARK)
    bar_reg.style = 11
    bar_reg.y_axis.title = "Monto en CLP"
    bar_reg.x_axis.title = "Categoría de Análisis"
    data_reg = Reference(ws_reg, min_col=6, min_row=42, max_col=7, max_row=42)
    labels_reg = Reference(ws_reg, min_col=6, min_row=11, max_col=7, max_row=11)
    bar_reg.add_data(data_reg, from_rows=True, titles_from_data=False)
    bar_reg.set_categories(labels_reg)
    bar_reg.legend = None

    bar_reg.dataLabels = DataLabelList()
    bar_reg.dataLabels.showVal = True
    bar_reg.dataLabels.showCatName = False
    bar_reg.dataLabels.showSerName = False
    bar_reg.dataLabels.showLegendKey = False
    bar_reg.dataLabels.showPercent = False
    bar_reg.y_axis.scaling.max = 1800000
    bar_reg.width = 20
    bar_reg.height = 10.5
    ws_reg.add_chart(bar_reg, "C48")

    col_widths_reg = {
        "A": 3, "B": 4, "C": 16, "D": 32, "E": 12,
        "F": 18, "G": 18, "H": 16, "I": 14, "J": 18,
        "K": 18, "L": 28
    }
    for col_l, w in col_widths_reg.items():
        ws_reg.column_dimensions[col_l].width = w

    # =========================================================================
    # PESTAÑA 3: Historico 2024-2025
    # =========================================================================
    ws_hist = wb.create_sheet(title="Historico 2024-2025")
    ws_hist.views.sheetView[0].showGridLines = True
    ws_hist.row_dimensions[1].height = 14

    ws_hist.merge_cells("B2:U2")
    ws_hist["B2"] = "📈 HISTÓRICO REAL DE CUENTAS DEL HOGAR — 14 MESES (AGOSTO 2024 A SEPTIEMBRE 2025)"
    ws_hist["B2"].font = f_title
    ws_hist["B2"].fill = fill_title
    ws_hist["B2"].alignment = align_center
    ws_hist.row_dimensions[2].height = 36

    ws_hist.merge_cells("B3:U3")
    ws_hist["B3"] = "Base de datos empírica para calibrar presupuestos, detectar estacionalidad (invierno/verano) y monitorear alzas de UF e IPC."
    ws_hist["B3"].font = f_subtitle
    ws_hist["B3"].fill = fill_subtitle
    ws_hist["B3"].alignment = align_center
    ws_hist.row_dimensions[3].height = 20
    ws_hist.row_dimensions[4].height = 10

    real_col_headers = [
        "B", "C", "D", "E",
        "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S",
        "T", "U"
    ]
    col_names = [
        "#", "Categoría", "Concepto / Servicio", "Resp.",
        "Ago-24", "Sep-24", "Oct-24", "Nov-24", "Dic-24", "Ene-25", "Feb-25", "Mar-25", "Abr-25", "May-25", "Jun-25", "Jul-25", "Ago-25", "Sep-25",
        "Promedio Real", "Comportamiento / Estacionalidad"
    ]

    for col_l, text in zip(real_col_headers, col_names):
        c = ws_hist[f"{col_l}5"]
        c.value = text
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if col_l in ["B", "E"] else (align_right if col_l not in ["C", "D", "U"] else align_left)
    ws_hist.row_dimensions[5].height = 24

    hist_rows_data = [
        (6, 1, "Hogar Limache", "Luz (Chilquinta)", "Soledad", [53251, 22486, 12930, 14081, 12496, 12597, 16010, 15512, 18206, 17641, 23359, 40631, 28122, 23762], "Picos en invierno ($53k Ago-24, $40k Jul-25); Verano ~$12k-$16k"),
        (7, 2, "Hogar Limache", "Agua (Esval)", "Soledad", [7610, 7280, 6370, 6470, 6420, 6440, 7160, 8030, 7140, 8020, 7134, 6230, 7870, 7840], "Consumo muy parejo todo el año: entre $6.2k y $8.0k"),
        (8, 3, "Hogar Limache", "Gas (Balón / Red)", "Soledad", [28550, 19500, 19850, 15250, 15750, 15850, 15900, 11350, 21100, 20900, 20950, 20850, 30300, 25500], "Estacionalidad invernal marcada ($25k-$30k); Verano baja a $11k-$15k"),
        (9, 4, "Conectividad", "Plan Claro (Pareja)", "Soledad", [9150, 9150, 9208, 9208, 9329, 9329, 9329, 9429, 9434, 9434, 9537, 9539, 9537, 9600], "Ajuste suave por IPC; muy predecible"),
        (10, 5, "Hogar Limache", "Gasto Común Condominio", "Soledad", [47000, 51000, 52723, 49748, 51273, 52426, 58696, 54132, 46904, 53670, 53476, 53571, 54606, 56315], "Rango entre $47k y $58k; promedio consolidado $52.5k"),
        (11, 6, "Mascotas", "Comida Michis", "Diego", [40000, 40000, 0, 40000, 0, 46000, 0, 39900, 0, 40000, 40000, 0, 51700, 0], "Compras en sacos grandes (mes por medio); promedio mensual ~$42k"),
        (12, 7, "Mascotas", "Arena Sanitaria Michis", "Diego", [20000, 20000, 0, 20000, 28000, 20000, 0, 17900, 17900, 17990, 20000, 0, 20000, 20000], "Consumo mensual regular de ~$18k-$20k"),
        (13, 8, "Mascotas", "Vacunas Michis (Eventual)", "Diego", [45000, 45000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 57000], "Gastos médicos anuales (antirrábica + leucemia)"),
        (14, 9, "Vivienda", "Crédito Hipotecario (UF)", "Diego", [0, 0, 0, 346506, 348108, 350320, 352707, 354930, 356679, 357554, 358261, 357433, 359354, 360181], "Inició en $346k (Nov-24) y subió a $360k (Sep-25) por valor UF"),
        (15, 10, "Compromisos", "Tarjeta Smart Visa", "Soledad", [0, 0, 0, 0, 0, 0, 0, 54640, 0, 0, 23815, 52304, 48994, 50000], "Cuota mensual promedio real de ~$50k"),
        (16, 11, "Hogar Limache", "Aseo Domiciliario Municipal", "Soledad", [0, 0, 0, 0, 0, 0, 0, 0, 13600, 0, 13538, 0, 0, 13841], "Pago trimestral municipal (~$4.5k mensual prorrateado)"),
        (17, 12, "Educación / Otros", "Curso Waldorf / Proyector", "Ambos", [50000, 50000, 97000, 50000, 50000, 50000, 0, 0, 0, 0, 0, 0, 0, 0], "Compromisos temporales 2024-2025 ya finalizados o amortizados"),
        (18, 13, "Alimentación", "Supermercado Hogar Limache", "Soledad", [0, 0, 0, 0, 50000, 0, 0, 0, 126000, 153000, 109782, 0, 0, 0], "Registros puntuales; promedio mensual calibrado en $125k")
    ]

    for r, num, cat, conc, resp, vals, obs in hist_rows_data:
        ws_hist[f"B{r}"] = num
        ws_hist[f"C{r}"] = cat
        ws_hist[f"D{r}"] = conc
        ws_hist[f"E{r}"] = resp

        col_letters = ["F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S"]
        for c_let, v in zip(col_letters, vals):
            ws_hist[f"{c_let}{r}"] = v if v > 0 else ""

        ws_hist[f"T{r}"] = f"=AVERAGE(F{r}:S{r})"
        ws_hist[f"U{r}"] = obs
        ws_hist.row_dimensions[r].height = 21

        for col_i, col_l in enumerate(real_col_headers, start=2):
            c = ws_hist[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l in col_letters or col_l == "T":
                c.number_format = fmt_clp
                c.alignment = align_right
                if col_l == "T":
                    c.font = f_bold
            elif col_l in ["B", "E"]:
                c.alignment = align_center
                if col_l == "E":
                    c.font = Font(name="Calibri", size=10, bold=True, color=C_BLUE if resp == "Diego" else (C_PURPLE if resp == "Soledad" else C_NAVY_DARK))
            else:
                c.alignment = align_left

    # Total Histórico Mes a Mes (Fila 19)
    ws_hist.merge_cells("B19:E19")
    ws_hist["B19"] = "TOTAL CUENTAS REGISTRADAS DEL HOGAR"
    ws_hist["B19"].alignment = Alignment(horizontal="right", vertical="center", indent=1)

    for c_let in ["F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S"]:
        ws_hist[f"{c_let}19"] = f"=SUM({c_let}6:{c_let}18)"

    ws_hist["T19"] = "=AVERAGE(T6:T18)"
    ws_hist["U19"] = "Evolución histórica consolidada"

    ws_hist.row_dimensions[19].height = 26
    for col_l in real_col_headers:
        c = ws_hist[f"{col_l}19"]
        c.font = Font(name="Calibri", size=10, bold=True, color=C_NAVY_DARK)
        c.fill = fill_grand_total
        c.border = border_grand_total
        if col_l not in ["B", "C", "D", "E", "U"]:
            c.number_format = fmt_clp
            c.alignment = align_right

    ws_hist.row_dimensions[20].height = 14
    ws_hist.row_dimensions[21].height = 10

    # Gráfico Histórico Limpio
    bar_hist_14 = BarChart()
    bar_hist_14.title = "Evolución Real de Cuentas Pagadas del Hogar (14 Meses Históricos)"
    bar_hist_14.title.text.font = Font(name="Calibri", size=11, bold=True, color=C_NAVY_DARK)
    bar_hist_14.style = 11
    bar_hist_14.y_axis.title = "Total Cuentas Hogar (CLP)"
    bar_hist_14.x_axis.title = "Mes"
    data_h14 = Reference(ws_hist, min_col=6, min_row=19, max_col=19, max_row=19)
    labels_h14 = Reference(ws_hist, min_col=6, min_row=5, max_col=19, max_row=5)
    bar_hist_14.add_data(data_h14, from_rows=True, titles_from_data=False)
    bar_hist_14.set_categories(labels_h14)
    bar_hist_14.legend = None
    bar_hist_14.dataLabels = None
    bar_hist_14.width = 26
    bar_hist_14.height = 10.5
    bar_hist_14.y_axis.scaling.max = 950000
    ws_hist.add_chart(bar_hist_14, "C22")

    col_widths_h14 = {
        "A": 3, "B": 4, "C": 15, "D": 32, "E": 12,
        "F": 13, "G": 13, "H": 13, "I": 13, "J": 13, "K": 13, "L": 13,
        "M": 13, "N": 13, "O": 13, "P": 13, "Q": 13, "R": 13, "S": 13,
        "T": 16, "U": 34
    }
    for col_l, w in col_widths_h14.items():
        ws_hist.column_dimensions[col_l].width = w

    # =========================================================================
    # PESTAÑA 5: Simulador Crecimiento
    # =========================================================================
    ws_sim = wb.create_sheet(title="Simulador Crecimiento")
    ws_sim.views.sheetView[0].showGridLines = True
    ws_sim.row_dimensions[1].height = 14

    ws_sim.merge_cells("B2:H2")
    ws_sim["B2"] = "🚀 SIMULADOR DE ALZA DE RENTA & CRONOGRAMA DE BLINDAJE"
    ws_sim["B2"].font = f_title
    ws_sim["B2"].fill = fill_title
    ws_sim["B2"].alignment = align_center
    ws_sim.row_dimensions[2].height = 36

    ws_sim.merge_cells("B3:H3")
    ws_sim["B3"] = "Plan para la meta de $2.100.000 en Mercado Pago (3 meses de gastos) y optimización de futuros incrementos de sueldo."
    ws_sim["B3"].font = f_subtitle
    ws_sim["B3"].fill = fill_subtitle
    ws_sim["B3"].alignment = align_center
    ws_sim.row_dimensions[3].height = 20
    ws_sim.row_dimensions[4].height = 10

    ws_sim.merge_cells("B5:H5")
    ws_sim["B5"] = "CRONOGRAMA DE ACELERACIÓN DEL FONDO DE EMERGENCIA ($2.100.000)"
    ws_sim["B5"].font = f_sec_header
    ws_sim["B5"].fill = fill_sec_ahorro
    ws_sim["B5"].alignment = align_left_indent
    ws_sim.row_dimensions[5].height = 24

    sim_headers = ["Mes / Hito", "Aporte Diego (MP)", "Aporte Soledad (Opcional)", "Interés Diario (~6%)", "Total Ahorro Mes", "Saldo Acumulado", "% Meta Alcanzada"]
    for i, h in enumerate(sim_headers, start=2):
        col_l = get_column_letter(i)
        c = ws_sim[f"{col_l}6"]
        c.value = h
        c.font = f_col_header
        c.fill = fill_col_head
        c.border = border_cell
        c.alignment = align_center if i in [2, 8] else align_right
    ws_sim.row_dimensions[6].height = 22

    sim_schedule = [
        (7, "Mes 1 (Inicio)", 130000, 200000, 3000, "=C7+D7+E7", "=600000+F7", "=IFERROR(G7/2100000, 0)"),
        (8, "Mes 2", 130000, 200000, 4600, "=C8+D8+E8", "=G7+F8", "=IFERROR(G8/2100000, 0)"),
        (9, "Mes 3", 130000, 200000, 6300, "=C9+D9+E9", "=G8+F9", "=IFERROR(G9/2100000, 0)"),
        (10, "Mes 4 (Meta Cumplida)", 130000, 200000, 8000, "=C10+D10+E10", "=G9+F10", "=IFERROR(G10/2100000, 0)"),
        (11, "Mes 5 (Fondo Blindado)", 130000, 100000, 10500, "=C11+D11+E11", "=G10+F11", "=IFERROR(G11/2100000, 0)"),
    ]
    for r, hito, ad, aso, inte, tot_m, saldo, pct_m in sim_schedule:
        ws_sim[f"B{r}"] = hito
        ws_sim[f"C{r}"] = ad
        ws_sim[f"D{r}"] = aso
        ws_sim[f"E{r}"] = inte
        ws_sim[f"F{r}"] = tot_m
        ws_sim[f"G{r}"] = saldo
        ws_sim[f"H{r}"] = pct_m
        ws_sim.row_dimensions[r].height = 22
        for col_l in ["B", "C", "D", "E", "F", "G", "H"]:
            c = ws_sim[f"{col_l}{r}"]
            c.font = f_normal
            c.border = border_cell
            if col_l in ["C", "D", "E", "F", "G"]:
                c.number_format = fmt_clp
                c.alignment = align_right
                if col_l == "G":
                    c.font = f_bold
            elif col_l == "H":
                c.number_format = fmt_pct
                c.alignment = align_right
                c.font = f_bold
            else:
                c.alignment = align_left

    col_widths_sim = {
        "A": 3, "B": 24, "C": 18, "D": 22, "E": 18, "F": 18, "G": 20, "H": 18
    }
    for col_l, w in col_widths_sim.items():
        ws_sim.column_dimensions[col_l].width = w

    # =========================================================================
    # PESTAÑA 6: Guia de Uso (Con explicaciones para Soledad y Diego)
    # =========================================================================
    ws_guia = wb.create_sheet(title="Guia de Uso")
    ws_guia.views.sheetView[0].showGridLines = False
    ws_guia.row_dimensions[1].height = 14

    ws_guia.merge_cells("B2:G2")
    ws_guia["B2"] = "📘 GUÍA PASO A PASO: USO EN PC Y GOOGLE SHEETS DESDE EL CELULAR"
    ws_guia["B2"].font = f_title
    ws_guia["B2"].fill = fill_title
    ws_guia["B2"].alignment = align_center
    ws_guia.row_dimensions[2].height = 36

    ws_guia.merge_cells("B3:G3")
    ws_guia["B3"] = "Instrucciones claras y sin complicaciones para ingresar datos y entender cada número."
    ws_guia["B3"].font = f_subtitle
    ws_guia["B3"].fill = fill_subtitle
    ws_guia["B3"].alignment = align_center
    ws_guia.row_dimensions[3].height = 20

    guia_pasos = [
        (5, "1. ¿CÓMO INGRESAR LAS BOLETAS DEL MES?", [
            "Abre la primera pestaña 'Registro y Control Mensual'.",
            "SOLO debes escribir en la columna amarilla ('✏️ Real Mes Activo'). No toques las otras columnas.",
            "Si pagaron la Luz por $23.500, escribe 23500 en la fila de Luz.",
            "Si no tienen el valor de una boleta todavía, déjala en blanco. El sistema la marcará como pendiente."
        ]),
        (11, "2. ¿CÓMO ENTENDER LOS SEMÁFOROS Y DESVÍOS?", [
            "🟢 Verde ('En Rango'): La cuenta llegó normal, dentro de lo esperado. ¡Todo bien!",
            "🟡 Amarillo ('Alerta +8%'): La cuenta subió un poquito sobre el promedio (más de $5.000). Atentos.",
            "🔴 Rojo ('Desvío Fuerte'): Subió más de $15.000 (típico en la Luz en invierno). Revisar la boleta.",
            "💎 Diamante ('Ahorro'): Pagaron menos de lo presupuestado. ¡Quedó plata a favor del hogar!"
        ]),
        (17, "3. ¿QUÉ SIGNIFICA EL MARGEN DE CADA UNO?", [
            "Margen Libre de Soledad (~$590.000): Sueldo de Soledad ($875k) menos sus cuentas ($284k). Es su dinero libre mensual.",
            "Colchón de Diego ($35.000): Lo que le sobra a Diego tras pagar hipotecario, Huasco, michis, bolsillo y su ahorro de $130k.",
            "Superávit Familiar (~$626.000): La plata neta que queda libre en la casa entre los dos para proyectos o blindaje."
        ]),
        (22, "4. ACCESO DIRECTO DESDE EL CELULAR EN 1 TOQUE", [
            "Sube este archivo a Google Drive (drive.google.com) y guárdalo como Hoja de Cálculo de Google.",
            "Compártelo con Soledad con permiso de Editor.",
            "En Android: En la app Hojas de Cálculo, toca los 3 puntos (⋮) > 'Añadir a pantalla de inicio'.",
            "En iPhone: En Safari, toca Compartir > 'Agregar al inicio'. Tendrán un icono como una app en el celular."
        ])
    ]

    for start_r, title_p, lines_p in guia_pasos:
        ws_guia.merge_cells(f"B{start_r}:G{start_r}")
        ws_guia[f"B{start_r}"] = title_p
        ws_guia[f"B{start_r}"].font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        ws_guia[f"B{start_r}"].fill = fill_sec_general
        ws_guia[f"B{start_r}"].alignment = align_left_indent
        ws_guia.row_dimensions[start_r].height = 24

        curr_r = start_r + 1
        for lp in lines_p:
            ws_guia.merge_cells(f"B{curr_r}:G{curr_r}")
            ws_guia[f"B{curr_r}"] = "• " + lp
            ws_guia[f"B{curr_r}"].font = f_normal
            ws_guia[f"B{curr_r}"].alignment = align_left_indent
            ws_guia.row_dimensions[curr_r].height = 20
            curr_r += 1

    col_widths_guia = {
        "A": 3, "B": 5, "C": 20, "D": 20, "E": 20, "F": 20, "G": 25
    }
    for col_l, w in col_widths_guia.items():
        ws_guia.column_dimensions[col_l].width = w

    # Hoja activa inicial: 'Registro y Control Mensual'
        # Orden deseado de pestañas y hoja activa
    wb._sheets = [ws_reg, ws_dash, ws_hist, ws_ctrl, ws_sim, ws_guia]
    wb.active = ws_reg

    # Guardar en archivo
    saved = []
    fname_red = 'Plan_Financiero_Compartido_Diego_Soledad_Premium_Redisenado.xlsx'
    try:
        wb.save(fname_red)
        saved.append(fname_red)
        print("Guardado exitosamente:", fname_red)
    except Exception as e:
        print("Error en redisenado:", e)

    fname_main = 'Plan_Financiero_Compartido_Diego_Soledad_Premium.xlsx'
    try:
        wb.save(fname_main)
        saved.append(fname_main)
        print("Guardado exitosamente:", fname_main)
    except Exception as e:
        print("Aviso: main estaba bloqueado:", e)

    return saved

if __name__ == '__main__':
    build_perfect_workbook()
