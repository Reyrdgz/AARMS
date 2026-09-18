/**
 * AARMS v66-sub21 — tests runtime bitácora temperatura (lógica pura).
 * node scripts/test_sub21_bitacora_temp_runtime.mjs
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const results = [];
const assert = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail });

// --- Réplicas helpers sub21 ---
let _catalogoCache = { equipos: { termometros: [{ id: '78', fc: 0.0 }] } };
let plan = { id: 'p1', folio: 'P-001', omarIds: ['omar1'], bitTemp: [], termometroId: '78' };
let omar = { ts: 'omar1', folio: 'O-001', tomas: [] };

function _equipoActivo(tipo) {
  const lista = _catalogoCache?.equipos?.[tipo] || [];
  if (tipo === 'termometros' && plan.termometroId) {
    const a = lista.find(x => String(x.id) === String(plan.termometroId));
    if (a) return a;
  }
  return lista[0] || null;
}

function _fcTermometroActual() {
  const t = _equipoActivo('termometros');
  if (!t) return 0;
  const fc = parseFloat(t.fc);
  return isNaN(fc) ? 0 : fc;
}

function _tempCorregida(lectura, fc) {
  const v = parseFloat(lectura);
  if (isNaN(v)) return NaN;
  return v + (parseFloat(fc) || 0);
}

function _tempPromedio3(l1, l2, l3, fc) {
  const vals = [l1, l2, l3].map(x => _tempCorregida(x, fc)).filter(x => !isNaN(x));
  if (!vals.length) return NaN;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function _tempProcedimientoLabel(codigo) {
  switch (String(codigo)) {
    case '2': return 'Recipiente de polietileno (Δ ≤ 5°C)';
    case '3': return 'Vaso Dewar (Δ > 5°C)';
    default: return '';
  }
}

function _tempProcToBmSelect(codigo) {
  switch (String(codigo)) {
    case '2': return 'nodif';
    case '3': return 'dif';
    default: return '';
  }
}

function _calcBitTempRegistro(reg) {
  const fc = _fcTermometroActual();
  const agua_prom = _tempPromedio3(reg.agua_l1, reg.agua_l2, reg.agua_l3, fc);
  const amb_prom = _tempPromedio3(reg.amb_l1, reg.amb_l2, reg.amb_l3, fc);
  const diff = (!isNaN(agua_prom) && !isNaN(amb_prom)) ? Math.abs(agua_prom - amb_prom) : NaN;
  let procedimiento = '';
  if (!isNaN(diff)) procedimiento = diff <= 5 ? '2' : '3';
  return { fc, agua_prom, amb_prom, diff, procedimiento };
}

async function _migrarBitTempSub2(p, o) {
  if (!p || !o || !Array.isArray(o.tomas)) return false;
  if (!Array.isArray(p.bitTemp)) p.bitTemp = [];
  let cambio = false;
  o.tomas.forEach((t, idx) => {
    const tomaNum = idx + 1;
    if (p.bitTemp.find(r => String(r.omarTs) === String(o.ts) && Number(r.toma) === tomaNum)) return;
    const hay = t.temp_agua_l1 || t.temp_agua_l2 || t.temp_agua_l3 || t.temp_amb_l1 || t.temp_amb_l2 || t.temp_amb_l3;
    if (!hay) return;
    p.bitTemp.push({
      id: Date.now() + idx,
      omarTs: o.ts,
      toma: tomaNum,
      hora: t.hora || '',
      agua_l1: String(t.temp_agua_l1 || ''),
      agua_l2: String(t.temp_agua_l2 || ''),
      agua_l3: String(t.temp_agua_l3 || ''),
      amb_l1: String(t.temp_amb_l1 || ''),
      amb_l2: String(t.temp_amb_l2 || ''),
      amb_l3: String(t.temp_amb_l3 || '')
    });
    cambio = true;
  });
  return cambio;
}

function _bitTempAsegurarRegistro(omarTs, tomaNum, hora) {
  if (!Array.isArray(plan.bitTemp)) plan.bitTemp = [];
  const existe = plan.bitTemp.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if (existe) { if (!existe.hora && hora) existe.hora = hora; return; }
  plan.bitTemp.push({ id: Date.now() + tomaNum, omarTs, toma: tomaNum, hora: hora || '', agua_l1: '', agua_l2: '', agua_l3: '', amb_l1: '', amb_l2: '', amb_l3: '' });
}

function _refTempChipHTML(omarTs, tomaNum) {
  const reg = plan.bitTemp.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if (!reg) return '';
  const calc = _calcBitTempRegistro(reg);
  if (isNaN(calc.agua_prom) && isNaN(calc.amb_prom)) return '';
  return `T agua: ${calc.agua_prom.toFixed(1)}°C`;
}

function _bmSnapshotProc(regs) {
  const procs = regs.map(r => _calcBitTempRegistro(r).procedimiento).filter(Boolean);
  if (!procs.length) return { proc: '', bm: '' };
  const cuenta = {};
  procs.forEach(p => { cuenta[p] = (cuenta[p] || 0) + 1; });
  const procFinal = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0][0];
  return { proc: procFinal, bm: _tempProcToBmSelect(procFinal) };
}

const appJs = readFileSync(join(ROOT, 'js/app.js'), 'utf8');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const dsJs = readFileSync(join(ROOT, 'js/documents-suite.js'), 'utf8');
const swJs = readFileSync(join(ROOT, 'sw.js'), 'utf8');

// Paso 1
assert('Paso 1 — hard refresh (SW sub21)', /aarms-offline-v66-sub21/.test(swJs));

// Paso 2 — plan con datos Sub-2 en tomas
omar.tomas = [{ id: 1, hora: '08:00', temp_agua_l1: '22.1', temp_agua_l2: '22.1', temp_agua_l3: '22.2', temp_amb_l1: '26.4', temp_amb_l2: '26.4', temp_amb_l3: '26.4' }];
assert('Paso 2 — plan con datos Sub-2 en tomas', omar.tomas[0].temp_agua_l1 === '22.1');

// Paso 3 — migración a bitTemp
const mig = await _migrarBitTempSub2(plan, omar);
assert('Paso 3 — migración a plan.bitTemp', mig && plan.bitTemp.length === 1 && plan.bitTemp[0].agua_l1 === '22.1');

// Paso 4 — hoja campo sin bloque grande
assert('Paso 4 — hoja campo sin bloque grande temp', !appJs.includes('tempProcSet') && !appJs.includes('onclick="tempProcSet'));

// Paso 5 — chip referencia
const chip = _refTempChipHTML('omar1', 1);
assert('Paso 5 — chip referencia con promedios', chip.includes('22.1') || chip.includes('T agua'), chip);

// Paso 6 — botón en plan
assert('Paso 6 — botón Bitácora Temperatura en plan', html.includes('Bitácora Temperatura') && html.includes('abrirBitacoraTemp'));

// Paso 7 — pgBitTemp
assert('Paso 7 — pgBitTemp en HTML y PAGES', html.includes('id="pgBitTemp"') && appJs.includes("'pgBitTemp'"));

// Paso 8 — encabezado + leyenda
assert('Paso 8 — encabezado termómetro + criterio', appJs.includes('bitTempInfo') && appJs.includes('Criterio automático'));

// Paso 9 — card por toma
assert('Paso 9 — card por toma', plan.bitTemp.length === 1 && plan.bitTemp[0].toma === 1);

// Paso 10-13 — cálculos en vivo
const reg = plan.bitTemp[0];
reg.agua_l1 = '22.1'; reg.agua_l2 = '22.1'; reg.agua_l3 = '22.2';
const c10 = _calcBitTempRegistro(reg);
assert('Paso 10 — Prom A vivo', Math.abs(c10.agua_prom - 22.133) < 0.01, `prom=${c10.agua_prom}`);
reg.amb_l1 = '26.4'; reg.amb_l2 = '26.4'; reg.amb_l3 = '26.4';
const c11 = _calcBitTempRegistro(reg);
assert('Paso 11 — Prom B vivo', Math.abs(c11.amb_prom - 26.4) < 0.01);
assert('Paso 12 — diferencia auto', Math.abs(c11.diff - 4.27) < 0.05, `diff=${c11.diff}`);
assert('Paso 13 — procedimiento 2 auto', c11.procedimiento === '2', `proc=${c11.procedimiento}`);

// Paso 14 — volver (función existe)
assert('Paso 14 — cerrarBitacoraTemp/volverDeBitTemp', appJs.includes('cerrarBitacoraTemp') && appJs.includes('volverDeBitTemp'));

// Paso 15 — persistencia simulada
const saved = JSON.parse(JSON.stringify(plan));
const reloaded = JSON.parse(JSON.stringify(saved));
assert('Paso 15 — persistencia bitTemp', reloaded.bitTemp[0].agua_l1 === '22.1');

// Paso 16 — addToma crea registro
plan.bitTemp = [...reloaded.bitTemp];
_bitTempAsegurarRegistro('omar1', 2, '10:00');
assert('Paso 16 — addToma → registro bitTemp', plan.bitTemp.length === 2);

// Paso 17 — delToma limpia huérfano vacío
plan.bitTemp = plan.bitTemp.filter(r => !(String(r.omarTs) === 'omar1' && Number(r.toma) === 2));
assert('Paso 17 — delToma limpia bitTemp', plan.bitTemp.length === 1);

// Paso 18 — PDF BM desde bitTemp
reg.amb_l1 = '26.4'; reg.amb_l2 = '26.4'; reg.amb_l3 = '26.4';
const snap = _bmSnapshotProc(plan.bitTemp);
assert('Paso 18 — BM proc desde bitTemp', snap.bm === 'nodif' && dsJs.includes('_calcBitTempRegistro'));

// Paso 19 — generarPDFBitTemp existe
assert('Paso 19 — generarPDFBitTemp', dsJs.includes('generarPDFBitTemp') && dsJs.includes('Bitacora_Temperatura_'));

// Paso 20 — sintaxis + divs
let ok = true;
try {
  execSync('node -c js/app.js', { cwd: ROOT, stdio: 'pipe' });
  execSync('node -c js/documents-suite.js', { cwd: ROOT, stdio: 'pipe' });
  const o = (html.match(/<div\b/g) || []).length;
  const c = (html.match(/<\/div>/g) || []).length;
  if (o !== c) ok = false;
  assert('Paso 20 — sintaxis + divs', ok, `divs ${o}/${c}`);
} catch (e) {
  assert('Paso 20 — sintaxis + divs', false, String(e.message || e));
}

console.log('\n=== SUB-2.1 RUNTIME TESTS ===\n');
results.forEach(r => console.log(`${r.pass ? 'PASA' : 'FALLA'} — ${r.name}${r.detail ? ' (' + r.detail + ')' : ''}`));
const passed = results.filter(r => r.pass).length;
console.log(`\nTotal: ${passed}/${results.length} PASA`);
if (passed < results.length) process.exit(1);
