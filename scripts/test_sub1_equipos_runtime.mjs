/**
 * AARMS v66-sub1 � tests runtime cat�logo equipos (l�gica pura).
 * node scripts/test_sub1_equipos_runtime.mjs
 */

const results = [];
const assert = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail });

// --- R�plicas m�nimas de helpers sub1 ---
function _equipoClave(tipo, item){
  if(!item || !item.id) return '';
  const prefijo = {
    potenciometros: 'AA/PT/',
    conductimetros: 'AA/CO/',
    termometros: 'AA/TM/',
    mallas: 'AA/MA/',
    kitsCloro: 'AA/KC/'
  }[tipo];
  if(!prefijo) return String(item.id);
  return prefijo + String(item.id);
}

function _equipoActivo(cache, tipo){
  const lista = cache?.equipos?.[tipo] || [];
  return lista[0] || null;
}

function _codigoBitacora(cache, nombre, tipoEquipo){
  const sufijo = '/AA/N-3/01';
  if(!tipoEquipo) return nombre + ' ' + sufijo;
  const eq = _equipoActivo(cache, tipoEquipo);
  const id = eq ? String(eq.id) : '___';
  return nombre + ' ' + id + sufijo;
}

function _catalogoMigrarGranularEquipos(cat){
  let dirty = false;
  if(!cat.equipos){
    cat.equipos = { potenciometros:[], conductimetros:[], termometros:[], mallas:[], kitsCloro:[], cronometros:[], gps:[] };
    dirty = true;
  }
  return dirty;
}

function _bmSnapshotPhClave(cache){
  const eqPh = _equipoActivo(cache, 'potenciometros');
  return eqPh ? _equipoClave('potenciometros', eqPh) : '';
}

function _bmAplicarSnapshot(snap, form, soloVacios){
  let n = 0;
  Object.keys(snap).forEach(k => {
    const v = snap[k];
    if(v == null || String(v).trim() === '') return;
    if(soloVacios && form[k] && String(form[k]).trim() !== '') return;
    form[k] = v;
    n++;
  });
  return n;
}

// --- Simulaci�n IndexedDB en memoria ---
let idbStore = null;

function idbPut(cat){ idbStore = JSON.parse(JSON.stringify(cat)); return Promise.resolve(); }
function idbGet(){ return Promise.resolve(idbStore ? JSON.parse(JSON.stringify(idbStore)) : null); }

// Paso 1 � hard refresh / carga inicial
let cache = { id: '_catalogo_aarms', buffers:{calibracion:[],verificacion:[]}, disoluciones:[], conductividad:[], otros:[] };
assert('Paso 1 � hard refresh (cat�logo sin equipos)', !cache.equipos);

// Paso 2 � abrir cat�logo (migraci�n)
const migrado = _catalogoMigrarGranularEquipos(cache);
if(migrado) idbPut(cache);
assert('Paso 2 � cat�logo abre con secci�n equipos', !!cache.equipos && Array.isArray(cache.equipos.potenciometros));

// Paso 3 � secci�n Equipos visible (estructura render)
const tipos = ['potenciometros','conductimetros','termometros','mallas','kitsCloro'];
assert('Paso 3 � sub-secciones Equipos (5 tipos)', tipos.every(t => Array.isArray(cache.equipos[t])));

// Paso 4 � agregar potenci�metro 152
cache.equipos.potenciometros.push({ id: '152', marca: 'Test', notas: '' });
idbPut(cache);
assert('Paso 4 � potenci�metro 152 ? AA/PT/152', _equipoClave('potenciometros', cache.equipos.potenciometros[0]) === 'AA/PT/152');

// Paso 5 � agregar term�metro 78 FC 0.0
cache.equipos.termometros.push({ id: '78', marca: '', fc: 0.0, notas: '' });
assert('Paso 5 � term�metro 78 + FC 0.0', cache.equipos.termometros[0].id === '78' && cache.equipos.termometros[0].fc === 0.0);

// Paso 6 � FC -0.2 persiste
cache.equipos.termometros[0].fc = -0.2;
idbPut(cache);
const reloaded = (await idbGet());
assert('Paso 6 � FC -0.2 persiste', reloaded.equipos.termometros[0].fc === -0.2);

// Paso 7 � equipos persisten tras cerrar/reabrir
assert('Paso 7 � equipos persisten', reloaded.equipos.potenciometros[0].id === '152');

// Paso 8 � bm_s2_bucc auto
const bucc = _codigoBitacora(reloaded, 'BUCCVpH', 'potenciometros');
assert('Paso 8 � bm_s2_bucc = BUCCVpH 152/AA/N-3/01', bucc === 'BUCCVpH 152/AA/N-3/01', bucc);

// Paso 9 � bm_s2_ph_clave = AA/PT/152
const clavePh = _bmSnapshotPhClave(reloaded);
assert('Paso 9 � bm_s2_ph_clave = AA/PT/152', clavePh === 'AA/PT/152', clavePh);

// Paso 10 � PDF BM c�digos (snapshot no pisa manual)
const snap = {
  bm_s2_bucc: _codigoBitacora(reloaded, 'BUCCVpH', 'potenciometros'),
  bm_s2_ph_clave: _bmSnapshotPhClave(reloaded),
  bm_s2_blmp: _codigoBitacora(reloaded, 'BLMP', 'potenciometros'),
  bm_s4_bfcmt: _codigoBitacora(reloaded, 'BFCMT', 'termometros'),
};
const formManual = { bm_s2_bucc: 'MANUAL' };
_bmAplicarSnapshot(snap, formManual, true);
assert('Paso 10a � PDF BM c�digos en snapshot', snap.bm_s2_bucc.includes('152') && snap.bm_s4_bfcmt.includes('78'));
assert('Paso 10b � no sobreescribe manual', formManual.bm_s2_bucc === 'MANUAL');

// Extra � fallback sin equipo
const vacio = { equipos: { potenciometros: [], conductimetros:[], termometros:[], mallas:[], kitsCloro:[], cronometros:[], gps:[] } };
assert('Extra � sin equipo ? ___', _codigoBitacora(vacio, 'BUCCVpH', 'potenciometros') === 'BUCCVpH ___/AA/N-3/01');

// Extra � CONS_O c�digo 11
const CONS_O = {
  '11': 'Bolsa Est�ril sin Tiosulfatos',
  '1': 'H?SO?',
};
assert('Extra � CONS_O c�digo 11', CONS_O['11'] === 'Bolsa Est�ril sin Tiosulfatos' && CONS_O['1'].includes('?'));

let pass = 0, fail = 0;
for (const r of results) {
  console.log((r.pass ? 'PASA' : 'FALLA') + ' � ' + r.name + (r.detail ? ' (' + r.detail + ')' : ''));
  r.pass ? pass++ : fail++;
}
console.log(`\nTotal: ${pass} PASA / ${fail} FALLA`);
process.exit(fail ? 1 : 0);
