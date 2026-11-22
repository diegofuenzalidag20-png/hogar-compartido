// Comprueba la cuota Smart Visa y el disponible usando el código real (index.html y js/).
// Uso: node test_cofres.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

import { readdirSync } from 'node:fs';
// El código vive en index.html y en los módulos de js/
const html = [new URL('./index.html', import.meta.url), ...readdirSync(new URL('./js/', import.meta.url)).sort().map((m) => new URL(`./js/${m}`, import.meta.url))].map((u) => readFileSync(u, 'utf8')).join('\n');
const fn = (name) => html.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n {4}}\\r?\\n`))[0];
const names = ['textoRegla', 'normalizeAccountKey', 'netoTraspasos', 'getSmartCuotaPagada', 'getSmartCuotaDelMes', 'getSmartReservaChequera', 'getCuentaPrincipalDisponible', 'getMetaMensual', 'esAhorroPropio'];
const app = (expenses, cuota = 50000, traspasos = []) => new Function('expenses', 'userProfile', 'CARDS_ANALYSIS_CONFIG', 'currentAuditItems', 'traspasos',
  `${names.map(fn).join('\n')}\nreturn { ${names.join(', ')} };`)(
  expenses,
  { cofresSoledad: { smartVisa: cuota } },
  [{ key: 'chequeraSole', getRemanente: () => 0, getBudget: () => 1000 }, { key: 'fanDiego', getRemanente: () => 10, getBudget: () => 2000 }],
  [{ base: 300 }, { base: 700 }],
  traspasos,
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

// Traspasos entre cuentas propias: no son gasto, pero la cuenta de origen baja y la de destino sube
const tras = (from, to, amount, date = '2026-11-10') => ({ from, to, amount, date });
const t = app([], 50000, [tras('Mach', 'BCI Cuenta Corriente', 3270), tras('Cuenta Fan', 'Chequera BancoEstado', 1000)]);
assert.equal(t.netoTraspasos('fanDiego'), 3270 - 1000); // la cuenta corriente BCI es el fondo principal de Diego, igual que la Fan
assert.equal(t.netoTraspasos('machDiego'), -3270);
assert.equal(t.netoTraspasos('chequeraSole'), 1000);
assert.equal(t.netoTraspasos('tenpoDiego'), 0);
assert.equal(t.netoTraspasos('fanDiego', '2026-11-10'), 0); // solo cuenta los de días anteriores
assert.equal(t.netoTraspasos('fanDiego', '2026-11-11'), 2270);
assert.equal(t.getCuentaPrincipalDisponible('Diego'), 2010 + 2270);
assert.equal(t.getCuentaPrincipalDisponible('Soledad'), 1000 + 1000);
assert.equal(t.getMetaMensual(), 1000); // la meta no se mueve
assert.equal(app([]).netoTraspasos('fanDiego'), 0);

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

// Mach: cada lunes se transfiere solo si Cuenta Fan tenía fondos
const mach = (salario, gastos, cfg = {}, rem = 22725, pagoBci = 0, traspasos = []) => new Function('expenses', 'userProfile', 'currentActiveMonth', 'getLocalDateISO', 'traspasos',
  `${fn('textoRegla')}\n${fn('normalizeAccountKey')}\n${fn('netoTraspasos')}\n${fn('getMachSemanal')}\nreturn getMachSemanal();`)(
  gastos, { diegoSalary: salario, cofresDiego: { tenpoHuasco: 0, mpAhorro: 0 }, remanentes: { machDiego: rem }, machSemanal: cfg, tcBciConfig: { pagoMes: pagoBci } }, 'Noviembre 2026', () => '2026-11-09', traspasos,
);
const fan = (date, amount) => ({ account: 'Cuenta Fan', date, amount });
const normal = mach(1000000, []);
assert.equal(normal.lunes.length, 5);
assert.equal(normal.liberado, 70000);
assert.equal(normal.porLiberar, 105000);
assert.equal(normal.proximo.fecha, '2026-11-16');
assert.equal(normal.disponible, 92725);
const sinFondos = mach(500000, [fan('2026-11-05', 480000)]);
assert.equal(sinFondos.liberado, 35000);
assert.equal(sinFondos.lunes[1].transferido, false);
assert.equal(mach(500000, [fan('2026-11-05', 480000)], { excepciones: { '2026-11-09': true } }).liberado, 70000);
assert.equal(mach(1000000, [], { excepciones: { '2026-11-02': false } }).liberado, 35000);
assert.equal(mach(1000000, [], { ajuste: -43880 }).disponible, 48845);
assert.equal(mach(1000000, [{ account: 'Mach', date: '2026-11-03', amount: 5000 }]).disponible, 87725);
// El pago de la tarjeta BCI sale de Cuenta Fan: si lo aparta casi todo, Mach no recibe el lunes
assert.equal(mach(500000, [], {}, 22725, 0).liberado, 70000);
assert.equal(mach(500000, [], {}, 22725, 480000).liberado, 0);
// Traspasos: lo que sale de Mach baja su disponible y lo que entra lo sube (no es gasto)
assert.equal(mach(1000000, [], {}, 22725, 0, [tras('Mach', 'BCI Cuenta Corriente', 3270)]).disponible, 92725 - 3270);
assert.equal(mach(1000000, [], {}, 22725, 0, [tras('Cuenta Fan', 'Mach', 5000)]).disponible, 92725 + 5000);
assert.equal(mach(1000000, [], {}, 22725, 0, [tras('Mach', 'BCI Cuenta Corriente', 3270)]).liberado, 70000);
// Un traspaso que saca plata de Fan antes del lunes cuenta como salida: sin fondos, Mach no recibe la transferencia; uno que entra la devuelve
assert.equal(mach(500000, [fan('2026-11-05', 400000)]).liberado, 70000);
assert.equal(mach(500000, [fan('2026-11-05', 400000)], {}, 22725, 0, [tras('Cuenta Fan', 'Chequera BancoEstado', 60000, '2026-11-06')]).liberado, 35000);
assert.equal(mach(500000, [fan('2026-11-05', 480000)]).liberado, 35000);
assert.equal(mach(500000, [fan('2026-11-05', 480000)], {}, 22725, 0, [tras('Mach', 'Cuenta Fan', 50000, '2026-11-06')]).liberado, 70000);
// Un traspaso hecho el mismo lunes no cuenta antes de su fecha
assert.equal(mach(500000, [fan('2026-11-05', 400000)], {}, 22725, 0, [tras('Cuenta Fan', 'Chequera BancoEstado', 60000, '2026-11-09')]).liberado, 70000);

// v85: cada cuenta real va a su cofre y un texto que solo contiene "mp", "rut", "visa" o "sole" dentro de otra palabra no se cuela
const cuentas = { 'Tenpo Diego': 'tenpoDiego', 'Tenpo': 'tenpoDiego', 'Tenpo Soledad': 'tenpoSoledad', 'Mach': 'machDiego', 'Mercado Pago Diego': 'mpDiego', 'Mercado Pago': 'mpDiego',
  'Mercado Pago Soledad': 'mpSoledad', 'MP Sole': 'mpSoledad', 'Tarjeta Smart Visa': 'smartVisaSole', 'Tarjeta de Crédito BCI': 'tcBciDiego', 'BCI Cuenta Corriente': 'fanDiego',
  'Cuenta Fan': 'fanDiego', 'Chequera BancoEstado': 'chequeraSole', 'BancoEstado': 'chequeraSole', 'Cuenta RUT': 'chequeraSole', 'Efectivo': 'efectivo',
  'Cuenta Compartida': 'otra', 'Comprobante': 'otra', 'Tempo': 'otra', 'Frutería': 'otra', 'Visa Débito Santander': 'otra', 'Consolidado': 'otra', 'Tenpo Asoleado': 'tenpoDiego' };
const { normalizeAccountKey } = app([]);
for (const [cuenta, cofre] of Object.entries(cuentas)) assert.equal(normalizeAccountKey(cuenta), cofre, cuenta);

console.log('OK: cuota Smart Visa, disponible, traspasos, presupuesto, Mach semanal y cofre de cada cuenta');
