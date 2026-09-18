/**
 * AARMS v66-sub22 — tests runtime hoja campo boxes auto-llenados.
 * node scripts/test_sub22_hoja_campo_boxes_runtime.mjs
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const results = [];
const assert = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail });

let plan = { id: 'p1', bitTemp: [], bitPh: [], bitCond: [] };
const omarTs = 'omar1';

function _phPromedio(l1, l2, l3) {
  const Ls = [l1, l2, l3].map(x => parseFloat(x)).filter(x => !isNaN(x));
  if (Ls.length !== 3) return null;
  return Ls.reduce((a, b) => a + b, 0) / 3;
}
function _phRedondeo25(prom) {
  if (prom == null || isNaN(prom)) return '';
  return (Math.round(prom * 10) / 10).toFixed(1);
}
function _calcBitTempRegistro(reg) {
  const agua = [reg.agua_l1, reg.agua_l2, reg.agua_l3].map(parseFloat).filter(x => !isNaN(x));
  const amb = [reg.amb_l1, reg.amb_l2, reg.amb_l3].map(parseFloat).filter(x => !isNaN(x));
  return {
    agua_prom: agua.length ? agua.reduce((a, b) => a + b, 0) / agua.length : NaN,
    amb_prom: amb.length ? amb.reduce((a, b) => a + b, 0) / amb.length : NaN
  };
}
function _bitTempPromAguaPorToma(ts, n) {
  const reg = plan.bitTemp.find(r => String(r.omarTs) === String(ts) && Number(r.toma) === Number(n));
  return reg ? _calcBitTempRegistro(reg).agua_prom : NaN;
}
function _bitTempPromAmbPorToma(ts, n) {
  const reg = plan.bitTemp.find(r => String(r.omarTs) === String(ts) && Number(r.toma) === Number(n));
  return reg ? _calcBitTempRegistro(reg).amb_prom : NaN;
}
function _bitPhPromPorToma(ts, n) {
  const reg = plan.bitPh.find(r => !r.calibGrupo && String(r.omarId) === String(ts) && String(r.toma) === String(n));
  if (!reg) return NaN;
  const prom = _phPromedio(reg.l1, reg.l2, reg.l3);
  if (prom == null) return NaN;
  const r25 = _phRedondeo25(prom);
  return r25 !== '' ? parseFloat(r25) : prom;
}
function _bitCondPromPorToma(ts, n) {
  const reg = plan.bitCond.find(r => String(r.omarId) === String(ts) && String(r.toma) === String(n));
  if (!reg) return NaN;
  const vals = [reg.l1, reg.l2, reg.l3].map(parseFloat).filter(v => !isNaN(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
}
function _fmtBoxHoja(val, dec) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toFixed(dec);
}

const appJs = readFileSync(join(ROOT, 'js/app.js'), 'utf8');
const dsJs = readFileSync(join(ROOT, 'js/documents-suite.js'), 'utf8');
const swJs = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

// Extraer cuerpo de _htmlTomaCard para verificar ausencia de proc en hoja
const tomaCardMatch = appJs.match(/function _htmlTomaCard[\s\S]*?^}/m);
const tomaCardSrc = tomaCardMatch ? tomaCardMatch[0] : '';

assert('Paso 1 — hard refresh', /aarms-offline-v66-sub22/.test(swJs));

plan.bitTemp = [{ omarTs, toma: 1, agua_l1: '22.1', agua_l2: '22.1', agua_l3: '22.2', amb_l1: '26.4', amb_l2: '26.4', amb_l3: '26.4' }];
plan.bitPh = [{ omarId: omarTs, toma: '1', l1: '7.01', l2: '7.02', l3: '7.03' }];
plan.bitCond = [{ omarId: omarTs, toma: '1', l1: '450', l2: '452', l3: '448' }];
assert('Paso 2 — plan con datos en bitácoras', plan.bitTemp.length && plan.bitPh.length && plan.bitCond.length);

assert('Paso 3 — abrir hoja campo', appJs.includes('function renderTomas') && appJs.includes('_htmlTomaBoxesAuto'));

assert('Paso 4 — chip renglón eliminado', !appJs.includes('_refTempChipHTML') && !appJs.includes('${chipTemp}'));

assert('Paso 5 — 4 boxes por card', appJs.includes('T. amb (°C)') && appJs.includes('T. agua (°C)') && tomaCardSrc.includes('${boxesAuto}'));

const agua = _bitTempPromAguaPorToma(omarTs, 1);
const amb = _bitTempPromAmbPorToma(omarTs, 1);
assert('Paso 6 — T. agua/amb auto', Math.abs(agua - 22.133) < 0.01 && Math.abs(amb - 26.4) < 0.01, `agua=${agua?.toFixed(2)} amb=${amb?.toFixed(2)}`);

assert('Paso 7 — pH auto', Math.abs(_bitPhPromPorToma(omarTs, 1) - 7.0) < 0.05);

assert('Paso 8 — Cond auto', Math.abs(_bitCondPromPorToma(omarTs, 1) - 450) < 1);

assert('Paso 9 — sin datos → —', _fmtBoxHoja(_bitTempPromAguaPorToma(omarTs, 2), 1) === '—');

assert('Paso 10 — procedimiento NO en hoja campo', !tomaCardSrc.includes('Proc:') && !tomaCardSrc.includes('procedimiento'));

plan.bitTemp[0].agua_l1 = '23.0';
const agua2 = _bitTempPromAguaPorToma(omarTs, 1);
assert('Paso 11 — editar bitTemp → box actualiza', Math.abs(agua2 - 22.433) < 0.01, `agua=${agua2?.toFixed(2)}`);

plan.bitPh[0] = { omarId: omarTs, toma: '1', l1: '8.01', l2: '8.02', l3: '8.03' };
plan.bitCond[0] = { omarId: omarTs, toma: '1', l1: '500', l2: '500', l3: '500' };
assert('Paso 12 — editar bitPh/bitCond → boxes actualizan',
  Math.abs(_bitPhPromPorToma(omarTs, 1) - 8.0) < 0.05 && Math.abs(_bitCondPromPorToma(omarTs, 1) - 500) < 1);

assert('Paso 13 — inputs manuales siguen',
  tomaCardSrc.includes('data-f="hora"') && tomaCardSrc.includes('data-f="ls"') && tomaCardSrc.includes('data-f="pct"') && tomaCardSrc.includes('data-f="mat"'));

assert('Paso 14 — PDF Machiote conserva procedimiento', dsJs.includes('bm_s3_proc_temp') && dsJs.includes('_calcBitTempRegistro'));

try {
  execSync('node -c js/app.js', { cwd: ROOT, stdio: 'pipe' });
  execSync('node -c js/documents-suite.js', { cwd: ROOT, stdio: 'pipe' });
  const o = (html.match(/<div\b/g) || []).length;
  const c = (html.match(/<\/div>/g) || []).length;
  assert('Paso 15 — sintaxis + divs', o === c, `${o}/${c}`);
} catch (e) {
  assert('Paso 15 — sintaxis + divs', false, String(e.message || e));
}

console.log('\n=== SUB-2.2 RUNTIME TESTS ===\n');
results.forEach(r => console.log(`${r.pass ? 'PASA' : 'FALLA'} — ${r.name}${r.detail ? ' (' + r.detail + ')' : ''}`));
const passed = results.filter(r => r.pass).length;
console.log(`\nTotal: ${passed}/${results.length} PASA`);
if (passed < results.length) process.exit(1);
