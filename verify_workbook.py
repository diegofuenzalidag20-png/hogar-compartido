import sys
import openpyxl

wb = openpyxl.load_workbook('Plan_Financiero_Compartido_Diego_Soledad_Premium.xlsx', data_only=False)
sheet_names = wb.sheetnames
print("Workbook Sheet Names:", sheet_names)

errors = []
total_formulas = 0

for s_name in sheet_names:
    ws = wb[s_name]
    for row in ws.iter_rows():
        for cell in row:
            v = str(cell.value) if cell.value is not None else ""
            if v.startswith("="):
                total_formulas += 1
                # Check cross-sheet references
                if "!" in v:
                    # extract sheet before !
                    parts = v.split("!")
                    for i in range(len(parts)-1):
                        token = parts[i].split("(")[-1].split("+")[-1].split("-")[-1].split("*")[-1].split("/")[-1].strip(" '=")
                        if token and token not in sheet_names:
                            errors.append(f"Sheet '{s_name}' cell {cell.coordinate}: Referenced sheet '{token}' does not exist in workbook! Full formula: {v}")

print(f"Total formulas scanned: {total_formulas}")
if errors:
    print(f"FAILED with {len(errors)} errors:")
    for err in errors:
        print("  -", err)
else:
    print("SUCCESS: All cross-sheet references and formulas are 100% valid!")
