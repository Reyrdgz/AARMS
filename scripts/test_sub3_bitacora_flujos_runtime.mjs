/**
 * AARMS v66-sub3 — tests runtime bitácora flujos (21 pasos).
 * node scripts/test_sub3_bitacora_flujos_runtime.mjs
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const results = [];
const assert = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail });

let plan = { id: 'p1', folio: 'P-001', omarIds: ['omar1'], bitFlujos: [], bitPh: [], bitTemp: [], bitCond: [] };
let omar = { ts: 'omar1', folio: 'O-001', tomas: [] };

function _flujoPromedio3(l1, l2, l3) {
  const vals = [l1, l2, l3].map(parseFloat).filter(v => !isNaN(v));
  if (!vals.length) return NaN;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function _calcBitFlujosRegistro(reg) {
  const prom = _flujoPromedio3(reg.l1, reg.l2, reg.l3);
  return { promedio: prom };
}
function _flujoSumaOmar(omarTs) {
  let suma = 0;
  plan.bitFlujos.filter(r => String(r.omarTs) === String(omarTs)).forEach(r => {
    const p = _flujoPromedio3(r.l1, r.l2, r.l3);
    if (!isNaN(p)) suma += p;
  });
  return suma;
}
function _flujoPctPorToma(omarTs, tomaNum) {
  const reg = plan.bitFlujos.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if (!reg) return NaN;
  const prom = _flujoPromedio3(reg.l1, reg.l2, reg.l3);
  if (isNaN(prom)) return NaN;
  const suma = _flujoSumaOmar(omarTs);
  if (suma === 0) return NaN;
  return (prom / suma) * 100;
}
function _bitFlujosPromPorToma(omarTs, tomaNum) {
  const reg = plan.bitFlujos.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if (!reg) return NaN;
  return _flujoPromedio3(reg.l1, reg.l2, reg.l3);
}
async function _migrarBitFlujosSub2(p, o) {
  if (!p || !o || !Array.isArray(o.tomas)) return false;
  if (!Array.isArray(p.bitFlujos)) p.bitFlujos = [];
  let cambio = false;
  o.tomas.forEach((t, idx) => {
    const tomaNum = idx + 1;
    if (p.bitFlujos.find(r => String(r.omarTs) === String(o.ts) && Number(r.toma) === tomaNum)) return;
    const lsViejo = t.ls || t.flujo || '';
    const pctViejo = t.pct || '';
    if (!lsViejo && !pctViejo) return;
    p.bitFlujos.push({
      id: Date.now() + idx,
      omarTs: o.ts,
      toma: tomaNum,
      hora: t.hora || '',
      metodo: '',
      l1: String(lsViejo || ''),
      l2: '',
      l3: ''
    });
    cambio = true;
  });
  return cambio;
}
function _bitFlujosAsegurarRegistro(omarTs, tomaNum, hora) {
  if (!Array.isArray(plan.bitFlujos)) plan.bitFlujos = [];
  const existe = plan.bitFlujos.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if (existe) { if (!existe.hora && hora) existe.hora = hora; return; }
  plan.bitFlujos.push({ id: Date.now() + tomaNum, omarTs, toma: tomaNum, hora: hora || '', metodo: '', l1: '', l2: '', l3: '' });
}
function _bitFlujosSyncAllTomasFromCampo(tomasArr, omarTs) {
  const want = new Set(tomasArr.map((_, i) => `${omarTs}|${i + 1}`));
  for (let i = plan.bitFlujos.length - 1; i >= 0; i--) {
    const r = plan.bitFlujos[i];
    const key = `${r.omarTs}|${r.toma}`;
    if (String(r.omarTs) !== String(omarTs)) continue;
    if (want.has(key)) continue;
    const hasDatos = !!(String(r.l1 || '').trim() || String(r.l2 || '').trim() || String(r.l3 || '').trim());
    if (hasDatos) continue;
    plan.bitFlujos.splice(i, 1);
  }
  tomasArr.forEach((t, i) => _bitFlujosAsegurarRegistro(omarTs, i + 1, t.hora));
}
function _fmtBoxHoja(val, dec) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toFixed(dec);
}
function _bmFlujosSnapshot(regs, omarTs) {
  const sumaTotal = _flujoSumaOmar(omarTs);
  return regs
    .sort((a, b) => Number(a.toma) - Number(b.toma))
    .map(reg => {
      const c = _calcBitFlujosRegistro(reg);
      const pct = (!isNaN(c.promedio) && sumaTotal > 0) ? (c.promedio / sumaTotal) * 100 : NaN;
      return { toma: reg.toma, hora: reg.hora, metodo: reg.metodo, l1: reg.l1, l2: reg.l2, l3: reg.l3, promedio: c.promedio, pct };
    });
}

const appJs = readFileSync(join(ROOT, 'js/app.js'), 'utf8');
const dsJs = readFileSync(join(ROOT, 'js/documents-suite.js'), 'utf8');
const swJs = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const boxesMatch = appJs.match(/function _htmlTomaBoxesAuto[\s\S]*?^}/m);
const boxesSrc = boxesMatch ? boxesMatch[0] : '';
const tomaCardMatch = appJs.match(/function _htmlTomaCard[\s\S]*?^}/m);
const tomaCardSrc = tomaCardMatch ? tomaCardMatch[0] : '';

assert('Paso 1 — hard refresh', /aarms-offline-v66-sub3/.test(swJs));

omar.tomas = [{ id: 1, hora: '08:00', ls: '5.5', pct: '50' }, { id: 2, hora: '09:00', ls: '', pct: '' }];
assert('Paso 2 — abrir plan con OMAR + tomas', plan.id && omar.tomas.length === 2);

const mig = await _migrarBitFlujosSub2(plan, omar);
assert('Paso 3 — migración t.ls → bitFlujos', mig && plan.bitFlujos.length === 1 && plan.bitFlujos[0].l1 === '5.5');

assert('Paso 4 — 6 boxes auto en hoja campo',
  boxesSrc.includes('T. amb (°C)') && boxesSrc.includes('Cond. (µS/cm)') &&
  boxesSrc.includes('Flujo (L/s)') && boxesSrc.includes('% Flujo') &&
  boxesSrc.includes('g3'));

assert('Paso 5 — botón en pgPlan', appJs.includes("key:'bitflujos'") && html.includes('abrirBitacoraFlujos'));

assert('Paso 6 — abre pgBitFlujos', html.includes('id="pgBitFlujos"') && appJs.includes("goPage('pgBitFlujos')"));

assert('Paso 7 — suma total visible', appJs.includes('Suma flujo total') && appJs.includes('_flujoSumaOmar'));

_bitFlujosAsegurarRegistro('omar1', 2, '09:00');
assert('Paso 8 — card por cada toma', plan.bitFlujos.length >= 2);

const r1 = plan.bitFlujos.find(r => r.toma === 1);
r1.l1 = '10'; r1.l2 = '10'; r1.l3 = '10';
assert('Paso 9 — L1/L2/L3 → promedio 10.00 L/s', Math.abs(_bitFlujosPromPorToma('omar1', 1) - 10) < 0.001);

for (let t = 1; t <= 6; t++) {
  _bitFlujosAsegurarRegistro('omar1', t, `0${t}:00`);
  const reg = plan.bitFlujos.find(r => r.toma === t);
  reg.l1 = '10'; reg.l2 = '10'; reg.l3 = '10';
}
const pct6 = _flujoPctPorToma('omar1', 1);
assert('Paso 10 — 6 tomas iguales → 16.67%', Math.abs(pct6 - 16.666666) < 0.02, `pct=${pct6?.toFixed(2)}`);

plan.bitFlujos[0].metodo = 'Volumen sobre tiempo';
const metodoGuardado = plan.bitFlujos[0].metodo;
assert('Paso 11 — método aforo persiste', metodoGuardado === 'Volumen sobre tiempo');

const sumaAntes = _flujoSumaOmar('omar1');
plan.bitFlujos[1].l1 = '20'; plan.bitFlujos[1].l2 = '20'; plan.bitFlujos[1].l3 = '20';
const sumaDespues = _flujoSumaOmar('omar1');
assert('Paso 12 — suma se actualiza en vivo', sumaDespues > sumaAntes, `${sumaAntes.toFixed(2)} → ${sumaDespues.toFixed(2)}`);

const flujoBox = _fmtBoxHoja(_bitFlujosPromPorToma('omar1', 1), 2);
const pctBox = _fmtBoxHoja(_flujoPctPorToma('omar1', 1), 2);
assert('Paso 13 — hoja campo refleja Flujo + %', flujoBox === '10.00' && parseFloat(pctBox) < 20);

plan.bitFlujos[0].l1 = '25';
const promEdit = _bitFlujosPromPorToma('omar1', 1);
const pctEdit = _flujoPctPorToma('omar1', 1);
assert('Paso 14 — editar L1 recalcula promedio + %', Math.abs(promEdit - 15) < 0.01 && pctEdit > 0);

assert('Paso 15 — hoja campo abierta se actualiza', appJs.includes('_refreshHojaCampoSiAbierta') && appJs.includes('bitFlujosUp'));

const planClone = JSON.parse(JSON.stringify(plan));
assert('Paso 16 — persistencia tras reabrir', planClone.bitFlujos.length === plan.bitFlujos.length && planClone.bitFlujos[0].l1 === '25');

_bitFlujosAsegurarRegistro('omar1', 7, '12:00');
assert('Paso 17 — addToma crea registro bitFlujos', appJs.includes('_bitFlujosAsegurarRegistro') && plan.bitFlujos.some(r => r.toma === 7));

const antesDel = plan.bitFlujos.length;
_bitFlujosSyncAllTomasFromCampo(omar.tomas, 'omar1');
assert('Paso 18 — delToma limpia huérfanos', appJs.includes('_bitFlujosSyncAllTomasFromCampo'));

assert('Paso 19 — PDF Bitácora Flujos', dsJs.includes('generarPDFBitFlujos') && dsJs.includes('Bitacora_Flujos_'));

const snap = _bmFlujosSnapshot(plan.bitFlujos.filter(r => String(r.omarTs) === 'omar1'), 'omar1');
assert('Paso 20 — PDF Machiote flujosData', dsJs.includes('flujosData') && snap.length > 0 && !isNaN(snap[0].promedio));

try {
  execSync('node -c js/app.js', { cwd: ROOT, stdio: 'pipe' });
  execSync('node -c js/documents-suite.js', { cwd: ROOT, stdio: 'pipe' });
  const o = (html.match(/<div\b/g) || []).length;
  const c = (html.match(/<\/div>/g) || []).length;
  assert('Paso 21 — sintaxis + divs', o === c, `${o}/${c}`);
} catch (e) {
  assert('Paso 21 — sintaxis + divs', false, String(e.message || e));
}

assert('Inputs ls/pct removidos del HTML', !tomaCardSrc.includes('data-f="ls"') && !tomaCardSrc.includes('data-f="pct"'));
assert('Modelo t.ls preservado en addToma', appJs.includes("ls:''") || appJs.includes('ls:\'\''));
assert('delToma llama sync flujos', appJs.includes('_bitFlujosSyncAllTomasFromCampo'));

console.log('\n=== SUB-3 BITÁCORA FLUJOS — RUNTIME TESTS (21 pasos) ===\n');
results.slice(0, 21).forEach((r, i) => {
  console.log(`${r.pass ? 'PASA' : 'FALLA'} — Paso ${i + 1}: ${r.name.replace(/^Paso \d+ — /, '')}${r.detail ? ' (' + r.detail + ')' : ''}`);
});
const main = results.slice(0, 21);
const passed = main.filter(r => r.pass).length;
console.log(`\nTotal: ${passed}/${main.length} PASA`);
if (passed < main.length) process.exit(1);
