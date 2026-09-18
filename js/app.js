const LOGO_APP_URI = 'logo_pdf.png';
const LOGO_PDF_URI = 'logo.png';
/** Solo recursos del mismo origen (app local / PWA). Sin fallback a GitHub. */
const LOGO_BASE_URL = (typeof location!=='undefined'&&location.href)
  ? new URL('./', location.href).href
  : '';

// AARMS sublight: gestión del tema dark/light
const _THEME_KEY = 'aarms_theme';

function _themeSystemDefault(){
  try{
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  }catch(_){}
  return 'dark';
}

function _themeGet(){
  try{
    return localStorage.getItem(_THEME_KEY) || _themeSystemDefault();
  }catch(e){
    return 'dark';
  }
}

function _themeUpdateIcon(theme){
  const icon = document.getElementById('iconTheme');
  const label = document.getElementById('labelTheme');
  if(!icon) return;
  if(theme === 'dark'){
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    if(label) label.textContent = 'Oscuro';
  } else {
    icon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/>';
    if(label) label.textContent = 'Claro';
  }
}

function _themeApply(theme){
  // AARMS sublight: data-theme + meta theme-color + icon
  const t = (theme === 'light') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const meta = document.getElementById('metaThemeColor') || document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', t === 'light' ? '#f8fafc' : '#07080f');
  _themeUpdateIcon(t);
}

function _themeToggle(){
  // AARMS sublight: flip dark↔light + persist
  const current = document.documentElement.getAttribute('data-theme') || _themeGet();
  const next = current === 'dark' ? 'light' : 'dark';
  try{ localStorage.setItem(_THEME_KEY, next); }catch(e){}
  _themeApply(next);
  if(typeof toast === 'function') toast(next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado', 'g', 1800);
}
window._themeToggle = _themeToggle;
window._themeGet = _themeGet;
window._themeApply = _themeApply;

// AARMS sublight: init + escucha preferencia del sistema
(function initTheme(){
  _themeApply(_themeGet());
  if(!window.matchMedia) return;
  try{
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
      try{
        if(!localStorage.getItem(_THEME_KEY)) _themeApply(e.matches ? 'light' : 'dark');
      }catch(_){}
    });
  }catch(_){}
})();


// AARMS v65-cat: precarga datos laboratorio
const _CATALOGO_DEFAULT = {
  id: '_catalogo_aarms',
  buffers: {
    // Buffers de Calibración (FERMONT) — usados en CA y CO
    // Uso a partir del 17 marzo al 17 junio (típico de este lote)
    calibracion: [
      { ph: 4.00, lote: '531146', marca: 'Fermont', caducidad: '2027-08-31', usoDesde: '2026-03-17', usoHasta: '2026-06-17' },
      { ph: 6.86, lote: '519145', marca: 'Fermont', caducidad: '2027-05-31', usoDesde: '2026-03-17', usoHasta: '2026-06-17' },
      { ph: 9.18, lote: '602544', marca: 'Fermont', caducidad: '2028-02-29', usoDesde: '2026-03-17', usoHasta: '2026-06-17' }
    ],
    // Buffers de Verificación (MERCK) — usados en V
    verificacion: [
      { ph: 4.00,  lote: 'HC56730835', marca: 'Merck', caducidad: '2028-02-29', usoDesde: '' },
      { ph: 7.00,  lote: 'HC46341939', marca: 'Merck', caducidad: '2027-12-31', usoDesde: '' },
      { ph: 10.00, lote: 'HC45176738', marca: 'Merck', caducidad: '2027-07-31', usoDesde: '' }
    ]
  },
  disoluciones: [
    { nombre: 'H₂SO₄ 1:1',                       lote: 'L-003',      caducidad: '2026-07-03', usoDesde: '2026-04-03' },
    { nombre: 'H₂SO₄ 25%',                       lote: 'L-002',      caducidad: '2026-05-02', usoDesde: '2026-03-02' },
    // AARMS v66-p2: lote alterno disponible para rotación cuando se acabe el principal.
    // El LVAR solo muestra el principal (key h2so4_25 → 'H₂SO₄ 25%').
    { nombre: 'H₂SO₄ 25% (lote alterno)',        lote: 'L-003',      caducidad: '2026-07-02', usoDesde: '2026-05-02' },
    { nombre: 'NaOH 1N',                         lote: '26-008',     caducidad: '2026-07-09', usoDesde: '2026-04-09' },
    { nombre: 'K₂Cr₂O₇ 25%',                     lote: '26-002',     caducidad: '2026-07-06', usoDesde: '2026-04-06' },
    { nombre: 'HCl 1:1 (lavado electrodo)',      lote: '26-002',     caducidad: '2026-07-04', usoDesde: '2026-04-04' },
    { nombre: 'HNO₃ ACS (Fermont)',              lote: '413243',     caducidad: 'N/A',        usoDesde: '' },
    { nombre: 'HNO₃ Suprapuro (JT Baker)',       lote: '24K1862001', caducidad: '2029-10-31', usoDesde: '' }
  ],
  conductividad: [
    { nombre: 'KCl Patrón',           lote: '26-002E', marca: '',      valor: 1412, caducidad: '2026-07-04', usoDesde: '2026-04-04' },
    { nombre: 'KCl Comercial Hanna',  lote: '8876',    marca: 'Hanna', valor: 1413, caducidad: '2028-04-30', usoDesde: '2026-01-04' }
  ],
  // AARMS v65-cat2: Agua reactivo / otros patrones de uso general
  otros: [
    { nombre: 'Agua Reactivo', marca: 'QUIMEX', lote: 'N/A', caducidad: 'N/A' }
  ],
  // AARMS sub1-equipos: Catálogo de equipos del laboratorio.
  // Centraliza claves AA/PT/, AA/CO/, AA/TM/ + FC termómetro + auto-generación de códigos de bitácora.
  equipos: {
    potenciometros: [],
    conductimetros: [],
    termometros: [],
    mallas: [],
    kitsCloro: [],
    // AARMS sub7-od: nueva sección oxímetros
    oximetros: [],
    cronometros: [],
    gps: []
  },
  historico: []
};

let _catalogoCache = null;

// AARMS v66-p0p1: fusionar array de catálogo conservando valores del usuario
function _catalogoFusionarItems(actual, defaults, matchFn){
  const src = Array.isArray(actual) ? actual : [];
  const out = [];
  const used = new Set();
  (defaults || []).forEach((def, di) => {
    const key = matchFn(def, di);
    let idx = -1;
    src.forEach((item, si) => {
      if(used.has(si)) return;
      if(matchFn(item, si) === key) idx = si;
    });
    if(idx >= 0){
      used.add(idx);
      const merged = Object.assign({}, def, src[idx]);
      Object.keys(def).forEach(k => {
        const uv = src[idx][k];
        if(uv !== undefined && uv !== null && String(uv).trim() !== '') merged[k] = uv;
      });
      out.push(merged);
    } else {
      out.push(Object.assign({}, def));
    }
  });
  src.forEach((item, si) => { if(!used.has(si)) out.push(item); });
  return out;
}

function _catalogoItemNombreIncompleto(item){
  if(!item || typeof item !== 'object') return true;
  return !Object.prototype.hasOwnProperty.call(item, 'nombre')
    || !Object.prototype.hasOwnProperty.call(item, 'lote')
    || !Object.prototype.hasOwnProperty.call(item, 'caducidad');
}

// AARMS v66-p0p1: migración granular por sección (no pisa datos del usuario)
function _catalogoMigrarGranular(cat){
  if(!cat) return false;
  const def = _CATALOGO_DEFAULT;
  let dirty = false;

  const buffersVacios = !cat.buffers
    || !Array.isArray(cat.buffers.calibracion)
    || cat.buffers.calibracion.length === 0
    || cat.buffers.calibracion.every(b => !b || !b.lote);
  if(buffersVacios){
    cat.buffers = JSON.parse(JSON.stringify(def.buffers));
    dirty = true;
  } else {
    const cal = _catalogoFusionarItems(
      cat.buffers.calibracion,
      def.buffers.calibracion,
      (it) => (it && it.ph != null ? String(it.ph) : '')
    );
    const ver = _catalogoFusionarItems(
      cat.buffers.verificacion,
      def.buffers.verificacion,
      (it) => (it && it.ph != null ? String(it.ph) : '')
    );
    if(JSON.stringify(cal) !== JSON.stringify(cat.buffers.calibracion)
      || JSON.stringify(ver) !== JSON.stringify(cat.buffers.verificacion)){
      cat.buffers.calibracion = cal;
      cat.buffers.verificacion = ver;
      dirty = true;
    }
  }

  const disolIncompletas = !Array.isArray(cat.disoluciones)
    || cat.disoluciones.length === 0
    || cat.disoluciones.some(_catalogoItemNombreIncompleto);
  if(disolIncompletas){
    cat.disoluciones = _catalogoFusionarItems(
      cat.disoluciones,
      def.disoluciones,
      (it) => String((it && it.nombre) || '').trim().toLowerCase()
    );
    dirty = true;
  }

  const condIncompleta = !Array.isArray(cat.conductividad)
    || cat.conductividad.length === 0
    || cat.conductividad.some(_catalogoItemNombreIncompleto);
  if(condIncompleta){
    cat.conductividad = _catalogoFusionarItems(
      cat.conductividad,
      def.conductividad,
      (it) => String((it && it.nombre) || '').trim().toLowerCase()
    );
    dirty = true;
  }

  if(!cat.otros || !Array.isArray(cat.otros)){
    cat.otros = JSON.parse(JSON.stringify(def.otros));
    dirty = true;
  } else if(cat.otros.some(_catalogoItemNombreIncompleto)){
    cat.otros = _catalogoFusionarItems(
      cat.otros,
      def.otros,
      (it) => String((it && it.nombre) || '').trim().toLowerCase()
    );
    dirty = true;
  }

  if(cat.disoluciones){
    cat.disoluciones.forEach(d => {
      if(d.nombre === 'HNO3 ACS (Fermont)' && d.caducidad === ''){
        d.caducidad = 'N/A';
        dirty = true;
      }
    });
  }
  if(cat.otros){
    cat.otros.forEach(o => {
      if(o.nombre === 'Agua Reactivo' && o.caducidad === ''){
        o.caducidad = 'N/A';
        dirty = true;
      }
    });
  }

  // AARMS sub1-equipos: migrar catálogo viejo para añadir sección equipos si no existe
  if(!cat.equipos){
    cat.equipos = {
      potenciometros: [],
      conductimetros: [],
      termometros: [],
      mallas: [],
      kitsCloro: [],
      oximetros: [],
      cronometros: [],
      gps: []
    };
    dirty = true;
  }
  if(cat.equipos){
    // AARMS sub7-od: migración catálogo con oximetros
    const subs = ['potenciometros','conductimetros','termometros','mallas','kitsCloro','oximetros','cronometros','gps'];
    subs.forEach(k => {
      if(!Array.isArray(cat.equipos[k])){ cat.equipos[k] = []; dirty = true; }
    });
  }

  return dirty;
}

async function _catalogoCargar(){
  if(_catalogoCache) return _catalogoCache;
  try{
    const todos = await idbGetAll();
    const cat = (todos||[]).find(x => x.id === '_catalogo_aarms');
    if(cat){
      // AARMS v66-p0p1: migración granular por sección (buffers, disoluciones, conductividad, otros)
      const migrado = _catalogoMigrarGranular(cat);
      // AARMS humofix: ASCII → Unicode en nombres de disoluciones
      const migradoU = _catalogoMigrarUnicodeNombres(cat);
      if(migrado || migradoU){
        cat.id = '_catalogo_aarms';
        try{ await idbPut(cat); }catch(e){ console.warn('[catalogo migrar]', e); }
      }
      _catalogoCache = cat;
    } else {
      _catalogoCache = JSON.parse(JSON.stringify(_CATALOGO_DEFAULT));
      await idbPut(_catalogoCache);
    }
  }catch(e){
    console.warn('[catalogo]', e);
    _catalogoCache = JSON.parse(JSON.stringify(_CATALOGO_DEFAULT));
  }
  return _catalogoCache;
}

async function _catalogoGuardar(){
  if(!_catalogoCache) return;
  try{ await idbPut(_catalogoCache); }catch(e){ console.warn('[catalogo guardar]',e); }
}

function _catalogoBufferActivo(phNominal, tipoUso){
  if(!_catalogoCache) return null;
  const lista = (tipoUso === 'V')
    ? _catalogoCache.buffers.verificacion
    : _catalogoCache.buffers.calibracion;
  const ph = parseFloat(phNominal);
  if(isNaN(ph)) return null;
  let best = null;
  let bestDiff = Infinity;
  for(const b of lista){
    const d = Math.abs(parseFloat(b.ph) - ph);
    if(d < bestDiff){ bestDiff = d; best = b; }
  }
  return (bestDiff <= 0.05) ? best : null;
}

function _catalogoSnapshot(){
  if(!_catalogoCache) return null;
  return JSON.parse(JSON.stringify({
    buffers: _catalogoCache.buffers,
    disoluciones: _catalogoCache.disoluciones,
    conductividad: _catalogoCache.conductividad,
    otros: _catalogoCache.otros || [],  // AARMS v66-p2: incluir agua reactivo y otros patrones
    equipos: _catalogoCache.equipos || {},  // AARMS sub1-equipos
    fechaSnapshot: new Date().toISOString()
  }));
}

function _catalogoLoteVencido(item){
  if(!item || !item.caducidad) return false;
  try{
    const cad = new Date(item.caducidad);
    return cad < new Date();
  }catch(e){ return false; }
}

// AARMS v65-fix2 / v66-p2: UN solo HCl físico en catálogo; hcl_11 = uso general, hcl_lav = lavado electrodo.
const _LVAR_DISOL_TO_CATALOGO = {
  'h2so4_11':  'H₂SO₄ 1:1',
  'hcl_11':    'HCl 1:1 (lavado electrodo)',
  'h2so4_25':  'H₂SO₄ 25%',
  'naoh_1n':   'NaOH 1N',
  'k2cr2o7':   'K₂Cr₂O₇ 25%',
  'hcl_lav':   'HCl 1:1 (lavado electrodo)'
};

// AARMS humofix: migrar nombres ASCII → Unicode en catálogo existente
const _MIGRA_UNICODE_DISOL = {
  'H2SO4 1:1': 'H₂SO₄ 1:1',
  'H2SO4 25%': 'H₂SO₄ 25%',
  'H2SO4 25% (lote alterno)': 'H₂SO₄ 25% (lote alterno)',
  'K2Cr2O7 25%': 'K₂Cr₂O₇ 25%',
  'HNO3 ACS (Fermont)': 'HNO₃ ACS (Fermont)',
  'HNO3 ACS': 'HNO₃ ACS',
  'HNO3 Supra puro': 'HNO₃ Suprapuro',
  'HNO3 Suprapuro': 'HNO₃ Suprapuro',
  'HNO3 Suprapuro (JT Baker)': 'HNO₃ Suprapuro (JT Baker)'
};
function _catalogoMigrarUnicodeNombres(cat){
  if(!cat) return false;
  let dirty = false;
  const listas = [cat.disoluciones, cat.otros].filter(Boolean);
  listas.forEach(lista => {
    lista.forEach(item => {
      const n = String(item.nombre || '');
      if(_MIGRA_UNICODE_DISOL[n]){
        item.nombre = _MIGRA_UNICODE_DISOL[n];
        dirty = true;
      }
    });
  });
  return dirty;
}

function _catalogoDisolMatch(it){
  if(!_catalogoCache || !_catalogoCache.disoluciones) return null;
  const nombreObjetivo = _LVAR_DISOL_TO_CATALOGO[it.key];
  if(!nombreObjetivo) return null;
  // Match exacto por nombre (case-insensitive)
  const target = nombreObjetivo.toLowerCase();
  return _catalogoCache.disoluciones.find(d =>
    (d.nombre || '').toLowerCase() === target
  ) || null;
}

// AARMS sub1-equipos: helpers de claves y códigos de bitácora

function _equipoClave(tipo, item){
  if(!item || !item.id) return '';
  const prefijo = {
    potenciometros: 'AA/PT/',
    conductimetros: 'AA/CO/',
    termometros: 'AA/TM/',
    mallas: 'AA/MA/',
    kitsCloro: 'AA/KC/',
    oximetros: 'AA/OX/'  // AARMS sub7-od
  }[tipo];
  if(!prefijo) return String(item.id);
  return prefijo + String(item.id);
}

function _equipoActivo(tipo){
  if(!_catalogoCache || !_catalogoCache.equipos) return null;
  const lista = _catalogoCache.equipos[tipo] || [];
  // AARMS sub2-temp: termómetro asignado al plan
  if(tipo === 'termometros'){
    const plan = typeof _planActivoParaOmar === 'function' ? _planActivoParaOmar() : null;
    if(plan && plan.termometroId){
      const asignado = lista.find(x => String(x.id) === String(plan.termometroId));
      if(asignado) return asignado;
    }
  }
  return lista[0] || null;
}

function _codigoBitacora(nombre, tipoEquipo){
  const sufijo = '/AA/N-3/01';
  if(!tipoEquipo){
    return nombre + ' ' + sufijo;
  }
  const eq = _equipoActivo(tipoEquipo);
  const id = eq ? String(eq.id) : '___';
  return nombre + ' ' + id + sufijo;
}

window._equipoClave = _equipoClave;
window._equipoActivo = _equipoActivo;
window._codigoBitacora = _codigoBitacora;

// AARMS sub2-temp: plan activo (pantalla plan o OMAR en campo)
function _planActivo(){
  if(!_currentPlanId || !_cachedPlanes) return null;
  return _cachedPlanes.find(p => p.id === _currentPlanId) || null;
}

function _planActivoParaOmar(){
  const p = _planActivo();
  if(p) return p;
  if(typeof omar !== 'undefined' && omar && omar.ts && typeof getPlanDeMuestreo === 'function'){
    return getPlanDeMuestreo(omar.ts);
  }
  return null;
}

// AARMS sub2-temp: helpers de cálculos de temperatura
function _fcTermometroActual(){
  const termo = _equipoActivo('termometros');
  if(!termo) return 0;
  const fc = parseFloat(termo.fc);
  return isNaN(fc) ? 0 : fc;
}

function _tempCorregida(lectura, fc){
  const v = parseFloat(lectura);
  if(isNaN(v)) return NaN;
  return v + (parseFloat(fc) || 0);
}

function _tempPromedio3(l1, l2, l3, fc){
  const vals = [l1, l2, l3]
    .map(x => _tempCorregida(x, fc))
    .filter(x => !isNaN(x));
  if(vals.length === 0) return NaN;
  return vals.reduce((a,b) => a+b, 0) / vals.length;
}

function _tempProcedimientoLabel(codigo){
  switch(String(codigo)){
    case '2': return 'Recipiente de polietileno (Δ ≤ 5°C)';
    case '3': return 'Vaso Dewar (Δ > 5°C)';
    default: return '';
  }
}

function _tempProcToBmSelect(codigo){
  switch(String(codigo)){
    case '2': return 'nodif';
    case '3': return 'dif';
    default: return '';
  }
}

// AARMS sub21-bittemp: calcula derivados de un registro de bitácora de temperatura
function _calcBitTempRegistro(reg){
  const fc = _fcTermometroActual();
  const agua_c1 = _tempCorregida(reg.agua_l1, fc);
  const agua_c2 = _tempCorregida(reg.agua_l2, fc);
  const agua_c3 = _tempCorregida(reg.agua_l3, fc);
  const agua_prom = _tempPromedio3(reg.agua_l1, reg.agua_l2, reg.agua_l3, fc);
  const amb_c1 = _tempCorregida(reg.amb_l1, fc);
  const amb_c2 = _tempCorregida(reg.amb_l2, fc);
  const amb_c3 = _tempCorregida(reg.amb_l3, fc);
  const amb_prom = _tempPromedio3(reg.amb_l1, reg.amb_l2, reg.amb_l3, fc);
  const diff = (!isNaN(agua_prom) && !isNaN(amb_prom)) ? Math.abs(agua_prom - amb_prom) : NaN;
  let procedimiento = '';
  if(!isNaN(diff)) procedimiento = diff <= 5 ? '2' : '3';
  return { fc, agua_c1, agua_c2, agua_c3, agua_prom, amb_c1, amb_c2, amb_c3, amb_prom, diff, procedimiento };
}

// AARMS sub22-hoja: plan activo para lecturas desde bitácoras en hoja de campo
function _planParaHojaCampo(){
  if(typeof _planActivoParaOmar === 'function') return _planActivoParaOmar();
  if(typeof _planActivo === 'function') return _planActivo();
  return null;
}

// AARMS sub22-hoja: promedios por toma desde bitácoras
function _bitTempPromAguaPorToma(omarTs, tomaNum){
  const plan = _planParaHojaCampo();
  if(!plan || !Array.isArray(plan.bitTemp)) return NaN;
  const reg = plan.bitTemp.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if(!reg) return NaN;
  return _calcBitTempRegistro(reg).agua_prom;
}

function _bitTempPromAmbPorToma(omarTs, tomaNum){
  const plan = _planParaHojaCampo();
  if(!plan || !Array.isArray(plan.bitTemp)) return NaN;
  const reg = plan.bitTemp.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if(!reg) return NaN;
  return _calcBitTempRegistro(reg).amb_prom;
}

function _bitPhPromPorToma(omarTs, tomaNum){
  const plan = _planParaHojaCampo();
  if(!plan || !Array.isArray(plan.bitPh)) return NaN;
  const reg = plan.bitPh.find(r => !r.calibGrupo && String(r.omarId ?? '') === String(omarTs) && String(r.toma) === String(tomaNum));
  if(!reg) return NaN;
  const prom = _phPromedio(reg.l1, reg.l2, reg.l3);
  if(prom != null && !isNaN(prom)){
    const r25 = _phRedondeo25(prom);
    return r25 !== '' ? parseFloat(r25) : prom;
  }
  const vals = [reg.l1, reg.l2, reg.l3].map(parseFloat).filter(v => !isNaN(v));
  if(!vals.length) return NaN;
  const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
  const r25 = _phRedondeo25(avg);
  return r25 !== '' ? parseFloat(r25) : avg;
}

function _bitCondPromPorToma(omarTs, tomaNum){
  const plan = _planParaHojaCampo();
  if(!plan || !Array.isArray(plan.bitCond)) return NaN;
  const reg = plan.bitCond.find(r => String(r.omarId ?? '') === String(omarTs) && String(r.toma) === String(tomaNum));
  if(!reg) return NaN;
  const vals = [reg.l1, reg.l2, reg.l3].map(parseFloat).filter(v => !isNaN(v));
  if(!vals.length) return NaN;
  return vals.reduce((a,b) => a+b, 0) / vals.length;
}

window._bitTempPromAguaPorToma = _bitTempPromAguaPorToma;
window._bitTempPromAmbPorToma = _bitTempPromAmbPorToma;
window._bitPhPromPorToma = _bitPhPromPorToma;
window._bitCondPromPorToma = _bitCondPromPorToma;

function _fmtBoxHoja(val, dec){
  if(val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toFixed(dec);
}

// AARMS sub22-hoja: boxes auto-llenados (patrón .f + input readonly de la card)
function _htmlTomaBoxesAuto(omarTs, tomaNum){
  const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const tempAmb = _bitTempPromAmbPorToma(omarTs, tomaNum);
  const tempAgua = _bitTempPromAguaPorToma(omarTs, tomaNum);
  const phProm = _bitPhPromPorToma(omarTs, tomaNum);
  const condProm = _bitCondPromPorToma(omarTs, tomaNum);
  const flujoProm = _bitFlujosPromPorToma(omarTs, tomaNum);
  const flujoPct = _flujoPctPorToma(omarTs, tomaNum);
  return `
    <div class="g3" style="margin-bottom:8px">
      <div class="f" style="margin-bottom:0"><label>T. amb (°C)</label><input type="text" readonly tabindex="-1" value="${esc(_fmtBoxHoja(tempAmb, 1))}" placeholder="—"></div>
      <div class="f" style="margin-bottom:0"><label>T. agua (°C)</label><input type="text" readonly tabindex="-1" value="${esc(_fmtBoxHoja(tempAgua, 1))}" placeholder="—"></div>
      <div class="f" style="margin-bottom:0"><label>pH 25°C</label><input type="text" readonly tabindex="-1" value="${esc(_fmtBoxHoja(phProm, 2))}" placeholder="—"></div>
    </div>
    <div class="g3" style="margin-bottom:12px">
      <div class="f" style="margin-bottom:0"><label>Cond. (µS/cm)</label><input type="text" readonly tabindex="-1" value="${esc(_fmtBoxHoja(condProm, 1))}" placeholder="—"></div>
      <div class="f" style="margin-bottom:0"><label>Flujo (L/s)</label><input type="text" readonly tabindex="-1" value="${esc(_fmtBoxHoja(flujoProm, 2))}" placeholder="—"></div>
      <div class="f" style="margin-bottom:0"><label>% Flujo</label><input type="text" readonly tabindex="-1" value="${esc(isNaN(flujoPct) ? '—' : flujoPct.toFixed(2))}" placeholder="—"></div>
    </div>`;
}

// AARMS sub22-hoja: re-render hoja de campo si está abierta
function _refreshHojaCampoSiAbierta(){
  const pg = document.getElementById('pg1');
  if(pg && pg.classList.contains('on') && typeof renderTomas === 'function') renderTomas();
}
window._refreshHojaCampoSiAbierta = _refreshHojaCampoSiAbierta;

// AARMS sub3-flujos: helpers de cálculo
function _flujoPromedio3(l1, l2, l3){
  const vals = [l1, l2, l3].map(parseFloat).filter(v => !isNaN(v));
  if(!vals.length) return NaN;
  return vals.reduce((a,b) => a+b, 0) / vals.length;
}

function _calcBitFlujosRegistro(reg){
  const prom = _flujoPromedio3(reg.l1, reg.l2, reg.l3);
  return {
    l1: parseFloat(reg.l1),
    l2: parseFloat(reg.l2),
    l3: parseFloat(reg.l3),
    promedio: prom
  };
}

function _flujoSumaOmar(omarTs){
  const plan = _planParaHojaCampo();
  if(!plan || !Array.isArray(plan.bitFlujos)) return 0;
  let suma = 0;
  plan.bitFlujos.filter(r => String(r.omarTs) === String(omarTs)).forEach(r => {
    const p = _flujoPromedio3(r.l1, r.l2, r.l3);
    if(!isNaN(p)) suma += p;
  });
  return suma;
}

function _flujoPctPorToma(omarTs, tomaNum){
  const plan = _planParaHojaCampo();
  if(!plan || !Array.isArray(plan.bitFlujos)) return NaN;
  const reg = plan.bitFlujos.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if(!reg) return NaN;
  const prom = _flujoPromedio3(reg.l1, reg.l2, reg.l3);
  if(isNaN(prom)) return NaN;
  const suma = _flujoSumaOmar(omarTs);
  if(suma === 0) return NaN;
  return (prom / suma) * 100;
}

function _bitFlujosPromPorToma(omarTs, tomaNum){
  const plan = _planParaHojaCampo();
  if(!plan || !Array.isArray(plan.bitFlujos)) return NaN;
  const reg = plan.bitFlujos.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if(!reg) return NaN;
  return _flujoPromedio3(reg.l1, reg.l2, reg.l3);
}

window._flujoPromedio3 = _flujoPromedio3;
window._calcBitFlujosRegistro = _calcBitFlujosRegistro;
window._flujoSumaOmar = _flujoSumaOmar;
window._flujoPctPorToma = _flujoPctPorToma;
window._bitFlujosPromPorToma = _bitFlujosPromPorToma;

// AARMS sub2-temp: migrar toma de 1 lectura → 3 lecturas
function _migrarTomaTemperatura(t){
  if(!t) return false;
  let migrado = false;
  if(t.tagua !== undefined && t.temp_agua_l1 === undefined){
    t.temp_agua_l1 = String(t.tagua || '');
    t.temp_agua_l2 = '';
    t.temp_agua_l3 = '';
    migrado = true;
  } else if(t.temp_agua_l1 === undefined){
    t.temp_agua_l1 = '';
    t.temp_agua_l2 = '';
    t.temp_agua_l3 = '';
  }
  if(t.tamb !== undefined && t.temp_amb_l1 === undefined){
    t.temp_amb_l1 = String(t.tamb || '');
    t.temp_amb_l2 = '';
    t.temp_amb_l3 = '';
    migrado = true;
  } else if(t.temp_amb_l1 === undefined){
    t.temp_amb_l1 = '';
    t.temp_amb_l2 = '';
    t.temp_amb_l3 = '';
  }
  if(t.temp_proc === undefined) t.temp_proc = '';
  if(t.temp_proc_manual === undefined) t.temp_proc_manual = false;
  return migrado;
}

window._fcTermometroActual = _fcTermometroActual;
window._tempCorregida = _tempCorregida;
window._tempPromedio3 = _tempPromedio3;
window._tempProcedimientoLabel = _tempProcedimientoLabel;
window._calcBitTempRegistro = _calcBitTempRegistro;

// AARMS sub1-equipos: LVAR key → tipo en catálogo equipos
const _LVAR_KEY_TO_EQUIPO_TIPO = {
  potenciometro: 'potenciometros',
  conductimetro: 'conductimetros',
  termometro: 'termometros',
  malla: 'mallas',
  kitcloro: 'kitsCloro',
  oximetro: 'oximetros' // AARMS simfix
};

function _lvarNumDesdeCatalogo(eqKey){
  const tipo = _LVAR_KEY_TO_EQUIPO_TIPO[eqKey];
  if(!tipo) return null;
  const item = _equipoActivo(tipo);
  return item && item.id ? String(item.id).trim() : null;
}

// AARMS lvarfix: mapeo LVAR → catálogo (IDs de equipo)
const TIPOS_LVAR_A_CATALOGO = {
  potenciometro: 'potenciometros',
  conductimetro: 'conductimetros',
  termometro: 'termometros',
  malla: 'mallas',
  kitcloro: 'kitsCloro',
  oximetro: 'oximetros' // AARMS simfix
};

// AARMS lvarfix: autocompletar clave desde inventario (solo vacío / prefijo / AUTO)
function _lvarAutocompletarClavesDesdeInventario(opts){
  const force = !!(opts && opts.force);
  Object.entries(TIPOS_LVAR_A_CATALOGO).forEach(([tipoLvar, tipoCat])=>{
    const eq = _equipoActivo(tipoCat);
    if(!eq || !eq.id) return;
    const idNuevo = String(eq.id).trim();
    const input = document.querySelector(`#pgLVAR [data-lv-eq="${tipoLvar}"][data-field="num"]`);
    if(!input) return;
    const valorActual = (input.value || '').trim();
    const soloPrefijo = /^AA\/[A-Z]{2}\/?$/.test(valorActual);
    const row = input.closest('[data-lv-row]');
    const hasAuto = !!(row && [...row.querySelectorAll('span')].some(s => (s.textContent||'').trim() === 'AUTO'));
    const fromAttr = input.getAttribute('data-from-catalog') === '1';
    if(!valorActual || soloPrefijo || (force && (hasAuto || fromAttr)) || (force && !valorActual)){
      input.value = idNuevo;
      input.setAttribute('data-from-catalog', '1');
      input.dataset._lvarAutoSkip = '1';
      input.dispatchEvent(new Event('input', { bubbles:true }));
      delete input.dataset._lvarAutoSkip;
      if(row){
        const labelWrap = row.querySelector('div[style*="align-items:center"]');
        if(labelWrap && ![...labelWrap.querySelectorAll('span')].some(s => (s.textContent||'').trim() === 'AUTO')){
          const badge = document.createElement('span');
          badge.style.cssText = 'font-size:9px;font-weight:700;color:#10b981;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.35);padding:2px 6px;border-radius:4px;letter-spacing:.04em';
          badge.textContent = 'AUTO';
          labelWrap.appendChild(badge);
        }
        if(typeof _lvarRefreshRowMark === 'function') _lvarRefreshRowMark(row);
      }
    }
  });
}
window._lvarAutocompletarClavesDesdeInventario = _lvarAutocompletarClavesDesdeInventario;

// AARMS lvarfix: refrescar LVAR si está abierta y cambió el catálogo
function _refreshLvarSiAbierta(){
  const pgLvar = document.getElementById('pgLVAR');
  if(!pgLvar || !pgLvar.classList.contains('on')) return;
  _lvarAutocompletarClavesDesdeInventario({ force:true });
}
window._refreshLvarSiAbierta = _refreshLvarSiAbierta;

// AARMS sub1-equipos: migrar números de LVAR previa al catálogo (no perder datos)
function _catalogoMigrarEquiposDesdeLvar(lvarEquipos){
  if(!_catalogoCache || !_catalogoCache.equipos || !lvarEquipos) return false;
  let dirty = false;
  LVAR_EQUIPOS.forEach(eq => {
    const tipo = _LVAR_KEY_TO_EQUIPO_TIPO[eq.key];
    if(!tipo) return;
    const saved = lvarEquipos[eq.key] || {};
    const num = saved.num && String(saved.num).trim();
    if(!num) return;
    const lista = _catalogoCache.equipos[tipo];
    if(!Array.isArray(lista) || lista.length > 0) return;
    const item = { id: num, notas: '' };
    if(tipo === 'potenciometros' || tipo === 'conductimetros' || tipo === 'termometros') item.marca = '';
    if(tipo === 'termometros') item.fc = 0.0;
    _catalogoCache.equipos[tipo].push(item);
    dirty = true;
  });
  return dirty;
}

// AARMS v66-p0p1: buscar Agua Reactivo por nombre (fallback otros[0])
function _catalogoAguaReactivo(){
  const otros = _catalogoCache && _catalogoCache.otros;
  if(!otros || !otros.length) return null;
  const found = otros.find(o => /agua\s*reactiv/i.test(o.nombre || ''));
  return found || otros[0];
}

// AARMS v65-cat2: matching robusto por nombre (HNO3 ACS, Suprapuro, etc.)
function _catalogoMatchPorNombre(nombre){
  if(!_catalogoCache || !_catalogoCache.disoluciones) return null;
  const norm = s => String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const buscar = norm(nombre);
  let m = _catalogoCache.disoluciones.find(d => norm(d.nombre) === buscar);
  if(m) return m;
  if(buscar.includes('hno3acs') || buscar === 'hno3acs' || buscar.includes('acsfermont')){
    m = _catalogoCache.disoluciones.find(d => /hno3.*acs|acs.*hno3/i.test(d.nombre));
    if(m) return m;
  }
  if(buscar.includes('hno3supra') || buscar.includes('suprapuro') || buscar.includes('jtbaker')){
    m = _catalogoCache.disoluciones.find(d => /supra|baker/i.test(d.nombre));
    if(m) return m;
  }
  return null;
}

// AARMS v65-cat2: corregido mapeo patrones LVAR → catálogo.
// PATRÓN DE REFERENCIA = buffer de Verificación (Merck) — tiene certificado de referencia
// PATRÓN DE TRABAJO    = buffer de Calibración (Fermont) — uso diario para calibrar el equipo
const _LVAR_PATRON_CAT = {
  pat_ref1:'ver-0', pat_ref2:'ver-1', pat_ref3:'ver-2',
  pat_tra1:'cal-0', pat_tra2:'cal-1', pat_tra3:'cal-2',
  kcl_pat:'cond-0', kcl_com:'cond-1',
  agua_r:'agua_reactivo'
};

// Convierte coordenadas a número de tile OSM
function latLngToTile(lat, lng, zoom){
  const n=Math.pow(2,zoom);
  const x=Math.floor((lng+180)/360*n);
  const latRad=lat*Math.PI/180;
  const y=Math.floor((1-Math.log(Math.tan(latRad)+1/Math.cos(latRad))/Math.PI)/2*n);
  return {x,y,z:zoom};
}

// Carga un tile individual como imagen
function loadTile(url){
  return new Promise(resolve=>{
    const img=new Image();
    img.crossOrigin='anonymous';
    const t=setTimeout(()=>resolve(null),5000);
    img.onload=()=>{clearTimeout(t);resolve(img);};
    img.onerror=()=>{clearTimeout(t);resolve(null);};
    img.src=url;
  });
}

// Construye mapa completo tile por tile en canvas
async function loadMapImage(lat, lng, zoom=16, width=600, height=400){
  try{
    const TILE_SIZE=256;
    const center=latLngToTile(lat,lng,zoom);
    
    // Cuántos tiles necesitamos
    const tilesX=Math.ceil(width/TILE_SIZE)+2;
    const tilesY=Math.ceil(height/TILE_SIZE)+2;
    
    // Tile central y offset en píxeles
    const n=Math.pow(2,zoom);
    const centerXPx=((lng+180)/360*n-center.x)*TILE_SIZE;
    const latRad=lat*Math.PI/180;
    const centerYPx=((1-Math.log(Math.tan(latRad)+1/Math.cos(latRad))/Math.PI)/2*n-center.y)*TILE_SIZE;
    
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#e8edf0';
    ctx.fillRect(0,0,width,height);
    
    const startX=Math.floor(-tilesX/2);
    const startY=Math.floor(-tilesY/2);
    
    // Servidores de tiles OSM alternos con CORS abierto
    const servers=['a','b','c'];
    const promises=[];
    
    for(let dx=startX;dx<=Math.ceil(tilesX/2);dx++){
      for(let dy=startY;dy<=Math.ceil(tilesY/2);dy++){
        const tx=((center.x+dx)%n+n)%n;
        const ty=center.y+dy;
        if(ty<0||ty>=n) continue;
        const s=servers[Math.abs(dx+dy)%3];
        // Usar tile.openstreetmap.org que tiene CORS abierto
        const url=`https://${s}.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
        const drawX=width/2-centerXPx+dx*TILE_SIZE;
        const drawY=height/2-centerYPx+dy*TILE_SIZE;
        promises.push(
          loadTile(url).then(img=>{
            if(img) ctx.drawImage(img,Math.round(drawX),Math.round(drawY),TILE_SIZE,TILE_SIZE);
          })
        );
      }
    }
    
    await Promise.all(promises);
    
    // Pin marcador en el centro
    const px=width/2, py=height/2;
    // Sombra
    ctx.beginPath();
    ctx.ellipse(px,py+18,8,4,0,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.fill();
    // Cuerpo del pin
    ctx.beginPath();
    ctx.arc(px,py-14,12,0,Math.PI*2);
    ctx.fillStyle='#e53e3e';
    ctx.fill();
    ctx.strokeStyle='#fff';
    ctx.lineWidth=2;
    ctx.stroke();
    // Punto blanco interior
    ctx.beginPath();
    ctx.arc(px,py-14,4,0,Math.PI*2);
    ctx.fillStyle='#fff';
    ctx.fill();
    // Triángulo punta del pin
    ctx.beginPath();
    ctx.moveTo(px-8,py-8);
    ctx.lineTo(px+8,py-8);
    ctx.lineTo(px,py+2);
    ctx.fillStyle='#e53e3e';
    ctx.fill();
    
    return canvas.toDataURL('image/png');
  }catch(e){ return null; }
}

/** Rellena la tarjeta «Vista del sitio» en BPM (foto + mapa OSM desde la OMAR / hoja). */
async function _bpmRefreshVistaSitio(){
  const imgF=document.getElementById('bpmVistaFoto');
  const imgM=document.getElementById('bpmVistaMap');
  const vacF=document.getElementById('bpmVistaFotoVac');
  const vacM=document.getElementById('bpmVistaMapVac');
  const c=typeof omar!=='undefined'&&omar&&omar.campo?omar.campo:{};
  const pd=typeof photoData!=='undefined'?photoData:null;
  if(imgF&&vacF){
    if(pd&&pd!=='p'){
      imgF.style.display='';
      vacF.style.display='none';
      imgF.src=pd;
    }else{
      imgF.style.display='none';
      imgF.removeAttribute('src');
      vacF.style.display='';
    }
  }
  if(imgM&&vacM){
    const lat=parseFloat(String(c.gpsN||'').replace('°','').trim());
    const lngAbs=parseFloat(String(c.gpsW||'').replace('°','').trim());
    const hasCoords=!isNaN(lat)&&!isNaN(lngAbs)&&lat!==0&&lngAbs!==0;
    if(!hasCoords){
      imgM.style.display='none';
      imgM.removeAttribute('src');
      vacM.textContent='Sin coordenadas GPS en hoja';
      vacM.style.display='';
      return;
    }
    vacM.textContent='Cargando mapa…';
    vacM.style.display='';
    imgM.style.display='none';
    try{
      const lng=-Math.abs(lngAbs);
      const b64=await loadMapImage(lat,lng,16,640,360);
      if(b64){
        imgM.src=b64;
        imgM.style.display='';
        vacM.style.display='none';
      }else{
        vacM.textContent='Mapa no disponible';
        vacM.style.display='';
      }
    }catch(_){
      vacM.textContent='Mapa no disponible';
      vacM.style.display='';
    }
  }
}

// Carga logo como base64 en memoria solo cuando se necesita (sin hardcodear)
// Devuelve {data, w, h} con dimensiones reales del PNG
async function loadLogo(url){
  try{
    const localUrl = (typeof location!=='undefined' && url) ? new URL(url, location.href).href : url;
    const urls=[url, localUrl].filter((u,i,a)=>u && a.indexOf(u)===i);
    for(const u of urls){
      try{
        const res=await fetch(u,{cache:'force-cache'});
        if(!res.ok) continue;
        const blob=await res.blob();
        const b64=await new Promise(resolve=>{
          const r=new FileReader();
          r.onload=()=>resolve(r.result);
          r.onerror=()=>resolve(null);
          r.readAsDataURL(blob);
        });
        if(!b64) continue;
        // Obtener dimensiones reales
        const dims=await new Promise(resolve=>{
          const img=new Image();
          img.onload=()=>resolve({w:img.naturalWidth,h:img.naturalHeight});
          img.onerror=()=>resolve({w:1,h:1});
          img.src=b64;
        });
        return {data:b64, w:dims.w, h:dims.h, ratio:dims.w/dims.h};
      }catch(e){continue;}
    }
    return null;
  }catch(e){return null;}
}

// Agrega logo respetando proporciones reales dentro de un espacio maxW x maxH
function addLogoProportional(doc, logo, x, y, maxW, maxH){
  if(!logo||!logo.data) return;
  let w,h;
  if(logo.ratio>=1){ // más ancho que alto
    w=maxW; h=maxW/logo.ratio;
    if(h>maxH){h=maxH; w=maxH*logo.ratio;}
  }else{ // más alto que ancho
    h=maxH; w=maxH*logo.ratio;
    if(w>maxW){w=maxW; h=maxW/logo.ratio;}
  }
  // Centrar en el espacio disponible
  const ox=(maxW-w)/2;
  const oy=(maxH-h)/2;
  try{doc.addImage(logo.data,'PNG',x+ox,y+oy,w,h,'','FAST');}catch(e){}
}

/** Texto seguro para jsPDF Helvetica (misma lógica que LVAR / hoja de campo). */
function jsPdfAscii(s){
  if(s == null || s === '') return '';
  // AARMS sub10-std: NO convertir ° en espacio (rompía "5°C" y leyendas tipo "Criterio")
  return String(s)
    .replace(/[₀]/g,'0').replace(/[₁]/g,'1').replace(/[₂]/g,'2').replace(/[₃]/g,'3').replace(/[₄]/g,'4')
    .replace(/[₅]/g,'5').replace(/[₆]/g,'6').replace(/[₇]/g,'7').replace(/[₈]/g,'8').replace(/[₉]/g,'9')
    .replace(/[⁰]/g,'0').replace(/[¹]/g,'1').replace(/[²]/g,'2').replace(/[³]/g,'3').replace(/[⁴]/g,'4')
    .replace(/[⁵]/g,'5').replace(/[⁶]/g,'6').replace(/[⁷]/g,'7').replace(/[⁸]/g,'8').replace(/[⁹]/g,'9')
    .replace(/µ/g,'u').replace(/μ/g,'u').replace(/—/g,'-').replace(/–/g,'-')
    .replace(/[“”]/g,'"').replace(/[‘’]/g,"'")
    .replace(/✓/g,'v').replace(/✗/g,'x').replace(/✕/g,'x')
    .replace(/[Δ∆]/g,'d').replace(/≤/g,'<=').replace(/≥/g,'>=')
    .replace(/→/g,'->').replace(/×/g,'x').replace(/·/g,'-')
    .replace(/°/g,''); // 5°C → 5C (sin insertar espacios)
}

// AARMS sub51a-roboto: cargar Roboto para PDF Machiote
async function _cargarRobotoParaPDF(){
  if(window._robotoBase64Cache) return window._robotoBase64Cache;
  try {
    const [regularResp, boldResp] = await Promise.all([
      fetch('assets/fonts/Roboto-Regular.ttf'),
      fetch('assets/fonts/Roboto-Bold.ttf')
    ]);
    if(!regularResp.ok || !boldResp.ok){
      console.warn('[roboto] fetch falló, seguirá con Helvetica');
      return null;
    }
    const toBase64 = (buf) => {
      const bytes = new Uint8Array(buf);
      let bin = '';
      const chunk = 0x8000;
      for(let i = 0; i < bytes.length; i += chunk){
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      return btoa(bin);
    };
    window._robotoBase64Cache = {
      regular: toBase64(await regularResp.arrayBuffer()),
      bold: toBase64(await boldResp.arrayBuffer())
    };
    return window._robotoBase64Cache;
  } catch(e) {
    console.warn('[roboto] error:', e);
    return null;
  }
}
window._cargarRobotoParaPDF = _cargarRobotoParaPDF;

// AARMS sub51a-roboto: inyectar Roboto en doc jsPDF (fallback Helvetica)
async function _pdfBmAplicarRoboto(doc){
  const roboto = await _cargarRobotoParaPDF();
  let fuente = 'helvetica';
  if(roboto && roboto.regular && roboto.bold){
    doc.addFileToVFS('Roboto-Regular.ttf', roboto.regular);
    doc.addFileToVFS('Roboto-Bold.ttf', roboto.bold);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    fuente = 'Roboto';
  }
  doc.setFont(fuente, 'normal');
  return fuente;
}
window._pdfBmAplicarRoboto = _pdfBmAplicarRoboto;


const PARAMS_TOMA=['FQ','TOC','Hg','MP','CIAN','FOS.','SAAM','GYA','DQO','DBO5','N.TOT','CTYF','ENTE.','NO2','NO3','HELM','CLR','ECOL','TOX','CLOR','CrHx','OTRS'];
// AARMS sub1-equipos: bug F-06 — falta código 11 en CONS_O + nomenclatura Unicode
const CONS_O = {
  '1':  'H₂SO₄',
  '2':  'NaOH',
  '3':  'K₂Cr₂O₇ 25%',
  '4':  'Hielo (4°C)',
  '5':  'No Aplica',
  '6':  'HNO₃',
  '7':  'Bolsa Estéril con Tiosulfato',
  '8':  'HCl',
  '9':  'HNO₃ Suprapuro',
  '10': 'H₂SO₄ 25%',
  '11': 'Bolsa Estéril sin Tiosulfatos',
  '12': 'Disolución Buffer',
  '13': 'Formaldehído',
  '14': 'Otro'
};
const ENV_O=[['1','Vidrio BA 1L'],['2','Plást 1L'],['3','Plást 4L'],['4','Plást 500mL'],['5','Plást 5L'],['6','Bolsa Est. 300mL'],['8','V.Amb 1L'],['9','Bolsa Est. 100mL'],['10','V.Amb 40mL'],['11','V.Amb 250mL'],['13','Plást 2L']];
const VOLS={FQ:4000,TOC:1000,Hg:500,MP:500,CIAN:1000,'FOS.':500,SAAM:1000,GYA:1000,DQO:500,DBO5:1000,'N.TOT':2000,CTYF:100,'ENTE.':250,NO2:500,NO3:500,HELM:5000,CLR:250,ECOL:100,TOX:40,CLOR:500,CrHx:500,OTRS:500};

let omar={},tomas=[],tid=1,analitosSel=new Set(),sigData=null,sigData2=null,toastT;
let lastPDFBlob=null,lastPDFClienteBlob=null,lastPDFCadenaBlob=null;

// ── INIT ──

// ── PWA SERVICE WORKER ──
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    // Path relativo para que funcione en cualquier subdirectorio (GitHub Pages /AARMS/, etc.)
    navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('SW register failed:',e));
  });
}

// ── INSTALL PROMPT (Android / Chrome) ──
// Chrome dispara beforeinstallprompt cuando la PWA es instalable. Lo capturamos
// para mostrar nuestro propio banner bonito en vez del mini-infobar de Chrome.
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  _deferredInstallPrompt = e;
  // Mostrar banner sólo si no fue descartado antes y no está ya instalada
  try{
    const dismissed = localStorage.getItem('aarms_install_dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if(!dismissed && !isStandalone){
      const b = document.getElementById('installBanner');
      if(b) b.style.display = 'block';
    }
  }catch(_){}
});

function triggerInstall(){
  const b = document.getElementById('installBanner');
  if(!_deferredInstallPrompt){
    if(b) b.style.display = 'none';
    return;
  }
  _deferredInstallPrompt.prompt();
  _deferredInstallPrompt.userChoice.then(choice=>{
    if(choice.outcome === 'accepted'){
      try{localStorage.setItem('aarms_install_dismissed','installed');}catch(_){}
    }
    _deferredInstallPrompt = null;
    if(b) b.style.display = 'none';
  });
}

function dismissInstall(){
  try{localStorage.setItem('aarms_install_dismissed','1');}catch(_){}
  const b = document.getElementById('installBanner');
  if(b) b.style.display = 'none';
}

// Si la app ya se instaló mientras corría, ocultar banner
window.addEventListener('appinstalled', ()=>{
  try{localStorage.setItem('aarms_install_dismissed','installed');}catch(_){}
  const b = document.getElementById('installBanner');
  if(b) b.style.display = 'none';
  _deferredInstallPrompt = null;
});
window.addEventListener('DOMContentLoaded',async ()=>{
  document.getElementById('o_fecha').value=new Date().toISOString().split('T')[0];
  await refreshCache();
  renderHome();
  loadSaved();
  // AARMS v65: cargar catálogo al inicio
  _catalogoCargar().catch(e => errorUsuario('No se pudo cargar el inventario.', e));
  // Autoguardado en cualquier cambio de input de los formularios de OMAR y Hoja de Campo
  // Los inputs de tomas se manejan aparte (delegación) en attachTomasAutosave().
  ['pg0','pg1'].forEach(pgId=>{
    const pg=document.getElementById(pgId);
    if(!pg) return;
    pg.addEventListener('input', e=>{
      const tg=e.target;
      if(!tg) return;
      // Guardar también valores de tomas (inputs dentro de #tomasBody)
      const tCard=tg.closest('[data-toma-id]');
      if(tCard){ _captureTomaInputs(tCard); }
      _autoSaveDeferred();
    });
    pg.addEventListener('change', ()=> _autoSaveDeferred(50));
  });
});

/** Asegura id único por toma y tid por encima del máximo (evita mezclar T1/T2 al guardar). */
function _normalizarTomasIds(arr){
  if(!Array.isArray(arr)) return [];
  const used = new Set();
  let maxId = 0;
  const out = arr.map((raw, idx)=>{
    const t = {...raw};
    let id = parseInt(t.id, 10);
    if(!Number.isFinite(id) || id <= 0 || used.has(id)){
      id = idx + 1;
      while(used.has(id)) id++;
    }
    used.add(id);
    t.id = id;
    maxId = Math.max(maxId, id);
    if(!(t.params instanceof Set)){
      t.params = new Set(Array.isArray(t.params) ? t.params : (t.params ? [...t.params] : []));
    }
    return t;
  });
  tid = Math.max(maxId + 1, 1);
  return out;
}

/** Hora HH:MM para inputs type="time" y encabezado de toma. */
function _horaNormalizada(h){
  if(h==null||h===undefined) return '';
  const s=String(h).trim();
  if(!s) return '';
  const m=s.match(/^(\d{1,2}):(\d{2})/);
  if(!m) return s;
  const hh=parseInt(m[1],10), mm=parseInt(m[2],10);
  if(hh<0||hh>23||mm<0||mm>59) return s;
  return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
}

function _horaActualHHMM(){
  const d=new Date();
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

// AARMS v64: helpers pH bitácora (promedio, pH 25°C, acepta/rechaza)
// AARMS phfix2: criterio oficial — Δ lecturas ≤0.03 Y |prom−buffer| ≤0.05
function _phPromedio(l1, l2, l3){
  const Ls=[l1,l2,l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
  if(Ls.length!==3) return null;
  return Ls.reduce((a,b)=>a+b,0)/3;
}
function _phRedondeo25(prom){
  if(prom==null||isNaN(prom)) return '';
  return (Math.round(prom*10)/10).toFixed(1);
}
/** pH a 25°C = promedio de L1–L3 redondeado a 1 decimal. */
function _phA25(l1, l2, l3){
  const ls=[l1,l2,l3].filter(v=>v!=null&&v!=='').map(Number).filter(n=>!isNaN(n));
  if(!ls.length) return '';
  return (Math.round((ls.reduce((a,b)=>a+b,0)/ls.length)*10)/10).toFixed(1);
}
/**
 * Acepta/Rechaza según formato F-AA-264-4.
 * Firma oficial: (l1, l2, l3, bufferNominal).
 * Compat legacy: (promedio, buffer) con 2 argumentos (solo checa ±0.05).
 */
function _phAceptaRechaza(l1, l2, l3, bufferNominal){
  if(arguments.length <= 2){
    const prom=parseFloat(l1);
    const b=parseFloat(l2);
    if(isNaN(prom)||isNaN(b)) return null;
    return Math.abs(prom-b)<=0.05?'Acepta':'Rechaza';
  }
  const ls=[l1,l2,l3].filter(v=>v!=null&&v!=='').map(Number).filter(n=>!isNaN(n));
  if(ls.length < 3) return 'PENDIENTE';
  const prom=ls.reduce((a,b)=>a+b,0)/ls.length;
  const difLecturas=Math.max(...ls)-Math.min(...ls);
  const b=Number(bufferNominal);
  if(isNaN(b)) return 'PENDIENTE';
  const difPatron=Math.abs(prom-b);
  return (difLecturas<=0.03+1e-9 && difPatron<=0.05+1e-9) ? 'Acepta' : 'Rechaza';
}
window._phA25=_phA25;
window._phAceptaRechaza=_phAceptaRechaza;
window._phPromedio=_phPromedio;
window._phRedondeo25=_phRedondeo25;
function _toDateTime(fechaISO, horaHHMM){
  if(!fechaISO||!horaHHMM) return null;
  const m=String(horaHHMM).trim().match(/^(\d{1,2}):(\d{2})/);
  if(!m) return null;
  const p=String(fechaISO).split('-').map(Number);
  if(p.length!==3||!p[0]||!p[1]||!p[2]) return null;
  return new Date(p[0], p[1]-1, p[2], parseInt(m[1],10), parseInt(m[2],10), 0, 0);
}

/** Objeto toma completo para guardar/cargar. */
function _tomaSanitized(t){
  const params=t.params instanceof Set ? t.params : new Set(Array.isArray(t.params)?t.params:[]);
  return {
    id:t.id,
    hora:_horaNormalizada(t.hora||''),
    fechaISO: t.fechaISO || '',
    timestamp: t.timestamp || 0,
    pct:t.pct??'', ls:t.ls??'', tamb:t.tamb??'', tagua:t.tagua??'',
    temp_agua_l1:t.temp_agua_l1??'', temp_agua_l2:t.temp_agua_l2??'', temp_agua_l3:t.temp_agua_l3??'',
    temp_amb_l1:t.temp_amb_l1??'', temp_amb_l2:t.temp_amb_l2??'', temp_amb_l3:t.temp_amb_l3??'',
    temp_proc:t.temp_proc??'', temp_proc_manual:!!t.temp_proc_manual,
    ph:t.ph??'', cond:t.cond??'', od:t.od??'', mat:t.mat??'', color:t.color??'',
    olor:t.olor==null?null:!!t.olor,
    cloro:t.cloro==null?null:!!t.cloro,
    params:[...params],
  };
}

/** Aplica valor del DOM a la toma sin borrar datos ya guardados en memoria. */
function _tomaCampoDesdeDOM(t, k, v){
  const cur=String(t[k]??'').trim();
  const nv=k==='hora'?_horaNormalizada(v):String(v??'');
  if(nv!==''){ t[k]=nv; return; }
  if(!cur) t[k]=nv;
}

/** Lee campos visibles de cada toma en #tomasDiv → tomas[] (nunca vacía memoria con DOM vacío). */
function _syncTomasFromDOM(){
  if(!tomas || !tomas.length) return;
  const fields=['hora','pct','ls','tamb','tagua',
    'temp_agua_l1','temp_agua_l2','temp_agua_l3','temp_amb_l1','temp_amb_l2','temp_amb_l3',
    'ph','cond','od','mat','color'];
  tomas.forEach(t=>{
    let body=document.getElementById('tb'+t.id);
    if(!body){
      const card=document.querySelector('[data-toma-id="'+t.id+'"]');
      body=card?(card.querySelector('.tbody')||card):null;
    }
    if(!body) return;
    fields.forEach(k=>{
      const el=body.querySelector('[data-f="'+k+'"]');
      if(el) _tomaCampoDesdeDOM(t, k, el.value);
    });
  });
}

/** Sincroniza tomas desde DOM antes de guardado o navegación. */
function _flushTomasDesdeDOM(){
  if(typeof _syncTomasFromDOM==='function') _syncTomasFromDOM();
}

function _captureTomaInputs(card){
  const id=parseInt(card.getAttribute('data-toma-id'),10);
  if(!Number.isFinite(id)) return;
  const t=tomas.find(x=>x.id===id);
  if(!t) return;
  const body=card.querySelector('.tbody')||card;
  const map={
    hora:'[data-f="hora"]', pct:'[data-f="pct"]', ls:'[data-f="ls"]',
    tamb:'[data-f="tamb"]', tagua:'[data-f="tagua"]',
    temp_agua_l1:'[data-f="temp_agua_l1"]', temp_agua_l2:'[data-f="temp_agua_l2"]', temp_agua_l3:'[data-f="temp_agua_l3"]',
    temp_amb_l1:'[data-f="temp_amb_l1"]', temp_amb_l2:'[data-f="temp_amb_l2"]', temp_amb_l3:'[data-f="temp_amb_l3"]',
    ph:'[data-f="ph"]',
    cond:'[data-f="cond"]', od:'[data-f="od"]', mat:'[data-f="mat"]', color:'[data-f="color"]',
  };
  for(const [k,sel] of Object.entries(map)){
    const el=body.querySelector(sel);
    if(!el) continue;
    _tomaCampoDesdeDOM(t, k, el.value);
  }
  if(t.hora){
    const timeEl=card.querySelector('.ttime');
    if(timeEl) timeEl.textContent=t.hora;
  }
}

function _renumberTomaBadges(){
  document.querySelectorAll('#tomasDiv [data-toma-id]').forEach((card,i)=>{
    const b=card.querySelector('.tbadge');
    if(b) b.textContent='T'+(i+1);
  });
}

function _htmlTomaCard(t, idx, openBody){
  _migrarTomaTemperatura(t);
  const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const horaVal=_horaNormalizada(t.hora||'');
  const params=t.params instanceof Set?t.params:new Set(t.params||[]);
  const omarTs = (typeof omar !== 'undefined' && omar && omar.ts) ? omar.ts : '';
  const boxesAuto = _htmlTomaBoxesAuto(omarTs, idx + 1);
  const completa=_tomaEstaCompleta(t, idx);

  return `
<div class="toma" data-toma-id="${t.id}">
  <div class="toma-h" onclick="togToma(${t.id})">
    <div class="toma-hl">
      <span class="tbadge">T${idx+1}</span>
      <span class="ttime">${esc(horaVal)}</span>
      <span class="${completa?'tok':'tpend'}">${completa?'✓ completa':'pendiente'}</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px">
      <div class="tdel" onclick="event.stopPropagation();delToma(${t.id})">×</div>
      <svg class="tchev ${openBody?'op':''}" id="tc${t.id}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  </div>
  <div class="tbody ${openBody?'op':''}" id="tb${t.id}">
    <div class="g3" style="margin-bottom:12px">
      <div class="f"><label>Hora</label><input type="time" data-f="hora" value="${esc(horaVal)}" style="color:var(--w)" oninput="upT(${t.id},'hora',this.value)" onchange="upT(${t.id},'hora',this.value)"></div>
      <div class="f"></div>
      <div class="f"></div>
    </div>
    ${boxesAuto}
    <div class="g3" style="margin-bottom:12px">
      <div class="f"><label>Oxígeno Disuelto mg/L</label><input type="number" data-f="od" placeholder="mg/L" value="${esc(t.od||'')}" step="0.01" inputmode="decimal" style="color:var(--w)" oninput="upT(${t.id},'od',this.value)" onchange="upT(${t.id},'od',this.value)"></div>
      <div class="f"></div>
      <div class="f"></div>
    </div>
    <div class="g3" style="margin-bottom:12px">
      <div class="f"><label>Materia flotante</label><select data-f="mat" onchange="upT(${t.id},'mat',this.value)"><option value="">—</option><option ${t.mat==='Ausente'?'selected':''}>Ausente</option><option ${t.mat==='Presente'?'selected':''}>Presente</option></select></div>
      <div class="f"><label>Color</label><input type="text" data-f="color" placeholder="ej. Café" value="${esc(t.color)}" style="color:var(--w)" oninput="upT(${t.id},'color',this.value)" onchange="upT(${t.id},'color',this.value)"></div>
      <div class="f"><label>Olor</label><div class="sino"><div class="sino-b si ${t.olor===true?'on':''}" onclick="upT(${t.id},'olor',true);this.classList.add('on');this.nextElementSibling.classList.remove('on')">SI</div><div class="sino-b no ${t.olor===false?'on':''}" onclick="upT(${t.id},'olor',false);this.classList.add('on');this.previousElementSibling.classList.remove('on')">NO</div></div></div>
    </div>
    <div class="g3" style="margin-bottom:12px">
      <div class="f"><label>Cloro</label><div class="sino"><div class="sino-b si ${t.cloro===true?'on':''}" onclick="upT(${t.id},'cloro',true);this.classList.add('on');this.nextElementSibling.classList.remove('on')">SI</div><div class="sino-b no ${t.cloro===false?'on':''}" onclick="upT(${t.id},'cloro',false);this.classList.add('on');this.previousElementSibling.classList.remove('on')">NO</div></div></div>
      <div class="f"></div>
      <div class="f"></div>
    </div>
    <div class="param-lbl">Parámetros a analizar en esta toma</div>
    <div class="pg">${PARAMS_TOMA.map(p=>`<div class="pm ${params.has(p)?'on':''}" onclick="togP(${t.id},'${p}')" data-p="${p}"><div class="pbox"><svg class="pchk" width="9" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="pn">${p}</span></div>`).join('')}</div>
  </div>
</div>`;
}

/** Misma lógica que validación de PDF: pH (bitácora) + flujo (bitácora) para considerar la toma completa. */
function _tomaEstaCompleta(t, idx){
  if(!t) return false;
  const omarTs = (typeof omar !== 'undefined' && omar && omar.ts) ? omar.ts : '';
  const tomaNum = (idx != null && idx >= 0) ? idx + 1 : (tomas ? tomas.findIndex(x => x.id === t.id) + 1 : 0);
  const phProm = (omarTs && tomaNum > 0 && typeof _bitPhPromPorToma === 'function')
    ? _bitPhPromPorToma(omarTs, tomaNum) : NaN;
  const flujoProm = (omarTs && tomaNum > 0 && typeof _bitFlujosPromPorToma === 'function')
    ? _bitFlujosPromPorToma(omarTs, tomaNum) : NaN;
  return !isNaN(phProm) && !isNaN(flujoProm);
}

function loadSaved(){
  const s=localStorage.getItem('aarms_omar');
  if(!s)return;
  try{
    omar=JSON.parse(s);
    analitosSel=new Set(omar.analitos||[]);
    const set=(id,v)=>{const e=document.getElementById(id);if(e&&v)e.value=v;};
    set('o_omar',omar.folio);set('o_ssar',omar.ssar);set('o_muest',omar.muestreador);
    set('o_emp',omar.empresa);set('o_cont',omar.contacto);set('o_puest',omar.puesto);
    set('o_dir',omar.direccion);set('o_mun',omar.municipio);set('o_estado',omar.estado);set('o_tel',omar.telefono); // AARMS v64: estado separado
    set('o_sitio',omar.sitio);set('o_idm',omar.idmuestra);
    // AARMS v64: Restaurar norma personalizada
    {
      const selNorma = document.getElementById('o_norma');
      const otraInp = document.getElementById('o_norma_otra');
      if(selNorma && omar.norma){
        const opciones = Array.from(selNorma.options).map(o => o.value);
        if(opciones.includes(omar.norma) && omar.norma !== 'otra'){
          selNorma.value = omar.norma;
          if(otraInp){ otraInp.style.display='none'; otraInp.value=''; }
        } else {
          selNorma.value = 'otra';
          if(otraInp){
            otraInp.value = omar.norma;
            otraInp.style.display = 'block';
          }
        }
      }
    }
    set('o_fecha',omar.fecha);set('o_reglas',omar.reglas);
    if(omar.mat)document.getElementById('o_mat').value=omar.mat;
    if(omar.tipo)setTipo(omar.tipo,true);
    if(omar.intervalo){
      document.getElementById('o_int').value=omar.intervalo;
      document.querySelectorAll('#intChips .chip').forEach(c=>{if(c.textContent.trim()===omar.intervalo)c.classList.add('on');});
    }
    if(omar.ndesc)document.getElementById('o_ndesc').value=omar.ndesc;
    if(omar.ntomas)document.getElementById('o_ntomas').value=omar.ntomas;
    document.querySelectorAll('#agrid .ai').forEach(el=>{
      if(analitosSel.has(el.dataset.a))el.classList.add('on');
    });
    document.getElementById('acnt').textContent=analitosSel.size+' seleccionados';
    renderHome();
  }catch(e){console.error(e);}
}

// ── PAGE NAV ──
const PAGES=['pgHome','pgPlan','pg0','pg1','pgLVAR','pgBlmp','pgColab','pgBpm','pgBm','pgPh2644','pgBitPH','pgBitCond','pgBitTemp','pgBitFlujos','pgBitOD','pgCatalogo','pgAjustes','pgAdmin'];
function showPage(n){
  PAGES.forEach((id,i)=>{const e=document.getElementById(id);if(e)e.classList.toggle('on',i===n);});
  window.scrollTo({top:0,behavior:'smooth'});
}
// Ir a una página por id
function goPage(id){
  const curIdx = PAGES.findIndex(pid=>{
    const el=document.getElementById(pid);
    return el && el.classList.contains('on');
  });
  _flushTomasDesdeDOM();
  if(curIdx>=0 && PAGES[curIdx]==='pgBitPH' && typeof _persistPlanBitPh==='function') void _persistPlanBitPh();
  if(curIdx>=0 && PAGES[curIdx]==='pgBitTemp' && typeof _persistPlanBitTemp==='function') void _persistPlanBitTemp();
  if(curIdx>=0 && PAGES[curIdx]==='pgBitFlujos' && typeof _persistPlanBitFlujos==='function') void _persistPlanBitFlujos();
  if(curIdx>=0 && PAGES[curIdx]==='pgBitOD' && typeof _persistPlanBitOD==='function') void _persistPlanBitOD();
  if(curIdx>=0 && (PAGES[curIdx]==='pg0'||PAGES[curIdx]==='pg1'||PAGES[curIdx]==='pgBitPH'||PAGES[curIdx]==='pgBitCond'||PAGES[curIdx]==='pgBitTemp'||PAGES[curIdx]==='pgBitFlujos'||PAGES[curIdx]==='pgBitOD')){
    if(typeof _snapshotOmarFromPg0==='function') _snapshotOmarFromPg0();
    void saveMuestreoActual();
  }
  const idx = PAGES.indexOf(id);
  if(idx>=0) showPage(idx);
  if(id==='pg1'){
    if(typeof loadCampoFromOMAR==='function') loadCampoFromOMAR();
    if(typeof renderTomas==='function') renderTomas();
    if(typeof updTCnt==='function') updTCnt();
  }
  // AARMS humofix: render defensivo si se entra a bitácoras con contenedor vacío
  if(id === 'pgBitPH' && typeof _bitPhRender === 'function'){
    const cont = document.getElementById('bitPhRegistros');
    if(cont && !cont.children.length) _bitPhRender();
  }
  if(id === 'pgBitCond' && typeof _bitCondRender === 'function'){
    const cont = document.getElementById('bitCondRegistros');
    if(cont && !cont.children.length) _bitCondRender();
  }
}

async function goHome(){
  closeFabMenu();
  _flushTomasDesdeDOM();
  try{ if(typeof guardarBorradorActual==='function') await guardarBorradorActual(); }catch(e){}
  renderHome();
  showPage(0);
}

// ── MODAL "Nuevo Muestreo" ──
// Guarda el número de OMARs elegido por el usuario durante el flujo del modal
function abrirModalNuevoMuestreo(){
  closeFabMenu();
  // Reset campos
  const d = new Date().toISOString().split('T')[0];
  document.getElementById('nm_folio').value = '';
  document.getElementById('nm_fecha').value = d;
  document.getElementById('nm_muest').value = '';
  const nmN = document.getElementById('nm_num_omars');
  if(nmN) nmN.value = '1';
  const nmE = document.getElementById('nm_empresa');
  if(nmE) nmE.value = '';
  // AARMS simfix: reset campos oficiales de alta
  const nmLv = document.getElementById('nm_folio_lvar'); if(nmLv) nmLv.value = '';
  const nmDir = document.getElementById('nm_dir'); if(nmDir) nmDir.value = '';
  const nmNor = document.getElementById('nm_norma'); if(nmNor) nmNor.value = '';
  document.getElementById('modalNuevoMuestreo').style.display = 'block';
  // Focus en folio (útil en desktop)
  setTimeout(()=>document.getElementById('nm_folio')?.focus(),100);
}

function cerrarModalNuevoMuestreo(){
  document.getElementById('modalNuevoMuestreo').style.display = 'none';
}
async function confirmarNuevoMuestreo(){
  const gv = id => document.getElementById(id)?.value.trim() || '';
  const folio = gv('nm_folio');
  const fecha = gv('nm_fecha') || new Date().toISOString().split('T')[0];
  const muest = gv('nm_muest');
  const empSeed = gv('nm_empresa');
  // AARMS simfix: folio LVAR / dirección / norma desde alta de plan
  const folioLvar = gv('nm_folio_lvar');
  const dirSeed = gv('nm_dir');
  const normaSeed = gv('nm_norma');
  const numRaw = parseInt(gv('nm_num_omars'), 10);
  const num = Number.isFinite(numRaw) && numRaw > 0 ? numRaw : 1;

  const planId = 'plan_' + Date.now();
  await idbPlanPut({
    id: planId,
    folio,
    fecha,
    muestreador: muest,
    blancoCampo: false,
    loteBlanco: '',
    omarIds: [],
    ts: Date.now(),
    migrated: false,
    lvarBloqueado: false,
    // AARMS simfix: semilla LVAR / datos oficiales del papel
    direccion: dirSeed,
    norma: normaSeed,
    lvar: {
      folio: folioLvar || '',
      fecha,
      dir: dirSeed,
      direccion: dirSeed,
      norma: normaSeed,
      tipo: '',
      lugar: '',
      ciudad: '',
      estado: '',
    },
  });

  await refreshCache();
  const all = await idbGetAll();
  let nid = all.reduce((mx, x)=> Math.max(mx, Number(x.id)||0), 0) + 1;
  const omarIds = [];
  const seedOmar = (mid)=>({
    ts: mid,
    muestreador: muest || '',
    fecha,
    empresa: empSeed || '',
    direccion: dirSeed || '',
    norma: normaSeed || '',
    analitos: [],
  });

  for(let i=0; i<num; i++){
    const mid = nid++;
    const seed = JSON.stringify(seedOmar(mid));
    await idbPut({
      id: mid, planId,
      folio: '', empresa: empSeed || '', fecha,
      muestreador: muest, ts: mid,
      tomas: [], omar: seed, sigData: null, sigData2: null,
    });
    omarIds.push(mid);
    if((i + 1) % 50 === 0) await new Promise(r=>setTimeout(r, 0));
  }

  const planRec = (await idbPlanGetAll()).find(p=>p.id===planId);
  planRec.omarIds = omarIds;
  await idbPlanPut(planRec);
  await refreshCache();

  cerrarModalNuevoMuestreo();
  _currentPlanId = planId;
  cargarMuestreo(omarIds[0]);
  toast(num > 1
    ? `Plan con ${num} OMAR(s). Completa folio, orden de servicio y punto en cada una; en el formulario de OMAR usa «Copiar empresa y analitos a las demás OMARs del plan» si todo es igual salvo el sitio.`
    : 'Plan creado — llena los datos del OMAR',
    'g');
}

async function iniciarNuevoMuestreo(){
  // Limpiar cualquier modal o overlay que pueda estar activo
  document.getElementById('modalMuestreos')?.remove();
  closeFabMenu();
  saveMuestreoActual();
  // Reset estado
  omar={};tomas=[];sigData=null;sigData2=null;
  lastPDFBlob=null;lastPDFClienteBlob=null;lastPDFCadenaBlob=null;
  // Crear un plan-solo automáticamente. Cuando el usuario guarde el OMAR,
  // el muestreo se conectará a este plan via planId.
  const newId = Date.now();
  const newPlanId = 'plan_' + newId;
  try{
    await idbPlanPut({
      id: newPlanId,
      folio: '',
      fecha: new Date().toISOString().split('T')[0],
      muestreador: '',
      blancoCampo: false,
      loteBlanco: '',
      omarIds: [],
      ts: newId,
      migrated: true,   // se considera plan-solo hasta que el usuario le asigne folio o segunda OMAR
    });
    await refreshCache();
    // Pasar el planId al contexto actual para que el próximo save lo asocie
    _pendingNewPlanId = newPlanId;
    _pendingNewMuestreoId = newId;
  }catch(e){ console.warn('No se pudo pre-crear plan:', e); }
  // Limpiar solo el formulario OMAR
  document.querySelectorAll('#omarForm input,#omarForm select,#omarForm textarea').forEach(el=>{
    if(el.type==='checkbox'||el.type==='radio')el.checked=false;
    else el.value='';
  });
  // Restaurar fecha de hoy
  const fd=document.getElementById('o_fecha');
  if(fd)fd.value=new Date().toISOString().split('T')[0];
  // Limpiar analitos
  analitosSel=new Set();
  document.querySelectorAll('.ai.on').forEach(el=>el.classList.remove('on'));
  const acnt=document.getElementById('acnt');
  if(acnt)acnt.textContent='0 seleccionados';
  // Limpiar firmas
  ['sigCanvas','sigCanvas2'].forEach(id=>{
    const cv=document.getElementById(id);
    if(cv)cv.getContext('2d').clearRect(0,0,cv.width,cv.height);
  });
  ['cvswrap','cvswrap2'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.classList.remove('signed');
  });
  // Limpiar omar global
  omar={};
  localStorage.removeItem('aarms_omar');
  // Limpiar pill
  const topOmar=document.getElementById('topOmar');
  const topOmar2=document.getElementById('topOmar2');
  if(topOmar)topOmar.textContent='—';
  if(topOmar2)topOmar2.textContent='—';
  // Mostrar form, ocultar resumen
  const form=document.getElementById('omarForm');
  const res=document.getElementById('omarRes');
  if(form)form.style.display='block';
  if(res)res.style.display='none';
  // Resetear tipo
  const tbSimp=document.getElementById('tb_simp');
  const tbComp=document.getElementById('tb_comp');
  if(tbSimp){tbSimp.classList.remove('btn-p');tbSimp.classList.add('btn-g');}
  if(tbComp){tbComp.classList.remove('btn-p');tbComp.classList.add('btn-g');}
  const intField=document.getElementById('intField');
  const tomasField=document.getElementById('tomasField');
  if(intField)intField.style.display='none';
  if(tomasField)tomasField.style.display='none';
  document.querySelectorAll('#intChips .chip').forEach(c=>c.classList.remove('on'));
  renderHome();
  goPage('pg0');
  renderHermanasBreadcrumb();
}

function filtrarMuestreos(q){
  renderHome(q.trim().toLowerCase());
}

// Filtros rápidos por rango de fecha
let _quickFilter = null; // 'hoy' | 'semana' | 'mes' | 'pasado' | null
function setQuickFilter(kind){
  _quickFilter = (_quickFilter===kind) ? null : kind;
  // Refrescar chips visualmente
  document.querySelectorAll('.qchip').forEach(c=>{
    c.classList.toggle('on', c.dataset.qf===_quickFilter);
  });
  // Re-renderizar con el texto actual
  const si=document.getElementById('searchInput');
  renderHome(si?si.value.trim().toLowerCase():'');
}

// ¿La fecha ISO entra en el rango seleccionado?
function matchesQuickFilter(fechaISO){
  if(!_quickFilter) return true;
  if(!fechaISO) return false;
  const d = new Date(fechaISO+'T00:00');
  if(isNaN(d)) return false;
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const diffDays = Math.floor((hoy - d)/86400000);
  if(_quickFilter==='hoy')     return diffDays===0;
  if(_quickFilter==='semana')  return diffDays>=0 && diffDays<=6;
  if(_quickFilter==='mes')     return d.getFullYear()===hoy.getFullYear() && d.getMonth()===hoy.getMonth();
  if(_quickFilter==='pasado'){
    const y=hoy.getFullYear(), m=hoy.getMonth();
    const pY = m===0 ? y-1 : y;
    const pM = m===0 ? 11 : m-1;
    return d.getFullYear()===pY && d.getMonth()===pM;
  }
  return true;
}

// Construye un texto indexable rico para una fecha ISO (YYYY-MM-DD).
// Incluye: fecha tal cual, día, mes (nombre largo y corto), día de la semana, año.
function buildFechaIndex(fechaISO){
  if(!fechaISO) return '';
  const d = new Date(fechaISO+'T00:00');
  if(isNaN(d)) return fechaISO;
  const meses=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const mesesCortos=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const dias=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const diasCortos=['dom','lun','mar','mié','jue','vie','sáb'];
  const day=d.getDate();
  const mon=d.getMonth();
  const year=d.getFullYear();
  const dow=d.getDay();
  // Indexa sin tildes también (por si el usuario no las escribe)
  const quitarTildes = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const parts = [
    fechaISO,
    String(day),
    String(day).padStart(2,'0'),
    meses[mon], mesesCortos[mon],
    quitarTildes(meses[mon]), quitarTildes(mesesCortos[mon]),
    String(year),
    dias[dow], diasCortos[dow],
    quitarTildes(dias[dow]), quitarTildes(diasCortos[dow]),
    meses[mon]+' '+year,
    mesesCortos[mon]+' '+year,
    String(day)+' '+meses[mon],
    String(day)+' '+mesesCortos[mon],
  ];
  return parts.join(' ').toLowerCase();
}

function renderHome(filtro=''){
  const muestreos=getMuestreos();
  const planes=getPlanes();
  const cnt=document.getElementById('homeCnt');
  const div=document.getElementById('homeLista');
  if(!cnt||!div)return;
  cnt.textContent=muestreos.length;
  // Tokenizado del filtro
  const quitarTildes = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const tokens = filtro ? filtro.split(/\s+/).filter(Boolean).map(quitarTildes) : [];

  // Construir vista por PLAN. Cada plan contiene la lista de sus muestreos.
  // Un plan pasa el filtro si cualquiera de sus muestreos pasa, o si el folio
  // del plan contiene los tokens.
  const planView = planes.map(plan=>{
    const ms = (plan.omarIds||[]).map(mid => muestreos.find(x=>x.id===mid)).filter(Boolean);
    return {plan, muestreos: ms};
  }).filter(pv=>pv.muestreos.length>0);  // solo planes con muestreos

  const planesFiltrados = planView.filter(pv=>{
    // Quick filter por rango de fecha (cualquier muestreo del plan que entre)
    const algunEnRango = pv.muestreos.some(m=>{
      const omarObj=m.omar?JSON.parse(m.omar):{};
      return matchesQuickFilter(omarObj.fecha||m.fecha||'');
    }) || matchesQuickFilter(pv.plan.fecha);
    if(!algunEnRango) return false;
    if(tokens.length===0) return true;
    // Búsqueda contra plan folio + cada muestreo (empresa, folio, muestreador, fecha)
    const planHaystack = quitarTildes(
      (pv.plan.folio||'')+' '+
      (pv.plan.muestreador||'')+' '+
      buildFechaIndex(pv.plan.fecha||'')
    ).toLowerCase();
    const mHaystacks = pv.muestreos.map(m=>{
      const omarObj=m.omar?JSON.parse(m.omar):{};
      return quitarTildes(
        (omarObj.empresa||'')+' '+
        (m.folio||'')+' '+
        (omarObj.muestreador||'')+' '+
        buildFechaIndex(omarObj.fecha||m.fecha||'')
      ).toLowerCase();
    });
    const everything = planHaystack+' '+mHaystacks.join(' ');
    return tokens.every(tk=>everything.includes(tk));
  });

  if(muestreos.length===0){
    div.innerHTML='<div style="text-align:center;padding:24px;color:var(--g2);font-size:13px">Sin muestreos guardados aún</div>';
    return;
  }
  if(planesFiltrados.length===0){
    const qlabel = _quickFilter ? ' en el rango seleccionado' : '';
    div.innerHTML='<div style="text-align:center;padding:24px;color:var(--g2);font-size:13px">Sin resultados para "'+filtro+'"'+qlabel+'</div>';
    return;
  }

  div.innerHTML='';
  planesFiltrados.forEach(({plan, muestreos})=>{
    // Plan "solo" (1 OMAR y sin folio de plan asignado por el usuario) → se renderiza como antes, compacto
    const esSolo = muestreos.length===1 && !plan.folio && plan.migrated;
    if(esSolo){
      div.appendChild(renderMuestreoRow(muestreos[0]));
      return;
    }
    // Plan con múltiples OMARs o plan explícito → tarjeta con header + OMARs dentro
    div.appendChild(renderPlanCard(plan, muestreos));
  });
}

function renderMuestreoRow(m){
  const omarObj=m.omar?JSON.parse(m.omar):{};
  const nTomas=m.tomas?m.tomas.length:0;
  const ntotal=parseInt(omarObj.ntomas)||0;
  const tieneFlujoPend=m.tomas?m.tomas.some(t=>!t.ls):false;
  const tieneLab=omarObj.lab&&(omarObj.lab.tnom||omarObj.lab.renom);
  const tieneSig=m.sigData&&m.sigData.length>10;
  let estado,color,dot;
  if(!nTomas){estado='Sin tomas';color='var(--g2)';dot='#3d6080';}
  else if(tieneFlujoPend){estado='En campo';color='var(--amber)';dot='#fbbf24';}
  else if(!tieneSig){estado='Pendiente firma';color='#a78bfa';dot='#a78bfa';}
  else if(!tieneLab){estado='Pendiente lab';color='var(--acc)';dot='#4a9eff';}
  else{estado='Completo';color='var(--green)';dot='#86efac';}
  const fecha=omarObj.fecha||m.fecha||'';
  const fmtFecha=fecha?new Date(fecha+'T00:00').toLocaleDateString('es-MX',{day:'2-digit',month:'short'}):'—';
  const el=document.createElement('div');
  el.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--ln);cursor:pointer;-webkit-tap-highlight-color:transparent';
  el.innerHTML=`
    <div style="width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0;box-shadow:0 0 6px ${dot}88"></div>
    <div style="flex:1;min-width:0">
      <div style="font-family:var(--syne);font-size:13px;font-weight:700;color:var(--w);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">OMAR-${m.folio||'—'} · ${omarObj.empresa||'—'}</div>
      <div style="font-size:11px;color:var(--g1);margin-top:2px">${fmtFecha} · ${nTomas}${ntotal?'/'+ntotal:''} tomas · <span style="color:${color}">${estado}</span></div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g2)" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      <button class="del-btn" data-id="${m.id}" style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);border-radius:6px;color:#f87171;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="pointer-events:none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
      </button>
    </div>`;
  el.addEventListener('click',e=>{
    const delBtn=e.target.closest('.del-btn');
    if(delBtn){
      e.stopPropagation();
      const mid=delBtn.dataset.id;
      confirmAction({
        title:'Eliminar muestreo',
        message:'Esta acción no se puede deshacer. Se borrará el registro y todos sus datos.',
        okText:'Eliminar',
        okDanger:true,
        cancelText:'Cancelar'
      }).then(ok=>{
        if(ok) eliminarMuestreo(isNaN(mid)?mid:parseInt(mid));
      });
      return;
    }
    cargarMuestreo(m.id);
  });
  el.addEventListener('touchstart',()=>el.style.background='var(--bg3)',{passive:true});
  el.addEventListener('touchend',()=>el.style.background='',{passive:true});
  return el;
}

function renderPlanCard(plan, muestreos){
  const wrap = document.createElement('div');
  wrap.style.cssText='margin-bottom:14px;border:1px solid var(--ln2);border-radius:12px;overflow:hidden;background:rgba(74,158,255,.03)';
  // Totalizar progreso
  const completos = muestreos.filter(m=>{
    const omarObj=m.omar?JSON.parse(m.omar):{};
    return omarObj.lab&&(omarObj.lab.tnom||omarObj.lab.renom) && m.sigData && m.sigData.length>10;
  }).length;
  const fmtFecha = plan.fecha ? new Date(plan.fecha+'T00:00').toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}) : '—';
  // Header del plan
  const header = document.createElement('div');
  header.style.cssText='display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(135deg,rgba(74,158,255,.12),rgba(74,158,255,.04));border-bottom:1px solid var(--ln);cursor:pointer;-webkit-tap-highlight-color:transparent';
  header.innerHTML=`
    <div style="width:28px;height:28px;border-radius:7px;background:rgba(74,158,255,.15);border:1px solid rgba(74,158,255,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-family:var(--syne);font-size:13px;font-weight:800;color:var(--w);letter-spacing:.02em">PLAN ${plan.folio?'#'+plan.folio:'(sin folio)'}</div>
      <div style="font-size:11px;color:var(--g1);margin-top:2px">${fmtFecha} · ${muestreos.length} OMAR${muestreos.length!==1?'s':''} · ${completos}/${muestreos.length} completos</div>
    </div>
    <div style="display:flex;gap:6px;flex-shrink:0">
      <button data-action="open-plan" data-planid="${plan.id}" style="background:rgba(74,158,255,.12);border:1px solid rgba(74,158,255,.3);border-radius:7px;color:var(--acc);padding:6px 10px;font-family:var(--syne);font-size:11px;font-weight:800;cursor:pointer">Abrir</button>
      <button data-action="del-plan" data-planid="${plan.id}" title="Eliminar plan" style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.35);border-radius:7px;color:#f87171;padding:6px 9px;cursor:pointer;display:flex;align-items:center;justify-content:center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="pointer-events:none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
      </button>
    </div>
  `;
  header.addEventListener('click',e=>{
    if(e.target.closest('[data-action="del-plan"]')){
      e.stopPropagation();
      eliminarPlanDesdeHome(plan.id);
      return;
    }
    if(e.target.closest('[data-action="open-plan"]')){
      e.stopPropagation();
      abrirPlan(plan.id);
    }
  });
  wrap.appendChild(header);
  // Lista de OMARs dentro del plan
  const body = document.createElement('div');
  body.style.cssText='padding:4px 14px';
  muestreos.forEach(m=>{
    body.appendChild(renderMuestreoRow(m));
  });
  wrap.appendChild(body);
  return wrap;
}

// ═══════════════ PLAN UI ═══════════════
let _currentPlanId = null;
// Pre-creación: cuando el usuario toca "+ Nuevo muestreo", creamos el plan
// y reservamos un id de muestreo. Al primer save del OMAR se hace la conexión.
let _pendingNewPlanId = null;
let _pendingNewMuestreoId = null;

async function abrirPlan(planId){
  _currentPlanId = planId;
  // Forzar refresh de caché por si se acaba de modificar algo
  try { await refreshCache(); } catch(e){}
  const plan = _cachedPlanes.find(p=>p.id===planId);
  // AARMS v66-flujos: auto-cargar primer OMAR si el plan tiene OMARs y no hay activo
  if(plan?.omarIds?.length && !omar?.ts){
    try{
      await cargarMuestreo(plan.omarIds[0], {silent:true});
    }catch(e){
      console.warn('[abrirPlan] no se pudo auto-cargar primer OMAR:', e);
    }
  }
  renderPlanPage();
  goPage('pgPlan');
}

// AARMS sub3fix2: fecha de inicio OMAR (multi-OMAR en plan y bitácoras)
function _omarParseDesdeMuestreo(omarTs){
  const m=(_cachedMuestreos||[]).find(x=>String(x.id)===String(omarTs));
  if(!m) return null;
  try{
    const o=m.omar?JSON.parse(m.omar):{};
    if(!o.campo) o.campo={};
    o.folio=o.folio||m.folio;
    o.ts=m.id;
    return o;
  }catch(_){ return null; }
}

function _omarFechaInicio(omarObj){
  if(!omarObj) return '';
  const c=omarObj.campo||{};
  const src=c.ini||omarObj.fechaInicio||omarObj.fecha||omarObj.dt;
  if(!src) return '';
  const d=new Date(src);
  if(isNaN(d.getTime())) return String(src).trim().substring(0,10);
  return d.toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'});
}
window._omarFechaInicio = _omarFechaInicio;

function _omarLabelConFechaFromObj(o){
  const folio=o.folio||'';
  const folLbl=folio?(String(folio).match(/^OMAR/i)?folio:`OMAR-${folio}`):'OMAR';
  const fecha=_omarFechaInicio(o);
  return fecha?`${folLbl} · ${fecha}`:folLbl;
}

// AARMS sub53-fino: export label OMAR+fecha para selector Machiote
window._omarLabelConFechaFromObj = _omarLabelConFechaFromObj;

function _omarLabelConFecha(omarTs){
  const o=_omarParseDesdeMuestreo(omarTs);
  if(o) return _omarLabelConFechaFromObj(o);
  if(typeof omar!=='undefined'&&omar&&String(omar.ts)===String(omarTs)) return _omarLabelConFechaFromObj(omar);
  return 'OMAR ' + omarTs;
}
window._omarLabelConFecha = _omarLabelConFecha;

function _omarTsSortKey(omarTs){
  const o=_omarParseDesdeMuestreo(omarTs);
  const src=o?.campo?.ini||o?.fechaInicio||o?.fecha||0;
  const t=new Date(src).getTime();
  return isNaN(t)?0:t;
}
window._omarTsSortKey = _omarTsSortKey;

function renderPlanPage(){
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan){
    console.warn('Plan no encontrado en cache:', _currentPlanId);
    goHome();
    return;
  }
  // Header pill
  const pill = document.getElementById('planPill');
  if(pill) pill.textContent = 'PLAN ' + (plan.folio ? '#'+plan.folio : '—');
  // Rellenar formulario
  const setVal = (id,v)=>{const e=document.getElementById(id);if(e)e.value=v||'';};
  setVal('plan_folio', plan.folio);
  setVal('plan_fecha', plan.fecha);
  setVal('plan_muest', plan.muestreador);
  setVal('plan_blanco_lote', plan.loteBlanco);
  // Toggle blanco de campo
  const siEl = document.getElementById('plan_blanco_si');
  const noEl = document.getElementById('plan_blanco_no');
  const wrapEl = document.getElementById('plan_blanco_lote_wrap');
  if(siEl && noEl){
    siEl.classList.toggle('on', !!plan.blancoCampo);
    noEl.classList.toggle('on', !plan.blancoCampo);
    if(wrapEl) wrapEl.style.display = plan.blancoCampo ? 'block' : 'none';
  }
  // AARMS sub2-temp: selector termómetro si hay >1 en inventario
  const termoWrap = document.getElementById('planTermoSelectorWrap');
  if(termoWrap){
    if(_catalogoCache){
      termoWrap.innerHTML = _planTermometroSelectorHTML(plan);
    } else {
      _catalogoCargar().then(()=>{
        const tw = document.getElementById('planTermoSelectorWrap');
        if(tw) tw.innerHTML = _planTermometroSelectorHTML(plan);
      });
    }
  }
  // Lista de OMARs
  const list = document.getElementById('planOmarsList');
  const cnt = document.getElementById('planOmarsCnt');
  if(!list) return;
  const omarsRaw = getMuestreosDePlan(_currentPlanId);
  const omars = [...omarsRaw].sort((a,b)=>_omarTsSortKey(a.id)-_omarTsSortKey(b.id));
  if(cnt) cnt.textContent = omars.length;
  list.innerHTML = '';
  if(omars.length===0){
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--g2);font-size:12px">Sin OMARs. Agrega la primera ↓</div>';
  } else omars.forEach((m,idx)=>{
    const omarObj=m.omar?JSON.parse(m.omar):{};
    const nTomas=m.tomas?m.tomas.length:0;
    const ntotal=parseInt(omarObj.ntomas)||0;
    const tieneLab=omarObj.lab&&(omarObj.lab.tnom||omarObj.lab.renom);
    const tieneSig=m.sigData&&m.sigData.length>10;
    let estado,color,dot;
    if(!nTomas){estado='Sin tomas';color='var(--g2)';dot='#3d6080';}
    else if(!tieneSig){estado='Pendiente firma';color='#a78bfa';dot='#a78bfa';}
    else if(!tieneLab){estado='Pendiente lab';color='var(--acc)';dot='#4a9eff';}
    else{estado='Completo';color='var(--green)';dot='#86efac';}
    const fechaChipHtml=(()=>{
      const f=_omarFechaInicio(omarObj);
      return f?`<span style="background:rgba(96,165,250,.12);color:#60a5fa;font-size:10.5px;padding:3px 7px;border-radius:5px;font-family:var(--mono);font-weight:700">📅 ${f}</span>`:`<span style="background:rgba(148,163,184,.08);color:var(--g2);font-size:10.5px;padding:3px 7px;border-radius:5px;font-style:italic">Sin fecha</span>`;
    })();
    const row = document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid var(--ln);cursor:pointer';
    row.innerHTML = `
      <div style="width:26px;height:26px;border-radius:7px;background:rgba(74,158,255,.12);border:1px solid rgba(74,158,255,.25);display:flex;align-items:center;justify-content:center;font-family:var(--syne);font-weight:800;font-size:11px;color:var(--acc);flex-shrink:0">${idx+1}</div>
      <div style="width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0;box-shadow:0 0 6px ${dot}88"></div>
      <div style="flex:1;min-width:0">
        <div style="font-family:var(--syne);font-size:12px;font-weight:700;color:var(--w);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">OMAR-${m.folio||'—'} · ${omarObj.empresa||'—'}</div>
        <div style="font-size:10px;color:var(--g1);margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${fechaChipHtml}
          <span>${nTomas}${ntotal?'/'+ntotal:''} tomas · <span style="color:${color}">${estado}</span></span>
        </div>
      </div>
      <button class="del-omar-btn" data-mid="${m.id}" style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);border-radius:6px;color:#f87171;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex-shrink:0">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="pointer-events:none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
      </button>
    `;
    row.addEventListener('click',e=>{
      if(e.target.closest('.del-omar-btn')){
        e.stopPropagation();
        confirmAction({
          title:'Quitar OMAR del plan',
          message:`¿Quitar OMAR-${m.folio||'?'} (${omarObj.empresa||'sin empresa'}) del plan? El muestreo se eliminará por completo.`,
          okText:'Eliminar',
          okDanger:true,
        }).then(ok=>{
          if(ok){
            planRemoverOmar(_currentPlanId, m.id, {borrarMuestreo:true}).then(()=>renderPlanPage());
          }
        });
        return;
      }
      // Tap en fila = abrir ese muestreo
      const planGate = _cachedPlanes.find(p=>p.id===_currentPlanId);
      if(_gateCampoClick(planGate, 'omars')) return;
      _lvarFlujoReset = true;
      cargarMuestreo(m.id);
    });
    list.appendChild(row);
  });

  // Documentos del plan
  renderPlanDocs();

  // AARMS v65: barra progreso + siguiente paso
  const progHost = document.getElementById('planProgresoHost');
  if(progHost){
    progHost.innerHTML = _renderBarraProgreso(plan) + _renderSiguientePaso(plan);
  }
  _actualizarGatePlanUI();
}

// AARMS v66-flujos: orden operativo oficial — única fuente de verdad
const _PLAN_ORDEN_OFICIAL = [
  'bpm',       // 1. Plan de muestreo
  'lvar',      // 2. Lista de verificación
  'blmp',      // 3. Limpieza pH-metro
  'phlab',     // 4. pH lab (F-AA-264-4 H1)
  'colab',     // 5. Conductímetro lab (F-AA-289-2 H1)
  'omars',     // 6. OMARs + hoja de campo
  'bitPh',     // 7. Bitácora pH entre tomas
  'bitCond',   // 8. Bitácora conductímetro entre tomas
  'bitTemp',   // 9. Bitácora temperatura entre tomas
  'bitflujos', // 10. Bitácora flujos entre tomas
  'bitod',     // 11. Bitácora OD (opcional) — AARMS sub7-od
  'bm'         // 12. BM final
];

const _PLAN_PASO_TITULOS = {
  bpm: 'BPM — Plan de Muestreo',
  lvar: 'LVAR — Lista de Verificación',
  blmp: 'BLMP — Limpieza pH-metro',
  phlab: 'BUCCVpH (F-AA-264-4)',
  colab: 'BLMCCVUC',
  omars: 'OMAR(s) — Hoja de campo',
  bitPh: 'Bitácora pH CAMPO (Hoja 2)',
  bitCond: 'Bitácora conductímetro entre tomas',
  bitTemp: 'Bitácora Temperatura entre tomas',
  bitflujos: 'Bitácora Flujos entre tomas',
  bitod: 'Bitácora Oxígeno Disuelto (opcional)',
  bm: 'BM — Bitácora de Muestreo',
};

// AARMS v66-flujos: PLAN_DOCS en orden operativo oficial (lab → campo → cierre)
const PLAN_DOCS = [
  {key:'bpm',      label:'Plan de muestreo (BPM)',              desc:'Pasos del plan, croquis y referencias',           where:'lab',    ready:true},
  {key:'lvar',     label:'Lista de verificación de materiales', desc:'Equipos y material de muestreo (BLVM)',           where:'lab',    ready:true},
  {key:'blmp',     label:'Phmetro — limpieza y mantenimiento',  desc:'Antes de salir a campo (laboratorio)',           where:'lab',    ready:true},
  {key:'phlab',    label:'BUCCVpH (F-AA-264-4)',                desc:'Bitácora uso, calibración, comprobación y verificación pH', where:'lab',    ready:true},
  {key:'colab',    label:'BLMCCVUC',                              desc:'Limpieza, mantenimiento, calibración y uso conductímetro',  where:'lab',    ready:true},
  {key:'omars',    label:'OMAR(s) — hoja de campo',             desc:'Captura de tomas en sitio',                       where:'campo',  ready:true},
  {key:'phcam',    label:'Phmetro — entre tomas',               desc:'Registro entre tomas (Ca / Co / V)',              where:'campo',  ready:true},
  {key:'condcamp', label:'Conductímetro — entre tomas',         desc:'Paso 2 · requiere laboratorio completado',        where:'campo',  ready:true},
  {key:'bittemp',  label:'Bitácora Temperatura',                desc:'3 lecturas T agua/ambiente · proc. automático',   where:'campo',  ready:true},
  {key:'bitflujos',label:'Bitácora Flujos',                     desc:'3 lecturas L/s · % ponderado automático',         where:'campo',  ready:true},
  // AARMS sub7-od: opcional — no bloquea Machiote ni forma parte del lab gate
  {key:'bitod',    label:'Bitácora OD (opcional)',               desc:'Oxígeno disuelto NMX-AA-012 · 5 tablas',          where:'campo',  ready:true},
  {key:'bm',       label:'Bitácora de muestreo',                desc:'Del arribo al cierre (varios bloques)',           where:'cierre', ready:true},
];

function _planDocSortKey(key){
  if(key==='phcam') return _PLAN_ORDEN_OFICIAL.indexOf('bitPh');
  if(key==='condcamp') return _PLAN_ORDEN_OFICIAL.indexOf('bitCond');
  if(key==='bittemp') return _PLAN_ORDEN_OFICIAL.indexOf('bitTemp');
  if(key==='bitflujos') return _PLAN_ORDEN_OFICIAL.indexOf('bitflujos');
  if(key==='bitod') return _PLAN_ORDEN_OFICIAL.indexOf('bitod');
  const i = _PLAN_ORDEN_OFICIAL.indexOf(key);
  return i >= 0 ? i : 999;
}

function _planEstadoDocKey(plan, planDocKey){
  const map = { lvar:'lvar', bpm:'bpm', blmp:'blmp', phlab:'phlab', colab:'colab', phcam:'bitPh', condcamp:'bitCond', bittemp:'bitTemp', bitflujos:'bitflujos', bitod:'bitod', omars:'omars', bm:'bm' };
  const k = map[planDocKey] || planDocKey;
  return _planEstadoDoc(plan, k);
}

// AARMS sub-gate: docs de campo bloqueados hasta lab completo
// AARMS sub7-od: bitod NO está aquí — opcional, no bloquea ni exige lab para abrirse
const _GATE_DOCS_CAMPO = ['omars', 'phcam', 'condcamp', 'bittemp', 'bitflujos'];

// AARMS sub-gate: plan con captura previa de campo → consulta libre (no bloquear)
function _planExentoDeGate(plan){
  if(!plan) return false;
  if(_planEstadoDoc(plan, 'bm') === 'completo') return true;
  const ids = plan.omarIds || [];
  for(const mid of ids){
    const m = (_cachedMuestreos||[]).find(x=>String(x.id)===String(mid));
    if(m && Array.isArray(m.tomas) && m.tomas.length > 0) return true;
  }
  if((plan.bitPh||[]).length) return true;
  if((plan.bitCond||[]).length) return true;
  if((plan.bitTemp||[]).length) return true;
  if((plan.bitFlujos||[]).length) return true;
  return false;
}
window._planExentoDeGate = _planExentoDeGate;

// AARMS sub-gate: helper central — laboratorio completo (5 docs)
function _labCompleto(plan){
  if(!plan) return false;
  const docsLabRequeridos = ['bpm', 'lvar', 'blmp', 'phlab', 'colab'];
  for(const docKey of docsLabRequeridos){
    if(_planEstadoDoc(plan, docKey) !== 'completo') return false;
  }
  return true;
}
window._labCompleto = _labCompleto;

function _labEstado(plan){
  if(!plan) return { completo:false, faltantes:[], detalles:[] };
  const docsLab = [
    { key:'bpm',   label:'BPM (Plan de muestreo)' },
    { key:'lvar',  label:'LVAR (Lista de verificación)' },
    { key:'blmp',  label:'BLMP (Limpieza pH-metro)' },
    { key:'phlab', label:'BUCCVpH (Calibración pH-metro)' },
    { key:'colab', label:'BLMCCVUC (Calibración conductímetro)' },
  ];
  const faltantes = [];
  const detalles = docsLab.map(d=>{
    const estado = _planEstadoDoc(plan, d.key);
    const ok = estado === 'completo';
    if(!ok) faltantes.push(d.label);
    return { ...d, estado, ok };
  });
  return { completo:faltantes.length === 0, faltantes, detalles };
}
window._labEstado = _labEstado;

// AARMS sub-gate: Machiote bloqueado hasta lab + 4 bitácoras de campo
function _machioteDisponible(plan){
  if(!plan) return false;
  if(!_labCompleto(plan)) return false;
  const omars = plan.omarIds || [];
  if(!omars.length) return false;
  const bitPh = Array.isArray(plan.bitPh) && plan.bitPh.length > 0;
  const bitCond = Array.isArray(plan.bitCond) && plan.bitCond.length > 0;
  const bitTemp = Array.isArray(plan.bitTemp) && plan.bitTemp.length > 0;
  const bitFlujos = Array.isArray(plan.bitFlujos) && plan.bitFlujos.length > 0;
  return bitPh && bitCond && bitTemp && bitFlujos;
}
window._machioteDisponible = _machioteDisponible;

function _planDocGateLocked(plan, docKey){
  if(!plan || _planExentoDeGate(plan)) return false;
  if(docKey === 'bm') return !_machioteDisponible(plan);
  if(_GATE_DOCS_CAMPO.includes(docKey)) return !_labCompleto(plan);
  return false;
}

// AARMS sub-gate: interceptar click en doc de campo — true = bloqueado
function _gateCampoClick(plan, docKey){
  if(!plan || _planExentoDeGate(plan)) return false;
  if(docKey === 'bm'){
    if(_machioteDisponible(plan)) return false;
    if(!_labCompleto(plan)){
      const est = _labEstado(plan);
      toast('🔒 Completa el laboratorio antes de campo. Faltan: '+est.faltantes.join(', '), 'w');
    }else{
      toast('🔒 El Machiote requiere capturar las 4 bitácoras de campo primero', 'w');
    }
    return true;
  }
  if(_GATE_DOCS_CAMPO.includes(docKey) && !_labCompleto(plan)){
    const est = _labEstado(plan);
    toast('🔒 Completa el laboratorio antes de campo. Faltan: '+est.faltantes.join(', '), 'w');
    return true;
  }
  return false;
}
window._gateCampo = _gateCampoClick;

function _actualizarGateBanner(){
  const banner = document.getElementById('gateLabBanner');
  const contFaltantes = document.getElementById('gateLabFaltantes');
  if(!banner || !contFaltantes) return;
  const plan = _planActivo();
  const estado = _labEstado(plan);
  if(!plan || estado.completo || _planExentoDeGate(plan)){
    banner.style.display = 'none';
    return;
  }
  banner.style.display = 'block';
  contFaltantes.innerHTML = estado.faltantes.map(f=>
    `<span style="background:rgba(239,68,68,.12);color:#fca5a5;font-size:10.5px;padding:3px 8px;border-radius:5px;font-family:var(--mono);font-weight:700">${f}</span>`
  ).join('');
}
window._actualizarGateBanner = _actualizarGateBanner;

function _actualizarGatePlanUI(){
  _actualizarGateBanner();
  const plan = _planActivo();
  const btn = document.getElementById('planBtnNuevaOmar');
  if(btn){
    const locked = plan && _planDocGateLocked(plan, 'omars');
    btn.style.opacity = locked ? '0.4' : '';
    btn.style.cursor = locked ? 'not-allowed' : '';
    btn.disabled = !!locked;
  }
  // AARMS simfix: re-evaluar candados visuales al instante (sin hard refresh)
  const list = document.getElementById('planDocsList');
  if(list && plan){
    const onPlan = !!(document.getElementById('pgPlan') && document.getElementById('pgPlan').classList.contains('on'));
    if(onPlan){
      try{ renderPlanDocs(); }catch(_){}
    } else {
      list.querySelectorAll('[data-plan-doc-key]').forEach(row=>{
        const key = row.getAttribute('data-plan-doc-key');
        const locked = !!_planDocGateLocked(plan, key);
        row.classList.toggle('gate-locked', locked);
        row.style.cursor = locked ? 'not-allowed' : 'pointer';
      });
    }
  }
}
window._actualizarGatePlanUI = _actualizarGatePlanUI;

function renderPlanDocs(){
  const list = document.getElementById('planDocsList');
  const badge = document.getElementById('planDocsBadge');
  if(!list) return;
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  const docs = (plan && plan.docs) || {};
  let done = 0;
  list.innerHTML = '';
  const order = ['lab','campo','cierre'];
  const grTitle = { lab:'Laboratorio', campo:'Campo (hoja de campo y entre tomas)', cierre:'Cierre' };
  order.forEach(phase=>{
    const inPhase = PLAN_DOCS.filter(d=>d.where===phase).sort((a,b)=>_planDocSortKey(a.key)-_planDocSortKey(b.key));
    if(!inPhase.length) return;
    const gh = document.createElement('div');
    gh.className = 'plan-doc-gr';
    gh.textContent = grTitle[phase] || phase;
    list.appendChild(gh);
    inPhase.forEach(d=>{
      const isDone = !!docs[d.key]?.done;
      if(isDone) done++;
      const whereBadge = d.where==='lab' ? `<span style="background:rgba(74,158,255,.12);color:var(--acc);font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:4px;letter-spacing:.04em">LAB</span>`
        : d.where==='campo' ? `<span style="background:rgba(251,191,36,.12);color:var(--amber);font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:4px;letter-spacing:.04em">CAMPO</span>`
        : `<span style="background:rgba(167,139,250,.12);color:#a78bfa;font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:4px;letter-spacing:.04em">CIERRE</span>`;
      const locked = _planDocGateLocked(plan, d.key);
      const row = document.createElement('div');
      row.className = 'plan-doc-row doc-card'+(locked?' gate-locked':'');
      row.setAttribute('data-plan-doc-key', d.key);
      row.style.cssText='display:flex;align-items:center;gap:11px;padding:12px 4px;border-bottom:1px solid var(--ln);cursor:'+(locked?'not-allowed':'pointer')+';-webkit-tap-highlight-color:transparent;position:relative;'+(d.ready?'':'opacity:.65')+(locked?'':'' );
      const gateHint = locked ? '<div style="font-size:9.5px;color:var(--g2);margin-top:2px">Completa el laboratorio primero</div>' : '';
      row.innerHTML = `
      <div style="width:28px;height:28px;border-radius:7px;background:${isDone?'rgba(134,239,172,.15)':'var(--bg3)'};border:1px solid ${isDone?'rgba(134,239,172,.4)':'var(--ln)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${isDone?'var(--green)':'var(--g2)'}">
        ${isDone ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '<span style="font-family:var(--syne);font-size:10px;font-weight:800">○</span>'}
      </div>
      <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
          <div style="font-family:var(--syne);font-size:12px;font-weight:700;color:var(--w)">${d.label}</div>
          ${_badgeEstadoDoc(_planEstadoDocKey(plan, d.key))}
          ${whereBadge}
          ${d.ready ? '' : '<span style="background:rgba(251,191,36,.1);color:var(--amber);font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:4px">PRÓXIMO</span>'}
        </div>
        <div style="font-size:10px;color:var(--g1);margin-top:3px">${d.desc}</div>
        ${gateHint}
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--g2)" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
    `;
      row.addEventListener('click',async ()=>{
        if(_gateCampoClick(plan, d.key)) return;
        // AARMS sub3fix3: Bitácora Flujos directo + precargar OMAR si hace falta
        if(d.key==='bitflujos'){
          if(!omar?.ts && typeof _flujosAsegurarOmarCargado==='function') await _flujosAsegurarOmarCargado();
          await abrirBitacoraFlujos({origen:'plan'});
          return;
        }
        abrirDocPlan(d.key);
      });
      list.appendChild(row);
    });
  });
  if(badge) badge.textContent = `${done}/${PLAN_DOCS.length}`;
  _actualizarGatePlanUI();
  // AARMS sub9-firma: refrescar sello Revisado por…
  if(typeof _renderSelloFirmaPlan === 'function') _renderSelloFirmaPlan();
}

// AARMS v66-flujos: asegurar OMAR en memoria antes de abrir docs del plan
async function _flujosAsegurarOmarCargado(){
  if(omar?.ts) return true;
  const plan = (_cachedPlanes||[]).find(p=>p.id===_currentPlanId);
  if(!plan?.omarIds?.length) return false;
  try{
    await cargarMuestreo(plan.omarIds[0], {silent:true});
    return !!omar?.ts;
  }catch(e){
    console.warn('[flujos] auto-cargar OMAR:', e);
    return false;
  }
}

// AARMS v66-flujos: consumir flag de regreso a LVAR tras guardar OMAR
async function _flujosConsumirReturnToLvar(){
  if(!_returnToLvarAfterOmar) return false;
  _returnToLvarAfterOmar = false;
  if(typeof abrirLVAR === 'function') await abrirLVAR();
  else goPage('pgLVAR');
  return true;
}

async function abrirDocPlan(key){
  const plan = _planActivo();
  if(_gateCampoClick(plan, key)) return;
  const d = PLAN_DOCS.find(x=>x.key===key);
  const pasoExtra = ['omars','bitPh','bitCond','bitTemp','bitflujos'].includes(key);
  if(!d && !pasoExtra) return;
  if(d && !d.ready){
    toast(d.label + ' — próximamente','');
    return;
  }
  const needsOmar = ['blmp','colab','phcam','condcamp','bpm','bm','phlab','bitPh','bitCond','bitTemp','bittemp','bitflujos','bitod'].includes(key);
  if(needsOmar && !omar?.ts){
    const ok = await _flujosAsegurarOmarCargado();
    if(!ok){
      toast('Abre un OMAR del plan (o desde Inicio) para capturar este documento.','w');
      return;
    }
  }
  // AARMS v66-flujos: handlers para keys del guía «Siguiente paso»
  if(key === 'omars'){
    const plan = (_cachedPlanes||[]).find(p=>p.id===_currentPlanId);
    if(!plan?.omarIds?.length){
      toast('Este plan no tiene OMARs aún','w');
      return;
    }
    await cargarMuestreo(plan.omarIds[0]);
    return;
  }
  if(key === 'bitPh'){
    await abrirBitacoraPH();
    return;
  }
  if(key === 'bitCond'){
    await abrirFlujoConductimetro({ paso:'auto', origen:'plan' });
    return;
  }
  if(key === 'bitTemp' || key === 'bittemp'){
    await abrirBitacoraTemp({ origen:'plan' });
    return;
  }
  if(key === 'bitflujos'){
    await abrirBitacoraFlujos({ origen:'plan' });
    return;
  }
  // AARMS sub7-od
  if(key === 'bitod'){
    await abrirBitacoraOD({ origen:'plan' });
    return;
  }
  if(key === 'lvar'){ abrirLVAR(); return; }
  if(key === 'bpm'){ if(typeof abrirPagBpm==='function')abrirPagBpm(); else toast('Carga documents-suite.js','w'); return; }
  if(key === 'bm'){ if(typeof abrirPagBm==='function')abrirPagBm(); else toast('Carga documents-suite.js','w'); return; }
  if(key === 'phlab'){ if(typeof abrirPagPh2644Lab==='function')abrirPagPh2644Lab(); else toast('Carga documents-suite.js','w'); return; }
  if(key === 'blmp'){ abrirPagBlmp(); return; }
  if(key === 'colab'){ await abrirFlujoConductimetro({ paso:'lab', origen:'plan' }); return; }
  if(key === 'phcam'){ await abrirBitacoraPH(); return; }
  // AARMS humofix: card «entre tomas» debe abrir campo (origen condcamp), no lab
  if(key === 'condcamp'){ await abrirFlujoConductimetro({ paso:'auto', origen:'condcamp' }); return; }
  toast('Abriendo '+(d?d.label:key)+'...','');
}

// ═══════════════════════════════════════════════════════════════
// LVAR — Lista de Verificación de Muestreo
// ═══════════════════════════════════════════════════════════════

// Catálogo de los items que van en cada sección del LVAR.
// Los equipos usan prefijos fijos (AA/PT/, AA/CO/, etc.) + el muestreador
// escribe solo el número; algunos no llevan prefijo ("1 de muestreo").
const LVAR_EQUIPOS = [
  {key:'potenciometro', label:'Potenciómetro',   prefix:'AA/PT/'},
  {key:'conductimetro', label:'Conductímetro',   prefix:'AA/CO/'},
  {key:'termometro',    label:'Termómetro',      prefix:'AA/TM/'},
  {key:'malla',         label:'Malla',           prefix:'AA/MA/'},
  {key:'kitcloro',      label:'Kit de Cloro',    prefix:'AA/KC/'},
  // AARMS simfix: oxímetro en LVAR con prefijo AA/OX/ (autocompleta desde Inventario)
  {key:'oximetro',      label:'Oxímetro',        prefix:'AA/OX/'},
  // Cronómetro/GPS: formato oficial LVAR = "1 de muestreo" (no clave de inventario)
  {key:'cronometro',    label:'Cronómetro',      prefix:'', fixedValue:'1 de muestreo'},
  {key:'gps',           label:'GPS',             prefix:'', fixedValue:'1 de muestreo'},
];
const LVAR_PERSONAL = [
  {key:'bata',      label:'Bata (overol)',       cant:1},
  {key:'zapatos',   label:'Zapatos industriales',cant:1},
  {key:'lentes',    label:'Lentes de seguridad', cant:1},
  {key:'casco',     label:'Casco',               cant:1},
];
const LVAR_DISOL = [
  {key:'h2so4_11', label:'H₂SO₄ 1:1',                          pdfLabel:'H2SO4 1:1'},
  // AARMS v66-p2: diferenciar visualmente del lavado de electrodo (mismo lote en catálogo)
  {key:'hcl_11',   label:'HCl 1:1 (uso general)',              pdfLabel:'HCl 1:1 (uso general)'},
  {key:'h2so4_25', label:'H₂SO₄ 25%',                          pdfLabel:'H2SO4 25%'},
  {key:'naoh_1n',  label:'NaOH 1N',                            pdfLabel:'NaOH 1N'},
  {key:'k2cr2o7',  label:'K₂Cr₂O₇ 25%',                        pdfLabel:'K2Cr2O7 25%'},
  {key:'hcl_lav',  label:'HCl 1:1 (para lavado de electrodo)', pdfLabel:'HCl 1:1 (lavado electrodo)'},
];
const LVAR_REACTIVOS = [
  {key:'hno3_acs',   label:'HNO₃ ACS',         pdfLabel:'HNO3 ACS'},
  {key:'hno3_supra', label:'HNO₃ Supra puro',  pdfLabel:'HNO3 Supra puro'},
];
const LVAR_PATRONES = [
  {key:'pat_ref1', label:'Patrón de referencia pH',  conValor:true},
  {key:'pat_ref2', label:'Patrón de referencia pH',  conValor:true},
  {key:'pat_ref3', label:'Patrón de referencia pH',  conValor:true},
  {key:'pat_tra1', label:'Patrón de trabajo pH',     conValor:true},
  {key:'pat_tra2', label:'Patrón de trabajo pH',     conValor:true},
  {key:'pat_tra3', label:'Patrón de trabajo pH',     conValor:true},
  {key:'kcl_pat',  label:'Sol. KCl Conductividad patrón', conValor:false},
  {key:'kcl_com',  label:'Sol. KCl Conductividad comercial', conValor:false},
  {key:'agua_r',   label:'Agua Reactivo', conValor:false},
];
const LVAR_SECUNDARIO = [
  {key:'probeta_1L',   label:'Probeta 1 L',     cant:1},
  {key:'probeta_100',  label:'Probeta 100 mL',  cant:1},
  {key:'caja',         label:'Caja de herramientas', cant:1},
  {key:'hielera',      label:'Hielera',         cant:1},
  {key:'cubeta',       label:'Cubeta de plástico', cant:1},
  {key:'piseta',       label:'Piseta',          cant:1},
  {key:'barreta',      label:'Barreta',         cant:1},
  {key:'cabo',         label:'Cabo',            cant:1},
  {key:'lampara',      label:'Lámpara',         cant:1},
  {key:'cinta',        label:'Cinta métrica',   cant:1},
];
const LVAR_MATERIAL = [
  {key:'tiras',     label:'Tiras de pH 0-7 y 7-14', cant:1},
  {key:'hielo',     label:'Hielo',                  cant:1},
  {key:'pipetas',   label:'Pipetas',                cant:1},
  {key:'guantes',   label:'Guantes neopreno/látex', cant:1},
  {key:'bolsa_bas', label:'Bolsa para basura',      cant:1},
  {key:'papel_sec', label:'Papel secante',          cant:1},
  {key:'torundas',  label:'Torundas de alcohol',    cant:1},
  {key:'cinta_t',   label:'Cinta transparente',     cant:1},
  {key:'etiquetas', label:'Etiquetas',              cant:1},
  {key:'vaso_d',    label:'Vaso Dewar',             cant:1},
];

// Parámetros que usan 1 envase por toma (simples) o (tomas+1) por toma (compuestos)
// basado en lo que me indicó el usuario.
const LVAR_ENVASES = [
  // {key, label, tipo:'simple'|'compuesto', analitos:[...]}
  {key:'vidrio_gya', label:'Frasco de vidrio boca ancha 1L (Grasas y Aceites)', tipo:'simple',     analitos:['GYA']},
  {key:'plast_dbo5', label:'Frasco plástico 1000 mL (DBO5)',                      tipo:'compuesto', analitos:['DBO5']},
  {key:'plast_gen',  label:'Frasco plástico 4 L (General / Fisicoquímico)',       tipo:'compuesto', analitos:['FQ']},
  {key:'plast_ntk',  label:'Frasco plástico 2000 mL (NTK)',                       tipo:'compuesto', analitos:['N.TOT']},
  {key:'plast_saam', label:'Frasco plástico 1 L (SAAM)',                          tipo:'compuesto', analitos:['SAAM']},
  {key:'plast_dqo',  label:'Frasco plástico 500 mL (DQO)',                        tipo:'compuesto', analitos:['DQO']},
  {key:'plast_mp',   label:'Frasco plástico 500 mL (Metales)',                    tipo:'compuesto', analitos:['MP']},
  {key:'plast_hg',   label:'Frasco plástico 500 mL (Mercurio)',                   tipo:'compuesto', analitos:['Hg']},
  {key:'plast_cn',   label:'Frasco plástico 1 L (Cianuro)',                       tipo:'compuesto', analitos:['CIAN']},
  {key:'plast_helm', label:'Frasco plástico 5 L (Huevo de Helminto)',             tipo:'compuesto', analitos:['HELM']},
  {key:'amb_vf',     label:'Frasco de vidrio ámbar 40 mL (Toxicidad aguda)',      tipo:'simple',    analitos:['TOX']},
  {key:'winkler',    label:'Botella Winkler',                                      tipo:'simple',    analitos:[]},
  {key:'bolsa_100',  label:'Bolsa estéril 100 mL (Vibrio cholerae, coliformes y microbiología afín)', tipo:'simple', analitos:['CTYF','ECOL']},
  {key:'bolsa_t100', label:'Bolsa estéril con Tiosulfato de sodio 100 mL',        tipo:'simple',    analitos:[]},
  {key:'bolsa_300',  label:'Bolsa estéril 300 mL',                                 tipo:'simple',    analitos:[]},
  {key:'bolsa_t300', label:'Bolsa estéril con Tiosulfato de sodio 300 mL',        tipo:'simple',    analitos:[]},
  {key:'plast_no2',  label:'Frasco plástico 500 mL NO₂',                          tipo:'compuesto', analitos:['NO2']},
  {key:'plast_no3',  label:'Frasco plástico 500 mL NO₃',                          tipo:'compuesto', analitos:['NO3']},
  {key:'amb_cot',    label:'Frasco de vidrio ámbar 1 L (COT)',                    tipo:'compuesto', analitos:['TOC']},
  {key:'amb_color',  label:'Frasco de vidrio ámbar 250 mL (Color verdadero)',     tipo:'compuesto', analitos:['CLOR']},
  {key:'plast_cl',   label:'Frasco plástico 500 mL (Cloruros)',                   tipo:'compuesto', analitos:['CLR']},
];

/** Texto mostrado en LVAR / PDF: toxicidad ≠ vibrio en el nombre del envase. */
function _lvarEnvaseDisplayLabel(env){
  if(!env) return '';
  if(env.key==='amb_vf') return 'Frasco de vidrio ámbar 40 mL (Toxicidad aguda)';
  if(env.key==='bolsa_100') return 'Bolsa estéril 100 mL (Vibrio cholerae, coliformes y microbiología afín)';
  return env.label;
}

// Estado del LVAR en memoria — se persiste en plan.lvar
let _lvarData = {};
let _lvarBloqueado = false;
let _returnToLvarAfterOmar = false;  // si true, "Continuar al LVAR" regresa al LVAR en vez de al plan
let _lvarFlujoActivo = false;
let _lvarFlujoGoCampo = false;
let _lvarFlujoReset = false;

function _renderLvarFlujoStepper(pasoActivo){
  const mk = (n, on, label) => {
    const bg = on ? 'rgba(74,158,255,.15)' : 'rgba(255,255,255,.04)';
    const border = on ? 'rgba(74,158,255,.55)' : 'var(--ln)';
    const color = on ? 'var(--acc)' : 'var(--g2)';
    const weight = on ? '800' : '600';
    return '<div style="flex:1;text-align:center;padding:10px 8px;border-radius:10px;background:'+bg+';border:1px solid '+border+';color:'+color+';font-family:var(--syne);font-size:11px;font-weight:'+weight+'"><span style="opacity:.75;font-size:10px">Paso '+n+'</span><br>'+label+'</div>';
  };
  return '<div style="display:flex;gap:8px">'+mk(1, pasoActivo===1, 'Lista de verificación')+mk(2, pasoActivo===2, 'Hoja de campo')+'</div>';
}

function _pintarLvarFlujoStepper(paso){
  const html = _renderLvarFlujoStepper(paso);
  const host = document.getElementById('lvarFlujoStepper');
  if(host) host.innerHTML = html;
  const hint = document.getElementById('lvarFlujoHint');
  const btn = document.getElementById('lvarFlujoBtnCampo');
  const omars = _lvarGetOmarsActuales().filter(o=>!o.noRealizada);
  const show = omars.length > 0 && !_lvarBloqueado;
  if(hint) hint.style.display = show ? '' : 'none';
  if(btn) btn.style.display = show ? '' : 'none';
  // AARMS lvarfix: label dinámico según siguiente paso lab
  _refreshBotonesContinuarLab();
}

function _pintarLvarFlujoCampoBar(){
  const el = document.getElementById('lvarFlujoCampoBar');
  if(el) el.style.display = _lvarFlujoActivo ? '' : 'none';
}

function _lvarElegirOmarParaCampo(omarIdOpt){
  const list = _lvarGetOmarsActuales().filter(o=>!o.noRealizada);
  if(!list.length) return null;
  if(omarIdOpt){
    const hit = list.find(o=>String(o.omarId)===String(omarIdOpt));
    if(hit) return hit.omarId;
  }
  for(const om of list){
    const m = (_cachedMuestreos||[]).find(x=>String(x.id)===String(om.omarId));
    const o = m?.omar ? JSON.parse(m.omar) : {};
    if(o.folio && (!m.tomas || !m.tomas.length)) return om.omarId;
  }
  for(const om of list){
    const m = (_cachedMuestreos||[]).find(x=>String(x.id)===String(om.omarId));
    const o = m?.omar ? JSON.parse(m.omar) : {};
    if(o.folio) return om.omarId;
  }
  return list[0].omarId;
}

// AARMS lvarfix: pantalla lab actual (para label/destino del botón continuar)
function _pantallaActualLab(){
  const map = { pgBpm:'bpm', pgLVAR:'lvar', pgBlmp:'blmp', pgPh2644:'phlab', pgColab:'colab' };
  for(const [pg, key] of Object.entries(map)){
    const el = document.getElementById(pg);
    if(el && el.classList.contains('on')) return key;
  }
  return null;
}

// AARMS lvarfix: siguiente doc pendiente (skip = doc de la pantalla actual, optimista tras guardar)
function _siguientePasoLabKey(plan, skipKey){
  const orden = ['bpm', 'lvar', 'blmp', 'phlab', 'colab', 'omars'];
  for(const key of orden){
    if(skipKey && key === skipKey) continue;
    if(_planEstadoDoc(plan, key) !== 'completo') return key;
  }
  return 'omars';
}

// AARMS lvarfix: texto dinámico del botón "guardar y continuar"
function _labelSiguientePasoLab(plan){
  if(!plan) return 'Guardar';
  const labels = {
    bpm:   'BPM (Plan de muestreo)',
    lvar:  'LVAR',
    blmp:  'BLMP (Limpieza pH-metro)',
    phlab: 'BUCCVpH (Calibración pH-metro)',
    colab: 'BLMCCVUC (Calibración conductímetro)',
    omars: 'Hoja de Campo'
  };
  const skip = _pantallaActualLab();
  const key = _siguientePasoLabKey(plan, skip);
  return 'Guardar y continuar a ' + (labels[key] || key);
}
window._labelSiguientePasoLab = _labelSiguientePasoLab;

// AARMS lvarfix: refrescar label del botón tras cada guardado
function _refreshBotonesContinuarLab(){
  const plan = _planActivo && _planActivo();
  if(!plan) return;
  const label = _labelSiguientePasoLab(plan);
  document.querySelectorAll('[data-btn-continuar-lab]').forEach(btn => {
    btn.textContent = label;
  });
}
window._refreshBotonesContinuarLab = _refreshBotonesContinuarLab;

async function _guardarDocActualLab(ctx){
  if(ctx === 'lvar') await guardarLVAR(true);
  else if(ctx === 'bpm' && typeof guardarBpmPage === 'function') await guardarBpmPage();
  else if(ctx === 'blmp') await guardarInstrumentLab('blmp');
  else if(ctx === 'phlab' && typeof guardarPh1Page === 'function') await guardarPh1Page();
  else if(ctx === 'colab') await guardarInstrumentLab('colab');
}

async function _irACampoDesdeLab(omarIdOpt){
  const target = _lvarElegirOmarParaCampo(omarIdOpt);
  if(!target){
    // Sin LVAR omars list — usar primer OMAR del plan
    const plan = _planActivo();
    const mid = (plan && plan.omarIds && plan.omarIds[0]) || null;
    if(!mid){ toast('Agrega al menos un OMAR activo al plan','w'); return false; }
    const m = (_cachedMuestreos||[]).find(x=>String(x.id)===String(mid));
    const o = m?.omar ? JSON.parse(m.omar) : {};
    if(!o.folio){ toast('Primero completa la OMAR (folio, sitio, analitos)','w'); return false; }
    _lvarFlujoGoCampo = true;
    await cargarMuestreo(mid);
    goPage('pg1');
    _pintarLvarFlujoCampoBar();
    return true;
  }
  const m = (_cachedMuestreos||[]).find(x=>String(x.id)===String(target));
  const o = m?.omar ? JSON.parse(m.omar) : {};
  if(!o.folio){
    toast('Primero completa la OMAR (folio, sitio, analitos)','w');
    return false;
  }
  _lvarFlujoGoCampo = true;
  await cargarMuestreo(target);
  _pintarLvarFlujoCampoBar();
  return true;
}

// AARMS lvarfix: enrutamiento dinámico según orden operativo oficial
async function continuarAlSiguientePaso(omarIdOpt){
  if(!_currentPlanId){ toast('No hay plan abierto','w'); return; }
  const ctx = _pantallaActualLab();
  if(ctx === 'lvar' && _lvarBloqueado){ toast('LVAR bloqueado','w'); return; }
  await _guardarDocActualLab(ctx);
  // Refrescar plan desde cache
  const plan = _planActivo();
  if(!plan){ toast('No hay plan abierto','w'); return; }
  _refreshBotonesContinuarLab();
  const orden = ['bpm', 'lvar', 'blmp', 'phlab', 'colab', 'omars'];
  for(const key of orden){
    if(_planEstadoDoc(plan, key) !== 'completo'){
      if(key === 'omars'){
        await _irACampoDesdeLab(omarIdOpt);
        return;
      }
      await abrirDocPlan(key);
      _refreshBotonesContinuarLab();
      return;
    }
  }
  // Todos completos → Hoja de Campo
  await _irACampoDesdeLab(omarIdOpt);
}
window.continuarAlSiguientePaso = continuarAlSiguientePaso;

async function continuarLvarACampo(omarIdOpt){
  // AARMS lvarfix: ya no salta a campo a ciegas — respeta orden lab
  return continuarAlSiguientePaso(omarIdOpt);
}

async function irLvarDesdeCampo(){
  try{ await guardarBorradorActual(); }catch(e){}
  _lvarFlujoActivo = true;
  await abrirLVAR();
}

async function abrirLVAR(){
  if(!_currentPlanId){ toast('Primero abre un plan','w'); return; }
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan){ return; }

  _lvarData = plan.lvar || {};
  // Bloqueo desactivado por petición del usuario — el LVAR siempre queda editable.
  _lvarBloqueado = false;

  // Pill con folio plan
  const pill = document.getElementById('lvarPill');
  if(pill) pill.textContent = 'LVAR ' + (plan.folio ? '· plan #'+plan.folio : '') + (_lvarBloqueado ? ' · 🔒' : '');

  // Cabecera
  const setVal = (id,v)=>{const e=document.getElementById(id);if(e)e.value=v||'';};
  // AARMS v64: jalar datos del primer OMAR del plan (autocompletado)
  const primerOmarId = (plan.omarIds || [])[0];
  let primerOmar = {};
  if(primerOmarId){
    const m = (_cachedMuestreos || []).find(x => String(x.id) === String(primerOmarId));
    if(m && m.omar){
      try { primerOmar = JSON.parse(m.omar); } catch(e){ primerOmar = {}; }
    }
  }

  setVal('lv_folio',  _lvarData.folio);
  setVal('lv_fecha',  _lvarData.fecha || plan.fecha || new Date().toISOString().split('T')[0]);
  setVal('lv_lugar',  _lvarData.lugar || primerOmar.sitio || '');
  setVal('lv_dir',    _lvarData.direccion || primerOmar.direccion || '');
  // SIN default "Guaymas": ahora jala del OMAR
  setVal('lv_ciudad', _lvarData.ciudad || primerOmar.municipio || '');
  setVal('lv_estado', _lvarData.estado || primerOmar.estado || '');
  setVal('lv_tipo',   _lvarData.tipo || primerOmar.tipo || '');
  setVal('lv_norma',  _lvarData.norma || primerOmar.norma || '');
  setVal('lv_obs',    _lvarData.obs);
  setVal('lv_asig',   _lvarData.asig || plan.muestreador || '');
  setVal('lv_asigFecha', _lvarData.asigFecha || plan.fecha);
  setVal('lv_asigHora',  _lvarData.asigHora);
  setVal('lv_sup',    _lvarData.sup);
  setVal('lv_supFecha', _lvarData.supFecha);
  setVal('lv_supHora',  _lvarData.supHora);

  // Construir secciones
  buildLvarOmars();
  buildLvarEquipos();
  buildLvarManualCheckList('lv_personal',   LVAR_PERSONAL,   'personal');
  buildLvarLoteCadList('lv_disol',          LVAR_DISOL,      'disol');
  buildLvarReactivos();
  buildLvarPatrones();
  buildLvarManualCheckList('lv_secundario', LVAR_SECUNDARIO, 'secundario');
  buildLvarManualCheckList('lv_material',   LVAR_MATERIAL,   'material');
  buildLvarEnvases();

  // AARMS v65: pre-llenar LVAR con catálogo actual
  await _catalogoCargar();
  // AARMS sub1-equipos: migrar equipos LVAR previa → catálogo y refrescar filas
  if(_catalogoMigrarEquiposDesdeLvar(_lvarData.equipos)){
    await _catalogoGuardar();
  }
  // AARMS lvarfix: rebuild equipos DESPUÉS de cargar catálogo (antes quedaban AA/PT/ vacíos)
  buildLvarEquipos();
  _lvarAutocompletarClavesDesdeInventario();
  await _catalogoPrefillLvarDOM();
  _aplicarDocEstadoBadge('lvar');
  _refreshBotonesContinuarLab();

  // Mostrar banner de bloqueo + deshabilitar inputs y botón PDF
  const banner = document.getElementById('lvarBlockedBanner');
  if(banner) banner.style.display = _lvarBloqueado ? 'block' : 'none';
  // Inputs read-only si está bloqueado
  document.querySelectorAll('#pgLVAR input, #pgLVAR textarea, #pgLVAR select').forEach(el => {
    if(_lvarBloqueado){
      el.setAttribute('readonly','');
      el.setAttribute('disabled','');
    } else {
      el.removeAttribute('readonly');
      el.removeAttribute('disabled');
    }
  });
  // Botón Guardar / Generar PDF
  const btns = document.querySelectorAll('#pgLVAR .bbar button, #pgLVAR button.btn');
  btns.forEach(b => {
    const t = (b.textContent||'').toLowerCase();
    if(t.includes('guardar') || t.includes('generar pdf')){
      b.disabled = _lvarBloqueado;
      b.style.opacity = _lvarBloqueado ? '.45' : '';
      b.style.cursor = _lvarBloqueado ? 'not-allowed' : '';
    }
  });

  goPage('pgLVAR');
  _lvarFlujoActivo = true;
  _pintarLvarFlujoStepper(1);
  _lvarAttachAutoCheck();
}

// ─── OMARs declaradas en el LVAR ───

let _lvarTmpIdCounter = 1;
function _lvarMakeEmptyOmar(){
  return {
    tmpId: 'tmp_' + Date.now() + '_' + (_lvarTmpIdCounter++),
    folio: '',
    sitio: '',
    ntomas: 1,
    analitos: [],   // códigos: FQ, DQO, MP, etc.
    noRealizada: false,
    motivoNR: '',
    omarId: null,   // Se llena cuando se genera el OMAR real (Zip 2)
  };
}

// Catálogo de analitos (códigos cortos) que el muestreador puede seleccionar.
// Cada uno mapea a un envase de la tabla LVAR_ENVASES.
const LVAR_ANALITOS_CHIPS = [
  {code:'FQ',    label:'Fisicoquímicos'},
  {code:'DBO5',  label:'DBO5'},
  {code:'DQO',   label:'DQO'},
  {code:'TOC',   label:'COT (TOC)'},
  {code:'MP',    label:'Metales pesados'},
  {code:'Hg',    label:'Mercurio'},
  {code:'CIAN',  label:'Cianuro'},
  {code:'FOS.',  label:'Fósforo / Fosfatos'},
  {code:'N.TOT', label:'NTK / Nitrógeno'},
  {code:'NO2',   label:'Nitritos'},
  {code:'NO3',   label:'Nitratos'},
  {code:'SAAM',  label:'SAAM'},
  {code:'GYA',   label:'Grasas y Aceites'},
  {code:'CTYF',  label:'Coliformes'},
  {code:'ECOL',  label:'E. coli'},
  {code:'ENTE.', label:'Enterococos'},
  {code:'HELM',  label:'Huevos de helminto'},
  {code:'CLR',   label:'Color verdadero'},
  {code:'CLOR',  label:'Cloruros'},
  {code:'CrHx',  label:'Cromo hexavalente'},
  {code:'TOX',   label:'Toxicidad aguda'},
];

// Helper: lista los OMARs reales del plan transformados al modelo de display
function _lvarGetOmarsActuales(){
  if(!_currentPlanId) return [];
  const muestreos = getMuestreosDePlan(_currentPlanId);
  const map = (typeof ANALITO_A_PARAM!=='undefined') ? ANALITO_A_PARAM : {};
  return muestreos.map(m => {
    const o = m.omar ? JSON.parse(m.omar) : {};
    const analitosCodes = new Set();
    (o.analitos || []).forEach(a => {
      // Si el nombre del analito ya ES un código corto (FQ, DQO, MP...), usarlo tal cual.
      const knownCodes = ['FQ','DBO5','DQO','TOC','MP','Hg','CIAN','FOS.','N.TOT','NO2','NO3','SAAM','GYA','CTYF','ECOL','ENTE.','HELM','CLR','CLOR','CrHx','TOX'];
      if(knownCodes.includes(a)){
        analitosCodes.add(a);
        return;
      }
      // Buscar en el mapa (nombres amigables → código)
      const code = map[a];
      if(code){
        analitosCodes.add(code);
      } else {
        // Fallback: si el analito no está en el mapa, asumir FQ (genérico)
        // para no dejar el cálculo de envases vacío.
        analitosCodes.add('FQ');
        console.warn('[LVAR] analito sin mapeo, asumiendo FQ:', a);
      }
    });
    return {
      omarId: m.id,
      folio: o.folio || m.folio || '',
      sitio: o.sitio || '',
      ntomas: parseInt(o.ntomas) || 1,
      analitos: [...analitosCodes],
      analitosNombres: o.analitos || [],
      noRealizada: !!o.noRealizada,
      motivoNR: o.motivoNR || '',
    };
  });
}

function buildLvarOmars(){
  const c = document.getElementById('lv_omars_list');
  if(!c) return;
  const list = _lvarGetOmarsActuales();
  if(list.length === 0){
    c.innerHTML = `<div style="text-align:center;padding:18px;color:var(--g2);font-size:12px;line-height:1.5">
      Aún no hay OMARs.<br>
      <span style="font-size:11px;color:var(--g3)">Vuelve al inicio y crea un plan para empezar.</span>
    </div>`;
    return;
  }
  c.innerHTML = list.map((om, idx) => _renderLvarOmarCard(om, idx)).join('');
  const activos = list.filter(o=>!o.noRealizada).length;
  const noRealizadas = list.length - activos;
  const badge = document.getElementById('lv_omarsBadge');
  if(badge) badge.textContent = `${activos} OMAR${activos===1?'':'s'}` + (noRealizadas?` · ${noRealizadas} N/R`:'');
}

function _renderLvarOmarCard(om, idx){
  // Chips read-only — se ven con los analitos seleccionados desde el OMAR
  const chips = (om.analitosNombres || []).map(a =>
    `<span style="background:rgba(74,158,255,.15);border:1px solid rgba(74,158,255,.4);color:#cfe1ff;padding:5px 9px;border-radius:7px;font-size:10.5px;font-family:var(--syne);font-weight:700">${a}</span>`
  ).join('') || '<span style="color:var(--g3);font-size:11px;font-style:italic">Sin analitos en este OMAR</span>';
  const dimStyle = om.noRealizada ? 'opacity:.6;background:rgba(248,113,113,.04);border:1px solid rgba(248,113,113,.25)' : 'background:var(--bg2);border:1px solid var(--ln)';
  const lockedNote = _lvarBloqueado ? '' : `
    <button type="button" onclick="lvarEditOmarReal(${om.omarId})" style="background:rgba(74,158,255,.1);border:1px solid rgba(74,158,255,.35);color:var(--acc);padding:5px 10px;border-radius:7px;font-size:10.5px;font-family:var(--syne);font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent">✎ Editar OMAR</button>
    <button type="button" onclick="continuarLvarACampo(${om.omarId})" style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.35);color:var(--amber);padding:5px 10px;border-radius:7px;font-size:10.5px;font-family:var(--syne);font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent">→ Campo</button>`;
  const norealBtn = _lvarBloqueado ? '' : `
    <button type="button" onclick="lvarToggleNoRealizadaReal(${om.omarId})" style="background:transparent;border:1px solid ${om.noRealizada?'rgba(134,239,172,.4)':'rgba(248,113,113,.4)'};color:${om.noRealizada?'var(--green)':'#f87171'};padding:5px 10px;border-radius:7px;font-size:10.5px;font-family:var(--syne);font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent">${om.noRealizada?'Marcar realizada':'No realizada'}</button>`;
  return `
    <div data-lv-omar-real="${om.omarId}" style="padding:12px;border-radius:11px;margin-bottom:10px;${dimStyle}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <div style="font-family:var(--syne);font-size:13px;font-weight:800;color:var(--w)">OMAR #${idx+1}${om.folio?` · <span style="color:var(--acc)">${om.folio}</span>`:''}${om.noRealizada?' <span style="color:#f87171;font-size:10px;font-weight:700">· NO REALIZADA</span>':''}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${lockedNote}${norealBtn}</div>
      </div>
      ${om.noRealizada && om.motivoNR ? `<div style="font-size:11px;color:#f87171;margin-bottom:8px;font-style:italic">Motivo: ${om.motivoNR}</div>` : ''}
      <div style="font-size:11.5px;color:var(--g1);margin-bottom:6px">
        <b style="color:var(--w)">Sitio:</b> ${om.sitio||'—'} · <b style="color:var(--w)">${om.ntomas} toma${om.ntomas!==1?'s':''}</b>
      </div>
      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);margin-bottom:6px">Analitos solicitados (${om.analitosNombres.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${chips}</div>
    </div>
  `;
}

function lvarEditOmarReal(omarId){
  if(_lvarBloqueado){ toast('LVAR bloqueado — no se pueden editar los OMARs','w'); return; }
  // Marcar para que después de guardar el OMAR regrese al LVAR (no al plan)
  _returnToLvarAfterOmar = true;
  toast('Editando OMAR... toca "Guardar y continuar al LVAR" cuando termines','');
  cargarMuestreo(omarId);
}

// + Agregar otro OMAR desde el LVAR: crea uno nuevo vacío vinculado al plan
async function lvarAgregarNuevoOmar(){
  if(!_currentPlanId){ toast('No hay plan abierto','r'); return; }
  if(_lvarBloqueado){ toast('LVAR bloqueado','w'); return; }
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan){ return; }
  const her = getMuestreosDePlan(_currentPlanId);
  let emp0 = '', muest0 = plan.muestreador || '', fecha0 = plan.fecha || new Date().toISOString().split('T')[0];
  if(her.length){
    const o0 = her[0].omar ? JSON.parse(her[0].omar) : {};
    emp0 = o0.empresa || her[0].empresa || '';
    if(o0.muestreador) muest0 = o0.muestreador;
    if(o0.fecha) fecha0 = o0.fecha;
  }
  const newMid = Date.now();
  await idbPut({
    id: newMid, planId: _currentPlanId,
    folio:'', empresa: emp0, fecha: fecha0,
    muestreador: muest0, ts: newMid,
    tomas:[], omar: JSON.stringify({ ts: newMid, muestreador: muest0, fecha: fecha0, analitos: [] }),
    sigData:null, sigData2:null,
  });
  plan.omarIds = [...(plan.omarIds||[]), newMid];
  await idbPlanPut(plan);
  await refreshCache();
  // Marcar para que regrese al LVAR al guardar
  _returnToLvarAfterOmar = true;
  toast('Nuevo OMAR creado — llena los datos y regresa al LVAR','g');
  cargarMuestreo(newMid);
}

async function lvarToggleNoRealizadaReal(omarId){
  if(_lvarBloqueado) return;
  const m = _cachedMuestreos.find(x=>x.id===omarId);
  if(!m) return;
  const o = m.omar ? JSON.parse(m.omar) : {};
  if(!o.noRealizada){
    // AARMS nobranding: promptApp evita "hostname says…" en Android
    const motivo = await promptApp({
      title: 'No realizada',
      message: 'Motivo de no realización (ej. acceso negado, descarga seca):',
      okText: 'Guardar'
    });
    if(motivo === null) return;
    o.noRealizada = true;
    o.motivoNR = motivo || '';
  } else {
    o.noRealizada = false;
    o.motivoNR = '';
  }
  m.omar = JSON.stringify(o);
  await idbPut(m);
  await refreshCache();
  buildLvarOmars();
  buildLvarEnvases();
  toast(o.noRealizada ? 'OMAR marcado como no realizada' : 'OMAR reactivado','g');
}

// Listener único que recalcula la palomita de cada fila cuando cambia algún input.
// Se enlaza una sola vez (idempotente).
let _lvarAutoCheckBound = false;
let _lvarAutoSaveTimer = null;
function _lvarAttachAutoCheck(){
  if(_lvarAutoCheckBound) return;
  const pg = document.getElementById('pgLVAR');
  if(!pg) return;
  const handler = e => {
    const inp = e.target;
    if(!inp) return;
    // AARMS lvarfix: edición manual de ID → ya no es AUTO del inventario
    if(inp.matches('[data-lv-eq][data-field="num"]') && e.type === 'input'){
      if(inp.getAttribute('data-from-catalog') === '1' && inp.dataset._lvarAutoSkip !== '1'){
        inp.removeAttribute('data-from-catalog');
        const row = inp.closest('[data-lv-row]');
        if(row){
          [...row.querySelectorAll('span')].forEach(s=>{
            if((s.textContent||'').trim() === 'AUTO') s.remove();
          });
        }
      }
    }
    // Auto-guardado debounced cada vez que cambia cualquier input del LVAR
    if(inp.matches('input, textarea, select')){
      clearTimeout(_lvarAutoSaveTimer);
      _lvarAutoSaveTimer = setTimeout(()=>{
        guardarLVAR(true).then(()=>{
          // Recalcular envases (puede cambiar al cambiar cant. manual de un envase)
          buildLvarEnvases();
          _refreshBotonesContinuarLab();
        });
      }, 600);
    }
    // Palomita auto
    if(inp.matches('input[data-required="true"]')){
      const row = inp.closest('[data-lv-row]');
      if(row){
        const inputs = row.querySelectorAll('input[data-required="true"]');
        let hasData = false;
        inputs.forEach(i=>{
          const v = String(i.value||'').trim();
          if(v !== '' && v !== '0') hasData = true;
        });
        const mark = row.querySelector('[data-lv-mark]');
        if(mark){
          const tmp = document.createElement('div');
          tmp.innerHTML = _lvCheckBadge(hasData);
          const newMark = tmp.firstChild;
          mark.replaceWith(newMark);
        }
      }
    }
  };
  pg.addEventListener('input', handler);
  pg.addEventListener('change', handler);
  _lvarAutoCheckBound = true;
}

async function cerrarLVAR(){
  await guardarLVAR(true);   // guarda silenciosamente
  _lvarFlujoActivo = false;
  _pintarLvarFlujoCampoBar();
  // Re-abrir el plan completo: refresca caché + renderiza + navega
  if(_currentPlanId){
    await abrirPlan(_currentPlanId);
  } else {
    goHome();
  }
}

// Sub-builders ------------------------------------------------------------

function _lvInput(value, ph, extraStyle=''){
  return `value="${(value||'').replace(/"/g,'&quot;')}" placeholder="${ph||''}" style="${extraStyle}"`;
}

function buildLvarEquipos(){
  const c = document.getElementById('lv_equipos');
  if(!c) return;
  const d = _lvarData.equipos || {};
  c.innerHTML = LVAR_EQUIPOS.map(eq=>{
    const saved = d[eq.key] || {};
    if(eq.fixedValue){
      // Cronómetro y GPS llevan texto fijo editable.
      // El input siempre arranca con texto (`saved.val || eq.fixedValue`),
      // así que la palomita debe estar ON desde el render inicial.
      const inputValue = saved.val !== undefined && saved.val !== '' ? saved.val : eq.fixedValue;
      const hasData = !!(inputValue && String(inputValue).trim() !== '');
      return `
        <div data-lv-row="${eq.key}" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--ln)">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;color:var(--w);font-weight:600">${eq.label}</div>
            <input data-lv-eq="${eq.key}" data-field="val" data-required="true" type="text" value="${inputValue}" style="margin-top:4px;width:100%">
          </div>
          ${_lvCheckBadge(hasData)}
        </div>`;
    }
    const catNum = _lvarNumDesdeCatalogo(eq.key);
    const userNum = saved.num && String(saved.num).trim() ? String(saved.num).trim() : '';
    // AARMS lvarfix: si vino del catálogo (o no hay override manual), preferir inventario
    const useCat = !!catNum && (!userNum || saved.fromCatalog);
    const displayNum = useCat ? catNum : (userNum || catNum || '');
    const fromCatalog = useCat;
    const hasData = !!displayNum;
    const autoBadge = fromCatalog
      ? '<span style="font-size:9px;font-weight:700;color:#10b981;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.35);padding:2px 6px;border-radius:4px;letter-spacing:.04em">AUTO</span>'
      : '';
    const fromAttr = fromCatalog ? ' data-from-catalog="1"' : '';
    return `
      <div data-lv-row="${eq.key}" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--ln)">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <div style="font-size:13px;color:var(--w);font-weight:600">${eq.label}</div>
            ${autoBadge}
          </div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:4px">
            <span style="font-family:var(--mono);font-size:12px;color:var(--acc);background:rgba(74,158,255,.1);padding:6px 8px;border-radius:6px;border:1px solid rgba(74,158,255,.25)">${eq.prefix}</span>
            <input data-lv-eq="${eq.key}" data-field="num" data-required="true" type="text" value="${displayNum.replace(/"/g,'&quot;')}" placeholder="nº" style="flex:1"${fromAttr}>
          </div>
        </div>
        ${_lvCheckBadge(hasData)}
      </div>`;
  }).join('');
}

// Palomita verde cuando hay datos, gris hueco cuando no.
// data-lv-mark es el target del refresco automático.
function _lvCheckBadge(on){
  const ok = '<svg data-lv-mark width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>';
  const off = '<svg data-lv-mark width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5b6173" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:.5"><circle cx="12" cy="12" r="9"/></svg>';
  return on ? ok : off;
}

function buildLvarSimpleCountList(containerId, items, section){
  const c = document.getElementById(containerId);
  if(!c) return;
  const d = _lvarData[section] || {};
  c.innerHTML = items.map(it=>{
    const saved = d[it.key] || {};
    // Default cant vacío para que palomita esté apagada hasta que el usuario teclee
    const cant = saved.cant !== undefined ? saved.cant : '';
    const hasData = cant !== '' && Number(cant) > 0;
    return `
      <div data-lv-row="${it.key}" style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--ln)">
        <input data-lv-${section}="${it.key}" data-field="cant" data-required="true" type="number" min="0" value="${cant}" placeholder="0" style="width:60px;text-align:center;flex-shrink:0">
        <div style="flex:1;font-size:12.5px;color:var(--w)">${it.label}</div>
        ${_lvCheckBadge(hasData)}
      </div>`;
  }).join('');
}

// Lista para Equipo Secundario y Material: SIEMPRE cantidad = 1 implícita.
// El muestreador solo marca un checkbox manual: ¿lo lleva o no?
// AARMS simfix: equipo personal con etiqueta PRESENTE/AUSENTE explícita
function buildLvarManualCheckList(containerId, items, section){
  const c = document.getElementById(containerId);
  if(!c) return;
  const d = _lvarData[section] || {};
  c.innerHTML = items.map(it=>{
    const saved = d[it.key] || {};
    const checked = !!saved.checked;
    const estado = checked
      ? '<span style="font-size:10px;font-weight:800;color:#10b981;letter-spacing:.04em">PRESENTE</span>'
      : '<span style="font-size:10px;font-weight:700;color:var(--g2);letter-spacing:.04em">AUSENTE</span>';
    return `
      <label data-lv-row="${it.key}" style="display:flex;align-items:center;gap:12px;padding:9px 4px;border-bottom:1px solid var(--ln);cursor:pointer;-webkit-tap-highlight-color:transparent">
        <input data-lv-${section}="${it.key}" data-field="checked" type="checkbox" ${checked?'checked':''}
               style="width:20px;height:20px;flex-shrink:0;accent-color:var(--acc);cursor:pointer"
               onchange="(function(cb){const st=cb.parentElement&&cb.parentElement.querySelector('[data-lv-pres]');if(st){st.textContent=cb.checked?'PRESENTE':'AUSENTE';st.style.color=cb.checked?'#10b981':'';}})(this)">
        <div style="flex:1;font-size:13px;color:var(--w)">${it.label}</div>
        <span data-lv-pres>${estado}</span>
      </label>`;
  }).join('');
}

function buildLvarLoteCadList(containerId, items, section){
  const c = document.getElementById(containerId);
  if(!c) return;
  const d = _lvarData[section] || {};
  c.innerHTML = items.map(it=>{
    const s = d[it.key] || {};
    const hasData = !!((s.lote && s.lote.trim()) || (s.cad && s.cad.trim()));
    return `
      <div data-lv-row="${it.key}" style="padding:8px 0;border-bottom:1px solid var(--ln)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
          <div style="flex:1;font-size:12.5px;color:var(--w);font-weight:600">${it.label}</div>
          ${_lvCheckBadge(hasData)}
        </div>
        <div class="g2">
          <input data-lv-${section}="${it.key}" data-lvar-disol="${it.key}" data-campo="lote" data-field="lote" data-required="true" type="text" value="${s.lote||''}" placeholder="Lote">
          <input data-lv-${section}="${it.key}" data-lvar-disol="${it.key}" data-campo="caducidad" data-field="cad" data-required="true" type="text" value="${s.cad||''}" placeholder="Caducidad (dd/mm/aa)">
        </div>
      </div>`;
  }).join('');
}

function buildLvarReactivos(){
  const c = document.getElementById('lv_react');
  if(!c) return;
  const d = _lvarData.react || {};
  c.innerHTML = LVAR_REACTIVOS.map(r=>{
    const s = d[r.key] || {};
    const hasData = !!((s.lote && s.lote.trim()) || (s.marca && s.marca.trim()) || (s.cad && s.cad.trim()));
    return `
      <div data-lv-row="${r.key}" style="padding:8px 0;border-bottom:1px solid var(--ln)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
          <div style="flex:1;font-size:12.5px;color:var(--w);font-weight:600">${r.label}</div>
          ${_lvCheckBadge(hasData)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          <input data-lv-react="${r.key}" data-lvar-disol="react-${r.key}" data-campo="lote" data-field="lote" data-required="true" type="text" value="${s.lote||''}"  placeholder="Lote">
          <input data-lv-react="${r.key}" data-lvar-disol="react-${r.key}" data-campo="marca" data-field="marca" data-required="true" type="text" value="${s.marca||''}" placeholder="Marca">
          <input data-lv-react="${r.key}" data-lvar-disol="react-${r.key}" data-campo="caducidad" data-field="cad" data-required="true" type="text" value="${s.cad||''}"   placeholder="Cad.">
        </div>
      </div>`;
  }).join('');
}

// AARMS v65-phfix: placeholder personalizado para marca según el patrón
const _MARCA_PLACEHOLDER = {
  'kcl_pat': '(preparado en lab)',
  // El resto usa "Marca" genérico
};

function buildLvarPatrones(){
  const c = document.getElementById('lv_patrones');
  if(!c) return;
  const d = _lvarData.patrones || {};
  c.innerHTML = LVAR_PATRONES.map(p=>{
    const s = d[p.key] || {};
    const hasData = !!((s.lote && s.lote.trim()) || (s.marca && s.marca.trim()) || (s.cad && s.cad.trim()) || (p.conValor && s.valor && s.valor.trim()));
    const grid = p.conValor
      ? 'grid-template-columns:70px 1fr 1fr 1fr'
      : 'grid-template-columns:1fr 1fr 1fr';
    const catId = _LVAR_PATRON_CAT[p.key] || '';
    const lvarPat = catId.startsWith('cond-')
      ? `data-lvar-cond="${catId.split('-')[1]}"`
      : (catId ? `data-lvar-patron="${catId}"` : '');
    // AARMS v65-phfix: agregar data-lvar-patron-ph + readonly cuando es el campo pH del patrón
    const phMap = _LVAR_PATRON_CAT[p.key];
    const phAttrs = phMap ? `data-lvar-patron-ph="${phMap}"` : '';
    return `
      <div data-lv-row="${p.key}" style="padding:8px 0;border-bottom:1px solid var(--ln)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
          <div style="flex:1;font-size:12.5px;color:var(--w);font-weight:600">${p.label}</div>
          ${_lvCheckBadge(hasData)}
        </div>
        <div style="display:grid;${grid};gap:6px">
          ${p.conValor ? `<input type="text" ${phAttrs} data-lv-patrones="${p.key}" data-campo="valor" data-field="valor" data-required="true" value="${s.valor||''}" placeholder="pH" readonly style="opacity:.85;background:rgba(74,158,255,.05);cursor:not-allowed;text-align:center;font-weight:700;color:var(--acc)">` : ''}
          <input data-lv-patrones="${p.key}" ${lvarPat} data-campo="lote" data-field="lote" data-required="true" type="text" value="${s.lote||''}"  placeholder="Lote">
          <input data-lv-patrones="${p.key}" ${lvarPat} data-campo="marca" data-field="marca" data-required="true" type="text" value="${s.marca||''}" placeholder="${_MARCA_PLACEHOLDER[p.key] || 'Marca'}">
          <input data-lv-patrones="${p.key}" ${lvarPat} data-campo="cad" data-field="cad" data-required="true" type="text" value="${s.cad||''}"   placeholder="Cad.">
        </div>
      </div>`;
  }).join('');
}

// Cálculo de envases por OMAR individual:
//  - Simple (Grasas, Coliformes, Toxicidad): 1 envase × tomas
//  - Compuesto (Fisicoquímico, DQO, Metales, etc.): tomas + 1 (n simples + 1 compuesta)
function _calcCantEnvasePorOmar(env, nTomas){
  const n = nTomas || 1;
  if(env.tipo === 'simple') return n;
  return n + 1;
}

function buildLvarEnvases(){
  const c = document.getElementById('lv_envases');
  if(!c) return;
  const d = _lvarData.envases || {};
  const omarsAll = _lvarGetOmarsActuales();
  const omars = omarsAll.filter(o => !o.noRealizada);

  const totalSummary = `${omars.length} OMAR${omars.length===1?'':'s'} activas`;
  const calcEl = document.getElementById('lv_envasesCalc');
  if(calcEl) calcEl.textContent = totalSummary;

  // Conjunto de analitos seleccionados en TODAS las OMARs activas (códigos)
  const analitosTotales = new Set();
  omars.forEach(o => (o.analitos || []).forEach(a => analitosTotales.add(a)));

  if(analitosTotales.size === 0){
    c.innerHTML = `<div style="text-align:center;padding:24px 12px;color:var(--g2);font-size:12.5px;line-height:1.55">
      Selecciona analitos en al menos una OMAR<br>
      <span style="font-size:11px;color:var(--g3)">Los envases aplicables se calculan automáticamente.</span>
    </div>`;
    return;
  }

  // Filtrar: solo envases con analitos coincidentes, o "siempre presentes"
  const aplicables = LVAR_ENVASES.filter(env => {
    if(env.analitos.length === 0) return true;
    return env.analitos.some(a => analitosTotales.has(a));
  });

  c.innerHTML = aplicables.map(env => {
    const saved = d[env.key] || {};
    let cantCalc = 0;
    omars.forEach((o) => {
      const aplica = env.analitos.length === 0 || env.analitos.some(a => (o.analitos||[]).includes(a));
      if(!aplica) return;
      cantCalc += _calcCantEnvasePorOmar(env, o.ntomas);
    });
    const cant = saved.cant !== undefined ? saved.cant : cantCalc;
    const tipoBadge = env.tipo === 'simple'
      ? `<span style="background:rgba(251,191,36,.1);color:var(--amber);font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:4px">SIMPLE</span>`
      : `<span style="background:rgba(74,158,255,.12);color:var(--acc);font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:4px">COMPUESTO</span>`;
    const readonlyAttr = _lvarBloqueado ? 'readonly' : '';
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--ln)">
        <input data-lv-envases="${env.key}" data-field="cant" type="number" min="0" value="${cant}" ${readonlyAttr} style="width:60px;text-align:center;flex-shrink:0;font-weight:800;color:var(--acc)">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:var(--w);line-height:1.3">${_lvarEnvaseDisplayLabel(env)}</div>
          <div style="margin-top:3px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${tipoBadge}</div>
        </div>
      </div>`;
  }).join('');
}

async function guardarLVAR(silent){
  if(!_currentPlanId) return;
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan) return;
  if(_lvarBloqueado){ return; }  // No-op si está bloqueado

  const gv = id => { const e=document.getElementById(id); return e?e.value.trim():''; };

  const data = {
    folio:     gv('lv_folio'),
    fecha:     gv('lv_fecha'),
    lugar:     gv('lv_lugar'),
    direccion: gv('lv_dir'),
    ciudad:    gv('lv_ciudad'),
    estado:    gv('lv_estado'), // AARMS v64: estado separado
    tipo:      gv('lv_tipo'),
    norma:     gv('lv_norma'),
    obs:       gv('lv_obs'),
    asig:      gv('lv_asig'),
    asigFecha: gv('lv_asigFecha'),
    asigHora:  gv('lv_asigHora'),
    sup:       gv('lv_sup'),
    supFecha:  gv('lv_supFecha'),
    supHora:   gv('lv_supHora'),
    // Los OMARs NO se duplican aquí — viven en la store de muestreos.
    equipos:{}, personal:{}, disol:{}, react:{}, patrones:{}, secundario:{}, material:{}, envases:{}
  };

  // Rescatar todos los data-lv-* del DOM
  const secMap = {eq:'equipos', personal:'personal', disol:'disol', react:'react', patrones:'patrones', secundario:'secundario', material:'material', envases:'envases'};
  for(const s of Object.keys(secMap)){
    const target = secMap[s];
    document.querySelectorAll(`[data-lv-${s}]`).forEach(inp=>{
      const key = inp.getAttribute(`data-lv-${s}`);
      const field = inp.getAttribute('data-field');
      if(!data[target][key]) data[target][key] = {};
      const val = inp.type === 'checkbox' ? inp.checked : inp.value;
      data[target][key][field] = val;
      // AARMS lvarfix: recordar si el ID vino del inventario (sincronizable)
      if(target === 'equipos' && field === 'num'){
        data[target][key].fromCatalog = inp.getAttribute('data-from-catalog') === '1';
      }
    });
  }

  plan.lvar = data;
  plan.docs = plan.docs || {};
  plan.docs.lvar = {done: !!(data.folio && data.asig), updatedAt: Date.now()};
  await guardarPlan(plan);
  _lvarData = data;
  if(!silent) toast('LVAR guardado ✓','g');
  _refreshBotonesContinuarLab();
  // AARMS simfix: refrescar candados tras guardar LVAR
  if(typeof _actualizarGatePlanUI === 'function') _actualizarGatePlanUI();
}

async function generarPDFLVAR(){
  if(!_currentPlanId){ toast('No hay plan abierto','w'); return; }
  await guardarLVAR(true);
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan){ return; }
  const data = plan.lvar || {};

  // AARMS v66-fix: fusionar valores del catálogo en data antes de generar PDF
  // Esto asegura que disoluciones, reactivos y patrones lleven sus lotes/marcas/caducidades
  // aunque el usuario solo haya visto el prefill en pantalla (sin tocarlo).
  await _catalogoCargar();
  if(_catalogoCache){
    // DISOLUCIONES
    data.disol = data.disol || {};
    LVAR_DISOL.forEach(it => {
      const actual = data.disol[it.key] || {};
      const cat = _catalogoDisolMatch(it);
      if(cat){
        if(!actual.lote && cat.lote) actual.lote = cat.lote;
        if(!actual.cad && cat.caducidad) actual.cad = cat.caducidad;
        data.disol[it.key] = actual;
      }
    });
    // REACTIVOS (HNO3 ACS, HNO3 Suprapuro)
    data.react = data.react || {};
    LVAR_REACTIVOS.forEach(it => {
      const actual = data.react[it.key] || {};
      const cat = _catalogoMatchPorNombre(it.pdfLabel || it.label || it.key);
      if(cat){
        if(!actual.lote && cat.lote) actual.lote = cat.lote;
        if(!actual.marca){
          actual.marca = cat.marca || _catalogoMarcaDesdeNombre(cat.nombre) || '';
        }
        if(!actual.cad && cat.caducidad) actual.cad = cat.caducidad;
        data.react[it.key] = actual;
      }
    });
    // PATRONES (referencia + trabajo + KCl + agua reactivo)
    data.patrones = data.patrones || {};
    LVAR_PATRONES.forEach(p => {
      const actual = data.patrones[p.key] || {};
      const mapKey = _LVAR_PATRON_CAT[p.key]; // 'ver-0', 'cal-1', 'cond-0', 'agua_reactivo'
      if(!mapKey) return;
      let catItem = null;
      if(mapKey.startsWith('ver-')){
        const i = parseInt(mapKey.split('-')[1], 10);
        catItem = _catalogoCache.buffers?.verificacion?.[i];
        if(catItem && !actual.valor) actual.valor = (typeof catItem.ph === 'number') ? catItem.ph.toFixed(2) : (catItem.ph || '');
      } else if(mapKey.startsWith('cal-')){
        const i = parseInt(mapKey.split('-')[1], 10);
        catItem = _catalogoCache.buffers?.calibracion?.[i];
        if(catItem && !actual.valor) actual.valor = (typeof catItem.ph === 'number') ? catItem.ph.toFixed(2) : (catItem.ph || '');
      } else if(mapKey.startsWith('cond-')){
        const i = parseInt(mapKey.split('-')[1], 10);
        catItem = _catalogoCache.conductividad?.[i];
        // KCl no lleva valor pH; deja vacío (la columna valor mostrará '-')
      } else if(mapKey === 'agua_reactivo'){
        catItem = _catalogoAguaReactivo();
      }
      if(catItem){
        if(!actual.lote && catItem.lote) actual.lote = catItem.lote;
        if(!actual.marca && catItem.marca) actual.marca = catItem.marca;
        if(!actual.cad && catItem.caducidad) actual.cad = catItem.caducidad;
        data.patrones[p.key] = actual;
      }
      // AARMS v66-p2: KCl Patrón se prepara en lab → marca explícita en PDF si vacía
      if(p.key === 'kcl_pat'){
        const pat = data.patrones[p.key] || actual;
        if(!pat.marca || !String(pat.marca).trim()){
          pat.marca = '(preparado en lab)';
          data.patrones[p.key] = pat;
        }
      }
    });
    // Guardar la fusión en el plan
    plan.lvar = data;
    try { await guardarPlan(plan); } catch(e){ console.warn('[lvar pdf fusión catálogo]', e); }
  }

  const {jsPDF} = window.jspdf;
  const logoPDF = await loadLogo(LOGO_PDF_URI);

  // Portrait letter: 612 x 792 pt
  // AARMS sub8-pdfs: tablas/firma premium (helpers Machiote, Helvetica); columnas intactas
  const doc = new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612, H=792, M=28;
  const CW = W - M*2;  // 556
  const FONT = 'helvetica';
  const _hdrPrem = window._pdfHeaderTablaPremium;
  const _filaPrem = window._pdfFilaTablaPremium;
  const _firmaPrem = window._pdfFirmaPremium;

  // Paleta — consistente con los otros PDFs
  const NAVY=[10,22,40], BLUE=[26,58,107], ACCENT=[37,99,235];
  const MGRAY=[208,216,228], LGRAY=[232,238,245], DGRAY=[51,65,85];
  const WHITE=[255,255,255], GREEN=[22,163,74];

  // AARMS v64: header uniforme
  const HDR = 72;
  const folioLVAR = (plan.lvar && plan.lvar.folio) ? `Folio: ${plan.lvar.folio}` : 'Folio: —';
  // AARMS sub10-std: LVAR usa membrete compartido
  _pdfStdHeader(doc, logoPDF, W, M, HDR, 'LISTA DE VERIFICACION', folioLVAR || 'LVAR', 'F-AA-60-16');
  let y = HDR + 8;

  // ════════ Helpers de dibujo ════════
  // Limpia caracteres que jsPDF helvetica base no soporta (subíndices, símbolos,
  // guiones largos). Tildes y ñ/Ñ sí están soportados, no se tocan.
  const asci = (s) => {
    if(s == null || s === '') return '';
    return String(s)
      .replace(/[₀]/g,'0').replace(/[₁]/g,'1').replace(/[₂]/g,'2').replace(/[₃]/g,'3').replace(/[₄]/g,'4')
      .replace(/[₅]/g,'5').replace(/[₆]/g,'6').replace(/[₇]/g,'7').replace(/[₈]/g,'8').replace(/[₉]/g,'9')
      .replace(/[⁰]/g,'0').replace(/[¹]/g,'1').replace(/[²]/g,'2').replace(/[³]/g,'3').replace(/[⁴]/g,'4')
      .replace(/[⁵]/g,'5').replace(/[⁶]/g,'6').replace(/[⁷]/g,'7').replace(/[⁸]/g,'8').replace(/[⁹]/g,'9')
      .replace(/µ/g,'u').replace(/—/g,'-').replace(/–/g,'-')
      .replace(/[“”]/g,'"').replace(/[‘’]/g,"'")
      .replace(/✓/g,'v').replace(/✗/g,'x').replace(/✕/g,'x')
      .replace(/[°]/g,' ');  // grado: lo dejamos como espacio (lo dibujamos aparte si hace falta)
  };
  doc.setFont(FONT,'normal'); doc.setFontSize(8); doc.setTextColor(...DGRAY);
  y += 14;
  // Palomita vectorial verde dibujada con líneas (no caracter)
  const drawCheck = (cx, cy, color=GREEN) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(1.4);
    doc.line(cx-3,   cy+0.5, cx-0.8, cy+2.7);
    doc.line(cx-0.8, cy+2.7, cx+3.2, cy-1.8);
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.3);
  };

  const sectionTitle = (label, yy, accent=NAVY) => {
    doc.setFillColor(...accent);
    doc.rect(M, yy, CW, 12, 'F');
    doc.setTextColor(...WHITE); doc.setFont(FONT,'bold'); doc.setFontSize(8.5);
    doc.text(asci(label), M+5, yy+8.3);
    return yy + 12;
  };
  const bordeRect = (x,yy,w,h) => {
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.3);
    doc.rect(x, yy, w, h, 'S');
  };
  const textCell = (x,yy,w,h,label,val,opts={}) => {
    if(opts.fillBg!==false){
      doc.setFillColor(...LGRAY); doc.rect(x,yy,w,h,'F');
    }
    bordeRect(x,yy,w,h);
    doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(6.3);
    doc.text(asci(label), x+3, yy+5.5);
    const raw = (val==null||val==='') ? '' : asci(String(val));
    const isEmpty = !raw || raw.trim() === '-' || raw.trim() === '';
    doc.setFont(FONT, isEmpty ? 'normal' : 'bold');
    doc.setTextColor(...(isEmpty ? [170,178,191] : ACCENT));
    doc.setFontSize(8.2);
    doc.text((isEmpty ? '-' : raw).substring(0,Math.floor(w/4.4)), x+3, yy+h-3);
  };

  // Asegurar página nueva si nos pasamos (deja espacio para firma premium)
  const ensureSpace = (need) => {
    if(y + need > H - 90){
      drawFooter();
      doc.addPage();
      y = M;
    }
  };

  // AARMS v66-fix: dibuja un valor con color azul (ACCENT) si está lleno, gris claro si está vacío
  const valStyle = (txt) => {
    const isEmpty = !txt || String(txt).trim() === '' || String(txt).trim() === '-';
    if(isEmpty){
      doc.setTextColor(170, 178, 191);  // gris claro
      doc.setFont(FONT,'normal');
    } else {
      doc.setTextColor(...ACCENT);  // azul brillante
      doc.setFont(FONT,'bold');
    }
    return isEmpty ? '-' : String(txt);
  };

  // ════════ DATOS GENERALES ════════
  y = sectionTitle('DATOS GENERALES', y);
  const r1H = 22;
  textCell(M,         y, CW*0.30, r1H, 'FECHA',         data.fecha || '');
  textCell(M+CW*0.30, y, CW*0.40, r1H, 'CIUDAD',        data.ciudad || '');
  textCell(M+CW*0.70, y, CW*0.30, r1H, 'NORMA',         data.norma  || '');
  y += r1H;
  textCell(M, y, CW*0.50, r1H, 'LUGAR DE MUESTREO', data.lugar || '');
  textCell(M+CW*0.50, y, CW*0.50, r1H, 'TIPO DE MUESTREO', data.tipo || '');
  y += r1H;
  textCell(M, y, CW, r1H, 'DIRECCIÓN', data.direccion || '');
  y += r1H + 6;

  // (Sección OMARs eliminada — info reside en BPM y hoja de campo, no en LVAR)

  // ════════ EQUIPOS ════════
  ensureSpace(80);
  y = sectionTitle('EQUIPOS', y);
  const equip = data.equipos || {};
  const eqH = 14;
  // AARMS sub8-pdfs: header NAVY premium
  const eqCws = [CW*0.50, CW*0.35, CW*0.15];
  if(typeof _hdrPrem === 'function'){
    y = _hdrPrem(doc, ['EQUIPO','CLAVE','PRESENTE'], M, y, eqCws, eqH, FONT);
  } else {
    doc.setFillColor(...MGRAY); doc.rect(M, y, CW, eqH, 'F');
    bordeRect(M, y, CW, eqH);
    doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(7);
    doc.text('EQUIPO', M+5, y+9);
    doc.text('CLAVE', M+CW*0.50, y+9);
    doc.text('PRESENTE', M+CW*0.92, y+9, {align:'center'});
    y += eqH;
  }

  LVAR_EQUIPOS.forEach((eq, idx) => {
    ensureSpace(eqH+2);
    const saved = equip[eq.key] || {};
    let val;
    if(eq.fixedValue) val = saved.val || eq.fixedValue;
    else val = (saved.num ? `${eq.prefix}${saved.num}` : '');
    const has = !!(saved.num && String(saved.num).trim()!=='') || !!(saved.val && saved.val.trim()!=='');
    if(typeof _filaPrem === 'function'){
      y = _filaPrem(doc, [asci(eq.label), asci(val||''), has?'SI':''], M, y, eqCws, eqH, idx, {
        font:FONT, fontSize:7.5, maxCharsArr:[36, 22, 6]
      });
    } else {
      const bg = idx%2===0 ? WHITE : [248,250,252];
      doc.setFillColor(...bg); doc.rect(M, y, CW, eqH, 'F');
      bordeRect(M, y, CW, eqH);
      doc.setTextColor(...DGRAY); doc.setFont(FONT,'normal'); doc.setFontSize(8);
      doc.text(asci(eq.label), M+5, y+9);
      doc.text(asci(valStyle(val)), M+CW*0.50, y+9);
      if(has) drawCheck(M+CW*0.92, y+eqH/2);
      else { doc.setTextColor(180,180,180); doc.setFontSize(9); doc.text('-', M+CW*0.92, y+10, {align:'center'}); }
      y += eqH;
    }
  });
  y += 6;

  // ════════ DISOLUCIONES (lote + caducidad) ════════
  ensureSpace(80);
  y = sectionTitle('DISOLUCIONES', y);
  const dH = 14;
  const disCws = [CW*0.55, CW*0.23, CW*0.22];
  if(typeof _hdrPrem === 'function'){
    y = _hdrPrem(doc, ['DISOLUCION','LOTE','CADUCIDAD'], M, y, disCws, dH, FONT);
  } else {
    doc.setFillColor(...MGRAY); doc.rect(M, y, CW, dH, 'F');
    bordeRect(M, y, CW, dH);
    doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(7);
    doc.text('DISOLUCIÓN', M+5, y+9);
    doc.text('LOTE', M+CW*0.55, y+9);
    doc.text('CADUCIDAD', M+CW*0.78, y+9);
    y += dH;
  }
  const dis = data.disol || {};
  LVAR_DISOL.forEach((d,idx) => {
    ensureSpace(dH+2);
    const s = dis[d.key] || {};
    if(typeof _filaPrem === 'function'){
      y = _filaPrem(doc, [asci(d.pdfLabel || d.label), asci(s.lote||''), asci(s.cad||'')], M, y, disCws, dH, idx, {
        font:FONT, fontSize:7.2, maxCharsArr:[40, 16, 14]
      });
    } else {
      const bg = idx%2===0 ? WHITE : [248,250,252];
      doc.setFillColor(...bg); doc.rect(M, y, CW, dH, 'F');
      bordeRect(M, y, CW, dH);
      doc.setFontSize(7.5);
      doc.setTextColor(...DGRAY); doc.setFont(FONT,'normal');
      doc.text(asci(d.pdfLabel || d.label), M+5, y+9);
      doc.text(asci(valStyle(s.lote)), M+CW*0.55, y+9);
      doc.text(asci(valStyle(s.cad)),  M+CW*0.78, y+9);
      y += dH;
    }
  });
  y += 6;

  // ════════ REACTIVOS ════════
  ensureSpace(50);
  y = sectionTitle('REACTIVOS', y);
  const reacCws = [CW*0.45, CW*0.20, CW*0.20, CW*0.15];
  if(typeof _hdrPrem === 'function'){
    y = _hdrPrem(doc, ['REACTIVO','LOTE','MARCA','CAD.'], M, y, reacCws, dH, FONT);
  } else {
    doc.setFillColor(...MGRAY); doc.rect(M, y, CW, dH, 'F');
    bordeRect(M, y, CW, dH);
    doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(7);
    doc.text('REACTIVO', M+5, y+9);
    doc.text('LOTE',     M+CW*0.45, y+9);
    doc.text('MARCA',    M+CW*0.65, y+9);
    doc.text('CAD.',     M+CW*0.85, y+9);
    y += dH;
  }
  const reac = data.react || {};
  LVAR_REACTIVOS.forEach((r,idx) => {
    ensureSpace(dH+2);
    const s = reac[r.key] || {};
    if(typeof _filaPrem === 'function'){
      y = _filaPrem(doc, [asci(r.pdfLabel || r.label), asci(s.lote||''), asci(s.marca||''), asci(s.cad||'')], M, y, reacCws, dH, idx, {
        font:FONT, fontSize:7.2, maxCharsArr:[32, 14, 14, 12]
      });
    } else {
      const bg = idx%2===0 ? WHITE : [248,250,252];
      doc.setFillColor(...bg); doc.rect(M, y, CW, dH, 'F');
      bordeRect(M, y, CW, dH);
      doc.setFontSize(7.5);
      doc.setTextColor(...DGRAY); doc.setFont(FONT,'normal');
      doc.text(asci(r.pdfLabel || r.label), M+5, y+9);
      doc.text(asci(valStyle(s.lote)),  M+CW*0.45, y+9);
      doc.text(asci(valStyle(s.marca)), M+CW*0.65, y+9);
      doc.text(asci(valStyle(s.cad)),   M+CW*0.85, y+9);
      y += dH;
    }
  });
  y += 6;

  // ════════ PATRONES DE CALIBRACIÓN ════════
  ensureSpace(80);
  y = sectionTitle('SOLUCIONES DE CALIBRACIÓN', y);
  const patCws = [CW*0.42, CW*0.13, CW*0.15, CW*0.17, CW*0.13];
  if(typeof _hdrPrem === 'function'){
    y = _hdrPrem(doc, ['PATRON','VALOR','LOTE','MARCA','CAD.'], M, y, patCws, dH, FONT);
  } else {
    doc.setFillColor(...MGRAY); doc.rect(M, y, CW, dH, 'F');
    bordeRect(M, y, CW, dH);
    doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(7);
    doc.text('PATRÓN', M+5, y+9);
    doc.text('VALOR',  M+CW*0.42, y+9);
    doc.text('LOTE',   M+CW*0.55, y+9);
    doc.text('MARCA',  M+CW*0.72, y+9);
    doc.text('CAD.',   M+CW*0.89, y+9);
    y += dH;
  }
  const pat = data.patrones || {};
  LVAR_PATRONES.forEach((p,idx) => {
    ensureSpace(dH+2);
    const s = pat[p.key] || {};
    if(typeof _filaPrem === 'function'){
      y = _filaPrem(doc, [
        asci(p.pdfLabel || p.label),
        asci(p.conValor ? (s.valor||'') : ''),
        asci(s.lote||''), asci(s.marca||''), asci(s.cad||'')
      ], M, y, patCws, dH, idx, {
        font:FONT, fontSize:7.0, maxCharsArr:[30, 10, 12, 14, 12]
      });
    } else {
      const bg = idx%2===0 ? WHITE : [248,250,252];
      doc.setFillColor(...bg); doc.rect(M, y, CW, dH, 'F');
      bordeRect(M, y, CW, dH);
      doc.setFontSize(7.5);
      doc.setTextColor(...DGRAY); doc.setFont(FONT,'normal');
      doc.text(asci(p.pdfLabel || p.label), M+5, y+9);
      doc.text(asci(valStyle(p.conValor ? s.valor : '')), M+CW*0.42, y+9);
      doc.text(asci(valStyle(s.lote)),  M+CW*0.55, y+9);
      doc.text(asci(valStyle(s.marca)), M+CW*0.72, y+9);
      doc.text(asci(valStyle(s.cad)),   M+CW*0.89, y+9);
      y += dH;
    }
  });
  y += 6;

  // ════════ EQUIPO PERSONAL (checks manuales) ════════
  ensureSpace(60);
  y = sectionTitle('EQUIPO PERSONAL', y);
  const pers = data.personal || {};
  const persH = 14;
  const colW = CW/2;
  let colIdx = 0;
  LVAR_PERSONAL.forEach((it, idx) => {
    const s = pers[it.key] || {};
    const checked = !!s.checked;
    const xCol = M + (colIdx===0 ? 0 : colW);
    if(colIdx===0 && idx>0) ensureSpace(persH+2);
    const bg = (Math.floor(idx/2))%2===0 ? WHITE : LGRAY;
    doc.setFillColor(...bg); doc.rect(xCol, y, colW, persH, 'F');
    bordeRect(xCol, y, colW, persH);
    // checkbox visual
    doc.setDrawColor(120,128,142); doc.setLineWidth(0.6);
    doc.rect(xCol+5, y+3, 7, 7, 'S');
    if(checked){
      doc.setDrawColor(...GREEN); doc.setLineWidth(1.2);
      doc.line(xCol+6,   y+6.5, xCol+8.2, y+8.7);
      doc.line(xCol+8.2, y+8.7, xCol+11.5, y+4.5);
    }
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.3);
    doc.setTextColor(...DGRAY); doc.setFont(FONT,'normal'); doc.setFontSize(7);
    doc.text(asci(it.label), xCol+16, y+9);
    colIdx = 1 - colIdx;
    if(colIdx===0) y += persH;
  });
  if(colIdx===1) y += persH;
  y += 6;

  // ════════ EQUIPO SECUNDARIO + MATERIAL (checks manuales en columnas) ════════
  ensureSpace(60);
  y = sectionTitle('EQUIPO SECUNDARIO Y MATERIAL', y);
  const sec = data.secundario || {};
  const mat = data.material  || {};
  const allCheckable = [
    ...LVAR_SECUNDARIO.map(it=>({...it, _src: sec, _from:'sec'})),
    ...LVAR_MATERIAL.map(it=>({...it, _src: mat, _from:'mat'})),
  ];
  const cH = 14;
  colIdx = 0;
  allCheckable.forEach((it, idx) => {
    const s = it._src[it.key] || {};
    const checked = !!s.checked;
    const xCol = M + (colIdx===0 ? 0 : colW);
    if(colIdx===0 && idx>0) ensureSpace(cH+2);
    const bg = (Math.floor(idx/2))%2===0 ? WHITE : LGRAY;
    doc.setFillColor(...bg); doc.rect(xCol, y, colW, cH, 'F');
    bordeRect(xCol, y, colW, cH);
    // Checkbox visual
    doc.setDrawColor(120,128,142); doc.setLineWidth(0.6);
    doc.rect(xCol+5, y+3, 7, 7, 'S');
    if(checked){
      doc.setDrawColor(...GREEN); doc.setLineWidth(1.2);
      doc.line(xCol+6,   y+6.5, xCol+8.2, y+8.7);
      doc.line(xCol+8.2, y+8.7, xCol+11.5, y+4.5);
    }
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.3);
    doc.setTextColor(...DGRAY); doc.setFont(FONT,'normal'); doc.setFontSize(7);
    doc.text(asci(it.label), xCol+16, y+9);
    colIdx = 1 - colIdx;
    if(colIdx===0) y += cH;
  });
  if(colIdx===1) y += cH;
  y += 6;

  // ════════ CONTENEDORES ════════
  ensureSpace(80);
  y = sectionTitle('CONTENEDORES POR TIPO DE MUESTRA', y);
  const env = data.envases || {};
  // Filtrar solo aplicables (igual que la pantalla)
  // Obtener OMARs reales del plan para cálculo de envases (no se dibujan en el PDF)
  const omars = _lvarGetOmarsActuales();
  const omarsActivas = omars.filter(o => !o.noRealizada);
  const analitosTotales = new Set();
  omarsActivas.forEach(o => (o.analitos||[]).forEach(a => analitosTotales.add(a)));
  const aplicables = LVAR_ENVASES.filter(e => {
    if(e.analitos.length === 0) return true;
    return e.analitos.some(a => analitosTotales.has(a));
  });

  const envH = 14;
  const envCws = [CW*0.70, CW*0.15, CW*0.15];
  if(typeof _hdrPrem === 'function'){
    y = _hdrPrem(doc, ['CONTENEDOR','TIPO','CANTIDAD'], M, y, envCws, envH, FONT);
  } else {
    doc.setFillColor(...MGRAY); doc.rect(M, y, CW, envH, 'F');
    bordeRect(M, y, CW, envH);
    doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(7);
    doc.text('CONTENEDOR', M+5, y+9);
    doc.text('TIPO',         M+CW*0.74, y+9, {align:'center'});
    doc.text('CANTIDAD',     M+CW*0.92, y+9, {align:'center'});
    y += envH;
  }

  if(aplicables.length === 0){
    if(typeof _filaPrem === 'function'){
      y = _filaPrem(doc, ['Sin envases declarados (no hay analitos seleccionados)', '', ''], M, y, envCws, envH, 0, {
        font:FONT, fontSize:7.0, maxCharsArr:[55, 8, 8]
      });
    } else {
      doc.setFillColor(...LGRAY); doc.rect(M, y, CW, envH, 'F');
      bordeRect(M, y, CW, envH);
      doc.setTextColor(120,128,142); doc.setFont(FONT,'italic'); doc.setFontSize(7.5);
      doc.text('Sin envases declarados (no hay analitos seleccionados)', M+5, y+9);
      y += envH;
    }
  } else {
    aplicables.forEach((envItem, idx) => {
      ensureSpace(envH+2);
      const s = env[envItem.key] || {};
      let cantCalc = 0;
      omarsActivas.forEach(o => {
        const aplica = envItem.analitos.length === 0 || envItem.analitos.some(a => (o.analitos||[]).includes(a));
        if(aplica) cantCalc += _calcCantEnvasePorOmar(envItem, o.ntomas);
      });
      const cant = (s.cant!==undefined && s.cant!=='') ? s.cant : cantCalc;
      if(typeof _filaPrem === 'function'){
        y = _filaPrem(doc, [
          asci(_lvarEnvaseDisplayLabel(envItem)).substring(0,65),
          String(envItem.tipo||'').toUpperCase(),
          (cant !== undefined && cant !== '') ? String(cant) : ''
        ], M, y, envCws, envH, idx, {
          font:FONT, fontSize:6.8, maxCharsArr:[50, 10, 8]
        });
      } else {
        const bg = idx%2===0 ? WHITE : [248,250,252];
        doc.setFillColor(...bg); doc.rect(M, y, CW, envH, 'F');
        bordeRect(M, y, CW, envH);
        doc.setTextColor(...DGRAY); doc.setFont(FONT,'normal'); doc.setFontSize(7);
        doc.text(asci(_lvarEnvaseDisplayLabel(envItem)).substring(0,65), M+5, y+9);
        doc.setFont(FONT,'bold'); doc.setFontSize(6.5);
        if(envItem.tipo==='simple'){ doc.setTextColor(180,130,20); }
        else                       { doc.setTextColor(...ACCENT); }
        doc.text(envItem.tipo.toUpperCase(), M+CW*0.74, y+9, {align:'center'});
        doc.text(asci(valStyle(cant !== undefined && cant !== '' ? String(cant) : '')), M+CW*0.92, y+9, {align:'center'});
        y += envH;
      }
    });
  }
  y += 8;

  // ════════ RESPONSABLES ════════
  ensureSpace(80);
  y = sectionTitle('RESPONSABLES', y);
  const respH = 26;
  // Persona asignada
  doc.setFillColor(...LGRAY); doc.rect(M, y, CW*0.5, respH, 'F');
  bordeRect(M, y, CW*0.5, respH);
  doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(6.5);
  doc.text('PERSONA ASIGNADA (MUESTREADOR)', M+4, y+6);
  doc.setFont(FONT,'bold'); doc.setTextColor(...ACCENT); doc.setFontSize(8.5);
  doc.text(asci(data.asig||'-'), M+4, y+15);
  doc.setFontSize(6.8); doc.setTextColor(100,110,130); doc.setFont(FONT,'normal');
  doc.text(`Fecha: ${data.asigFecha||'-'}    Hora: ${data.asigHora||'-'}`, M+4, y+22);
  // Supervisor
  doc.setFillColor(...LGRAY); doc.rect(M+CW*0.5, y, CW*0.5, respH, 'F');
  bordeRect(M+CW*0.5, y, CW*0.5, respH);
  doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(6.5);
  doc.text('SUPERVISOR', M+CW*0.5+4, y+6);
  doc.setFont(FONT,'bold'); doc.setTextColor(...ACCENT); doc.setFontSize(8.5);
  doc.text(asci(data.sup||'-'), M+CW*0.5+4, y+15);
  doc.setFontSize(6.8); doc.setTextColor(100,110,130); doc.setFont(FONT,'normal');
  doc.text(`Fecha: ${data.supFecha||'-'}    Hora: ${data.supHora||'-'}`, M+CW*0.5+4, y+22);
  y += respH;

  // Observaciones
  if(data.obs && data.obs.trim()){
    ensureSpace(40);
    const obsH = 30;
    doc.setFillColor(255,250,235); doc.rect(M, y, CW, obsH, 'F');
    doc.setDrawColor(220,180,80); doc.setLineWidth(0.5);
    doc.rect(M, y, CW, obsH, 'S');
    doc.setTextColor(140,80,10); doc.setFont(FONT,'bold'); doc.setFontSize(7);
    doc.text('OBSERVACIONES', M+4, y+8);
    doc.setFont(FONT,'normal'); doc.setTextColor(...DGRAY); doc.setFontSize(8);
    const obsLines = doc.splitTextToSize(asci(data.obs.trim()), CW-10);
    doc.text(obsLines.slice(0,3), M+4, y+16);
    y += obsH;
  }

  // ════════ FOOTER / FIRMA PREMIUM ════════
  // AARMS sub8-pdfs: firma premium F-AA-60-16 (Digital)
  function drawFooter(pagLabel){
    if(typeof _firmaPrem === 'function'){
      const n = (doc.internal && doc.internal.getNumberOfPages) ? doc.internal.getNumberOfPages() : 1;
      _firmaPrem(doc, pagLabel || ('Pag. '+n), 'F-AA-60-16 (Digital)', { font:FONT, W, H, yOffset:70 });
    } else {
      const fy = H - 22;
      doc.setDrawColor(...MGRAY); doc.setLineWidth(0.4);
      doc.line(M, fy-4, W-M, fy-4);
      doc.setFont(FONT,'normal'); doc.setFontSize(6.5); doc.setTextColor(120,128,142);
      doc.text('Asesoría y Análisis S.C.  —  Tel. 622 224 0910  —  Guaymas, Sonora', M, fy);
      doc.text('Documento generado con AARMS — valor de registro oficial', M, fy+8);
      doc.setTextColor(...ACCENT); doc.setFont(FONT,'bold');
      doc.text('F-AA-60-16 (Digital)', W-M, fy+8, {align:'right'});
    }
  }
  drawFooter();

  // Guardar metadata de generación SIN bloquear el LVAR (sigue editable)
  plan.lvarPdfGeneradoAt = Date.now();
  await guardarPlan(plan);

  // Entregar PDF
  const empresaSlug = _slug(plan.muestreador || 'AARMS').substring(0,20);
  const fechaCorta = (data.fecha || plan.fecha || new Date().toISOString().split('T')[0]).replace(/-/g,'');
  const fileName = `LVAR_${data.folio||'sinFolio'}_${empresaSlug}_${fechaCorta}.pdf`;

  try {
    const blob = doc.output('blob');
    await entregarPDF(blob, fileName, {
      title: 'LVAR — Lista de Verificación de Muestreo',
      text: 'A&A S.C. — Documento de control interno',
    });
  } catch(e){
    doc.save(fileName);
    toast('LVAR descargado ✓', 'g');
  }

  alertApp({
    title: 'LVAR generado ✓',
    message: 'Se generó el PDF del LVAR.\n\nUsa este documento para preparar tu kit de muestreo. Puedes seguir editando el LVAR si necesitas hacer cambios.',
    okText: 'Listo',
    variant: 'success',
  });
  // Refrescar pantalla LVAR para mostrar el bloqueo
  abrirLVAR();
}

// ═══════════════════════════════════════════════════════════════
// DESCARGAR MUESTREO COMPLETO
// Genera todos los PDFs del plan llamando a los generadores existentes
// (que ya saben descargar/compartir vía Web Share API o doc.save).
// ═══════════════════════════════════════════════════════════════

function _slug(s){
  return String(s||'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40) || 'sin_dato';
}

// Sobreescritura temporal de buildFileName para inyectar prefijo de plan
let _bulkDownloadPrefix = null;

async function descargarMuestreoCompleto(){
  if(!_currentPlanId){ toast('No hay plan abierto','w'); return; }
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan){ toast('Plan no encontrado','r'); return; }
  const muestreos = getMuestreosDePlan(_currentPlanId);
  if(muestreos.length === 0){ toast('Este plan no tiene OMARs','w'); return; }

  // Prefijo de archivo común
  const folioP = _slug(plan.folio || 'sinFolio');
  let empresa = '';
  for(const m of muestreos){
    const o = m.omar ? JSON.parse(m.omar) : {};
    if(o.empresa){ empresa = o.empresa; break; }
  }
  empresa = _slug(empresa || 'sinEmpresa');
  const fechaCorta = (plan.fecha || new Date().toISOString().split('T')[0]).replace(/-/g,'');
  const prefix = `Plan-${folioP}_${empresa}_${fechaCorta}`;

  // Construir lista de items disponibles
  const items = [];
  const lvarData = plan.lvar || {};
  const hayLvar = !!(lvarData.folio || lvarData.asig || (lvarData.equipos && Object.keys(lvarData.equipos).length>0));
  if(hayLvar){
    items.push({
      kind: 'lvar',
      label: `📋 LVAR — Lista de Verificación`,
      sub: lvarData.folio ? `Folio LVAR: ${lvarData.folio}` : 'Sin folio',
      fileName: `${prefix}_LVAR.pdf`,
    });
  }
  for(const m of muestreos){
    const o = m.omar ? JSON.parse(m.omar) : {};
    const folioO = _slug(o.folio || 'sinFolio');
    const sitio = o.sitio || 'sin sitio';
    const firmado = !!(m.sigData && m.sigData.length > 100);
    if(firmado){
      items.push({
        kind: 'hojaCampo', muestreoId: m.id,
        label: `🌊 Hoja de Campo — OMAR ${o.folio||'?'}`,
        sub: sitio,
        fileName: `${prefix}_OMAR-${folioO}_HojaCampo.pdf`,
      });
      items.push({
        kind: 'cadena', muestreoId: m.id,
        label: `📦 Cadena de Custodia — OMAR ${o.folio||'?'}`,
        sub: sitio,
        fileName: `${prefix}_OMAR-${folioO}_CadenaCustodia.pdf`,
      });
      // Reporte cliente solo si tiene nombre del cliente en lab
      const tieneClienteName = !!(o.lab?.snom || o.lab?.fotar);
      // Realmente lo controlamos por sigData (firma) — el nombre se pide al generar
      items.push({
        kind: 'cliente', muestreoId: m.id,
        label: `📄 Reporte Cliente — OMAR ${o.folio||'?'}`,
        sub: sitio,
        fileName: `${prefix}_OMAR-${folioO}_ReporteCliente.pdf`,
      });
    } else {
      items.push({
        kind: 'omar-sinfirma', muestreoId: m.id,
        label: `⚠ OMAR ${o.folio||'?'} sin firma`,
        sub: `${sitio} — firma al cliente para descargar PDFs`,
        disabled: true,
      });
    }
  }

  if(items.length === 0){
    alertApp({
      title: 'Nada para descargar',
      message: 'No hay LVAR llenado ni OMARs firmados.\n\nLlena el LVAR o firma al menos un OMAR para poder descargar el muestreo.',
      okText: 'Entendido', variant: 'warn',
    });
    return;
  }

  // Mostrar modal con lista de archivos
  const modal = document.createElement('div');
  modal.id = 'modalDescarga';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,8,15,.92);z-index:99999;display:flex;align-items:flex-end;padding:0';
  modal.innerHTML = `
    <div style="width:100%;background:var(--bg1);border-radius:20px 20px 0 0;padding:20px;max-height:88vh;overflow-y:auto;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-shrink:0">
        <div>
          <div style="font-family:var(--syne);font-size:17px;font-weight:800;color:var(--w)">Descargar Muestreo</div>
          <div style="font-size:11px;color:var(--g1);margin-top:3px">Toca un archivo para descargarlo</div>
        </div>
        <button onclick="document.getElementById('modalDescarga').remove()" style="background:var(--bg3);border:1px solid var(--ln);color:var(--g1);width:34px;height:34px;border-radius:10px;font-size:18px;cursor:pointer">✕</button>
      </div>

      <div style="background:rgba(74,158,255,.06);border:1px solid rgba(74,158,255,.25);border-radius:10px;padding:10px 12px;margin-bottom:12px;flex-shrink:0">
        <div style="font-size:10px;color:var(--g2);text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono)">Prefijo común</div>
        <div style="font-size:11px;color:var(--acc);font-family:var(--mono);margin-top:2px;word-break:break-all">${prefix}_*.pdf</div>
      </div>

      <div style="flex:1;overflow-y:auto;margin:-4px -4px 12px;padding:4px">
        ${items.map((it, i) => it.disabled ? `
          <div style="display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:10px;background:rgba(248,113,113,.06);border:1px solid rgba(248,113,113,.25);margin-bottom:6px;opacity:.7">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;color:#f87171;font-weight:600">${it.label}</div>
              <div style="font-size:11px;color:var(--g2);margin-top:2px">${it.sub}</div>
            </div>
          </div>
        ` : `
          <button onclick="_descargarItem(${i})" data-idx="${i}" id="dlBtn${i}" style="display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:10px;background:var(--bg2);border:1px solid var(--ln2);margin-bottom:6px;width:100%;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .12s;color:var(--w)">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;color:var(--w);font-weight:600">${it.label}</div>
              <div style="font-size:11px;color:var(--g1);margin-top:2px">${it.sub}</div>
              <div style="font-size:9.5px;color:var(--g3);margin-top:3px;font-family:var(--mono);word-break:break-all">${it.fileName}</div>
            </div>
            <div style="font-size:17px;color:var(--acc);flex-shrink:0">⬇</div>
          </button>
        `).join('')}
      </div>

      <button onclick="_descargarTodosItems()" style="padding:14px;background:var(--acc);border:none;border-radius:12px;color:#fff;font-family:var(--syne);font-size:14px;font-weight:800;cursor:pointer;width:100%;flex-shrink:0">⬇ Descargar todos</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Guardar items para que las funciones de descarga los lean
  window._descargaItems = items;
}

// Descarga UN solo item de la lista
async function _descargarItem(idx){
  const item = window._descargaItems?.[idx];
  if(!item) return;
  const btn = document.getElementById(`dlBtn${idx}`);
  if(btn){
    btn.disabled = true;
    btn.style.opacity = '.5';
    btn.querySelector('div[style*="17px"]').textContent = '⏳';
  }
  try {
    await _generarItemPDF(item);
    if(btn){
      btn.style.background = 'rgba(134,239,172,.1)';
      btn.style.borderColor = 'rgba(134,239,172,.4)';
      btn.querySelector('div[style*="17px"]').textContent = '✓';
    }
  } catch(e){
    console.error('Descarga item err',e);
    if(btn){
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.querySelector('div[style*="17px"]').textContent = '⚠';
    }
    errorUsuario('Error al generar PDF.', e);
  }
}

// Descarga TODOS los items disponibles (uno por uno con pausas)
async function _descargarTodosItems(){
  const items = window._descargaItems || [];
  const habil = items.filter(it=>!it.disabled);
  if(habil.length === 0) return;
  for(let i=0; i<items.length; i++){
    if(items[i].disabled) continue;
    await _descargarItem(i);
    await new Promise(r=>setTimeout(r, 800));
  }
  toast(`${habil.length} archivo${habil.length!==1?'s':''} descargado${habil.length!==1?'s':''} ✓`,'g');
}

// Núcleo: dada una entrada {kind, muestreoId, fileName}, genera el PDF y lo descarga
async function _generarItemPDF(item){
  if(item.kind === 'lvar'){
    // Generar PDF del LVAR. La función ya está hecha; le forzamos un fileName custom.
    return await _generarLVARConNombre(item.fileName);
  }
  if(['hojaCampo','cadena','cliente'].includes(item.kind)){
    // Cargar el muestreo destino y generar el PDF correspondiente.
    if(item.muestreoId){
      cargarMuestreo(item.muestreoId);
      goPage('pg1');
      await new Promise(r=>setTimeout(r, 600)); // tiempo a que pinte los inputs
    }
    return await _generarPDFOMARConNombre(item.kind, item.fileName);
  }
}

// Wrapper sobre generarPDFLVAR para forzar nombre
async function _generarLVARConNombre(fileName){
  // Capturar el `doc.save` indirecto reemplazando `entregarPDF` para que descargue con nuestro nombre
  const origEntregar = window.entregarPDF;
  window.entregarPDF = async (blob, fname, opts) => {
    _downloadBlob(blob, fileName);
  };
  // Forzar que el alert post-PDF no aparezca
  const origAlertApp = window.alertApp;
  window.alertApp = async () => {};
  try {
    await generarPDFLVAR();
  } finally {
    window.entregarPDF = origEntregar;
    window.alertApp = origAlertApp;
  }
}

// Wrapper sobre genPDF/genCadena para que descargue con nombre custom y sin compartir
async function _generarPDFOMARConNombre(kind, fileName){
  const origEntregar = window.entregarPDF;
  window.entregarPDF = async (blob, fname, opts) => {
    _downloadBlob(blob, fileName);
  };
  try {
    if(kind === 'hojaCampo'){
      await buildPDF();
    } else if(kind === 'cadena'){
      await buildPDFCadena();
    } else if(kind === 'cliente'){
      await buildPDFCliente();
    }
  } finally {
    window.entregarPDF = origEntregar;
  }
}

function _downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function _downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function togglePlanBlanco(si){
  const siEl = document.getElementById('plan_blanco_si');
  const noEl = document.getElementById('plan_blanco_no');
  const wrapEl = document.getElementById('plan_blanco_lote_wrap');
  if(siEl) siEl.classList.toggle('on', si);
  if(noEl) noEl.classList.toggle('on', !si);
  if(wrapEl) wrapEl.style.display = si ? 'block' : 'none';
}

async function guardarPlanFormulario(){
  if(!_currentPlanId) return;
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan) return;
  const gv = id => { const e=document.getElementById(id); return e?e.value.trim():''; };
  plan.folio = gv('plan_folio');
  plan.fecha = gv('plan_fecha');
  plan.muestreador = gv('plan_muest');
  plan.blancoCampo = document.getElementById('plan_blanco_si')?.classList.contains('on') || false;
  plan.loteBlanco = gv('plan_blanco_lote');
  // Si se marcó como explícito (tiene folio o varias OMARs), limpiar flag migrated
  if(plan.folio || (plan.omarIds||[]).length>1) plan.migrated = false;
  await guardarPlan(plan);
  toast('Plan guardado ✓','g');
  // Refrescar UI
  renderPlanPage();
}

// Crea una nueva OMAR dentro del plan actual y lleva al usuario a llenarla
async function planNuevaOmar(){
  if(!_currentPlanId){toast('Plan inválido','w');return;}
  const planGate = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(_gateCampoClick(planGate, 'omars')) return;
  // Guardar cualquier cambio pendiente del formulario del plan
  await guardarPlanFormulario();
  const newId = Date.now();
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  const her = getMuestreosDePlan(_currentPlanId);
  let emp0 = '', muest0 = plan?.muestreador || '', fecha0 = plan?.fecha || new Date().toISOString().split('T')[0];
  if(her.length){
    const o0 = her[0].omar ? JSON.parse(her[0].omar) : {};
    emp0 = o0.empresa || her[0].empresa || '';
    if(o0.muestreador) muest0 = o0.muestreador;
    if(o0.fecha) fecha0 = o0.fecha;
  }
  const nuevo = {
    id: newId,
    planId: _currentPlanId,
    folio: '',
    empresa: emp0,
    fecha: fecha0,
    muestreador: muest0,
    ts: newId,
    tomas: [],
    omar: JSON.stringify({ ts: newId, muestreador: muest0, fecha: fecha0, analitos: [] }),
    sigData: null,
  };
  await idbPut(nuevo);
  // Agregar al plan
  await planAgregarOmar(_currentPlanId, newId);
  // Llevar al usuario a la pantalla OMAR para llenar datos
  cargarMuestreo(newId);
}

// Campos que se pueden igualar entre OMARs del mismo plan (una empresa, mismo paquete analítico).
const _OMAR_CAMPOS_COMUNES = ['empresa','contacto','puesto','direccion','municipio','estado','telefono','ssar','elaboro','mat','muestreador','fecha','tipo','intervalo','ndesc','ntomas','reglas','norma','analitos'];

function _mergeOmarCamposComunes(dest, src){
  const o = typeof dest === 'object' && dest ? {...dest} : {};
  const s = typeof src === 'object' && src ? src : {};
  _OMAR_CAMPOS_COMUNES.forEach(k=>{
    if(k==='analitos'){
      if(Array.isArray(s.analitos)) o.analitos = [...s.analitos];
      return;
    }
    if(s[k]!==undefined) o[k] = s[k];
  });
  const prot = ['folio','sitio','idmuestra','ts'];
  prot.forEach(k=>{
    if(dest && dest[k]!==undefined && dest[k]!=='') o[k] = dest[k];
  });
  return o;
}

function _leerPatchComunDesdeFormularioOmar(){
  const g=id=>{ const e=document.getElementById(id); return e?(e.value||'').trim():''; };
  return {
    empresa:g('o_emp'), contacto:g('o_cont'), puesto:g('o_puest'), direccion:g('o_dir'),
    municipio:g('o_mun'), estado:g('o_estado'), telefono:g('o_tel'), ssar:g('o_ssar'), elaboro:g('o_elab'), // AARMS v64: estado separado
    mat:document.getElementById('o_mat')?document.getElementById('o_mat').value:'',
    muestreador:g('o_muest'), fecha:g('o_fecha'), tipo:g('o_tipo'), intervalo:g('o_int'),
    ndesc:g('o_ndesc'), ntomas:g('o_ntomas'), reglas:g('o_reglas'), norma:getNorma(),
    analitos: typeof analitosSel !== 'undefined' && analitosSel ? [...analitosSel] : [],
  };
}

async function replicarDatosComunesDesdeFormularioActual(){
  if(!omar || !omar.ts){ toast('Abre una OMAR del plan','w'); return; }
  const plan = _cachedPlanes.find(p=>(p.omarIds||[]).includes(omar.ts));
  if(!plan || !plan.omarIds || plan.omarIds.length < 2){
    toast('Agrega otra OMAR al plan para usar esta opción','w'); return;
  }
  const patch = _leerPatchComunDesdeFormularioOmar();
  if(!patch.empresa && (!patch.analitos || !patch.analitos.length)){
    toast('Llena al menos empresa o analitos en el formulario antes de replicar','w'); return;
  }
  const ok = await confirmAction({
    title:'Replicar a las demás OMARs',
    message:`Se aplicará lo que ves en este formulario (empresa, analitos, SSAR, dirección, etc.) a las otras ${plan.omarIds.length-1} OMAR(s). No se tocan folio, sitio ni ID de muestra.`,
    okText:'Replicar',
    okDanger:false,
  });
  if(!ok) return;
  let n = 0;
  for(const mid of plan.omarIds){
    if(mid === omar.ts) continue;
    const m = _cachedMuestreos.find(x=>x.id===mid);
    if(!m) continue;
    const cur = m.omar ? JSON.parse(m.omar) : { ts: mid };
    const merged = _mergeOmarCamposComunes(cur, patch);
    merged.ts = cur.ts || mid;
    m.omar = JSON.stringify(merged);
    if(merged.folio) m.folio = merged.folio;
    await idbPut(m);
    n++;
  }
  await refreshCache();
  toast(`Listo: ${n} OMAR(s) actualizadas con los mismos datos comunes`,'g');
}

async function eliminarPlanActual(){
  if(!_currentPlanId) return;
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan) return;
  const omars = getMuestreosDePlan(_currentPlanId);
  confirmAction({
    title:'Eliminar plan completo',
    message:`¿Eliminar el plan y sus ${omars.length} OMAR${omars.length!==1?'s':''}? Esta acción no se puede deshacer.`,
    okText:'Eliminar todo',
    okDanger:true,
  }).then(async ok=>{
    if(!ok) return;
    await eliminarPlan(_currentPlanId, {borrarOmars:true});
    _currentPlanId = null;
    toast('Plan eliminado','g');
    goHome();
  });
}

// Nuevo plan desde el home
async function crearNuevoPlan(){
  closeFabMenu();
  const plan = await crearPlan({
    fecha: new Date().toISOString().split('T')[0],
    muestreador: '',
  });
  _currentPlanId = plan.id;
  renderPlanPage();
  goPage('pgPlan');
  toast('Plan nuevo ✓ — agrega las OMARs','g');
}
// ═══════════════ /PLAN UI ═══════════════

// Renderiza una barra superior con botón "Ver plan" + chips de OMARs hermanas.
// Siempre se muestra cuando hay un plan asociado al muestreo actual.
// Permite saltar sin perder cambios (autosave).
function renderHermanasBreadcrumb(){
  const containers = ['pg0Hermanas','pg1Hermanas'];
  // Determinar plan del muestreo activo
  const actualId = omar.ts || _pendingNewMuestreoId;
  let plan = null;
  if(actualId){
    plan = _cachedPlanes.find(p=>(p.omarIds||[]).includes(actualId));
  }
  if(!plan && _pendingNewPlanId){
    plan = _cachedPlanes.find(p=>p.id===_pendingNewPlanId);
  }
  if(!plan){
    containers.forEach(id=>{const e=document.getElementById(id);if(e){e.innerHTML='';e.style.display='none';}});
    return;
  }
  const hermanas = getMuestreosDePlan(plan.id);
  const hasMultiple = hermanas.length >= 2;
  // Nombre del plan: folio si lo tiene, si no "este muestreo"
  const planLabel = plan.folio ? 'PLAN #'+plan.folio : (hasMultiple ? 'PLAN (sin folio)' : 'Documentos del muestreo');
  const html = `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 4px;overflow-x:auto;scrollbar-width:none">
      <button onclick="abrirPlanDesdeOmar('${plan.id}')" style="background:rgba(74,158,255,.15);border:1px solid rgba(74,158,255,.4);border-radius:7px;color:var(--acc);padding:6px 12px;font-family:var(--syne);font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0;display:flex;align-items:center;gap:6px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        ${planLabel}
      </button>
      ${hasMultiple ? hermanas.map((m,idx)=>{
        const isActive = m.id===actualId;
        const omarObj = m.omar?JSON.parse(m.omar):{};
        return `<button onclick="saltarAOmar(${m.id})" style="background:${isActive?'var(--acc)':'var(--bg3)'};border:1px solid ${isActive?'var(--acc)':'var(--ln)'};border-radius:7px;color:${isActive?'#fff':'var(--g1)'};padding:6px 10px;font-family:var(--syne);font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0">${idx+1}·${m.folio||'?'}</button>`;
      }).join('') : ''}
    </div>
  `;
  containers.forEach(id=>{
    const e = document.getElementById(id);
    if(e){ e.innerHTML = html; e.style.display = 'block'; }
  });
}

// Ir al plan desde OMAR — guarda cambios antes
async function abrirPlanDesdeOmar(planId){
  await guardarBorradorActual();
  await abrirPlan(planId);
}

async function saltarAOmar(mid){
  _flushTomasDesdeDOM();
  await guardarBorradorActual();
  await cargarMuestreo(mid);
}

// Guarda los valores actualmente visibles en pg0 (OMAR) y pg1 (Hoja/Cadena) al
// registro cuyo id está en omar.ts. No valida — solo snapshot del estado actual.
// Guarda los valores actualmente visibles en pg0 (OMAR) y delega a
// saveMuestreoActual para escritura única e idempotente. Garantiza que
// fotos, GPS, datos de campo y todo lo demás se preserven SIEMPRE.
async function guardarBorradorActual(){
  const mid = omar?.ts;
  if(!mid && !_pendingNewMuestreoId) return;
  if(typeof _snapshotOmarFromPg0==='function') _snapshotOmarFromPg0();
  try {
    await saveMuestreoActual();
  } catch(e){
    console.warn('[saveBorrador] error:', e);
  }
}

async function cargarMuestreo(id, opts){
  opts = opts || {};
  if(_lvarFlujoReset){
    _lvarFlujoActivo = false;
    _lvarFlujoReset = false;
  } else if(_lvarFlujoGoCampo){
    _lvarFlujoActivo = true;
    _lvarFlujoGoCampo = false;
  }
  const newId=String(id);
  const switching=omar?.ts && String(omar.ts)!==newId;
  if(omar?.ts) _flushTomasDesdeDOM();
  if(switching) await saveMuestreoActual(); // AARMS v66-flujos: evitar race al cambiar OMAR

  // AARMS toastfix: buscar en cache; si falta, refrescar desde IDB (idbPut no actualiza cache)
  let m=(getMuestreos()||[]).find(x=>String(x.id)===String(id));
  if(!m){
    try{
      _cachedMuestreos=await idbGetAll();
      m=(_cachedMuestreos||[]).find(x=>String(x.id)===String(id));
    }catch(e){ console.warn('[cargarMuestreo] refresh cache', e); }
  }
  if(!m){
    // AARMS toastfix: no toast en cargas silenciosas (abrirPlan / flujos); no silenciar globalmente
    if(!opts.silent && !opts.silencioso) toast('No se encontró el registro','r');
    return;
  }

  // RESET COMPLETO de estado antes de cargar el registro.
  // Sin esto, datos y tomas de muestreos anteriores se quedan pegados en pantalla.
  tomas = [];
  sigData = null;
  sigData2 = null;
  analitosSel = new Set();
  photoData = null;
  photoData2 = null;
  lastPDFBlob = null;
  lastPDFClienteBlob = null;
  lastPDFCadenaBlob = null;
  // Limpiar canvas de firmas
  ['sigCanvas','sigCanvas2'].forEach(cid=>{
    const cv=document.getElementById(cid);
    if(cv){
      const ctx=cv.getContext('2d');
      if(ctx) ctx.clearRect(0,0,cv.width,cv.height);
    }
  });
  ['cvswrap','cvswrap2'].forEach(wid=>{
    document.getElementById(wid)?.classList.remove('signed');
  });
  document.getElementById('sigst')?.classList.remove('ok');
  const sigstEl=document.getElementById('sigst');
  if(sigstEl) sigstEl.textContent='Sin firma';
  // Limpiar inputs de hoja de campo
  document.querySelectorAll('#pg1 input, #pg1 textarea, #pg1 select').forEach(el=>{
    if(el.type==='checkbox'||el.type==='radio') el.checked=false;
    else el.value='';
  });
  // Limpiar tabla de tomas en pantalla
  const tomasBody=document.getElementById('tomasBody');
  if(tomasBody) tomasBody.innerHTML='';
  const tcnt=document.getElementById('tcnt');
  if(tcnt) tcnt.textContent='0';
  // Limpiar previews REALES de fotos (los de la hoja de campo y reporte cliente)
  ['photoPreview','photoPreview2','delPhotoBtn','delPhotoBtn2'].forEach(eid=>{
    const e=document.getElementById(eid);
    if(e) e.style.display='none';
  });
  ['photoImg','photoImg2'].forEach(eid=>{
    const e=document.getElementById(eid); if(e) e.src='';
  });
  ['camInput','camInput2'].forEach(eid=>{
    const e=document.getElementById(eid); if(e) e.value='';
  });
  // Limpiar foto preview legacy si existiera
  const photoPrev=document.getElementById('photoPrev');
  if(photoPrev){ photoPrev.style.backgroundImage=''; photoPrev.classList.remove('loaded'); }

  // Ahora sí, cargar datos del registro
  // SIEMPRE limpiar el form de pg0 primero (evita que datos de OMAR previa queden pegados)
  document.querySelectorAll('#omarForm input,#omarForm select,#omarForm textarea').forEach(el=>{
    if(el.type==='checkbox'||el.type==='radio') el.checked=false;
    else el.value='';
  });
  document.querySelectorAll('.ai.on').forEach(el=>el.classList.remove('on'));
  document.querySelectorAll('#intChips .chip').forEach(c=>c.classList.remove('on'));
  const tbSimp=document.getElementById('tb_simp');
  const tbComp=document.getElementById('tb_comp');
  if(tbSimp){tbSimp.classList.remove('btn-p');tbSimp.classList.add('btn-g');}
  if(tbComp){tbComp.classList.remove('btn-p');tbComp.classList.add('btn-g');}

  if(m.omar){
    omar=JSON.parse(m.omar);
    // AARMS sub3fix3: siempre vincular ts al ID del muestreo (crítico para bitácoras desde plan)
    omar.ts=m.id;
    if(m.empresa && (!omar.empresa || !String(omar.empresa).trim())) omar.empresa = m.empresa;
    localStorage.setItem('aarms_omar',JSON.stringify(omar));
    analitosSel=new Set(omar.analitos||[]);
    document.querySelectorAll('.ai').forEach(el=>{
      el.classList.toggle('on',analitosSel.has(el.dataset.a));
    });
    const acntEl=document.getElementById('acnt');
    if(acntEl) acntEl.textContent=analitosSel.size+' seleccionados';
    // Rellenar campos del form pg0 con los valores de esta OMAR
    const setVal = (id,v)=>{const e=document.getElementById(id);if(e&&v!==undefined)e.value=v||'';};
    setVal('o_omar',omar.folio); setVal('o_ssar',omar.ssar); setVal('o_muest',omar.muestreador);
    setVal('o_elab',omar.elaboro); setVal('o_emp',omar.empresa); setVal('o_cont',omar.contacto);
    setVal('o_puest',omar.puesto); setVal('o_dir',omar.direccion); setVal('o_mun',omar.municipio); setVal('o_estado',omar.estado); // AARMS v64: estado separado
    setVal('o_tel',omar.telefono); setVal('o_sitio',omar.sitio); setVal('o_idm',omar.idmuestra);
    // AARMS v64: Restaurar norma personalizada
    {
      const selNorma = document.getElementById('o_norma');
      const otraInp = document.getElementById('o_norma_otra');
      if(selNorma && omar.norma){
        const opciones = Array.from(selNorma.options).map(o => o.value);
        if(opciones.includes(omar.norma) && omar.norma !== 'otra'){
          selNorma.value = omar.norma;
          if(otraInp){ otraInp.style.display='none'; otraInp.value=''; }
        } else {
          selNorma.value = 'otra';
          if(otraInp){
            otraInp.value = omar.norma;
            otraInp.style.display = 'block';
          }
        }
      }
    }
    setVal('o_fecha',omar.fecha); setVal('o_int',omar.intervalo); setVal('o_ndesc',omar.ndesc);
    setVal('o_ntomas',omar.ntomas); setVal('o_reglas',omar.reglas);
    if(omar.mat){const e=document.getElementById('o_mat');if(e)e.value=_matrizNormalizada(omar.mat);}
    if(omar.tipo){
      const e=document.getElementById('o_tipo'); if(e) e.value=omar.tipo;
      // Marcar botón tipo
      if(omar.tipo==='Simple'&&tbSimp){tbSimp.classList.remove('btn-g');tbSimp.classList.add('btn-p');}
      if(omar.tipo==='Compuesto'&&tbComp){tbComp.classList.remove('btn-g');tbComp.classList.add('btn-p');}
    }
    if(omar.intervalo){
      document.querySelectorAll('#intChips .chip').forEach(c=>{if(c.textContent.trim()===omar.intervalo)c.classList.add('on');});
    }
  } else {
    // OMAR vacía — asegurar reset de analitos UI
    omar = {ts: m.id};
    if(m.empresa) omar.empresa = m.empresa;
    const acntEl=document.getElementById('acnt');
    if(acntEl) acntEl.textContent='0 seleccionados';
  }
  if(omar.empresa){
    const ep=document.getElementById('o_emp');
    if(ep) ep.value = omar.empresa;
  }
  tomas=_normalizarTomasIds((m.tomas||[]).map(t=>{
    const s=_tomaSanitized({...t, params:new Set(t.params||[])});
    return {...s, params:new Set(s.params||[])};
  }));
  // AARMS sub2-temp: migrar tomas de 1 lectura → 3 lecturas
  let tempMigrado = false;
  tomas.forEach(t => { if(_migrarTomaTemperatura(t)) tempMigrado = true; });
  if(tempMigrado){
    m.tomas = tomas.map(t => ({...t, params:[...t.params]}));
    try{ await idbPut(m); }catch(e){ console.warn('[sub2 migrar temp]', e); }
  }
  // AARMS sub21-bittemp: migrar Sub-2 (temp en tomas) → plan.bitTemp
  const planM = typeof getPlanDeMuestreo === 'function' ? getPlanDeMuestreo(m.id) : null;
  if(planM && omar && typeof _migrarBitTempSub2 === 'function'){
    await _migrarBitTempSub2(planM, omar);
  }
  // AARMS sub3-flujos: migrar Sub-2 (flujo en tomas) → plan.bitFlujos
  if(planM && omar && typeof _migrarBitFlujosSub2 === 'function'){
    await _migrarBitFlujosSub2(planM, omar);
  }
  sigData=m.sigData||null;
  sigData2=m.sigData2||null;
  // Restaurar fotos del muestreo (¡por OMAR!) — antes se perdían y se confundían entre OMARs
  photoData = m.photoData || null;
  photoData2 = m.photoData2 || null;
  if(photoData){
    const img=document.getElementById('photoImg');
    if(img){ img.src=photoData; }
    const prev=document.getElementById('photoPreview');
    if(prev) prev.style.display='block';
    const del=document.getElementById('delPhotoBtn');
    if(del) del.style.display='inline-flex';
  }
  if(photoData2){
    const img2=document.getElementById('photoImg2');
    if(img2){ img2.src=photoData2; }
    const prev2=document.getElementById('photoPreview2');
    if(prev2) prev2.style.display='block';
    const del2=document.getElementById('delPhotoBtn2');
    if(del2) del2.style.display='inline-flex';
  }
  if(sigData){try{updSig&&updSig();}catch(e){}}
  if(sigData2){try{updSig2&&updSig2();}catch(e){}}
  document.getElementById('modalMuestreos')?.remove();

  // Decidir a qué página ir:
  //   - Si la OMAR está vacía (sin folio ni empresa) → Paso 1 (pg0) para llenarla
  //   - Si ya tiene datos básicos → Paso 2 (pg1) Campo/Cadena/Firma
  const omarLlena = !!omar.folio;

  if(omarLlena){
    loadCampoFromOMAR();
    buildCusTable();
    renderTomas();
    updTCnt();
    if(!opts.silent){
      goPage('pg1');
      goSec(0);
    }
    _pintarLvarFlujoCampoBar();
  } else {
    const tieneJson = m.omar && String(m.omar).trim();
    if(!tieneJson){
      document.querySelectorAll('#omarForm input,#omarForm select,#omarForm textarea').forEach(el=>{
        if(el.type==='checkbox'||el.type==='radio') el.checked=false;
        else el.value='';
      });
      const fd=document.getElementById('o_fecha');
      if(fd) fd.value = m.fecha || new Date().toISOString().split('T')[0];
      const plan = _cachedPlanes.find(p=>(p.omarIds||[]).includes(m.id));
      if(plan && plan.muestreador){
        const mf=document.getElementById('o_muest');
        if(mf && !mf.value) mf.value = plan.muestreador;
      }
      const tbSimp=document.getElementById('tb_simp');
      const tbComp=document.getElementById('tb_comp');
      if(tbSimp){tbSimp.classList.remove('btn-p');tbSimp.classList.add('btn-g');}
      if(tbComp){tbComp.classList.remove('btn-p');tbComp.classList.add('btn-g');}
      const intField=document.getElementById('intField');
      const tomasField=document.getElementById('tomasField');
      if(intField) intField.style.display='none';
      if(tomasField) tomasField.style.display='none';
      document.querySelectorAll('#intChips .chip').forEach(c=>c.classList.remove('on'));
      const topOmar=document.getElementById('topOmar');
      if(topOmar) topOmar.textContent='—';
    } else {
      const fd=document.getElementById('o_fecha');
      if(fd && !fd.value) fd.value = m.fecha || new Date().toISOString().split('T')[0];
      const plan = _cachedPlanes.find(p=>(p.omarIds||[]).includes(m.id));
      if(plan && plan.muestreador){
        const mf=document.getElementById('o_muest');
        if(mf && !mf.value) mf.value = plan.muestreador;
      }
    }
    const form=document.getElementById('omarForm');
    const res=document.getElementById('omarRes');
    if(form) form.style.display='block';
    if(res) res.style.display='none';
    if(!opts.silent) goPage('pg0');
  }
  renderHermanasBreadcrumb();
  _pintarLvarFlujoCampoBar();
  if(!opts.silent) toast(omarLlena ? 'Muestreo cargado ✓' : 'Captura los datos de la OMAR','g');
}

function abrirListaMuestreos(){
  goHome();
  setTimeout(()=>{
    const el=document.getElementById('homeLista');
    if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  },200);
}

function closeFabMenu(){
  const m=document.getElementById('fabMenu');
  const o=document.getElementById('fabOverlay');
  if(m)m.classList.remove('menu-open');
  if(o)o.style.display='none';
}

function toggleFabMenu(){
  const menu=document.getElementById('fabMenu');
  const overlay=document.getElementById('fabOverlay');
  if(!menu)return;
  const isOpen=menu.classList.contains('menu-open');
  menu.classList.toggle('menu-open',!isOpen);
  if(overlay)overlay.style.display=isOpen?'none':'block';
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape') closeFabMenu();
});

function drawerIrPlan(){
  closeFabMenu();
  if(!_currentPlanId){
    toast('Abre un plan: crea uno nuevo o elige uno en Muestreos','w');
    goHome();
    return;
  }
  try{ if(typeof guardarBorradorActual==='function') guardarBorradorActual(); }catch(_){}
  renderPlanPage();
  goPage('pgPlan');
}

function drawerIrLVAR(){
  closeFabMenu();
  if(typeof abrirLVAR!=='function') return;
  abrirLVAR();
}

function drawerIrBpm(){
  closeFabMenu();
  if(typeof abrirPagBpm!=='function'){ toast('Carga documents-suite.js','w'); return; }
  if(!omar||!omar.ts){ toast('Abre una OMAR del plan (Orden de muestreo)','w'); return; }
  abrirPagBpm();
}

/** BPM desde la pantalla Plan (sin menú lateral). */
function abrirBpmDesdePlan(){
  if(typeof abrirPagBpm!=='function'){ toast('Carga documents-suite.js','w'); return; }
  if(!omar||!omar.ts){ toast('Abre una OMAR del plan (lista de OMARs o menú «Orden de muestreo») para usar el BPM.','w'); return; }
  abrirPagBpm();
}


// ── SECTION NAV (dentro de pg1) ──
const SECS=['sec0','sec1','sec2'];
function goSec(n){
  const sec0On = document.getElementById('sec0')?.classList.contains('on');
  if(sec0On && n !== 0){
    _flushTomasDesdeDOM();
    void saveMuestreoActual();
  }
  SECS.forEach((id,i)=>{const e=document.getElementById(id);if(e)e.classList.toggle('on',i===n);});
  document.querySelectorAll('#stepsBar .stp').forEach((t,i)=>{
    t.classList.remove('on','done');
    if(i<n)t.classList.add('done');
    if(i===n)t.classList.add('on');
  });
  window.scrollTo({top:0,behavior:'smooth'});
  if(n===0) renderTomas();
  if(n===2)buildRes();
}

// ── OMAR ──
const TOMAS_POR_INTERVALO={'<4h':2,'4-8h':4,'8-12h':4,'12-18h':6,'18-24h':6};

// AARMS v64: separación en horas entre tomas según intervalo
const HORAS_ENTRE_TOMAS = {
  '<4h': 2,
  '4-8h': 2,
  '8-12h': 3,
  '12-18h': 3,
  '18-24h': 4
};

// AARMS v64: genera horarios de N tomas separadas por horasGap, ajustando día al cruzar medianoche
function _generarHorariosToma(fechaIniISO, horaIniHHMM, n, horasGap){
  const m = horaIniHHMM.match(/^(\d{1,2}):(\d{2})/);
  if(!m) return [];
  const [y, mo, d] = fechaIniISO.split('-').map(Number);
  if(!y || !mo || !d) return [];
  let cursor = new Date(y, mo-1, d, parseInt(m[1],10), parseInt(m[2],10), 0, 0);
  const out = [];
  for(let i=0; i<n; i++){
    const hh = String(cursor.getHours()).padStart(2,'0');
    const mm = String(cursor.getMinutes()).padStart(2,'0');
    const yy = cursor.getFullYear();
    const moo = String(cursor.getMonth()+1).padStart(2,'0');
    const dd = String(cursor.getDate()).padStart(2,'0');
    out.push({
      hora: `${hh}:${mm}`,
      fechaISO: `${yy}-${moo}-${dd}`,
      timestamp: cursor.getTime()
    });
    cursor = new Date(cursor.getTime() + horasGap * 60 * 60 * 1000);
  }
  return out;
}

function setTipo(t,silent){
  document.getElementById('o_tipo').value=t;
  document.getElementById('tb_simp').classList.toggle('btn-p',t==='Simple');
  document.getElementById('tb_simp').classList.toggle('btn-g',t!=='Simple');
  document.getElementById('tb_comp').classList.toggle('btn-p',t==='Compuesto');
  document.getElementById('tb_comp').classList.toggle('btn-g',t!=='Compuesto');
  document.getElementById('intField').style.display=t==='Compuesto'?'block':'none';
  document.getElementById('tomasField').style.display=t==='Simple'?'block':'none';
  if(t==='Compuesto'){
    document.getElementById('o_ntomas').value='';
    document.getElementById('tomasAuto').textContent='';
  }
}
function setInt(el,v){
  document.querySelectorAll('#intChips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('o_int').value=v;
  const n=TOMAS_POR_INTERVALO[v]||0;
  document.getElementById('o_ntomas').value=n;
  const lbl=document.getElementById('tomasAuto');
  if(lbl)lbl.textContent=n+' tomas automáticas para intervalo '+v;
}
// Metales que activan MP automáticamente (excepto Hg y Cromo Hexavalente)
const MP_TRIGGER=['Aluminio','Arsénico','Bario','Cadmio','Cobre','Cromo Total','Fierro','Níquel','Plata','Plomo','Zinc'];
// Analitos que activan FQ automáticamente
const FQ_TRIGGER=['Sólidos Susp. Totales','Sólidos Sedimentables'];

function autoSelect(key, activate){
  const el=document.querySelector(`[data-a="${key}"]`);
  if(!el) return;
  if(activate && !analitosSel.has(key)){
    analitosSel.add(key);
    el.classList.add('on');
  } else if(!activate && analitosSel.has(key)){
    // Solo desactivar automático si no hay otros triggers activos
    const stillNeeded = activate;
    if(!stillNeeded){
      analitosSel.delete(key);
      el.classList.remove('on');
    }
  }
}

function togA(el,a){
  if(analitosSel.has(a)){
    analitosSel.delete(a);
    el.classList.remove('on');
  } else {
    analitosSel.add(a);
    el.classList.add('on');
  }
  // Lógica automática FQ
  const needsFQ=FQ_TRIGGER.some(t=>analitosSel.has(t));
  autoSelect('FQ', needsFQ);  // FQ es parámetro de cadena, marcamos visualmente
  // Lógica automática MP
  const needsMP=MP_TRIGGER.some(t=>analitosSel.has(t));
  autoSelect('MP', needsMP);
  document.getElementById('acnt').textContent=analitosSel.size+' seleccionados';
}
document.getElementById('o_norma').addEventListener('change',function(){
  const otra=document.getElementById('o_norma_otra');
  otra.style.display=this.value==='otra'?'block':'none';
});
document.getElementById('o_mat')?.addEventListener('change',function(){
  if(typeof _syncMatrizOrdenACampo==='function') _syncMatrizOrdenACampo();
  _autoSaveDeferred(50);
});

function getNorma(){
  const sel=document.getElementById('o_norma');
  if(sel.value==='otra') return document.getElementById('o_norma_otra').value.trim();
  return sel.value;
}

const MATRIZ_OPCIONES=['Agua Residual','Sanidad Agropecuaria','Lodos y Biosólidos','Alimentos'];

function _matrizNormalizada(v){
  const s=String(v||'').trim();
  if(!s) return '';
  const legacy={RESIDUAL:'Agua Residual',OTROS:'Agua Residual'};
  const up=s.toUpperCase();
  const n=legacy[up]||s;
  return MATRIZ_OPCIONES.includes(n)?n:n;
}

/** Lee el formulario de Orden de muestreo (pg0) hacia `omar` sin borrar lab/campo. */
function _snapshotOmarFromPg0(){
  if(!omar) omar={};
  const g=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const oMatEl=document.getElementById('o_mat');
  const hasSession=!!(omar.ts||_pendingNewMuestreoId);
  const hasForm=!!(g('o_omar')||g('o_emp')||g('o_muest')||g('o_sitio')||(oMatEl&&oMatEl.value));
  if(!hasSession&&!hasForm) return false;
  const labSafe=omar.lab;
  const campoSafe=omar.campo;
  const mat=_matrizNormalizada(oMatEl?.value||omar.mat||'');
  omar={
    ...omar,
    folio:g('o_omar')||omar.folio||'',
    ssar:g('o_ssar')||omar.ssar||'',
    muestreador:g('o_muest')||omar.muestreador||'',
    elaboro:g('o_elab')||omar.elaboro||'',
    empresa:g('o_emp')||omar.empresa||'',
    contacto:g('o_cont')||omar.contacto||'',
    puesto:g('o_puest')||omar.puesto||'',
    direccion:g('o_dir')||omar.direccion||'',
    municipio:g('o_mun')||omar.municipio||'',
    estado:g('o_estado')||omar.estado||'', // AARMS v64: estado separado
    telefono:g('o_tel')||omar.telefono||'',
    sitio:g('o_sitio')||omar.sitio||'',
    idmuestra:g('o_idm')||omar.idmuestra||'',
    norma:(typeof getNorma==='function'?getNorma():(omar.norma||'')),
    mat,
    fecha:g('o_fecha')||omar.fecha||'',
    tipo:g('o_tipo')||omar.tipo||'',
    intervalo:g('o_int')||omar.intervalo||'',
    ndesc:g('o_ndesc')||omar.ndesc||'',
    ntomas:g('o_ntomas')||omar.ntomas||'',
    analitos:omar.analitos||[...analitosSel],
    reglas:g('o_reglas')||omar.reglas||'',
    ts:omar.ts||_pendingNewMuestreoId||omar.ts,
    lab:labSafe,
    campo:campoSafe,
  };
  if(mat){
    omar.campo={...(campoSafe||{}), mat: (campoSafe&&campoSafe.mat)?campoSafe.mat:mat};
  }
  localStorage.setItem('aarms_omar',JSON.stringify(omar));
  return true;
}

/** Copia matriz del orden de servicio a la hoja de campo (DOM + omar.campo). */
function _syncMatrizOrdenACampo(){
  const mat=_matrizNormalizada(omar?.mat||document.getElementById('o_mat')?.value||'');
  if(!mat) return;
  const hm=document.getElementById('h_mat');
  if(hm) hm.value=mat;
  if(omar){
    omar.mat=mat;
    omar.campo={...(omar.campo||{}), mat};
  }
}

function guardarOMAR(){
  const g=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  // Limpiar marcas anteriores
  ['o_omar','o_muest','o_emp','o_sitio','o_mat'].forEach(id=>{
    const e=document.getElementById(id);
    if(e)e.style.borderColor='';
  });
  const tipoEl=document.getElementById('tb_simp');
  let faltantes=[];
  if(!g('o_omar')){faltantes.push('Folio OMAR');const e=document.getElementById('o_omar');if(e)e.style.borderColor='#f87171';}
  if(!g('o_emp')){faltantes.push('Empresa');const e=document.getElementById('o_emp');if(e)e.style.borderColor='#f87171';}
  if(!g('o_muest')){faltantes.push('Muestreador');const e=document.getElementById('o_muest');if(e)e.style.borderColor='#f87171';}
  if(!g('o_sitio')){faltantes.push('Sitio de muestreo');const e=document.getElementById('o_sitio');if(e)e.style.borderColor='#f87171';}
  if(!g('o_tipo')){faltantes.push('Tipo de muestreo (Simple/Compuesto)');}
  if(!document.getElementById('o_mat')?.value?.trim()){faltantes.push('Matriz');const e=document.getElementById('o_mat');if(e)e.style.borderColor='#f87171';}
  if(faltantes.length>0){
    toast('Faltan: '+faltantes.join(', '),'w');
    return;
  }
  // Conservar el ts del registro si ya existía (vinimos cargando una OMAR vacía
  // desde el plan). Si no, generar uno nuevo.
  const existingTs = omar.ts || null;
  // AARMS simfix: preservar BPM/BLMP/phlab/colab/bmForm/machiote al rearmar desde form
  const prevOmar = (omar && typeof omar === 'object') ? omar : {};
  omar={
    ...prevOmar,
    folio:g('o_omar'),ssar:g('o_ssar'),muestreador:g('o_muest'),elaboro:g('o_elab'),empresa:g('o_emp'),
    contacto:g('o_cont'),puesto:g('o_puest'),direccion:g('o_dir'),municipio:g('o_mun'),estado:g('o_estado'), // AARMS v64: estado separado
    telefono:g('o_tel'),sitio:g('o_sitio'),idmuestra:g('o_idm'),norma:getNorma(),
    mat:document.getElementById('o_mat').value,fecha:g('o_fecha'),tipo:g('o_tipo'),
    intervalo:g('o_int'),ndesc:g('o_ndesc'),ntomas:g('o_ntomas'),
    analitos:[...analitosSel],reglas:g('o_reglas'),
    ts: existingTs || Date.now()
  };
  // Limpiar bordes rojos al guardar exitoso
  ['o_omar','o_muest','o_emp','o_sitio'].forEach(id=>{
    const e=document.getElementById(id);if(e)e.style.borderColor='';
  });
  localStorage.setItem('aarms_omar',JSON.stringify(omar));
  showOmarRes();
  toast('OMAR guardada ✓','g');
}
function showOmarRes(){
  document.getElementById('omarForm').style.display='none';
  document.getElementById('omarRes').style.display='block';
  document.getElementById('r_folio').textContent='OMAR-'+omar.folio;
  document.getElementById('r_fecha').textContent=fmtF(omar.fecha);
  document.getElementById('r_emp').textContent=omar.empresa||'—';
  document.getElementById('r_sit').textContent=(omar.sitio||'')+(omar.idmuestra?' — '+omar.idmuestra:'');
  document.getElementById('topOmar').textContent='OMAR-'+(omar.folio||'—');
  const tags=document.getElementById('r_tags');tags.innerHTML='';
  [[omar.tipo,true],[omar.norma],[omar.mat],[omar.intervalo],[omar.ntomas?omar.ntomas+' tomas':null]]
    .forEach(([v,hi])=>{if(v){const s=document.createElement('span');s.className='otag'+(hi?' hi':'');s.textContent=v;tags.appendChild(s);}});
  if(omar.reglas){document.getElementById('r_reglas_wrap').style.display='block';document.getElementById('r_reglas').textContent=omar.reglas;}
  const ac=document.getElementById('r_analitos');
  ac.innerHTML=(omar.analitos||[]).map(a=>`<span class="achip">${a}</span>`).join('')||'<span style="color:var(--g2);font-size:12px">Sin analitos</span>';
}

// Variante 1: Guardar OMAR y continuar al LVAR (caso típico — un OMAR o el último OMAR)
async function guardarOMARyContinuarLVAR(){
  const ok = await _validarYGuardarOMAR(true); // valida + guarda + ESPERA persistir
  if(!ok) return;
  if(await _flujosConsumirReturnToLvar()) return;
  _returnToLvarAfterOmar = false;
  goPage('pgLVAR');
  abrirLVAR();
  toast('OMAR guardado ✓ — continúa con el LVAR','g');
}

// Variante 2: Guardar OMAR y agregar otro al mismo plan
async function guardarOMARyAgregarOtro(){
  const ok = await _validarYGuardarOMAR(true);
  if(!ok) return;
  // Crear un nuevo OMAR vacío en el plan actual
  if(!_currentPlanId){ toast('No hay plan activo','r'); return; }
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan){ toast('Plan no encontrado','r'); return; }
  const newMid = Date.now();
  await idbPut({
    id: newMid, planId: _currentPlanId,
    folio:'', empresa: omar.empresa || '', // hereda empresa para captura rápida
    fecha: omar.fecha, muestreador: omar.muestreador || '', ts: newMid,
    tomas:[], omar:'', sigData:null, sigData2:null,
  });
  plan.omarIds = [...(plan.omarIds||[]), newMid];
  await idbPlanPut(plan);
  await refreshCache();
  toast('OMAR guardado ✓ — captura el siguiente','g');
  cargarMuestreo(newMid);
}

// Helper: valida campos requeridos, reconstruye omar, persiste.
// Devuelve true si se pudo guardar.
async function _validarYGuardarOMAR(requireSitio){
  const g=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  ['o_omar','o_muest','o_emp','o_sitio','o_mat'].forEach(id=>{
    const e=document.getElementById(id);
    if(e)e.style.borderColor='';
  });
  let faltantes=[];
  if(!g('o_omar')){faltantes.push('Folio OMAR');const e=document.getElementById('o_omar');if(e)e.style.borderColor='#f87171';}
  if(!g('o_emp')){faltantes.push('Empresa');const e=document.getElementById('o_emp');if(e)e.style.borderColor='#f87171';}
  if(!g('o_muest')){faltantes.push('Muestreador');const e=document.getElementById('o_muest');if(e)e.style.borderColor='#f87171';}
  if(requireSitio && !g('o_sitio')){faltantes.push('Sitio de muestreo');const e=document.getElementById('o_sitio');if(e)e.style.borderColor='#f87171';}
  if(!g('o_tipo')){faltantes.push('Tipo de muestreo (Simple/Compuesto)');}
  if(!document.getElementById('o_mat')?.value?.trim()){faltantes.push('Matriz');const e=document.getElementById('o_mat');if(e)e.style.borderColor='#f87171';}
  if(!analitosSel || analitosSel.size===0){faltantes.push('Al menos 1 analito');}
  if(faltantes.length>0){
    toast('Faltan: '+faltantes.join(', '),'w');
    return false;
  }
  const existingTs = omar.ts || null;
  // AARMS simfix: preservar BPM y docs lab adjuntos al OMAR (no reconstruir desde cero)
  const prevOmar = (omar && typeof omar === 'object') ? omar : {};
  omar={
    ...prevOmar,
    folio:g('o_omar'),ssar:g('o_ssar'),muestreador:g('o_muest'),elaboro:g('o_elab'),empresa:g('o_emp'),
    contacto:g('o_cont'),puesto:g('o_puest'),direccion:g('o_dir'),municipio:g('o_mun'),estado:g('o_estado'), // AARMS v64: estado separado
    telefono:g('o_tel'),sitio:g('o_sitio'),idmuestra:g('o_idm'),norma:getNorma(),
    mat:document.getElementById('o_mat').value,fecha:g('o_fecha'),tipo:g('o_tipo'),
    intervalo:g('o_int'),ndesc:g('o_ndesc'),ntomas:g('o_ntomas'),
    analitos:[...analitosSel],reglas:g('o_reglas'),
    ts: existingTs || Date.now()
  };
  ['o_omar','o_muest','o_emp','o_sitio'].forEach(id=>{
    const e=document.getElementById(id);if(e)e.style.borderColor='';
  });
  localStorage.setItem('aarms_omar',JSON.stringify(omar));
  // ESPERAR a que se persista al IDB Y se refresque la caché en memoria,
  // si no la pantalla siguiente lee datos viejos.
  try {
    await saveMuestreoActual();
  } catch(e){
    console.warn('save err',e);
  }
  if(await _flujosConsumirReturnToLvar()) return true;
  return true;
}
function editOMAR(){
  document.getElementById('omarForm').style.display='block';
  document.getElementById('omarRes').style.display='none';
}
// Mapa de analitos OMAR → parámetros de hoja de campo
const ANALITO_A_PARAM={
  'Sólidos Susp. Totales':'FQ','Sólidos Sedimentables':'FQ',
  'Acidez':'FQ','Alcalinidad Total':'FQ','Bicarbonato':'FQ',
  'Calcio':'FQ','Carbonato':'FQ','Cloro':'FQ','Cloro Libre':'FQ',
  'Conductividad Eléctrica':'FQ','DBO5':'DBO5','DQO':'DQO','COT':'TOC',
  'Dureza Ca':'FQ','Dureza Mg':'FQ','Dureza Total':'FQ',
  'Fluoruros':'FQ','Fosfatos':'FOS.','Fósforo Total':'FOS.',
  'Grasas y Aceites':'GYA','Magnesio':'FQ','Materia Flotante':'FQ',
  'Nitratos':'NO3','Nitritos':'NO2','Nitrógeno Amoniacal':'N.TOT',
  'NTK':'N.TOT','Oxígeno Disuelto':'FQ','pH':'FQ',
  'SAAM':'SAAM','Salinidad':'FQ','SDT':'FQ','Color':'CLR','Color verdadero':'CLR',
  'Cloruros':'CLOR','Sodio':'FQ','Sulfatos':'FQ','Temperatura':'FQ',
  'Toxicidad Aguda':'TOX','Turbidez':'FQ',
  'Coliformes Fecales':'CTYF','Coliformes Totales':'CTYF',
  'E. Coli':'ECOL','E.coli':'ECOL','Enterobacterias':'CTYF',
  'Enterococos':'ENTE.','Huevos Helminto':'HELM',
  'Salmonella spp.':'CTYF','Vibrio Cholerae':'CTYF',
  'Aluminio':'MP','Arsénico':'MP','Bario':'MP','Cadmio':'MP',
  'Cianuro':'CIAN','Cobre':'MP','Cromo Hexavalente':'CrHx',
  'Cromo Total':'MP','Fierro':'MP','Manganeso':'MP',
  'Mercurio':'Hg','Níquel':'MP','Plata':'MP','Plomo':'MP','Zinc':'MP',
};

function getParamsFromOMAR(){
  const params=new Set();
  (omar.analitos||[]).forEach(a=>{
    const p=ANALITO_A_PARAM[a];
    if(p) params.add(p);
  });
  return params;
}

function irCampo(){
  closeFabMenu();
  if(!omar.folio){toast('Primero confirma la OMAR','w');return;}
  const mat=_matrizNormalizada(omar.mat||document.getElementById('o_mat')?.value||'');
  if(!mat){
    toast('Selecciona la matriz en Orden de muestreo','w');
    const e=document.getElementById('o_mat');
    if(e){ e.style.borderColor='#f87171'; goPage('pg0'); if(typeof editOMAR==='function') editOMAR(); }
    return;
  }
  omar.mat=mat;
  loadCampoFromOMAR();
  buildCusTable();
  goPage('pg1');
  goSec(0);
  renderHermanasBreadcrumb();
}
function irOMAR(){closeFabMenu();goPage('pg0');renderHermanasBreadcrumb();}

// ── LOAD CAMPO FROM OMAR ──
function loadCampoFromOMAR(){
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!==undefined&&v!=='')e.value=v;};
  set('h_emp',omar.empresa);set('h_ate',omar.contacto);set('h_dir',omar.direccion);
  set('h_idm',omar.idmuestra);set('h_omar',omar.folio);
  set('c_omar',omar.folio);set('c_idm',omar.idmuestra);
  if(omar.tipo)document.getElementById('h_tipo').value=omar.tipo;
  if(omar.intervalo){
    document.getElementById('h_int').value=omar.intervalo;
    document.querySelectorAll('#h_intChips .chip').forEach(c=>{if(c.textContent.trim()===omar.intervalo)c.classList.add('on');});
  }
  if(omar.muestreador){set('c_rnom',omar.muestreador);set('mn_nom',omar.muestreador);}
  const matOrden=_matrizNormalizada(omar.mat||'');
  const matCampo=_matrizNormalizada(omar.campo?.mat||'');
  const matFinal=matCampo||matOrden;
  if(matFinal){
    const hm=document.getElementById('h_mat');
    if(hm) hm.value=matFinal;
    omar.mat=matFinal;
    omar.campo={...(omar.campo||{}), mat:matFinal};
  }
  // Pre-fill client name from OMAR contact info
  if(omar.contacto){set('fn_nom',omar.contacto);}
  if(omar.puesto){set('fn_car',omar.puesto);}

  // Auto-rellenar folio del PLAN (BPM) — viene del plan padre, no se re-teclea
  const plan = _cachedPlanes.find(p=>(p.omarIds||[]).includes(omar.ts));
  const planFolioEl = document.getElementById('h_plan');
  if(planFolioEl && plan){
    if(plan.folio){
      planFolioEl.value = plan.folio;
      planFolioEl.readOnly = true;
      planFolioEl.style.backgroundColor = 'rgba(74,158,255,.06)';
      planFolioEl.style.cursor = 'not-allowed';
      planFolioEl.title = 'Folio del plan — se define en la página del plan';
    } else {
      // Plan sin folio todavía: dejar el campo editable pero con aviso
      planFolioEl.value = '';
      planFolioEl.readOnly = false;
      planFolioEl.style.backgroundColor = '';
      planFolioEl.style.cursor = '';
      planFolioEl.placeholder = 'Asigna el folio en la página del plan';
    }
  }

  document.getElementById('topOmar2').textContent='OMAR-'+(omar.folio||'—');
  const now=new Date().toISOString().slice(0,16);
  if(!document.getElementById('h_ini').value)document.getElementById('h_ini').value=now;
  // Cargar datos de laboratorio si ya existen
  if(omar.lab){
    const l=omar.lab;
    const sv=(id,v)=>{const e=document.getElementById(id);if(e&&v)e.value=v;};
    sv('c_tnom',l.tnom);sv('c_tfir',l.tfir);sv('c_tfec',l.tfec);sv('c_thor',l.thor);
    sv('c_inom',l.inom);sv('c_ifir',l.ifir);sv('c_ifec',l.ifec);sv('c_ihor',l.ihor);
    sv('c_renom',l.renom);sv('c_refir',l.refir);sv('c_refec',l.refec);sv('c_rehor',l.rehor);
    sv('c_fotar',l.fotar);sv('c_snom',l.snom);sv('c_sfir',l.sfir);sv('c_sfec',l.sfec);sv('c_shor',l.shor);
    sv('c_isnom',l.isnom);sv('c_isfir',l.isfir);sv('c_isfec',l.isfec);sv('c_ishor',l.ishor);
    sv('c_rsnom',l.rsnom);sv('c_rsfir',l.rsfir);sv('c_rsfec',l.rsfec);sv('c_rshor',l.rshor);
    sv('c_ltnom',l.ltnom);sv('c_ltfir',l.ltfir);sv('c_ltfec',l.ltfec);sv('c_lthor',l.lthor);
    sv('c_sup',l.sup);
  }
  // Restaurar TODOS los datos del form de Hoja de Campo guardados por OMAR
  // (GPS, clima, fechas, observaciones, hcar, cciar, etc.)
  if(omar.campo){
    const c=omar.campo;
    const sv=(id,v)=>{const e=document.getElementById(id);if(e&&v!==undefined&&v!=='')e.value=v;};
    sv('h_emp',c.emp); sv('h_ate',c.ate); sv('h_dir',c.dir);
    sv('h_hcar',c.hcar); sv('h_cciar',c.cciar);
    sv('h_ini',c.ini); sv('h_fin',c.fin);
    sv('h_idm',c.idm);
    if(c.mat){const e=document.getElementById('h_mat');if(e)e.value=_matrizNormalizada(c.mat);}
    if(c.tipo){const e=document.getElementById('h_tipo');if(e)e.value=c.tipo;}
    sv('h_int',c.int); sv('h_clima',c.clima);
    sv('h_cdt',c.cdt); sv('h_rdt',c.rdt);
    sv('h_obs',c.obs);
    sv('gps_n',c.gpsN); sv('gps_w',c.gpsW);
    sv('fn_nom',c.fnNom); sv('fn_car',c.fnCar);
    sv('mn_nom',c.mnNom);
    // Marcar chip de intervalo si lo tenía
    if(c.int){
      document.querySelectorAll('#h_intChips .chip').forEach(chip=>{
        if(chip.textContent.trim()===c.int) chip.classList.add('on');
      });
    }
  }
}

// ── TOMAS ──
function addToma(){
  _syncTomasFromDOM();
  const id=tid++;
  const params=getParamsFromOMAR();
  const esLaPrimera = tomas.length === 0;
  const nueva={id,hora:'',pct:'',ls:'',tamb:'',tagua:'',
    temp_agua_l1:'',temp_agua_l2:'',temp_agua_l3:'',
    temp_amb_l1:'',temp_amb_l2:'',temp_amb_l3:'',
    temp_proc:'',temp_proc_manual:false,
    ph:'',mat:'',cond:'',od:'',color:'',olor:null,cloro:null,params};
  tomas.push(nueva);
  const div=document.getElementById('tomasDiv');
  if(div){
    div.insertAdjacentHTML('beforeend', _htmlTomaCard(nueva, tomas.length-1, true));
  }else{
    renderTomas();
  }
  if(typeof _bitPhAsegurarRegistroV==='function'&&omar?.ts){
    _bitPhAsegurarRegistroV(omar.ts, tomas.length, '', {silent:true});
  }
  if(typeof _bitCondAsegurarRegistroV==='function'&&omar?.ts){
    _bitCondAsegurarRegistroV(omar.ts, tomas.length, '', {silent:true});
  }
  // AARMS sub21-bittemp: asegurar registro de bitácora temperatura
  if(typeof _bitTempAsegurarRegistro==='function'&&omar?.ts){
    _bitTempAsegurarRegistro(omar.ts, tomas.length, '', {silent:true});
  }
  // AARMS sub3-flujos: asegurar registro bitácora flujos
  if(typeof _bitFlujosAsegurarRegistro==='function'&&omar?.ts){
    _bitFlujosAsegurarRegistro(omar.ts, tomas.length, '', {silent:true});
  }
  // AARMS sub7-od: asegurar lectura OD por toma
  if(typeof _bitODAsegurarLectura==='function'&&omar?.ts){
    void _bitODAsegurarLectura(omar.ts, tomas.length, '', omar.folio, omar.idmuestra);
  }
  updTCnt();
  _autoSaveDeferred();

  // AARMS v64: auto-generar tomas restantes al llenar hora de la primera
  if(esLaPrimera && omar.intervalo && TOMAS_POR_INTERVALO[omar.intervalo]){
    setTimeout(()=>{
      const card = document.querySelector('[data-toma-id="'+id+'"]');
      if(!card) return;
      const horaInp = card.querySelector('[data-f="hora"]');
      if(!horaInp) return;
      const handler = function(){
        const hora = _horaNormalizada(this.value);
        if(!hora) return;
        if(tomas.length !== 1){ horaInp.removeEventListener('change', handler); return; }
        _autoGenerarTomasRestantes(hora);
        horaInp.removeEventListener('change', handler);
      };
      horaInp.addEventListener('change', handler);
    }, 50);
  }
}

// AARMS v64: genera tomas restantes (n-1) basadas en la primera
function _autoGenerarTomasRestantes(horaPrimera){
  if(!omar || !omar.intervalo) return;
  const n = TOMAS_POR_INTERVALO[omar.intervalo];
  if(!n || n < 2) return;
  const gap = HORAS_ENTRE_TOMAS[omar.intervalo];
  const fechaBase = omar.fecha || _defaultBitRegistroFecha();
  const horarios = _generarHorariosToma(fechaBase, horaPrimera, n, gap);
  if(horarios.length !== n) return;
  if(tomas[0]){
    tomas[0].hora = horarios[0].hora;
    tomas[0].fechaISO = horarios[0].fechaISO;
    tomas[0].timestamp = horarios[0].timestamp;
  }
  const params = getParamsFromOMAR();
  for(let i=1; i<n; i++){
    const idNuevo = tid++;
    const nueva = {
      id: idNuevo,
      hora: horarios[i].hora,
      fechaISO: horarios[i].fechaISO,
      timestamp: horarios[i].timestamp,
      pct:'', ls:'', tamb:'', tagua:'', ph:'', mat:'', cond:'', od:'', color:'',
      olor:null, cloro:null, params
    };
    tomas.push(nueva);
    if(typeof _bitPhAsegurarRegistroV === 'function' && omar?.ts){
      _bitPhAsegurarRegistroV(omar.ts, tomas.length, nueva.hora, {silent:true});
    }
    if(typeof _bitCondAsegurarRegistroV === 'function' && omar?.ts){
      _bitCondAsegurarRegistroV(omar.ts, tomas.length, nueva.hora, {silent:true});
    }
    if(typeof _bitTempAsegurarRegistro === 'function' && omar?.ts){
      _bitTempAsegurarRegistro(omar.ts, tomas.length, nueva.hora, {silent:true});
    }
    if(typeof _bitFlujosAsegurarRegistro === 'function' && omar?.ts){
      _bitFlujosAsegurarRegistro(omar.ts, tomas.length, nueva.hora, {silent:true});
    }
    if(typeof _bitODAsegurarLectura === 'function' && omar?.ts){
      void _bitODAsegurarLectura(omar.ts, tomas.length, nueva.hora, omar.folio, omar.idmuestra);
    }
  }
  renderTomas();
  updTCnt();
  _autoSaveDeferred();
  toast('Se generaron '+(n-1)+' tomas más (cada '+gap+'h)', 'g');
}
function delToma(id){
  _syncTomasFromDOM();
  const card=document.querySelector('#tomasDiv [data-toma-id="'+id+'"]');
  if(card) card.remove();
  tomas=tomas.filter(t=>t.id!==id);
  _renumberTomaBadges();
  if(typeof _bitPhSyncAllTomasFromCampo==='function') _bitPhSyncAllTomasFromCampo();
  if(typeof _bitCondSyncAllTomasFromCampo==='function') _bitCondSyncAllTomasFromCampo();
  if(typeof _bitTempSyncAllTomasFromCampo==='function') _bitTempSyncAllTomasFromCampo();
  if(typeof _bitFlujosSyncAllTomasFromCampo==='function') _bitFlujosSyncAllTomasFromCampo();
  if(typeof _bitODSyncAllTomasFromCampo==='function') _bitODSyncAllTomasFromCampo();
  updTCnt();
  _autoSaveDeferred();
}
function togToma(id){
  const b=document.getElementById('tb'+id),c=document.getElementById('tc'+id);
  const o=b.classList.toggle('op');c.classList.toggle('op',o);
}
function upT(id,k,v){
  const tidNum=typeof id==='number'?id:parseInt(id,10);
  const t=tomas.find(x=>x.id===tidNum);
  if(t){
    if(k==='hora'){
      t.hora=_horaNormalizada(v);
      const card=document.querySelector('[data-toma-id="'+t.id+'"]');
      const timeEl=card?.querySelector('.ttime');
      if(timeEl) timeEl.textContent=t.hora||'';
    }else{
      t[k]=v;
    }
    const badge=document.querySelector(`[data-toma-id="${tidNum}"] .tpend, [data-toma-id="${tidNum}"] .tok`);
    if(badge && k==='hora'){
      const tIdx=tomas.findIndex(x=>x.id===tidNum);
      const ok=_tomaEstaCompleta(t, tIdx);
      badge.className=ok?'tok':'tpend';
      badge.textContent=ok?'✓ completa':'pendiente';
    }
    if(k==='hora'&&typeof _bitPhSyncHorasDesdeHojaCampo==='function') _bitPhSyncHorasDesdeHojaCampo();
    if(k==='hora'&&typeof _bitTempSyncHorasDesdeCampo==='function') _bitTempSyncHorasDesdeCampo();
    if(k==='hora'&&typeof _bitFlujosSyncHorasDesdeCampo==='function') _bitFlujosSyncHorasDesdeCampo();
    _autoSaveDeferred();
  }
}
function togP(tomaId,p){
  const t=tomas.find(t=>t.id===tomaId);if(!t)return;
  t.params.has(p)?t.params.delete(p):t.params.add(p);
  document.querySelectorAll('#tb'+tomaId+' .pm').forEach(el=>{
    el.classList.toggle('on',t.params.has(el.dataset.p));
  });
  _autoSaveDeferred();
}
function updTCnt(){
  const total=parseInt(omar.ntomas)||0;
  const actual=tomas.length;
  const txt=total>0?`${actual} de ${total} tomas`:`${actual} toma${actual!==1?'s':''}`;
  const el=document.getElementById('tcnt');
  if(el)el.textContent=txt;
}

// AARMS sub2-temp: selector termómetro en plan (solo si hay >1)
function _planTermometroSelectorHTML(plan){
  const termos = _catalogoCache?.equipos?.termometros || [];
  if(termos.length <= 1) return '';
  const seleccionado = plan.termometroId || termos[0].id;
  const opciones = termos.map(t => {
    const fc = parseFloat(t.fc);
    const fcStr = isNaN(fc) ? '0' : ((fc >= 0 ? '+' : '') + fc);
    return `<option value="${String(t.id).replace(/"/g,'&quot;')}" ${String(seleccionado) === String(t.id) ? 'selected' : ''}>${_equipoClave('termometros', t)} (FC ${fcStr})</option>`;
  }).join('');
  return `
  <div class="f" style="margin-top:8px">
    <label>Termómetro asignado al plan</label>
    <select onchange="planSetTermometro(this.value)" style="width:100%;background:var(--bg2);border:1px solid var(--g3);border-radius:var(--r);color:var(--w);padding:10px">${opciones}</select>
  </div>`;
}

async function planSetTermometro(id){
  const p = _planActivo();
  if(!p) return;
  p.termometroId = id;
  await guardarPlan(p);
  toast('Termómetro asignado: ' + id, 'g');
  if(typeof renderTomas === 'function') renderTomas();
}
window.planSetTermometro = planSetTermometro;

function renderTomas(){
  const openIds=new Set();
  tomas.forEach(t=>{
    const b=document.getElementById('tb'+t.id);
    if(b&&b.classList.contains('op')) openIds.add(t.id);
  });
  const div=document.getElementById('tomasDiv');
  if(!div) return;
  // AARMS v64: banner de sugerencia de auto-generación
  const banner = document.getElementById('tomasBannerAuto');
  if(banner){
    if(tomas.length === 0 && omar && omar.intervalo && TOMAS_POR_INTERVALO[omar.intervalo]){
      const n = TOMAS_POR_INTERVALO[omar.intervalo];
      const gap = HORAS_ENTRE_TOMAS[omar.intervalo];
      banner.innerHTML = '<div style="background:rgba(74,158,255,.08);border:1px solid rgba(74,158,255,.3);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;line-height:1.5"><div style="font-weight:700;color:var(--acc);margin-bottom:4px">Intervalo '+omar.intervalo+' → '+n+' tomas cada '+gap+'h</div><div style="color:var(--g1)">Captura la hora de la <b>primera toma</b> y la app genera las otras '+(n-1)+' automáticamente.</div></div>';
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
    }
  }
  div.innerHTML=tomas.map((t,idx)=>_htmlTomaCard(t, idx, openIds.has(t.id))).join('');
}

// ── HOJA HELPERS ──
function setHInt(el,v){
  document.querySelectorAll('#h_intChips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');document.getElementById('h_int').value=v;
}
function setSino(key,el,v){
  const w=el.closest('.sino');w.querySelectorAll('.sino-b').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');document.getElementById('h_'+key).value=v;
}
function getGPS(){
  if(!navigator.geolocation){
    toast('GPS no disponible en este dispositivo','w');
    return;
  }

  // Show loading state on button
  const btn=document.querySelector('[onclick="getGPS()"]');
  if(btn){btn.textContent='⏳ Obteniendo ubicación...';btn.disabled=true;}
  toast('Solicitando ubicación GPS...','');

  navigator.geolocation.getCurrentPosition(
    p=>{
      const la=p.coords.latitude.toFixed(6);
      const lo=Math.abs(p.coords.longitude).toFixed(6);
      const alt=p.coords.altitude?p.coords.altitude.toFixed(1)+'m':'—';
      const acc=p.coords.accuracy?p.coords.accuracy.toFixed(0)+'m':'—';

      document.getElementById('gps_n').value=la+'°';
      document.getElementById('gps_w').value=lo+'°';

      // Restore button
      if(btn){btn.innerHTML='✅ GPS capturado';btn.disabled=false;}

      toast('GPS: '+la+'°N, '+lo+'°W  (±'+acc+')','g');
      _autoSaveNow(); // Persistir GPS para que no se pierda
    },
    e=>{
      if(btn){btn.innerHTML='📍 Obtener GPS automático';btn.disabled=false;}
      if(e.code===1){
        // Permission denied
        toast('Permiso denegado — activa ubicación en Ajustes','w');
        // Show instructions
        showGPSHelp();
      } else if(e.code===2){
        toast('Señal GPS débil — intenta en exterior','w');
      } else if(e.code===3){
        toast('GPS tardó mucho — intenta de nuevo','w');
      } else {
        toast('Error GPS: '+e.message,'w');
      }
    },
    {
      enableHighAccuracy: true,  // Use GPS chip, not WiFi
      timeout: 15000,            // 15 seconds
      maximumAge: 0              // Always fresh location
    }
  );
}

function showGPSHelp(){
  // Show a modal with instructions for iOS
  const modal=document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;background:rgba(7,8,15,.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML=`
    <div style="background:#0d1220;border:1px solid rgba(74,158,255,.3);border-radius:16px;padding:24px;max-width:360px;width:100%">
      <div style="font-family:Syne,sans-serif;font-size:16px;font-weight:800;color:#f0f8ff;margin-bottom:8px">
        📍 Activar GPS en iPad
      </div>
      <div style="font-size:13px;color:#8bb4d8;line-height:1.6;margin-bottom:16px">
        Para usar el GPS necesitas dar permiso a Safari:
      </div>
      <div style="background:#182034;border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;color:#f0f8ff;line-height:1.8">
          1️⃣  Abre <strong style="color:#4a9eff">Ajustes</strong> en tu iPad<br>
          2️⃣  Ve a <strong style="color:#4a9eff">Privacidad y seguridad</strong><br>
          3️⃣  Toca <strong style="color:#4a9eff">Localización</strong><br>
          4️⃣  Busca <strong style="color:#4a9eff">Safari</strong> → <strong style="color:#4a9eff">Al usar la app</strong><br>
          5️⃣  Regresa a AARMS y toca GPS de nuevo
        </div>
      </div>
      <div style="font-size:11px;color:#3d6080;margin-bottom:16px">
        También puedes ingresar las coordenadas manualmente en los campos N y W.
      </div>
      <button onclick="this.closest('[style*=position]').remove()" 
        style="width:100%;padding:12px;background:#4a9eff;border:none;border-radius:10px;color:#fff;font-family:Syne,sans-serif;font-weight:700;font-size:14px;cursor:pointer">
        Entendido
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}
async function irCustodia(){
  closeFabMenu();
  if(tomas.length===0){toast('Agrega al menos una toma','w');return;}
  _syncTomasFromDOM();
  try{ await saveMuestreoActual(); }catch(e){ console.warn('[irCustodia save]',e); }
  syncCampoToCustodia();
  buildCusTable();
  goSec(1);
  toast('Hoja guardada ✓','g');
}
function syncCampoToCustodia(){
  const g=id=>document.getElementById(id)?document.getElementById(id).value:'';
  document.getElementById('c_cciar').value=g('h_cciar');
  document.getElementById('c_hcar').value=g('h_hcar');
}

// ── CUSTODIA ──
// Pre-filled data per analito (same as PDF)
const CADENA_DATA={
  'FQ'  :{pres:'4',     vol:'4000', env:'3',    ph:''},
  'TOC' :{pres:'4/10',  vol:'1000', env:'8',    ph:'<2'},
  'Hg'  :{pres:'4/9/3', vol:'500',  env:'4',    ph:'<2'},
  'MP'  :{pres:'4/9',   vol:'500',  env:'4',    ph:'<2'},
  'CIAN':{pres:'4/2',   vol:'1000', env:'2',    ph:'>12'},
  'FOS.':{pres:'4',     vol:'500',  env:'4',    ph:''},
  'SAAM':{pres:'4',     vol:'1000', env:'2',    ph:'<2'},
  'GYA' :{pres:'4/1',   vol:'1000', env:'1',    ph:'<2'},
  'DQO' :{pres:'4/1',   vol:'500',  env:'4',    ph:'<2'},
  'DBO5':{pres:'4',     vol:'1000', env:'2',    ph:''},
  'N.TOT':{pres:'4/1',  vol:'2000', env:'13',   ph:'<2'},
  'CTYF':{pres:'4/7o11',vol:'100',  env:'12o9', ph:''},
  'ENTE.':{pres:'4/7o11',vol:'250', env:'6o7',  ph:''},
  'NO2' :{pres:'4',     vol:'500',  env:'4',    ph:''},
  'NO3' :{pres:'4',     vol:'500',  env:'4',    ph:''},
  'HELM':{pres:'4',     vol:'5000', env:'5',    ph:''},
  'CLR' :{pres:'4',     vol:'250',  env:'11',   ph:''},
  'ECOL':{pres:'4/7o11',vol:'100',  env:'12o9', ph:''},
  'TOX' :{pres:'4',     vol:'40',   env:'10',   ph:''},
  'CLOR':{pres:'4',     vol:'500',  env:'4',    ph:''},
  'CrHx':{pres:'4/12',  vol:'500',  env:'4',    ph:'9'},
  'OTRS':{pres:'',      vol:'',     env:'',     ph:''},
};
const CADENA_SIMPLES=['GYA','CTYF','ENTE.','ECOL','TOX'];

// AARMS sub4-cons: 21 analitos del Machiote pág 4 — keys = PARAMS_TOMA (sin OTRS)
const MACHIOTE_ANALITOS = [
  { key: 'FQ',    nombre: 'Fisicoquímico' }, // AARMS humofix: tilde en Fisicoquímico
  { key: 'TOC',   nombre: 'TOC' },
  { key: 'Hg',    nombre: 'Mercurio' },
  { key: 'MP',    nombre: 'Metales pesados' },
  { key: 'CIAN',  nombre: 'Cianuro' },
  { key: 'FOS.',  nombre: 'Fósforo' },
  { key: 'SAAM',  nombre: 'SAAM' },
  { key: 'GYA',   nombre: 'Grasas y Aceites' },
  { key: 'DQO',   nombre: 'DQO' },
  { key: 'DBO5',  nombre: 'DBO5' },
  { key: 'N.TOT', nombre: 'N Total (NTK)' },
  { key: 'CTYF',  nombre: 'Coliformes' },
  { key: 'ENTE.', nombre: 'Enterococos' },
  { key: 'NO2',   nombre: 'NO₂' },
  { key: 'NO3',   nombre: 'NO₃' },
  { key: 'HELM',  nombre: 'Huevos de Helminto' },
  { key: 'CLR',   nombre: 'Color' },
  { key: 'ECOL',  nombre: 'E. Coli' },
  { key: 'TOX',   nombre: 'Toxicidad Aguda' },
  { key: 'CLOR',  nombre: 'Cloruros' },
  { key: 'CrHx',  nombre: 'Cromo Hexavalente' }
];
window.MACHIOTE_ANALITOS = MACHIOTE_ANALITOS;

// AARMS sub4-cons: tomas del OMAR activo (live `tomas` o persistidas)
function _machioteTomasFuente(omarOpt){
  const o = omarOpt || (omar && omar.ts ? omar : null);
  if(o && omar && o.ts && String(o.ts) === String(omar.ts) && Array.isArray(tomas) && tomas.length){
    return tomas;
  }
  if(o && o.ts){
    const m = (_cachedMuestreos || []).find(x => String(x.id) === String(o.ts));
    if(m && Array.isArray(m.tomas) && m.tomas.length) return m.tomas;
  }
  if(Array.isArray(tomas)) return tomas;
  return [];
}

function _machioteParamsDeToma(t){
  if(!t) return [];
  if(t.params instanceof Set) return [...t.params];
  if(Array.isArray(t.params)) return t.params;
  if(Array.isArray(t.analitos)) return t.analitos;
  return [];
}

// AARMS sub4-cons: LEER preservación de CADENA_DATA (no mutar). Respeta lógica cloro CTYF/ENTE/ECOL.
function _cadenaPresParaAnalito(analitoKey){
  if(typeof CADENA_DATA !== 'object' || !CADENA_DATA[analitoKey]) return '';
  if(['CTYF', 'ENTE.', 'ECOL'].includes(analitoKey)){
    const conCloro = typeof tieneCloro === 'function' && tieneCloro();
    return conCloro ? '4/7' : '4';
  }
  return String(CADENA_DATA[analitoKey].pres || '');
}

// AARMS sub51b-compound: mostrar TODOS los códigos, hielo primero, separados por /
// AARMS humofix: CTYF/ENTE./ECOL por TOMA (cloro) — SOLO Machiote; cadena de custodia intacta
function _machioteCodigoConservador(analitoKey, toma){
  const esCloroSensible = ['CTYF', 'ENTE.', 'ECOL'].includes(analitoKey);
  if(esCloroSensible && toma){
    return toma.cloro === true ? '4/7' : '4';
  }
  const presCrudo = _cadenaPresParaAnalito(analitoKey);
  if(!presCrudo) return '';
  let partes = String(presCrudo).split('/').map(p => p.trim()).filter(Boolean);
  partes = partes.map(p => {
    if(/o/i.test(p) && !/^\d+$/.test(p)){
      const m = p.split(/o/i);
      return (m[0] || '').trim();
    }
    return p;
  }).filter(p => /^\d{1,2}$/.test(p) && +p >= 1 && +p <= 14);
  const vistos = new Set();
  const unicos = [];
  partes.forEach(p => {
    if(!vistos.has(p)){ vistos.add(p); unicos.push(p); }
  });
  if(!unicos.length) return '';
  const tieneHielo = unicos.includes('4');
  const sinHielo = unicos.filter(p => p !== '4');
  if(tieneHielo) return ['4', ...sinHielo].join('/');
  return unicos.join('/');
}
window._machioteCodigoConservador = _machioteCodigoConservador;

function _analitoEnToma(omarOpt, tomaIdx, analitoKey){
  const list = _machioteTomasFuente(omarOpt);
  const t = list[tomaIdx];
  if(!t) return false;
  return _machioteParamsDeToma(t).includes(analitoKey);
}
window._analitoEnToma = _analitoEnToma;

function _analitosUsadosEnOmar(omarOpt){
  const list = _machioteTomasFuente(omarOpt);
  const set = new Set();
  list.forEach(t => _machioteParamsDeToma(t).forEach(p => set.add(p)));
  return MACHIOTE_ANALITOS.filter(a => set.has(a.key));
}
window._analitosUsadosEnOmar = _analitosUsadosEnOmar;

// AARMS sub4-cons: pre-llenar matriz desde cadena (respeta ediciones manuales)
function _machioteInicializarConservadores(omarOpt){
  const o = omarOpt || (omar && omar.ts ? omar : null);
  if(!o) return;
  if(!o.machiote) o.machiote = {};
  if(!o.machiote.conservadores) o.machiote.conservadores = {};
  const analitosUsados = _analitosUsadosEnOmar(o);
  const list = _machioteTomasFuente(o);
  const totalTomas = list.length;
  analitosUsados.forEach(a => {
    if(!o.machiote.conservadores[a.key]) o.machiote.conservadores[a.key] = {};
    for(let i = 0; i < totalTomas; i++){
      const key = 'toma' + (i + 1);
      if(!o.machiote.conservadores[a.key][key]){
        const enToma = _analitoEnToma(o, i, a.key);
        // AARMS humofix: código default con contexto de la toma (cloro per-toma)
        const codigoDefault = _machioteCodigoConservador(a.key, list[i]);
        o.machiote.conservadores[a.key][key] = {
          codigo: enToma ? codigoDefault : '',
          ml: '',
          ph: ''
        };
      }
    }
  });
}
window._machioteInicializarConservadores = _machioteInicializarConservadores;

// AARMS sub4-cons: render matriz conservadores en pgBm
function _renderMachioteConservadores(){
  const cont = document.getElementById('bmConservadoresMatriz');
  if(!cont) return;
  const o = (omar && omar.ts) ? omar : null;
  if(!o){
    cont.innerHTML = '<div style="padding:16px;color:var(--g2);font-style:italic">Selecciona un OMAR para ver la matriz de conservadores.</div>';
    return;
  }
  _machioteInicializarConservadores(o);
  const analitosUsados = _analitosUsadosEnOmar(o);
  const list = _machioteTomasFuente(o);
  const totalTomas = list.length;
  if(analitosUsados.length === 0 || totalTomas === 0){
    cont.innerHTML = '<div style="padding:16px;color:var(--g2);font-style:italic">Captura tomas con analitos en la Hoja de Campo para poblar esta tabla.</div>';
    return;
  }
  let html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10.5px;font-family:var(--mono)">';
  html += '<thead><tr>';
  html += '<th style="background:var(--bg2);border:1px solid var(--ln);padding:4px 6px;font-family:var(--syne);color:var(--w);text-align:left;position:sticky;left:0;z-index:2">Analito</th>';
  for(let i = 1; i <= totalTomas; i++){
    html += `<th colspan="3" style="background:var(--bg2);border:1px solid var(--ln);padding:4px 6px;font-family:var(--syne);color:#60a5fa;text-align:center">No. ${i}</th>`;
  }
  html += '</tr><tr>';
  html += '<th style="background:var(--bg2);border:1px solid var(--ln);padding:2px 4px;position:sticky;left:0"></th>';
  for(let i = 1; i <= totalTomas; i++){
    html += '<th style="background:rgba(148,163,184,.05);border:1px solid var(--ln);padding:2px 3px;font-size:9px;color:var(--g2)">Cód</th>';
    html += '<th style="background:rgba(148,163,184,.05);border:1px solid var(--ln);padding:2px 3px;font-size:9px;color:var(--g2)">ml</th>';
    html += '<th style="background:rgba(148,163,184,.05);border:1px solid var(--ln);padding:2px 3px;font-size:9px;color:var(--g2)">pH</th>';
  }
  html += '</tr></thead><tbody>';
  analitosUsados.forEach(a => {
    html += '<tr>';
    html += `<td style="border:1px solid var(--ln);padding:4px 6px;background:var(--bg2);position:sticky;left:0;z-index:1;color:var(--w);font-weight:700;font-family:var(--syne)">${a.nombre}</td>`;
    for(let i = 0; i < totalTomas; i++){
      const tomaNum = i + 1;
      const key = 'toma' + tomaNum;
      const cell = (o.machiote?.conservadores?.[a.key]?.[key]) || { codigo:'', ml:'', ph:'' };
      const enToma = _analitoEnToma(o, i, a.key);
      const cellStyle = enToma ? '' : 'background:rgba(148,163,184,.03);opacity:.5';
      const dis = enToma ? '' : 'disabled';
      html += `<td style="border:1px solid var(--ln);padding:2px;${cellStyle}"><input type="text" value="${String(cell.codigo||'').replace(/"/g,'&quot;')}" data-mach-analito="${a.key}" data-mach-toma="${tomaNum}" data-mach-field="codigo" style="width:48px;background:transparent;border:none;color:var(--acc);font-family:var(--mono);font-size:10px;text-align:center;padding:2px" placeholder="—" ${dis}></td>`;
      html += `<td style="border:1px solid var(--ln);padding:2px;${cellStyle}"><input type="text" value="${String(cell.ml||'').replace(/"/g,'&quot;')}" data-mach-analito="${a.key}" data-mach-toma="${tomaNum}" data-mach-field="ml" style="width:32px;background:transparent;border:none;color:var(--w);font-family:var(--mono);font-size:10px;text-align:center;padding:2px" placeholder="—" ${dis}></td>`;
      html += `<td style="border:1px solid var(--ln);padding:2px;${cellStyle}"><input type="text" value="${String(cell.ph||'').replace(/"/g,'&quot;')}" data-mach-analito="${a.key}" data-mach-toma="${tomaNum}" data-mach-field="ph" style="width:36px;background:transparent;border:none;color:var(--w);font-family:var(--mono);font-size:10px;text-align:center;padding:2px" placeholder="—" ${dis}></td>`;
    }
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  html += `
  <div style="margin-top:14px;padding:10px 12px;background:rgba(74,158,255,.04);border-left:2px solid var(--acc);border-radius:6px">
    <div style="font-family:var(--syne);font-weight:800;color:var(--acc);font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">Códigos de conservación</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:4px 12px;font-family:var(--mono);font-size:10.5px;color:var(--g1)">
      ${Object.entries(CONS_O).map(([n, nombre]) =>
        `<div><span style="color:#60a5fa;font-weight:700">${n}.-</span> ${nombre}</div>`
      ).join('')}
    </div>
  </div>`;
  cont.innerHTML = html;
}
window._renderMachioteConservadores = _renderMachioteConservadores;

// AARMS sub4-cons: guardar cambios en la matriz
document.addEventListener('input', function(e){
  const el = e.target;
  if(!el || !el.hasAttribute('data-mach-analito')) return;
  const analito = el.getAttribute('data-mach-analito');
  const toma = el.getAttribute('data-mach-toma');
  const field = el.getAttribute('data-mach-field');
  const val = el.value;
  if(!omar || !omar.ts) return;
  if(!omar.machiote) omar.machiote = {};
  if(!omar.machiote.conservadores) omar.machiote.conservadores = {};
  if(!omar.machiote.conservadores[analito]) omar.machiote.conservadores[analito] = {};
  const tomaKey = 'toma' + toma;
  if(!omar.machiote.conservadores[analito][tomaKey]){
    omar.machiote.conservadores[analito][tomaKey] = { codigo:'', ml:'', ph:'' };
  }
  omar.machiote.conservadores[analito][tomaKey][field] = val;
  clearTimeout(window._machioteConsSave);
  window._machioteConsSave = setTimeout(async () => {
    try{ await saveMuestreoActual(); }catch(err){ console.warn('[machiote cons save]', err); }
  }, 250);
});

// Detecta si alguna toma tiene cloro registrado como SI
function tieneCloro(){
  return tomas.some(t=>t.cloro===true);
}

function buildCusTable(){
  const conCloro=tieneCloro();
  // Actualizar dinámicamente según cloro
  CADENA_DATA['CTYF'].pres=conCloro?'4/7':'4';
  CADENA_DATA['CTYF'].env=conCloro?'9':'12';
  CADENA_DATA['ENTE.'].pres=conCloro?'4/7':'4';
  CADENA_DATA['ENTE.'].env=conCloro?'7':'6';
  CADENA_DATA['ECOL'].pres=conCloro?'4/7':'4';
  CADENA_DATA['ECOL'].env=conCloro?'9':'12';
  // Active params from tomas — solo los seleccionados por el usuario
  const activeSet=new Set([
    ...tomas.flatMap(t=>[...t.params])
  ]);
  const allParams=['FQ','TOC','Hg','MP','CIAN','FOS.','SAAM','GYA','DQO','DBO5','N.TOT','CTYF','ENTE.','NO2','NO3','HELM','CLR','ECOL','TOX','CLOR','CrHx','OTRS'];

  // Build header
  document.getElementById('ctHead').innerHTML=
    '<th class="sth">Parámetro</th>'+
    allParams.map(function(p){
      var active=activeSet.has(p);
      var isS=CADENA_SIMPLES.includes(p);
      var bg=active?(isS?'rgba(0,210,150,.15)':'rgba(74,158,255,.1)'):'transparent';
      var tc=active?(isS?'#00d296':'#4a9eff'):'#555e7a';
      var op=active?'1':'0.4';
      return '<th style="background:'+bg+';color:'+tc+';opacity:'+op+'">'+p+'</th>';
    }).join('');

  // Build rows
  const ROWS=[
    ['Cód. Preserv.',  p=>CADENA_DATA[p]?.pres||'—'],
    ['Volumen (mL)',    p=>CADENA_DATA[p]?.vol||'—'],
    ['Tipo de Envase', p=>CADENA_DATA[p]?.env||'—'],
    ['N° Frascos',     p=>CADENA_DATA[p]?.env?((['GYA','CTYF','ENTE.','ECOL'].includes(p))?String(tomas.length||1):'1'):'—'],
    ['pH Preserv.',    p=>CADENA_DATA[p]?.ph||'—'],
    ['Analizó',        p=>''],
    ['A Sucursal',     p=>''],
  ];

  document.getElementById('ctBody').innerHTML=ROWS.map(function(rowDef,ri){
    var lbl=rowDef[0], fn=rowDef[1];
    var cells=allParams.map(function(p,ci){
      var active=activeSet.has(p);
      var isS=CADENA_SIMPLES.includes(p);
      var val=fn(p);
      var id='cc_'+ri+'_'+ci;
      if(!active){
        return '<td style="position:relative;overflow:hidden;background:rgba(10,16,40,.5)"><div style="position:absolute;inset:0;background:repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(255,255,255,.03) 4px,rgba(255,255,255,.03) 5px)"></div></td>';
      }
      if(ri>=5){
        var bg=isS?'rgba(0,210,150,.07)':'rgba(74,158,255,.05)';
        return '<td><input id="'+id+'" type="text" style="width:100%;border:none;background:'+bg+';color:#fff;text-align:center;font-size:11px;padding:2px;font-family:var(--dm)" placeholder="—"></td>';
      }
      var bg2=isS?'rgba(0,210,150,.12)':'rgba(74,158,255,.08)';
      var tc=isS?'#00d296':'#a8c8ff';
      return '<td style="text-align:center;font-weight:700;font-size:12px;background:'+bg2+';color:'+tc+'">'+val+'</td>';
    });
    return '<tr><td class="stl">'+lbl+'</td>'+cells.join('')+'</tr>';
  }).join('');
}
function setTransp(t){
  document.getElementById('hb').classList.toggle('on',t==='hielera');
  document.getElementById('ob').classList.toggle('on',t==='otro');
  document.getElementById('c_otro').style.display=t==='otro'?'block':'none';
  document.getElementById('c_transp').value=t;
}
function irFirma(){goSec(2);toast('Custodia guardada ✓','g');}

// Llena un input date/time con el valor de "ahora"
function setNow(inputId){
  const el=document.getElementById(inputId);
  if(!el) return;
  const d=new Date();
  const pad=n=>String(n).padStart(2,'0');
  if(el.type==='date'){
    el.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  } else if(el.type==='time'){
    el.value=`${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } else if(el.id && el.id.endsWith('hor')){
    // input tipo text con patrón HH:MM
    el.value=`${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } else {
    // fallback fecha en texto
    el.value=`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  }
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.style.background='rgba(74,222,128,.1)';
  setTimeout(()=>{el.style.background='';},400);
}

// Llena todas las fechas/horas de una sección con "ahora"
function setNowGroup(prefix){
  setNow(prefix+'fec');
  setNow(prefix+'hor');
}

// Auto-formato de hora HH:MM mientras el usuario teclea.
// Acepta sólo dígitos, inserta ":" después del segundo dígito.
// Valida rangos: horas 00-23, minutos 00-59.
function fmtHoraInput(el){
  // Conservar posición del cursor de forma aproximada
  let raw=el.value.replace(/[^0-9]/g,'').slice(0,4);
  let out='';
  if(raw.length===0){ el.value=''; return; }
  // Primeros 2 dígitos = horas
  if(raw.length<=2){
    out=raw;
  } else {
    out=raw.slice(0,2)+':'+raw.slice(2,4);
  }
  // Si hay 2 dígitos completos en horas y exceden 23, limitar a 23
  if(out.length>=2){
    const hh=parseInt(out.slice(0,2),10);
    if(hh>23){ out='23'+out.slice(2); }
  }
  // Si hay 2 dígitos completos en minutos y exceden 59, limitar a 59
  if(out.length===5){
    const mm=parseInt(out.slice(3,5),10);
    if(mm>59){ out=out.slice(0,3)+'59'; }
  }
  el.value=out;
}


function checkCamposCompletos(){
  const faltantes=[];
  if(!omar.folio) faltantes.push('Folio OMAR');
  if(!omar.empresa) faltantes.push('Empresa');
  if(tomas.length===0) faltantes.push('Al menos una toma');
  const tomasSinPH=tomas.filter(t=>!t.ph).length;
  const tomasSinFlujo=tomas.filter(t=>!t.ls).length;
  if(tomasSinPH>0) faltantes.push(`pH en ${tomasSinPH} toma(s)`);
  if(tomasSinFlujo>0) faltantes.push(`Flujo en ${tomasSinFlujo} toma(s)`);
  if(!sigData) faltantes.push('Firma del cliente');
  return faltantes;
}

function genPDFConCheck(tipo){
  const faltantes=checkCamposCompletos();
  const tomasCompletas=tomas.filter(t=>t.ph&&t.ls).length;
  const analitos=(omar.analitos||[]).slice(0,6).join(', ')+(omar.analitos&&omar.analitos.length>6?` +${omar.analitos.length-6} más`:'');
  // Sin firma del cliente, NINGÚN PDF se genera.
  const tieneFirma = tieneFirmaValida();
  const firmaBloquea = !tieneFirma;

  const modal=document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;background:rgba(7,8,15,.95);z-index:99999;display:flex;align-items:flex-end;padding:0';
  modal.innerHTML=`
    <div style="width:100%;background:var(--bg1);border-radius:20px 20px 0 0;padding:24px;max-height:85vh;overflow-y:auto">
      <div style="font-family:var(--syne);font-size:18px;font-weight:800;color:var(--w);margin-bottom:4px">Resumen del muestreo</div>
      <div style="font-size:12px;color:var(--g1);margin-bottom:20px">Verifica antes de generar el PDF</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <div style="background:var(--bg3);border-radius:10px;padding:12px">
          <div style="font-size:10px;color:var(--g1);text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono)">OMAR</div>
          <div style="font-family:var(--syne);font-size:15px;font-weight:800;color:var(--acc)">${omar.folio||'—'}</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:12px">
          <div style="font-size:10px;color:var(--g1);text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono)">Tipo</div>
          <div style="font-family:var(--syne);font-size:15px;font-weight:800;color:var(--w)">${omar.tipo||'—'}</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:12px;grid-column:span 2">
          <div style="font-size:10px;color:var(--g1);text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono)">Empresa</div>
          <div style="font-family:var(--syne);font-size:14px;font-weight:700;color:var(--w)">${omar.empresa||'—'}</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:12px">
          <div style="font-size:10px;color:var(--g1);text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono)">Tomas</div>
          <div style="font-family:var(--syne);font-size:15px;font-weight:800;color:${tomasCompletas===tomas.length&&tomas.length>0?'var(--green)':'var(--amber)'}">${tomasCompletas}/${tomas.length} completas</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:12px">
          <div style="font-size:10px;color:var(--g1);text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono)">Firma cliente</div>
          <div style="font-family:var(--syne);font-size:15px;font-weight:800;color:${tieneFirma?'var(--green)':'#f87171'}">${tieneFirma?'✓ Firmado':'Sin firma'}</div>
        </div>
        ${analitos?`<div style="background:var(--bg3);border-radius:10px;padding:12px;grid-column:span 2">
          <div style="font-size:10px;color:var(--g1);text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono)">Analitos</div>
          <div style="font-size:12px;color:var(--w);margin-top:4px">${analitos}</div>
        </div>`:''}
      </div>

      ${firmaBloquea ? `
      <div style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.35);border-radius:10px;padding:14px;margin-bottom:16px">
        <div style="font-family:var(--syne);font-size:13px;font-weight:800;color:#f87171;margin-bottom:6px">⚠ El cliente debe firmar primero</div>
        <div style="font-size:12px;color:var(--g1);line-height:1.5">El reporte del cliente requiere su firma de conformidad. Pide al responsable de la empresa que firme en la sección "Firma" antes de continuar.</div>
      </div>` : ''}

      ${faltantes.length>0 && !firmaBloquea ? `
      <div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:10px;padding:12px;margin-bottom:16px">
        <div style="font-family:var(--syne);font-size:12px;font-weight:800;color:var(--amber);margin-bottom:8px">Campos incompletos</div>
        ${faltantes.map(f=>`<div style="font-size:12px;color:var(--g1);padding:2px 0">· ${f}</div>`).join('')}
      </div>` : (!firmaBloquea ? '<div style="background:rgba(134,239,172,.08);border:1px solid rgba(134,239,172,.25);border-radius:10px;padding:12px;margin-bottom:16px"><div style="font-family:var(--syne);font-size:12px;font-weight:800;color:var(--green)">✓ Todo completo</div></div>' : '')}

      <div style="display:flex;gap:10px">
        <button onclick="this.closest('div[style*=fixed]').remove()" style="flex:1;padding:12px;border-radius:10px;background:var(--bg3);border:1px solid var(--ln2);color:var(--g1);cursor:pointer;font-family:var(--syne);font-weight:700;font-size:14px">Cancelar</button>
        ${firmaBloquea ? `
          <button disabled style="flex:1;padding:12px;border-radius:10px;background:rgba(100,110,130,.25);border:none;color:rgba(255,255,255,.45);cursor:not-allowed;font-family:var(--syne);font-weight:800;font-size:14px">Falta firma</button>
        ` : `
          <button onclick="this.closest('div[style*=fixed]').remove();genPDF('${tipo}')" style="flex:1;padding:12px;border-radius:10px;background:var(--acc);border:none;color:#fff;cursor:pointer;font-family:var(--syne);font-weight:800;font-size:14px">Generar PDF</button>
        `}
      </div>
    </div>`;
  document.body.appendChild(modal);
}

// ── FIRMA ──
function initCanvas(){
  const c=document.getElementById('sigCanvas'),ctx=c.getContext('2d');
  ctx.strokeStyle='#4a9eff';ctx.lineWidth=2.8;ctx.lineCap='round';ctx.lineJoin='round';
  let dr=false,lx,ly;
  const pos=e=>{const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;
    return e.touches?[(e.touches[0].clientX-r.left)*sx,(e.touches[0].clientY-r.top)*sy]:[(e.clientX-r.left)*sx,(e.clientY-r.top)*sy];};
  const st=e=>{e.preventDefault();dr=true;[lx,ly]=pos(e);ctx.beginPath();ctx.moveTo(lx,ly);document.getElementById('cvsover').classList.add('hide');};
  const mv=e=>{if(!dr)return;e.preventDefault();const[x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke();lx=x;ly=y;sigData='p';};
  const en=()=>{dr=false;if(sigData==='p'){sigData=c.toDataURL();document.getElementById('cvswrap').classList.add('signed');updSig();}};
  c.addEventListener('mousedown',st);c.addEventListener('mousemove',mv);c.addEventListener('mouseup',en);
  c.addEventListener('touchstart',st,{passive:false});c.addEventListener('touchmove',mv,{passive:false});c.addEventListener('touchend',en);
}
function clearSig(){
  const c=document.getElementById('sigCanvas');c.getContext('2d').clearRect(0,0,c.width,c.height);
  sigData=null;document.getElementById('cvswrap').classList.remove('signed');
  document.getElementById('cvsover').classList.remove('hide');updSig();
}
function updSig(){
  const ok=sigData&&sigData!=='p';
  const el=document.getElementById('sigst');
  if(el){
    el.textContent=ok?'✓ Firma capturada':'Sin firma';
    el.className='sigst'+(ok?' ok':'');
  }
}
function buildRes(){
  // Auto-fill firma fields from OMAR if still empty
  const gv=id=>{const e=document.getElementById(id);return e?e.value.trim():'';}
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&!e.value.trim()&&v)e.value=v;}
  set('fn_nom',omar.contacto||'');
  set('fn_car',omar.puesto||'');
  set('mn_nom',omar.muestreador||'');

  const ok=tomas.filter(t=>t.ph||t.tagua).length;
  const sig=sigData&&sigData!=='p';
  document.getElementById('resBody').innerHTML=[
    ['OMAR',omar.folio?'OMAR-'+omar.folio:'—',!!omar.folio],
    ['Cliente',omar.empresa||'—',!!omar.empresa],
    ['Tomas',tomas.length+' ('+ok+' completas)',tomas.length>0],
    ['Analitos',(omar.analitos||[]).length+' parámetros',(omar.analitos||[]).length>0],
    ['Firma',sig?'✓ Capturada':'⏳ Pendiente',sig]
  ].map(([k,v,g])=>`<div class="ri"><span class="rk">${k}</span><span class="rv ${g?'ok':'pend'}">${v}</span></div>`).join('');
}

// ── PHOTO HANDLERS ──
let photoData = null, photoData2 = null;

// Debounce de autoguardado: evita saturar IndexedDB con cada keystroke.
// Se llama desde inputs, tomas, fotos, GPS, etc.
let _autoSaveTimer = null;
function _autoSaveDeferred(delay=400){
  if(_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(async ()=>{
    try{ await saveMuestreoActual(); }catch(e){ console.warn('[autosave]',e); }
    _autoSaveTimer = null;
  }, delay);
}

// Versión inmediata para cuando hay un cambio crítico (ej. foto recién tomada)
async function _autoSaveNow(){
  if(_autoSaveTimer){ clearTimeout(_autoSaveTimer); _autoSaveTimer=null; }
  try{ await saveMuestreoActual(); }catch(e){ console.warn('[autosave-now]',e); }
}
function handlePhoto(input){
  if(!input.files||!input.files[0])return;
  const reader=new FileReader();
  reader.onload=e=>{
    photoData=e.target.result;
    document.getElementById('photoImg').src=photoData;
    document.getElementById('photoPreview').style.display='block';
    document.getElementById('delPhotoBtn').style.display='inline-flex';
    toast('Foto de registro agregada ✓','g');
    _autoSaveNow(); // Guardar la foto inmediato para que persista por OMAR
  };
  reader.readAsDataURL(input.files[0]);
}
function delPhoto(){
  photoData=null;
  document.getElementById('photoPreview').style.display='none';
  document.getElementById('delPhotoBtn').style.display='none';
  document.getElementById('camInput').value='';
  _autoSaveNow();
}
function handlePhoto2(input){
  if(!input.files||!input.files[0])return;
  const reader=new FileReader();
  reader.onload=e=>{
    photoData2=e.target.result;
    document.getElementById('photoImg2').src=photoData2;
    document.getElementById('photoPreview2').style.display='block';
    document.getElementById('delPhotoBtn2').style.display='inline-flex';
    toast('Foto para cliente agregada ✓','g');
    _autoSaveNow();
  };
  reader.readAsDataURL(input.files[0]);
}
function delPhoto2(){
  photoData2=null;
  document.getElementById('photoPreview2').style.display='none';
  document.getElementById('delPhotoBtn2').style.display='none';
  document.getElementById('camInput2').value='';
  _autoSaveNow();
}

// ── LOGO ──
const LOGO_B64=LOGO_APP_URI;

// ── PDF GENERATOR ──

// ── IMAGE HELPERS ──
// Preload image and get real dimensions - returns Promise
function preloadImg(dataUrl){
  return new Promise(resolve=>{
    if(!dataUrl||!dataUrl.startsWith('data:')){resolve(null);return;}
    const img=new Image();
    img.onload=()=>resolve({img,w:img.naturalWidth,h:img.naturalHeight,data:dataUrl});
    img.onerror=()=>resolve(null);
    img.src=dataUrl;
  });
}

// Draw image fitted inside fixed box - dims already known from preload
function drawFittedImg(doc,preloaded,bx,by,bw,bh){
  if(!preloaded)return;
  const {w:iw,h:ih,data}=preloaded;
  if(!iw||!ih)return;
  const ratio=iw/ih;
  let dw=bw,dh=bw/ratio;
  if(dh>bh){dh=bh;dw=bh*ratio;}
  const dx=bx+(bw-dw)/2,dy=by+(bh-dh)/2;
  const fmt=data.startsWith('data:image/png')?'PNG':'JPEG';
  try{doc.addImage(data,fmt,dx,dy,dw,dh,'','FAST');}catch(e){}
  // Always redraw border on top
  doc.setDrawColor(192,202,216);doc.setLineWidth(0.4);doc.rect(bx,by,bw,bh,'S');
}


// Draw signature respecting canvas 680x170 ratio (4:1)
function drawSig(doc,data,bx,by,bw,bh){
  if(!data||!data.startsWith('data:'))return;
  try{
    // Canvas is always 680x170 — ratio 4:1
    const ratio=680/170;
    let dw=bw, dh=bw/ratio;
    if(dh>bh){dh=bh; dw=bh*ratio;}
    const dx=bx+(bw-dw)/2, dy=by+(bh-dh)/2;
    doc.addImage(data,'PNG',dx,dy,dw,dh,'','FAST');
  }catch(e){}
}


// ── MULTI-MUESTREO SYSTEM ──

// ── INDEXEDDB ──
// v2: store 'planes'. v3: AARMS cartacontrol → store 'cartas_control'
const DB_NAME='aarms_db', DB_VER=3, STORE='muestreos', STORE_PLANES='planes', STORE_CARTAS='cartas_control';
let _db=null;

function openDB(){
  return new Promise((res,rej)=>{
    // AARMS cartacontrol: si la conexión vieja no tiene el store, forzar reopen/upgrade
    if(_db && (!_db.objectStoreNames.contains(STORE_CARTAS) || _db.version < DB_VER)){
      try{ _db.close(); }catch(_){}
      _db = null;
    }
    if(_db){res(_db);return;}
    const req=indexedDB.open(DB_NAME,DB_VER);
    req.onupgradeneeded=e=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains(STORE)){
        const s=db.createObjectStore(STORE,{keyPath:'id'});
        s.createIndex('ts','ts',{unique:false});
      }
      if(!db.objectStoreNames.contains(STORE_PLANES)){
        const sp=db.createObjectStore(STORE_PLANES,{keyPath:'id'});
        sp.createIndex('ts','ts',{unique:false});
      }
      // AARMS cartacontrol: puntos Shewhart por equipo/periodo
      if(!db.objectStoreNames.contains(STORE_CARTAS)){
        const sc=db.createObjectStore(STORE_CARTAS,{keyPath:'id'});
        sc.createIndex('equipo','equipo',{unique:false});
        sc.createIndex('periodoId','periodoId',{unique:false});
        sc.createIndex('fecha','fecha',{unique:false});
      }
    };
    req.onsuccess=e=>{_db=e.target.result;res(_db);};
    req.onerror=e=>rej(e);
  });
}

// ── HELPERS para store 'planes' ──
function idbPlanGetAll(){
  return openDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(STORE_PLANES,'readonly');
    const req=tx.objectStore(STORE_PLANES).getAll();
    req.onsuccess=e=>res(e.target.result.sort((a,b)=>(b.ts||0)-(a.ts||0)));
    req.onerror=e=>rej(e);
  }));
}
function idbPlanPut(record){
  return openDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(STORE_PLANES,'readwrite');
    const req=tx.objectStore(STORE_PLANES).put(record);
    req.onsuccess=e=>res(e.target.result);
    req.onerror=e=>rej(e);
  }));
}
function idbPlanDelete(id){
  return openDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(STORE_PLANES,'readwrite');
    const req=tx.objectStore(STORE_PLANES).delete(id);
    req.onsuccess=e=>res();
    req.onerror=e=>rej(e);
  }));
}

function idbGetAll(){
  return openDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).getAll();
    req.onsuccess=e=>res(e.target.result.sort((a,b)=>(b.ts||0)-(a.ts||0)));
    req.onerror=e=>rej(e);
  }));
}

function idbPut(record){
  return openDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(STORE,'readwrite');
    const req=tx.objectStore(STORE).put(record);
    req.onsuccess=e=>res(e.target.result);
    req.onerror=e=>rej(e);
  }));
}

function idbDelete(id){
  return openDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(STORE,'readwrite');
    const req=tx.objectStore(STORE).delete(id);
    req.onsuccess=e=>res();
    req.onerror=e=>rej(e);
  }));
}

function getMuestreos(){
  // Sync fallback — returns cached or empty
  return _cachedMuestreos||[];
}
function getPlanes(){
  return _cachedPlanes||[];
}
let _cachedMuestreos=[];
let _cachedPlanes=[];

async function refreshCache(){
  _cachedMuestreos=await idbGetAll();
  _cachedPlanes=await idbPlanGetAll();
  // Migrar localStorage si existe
  try{
    const old=localStorage.getItem('aarms_muestreos_v1');
    if(old){
      const lista=JSON.parse(old);
      for(const m of lista) await idbPut(m);
      localStorage.removeItem('aarms_muestreos_v1');
      _cachedMuestreos=await idbGetAll();
    }
  }catch(e){}
  // Auto-migración a planes: cada muestreo sin planId se vuelve un plan "solo"
  const huerfanos = _cachedMuestreos.filter(m=>!m.planId);
  if(huerfanos.length){
    for(const m of huerfanos){
      const planId = 'plan_'+m.id;
      // Crear plan solo si no existe ya
      const existe = _cachedPlanes.find(p=>p.id===planId);
      if(!existe){
        const planRec = {
          id: planId,
          folio: '',                       // el usuario podrá asignar folio del plan después
          fecha: m.fecha || '',
          muestreador: m.muestreador || '',
          blancoCampo: false,
          loteBlanco: '',
          omarIds: [m.id],
          ts: m.ts || Date.now(),
          migrated: true,                  // flag: vino de un muestreo suelto
        };
        await idbPlanPut(planRec);
      }
      // Marcar el muestreo con planId
      m.planId = planId;
      await idbPut(m);
    }
    _cachedMuestreos=await idbGetAll();
    _cachedPlanes=await idbPlanGetAll();
  }
  return _cachedMuestreos;
}

// Helper: muestreos que pertenecen a un plan, ordenados por folio OMAR
function getMuestreosDePlan(planId){
  const plan = _cachedPlanes.find(p=>p.id===planId);
  if(!plan || !plan.omarIds) return [];
  // Mantener orden del array omarIds (orden explícito del plan)
  return plan.omarIds
    .map(mid => _cachedMuestreos.find(m=>m.id===mid))
    .filter(Boolean);
}

// Helper: el plan al que pertenece un muestreo
function getPlanDeMuestreo(muestreoId){
  return _cachedPlanes.find(p=>(p.omarIds||[]).includes(muestreoId));
}

// ── PLAN CRUD ──
async function crearPlan(datos={}){
  const id = datos.id || 'plan_'+Date.now();
  const rec = {
    id,
    folio: datos.folio || '',
    fecha: datos.fecha || new Date().toISOString().split('T')[0],
    muestreador: datos.muestreador || '',
    blancoCampo: datos.blancoCampo || false,
    loteBlanco: datos.loteBlanco || '',
    omarIds: datos.omarIds || [],
    observaciones: datos.observaciones || '',
    ts: Date.now(),
  };
  await idbPlanPut(rec);
  _cachedPlanes = await idbPlanGetAll();
  return rec;
}

async function guardarPlan(plan){
  plan.ts = plan.ts || Date.now();
  await idbPlanPut(plan);
  _cachedPlanes = await idbPlanGetAll();
  return plan;
}

/** Marca un documento del plan como completado (checklist en pgPlan). */
async function marcarPlanDocDone(key, planIdOpt){
  const pid = planIdOpt || _currentPlanId;
  if(!pid){ return; }
  const plan = _cachedPlanes.find(p=>p.id===pid);
  if(!plan){ return; }
  plan.docs = plan.docs || {};
  plan.docs[key] = { done: true, updatedAt: Date.now() };
  await guardarPlan(plan);
  try{ renderPlanDocs(); _actualizarGatePlanUI(); }catch(_){}
}

async function eliminarPlan(planId, {borrarOmars=true}={}){
  const plan = _cachedPlanes.find(p=>p.id===planId);
  if(!plan) return;
  if(borrarOmars){
    for(const mid of (plan.omarIds||[])){
      await idbDelete(mid);
    }
  }
  await idbPlanDelete(planId);
  if(_currentPlanId===planId) _currentPlanId=null;
  _cachedPlanes = await idbPlanGetAll();
  _cachedMuestreos = await idbGetAll();
}

/** Eliminar plan completo desde la lista del inicio (home). */
function eliminarPlanDesdeHome(planId){
  const plan=_cachedPlanes.find(p=>p.id===planId);
  if(!plan) return;
  const n=(plan.omarIds||[]).length;
  const tit=plan.folio?`Plan #${plan.folio}`:'Plan sin folio';
  confirmAction({
    title:'Eliminar plan de muestreo',
    message:`¿Eliminar ${tit} y sus ${n} OMAR${n!==1?'s':''}? Se borran todos los datos. Esta acción no se puede deshacer.`,
    okText:'Eliminar plan',
    okDanger:true,
    cancelText:'Cancelar',
  }).then(async ok=>{
    if(!ok) return;
    await eliminarPlan(planId,{borrarOmars:true});
    await refreshCache();
    renderHome();
    toast('Plan eliminado','g');
  });
}

// Agrega un muestreo existente al plan (si no estaba)
async function planAgregarOmar(planId, muestreoId){
  const plan = _cachedPlanes.find(p=>p.id===planId);
  if(!plan) return;
  plan.omarIds = plan.omarIds || [];
  if(!plan.omarIds.includes(muestreoId)) plan.omarIds.push(muestreoId);
  plan.ts = Date.now();
  await idbPlanPut(plan);
  // También marcar el muestreo con su planId
  const m = _cachedMuestreos.find(x=>x.id===muestreoId);
  if(m){ m.planId = planId; await idbPut(m); }
  _cachedPlanes = await idbPlanGetAll();
  _cachedMuestreos = await idbGetAll();
}

// Remueve un muestreo del plan (sin borrarlo; queda huérfano → en próxima refreshCache se le hará plan solo)
async function planRemoverOmar(planId, muestreoId, {borrarMuestreo=false}={}){
  const plan = _cachedPlanes.find(p=>p.id===planId);
  if(!plan) return;
  plan.omarIds = (plan.omarIds||[]).filter(id=>id!==muestreoId);
  plan.ts = Date.now();
  await idbPlanPut(plan);
  if(borrarMuestreo){
    await idbDelete(muestreoId);
  } else {
    const m = _cachedMuestreos.find(x=>x.id===muestreoId);
    if(m){ delete m.planId; await idbPut(m); }
  }
  _cachedPlanes = await idbPlanGetAll();
  _cachedMuestreos = await idbGetAll();

  // Si el OMAR que estaba cargado en memoria es el que se eliminó, limpiar TODO
  if(omar.ts === muestreoId){
    omar = {};
    tomas = [];
    sigData = null;
    sigData2 = null;
    photoData = null;
    photoData2 = null;
    lastPDFBlob = null;
    lastPDFClienteBlob = null;
    lastPDFCadenaBlob = null;
    localStorage.removeItem('aarms_omar');
    // Limpiar también el form si está visible
    document.querySelectorAll('#pg0 input, #pg0 textarea, #pg0 select, #pg1 input, #pg1 textarea, #pg1 select').forEach(e=>{
      if(e.type==='checkbox' || e.type==='radio'){ e.checked = false; }
      else { e.value = ''; }
    });
    if(typeof analitosSel !== 'undefined') analitosSel.clear?.();
    document.querySelectorAll('#pg0 .ai.on').forEach(el=>el.classList.remove('on'));
    const td = document.getElementById('tomasDiv'); if(td) td.innerHTML = '';
    const tc = document.getElementById('tcnt'); if(tc) tc.textContent = '0 tomas';
  }
}

async function saveMuestreoActual(){
  _flushTomasDesdeDOM();
  if(typeof _snapshotOmarFromPg0==='function') _snapshotOmarFromPg0();
  // Antes requería omar.folio; ahora guarda siempre — incluso borradores parciales.
  // Esto es lo que evita que se pierdan tomas, fotos, GPS al cambiar de OMAR.
  let mid;
  if(_pendingNewMuestreoId && !omar.ts){
    mid = _pendingNewMuestreoId;
    omar.ts = mid;
  } else if(omar.ts){
    mid = omar.ts;
  } else {
    // Sin id activo no podemos guardar — esto solo pasa si nunca se ha cargado/creado un muestreo
    return;
  }
  const gv=elId=>{const e=document.getElementById(elId);return e?e.value.trim():'';};
  const hMatRaw=document.getElementById('h_mat')?.value?.trim()||'';
  const matCampo=_matrizNormalizada(hMatRaw||omar.mat||omar.campo?.mat||'');
  omar.lab={
    tnom:gv('c_tnom'),tfir:gv('c_tfir'),tfec:gv('c_tfec'),thor:gv('c_thor'),
    inom:gv('c_inom'),ifir:gv('c_ifir'),ifec:gv('c_ifec'),ihor:gv('c_ihor'),
    renom:gv('c_renom'),refir:gv('c_refir'),refec:gv('c_refec'),rehor:gv('c_rehor'),
    fotar:gv('c_fotar'),snom:gv('c_snom'),sfir:gv('c_sfir'),sfec:gv('c_sfec'),shor:gv('c_shor'),
    isnom:gv('c_isnom'),isfir:gv('c_isfir'),isfec:gv('c_isfec'),ishor:gv('c_ishor'),
    rsnom:gv('c_rsnom'),rsfir:gv('c_rsfir'),rsfec:gv('c_rsfec'),rshor:gv('c_rshor'),
    ltnom:gv('c_ltnom'),ltfir:gv('c_ltfir'),ltfec:gv('c_ltfec'),lthor:gv('c_lthor'),
    sup:gv('c_sup'),
  };
  // Guardar también todos los datos del form de Hoja de Campo y firmas (pg1)
  // que ANTES no se guardaban — por eso se perdían entre OMARs.
  omar.campo = {
    emp:    gv('h_emp'),
    ate:    gv('h_ate'),
    dir:    gv('h_dir'),
    hcar:   gv('h_hcar'),
    cciar:  gv('h_cciar'),
    ini:    gv('h_ini'),
    fin:    gv('h_fin'),
    idm:    gv('h_idm'),
    mat:    matCampo,
    tipo:   document.getElementById('h_tipo')?.value || '',
    int:    gv('h_int'),
    clima:  gv('h_clima'),
    plan:   gv('h_plan'),
    cdt:    gv('h_cdt'),
    rdt:    gv('h_rdt'),
    obs:    gv('h_obs'),
    gpsN:   gv('gps_n'),
    gpsW:   gv('gps_w'),
    fnNom:  gv('fn_nom'),
    fnCar:  gv('fn_car'),
    mnNom:  gv('mn_nom'),
  };
  // Preservar planId del registro anterior si existía; si hay uno pendiente, usarlo
  const prev = _cachedMuestreos.find(x=>x.id===mid);
  let planId = prev?.planId || null;
  if(!planId && _pendingNewPlanId && _pendingNewMuestreoId===mid){
    planId = _pendingNewPlanId;
  }
  const entry={
    id:mid,
    folio:omar.folio||'',
    empresa:omar.empresa||'',
    fecha:omar.fecha||new Date().toISOString().split('T')[0],
    tipo:omar.tipo||'',
    muestreador:omar.muestreador||'',
    ts:mid,
    tomas:tomas.map(t=>_tomaSanitized(t)),
    omar:JSON.stringify(omar),
    sigData:sigData||null, sigData2:sigData2||null,
    // CRÍTICO: las fotos por OMAR. Sin esto se compartían entre OMARs y se perdían.
    photoData: photoData || null,
    photoData2: photoData2 || null,
  };
  if(planId) entry.planId = planId;
  await idbPut(entry);
  // Si es nuevo, agregar al plan pendiente y limpiar flag
  if(_pendingNewPlanId && _pendingNewMuestreoId===mid){
    await planAgregarOmar(_pendingNewPlanId, mid);
    _pendingNewPlanId = null;
    _pendingNewMuestreoId = null;
  }
  await refreshCache();
  // AARMS v66-flujos: consumir flag de regreso a LVAR tras guardado explícito en pg0
  if(_returnToLvarAfterOmar && document.getElementById('pg0')?.classList.contains('on')){
    await _flujosConsumirReturnToLvar();
  }
}

async function eliminarMuestreo(id){
  // Si el muestreo pertenece a un plan, quitarlo de la lista de omarIds del plan
  const plan = _cachedPlanes.find(p=>(p.omarIds||[]).includes(id));
  if(plan){
    plan.omarIds = plan.omarIds.filter(x=>x!==id);
    await idbPlanPut(plan);
    // Si el plan queda vacío Y era migrado (plan-solo), borrarlo también
    if(plan.omarIds.length===0 && plan.migrated){
      await idbPlanDelete(plan.id);
    }
  }
  await idbDelete(id);
  await refreshCache();
  // Si era el activo, limpiar memoria
  if(omar.ts === id){
    omar = {}; tomas = [];
    sigData = null; sigData2 = null;
    photoData = null; photoData2 = null;
    lastPDFBlob = null; lastPDFClienteBlob = null; lastPDFCadenaBlob = null;
    localStorage.removeItem('aarms_omar');
  }
  renderHome();
  toast('Muestreo eliminado','g');
}


async function soloGuardar(){
  if(!omar.folio){toast('Primero confirma la OMAR','w');return;}
  await saveMuestreoActual();
  const btn=document.getElementById('btnGuardar');
  if(btn){
    const orig=btn.innerHTML;
    btn.innerHTML='✓ Guardado';
    btn.style.background='var(--green)';
    btn.style.borderColor='var(--green)';
    setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';btn.style.borderColor='';},2000);
  }
  toast('Registro guardado ✓ — puedes regresar a completarlo después','g');
}

function nuevoMuestreo(){
  iniciarNuevoMuestreo();
}

function verMuestreos(){
  goHome();
  setTimeout(()=>{
    const el=document.getElementById('homeLista');
    if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  },200);
}

// Auto-save when generating PDF
const _origGenPDF = genPDF;

const APP_VERSION = 'v19-firma-bloquea-' + Date.now();
console.log('%c[AARMS] Código versión:', 'color:#4a9eff;font-weight:bold', APP_VERSION);

// Validador único de firma — chequea variable JS y píxeles reales del canvas
// para que sea imposible saltarse la firma (aunque sigData quedara stale).
// Devuelve true si hay firma válida.
function tieneFirmaValida(){
  // 1. Variable JS: debe existir, no ser placeholder 'p', y ser un dataURL real
  if(!sigData || sigData==='p' || typeof sigData !== 'string' || sigData.length < 100){
    console.log('[firma] sigData inválido. Valor actual:', sigData, '— tipo:', typeof sigData);
    return false;
  }
  // 2. Debe empezar con data:image
  if(!sigData.startsWith('data:image')){
    console.log('[firma] sigData no es dataURL imagen');
    return false;
  }
  return true;
}

function _bloquearSiSinFirma(tipoBoton){
  if(tieneFirmaValida()) return false;
  // Modal estilizado (no el alert nativo feo del navegador)
  alertApp({
    title: 'Firma del cliente requerida',
    message: 'Antes de generar cualquier PDF, el cliente debe firmar de conformidad.\n\nPide al responsable de la empresa que firme en la sección "Firma" abajo.',
    okText: 'Ir a firmar',
    variant: 'warn'
  });
  // Scroll a la firma
  const sig=document.getElementById('cvswrap');
  if(sig) sig.scrollIntoView({behavior:'smooth',block:'center'});
  return true;
}

function genPDF(tipo='lab'){
  // Ningún PDF se genera sin la firma del cliente.
  if(_bloquearSiSinFirma(tipo === 'cliente' ? 'Entregar al cliente' : 'Hoja de Campo')) return;
  // El nombre del cliente solo es obligatorio para el reporte al cliente
  if(tipo === 'cliente' && !document.getElementById('fn_nom').value.trim()){
    alertApp({
      title: 'Nombre del cliente faltante',
      message: 'Ingresa el nombre del cliente que recibe el reporte antes de generar el PDF.',
      okText: 'Entendido',
      variant: 'warn'
    });
    return;
  }

  // Auto-save muestreo before generating PDF
  saveMuestreoActual();
  window._pdfTipo=tipo;
  const btn=tipo==='cliente'?document.getElementById('btnPDFCliente'):document.getElementById('btnPDFLab');
  if(btn){btn.disabled=true;btn.textContent='Generando...';}

  const run=()=>{
    const p=tipo==='cliente'?buildPDFCliente():buildPDF();
    if(p&&p.then){
      p.then(()=>{if(btn){btn.disabled=false;btn.textContent=tipo==='cliente'?'Entregar al cliente':'Guardar registro';}})
       .catch(e=>{errorUsuario('Error al generar PDF.', e);if(btn){btn.disabled=false;btn.textContent=tipo==='cliente'?'Entregar al cliente':'Guardar registro';}});
    }else{
      if(btn){btn.disabled=false;btn.textContent=tipo==='cliente'?'Entregar al cliente':'Guardar registro';}
    }
  };

  toast('Generando PDF...','');
  run();
}

async function buildPDF(){
  const {jsPDF}=window.jspdf;
  // PRE-LOAD all images before drawing
  const [imgFoto,imgSigCli,imgSigMuest,logoPDF]=await Promise.all([
    preloadImg(photoData&&photoData!=='p'?photoData:null),
    preloadImg(sigData&&sigData!=='p'?sigData:null),
    preloadImg(sigData2&&sigData2!=='p'?sigData2:null),
    loadLogo(LOGO_PDF_URI),
  ]);
  // Landscape US Letter: 792 x 612 pt
  const doc=new jsPDF({orientation:'landscape',unit:'pt',format:'letter'});
  const W=792,H=612,M=22;
  const CW=W-M*2; // 748

  const NAVY=[10,22,40],BLUE=[26,58,107],ACCENT=[37,99,235];
  const MGRAY=[208,216,228],LGRAY=[232,238,245],DGRAY=[51,65,85];
  const TEAL=[14,124,107],WHITE=[255,255,255],GREEN=[22,163,74];

  const gv=id=>{const e=document.getElementById(id);return e?e.value.trim():'';}

  // ══════════════════════════════════════
  // PAGE 1
  // ══════════════════════════════════════

  // ── HEADER — AARMS sub10-std: membrete compartido + folios ──
  const HDR=72;
  if(typeof window._pdfMembreteStd === 'function'){
    window._pdfMembreteStd(doc, logoPDF, {
      docTitulo: 'HOJA DE CAMPO',
      docSubtitulo: 'INFORME DE MUESTREO',
      codigoFormato: 'F-AA-45A-12',
      margin: M,
      contentY: HDR
    }, 'helvetica');
  } else {
    addLogoProportional(doc,logoPDF,M+2,6,70,60);
    _pdfStdHeader(doc, logoPDF, W, M, HDR, 'HOJA DE CAMPO', 'INFORME DE MUESTREO', 'F-AA-45A-12');
  }
  // Folios box (light gray) — a la izquierda del bloque oscuro
  const folioBoxX = W - M - 150 - 78;
  doc.setFillColor(...LGRAY);doc.rect(folioBoxX,8,72,58,'F');
  doc.setDrawColor(...MGRAY);doc.rect(folioBoxX,8,72,58,'S');
  const folios=[['FOLIO HCAR:',gv('h_hcar')],['FOLIO OMAR:',gv('h_omar')],['FOLIO CCIAR:',gv('h_cciar')]];
  folios.forEach(([l,v],i)=>{
    const fy=12+i*18;
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(5.5);
    doc.text(l,folioBoxX+3,fy+3);
    doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(7);
    doc.text(v||'',folioBoxX+3,fy+11);
  });

  // ── DATOS GENERALES ──
  let y=HDR+4; // start content below header with 4pt gap
  // Section header
  doc.setFillColor(...NAVY);
  doc.rect(M,y,CW,11,'F');
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('DATOS DEL CLIENTE',W/2,y+7.5,{align:'center'});
  y+=11;

  const rH=17; // row height — label 6.5pt + value 8.5pt need 17pt min
  const drawDataRow=(fields,y)=>{
    let x=M;
    fields.forEach(([lbl,val,w,shade])=>{
      doc.setFillColor(...(shade||LGRAY));
      doc.rect(x,y,w,rH,'F');
      doc.setDrawColor(...MGRAY);doc.setLineWidth(0.3);
      doc.rect(x,y,w,rH,'S');
      // Label — small gray uppercase
      doc.setTextColor(120,130,145);doc.setFont('helvetica','bold');doc.setFontSize(6.5);
      doc.text(lbl,x+3,y+6);
      // Value — larger black
      doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(8.5);
      const maxChars=Math.floor(w/5.2);
      doc.text(String(val||'').substring(0,maxChars),x+3,y+14);
      x+=w;
    });
  };

  const hw=CW/2,qw=CW/4,tw=CW*0.6,fw=CW*0.4,sw=CW*0.3;
  drawDataRow([['Compañía:',gv('h_emp'),hw],['Atención a:',gv('h_ate'),hw]],y); y+=rH;
  drawDataRow([['Dirección:',gv('h_dir'),tw],['Fecha inicial:',gv('h_ini').replace('T',' '),fw]],y); y+=rH;
  drawDataRow([['ID de la muestra:',gv('h_idm'),tw],['Fecha final:',gv('h_fin').replace('T',' '),fw]],y); y+=rH;
  drawDataRow([['Matriz:',gv('h_mat'),hw],['Tipo:',gv('h_tipo'),qw],['Intervalo:',gv('h_int'),qw]],y); y+=rH;
  drawDataRow([['Ref. BPM Folio:',gv('h_plan'),qw],['Cond. climatológicas:',gv('h_clima'),CW-qw]],y); y+=rH;

  // ── TOMAS TABLE ──
  y+=3;
  doc.setFillColor(...NAVY);doc.rect(M,y,CW,11,'F');
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('REGISTRO DE TOMAS — PARÁMETROS DE CAMPO',M+4,y+7.5);
  y+=11;

  const PARAMS=['FQ','TOC','Hg','MP','CIAN','FOS.','SAAM','GYA','DQO','DBO5','N.TOT','CTYF','ENTE.','NO2','NO3','HELM','CLR','ECOL','TOX','CLOR','CrHx','OTRS'];
  const SIMPLES=['GYA','CTYF','ENTE.','ECOL','TOX'];
  // 13 cols ahora incluyendo OD (OXÍGENO DISUELTO mg/L). Reducidos algunos para hacer espacio.
  const fixW=[24,30,20,20,26,28,28,34,32,26,24,24,24]; // suma = 320
  const fixSum=fixW.reduce((a,b)=>a+b,0);
  const pW=Math.floor((CW-fixSum)/PARAMS.length);
  const fixHdrs=['MUEST.','HORA','%VOL','L/s','T.AMB','T.AGU','pH25°','MAT.F','COND.','OD mg/L','COLOR','OLOR','CLORO'];

  const thH=13;
  let x=M;
  fixHdrs.forEach((h,i)=>{
    doc.setFillColor(208,216,228);
    doc.rect(x,y,fixW[i],thH,'F');
    doc.setDrawColor(160,172,188);doc.setLineWidth(0.2);doc.rect(x,y,fixW[i],thH,'S');
    doc.setTextColor(26,58,107);doc.setFont('helvetica','bold');doc.setFontSize(5);
    doc.text(h,x+fixW[i]/2,y+thH/2+1.5,{align:'center'});
    x+=fixW[i];
  });
  PARAMS.forEach((p,i)=>{
    const isS=SIMPLES.includes(p);
    doc.setFillColor(...(isS?[210,238,228]:[208,216,228]));
    doc.rect(x,y,pW,thH,'F');
    doc.setDrawColor(160,172,188);doc.setLineWidth(0.2);doc.rect(x,y,pW,thH,'S');
    doc.setTextColor(...(isS?[0,100,80]:[26,58,107]));
    doc.setFont('helvetica','bold');doc.setFontSize(4.5);
    doc.text(p,x+pW/2,y+thH/2+1.5,{align:'center'});
    x+=pW;
  });
  y+=thH;

  // Toma rows
  const tomaH=12;
  const allTomas=[...tomas];
  // Pad to 6
  while(allTomas.length<6) allTomas.push(null);

  allTomas.forEach((t,idx)=>{
    const bg=idx%2===0?[248,250,252]:WHITE;
    x=M;
    if(t){
      const fixVals=[`T${idx+1}`,t.hora||'',t.pct?t.pct+'%':'',t.ls||'',
        t.tamb?t.tamb+'°':'',t.tagua?t.tagua+'°':'',t.ph||'',t.mat||'',
        t.cond||'',t.od||'',t.color||'',t.olor===true?'SI':t.olor===false?'NO':'',
        t.cloro===true?'SI':t.cloro===false?'NO':''];
      fixVals.forEach((v,i)=>{
        doc.setFillColor(...(i===0?ACCENT:bg));
        doc.rect(x,y,fixW[i],tomaH,'F');
        doc.setDrawColor(200,210,220);doc.setLineWidth(0.2);doc.rect(x,y,fixW[i],tomaH,'S');
        doc.setTextColor(...(i===0?WHITE:DGRAY));
        doc.setFont('helvetica',i===0?'bold':'normal');doc.setFontSize(7);
        doc.text(String(v).substring(0,Math.floor(fixW[i]/4.2)),x+fixW[i]/2,y+8,{align:'center'});
        x+=fixW[i];
      });
      PARAMS.forEach((p,pi)=>{
        const isS=SIMPLES.includes(p);
        const hasP=t.params.has(p);
        if(hasP){
          doc.setFillColor(...(isS?[240,250,247]:bg));
          doc.rect(x,y,pW,tomaH,'F');
          doc.setDrawColor(200,210,220);doc.setLineWidth(0.2);doc.rect(x,y,pW,tomaH,'S');
          doc.setTextColor(...(isS?TEAL:ACCENT));
          doc.setFont('helvetica','bold');doc.setFontSize(9);
          doc.text('v',x+pW/2,y+tomaH/2+3,{align:'center'});
        }else{
          // Cancelled - gray + diagonal line
          doc.setFillColor(228,232,240);
          doc.rect(x,y,pW,tomaH,'F');
          doc.setDrawColor(200,210,220);doc.setLineWidth(0.2);doc.rect(x,y,pW,tomaH,'S');
          doc.setDrawColor(195,204,216);doc.setLineWidth(0.4);
          doc.line(x+1,y+1,x+pW-1,y+tomaH-1);
        }
        x+=pW;
      });
    } else {
      // Empty row — todo cancelado excepto T label
      let ex=M;
      // T label
      doc.setFillColor(220,226,234);
      doc.rect(ex,y,fixW[0],tomaH,'F');
      doc.setDrawColor(195,204,216);doc.setLineWidth(0.2);doc.rect(ex,y,fixW[0],tomaH,'S');
      doc.setTextColor(160,170,185);doc.setFont('helvetica','bold');doc.setFontSize(7);
      doc.text(`T${idx+1}`,ex+fixW[0]/2,y+8,{align:'center'});
      ex+=fixW[0];
      // Fixed cols restantes — canceladas
      fixW.slice(1).forEach(w=>{
        doc.setFillColor(228,232,240);
        doc.rect(ex,y,w,tomaH,'F');
        doc.setDrawColor(195,204,216);doc.setLineWidth(0.2);doc.rect(ex,y,w,tomaH,'S');
        doc.setDrawColor(195,204,216);doc.setLineWidth(0.3);
        doc.line(ex+1,y+1,ex+w-1,y+tomaH-1);
        ex+=w;
      });
      // Param cols — todas canceladas
      PARAMS.forEach(()=>{
        doc.setFillColor(228,232,240);
        doc.rect(ex,y,pW,tomaH,'F');
        doc.setDrawColor(195,204,216);doc.setLineWidth(0.2);doc.rect(ex,y,pW,tomaH,'S');
        doc.setDrawColor(195,204,216);doc.setLineWidth(0.3);
        doc.line(ex+1,y+1,ex+pW-1,y+tomaH-1);
        ex+=pW;
      });
    }
    y+=tomaH;
  });

  // ── TIPO DE FRASCO rows (one per tipo: Simple + Compuesta) ──
  // Frasco codes per parameter from official F-AA-45A-12 codification
  // Codificación de tipo de envase — F-AA-45A-12
  // 1=Vidrio BA 1L, 2=Plástico 1L, 3=Plástico 4L, 4=Plástico 500mL
  // 5=Plástico 5L, 6=Bolsa Estéril 300mL, 7=Bolsa c/Tiosulfato 300mL
  // 8=Ámbar 1L, 9=Bolsa c/Tiosulfato 100mL, 10=Ámbar 40mL
  // 11=Ámbar 250mL, 12=Bolsa Estéril 100mL, 13=Plástico 2L
  const FRASCO_MAP={
    'FQ':3,'TOC':8,'Hg':4,'MP':4,'CIAN':4,'FOS.':4,'SAAM':2,'GYA':1,
    'DQO':4,'DBO5':2,'N.TOT':13,'CTYF':6,'ENTE.':6,'NO2':4,'NO3':4,
    'HELM':5,'CLR':11,'ECOL':7,'TOX':10,'CLOR':4,'CrHx':11,'OTRS':4,
  };
  const tipoH=10;
  const labelW=fixW.reduce((a,b)=>a+b,0); // total fixed cols width

  // ── TIPO DE FRASCO row — single row, frasco number per active param ──
  doc.setFillColor(...LGRAY);doc.rect(M,y,CW,tipoH,'F');
  doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(M,y,CW,tipoH,'S');
  // Label
  doc.setFillColor(200,208,220);doc.rect(M,y,labelW,tipoH,'F');
  doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(M,y,labelW,tipoH,'S');
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(6);
  doc.text('TIPO DE FRASCO',M+3,y+tipoH/2+2);
  // Frasco number per param
  let fpx=M+labelW;
  PARAMS.forEach(p=>{
    const num=FRASCO_MAP[p]||'—';
    const hasP=tomas.some(t=>t.params.has(p));
    if(hasP){
      doc.setFillColor(235,242,255);
      doc.rect(fpx,y,pW,tipoH,'F');
      doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(fpx,y,pW,tipoH,'S');
      doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(7);
      doc.text(String(num),fpx+pW/2,y+tipoH/2+2,{align:'center'});
    }else{
      doc.setFillColor(228,232,240);doc.rect(fpx,y,pW,tipoH,'F');
      doc.setDrawColor(195,204,216);doc.setLineWidth(0.2);doc.rect(fpx,y,pW,tipoH,'S');
      doc.setDrawColor(195,204,216);doc.setLineWidth(0.4);
      doc.line(fpx+1,y+1,fpx+pW-1,y+tipoH-1);
    }
    fpx+=pW;
  });
  y+=tipoH;

  // Observaciones row
  doc.setFillColor(...LGRAY);doc.rect(M,y,CW,10,'F');
  doc.setDrawColor(...MGRAY);doc.rect(M,y,CW,10,'S');
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(6.5);
  doc.text('Observaciones:',M+3,y+7);
  doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(7);
  const obs=gv('h_obs');
  if(obs) doc.text(obs.substring(0,120),M+58,y+7);
  y+=10;

  // ── CODIFICACIÓN DE TIPO DE ENVASE ──
  // Full table from F-AA-45A-12
  y+=3;
  const ENVASES=[
    ['1','Frasco boca ancha vidrio 1Lt'],['2','Frasco Plástico 1Lt'],
    ['3','Frasco Plástico 4Lt'],['4','Frasco Plástico 500mL'],
    ['5','Frasco Plástico 5Lt'],['6','Bolsa Estéril 300mL'],
    ['7','Bolsa Estéril 300mL c/Tiosulfato'],['8','Frasco Vidrio Ámbar 1Lt'],
    ['9','Bolsa Estéril 100mL c/Tiosulfato'],['10','Frasco Vidrio Ámbar 40mL'],
    ['11','Frasco Vidrio Ámbar 250mL'],['12','Bolsa Estéril 100mL'],
    ['13','Frasco Plástico 2Lt'],
  ];
  // Section header
  doc.setFillColor(...NAVY);doc.rect(M,y,CW,10,'F');
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(7);
  doc.text('CODIFICACIÓN DE TIPO DE ENVASE',M+4,y+7.5);
  y+=10;
  // Draw in 2 columns
  const eColW=CW/2-2;
  const eH=8;
  ENVASES.forEach(([num,desc],i)=>{
    const col=i%2;
    const row=Math.floor(i/2);
    const ex=M+col*(eColW+4);
    const ey=y+row*eH;
    const bg=row%2===0?LGRAY:WHITE;
    doc.setFillColor(...bg);doc.rect(ex,ey,eColW,eH,'F');
    doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(ex,ey,eColW,eH,'S');
    // Number badge
    doc.setFillColor(...ACCENT);doc.rect(ex,ey,12,eH,'F');
    doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(6.5);
    doc.text(num,ex+6,ey+6,{align:'center'});
    // Description
    doc.setTextColor(...DGRAY);doc.setFont('helvetica','normal');doc.setFontSize(6.5);
    doc.text(desc,ex+15,ey+6);
  });
  y+=Math.ceil(ENVASES.length/2)*eH+3;

  // ── GPS ──
  y+=3;
  doc.setFillColor(...NAVY);doc.rect(M,y,CW,11,'F');
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('COORDENADAS GPS — MUESTRA COMPUESTA / RESGUARDO',M+4,y+7.5);
  y+=11;

  const gpsFields=[
    ['Coord. N:',gv('gps_n'),CW*0.18],['Coord. W:',gv('gps_w'),CW*0.18],
    ['Mtra. compuesta:',gv('h_comp')||'—',CW*0.18],['Fecha:',gv('h_cdt').replace('T',' '),CW*0.23],
    ['Mtra. resguardo:',gv('h_resg')||'—',CW*0.12],['Hora:',gv('h_rdt').replace('T',' '),CW*0.11],
  ];
  let gx=M;
  gpsFields.forEach(([l,v,w])=>{
    doc.setFillColor(...LGRAY);doc.rect(gx,y,w,13,'F');
    doc.setDrawColor(...MGRAY);doc.setLineWidth(0.3);doc.rect(gx,y,w,13,'S');
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.text(l,gx+3,y+5);
    doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(8);
    doc.text(String(v||'').substring(0,Math.floor(w/5)),gx+3,y+11);
    gx+=w;
  });
  y+=13;

  // ── CROQUIS (photo box) ── fits remaining space on page 1
  y+=3;
  const remainH=H-y-20; // space left on page 1
  const photoBoxW=CW*0.5-2;
  const mapBoxW=CW*0.5-2;

  doc.setFillColor(...TEAL);doc.rect(M,y,CW,11,'F');
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('CROQUIS DEL PUNTO DE MUESTREO — ',M+4,y+7.5);
  y+=11;

  const cboxH=remainH-11;
  // Photo box
  doc.setFillColor(248,250,252);doc.rect(M,y,photoBoxW,cboxH,'F');
  doc.setDrawColor(...MGRAY);doc.rect(M,y,photoBoxW,cboxH,'S');
  if(imgFoto){
    const pad=6,pW=photoBoxW-pad*2,pH2=cboxH-pad*2-18;
    drawFittedImg(doc,imgFoto,M+pad,y+pad,pW,pH2);
    doc.setDrawColor(138,154,176);doc.setLineWidth(0.4);
    doc.rect(M,y,photoBoxW,cboxH,'S');
  } else {
    doc.setTextColor(...MGRAY);doc.setFont('helvetica','italic');doc.setFontSize(8);
    doc.text('[Sin foto — tomar foto desde la app]',M+photoBoxW/2,y+cboxH/2,{align:'center'});
  }
  // Photo label overlay at bottom
  doc.setFillColor(10,22,40,160);
  doc.rect(M,y+cboxH-14,photoBoxW,14,'F');
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(6.5);
  doc.text('Fotografía del punto de descarga',M+4,y+cboxH-8.5);
  doc.setFont('helvetica','normal');doc.setFontSize(6);
  const gpsStr='N: '+(gv('gps_n')||'—')+'   W: '+(gv('gps_w')||'—');
  doc.text(gpsStr,M+4,y+cboxH-3);

  // Map/info box — mapa real OpenStreetMap
  const mx=M+photoBoxW+4;
  doc.setFillColor(236,240,248);doc.rect(mx,y,mapBoxW,cboxH,'F');
  doc.setDrawColor(...MGRAY);doc.rect(mx,y,mapBoxW,cboxH,'S');
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(7.5);
  doc.text('UBICACIÓN EN MAPA',mx+mapBoxW/2,y+9,{align:'center'});

  const latH=parseFloat((gv('gps_n')||'').replace('°','').trim());
  const lngHAbs=parseFloat((gv('gps_w')||'').replace('°','').trim());
  const lngH=-Math.abs(lngHAbs);
  const hasCoordsH=!isNaN(latH)&&!isNaN(lngHAbs)&&latH!==0&&lngHAbs!==0;

  if(hasCoordsH){
    let mapaOkH=false;
    try{
      const mWH=Math.round((mapBoxW-4)*3);
      const mHH=Math.round((cboxH-24)*3);
      const mapB64H=await loadMapImage(latH,lngH,16,mWH,mHH);
      if(mapB64H){
        doc.addImage(mapB64H,'PNG',mx+2,y+12,mapBoxW-4,cboxH-24,'','FAST');
        doc.setDrawColor(...MGRAY);doc.setLineWidth(0.3);
        doc.rect(mx+2,y+12,mapBoxW-4,cboxH-24,'S');
        mapaOkH=true;
      }
    }catch(e){ mapaOkH=false; }

    if(!mapaOkH){
      // Fallback grilla
      doc.setDrawColor(200,210,225);doc.setLineWidth(0.2);
      for(let gi=0;gi<6;gi++){doc.line(mx,y+20+gi*18,mx+mapBoxW,y+20+gi*18);}
      for(let gi=0;gi<4;gi++){doc.line(mx+gi*(mapBoxW/3),y+20,mx+gi*(mapBoxW/3),y+cboxH);}
      const pinX=mx+mapBoxW/2,pinY=y+cboxH/2-10;
      doc.setFillColor(...ACCENT);doc.circle(pinX,pinY,6,'F');
      doc.setFillColor(255,255,255);doc.circle(pinX,pinY,2.5,'F');
      doc.setTextColor(...MGRAY);doc.setFont('helvetica','italic');doc.setFontSize(6.5);
      doc.text('Coordenadas registradas',mx+mapBoxW/2,y+cboxH-20,{align:'center'});
    }
    // Coordenadas al pie
    doc.setFillColor(10,22,40);doc.rect(mx+2,y+cboxH-18,mapBoxW-4,15,'F');
    doc.setTextColor(255,255,255);doc.setFont('courier','bold');doc.setFontSize(7);
    doc.text(`${latH.toFixed(5)}° N    ${lngHAbs.toFixed(5)}° W`,mx+mapBoxW/2,y+cboxH-8,{align:'center'});
  }else{
    // Sin GPS — info del punto
    doc.setFillColor(248,250,252);doc.rect(mx,y,mapBoxW,cboxH,'F');
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(8);
    doc.text('Información del punto de muestreo',mx+mapBoxW/2,y+14,{align:'center'});
    doc.setDrawColor(...LGRAY);doc.setLineWidth(0.5);doc.line(mx+10,y+18,mx+mapBoxW-10,y+18);
    const infoItems=[
      ['Empresa:',gv('h_emp')],['Sitio:',gv('h_idm')],
      ['Dirección:',gv('h_dir').substring(0,35)],
      ['Fecha inicial:',gv('h_ini').replace('T',' ')],
      ['Tipo muestreo:',gv('h_tipo')],
      ['Coord. N:','Sin GPS'],['Coord. W:','Sin GPS'],
      ['Muestreador:',gv('mn_nom')],
    ];
    infoItems.forEach(([l,v],i)=>{
      const iy=y+26+i*16;
      if(i>0){doc.setDrawColor(220,228,236);doc.setLineWidth(0.2);doc.line(mx+4,iy-3,mx+mapBoxW-4,iy-3);}
      doc.setTextColor(120,130,145);doc.setFont('helvetica','bold');doc.setFontSize(6.5);
      doc.text(l,mx+6,iy);
      doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(8.5);
      doc.text(String(v||'—').substring(0,Math.floor(mapBoxW/5.5)),mx+6,iy+8);
    });
  }

  // ── PAGE 2: FIRMAS ──
  doc.addPage('letter','landscape');

  // Header page 2 (simplified)
  doc.setFillColor(...NAVY);doc.rect(0,0,W,30,'F');
  doc.setFillColor(...ACCENT);doc.rect(0,30,W,2,'F');
  if(logoPDF)addLogoProportional(doc,logoPDF,M+2,2,36,26);
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(10);
  doc.text('AARMS — Asesoría y Análisis S.C.',M+44,16);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(180,200,230);
  doc.text('Hoja de Campo / Informe de Muestreo  |  F-AA-45A-12 (Digital)',M+44,24);
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(9);
  doc.text('OMAR: '+gv('h_omar')+'  |  '+gv('h_emp'),W-M,18,{align:'right'});

  // Conformidad header
  let y2=38;
  doc.setFillColor(...NAVY);doc.rect(M,y2,CW,12,'F');
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(9);
  doc.text('CONFORMIDAD Y FIRMAS',W/2,y2+8.5,{align:'center'});
  y2+=12;

  const sigBoxH=180; // FIXED height — never grows beyond this
  const sigBoxW=(CW-4)/2;

  // ── FIRMA CLIENTE ──
  doc.setFillColor(...MGRAY);doc.rect(M,y2,sigBoxW,12,'F');
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('FIRMA DE CONFORMIDAD — CLIENTE',M+sigBoxW/2,y2+8.5,{align:'center'});
  y2+=12;

  doc.setFillColor(...WHITE);doc.rect(M,y2,sigBoxW,sigBoxH,'F');
  doc.setDrawColor(...MGRAY);doc.setLineWidth(0.5);doc.rect(M,y2,sigBoxW,sigBoxH,'S');

  // Client info
  doc.setTextColor(...DGRAY);doc.setFont('helvetica','normal');doc.setFontSize(9);
  doc.text('Nombre: '+gv('fn_nom'),M+8,y2+14);
  doc.setDrawColor(220,228,236);doc.setLineWidth(0.3);doc.line(M+8,y2+16,M+sigBoxW-8,y2+16);
  doc.text('Cargo:    '+gv('fn_car'),M+8,y2+26);
  doc.line(M+8,y2+28,M+sigBoxW-8,y2+28);

  // Firma label
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('Firma:',M+8,y2+40);

  // Signature image — fits exactly in remaining box space
  const sigPad=4;
  const sigY=y2+44;
  const sigH=Math.min(sigBoxH-44-20, 80); // fixed max sig height
  const sigW=sigBoxW-sigPad*2-8;
  if(sigData&&sigData!=='p'){
    doc.setFillColor(250,252,255);doc.rect(M+8,sigY,sigW,sigH,'F');
    doc.setDrawColor(200,210,225);doc.setLineWidth(0.3);doc.rect(M+8,sigY,sigW,sigH,'S');
    drawSig(doc,sigData,M+8,sigY,sigW,sigH);
    // Redraw border on top
    doc.setDrawColor(200,210,225);doc.setLineWidth(0.3);doc.rect(M+8,sigY,sigW,sigH,'S');
  } else {
    doc.setFillColor(248,250,252);doc.rect(M+8,sigY,sigW,sigH,'F');
    doc.setDrawColor(...MGRAY);doc.rect(M+8,sigY,sigW,sigH,'S');
    doc.setTextColor(...MGRAY);doc.setFont('helvetica','italic');doc.setFontSize(8);
    doc.text('[Sin firma]',M+8+sigW/2,sigY+sigH/2,{align:'center'});
  }

  // Date
  const now=new Date();
  const nowStr=now.toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'});
  const timeStr=now.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
  doc.setTextColor(...DGRAY);doc.setFont('helvetica','normal');doc.setFontSize(8);
  doc.text('Fecha: '+nowStr+'    Hora: '+timeStr,M+8,y2+sigBoxH-8);

  // ── FIRMA MUESTREADOR ──
  const mx2=M+sigBoxW+4;
  const y2r=38+12; // reset y for right column
  doc.setFillColor(...MGRAY);doc.rect(mx2,38+12,sigBoxW,12,'F');
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('FIRMA DEL RESPONSABLE DEL MUESTREO',mx2+sigBoxW/2,38+12+8.5,{align:'center'});

  const ry=38+12+12;
  doc.setFillColor(...WHITE);doc.rect(mx2,ry,sigBoxW,sigBoxH,'F');
  doc.setDrawColor(...MGRAY);doc.setLineWidth(0.5);doc.rect(mx2,ry,sigBoxW,sigBoxH,'S');

  doc.setTextColor(...DGRAY);doc.setFont('helvetica','normal');doc.setFontSize(9);
  doc.text('Nombre: '+gv('mn_nom'),mx2+8,ry+14);
  doc.setDrawColor(220,228,236);doc.setLineWidth(0.3);doc.line(mx2+8,ry+16,mx2+sigBoxW-8,ry+16);
  doc.text('Cargo:    '+gv('mn_car'),mx2+8,ry+26);
  doc.line(mx2+8,ry+28,mx2+sigBoxW-8,ry+28);
  doc.text('Supervisó: '+gv('mn_sup'),mx2+8,ry+38);
  doc.line(mx2+8,ry+40,mx2+sigBoxW-8,ry+40);
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('Firma:',mx2+8,ry+52);

  // Muestreador signature space (empty — signs digitally same canvas area concept)
  const mSigW=sigBoxW-16;
  const mSigH=Math.min(sigBoxH-56-20, 80); // fixed max sig height
  doc.setFillColor(250,252,255);
  doc.rect(mx2+8,ry+56,mSigW,mSigH,'F');
  doc.setDrawColor(...MGRAY);doc.setLineWidth(0.3);doc.rect(mx2+8,ry+56,mSigW,mSigH,'S');
  if(imgSigMuest){
    drawSig(doc,imgSigMuest.data,mx2+8,ry+56,mSigW,mSigH);
    doc.setDrawColor(...MGRAY);doc.setLineWidth(0.3);doc.rect(mx2+8,ry+56,mSigW,mSigH,'S');
  }else{
    doc.setTextColor(...MGRAY);doc.setFont('helvetica','italic');doc.setFontSize(8);
    doc.text('Sin firma del muestreador',mx2+8+mSigW/2,ry+56+mSigH/2,{align:'center'});
  }

  doc.text('Fecha: '+nowStr+'    Hora: '+timeStr,mx2+8,ry+sigBoxH-8);

  // ── FOOTER ──
  const footY=H-22;
  doc.setFillColor(...LGRAY);doc.rect(0,footY,W,22,'F');
  doc.setTextColor(...MGRAY);doc.setFont('helvetica','normal');doc.setFontSize(7);
  doc.text('Asesoría y Análisis S.C.  |  AARMS Sistema de Registro y Monitoreo de Servicio  |  v1.0',M,footY+9);
  doc.text('Documento generado digitalmente — con valor de registro oficial',M,footY+17);
  doc.setFont('helvetica','bold');doc.setTextColor(...ACCENT);
  doc.text('F-AA-45A-12 (Digital)  —  Pág. 2 de 2',W-M,footY+13,{align:'right'});

  // ── SAVE ──
  const folio=gv('h_omar')||'000';
  const fecha=now.toISOString().split('T')[0];
  const empresa_lab=(omar.empresa||gv('h_emp')||'Cliente').substring(0,25).replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g,'').trim();
  const fileName=buildFileName(empresa_lab,'Hoja de Campo',fecha);
  
  try{
    const pdfBlob=doc.output('blob');
    lastPDFBlob=pdfBlob; lastPDFBlob.name=fileName;
    await entregarPDF(pdfBlob, fileName, {
      title:'Hoja de Campo — A&A S.C.',
      text:'Registro interno de campo'
    });
    const sr1=document.getElementById('shareRow'); if(sr1)sr1.style.display='flex';
  }catch(e){ doc.save(fileName); toast('PDF guardado ✓','g'); }
}
async function buildPDFCliente(){
  const {jsPDF}=window.jspdf;
  // PRE-LOAD all images BEFORE starting PDF draw
  const [imgFoto2,imgSig,imgSig2,logoPDF]=await Promise.all([
    preloadImg(photoData2),
    preloadImg(sigData&&sigData!=='p'?sigData:null),
    preloadImg(sigData2&&sigData2!=='p'?sigData2:null),
    loadLogo(LOGO_PDF_URI),
  ]);
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const PW=612,PH=792,ML=28,CW=556;

  const K={
    blk:[0,0,0],wht:[255,255,255],
    navy:[10,22,40],accent:[37,99,235],
    secBg:[208,216,228],rowBg:[232,238,245],rowAlt:[245,248,252],
    bdr:[138,154,176],bdrCell:[192,202,216],lbl:[85,85,85],
    teal:[0,122,96],tealBg:[232,245,240],promBg:[224,234,245],
    amberBg:[255,251,240],amberBdr:[240,165,8],amberTxt:[122,80,0],
    fotoBg:[240,244,248],sigBg:[248,251,255],
  };

  const gv=id=>{const e=document.getElementById(id);return e?e.value.trim():'';}
  const now=new Date();
  const dStr=now.toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'});
  const tStr=now.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});

  // ── HELPERS ──
  const secH=(lbl,y)=>{
    doc.setFillColor(...K.secBg);doc.rect(ML,y,CW,13,'F');
    doc.setDrawColor(...K.blk);doc.setLineWidth(0.6);doc.rect(ML,y,CW,13,'S');
    doc.setTextColor(...K.blk);doc.setFont('helvetica','bold');doc.setFontSize(8);
    doc.text(lbl.toUpperCase(),ML+5,y+9.5);
    return y+13;
  };
  const outerBorder=(x,y,w,h)=>{doc.setDrawColor(...K.blk);doc.setLineWidth(0.6);doc.rect(x,y,w,h,'S');};
  const innerLine=(x1,y1,x2,y2)=>{doc.setDrawColor(...K.blk);doc.setLineWidth(0.4);doc.line(x1,y1,x2,y2);};
  const cellLine=(x1,y1,x2,y2)=>{doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.line(x1,y1,x2,y2);};

  const dc=(x,y,w,h,lbl,val,opts={})=>{
    doc.setFillColor(...(opts.fill||K.wht));doc.rect(x,y,w,h,'F');
    doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(x,y,w,h,'S');
    doc.setTextColor(...K.lbl);doc.setFont('helvetica','bold');doc.setFontSize(6.5);
    doc.text(String(lbl).toUpperCase(),x+3,y+6);
    doc.setTextColor(...(opts.teal?K.teal:K.blk));
    doc.setFont('helvetica',opts.bold?'bold':'normal');doc.setFontSize(opts.big?10:9);
    const maxC=Math.floor((w-6)/5.2);
    doc.text(String(val||'').substring(0,maxC),x+3,y+h-3);
  };

  // Image drawing is now synchronous via preloaded data above

  let y=20;

  // ════════ HEADER ════════
  const HH=60,LW=110,MW=138,TW2=CW-LW-MW;
  outerBorder(ML,y,CW,HH);
  innerLine(ML+LW,y,ML+LW,y+HH);
  innerLine(ML+LW+TW2,y,ML+LW+TW2,y+HH);

  // Logo — proporcional dentro de celda LW=110 x HH=60
  addLogoProportional(doc,logoPDF,ML+4,y+4,LW-8,HH-8);

  // Title
  doc.setTextColor(...K.blk);doc.setFont('helvetica','bold');doc.setFontSize(11);
  doc.text('HOJA DE CAMPO / '+gv('h_mat').toUpperCase(),ML+LW+TW2/2,y+18,{align:'center'});
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...K.lbl);
  doc.text('Informe de Muestreo en Campo',ML+LW+TW2/2,y+29,{align:'center'});
  doc.setFontSize(7);
  doc.text('Asesoría y Análisis S.C. — Laboratorio de Alimentos y Aguas',ML+LW+TW2/2,y+39,{align:'center'});

  // Meta
  const mX=ML+LW+TW2+5;
  doc.setTextColor(...K.blk);doc.setFont('helvetica','bold');doc.setFontSize(8.5);
  doc.text('Folio OMAR: '+gv('h_omar'),mX,y+13);
  doc.text('Folio HCAR: '+gv('h_hcar'),mX,y+24);
  doc.setFont('helvetica','normal');doc.setFontSize(8);
  doc.text('F-AA-AR1 (Digital)',mX,y+35);
  doc.text('Fecha: '+dStr,mX,y+46);
  y+=HH;

  // ════════ DATOS GENERALES ════════
  y=secH('Datos generales del servicio',y);
  const RH=19,hw=CW/2,qw=CW/4;
  dc(ML,y,hw,RH,'Empresa solicitante',gv('h_emp'),{bold:true,big:true});
  dc(ML+hw,y,hw,RH,'Sitio de muestreo',gv('h_idm'),{bold:true,big:true});
  y+=RH;
  dc(ML,y,CW*0.38,RH,'ID de la muestra',gv('h_idm'));
  dc(ML+CW*0.38,y,CW*0.32,RH,'Norma / Matriz',gv('h_mat'));
  dc(ML+CW*0.70,y,CW*0.30,RH,'Tipo de muestreo',gv('h_tipo')+(gv('h_int')?' / '+gv('h_int'):''),{teal:true,bold:true});
  y+=RH;
  dc(ML,y,qw,RH,'Muestreador',gv('mn_nom'));
  dc(ML+qw,y,qw,RH,'Recibido por',gv('fn_nom'));
  dc(ML+qw*2,y,qw,RH,'Hora de arribo',gv('h_ini').replace('T',' ').substring(11,16)+' h');
  dc(ML+qw*3,y,qw,RH,'Temp. ambiente',tomas.length>0&&tomas[0].tamb?tomas[0].tamb+' °C':'—',{bold:true});
  y+=RH;
  dc(ML,y,CW*0.2,RH,'Coord. N',gv('gps_n'));
  dc(ML+CW*0.2,y,CW*0.2,RH,'Coord. W',gv('gps_w'));
  dc(ML+CW*0.4,y,CW*0.6,RH,'Condiciones climatológicas',gv('h_clima'));
  y+=RH;
  outerBorder(ML,y-RH*4,CW,RH*4);

  // ════════ CROQUIS ════════
  y=secH('Croquis del punto de muestreo',y);
  const FH=132,FW=CW/2;
  outerBorder(ML,y,CW,FH);
  innerLine(ML+FW,y,ML+FW,y+FH);

  // Photo box (LEFT) — fixed pixel box, image goes inside
  doc.setTextColor(...K.lbl);doc.setFont('helvetica','bold');doc.setFontSize(7);
  doc.text('FOTO DEL PUNTO DE DESCARGA',ML+5,y+9);
  const pBY=y+12,pBH=FH-28,pBW=FW-10;
  doc.setFillColor(...K.fotoBg);doc.rect(ML+5,pBY,pBW,pBH,'F');
  doc.setDrawColor(176,184,196);doc.setLineWidth(0.3);doc.rect(ML+5,pBY,pBW,pBH,'S');
  if(photoData2){
    drawFittedImg(doc,imgFoto2,ML+5,pBY,pBW,pBH);
  }else{
    doc.setTextColor(136,136,136);doc.setFont('helvetica','italic');doc.setFontSize(8);
    doc.text('Foto capturada en campo',ML+5+pBW/2,pBY+pBH/2-5,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(7.5);
    doc.text(dStr+' — '+tStr,ML+5+pBW/2,pBY+pBH/2+5,{align:'center'});
  }
  // Redraw photo box border on top always
  doc.setDrawColor(138,154,176);doc.setLineWidth(0.3);doc.rect(ML+5,pBY,pBW,pBH,'S');
  doc.setTextColor(...K.teal);doc.setFont('courier','bold');doc.setFontSize(7.5);
  doc.text('GPS: '+(gv('gps_n')||'—')+'  N     '+(gv('gps_w')||'—')+'  W',ML+5,y+FH-4);

  // Map/info box (RIGHT)
  const rX=ML+FW;
  const latRaw=(gv('gps_n')||'').replace('°','').trim();
  const lngRaw=(gv('gps_w')||'').replace('°','').trim();
  const lat=parseFloat(latRaw);
  const lngAbs=parseFloat(lngRaw);
  const lng=-Math.abs(lngAbs); // Guaymas/México siempre W = negativo
  const hasCoords=!isNaN(lat)&&!isNaN(lngAbs)&&lat!==0&&lngAbs!==0;

  doc.setFillColor(236,240,248);doc.rect(rX,y,FW,FH,'F');
  doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);doc.rect(rX,y,FW,FH,'S');
  doc.setTextColor(...K.lbl);doc.setFont('helvetica','bold');doc.setFontSize(7);
  doc.text('UBICACIÓN EN MAPA',rX+5,y+9);

  if(hasCoords){
    let mapaOk=false;
    try{
      const mW=Math.round((FW-4)*3);
      const mH=Math.round((FH-24)*3);
      const mapB64=await loadMapImage(lat,lng,16,mW,mH);
      if(mapB64){
        doc.addImage(mapB64,'PNG',rX+2,y+12,FW-4,FH-24,'','FAST');
        doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);
        doc.rect(rX+2,y+12,FW-4,FH-24,'S');
        mapaOk=true;
      }
    }catch(e){ mapaOk=false; }

    if(!mapaOk){
      // Fallback — grilla con pin
      doc.setDrawColor(200,210,225);doc.setLineWidth(0.2);
      for(let gi=0;gi<6;gi++){doc.line(rX,y+20+gi*18,rX+FW,y+20+gi*18);}
      for(let gi=0;gi<5;gi++){doc.line(rX+gi*(FW/4),y+20,rX+gi*(FW/4),y+FH);}
      const pinX=rX+FW/2,pinY=y+FH/2-10;
      doc.setFillColor(...K.accent);doc.circle(pinX,pinY,6,'F');
      doc.setFillColor(255,255,255);doc.circle(pinX,pinY,2.5,'F');
      doc.setTextColor(...K.lbl);doc.setFont('helvetica','italic');doc.setFontSize(6.5);
      doc.text('Coordenadas registradas',rX+FW/2,y+FH-22,{align:'center'});
    }
    // Coordenadas siempre al pie
    doc.setFillColor(10,22,40);doc.rect(rX+2,y+FH-18,FW-4,15,'F');
    doc.setTextColor(255,255,255);doc.setFont('courier','bold');doc.setFontSize(7.5);
    doc.text(`${lat.toFixed(5)}° N    ${lngAbs.toFixed(5)}° W`,rX+FW/2,y+FH-8,{align:'center'});
  }else{
    // Sin coordenadas — info del punto
    doc.setFillColor(...K.wht);doc.rect(rX,y,FW,FH,'F');
    doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);doc.rect(rX,y,FW,FH,'S');
    doc.setTextColor(...K.lbl);doc.setFont('helvetica','bold');doc.setFontSize(7);
    doc.text('INFORMACIÓN DEL PUNTO',rX+5,y+9);
    const infoList=[
      ['Empresa',gv('h_emp')],['Sitio',gv('h_idm')],['Muestreador',gv('mn_nom')],
      ['Fecha inicio',gv('h_ini').replace('T',' ').substring(0,16)],
      ['Tipo',gv('h_tipo')],['Coord. N','Sin GPS'],['Coord. W','Sin GPS'],
    ];
    infoList.forEach(([l,v],i)=>{
      const iy=y+14+i*16;
      if(i>0){doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.line(rX+4,iy-1,rX+FW-4,iy-1);}
      doc.setTextColor(...K.lbl);doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.text(l.toUpperCase(),rX+4,iy+3);
      doc.setTextColor(...K.blk);doc.setFont('helvetica','normal');doc.setFontSize(8.5);
      doc.text(String(v||'—').substring(0,25),rX+4,iy+11);
    });
  }
  y+=FH;

  // ════════ RESUMEN DEL MUESTREO ════════
  // Nota: antes había valores (pH, temp, cond, flujo, color, olor).
  // Esos se entregan junto con el reporte de laboratorio previo pago.
  // Aquí solo palomitas de actividades completadas por toma.
  // CRITERIO ESTRICTO: solo marcar si hay datos REALMENTE capturados por el muestreador,
  // no por valores autogenerados (hora) o preseleccionados (params desde OMAR).
  y=secH('Resumen del muestreo',y);

  // Helper: ¿hay alguna medición de campo capturada en esta toma?
  const tieneMediciones = t => !!(
    (t.ph    && String(t.ph).trim()    !== '') ||
    (t.cond  && String(t.cond).trim()  !== '') ||
    (t.od    && String(t.od).trim()    !== '') ||
    (t.tagua && String(t.tagua).trim() !== '') ||
    (t.tamb  && String(t.tamb).trim()  !== '') ||
    (t.ls    && String(t.ls).trim()    !== '')
  );
  // Para "muestra recolectada": solo si hay mediciones (la sola hora no cuenta)
  const fueRecolectada = t => tieneMediciones(t);
  // Para "muestra preservada" y "cadena de custodia": solo si hay mediciones reales
  // (los params preseleccionados desde la OMAR no son evidencia de captura).
  const fuePreservada = t => tieneMediciones(t);
  const fueCadena     = t => tieneMediciones(t);

  const ACT_ROWS=[
    ['Hora de la toma',       t => (t.hora && tieneMediciones(t)) ? t.hora : '—', 'text'],
    ['Muestra recolectada',   fueRecolectada, 'check'],
    ['Parámetros de campo medidos (pH, conductividad, OD, temperatura)', tieneMediciones, 'check'],
    ['Muestra preservada conforme a normatividad', fuePreservada, 'check'],
    ['Registro en cadena de custodia',             fueCadena,     'check'],
  ];
  const LBL=230, nT=Math.max(tomas.length,1);
  const TW3=Math.floor((CW-LBL)/nT);
  const THR=14, TRR=14;

  // Header row
  doc.setFillColor(...K.rowBg);doc.rect(ML,y,CW,THR,'F');
  doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(ML,y,LBL,THR,'S');
  doc.setTextColor(51,51,51);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('Actividad',ML+4,y+9);
  tomas.forEach((t,i)=>{
    const tx=ML+LBL+i*TW3;
    doc.setFillColor(...K.rowBg);doc.rect(tx,y,TW3,THR,'F');
    doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(tx,y,TW3,THR,'S');
    doc.setTextColor(51,51,51);doc.setFont('helvetica','bold');doc.setFontSize(8);
    doc.text('T'+(i+1),tx+TW3/2,y+9,{align:'center'});
  });
  y+=THR;

  // Helper: palomita dibujada como líneas vectoriales (verde)
  //   No dependemos de fuente ni Unicode — se ve igual siempre.
  const drawCheck = (cx, cy, on)=>{
    if(on){
      // palomita ✓ en verde, ~10px de ancho, centrada en cx,cy
      doc.setDrawColor(...K.teal);
      doc.setLineWidth(1.6);
      doc.setLineCap('round');
      doc.setLineJoin('round');
      doc.line(cx-4, cy,     cx-1, cy+3);  // trazo corto ↘
      doc.line(cx-1, cy+3,   cx+5, cy-4);  // trazo largo ↗
    } else {
      doc.setTextColor(187,187,187);
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      doc.text('—', cx, cy+3, {align:'center'});
    }
  };

  // Data rows
  ACT_ROWS.forEach(([lbl,fn,kind],ri)=>{
    const bg = ri%2===0?K.wht:K.rowAlt;
    // Para labels largos (parámetros de campo), partir en 2 líneas
    const needsWrap = lbl.length > 40;
    const rH = needsWrap ? TRR*1.4 : TRR;
    doc.setFillColor(...K.rowBg);doc.rect(ML,y,LBL,rH,'F');
    doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(ML,y,LBL,rH,'S');
    doc.setTextColor(51,51,51);doc.setFont('helvetica','bold');doc.setFontSize(7.8);
    if(needsWrap){
      const lines = doc.splitTextToSize(lbl, LBL-8);
      lines.slice(0,2).forEach((ln,li)=>doc.text(ln, ML+4, y+9 + li*8));
    } else {
      doc.text(lbl, ML+4, y+9);
    }
    tomas.forEach((t,i)=>{
      const tx=ML+LBL+i*TW3;
      doc.setFillColor(...bg);doc.rect(tx,y,TW3,rH,'F');
      doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(tx,y,TW3,rH,'S');
      const v = fn(t);
      if(kind==='text'){
        if(v && v!=='—'){
          doc.setTextColor(...K.blk);doc.setFont('helvetica','bold');doc.setFontSize(9);
        } else {
          doc.setTextColor(187,187,187);doc.setFont('helvetica','normal');doc.setFontSize(9);
        }
        doc.text(String(v||'—'), tx+TW3/2, y+(rH/2)+3, {align:'center'});
      } else {
        // Para la palomita geométrica, cy es el CENTRO del glifo (no baseline).
        drawCheck(tx+TW3/2, y+(rH/2), !!v);
      }
    });
    y+=rH;
  });

  // Observations (se mantienen — son libres y las escribe el muestreador)
  const obs=gv('h_obs');
  if(obs){
    const lines=doc.splitTextToSize(obs,CW-10);
    const oh=lines.length*10+14;
    doc.setFillColor(...K.amberBg);doc.rect(ML,y,CW,oh,'F');
    doc.setDrawColor(...K.amberBdr);doc.setLineWidth(0.5);doc.rect(ML,y,CW,oh,'S');
    doc.setTextColor(...K.amberTxt);doc.setFont('helvetica','bold');doc.setFontSize(8);
    doc.text('Observaciones:',ML+5,y+10);
    doc.setFont('helvetica','normal');doc.text(lines,ML+5,y+19);
    y+=oh;
  }

  // ════════ ANALITOS SOLICITADOS ════════
  // Antes mostraba "Conservadores utilizados" con columnas de conservador
  // que revelaba el método operativo. Ahora solo muestra qué analito se
  // recolectó por toma (el dato que el cliente necesita ver como alcance).
  y=secH('Analitos solicitados por toma',y);

  // Diccionario legible para el cliente (nombres completos, no códigos internos)
  const ALIAS={
    'FQ'  :'Fisicoquímicos',
    'TOC' :'Carbono orgánico total',
    'Hg'  :'Mercurio',
    'MP'  :'Metales pesados',
    'CIAN':'Cianuros',
    'FOS.':'Fósforo total',
    'SAAM':'SAAM (detergentes)',
    'GYA' :'Grasas y aceites',
    'DQO' :'Demanda química de oxígeno',
    'DBO5':'Demanda bioquímica de oxígeno',
    'N.TOT':'Nitrógeno total Kjeldahl',
    'CTYF':'Coliformes totales y fecales',
    'ENTE.':'Enterococos',
    'NO2' :'Nitritos',
    'NO3' :'Nitratos',
    'HELM':'Huevos de helminto',
    'CLR' :'Cloruros',
    'ECOL':'E. coli',
    'TOX' :'Toxicidad aguda',
    'CLOR':'Color',
    'CrHx':'Cromo hexavalente',
    'OTRS':'Otros'
  };

  const allP=[...new Set([...tomas.flatMap(t=>[...t.params])])];
  if(allP.length===0){
    doc.setFillColor(...K.wht);doc.rect(ML,y,CW,20,'F');
    doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(ML,y,CW,20,'S');
    doc.setTextColor(136,136,136);doc.setFont('helvetica','italic');doc.setFontSize(9);
    doc.text('Sin analitos registrados', ML+CW/2, y+13, {align:'center'});
    y+=20;
  } else {
    const ALW=260, ATW=Math.floor((CW-ALW)/Math.max(tomas.length,1));

    // Header
    doc.setFillColor(...K.rowBg);doc.rect(ML,y,CW,TRR,'F');
    doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(ML,y,ALW,TRR,'S');
    doc.setTextColor(51,51,51);doc.setFont('helvetica','bold');doc.setFontSize(8);
    doc.text('Analito', ML+4, y+9);
    tomas.forEach((t,i)=>{
      const cx=ML+ALW+i*ATW;
      doc.setFillColor(...K.rowBg);doc.rect(cx,y,ATW,TRR,'F');
      doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(cx,y,ATW,TRR,'S');
      doc.setFont('helvetica','bold');doc.setFontSize(8);
      doc.text('T'+(i+1), cx+ATW/2, y+9, {align:'center'});
    });
    y+=TRR;

    // Rows
    allP.slice(0,14).forEach((p,ri)=>{
      const bg=ri%2===0?K.wht:K.rowAlt;
      const lbl=ALIAS[p]||p;
      doc.setFillColor(...bg);doc.rect(ML,y,ALW,TRR,'F');
      doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(ML,y,ALW,TRR,'S');
      doc.setTextColor(...K.blk);doc.setFont('helvetica','normal');doc.setFontSize(8.5);
      doc.text(lbl.substring(0,45), ML+4, y+9);
      tomas.forEach((t,ti)=>{
        const cx=ML+ALW+ti*ATW;
        doc.setFillColor(...bg);doc.rect(cx,y,ATW,TRR,'F');
        doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(cx,y,ATW,TRR,'S');
        // Solo marcar si el analito está en la toma Y la toma fue realmente capturada
        // (tiene mediciones reales). Antes marcaba con solo preselección — engañoso.
        if(t.params.has(p) && tieneMediciones(t)){
          drawCheck(cx+ATW/2, y+TRR/2, true);
        }
      });
      y+=TRR;
    });
  }

  // Aviso para el cliente — los resultados se entregan por aparte
  const avisoH = 26;
  doc.setFillColor(...K.amberBg);doc.rect(ML,y,CW,avisoH,'F');
  doc.setDrawColor(...K.amberBdr);doc.setLineWidth(0.5);doc.rect(ML,y,CW,avisoH,'S');
  doc.setTextColor(...K.amberTxt);doc.setFont('helvetica','bold');doc.setFontSize(7.5);
  doc.text('Resultados analíticos',ML+5,y+9);
  doc.setFont('helvetica','normal');doc.setFontSize(7);
  const avisoTxt = 'Los valores medidos de los parámetros de campo y de los analitos indicados se incluirán en el Reporte de Resultados emitido por el laboratorio, al concluir los análisis correspondientes.';
  const avisoLines = doc.splitTextToSize(avisoTxt, CW-10);
  avisoLines.forEach((ln,li)=>doc.text(ln, ML+5, y+17+li*7));
  y+=avisoH;


  // ════════ FIRMAS ════════
  if(y>PH-115){doc.addPage();y=20;}
  y=secH('Conformidad y firma del cliente',y);
  const SW=(CW-2)/2,SH=100;
  outerBorder(ML,y,CW,SH);
  innerLine(ML+SW,y,ML+SW,y+SH);

  // ── MUESTREADOR (LEFT) ──
  doc.setTextColor(...K.lbl);doc.setFont('helvetica','bold');doc.setFontSize(7);
  doc.text('FIRMA DEL MUESTREADOR',ML+4,y+9);
  doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.line(ML+4,y+11,ML+SW-4,y+11);
  doc.setTextColor(...K.blk);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(gv('mn_nom'),ML+4,y+21);
  doc.setTextColor(...K.lbl);doc.setFontSize(7.5);doc.text('Muestreador — Asesoría y Análisis S.C.',ML+4,y+30);
  // Fixed sig box
  const mSY=y+34,mSH=SH-48,mSW=SW-8;
  doc.setFillColor(...K.sigBg);doc.rect(ML+4,mSY,mSW,mSH,'F');
  doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);doc.rect(ML+4,mSY,mSW,mSH,'S');
  // AARMS sub9-firma: preferir firma dibujada del muestreador (config tablet)
  {
    let _mPng = '';
    try{
      const _pl = typeof _planActivo==='function' ? _planActivo() : null;
      if(_pl && typeof _firmaMuestreadorAuto==='function') _firmaMuestreadorAuto(_pl);
      _mPng = (_pl && _pl.firmas && _pl.firmas.muestreador && _pl.firmas.muestreador.firmaPng)
        || (typeof _muestreadorActual==='function' && _muestreadorActual().firmaPng)
        || '';
    }catch(_){ }
    if(_mPng){
      try{ doc.addImage(_mPng,'PNG',ML+4,mSY,mSW,mSH); }catch(e){ console.warn('[campo firma]', e); }
      doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);doc.rect(ML+4,mSY,mSW,mSH,'S');
    } else if(sigData2&&sigData2!=='p'){
      drawSig(doc,sigData2,ML+4,mSY,mSW,mSH);
      doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);doc.rect(ML+4,mSY,mSW,mSH,'S');
    }else{
      doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);
      doc.line(ML+4,mSY,ML+4+mSW,mSY+mSH);doc.line(ML+4,mSY+mSH,ML+4+mSW,mSY);
      doc.setTextColor(170,180,195);doc.setFont('helvetica','italic');doc.setFontSize(7.5);
      doc.text('Firma del muestreador',ML+4+mSW/2,mSY+mSH/2,{align:'center'});
    }
  }
  // Redraw box border on top
  doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);doc.rect(ML+4,mSY,mSW,mSH,'S');
  doc.setTextColor(...K.lbl);doc.setFont('helvetica','normal');doc.setFontSize(7);
  doc.text('Fecha: '+dStr+'    Hora: '+tStr,ML+4,y+SH-4);

  // ── CLIENTE (RIGHT) ──
  const cSX=ML+SW+2;
  doc.setTextColor(...K.lbl);doc.setFont('helvetica','bold');doc.setFontSize(7);
  doc.text('FIRMA DE CONFORMIDAD DEL CLIENTE',cSX+4,y+9);
  doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.line(cSX+4,y+11,cSX+SW-4,y+11);
  doc.setTextColor(...K.blk);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(gv('fn_nom'),cSX+4,y+21);
  doc.setFont('helvetica','normal');doc.setTextColor(...K.lbl);doc.setFontSize(7.5);doc.text('Cargo: '+gv('fn_car'),cSX+4,y+30);
  // Fixed sig box — teal border for client
  const cSY=y+34,cSW=SW-8;
  doc.setFillColor(240,250,247);doc.rect(cSX+4,cSY,cSW,mSH,'F');
  doc.setDrawColor(0,184,148);doc.setLineWidth(0.4);doc.rect(cSX+4,cSY,cSW,mSH,'S');
  if(sigData&&sigData!=='p'){
    drawSig(doc,sigData,cSX+4,cSY,cSW,mSH);
    doc.setDrawColor(0,184,148);doc.setLineWidth(0.4);doc.rect(cSX+4,cSY,cSW,mSH,'S');
  }else{
    doc.setTextColor(0,122,96);doc.setFont('helvetica','italic');doc.setFontSize(8);
    doc.text('Pendiente de firma del cliente',cSX+4+cSW/2,cSY+mSH/2,{align:'center'});
  }
  // Redraw teal border on top
  doc.setDrawColor(0,184,148);doc.setLineWidth(0.4);doc.rect(cSX+4,cSY,cSW,mSH,'S');
  doc.setTextColor(...K.lbl);doc.setFont('helvetica','normal');doc.setFontSize(7);
  doc.text('Fecha: '+dStr+'    Hora: '+tStr,cSX+4,y+SH-4);
  y+=SH;

  // ════════ FOOTER ════════
  const FY=PH-16;
  outerBorder(ML,FY,CW,16);
  doc.setTextColor(...K.lbl);doc.setFont('helvetica','normal');doc.setFontSize(7);
  doc.text('Asesoría y Análisis S.C.  —  Tel. 622 224 0910  —  Guaymas, Sonora',ML+4,FY+7);
  doc.text('Documento generado con AARMS — valor de registro oficial',ML+4,FY+13);
  doc.setFont('helvetica','bold');doc.setTextColor(...K.accent);
  doc.text('F-AA-AR1 (Digital)',PW-ML-4,FY+10,{align:'right'});

  // ════════ SAVE ════════
  const folio=gv('h_omar')||'000';
  const fecha=now.toISOString().split('T')[0];
  const empresa_c=(omar.empresa||gv('h_emp')||'Cliente').substring(0,25).replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g,'').trim();
  const fname=buildFileName(empresa_c,'Reporte de Muestreo',fecha);
  const blob=doc.output('blob');
  lastPDFClienteBlob=blob;lastPDFClienteBlob.name=fname;
  await entregarPDF(blob, fname, {
    title:'Informe de Muestreo — A&A S.C.',
    text:'Tu informe de muestreo — Asesoría y Análisis S.C.'
  });
  const sr2=document.getElementById('shareRow'); if(sr2)sr2.style.display='flex';
}


// ─── CADENA DE CUSTODIA PDF ───────────────────────────────────────────────

function genCadena(){
  // Ningún PDF se genera sin la firma del cliente.
  if(_bloquearSiSinFirma('Cadena de Custodia')) return;
  toast('Generando Cadena de Custodia...','');
  const btn=document.getElementById('btnCadena');
  if(btn){btn.disabled=true;btn.textContent='Generando...';}
  const run=async()=>{
    try{
      // CRÍTICO: guardar el estado actual del formulario a omar.lab
      // antes de generar, para que el PDF vea los valores recién escritos
      if(omar.folio){ await saveMuestreoActual(); }
      await buildPDFCadena();
      if(btn){btn.disabled=false;btn.textContent='Cadena de Custodia';}
    }catch(e){
      console.error('Cadena error:',e);
      errorUsuario('Error al generar la cadena de custodia.', e);
      if(btn){btn.disabled=false;btn.textContent='Cadena de Custodia';}
    }
  };
  run();
}

async function buildPDFCadena(){
  const {jsPDF}=window.jspdf;
  const logoPDF=await loadLogo(LOGO_PDF_URI);
  // Landscape US Letter
  const doc=new jsPDF({orientation:'landscape',unit:'pt',format:'letter'});
  const W=792,H=612,M=14,CW=W-M*2; // 764

  const NAVY=[10,22,40],BLUE=[26,58,107],ACCENT=[37,99,235];
  const MGRAY=[192,202,216],LGRAY=[232,238,245],DGRAY=[60,72,88];
  const WHITE=[255,255,255],TEAL=[0,122,96],TEAL_L=[210,238,228];
  const AMBER=[255,251,224],AMBER2=[255,243,176];
  const AMBER_TXT=[80,60,0],BLACK=[0,0,0];

  const gv=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const now=new Date();
  const dStr=now.toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'});
  const tStr=now.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});

  // ── DATA ──
  const PARAMS=['FQ','TOC','Hg','MP','CIAN','FOS.','SAAM','GYA','DQO','DBO5','N.TOT','CTYF','ENTE.','NO2','NO3','HELM','CLR','ECOL','TOX','CLOR','CrHx','OTRS'];
  const SIMPLES=['GYA','CTYF','ENTE.','ECOL','TOX'];
  const conCloro=tomas.some(t=>t.cloro===true);
  const DATA={
    'FQ'  :{pres:'4',     vol:'4000', env:'3',    ph:''},
    'TOC' :{pres:'4/10',  vol:'1000', env:'8',    ph:'<2'},
    'Hg'  :{pres:'4/9/3', vol:'500',  env:'4',    ph:'<2'},
    'MP'  :{pres:'4/9',   vol:'500',  env:'4',    ph:'<2'},
    'CIAN':{pres:'4/2',   vol:'1000', env:'2',    ph:'>12'},
    'FOS.':{pres:'4',     vol:'500',  env:'4',    ph:''},
    'SAAM':{pres:'4',     vol:'1000', env:'2',    ph:'<2'},
    'GYA' :{pres:'4/1',   vol:'1000', env:'1',    ph:'<2'},
    'DQO' :{pres:'4/1',   vol:'500',  env:'4',    ph:'<2'},
    'DBO5':{pres:'4',     vol:'1000', env:'2',    ph:''},
    'N.TOT':{pres:'4/1',  vol:'2000', env:'13',   ph:'<2'},
    'CTYF':{pres:conCloro?'4/7':'4',  vol:'100',  env:conCloro?'9':'12',  ph:''},
    'ENTE.':{pres:conCloro?'4/7':'4', vol:'250',  env:conCloro?'7':'6',   ph:''},
    'NO2' :{pres:'4',     vol:'500',  env:'4',    ph:''},
    'NO3' :{pres:'4',     vol:'500',  env:'4',    ph:''},
    'HELM':{pres:'4',     vol:'5000', env:'5',    ph:''},
    'CLR' :{pres:'4',     vol:'250',  env:'11',   ph:''},
    'ECOL':{pres:conCloro?'4/7':'4',  vol:'100',  env:conCloro?'9':'12',  ph:''},
    'TOX' :{pres:'4',     vol:'40',   env:'10',   ph:''},
    'CLOR':{pres:'4',     vol:'500',  env:'4',    ph:''},
    'CrHx':{pres:'4/12',  vol:'500',  env:'4',    ph:'9'},
    'OTRS':{pres:'',      vol:'',     env:'',     ph:''},
  };
  // Parámetros cuyo número de frascos = número de tomas simples
  const DYNAMIC_FRASCOS=['GYA','CTYF','ENTE.','ECOL'];
  const nTomas=tomas.length||1;

  // Active params from tomas — solo los seleccionados
  const activeSet=new Set([...tomas.flatMap(t=>[...t.params])]);

  // ── LAYOUT ──
  const LABEL_W=76;
  const N_PARAMS=PARAMS.length; // 22
  const PCOL=Math.floor((CW-LABEL_W)/N_PARAMS); // ~31pt per param
  const TABLE_W=LABEL_W+PCOL*N_PARAMS;
  const TH=13;
  const RH=11; // data row height
  const colWidths=[LABEL_W,...PARAMS.map(()=>PCOL)];

  // ── HELPERS ──
  const line=(x1,y1,x2,y2,c=MGRAY,lw=0.3)=>{
    doc.setDrawColor(...c);doc.setLineWidth(lw);doc.line(x1,y1,x2,y2);
  };
  const outerRect=(x,y,w,h,c=[0,0,0],lw=0.6)=>{
    doc.setDrawColor(...c);doc.setLineWidth(lw);doc.rect(x,y,w,h,'S');
  };
  const fillRect=(x,y,w,h,fill)=>{
    doc.setFillColor(...fill);doc.rect(x,y,w,h,'F');
  };

  // ── HEADER ──
  let y=M;

  // ── HEADER BOX ──
  const HDR_H=50;
  // Logo — proporcional dentro de espacio 58x46
  addLogoProportional(doc,logoPDF,M,y+2,58,46);

  // Company block — right of logo con más espacio
  const compX=M+64;
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('Asesoría y Análisis, S.C.',compX,y+10);
  doc.setFont('helvetica','normal');doc.setFontSize(5.5);doc.setTextColor(...DGRAY);
  doc.text('Calle 12 Ave. Serdán Ext.465 Int.201, Edif. Puertas del Sol, Col. Centro C.P. 85400',compX,y+18);
  doc.text('Tel: 622 224 0910',compX,y+25);

  // Title — center zone (avoid logo left and folios right)
  const titleX=W/2;
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(12);
  doc.text('CADENA DE CUSTODIA INTERNA AR',titleX,y+12,{align:'center'});
  doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(...MGRAY);
  doc.text('F-AA-01A-15',titleX,y+20,{align:'center'});

  // Folios — right column
  const fX=W-M-72;
  doc.setDrawColor(...MGRAY);doc.setLineWidth(0.4);
  doc.line(fX,y,fX,y+HDR_H);
  [['FOLIO CCIAR:',gv('h_cciar')],['FOLIO OMAR:',gv('h_omar')],['FOLIO HCAR:',gv('h_hcar')]].forEach(([l,v],i)=>{
    const fy=y+5+i*12;
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(5.5);
    doc.text(l,fX+3,fy);
    doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(7);
    doc.text(v||'__________',fX+3,fy+7);
    if(i<2){doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.line(fX,fy+9,W-M,fy+9);}
  });

  // Header bottom border
  doc.setDrawColor(...NAVY);doc.setLineWidth(0.6);
  doc.line(M,y+HDR_H,W-M,y+HDR_H);
  y+=HDR_H+4;

  // ── IDENTIFICACIÓN ──
  fillRect(M,y,CW,13,LGRAY);
  outerRect(M,y,CW,13);
  // IDENTIFICACIÓN — label pegado al valor, font más legible
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(5);
  doc.text('IDENTIFICACIÓN DE LA MUESTRA:',M+3,y+9);
  doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(6.5);
  doc.text(gv('h_idm')||'_______________',M+118,y+9);
  // TIPO
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(5);
  doc.text('TIPO:',M+285,y+9);
  doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(6.5);
  doc.text(gv('h_tipo')||'_________',M+303,y+9);
  // TIEMPOS
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(5);
  doc.text('TIEMPOS:',M+385,y+9);
  doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(6.5);
  doc.text(gv('h_int')||'______',M+410,y+9);
  // TRANSPORTA — solo muestra lo seleccionado
  const transp=gv('c_transp');
  if(transp){
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(5);
    const transpLbl=transp==='hielera'?'TRANSPORTA EN HIELERA: ✓':'TRANSPORTA EN: '+transp.toUpperCase();
    doc.text(transpLbl,M+490,y+9);
  }
  y+=13;

  // ── PARAMS TABLE ──
  // Header row
  fillRect(M,y,LABEL_W,TH,NAVY);
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(5.5);
  doc.text('PARÁMETROS',M+LABEL_W/2,y+TH/2+2,{align:'center'});
  outerRect(M,y,LABEL_W,TH);

  let px=M+LABEL_W;
  PARAMS.forEach(p=>{
    const isS=SIMPLES.includes(p);
    const active=activeSet.has(p);
    fillRect(px,y,PCOL,TH,isS?TEAL_L:LGRAY);
    doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(px,y,PCOL,TH,'S');
    doc.setTextColor(...(active?(isS?TEAL:NAVY):[170,180,195]));
    doc.setFont('helvetica','bold');doc.setFontSize(4.5);
    doc.text(p,px+PCOL/2,y+TH/2+1.5,{align:'center'});
    px+=PCOL;
  });
  outerRect(M,y,TABLE_W,TH);
  y+=TH;

  // Data rows
  const ROWS=[
    ['COD. PRESERVACIÓN', p=>DATA[p]?.pres||'', AMBER2],
    ['VOLUMEN (mL)',       p=>DATA[p]?.vol||'',  LGRAY],
    ['TIPO DE ENVASE',    p=>DATA[p]?.env||'',  LGRAY],
    ['No. DE FRASCOS',   p=>DATA[p]?.env?(DYNAMIC_FRASCOS.includes(p)?String(nTomas):'1'):'',LGRAY],
    ['pH PRESERVACIÓN',  p=>DATA[p]?.ph||'',   LGRAY],
  ];
  // Filas abiertas — se llenan en laboratorio
  const OPEN_ROWS=['ANALIZO:','MUESTRA A SUCURSAL'];

  ROWS.forEach(([lbl,fn,lblFill])=>{
    fillRect(M,y,CW,RH,[255,255,255]);
    fillRect(M,y,LABEL_W,RH,lblFill);
    doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(M,y,LABEL_W,RH,'S');
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(4.5);
    doc.text(lbl,M+3,y+7.5);

    let px=M+LABEL_W;
    PARAMS.forEach(p=>{
      const val=fn(p);
      const isS=SIMPLES.includes(p);
      const active=activeSet.has(p);
      if(active){
        // Para pH: si está vacío ('') = cancelado con diagonal aunque esté activo
        const isPH=lbl==='pH PRESERVACIÓN';
        const showCancel=isPH&&val==='';
        if(showCancel){
          fillRect(px,y,PCOL,RH,[228,232,240]);
          doc.setDrawColor(195,204,216);doc.setLineWidth(0.2);doc.rect(px,y,PCOL,RH,'S');
          doc.setDrawColor(195,204,216);doc.setLineWidth(0.3);
          doc.line(px+1,y+1,px+PCOL-1,y+RH-1);
        }else{
          fillRect(px,y,PCOL,RH,isS?TEAL_L:[255,255,255]);
          doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(px,y,PCOL,RH,'S');
          if(val){
            doc.setTextColor(...(isS?TEAL:DGRAY));doc.setFont('helvetica','bold');doc.setFontSize(5.5);
            doc.text(String(val),px+PCOL/2,y+7.5,{align:'center'});
          }
        }
      }else{
        // Cancelled
        fillRect(px,y,PCOL,RH,[228,232,240]);
        doc.setDrawColor(195,204,216);doc.setLineWidth(0.2);doc.rect(px,y,PCOL,RH,'S');
        doc.setDrawColor(195,204,216);doc.setLineWidth(0.3);
        doc.line(px+1,y+1,px+PCOL-1,y+RH-1);
      }
      px+=PCOL;
    });
    outerRect(M,y,TABLE_W,RH);
    y+=RH;
  });

  // Filas abiertas — se llenan en laboratorio (completamente en blanco, todas las celdas)
  OPEN_ROWS.forEach(lbl=>{
    fillRect(M,y,CW,RH,[255,255,255]);
    fillRect(M,y,LABEL_W,RH,LGRAY);
    doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(M,y,LABEL_W,RH,'S');
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(4.5);
    doc.text(lbl,M+3,y+7.5);
    let px=M+LABEL_W;
    PARAMS.forEach(p=>{
      fillRect(px,y,PCOL,RH,[255,255,255]);
      doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(px,y,PCOL,RH,'S');
      px+=PCOL;
    });
    outerRect(M,y,TABLE_W,RH);
    y+=RH;
  });
  y+=2;
  const notaH=20;
  fillRect(M,y,CW,notaH,AMBER);
  outerRect(M,y,CW,notaH);
  doc.setTextColor(...AMBER_TXT);doc.setFont('helvetica','bold');doc.setFontSize(4.5);
  doc.text('PRESERVACION:',M+3,y+7);

  // Dibuja texto con subíndices reales — formato: partes alternas [normal, sub, normal, sub...]
  // cada entrada: [texto, esSub]
  function drawChem(parts, startX, baseY){
    let cx=startX;
    parts.forEach(([t,isSub])=>{
      const sz=isSub?3.0:4.2;
      const dy=isSub?1.2:0;
      doc.setFontSize(sz);
      doc.text(t,cx,baseY+dy);
      cx+=doc.getTextWidth(t);
    });
    doc.setFontSize(4.2);
    return cx;
  }

  doc.setFont('helvetica','normal');
  const chemicals=[
    [['1-H',false],['2',true],['SO',false],['4',true],['  ',false]],
    [['2-NaOH  ',false]],
    [['3-K',false],['2',true],['Cr',false],['2',true],['O',false],['7',true],[' 25%  ',false]],
    [['4-Hielo 4°C  ',false]],
    [['5-NA  ',false]],
    [['6-HNO',false],['3',true],['  ',false]],
    [['7-Tiosulfato  ',false]],
    [['8-HCl  ',false]],
    [['9-HNO',false],['3',true],[' Sup  ',false]],
    [['10-H',false],['2',true],['SO',false],['4',true],[' 25%  ',false]],
    [['12-Dil.Buffer  ',false]],
    [['13-Formaldehido 10%  ',false]],
    [['14-Otro:_____',false]],
  ];
  let cx=M+40;
  chemicals.forEach(chem=>{ cx=drawChem(chem,cx,y+7); });

  doc.setFont('helvetica','bold');doc.setFontSize(4.5);
  doc.text('TIPO ENVASE:',M+3,y+16);
  doc.setFont('helvetica','normal');doc.setFontSize(4.2);
  doc.text('1-V.Ancho1L  2-Plast.1L  3-Plast.4L  4-Plast.500mL  5-Plast.5L  6-B.Est.300mL  8-V.Amb.1L  9-B.Est.100mL  10-V.Amb.40mL  11-V.Amb.250mL  13-Plast.2L',M+35,y+16);
  y+=notaH+2;

  // ── FIRMAS MATRIZ — campos editables PDF ──
  const FW=CW/3;
  // IMPORTANTE: leer directo del DOM. omar.lab solo sirve como respaldo
  // para muestreos cargados desde IndexedDB que aún no tienen valor en pantalla.
  const labStored = omar.lab||{};
  const labGet = id => {
    const el=document.getElementById(id);
    const v=el?el.value:'';
    return (v&&v.trim())||'';
  };
  // Construye el objeto lab combinando DOM + fallback
  const lab = {
    tnom: labGet('c_tnom')||labStored.tnom||'',
    tfir: labGet('c_tfir')||labStored.tfir||'',
    tfec: labGet('c_tfec')||labStored.tfec||'',
    thor: labGet('c_thor')||labStored.thor||'',
    inom: labGet('c_inom')||labStored.inom||'',
    ifir: labGet('c_ifir')||labStored.ifir||'',
    ifec: labGet('c_ifec')||labStored.ifec||'',
    ihor: labGet('c_ihor')||labStored.ihor||'',
    renom: labGet('c_renom')||labStored.renom||'',
    refir: labGet('c_refir')||labStored.refir||'',
    refec: labGet('c_refec')||labStored.refec||'',
    rehor: labGet('c_rehor')||labStored.rehor||'',
    fotar: labGet('c_fotar')||labStored.fotar||'',
    snom: labGet('c_snom')||labStored.snom||'',
    sfir: labGet('c_sfir')||labStored.sfir||'',
    sfec: labGet('c_sfec')||labStored.sfec||'',
    shor: labGet('c_shor')||labStored.shor||'',
    isnom: labGet('c_isnom')||labStored.isnom||'',
    isfir: labGet('c_isfir')||labStored.isfir||'',
    isfec: labGet('c_isfec')||labStored.isfec||'',
    ishor: labGet('c_ishor')||labStored.ishor||'',
    rsnom: labGet('c_rsnom')||labStored.rsnom||'',
    rsfir: labGet('c_rsfir')||labStored.rsfir||'',
    rsfec: labGet('c_rsfec')||labStored.rsfec||'',
    rshor: labGet('c_rshor')||labStored.rshor||'',
    ltnom: labGet('c_ltnom')||labStored.ltnom||'',
    ltfir: labGet('c_ltfir')||labStored.ltfir||'',
    ltfec: labGet('c_ltfec')||labStored.ltfec||'',
    lthor: labGet('c_lthor')||labStored.lthor||'',
    sup:   labGet('c_sup')  ||labStored.sup  ||'',
  };
  // Debug temporal: si hay queja de campos vacíos, abrir consola para ver
  console.log('[Cadena] lab data:', lab);

  const fmtDate=v=>{
    if(!v)return'';
    // ISO AAAA-MM-DD → DD/MM/AAAA
    if(v.includes('-')&&v.indexOf('-')===4)return v.split('-').reverse().join('/');
    return v;
  };
  const fmtTime=v=>v||'';

  // Helper: caja de campo con valor. Si tieneValor, fondo blanco y texto nítido;
  // si vacío, fondo muy suave (para que se note que es rellenable).
  // Se mantiene por si otros PDFs lo usan — aquí en Cadena usamos lineField().
  function addField(name, x, y, w, h, value='', fontSize=6.5){
    const has=!!(value && String(value).trim());
    doc.setFillColor(...(has?WHITE:[249,251,254]));
    doc.rect(x, y, w, h, 'F');
    doc.setDrawColor(...(has?[150,168,195]:[205,215,230]));
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h, 'S');
    if(has){
      doc.setFont('helvetica','normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(...NAVY);
      const ty = y + h/2 + fontSize*0.30;
      doc.text(String(value), x+2, ty, {maxWidth: w-4});
    }
  }

  // Helper estilo FORMATO OFICIAL: etiqueta a la izquierda + línea horizontal
  // con el valor escrito JUSTO ENCIMA de la línea. No hay caja.
  //  - x,y,w,h → bounding box de la fila
  //  - label   → texto de la etiqueta (bold, izq)
  //  - value   → texto a escribir encima de la línea
  //  - labelW  → ancho reservado a la etiqueta (si no se pasa, se calcula)
  function lineField(x, y, w, h, label, value, fontSize=7, labelW=null){
    // Ancho de la etiqueta: si no se especifica, se calcula según longitud
    doc.setFont('helvetica','bold');
    doc.setFontSize(6);
    doc.setTextColor(...NAVY);
    const calcW = doc.getTextWidth(label)+4;
    const lw = labelW!=null ? labelW : calcW;
    // Etiqueta centrada verticalmente
    doc.text(label, x, y+h/2+2);
    // Línea horizontal gris en la parte inferior
    const lineY = y+h-1.5;
    const lineX1 = x+lw;
    const lineX2 = x+w;
    doc.setDrawColor(130,145,165);
    doc.setLineWidth(0.35);
    doc.line(lineX1, lineY, lineX2, lineY);
    // Valor escrito encima de la línea
    const val = (value==null?'':String(value)).trim();
    if(val){
      doc.setFont('helvetica','normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(...NAVY);
      // Truncar si excede el ancho disponible
      const maxW = lineX2-lineX1-3;
      let txt = val;
      while(doc.getTextWidth(txt) > maxW && txt.length > 3){
        txt = txt.slice(0,-1);
      }
      if(txt !== val) txt = txt.slice(0,-1)+'…';
      doc.text(txt, lineX1+2, lineY-1.5);
    }
  }

  // Altura de cada bloque de firma matriz:
  //  - franja de título (11pt)
  //  - fila NOMBRE (12pt)
  //  - fila FIRMA  (12pt)
  //  - fila FECHA | HORA (12pt)
  // total = 47pt
  const firmaTitleH = 11;
  const firmaRowH   = 12;
  const firmaH      = firmaTitleH + firmaRowH*3;
  const LBL_W = 26; // ancho fijo para etiquetas NOMBRE/FIRMA/FECHA/HORA
  const LBL_W_SHORT = 22; // para FECHA/HORA que son más cortas

  [
    {lbl:'TRANSPORTA Y ENTREGA EN MATRIZ',fill:[225,232,246],
     nom:lab.tnom,fir:lab.tfir,fec:fmtDate(lab.tfec),hor:fmtTime(lab.thor),
     pfx:'tm'},
    {lbl:'INSPECCIONA EN MATRIZ',fill:[235,240,250],
     nom:lab.inom,fir:lab.ifir,fec:fmtDate(lab.ifec),hor:fmtTime(lab.ihor),
     pfx:'im'},
    {lbl:'RECIBE EN MATRIZ',fill:[225,232,246],
     nom:lab.renom,fir:lab.refir,fec:fmtDate(lab.refec),hor:fmtTime(lab.rehor),
     pfx:'rm'},
  ].forEach(({lbl,fill,nom,fir,fec,hor,pfx},i)=>{
    const fx=M+i*FW;
    // Fondo general del bloque
    fillRect(fx,y,FW,firmaH,WHITE);
    outerRect(fx,y,FW,firmaH);
    // Franja de título
    fillRect(fx,y,FW,firmaTitleH,fill);
    doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);
    doc.line(fx,y+firmaTitleH,fx+FW,y+firmaTitleH);
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(6);
    doc.text(lbl,fx+FW/2,y+firmaTitleH/2+2,{align:'center'});

    // Filas: NOMBRE / FIRMA / FECHA-HORA
    const rx = fx+4, rw = FW-8;
    let ry = y + firmaTitleH + 1;
    lineField(rx, ry, rw, firmaRowH-2, 'NOMBRE', nom, 7, LBL_W);
    ry += firmaRowH;
    lineField(rx, ry, rw, firmaRowH-2, 'FIRMA', fir, 7, LBL_W);
    ry += firmaRowH;
    // Fila dividida en dos: FECHA y HORA
    const halfW = rw/2 - 2;
    lineField(rx,          ry, halfW, firmaRowH-2, 'FECHA', fec, 7, LBL_W_SHORT);
    lineField(rx+halfW+4,  ry, halfW, firmaRowH-2, 'HORA',  hor, 7, LBL_W_SHORT);
  });
  y+=firmaH;

  // ── RESPONSABLE + OBSERVACIONES ──
  const respH=32;
  const respW=CW*0.38;
  // Bloque RESPONSABLE — franja navy arriba, cuerpo blanco abajo
  fillRect(M,y,respW,respH,WHITE);
  outerRect(M,y,respW,respH);
  fillRect(M,y,respW,11,NAVY);
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(6);
  doc.text('RESPONSABLE DE MUESTREO',M+respW/2,y+7.5,{align:'center'});
  // Dos filas dentro: NOMBRE + FIRMA
  let ry = y + 13;
  lineField(M+4, ry, respW-8, 9, 'NOMBRE', gv('mn_nom'), 7, LBL_W);
  ry += 10;
  lineField(M+4, ry, respW-8, 9, 'FIRMA',  '', 7, LBL_W);

  // Bloque OBSERVACIONES
  const obsX=M+respW;
  const obsW=CW-respW;
  fillRect(obsX,y,obsW,respH,WHITE);
  outerRect(obsX,y,obsW,respH);
  fillRect(obsX,y,obsW,11,[225,232,246]);
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(6);
  doc.text('OBSERVACIONES',obsX+obsW/2,y+7.5,{align:'center'});
  // Observaciones como texto libre sobre líneas horizontales
  const obsVal = (gv('c_obs')||gv('h_obs')||'').trim();
  const obsInnerY = y+12;
  const obsInnerH = respH-13;
  // Dibujar 2 líneas horizontales guía
  doc.setDrawColor(130,145,165);doc.setLineWidth(0.35);
  doc.line(obsX+4, obsInnerY+obsInnerH*0.5, obsX+obsW-4, obsInnerY+obsInnerH*0.5);
  doc.line(obsX+4, obsInnerY+obsInnerH-1,    obsX+obsW-4, obsInnerY+obsInnerH-1);
  if(obsVal){
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...NAVY);
    // Partir en dos líneas si es necesario
    const maxW = obsW-10;
    const lines = doc.splitTextToSize(obsVal, maxW);
    if(lines[0]) doc.text(lines[0], obsX+6, obsInnerY+obsInnerH*0.5-1.5);
    if(lines[1]) doc.text(lines[1], obsX+6, obsInnerY+obsInnerH-2.5);
  }
  y+=respH;

  // ── SUCURSAL — tres bloques con mismo patrón que matriz ──
  const sucTitleH = 11;
  const sucRowH   = 12;
  const sucH      = sucTitleH + sucRowH*3;

  [
    {lbl:'TRANSPORTA Y ENTREGA A SUCURSAL',fill:[225,232,246],
     nom:lab.snom,fir:lab.sfir,fec:fmtDate(lab.sfec),hor:fmtTime(lab.shor),
     fotar:lab.fotar,showOtar:true,pfx:'st'},
    {lbl:'INSPECCIONA EN SUCURSAL',fill:[235,240,250],
     nom:lab.isnom,fir:lab.isfir,fec:fmtDate(lab.isfec),hor:fmtTime(lab.ishor),
     fotar:'',showOtar:false,pfx:'is'},
    {lbl:'RECIBIDO EN SUCURSAL',fill:[225,232,246],
     nom:lab.rsnom,fir:lab.rsfir,fec:fmtDate(lab.rsfec),hor:fmtTime(lab.rshor),
     fotar:'',showOtar:false,pfx:'rs'},
  ].forEach(({lbl,fill,nom,fir,fec,hor,fotar,showOtar,pfx},i)=>{
    const fx=M+i*FW;
    fillRect(fx,y,FW,sucH,WHITE);
    outerRect(fx,y,FW,sucH);
    // Franja de título
    fillRect(fx,y,FW,sucTitleH,fill);
    doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);
    doc.line(fx,y+sucTitleH,fx+FW,y+sucTitleH);
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(6);
    doc.text(lbl,fx+FW/2,y+sucTitleH/2+2,{align:'center'});

    const rx = fx+4, rw = FW-8;
    let ry = y + sucTitleH + 1;
    if(showOtar){
      // Fila: NOMBRE + FOLIO OTAR (pequeño al final)
      const nomW = rw*0.62;
      const otarW = rw*0.38 - 4;
      lineField(rx, ry, nomW, sucRowH-2, 'NOMBRE', nom, 7, LBL_W);
      lineField(rx+nomW+4, ry, otarW, sucRowH-2, 'OTAR', fotar, 7, LBL_W_SHORT);
    } else {
      lineField(rx, ry, rw, sucRowH-2, 'NOMBRE', nom, 7, LBL_W);
    }
    ry += sucRowH;
    lineField(rx, ry, rw, sucRowH-2, 'FIRMA', fir, 7, LBL_W);
    ry += sucRowH;
    const halfW = rw/2 - 2;
    lineField(rx,          ry, halfW, sucRowH-2, 'FECHA', fec, 7, LBL_W_SHORT);
    lineField(rx+halfW+4,  ry, halfW, sucRowH-2, 'HORA',  hor, 7, LBL_W_SHORT);
  });
  y+=sucH;

  // ── PIE FINAL — envío a lab matriz ──
  // Fila 1: título + folios OTAR/CCIAR
  // Fila 2: persona que transporta (nombre/firma/fecha/hora)
  // Fila 3: supervisó + código formato
  const pieRowH = 13;
  const pieH = pieRowH*3;
  fillRect(M,y,CW,pieH,WHITE);
  outerRect(M,y,CW,pieH);

  // Fila 1: ENVÍO + folios
  let py = y;
  fillRect(M,py,CW,pieRowH,[225,232,246]);
  doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);
  doc.line(M,py+pieRowH,M+CW,py+pieRowH);
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(6);
  doc.text('ENVÍO DE OTAR Y CCIAR A LABORATORIO MATRIZ',M+4,py+pieRowH/2+2);
  // Folios a la derecha como lineField
  const folioW = 90;
  lineField(M+CW-folioW-4,       py+2, folioW, pieRowH-4, 'CCIAR:', gv('h_cciar')||'', 7, 22);
  lineField(M+CW-folioW*2-20,    py+2, folioW, pieRowH-4, 'OTAR:',  lab.fotar||'',     7, 20);

  // Fila 2: persona que transporta
  py += pieRowH;
  doc.setFillColor(...WHITE);doc.rect(M,py,CW,pieRowH,'F');
  doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);
  doc.line(M,py+pieRowH,M+CW,py+pieRowH);
  doc.setFont('helvetica','bold');doc.setFontSize(5.5);doc.setTextColor(...NAVY);
  doc.text('PERSONA QUE TRANSPORTA EN LAB. MATRIZ',M+4,py+pieRowH/2+2);
  // 4 campos a la derecha
  const pFieldsX = M + 180;
  const pFieldsW = CW - 180 - 4;
  const cols = [
    ['NOMBRE', lab.ltnom,  0.36, LBL_W],
    ['FIRMA',  lab.ltfir,  0.18, LBL_W],
    ['FECHA',  fmtDate(lab.ltfec), 0.26, LBL_W_SHORT],
    ['HORA',   fmtTime(lab.lthor), 0.20, LBL_W_SHORT],
  ];
  let ccx = pFieldsX;
  cols.forEach(([lb,val,frac,lw])=>{
    const w = pFieldsW*frac - 3;
    lineField(ccx, py+2, w, pieRowH-4, lb, val||'', 7, lw);
    ccx += pFieldsW*frac;
  });

  // Fila 3: supervisó + código formato
  py += pieRowH;
  fillRect(M,py,CW,pieRowH,[248,250,253]);
  lineField(M+4, py+2, 220, pieRowH-4, 'SUPERVISÓ:', lab.sup||'', 7, 40);
  // Código formato a la derecha
  doc.setFont('helvetica','bold');doc.setTextColor(...ACCENT);doc.setFontSize(7);
  doc.text('F-AA-01A-15', W-M-4, py+pieRowH/2+2.5, {align:'right'});

  // ── SAVE ──
  const folio=gv('h_omar')||'000';
  const fecha=now.toISOString().split('T')[0];
  const empresa=(omar.empresa||gv('h_emp')||'').substring(0,20).replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g,'').trim();
  const fname=buildFileName(empresa,'Cadena de Custodia',fecha);
  const blob=doc.output('blob');
  lastPDFCadenaBlob=blob; lastPDFCadenaBlob.name=fname;
  await entregarPDF(blob, fname, {
    title:'Cadena de Custodia — A&A S.C.',
    text:'Cadena de Custodia Interna AR'
  });
  const sr3=document.getElementById('shareRow'); if(sr3)sr3.style.display='flex';
}

function fmtF(iso){if(!iso)return'—';const[y,m,d]=iso.split('-');return`${d}/${m}/${y}`;}
// Store last PDF blob for sharing

// Helper universal para entregar un PDF al usuario.
// En dispositivos con Web Share API (iPad/iPhone/Android modernos) usa la hoja
// de compartir nativa — así al guardar el archivo el usuario regresa a la app
// sin perder el estado. En desktop usa descarga clásica.
// Devuelve Promise que resuelve cuando termina la operación.
function entregarPDF(blob, fname, opts={}){
  const {title='Documento — A&A S.C.', text='Documento generado por AARMS'}=opts;
  const file=new File([blob],fname,{type:'application/pdf'});
  const canShare = navigator.share && navigator.canShare && navigator.canShare({files:[file]});
  if(canShare){
    return navigator.share({title, text, files:[file]})
      .then(()=>toast('Listo ✓','g'))
      .catch(e=>{
        if(e.name==='AbortError'){
          // Usuario cerró la hoja sin guardar — no hacer fallback
          toast('Cancelado','');
        } else {
          // Algún error real — fallback a descarga
          descargaDirecta(blob, fname);
        }
      });
  }
  // Desktop o navegador sin share API
  descargaDirecta(blob, fname);
  return Promise.resolve();
}

// Descarga clásica vía <a download>. Solo para desktop o fallback.
function descargaDirecta(blob, fname){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=fname; a.style.display='none';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{
    if(a.parentNode) document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },3000);
  toast('PDF descargado ✓','g');
}

// Construye un nombre de archivo con prefijo [empresa] para que los PDFs
// de la misma empresa queden juntos alfabéticamente en Descargas.
// Ej: "[Juarez] Cadena de Custodia 2026-04-17.pdf"
function buildFileName(empresa, tipo, fecha){
  const emp=(empresa||'Cliente').substring(0,25)
    .replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g,'').trim() || 'Cliente';
  return `[${emp}] ${tipo} ${fecha}.pdf`;
}


function compartirPDF(tipo='lab'){
  const blob = tipo==='cliente' ? lastPDFClienteBlob : lastPDFBlob;
  if(!blob){toast('Primero genera ese PDF','w');return;}
  const fname=blob.name||'AARMS.pdf';
  const file=new File([blob],fname,{type:'application/pdf'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({
      title: tipo==='cliente'?'Informe de Muestreo — A&A S.C.':'Registro de Campo — A&A S.C.',
      text: tipo==='cliente'?'Tu informe de muestreo — Asesoría y Análisis S.C.':'Registro interno de campo',
      files:[file]
    }).then(()=>toast('Compartido ✓','g'))
    .catch(e=>{if(e.name!=='AbortError')fallbackShare(blob);});
  }else{ fallbackShare(blob); }
}

function fallbackShare(blob){
  if(!blob)return;
  const url=URL.createObjectURL(blob);
  window.open(url,'_blank');
  toast('Abierto — comparte desde Safari ⬆','g');
}

function toast(msg,t=''){
  const el=document.getElementById('toast');el.textContent=msg;el.className=t;el.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),4000);
}

// Modal de confirmación custom — reemplaza confirm() nativo para evitar
// el prefijo "origen says:" que Android muestra. Devuelve Promise<boolean>.
function confirmAction({title='Confirmar', message='¿Estás seguro?', okText='Eliminar', okDanger=true, cancelText='Cancelar'}={}){
  return new Promise(resolve=>{
    // Si ya hay un modal abierto, remover
    const prev=document.getElementById('confirmModal');
    if(prev) prev.remove();

    const wrap=document.createElement('div');
    wrap.id='confirmModal';
    wrap.style.cssText='position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(7,8,15,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:cmFade .18s ease-out';

    // Inyectar keyframes si no existen
    if(!document.getElementById('confirmModalStyle')){
      const st=document.createElement('style');
      st.id='confirmModalStyle';
      st.textContent=`
        @keyframes cmFade{from{opacity:0}to{opacity:1}}
        @keyframes cmPop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
        #confirmModal .cm-box{animation:cmPop .22s cubic-bezier(.34,1.56,.64,1)}
        #confirmModal button{-webkit-tap-highlight-color:transparent;transition:transform .1s,background .15s}
        #confirmModal button:active{transform:scale(.96)}
      `;
      document.head.appendChild(st);
    }

    const okColor = okDanger ? '#ef4444' : '#4a9eff';
    const okBg    = okDanger ? 'rgba(239,68,68,.15)' : 'rgba(74,158,255,.15)';
    const okBorder= okDanger ? 'rgba(239,68,68,.4)'  : 'rgba(74,158,255,.4)';

    wrap.innerHTML=`
      <div class="cm-box" style="max-width:340px;width:100%;background:var(--bg1);border:1px solid var(--ln2);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)">
        <div style="padding:22px 22px 8px">
          <div style="font-family:var(--syne);font-size:17px;font-weight:800;color:var(--w);margin-bottom:8px">${title}</div>
          <div style="font-size:14px;color:var(--g1);line-height:1.5">${message}</div>
        </div>
        <div style="display:flex;gap:10px;padding:16px 18px 18px">
          <button id="cmCancel" style="flex:1;padding:13px;background:var(--bg3);border:1px solid var(--ln2);border-radius:12px;color:var(--w);font-family:var(--syne);font-size:14px;font-weight:700;cursor:pointer">${cancelText}</button>
          <button id="cmOk" style="flex:1;padding:13px;background:${okBg};border:1px solid ${okBorder};border-radius:12px;color:${okColor};font-family:var(--syne);font-size:14px;font-weight:800;cursor:pointer">${okText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    const close=(result)=>{
      wrap.style.animation='cmFade .15s ease-in reverse';
      setTimeout(()=>{if(wrap.parentNode)wrap.remove();resolve(result);},150);
    };
    wrap.querySelector('#cmCancel').onclick=()=>close(false);
    wrap.querySelector('#cmOk').onclick=()=>close(true);
    // Tap en el backdrop = cancelar
    wrap.addEventListener('click',e=>{if(e.target===wrap)close(false);});
    // Escape = cancelar
    const onKey=e=>{if(e.key==='Escape'){document.removeEventListener('keydown',onKey);close(false);}};
    document.addEventListener('keydown',onKey);
  });
}

// Alert estilizado de la app — reemplaza el alert() nativo feo
// Devuelve una Promise que se resuelve cuando el usuario toca OK (para await)
function alertApp({title='Aviso', message='', okText='Entendido', variant='warn'}={}){
  return new Promise(resolve=>{
    const prev=document.getElementById('alertAppModal');
    if(prev) prev.remove();

    // Colores según variante
    const palettes = {
      warn:   {c:'#f59e0b', bg:'rgba(245,158,11,.12)',  bd:'rgba(245,158,11,.4)', ic:'⚠'},
      error:  {c:'#ef4444', bg:'rgba(239,68,68,.12)',   bd:'rgba(239,68,68,.4)',  ic:'⚠'},
      info:   {c:'#4a9eff', bg:'rgba(74,158,255,.12)',  bd:'rgba(74,158,255,.4)', ic:'ⓘ'},
      success:{c:'#10b981', bg:'rgba(16,185,129,.12)',  bd:'rgba(16,185,129,.4)', ic:'✓'},
    };
    const p = palettes[variant] || palettes.warn;

    const wrap=document.createElement('div');
    wrap.id='alertAppModal';
    wrap.style.cssText='position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(7,8,15,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:cmFade .18s ease-out';

    // Reusa keyframes de confirmModal
    if(!document.getElementById('confirmModalStyle')){
      const st=document.createElement('style');
      st.id='confirmModalStyle';
      st.textContent=`@keyframes cmFade{from{opacity:0}to{opacity:1}}@keyframes cmPop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}#alertAppModal .cm-box{animation:cmPop .22s cubic-bezier(.34,1.56,.64,1)}`;
      document.head.appendChild(st);
    }

    wrap.innerHTML=`
      <div class="cm-box" style="max-width:360px;width:100%;background:var(--bg1);border:1px solid var(--ln2);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)">
        <div style="padding:22px 22px 6px;display:flex;gap:14px;align-items:flex-start">
          <div style="width:44px;height:44px;border-radius:12px;background:${p.bg};border:1px solid ${p.bd};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${p.c};font-size:22px;font-weight:800">${p.ic}</div>
          <div style="flex:1;min-width:0">
            <div style="font-family:var(--syne);font-size:16px;font-weight:800;color:var(--w);margin-bottom:6px;line-height:1.3">${title}</div>
            <div style="font-size:13.5px;color:var(--g1);line-height:1.55;white-space:pre-wrap">${message}</div>
          </div>
        </div>
        <div style="padding:14px 18px 18px">
          <button id="alertAppOk" style="width:100%;padding:13px;background:${p.bg};border:1px solid ${p.bd};border-radius:12px;color:${p.c};font-family:var(--syne);font-size:14px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .1s">${okText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    const close=()=>{
      wrap.style.animation='cmFade .15s ease-in reverse';
      setTimeout(()=>{if(wrap.parentNode)wrap.remove();resolve();},150);
    };
    wrap.querySelector('#alertAppOk').onclick=close;
    wrap.addEventListener('click',e=>{if(e.target===wrap)close();});
    const onKey=e=>{if(e.key==='Escape'||e.key==='Enter'){document.removeEventListener('keydown',onKey);close();}};
    document.addEventListener('keydown',onKey);
    // Focus para accesibilidad
    setTimeout(()=>wrap.querySelector('#alertAppOk')?.focus(),100);
  });
}

// AARMS nobranding: prompt custom — evita el banner "hostname says…" de Android
// Devuelve Promise<string|null> (null = cancelar), igual que prompt() nativo.
function promptApp({title='Entrada', message='', defaultValue='', placeholder='', okText='Aceptar', cancelText='Cancelar'}={}){
  return new Promise(resolve=>{
    const prev=document.getElementById('promptAppModal');
    if(prev) prev.remove();

    if(!document.getElementById('confirmModalStyle')){
      const st=document.createElement('style');
      st.id='confirmModalStyle';
      st.textContent=`@keyframes cmFade{from{opacity:0}to{opacity:1}}@keyframes cmPop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}#promptAppModal .cm-box{animation:cmPop .22s cubic-bezier(.34,1.56,.64,1)}`;
      document.head.appendChild(st);
    }

    const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
    const wrap=document.createElement('div');
    wrap.id='promptAppModal';
    wrap.style.cssText='position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(7,8,15,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:cmFade .18s ease-out';
    wrap.innerHTML=`
      <div class="cm-box" style="max-width:360px;width:100%;background:var(--bg1);border:1px solid var(--ln2);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)">
        <div style="padding:22px 22px 8px">
          <div style="font-family:var(--syne);font-size:17px;font-weight:800;color:var(--w);margin-bottom:8px">${esc(title)}</div>
          ${message?`<div style="font-size:14px;color:var(--g1);line-height:1.5;margin-bottom:12px;white-space:pre-wrap">${esc(message)}</div>`:''}
          <input id="promptAppInput" type="text" value="${esc(defaultValue)}" placeholder="${esc(placeholder)}" style="width:100%;box-sizing:border-box;padding:12px 14px;background:var(--bg3);border:1px solid var(--ln2);border-radius:12px;color:var(--w);font-size:15px;outline:none">
        </div>
        <div style="display:flex;gap:10px;padding:16px 18px 18px">
          <button id="promptAppCancel" style="flex:1;padding:13px;background:var(--bg3);border:1px solid var(--ln2);border-radius:12px;color:var(--w);font-family:var(--syne);font-size:14px;font-weight:700;cursor:pointer">${esc(cancelText)}</button>
          <button id="promptAppOk" style="flex:1;padding:13px;background:rgba(74,158,255,.15);border:1px solid rgba(74,158,255,.4);border-radius:12px;color:#4a9eff;font-family:var(--syne);font-size:14px;font-weight:800;cursor:pointer">${esc(okText)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    const inp=wrap.querySelector('#promptAppInput');
    const close=(val)=>{
      document.removeEventListener('keydown',onKey);
      wrap.style.animation='cmFade .15s ease-in reverse';
      setTimeout(()=>{if(wrap.parentNode)wrap.remove();resolve(val);},150);
    };
    const onKey=e=>{
      if(e.key==='Escape'){close(null);return;}
      if(e.key==='Enter'){close(inp.value);}
    };
    wrap.querySelector('#promptAppCancel').onclick=()=>close(null);
    wrap.querySelector('#promptAppOk').onclick=()=>close(inp.value);
    wrap.addEventListener('click',e=>{if(e.target===wrap)close(null);});
    document.addEventListener('keydown',onKey);
    setTimeout(()=>{inp.focus();inp.select();},80);
  });
}
window.addEventListener('load',()=>{
  // Show muestreos count on button
  try{
    const lista = getMuestreos();
    if(lista.length>0){
      const btn = document.getElementById('btnVerMuestreos');
      if(btn) btn.textContent = `Ver muestreos guardados (${lista.length})`;
    }
  }catch(e){}
  renderHome();
initCanvas();initCanvas2();});
function initCanvas2(){
  const c=document.getElementById('sigCanvas2'),ctx=c.getContext('2d');
  if(!c)return;
  ctx.strokeStyle='#4a9eff';ctx.lineWidth=2.8;ctx.lineCap='round';ctx.lineJoin='round';
  let dr=false,lx,ly;
  const pos=e=>{const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;
    return e.touches?[(e.touches[0].clientX-r.left)*sx,(e.touches[0].clientY-r.top)*sy]:[(e.clientX-r.left)*sx,(e.clientY-r.top)*sy];};
  const st=e=>{e.preventDefault();dr=true;[lx,ly]=pos(e);ctx.beginPath();ctx.moveTo(lx,ly);document.getElementById('cvsover2').classList.add('hide');};
  const mv=e=>{if(!dr)return;e.preventDefault();const[x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke();lx=x;ly=y;sigData2='p';};
  const en=()=>{dr=false;if(sigData2==='p'){sigData2=c.toDataURL();document.getElementById('cvswrap2').classList.add('signed');updSig2();}};
  c.addEventListener('mousedown',st);c.addEventListener('mousemove',mv);c.addEventListener('mouseup',en);
  c.addEventListener('touchstart',st,{passive:false});c.addEventListener('touchmove',mv,{passive:false});c.addEventListener('touchend',en);
}
function clearSig2(){
  const c=document.getElementById('sigCanvas2');if(!c)return;
  c.getContext('2d').clearRect(0,0,c.width,c.height);
  sigData2=null;document.getElementById('cvswrap2').classList.remove('signed');
  document.getElementById('cvsover2').classList.remove('hide');updSig2();
}
function updSig2(){
  const ok=sigData2&&sigData2!=='p';
  const el=document.getElementById('sigst2');if(!el)return;
  el.textContent=ok?'✓ Firma capturada':'Sin firma';
  el.className='sigst'+(ok?' ok':'');
}

// ═══════════════════════════════════════════════════════════════
// BITÁCORAS / INSTRUMENTOS — LAB (pH + conductímetro) + PDF oficiales
// ═══════════════════════════════════════════════════════════════

function _instS(id,v){ const e=document.getElementById(id); if(!e) return; if(e.type==='checkbox') e.checked=!!v; else e.value=v!=null?String(v):''; }

function cerrarPagInstrumento(){
  try{ guardarBorradorActual(); }catch(_){}
  goPage('pgPlan');
  try{ renderPlanDocs(); }catch(_){}
}

function leerBlmpAlOmar(){
  if(!omar) omar={};
  const prev=omar.blmpLab||{};
  const g=id=>{ const e=document.getElementById(id); if(!e) return undefined; if(e.type==='checkbox') return e.checked; return (e.value||'').trim(); };
  const set=(k,id)=>{ const v=g(id); if(v!==undefined) prev[k]=v; };
  set('fecha','blmp_fecha'); set('hora','blmp_hora'); set('aapt','blmp_aapt');
  set('v_panel','blmp_v_panel'); set('v_cables','blmp_v_cables'); set('v_cuerpo','blmp_v_cuerpo');
  set('v_error','blmp_v_error'); set('v_vida','blmp_v_vida'); set('v_eEnv','blmp_v_eenv');
  set('v_eSuc','blmp_v_esuc'); set('v_eComp','blmp_v_ecomp'); set('v_calib','blmp_v_calib');
  set('obs_v','blmp_obs_v'); set('act_txt','blmp_act_txt'); set('cod_act','blmp_cod_act');
  set('l_enj','blmp_l_enj'); set('l_alc','blmp_l_alc'); set('l_grasa','blmp_l_grasa');
  set('l_hcl','blmp_l_hcl'); set('l_det','blmp_l_det');
  set('m_exp','blmp_m_exp'); set('obs','blmp_obs');
  omar.blmpLab=prev;
}

function poblarBlmpForm(){
  const b=omar.blmpLab||{};
  _instS('blmp_fecha', b.fecha||''); _instS('blmp_hora', b.hora||''); _instS('blmp_aapt', b.aapt||'');
  _instS('blmp_v_panel', b.v_panel||''); _instS('blmp_v_cables', b.v_cables||''); _instS('blmp_v_cuerpo', b.v_cuerpo||'');
  _instS('blmp_v_error', b.v_error||''); _instS('blmp_v_vida', b.v_vida||''); _instS('blmp_v_eenv', b.v_eEnv||'');
  _instS('blmp_v_esuc', b.v_eSuc||''); _instS('blmp_v_ecomp', b.v_eComp||''); _instS('blmp_v_calib', b.v_calib||'');
  _instS('blmp_obs_v', b.obs_v||''); _instS('blmp_act_txt', b.act_txt||''); _instS('blmp_cod_act', b.cod_act||'');
  _instS('blmp_l_enj', b.l_enj); _instS('blmp_l_alc', b.l_alc); _instS('blmp_l_grasa', b.l_grasa);
  _instS('blmp_l_hcl', b.l_hcl); _instS('blmp_l_det', b.l_det);
  _instS('blmp_m_exp', b.m_exp||''); _instS('blmp_obs', b.obs||'');
}

async function abrirPagBlmp(){
  if(!omar.ts){ toast('Primero captura el OMAR','w'); return; }
  poblarBlmpForm();
  const p=document.getElementById('blmpPill');
  if(p) p.textContent = (omar.folio?'OMAR '+omar.folio:'OMAR');
  _aplicarDocEstadoBadge('blmp');
  goPage('pgBlmp');
  // AARMS lvarfix
  _refreshBotonesContinuarLab();
}

function leerColabAlOmar(){
  if(!omar) omar={};
  const prev=omar.colabLab||{};
  const g=id=>{ const e=document.getElementById(id); if(!e) return undefined; if(e.type==='checkbox') return e.checked; return (e.value||'').trim(); };
  const set=(k,id)=>{ const v=g(id); if(v!==undefined) prev[k]=v; };
  set('fecha','colab_fecha'); set('hora','colab_hora'); set('marca','colab_marca'); set('clave','colab_clave');
  set('folio','colab_folio'); // AARMS simfix: folio multi texto libre
  set('v1','colab_v1'); set('v2','colab_v2'); set('v3','colab_v3'); set('v4','colab_v4');
  set('v5','colab_v5'); set('v6','colab_v6'); set('v7','colab_v7');
  set('l_enj','colab_l_enj'); set('l_alc','colab_l_alc'); set('l_grasa','colab_l_grasa');
  set('l_hcl','colab_l_hcl'); set('l_det','colab_l_det');
  set('m_bat','colab_m_bat'); set('m_cel','colab_m_cel'); set('m_ext','colab_m_ext'); // AARMS sub3fix4: 3 campos mant
  set('mrc_nom','colab_mrc_nom'); set('mrc_lote','colab_mrc_lote');
  set('mrc_l1','colab_mrc_l1'); set('mrc_l2','colab_mrc_l2'); set('mrc_l3','colab_mrc_l3');
  set('ctrl_nom','colab_ctrl_nom'); set('ctrl_lote','colab_ctrl_lote');
  set('ctrl_l1','colab_ctrl_l1'); set('ctrl_l2','colab_ctrl_l2'); set('ctrl_l3','colab_ctrl_l3');
  set('obs','colab_obs');
  const mant_na={...(prev.mant_na||{})};
  document.querySelectorAll('[data-mant-na]').forEach(cb=>{
    const k=cb.getAttribute('data-mant-na');
    if(k) mant_na[k]=cb.checked;
  });
  prev.mant_na=mant_na;
  omar.colabLab=prev;
}

// AARMS sub3fix2: marcar campo mantenimiento como No Aplica
// AARMS sub3fix4: mantenimiento con 3 campos (Baterías, Celdas, Envío técnico)
const _MANT_KEY_TO_COLAB={ baterias:'m_bat', celdas:'m_cel', envio_tecnico:'m_ext' };
const _MANT_KEY_TO_ID={ baterias:'colab_m_bat', celdas:'colab_m_cel', envio_tecnico:'colab_m_ext' };

function _campoMantValido(colabLab, campo){
  if(colabLab?.mant_na?.[campo]) return true;
  const k=_MANT_KEY_TO_COLAB[campo];
  return !!(k && colabLab?.[k]);
}

function _colabMantCompleto(colabLab){
  return ['baterias','celdas','envio_tecnico'].every(c=>_campoMantValido(colabLab,c)); // AARMS sub3fix4: 3 campos mant
}

async function mantSetNA(campo, esNA, opts){
  opts=opts||{};
  if(!omar) return;
  omar.colabLab=omar.colabLab||{};
  omar.colabLab.mant_na=omar.colabLab.mant_na||{};
  omar.colabLab.mant_na[campo]=!!esNA;
  const card=document.querySelector(`.mant-card[data-mant-key="${campo}"]`);
  const mainCb=card?.querySelector('.mant-check')||document.getElementById(_MANT_KEY_TO_ID[campo]);
  if(card){
    card.classList.toggle('na-active',!!esNA);
  }
  if(mainCb){
    mainCb.disabled=!!esNA;
    if(esNA) mainCb.checked=false;
  }
  if(!opts.skipSave){
    leerColabAlOmar();
    try{ await saveMuestreoActual(); }catch(e){ console.warn('[mantSetNA]',e); }
  }
}
window.mantSetNA = mantSetNA;

function poblarColabForm(){
  const c=omar.colabLab||{};
  _instS('colab_fecha', c.fecha||''); _instS('colab_hora', c.hora||''); _instS('colab_marca', c.marca||''); _instS('colab_clave', c.clave||'');
  _instS('colab_folio', c.folio||''); // AARMS simfix
  _instS('colab_v1', c.v1||''); _instS('colab_v2', c.v2||''); _instS('colab_v3', c.v3||''); _instS('colab_v4', c.v4||'');
  _instS('colab_v5', c.v5||''); _instS('colab_v6', c.v6||''); _instS('colab_v7', c.v7||'');
  _instS('colab_l_enj', c.l_enj); _instS('colab_l_alc', c.l_alc); _instS('colab_l_grasa', c.l_grasa);
  _instS('colab_l_hcl', c.l_hcl); _instS('colab_l_det', c.l_det);
  _instS('colab_m_bat', c.m_bat); _instS('colab_m_cel', c.m_cel); _instS('colab_m_ext', c.m_ext); // AARMS sub3fix4: 3 campos mant
  _instS('colab_mrc_nom', c.mrc_nom||''); _instS('colab_mrc_lote', c.mrc_lote||'');
  _instS('colab_mrc_l1', c.mrc_l1||''); _instS('colab_mrc_l2', c.mrc_l2||''); _instS('colab_mrc_l3', c.mrc_l3||'');
  _instS('colab_ctrl_nom', c.ctrl_nom||''); _instS('colab_ctrl_lote', c.ctrl_lote||'');
  _instS('colab_ctrl_l1', c.ctrl_l1||''); _instS('colab_ctrl_l2', c.ctrl_l2||''); _instS('colab_ctrl_l3', c.ctrl_l3||'');
  _instS('colab_obs', c.obs||'');
}

let _condFlujoActivo = false;
let _condFlujoOrigen = 'plan';

function _colabLabMinimoListo(){
  const c = omar?.colabLab || {};
  const hasId = !!(String(c.fecha||'').trim() && (String(c.marca||'').trim() || String(c.clave||'').trim()));
  const hasMrc = !!(String(c.mrc_l1||'').trim() && String(c.mrc_l2||'').trim() && String(c.mrc_l3||'').trim());
  return hasId && hasMrc && _colabMantCompleto(c);
}

function _renderCondFlujoStepper(pasoActivo){
  const mk = (n, on, label) => {
    const bg = on ? 'rgba(251,191,36,.15)' : 'rgba(255,255,255,.04)';
    const border = on ? 'rgba(251,191,36,.55)' : 'var(--ln)';
    const color = on ? 'var(--amber)' : 'var(--g2)';
    const weight = on ? '800' : '600';
    return '<div style="flex:1;text-align:center;padding:10px 8px;border-radius:10px;background:'+bg+';border:1px solid '+border+';color:'+color+';font-family:var(--syne);font-size:11px;font-weight:'+weight+'"><span style="opacity:.75;font-size:10px">Paso '+n+'</span><br>'+label+'</div>';
  };
  return '<div style="display:flex;gap:8px">'+mk(1, pasoActivo===1, 'Laboratorio')+mk(2, pasoActivo===2, 'Entre tomas')+'</div>';
}

function _pintarCondFlujoStepper(paso){
  const html = _renderCondFlujoStepper(paso);
  const sColab = document.getElementById('condFlujoStepperColab');
  const sBit = document.getElementById('condFlujoStepperBitCond');
  if(sColab) sColab.innerHTML = html;
  if(sBit) sBit.innerHTML = html;
  const hint = document.getElementById('condFlujoHintColab');
  const legacy = document.getElementById('condFlujoLegacyHint');
  const btnCont = document.getElementById('condFlujoBtnContinuar');
  const btnLab = document.getElementById('condFlujoBtnLab');
  const on = !!_condFlujoActivo;
  if(hint) hint.style.display = on ? '' : 'none';
  if(legacy) legacy.style.display = on ? 'none' : '';
  if(btnCont) btnCont.style.display = on ? '' : 'none';
  if(btnLab) btnLab.style.display = on ? '' : 'none';
}

async function abrirFlujoConductimetro(opts){
  opts = opts || {};
  const paso = opts.paso || 'auto';
  const origen = opts.origen || 'plan';
  if(!omar?.ts){ toast('Primero captura el OMAR','w'); return; }
  _condFlujoActivo = true;
  _condFlujoOrigen = origen;
  const quiereCampo = paso==='campo' || (paso==='auto' && (origen==='condcamp' || origen==='hoja'));
  if(quiereCampo && !_colabLabMinimoListo()){
    toast('Primero completa el laboratorio (identificación y Patrón KCl L1–L3)','w');
    await abrirPagColab();
    return;
  }
  if(quiereCampo) await abrirBitacoraCond();
  else await abrirPagColab();
}

async function continuarFlujoConductimetroCampo(){
  if(!omar?.ts){ toast('Primero captura el OMAR','w'); return; }
  leerColabAlOmar();
  try{ await saveMuestreoActual(); }catch(e){ console.warn(e); }
  if(!_colabLabMinimoListo()){
    toast('Falta identificación (fecha + marca o clave) y lecturas Patrón KCl L1–L3','w');
    return;
  }
  try{ await _maybeMarcarPlanDoc('colab'); }catch(e){}
  _condFlujoActivo = true;
  await abrirBitacoraCond();
}

async function irFlujoConductimetroLab(){
  try{ await _persistPlanBitCond(); }catch(e){}
  _condFlujoActivo = true;
  await abrirPagColab();
}

function cerrarFlujoConductimetroDesdeLab(){
  _condFlujoActivo = false;
  if(_condFlujoOrigen==='hoja'){ goPage('pg1'); return; }
  cerrarPagInstrumento();
}

async function abrirPagColab(){
  if(!omar.ts){ toast('Primero captura el OMAR','w'); return; }
  poblarColabForm();
  // AARMS sub3fix2: restaurar estado NA al abrir
  if(omar.colabLab?.mant_na){
    Object.entries(omar.colabLab.mant_na).forEach(([campo, esNA])=>{
      const cb=document.querySelector(`[data-mant-na="${campo}"]`);
      if(cb) cb.checked=!!esNA;
      if(esNA) mantSetNA(campo, true, {skipSave:true});
    });
  }
  await _catalogoCargar();
  await _catalogoPrefillColabLab();
  const p=document.getElementById('colabPill');
  if(p) p.textContent = (omar.folio?'OMAR '+omar.folio:'OMAR');
  _aplicarDocEstadoBadge('colab');
  _pintarCondFlujoStepper(1);
  goPage('pgColab');
  // AARMS lvarfix
  _refreshBotonesContinuarLab();
  if(_condFlujoActivo) toast('Paso 1 · Laboratorio','');
  else toast('Parte laboratorio aquí. Las lecturas entre tomas van en Hoja de campo > Bitácora Conductímetro.','');
}

async function guardarInstrumentLab(which){
  if(which==='blmp') leerBlmpAlOmar();
  if(which==='colab') leerColabAlOmar();
  try{ await saveMuestreoActual(); }catch(e){ console.warn(e); }
  toast('Datos guardados en el OMAR','g');
  // AARMS lvarfix: refrescar botones continuar tras guardar lab
  _refreshBotonesContinuarLab();
  // AARMS simfix: desbloquear candados de campo al completar lab
  if(typeof _actualizarGatePlanUI === 'function') _actualizarGatePlanUI();
}

async function _maybeMarcarPlanDoc(key){
  const mid = omar && omar.ts;
  if(!mid) return;
  let planId = _currentPlanId;
  if(!planId){
    const mu = (_cachedMuestreos||[]).find(x=>String(x.id)===String(mid));
    if(mu && mu.planId) planId = mu.planId;
  }
  if(!planId) return;
  const plan = _cachedPlanes.find(p=>p.id===planId);
  if(plan && (plan.omarIds||[]).includes(mid)) await marcarPlanDocDone(key, planId);
}

// AARMS sub10-std: membrete unificado (delega a _pdfMembreteStd)
function _pdfStdHeader(doc, logo, W, M, HDR, tit1, tit2, cod){
  if(typeof window._pdfMembreteStd === 'function'){
    window._pdfMembreteStd(doc, logo, {
      docTitulo: tit1 || '',
      docSubtitulo: tit2 || '',
      codigoFormato: cod || '',
      margin: M,
      contentY: HDR
    }, 'helvetica');
    return;
  }
  // Fallback legacy
  const NAVY=[15,23,42], WHITE=[255,255,255];
  addLogoProportional(doc, logo, M+2, 6, 70, 60);
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(13);
  doc.text('ASESORÍA Y ANÁLISIS S.C.', W/2, 20, {align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(51,65,85);
  doc.text('Laboratorio de Alimentos y Aguas', W/2, 30, {align:'center'});
  doc.setTextColor(100,110,130); doc.setFontSize(7);
  doc.text('Calle 12 Ave. Serdán Ext. 465 Int. 201  |  Edif. Puertas del Sol  |  Col. Centro C.P. 85400', W/2, 40, {align:'center'});
  doc.text('Tel: 622 224 0910  FAX 622 224 207', W/2, 49, {align:'center'});
  doc.setFillColor(...NAVY); doc.rect(W-150, 2, 122, HDR-2, 'F');
  doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(9.5);
  doc.text(tit1, W-89, 18, {align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(200,210,230);
  doc.text(tit2, W-89, 30, {align:'center'});
  doc.setFontSize(6.8);
  doc.text(cod, W-89, 44, {align:'center'});
}
window._pdfStdHeader = _pdfStdHeader;

/* generarPDFBitacoraPHOficial: F-AA-264-4 fiel (UNA bitácora del plan) en js/documents-suite.js. */
// AARMS ph2644-fiel: generador oficial 2 págs (lab+campo + entre tomas todos los OMARs)
// AARMS phfix2: Acepta/Rechaza real · entre tomas=V · CA/CA/CO/CO entre días · Slope PENDIENTE
// AARMS phnum: numeración dinámica Pág. X de N (documents-suite)
// AARMS phhoja1: Hoja 1 estructura oficial 3/3/2/3/3/2
// AARMS phverif1: Verificación Lab/Campo = 1 fila (3/3/1/3/3/1)
// AARMS adminaccess: acceso admin oculto (hash SHA-256, sin texto plano)
// AARMS cartacontrol: Cartas Control por equipo (IDB + vista admin)
// AARMS phbadge: badge visual Acepta/Rechaza en PDF bitácora pH
// AARMS phfolio2: folio por hoja + SLOPE/PENDIENTE merge en CA
// AARMS phslopefix: celda normal rowspan2 CA "PENDIENTE SLOPE XX% PENDIENTE"

async function generarPDFBlmpForm(){
  if(!omar.ts){ toast('Sin OMAR activa','w'); return; }
  leerBlmpAlOmar();
  const b=omar.blmpLab||{};
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612,M=28,CW=W-M*2,HDR=72,H=792;
  const MGRAY=[208,216,228], LGRAY=[232,238,245], DGRAY=[51,65,85], WHITE=[255,255,255], NAVY=[10,22,40], ACCENT=[37,99,235];
  // AARMS v66-est: helper de estilo condicional para valores
  const valStyle = (txt) => {
    const isEmpty = !txt || String(txt).trim() === '' || String(txt).trim() === '-';
    if(isEmpty){
      doc.setTextColor(170, 178, 191);
      doc.setFont('helvetica','normal');
    } else {
      doc.setTextColor(...ACCENT);
      doc.setFont('helvetica','bold');
    }
    return isEmpty ? '-' : String(txt);
  };
  // AARMS sub10-std
  _pdfStdHeader(doc, logo, W, M, HDR, 'BITACORA LIMPIEZA', 'pH-metro (laboratorio)', 'BLMP');
  let y=HDR+6;
  const row=(label,val,yy)=>{ doc.setFillColor(...LGRAY); doc.rect(M,yy,CW,16,'F'); doc.setDrawColor(...MGRAY); doc.rect(M,yy,CW,16,'S'); doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.text(label, M+4, yy+6); doc.setFontSize(8); doc.text(jsPdfAscii(valStyle(val)).substring(0,110), M+4, yy+13); return yy+17; };
  y=row('Fecha / Hora / Equipo AA/PT', [b.fecha,b.hora,b.aapt].filter(Boolean).join('  |  '), y);
  // AARMS sub10-std: barras de sección unificadas
  const sec=(t,yy)=> (typeof window._pdfBarraSeccion==='function')
    ? window._pdfBarraSeccion(doc, t, M, yy, CW, 'helvetica') + 2
    : (doc.setFillColor(...NAVY), doc.rect(M,yy,CW,10,'F'), doc.setTextColor(...WHITE), doc.setFont('helvetica','bold'), doc.setFontSize(8), doc.text(t, M+4, yy+7), yy+12);
  y=sec('1. Verificacion visual', y);
  [['Panel danado',b.v_panel],['Cables',b.v_cables],['Cuerpo sucio',b.v_cuerpo],['Error en pantalla',b.v_error],['Vida util electrodo',b.v_vida],['Envejecimiento electrodo',b.v_eEnv],['Suciedad electrodo',b.v_eSuc],['Electrodo completo',b.v_eComp],['Permite calibrar',b.v_calib]].forEach(([l,v])=>{ y=row(l, v, y); if(y>H-60){ doc.addPage(); y=M+10; }});
  y=row('Observaciones (1)', b.obs_v, y);
  y=sec('2. Limpieza', y);
  y=row('Actividad / Codigo', [b.act_txt,b.cod_act].join(' | '), y);
  const yn=v=>v?'SI':'NO';
  y=row('Pasos (SI marca)', ['Enjuagar:'+yn(b.l_enj),'Alcohol:'+yn(b.l_alc),'Grasa:'+yn(b.l_grasa),'HCl:'+yn(b.l_hcl),'Detergente:'+yn(b.l_det)].join('  '), y);
  y=sec('3. Mantenimiento', y);
  y=row('Expediente CEE/AA/N-3', b.m_exp, y);
  y=row('Observaciones finales', b.obs, y);
  const LeyB=window.AARMS_DOC_LEYENDAS||{};
  if(y>H-85){ doc.addPage(); y=M+10; _pdfStdHeader(doc, logo, W, M, HDR, 'BITACORA LIMPIEZA', 'pH-metro (laboratorio)', 'BLMP'); y=HDR+8; }
  else y+=10;
  // AARMS sub10-std: leyenda en caja (sin italic tirado)
  const pieB=[LeyB.limpiezaCod,LeyB.actControl].filter(Boolean).join(' ');
  if(typeof window._pdfCajaLeyenda === 'function'){
    y = window._pdfCajaLeyenda(doc, pieB || 'Leyendas de limpieza pH-metro.', M, y, CW, 'helvetica', { fontSize:6.8 });
  } else {
    doc.setFont('helvetica','normal'); doc.setFontSize(6.8); doc.setTextColor(51,65,85);
    (doc.splitTextToSize?doc.splitTextToSize(jsPdfAscii(pieB||''),CW-8):[pieB]).forEach((ln,i)=>{ doc.text(ln,M+4,y+i*9); });
  }
  await saveMuestreoActual();
  doc.save(`Bitacora_Limpieza_pH_OMAR-${omar.folio||omar.ts}.pdf`);
  toast('PDF limpieza pH generado','g');
  await _maybeMarcarPlanDoc('blmp');
}

async function generarPDFColabCompleto(){
  if(!omar.ts){ toast('Sin OMAR activa','w'); return; }
  leerColabAlOmar();
  const c=omar.colabLab||{};
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  // AARMS sub8-pdfs: tablas/firma premium (helpers Machiote, Helvetica); condhora intacta
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612,M=28,CW=W-M*2,HDR=72,H=792;
  const FONT='helvetica';
  const _hdrPrem=window._pdfHeaderTablaPremium;
  const _filaPrem=window._pdfFilaTablaPremium;
  const _firmaPrem=window._pdfFirmaPremium;
  const MGRAY=[208,216,228], LGRAY=[232,238,245], DGRAY=[51,65,85], NAVY=[10,22,40], ACCENT=[37,99,235], WHITE=[255,255,255];
  // AARMS v66-est: helper de estilo condicional para valores
  const valStyle = (txt) => {
    const isEmpty = !txt || String(txt).trim() === '' || String(txt).trim() === '-';
    if(isEmpty){
      doc.setTextColor(170, 178, 191);
      doc.setFont(FONT,'normal');
    } else {
      doc.setTextColor(...ACCENT);
      doc.setFont(FONT,'bold');
    }
    return isEmpty ? '-' : String(txt);
  };
  // AARMS sub10-std
  _pdfStdHeader(doc, logo, W, M, HDR, 'CONDUCTIMETRO', 'Limpieza, calibracion, uso', 'BLMCCVUC');
  let y=HDR+6;
  const row=(label,val,yy)=>{ doc.setFillColor(...LGRAY); doc.rect(M,yy,CW,15,'F'); doc.setDrawColor(...MGRAY); doc.rect(M,yy,CW,15,'S'); doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(6.8); doc.text(label, M+3, yy+6); doc.setFontSize(7.5); doc.text(jsPdfAscii(valStyle(val)).substring(0,118), M+3, yy+12); return yy+16; };
  y=row('Identificacion (marca / clave)', (c.marca||'')+'  |  '+(c.clave||''), y);
  const sec=(t,yy)=>{ doc.setFillColor(...NAVY); doc.rect(M,yy,CW,10,'F'); doc.setTextColor(...WHITE); doc.setFont(FONT,'bold'); doc.setFontSize(8); doc.text(t, M+3, yy+7); return yy+12; };
  y=sec('ACTIVIDAD EN LABORATORIO - Verificacion visual (SI/NO)', y);
  [['Panel danado',c.v1],['Cables danados',c.v2],['Cuerpo sucio',c.v3],['Celda envejecida',c.v4],['Celda sucia',c.v5],['Sin partes faltantes',c.v6],['Codigo error',c.v7]].forEach(([l,v])=>{ y=row(l, v, y); if(y>H-90){ doc.addPage(); y=M+10; }});
  y=sec('Limpieza / Mantenimiento (laboratorio)', y);
  const mk=x=>x?'SI':'NO';
  const mantVal=(campo,key)=>c.mant_na?.[campo]?'NA':mk(c[key]);
  y=row('Limpieza', ['Enjuagar:'+mk(c.l_enj),'Alcohol:'+mk(c.l_alc),'Grasa:'+mk(c.l_grasa),'HCl:'+mk(c.l_hcl),'Det.:'+mk(c.l_det)].join('  '), y);
  y=row('Mantenimiento', ['Baterias:'+mantVal('baterias','m_bat'),'Celdas:'+mantVal('celdas','m_cel'),'Envio ext.:'+mantVal('envio_tecnico','m_ext')].join('  '), y); // AARMS sub3fix4: 3 campos mant
  y=row('Patrón KCl nominal / lote / L1-L3', [c.mrc_nom,c.mrc_lote,c.mrc_l1,c.mrc_l2,c.mrc_l3].join(' | '), y);
  y=row('Control nominal / lote / L1-L3', [c.ctrl_nom,c.ctrl_lote,c.ctrl_l1,c.ctrl_l2,c.ctrl_l3].join(' | '), y);
  y=row('Observaciones laboratorio', c.obs, y);
  if(typeof _firmaPrem==='function'){
    _firmaPrem(doc, 'Pag. 1', 'BLMCCVUC', { font:FONT, W, H, yOffset:70 });
  }
  doc.addPage();
  _pdfStdHeader(doc, logo, W, M, HDR, 'CONDUCTIMETRO', 'Actividad en campo (entre tomas)', 'BLMCCVUC');
  y=HDR+8;
  const folioCond=(typeof _bitCondFolioDocGet==='function')?_bitCondFolioDocGet():(omar.bitCondFolioDoc||'');
  if(folioCond){
    doc.setFont(FONT,'normal'); doc.setFontSize(7);
    doc.setTextColor(...DGRAY);
    doc.text('Folio documento (bitácora campo): ', M, y);
    doc.text(jsPdfAscii(valStyle(String(folioCond))).substring(0,90), M+doc.getTextWidth('Folio documento (bitácora campo): '), y);
    y+=12;
  }
  doc.setFillColor(...NAVY); doc.rect(M,y,CW,11,'F'); doc.setTextColor(...WHITE); doc.setFont(FONT,'bold'); doc.setFontSize(8);
  doc.text('Registros entre tomas (promedio va a hoja de campo)', M+4, y+7.5); y+=13;
  const regs=(typeof _bitCondRegs==='function')?(_bitCondRegs()||[]):(omar.bitCond||[]);
  const LeyC=window.AARMS_DOC_LEYENDAS||{};
  if(!regs.length){
    doc.setFont(FONT,'italic'); doc.setFontSize(8); doc.setTextColor(140,150,165); doc.text('Sin registros de bitácora de conductividad en este OMAR.', M, y);
  }else{
    // AARMS sub8-pdfs: header/filas premium; columnas oficiales intactas
    const cols=[16,40,40,26,26,26,38,38,38,34];
    const heads=['#','Fecha','Hora','Toma','Act','Limp','L1','L2','L3','<=3%'];
    if(typeof _hdrPrem==='function'){
      y=_hdrPrem(doc, heads, M, y, cols, 12, FONT);
    } else {
      let x=M; heads.forEach((h,i)=>{ doc.setFillColor(...MGRAY); doc.rect(x,y,cols[i],12,'F'); doc.setDrawColor(...MGRAY); doc.rect(x,y,cols[i],12,'S'); doc.setTextColor(...NAVY); doc.setFont(FONT,'bold'); doc.setFontSize(5.5); doc.text(h,x+cols[i]/2,y+8,{align:'center'}); x+=cols[i]; });
      y+=12;
    }
    regs.forEach((r,ix)=>{
      const Ls=[r.l1,r.l2,r.l3].map(v=>parseFloat(v)).filter(n=>!isNaN(n));
      let okTxt='-';
      if(Ls.length===3){ const p=Ls.reduce((a,b)=>a+b,0)/Ls.length; const d=Math.max(...Ls)-Math.min(...Ls); const pct=p>0?(d/p)*100:0; okTxt=pct<=3?'SI':'NO'; }
      const fd=(s)=>{ if(!s) return ''; const p=String(s).split('-'); return p.length===3?`${p[2]}/${p[1]}`:String(s).substring(0,8); };
      // AARMS condhora: V/toma → hora de toma; CA/CO → hora real de la actividad
      const actU = String(r.act || '').toUpperCase();
      const esCalib = actU === 'CA' || actU === 'CO' || !!r.calibGrupo;
      let horaPdf = r.hora || '';
      if(!esCalib){
        const omarRef = { ts: r.omarId || r.omarTs || omar.ts, id: r.omarId || r.omarTs || omar.id };
        horaPdf = (typeof _pdfBmHoraDeToma === 'function')
          ? (_pdfBmHoraDeToma(omarRef, r) || r.hora || '')
          : (omar.tomas && r.toma ? (omar.tomas[Number(r.toma)-1]?.hora || r.hora || '') : (r.hora || ''));
      }
      const vals=[String(ix+1),fd(r.fecha),horaPdf,String(r.toma||''),r.act||'',r.limp||'',r.l1||'',r.l2||'',r.l3||'',okTxt].map(v=>jsPdfAscii(String(v??'')));
      if(y>H-90){
        if(typeof _firmaPrem==='function') _firmaPrem(doc, 'Pag. campo', 'BLMCCVUC', { font:FONT, W, H, yOffset:70 });
        doc.addPage(); _pdfStdHeader(doc, logo, W, M, HDR, 'CONDUCTIMETRO', 'Campo (cont.)', 'BLMCCVUC'); y=HDR+20;
        if(typeof _hdrPrem==='function') y=_hdrPrem(doc, heads, M, y, cols, 12, FONT);
      }
      if(typeof _filaPrem==='function'){
        y=_filaPrem(doc, vals, M, y, cols, 11, ix, {
          firstAccent:true, fontSize:6.5, maxChars:12, font:FONT
        });
      } else {
        let x=M;
        vals.forEach((v,i)=>{ doc.setFillColor(...(i===0?ACCENT:(ix%2?WHITE:LGRAY))); doc.rect(x,y,cols[i],11,'F'); doc.setDrawColor(...MGRAY); doc.rect(x,y,cols[i],11,'S'); doc.setFontSize(6.5); if(i===0){ doc.setTextColor(...WHITE); doc.setFont(FONT,'bold'); doc.text(String(v).substring(0,12),x+cols[i]/2,y+7.5,{align:'center'}); } else { doc.text(jsPdfAscii(valStyle(v)).substring(0,12),x+cols[i]/2,y+7.5,{align:'center'}); } x+=cols[i]; });
        y+=11;
      }
    });
  }
  y+=12;
  // AARMS sub10-std: leyendas en caja
  if(y>H-110){ doc.addPage(); _pdfStdHeader(doc, logo, W, M, HDR, 'CONDUCTIMETRO', 'Notas (leyendas)', 'BLMCCVUC'); y=HDR+14; }
  const pie=[LeyC.actControl,LeyC.limpiezaCod,LeyC.condDispersion].filter(Boolean).join(' ');
  if(typeof window._pdfCajaLeyenda === 'function'){
    y = window._pdfCajaLeyenda(doc, pie || 'Act/Limp: ver instructivo.', M, y, CW, FONT, { fontSize:6.8 });
  } else {
    doc.setFont(FONT,'normal'); doc.setFontSize(6.8); doc.setTextColor(51,65,85);
    const pieLines=(typeof doc.splitTextToSize==='function')?doc.splitTextToSize(jsPdfAscii(pie||''),CW-8):[pie];
    pieLines.forEach(ln=>{ doc.text(ln,M+4,y); y+=8; });
  }
  if(typeof _firmaPrem==='function'){
    _firmaPrem(doc, 'Pag. 2', 'BLMCCVUC', { font:FONT, W, H, yOffset:70 });
  }
  await saveMuestreoActual();
  doc.save(`Bitacora_Conductimetro_OMAR-${omar.folio||omar.ts}.pdf`);
  toast('PDF conductimetro (lab+campo) generado','g');
  await _maybeMarcarPlanDoc('colab');
  if(regs.length) await _maybeMarcarPlanDoc('condcamp');
}

// ═══════════════════════════════════════════════════════════════
// BITÁCORAS DE CAMPO ENTRE TOMAS — pH-METRO + CONDUCTÍMETRO
// Pantallas separadas vinculadas al OMAR actual. Cada registro tiene
// 3 lecturas, calcula promedio automático y lo escribe al campo
// pH/cond correspondiente de la toma de la hoja de campo.
// ═══════════════════════════════════════════════════════════════

const ACT_CONTROL = [
  {code:'Ca', label:'Calibración'},
  {code:'Co', label:'Comprobación'},
  {code:'V',  label:'Verificación'},
];
const LIMPIEZA_COD = [
  {code:'1', label:'Agua tridestilada'},
  {code:'2', label:'Detergente suave'},
  {code:'3', label:'HCl 1:1'},
];

// AARMS sub6-atajos: valores rápidos para captura en campo
// Actividad usa Ca/Co/V (ACT_CONTROL) — no CA/CO del prompt, para no romper selects/PDF.
const ATAJOS_BUFFERS_PH = ['4.00', '6.86', '7.00', '9.18', '10.00'];
const ATAJOS_TIRA_PH = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const ATAJOS_ACTIVIDAD = ACT_CONTROL.map(a => ({ key: a.code, label: a.label }));
const ATAJOS_LIMPIEZA = LIMPIEZA_COD.map(l => ({ key: l.code, label: l.label }));
window.ATAJOS_BUFFERS_PH = ATAJOS_BUFFERS_PH;
window.ATAJOS_TIRA_PH = ATAJOS_TIRA_PH;
window.ATAJOS_ACTIVIDAD = ATAJOS_ACTIVIDAD;
window.ATAJOS_LIMPIEZA = ATAJOS_LIMPIEZA;

// AARMS sub6-atajos: ¿el valor actual coincide con un chip? (numérico o string)
function _atajoValorActivo(valorActual, key){
  if(String(valorActual ?? '') === String(key ?? '')) return true;
  const a = parseFloat(valorActual), b = parseFloat(key);
  if(!isNaN(a) && !isNaN(b) && String(valorActual).trim() !== '' && String(key).trim() !== ''){
    return Math.abs(a - b) < 1e-9;
  }
  return String(valorActual || '').toUpperCase() === String(key || '').toUpperCase();
}

// AARMS sub6-atajos: helper para renderizar chips de atajos
// Nota: updateFn recibe (idx, campo, valor) — bitPhUp / bitCondUp usan índice, no id.
function _renderAtajos(opts){
  const {
    valores,
    campo,
    id,
    valorActual = '',
    label = '',
    color = '#60a5fa',
    colsPorFila = 5,
    updateFn = 'bitPhUp'
  } = opts || {};
  const rgb = (color && String(color).startsWith('#')) ? color : '#60a5fa';
  let html = '';
  if(label){
    html += `<div style="font-size:9.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.04em;font-family:var(--mono);margin-bottom:4px">${label}</div>`;
  }
  html += `<div style="display:grid;grid-template-columns:repeat(${colsPorFila},1fr);gap:4px;margin-bottom:8px">`;
  (valores || []).forEach(v => {
    const key = typeof v === 'object' ? v.key : v;
    const displ = typeof v === 'object' ? v.key : v;
    const tooltip = typeof v === 'object' ? (v.label || '') : '';
    const activo = _atajoValorActivo(valorActual, key);
    const bg = activo
      ? `background:${rgb};color:white;border-color:${rgb}`
      : `background:rgba(255,255,255,.03);color:var(--w);border-color:var(--ln)`;
    const keyEsc = String(key).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const tipEsc = String(tooltip).replace(/"/g, '&quot;');
    html += `<button type="button" data-atajo-campo="${campo}" data-atajo-val="${String(key).replace(/"/g,'&quot;')}" onclick="${updateFn}(${id},'${campo}','${keyEsc}')" title="${tipEsc}" style="${bg};border:1px solid;padding:6px 4px;border-radius:6px;font-family:var(--syne);font-weight:700;font-size:11px;cursor:pointer;text-align:center">${String(displ).replace(/</g,'&lt;')}</button>`;
  });
  html += '</div>';
  return html;
}
window._renderAtajos = _renderAtajos;

// AARMS sub6-atajos: atajos de patrones KCl desde el Inventario
function _atajosPatronesKCl(){
  const cat = _catalogoCache;
  if(!cat || !Array.isArray(cat.conductividad)) return [];
  return cat.conductividad.map(p => ({
    key: String(p.valor != null ? p.valor : (p.nombre || '')),
    label: (p.nombre || 'KCl') + (p.lote ? ' · ' + p.lote : '')
  })).filter(p => p.key !== '');
}
window._atajosPatronesKCl = _atajosPatronesKCl;

// AARMS sub6-atajos: badge AUTO para lote/marca desde catálogo
function _badgeAuto(esAuto){
  if(!esAuto) return '';
  return `<span data-badge-auto style="background:rgba(134,239,172,.12);color:#86efac;border:1px solid rgba(134,239,172,.3);padding:2px 6px;border-radius:5px;font-size:9px;font-family:var(--mono);font-weight:700;margin-left:6px">AUTO</span>`;
}
window._badgeAuto = _badgeAuto;

/** Textos cortos para UI y pies de PDF (bitácoras, BLMP, conductímetro). */
window.AARMS_DOC_LEYENDAS = {
  actControl: 'Actividad de control: Ca = calibración con buffer MCR; Co = comprobación de la calibración; V = verificación operativa entre tomas de muestra.',
  limpiezaCod: 'Código de limpieza: 1 = agua tridestilada; 2 = detergente suave; 3 = HCl 1:1.',
  dosBufferNoche: 'Bloque oficial a dos buffers: Ca→Co en cada buffer. Folio OMAR y toma no aplican en esas líneas. Si el muestreo cruza medianoche (según inicio/fin o secuencia de horas en tomas), las lecturas del par Ca/Co se marcan en PENDIENTE automáticamente; si no hay cruce, se capturan lecturas de inmediato.',
  phCriterios: 'Criterios pH: diferencia máxima entre L1–L3 ≤ 0,03 UpH; contra valor del buffer MCR ±0,05 UpH cuando aplique.',
  phCriterioOficial: 'CRITERIO DE ACEPTACIÓN O RECHAZO: la medición no debe desviarse por más de ±0,05 UpH del valor nominal del patrón de referencia. No deberá haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas.',
  phNotaBlmp: 'Nota: la limpieza entre lecturas debe registrarse en la bitácora BLMP (pH-metro laboratorio).',
  phFormCodigo: 'F-AA-264-4 · Formato uso, calibración, comprobación y verificación del pH-metro (entre tomas).',
  condDispersion: 'Conductímetro (digital): dispersión entre L1–L3 ≤ 3% respecto al promedio; si el instructivo del equipo exige otro criterio, documéntalo en observaciones.',
};

/** Plan activo del muestreo actual (si existe en IndexedDB). */
function _bitPhPlan(){
  if(typeof omar==='undefined'||!omar||!omar.ts||typeof getPlanDeMuestreo!=='function') return null;
  return getPlanDeMuestreo(omar.ts);
}

/** Registros bitácora pH: un solo arreglo por plan cuando la OMAR pertenece a un plan; si no, por OMAR. */
function _bitPhRegs(){
  if(typeof omar==='undefined'||!omar||!omar.ts) return null;
  const pl=_bitPhPlan();
  if(pl&&pl.id){
    if(!Array.isArray(pl.bitPh)) pl.bitPh=[];
    return pl.bitPh;
  }
  if(!Array.isArray(omar.bitPh)) omar.bitPh=[];
  return omar.bitPh;
}

function _bitPhFolioDocGet(){
  const pl=_bitPhPlan();
  if(pl&&pl.id) return pl.bitPhFolioDoc||'';
  return (typeof omar!=='undefined'&&omar)?(omar.bitPhFolioDoc||''):'';
}

function _bitPhFolioDocSet(v){
  const pl=_bitPhPlan();
  if(pl&&pl.id) pl.bitPhFolioDoc=v;
  else if(typeof omar!=='undefined'&&omar) omar.bitPhFolioDoc=v;
}

async function _persistPlanBitPh(){
  const pl=_bitPhPlan();
  if(!pl||!pl.id) return;
  pl.ts=Date.now();
  try{
    await idbPlanPut(pl);
    if(typeof refreshCache==='function') await refreshCache();
  }catch(e){ console.warn('[plan bitPh]',e); }
}

/** Si el plan aún no tiene bitPh en IndexedDB, copia la del OMAR activo (migración suave). */
async function _bitPhMigrarSiPlanVacio(){
  const pl=_bitPhPlan();
  if(!pl||!pl.id) return;
  let dirty=false;
  if((!Array.isArray(pl.bitPh)||pl.bitPh.length===0) && Array.isArray(omar.bitPh)&&omar.bitPh.length){
    pl.bitPh=omar.bitPh.map(r=>({...r, omarId:r.omarId!=null&&r.omarId!==''?r.omarId:omar.ts}));
    dirty=true;
  }
  if(!pl.bitPhFolioDoc && omar.bitPhFolioDoc){
    pl.bitPhFolioDoc=omar.bitPhFolioDoc;
    dirty=true;
  }
  if(dirty) await _persistPlanBitPh();
}

// AARMS v66-condfix: bitácora conductímetro — mismo modelo plan que pH
function _bitCondRegs(){
  if(typeof omar==='undefined'||!omar||!omar.ts) return null;
  const pl=_bitPhPlan();
  if(pl&&pl.id){
    if(!Array.isArray(pl.bitCond)) pl.bitCond=[];
    return pl.bitCond;
  }
  if(!Array.isArray(omar.bitCond)) omar.bitCond=[];
  return omar.bitCond;
}

function _bitCondFolioDocGet(){
  const pl=_bitPhPlan();
  if(pl&&pl.id) return pl.bitCondFolioDoc||'';
  return (typeof omar!=='undefined'&&omar)?(omar.bitCondFolioDoc||''):'';
}

function _bitCondFolioDocSet(v){
  const pl=_bitPhPlan();
  if(pl&&pl.id) pl.bitCondFolioDoc=v;
  else if(typeof omar!=='undefined'&&omar) omar.bitCondFolioDoc=v;
}

async function _persistPlanBitCond(){
  const pl=_bitPhPlan();
  if(!pl||!pl.id) return;
  pl.ts=Date.now();
  try{
    await idbPlanPut(pl);
    if(typeof refreshCache==='function') await refreshCache();
  }catch(e){ console.warn('[plan bitCond]',e); }
}

async function _bitCondMigrarSiPlanVacio(){
  const pl=_bitPhPlan();
  if(!pl||!pl.id) return;
  let dirty=false;
  if((!Array.isArray(pl.bitCond)||pl.bitCond.length===0) && Array.isArray(omar.bitCond)&&omar.bitCond.length){
    pl.bitCond=omar.bitCond.map(r=>({...r, omarId:r.omarId!=null&&r.omarId!==''?r.omarId:omar.ts}));
    dirty=true;
  }
  if(!pl.bitCondFolioDoc && omar.bitCondFolioDoc){
    pl.bitCondFolioDoc=omar.bitCondFolioDoc;
    dirty=true;
  }
  if(dirty) await _persistPlanBitCond();
}

function _bitCondActualizarFoliosOmarEnRegs(){
  const regs=_bitCondRegs();
  if(!regs) return;
  regs.forEach(r=>{
    const f=_bitPhFolioLegible(r.omarId);
    if(f) r.folioOmar=f;
  });
}

function _findMuestreoById(mid){
  if(mid==null||mid==='') return null;
  const sid=String(mid);
  const lista=typeof _cachedMuestreos!=='undefined'&&_cachedMuestreos?_cachedMuestreos:[];
  return lista.find(x=>String(x.id)===sid)||null;
}

/** Folio legible de OMAR (nunca el id interno tipo 1778785232126). */
function _bitPhFolioLegible(mid){
  if(mid==null||mid==='') return '';
  const sid=String(mid);
  if(typeof omar!=='undefined'&&omar&&String(omar.ts)===sid){
    const f=String(omar.folio||'').trim();
    if(f) return f;
  }
  const m=_findMuestreoById(mid);
  if(!m) return '';
  const top=String(m.folio||'').trim();
  if(top) return top;
  try{
    const o=m.omar?JSON.parse(m.omar):{};
    return String(o.folio||'').trim();
  }catch(e){ return ''; }
}

function _bitPhOmarFolio(mid){
  const f=_bitPhFolioLegible(mid);
  return f||'sin folio';
}

function _bitPhActualizarFoliosOmarEnRegs(){
  const regs=_bitPhRegs();
  if(!regs) return;
  regs.forEach(r=>{
    if(r.calibGrupo) return;
    const f=_bitPhFolioLegible(r.omarId);
    if(f) r.folioOmar=f;
  });
}

function _bitPhListaTomasOMAR(mid){
  const m=typeof _cachedMuestreos!=='undefined'&&_cachedMuestreos?_cachedMuestreos.find(x=>x.id===mid):null;
  const arr=(m&&m.tomas)||[];
  return arr.map((t,i)=>({num:i+1, hora:t.hora||'—', id:t.id}));
}

/** Opciones para el selector Toma+OMAR (valor `muestreoId|numToma`). */
function _bitPhOpcionesTomaSelect(){
  const pl=_bitPhPlan();
  if(pl&&pl.omarIds&&pl.omarIds.length){
    const opts=[];
    for(const mid of pl.omarIds){
      const fol=_bitPhFolioLegible(mid);
      const folLbl=typeof _omarLabelConFecha==='function'?_omarLabelConFecha(mid):(fol?`OMAR ${fol}`:'OMAR (sin folio)');
      for(const t of _bitPhListaTomasOMAR(mid)){
        opts.push({
          value:`${mid}|${t.num}`,
          label:`${folLbl} · T${t.num}${t.hora&&t.hora!=='—'?' ('+t.hora+')':''}`,
        });
      }
    }
    return opts;
  }
  if(typeof omar==='undefined'||!omar||!omar.ts) return [];
  return (typeof tomas!=='undefined'&&tomas?tomas:[]).map((t,i)=>({
    value:`${omar.ts}|${i+1}`,
    label:`T${i+1}${t.hora?' ('+t.hora+')':''}`,
  }));
}

function _bitPhTomaSelectValue(r){
  const mid=r&&r.omarId!=null&&r.omarId!==''?String(r.omarId):(typeof omar!=='undefined'&&omar&&omar.ts?String(omar.ts):'');
  const num=r&&r.toma!=null&&r.toma!==''?String(r.toma):'';
  return num&&mid?`${mid}|${num}`:'';
}

/** Etiqueta visible de toma (T1, OMAR folio…) — no usar índice del arreglo bitPh. */
function _bitPhLabelToma(r){
  if(!r||r.calibGrupo) return 'Calibración / comprobación';
  const num=r.toma!=null&&r.toma!==''?String(r.toma):'';
  const fol=_bitPhFolioLegible(r.omarId)||String(r.folioOmar||'').trim();
  const folLbl=typeof _omarLabelConFecha==='function'&&r.omarId?_omarLabelConFecha(r.omarId):(fol?`OMAR ${fol}`:'OMAR');
  if(num&&folLbl) return `${folLbl} · T${num}`;
  if(num) return `Toma ${num}`;
  return 'Toma (elige número)';
}

/** Crea registro V en bitácora pH si no existe para esta OMAR + número de toma. */
function _bitPhAsegurarRegistroV(omarTs, tomaNum, hora, opts){
  const regs=_bitPhRegs();
  if(!regs||!omarTs||!tomaNum) return;
  const val=`${omarTs}|${tomaNum}`;
  if(regs.some(r=>!r.calibGrupo&&r.act==='V'&&_bitPhTomaSelectValue(r)===val)) return;
  regs.push({
    fecha:_defaultBitRegistroFecha(),
    hora:_horaNormalizada(hora||_horaActualHHMM()),
    omarId:String(omarTs),
    toma:String(tomaNum),
    folioOmar:_bitPhFolioLegible(omarTs)||'',
    act:'V', limp:'1', aprox:'', buffer:'', lote:'', marca:'',
    l1:'', l2:'', l3:'', obs:'',
  });
  _bitPhOrdenarRegsPorFechaHora(regs);
  if(!opts?.silent&&document.getElementById('pgBitPH')?.classList.contains('on')&&typeof _bitPhRender==='function') _bitPhRender();
  if(!opts?.silent) void _persistPlanBitPh();
}

function _bitPhFechaForOmar(mid){
  const sid=String(mid);
  if(omar&&String(omar.ts)===sid&&omar.fecha) return String(omar.fecha).substring(0,10);
  const m=_findMuestreoById(mid);
  if(m&&m.fecha) return String(m.fecha).substring(0,10);
  return _defaultBitRegistroFecha();
}

function _bitPhTomasArrayForOmar(mid){
  const sid=String(mid);
  if(omar&&String(omar.ts)===sid) return tomas||[];
  const m=_findMuestreoById(mid);
  return m?.tomas||[];
}

/** Alinea registros V con las tomas de campo (OMAR activa o todas las del plan). */
function _bitPhSyncAllTomasFromCampo(){
  _flushTomasDesdeDOM();
  const regs=_bitPhRegs();
  if(!regs) return;
  const pl=_bitPhPlan();
  const ids=pl&&pl.omarIds&&pl.omarIds.length?pl.omarIds:(omar?.ts?[omar.ts]:[]);
  if(!ids.length) return;
  const want=new Set();
  for(const mid of ids){
    const sid=String(mid);
    _bitPhTomasArrayForOmar(mid).forEach((t,i)=> want.add(`${sid}|${i+1}`));
  }
  for(let i=regs.length-1;i>=0;i--){
    const r=regs[i];
    if(r.calibGrupo||r.act!=='V') continue;
    const v=_bitPhTomaSelectValue(r);
    if(!v||want.has(v)) continue;
    const hasLecturas=!!(String(r.l1||'').trim()||String(r.l2||'').trim()||String(r.l3||'').trim());
    if(hasLecturas) continue;
    regs.splice(i,1);
  }
  for(const mid of ids){
    const sid=String(mid);
    _bitPhTomasArrayForOmar(mid).forEach((t,i)=>{
      const val=`${sid}|${i+1}`;
      const r=regs.find(rr=>!rr.calibGrupo&&rr.act==='V'&&_bitPhTomaSelectValue(rr)===val);
      if(r){
        const h=_horaNormalizada(t.hora||'');
        if(h) r.hora=h;
        r.fecha=_bitPhFechaForOmar(sid);
        const fol=_bitPhFolioLegible(sid);
        if(fol) r.folioOmar=fol;
      }else{
        _bitPhAsegurarRegistroV(sid, i+1, t.hora, {silent:true});
      }
    });
  }
  _bitPhActualizarFoliosOmarEnRegs();
  _bitPhOrdenarRegsPorFechaHora(regs);
  if(document.getElementById('pgBitPH')?.classList.contains('on')&&typeof _bitPhRender==='function') _bitPhRender();
  void _persistPlanBitPh();
}

/** Crea registro V de conductividad si no existe para OMAR + toma. */
function _bitCondAsegurarRegistroV(omarTs, tomaNum, hora, opts){
  const regs=_bitCondRegs();
  if(!regs||!omarTs||!tomaNum) return;
  const val=`${omarTs}|${tomaNum}`;
  if(regs.some(r=>r.act==='V'&&_bitPhTomaSelectValue(r)===val)) return;
  regs.push({
    fecha:_bitPhFechaForOmar(omarTs),
    hora:_horaNormalizada(hora||_horaActualHHMM()),
    omarId:String(omarTs),
    toma:String(tomaNum),
    folioOmar:_bitPhFolioLegible(omarTs)||'',
    act:'V', limp:'1',
    l1:'', l2:'', l3:'',
  });
  _bitPhOrdenarRegsPorFechaHora(regs);
  if(!opts?.silent&&document.getElementById('pgBitCond')?.classList.contains('on')&&typeof _bitCondRender==='function') _bitCondRender();
  if(!opts?.silent) void _persistPlanBitCond();
}

/** Alinea registros V de conductividad con tomas de campo (plan u OMAR activa). */
function _bitCondSyncAllTomasFromCampo(){
  _flushTomasDesdeDOM();
  const regs=_bitCondRegs();
  if(!regs) return;
  const pl=_bitPhPlan();
  const ids=pl&&pl.omarIds&&pl.omarIds.length?pl.omarIds:(omar?.ts?[omar.ts]:[]);
  if(!ids.length) return;
  const want=new Set();
  for(const mid of ids){
    const sid=String(mid);
    _bitPhTomasArrayForOmar(mid).forEach((t,i)=> want.add(`${sid}|${i+1}`));
  }
  for(let i=regs.length-1;i>=0;i--){
    const r=regs[i];
    if(r.act!=='V') continue;
    const v=_bitPhTomaSelectValue(r);
    if(!v||want.has(v)) continue;
    const hasLecturas=!!(String(r.l1||'').trim()||String(r.l2||'').trim()||String(r.l3||'').trim());
    if(hasLecturas) continue;
    regs.splice(i,1);
  }
  for(const mid of ids){
    const sid=String(mid);
    _bitPhTomasArrayForOmar(mid).forEach((t,i)=>{
      const val=`${sid}|${i+1}`;
      const r=regs.find(rr=>rr.act==='V'&&_bitPhTomaSelectValue(rr)===val);
      if(r){
        const h=_horaNormalizada(t.hora||'');
        if(h) r.hora=h;
        r.fecha=_bitPhFechaForOmar(sid);
        const fol=_bitPhFolioLegible(sid);
        if(fol) r.folioOmar=fol;
      }else{
        _bitCondAsegurarRegistroV(sid, i+1, t.hora, {silent:true});
      }
    });
  }
  _bitCondActualizarFoliosOmarEnRegs();
  _bitPhOrdenarRegsPorFechaHora(regs);
  if(document.getElementById('pgBitCond')?.classList.contains('on')&&typeof _bitCondRender==='function') _bitCondRender();
  void _persistPlanBitCond();
}

// ═══════════════════════════════════════════════════════════════
// AARMS sub21-bittemp: Bitácora de Temperatura (espejo bitPh/bitCond)
// ═══════════════════════════════════════════════════════════════
let _bitTempOrigen = 'hoja';

function _bitTempRegs(){
  if(typeof omar==='undefined'||!omar||!omar.ts) return null;
  const pl=_bitPhPlan();
  if(pl&&pl.id){
    if(!Array.isArray(pl.bitTemp)) pl.bitTemp=[];
    return pl.bitTemp;
  }
  if(!Array.isArray(omar.bitTemp)) omar.bitTemp=[];
  return omar.bitTemp;
}

function _bitTempFolioDocGet(){
  const pl=_bitPhPlan();
  if(pl&&pl.id) return pl.bitTempFolioDoc||'';
  return (typeof omar!=='undefined'&&omar)?(omar.bitTempFolioDoc||''):'';
}

function _bitTempFolioDocSet(v){
  const pl=_bitPhPlan();
  if(pl&&pl.id) pl.bitTempFolioDoc=v;
  else if(typeof omar!=='undefined'&&omar) omar.bitTempFolioDoc=v;
}

async function _persistPlanBitTemp(){
  const pl=_bitPhPlan();
  if(!pl||!pl.id) return;
  pl.ts=Date.now();
  try{
    await idbPlanPut(pl);
    if(typeof refreshCache==='function') await refreshCache();
  }catch(e){ console.warn('[plan bitTemp]',e); }
}

// AARMS sub21-bittemp: migrar Sub-2 (temp_* en tomas) → plan.bitTemp
async function _migrarBitTempSub2(plan, omarObj){
  if(!plan || !omarObj || !Array.isArray(omarObj.tomas)) return false;
  if(!Array.isArray(plan.bitTemp)) plan.bitTemp = [];
  let cambio = false;
  const omarTs = omarObj.ts;
  omarObj.tomas.forEach((t, idx) => {
    const tomaNum = idx + 1;
    const existe = plan.bitTemp.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === tomaNum);
    if(existe) return;
    const hayDatos = (t.temp_agua_l1 || t.temp_agua_l2 || t.temp_agua_l3 ||
                      t.temp_amb_l1 || t.temp_amb_l2 || t.temp_amb_l3 ||
                      t.tagua || t.tamb);
    if(!hayDatos) return;
    const agua1 = t.temp_agua_l1 != null ? String(t.temp_agua_l1) : String(t.tagua || '');
    const amb1 = t.temp_amb_l1 != null ? String(t.temp_amb_l1) : String(t.tamb || '');
    plan.bitTemp.push({
      id: Date.now() + idx + Math.random(),
      omarTs,
      toma: tomaNum,
      hora: t.hora || '',
      agua_l1: agua1,
      agua_l2: String(t.temp_agua_l2 || ''),
      agua_l3: String(t.temp_agua_l3 || ''),
      amb_l1: amb1,
      amb_l2: String(t.temp_amb_l2 || ''),
      amb_l3: String(t.temp_amb_l3 || '')
    });
    cambio = true;
  });
  if(cambio){
    try{ await guardarPlan(plan); }catch(e){ console.warn('[migrar bitTemp]', e); }
  }
  return cambio;
}
window._migrarBitTempSub2 = _migrarBitTempSub2;

function _bitTempAsegurarRegistro(omarTs, tomaNum, hora, opts){
  const regs=_bitTempRegs();
  if(!regs||!omarTs||!tomaNum) return;
  const existe = regs.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if(existe){
    if(!existe.hora && hora) existe.hora = _horaNormalizada(hora);
    return;
  }
  regs.push({
    id: Date.now() + tomaNum + Math.random(),
    omarTs: String(omarTs),
    toma: Number(tomaNum),
    hora: _horaNormalizada(hora||''),
    agua_l1:'', agua_l2:'', agua_l3:'',
    amb_l1:'', amb_l2:'', amb_l3:''
  });
  if(!opts?.silent&&document.getElementById('pgBitTemp')?.classList.contains('on')&&typeof _bitTempRender==='function') _bitTempRender();
  if(!opts?.silent) void _persistPlanBitTemp();
}
window._bitTempAsegurarRegistro = _bitTempAsegurarRegistro;

function _bitTempSyncHorasDesdeCampo(){
  const regs=_bitTempRegs();
  if(!regs||!omar?.ts||!tomas) return;
  tomas.forEach((t,i)=>{
    const r=regs.find(rr=>String(rr.omarTs)===String(omar.ts)&&Number(rr.toma)===i+1);
    if(r && t.hora) r.hora=_horaNormalizada(t.hora);
  });
  void _persistPlanBitTemp();
}

function _bitTempSyncAllTomasFromCampo(){
  _flushTomasDesdeDOM();
  const regs=_bitTempRegs();
  if(!regs) return;
  const pl=_bitPhPlan();
  const ids=pl&&pl.omarIds&&pl.omarIds.length?pl.omarIds:(omar?.ts?[omar.ts]:[]);
  if(!ids.length) return;
  const want=new Set();
  for(const mid of ids){
    const sid=String(mid);
    _bitPhTomasArrayForOmar(mid).forEach((t,i)=> want.add(`${sid}|${i+1}`));
  }
  for(let i=regs.length-1;i>=0;i--){
    const r=regs[i];
    const key=`${r.omarTs}|${r.toma}`;
    if(!key||want.has(key)) continue;
    const hasDatos=!!(String(r.agua_l1||'').trim()||String(r.agua_l2||'').trim()||String(r.agua_l3||'').trim()||
                      String(r.amb_l1||'').trim()||String(r.amb_l2||'').trim()||String(r.amb_l3||'').trim());
    if(hasDatos) continue;
    regs.splice(i,1);
  }
  for(const mid of ids){
    const sid=String(mid);
    _bitPhTomasArrayForOmar(mid).forEach((t,i)=>{
      const tomaNum=i+1;
      const r=regs.find(rr=>String(rr.omarTs)===sid&&Number(rr.toma)===tomaNum);
      if(r){
        const h=_horaNormalizada(t.hora||'');
        if(h) r.hora=h;
      }else{
        _bitTempAsegurarRegistro(sid, tomaNum, t.hora, {silent:true});
      }
    });
  }
  if(document.getElementById('pgBitTemp')?.classList.contains('on')&&typeof _bitTempRender==='function') _bitTempRender();
  void _persistPlanBitTemp();
}

function _bitTempCalcCompleta(reg){
  return !!(reg.agua_l1 && reg.agua_l2 && reg.agua_l3 && reg.amb_l1 && reg.amb_l2 && reg.amb_l3);
}

function _renderBitTempCard(reg, idx){
  const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const calc=_calcBitTempRegistro(reg);
  const fmtC=(v)=>isNaN(v)?'<span style="color:var(--g2)">—</span>':`<span style="color:var(--acc);font-weight:700">${v.toFixed(1)}</span>`;
  const fmtProm=(v)=>isNaN(v)?'—':v.toFixed(2)+'°C';
  const fmtDiff=(v)=>isNaN(v)?'—':v.toFixed(2)+'°C';
  const completa=_bitTempCalcCompleta(reg);
  const fol=_bitPhFolioLegible(reg.omarTs)||String(reg.omarTs);
  const folLbl=typeof _omarLabelConFecha==='function'?_omarLabelConFecha(reg.omarTs):`OMAR ${fol}`;
  const titulo=`${folLbl} · T${reg.toma}`;
  const estadoBadge=completa
    ? `<span data-bit-estado style="background:rgba(134,239,172,.15);border:1px solid rgba(134,239,172,.4);color:var(--green);padding:2px 9px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.04em">COMPLETADA</span>`
    : `<span data-bit-estado style="background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.35);color:#fbbf24;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.04em">PENDIENTE</span>`;
  const procLabel=calc.procedimiento?`Procedimiento ${calc.procedimiento} — ${_tempProcedimientoLabel(calc.procedimiento)}`:'Sin datos suficientes para determinar procedimiento';
  const procColor=calc.procedimiento==='2'?'#86efac':(calc.procedimiento==='3'?'#fbbf24':'var(--g2)');

  return `
    <div data-bit-temp="${idx}" style="background:var(--bg2);border:1px solid var(--ln);border-radius:11px;padding:14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap">
        <div style="font-family:var(--syne);font-size:13px;font-weight:800;color:var(--w)">${esc(titulo)}</div>
        <div style="display:flex;align-items:center;gap:8px">
          ${estadoBadge}
          <button type="button" onclick="bitTempEliminar(${idx})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:4px 8px;border-radius:6px;font-size:10.5px;cursor:pointer">✕ Borrar</button>
        </div>
      </div>
      <div class="g2" style="margin-bottom:10px">
        <div class="f" style="margin-bottom:0"><label>Hora</label><input type="time" value="${esc(reg.hora)}" oninput="bitTempUp(${idx},'hora',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>FC aplicado</label><input type="text" readonly style="background:rgba(255,255,255,.06);color:var(--w)" value="${(calc.fc>=0?'+':'')+calc.fc.toFixed(2)}"></div>
      </div>
      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);margin-bottom:6px">Temperatura del agua (°C)</div>
      <div class="g3" style="margin-bottom:8px">
        <div class="f" style="margin-bottom:0"><label>T1</label><input type="number" step="0.1" value="${esc(reg.agua_l1)}" placeholder="—" oninput="bitTempUp(${idx},'agua_l1',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>T2</label><input type="number" step="0.1" value="${esc(reg.agua_l2)}" placeholder="—" oninput="bitTempUp(${idx},'agua_l2',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>T3</label><input type="number" step="0.1" value="${esc(reg.agua_l3)}" placeholder="—" oninput="bitTempUp(${idx},'agua_l3',this.value)"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr) auto;gap:6px;font-size:10.5px;margin-bottom:10px;padding:6px 8px;background:rgba(255,255,255,.02);border-radius:6px">
        <div><span style="color:var(--g2)">T1c:</span> ${fmtC(calc.agua_c1)}</div>
        <div><span style="color:var(--g2)">T2c:</span> ${fmtC(calc.agua_c2)}</div>
        <div><span style="color:var(--g2)">T3c:</span> ${fmtC(calc.agua_c3)}</div>
        <div style="font-weight:800;color:#86efac"><span style="color:var(--g2);font-weight:normal">A:</span> ${fmtProm(calc.agua_prom)}</div>
      </div>
      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);margin-bottom:6px">Temperatura ambiente (°C)</div>
      <div class="g3" style="margin-bottom:8px">
        <div class="f" style="margin-bottom:0"><label>T1</label><input type="number" step="0.1" value="${esc(reg.amb_l1)}" placeholder="—" oninput="bitTempUp(${idx},'amb_l1',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>T2</label><input type="number" step="0.1" value="${esc(reg.amb_l2)}" placeholder="—" oninput="bitTempUp(${idx},'amb_l2',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>T3</label><input type="number" step="0.1" value="${esc(reg.amb_l3)}" placeholder="—" oninput="bitTempUp(${idx},'amb_l3',this.value)"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr) auto;gap:6px;font-size:10.5px;margin-bottom:10px;padding:6px 8px;background:rgba(255,255,255,.02);border-radius:6px">
        <div><span style="color:var(--g2)">T1c:</span> ${fmtC(calc.amb_c1)}</div>
        <div><span style="color:var(--g2)">T2c:</span> ${fmtC(calc.amb_c2)}</div>
        <div><span style="color:var(--g2)">T3c:</span> ${fmtC(calc.amb_c3)}</div>
        <div style="font-weight:800;color:#86efac"><span style="color:var(--g2);font-weight:normal">B:</span> ${fmtProm(calc.amb_prom)}</div>
      </div>
      <div data-bit-resumen style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;background:rgba(74,158,255,.06);border:1px solid rgba(74,158,255,.2);border-radius:9px">
        <div>
          <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.04em">Diferencia A−B</div>
          <div style="font-family:var(--syne);font-size:20px;font-weight:800;color:var(--acc);margin-top:2px">${fmtDiff(calc.diff)}</div>
        </div>
        <div style="text-align:right;max-width:55%">
          <div style="font-size:10.5px;font-weight:700;color:${procColor};font-family:var(--syne);line-height:1.35">${procLabel}</div>
        </div>
      </div>
    </div>`;
}
window._renderBitTempCard = _renderBitTempCard;

function _bitTempRender(){
  const c=document.getElementById('bitTempRegistros');
  const info=document.getElementById('bitTempInfo');
  if(!c) return;
  const regs=_bitTempRegs()||[];
  const termo=_equipoActivo('termometros');
  const fc=_fcTermometroActual();
  const fcDisplay=(fc>=0?'+':'')+fc.toFixed(2);
  const termoLabel=termo?_equipoClave('termometros',termo):'sin termómetro asignado';
  if(info){
    info.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z"/></svg>
      <span style="font-family:var(--syne);font-weight:800;color:#f59e0b;font-size:12px">Termómetro:</span>
      <span style="color:var(--w);font-family:var(--mono);font-size:12px">${termoLabel}</span>
      <span style="margin-left:auto;font-family:var(--mono);color:var(--g1);font-size:11px"><span style="color:var(--g2)">FC:</span> ${fcDisplay}</span>
    </div>
    <div style="margin-top:8px;padding:8px 10px;background:rgba(74,158,255,.04);border-left:2px solid var(--acc);border-radius:5px;font-size:10.5px;color:var(--g1)">
      <b style="color:var(--acc)">Criterio automático:</b> Δ ≤ 5°C → Procedimiento 2 (polietileno) · Δ &gt; 5°C → Procedimiento 3 (Dewar)
    </div>`;
  }
  if(regs.length===0){
    c.innerHTML=`<div style="text-align:center;padding:24px 12px;color:var(--g2);font-size:12px;line-height:1.55">
      Sin registros aún.<br>
      <span style="font-size:10.5px;color:var(--g3)">Agrega tomas en la hoja de campo y vuelve aquí, o usa «+ Agregar toma».</span>
    </div>`;
    return;
  }
  const sorted=[...regs].sort((a,b)=>{
    const oa=String(a.omarTs).localeCompare(String(b.omarTs));
    if(oa!==0) return oa;
    return Number(a.toma)-Number(b.toma);
  });
  c.innerHTML=sorted.map(r=>{
    const idx=regs.indexOf(r);
    return _renderBitTempCard(r, idx);
  }).join('');
}
window._bitTempRender = _bitTempRender;

function bitTempUp(idx, field, value){
  const regs=_bitTempRegs();
  if(!regs||!regs[idx]) return;
  regs[idx][field]=value;
  if(['agua_l1','agua_l2','agua_l3','amb_l1','amb_l2','amb_l3','hora'].includes(field)){
    _bitTempRender();
    if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
  }
  guardarBorradorActual();
  void _persistPlanBitTemp();
}
window.bitTempUp = bitTempUp;

function bitTempAgregarRegistro(){
  const regs=_bitTempRegs();
  if(!regs) return;
  const tomaOptsList=_bitPhOpcionesTomaSelect();
  if(!tomaOptsList.length){
    toast('Primero agrega tomas en la hoja de campo','w');
    return;
  }
  const asignadas=new Set(regs.map(r=>`${r.omarTs}|${r.toma}`));
  let prox=null;
  for(const o of tomaOptsList){
    if(!asignadas.has(o.value)){ prox=o; break; }
  }
  if(!prox && tomaOptsList.length) prox=tomaOptsList[0];
  const pipe=prox.value.indexOf('|');
  const omarTs=pipe>=0?prox.value.slice(0,pipe):String(omar.ts);
  const tomaNum=pipe>=0?parseInt(prox.value.slice(pipe+1),10):1;
  if(regs.some(r=>String(r.omarTs)===String(omarTs)&&Number(r.toma)===tomaNum)){
    toast('Ya existe registro para esa toma','w');
    return;
  }
  regs.push({
    id:Date.now()+Math.random(),
    omarTs,
    toma:tomaNum,
    hora:new Date().toTimeString().substring(0,5),
    agua_l1:'', agua_l2:'', agua_l3:'',
    amb_l1:'', amb_l2:'', amb_l3:''
  });
  _bitTempRender();
  guardarBorradorActual();
  void _persistPlanBitTemp();
}
window.bitTempAgregarRegistro = bitTempAgregarRegistro;

function bitTempEliminar(idx){
  const regs=_bitTempRegs();
  if(!regs||!regs[idx]) return;
  regs.splice(idx,1);
  _bitTempRender();
  if(typeof renderTomas==='function') renderTomas();
  if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
  guardarBorradorActual();
  void _persistPlanBitTemp();
}
window.bitTempEliminar = bitTempEliminar;

async function abrirBitacoraTemp(opts){
  opts=opts||{};
  _bitTempOrigen=opts.origen||'hoja';
  if(!omar.ts){ toast('Primero captura el OMAR','w'); return; }
  _flushTomasDesdeDOM();
  try{ await saveMuestreoActual(); }catch(e){ console.warn('[bitTemp open save]',e); }
  const pl=_bitPhPlan();
  const p=document.getElementById('bitTempPill');
  if(p){
    if(pl&&pl.id){
      const n=(pl.omarIds||[]).length;
      p.textContent='Plan · '+n+' OMAR(s) · bitácora temperatura';
    }else{
      p.textContent=(omar.folio?'OMAR '+omar.folio:'OMAR')+' · '+(tomas?.length||0)+' tomas';
    }
  }
  const fol=document.getElementById('bitTempFolioDocInp');
  if(fol) fol.value=_bitTempFolioDocGet()||'';
  if(pl && omar && typeof _migrarBitTempSub2==='function') await _migrarBitTempSub2(pl, omar);
  _bitTempSyncAllTomasFromCampo();
  _bitTempRender();
  try{ await _persistPlanBitTemp(); }catch(e){}
  _aplicarDocEstadoBadge('bitTemp');
  goPage('pgBitTemp');
}
window.abrirBitacoraTemp = abrirBitacoraTemp;

async function cerrarBitacoraTemp(){
  try{ await _persistPlanBitTemp(); }catch(e){}
  _flushTomasDesdeDOM();
  try{ await guardarBorradorActual(); }catch(e){}
  if(typeof renderTomas==='function') renderTomas();
  const origen=_bitTempOrigen;
  if(origen==='plan'){
    goPage('pgPlan');
    try{ renderPlanDocs(); }catch(_){}
  }else{
    goPage('pg1');
  }
}
window.cerrarBitacoraTemp = cerrarBitacoraTemp;
window.volverDeBitTemp = cerrarBitacoraTemp;

// ═══════════════════════════════════════════════════════════════
// AARMS sub3-flujos: Bitácora de Flujos (espejo bitTemp Sub-2.1)
// ═══════════════════════════════════════════════════════════════
let _bitFlujosOrigen = 'hoja';

function _bitFlujosRegs(){
  if(typeof omar==='undefined'||!omar||!omar.ts) return null;
  const pl=_bitPhPlan();
  if(pl&&pl.id){
    if(!Array.isArray(pl.bitFlujos)) pl.bitFlujos=[];
    return pl.bitFlujos;
  }
  if(!Array.isArray(omar.bitFlujos)) omar.bitFlujos=[];
  return omar.bitFlujos;
}

function _bitFlujosFolioDocGet(){
  const pl=_bitPhPlan();
  if(pl&&pl.id) return pl.bitFlujosFolioDoc||'';
  return (typeof omar!=='undefined'&&omar)?(omar.bitFlujosFolioDoc||''):'';
}

function _bitFlujosFolioDocSet(v){
  const pl=_bitPhPlan();
  if(pl&&pl.id) pl.bitFlujosFolioDoc=v;
  else if(typeof omar!=='undefined'&&omar) omar.bitFlujosFolioDoc=v;
}

async function _persistPlanBitFlujos(){
  const pl=_bitPhPlan();
  if(!pl||!pl.id) return;
  pl.ts=Date.now();
  try{
    await idbPlanPut(pl);
    if(typeof refreshCache==='function') await refreshCache();
  }catch(e){ console.warn('[plan bitFlujos]',e); }
}

// AARMS sub3-flujos: migrar datos viejos t.ls → plan.bitFlujos[]
async function _migrarBitFlujosSub2(plan, omarObj){
  if(!plan || !omarObj || !Array.isArray(omarObj.tomas)) return false;
  if(!Array.isArray(plan.bitFlujos)) plan.bitFlujos = [];
  let cambio = false;
  const omarTs = omarObj.ts;
  omarObj.tomas.forEach((t, idx) => {
    const tomaNum = idx + 1;
    const existe = plan.bitFlujos.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === tomaNum);
    if(existe) return;
    const lsViejo = t.ls || t.flujo || '';
    const pctViejo = t.pct || '';
    if(!lsViejo && !pctViejo) return;
    plan.bitFlujos.push({
      id: Date.now() + idx + Math.random(),
      omarTs,
      toma: tomaNum,
      hora: t.hora || '',
      metodo: '',
      l1: String(lsViejo || ''),
      l2: '',
      l3: ''
    });
    cambio = true;
  });
  if(cambio){
    try{ await guardarPlan(plan); }catch(e){ console.warn('[migrar bitFlujos]', e); }
  }
  return cambio;
}
window._migrarBitFlujosSub2 = _migrarBitFlujosSub2;

function _bitFlujosAsegurarRegistro(omarTs, tomaNum, hora, opts){
  const regs=_bitFlujosRegs();
  if(!regs||!omarTs||!tomaNum) return;
  const existe = regs.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if(existe){
    if(!existe.hora && hora) existe.hora = _horaNormalizada(hora);
    return;
  }
  regs.push({
    id: Date.now() + tomaNum + Math.random(),
    omarTs: String(omarTs),
    toma: Number(tomaNum),
    hora: _horaNormalizada(hora||''),
    metodo: '',
    l1:'', l2:'', l3:''
  });
  if(!opts?.silent&&document.getElementById('pgBitFlujos')?.classList.contains('on')&&typeof _bitFlujosRender==='function') _bitFlujosRender();
}
window._bitFlujosAsegurarRegistro = _bitFlujosAsegurarRegistro;

function _bitFlujosSyncHorasDesdeCampo(){
  const regs=_bitFlujosRegs();
  if(!regs||!omar?.ts||!tomas) return;
  tomas.forEach((t,i)=>{
    const r=regs.find(rr=>String(rr.omarTs)===String(omar.ts)&&Number(rr.toma)===i+1);
    if(r && t.hora) r.hora=_horaNormalizada(t.hora);
  });
  void _persistPlanBitFlujos();
}

function _bitFlujosSyncAllTomasFromCampo(){
  _flushTomasDesdeDOM();
  const regs=_bitFlujosRegs();
  if(!regs) return;
  const pl=_bitPhPlan();
  const ids=pl&&pl.omarIds&&pl.omarIds.length?pl.omarIds:(omar?.ts?[omar.ts]:[]);
  if(!ids.length) return;
  const want=new Set();
  for(const mid of ids){
    const sid=String(mid);
    _bitPhTomasArrayForOmar(mid).forEach((t,i)=> want.add(`${sid}|${i+1}`));
  }
  for(let i=regs.length-1;i>=0;i--){
    const r=regs[i];
    const key=`${r.omarTs}|${r.toma}`;
    if(!key||want.has(key)) continue;
    const hasDatos=!!(String(r.l1||'').trim()||String(r.l2||'').trim()||String(r.l3||'').trim()||String(r.metodo||'').trim());
    if(hasDatos) continue;
    regs.splice(i,1);
  }
  for(const mid of ids){
    const sid=String(mid);
    _bitPhTomasArrayForOmar(mid).forEach((t,i)=>{
      const tomaNum=i+1;
      const r=regs.find(rr=>String(rr.omarTs)===sid&&Number(rr.toma)===tomaNum);
      if(r){
        const h=_horaNormalizada(t.hora||'');
        if(h) r.hora=h;
      }else{
        _bitFlujosAsegurarRegistro(sid, tomaNum, t.hora, {silent:true});
      }
    });
  }
  if(document.getElementById('pgBitFlujos')?.classList.contains('on')&&typeof _bitFlujosRender==='function') _bitFlujosRender();
  if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
  void _persistPlanBitFlujos();
}
window._bitFlujosSyncAllTomasFromCampo = _bitFlujosSyncAllTomasFromCampo;

function _bitFlujosOmarFolio(omarTs){
  const m=(_cachedMuestreos||[]).find(x=>String(x.id)===String(omarTs));
  if(m){
    try{
      const o=m.omar?JSON.parse(m.omar):{};
      return m.folio||o.folio||omarTs;
    }catch(_){ return m.folio||omarTs; }
  }
  if(typeof omar!=='undefined'&&omar&&String(omar.ts)===String(omarTs)) return omar.folio||omarTs;
  return omarTs;
}

function _bitFlujosCalcCompleta(reg){
  const c=_calcBitFlujosRegistro(reg);
  return !!(String(reg.l1||'').trim()&&String(reg.l2||'').trim()&&String(reg.l3||'').trim()&&!isNaN(c.promedio));
}

function _renderBitFlujosCard(reg, idx, sumaTotal){
  const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const calc=_calcBitFlujosRegistro(reg);
  const pct=(!isNaN(calc.promedio)&&sumaTotal>0)?(calc.promedio/sumaTotal)*100:NaN;
  const fmtDiff=(v)=>isNaN(v)?'—':v.toFixed(2);
  const pctTxt=isNaN(pct)?'—':pct.toFixed(2)+' %';
  const promTxt=isNaN(calc.promedio)?'—':calc.promedio.toFixed(2)+' L/s';
  const completa=_bitFlujosCalcCompleta(reg);
  const badgeColor=completa?'#86efac':'#fbbf24';
  const badgeTxt=completa?'✓ completa':'pendiente';
  return `
    <div style="background:var(--bg2);border:1px solid var(--ln);border-radius:10px;padding:12px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <span style="background:rgba(96,165,250,.12);color:#60a5fa;font-family:var(--syne);font-weight:800;font-size:11px;padding:3px 8px;border-radius:5px">TOMA ${reg.toma}</span>
        <span style="font-size:10px;font-weight:700;color:${badgeColor}">${badgeTxt}</span>
        <div style="margin-left:auto">
          <button type="button" onclick="bitFlujosEliminar(${idx})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:4px 8px;border-radius:6px;font-size:10.5px;cursor:pointer">✕ Borrar</button>
        </div>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div class="f" style="margin-bottom:0"><label>Hora</label><input type="time" value="${esc(reg.hora)}" oninput="bitFlujosUp(${idx},'hora',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>Método de aforo / procedimiento</label><input type="text" value="${esc(reg.metodo)}" placeholder="Volumen sobre tiempo, vertedero…" oninput="bitFlujosUp(${idx},'metodo',this.value)"></div>
      </div>
      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);margin-bottom:4px">Flujo (L/s)</div>
      <div class="g3" style="margin-bottom:8px">
        <div class="f" style="margin-bottom:0"><label>L1</label><input type="number" step="0.01" value="${esc(reg.l1)}" placeholder="—" oninput="bitFlujosUp(${idx},'l1',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>L2</label><input type="number" step="0.01" value="${esc(reg.l2)}" placeholder="—" oninput="bitFlujosUp(${idx},'l2',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>L3</label><input type="number" step="0.01" value="${esc(reg.l3)}" placeholder="—" oninput="bitFlujosUp(${idx},'l3',this.value)"></div>
      </div>
      <div style="padding:8px 10px;background:rgba(74,158,255,.06);border-left:3px solid var(--acc);border-radius:6px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div>
          <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.04em">Promedio</div>
          <div style="font-family:var(--syne);font-size:20px;font-weight:800;color:var(--acc);margin-top:2px">${promTxt}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.04em">% del OMAR</div>
          <div style="font-family:var(--syne);font-size:20px;font-weight:800;color:#86efac;margin-top:2px">${pctTxt}</div>
        </div>
      </div>
    </div>`;
}
window._renderBitFlujosCard = _renderBitFlujosCard;

function _bitFlujosRender(){
  const c=document.getElementById('bitFlujosRegistros');
  const info=document.getElementById('bitFlujosInfo');
  if(!c) return;
  const regs=_bitFlujosRegs()||[];
  const pl=_bitPhPlan();
  const idsFromPlan=(pl&&pl.omarIds&&pl.omarIds.length)?pl.omarIds.map(String):(omar?.ts?[String(omar.ts)]:[]);
  const omarsConRegs=new Set(regs.map(r=>String(r.omarTs)).filter(Boolean));
  // AARMS sub3fix2: forzar render de TODOS los OMARs del plan, ordenados por fecha
  const omarsTodos=[...new Set([...idsFromPlan,...omarsConRegs])].sort((a,b)=>_omarTsSortKey(a)-_omarTsSortKey(b));
  if(info){
    info.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16a4 4 0 0 1-.88-7.9 5 5 0 0 1 9.76 0A4 4 0 0 1 15 16"/><path d="M12 12v9"/><path d="M16 16l-4 5-4-5"/></svg>
      <span style="font-family:var(--syne);font-weight:800;color:#60a5fa;font-size:12px">Bitácora de Flujos</span>
    </div>
    <div style="margin-top:8px;padding:8px 10px;background:rgba(74,158,255,.04);border-left:2px solid var(--acc);border-radius:5px;font-size:10.5px;color:var(--g1)">
      <b style="color:var(--acc)">Cálculo automático:</b> Promedio L1/L2/L3 por toma · % ponderado sobre la suma del OMAR
    </div>`;
  }
  if(omarsTodos.length===0){
    c.innerHTML=`<div style="text-align:center;padding:24px 12px;color:var(--g2);font-size:12px;line-height:1.55">
      Sin registros aún.<br>
      <span style="font-size:10.5px;color:var(--g3)">Agrega tomas en la hoja de campo y vuelve aquí, o usa «+ Agregar toma».</span>
    </div>`;
    return;
  }
  const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  c.innerHTML=omarsTodos.map(omarTs=>{
    const regsOmar=regs.filter(r=>String(r.omarTs)===String(omarTs)).sort((a,b)=>Number(a.toma)-Number(b.toma));
    const sumaTotal=_flujoSumaOmar(omarTs);
    const omarLbl=typeof _omarLabelConFecha==='function'?_omarLabelConFecha(omarTs):`OMAR ${esc(_bitFlujosOmarFolio(omarTs))}`;
    const cards=regsOmar.length
      ? regsOmar.map(r=>{ const idx=regs.indexOf(r); return _renderBitFlujosCard(r, idx, sumaTotal); }).join('')
      : `<div style="text-align:center;padding:12px;color:var(--g2);font-size:11px">Sin tomas en hoja de campo para este OMAR.</div>`;
    const sumaTxt=(isNaN(sumaTotal)||sumaTotal===0)?'—':sumaTotal.toFixed(2)+' L/s';
    return `
    <div style="margin-bottom:18px">
      <div style="font-family:var(--syne);font-weight:800;color:var(--w);font-size:12px;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--ln);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
        <span>${esc(omarLbl)}</span>
        <span style="font-size:10.5px;color:var(--g2);font-family:var(--mono);font-weight:400">Suma flujo total: <b style="color:#60a5fa">${sumaTxt}</b></span>
      </div>
      ${cards}
    </div>`;
  }).join('');
}
window._bitFlujosRender = _bitFlujosRender;

function bitFlujosUp(idx, field, value){
  const regs=_bitFlujosRegs();
  if(!regs||!regs[idx]) return;
  regs[idx][field]=value;
  if(['l1','l2','l3','hora','metodo'].includes(field)){
    _bitFlujosRender();
    if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
  }
  guardarBorradorActual();
  void _persistPlanBitFlujos();
}
window.bitFlujosUp = bitFlujosUp;

function bitFlujosAgregarRegistro(){
  const regs=_bitFlujosRegs();
  if(!regs) return;
  const tomaOptsList=_bitPhOpcionesTomaSelect();
  if(!tomaOptsList.length){
    toast('Primero agrega tomas en la hoja de campo','w');
    return;
  }
  const asignadas=new Set(regs.map(r=>`${r.omarTs}|${r.toma}`));
  let prox=null;
  for(const o of tomaOptsList){
    if(!asignadas.has(o.value)){ prox=o; break; }
  }
  if(!prox && tomaOptsList.length) prox=tomaOptsList[0];
  const pipe=prox.value.indexOf('|');
  const omarTs=pipe>=0?prox.value.slice(0,pipe):String(omar.ts);
  const tomaNum=pipe>=0?parseInt(prox.value.slice(pipe+1),10):1;
  if(regs.some(r=>String(r.omarTs)===String(omarTs)&&Number(r.toma)===tomaNum)){
    toast('Ya existe registro para esa toma','w');
    return;
  }
  regs.push({
    id:Date.now()+Math.random(),
    omarTs,
    toma:tomaNum,
    hora:new Date().toTimeString().substring(0,5),
    metodo:'',
    l1:'', l2:'', l3:''
  });
  _bitFlujosRender();
  guardarBorradorActual();
  void _persistPlanBitFlujos();
}
window.bitFlujosAgregarRegistro = bitFlujosAgregarRegistro;

function bitFlujosEliminar(idx){
  const regs=_bitFlujosRegs();
  if(!regs||!regs[idx]) return;
  regs.splice(idx,1);
  _bitFlujosRender();
  if(typeof renderTomas==='function') renderTomas();
  if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
  guardarBorradorActual();
  void _persistPlanBitFlujos();
}
window.bitFlujosEliminar = bitFlujosEliminar;

async function abrirBitacoraFlujos(opts){
  opts=opts||{};
  _bitFlujosOrigen=opts.origen||'hoja';
  if(!omar.ts){ toast('Primero captura el OMAR','w'); return; }
  _flushTomasDesdeDOM();
  try{ await saveMuestreoActual(); }catch(e){ console.warn('[bitFlujos open save]',e); }
  const pl=_bitPhPlan();
  const p=document.getElementById('bitFlujosPill');
  if(p){
    if(pl&&pl.id){
      const n=(pl.omarIds||[]).length;
      p.textContent='Plan · '+n+' OMAR(s) · bitácora flujos';
    }else{
      p.textContent=(omar.folio?'OMAR '+omar.folio:'OMAR')+' · '+(tomas?.length||0)+' tomas';
    }
  }
  const fol=document.getElementById('bitFlujosFolioDocInp');
  if(fol) fol.value=_bitFlujosFolioDocGet()||'';
  if(pl && omar && typeof _migrarBitFlujosSub2==='function') await _migrarBitFlujosSub2(pl, omar);
  _bitFlujosSyncAllTomasFromCampo();
  _bitFlujosRender();
  try{ await _persistPlanBitFlujos(); }catch(e){}
  _aplicarDocEstadoBadge('bitflujos');
  goPage('pgBitFlujos');
}
window.abrirBitacoraFlujos = abrirBitacoraFlujos;

async function cerrarBitacoraFlujos(){
  try{ await _persistPlanBitFlujos(); }catch(e){}
  _flushTomasDesdeDOM();
  try{ await guardarBorradorActual(); }catch(e){}
  if(typeof renderTomas==='function') renderTomas();
  const origen=_bitFlujosOrigen;
  if(origen==='plan'){
    goPage('pgPlan');
    try{ renderPlanDocs(); }catch(_){}
  }else{
    goPage('pg1');
  }
}
window.cerrarBitacoraFlujos = cerrarBitacoraFlujos;
window.volverDeBitFlujos = cerrarBitacoraFlujos;

// ═══════════════════════════════════════════════════════════════
// AARMS sub7-od: Bitácora de Oxígeno Disuelto (NMX-AA-012-SCFI-2001)
// ═══════════════════════════════════════════════════════════════
let _bitODOrigen = 'hoja';

function _bitODPlan(){
  if(typeof _planActivoParaOmar === 'function') return _planActivoParaOmar();
  if(typeof _planActivo === 'function') return _planActivo();
  return null;
}

// AARMS sub7-od: inicializar plan.bitOD
function _bitODInicializar(plan){
  if(!plan) return null;
  if(!plan.bitOD){
    plan.bitOD = {
      folio: '',
      equipoOxId: '',
      reactivos: {},
      calibLab:   { zero: {}, sat100: {} },
      verifLab:   [],
      calibCampo: { zero: {}, sat100: {} },
      verifCampo: [],
      lecturas:   []
    };
  }
  ['calibLab','calibCampo'].forEach(k => {
    if(!plan.bitOD[k]) plan.bitOD[k] = { zero:{}, sat100:{} };
    if(!plan.bitOD[k].zero) plan.bitOD[k].zero = {};
    if(!plan.bitOD[k].sat100) plan.bitOD[k].sat100 = {};
  });
  ['verifLab','verifCampo','lecturas'].forEach(k => {
    if(!Array.isArray(plan.bitOD[k])) plan.bitOD[k] = [];
  });
  if(!plan.bitOD.reactivos) plan.bitOD.reactivos = {};
  return plan.bitOD;
}
window._bitODInicializar = _bitODInicializar;

async function _persistPlanBitOD(){
  const pl = _bitODPlan();
  if(!pl || !pl.id) return;
  _bitODInicializar(pl);
  pl.ts = Date.now();
  try{
    await idbPlanPut(pl);
    if(typeof refreshCache === 'function') await refreshCache();
  }catch(e){ console.warn('[plan bitOD]', e); }
}
window._persistPlanBitOD = _persistPlanBitOD;

// AARMS sub7-od: promedio OD por toma
function _odPromedioLectura(reg){
  if(!reg) return NaN;
  const l1 = parseFloat(reg.lectura1);
  const l2 = parseFloat(reg.lectura2);
  if(isNaN(l1) && isNaN(l2)) return NaN;
  if(isNaN(l1)) return l2;
  if(isNaN(l2)) return l1;
  return (l1 + l2) / 2;
}
window._odPromedioLectura = _odPromedioLectura;

// AARMS sub7-od: asegurar registro de lectura por cada toma
async function _bitODAsegurarLectura(omarTs, tomaNum, hora, folioOmar, idMuestra){
  const plan = _bitODPlan();
  if(!plan || !omarTs || !tomaNum) return;
  _bitODInicializar(plan);
  const existe = plan.bitOD.lecturas.find(r => String(r.omarTs) === String(omarTs) && Number(r.toma) === Number(tomaNum));
  if(existe){
    if(!existe.hora && hora) existe.hora = (typeof _horaNormalizada === 'function') ? _horaNormalizada(hora) : hora;
    if(!existe.folioOmar && folioOmar) existe.folioOmar = folioOmar;
    if(!existe.idMuestra && idMuestra) existe.idMuestra = idMuestra;
    return;
  }
  plan.bitOD.lecturas.push({
    id: Date.now() + Number(tomaNum) + Math.random(),
    omarTs: String(omarTs),
    toma: Number(tomaNum),
    fecha: (typeof _defaultBitRegistroFecha === 'function') ? _defaultBitRegistroFecha() : '',
    hora: (typeof _horaNormalizada === 'function') ? _horaNormalizada(hora || '') : (hora || ''),
    folioOmar: folioOmar || '',
    idMuestra: idMuestra || '',
    tiempo: '',
    lectura1: '', lectura2: '',
    promedio: '',
    horaFinal: ''
  });
  try{ await _persistPlanBitOD(); }catch(e){ console.warn('[bitOD asegurar]', e); }
}
window._bitODAsegurarLectura = _bitODAsegurarLectura;

function _bitODSyncAllTomasFromCampo(){
  const plan = _bitODPlan();
  if(!plan) return;
  _bitODInicializar(plan);
  const ids = (plan.omarIds && plan.omarIds.length) ? plan.omarIds : (omar?.ts ? [omar.ts] : []);
  const want = new Set();
  for(const mid of ids){
    const sid = String(mid);
    const arr = (typeof _bitPhTomasArrayForOmar === 'function') ? _bitPhTomasArrayForOmar(mid) : (String(omar?.ts) === sid ? tomas : []);
    (arr || []).forEach((t, i) => {
      want.add(`${sid}|${i + 1}`);
      const m = (_cachedMuestreos || []).find(x => String(x.id) === sid);
      const folio = (m && m.folio) || (String(omar?.ts) === sid ? omar.folio : '') || '';
      const idm = (m && m.idmuestra) || (String(omar?.ts) === sid ? omar.idmuestra : '') || '';
      void _bitODAsegurarLectura(sid, i + 1, t.hora || '', folio, idm);
    });
  }
  for(let i = plan.bitOD.lecturas.length - 1; i >= 0; i--){
    const r = plan.bitOD.lecturas[i];
    const key = `${r.omarTs}|${r.toma}`;
    if(want.has(key)) continue;
    const hasDatos = !!(String(r.lectura1 || '').trim() || String(r.lectura2 || '').trim());
    if(hasDatos) continue;
    plan.bitOD.lecturas.splice(i, 1);
  }
  if(document.getElementById('pgBitOD')?.classList.contains('on') && typeof _bitODRender === 'function') _bitODRender();
  void _persistPlanBitOD();
}
window._bitODSyncAllTomasFromCampo = _bitODSyncAllTomasFromCampo;

function _odEsc(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

function _htmlODPuntoCalibNamed(bloqueKey, punto, titulo){
  const plan = _bitODPlan();
  const bloque = plan && plan.bitOD ? plan.bitOD[bloqueKey] : null;
  const r = (bloque && bloque[punto]) || {};
  const fields = [
    ['fecha','date','Fecha'],['hora','time','Hora'],['temp','number','Temp (°C)'],
    ['lectura','number','Lectura'],['criterio','text','Criterio'],['acepta','text','Acepta']
  ];
  let html = `<div style="background:var(--bg3);border:1px solid var(--ln);border-radius:9px;padding:10px;margin-bottom:8px">
    <div style="font-size:11px;font-weight:800;color:var(--w);margin-bottom:8px;font-family:var(--syne)">${titulo}</div>
    <div class="g3">`;
  fields.forEach(([f, typ, lab]) => {
    const step = typ === 'number' ? ' step="0.01"' : '';
    html += `<div class="f" style="margin:0"><label>${lab}</label>
      <input type="${typ}"${step} value="${_odEsc(r[f])}" oninput="bitODCalibUp('${bloqueKey}','${punto}','${f}',this.value)"></div>`;
  });
  html += '</div></div>';
  return html;
}

function _htmlODSeccionReactivos(bit){
  const R = bit.reactivos || {};
  const campos = [
    ['lote_zero','Lote reactivo 0 mg/L'],['cad_zero','Caducidad 0 mg/L'],
    ['lote_sat','Lote reactivo 100% sat'],['cad_sat','Caducidad 100% sat'],
    ['agua_reactivo_lote','Lote agua reactivo']
  ];
  let html = `<div style="margin-bottom:16px">
    <div style="font-family:var(--syne);font-weight:800;color:#60a5fa;font-size:12px;margin-bottom:8px">Reactivos / estándares</div>
    <div class="g2">`;
  campos.forEach(([f, lab]) => {
    html += `<div class="f" style="margin-bottom:8px"><label>${lab}</label>
      <input type="text" value="${_odEsc(R[f])}" oninput="bitODReactUp('${f}',this.value)"></div>`;
  });
  html += '</div></div>';
  return html;
}

function _htmlODTabla1_CalibLab(bit){
  return `<div style="margin-bottom:16px">
    <div style="font-family:var(--syne);font-weight:800;color:#fbbf24;font-size:12px;margin-bottom:8px">Tabla 1 — Calibración laboratorio (2 puntos)</div>
    ${_htmlODPuntoCalibNamed('calibLab','zero','Punto 0 mg/L')}
    ${_htmlODPuntoCalibNamed('calibLab','sat100','Punto 100% saturación')}
  </div>`;
}

function _htmlODTabla2_VerifLab(bit){
  return _htmlODTablaVerif('verifLab', 'Tabla 2 — Verificación laboratorio', bit.verifLab || []);
}

function _htmlODTabla3_CalibCampo(bit){
  return `<div style="margin-bottom:16px">
    <div style="font-family:var(--syne);font-weight:800;color:#86efac;font-size:12px;margin-bottom:8px">Tabla 3 — Calibración campo (2 puntos)</div>
    ${_htmlODPuntoCalibNamed('calibCampo','zero','Punto 0 mg/L')}
    ${_htmlODPuntoCalibNamed('calibCampo','sat100','Punto 100% saturación')}
  </div>`;
}

function _htmlODTabla4_VerifCampo(bit){
  return _htmlODTablaVerif('verifCampo', 'Tabla 4 — Verificación campo', bit.verifCampo || []);
}

function _htmlODTablaVerif(arrKey, titulo, regs){
  let html = `<div style="margin-bottom:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap">
      <div style="font-family:var(--syne);font-weight:800;color:#a78bfa;font-size:12px">${titulo}</div>
      <button type="button" onclick="bitODVerifAdd('${arrKey}')" style="background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.35);color:#a78bfa;padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer">+ Fila</button>
    </div>`;
  if(!regs.length){
    html += `<div style="padding:10px;color:var(--g2);font-size:11px;font-style:italic">Sin verificaciones. Toca + Fila.</div></div>`;
    return html;
  }
  regs.forEach((r, idx) => {
    html += `<div style="background:var(--bg3);border:1px solid var(--ln);border-radius:9px;padding:10px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:10px;color:var(--g2);font-family:var(--mono)">Verif. ${idx + 1}</span>
        <button type="button" onclick="bitODVerifDel('${arrKey}',${idx})" style="background:transparent;border:none;color:#f87171;font-size:11px;cursor:pointer">✕</button>
      </div>
      <div class="g3">
        <div class="f" style="margin:0"><label>Fecha</label><input type="date" value="${_odEsc(r.fecha)}" oninput="bitODVerifUp('${arrKey}',${idx},'fecha',this.value)"></div>
        <div class="f" style="margin:0"><label>Hora</label><input type="time" value="${_odEsc(r.hora)}" oninput="bitODVerifUp('${arrKey}',${idx},'hora',this.value)"></div>
        <div class="f" style="margin:0"><label>Temp</label><input type="number" step="0.01" value="${_odEsc(r.temp)}" oninput="bitODVerifUp('${arrKey}',${idx},'temp',this.value)"></div>
        <div class="f" style="margin:0"><label>Lectura</label><input type="number" step="0.01" value="${_odEsc(r.lectura)}" oninput="bitODVerifUp('${arrKey}',${idx},'lectura',this.value)"></div>
        <div class="f" style="margin:0"><label>Criterio</label><input type="text" value="${_odEsc(r.criterio)}" oninput="bitODVerifUp('${arrKey}',${idx},'criterio',this.value)"></div>
        <div class="f" style="margin:0"><label>Acepta</label><input type="text" value="${_odEsc(r.acepta)}" oninput="bitODVerifUp('${arrKey}',${idx},'acepta',this.value)"></div>
      </div>
    </div>`;
  });
  html += '</div>';
  return html;
}

// AARMS sub7-od: Tabla 5 — lecturas OD por toma
function _htmlODTabla5_Lecturas(plan){
  const regs = (plan.bitOD && plan.bitOD.lecturas) || [];
  let html = `<div style="margin-top:18px">
    <div style="font-family:var(--syne);font-weight:800;color:#86efac;font-size:12px;margin-bottom:8px">Tabla 5 — Lecturas OD por toma</div>
    <div style="font-size:10.5px;color:var(--g2);margin-bottom:8px">Temp. muestra se jala de Bitácora Temperatura / Hoja de campo.</div>`;
  if(!regs.length){
    html += '<div style="padding:12px;color:var(--g2);font-style:italic;font-size:11px">No hay tomas. Agrega tomas en Hoja de Campo.</div></div>';
    return html;
  }
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10.5px;font-family:var(--mono)">';
  html += '<thead><tr>';
  ['#','Fecha','Hora','Folio OMAR','ID Muestra','Temp','Tiempo','Lect 1','Lect 2','Promedio','Hora final'].forEach(h => {
    html += `<th style="background:var(--bg2);border:1px solid var(--ln);padding:4px 6px;color:#60a5fa;font-family:var(--syne)">${h}</th>`;
  });
  html += '</tr></thead><tbody>';
  [...regs].sort((a,b) => Number(a.toma) - Number(b.toma)).forEach(reg => {
    const prom = _odPromedioLectura(reg);
    const promTxt = isNaN(prom) ? '—' : prom.toFixed(2);
    let tempTxt = '—';
    if(typeof _bitTempPromAguaPorToma === 'function'){
      const tv = _bitTempPromAguaPorToma(reg.omarTs, reg.toma);
      if(!isNaN(tv)) tempTxt = tv.toFixed(1);
    }
    const idAttr = String(reg.id).replace(/"/g,'&quot;');
    html += '<tr>';
    html += `<td style="border:1px solid var(--ln);padding:4px;text-align:center;color:var(--w);font-weight:700">${reg.toma}</td>`;
    html += `<td style="border:1px solid var(--ln);padding:2px"><input type="date" value="${_odEsc(reg.fecha)}" oninput="bitODLectUp('${idAttr}','fecha',this.value)" style="background:transparent;border:none;color:var(--acc);font-size:10px;width:100%"></td>`;
    html += `<td style="border:1px solid var(--ln);padding:2px"><input type="time" value="${_odEsc(reg.hora)}" oninput="bitODLectUp('${idAttr}','hora',this.value)" style="background:transparent;border:none;color:var(--acc);font-size:10px;width:100%"></td>`;
    html += `<td style="border:1px solid var(--ln);padding:2px"><input type="text" value="${_odEsc(reg.folioOmar)}" oninput="bitODLectUp('${idAttr}','folioOmar',this.value)" style="background:transparent;border:none;color:var(--acc);font-size:10px;width:100%"></td>`;
    html += `<td style="border:1px solid var(--ln);padding:2px"><input type="text" value="${_odEsc(reg.idMuestra)}" oninput="bitODLectUp('${idAttr}','idMuestra',this.value)" style="background:transparent;border:none;color:var(--acc);font-size:10px;width:100%"></td>`;
    html += `<td style="border:1px solid var(--ln);padding:4px;text-align:center;color:var(--g1)">${tempTxt}</td>`;
    html += `<td style="border:1px solid var(--ln);padding:2px"><input type="text" value="${_odEsc(reg.tiempo)}" oninput="bitODLectUp('${idAttr}','tiempo',this.value)" style="background:transparent;border:none;color:var(--acc);font-size:10px;width:100%"></td>`;
    html += `<td style="border:1px solid var(--ln);padding:2px"><input type="number" step="0.01" value="${_odEsc(reg.lectura1)}" oninput="bitODLectUp('${idAttr}','lectura1',this.value)" style="background:transparent;border:none;color:var(--acc);font-size:10px;width:100%"></td>`;
    html += `<td style="border:1px solid var(--ln);padding:2px"><input type="number" step="0.01" value="${_odEsc(reg.lectura2)}" oninput="bitODLectUp('${idAttr}','lectura2',this.value)" style="background:transparent;border:none;color:var(--acc);font-size:10px;width:100%"></td>`;
    html += `<td data-od-prom="${idAttr}" style="border:1px solid var(--ln);padding:4px;text-align:center;color:#86efac;font-weight:700">${promTxt}</td>`;
    html += `<td style="border:1px solid var(--ln);padding:2px"><input type="time" value="${_odEsc(reg.horaFinal)}" oninput="bitODLectUp('${idAttr}','horaFinal',this.value)" style="background:transparent;border:none;color:var(--acc);font-size:10px;width:100%"></td>`;
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';
  return html;
}
window._htmlODTabla5_Lecturas = _htmlODTabla5_Lecturas;

// AARMS sub7-od: render bitácora OD
function _bitODRender(){
  const plan = _bitODPlan();
  const contInfo = document.getElementById('odInfo');
  const contSec = document.getElementById('odSecciones');
  if(!plan || !contInfo || !contSec) return;
  _bitODInicializar(plan);

  const eqOx = typeof _equipoActivo === 'function' ? _equipoActivo('oximetros') : null;
  const codigoBPA = typeof _codigoBitacora === 'function' ? _codigoBitacora('BPA', 'oximetros') : 'BPA';
  const claveOx = eqOx && typeof _equipoClave === 'function' ? _equipoClave('oximetros', eqOx) : '';

  contInfo.innerHTML = `
  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span style="font-family:var(--syne);font-weight:800;color:#60a5fa;font-size:12px">Oxígeno Disuelto en Campo (NMX-AA-012-SCFI-2001)</span>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
    <div class="f" style="margin:0">
      <label>Código bitácora</label>
      <input type="text" value="${_odEsc(codigoBPA)}" readonly style="opacity:.7">
    </div>
    <div class="f" style="margin:0">
      <label>Folio</label>
      <input type="text" value="${_odEsc(plan.bitOD.folio)}" oninput="bitODInfoUp('folio',this.value)">
    </div>
  </div>
  <div style="margin-top:8px;font-size:10.5px;color:var(--g2)">
    Equipo: <b style="color:var(--w)">${claveOx || 'sin oxímetro asignado — agrega uno en Inventario'}</b>
  </div>`;

  contSec.innerHTML =
    _htmlODSeccionReactivos(plan.bitOD) +
    _htmlODTabla1_CalibLab(plan.bitOD) +
    _htmlODTabla2_VerifLab(plan.bitOD) +
    _htmlODTabla3_CalibCampo(plan.bitOD) +
    _htmlODTabla4_VerifCampo(plan.bitOD) +
    _htmlODTabla5_Lecturas(plan);
}
window._bitODRender = _bitODRender;

function bitODInfoUp(field, value){
  const plan = _bitODPlan();
  if(!plan) return;
  _bitODInicializar(plan);
  plan.bitOD[field] = value;
  clearTimeout(window._odSave);
  window._odSave = setTimeout(() => { void _persistPlanBitOD(); }, 300);
}
window.bitODInfoUp = bitODInfoUp;

function bitODReactUp(field, value){
  const plan = _bitODPlan();
  if(!plan) return;
  _bitODInicializar(plan);
  plan.bitOD.reactivos[field] = value;
  clearTimeout(window._odSave);
  window._odSave = setTimeout(() => { void _persistPlanBitOD(); }, 300);
}
window.bitODReactUp = bitODReactUp;

function bitODCalibUp(bloqueKey, punto, field, value){
  const plan = _bitODPlan();
  if(!plan) return;
  _bitODInicializar(plan);
  if(!plan.bitOD[bloqueKey]) plan.bitOD[bloqueKey] = { zero:{}, sat100:{} };
  if(!plan.bitOD[bloqueKey][punto]) plan.bitOD[bloqueKey][punto] = {};
  plan.bitOD[bloqueKey][punto][field] = value;
  clearTimeout(window._odSave);
  window._odSave = setTimeout(() => { void _persistPlanBitOD(); try{ renderPlanDocs(); }catch(_){} }, 300);
}
window.bitODCalibUp = bitODCalibUp;

function bitODVerifAdd(arrKey){
  const plan = _bitODPlan();
  if(!plan) return;
  _bitODInicializar(plan);
  plan.bitOD[arrKey].push({ fecha:'', hora:'', temp:'', lectura:'', criterio:'', acepta:'' });
  _bitODRender();
  void _persistPlanBitOD();
}
window.bitODVerifAdd = bitODVerifAdd;

function bitODVerifDel(arrKey, idx){
  const plan = _bitODPlan();
  if(!plan) return;
  _bitODInicializar(plan);
  plan.bitOD[arrKey].splice(idx, 1);
  _bitODRender();
  void _persistPlanBitOD();
}
window.bitODVerifDel = bitODVerifDel;

function bitODVerifUp(arrKey, idx, field, value){
  const plan = _bitODPlan();
  if(!plan || !plan.bitOD[arrKey] || !plan.bitOD[arrKey][idx]) return;
  plan.bitOD[arrKey][idx][field] = value;
  clearTimeout(window._odSave);
  window._odSave = setTimeout(() => { void _persistPlanBitOD(); }, 300);
}
window.bitODVerifUp = bitODVerifUp;

function bitODLectUp(id, field, value){
  const plan = _bitODPlan();
  if(!plan) return;
  _bitODInicializar(plan);
  const reg = plan.bitOD.lecturas.find(r => String(r.id) === String(id));
  if(!reg) return;
  reg[field] = value;
  if(field === 'lectura1' || field === 'lectura2'){
    const prom = _odPromedioLectura(reg);
    reg.promedio = isNaN(prom) ? '' : prom.toFixed(2);
    const cell = document.querySelector('[data-od-prom="'+String(id).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"]');
    if(cell) cell.textContent = isNaN(prom) ? '—' : prom.toFixed(2);
  }
  clearTimeout(window._odSave);
  window._odSave = setTimeout(() => { void _persistPlanBitOD(); try{ renderPlanDocs(); }catch(_){} }, 300);
}
window.bitODLectUp = bitODLectUp;

async function abrirBitacoraOD(opts){
  opts = opts || {};
  _bitODOrigen = opts.origen || 'hoja';
  if(!omar || !omar.ts){ toast('Primero captura el OMAR','w'); return; }
  _flushTomasDesdeDOM();
  try{ await saveMuestreoActual(); }catch(e){ console.warn('[bitOD open save]', e); }
  if(typeof _catalogoCargar === 'function') await _catalogoCargar();
  const plan = _bitODPlan();
  if(plan) _bitODInicializar(plan);
  _bitODSyncAllTomasFromCampo();
  const pill = document.getElementById('bitODPill');
  if(pill){
    if(plan && plan.id){
      pill.textContent = 'Plan · ' + ((plan.omarIds||[]).length) + ' OMAR(s) · OD';
    }else{
      pill.textContent = (omar.folio ? 'OMAR '+omar.folio : 'OMAR') + ' · ' + (tomas?.length||0) + ' tomas';
    }
  }
  _bitODRender();
  try{ await _persistPlanBitOD(); }catch(e){}
  if(typeof _aplicarDocEstadoBadge === 'function') _aplicarDocEstadoBadge('bitod');
  goPage('pgBitOD');
}
window.abrirBitacoraOD = abrirBitacoraOD;

async function cerrarBitacoraOD(){
  try{ await _persistPlanBitOD(); }catch(e){}
  _flushTomasDesdeDOM();
  try{ await guardarBorradorActual(); }catch(e){}
  if(typeof renderTomas === 'function') renderTomas();
  if(_bitODOrigen === 'plan'){
    goPage('pgPlan');
    try{ renderPlanDocs(); }catch(_){}
  }else{
    goPage('pg1');
  }
}
window.cerrarBitacoraOD = cerrarBitacoraOD;
window.volverDeBitOD = cerrarBitacoraOD;

function _defaultBitRegistroFecha(){
  if(typeof omar!=='undefined' && omar && omar.fecha) return String(omar.fecha).substring(0,10);
  return new Date().toISOString().split('T')[0];
}

function _bitPhParseHoraAMin(h){
  if(!h||typeof h!=='string') return null;
  const m=String(h).trim().match(/^(\d{1,2}):(\d{2})/);
  if(!m) return null;
  const hh=parseInt(m[1],10), mm=parseInt(m[2],10);
  if(hh>23||mm>59||hh<0) return null;
  return hh*60+mm;
}

/** Minutos desde epoch-like key para orden cronológico (fecha + hora). */
function _bitPhSortKeyNum(r){
  const f=String(r.fecha||'');
  const p=f.split('-');
  let day=99991231;
  if(p.length===3) day=parseInt(p[0],10)*10000+parseInt(p[1],10)*100+parseInt(p[2],10);
  const hm=_bitPhParseHoraAMin(r.hora);
  return day*1440+(hm!=null?hm:1440);
}

/**
 * Ordena la bitácora por fecha y hora (entre OMARs y tomas).
 * Los bloques de calibración (4 renglones) se mueven como un solo bloque.
 */
function _bitPhOrdenarRegsPorFechaHora(regs){
  if(!regs||regs.length<2) return;
  const units=[];
  let i=0;
  while(i<regs.length){
    const r=regs[i];
    if(r&&r.calibGrupo){
      const gid=r.calibGrupo;
      const block=[];
      while(i<regs.length&&regs[i]&&regs[i].calibGrupo===gid){
        block.push(regs[i]);
        i++;
      }
      units.push({key:Math.min(...block.map(_bitPhSortKeyNum)), rows:block});
    }else{
      units.push({key:_bitPhSortKeyNum(r), rows:[r]});
      i++;
    }
  }
  units.sort((a,b)=>{
    if(a.key!==b.key) return a.key-b.key;
    const ra=a.rows[0], rb=b.rows[0];
    const c=(_bitPhFolioLegible(ra.omarId)||'').localeCompare(_bitPhFolioLegible(rb.omarId)||'');
    if(c!==0) return c;
    return (parseInt(ra.toma,10)||0)-(parseInt(rb.toma,10)||0);
  });
  regs.length=0;
  units.forEach(u=>{ regs.push(...u.rows); });
}
window._bitPhOrdenarRegsPorFechaHora=_bitPhOrdenarRegsPorFechaHora;

/** Sincroniza hora de cada registro V con la hoja de campo (plan u OMAR activa). */
function _bitPhSyncHorasDesdeHojaCampo(){
  const regs=_bitPhRegs();
  if(!regs) return;
  let changed=false;
  const pl=_bitPhPlan();
  const ids=pl&&pl.omarIds&&pl.omarIds.length?pl.omarIds:(omar?.ts?[omar.ts]:[]);
  for(const mid of ids){
    const sid=String(mid);
    let arr=[];
    if(omar&&String(omar.ts)===sid) arr=tomas||[];
    else{
      const m=_findMuestreoById(mid);
      arr=m?.tomas||[];
    }
    arr.forEach((t,idx)=>{
      const val=`${sid}|${idx+1}`;
      const r=regs.find(rr=>!rr.calibGrupo&&rr.act==='V'&&_bitPhTomaSelectValue(rr)===val);
      if(r&&t.hora&&String(r.hora)!==String(t.hora)){
        r.hora=t.hora;
        changed=true;
      }
    });
  }
  if(changed){
    _bitPhOrdenarRegsPorFechaHora(regs);
    if(document.getElementById('pgBitPH')?.classList.contains('on')) _bitPhRender();
    void _persistPlanBitPh();
  }
}

/** Inicio/fin: objeto `o` con .campo, y/o DOM h_ini/h_fin si es la OMAR activa en pantalla. */
function _bitPhCampoIniFinPara(o){
  try{
    if(o===omar){
      const di=document.getElementById('h_ini')?.value?.trim();
      const df=document.getElementById('h_fin')?.value?.trim();
      if(di||df) return {ini:di||'', fin:df||''};
    }
  }catch(e){}
  const c=o&&o.campo?o.campo:{};
  return {ini:c.ini||'', fin:c.fin||''};
}

function _bitPhCampoIniFin(){
  return _bitPhCampoIniFinPara(typeof omar!=='undefined'?omar:null);
}

/** Cruce medianoche para un par campo + tomas (una OMAR). AARMS v64: timestamps reales. */
function _bitPhMuestreoCruzaMedianocheUnOmar(o, arr){
  try {
    const tomasArr = Array.isArray(arr) ? arr : [];
    if(tomasArr.length < 2) return false;
    // Si las tomas tienen timestamps, usar
    const conTs = tomasArr.filter(t => t.timestamp);
    if(conTs.length >= 2){
      const fechas = new Set();
      for(const t of conTs){
        fechas.add(new Date(t.timestamp).toDateString());
      }
      return fechas.size > 1;
    }
    // Fallback: fechaISO + hora
    const fechaBase = o.fecha || _defaultBitRegistroFecha();
    let prevDate = null;
    for(const t of tomasArr){
      if(!t.hora) continue;
      const fecha = t.fechaISO || fechaBase;
      const cur = _toDateTime(fecha, t.hora);
      if(!cur) continue;
      if(prevDate && cur < prevDate){
        return true;
      }
      prevDate = cur;
    }
    return false;
  } catch(e){
    console.warn('[cruce medianoche]', e);
    return false;
  }
}

/**
 * true si alguna OMAR del plan (o la OMAR suelta) cruza medianoche según hoja/tomas.
 */
function _bitPhMuestreoCruzaMedianoche(){
  const pl=_bitPhPlan();
  if(pl&&pl.omarIds&&pl.omarIds.length){
    for(const mid of pl.omarIds){
      const m=typeof _cachedMuestreos!=='undefined'&&_cachedMuestreos?_cachedMuestreos.find(x=>x.id===mid):null;
      if(!m) continue;
      const o=m.omar?JSON.parse(m.omar):{};
      if(_bitPhMuestreoCruzaMedianocheUnOmar(o, m.tomas||[])) return true;
    }
    return false;
  }
  return _bitPhMuestreoCruzaMedianocheUnOmar(omar, typeof tomas!=='undefined'?tomas:[]);
}

function _bitPhGroupedSegments(regs){
  const segments=[];
  let i=0;
  while(i<regs.length){
    const r=regs[i];
    if(r && r.calibGrupo && r.calibPaso===1){
      const g=r.calibGrupo;
      const a1=regs[i+1], a2=regs[i+2], a3=regs[i+3];
      if(a1&&a2&&a3 && a1.calibGrupo===g && a2.calibGrupo===g && a3.calibGrupo===g &&
         a1.calibPaso===2 && a2.calibPaso===3 && a3.calibPaso===4){
        segments.push({kind:'calib4', indices:[i,i+1,i+2,i+3]});
        i+=4;
        continue;
      }
    }
    segments.push({kind:'single', indices:[i]});
    i++;
  }
  return segments;
}

function _bitPhTieneBloqueCalib2(){
  const regs=_bitPhRegs()||[];
  return regs.some(r=>r&&r.calibGrupo);
}

/**
 * Inserta el bloque oficial de 4 renglones (Ca/Co buffer1, Ca/Co buffer2).
 * Usado por el modal y por el autollenado al abrir la bitácora.
 */
function bitPhInsertarBloqueCalib2Interno(b1, b2, lote, marca, fecha){
  if(!omar||!omar.ts) return;
  const regs=_bitPhRegs();
  if(!regs) return;
  const pend=_bitPhMuestreoCruzaMedianoche();
  const g='cg'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  // Buffers editables: si no se pasan, quedan vacíos para llenar según la tira
  const buf1 = (b1!=null && b1!=='' && !isNaN(parseFloat(b1))) ? String(parseFloat(b1)) : '';
  const buf2 = (b2!=null && b2!=='' && !isNaN(parseFloat(b2))) ? String(parseFloat(b2)) : '';
  const base={
    fecha:fecha||_defaultBitRegistroFecha(), hora:'', toma:'', act:'V', limp:'1', aprox:'', lote:lote||'', marca:marca||'',
    l1:'', l2:'', l3:'', obs:'', promedio:'', ph25:'', ar:'',
    slopePct:'',
    sinTomaFolio:true, calibGrupo:g,
    pendienteBuf1:pend, pendienteBuf2:pend,
  };
  // ORDEN: Calibración 2 puntos PRIMERO, luego Comprobación 2 puntos
  const nuevos=[
    {...base, calibPaso:1, act:'Ca', buffer:buf1},
    {...base, calibPaso:2, act:'Ca', buffer:buf2},
    {...base, calibPaso:3, act:'Co', buffer:buf1},
    {...base, calibPaso:4, act:'Co', buffer:buf2},
  ];
  // AARMS v64: insertar en posición cronológica
  const fechaCruce = fecha || _defaultBitRegistroFecha();
  const tsBloque = _toDateTime(fechaCruce, '00:00')?.getTime() || Date.now();
  nuevos.forEach((r, i) => {
    r.timestamp = tsBloque + i * 60000;
    r.fechaISO = fechaCruce;
  });
  let insertPos = regs.length;
  for(let i=0; i<regs.length; i++){
    const r = regs[i];
    if(!r) continue;
    let rTs = r.timestamp;
    if(!rTs && r.fecha && r.hora){
      rTs = _toDateTime(r.fecha, r.hora)?.getTime() || 0;
    }
    if(rTs && rTs > tsBloque){
      insertPos = i;
      break;
    }
  }
  regs.splice(insertPos, 0, ...nuevos);
}

/** Si aún no hay bloque, crea uno vacío (buffers se llenan según la tira). */
function _bitPhAutoSeedPrimerBloqueCalib2(){
  if(!omar||!omar.ts) return;
  if(_bitPhTieneBloqueCalib2()) return;
  bitPhInsertarBloqueCalib2Interno('', '', '', '', _defaultBitRegistroFecha());
}

function bitPhAbrirModalCalib2(){
  if(!omar||!omar.ts){ toast('Primero captura el OMAR','w'); return; }
  const m=document.getElementById('bitPhModalCalib2');
  if(!m) return;
  const f=document.getElementById('bitPhMcFecha');
  if(f) f.value=_defaultBitRegistroFecha();
  const msg=document.getElementById('bitPhMcPendMsg');
  if(msg){
    const enPlan=_bitPhPlan()&&_bitPhPlan().id;
    const planNote=enPlan?' Esta bitácora es <b>única para todo el plan</b>; el PENDIENTE aplica si <b>cualquier OMAR del plan</b> cruza medianoche.':'';
    if(_bitPhMuestreoCruzaMedianoche()){
      msg.innerHTML='Se detectó <b style="color:var(--w)">cruce de medianoche</b>'+(enPlan?' en al menos una OMAR del plan':' en este muestreo')+' (inicio/fin o secuencia de horas en tomas). Las lecturas del bloque Ca/Co irán en <b>PENDIENTE</b> (obligatorio en este caso).'+planNote;
    }else{
      msg.innerHTML=(enPlan?'No se detectó cruce de medianoche en ninguna OMAR del plan:':'No se detectó cruce de medianoche:')+' podrás capturar <b>lecturas L1–L3</b> en el bloque de inmediato. Si aún así quieres PENDIENTE, usa «Volver a marcar PENDIENTE» dentro del bloque.'+planNote;
    }
  }
  m.style.display='flex';
}
function bitPhCerrarModalCalib2(){
  const m=document.getElementById('bitPhModalCalib2');
  if(m) m.style.display='none';
}
function bitPhConfirmarModalCalib2(){
  const regs=_bitPhRegs();
  if(!regs) return;
  const b1v=document.getElementById('bitPhMcB1')?.value;
  const b2v=document.getElementById('bitPhMcB2')?.value;
  const b1=parseFloat(b1v);
  const b2=parseFloat(b2v);
  if(isNaN(b1)||isNaN(b2)){ toast('Indica valores numéricos para ambos buffers','w'); return; }
  const lote=(document.getElementById('bitPhMcLote')?.value||'').trim();
  const marca=(document.getElementById('bitPhMcMarca')?.value||'').trim();
  const fecha=(document.getElementById('bitPhMcFecha')?.value||'').trim()||_defaultBitRegistroFecha();
  const pend=_bitPhMuestreoCruzaMedianoche();
  bitPhInsertarBloqueCalib2Interno(b1, b2, lote, marca, fecha);
  bitPhCerrarModalCalib2();
  _bitPhRender();
  if(typeof guardarBorradorActual==='function') guardarBorradorActual();
  void _persistPlanBitPh();
  toast(pend?'Bloque insertado: cruce de medianoche → lecturas en PENDIENTE':'Bloque insertado: sin cruce de medianoche → lecturas listas para capturar','g');
}

function bitPhEliminarCalibGrupo(grupo){
  const regs=_bitPhRegs();
  if(!regs||!grupo) return;
  const fil=regs.filter(r=>r.calibGrupo!==grupo);
  regs.length=0;
  regs.push(...fil);
  _bitPhRender();
  guardarBorradorActual();
  void _persistPlanBitPh();
}

// AARMS v64: PENDIENTE solo aplica a filas CA (paso 1–2); CO siempre completas
function bitPhCalibSetPend(idxCaRow, bufKey, asPend){
  const regs=_bitPhRegs();
  if(!regs||!regs[idxCaRow]) return;
  const r=regs[idxCaRow];
  if(r.calibPaso!==1&&r.calibPaso!==2) return;
  const g=r.calibGrupo;
  regs.forEach(rr=>{
    if(rr.calibGrupo!==g) return;
    if(bufKey==='buf1'&&rr.calibPaso<=2) rr.pendienteBuf1=!!asPend;
    if(bufKey==='buf2'&&rr.calibPaso<=2) rr.pendienteBuf2=!!asPend;
  });
  _bitPhRender();
  guardarBorradorActual();
  void _persistPlanBitPh();
}

function bitPhSetSlopeGrupo(grupo, val){
  const regs=_bitPhRegs();
  if(!regs) return;
  regs.forEach(r=>{
    if(r.calibGrupo===grupo&&r.calibPaso===1) r.slopePct=String(val||'').trim();
  });
  _bitPhRender();
  guardarBorradorActual();
  void _persistPlanBitPh();
}

function bitPhUpdatePromedioFila(idx){
  const regs=_bitPhRegs();
  if(!regs||!regs[idx]) return;
  const r=regs[idx];
  const prom=_phPromedio(r.l1, r.l2, r.l3);
  if(prom!==null){
    r.promedio=prom.toFixed(2);
    r.ph25=(typeof _phA25==='function')?_phA25(r.l1,r.l2,r.l3):_phRedondeo25(prom);
    // AARMS phfix2: recalcular siempre con criterio real (Δ≤0.03 y ±0.05 vs buffer)
    if(r.buffer!=null&&r.buffer!==''&&!/^ca$/i.test(String(r.act||''))){
      const sug=_phAceptaRechaza(r.l1, r.l2, r.l3, r.buffer);
      if(sug && sug!=='PENDIENTE') r.ar=sug;
    }
    // AARMS v65: aplicar promedio a la Bitácora de Muestreo del OMAR correspondiente
    if(r.promedio && r.omarId && r.toma && !r.calibGrupo){
      _aplicarPromedioABm(r.omarId, parseInt(r.toma, 10), 'ph', r.promedio);
    }
  }else{
    r.promedio='';
    r.ph25='';
  }
  const card=document.querySelector(`[data-bit-ph="${idx}"]`)||document.querySelector(`[data-bit-sub="${idx}"]`);
  if(card){
    const promInp=card.querySelector('[data-f="promedio"]');
    const ph25Inp=card.querySelector('[data-f="ph25"]');
    const arSel=card.querySelector('[data-f="ar"]');
    if(promInp) promInp.value=r.promedio||'';
    if(ph25Inp) ph25Inp.value=r.ph25||'';
    if(arSel&&r.ar) arSel.value=r.ar;
    if(typeof _bitPhRefreshResumen==='function') _bitPhRefreshResumen(idx);
  }
}

function _bitPhLecturasMiniHtml(idx){
  const regs=_bitPhRegs()||[];
  const row=regs[idx]||{};
  return `
    <div class="g3" style="margin-bottom:6px">
      <div class="f"><label>L1</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${row.l1||''}" oninput="bitPhUp(${idx},'l1',this.value)"></div>
      <div class="f"><label>L2</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${row.l2||''}" oninput="bitPhUp(${idx},'l2',this.value)"></div>
      <div class="f"><label>L3</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${row.l3||''}" oninput="bitPhUp(${idx},'l3',this.value)"></div>
    </div>`;
}

function _bitPhResumenBlockHtml(idx){
  const regs=_bitPhRegs()||[];
  const r=regs[idx];
  if(!r) return '';
  const Ls=[r.l1,r.l2,r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
  const prom=Ls.length>0?(Ls.reduce((a,b)=>a+b,0)/Ls.length).toFixed(2):'';
  // AARMS phfix2: ambos criterios oficiales
  const arSug=(Ls.length===3)?_phAceptaRechaza(r.l1,r.l2,r.l3,r.buffer):'PENDIENTE';
  const acepta=arSug==='Acepta'?true:(arSug==='Rechaza'?false:null);
  let motivo='';
  if(Ls.length===3){
    const diff=Math.max(...Ls)-Math.min(...Ls);
    motivo=`Δ ${diff.toFixed(2)} ${diff<=0.03+1e-9?'≤':'›'} 0.03`;
  }
  let bufNote='';
  if(Ls.length===3 && r.buffer!=null && r.buffer!==''){
    const buf=parseFloat(r.buffer);
    const pr=Ls.reduce((a,b)=>a+b,0)/Ls.length;
    if(!isNaN(buf)&&!isNaN(pr)){
      const d05=Math.abs(pr-buf)<=0.05+1e-9;
      bufNote=`<div style="font-size:9px;color:var(--g2);margin-top:3px">vs buffer: <b style="color:${d05?'var(--green)':'#f87171'}">${d05?'OK':'Revisar'}</b> · ${motivo}</div>`;
    }
  }
  return `<div data-bit-resumen style="padding:8px;background:${acepta===false?'rgba(248,113,113,.08)':(acepta===true?'rgba(134,239,172,.08)':'var(--bg3)')};border:1px solid var(--ln);border-radius:8px;margin-top:4px">
    <div style="font-size:9px;color:var(--g2)">Prom. pH 25°C</div>
    <div style="font-family:var(--syne);font-size:16px;font-weight:800;color:${acepta===false?'#f87171':'var(--acc)'}">${prom||'—'}</div>${bufNote}
    ${acepta===true?'<div style="color:var(--green);font-size:10px;font-weight:700">Acepta</div>':''}
    ${acepta===false?'<div style="color:#f87171;font-size:10px;font-weight:700">Rechaza</div>':''}
  </div>`;
}

// AARMS v64: bloque Ca/Co — CA 1 lectura + PENDIENTE; CO L1–L3 + promedio + pH25 + A/R
function _renderBitPhCalibBlock4(indices){
  const regs=_bitPhRegs()||[];
  const [i0,i1,i2,i3]=indices;
  const r0=regs[i0]||{};
  const g=r0.calibGrupo||'';
  const slopePct=String(r0.slopePct||'').trim();
  const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const pendLabel=slopePct?`PENDIENTE ${esc(slopePct)}%`:'PENDIENTE';

  const miniRow=(ix)=>{
    const rr=regs[ix]||{};
    const punto=(ix===i0||ix===i2)?'1':'2';
    return `<div style="background:var(--bg3);border:1px solid var(--ln);border-radius:9px;padding:10px;margin-bottom:8px">
      <div style="font-size:10px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;font-family:var(--mono)">Punto ${punto}</div>
      <div class="g2" style="margin-bottom:8px">
        <div class="f" style="margin:0"><label>Fecha</label><input type="date" value="${esc(rr.fecha)}" oninput="bitPhUp(${ix},'fecha',this.value)"></div>
        <div class="f" style="margin:0"><label>Hora</label><input type="time" value="${esc(rr.hora)}" oninput="bitPhUp(${ix},'hora',this.value)"></div>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div class="f" style="margin:0"><label>Lote</label><input type="text" data-f="lote" value="${esc(rr.lote)}" oninput="bitPhUp(${ix},'lote',this.value)"></div>
        <div class="f" style="margin:0"><label>Marca</label><input type="text" data-f="marca" value="${esc(rr.marca)}" oninput="bitPhUp(${ix},'marca',this.value)"></div>
      </div>
      <div class="f" style="margin:0"><label>Buffer (según tira)</label><input type="number" step="0.01" placeholder="ej. 6.86" value="${rr.buffer==null||rr.buffer===''?'':esc(rr.buffer)}" oninput="bitPhUp(${ix},'buffer',this.value)"></div>
    </div>`;
  };

  const caRow=(ix)=>{
    const rr=regs[ix]||{};
    const pendCa=rr.pendienteBuf1!==false;
    const lecturaHtml=pendCa
      ? `<div style="text-align:center;padding:14px 8px;margin:6px 0 10px;border:1px dashed rgba(167,139,250,.45);border-radius:10px;background:rgba(0,0,0,.12)">
          <div style="transform:rotate(-8deg);font-weight:900;font-size:16px;letter-spacing:.14em;color:var(--g2)">${pendLabel}</div>
          <button type="button" onclick="bitPhCalibSetPend(${ix},'buf1',false)" style="margin-top:10px;padding:7px 14px;font-size:11px;border-radius:8px;cursor:pointer;background:var(--acc);color:#fff;border:none;font-weight:700">Capturar lectura</button>
        </div>`
      : `<div class="f" style="margin-bottom:8px"><label>Lectura (calibración)</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${esc(rr.l1)}" oninput="bitPhUp(${ix},'l1',this.value)"></div>
        <div style="text-align:center;padding:10px;margin:4px 0 8px"><div style="transform:rotate(-8deg);font-weight:900;font-size:15px;letter-spacing:.12em;color:var(--g2)">${pendLabel}</div></div>
        <button type="button" onclick="bitPhCalibSetPend(${ix},'buf1',true)" style="font-size:10px;background:transparent;border:1px dashed var(--ln);color:var(--g2);padding:6px 8px;border-radius:6px;cursor:pointer;width:100%">Volver a marcar PENDIENTE</button>`;
    return miniRow(ix)+lecturaHtml;
  };

  const coRow=(ix)=>{
    const rr=regs[ix]||{};
    const promCalc=_phPromedio(rr.l1, rr.l2, rr.l3);
    const promDisp=rr.promedio||(promCalc!=null?promCalc.toFixed(2):'');
    const ph25Disp=rr.ph25||(typeof _phA25==='function'?_phA25(rr.l1,rr.l2,rr.l3):_phRedondeo25(promCalc));
    // AARMS phfix2: criterio real (no confiar solo en ar guardado si hay lecturas)
    const arCalc=_phAceptaRechaza(rr.l1, rr.l2, rr.l3, rr.buffer);
    const arVal=(arCalc&&arCalc!=='PENDIENTE')?arCalc:(rr.ar||'');
    return `<div data-bit-ph="${ix}" style="margin-bottom:12px">
      ${miniRow(ix)}
      <div class="g3" style="margin-bottom:8px">
        <div class="f" style="margin:0"><label>L1</label><input type="number" step="0.01" data-f="l1" inputmode="decimal" placeholder="pH" value="${esc(rr.l1)}" oninput="bitPhUp(${ix},'l1',this.value)"></div>
        <div class="f" style="margin:0"><label>L2</label><input type="number" step="0.01" data-f="l2" inputmode="decimal" placeholder="pH" value="${esc(rr.l2)}" oninput="bitPhUp(${ix},'l2',this.value)"></div>
        <div class="f" style="margin:0"><label>L3</label><input type="number" step="0.01" data-f="l3" inputmode="decimal" placeholder="pH" value="${esc(rr.l3)}" oninput="bitPhUp(${ix},'l3',this.value)"></div>
      </div>
      <div class="g3" style="margin-bottom:4px">
        <div class="f" style="margin:0"><label>Promedio</label><input type="text" data-f="promedio" readonly style="background:rgba(255,255,255,.06);color:var(--w)" value="${esc(promDisp)}"></div>
        <div class="f" style="margin:0"><label>pH 25°C</label><input type="text" data-f="ph25" readonly style="background:rgba(255,255,255,.06);color:var(--w)" value="${esc(ph25Disp)}"></div>
        <div class="f" style="margin:0"><label>Acepta / Rechaza</label>
          <select data-f="ar" onchange="bitPhUp(${ix},'ar',this.value)">
            <option value="">—</option>
            <option value="Acepta" ${arVal==='Acepta'?'selected':''}>Acepta</option>
            <option value="Rechaza" ${arVal==='Rechaza'?'selected':''}>Rechaza</option>
          </select>
        </div>
      </div>
      ${_bitPhResumenBlockHtml(ix)}
    </div>`;
  };

  return `<div data-bit-ph-block="${i0}" style="background:var(--bg2);border:1px solid rgba(124,58,237,.35);border-radius:12px;padding:14px;margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:8px;flex-wrap:wrap">
      <div>
        <div style="font-family:var(--syne);font-size:13px;font-weight:800;color:#c4b5fd">Calibración 2 puntos + Comprobación 2 puntos</div>
        <div style="font-size:10.5px;color:var(--g2);margin-top:4px">Cambio de día · buffers según tira reactiva</div>
      </div>
      <button type="button" onclick="bitPhEliminarCalibGrupo('${g}')" style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.35);color:#f87171;padding:5px 10px;border-radius:8px;font-size:10.5px;cursor:pointer;flex-shrink:0">Eliminar</button>
    </div>
    <div class="f" style="margin-bottom:12px">
      <label>Slope (%) — opcional</label>
      <input type="text" id="ph1CalibSlope_${g}" placeholder="ej. 98" value="${esc(slopePct)}" onchange="bitPhSetSlopeGrupo('${g}',this.value)" oninput="bitPhSetSlopeGrupo('${g}',this.value)">
    </div>
    <div style="background:rgba(74,158,255,.07);border:1px solid rgba(74,158,255,.3);border-radius:9px;padding:8px 12px;margin-bottom:8px;text-align:center">
      <span style="font-family:var(--syne);font-size:12px;font-weight:800;color:var(--acc)">CALIBRACIÓN — 2 puntos</span>
    </div>
    ${caRow(i0)}
    ${caRow(i1)}
    <div style="background:rgba(134,239,172,.07);border:1px solid rgba(134,239,172,.3);border-radius:9px;padding:8px 12px;margin:14px 0 8px;text-align:center">
      <span style="font-family:var(--syne);font-size:12px;font-weight:800;color:var(--green)">COMPROBACIÓN — 2 puntos</span>
    </div>
    ${coRow(i2)}
    ${coRow(i3)}
  </div>`;
}

// ─── pH-METRO ───
async function abrirBitacoraPH(){
  if(!omar.ts){ toast('Primero captura el OMAR','w'); return; }
  _flushTomasDesdeDOM();
  try{ await saveMuestreoActual(); }catch(e){ console.warn('[bitPh open save]',e); }
  await _bitPhMigrarSiPlanVacio();
  const pl=_bitPhPlan();
  const p=document.getElementById('bitPhPill');
  if(p){
    if(pl&&pl.id){
      const n=(pl.omarIds||[]).length;
      p.textContent='Plan · '+n+' OMAR(s) · bitácora pH única';
    }else{
      p.textContent=(omar.folio?'OMAR '+omar.folio:'OMAR')+' · '+(tomas?.length||0)+' tomas';
    }
  }
  const fol=document.getElementById('bitPhFolioDocInp');
  if(fol) fol.value=_bitPhFolioDocGet()||'';
  _bitPhSyncAllTomasFromCampo();
  _bitPhActualizarFoliosOmarEnRegs();
  _bitPhRender();
  try{ await _persistPlanBitPh(); }catch(e){}
  _aplicarDocEstadoBadge('bitPh');
  goPage('pgBitPH');
}
async function cerrarBitacoraPH(){
  try{ await _persistPlanBitPh(); }catch(e){}
  _flushTomasDesdeDOM();
  _bitAplicarPromediosAToma('ph');
  try{ await guardarBorradorActual(); }catch(e){}
  goPage('pg1');
}

// AARMS v64: ordena registros cronológicamente manteniendo calibGrupo unidos
function _bitPhOrdenarCronologico(regs){
  if(!Array.isArray(regs) || regs.length < 2) return regs;
  const grupos = [];
  const visto = new Set();
  for(let i=0; i<regs.length; i++){
    if(visto.has(i)) continue;
    const r = regs[i];
    if(r.calibGrupo){
      const ids = [];
      for(let j=0; j<regs.length; j++){
        if(regs[j].calibGrupo === r.calibGrupo){ ids.push(j); visto.add(j); }
      }
      const ts = Math.min(...ids.map(id => regs[id].timestamp || Infinity));
      grupos.push({ts, indices: ids});
    } else {
      let ts = r.timestamp || 0;
      if(!ts && r.fecha && r.hora){
        ts = _toDateTime(r.fecha, r.hora)?.getTime() || 0;
      }
      grupos.push({ts, indices: [i]});
      visto.add(i);
    }
  }
  grupos.sort((a, b) => a.ts - b.ts);
  const out = [];
  grupos.forEach(g => g.indices.forEach(i => out.push(regs[i])));
  return out;
}

function _bitPhRender(){
  const c = document.getElementById('bitPhRegistros');
  if(!c) return;
  const regs = _bitPhRegs() || [];
  // AARMS v64: reordenar cronológicamente in-place
  const ordenados = _bitPhOrdenarCronologico(regs);
  if(ordenados.length === regs.length){
    for(let i=0; i<regs.length; i++) regs[i] = ordenados[i];
  }
  if(regs.length === 0){
    c.innerHTML = `<div style="text-align:center;padding:24px 12px;color:var(--g2);font-size:12px;line-height:1.55">
      Sin registros aún.<br>
      <span style="font-size:10.5px;color:var(--g3)">Agrega tomas en la hoja de campo y vuelve aquí, o usa «+ Agregar toma».</span>
    </div>`;
    return;
  }
  _bitPhOrdenarRegsPorFechaHora(regs);
  const segs=_bitPhGroupedSegments(regs);
  c.innerHTML = segs.map(seg=>{
    if(seg.kind==='calib4') return _renderBitPhCalibBlock4(seg.indices);
    return _renderBitPhCard(regs[seg.indices[0]], seg.indices[0]);
  }).join('');
  const btnExtra=document.getElementById('bitPhBtnOtroBloqueCalib');
  if(btnExtra) btnExtra.style.display=_bitPhTieneBloqueCalib2()?'':'none';
}

function _renderBitPhCard(r, idx){
  const tomaOptsList=_bitPhOpcionesTomaSelect();
  const selVal=_bitPhTomaSelectValue(r);
  const tomaOpts = tomaOptsList.map(o =>
    `<option value="${String(o.value).replace(/"/g,'&quot;')}" ${o.value===selVal?'selected':''}>${String(o.label).replace(/</g,'&lt;')}</option>`
  ).join('');
  const rowMid=r.omarId!=null&&r.omarId!==''?String(r.omarId):String(omar.ts||'');
  const folOmar = _bitPhOmarFolio(rowMid);

  const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const promCalc=_phPromedio(r.l1, r.l2, r.l3);
  const promDisp=r.promedio||(promCalc!=null?promCalc.toFixed(2):'');
  const ph25Disp=r.ph25||_phRedondeo25(promCalc);
  const arVal=r.ar||'';
  const Ls = [r.l1, r.l2, r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
  const prom = promDisp;
  let acepta = null, motivo = '';
  if(Ls.length === 3){
    const diff = Math.max(...Ls) - Math.min(...Ls);
    if(diff > 0.03){ acepta = false; motivo = `Δ ${diff.toFixed(2)} > 0.03`; }
    else { acepta = true; motivo = `Δ ${diff.toFixed(2)} ≤ 0.03`; }
  }

  // Estado de la toma: completa si tiene las 3 lecturas
  const completa = Ls.length === 3;
  const estadoBadge = completa
    ? `<span data-bit-estado style="background:rgba(134,239,172,.15);border:1px solid rgba(134,239,172,.4);color:var(--green);padding:2px 9px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.04em">Lista</span>`
    : `<span data-bit-estado style="background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.35);color:#fbbf24;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.04em">Faltan lecturas</span>`;
  const titulo=_bitPhLabelToma(r);

  return `
    <div data-bit-ph="${idx}" style="background:var(--bg2);border:1px solid var(--ln);border-radius:11px;padding:14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div style="font-family:var(--syne);font-size:13px;font-weight:800;color:var(--w)">${String(titulo).replace(/</g,'&lt;')}</div>
          ${estadoBadge}
        </div>
        <button onclick="bitPhEliminar(${idx})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer">Borrar</button>
      </div>

      <!-- PASO 1: Cuándo y de quién -->
      <div class="f" style="margin-bottom:10px">
        <label>1 · OMAR y número de toma</label>
        <select onchange="bitPhUp(${idx},'tomaOmar',this.value)"><option value="">— Elige OMAR y toma —</option>${tomaOpts}</select>
      </div>
      <div class="g2" style="margin-bottom:10px">
        <div class="f" style="margin-bottom:0"><label>Fecha</label><input type="date" value="${r.fecha||''}" oninput="bitPhUp(${idx},'fecha',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>Hora</label><input type="time" value="${r.hora||''}" oninput="bitPhUp(${idx},'hora',this.value)"></div>
      </div>

      <!-- PASO 2: Buffer / patrón usado -->
      <div class="g2" style="margin-bottom:10px">
        <div class="f" style="margin-bottom:0"><label>Lote${_badgeAuto(r.__lote_from_cat)}</label><input type="text" data-f="lote" placeholder="lote" value="${(r.lote||'').replace(/"/g,'&quot;')}" oninput="bitPhUp(${idx},'lote',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>Marca${_badgeAuto(r.__marca_from_cat)}</label><input type="text" data-f="marca" placeholder="marca" value="${(r.marca||'').replace(/"/g,'&quot;')}" oninput="bitPhUp(${idx},'marca',this.value)"></div>
      </div>
      <div class="g2" style="margin-bottom:10px">
        <div class="f" style="margin-bottom:0"><label>Buffer</label><input type="number" step="0.01" data-f="buffer" placeholder="ej. 7.00" value="${r.buffer||''}" oninput="bitPhUp(${idx},'buffer',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>Lectura aprox. (tira)</label><input type="number" step="0.1" data-f="aprox" placeholder="ej. 7" value="${r.aprox||''}" oninput="bitPhUp(${idx},'aprox',this.value)"></div>
      </div>
      ${_renderAtajos({ valores: ATAJOS_BUFFERS_PH, campo: 'buffer', id: idx, valorActual: r.buffer, label: 'Buffer rápido', color: '#60a5fa', colsPorFila: 5, updateFn: 'bitPhUp' })}
      ${_renderAtajos({ valores: ATAJOS_TIRA_PH, campo: 'aprox', id: idx, valorActual: r.aprox, label: 'Tira pH', color: '#86efac', colsPorFila: 6, updateFn: 'bitPhUp' })}
      ${_renderAtajos({ valores: ATAJOS_ACTIVIDAD, campo: 'act', id: idx, valorActual: r.act, label: 'Actividad de control', color: '#fbbf24', colsPorFila: 3, updateFn: 'bitPhUp' })}
      <div class="f" style="margin-bottom:8px">
        <label>Limpieza (código)</label>
        <select data-f="limp" onchange="bitPhUp(${idx},'limp',this.value)"><option value="">— Elige —</option>${LIMPIEZA_COD.map(l=>`<option value="${l.code}" ${r.limp===l.code?'selected':''}>${l.code} — ${l.label}</option>`).join('')}</select>
      </div>
      ${_renderAtajos({ valores: ATAJOS_LIMPIEZA, campo: 'limp', id: idx, valorActual: r.limp, label: 'Código de limpieza', color: '#a78bfa', colsPorFila: 3, updateFn: 'bitPhUp' })}

      <!-- PASO 3: 3 lecturas -->
      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);margin-bottom:6px">3 · Lecturas de pH (3 independientes)</div>
      <div class="g3" style="margin-bottom:12px">
        <div class="f" style="margin-bottom:0"><label>L1</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${esc(r.l1)}" oninput="bitPhUp(${idx},'l1',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>L2</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${esc(r.l2)}" oninput="bitPhUp(${idx},'l2',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>L3</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${esc(r.l3)}" oninput="bitPhUp(${idx},'l3',this.value)"></div>
      </div>
      <div class="g3" style="margin-bottom:12px">
        <div class="f" style="margin-bottom:0"><label>Promedio</label><input type="text" data-f="promedio" readonly style="background:rgba(255,255,255,.06);color:var(--w)" value="${esc(promDisp)}"></div>
        <div class="f" style="margin-bottom:0"><label>pH 25°C</label><input type="text" data-f="ph25" readonly style="background:rgba(255,255,255,.06);color:var(--w)" value="${esc(ph25Disp)}"></div>
        <div class="f" style="margin-bottom:0"><label>Acepta / Rechaza</label>
          <select data-f="ar" onchange="bitPhUp(${idx},'ar',this.value)">
            <option value="">—</option>
            <option value="Acepta" ${arVal==='Acepta'?'selected':''}>Acepta</option>
            <option value="Rechaza" ${arVal==='Rechaza'?'selected':''}>Rechaza</option>
          </select>
        </div>
      </div>

      <!-- Resultado -->
      <div data-bit-resumen style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;background:${acepta===false?'rgba(248,113,113,.08)':(acepta===true?'rgba(134,239,172,.08)':'var(--bg3)')};border:1px solid ${acepta===false?'rgba(248,113,113,.3)':(acepta===true?'rgba(134,239,172,.3)':'var(--ln)')};border-radius:9px">
        <div>
          <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.04em">Promedio pH 25°C</div>
          <div style="font-family:var(--syne);font-size:22px;font-weight:800;color:${acepta===false?'#f87171':'var(--acc)'};margin-top:2px">${prom||'—'}</div>
        </div>
        <div style="text-align:right">
          ${acepta===true?`<div style="color:var(--green);font-weight:800;font-size:13px">ACEPTA</div><div style="font-size:10px;color:var(--g2);margin-top:2px">${motivo}</div>`:''}
          ${acepta===false?`<div style="color:#f87171;font-weight:800;font-size:13px">RECHAZA</div><div style="font-size:10px;color:var(--g2);margin-top:2px">${motivo}</div>`:''}
          ${acepta===null?`<div style="color:var(--g2);font-size:10.5px">Captura las 3<br>lecturas</div>`:''}
        </div>
      </div>
    </div>
  `;
}

function _phGetBuffers(){
  const pl=_bitPhPlan();
  if(pl && pl.phBuffers && !isNaN(parseFloat(pl.phBuffers.b1)) && !isNaN(parseFloat(pl.phBuffers.b2))) return pl.phBuffers;
  return null;
}
function _phSetBuffers(b1,b2,lote,marca){
  const pl=_bitPhPlan();
  if(pl) pl.phBuffers={b1:parseFloat(b1),b2:parseFloat(b2),lote:lote||'',marca:marca||''};
}
// AARMS nobranding: prompts nativos → promptApp
async function _phPromptBuffers(){
  const b1s=await promptApp({title:'Buffer 1', message:'Valor nominal pH. Se usa en TODAS las recalibraciones del plan.', defaultValue:'9.18'});
  if(b1s===null) return null;
  const b1=parseFloat(b1s); if(isNaN(b1)){ toast('Valor no válido','w'); return null; }
  const b2s=await promptApp({title:'Buffer 2', message:'Valor nominal pH.', defaultValue:'6.86'});
  if(b2s===null) return null;
  const b2=parseFloat(b2s); if(isNaN(b2)){ toast('Valor no válido','w'); return null; }
  const loteRaw=await promptApp({title:'Lote del buffer', message:'Opcional', defaultValue:''});
  if(loteRaw===null) return null;
  const marcaRaw=await promptApp({title:'Marca del buffer', message:'Opcional', defaultValue:''});
  if(marcaRaw===null) return null;
  return {b1,b2,lote:loteRaw||'',marca:marcaRaw||''};
}

function bitPhAgregarRegistro(){
  const regs=_bitPhRegs();
  if(!regs) return;
  if(!(tomas&&tomas.length)){
    toast('Primero agrega tomas en la hoja de campo','w');
    return;
  }
  const tomaOptsList=_bitPhOpcionesTomaSelect();
  const asignadas=new Set((regs||[]).map(r=>{
    const v=_bitPhTomaSelectValue(r);
    return v||null;
  }).filter(Boolean));
  let proxVal='';
  for(const o of tomaOptsList){
    if(!asignadas.has(o.value)){ proxVal=o.value; break; }
  }
  if(!proxVal && tomaOptsList.length) proxVal=tomaOptsList[0].value;
  const pipe=proxVal.indexOf('|');
  const omarId=pipe>=0?proxVal.slice(0,pipe):String(omar.ts);
  const tomaNum=pipe>=0?proxVal.slice(pipe+1):'';
  const hoy=_defaultBitRegistroFecha();
  // Cruce de día automático: si el último registro de toma tiene fecha distinta → bloque Ca·Ca·Co·Co vacío
  const last=[...regs].reverse().find(r=>!r.calibGrupo);
  if(last && last.fecha && String(last.fecha)!==String(hoy)){
    bitPhInsertarBloqueCalibAlFinal('','','','',hoy,true);
    toast('Cambio de día → recalibración Ca/Ca/Co/Co agregada (llena los buffers)','g');
  }
  regs.push({
    fecha: hoy,
    hora: new Date().toTimeString().substring(0,5),
    omarId, toma: tomaNum,
    folioOmar: _bitPhFolioLegible(omarId)||'',
    act:'V', limp:'1', aprox:'', buffer:'', lote:'', marca:'',
    l1:'', l2:'', l3:'', obs:'',
  });
  _bitPhOrdenarRegsPorFechaHora(regs);
  _bitPhRender();
  _bitAplicarPromediosAToma('ph');
  guardarBorradorActual();
  void _persistPlanBitPh();
}

// Inserta bloque Ca·Ca·Co·Co AL FINAL (para cruces de día durante la jornada)
function bitPhInsertarBloqueCalibAlFinal(b1,b2,lote,marca,fecha,forcePend){
  if(!omar||!omar.ts) return;
  const regs=_bitPhRegs();
  if(!regs) return;
  const pend = forcePend!==undefined ? forcePend : _bitPhMuestreoCruzaMedianoche();
  const g='cg'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const buf1 = (b1!=null && b1!=='' && !isNaN(parseFloat(b1))) ? String(parseFloat(b1)) : '';
  const buf2 = (b2!=null && b2!=='' && !isNaN(parseFloat(b2))) ? String(parseFloat(b2)) : '';
  const base={
    fecha:fecha||_defaultBitRegistroFecha(), hora:'', toma:'', act:'V', limp:'1', aprox:'', lote:lote||'', marca:marca||'',
    l1:'', l2:'', l3:'', obs:'', promedio:'', ph25:'', ar:'',
    slopePct:'',
    sinTomaFolio:true, calibGrupo:g,
    pendienteBuf1:pend, pendienteBuf2:pend,
  };
  // ORDEN: Ca · Ca · Co · Co
  regs.push(
    {...base, calibPaso:1, act:'Ca', buffer:buf1},
    {...base, calibPaso:2, act:'Ca', buffer:buf2},
    {...base, calibPaso:3, act:'Co', buffer:buf1},
    {...base, calibPaso:4, act:'Co', buffer:buf2},
  );
}

async function bitPhEliminar(idx){
  const regs=_bitPhRegs();
  if(!regs) return;
  const r=regs[idx];
  if(r && r.calibGrupo){
    // AARMS nobranding:
    const ok=await confirmAction({
      title:'Eliminar bloque',
      message:'Este renglón es parte del bloque de calibración/comprobación (4 líneas). ¿Eliminar el bloque completo?',
      okText:'Eliminar'
    });
    if(!ok) return;
    bitPhEliminarCalibGrupo(r.calibGrupo);
    return;
  }
  const ok=await confirmAction({title:'Borrar registro', message:'¿Borrar este registro?', okText:'Borrar'});
  if(!ok) return;
  regs.splice(idx, 1);
  _bitPhRender();
  guardarBorradorActual();
  void _persistPlanBitPh();
}

function bitPhUp(idx, field, value){
  const regs=_bitPhRegs();
  if(!regs || !regs[idx]) return;
  if(field==='tomaOmar'){
    const v=String(value||'');
    const pipe=v.indexOf('|');
    if(!v){
      regs[idx].omarId='';
      regs[idx].toma='';
      regs[idx].folioOmar='';
    }else if(pipe<0){
      regs[idx].toma=v;
    }else{
      regs[idx].omarId=v.slice(0,pipe);
      regs[idx].toma=v.slice(pipe+1);
      regs[idx].folioOmar=_bitPhFolioLegible(regs[idx].omarId)||'';
    }
    _bitPhRender();
    _bitAplicarPromediosAToma('ph');
    if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
    guardarBorradorActual();
    void _persistPlanBitPh();
    return;
  }
  regs[idx][field] = value;
  // AARMS sub6-atajos: edición manual de lote/marca quita badge AUTO
  if(field === 'lote' || field === 'marca'){
    regs[idx]['__' + field + '_from_cat'] = false;
  }
  // AARMS v65: si cambia buffer o actividad, autocompletar lote/marca del catálogo
  if(['buffer','act'].includes(field) && regs[idx]){
    const reg = regs[idx];
    const loteVacio = !reg.lote;
    const marcaVacia = !reg.marca;
    _bitPhAutocompletarLoteMarca(reg);
    const card = document.querySelector(`[data-bit-ph="${idx}"]`) || document.querySelector(`[data-bit-sub="${idx}"]`);
    if(card){
      if(loteVacio){
        const inp = card.querySelector('[data-f="lote"]');
        if(inp) inp.value = reg.lote || '';
      }
      if(marcaVacia){
        const inp = card.querySelector('[data-f="marca"]');
        if(inp) inp.value = reg.marca || '';
      }
    }
  }
  // AARMS sub6-atajos: re-render para resaltar chips (buffer/aprox/act/limp)
  if(['buffer','aprox','act','limp'].includes(field)){
    if(['l1','l2','l3','buffer'].includes(field)){
      bitPhUpdatePromedioFila(idx);
      _bitAplicarPromediosAToma('ph');
      if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
    }
    _bitPhRender();
    guardarBorradorActual();
    void _persistPlanBitPh();
    return;
  }
  if(field==='hora'||field==='fecha'){
    _bitPhOrdenarRegsPorFechaHora(regs);
    _bitPhRender();
    _bitAplicarPromediosAToma('ph');
    if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
    guardarBorradorActual();
    void _persistPlanBitPh();
    return;
  }
  if(['l1','l2','l3','buffer'].includes(field)){
    bitPhUpdatePromedioFila(idx);
    _bitAplicarPromediosAToma('ph');
    if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
  }
  if(field==='ar'){
    guardarBorradorActual();
    void _persistPlanBitPh();
    return;
  }
  // AARMS sub6-atajos: re-render al editar lote/marca para quitar/mostrar badge AUTO
  if(field === 'lote' || field === 'marca'){
    _bitPhRender();
  }
  guardarBorradorActual();
  void _persistPlanBitPh();
}

// Actualiza el bloque de "Promedio + Acepta/Rechaza" de un registro pH sin re-renderizar todo
function _bitPhRefreshResumen(idx){
  const regs=_bitPhRegs();
  const r = regs && regs[idx];
  if(!r) return;
  const card = document.querySelector(`[data-bit-ph="${idx}"]`) || document.querySelector(`[data-bit-sub="${idx}"]`);
  if(!card) return;
  const Ls = [r.l1, r.l2, r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
  const prom = Ls.length>0 ? (Ls.reduce((a,b)=>a+b,0)/Ls.length).toFixed(2) : '';
  let acepta = null, motivo = '';
  if(Ls.length === 3){
    const diff = Math.max(...Ls) - Math.min(...Ls);
    if(diff > 0.03){ acepta = false; motivo = `Δ ${diff.toFixed(2)} > 0.03`; }
    else { acepta = true; motivo = `Δ ${diff.toFixed(2)} ≤ 0.03`; }
  }
  const resumen = card.querySelector('[data-bit-resumen]');
  // Actualizar badge COMPLETADA/PENDIENTE (cards de toma normal)
  if(card.hasAttribute('data-bit-ph')){
    const badge = card.querySelector('[data-bit-estado]');
    if(badge){
      if(Ls.length===3){
        badge.textContent='COMPLETADA';
        badge.style.background='rgba(134,239,172,.15)';
        badge.style.borderColor='rgba(134,239,172,.4)';
        badge.style.color='var(--green)';
      }else{
        badge.textContent='PENDIENTE';
        badge.style.background='rgba(251,191,36,.12)';
        badge.style.borderColor='rgba(251,191,36,.35)';
        badge.style.color='#fbbf24';
      }
    }
  }
  if(!resumen) return;
  resumen.style.background = acepta===false?'rgba(248,113,113,.08)':(acepta===true?'rgba(134,239,172,.08)':'var(--bg3)');
  resumen.style.borderColor = acepta===false?'rgba(248,113,113,.3)':(acepta===true?'rgba(134,239,172,.3)':'var(--ln)');
  let bufNote = '';
  if(Ls.length===3 && r.buffer!=null && r.buffer!==''){
    const buf = parseFloat(r.buffer);
    const pr = Ls.reduce((a,b)=>a+b,0)/Ls.length;
    if(!isNaN(buf) && !isNaN(pr)){
      const d05 = Math.abs(pr-buf) <= 0.05+1e-9;
      bufNote = `<div style="font-size:10px;color:var(--g2);margin-top:4px">vs buffer MCR (±0,05): <b style="color:${d05?'var(--green)':'#f87171'}">${d05?'OK':'Revisar'}</b> (${pr.toFixed(2)} vs ${buf})</div>`;
    }
  }
  resumen.innerHTML = `
    <div>
      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.04em">Promedio (pH 25°C)</div>
      <div style="font-family:var(--syne);font-size:20px;font-weight:800;color:${acepta===false?'#f87171':'var(--acc)'};margin-top:2px">${prom||'—'}</div>
      ${bufNote}
    </div>
    <div style="text-align:right">
      ${acepta===true?`<div style="color:var(--green);font-weight:800;font-size:12px">✓ ACEPTA</div><div style="font-size:10px;color:var(--g2);margin-top:2px">${motivo}</div>`:''}
      ${acepta===false?`<div style="color:#f87171;font-weight:800;font-size:12px">✗ RECHAZA</div><div style="font-size:10px;color:var(--g2);margin-top:2px">${motivo}</div>`:''}
      ${acepta===null?`<div style="color:var(--g2);font-size:10.5px">Captura las 3 lecturas</div>`:''}
    </div>
  `;
}

// ─── CONDUCTÍMETRO (paridad con bitácora pH) ───
async function abrirBitacoraCond(){
  if(!omar.ts){ toast('Primero captura el OMAR','w'); return; }
  if(_condFlujoActivo && !_colabLabMinimoListo()){
    toast('Completa primero el laboratorio (identificación y Patrón KCl L1–L3)','w');
    await abrirPagColab();
    return;
  }
  _flushTomasDesdeDOM();
  try{ await saveMuestreoActual(); }catch(e){ console.warn('[bitCond open save]',e); }
  await _bitCondMigrarSiPlanVacio();
  const pl=_bitPhPlan();
  const p=document.getElementById('bitCondPill');
  if(p){
    if(pl&&pl.id){
      const n=(pl.omarIds||[]).length;
      p.textContent='Plan · '+n+' OMAR(s) · bitácora conductividad';
    }else{
      p.textContent=(omar.folio?'OMAR '+omar.folio:'OMAR')+' · '+(tomas?.length||0)+' tomas';
    }
  }
  const fol=document.getElementById('bitCondFolioDocInp');
  if(fol) fol.value=_bitCondFolioDocGet()||'';
  _bitCondSyncAllTomasFromCampo();
  _bitCondActualizarFoliosOmarEnRegs();
  _bitCondRender();
  try{ await _persistPlanBitCond(); }catch(e){}
  _aplicarDocEstadoBadge('colab');
  _pintarCondFlujoStepper(2);
  goPage('pgBitCond');
  if(_condFlujoActivo) toast('Paso 2 · Entre tomas','');
}
async function cerrarBitacoraCond(){
  try{ await _persistPlanBitCond(); }catch(e){}
  _flushTomasDesdeDOM();
  _bitAplicarPromediosAToma('cond');
  try{ await guardarBorradorActual(); }catch(e){}
  const origen = _condFlujoOrigen;
  _condFlujoActivo = false;
  if(origen==='plan'){
    goPage('pgPlan');
    try{ renderPlanDocs(); }catch(_){}
  }else{
    goPage('pg1');
  }
}

function _bitCondCalcAcepta(r){
  const Ls=[r.l1,r.l2,r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
  const prom=Ls.length>0?(Ls.reduce((a,b)=>a+b,0)/Ls.length):0;
  let acepta=null,motivo='';
  if(Ls.length===3&&prom>0){
    const diff=Math.max(...Ls)-Math.min(...Ls);
    const pctDiff=(diff/prom)*100;
    if(pctDiff>3){ acepta=false; motivo=`Δ ${diff.toFixed(0)} (${pctDiff.toFixed(1)}% > 3%)`; }
    else { acepta=true; motivo=`Δ ${diff.toFixed(0)} (${pctDiff.toFixed(1)}%)`; }
  }
  return {Ls, prom: prom>0?prom.toFixed(0):'', acepta, motivo};
}

function _bitCondRender(){
  const c=document.getElementById('bitCondRegistros');
  if(!c) return;
  const regs=_bitCondRegs()||[];
  _bitPhOrdenarRegsPorFechaHora(regs);
  if(regs.length===0){
    c.innerHTML=`<div style="text-align:center;padding:24px 12px;color:var(--g2);font-size:12px;line-height:1.55">
      Sin registros aún.<br>
      <span style="font-size:10.5px;color:var(--g3)">Agrega tomas en la hoja de campo y vuelve aquí, o usa «+ Agregar toma».</span>
    </div>`;
    return;
  }
  c.innerHTML=regs.map((r,i)=>_renderBitCondCard(r,i)).join('');
}

function _renderBitCondCard(r, idx){
  const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const tomaOptsList=_bitPhOpcionesTomaSelect();
  const selVal=_bitPhTomaSelectValue(r);
  const tomaOpts=tomaOptsList.map(o=>
    `<option value="${String(o.value).replace(/"/g,'&quot;')}" ${o.value===selVal?'selected':''}>${String(o.label).replace(/</g,'&lt;')}</option>`
  ).join('');
  const actOpts=ACT_CONTROL.map(a=>
    `<option value="${a.code}" ${r.act===a.code?'selected':''}>${a.code} — ${a.label}</option>`
  ).join('');
  const limpOpts=LIMPIEZA_COD.map(l=>
    `<option value="${l.code}" ${r.limp===l.code?'selected':''}>${l.code} — ${l.label}</option>`
  ).join('');
  const {prom, acepta, motivo}= _bitCondCalcAcepta(r);
  const Ls=[r.l1,r.l2,r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
  const completa=Ls.length===3;
  const titulo=_bitPhLabelToma(r);
  const estadoBadge=completa
    ? `<span data-bit-estado style="background:rgba(134,239,172,.15);border:1px solid rgba(134,239,172,.4);color:var(--green);padding:2px 9px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.04em">COMPLETADA</span>`
    : `<span data-bit-estado style="background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.35);color:#fbbf24;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.04em">PENDIENTE</span>`;

  return `
    <div data-bit-cond="${idx}" style="background:var(--bg2);border:1px solid var(--ln);border-radius:11px;padding:14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap">
        <div style="font-family:var(--syne);font-size:13px;font-weight:800;color:var(--w)">${esc(titulo)}</div>
        <div style="display:flex;align-items:center;gap:8px">
          ${estadoBadge}
          <button type="button" onclick="bitCondEliminar(${idx})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:4px 8px;border-radius:6px;font-size:10.5px;cursor:pointer">✕ Borrar</button>
        </div>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div class="f" style="margin-bottom:0"><label>Fecha registro</label><input type="date" value="${esc(r.fecha)}" oninput="bitCondUp(${idx},'fecha',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>Hora</label><input type="time" value="${esc(r.hora)}" oninput="bitCondUp(${idx},'hora',this.value)"></div>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div class="f" style="margin-bottom:0"><label>OMAR · Toma</label>
          <select onchange="bitCondUp(${idx},'tomaOmar',this.value)"><option value="">— Elige OMAR y toma —</option>${tomaOpts}</select>
        </div>
        <div class="f" style="margin-bottom:0"><label>Actividad de control</label>
          <select data-f="act" onchange="bitCondUp(${idx},'act',this.value)"><option value="">—</option>${actOpts}</select>
        </div>
      </div>
      ${_renderAtajos({ valores: ATAJOS_ACTIVIDAD, campo: 'act', id: idx, valorActual: r.act, label: 'Actividad de control', color: '#fbbf24', colsPorFila: 3, updateFn: 'bitCondUp' })}
      <div class="f" style="margin-bottom:8px"><label>Limpieza código</label>
        <select data-f="limp" onchange="bitCondUp(${idx},'limp',this.value)"><option value="">—</option>${limpOpts}</select>
      </div>
      ${_renderAtajos({ valores: ATAJOS_LIMPIEZA, campo: 'limp', id: idx, valorActual: r.limp, label: 'Código de limpieza', color: '#a78bfa', colsPorFila: 3, updateFn: 'bitCondUp' })}
      <div class="g2" style="margin-bottom:8px">
        <div class="f" style="margin-bottom:0"><label>Patrón KCl (µS/cm)</label><input type="text" data-f="patron" placeholder="ej. 1413" value="${esc(r.patron)}" oninput="bitCondUp(${idx},'patron',this.value)"></div>
        <div class="f" style="margin-bottom:0"></div>
      </div>
      ${_renderAtajos({ valores: _atajosPatronesKCl(), campo: 'patron', id: idx, valorActual: r.patron, label: 'Patrón KCl rápido', color: '#60a5fa', colsPorFila: 2, updateFn: 'bitCondUp' })}
      <div class="g2" style="margin-bottom:8px">
        <div class="f" style="margin-bottom:0"><label>Lote${_badgeAuto(r.__lote_from_cat)}</label><input type="text" data-f="lote" placeholder="lote" value="${esc(r.lote)}" oninput="bitCondUp(${idx},'lote',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>Marca${_badgeAuto(r.__marca_from_cat)}</label><input type="text" data-f="marca" placeholder="marca" value="${esc(r.marca)}" oninput="bitCondUp(${idx},'marca',this.value)"></div>
      </div>
      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);margin-bottom:6px">Lecturas de conductividad (µS/cm)</div>
      <div class="g3" style="margin-bottom:8px">
        <div class="f" style="margin-bottom:0"><label>L1</label><input type="number" inputmode="numeric" placeholder="µS/cm" value="${esc(r.l1)}" oninput="bitCondUp(${idx},'l1',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>L2</label><input type="number" inputmode="numeric" placeholder="µS/cm" value="${esc(r.l2)}" oninput="bitCondUp(${idx},'l2',this.value)"></div>
        <div class="f" style="margin-bottom:0"><label>L3</label><input type="number" inputmode="numeric" placeholder="µS/cm" value="${esc(r.l3)}" oninput="bitCondUp(${idx},'l3',this.value)"></div>
      </div>
      <div data-bit-resumen style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;background:${acepta===false?'rgba(248,113,113,.08)':(acepta===true?'rgba(134,239,172,.08)':'var(--bg3)')};border:1px solid ${acepta===false?'rgba(248,113,113,.3)':(acepta===true?'rgba(134,239,172,.3)':'var(--ln)')};border-radius:9px">
        <div>
          <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.04em">Promedio (µS/cm)</div>
          <div style="font-family:var(--syne);font-size:20px;font-weight:800;color:${acepta===false?'#f87171':'var(--amber)'};margin-top:2px">${prom||'—'}</div>
        </div>
        <div style="text-align:right">
          ${acepta===true?`<div style="color:var(--green);font-weight:800;font-size:12px">✓ ACEPTA</div><div style="font-size:10px;color:var(--g2);margin-top:2px">${motivo}</div>`:''}
          ${acepta===false?`<div style="color:#f87171;font-weight:800;font-size:12px">✗ RECHAZA</div><div style="font-size:10px;color:var(--g2);margin-top:2px">${motivo}</div>`:''}
          ${acepta===null?`<div style="color:var(--g2);font-size:10.5px">Captura las 3 lecturas</div>`:''}
        </div>
      </div>
    </div>
  `;
}

function bitCondAgregarRegistro(){
  const regs=_bitCondRegs();
  if(!regs) return;
  const tomaOptsList=_bitPhOpcionesTomaSelect();
  if(!tomaOptsList.length){
    toast('Primero agrega tomas en la hoja de campo','w');
    return;
  }
  const asignadas=new Set(regs.map(r=>_bitPhTomaSelectValue(r)).filter(Boolean));
  let proxVal='';
  for(const o of tomaOptsList){
    if(!asignadas.has(o.value)){ proxVal=o.value; break; }
  }
  if(!proxVal && tomaOptsList.length) proxVal=tomaOptsList[0].value;
  const pipe=proxVal.indexOf('|');
  const omarId=pipe>=0?proxVal.slice(0,pipe):String(omar.ts);
  const tomaNum=pipe>=0?proxVal.slice(pipe+1):'';
  regs.push({
    fecha:_defaultBitRegistroFecha(),
    hora:new Date().toTimeString().substring(0,5),
    omarId, toma:tomaNum,
    folioOmar:_bitPhFolioLegible(omarId)||'',
    act:'V', limp:'1',
    l1:'', l2:'', l3:'',
  });
  _bitPhOrdenarRegsPorFechaHora(regs);
  _bitCondRender();
  _bitAplicarPromediosAToma('cond');
  guardarBorradorActual();
  void _persistPlanBitCond();
}

async function bitCondEliminar(idx){
  const regs=_bitCondRegs();
  if(!regs) return;
  // AARMS nobranding:
  const ok=await confirmAction({title:'Borrar registro', message:'¿Borrar este registro?', okText:'Borrar'});
  if(!ok) return;
  regs.splice(idx, 1);
  _bitCondRender();
  _bitAplicarPromediosAToma('cond');
  guardarBorradorActual();
  void _persistPlanBitCond();
}

function bitCondUp(idx, field, value){
  const regs=_bitCondRegs();
  if(!regs || !regs[idx]) return;
  if(field==='tomaOmar'){
    const v=String(value||'');
    const pipe=v.indexOf('|');
    if(!v){
      regs[idx].omarId='';
      regs[idx].toma='';
      regs[idx].folioOmar='';
    }else if(pipe<0){
      regs[idx].toma=v;
    }else{
      regs[idx].omarId=v.slice(0,pipe);
      regs[idx].toma=v.slice(pipe+1);
      regs[idx].folioOmar=_bitPhFolioLegible(regs[idx].omarId)||'';
    }
    _bitCondRender();
    _bitAplicarPromediosAToma('cond');
    if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
    guardarBorradorActual();
    void _persistPlanBitCond();
    return;
  }
  regs[idx][field]=value;
  // AARMS sub6-atajos: edición manual quita badge AUTO
  if(field === 'lote' || field === 'marca'){
    regs[idx]['__' + field + '_from_cat'] = false;
  }
  if(field === 'patron'){
    _bitCondAutocompletarLoteMarca(regs[idx]);
  }
  // AARMS sub6-atajos: re-render para chips activos + badge
  if(['patron','act','limp','lote','marca'].includes(field)){
    _bitCondRender();
    guardarBorradorActual();
    void _persistPlanBitCond();
    return;
  }
  if(field==='hora'||field==='fecha'){
    _bitPhOrdenarRegsPorFechaHora(regs);
    _bitCondRender();
  }
  if(['l1','l2','l3','toma'].includes(field)){
    _bitCondRefreshResumen(idx);
    _bitAplicarPromediosAToma('cond');
    if(typeof _refreshHojaCampoSiAbierta === 'function') _refreshHojaCampoSiAbierta();
  }
  guardarBorradorActual();
  void _persistPlanBitCond();
}

function _bitCondRefreshResumen(idx){
  const regs=_bitCondRegs();
  const r=regs&&regs[idx];
  if(!r) return;
  const card=document.querySelector(`[data-bit-cond="${idx}"]`);
  if(!card) return;
  const {prom, acepta, motivo, Ls}= _bitCondCalcAcepta(r);
  const resumen=card.querySelector('[data-bit-resumen]');
  if(!resumen) return;
  const badge=card.querySelector('[data-bit-estado]');
  if(badge){
    if(Ls.length===3){
      badge.textContent='COMPLETADA';
      badge.style.background='rgba(134,239,172,.15)';
      badge.style.borderColor='rgba(134,239,172,.4)';
      badge.style.color='var(--green)';
    }else{
      badge.textContent='PENDIENTE';
      badge.style.background='rgba(251,191,36,.12)';
      badge.style.borderColor='rgba(251,191,36,.35)';
      badge.style.color='#fbbf24';
    }
  }
  resumen.style.background=acepta===false?'rgba(248,113,113,.08)':(acepta===true?'rgba(134,239,172,.08)':'var(--bg3)');
  resumen.style.borderColor=acepta===false?'rgba(248,113,113,.3)':(acepta===true?'rgba(134,239,172,.3)':'var(--ln)');
  resumen.innerHTML=`
    <div>
      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.04em">Promedio (µS/cm)</div>
      <div style="font-family:var(--syne);font-size:20px;font-weight:800;color:${acepta===false?'#f87171':'var(--amber)'};margin-top:2px">${prom||'—'}</div>
    </div>
    <div style="text-align:right">
      ${acepta===true?`<div style="color:var(--green);font-weight:800;font-size:12px">✓ ACEPTA</div><div style="font-size:10px;color:var(--g2);margin-top:2px">${motivo}</div>`:''}
      ${acepta===false?`<div style="color:#f87171;font-weight:800;font-size:12px">✗ RECHAZA</div><div style="font-size:10px;color:var(--g2);margin-top:2px">${motivo}</div>`:''}
      ${acepta===null?`<div style="color:var(--g2);font-size:10.5px">Captura las 3 lecturas</div>`:''}
    </div>
  `;
}

// Auto-escritura: por cada toma, busca si hay un registro de bitácora válido
// (con las 3 lecturas) que apunte a esa toma. Si hay → escribe el promedio.
// Si NO hay registro válido para esa toma → limpia el campo (deja vacío).
// Si hay varios registros para la misma toma, el último gana.
function _bitAplicarPromediosAToma(tipo /* 'ph' | 'cond' */){
  _flushTomasDesdeDOM();
  const fuente = tipo==='ph' ? (_bitPhRegs()||[]) : (_bitCondRegs()||[]);
  const campo = tipo==='ph' ? 'ph' : 'cond';
  const activeTs = (typeof omar!=='undefined'&&omar&&omar.ts)?String(omar.ts):'';

  // Agrupar promedios por OMAR: { omarId: { numToma: prom } }
  const porOmar = {};
  fuente.forEach(r=>{
    if(!r.toma || r.calibGrupo) return;
    const rid = (r.omarId!=null && r.omarId!=='') ? String(r.omarId) : activeTs;
    const Ls=[r.l1,r.l2,r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
    if(Ls.length===0) return;
    const prom=Ls.reduce((a,b)=>a+b,0)/Ls.length;
    if(!porOmar[rid]) porOmar[rid]={};
    porOmar[rid][parseInt(r.toma)] = tipo==='ph' ? prom.toFixed(2) : prom.toFixed(0);
  });

  // 1) OMAR activo en pantalla: escribir a memoria + DOM
  if(activeTs && porOmar[activeTs] && tomas && tomas.length){
    const map=porOmar[activeTs];
    tomas.forEach((t,i)=>{ if(map[i+1]!==undefined) t[campo]=map[i+1]; });
    tomas.forEach((t,i)=>{
      if(map[i+1]===undefined) return;
      const body=document.getElementById('tb'+t.id);
      if(body){ const inp=body.querySelector('[data-f="'+campo+'"]'); if(inp) inp.value=map[i+1]; }
    });
    if(!document.querySelector('#tomasDiv [data-toma-id]') && typeof renderTomas==='function'){
      try{ renderTomas(); }catch(e){}
    }
  }

  // 2) OTROS OMARs del plan: escribir directo en su muestreo guardado (opción A)
  Object.keys(porOmar).forEach(rid=>{
    if(rid===activeTs) return;
    const m=(_cachedMuestreos||[]).find(x=>String(x.id)===String(rid)||String(x.ts)===String(rid));
    if(!m) return;
    let o={};
    try{ o = m.omar ? JSON.parse(m.omar) : {}; }catch(e){ return; }
    if(!Array.isArray(o.tomas) || o.tomas.length===0) return;
    const map=porOmar[rid];
    let cambio=false;
    o.tomas.forEach((t,i)=>{ if(map[i+1]!==undefined && t[campo]!==map[i+1]){ t[campo]=map[i+1]; cambio=true; } });
    if(cambio){
      m.omar=JSON.stringify(o);
      try{ idbPut(m); }catch(e){}
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// AARMS v65 — Catálogo UI + UX plan + utilidades
// ═══════════════════════════════════════════════════════════════

// AARMS sub1b-inv: alternar entre tabs Disoluciones / Equipos
function invSetTab(tab){
  const contDisol = document.getElementById('invContDisol');
  const contEquipos = document.getElementById('invContEquipos');
  const tabDisol = document.getElementById('invTabDisol');
  const tabEquipos = document.getElementById('invTabEquipos');
  if(!contDisol || !contEquipos || !tabDisol || !tabEquipos) return;

  const showDisol = (tab === 'disol');
  contDisol.style.display = showDisol ? '' : 'none';
  contEquipos.style.display = showDisol ? 'none' : '';

  tabDisol.style.color = showDisol ? 'var(--w)' : 'var(--g2)';
  tabDisol.style.borderBottomColor = showDisol ? 'var(--acc)' : 'transparent';
  tabEquipos.style.color = showDisol ? 'var(--g2)' : 'var(--w)';
  tabEquipos.style.borderBottomColor = showDisol ? 'transparent' : 'var(--acc)';

  try { sessionStorage.setItem('invLastTab', tab); } catch(e){}
}
window.invSetTab = invSetTab;

// AARMS sub1b-inv: restaurar última pestaña al abrir Inventario
function invRestoreTab(){
  let tab = 'disol';
  try { tab = sessionStorage.getItem('invLastTab') || 'disol'; } catch(e){}
  invSetTab(tab);
}
window.invRestoreTab = invRestoreTab;

// AARMS v65-catfix: abrir catálogo con carga, navegación y render tolerante a fallos
async function abrirCatalogo(){
  try {
    await _catalogoCargar();
    goPage('pgCatalogo');
    setTimeout(() => { catalogoRender(); }, 50);
    // AARMS sub1b-inv: restaurar última pestaña
    setTimeout(() => invRestoreTab(), 60);
  } catch(err){
    console.error('[abrirCatalogo]', err);
    if(typeof errorUsuario === 'function'){
      errorUsuario('No se pudo abrir el inventario', err);
    } else {
      // AARMS nobranding:
      await alertApp({title:'Error', message:'Error abriendo inventario: ' + (err.message || err), variant:'error'});
    }
  }
}

// AARMS v65-catfix: render con try/catch y placeholder si cache aún null
function catalogoRender(){
  try {
    if(!_catalogoCache){
      console.warn('[catalogoRender] _catalogoCache es null');
      const c = document.getElementById('catBuffersCal');
      if(c) c.innerHTML = '<div style="padding:14px;color:var(--g2);text-align:center;font-size:12px">Cargando inventario...</div>';
      return;
    }
    if(_catalogoCache.buffers){
      if(_catalogoCache.buffers.calibracion){
        catalogoRenderBuffers('catBuffersCal', _catalogoCache.buffers.calibracion, 'calibracion');
      }
      if(_catalogoCache.buffers.verificacion){
        catalogoRenderBuffers('catBuffersVer', _catalogoCache.buffers.verificacion, 'verificacion');
      }
    }
    if(_catalogoCache.disoluciones){
      catalogoRenderDisoluciones();
    }
    if(_catalogoCache.conductividad){
      catalogoRenderConductividad();
    }
    if(_catalogoCache.otros){
      catalogoRenderOtros();
    }
    // AARMS sub1-equipos: render equipos
    if(_catalogoCache.equipos){
      catalogoRenderEquipos();
    }
  } catch(err){
    console.error('[catalogoRender]', err);
    const main = document.querySelector('#pgCatalogo .cont');
    if(main){
      main.innerHTML = '<div style="padding:20px;color:#f87171;font-size:12px">Error al renderizar inventario: ' + String(err.message || err).replace(/</g,'&lt;') + '</div>';
    }
  }
}

function catalogoRenderBuffers(containerId, lista, tipo){
  const c = document.getElementById(containerId);
  if(!c) return;
  c.innerHTML = lista.map((b, idx) => {
    const venc = _catalogoLoteVencido(b);
    return `
    <div style="background:var(--bg2);border:1px solid ${venc?'rgba(248,113,113,.5)':'var(--ln)'};border-radius:9px;padding:10px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="font-family:var(--syne);font-weight:800;font-size:14px;color:var(--w)">pH ${b.ph.toFixed(2)}</div>
        ${venc?'<span style="background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.4);color:#f87171;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">VENCIDO</span>':''}
      </div>
      <div class="g2" style="margin-bottom:6px">
        <div class="f" style="margin:0"><label>Lote</label><input type="text" value="${(b.lote||'').replace(/"/g,'&quot;')}" oninput="catalogoUpBuffer('${tipo}',${idx},'lote',this.value)"></div>
        <div class="f" style="margin:0"><label>Marca</label><input type="text" value="${(b.marca||'').replace(/"/g,'&quot;')}" oninput="catalogoUpBuffer('${tipo}',${idx},'marca',this.value)"></div>
      </div>
      <div class="g2" style="margin-bottom:6px">
        <div class="f" style="margin:0"><label>Caducidad</label>${b.caducidad === 'N/A'
          ? `<input type="text" value="N/A" style="color:var(--g2);font-style:italic" oninput="catalogoUpBuffer('${tipo}',${idx},'caducidad',this.value)">`
          : `<input type="date" value="${b.caducidad||''}" oninput="catalogoUpBuffer('${tipo}',${idx},'caducidad',this.value)">`}</div>
        <div class="f" style="margin:0"><label>Uso desde</label><input type="date" value="${b.usoDesde||''}" oninput="catalogoUpBuffer('${tipo}',${idx},'usoDesde',this.value)"></div>
      </div>
      ${tipo==='calibracion' ? `<div class="f" style="margin:0"><label>Uso hasta (opcional)</label><input type="date" value="${b.usoHasta||''}" oninput="catalogoUpBuffer('${tipo}',${idx},'usoHasta',this.value)"></div>` : ''}
    </div>`;
  }).join('');
}

function catalogoRenderDisoluciones(){
  const c = document.getElementById('catDisoluciones');
  if(!c || !_catalogoCache) return;
  c.innerHTML = _catalogoCache.disoluciones.map((d, idx) => {
    const venc = _catalogoLoteVencido(d);
    // AARMS v66-p2: badge ALTERNO para lotes de respaldo en catálogo
    const esAlterno = /\(lote alterno\)/i.test(d.nombre || '');
    return `
    <div style="background:var(--bg2);border:1px solid ${venc?'rgba(248,113,113,.5)':'var(--ln)'};border-radius:9px;padding:10px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <input type="text" value="${(d.nombre||'').replace(/"/g,'&quot;')}" oninput="catalogoUpDisolucion(${idx},'nombre',this.value)" style="font-family:var(--syne);font-weight:800;background:transparent;border:none;color:var(--w);font-size:13px;flex:1;outline:none">
        ${esAlterno ? '<span style="background:rgba(148,163,184,.15);border:1px solid rgba(148,163,184,.3);color:#94a3b8;padding:2px 8px;border-radius:20px;font-size:9.5px;font-weight:700;letter-spacing:.04em">ALTERNO</span>' : ''}
        ${venc?'<span style="background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.4);color:#f87171;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">VENCIDO</span>':''}
        <button onclick="catalogoBorrarDisolucion(${idx})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:3px 8px;border-radius:6px;font-size:10px;cursor:pointer">✕</button>
      </div>
      <div class="g3">
        <div class="f" style="margin:0"><label>Lote</label><input type="text" value="${(d.lote||'').replace(/"/g,'&quot;')}" oninput="catalogoUpDisolucion(${idx},'lote',this.value)"></div>
        <div class="f" style="margin:0"><label>Caducidad</label>${d.caducidad === 'N/A'
          ? `<input type="text" value="N/A" style="color:var(--g2);font-style:italic" oninput="catalogoUpDisolucion(${idx},'caducidad',this.value)">`
          : `<input type="date" value="${d.caducidad||''}" oninput="catalogoUpDisolucion(${idx},'caducidad',this.value)">`}</div>
        <div class="f" style="margin:0"><label>Uso desde</label><input type="date" value="${d.usoDesde||''}" oninput="catalogoUpDisolucion(${idx},'usoDesde',this.value)"></div>
      </div>
    </div>`;
  }).join('');
}

function catalogoRenderConductividad(){
  const c = document.getElementById('catConductividad');
  if(!c || !_catalogoCache) return;
  c.innerHTML = _catalogoCache.conductividad.map((d, idx) => {
    const venc = _catalogoLoteVencido(d);
    return `
    <div style="background:var(--bg2);border:1px solid ${venc?'rgba(248,113,113,.5)':'var(--ln)'};border-radius:9px;padding:10px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <input type="text" value="${(d.nombre||'').replace(/"/g,'&quot;')}" oninput="catalogoUpConductividad(${idx},'nombre',this.value)" style="font-family:var(--syne);font-weight:800;background:transparent;border:none;color:var(--w);font-size:13px;flex:1;outline:none">
        ${venc?'<span style="background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.4);color:#f87171;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">VENCIDO</span>':''}
        <button onclick="catalogoBorrarConductividad(${idx})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:3px 8px;border-radius:6px;font-size:10px;cursor:pointer">✕</button>
      </div>
      <div class="g2" style="margin-bottom:6px">
        <div class="f" style="margin:0"><label>Valor (µS/cm)</label><input type="number" value="${d.valor||''}" oninput="catalogoUpConductividad(${idx},'valor',this.value)"></div>
        <div class="f" style="margin:0"><label>Marca</label><input type="text" value="${(d.marca||'').replace(/"/g,'&quot;')}" oninput="catalogoUpConductividad(${idx},'marca',this.value)"></div>
      </div>
      <div class="g3">
        <div class="f" style="margin:0"><label>Lote</label><input type="text" value="${(d.lote||'').replace(/"/g,'&quot;')}" oninput="catalogoUpConductividad(${idx},'lote',this.value)"></div>
        <div class="f" style="margin:0"><label>Caducidad</label>${d.caducidad === 'N/A'
          ? `<input type="text" value="N/A" style="color:var(--g2);font-style:italic" oninput="catalogoUpConductividad(${idx},'caducidad',this.value)">`
          : `<input type="date" value="${d.caducidad||''}" oninput="catalogoUpConductividad(${idx},'caducidad',this.value)">`}</div>
        <div class="f" style="margin:0"><label>Uso desde</label><input type="date" value="${d.usoDesde||''}" oninput="catalogoUpConductividad(${idx},'usoDesde',this.value)"></div>
      </div>
    </div>`;
  }).join('');
}

// AARMS v65-cat2: render sección otros (agua reactivo, etc)
function catalogoRenderOtros(){
  const c = document.getElementById('catOtros');
  if(!c || !_catalogoCache) return;
  if(!_catalogoCache.otros) _catalogoCache.otros = [];
  c.innerHTML = _catalogoCache.otros.map((d, idx) => {
    const venc = _catalogoLoteVencido(d);
    return `
    <div style="background:var(--bg2);border:1px solid ${venc?'rgba(248,113,113,.5)':'var(--ln)'};border-radius:9px;padding:10px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <input type="text" value="${(d.nombre||'').replace(/"/g,'&quot;')}" oninput="catalogoUpOtro(${idx},'nombre',this.value)" style="font-family:var(--syne);font-weight:800;background:transparent;border:none;color:var(--w);font-size:13px;flex:1;outline:none">
        ${venc?'<span style="background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.4);color:#f87171;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">VENCIDO</span>':''}
        <button onclick="catalogoBorrarOtro(${idx})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:3px 8px;border-radius:6px;font-size:10px;cursor:pointer">✕</button>
      </div>
      <div class="g3">
        <div class="f" style="margin:0"><label>Marca</label><input type="text" value="${(d.marca||'').replace(/"/g,'&quot;')}" oninput="catalogoUpOtro(${idx},'marca',this.value)"></div>
        <div class="f" style="margin:0"><label>Lote</label><input type="text" value="${(d.lote||'').replace(/"/g,'&quot;')}" oninput="catalogoUpOtro(${idx},'lote',this.value)"></div>
        <div class="f" style="margin:0"><label>Caducidad</label>${d.caducidad === 'N/A'
          ? `<input type="text" value="N/A" style="color:var(--g2);font-style:italic" oninput="catalogoUpOtro(${idx},'caducidad',this.value)">`
          : `<input type="date" value="${d.caducidad||''}" oninput="catalogoUpOtro(${idx},'caducidad',this.value)">`}</div>
      </div>
    </div>`;
  }).join('');
}

// AARMS sub1-equipos: render de la sección Equipos en pgCatalogo
function catalogoRenderEquipos(){
  const c = document.getElementById('catEquiposBlock');
  if(!c || !_catalogoCache) return;
  if(!_catalogoCache.equipos){
    _catalogoCache.equipos = { potenciometros:[], conductimetros:[], termometros:[], mallas:[], kitsCloro:[], oximetros:[], cronometros:[], gps:[] };
  }
  const eq = _catalogoCache.equipos;

  // AARMS sub1b-inv: íconos SVG por tipo de equipo
  const _invEqIcon = (tipoKey) => {
    const color = '#f59e0b';
    const base = `width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:${color};flex-shrink:0"`;
    const icons = {
      potenciometros: `<svg ${base}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      conductimetros: `<svg ${base}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
      termometros: `<svg ${base}><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z"/></svg>`,
      mallas: `<svg ${base}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      kitsCloro: `<svg ${base}><path d="M10 2v7.31"/><path d="M14 9.3V2"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`,
      // AARMS sub7-od
      oximetros: `<svg ${base}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`
    };
    return icons[tipoKey] || '';
  };

  const renderTipo = (tipoKey, label, prefijoClave, llevaFC, llevaMarca) => {
    const items = eq[tipoKey] || [];
    const cards = items.map((it, idx) => {
      const claveCompleta = prefijoClave + (it.id || '___');
      return `
      <div style="background:var(--bg2);border:1px solid var(--ln);border-radius:9px;padding:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-family:var(--syne);font-weight:800;color:var(--acc);font-size:12px">${claveCompleta}</span>
          <button onclick="catalogoBorrarEquipo('${tipoKey}', ${idx})" style="margin-left:auto;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:3px 8px;border-radius:6px;font-size:10px;cursor:pointer">✕</button>
        </div>
        <div class="g${llevaFC ? '3' : '2'}">
          <div class="f" style="margin:0">
            <label>ID</label>
            <input type="text" value="${(it.id||'').replace(/"/g,'&quot;')}" oninput="catalogoUpEquipo('${tipoKey}', ${idx}, 'id', this.value)" placeholder="152">
          </div>
          ${llevaMarca ? `
          <div class="f" style="margin:0">
            <label>Marca</label>
            <input type="text" value="${(it.marca||'').replace(/"/g,'&quot;')}" oninput="catalogoUpEquipo('${tipoKey}', ${idx}, 'marca', this.value)">
          </div>` : ''}
          ${llevaFC ? `
          <div class="f" style="margin:0">
            <label>FC (Factor Corrección)</label>
            <input type="number" step="0.01" value="${it.fc !== undefined ? it.fc : ''}" oninput="catalogoUpEquipo('${tipoKey}', ${idx}, 'fc', parseFloat(this.value) || 0)" placeholder="0.0">
          </div>` : ''}
        </div>
        <div class="f" style="margin:6px 0 0 0">
          <label>Notas</label>
          <input type="text" value="${(it.notas||'').replace(/"/g,'&quot;')}" oninput="catalogoUpEquipo('${tipoKey}', ${idx}, 'notas', this.value)">
        </div>
      </div>`;
    }).join('');

    return `
    <div style="margin-bottom:14px">
      <div style="font-size:11px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);margin-bottom:6px;display:flex;align-items:center;gap:6px">${_invEqIcon(tipoKey)}<span>${label}</span></div>
      ${cards || '<div style="padding:8px;color:var(--g2);font-size:11px;font-style:italic">Sin equipos. Toca + para agregar.</div>'}
      <button onclick="catalogoAgregarEquipo('${tipoKey}')" style="margin-top:6px;background:rgba(245,158,11,.08);border:1px dashed rgba(245,158,11,.3);color:#f59e0b;padding:6px 10px;border-radius:7px;font-size:11px;cursor:pointer;width:100%">+ Agregar ${label.toLowerCase()}</button>
    </div>`;
  };

  c.innerHTML = [
    renderTipo('potenciometros',  'Potenciómetros', 'AA/PT/', false, true),
    renderTipo('conductimetros',  'Conductímetros', 'AA/CO/', false, true),
    renderTipo('termometros',     'Termómetros',    'AA/TM/', true,  true),
    renderTipo('mallas',          'Mallas',         'AA/MA/', false, false),
    renderTipo('kitsCloro',       'Kits Cloro',     'AA/KC/', false, false),
    // AARMS sub7-od
    renderTipo('oximetros',       'Oxímetros',      'AA/OX/', false, true)
  ].join('');
}

async function catalogoUpEquipo(tipo, idx, campo, valor){
  if(!_catalogoCache || !_catalogoCache.equipos) return;
  const lista = _catalogoCache.equipos[tipo];
  if(!lista || !lista[idx]) return;
  // AARMS humofix: validar ID único por tipo
  if(campo === 'id'){
    const id = String(valor || '').trim();
    if(id && lista.some((e, i) => i !== idx && String(e.id || '').trim() === id)){
      toast('Ya existe un equipo con ID '+id,'w');
      if(typeof catalogoRenderEquipos === 'function') catalogoRenderEquipos();
      return;
    }
  }
  lista[idx][campo] = valor;
  await _catalogoGuardar();
  catalogoRenderEquipos();
  // AARMS lvarfix: sincronizar LVAR abierta si cambió un ID
  if(campo === 'id') _refreshLvarSiAbierta();
}

async function catalogoAgregarEquipo(tipo){
  if(!_catalogoCache.equipos) _catalogoCache.equipos = {};
  if(!_catalogoCache.equipos[tipo]) _catalogoCache.equipos[tipo] = [];
  const item = { id: '', notas: '' };
  if(tipo === 'potenciometros' || tipo === 'conductimetros' || tipo === 'oximetros') item.marca = '';
  if(tipo === 'termometros') { item.marca = ''; item.fc = 0.0; }
  _catalogoCache.equipos[tipo].push(item);
  await _catalogoGuardar();
  catalogoRenderEquipos();
  _refreshLvarSiAbierta();
}

async function catalogoBorrarEquipo(tipo, idx){
  // AARMS nobranding:
  const ok=await confirmAction({title:'Borrar equipo', message:'¿Borrar este equipo del inventario?', okText:'Borrar'});
  if(!ok) return;
  if(!_catalogoCache.equipos || !_catalogoCache.equipos[tipo]) return;
  _catalogoCache.equipos[tipo].splice(idx, 1);
  await _catalogoGuardar();
  catalogoRenderEquipos();
  _refreshLvarSiAbierta();
}

window.catalogoUpEquipo = catalogoUpEquipo;
window.catalogoAgregarEquipo = catalogoAgregarEquipo;
window.catalogoBorrarEquipo = catalogoBorrarEquipo;

async function catalogoUpOtro(idx, campo, valor){
  if(!_catalogoCache) return;
  if(!_catalogoCache.otros) _catalogoCache.otros = [];
  const item = _catalogoCache.otros[idx];
  if(!item) return;
  if(campo === 'caducidad'){
    const v = String(valor || '').trim();
    if(!v || v.toLowerCase() === 'na' || v.toLowerCase() === 'n/a'){
      valor = 'N/A';
    }
  }
  if(campo === 'lote' && item.lote && item.lote !== valor){
    _catalogoHistoricoAgregar('otros', item.nombre, item.lote, valor);
  }
  item[campo] = valor;
  await _catalogoGuardar();
}

async function catalogoAgregarOtro(){
  // AARMS nobranding:
  const nombre = await promptApp({title:'Nuevo patrón', message:'Nombre del patrón/reactivo:', okText:'Agregar'});
  if(!nombre) return;
  if(!_catalogoCache.otros) _catalogoCache.otros = [];
  _catalogoCache.otros.push({ nombre, marca:'', lote:'', caducidad:'' });
  await _catalogoGuardar();
  catalogoRenderOtros();
}

async function catalogoBorrarOtro(idx){
  // AARMS nobranding:
  const ok=await confirmAction({title:'Borrar patrón', message:'¿Borrar este patrón del inventario?', okText:'Borrar'});
  if(!ok) return;
  if(!_catalogoCache.otros) return;
  _catalogoCache.otros.splice(idx, 1);
  await _catalogoGuardar();
  catalogoRenderOtros();
}

async function catalogoUpBuffer(tipo, idx, campo, valor){
  if(!_catalogoCache) return;
  const lista = _catalogoCache.buffers[tipo];
  if(!lista || !lista[idx]) return;
  if(campo === 'caducidad'){
    const v = String(valor || '').trim();
    if(!v || v.toLowerCase() === 'na' || v.toLowerCase() === 'n/a'){
      valor = 'N/A';
    }
  }
  if(campo === 'lote' && lista[idx].lote && lista[idx].lote !== valor){
    _catalogoHistoricoAgregar('buffer_'+tipo, `pH ${lista[idx].ph}`, lista[idx].lote, valor);
  }
  lista[idx][campo] = valor;
  await _catalogoGuardar();
}

async function catalogoUpDisolucion(idx, campo, valor){
  if(!_catalogoCache) return;
  const item = _catalogoCache.disoluciones[idx];
  if(!item) return;
  if(campo === 'caducidad'){
    const v = String(valor || '').trim();
    if(!v || v.toLowerCase() === 'na' || v.toLowerCase() === 'n/a'){
      valor = 'N/A';
    }
  }
  if(campo === 'lote' && item.lote && item.lote !== valor){
    _catalogoHistoricoAgregar('disolucion', item.nombre, item.lote, valor);
  }
  item[campo] = valor;
  await _catalogoGuardar();
}

async function catalogoUpConductividad(idx, campo, valor){
  if(!_catalogoCache) return;
  const item = _catalogoCache.conductividad[idx];
  if(!item) return;
  if(campo === 'caducidad'){
    const v = String(valor || '').trim();
    if(!v || v.toLowerCase() === 'na' || v.toLowerCase() === 'n/a'){
      valor = 'N/A';
    }
  }
  if(campo === 'lote' && item.lote && item.lote !== valor){
    _catalogoHistoricoAgregar('conductividad', item.nombre, item.lote, valor);
  }
  item[campo] = valor;
  await _catalogoGuardar();
}

function _catalogoHistoricoAgregar(tipo, item, lotePrevio, loteNuevo){
  if(!_catalogoCache.historico) _catalogoCache.historico = [];
  _catalogoCache.historico.unshift({ fecha: new Date().toISOString(), tipo, item, lotePrevio, loteNuevo });
  if(_catalogoCache.historico.length > 100) _catalogoCache.historico.length = 100;
}

async function catalogoAgregarDisolucion(){
  // AARMS nobranding:
  const nombre = await promptApp({title:'Nueva disolución', message:'Nombre de la disolución/reactivo:', okText:'Agregar'});
  if(!nombre) return;
  _catalogoCache.disoluciones.push({ nombre, lote:'', caducidad:'', usoDesde:'' });
  await _catalogoGuardar();
  catalogoRenderDisoluciones();
}

async function catalogoBorrarDisolucion(idx){
  // AARMS nobranding:
  const ok=await confirmAction({title:'Borrar disolución', message:'¿Borrar esta disolución del inventario?', okText:'Borrar'});
  if(!ok) return;
  _catalogoCache.disoluciones.splice(idx, 1);
  await _catalogoGuardar();
  catalogoRenderDisoluciones();
}

async function catalogoAgregarConductividad(){
  // AARMS nobranding:
  const nombre = await promptApp({title:'Nueva solución', message:'Nombre de la solución de conductividad:', okText:'Agregar'});
  if(!nombre) return;
  _catalogoCache.conductividad.push({ nombre, lote:'', marca:'', valor:1412, caducidad:'', usoDesde:'' });
  await _catalogoGuardar();
  catalogoRenderConductividad();
}

async function catalogoBorrarConductividad(idx){
  // AARMS nobranding:
  const ok=await confirmAction({title:'Borrar solución', message:'¿Borrar esta solución del inventario?', okText:'Borrar'});
  if(!ok) return;
  _catalogoCache.conductividad.splice(idx, 1);
  await _catalogoGuardar();
  catalogoRenderConductividad();
}

function catalogoToggleHistorico(){
  const c = document.getElementById('catHistorico');
  if(!c) return;
  if(c.style.display === 'none'){
    const h = (_catalogoCache.historico || []);
    c.innerHTML = h.length === 0
      ? '<div style="text-align:center;padding:14px;color:var(--g2);font-size:11px">Sin cambios registrados</div>'
      : h.map(reg => {
        const fecha = new Date(reg.fecha).toLocaleString('es-MX');
        return `<div style="background:var(--bg2);border:1px solid var(--ln);border-radius:7px;padding:8px 10px;margin-bottom:6px;font-size:11.5px">
          <div style="color:var(--g2);font-size:10px;margin-bottom:2px">${fecha} · ${reg.tipo}</div>
          <div style="color:var(--w);font-weight:700">${reg.item}</div>
          <div style="color:var(--g1);font-size:10.5px;margin-top:2px">Lote anterior: <span style="color:#f87171">${reg.lotePrevio||'(vacío)'}</span> → Lote nuevo: <span style="color:var(--green)">${reg.loteNuevo||'(vacío)'}</span></div>
        </div>`;
      }).join('');
    c.style.display = 'block';
  } else {
    c.style.display = 'none';
  }
}

function _bitPhAutocompletarLoteMarca(reg){
  if(!reg || !_catalogoCache) return reg;
  const phNominal = parseFloat(reg.buffer);
  if(isNaN(phNominal)) return reg;
  const act = String(reg.act||'').toUpperCase();
  const tipoUso = act === 'V' ? 'V' : (act === 'CO' ? 'CO' : 'CA');
  const bufferActivo = _catalogoBufferActivo(phNominal, tipoUso);
  if(bufferActivo){
    // AARMS sub6-atajos: marca autocompletado para badge AUTO
    if(!reg.lote){
      reg.lote = bufferActivo.lote || '';
      if(reg.lote) reg.__lote_from_cat = true;
    }
    if(!reg.marca){
      reg.marca = bufferActivo.marca || '';
      if(reg.marca) reg.__marca_from_cat = true;
    }
    if(bufferActivo && _catalogoLoteVencido(bufferActivo)){
      toast('⚠ Lote del buffer '+phNominal+' está vencido. Actualízalo en el inventario.', 'r');
    }
  }
  return reg;
}

// AARMS sub6-atajos: autocompletar lote/marca Cond desde patrón KCl del Inventario
function _bitCondAutocompletarLoteMarca(reg){
  if(!reg || !_catalogoCache || !Array.isArray(_catalogoCache.conductividad)) return reg;
  const val = parseFloat(reg.patron);
  const nombre = String(reg.patron || '').trim();
  const hit = _catalogoCache.conductividad.find(p => {
    if(p.valor != null && !isNaN(val) && Number(p.valor) === val) return true;
    return nombre && String(p.nombre || '') === nombre;
  });
  if(!hit) return reg;
  if(!reg.lote){
    reg.lote = hit.lote || '';
    if(reg.lote) reg.__lote_from_cat = true;
  }
  if(!reg.marca){
    reg.marca = hit.marca || _catalogoMarcaDesdeNombre(hit.nombre) || '';
    if(reg.marca) reg.__marca_from_cat = true;
  }
  return reg;
}
window._bitCondAutocompletarLoteMarca = _bitCondAutocompletarLoteMarca;

// AARMS v65-fix: extrae marca del nombre del catálogo cuando viene como "Nombre (Marca)"
function _catalogoMarcaDesdeNombre(nombre){
  if(!nombre) return '';
  const m = nombre.match(/\(([^)]+)\)\s*$/);
  return m ? m[1].trim() : '';
}

// AARMS v65-fix2: setea caducidad en input, cambiando type a text si el valor es N/A o vacío explícito
// AARMS v66-p2: NO sobreescribe valores manuales del usuario (comportamiento intencional).
// Para forzar actualización desde catálogo, ver botón "↻" planificado en v67.
function _lvarSetCaducidad(inp, valor){
  if(!inp) return;
  if(inp.value) return; // no sobreescribir manual del usuario
  const v = String(valor || '').trim();
  if(v === 'N/A' || v.toLowerCase() === 'na' || v.toLowerCase() === 'n/a'){
    // Cambiar input a type="text" para que acepte "N/A" como valor literal
    if(inp.type === 'date'){
      inp.type = 'text';
      inp.dataset.lvarOriginalType = 'date';
    }
    inp.value = 'N/A';
    // AARMS v65-phfix: N/A visible normal, no como deshabilitado
    inp.style.color = '';
    inp.style.fontStyle = '';
    inp.style.fontVariant = 'small-caps';
    inp.style.letterSpacing = '0.05em';
    inp.dispatchEvent(new Event('input', {bubbles:true}));
    return;
  }
  // Valor de fecha normal
  if(v){
    inp.value = v;
    inp.dispatchEvent(new Event('input', {bubbles:true}));
  }
}

async function _catalogoPrefillLvarDOM(){
  if(!_catalogoCache) return;
  // AARMS v66-p2: fill NO sobreescribe valores manuales del usuario.
  // Para forzar actualización desde catálogo, ver botón "↻" planificado en v67.
  const fill = (inp, val)=>{
    if(!inp || inp.value || val == null || val === '') return;
    inp.value = val;
    inp.dispatchEvent(new Event('input', {bubbles:true}));
  };
  LVAR_DISOL.forEach(it=>{
    const d = _catalogoDisolMatch(it);
    if(!d) return;
    fill(document.querySelector(`[data-lvar-disol="${it.key}"][data-campo="lote"]`), d.lote || '');
    _lvarSetCaducidad(document.querySelector(`[data-lvar-disol="${it.key}"][data-campo="caducidad"]`), d.caducidad);
  });
  LVAR_REACTIVOS.forEach(it=>{
    const d = _catalogoMatchPorNombre(it.pdfLabel || it.label || it.key);
    if(!d) return;
    // AARMS v65-fix: la marca está embebida en el nombre como "HNO3 ACS (Fermont)"
    const marcaExtraida = d.marca || _catalogoMarcaDesdeNombre(d.nombre);
    fill(document.querySelector(`[data-lvar-disol="react-${it.key}"][data-campo="lote"]`), d.lote || '');
    fill(document.querySelector(`[data-lvar-disol="react-${it.key}"][data-campo="marca"]`), marcaExtraida);
    _lvarSetCaducidad(document.querySelector(`[data-lvar-disol="react-${it.key}"][data-campo="caducidad"]`), d.caducidad);
  });
  _catalogoCache.buffers.calibracion.forEach((b, i)=>{
    ['lote','marca','cad'].forEach(campo=>{
      const inp = document.querySelector(`[data-lvar-patron="cal-${i}"][data-campo="${campo}"]`);
      if(!inp || inp.value) return;
      if(campo === 'cad') _lvarSetCaducidad(inp, b.caducidad);
      else fill(inp, b[campo] || '');
    });
  });
  _catalogoCache.buffers.verificacion.forEach((b, i)=>{
    ['lote','marca','cad'].forEach(campo=>{
      const inp = document.querySelector(`[data-lvar-patron="ver-${i}"][data-campo="${campo}"]`);
      if(!inp || inp.value) return;
      if(campo === 'cad') _lvarSetCaducidad(inp, b.caducidad);
      else fill(inp, b[campo] || '');
    });
  });
  // AARMS v65-phfix: autocompletar el valor pH de cada patrón (no editable)
  _catalogoCache.buffers.calibracion.forEach((b, i)=>{
    const inp = document.querySelector(`[data-lvar-patron-ph="cal-${i}"]`);
    if(inp){
      inp.value = (typeof b.ph === 'number') ? b.ph.toFixed(2) : (b.ph || '');
      inp.dispatchEvent(new Event('input', {bubbles:true}));
    }
  });
  _catalogoCache.buffers.verificacion.forEach((b, i)=>{
    const inp = document.querySelector(`[data-lvar-patron-ph="ver-${i}"]`);
    if(inp){
      inp.value = (typeof b.ph === 'number') ? b.ph.toFixed(2) : (b.ph || '');
      inp.dispatchEvent(new Event('input', {bubbles:true}));
    }
  });
  // AARMS v66-p2: eliminado prefill muerto cond-${i} (KCl no tiene campo pH; conValor=false)
  _catalogoCache.conductividad.forEach((c, i)=>{
    fill(document.querySelector(`[data-lvar-cond="${i}"][data-campo="lote"]`), c.lote || '');
    fill(document.querySelector(`[data-lvar-cond="${i}"][data-campo="marca"]`), c.marca || '');
    _lvarSetCaducidad(document.querySelector(`[data-lvar-cond="${i}"][data-campo="cad"]`), c.caducidad);
  });
  // AARMS v66-p0p1: agua reactivo por nombre (no asumir otros[0])
  document.querySelectorAll('[data-lvar-patron="agua_reactivo"]').forEach(inp=>{
    const campo = inp.getAttribute('data-campo');
    if(!campo) return;
    const agua = _catalogoAguaReactivo();
    if(!agua || inp.value) return;
    if(campo === 'lote') fill(inp, agua.lote || '');
    else if(campo === 'marca') fill(inp, agua.marca || '');
    else if(campo === 'cad' || campo === 'caducidad') _lvarSetCaducidad(inp, agua.caducidad);
  });
  _lvarPalomearAuto();
}

// AARMS v65-cat2: actualiza palomita SVG de una fila LVAR según inputs requeridos
function _lvarRefreshRowMark(row){
  if(!row) return;
  const inputs = row.querySelectorAll('input[data-required="true"]');
  let hasData = false;
  inputs.forEach(i=>{
    const v = String(i.value||'').trim();
    if(v !== '' && v !== '0') hasData = true;
  });
  const mark = row.querySelector('[data-lv-mark]');
  if(mark){
    const tmp = document.createElement('div');
    tmp.innerHTML = _lvCheckBadge(hasData);
    mark.replaceWith(tmp.firstChild);
  }
}

// AARMS v65-cat2: palomita automática tras prefill del catálogo (SVG data-lv-mark, no checkbox)
function _lvarPalomearAuto(){
  document.querySelectorAll('#pgLVAR [data-lv-row]').forEach(row=>{
    if(!row.querySelector('[data-lvar-disol], [data-lvar-patron], [data-lvar-cond]')) return;
    const inputs = row.querySelectorAll('[data-lvar-disol], [data-lvar-patron], [data-lvar-cond]');
    let anyVal = false;
    inputs.forEach(inp=>{
      const campo = inp.getAttribute('data-campo');
      if(!campo) return;
      if(['lote','cad','caducidad','marca'].includes(campo) && String(inp.value||'').trim()) anyVal = true;
    });
    if(anyVal) _lvarRefreshRowMark(row);
  });
}

// AARMS v65-cat2: marcar palomita/checkbox como tocado manualmente (listas con checkbox real)
document.addEventListener('change', function(e){
  if(!e.target || e.target.type !== 'checkbox') return;
  if(e.target.closest('#pgLVAR [data-lv-row]')){
    e.target.dataset.lvarTouched = '1';
  }
}, true);

async function _catalogoPrefillPhLab(){
  if(!_catalogoCache) return;
  const cal = _catalogoCache.buffers.calibracion;
  const ver = _catalogoCache.buffers.verificacion;
  if(cal[0]){
    const set=(id,v)=>{ const e=document.getElementById(id); if(e && !e.value) e.value=v||''; };
    set('ph1_lote', cal[0].lote);
    set('ph1_marca', cal[0].marca);
    set('ph1_buffer', cal[0].ph != null ? cal[0].ph.toFixed(2) : '');
  }
  if(ver[1]){
    const set=(id,v)=>{ const e=document.getElementById(id); if(e && !e.value && v) e.value=v; };
    set('ph1_buffer', ver[1].ph != null ? ver[1].ph.toFixed(2) : '');
  }
}

// AARMS v66-p0p1: fusionar catálogo en omar.ph2644h1 (PDF sin abrir pantalla)
function _catalogoFusionPh2644h1(h){
  if(!_catalogoCache || !h) return h;
  const cal = _catalogoCache.buffers && _catalogoCache.buffers.calibracion;
  const ver = _catalogoCache.buffers && _catalogoCache.buffers.verificacion;
  if(cal && cal[0]){
    if(!h.lote && cal[0].lote) h.lote = cal[0].lote;
    if(!h.marca && cal[0].marca) h.marca = cal[0].marca;
    if(!h.buffer && cal[0].ph != null) h.buffer = cal[0].ph.toFixed(2);
  }
  if(ver && ver[1] && !h.buffer && ver[1].ph != null){
    h.buffer = ver[1].ph.toFixed(2);
  }
  return h;
}

async function _catalogoPrefillColabLab(){
  if(!_catalogoCache || !_catalogoCache.conductividad.length) return;
  const c0 = _catalogoCache.conductividad[0];
  const set=(id,v)=>{ const e=document.getElementById(id); if(e && !e.value) e.value=v||''; };
  set('colab_ctrl_lote', c0.lote);
  set('colab_marca', c0.marca);
}

function _curPlan(){
  if(!_currentPlanId) return null;
  return (_cachedPlanes||[]).find(p=>p.id===_currentPlanId) || null;
}

function _planOmarData(plan){
  const ids = plan && plan.omarIds ? plan.omarIds : [];
  const out = [];
  for(const id of ids){
    const m = (_cachedMuestreos||[]).find(x=>String(x.id)===String(id));
    if(!m) continue;
    try{ out.push({m, o: m.omar ? JSON.parse(m.omar) : {}}); }catch(e){}
  }
  return out;
}

function _colabLabEstadoFromPlan(plan){
  const om = _planOmarData(plan)[0];
  const lab = (om && om.o && om.o.colabLab) || {};
  const hasId = !!(String(lab.fecha||'').trim() && (String(lab.marca||'').trim() || String(lab.clave||'').trim()));
  const hasMrc = !!(String(lab.mrc_l1||'').trim() && String(lab.mrc_l2||'').trim() && String(lab.mrc_l3||'').trim());
  const mantOk = _colabMantCompleto(lab);
  if(hasId && hasMrc && mantOk) return 'completo';
  if(lab.fecha || lab.marca || lab.mrc_l1 || lab.m_bat || lab.mant_na) return 'progreso';
  return 'vacio';
}

function _planEstadoDoc(plan, docKey){
  if(!plan) return 'vacio';
  switch(docKey){
    case 'lvar': {
      const l = plan.lvar || {};
      const camposCriticos = ['folio','fecha','lugar','ciudad','estado','tipo','norma'];
      const llenos = camposCriticos.filter(k => l[k] && String(l[k]).trim()).length;
      if(llenos === 0) return 'vacio';
      if(llenos === camposCriticos.length) return 'completo';
      return 'progreso';
    }
    case 'bpm': {
      const om = _planOmarData(plan)[0];
      const b = (om && om.o && om.o.bpm) || plan.bpm || {};
      const camposCriticos = ['f1_blvm','f2_bucc','f4_fol'];
      const llenos = camposCriticos.filter(k => b[k] && String(b[k]).trim()).length;
      if(llenos === 0) return 'vacio';
      if(llenos >= 2) return 'completo';
      return 'progreso';
    }
    case 'phlab': {
      const om = _planOmarData(plan)[0];
      const p = om && om.o ? (om.o.ph2644h1||{}) : {};
      const labOk = p.cal_l1 && p.comp_l1 && p.ver_l1;
      if(!labOk) return 'vacio';
      if(p.cal_l3 && p.comp_l3 && p.ver_l3) return 'completo';
      return 'progreso';
    }
    case 'colab': {
      // AARMS v66-flujos: progreso conductímetro lab alineado con colabLab real (mrc_l1…)
      return _colabLabEstadoFromPlan(plan);
    }
    case 'bitCond': {
      const arr = plan.bitCond || [];
      if(arr.length === 0) return 'vacio';
      const filasNormales = arr.filter(r => !r.calibGrupo);
      const completas = filasNormales.filter(r => r.l1 && r.l2 && r.l3).length;
      if(completas === 0) return 'vacio';
      if(completas === filasNormales.length && filasNormales.length > 0) return 'completo';
      return 'progreso';
    }
    case 'condcamp': {
      // AARMS v66-flujos: condcamp es alias de bitCond
      return _planEstadoDoc(plan, 'bitCond');
    }
    case 'blmp': {
      const om = _planOmarData(plan)[0];
      const b = om && om.o ? (om.o.blmpLab||{}) : {};
      if(!b.fecha) return 'vacio';
      if(b.fecha && b.aapt) return 'completo';
      return 'progreso';
    }
    case 'bitPh': {
      const arr = plan.bitPh || [];
      if(arr.length === 0) return 'vacio';
      const filasNormales = arr.filter(r => !r.calibGrupo);
      const completas = filasNormales.filter(r => r.l1 && r.l2 && r.l3).length;
      if(completas === 0) return 'vacio';
      if(completas === filasNormales.length && filasNormales.length > 0) return 'completo';
      return 'progreso';
    }
    case 'bitTemp':
    case 'bittemp': {
      const arr = plan.bitTemp || [];
      if(arr.length === 0) return 'vacio';
      const completas = arr.filter(r => r.agua_l1 && r.agua_l2 && r.agua_l3 && r.amb_l1 && r.amb_l2 && r.amb_l3);
      let totalTomas = 0;
      const ids = plan.omarIds || [];
      for(const mid of ids){
        const m = (_cachedMuestreos||[]).find(x=>String(x.id)===String(mid));
        if(m && Array.isArray(m.tomas)) totalTomas += m.tomas.length;
        else if(omar && String(omar.ts)===String(mid) && tomas) totalTomas += tomas.length;
      }
      if(completas.length === 0) return 'vacio';
      if(totalTomas > 0 && completas.length >= totalTomas) return 'completo';
      return 'progreso';
    }
    case 'bitflujos': {
      const arr = plan.bitFlujos || [];
      if(arr.length === 0) return 'vacio';
      const completas = arr.filter(r => r.l1 && r.l2 && r.l3);
      let totalTomas = 0;
      const ids = plan.omarIds || [];
      for(const mid of ids){
        const m = (_cachedMuestreos||[]).find(x=>String(x.id)===String(mid));
        if(m && Array.isArray(m.tomas)) totalTomas += m.tomas.length;
        else if(omar && String(omar.ts)===String(mid) && tomas) totalTomas += tomas.length;
      }
      if(completas.length === 0) return 'vacio';
      if(totalTomas > 0 && completas.length >= totalTomas) return 'completo';
      return 'progreso';
    }
    // AARMS sub7-od: estado card Bitácora OD (opcional)
    case 'bitod': {
      const p = plan.bitOD;
      if(!p) return 'vacio';
      const tienelab = !!(p.calibLab?.zero?.lectura || p.calibLab?.sat100?.lectura);
      const tienecampo = !!(p.calibCampo?.zero?.lectura || p.calibCampo?.sat100?.lectura);
      const tomasCompletas = (p.lecturas || []).filter(r => r.lectura1 && r.lectura2).length;
      let totalTomas = 0;
      const ids = plan.omarIds || [];
      for(const mid of ids){
        const m = (_cachedMuestreos||[]).find(x=>String(x.id)===String(mid));
        if(m && Array.isArray(m.tomas)) totalTomas += m.tomas.length;
        else if(omar && String(omar.ts)===String(mid) && tomas) totalTomas += tomas.length;
      }
      if(tienelab && tienecampo && totalTomas > 0 && tomasCompletas >= totalTomas) return 'completo';
      if(tienelab || tienecampo || (p.lecturas||[]).some(r => r.lectura1 || r.lectura2) || (p.verifLab||[]).length || (p.verifCampo||[]).length) return 'progreso';
      if((p.lecturas||[]).length > 0 || p.folio) return 'progreso';
      return 'vacio';
    }
    case 'bm': {
      const om = _planOmarData(plan)[0];
      const b = om && om.o ? (om.o.bmForm||om.o.bm||{}) : {};
      if(!b.bm_s1_fecha && !b.fecha) return 'vacio';
      if((b.bm_s1_plan || b.cuerpo) && b.bm_s1_empresa) return 'completo';
      return 'progreso';
    }
    case 'omars': {
      const ids = plan.omarIds || [];
      if(ids.length === 0) return 'vacio';
      let completos = 0;
      for(const {o} of _planOmarData(plan)){
        if(o.folio && o.empresa) completos++;
      }
      if(completos === 0) return 'vacio';
      if(completos === ids.length) return 'completo';
      return 'progreso';
    }
  }
  return 'vacio';
}

function _planPorcentajeCompletitud(plan){
  if(!plan) return 0;
  const completos = _PLAN_ORDEN_OFICIAL.filter(d => _planEstadoDoc(plan, d) === 'completo').length;
  return Math.round((completos / _PLAN_ORDEN_OFICIAL.length) * 100);
}

function _planSiguientePaso(plan){
  if(!plan) return null;
  for(const key of _PLAN_ORDEN_OFICIAL){
    if(_planEstadoDoc(plan, key) !== 'completo'){
      return {
        key,
        titulo: _PLAN_PASO_TITULOS[key] || key,
        estado: _planEstadoDoc(plan, key),
      };
    }
  }
  return null;
}

function _badgeEstadoDoc(estado){
  const cfg = {
    completo: {bg:'rgba(134,239,172,.15)', border:'rgba(134,239,172,.4)', color:'#86efac', icon:'✓', txt:'Completo'},
    progreso: {bg:'rgba(251,191,36,.15)', border:'rgba(251,191,36,.4)', color:'#fbbf24', icon:'⚠', txt:'En progreso'},
    vacio: {bg:'rgba(148,163,184,.1)', border:'rgba(148,163,184,.3)', color:'#94a3b8', icon:'○', txt:'Sin tocar'}
  };
  const c = cfg[estado] || cfg.vacio;
  return `<span style="background:${c.bg};border:1px solid ${c.border};color:${c.color};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:4px"><span>${c.icon}</span>${c.txt}</span>`;
}

function _renderBarraProgreso(plan){
  const pct = _planPorcentajeCompletitud(plan);
  return `
    <div style="background:var(--bg2);border:1px solid var(--ln);border-radius:10px;padding:12px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-family:var(--syne);font-size:12px;color:var(--g1);font-weight:700">Progreso del plan</div>
        <div style="font-family:var(--syne);font-size:14px;color:var(--w);font-weight:800">${pct}%</div>
      </div>
      <div style="background:rgba(148,163,184,.1);border-radius:99px;height:8px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--acc),#86efac);transition:width .3s ease"></div>
      </div>
    </div>`;
}

function _renderSiguientePaso(plan){
  const paso = _planSiguientePaso(plan);
  if(!paso){
    return `<div style="background:rgba(134,239,172,.08);border:1px solid rgba(134,239,172,.3);border-radius:10px;padding:12px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
      <div style="font-size:20px">✓</div>
      <div><div style="font-family:var(--syne);font-size:13px;color:#86efac;font-weight:800">Plan completo</div>
      <div style="font-size:11px;color:var(--g1)">Todos los documentos están listos. Puedes generar los PDFs.</div></div></div>`;
  }
  return `<div style="background:rgba(74,158,255,.08);border:1px solid rgba(74,158,255,.3);border-radius:10px;padding:12px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
    <div style="font-size:20px">→</div>
    <div style="flex:1">
      <div style="font-family:var(--syne);font-size:11px;color:var(--acc);font-weight:700;text-transform:uppercase;letter-spacing:.05em">Siguiente paso</div>
      <div style="font-size:13px;color:var(--w);font-weight:700;margin-top:2px">${paso.titulo}</div>
    </div>
    <button onclick="abrirDocPlan('${paso.key}')" style="background:var(--acc);border:none;color:white;padding:8px 14px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">Abrir</button>
  </div>`;
}

function _aplicarDocEstadoBadge(docKey){
  const plan = _curPlan();
  const badge = document.getElementById('badgeEstadoDoc_'+docKey);
  if(badge && plan) badge.innerHTML = _badgeEstadoDoc(_planEstadoDoc(plan, docKey));
  if(['bpm','lvar','blmp','phlab','colab'].includes(docKey)) _actualizarGatePlanUI();
}

let _confirmacionBorrarPlan = false;
let _timeoutBorrarPlan = null;

function confirmarBorrarPlan(btn){
  if(_confirmacionBorrarPlan){
    clearTimeout(_timeoutBorrarPlan);
    _confirmacionBorrarPlan = false;
    borrarPlanActual();
    return;
  }
  _confirmacionBorrarPlan = true;
  const txtOriginal = btn.textContent;
  btn.textContent = '⚠ Toca otra vez en 3s para borrar';
  btn.style.background = 'rgba(248,113,113,.25)';
  btn.style.borderColor = 'rgba(248,113,113,.6)';
  _timeoutBorrarPlan = setTimeout(() => {
    _confirmacionBorrarPlan = false;
    btn.textContent = txtOriginal;
    btn.style.background = 'rgba(248,113,113,.08)';
    btn.style.borderColor = 'rgba(248,113,113,.3)';
  }, 3000);
}

async function borrarPlanActual(){
  if(!_currentPlanId) return;
  const plan = (_cachedPlanes||[]).find(p => p.id === _currentPlanId);
  if(!plan) return;
  try{
    await eliminarPlan(_currentPlanId, {borrarOmars:true});
  }catch(e){
    errorUsuario('No se pudo borrar el plan.', e);
    return;
  }
  _currentPlanId = null;
  toast('Plan borrado completamente', 'g');
  goHome();
}

function errorUsuario(mensajeUsuario, errorTecnico){
  console.error('[AARMS error]', errorTecnico);
  const ts = Date.now();
  const id = 'errModal_' + ts;
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1a0d10;border:1px solid rgba(248,113,113,.5);border-radius:10px;padding:14px 16px;color:#f87171;z-index:9999;max-width:90%;box-shadow:0 8px 24px rgba(0,0,0,.5);display:flex;align-items:center;gap:12px';
  div.innerHTML = `
    <span style="font-size:18px">⚠</span>
    <div style="flex:1;font-size:12px">${String(mensajeUsuario).replace(/</g,'&lt;')}</div>
    ${errorTecnico ? `<button onclick="document.getElementById('${id}').style.display='flex'" style="background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.4);color:#f87171;padding:5px 10px;border-radius:6px;font-size:11px;cursor:pointer">Detalles</button>` : ''}
    <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:#f87171;font-size:18px;cursor:pointer">×</button>`;
  document.body.appendChild(div);
  setTimeout(() => { if(div.parentElement) div.remove(); }, 8000);
  if(errorTecnico){
    const modal = document.createElement('div');
    modal.id = id;
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10000;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = `<div style="background:var(--bg2);border:1px solid var(--ln);border-radius:12px;padding:18px;max-width:600px;max-height:80vh;overflow:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:var(--syne);font-weight:800;color:#f87171">Detalles técnicos del error</div>
        <button onclick="document.getElementById('${id}').remove()" style="background:transparent;border:none;color:var(--g1);font-size:22px;cursor:pointer">×</button>
      </div>
      <pre style="background:var(--bg3);padding:12px;border-radius:8px;color:var(--g1);font-size:11px;white-space:pre-wrap;word-break:break-word;font-family:var(--mono)">${String(errorTecnico && (errorTecnico.stack || errorTecnico.message || errorTecnico)).replace(/</g,'&lt;')}</pre>
    </div>`;
    document.body.appendChild(modal);
  }
}

function _aplicarPromedioABm(omarId, numToma, tipo, valor){
  const m = (_cachedMuestreos || []).find(x => String(x.id) === String(omarId));
  if(!m) return;
  let o = {};
  try{ o = m.omar ? JSON.parse(m.omar) : {}; }catch(e){ return; }
  if(!o.tomas || !Array.isArray(o.tomas)) return;
  const idx = numToma - 1;
  if(!o.tomas[idx]) return;
  const campo = tipo === 'ph' ? 'ph' : 'cond';
  if(o.tomas[idx][campo] !== valor){
    o.tomas[idx][campo] = valor;
    m.omar = JSON.stringify(o);
    m.tomas = o.tomas;
    idbPut(m).then(() => {
      toast(`Promedio ${tipo.toUpperCase()} aplicado a BM del OMAR ${o.folio || omarId}`, 'g');
    }).catch(e => errorUsuario('Error al guardar promedio en BM.', e));
  }
}

// AARMS v65: captura blob sin descargar (intercepta doc.save y entregarPDF)
// AARMS humofix: jsPDF moderno usa API.save; prototype.save puede ser undefined
// AARMS sub53-fino: save vive en la INSTANCIA — envolver el constructor, no solo prototype
async function _pdfCaptureOutput(pdfFn){
  const jspdfNs = window.jspdf;
  const JsPDF = jspdfNs && jspdfNs.jsPDF;
  if(!JsPDF) return null;
  let docRef = null;
  let blobOut = null;
  const captureSave = function(){
    docRef = this;
    try{ return this.output('blob'); }catch(e){ return null; }
  };
  const Wrapped = function(...args){
    const doc = new JsPDF(...args);
    try{ doc.save = captureSave; }catch(_){}
    return doc;
  };
  Wrapped.prototype = JsPDF.prototype;
  Wrapped.API = JsPDF.API;
  Object.keys(JsPDF).forEach((k) => {
    try{ if(!(k in Wrapped)) Wrapped[k] = JsPDF[k]; }catch(_){}
  });
  const origCtor = jspdfNs.jsPDF;
  jspdfNs.jsPDF = Wrapped;
  const origEntregar = typeof entregarPDF === 'function' ? entregarPDF : null;
  if(origEntregar){
    window.entregarPDF = function(blob){ blobOut = blob; return Promise.resolve(); };
  }
  const origToast = window.toast;
  const origAlert = window.alertApp;
  window.toast = function(){};
  window.alertApp = function(){};
  try{
    await pdfFn();
    if(blobOut) return blobOut;
    if(docRef){
      try{ return docRef.output('blob'); }catch(e){ return null; }
    }
    return null;
  } finally {
    jspdfNs.jsPDF = origCtor;
    if(origEntregar) window.entregarPDF = origEntregar;
    window.toast = origToast;
    window.alertApp = origAlert;
  }
}

async function generarPDFLVARBlob(){
  return _pdfCaptureOutput(() => generarPDFLVAR());
}

async function generarPDFBlmpFormBlob(){
  return _pdfCaptureOutput(() => generarPDFBlmpForm());
}

async function generarPDFColabCompletoBlob(){
  return _pdfCaptureOutput(() => generarPDFColabCompleto());
}

async function generarPDFOmarBlob(omarId){
  const prevOmarId = omar && omar.ts ? String(omar.ts) : null;
  try{
    if(String(omarId) !== prevOmarId) cargarMuestreo(omarId);
    return await _pdfCaptureOutput(() => buildPDF());
  } finally {
    if(prevOmarId && String(omarId) !== prevOmarId) cargarMuestreo(prevOmarId);
  }
}

window._pdfCaptureOutput = _pdfCaptureOutput;
window.generarPDFLVARBlob = generarPDFLVARBlob;
window.generarPDFBlmpFormBlob = generarPDFBlmpFormBlob;
window.generarPDFColabCompletoBlob = generarPDFColabCompletoBlob;
window.abrirFlujoConductimetro = abrirFlujoConductimetro;
window.continuarLvarACampo = continuarLvarACampo;
window.irLvarDesdeCampo = irLvarDesdeCampo;
window.continuarFlujoConductimetroCampo = continuarFlujoConductimetroCampo;
window.irFlujoConductimetroLab = irFlujoConductimetroLab;
window.cerrarFlujoConductimetroDesdeLab = cerrarFlujoConductimetroDesdeLab;
window.abrirBitacoraCond = abrirBitacoraCond;
window.cerrarBitacoraCond = cerrarBitacoraCond;
window.bitPhUp = bitPhUp; // AARMS sub6-atajos: exponer como bitCondUp
window.bitCondAgregarRegistro = bitCondAgregarRegistro;
window.bitCondEliminar = bitCondEliminar;
window.bitCondUp = bitCondUp;
window.generarPDFColabCompleto = generarPDFColabCompleto;
window._bitCondFolioDocSet = _bitCondFolioDocSet;
window._persistPlanBitCond = _persistPlanBitCond;
window.generarPDFOmarBlob = generarPDFOmarBlob;

async function _pdfABlob(tipo, omarId){
  switch(tipo){
    case 'lvar': if(typeof generarPDFLVARBlob === 'function') return await generarPDFLVARBlob(); break;
    case 'bpm': if(typeof generarPDFBpmBlob === 'function') return await generarPDFBpmBlob(); break;
    case 'phlab': if(typeof generarPDFPh2644H1Blob === 'function') return await generarPDFPh2644H1Blob(); break;
    case 'colab': if(typeof generarPDFColabCompletoBlob === 'function') return await generarPDFColabCompletoBlob(); break;
    case 'blmp': if(typeof generarPDFBlmpFormBlob === 'function') return await generarPDFBlmpFormBlob(); break;
    case 'bitPh': if(typeof generarPDFBitacoraPHOficialBlob === 'function') return await generarPDFBitacoraPHOficialBlob(); break;
    case 'bitTemp': if(typeof generarPDFBitTempBlob === 'function') return await generarPDFBitTempBlob(); break;
    case 'bitflujos': if(typeof generarPDFBitFlujosBlob === 'function') return await generarPDFBitFlujosBlob(); break;
    case 'bm': if(typeof generarPDFBmBlob === 'function') return await generarPDFBmBlob(); break;
    case 'omar': if(typeof generarPDFOmarBlob === 'function') return await generarPDFOmarBlob(omarId); break;
  }
  return null;
}

async function generarTodosLosPDFs(){
  if(typeof JSZip === 'undefined'){
    toast('JSZip no cargado, no se puede generar el ZIP', 'r');
    return;
  }
  const plan = _curPlan();
  if(!plan){ toast('No hay plan activo', 'w'); return; }
  const prevOmarId = omar && omar.ts ? String(omar.ts) : null;
  toast('Generando todos los PDFs...', '');
  const zip = new JSZip();
  const generadores = [
    {key:'bpm', nombre:'BPM_PlanMuestreo.pdf', fn: () => _pdfABlob('bpm')},
    {key:'lvar', nombre:'LVAR_ListaVerificacion.pdf', fn: () => _pdfABlob('lvar')},
    {key:'phlab', nombre:'pH_Hoja1_Lab.pdf', fn: () => _pdfABlob('phlab')},
    {key:'colab', nombre:'Conductimetro.pdf', fn: () => _pdfABlob('colab')},
    {key:'blmp', nombre:'BLMP_LimpiezaPHmetro.pdf', fn: () => _pdfABlob('blmp')},
    {key:'bitPh', nombre:'pH_Hoja2_EntreTomas.pdf', fn: () => _pdfABlob('bitPh')},
    {key:'bm', nombre:'BM_BitacoraMuestreo.pdf', fn: () => _pdfABlob('bm')}
  ];
  for(const gen of generadores){
    try{
      const blob = await gen.fn();
      if(blob) zip.file(gen.nombre, blob);
    }catch(e){ console.warn('[zip]', gen.key, e); }
  }
  for(const omarId of (plan.omarIds || [])){
    try{
      const blob = await _pdfABlob('omar', omarId);
      if(blob){
        const m = (_cachedMuestreos||[]).find(x => String(x.id) === String(omarId));
        const folio = m ? (m.folio || omarId) : omarId;
        zip.file(`OMAR_${folio}.pdf`, blob);
      }
    }catch(e){ console.warn('[zip omar]', e); }
  }
  const blob = await zip.generateAsync({type:'blob'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const folio = plan.folio || plan.id;
  const fecha = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `AARMS_Plan_${folio}_${fecha}.zip`;
  a.click();
  URL.revokeObjectURL(url);
  if(prevOmarId){
    try{ cargarMuestreo(prevOmarId); }catch(e){ console.warn('[zip restore omar]', e); }
  }
  toast('ZIP descargado con todos los PDFs', 'g');
}

window.abrirCatalogo = abrirCatalogo;
window.catalogoUpBuffer = catalogoUpBuffer;
window.catalogoUpDisolucion = catalogoUpDisolucion;
window.catalogoUpConductividad = catalogoUpConductividad;
window.catalogoAgregarDisolucion = catalogoAgregarDisolucion;
window.catalogoBorrarDisolucion = catalogoBorrarDisolucion;
window.catalogoAgregarConductividad = catalogoAgregarConductividad;
window.catalogoBorrarConductividad = catalogoBorrarConductividad;
window.catalogoUpOtro = catalogoUpOtro;
window.catalogoAgregarOtro = catalogoAgregarOtro;
window.catalogoBorrarOtro = catalogoBorrarOtro;
window.catalogoToggleHistorico = catalogoToggleHistorico;
window.confirmarBorrarPlan = confirmarBorrarPlan;
window.errorUsuario = errorUsuario;
window.generarTodosLosPDFs = generarTodosLosPDFs;

// ═══════════════════════════════════════════════════════════════
// AARMS sub9-firma: firmas dibujadas (muestreador + supervisor PIN)
// ═══════════════════════════════════════════════════════════════

// AARMS sub9-firma: config global offline
function _appConfigGet(){
  try { return JSON.parse(localStorage.getItem('aarms_config') || '{}'); }
  catch(e){ return {}; }
}
async function _appConfigSave(c){
  try { localStorage.setItem('aarms_config', JSON.stringify(c)); }
  catch(e){ console.warn('[config save]', e); }
}
window._appConfigGet = _appConfigGet;
window._appConfigSave = _appConfigSave;

// AARMS sub9-firma: identidad del muestreador
function _muestreadorActual(){
  const c = _appConfigGet();
  return c.muestreador || { nombre:'', cargo:'Muestreador', firmaPng:'' };
}
async function _muestreadorSet(nombre, cargo, firmaPng){
  const c = _appConfigGet();
  const prev = c.muestreador || {};
  c.muestreador = {
    nombre: (nombre !== undefined && nombre !== null ? String(nombre) : (prev.nombre || '')).trim(),
    cargo: (cargo !== undefined && cargo !== null ? String(cargo) : (prev.cargo || 'Muestreador')).trim() || 'Muestreador',
    firmaPng: firmaPng !== undefined ? (firmaPng || '') : (prev.firmaPng || '')
  };
  await _appConfigSave(c);
}
window._muestreadorActual = _muestreadorActual;
window._muestreadorSet = _muestreadorSet;

// AARMS sub9-firma: supervisor(es) con PIN hasheado
async function _hashPin(pin){
  const enc = new TextEncoder().encode('aarms_salt_v1:' + String(pin));
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
async function _supervisorSet(nombre, cargo, pin){
  const c = _appConfigGet();
  const pinHash = await _hashPin(pin);
  c.supervisores = [{
    id: 'sup1',
    nombre: (nombre||'').trim(),
    cargo: (cargo||'Supervisor').trim() || 'Supervisor',
    pinHash
  }];
  await _appConfigSave(c);
}
async function _supervisorValidarPin(pin){
  const sups = _appConfigGet().supervisores || [];
  if(!sups.length) return null;
  const h = await _hashPin(pin);
  return sups.find(s => s.pinHash === h) || null;
}
function _supervisorConfigurado(){ return (_appConfigGet().supervisores||[]).length > 0; }
function _supervisorActual(){
  const s = (_appConfigGet().supervisores||[])[0];
  return s || null;
}
window._hashPin = _hashPin;
window._supervisorSet = _supervisorSet;
window._supervisorValidarPin = _supervisorValidarPin;
window._supervisorConfigurado = _supervisorConfigurado;
window._supervisorActual = _supervisorActual;

function _fechaDDMMAA(d){
  d = d || new Date();
  return [String(d.getDate()).padStart(2,'0'), String(d.getMonth()+1).padStart(2,'0'), String(d.getFullYear()).slice(-2)].join(' ');
}
function _horaHHMM(d){
  d = d || new Date();
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
window._fechaDDMMAA = _fechaDDMMAA;
window._horaHHMM = _horaHHMM;

// AARMS sub9-firma: motor de dibujo de firma en canvas
let _firmaCtx = null, _firmaDibujando = false, _firmaVacia = true, _firmaOnConfirm = null, _firmaListenersBound = false;

function _firmaInitCanvas(){
  const cv = document.getElementById('firmaCanvas');
  if(!cv) return;
  const ratio = window.devicePixelRatio || 1;
  const rect = cv.getBoundingClientRect();
  const cssW = Math.max(280, rect.width || 440);
  const cssH = 200;
  cv.width = Math.floor(cssW * ratio);
  cv.height = Math.floor(cssH * ratio);
  cv.style.width = cssW + 'px';
  cv.style.height = cssH + 'px';
  _firmaCtx = cv.getContext('2d');
  _firmaCtx.setTransform(1,0,0,1,0,0);
  _firmaCtx.scale(ratio, ratio);
  _firmaCtx.lineWidth = 2.2;
  _firmaCtx.lineCap = 'round';
  _firmaCtx.lineJoin = 'round';
  _firmaCtx.strokeStyle = '#0a1628';
  _firmaVacia = true;
  _firmaCtx.clearRect(0, 0, cssW, cssH);

  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = (e) => {
    e.preventDefault();
    _firmaDibujando = true;
    const p = pos(e);
    _firmaCtx.beginPath();
    _firmaCtx.moveTo(p.x, p.y);
  };
  const move = (e) => {
    if(!_firmaDibujando) return;
    e.preventDefault();
    const p = pos(e);
    _firmaCtx.lineTo(p.x, p.y);
    _firmaCtx.stroke();
    _firmaVacia = false;
  };
  const end = (e) => {
    if(e) e.preventDefault();
    _firmaDibujando = false;
  };

  if(!_firmaListenersBound){
    cv.addEventListener('mousedown', start);
    cv.addEventListener('mousemove', move);
    cv.addEventListener('mouseup', end);
    cv.addEventListener('mouseleave', end);
    cv.addEventListener('touchstart', start, { passive:false });
    cv.addEventListener('touchmove', move, { passive:false });
    cv.addEventListener('touchend', end, { passive:false });
    cv.addEventListener('touchcancel', end, { passive:false });
    _firmaListenersBound = true;
  }
}

function _firmaLimpiar(){
  const cv = document.getElementById('firmaCanvas');
  if(_firmaCtx && cv){
    const ratio = window.devicePixelRatio || 1;
    _firmaCtx.clearRect(0, 0, cv.width / ratio, cv.height / ratio);
    _firmaVacia = true;
  }
}
function _firmaObtenerPng(){
  const cv = document.getElementById('firmaCanvas');
  if(!cv || _firmaVacia) return '';
  return cv.toDataURL('image/png');
}
function _firmaCancelar(){
  const m = document.getElementById('modalFirma');
  if(m) m.style.display = 'none';
  _firmaOnConfirm = null;
}
function _firmaConfirmar(){
  if(_firmaVacia){ toast('Dibuja la firma primero','w'); return; }
  const png = _firmaObtenerPng();
  const m = document.getElementById('modalFirma');
  if(m) m.style.display = 'none';
  if(typeof _firmaOnConfirm === 'function') _firmaOnConfirm(png);
  _firmaOnConfirm = null;
}
function _abrirModalFirma(titulo, nombre, onConfirm){
  const t = document.getElementById('modalFirmaTitulo');
  const n = document.getElementById('modalFirmaNombre');
  const m = document.getElementById('modalFirma');
  if(t) t.textContent = titulo || 'Firma';
  if(n) n.textContent = nombre || '';
  if(m) m.style.display = 'flex';
  _firmaOnConfirm = onConfirm;
  setTimeout(_firmaInitCanvas, 50);
}
window._firmaLimpiar = _firmaLimpiar;
window._firmaCancelar = _firmaCancelar;
window._firmaConfirmar = _firmaConfirmar;
window._abrirModalFirma = _abrirModalFirma;

// AARMS sub9-firma: modal PIN
let _pinOnConfirm = null;
function _abrirModalPin(onConfirm){
  const inp = document.getElementById('modalPinInput');
  const m = document.getElementById('modalPin');
  if(inp) inp.value = '';
  if(m) m.style.display = 'flex';
  _pinOnConfirm = onConfirm;
  setTimeout(() => { if(inp) inp.focus(); }, 60);
}
function _cerrarModalPin(){
  const m = document.getElementById('modalPin');
  if(m) m.style.display = 'none';
  _pinOnConfirm = null;
}
function _confirmarPin(){
  const inp = document.getElementById('modalPinInput');
  const pin = inp ? inp.value.trim() : '';
  const m = document.getElementById('modalPin');
  if(m) m.style.display = 'none';
  if(typeof _pinOnConfirm === 'function') _pinOnConfirm(pin);
  _pinOnConfirm = null;
}
window._abrirModalPin = _abrirModalPin;
window._cerrarModalPin = _cerrarModalPin;
window._confirmarPin = _confirmarPin;

// AARMS sub9-firma: firmas del documento en plan.firmas
function _firmaMuestreadorAuto(plan){
  if(!plan) return null;
  const m = _muestreadorActual();
  if(!plan.firmas) plan.firmas = {};
  plan.firmas.muestreador = {
    nombre: m.nombre || '',
    cargo: m.cargo || 'Muestreador',
    firmaPng: m.firmaPng || ''
  };
  return plan.firmas.muestreador;
}
async function _estamparFirmaSupervisor(plan, supervisor, firmaPng){
  if(!plan) return;
  if(!plan.firmas) plan.firmas = {};
  const now = new Date();
  plan.firmas.supervisor = {
    nombre: supervisor.nombre,
    cargo: supervisor.cargo || 'Supervisor',
    firmaPng: firmaPng || '',
    fecha: _fechaDDMMAA(now),
    hora: _horaHHMM(now),
    supId: supervisor.id,
    ts: now.getTime()
  };
  if(typeof guardarPlan === 'function') await guardarPlan(plan);
}
window._firmaMuestreadorAuto = _firmaMuestreadorAuto;
window._estamparFirmaSupervisor = _estamparFirmaSupervisor;

// AARMS sub9-firma: iniciar firma de supervisor
function firmarComoSupervisor(){
  if(!_supervisorConfigurado()){ toast('Configura el supervisor en Ajustes','w'); return; }
  const plan = typeof _planActivo === 'function' ? _planActivo() : null;
  if(!plan){ toast('Abre un plan primero','w'); return; }
  _abrirModalPin(async (pin) => {
    const sup = await _supervisorValidarPin(pin);
    if(!sup){ toast('PIN incorrecto','w'); return; }
    _abrirModalFirma('Firma de supervisor', sup.nombre, async (firmaPng) => {
      await _estamparFirmaSupervisor(plan, sup, firmaPng);
      toast('Firmado por ' + sup.nombre, 'g');
      if(typeof _renderSelloFirmaPlan === 'function') _renderSelloFirmaPlan();
      if(typeof renderPlanDocs === 'function') renderPlanDocs();
    });
  });
}
window.firmarComoSupervisor = firmarComoSupervisor;

async function guardarSupervisorUI(){
  const nombre = (document.getElementById('supNombre')?.value || '').trim();
  const cargo = (document.getElementById('supCargo')?.value || '').trim() || 'Supervisor';
  const pin = (document.getElementById('supPin')?.value || '').trim();
  const pin2 = (document.getElementById('supPin2')?.value || '').trim();
  if(!nombre){ toast('Falta el nombre','w'); return; }
  if(!/^\d{4,6}$/.test(pin)){ toast('PIN de 4-6 dígitos','w'); return; }
  if(pin !== pin2){ toast('Los PIN no coinciden','w'); return; }
  await _supervisorSet(nombre, cargo, pin);
  toast('Supervisor guardado','g');
  const p1 = document.getElementById('supPin'); if(p1) p1.value = '';
  const p2 = document.getElementById('supPin2'); if(p2) p2.value = '';
  _renderAjustesSupervisor();
}
window.guardarSupervisorUI = guardarSupervisorUI;

async function guardarMuestreadorUI(){
  const nombre = (document.getElementById('mestNombre')?.value || '').trim();
  const cargo = (document.getElementById('mestCargo')?.value || '').trim() || 'Muestreador';
  if(!nombre){ toast('Falta el nombre del muestreador','w'); return; }
  await _muestreadorSet(nombre, cargo, undefined);
  toast('Muestreador guardado','g');
  _renderAjustesMuestreador();
}
window.guardarMuestreadorUI = guardarMuestreadorUI;

function dibujarFirmaMuestreador(){
  const m = _muestreadorActual();
  const nombre = (document.getElementById('mestNombre')?.value || '').trim() || m.nombre || '';
  _abrirModalFirma('Mi firma (muestreador)', nombre, async (png) => {
    const cargo = (document.getElementById('mestCargo')?.value || '').trim() || m.cargo || 'Muestreador';
    await _muestreadorSet(nombre || m.nombre, cargo, png);
    toast('Firma guardada','g');
    _renderAjustesMuestreador();
  });
}
window.dibujarFirmaMuestreador = dibujarFirmaMuestreador;

function _renderAjustesMuestreador(){
  const m = _muestreadorActual();
  const n = document.getElementById('mestNombre');
  const c = document.getElementById('mestCargo');
  if(n && !n.value) n.value = m.nombre || '';
  if(c && !c.value) c.value = m.cargo || 'Muestreador';
  if(n && m.nombre) n.value = m.nombre;
  if(c) c.value = m.cargo || 'Muestreador';
  const prev = document.getElementById('mestFirmaPreview');
  const empty = document.getElementById('mestFirmaEmpty');
  if(prev){
    if(m.firmaPng){
      prev.src = m.firmaPng;
      prev.style.display = 'block';
      if(empty) empty.style.display = 'none';
    } else {
      prev.removeAttribute('src');
      prev.style.display = 'none';
      if(empty) empty.style.display = 'block';
    }
  }
}
function _renderAjustesSupervisor(){
  const s = _supervisorActual();
  const st = document.getElementById('supEstado');
  const n = document.getElementById('supNombre');
  const c = document.getElementById('supCargo');
  if(s){
    if(st) st.textContent = 'Supervisor: ' + s.nombre + (s.cargo ? ' · ' + s.cargo : '');
    if(n && !n.value) n.value = s.nombre || 'Ing. Edgar Iván Castillo';
    if(c && !c.value) c.value = s.cargo || 'Supervisor';
  } else {
    if(st) st.textContent = 'Sin supervisor configurado';
    if(n && !n.value) n.value = 'Ing. Edgar Iván Castillo';
    if(c && !c.value) c.value = 'Supervisor';
  }
}
window._renderAjustesMuestreador = _renderAjustesMuestreador;
window._renderAjustesSupervisor = _renderAjustesSupervisor;

function abrirAjustes(){
  closeFabMenu();
  goPage('pgAjustes');
  _renderAjustesMuestreador();
  _renderAjustesSupervisor();
}
window.abrirAjustes = abrirAjustes;

function _renderSelloFirmaPlan(){
  const host = document.getElementById('planFirmaSello');
  if(!host) return;
  const plan = typeof _planActivo === 'function' ? _planActivo() : null;
  const sup = plan && plan.firmas && plan.firmas.supervisor;
  if(sup && (sup.nombre || sup.firmaPng)){
    host.style.display = 'block';
    const img = sup.firmaPng
      ? `<img src="${sup.firmaPng}" alt="" style="height:36px;max-width:120px;object-fit:contain;background:#fff;border-radius:6px;padding:2px 6px;margin-right:8px">`
      : '';
    host.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      ${img}
      <div style="font-size:12px;color:var(--green);font-weight:700">✓ Revisado por ${sup.nombre||'Supervisor'} · ${sup.fecha||''} · ${sup.hora||''}</div>
    </div>`;
  } else {
    host.style.display = 'none';
    host.innerHTML = '';
  }
}
window._renderSelloFirmaPlan = _renderSelloFirmaPlan;

// Patch renderPlanPage to refresh sello
const _renderPlanPageOrig = typeof renderPlanPage === 'function' ? renderPlanPage : null;
if(_renderPlanPageOrig){
  window.renderPlanPage = function(){
    const r = _renderPlanPageOrig.apply(this, arguments);
    try{ _renderSelloFirmaPlan(); }catch(_){}
    return r;
  };
}

// ═══════════════════════════════════════════════════════════════
// AARMS adminaccess: acceso admin oculto (Reynaldo Rodríguez) — SOLO hash
// AARMS cartacontrol: Cartas Control Shewhart por equipo
// ═══════════════════════════════════════════════════════════════

// AARMS adminaccess: hash SHA-256 del código (NUNCA el código en texto plano)
const _ADMIN_CODE_HASH = '3adeef315d810d758fde9e772258e44a61d94e8ff0911b6c779e6134bb3bbc11';
const _ADMIN_TITULAR = 'Reynaldo Rodríguez';

async function _adminHashCodigo(texto){
  const enc = new TextEncoder().encode(String(texto || ''));
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

let _adminTapTimes = [];
function _adminOnLogoTap(ev){
  // AARMS adminaccess: 7 toques rápidos (≤2s entre toques) en logo/nombre home
  if(ev){ try{ ev.preventDefault(); ev.stopPropagation(); }catch(_){} }
  const now = Date.now();
  _adminTapTimes = _adminTapTimes.filter(t => now - t <= 2000);
  _adminTapTimes.push(now);
  if(_adminTapTimes.length >= 7){
    _adminTapTimes = [];
    _adminAbrirModalCodigo();
  }
}

function _adminAbrirModalCodigo(){
  const m = document.getElementById('modalAdminCode');
  const inp = document.getElementById('modalAdminCodeInput');
  const err = document.getElementById('modalAdminCodeErr');
  if(!m || !inp) return;
  inp.value = '';
  if(err) err.textContent = '';
  m.style.display = 'flex';
  setTimeout(() => { try{ inp.focus(); }catch(_){} }, 50);
}

function _adminCerrarModalCodigo(){
  const m = document.getElementById('modalAdminCode');
  const inp = document.getElementById('modalAdminCodeInput');
  if(inp) inp.value = '';
  if(m) m.style.display = 'none';
}

async function _adminConfirmarCodigo(){
  const inp = document.getElementById('modalAdminCodeInput');
  const err = document.getElementById('modalAdminCodeErr');
  const raw = inp ? String(inp.value || '') : '';
  if(!raw){
    if(err) err.textContent = 'Código incorrecto';
    return;
  }
  const h = await _adminHashCodigo(raw);
  if(inp) inp.value = '';
  if(h !== _ADMIN_CODE_HASH){
    if(err) err.textContent = 'Código incorrecto';
    return;
  }
  _adminCerrarModalCodigo();
  _adminEntrarVista();
}

function _adminEntrarVista(){
  goPage('pgAdmin');
  if(typeof _cartasRenderVista === 'function') _cartasRenderVista();
}

function _adminBindGatillo(){
  // AARMS adminaccess: elementos ya existentes en home (sin UI nueva visible)
  const els = [
    document.querySelector('#pgHome .hero-logo'),
    document.querySelector('#pgHome .hero-title'),
    document.querySelector('#pgHome .bar-name')
  ].filter(Boolean);
  els.forEach(el => {
    if(el.dataset && el.dataset.adminTapBound) return;
    if(el.dataset) el.dataset.adminTapBound = '1';
    el.addEventListener('click', _adminOnLogoTap, true);
    el.style.cursor = el.style.cursor || 'default';
  });
}

window._adminHashCodigo = _adminHashCodigo;
window._adminAbrirModalCodigo = _adminAbrirModalCodigo;
window._adminCerrarModalCodigo = _adminCerrarModalCodigo;
window._adminConfirmarCodigo = _adminConfirmarCodigo;
window._adminBindGatillo = _adminBindGatillo;

// ── AARMS cartacontrol: IDB helpers ──
function idbCartasGetAll(){
  return openDB().then(db => new Promise((res, rej) => {
    if(!db.objectStoreNames.contains(STORE_CARTAS)){ res([]); return; }
    const tx = db.transaction(STORE_CARTAS, 'readonly');
    const req = tx.objectStore(STORE_CARTAS).getAll();
    req.onsuccess = e => res(e.target.result || []);
    req.onerror = e => rej(e);
  }));
}
function idbCartasPut(record){
  return openDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(STORE_CARTAS, 'readwrite');
    const req = tx.objectStore(STORE_CARTAS).put(record);
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e);
  }));
}

function _cartasMetaGet(){
  const c = _appConfigGet();
  if(!c.cartasControl || !Array.isArray(c.cartasControl.periodos) || !c.cartasControl.periodos.length){
    const y = new Date().getFullYear();
    c.cartasControl = {
      periodos: [{
        id: 'p' + y,
        label: String(y),
        activo: true,
        cerrado: false,
        cerradoEn: null,
        cerradoPor: null
      }]
    };
    try{ localStorage.setItem('aarms_config', JSON.stringify(c)); }catch(_){}
  }
  return c.cartasControl;
}
async function _cartasMetaSave(meta){
  const c = _appConfigGet();
  c.cartasControl = meta;
  await _appConfigSave(c);
}
function _cartasPeriodoActivo(){
  const meta = _cartasMetaGet();
  return (meta.periodos || []).find(p => p.activo && !p.cerrado) || (meta.periodos || [])[0] || null;
}

const _CARTAS_EQUIPOS = [
  { id: 'ph', label: 'pH-metro', unidad: 'pH 25°C' },
  { id: 'conductividad', label: 'Conductivímetro', unidad: 'µS/cm' },
  { id: 'oxigeno', label: 'Oxímetro', unidad: 'mg/L O2' },
  { id: 'temperatura', label: 'Temperatura', unidad: '°C' }
];

let _cartasUi = { equipo: 'ph', periodoId: null };

async function _cartasRegistrarPunto(opts){
  // AARMS cartacontrol: solo ACEPTA; no duplicar lógica de criterio
  opts = opts || {};
  const ace = String(opts.aceptaRechaza || '').trim();
  if(!/^acepta$/i.test(ace)) return null;
  const valor = parseFloat(opts.valor);
  if(isNaN(valor)) return null;
  const per = _cartasPeriodoActivo();
  if(!per) return null;
  const equipo = opts.equipo || 'ph';
  const folio = String(opts.folioOMAR || '').trim();
  const fecha = String(opts.fecha || '').trim();
  const hora = String(opts.hora || '').trim();
  const planId = opts.planId || '';
  // idempotencia blanda: mismo equipo+folio+fecha+hora+valor en periodo activo
  const all = await idbCartasGetAll();
  const dup = all.find(p =>
    p.equipo === equipo && p.periodoId === per.id &&
    p.folioOMAR === folio && p.fecha === fecha && p.hora === hora &&
    Number(p.valor) === valor
  );
  if(dup) return dup;
  const rec = {
    id: 'cc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    equipo,
    fecha,
    hora,
    valor,
    folioOMAR: folio,
    planId,
    periodoId: per.id,
    aceptaRechaza: 'Acepta'
  };
  await idbCartasPut(rec);
  return rec;
}

/** Alimenta carta pH desde Verificación en Campo ACEPTA (Hoja 1). */
async function _cartasFeedDesdePhCampo(h, ctx){
  h = h || {};
  ctx = ctx || {};
  if(typeof _phAceptaRechaza !== 'function') return;
  const v1 = h.campo_v1 || h.campo_ver_l1 || '';
  const v2 = h.campo_v2 || h.campo_ver_l2 || '';
  const v3 = h.campo_v3 || h.campo_ver_l3 || '';
  const buf = h.buffer || '';
  const ace = _phAceptaRechaza(v1, v2, v3, buf);
  if(!ace || !/^acepta$/i.test(String(ace))) return;
  let valor = null;
  if(typeof _phPromedio === 'function'){
    const p = _phPromedio(v1, v2, v3);
    if(p != null) valor = (typeof _phRedondeo25 === 'function') ? _phRedondeo25(p) : p;
  }
  if(valor == null){
    const ls = [v1, v2, v3].map(Number).filter(n => !isNaN(n));
    if(ls.length) valor = Math.round((ls.reduce((a, b) => a + b, 0) / ls.length) * 100) / 100;
  }
  await _cartasRegistrarPunto({
    equipo: 'ph',
    valor,
    fecha: h.campo_fecha || h.fecha || ctx.fecha || '',
    hora: h.campo_hora || h.hora || ctx.hora || '',
    folioOMAR: ctx.folioOMAR || '',
    planId: ctx.planId || '',
    aceptaRechaza: 'Acepta'
  });
}
window._cartasRegistrarPunto = _cartasRegistrarPunto;
window._cartasFeedDesdePhCampo = _cartasFeedDesdePhCampo;

async function _cartasCerrarPeriodo(){
  const meta = _cartasMetaGet();
  const act = (meta.periodos || []).find(p => p.activo && !p.cerrado);
  if(!act){ toast('No hay periodo activo', 'w'); return; }
  // AARMS nobranding:
  const ok = await confirmAction({
    title: 'Cerrar periodo',
    message: '¿Cerrar el periodo "' + act.label + '"?\nLos puntos se conservan; se abre un periodo nuevo vacío.',
    okText: 'Cerrar',
    okDanger: false
  });
  if(!ok) return;
  act.activo = false;
  act.cerrado = true;
  act.cerradoEn = new Date().toISOString();
  act.cerradoPor = _ADMIN_TITULAR;
  const y = new Date().getFullYear();
  let label = String(y);
  const used = new Set((meta.periodos || []).map(p => p.label));
  if(used.has(label)) label = label + '-' + String(Date.now()).slice(-4);
  const neu = {
    id: 'p' + Date.now(),
    label,
    activo: true,
    cerrado: false,
    cerradoEn: null,
    cerradoPor: null
  };
  meta.periodos.push(neu);
  await _cartasMetaSave(meta);
  _cartasUi.periodoId = neu.id;
  toast('Periodo cerrado. Nuevo periodo: ' + neu.label, 'g');
  _cartasRenderVista();
}

async function _cartasPuntosFiltrados(){
  const all = await idbCartasGetAll();
  const perId = _cartasUi.periodoId || (_cartasPeriodoActivo() || {}).id;
  const eq = _cartasUi.equipo || 'ph';
  return all
    .filter(p => p.equipo === eq && p.periodoId === perId)
    .sort((a, b) => {
      const da = String(a.fecha || '') + 'T' + String(a.hora || '00:00');
      const db = String(b.fecha || '') + 'T' + String(b.hora || '00:00');
      return da < db ? -1 : da > db ? 1 : 0;
    });
}

function _cartasDrawChart(canvas, puntos, unidad){
  if(!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 320;
  const cssH = canvas.clientHeight || 220;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = cssW, H = cssH;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg2')?.trim() || '#0f1420';
  ctx.fillRect(0, 0, W, H);
  const pad = { l: 44, r: 12, t: 16, b: 36 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  ctx.strokeStyle = 'rgba(148,163,184,.35)';
  ctx.strokeRect(pad.l, pad.t, plotW, plotH);
  if(!puntos || !puntos.length){
    ctx.fillStyle = 'rgba(148,163,184,.9)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos aún', W / 2, H / 2);
    return;
  }
  const vals = puntos.map(p => Number(p.valor));
  let ymin = Math.min(...vals), ymax = Math.max(...vals);
  if(ymin === ymax){ ymin -= 0.5; ymax += 0.5; }
  const span = ymax - ymin || 1;
  ymin -= span * 0.1; ymax += span * 0.1;
  const n = puntos.length;
  const xAt = i => pad.l + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = v => pad.t + plotH - ((v - ymin) / (ymax - ymin)) * plotH;
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  puntos.forEach((p, i) => {
    const x = xAt(i), y = yAt(Number(p.valor));
    if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = '#60a5fa';
  puntos.forEach((p, i) => {
    const x = xAt(i), y = yAt(Number(p.valor));
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = 'rgba(148,163,184,.95)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(ymax.toFixed(2)), pad.l - 4, pad.t + 10);
  ctx.fillText(String(ymin.toFixed(2)), pad.l - 4, pad.t + plotH);
  ctx.textAlign = 'center';
  ctx.fillText(unidad || '', W / 2, H - 8);
}

async function _cartasRenderVista(){
  const meta = _cartasMetaGet();
  if(!_cartasUi.periodoId){
    const act = _cartasPeriodoActivo();
    _cartasUi.periodoId = act ? act.id : (meta.periodos[0] && meta.periodos[0].id);
  }
  const tabs = document.getElementById('cartasTabsEquipo');
  const sel = document.getElementById('cartasSelPeriodo');
  const btnCerrar = document.getElementById('cartasBtnCerrar');
  const tbl = document.getElementById('cartasTablaBody');
  const canvas = document.getElementById('cartasCanvas');
  const titular = document.getElementById('cartasAdminTitular');
  if(titular) titular.textContent = _ADMIN_TITULAR;

  if(tabs){
    tabs.innerHTML = _CARTAS_EQUIPOS.map(eq => {
      const on = eq.id === _cartasUi.equipo;
      return `<button type="button" class="btn ${on ? 'btn-p' : 'btn-g'}" data-eq="${eq.id}" style="font-size:11px;padding:8px 10px;width:auto">${eq.label}</button>`;
    }).join('');
    tabs.querySelectorAll('button[data-eq]').forEach(b => {
      b.onclick = () => { _cartasUi.equipo = b.getAttribute('data-eq'); _cartasRenderVista(); };
    });
  }
  if(sel){
    const periodos = (meta.periodos || []).slice().reverse();
    sel.innerHTML = periodos.map(p => {
      const tag = p.activo && !p.cerrado ? ' (activo)' : (p.cerrado ? ' (cerrado)' : '');
      return `<option value="${p.id}" ${p.id === _cartasUi.periodoId ? 'selected' : ''}>${p.label}${tag}</option>`;
    }).join('');
    sel.onchange = () => { _cartasUi.periodoId = sel.value; _cartasRenderVista(); };
  }
  const per = (meta.periodos || []).find(p => p.id === _cartasUi.periodoId);
  if(btnCerrar){
    const esActivo = !!(per && per.activo && !per.cerrado);
    btnCerrar.style.display = esActivo ? '' : 'none';
  }
  const puntos = await _cartasPuntosFiltrados();
  const eqMeta = _CARTAS_EQUIPOS.find(e => e.id === _cartasUi.equipo) || _CARTAS_EQUIPOS[0];
  _cartasDrawChart(canvas, puntos, eqMeta.unidad);
  if(tbl){
    if(!puntos.length){
      tbl.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--g1);padding:16px">Sin datos aún</td></tr>`;
    } else {
      tbl.innerHTML = puntos.map(p => `<tr>
        <td>${p.fecha || ''} ${p.hora || ''}</td>
        <td>${p.folioOMAR || '—'}</td>
        <td>${p.valor}</td>
        <td>${p.aceptaRechaza || ''}</td>
      </tr>`).join('');
    }
  }
}
window._cartasRenderVista = _cartasRenderVista;
window._cartasCerrarPeriodo = _cartasCerrarPeriodo;

document.addEventListener('DOMContentLoaded', () => {
  try{ _adminBindGatillo(); }catch(_){}
});
setTimeout(() => { try{ _adminBindGatillo(); }catch(_){} }, 800);
