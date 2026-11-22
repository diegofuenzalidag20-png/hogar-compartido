// Cuentas del presupuesto del mes (masterAuditItems), tabla de auditoría, KPIs y paneles de liquidez.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // AUDITORÍA & CONTROL DE DESVÍOS MENSUALES
    // Basado en los promedios reales de los 14 meses (Ago 2024 - Sep 2025)
    // AUDITORÍA & CONTROL DE DESVÍOS MENSUALES
    // Basado en los promedios reales de los 14 meses (Ago 2024 - Sep 2025)
    const masterAuditItems = [
      { id: 'item-1', name: 'Crédito Hipotecario (Aporte Fijo Diego)', cat: 'Vivienda Co-Aporte', resp: 'Diego', cuenta: 'Cuenta Fan', base: 365000, actual: 365000 },
      { id: 'item-1b', name: 'Crédito Hipotecario (Diferencial UF Soledad)', cat: 'Vivienda Co-Aporte', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 10000, actual: 10000 },
      { id: 'item-2', name: 'Arriendo Habitación Huasco', cat: 'Vivienda Huasco', resp: 'Diego', cuenta: 'Cuenta Fan', base: 95000, actual: 95000 },
      { id: 'item-3', name: 'Pagos Servicios Huasco (Luz y Agua)', cat: 'Vivienda Huasco', resp: 'Diego', cuenta: 'Tenpo', base: 11000, actual: 11000 },
      { id: 'item-5', name: 'Comida Michis (Promedio)', cat: 'Mascotas', resp: 'Diego', cuenta: 'Cuenta Fan', base: 42200, actual: 42200 },
      { id: 'item-6', name: 'Arena Sanitaria Michis', cat: 'Mascotas', resp: 'Diego', cuenta: 'Cuenta Fan', base: 20000, actual: 20000 },
      { id: 'item-7', name: 'Netflix', cat: 'Streaming', resp: 'Diego', cuenta: 'Cuenta Fan', base: 10700, actual: 10700 },
      { id: 'item-8', name: 'Crunchyroll', cat: 'Streaming', resp: 'Diego', cuenta: 'Cuenta Fan', base: 4990, actual: 4990 },
      { id: 'item-9', name: 'Eutirox 137', cat: 'Salud', resp: 'Diego', cuenta: 'Cuenta Fan', base: 9785, actual: 9785 },
      { id: 'item-10', name: 'Rupatadina', cat: 'Salud', resp: 'Diego', cuenta: 'Cuenta Fan', base: 14685, actual: 14685 },
      { id: 'item-11', name: 'Pasajes Bus Huasco (8 tramos)', cat: 'Operaciones', resp: 'Diego', cuenta: 'Tenpo', base: 140000, actual: 140000 },
      { id: 'item-12', name: 'Uber (Traslados y retenciones)', cat: 'Operaciones', resp: 'Diego', cuenta: 'Tenpo', base: 80000, actual: 80000 },
      { id: 'item-13', name: 'Metro Valparaíso (EFE)', cat: 'Operaciones', resp: 'Diego', cuenta: 'Tenpo', base: 10000, actual: 10000 },
      { id: 'item-14', name: 'Snacks y comidas de viaje Huasco', cat: 'Operaciones', resp: 'Diego', cuenta: 'Tenpo', base: 60000, actual: 60000 },
      { id: 'item-15', name: 'Bolsillo Mach ($35k x 4)', cat: 'Bolsillo', resp: 'Diego', cuenta: 'Mach', base: 140000, actual: 140000 },
      { id: 'item-16', name: 'Fondo Emergencia Mercado Pago', cat: 'Ahorro', resp: 'Diego', cuenta: 'Mercado Pago', base: 130000, actual: 130000 },
      { id: 'item-17', name: 'Luz Chilquinta Limache', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 23762, actual: 23762 },
      { id: 'item-18', name: 'Agua Esval Limache', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 7840, actual: 7840 },
      { id: 'item-19', name: 'Gas Balón/Red Limache', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 25500, actual: 25500 },
      { id: 'item-20', name: 'Plan Claro Soledad', cat: 'Conectividad', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 9600, actual: 9600 },
      { id: 'item-20b', name: 'Planes Entel', cat: 'Conectividad', resp: 'Diego', cuenta: 'Cuenta Fan', base: 15000, actual: 15000 },
      { id: 'item-20c', name: 'Internet Hogar', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 22000, actual: 22000 },
      { id: 'item-21', name: 'Gasto Común Condominio', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 56315, actual: 56315 },
      { id: 'item-22', name: 'Supermercado Hogar Limache', cat: 'Alimentación', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 120000, actual: 120000 },
      { id: 'item-32', name: 'Mantención Cuenta Corriente BCI (0,15 UF)', cat: 'Mantención Cuenta Corriente BCI', resp: 'Diego', cuenta: 'BCI Cuenta Corriente', base: 6197, actual: 0 },
      { id: 'item-33', name: 'Administración Tarjeta de Crédito BCI (0,17 UF)', cat: 'Administración Tarjeta de Crédito BCI', resp: 'Diego', cuenta: 'BCI Cuenta Corriente', base: 7024, actual: 0 },
      { id: 'item-23', name: 'Tarjeta Smart Visa (Compromiso)', cat: 'Compromisos / Crédito', resp: 'Soledad', cuenta: 'Tarjeta Smart Visa', base: 50000, actual: 50000 },
      { id: 'item-24', name: 'Aseo Domiciliario (Cuota Trimestral)', cat: 'Contribuciones', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 13841, actual: 13841 },
      { id: 'item-26', name: 'Vacunas / Salud Michis', cat: 'Mascotas', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 45000, actual: 45000 }
    ];

    let currentAuditItems = JSON.parse(JSON.stringify(masterAuditItems));

    // Los gastos sin boleta conocida antes se guardaban también como presupuesto
    function quitarGastosDelPresupuesto(items, itemsManuales) {
      const manuales = new Set((itemsManuales || []).map(it => it.id));
      items.forEach(it => {
        if (it.isCustom && !it.fromQuickBill && !manuales.has(it.id)) {
          it.base = 0;
          it.fromQuickBill = true;
        }
      });
    }

    function loadCurrentMonthAudit() {
      const selectEl = document.getElementById('audit-month-select');
      const month = selectEl ? selectEl.value : 'Oct-26';
      const saved = localStorage.getItem(`audit_${month}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentAuditItems = parsed;
          quitarGastosDelPresupuesto(currentAuditItems, leerJSON('custom_audit_items', []));
          }
        } catch(e) {}
      }
    }

    function renderAuditTable() {
      sincronizarRealDesdeGastos();
      if (typeof renderAnalisisMesActual === 'function' && document.getElementById('tab-mes-actual')?.classList.contains('active')) {
        renderAnalisisMesActual();
      }
      const tbody = document.getElementById('audit-tbody');
      if (tbody) tbody.innerHTML = '';

      let totalBase = 0;
      let totalReal = 0;

      currentAuditItems.forEach((item) => {
        if (!esAhorroPropio(item)) {
          totalBase += item.base;
          totalReal += item.actual;
        }

        const diff = item.actual - item.base;
        const pct = item.base > 0 ? (diff / item.base) * 100 : 0;

        let badgeHtml = '';
        if (diff > 12000 || pct > 15) {
          badgeHtml = '<span class="badge badge-rose">🔴 Desvío Fuerte</span>';
        } else if (diff > 4000 || pct > 8) {
          badgeHtml = '<span class="badge badge-amber">🟡 Alerta (+8%)</span>';
        } else if (diff < -4000) {
          badgeHtml = '<span class="badge badge-emerald">💎 Ahorro</span>';
        } else {
          badgeHtml = '<span class="badge badge-blue">🟢 En Rango</span>';
        }

        const respBadge = item.resp === 'Diego'
          ? '<span style="font-weight:700; color:var(--accent-diego);">Diego</span> <small style="color:var(--text-dim);">(' + escapeHtml(item.cuenta) + ')</small>'
          : '<span style="font-weight:700; color:var(--accent-soledad);">Soledad</span> <small style="color:var(--text-dim);">(' + escapeHtml(item.cuenta) + ')</small>';

        const diffClass = diff > 0 ? 'style="color:#F43F5E; font-weight:700;"' : (diff < 0 ? 'style="color:#10B981; font-weight:700;"' : 'style="color:var(--text-muted);"');

        const deleteBtn = item.isCustom
          ? ` <button type="button" class="btn-borrar-item" style="background:transparent; border:none; color:var(--accent-rose); cursor:pointer; font-size:0.85rem;" title="Eliminar ítem">🗑️</button>`
          : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong>${escapeHtml(item.name)}</strong>${deleteBtn}
            <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(item.cat)}</div>
          </td>
          <td style="text-align:center;">${respBadge}</td>
          <td style="text-align:right; font-weight:600; color:var(--text-muted);">${formatCLP(item.base)}</td>
          <td style="text-align:right;">
            <input type="number" class="input-real" value="${Number(item.actual) || 0}">
          </td>
          <td style="text-align:right;" ${diffClass}>
            ${diff > 0 ? '+' : ''}${formatCLP(diff)} <small>(${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)</small>
          </td>
          <td style="text-align:center;">${badgeHtml}</td>
        `;
        // Listeners directos: el id viene de los datos y no debe armarse como código
        tr.querySelector('.input-real').oninput = (e) => updateAuditItem(item.id, e.target.value);
        tr.querySelector('.btn-borrar-item')?.addEventListener('click', () => deleteAuditItem(item.id));
        if (tbody) tbody.appendChild(tr);
      });

      // Update Audit KPIs
      const netDiff = totalReal - totalBase;
      const householdIncome = userProfile.diegoSalary + userProfile.soledadSalary;
      const superavitReal = householdIncome - totalReal;

      document.getElementById('audit-kpi-base').textContent = formatCLP(totalBase);
      const subMeta = document.getElementById('audit-kpi-base-sub');
      if (subMeta) subMeta.textContent = `Gastos del mes · ahorro y bolsillo Mach aparte: ${formatCLP(ahorroDelMes())}`;
      document.getElementById('audit-kpi-real').textContent = formatCLP(totalReal);
      document.getElementById('audit-kpi-diff').textContent = (netDiff > 0 ? '+' : '') + formatCLP(netDiff);
      document.getElementById('audit-kpi-superavit').textContent = formatCLP(superavitReal);

      // Paneles personales: porcentaje usado de la plata de todas las cuentas de cada uno
      [['Soledad', 'sole'], ['Diego', 'diego']].forEach(([owner, k]) => {
        const liq = getLiquidezPersona(owner);
        const pctEl = document.getElementById(`${k}LiqPct`);
        const bar = document.getElementById(`${k}LiqBar`);
        const barra = document.getElementById(`${k}LiqBarra`);
        if (pctEl) pctEl.textContent = `${liq.pct}%`;
        if (barra) barra.setAttribute('aria-valuenow', String(liq.pct));
        if (bar) {
          bar.style.width = Math.min(100, Math.max(0, liq.pct)) + '%';
          bar.style.background = liq.pct >= 90 ? '#F43F5E' : liq.pct >= 70 ? '#F59E0B' : '';
        }
      });

      // Renderizar Checklist
      renderChecklist();

      const diffSub = document.getElementById('audit-kpi-diff-sub');
      const diffCard = document.getElementById('audit-card-diff');
      if (netDiff > 25000) {
        diffSub.textContent = '⚠️ Alerta: Desvío alto sobre presupuesto';
        diffCard.className = 'kpi-card rose';
      } else if (netDiff > 5000) {
        diffSub.textContent = 'Variación moderada sobre la meta';
        diffCard.className = 'kpi-card amber';
      } else if (netDiff < -5000) {
        diffSub.textContent = '¡Ahorro superávit del mes!';
        diffCard.className = 'kpi-card emerald';
      } else {
        diffSub.textContent = 'En rango óptimo presupuestado';
        diffCard.className = 'kpi-card blue';
      }
      // La meta y los fijos pendientes salen del presupuesto: la proyección de fin de mes se recalcula con él
      if (typeof renderProyeccionMes === 'function') renderProyeccionMes();
    }

    function updateAuditItem(id, value) {
      const val = parseInt(value, 10) || 0;
      const item = currentAuditItems.find(it => it.id === id);
      if (item) {
        item.actual = val;
        const month = document.getElementById('audit-month-select')?.value || '2026-10';
        localStorage.setItem(`audit_${month}`, JSON.stringify(currentAuditItems));
        renderAuditTable();
        triggerAutoSyncToCloud();
      }
    }

    function saveAuditMonth() {
      const month = document.getElementById('audit-month-select').value;
      localStorage.setItem(`audit_${month}`, JSON.stringify(currentAuditItems));
      triggerAutoSyncToCloud(true);
      showToast(`¡Cierre de mes ${month} guardado y sincronizado en la nube!`);
    }


    // PRESETS HISTÓRICOS 2024-2025 CON CRITERIO DE MES DE PAGO REAL (SHIFT +1 MES)
    const historicalMonthlyAuditPresets = {
      "Sep-24": {
            "Luz Chilquinta Limache": 53251,
            "Agua Esval Limache": 7610,
            "Gas Balón/Red Limache": 28550,
            "Plan Claro Pareja": 9150,
            "Gasto Común Condominio": 47000,
            "Comida Michis (Promedio)": 40000,
            "Arena Sanitaria Michis": 20000,
            "Curso Waldorf Limache": 50000,
            "Vacunas / Salud Michis": 45000
      },
      "Oct-24": {
            "Luz Chilquinta Limache": 22486,
            "Agua Esval Limache": 7280,
            "Gas Balón/Red Limache": 19500,
            "Plan Claro Pareja": 9150,
            "Gasto Común Condominio": 51000,
            "Comida Michis (Promedio)": 40000,
            "Arena Sanitaria Michis": 20000,
            "Curso Waldorf Limache": 50000,
            "Vacunas / Salud Michis": 45000
      },
      "Nov-24": {
            "Luz Chilquinta Limache": 12930,
            "Agua Esval Limache": 6370,
            "Gas Balón/Red Limache": 19850,
            "Plan Claro Pareja": 9208,
            "Gasto Común Condominio": 52723,
            "Curso Waldorf Limache": 50000,
            "Proyector / Otros": 47000
      },
      "Dic-24": {
            "Luz Chilquinta Limache": 14081,
            "Agua Esval Limache": 6470,
            "Gas Balón/Red Limache": 15250,
            "Plan Claro Pareja": 9208,
            "Gasto Común Condominio": 49748,
            "Comida Michis (Promedio)": 40000,
            "Arena Sanitaria Michis": 20000,
            "Curso Waldorf Limache": 50000,
            "Crédito Hipotecario (Aporte Fijo Diego)": 346506
      },
      "Ene-25": {
            "Luz Chilquinta Limache": 12496,
            "Agua Esval Limache": 6420,
            "Gas Balón/Red Limache": 15750,
            "Plan Claro Pareja": 9329,
            "Gasto Común Condominio": 51273,
            "Arena Sanitaria Michis": 28000,
            "Curso Waldorf Limache": 50000,
            "Proyector / Otros": 50000,
            "Crédito Hipotecario (Aporte Fijo Diego)": 348108
      },
      "Feb-25": {
            "Luz Chilquinta Limache": 12597,
            "Agua Esval Limache": 6440,
            "Gas Balón/Red Limache": 15850,
            "Plan Claro Pareja": 9329,
            "Gasto Común Condominio": 52426,
            "Comida Michis (Promedio)": 46000,
            "Arena Sanitaria Michis": 20000,
            "Proyector / Otros": 50000,
            "Crédito Hipotecario (Aporte Fijo Diego)": 350320
      },
      "Mar-25": {
            "Luz Chilquinta Limache": 16010,
            "Agua Esval Limache": 7160,
            "Gas Balón/Red Limache": 15900,
            "Plan Claro Pareja": 9329,
            "Gasto Común Condominio": 58696,
            "Crédito Hipotecario (Aporte Fijo Diego)": 352707
      },
      "Abr-25": {
            "Luz Chilquinta Limache": 15512,
            "Agua Esval Limache": 8030,
            "Gas Balón/Red Limache": 11350,
            "Plan Claro Pareja": 9429,
            "Gasto Común Condominio": 54132,
            "Comida Michis (Promedio)": 39900,
            "Arena Sanitaria Michis": 17900,
            "Tarjeta Smart Visa (Compromiso)": 54640,
            "Crédito Hipotecario (Aporte Fijo Diego)": 354930
      },
      "May-25": {
            "Luz Chilquinta Limache": 18206,
            "Agua Esval Limache": 7140,
            "Gas Balón/Red Limache": 21100,
            "Plan Claro Pareja": 9434,
            "Gasto Común Condominio": 46904,
            "Arena Sanitaria Michis": 17900,
            "Supermercado Hogar Limache": 126000,
            "Aseo Domiciliario (Cuota Trimestral)": 13600,
            "Crédito Hipotecario (Aporte Fijo Diego)": 356679
      },
      "Jun-25": {
            "Luz Chilquinta Limache": 17641,
            "Agua Esval Limache": 8020,
            "Gas Balón/Red Limache": 20900,
            "Plan Claro Pareja": 9434,
            "Gasto Común Condominio": 53670,
            "Comida Michis (Promedio)": 40000,
            "Arena Sanitaria Michis": 17990,
            "Supermercado Hogar Limache": 153000,
            "Crédito Hipotecario (Aporte Fijo Diego)": 357554
      },
      "Jul-25": {
            "Luz Chilquinta Limache": 23359,
            "Agua Esval Limache": 7134,
            "Gas Balón/Red Limache": 20950,
            "Plan Claro Pareja": 9537,
            "Gasto Común Condominio": 53476,
            "Aseo Domiciliario (Cuota Trimestral)": 13538,
            "Comida Michis (Promedio)": 40000,
            "Arena Sanitaria Michis": 20000,
            "Supermercado Hogar Limache": 109782,
            "Tarjeta Smart Visa (Compromiso)": 23815,
            "Crédito Hipotecario (Aporte Fijo Diego)": 358261
      },
      "Ago-25": {
            "Luz Chilquinta Limache": 40631,
            "Agua Esval Limache": 6230,
            "Gas Balón/Red Limache": 20850,
            "Plan Claro Pareja": 9539,
            "Gasto Común Condominio": 53571,
            "Tarjeta Smart Visa (Compromiso)": 52304,
            "Crédito Hipotecario (Aporte Fijo Diego)": 357433
      },
      "Sep-25": {
            "Luz Chilquinta Limache": 28122,
            "Agua Esval Limache": 7870,
            "Gas Balón/Red Limache": 30300,
            "Plan Claro Pareja": 9537,
            "Gasto Común Condominio": 54606,
            "Comida Michis (Promedio)": 51700,
            "Arena Sanitaria Michis": 20000,
            "Tarjeta Smart Visa (Compromiso)": 48994,
            "Crédito Hipotecario (Aporte Fijo Diego)": 359354
      },      "Oct-25": {
        "Luz Chilquinta Limache": 22907,
        "Agua Esval Limache": 6920,
        "Gas Balón/Red Limache": 25450,
        "Plan Claro Pareja": 9600,
        "Gasto Común Condominio": 52365,
        "Comida Michis (Promedio)": 25000,
        "Crédito Hipotecario (Aporte Fijo Diego)": 361131,
        "Tarjeta Smart Visa (Compromiso)": 50000
      },
      "Nov-25": {
        "Luz Chilquinta Limache": 17326,
        "Agua Esval Limache": 6030,
        "Gas Balón/Red Limache": 20700,
        "Plan Claro Pareja": 9600,
        "Gasto Común Condominio": 54647,
        "Arena Sanitaria Michis": 21000,
        "Crédito Hipotecario (Aporte Fijo Diego)": 361537,
        "Tarjeta Smart Visa (Compromiso)": 151336
      },
      "Dic-25": {
        "Luz Chilquinta Limache": 17031,
        "Agua Esval Limache": 6880,
        "Gas Balón/Red Limache": 20650,
        "Plan Claro Pareja": 9670,
        "Gasto Común Condominio": 53854,
        "Comida Michis (Promedio)": 60000,
        "Arena Sanitaria Michis": 21400,
        "Crédito Hipotecario (Aporte Fijo Diego)": 362386,
        "Tarjeta Smart Visa (Compromiso)": 62891,
        "Primer pago del comedor": 128567
      },
      "Ene-26": {
        "Luz Chilquinta Limache": 17531,
        "Agua Esval Limache": 5970,
        "Gas Balón/Red Limache": 11050,
        "Plan Claro Pareja": 9650,
        "Gasto Común Condominio": 53553,
        "Vacunas / Salud Michis": 15000,
        "Médico Sía": 30000,
        "Arena Sanitaria Michis": 23000,
        "Crédito Hipotecario (Aporte Fijo Diego)": 362044,
        "Tarjeta Smart Visa (Compromiso)": 68921,
        "Segundo pago del comedor": 128567,
        "Primer pago curso de conducir": 21700
      },
      "Feb-26": {
        "Luz Chilquinta Limache": 18196,
        "Agua Esval Limache": 5980,
        "Gas Balón/Red Limache": 20500,
        "Plan Claro Pareja": 9650,
        "Gasto Común Condominio": 52189,
        "Comida Michis (Promedio)": 40000,
        "Crédito Hipotecario (Aporte Fijo Diego)": 362785,
        "Tarjeta Smart Visa (Compromiso)": 80000,
        "Tercer pago del comedor": 128567,
        "Segundo pago curso de conducir": 21700
      },
      "Mar-26": {
        "Luz Chilquinta Limache": 17600,
        "Agua Esval Limache": 6960,
        "Gas Balón/Red Limache": 15600,
        "Plan Claro Pareja": 9696,
        "Gasto Común Condominio": 55858,
        "Vacunas / Salud Michis": 19000,
        "Comida Michis (Promedio)": 40000,
        "Arena Sanitaria Michis": 29000,
        "Supermercado Hogar Limache": 164000,
        "Crédito Hipotecario (Aporte Fijo Diego)": 363277,
        "Tarjeta Smart Visa (Compromiso)": 40000,
        "Tercer pago curso de conducir": 21700
      },
      "Abr-26": {
        "Luz Chilquinta Limache": 18185,
        "Agua Esval Limache": 15414,
        "Gas Balón/Red Limache": 21000,
        "Plan Claro Pareja": 9696,
        "Gasto Común Condominio": 53844,
        "Comida Michis (Promedio)": 78000,
        "Arena Sanitaria Michis": 5000,
        "Crédito Hipotecario (Aporte Fijo Diego)": 365790,
        "Tarjeta Smart Visa (Compromiso)": 77486,
        "Cuarto pago curso de conducir": 22000
      },
      "May-26": {
        "Luz Chilquinta Limache": 36223,
        "Agua Esval Limache": 0,
        "Gas Balón/Red Limache": 27050,
        "Plan Claro Pareja": 9696,
        "Gasto Común Condominio": 52254,
        "Vacunas / Salud Michis": 55000,
        "Comida Michis (Promedio)": 42900,
        "Arena Sanitaria Michis": 29400,
        "Crédito Hipotecario (Aporte Fijo Diego)": 370390,
        "Tarjeta Smart Visa (Compromiso)": 92146,
        "Quinto pago curso de conducir": 22000
      },
      "Jun-26": {
        "Luz Chilquinta Limache": 49690,
        "Agua Esval Limache": 5320,
        "Gas Balón/Red Limache": 17300,
        "Plan Claro Pareja": 9914,
        "Gasto Común Condominio": 55022,
        "Comida Michis (Promedio)": 20000,
        "Crédito Hipotecario (Aporte Fijo Diego)": 372021,
        "Tarjeta Smart Visa (Compromiso)": 147213,
        "Aseo Domiciliario (Cuota Trimestral)": 28536,
        "Sexto pago curso de conducir": 22000
      },
      "Jul-26": {
        "Luz Chilquinta Limache": 54618,
        "Agua Esval Limache": 8490,
        "Gas Balón/Red Limache": 27800,
        "Plan Claro Pareja": 9914,
        "Gasto Común Condominio": 49957,
        "Comida Michis (Promedio)": 42000,
        "Arena Sanitaria Michis": 24900,
        "Supermercado Hogar Limache": 119800,
        "Crédito Hipotecario (Aporte Fijo Diego)": 372317,
        "Tarjeta Smart Visa (Compromiso)": 100000
      },
      "Ago-26": {
        "Luz Chilquinta Limache": 27604,
        "Agua Esval Limache": 7580,
        "Gas Balón/Red Limache": 27600,
        "Plan Claro Pareja": 9914,
        "Gasto Común Condominio": 52597,
        "Arena Sanitaria Michis": 23200,
        "Crédito Hipotecario (Aporte Fijo Diego)": 372558,
        "Tarjeta Smart Visa (Compromiso)": 110000
      },
      "Sep-26": {
        "Luz Chilquinta Limache": 17075,
        "Agua Esval Limache": 7460,
        "Gas Balón/Red Limache": 22200,
        "Plan Claro Pareja": 9938,
        "Gasto Común Condominio": 53728,
        "Comida Michis (Promedio)": 42900,
        "Crédito Hipotecario (Aporte Fijo Diego)": 374199,
        "Tarjeta Smart Visa (Compromiso)": 110000
      }
    };

    function buildAuditItemsFromPreset(monthCode) {
      const preset = historicalMonthlyAuditPresets[monthCode];
      if (!preset) return JSON.parse(JSON.stringify(masterAuditItems));

      const items = JSON.parse(JSON.stringify(masterAuditItems));
      const matchedKeys = new Set();

      items.forEach(it => {
        // Buscar coincidencia en el preset
        const matchedKey = Object.keys(preset).find(k => 
          it.name.toLowerCase().includes(k.toLowerCase()) || 
          k.toLowerCase().includes(it.name.toLowerCase()) ||
          (it.name.includes('Luz') && k.includes('Luz')) ||
          (it.name.includes('Agua') && k.includes('Agua')) ||
          (it.name.includes('Gas') && k.includes('Gas')) ||
          (it.name.includes('Claro') && k.includes('Claro')) ||
          (it.name.includes('Gasto Común') && k.includes('Gasto Común')) ||
          (it.name.includes('Hipotecario') && k.includes('Hipotecario')) ||
          (it.name.includes('Smart Visa') && k.includes('Smart Visa')) ||
          (it.name.includes('Supermercado') && k.includes('Supermercado')) ||
          (it.name.includes('Aseo') && k.includes('Aseo')) ||
          (it.name.includes('Waldorf') && k.includes('Waldorf')) ||
          (it.name.includes('Comida Michis') && k.includes('Comida Michis')) ||
          (it.name.includes('Arena Sanitaria') && k.includes('Arena Sanitaria')) ||
          (it.name.includes('Vacunas') && k.includes('Vacunas'))
        );

        if (matchedKey && preset[matchedKey] !== undefined) {
          it.actual = preset[matchedKey];
          matchedKeys.add(matchedKey);
        } else {
          // Si es cuenta variable de hogar Limache o Michis y no se pagó ese mes, es $0
          if (it.cat.includes('Hogar') || it.name.includes('Smart Visa') || it.name.includes('Supermercado') || it.name.includes('Waldorf') || it.name.includes('Vacunas')) {
            it.actual = 0;
          }
        }
      });

      // Agregar conceptos extras únicos de ese mes (ej: Comedor, Curso Conducir, Médico Sía)
      Object.keys(preset).forEach(k => {
        if (!matchedKeys.has(k) && preset[k] > 0) {
          let cat = 'Compromisos';
          let resp = 'Soledad';
          if (k.toLowerCase().includes('médico') || k.toLowerCase().includes('salud')) cat = 'Salud';
          if (k.toLowerCase().includes('conducir')) { cat = 'Compromisos'; resp = 'Diego'; }
          if (k.toLowerCase().includes('comedor')) { cat = 'Hogar Limache'; resp = 'Soledad'; }

          items.push({
            id: 'preset-extra-' + k.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: k,
            cat: cat,
            resp: resp,
            cuenta: 'Chequera BancoEstado',
            base: preset[k],
            actual: preset[k],
            isCustom: true
          });
        }
      });

      return items;
    }

    function onAuditMonthChange() {
      const month = document.getElementById('audit-month-select').value;
      const selectEl = document.getElementById('audit-month-select');
      const monthText = selectEl ? selectEl.options[selectEl.selectedIndex]?.text : month;

      const saved = localStorage.getItem(`audit_${month}`);
      if (saved) {
        currentAuditItems = JSON.parse(saved);
        showToast(`🗓️ Cargado cierre guardado de ${monthText}`);
      } else if (historicalMonthlyAuditPresets[month]) {
        currentAuditItems = buildAuditItemsFromPreset(month);
        showToast(`🗓️ Cargado registro histórico real de ${monthText}`);
      } else {
        currentAuditItems = JSON.parse(JSON.stringify(masterAuditItems));
        showToast(`🗓️ Cargado presupuesto base de ${monthText}`);
      }
      renderAuditTable();
      if (typeof syncAllGlassSelects === 'function') syncAllGlassSelects();
    }


    function copyWhatsAppSummary() {
      const month = document.getElementById('audit-month-select').options[document.getElementById('audit-month-select').selectedIndex].text;
      let totalBase = 0;
      let totalReal = 0;
      let warnings = [];

      currentAuditItems.forEach(item => {
        if (!esAhorroPropio(item)) {
          totalBase += item.base;
          totalReal += item.actual;
        }
        const diff = item.actual - item.base;
        const pct = item.base > 0 ? (diff / item.base) * 100 : 0;
        if (diff > 5000 || pct > 10) {
          warnings.push(`• ${item.name} (${item.resp}): ${formatCLP(item.actual)} (+${formatCLP(diff)} | +${pct.toFixed(0)}%)`);
        }
      });

      const netDiff = totalReal - totalBase;
      const superavit = (userProfile.diegoSalary + userProfile.soledadSalary) - totalReal;

      let text = `📊 *CIERRE MENSUAL — HOGAR DIEGO & SOLEDAD*\n`;
      text += `🗓️ *Periodo:* ${month}\n\n`;
      text += `🎯 *Presupuesto Meta:* ${formatCLP(totalBase)}\n`;
      text += `💵 *Gasto Real Total:* ${formatCLP(totalReal)}\n`;
      text += `⚖️ *Diferencia Neta:* ${netDiff >= 0 ? '+' : ''}${formatCLP(netDiff)}\n`;
      text += `💎 *Superávit Libre Familiar:* ${formatCLP(superavit)}\n\n`;

      if (warnings.length > 0) {
        text += `⚠️ *Cuentas con variaciones a revisar:*\n${warnings.join('\n')}\n\n`;
      } else {
        text += `✅ *¡Todas las cuentas dentro del rango acordado!*\n\n`;
      }
      text += `✨ _Generado desde el Panel Financiero de Pareja_`;

      navigator.clipboard.writeText(text).then(() => {
        showToast('📲 ¡Resumen copiado! Listo para pegar en WhatsApp');
      }).catch(() => {
        showToast('Resumen generado');
      });
    }
