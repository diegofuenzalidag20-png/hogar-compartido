// Comprueba la combinación de datos entre teléfonos usando el código real de index.html.
// Uso: node test_sync_merge.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const sections = html.match(/const SYNC_SECTIONS = .*?;/)[0];
const fn = html.match(/function mergeThreeWay[\s\S]*?\n {4}}\r?\n/)[0];
const mergeThreeWay = new Function(`${sections}\n${fn}\nreturn mergeThreeWay;`)();

const gasto = (id, amount = 100) => ({ id, amount });
const estado = (over) => ({ auditItems: [], expenses: [], customAuditItems: [], dbMeses: [], userProfile: {}, activeMonth: 'Noviembre 2026', ultimoCierreBackup: null, ...over });
const ids = (s) => s.expenses.map((e) => e.id).sort();

// Cada teléfono agrega un gasto: se conservan ambos
assert.deepEqual(ids(mergeThreeWay(estado({ expenses: [gasto('a')] }), estado({ expenses: [gasto('a'), gasto('b')] }), estado({ expenses: [gasto('a'), gasto('c')] }))), ['a', 'b', 'c']);

// Un gasto borrado en un teléfono no reaparece
assert.deepEqual(ids(mergeThreeWay(estado({ expenses: [gasto('a'), gasto('b')] }), estado({ expenses: [gasto('b')] }), estado({ expenses: [gasto('a'), gasto('b')] }))), ['b']);
assert.deepEqual(ids(mergeThreeWay(estado({ expenses: [gasto('a'), gasto('b')] }), estado({ expenses: [gasto('a'), gasto('b')] }), estado({ expenses: [gasto('b')] }))), ['b']);

// Edición en ambos lados: gana quien guarda; edición solo remota: se adopta
assert.equal(mergeThreeWay(estado({ expenses: [gasto('a', 1)] }), estado({ expenses: [gasto('a', 2)] }), estado({ expenses: [gasto('a', 3)] })).expenses[0].amount, 2);
assert.equal(mergeThreeWay(estado({ expenses: [gasto('a', 1)] }), estado({ expenses: [gasto('a', 1)] }), estado({ expenses: [gasto('a', 3)] })).expenses[0].amount, 3);

// El perfil se combina por campo
assert.deepEqual(mergeThreeWay(estado({ userProfile: { diegoSalary: 1, soledadSalary: 1 } }), estado({ userProfile: { diegoSalary: 2, soledadSalary: 1 } }), estado({ userProfile: { diegoSalary: 1, soledadSalary: 3 } })).userProfile, { diegoSalary: 2, soledadSalary: 3 });

// Dentro de un campo del perfil, cada teléfono conserva lo suyo
assert.deepEqual(
  mergeThreeWay(estado({ userProfile: {} }), estado({ userProfile: { machSemanal: { monto: 35000 } } }), estado({ userProfile: { machSemanal: { ajuste: -43880, monto: 35000 } } })).userProfile.machSemanal,
  { monto: 35000, ajuste: -43880 },
);

// Mes cerrado en el otro teléfono: se adopta el mes nuevo y no vuelven los gastos viejos
const cierre = mergeThreeWay(estado({ expenses: [gasto('a')] }), estado({ expenses: [gasto('a'), gasto('b')] }), estado({ activeMonth: 'Diciembre 2026', expenses: [] }));
assert.equal(cierre.activeMonth, 'Diciembre 2026');
assert.deepEqual(ids(cierre), ['b']);

// Primer arranque: se rescata lo que solo está en este teléfono, sin duplicar ni traer meses viejos
const firstRunBase = new Function(`${html.match(/function firstRunBase[\s\S]*?\n {4}}\r?\n/)[0]}\nreturn firstRunBase;`)();
const nov = (id, desc, amount = 5) => ({ id, date: '2026-11-08', amount, desc });
const remoto = estado({ expenses: [nov('a', 'luz', 9)] });
const local = estado({ expenses: [nov('perdido', 'feria'), nov('otroId', 'luz', 9), { id: 'oct', date: '2026-10-20', amount: 1, desc: 'viejo' }] });
const rescate = mergeThreeWay(firstRunBase(local, remoto, 1, 2), local, remoto);
assert.deepEqual(ids(rescate), ['a', 'perdido']);

console.log('OK: combinación de datos entre teléfonos');
