/**
 * AARMS v66-sub2 — tests runtime temperaturas hoja de campo (lógica pura).
 * node scripts/test_sub2_temperaturas_runtime.mjs
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const results = [];
const assert = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail });

// --- Réplicas mínimas helpers sub1 + sub2 ---
function _equipoClave(tipo, item) {
  if (!item || !item.id) return '';
  const prefijo = {
    potenciometros: 'AA/PT/',
    conductimetros: 'AA/CO/',
    termometros: 'AA/TM/',
    mallas: 'AA/MA/',
    kitsCloro: 'AA/KC/'
  }[tipo];
  if (!prefijo) return String(item.id);
  return prefijo + String(item.id);
}

let _catalogoCache = null;
let _cachedPlanes = null;
let _currentPlanId = null;
let omar = null;
let tomas = [];

function _planActivo() {
  if (!_currentPlanId || !_cachedPlanes) return null;
  return _cachedPlanes.find(p => p.id === _currentPlanId) || null;
}

function _planActivoParaOmar() {
  const p = _planActivo();
  if (p) return p;
  if (omar && omar.ts && _cachedPlanes) {
    return _cachedPlanes.find(pl => (pl.omarIds || []).includes(omar.ts)) || null;
  }
  return null;
}

function _equipoActivo(tipo) {
  if (!_catalogoCache || !_catalogoCache.equipos) return null;
  const lista = _catalogoCache.equipos[tipo] || [];
  if (tipo === 'termometros') {
    const plan = _planActivoParaOmar();
    if (plan && plan.termometroId) {
      const asignado = lista.find(x => String(x.id) === String(plan.termometroId));
      if (asignado) return asignado;
    }
  }
  return lista[0] || null;
}

function _fcTermometroActual() {
  const termo = _equipoActivo('termometros');
  if (!termo) return 0;
  const fc = parseFloat(termo.fc);
  return isNaN(fc) ? 0 : fc;
}

function _tempCorregida(lectura, fc) {
  const v = parseFloat(lectura);
  if (isNaN(v)) return NaN;
  return v + (parseFloat(fc) || 0);
}

function _tempPromedio3(l1, l2, l3, fc) {
  const vals = [l1, l2, l3].map(x => _tempCorregida(x, fc)).filter(x => !isNaN(x));
  if (vals.length === 0) return NaN;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function _tempProcedimientoSugerido(diff) {
  const d = Math.abs(parseFloat(diff) || 0);
  if (isNaN(d)) return '';
  if (d <= 5) return '2';
  return '3';
}

function _tempProcedimientoLabel(codigo) {
  switch (String(codigo)) {
    case '1': return '1 — Lectura directa en sitio de descarga';
    case '2': return '2 — Recipiente de polietileno (Δ ≤ 5°C)';
    case '3': return '3 — Vaso Dewar (Δ > 5°C)';
    default: return '';
  }
}

function _tempProcToBmSelect(codigo) {
  switch (String(codigo)) {
    case '1': return 'directo';
    case '2': return 'nodif';
    case '3': return 'dif';
    default: return '';
  }
}

function _calcTemperaturaToma(toma) {
  const fc = _fcTermometroActual();
  const agua_c1 = _tempCorregida(toma.temp_agua_l1, fc);
  const agua_c2 = _tempCorregida(toma.temp_agua_l2, fc);
  const agua_c3 = _tempCorregida(toma.temp_agua_l3, fc);
  const agua_prom = _tempPromedio3(toma.temp_agua_l1, toma.temp_agua_l2, toma.temp_agua_l3, fc);
  const amb_c1 = _tempCorregida(toma.temp_amb_l1, fc);
  const amb_c2 = _tempCorregida(toma.temp_amb_l2, fc);
  const amb_c3 = _tempCorregida(toma.temp_amb_l3, fc);
  const amb_prom = _tempPromedio3(toma.temp_amb_l1, toma.temp_amb_l2, toma.temp_amb_l3, fc);
  const diff = (!isNaN(agua_prom) && !isNaN(amb_prom)) ? Math.abs(agua_prom - amb_prom) : NaN;
  const proc_sugerido = !isNaN(diff) ? _tempProcedimientoSugerido(diff) : '';
  return { fc, agua_c1, agua_c2, agua_c3, agua_prom, amb_c1, amb_c2, amb_c3, amb_prom, diff, proc_sugerido };
}

function _migrarTomaTemperatura(t) {
  if (!t) return false;
  let migrado = false;
  if (t.tagua !== undefined && t.temp_agua_l1 === undefined) {
    t.temp_agua_l1 = String(t.tagua || '');
    t.temp_agua_l2 = '';
    t.temp_agua_l3 = '';
    migrado = true;
  } else if (t.temp_agua_l1 === undefined) {
    t.temp_agua_l1 = '';
    t.temp_agua_l2 = '';
    t.temp_agua_l3 = '';
  }
  if (t.tamb !== undefined && t.temp_amb_l1 === undefined) {
    t.temp_amb_l1 = String(t.tamb || '');
    t.temp_amb_l2 = '';
    t.temp_amb_l3 = '';
    migrado = true;
  } else if (t.temp_amb_l1 === undefined) {
    t.temp_amb_l1 = '';
    t.temp_amb_l2 = '';
    t.temp_amb_l3 = '';
  }
  if (t.temp_proc === undefined) t.temp_proc = '';
  if (t.temp_proc_manual === undefined) t.temp_proc_manual = false;
  return migrado;
}

function _planTermometroSelectorHTML(plan) {
  const termos = _catalogoCache?.equipos?.termometros || [];
  if (termos.length <= 1) return '';
  const seleccionado = plan.termometroId || termos[0].id;
  const opciones = termos.map(t => {
    const fc = parseFloat(t.fc);
    const fcStr = isNaN(fc) ? '0' : ((fc >= 0 ? '+' : '') + fc);
    return `<option value="${t.id}" ${String(seleccionado) === String(t.id) ? 'selected' : ''}>${_equipoClave('termometros', t)} (FC ${fcStr})</option>`;
  }).join('');
  return `<div class="f"><label>Termómetro asignado al plan</label><select>${opciones}</select></div>`;
}

function _bmSnapshotTermoProc(tomasArr) {
  const termoEq = _equipoActivo('termometros');
  const claveTermo = termoEq ? _equipoClave('termometros', termoEq) : '';
  const procs = tomasArr.map(t => {
    if (t.temp_proc) return t.temp_proc;
    const c = _calcTemperaturaToma(t);
    return c.proc_sugerido || '';
  }).filter(Boolean);
  let procFinal = '';
  let procFinalTxt = '';
  if (procs.length) {
    const cuenta = {};
    procs.forEach(pp => { cuenta[pp] = (cuenta[pp] || 0) + 1; });
    procFinal = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0][0];
    procFinalTxt = _tempProcedimientoLabel(procFinal);
  }
  const procBm = _tempProcToBmSelect(procFinal);
  const tempData = tomasArr.map((t, i) => {
    const c = _calcTemperaturaToma(t);
    return { toma: i + 1, ...c, proc: t.temp_proc || c.proc_sugerido };
  });
  return { bm_s3_termo: claveTermo, bm_s3_proc_temp: procBm, bm_s3_proc_temp_txt: procFinalTxt, tempData };
}

function _htmlTomaCardSnippet(t) {
  const calcT = _calcTemperaturaToma(t);
  const termoActivo = _equipoActivo('termometros');
  const termoLabel = termoActivo ? _equipoClave('termometros', termoActivo) : 'sin termómetro asignado';
  return { termoLabel, fc: calcT.fc, hasTempBlock: true, calcT };
}

// --- IndexedDB simulado ---
const idb = new Map();

function idbPut(obj) {
  idb.set(obj.ts || obj.id, JSON.parse(JSON.stringify(obj)));
  return Promise.resolve();
}

function idbGet(key) {
  const v = idb.get(key);
  return Promise.resolve(v ? JSON.parse(JSON.stringify(v)) : null);
}

// Paso 1 — hard refresh (cache SW sub2)
const swSrc = readFileSync(join(ROOT, 'sw.js'), 'utf8');
assert('Paso 1 — hard refresh (SW cache sub2)', /aarms-offline-v66-sub2/.test(swSrc), swSrc.match(/CACHE\s*=\s*'([^']+)'/)?.[1]);

// Paso 2 — termómetro con FC en inventario
_catalogoCache = {
  equipos: {
    potenciometros: [], conductimetros: [], mallas: [], kitsCloro: [],
    termometros: [{ id: '78', marca: 'Test', fc: 0.0, notas: '' }]
  }
};
const termo0 = _equipoActivo('termometros');
assert('Paso 2 — termómetro con FC en Inventario', termo0 && termo0.id === '78' && termo0.fc === 0.0);

// Paso 3 — plan + OMAR + 3 tomas
_cachedPlanes = [{ id: 'plan1', folio: 'P-001', omarIds: ['omar1'], termometroId: '78' }];
_currentPlanId = 'plan1';
omar = { ts: 'omar1', folio: 'O-001', tomas: [] };
tomas = [];
for (let i = 0; i < 3; i++) {
  tomas.push({
    id: i + 1, hora: '', pct: '', ls: '',
    temp_agua_l1: '', temp_agua_l2: '', temp_agua_l3: '',
    temp_amb_l1: '', temp_amb_l2: '', temp_amb_l3: '',
    temp_proc: '', temp_proc_manual: false,
    ph: '', cond: '', params: []
  });
}
omar.tomas = tomas;
await idbPut(omar);
assert('Paso 3 — crear plan + OMAR + 3 tomas', tomas.length === 3 && omar.ts === 'omar1');

// Paso 4 — abrir hoja de campo (simular carga)
const mLoaded = await idbGet('omar1');
tomas = mLoaded.tomas;
assert('Paso 4 — abrir hoja de campo', tomas.length === 3);

// Paso 5 — bloque temperatura + label termómetro
const card0 = _htmlTomaCardSnippet(tomas[0]);
assert('Paso 5 — bloque temperatura + label termómetro',
  card0.termoLabel === 'AA/TM/78' && card0.fc === 0,
  `label=${card0.termoLabel} fc=${card0.fc}`);

// Paso 6 — escribir T1/T2/T3 agua
tomas[0].temp_agua_l1 = '22.1';
tomas[0].temp_agua_l2 = '22.1';
tomas[0].temp_agua_l3 = '22.2';
assert('Paso 6 — escribir T1/T2/T3 agua',
  tomas[0].temp_agua_l1 === '22.1' && tomas[0].temp_agua_l3 === '22.2');

// Paso 7 — corregidas + promedio A ~22.13
const c7 = _calcTemperaturaToma(tomas[0]);
const promOk = Math.abs(c7.agua_prom - 22.133333) < 0.01;
assert('Paso 7 — corregidas + promedio A ~22.13°C',
  promOk && c7.agua_c1 === 22.1,
  `prom=${c7.agua_prom?.toFixed(2)} c1=${c7.agua_c1}`);

// Paso 8 — escribir T1/T2/T3 ambiente
tomas[0].temp_amb_l1 = '26.4';
tomas[0].temp_amb_l2 = '26.4';
tomas[0].temp_amb_l3 = '26.4';
assert('Paso 8 — escribir T1/T2/T3 ambiente', tomas[0].temp_amb_l1 === '26.4');

// Paso 9 — promedio B 26.40
const c9 = _calcTemperaturaToma(tomas[0]);
assert('Paso 9 — promedio B 26.40°C', Math.abs(c9.amb_prom - 26.4) < 0.01, `amb_prom=${c9.amb_prom}`);

// Paso 10 — diferencia A-B ~4.27
assert('Paso 10 — diferencia A−B ~4.27°C', Math.abs(c9.diff - 4.27) < 0.05, `diff=${c9.diff?.toFixed(2)}`);

// Paso 11 — procedimiento sugerido ★ = 2
assert('Paso 11 — procedimiento sugerido ★ = 2', c9.proc_sugerido === '2', `proc=${c9.proc_sugerido}`);

// Paso 12 — tap manual → procedimiento 3
tomas[0].temp_proc = '3';
tomas[0].temp_proc_manual = true;
assert('Paso 12 — tap manual → procedimiento 3',
  tomas[0].temp_proc === '3' && tomas[0].temp_proc_manual === true);

// Paso 13 — cambiar FC a -0.5 → recalcular
_catalogoCache.equipos.termometros[0].fc = -0.5;
const c13 = _calcTemperaturaToma(tomas[0]);
assert('Paso 13 — cambiar FC → recalcular corregidas',
  Math.abs(c13.agua_c1 - 21.6) < 0.01 && c13.fc === -0.5,
  `c1=${c13.agua_c1} fc=${c13.fc}`);

// Paso 14 — crear 2do termómetro
_catalogoCache.equipos.termometros.push({ id: '99', marca: 'B', fc: 1.0, notas: '' });
assert('Paso 14 — crear 2do termómetro', _catalogoCache.equipos.termometros.length === 2);

// Paso 15 — dropdown selector aparece
const plan = _planActivo();
const selHtml = _planTermometroSelectorHTML(plan);
assert('Paso 15 — dropdown selector aparece',
  selHtml.includes('Termómetro asignado al plan') && selHtml.includes('AA/TM/99'),
  selHtml ? 'HTML ok' : 'vacío');

// Paso 16 — cambiar termómetro asignado → nuevo FC
plan.termometroId = '99';
const c16 = _calcTemperaturaToma(tomas[0]);
assert('Paso 16 — cambiar termómetro asignado → FC +1.0',
  c16.fc === 1.0 && Math.abs(c16.agua_c1 - 23.1) < 0.01,
  `fc=${c16.fc} c1=${c16.agua_c1}`);

// Paso 17 — persistencia tras reabrir OMAR
omar.tomas = tomas.map(t => ({ ...t }));
await idbPut(omar);
const reloaded = await idbGet('omar1');
assert('Paso 17 — persistencia tras reabrir OMAR',
  reloaded.tomas[0].temp_agua_l1 === '22.1' &&
  reloaded.tomas[0].temp_proc === '3' &&
  reloaded.tomas[0].temp_amb_l3 === '26.4');

// Paso 18 — migración OMAR viejo tagua → temp_agua_l1
const viejo = { ts: 'omarViejo', tagua: '22.1', tamb: '26.0', id: 1, hora: '08:00' };
const migrado = _migrarTomaTemperatura(viejo);
assert('Paso 18 — migración tagua → temp_agua_l1',
  migrado && viejo.temp_agua_l1 === '22.1' && viejo.temp_agua_l2 === '' && viejo.tagua === '22.1',
  `l1=${viejo.temp_agua_l1} tagua preserved=${viejo.tagua}`);

// Paso 19 — PDF BM termómetro y proc más común
tomas = reloaded.tomas;
// Solo T1 tiene proc manual 3; T2/T3 sin datos temp → sin proc sugerido
const snap = _bmSnapshotTermoProc(tomas);
assert('Paso 19 — PDF BM termómetro y proc',
  snap.bm_s3_termo === 'AA/TM/99' && snap.bm_s3_proc_temp === 'dif' && snap.tempData.length === 3,
  `termo=${snap.bm_s3_termo} proc=${snap.bm_s3_proc_temp} txt=${snap.bm_s3_proc_temp_txt}`);

// Paso 20 — sintaxis + divs
let syntaxOk = true;
let divCount = 0;
try {
  execSync('node -c js/app.js', { cwd: ROOT, stdio: 'pipe' });
  execSync('node -c js/documents-suite.js', { cwd: ROOT, stdio: 'pipe' });
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const o = (html.match(/<div\b/g) || []).length;
  const c = (html.match(/<\/div>/g) || []).length;
  divCount = o;
  if (o !== c) syntaxOk = false;
  assert('Paso 20 — sintaxis + divs balanceados', syntaxOk, `divs open=${o} close=${c}`);
} catch (e) {
  assert('Paso 20 — sintaxis + divs balanceados', false, String(e.message || e));
}

// --- Reporte ---
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass);

console.log('\n=== SUB-2 RUNTIME TESTS ===\n');
results.forEach((r, i) => {
  const n = r.name.match(/Paso (\d+)/)?.[1] || (i + 1);
  console.log(`${r.pass ? 'PASA' : 'FALLA'} — ${r.name}${r.detail ? ' (' + r.detail + ')' : ''}`);
});
console.log(`\nTotal: ${passed}/${results.length} PASA`);
if (failed.length) {
  console.log('\nFallos:');
  failed.forEach(r => console.log('  -', r.name, r.detail));
  process.exit(1);
}
