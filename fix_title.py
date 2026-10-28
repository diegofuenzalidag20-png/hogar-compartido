with open('generate_sheets.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('title="Histórico Mensual"', 'title="Historico Mensual"')
text = text.replace('title="Control de Gastos"', 'title="Control Gastos"')

with open('generate_sheets.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated sheet titles cleanly.")
