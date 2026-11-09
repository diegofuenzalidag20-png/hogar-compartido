// Comprueba la cuota Smart Visa y el disponible usando el código real de index.html.
// Uso: node test_cofres.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const fn = (name) => html.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n {4}}\\r?\\n`))[0];
const names = ['normalizeAccountKey', 'getSmartCuotaPagada', 'getSmartCuotaDelMes', 'getSmartReservaChequera', 'getCuentaPrincipalDisponible', 'getMetaMensual'];
const app = (expenses, cuota = 50000) => new Function('expenses', 'userProfile', 'CARDS_ANALYSIS_CONFIG', 'currentAuditItems',
  `${names.map(fn).join('\n')}\nreturn { ${names.join(', ')} };`)(
  expenses,
  { cofresSoledad: { smartVisa: cuota } },
  [{ key: 'chequeraSole', getRemanente: () => 0, getBudget: () => 1000 }, { key: 'fanDiego', getRemanente: () => 10, getBudget: () => 2000 }],
  [{ base: 300 }, { base: 700 }],
);
const gasto = (account, amount, category = 'Otros', desc = 'x') => ({ account, amount, category, desc });

// Sin cuota registrada se reserva lo planificado
assert.equal(app([]).getSmartReservaChequera(), 50000);
assert.equal(app([]).getSmartCuotaDelMes(), 50000);

// Con la cuota registrada como gasto no se reserva de nuevo y manda el monto real
const pagada = app([gasto('Chequera BancoEstado', 118345, 'Tarjeta Smart Visa (Cuota / Compra)', 'Cuota Tarjeta Smart Visa')]);
assert.equal(pagada.getSmartReservaChequera(), 0);
assert.equal(pagada.getSmartCuotaDelMes(), 118345);

// Una compra hecha con la tarjeta no es un pago de cuota
assert.equal(app([gasto('Tarjeta Smart Visa', 58000, 'Mascotas', 'Smart Visa compra')]).getSmartCuotaPagada(), 0);

// Una cuota planificada en cero se respeta
assert.equal(app([], 0).getSmartCuotaDelMes(), 0);

// El disponible puede ser negativo y cada cuenta descuenta solo lo suyo: el dividendo de Diego sale de Fan
const a = app([gasto('Cuenta Fan', 365000, 'Crédito Hipotecario'), gasto('Chequera BancoEstado', 1500)]);
assert.equal(a.getCuentaPrincipalDisponible('Soledad'), -500);
assert.equal(a.getCuentaPrincipalDisponible('Diego'), 2010 - 365000);
assert.equal(a.getMetaMensual(), 1000);

// Los gastos sueltos salen del presupuesto; lo planificado a mano se respeta
const quitar = new Function(`${fn('quitarGastosDelPresupuesto')}\nreturn quitarGastosDelPresupuesto;`)();
const items = [
  { id: 'a', name: 'Santa isabel', isCustom: true, base: 9000, actual: 12000 },
  { id: 'b', name: 'Curso planificado', isCustom: true, base: 5000, actual: 5000 },
  { id: 'c', name: 'Luz', base: 20000, actual: 20000 },
];
quitar(items, [{ id: 'b' }]);
assert.deepEqual(items.map((i) => i.base), [0, 5000, 20000]);
assert.equal(items[0].fromQuickBill, true);

console.log('OK: cuota Smart Visa, disponible y presupuesto');
