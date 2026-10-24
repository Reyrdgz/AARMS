/**
 * AARMS — Documentos extendidos (BPM F-AA-134-1, BM F-AA-114-18, pH F-AA-264-4 Hoja 1,
 * PDF bitácora pH hoja 2 mejorada). Carga después de app.js.
 */
(function(){
'use strict';

function _dg(id){ const e=document.getElementById(id); if(!e) return ''; if(e.type==='checkbox') return e.checked; return (e.value||'').trim(); }
function _ds(id,v){ const e=document.getElementById(id); if(!e) return; if(e.type==='checkbox') e.checked=!!v; else e.value=v!=null?String(v):''; }

function _planPorOmar(){
  // AARMS bmfresco: _cachedPlanes es léxico de app.js; este archivo no lo ve.
  // Preferir el plan activo (tiene LVAR, bitácoras y flujos). El plan migrado
  // «plan_»+id no trae esos datos y no debe ganar si ambos contienen el OMAR.
  const mid = typeof omar !== 'undefined' && omar && omar.ts;
  if(typeof _planActivo === 'function'){
    const p = _planActivo();
    if(p && (!mid || (p.omarIds || []).map(String).includes(String(mid)))) return p;
  }
  if(mid && typeof getPlanDeMuestreo === 'function') return getPlanDeMuestreo(mid) || null;
  return null;
}

function _lvarFolioPlan(){
  const p=_planPorOmar();
  const lv=p&&p.lvar&&p.lvar.folio;
  return lv?String(lv):'';
}

// AARMS lote3a: folios del contador del plan y claves solo del catálogo
function _lote3aRangoFolios(nums){
  const out = [];
  (nums || []).forEach(n => {
    String(n == null ? '' : n).split(/[-–—]/).forEach(p => {
      const t = String(p || '').trim();
      if(/^\d+$/.test(t) && out.indexOf(t) < 0) out.push(t);
    });
  });
  if(out.length <= 1) return out[0] || '';
  return out[0] + '-' + out[out.length - 1];
}
function _lote3aSoloNumero(v){ return _lote3aRangoFolios([v]); }
function _lote3aBandaSinH(v){ return String(v || '').trim().replace(/\s*h\s*$/i, '').trim(); }
function _lote3aHora(v){
  const m = String(v || '').trim().match(/(\d{2}:\d{2})/);
  return m ? m[1] : '';
}
function _lote3aClave(tipo){
  if(typeof _equipoActivo !== 'function' || typeof _equipoClave !== 'function') return '';
  const eq = _equipoActivo(tipo);
  return eq ? (_equipoClave(tipo, eq) || '') : '';
}
function _lote3aPlanDe(plan){
  return plan || (typeof _planPorOmar === 'function' ? _planPorOmar() : null);
}
function _lote3aFolioPh(plan){
  const p = _lote3aPlanDe(plan);
  return _lote3aRangoFolios([p && p.bitPhFolioDoc]);
}
function _lote3aFolioBlmp(plan){
  const p = _lote3aPlanDe(plan);
  const ref = (p && p.blmpRef) || {};
  return _lote3aRangoFolios([ref.folio, ref.folioP2]);
}
function _lote3aFolioCond(plan, colab){
  const p = _lote3aPlanDe(plan);
  const ref = (p && p.condRef) || {};
  const c = colab || {};
  return _lote3aRangoFolios([c.folio || ref.folio, c.folioP2 || ref.folioP2, c.folioP3 || ref.folioP3]);
}
function _lote3aFolioLvar(plan){
  const p = _lote3aPlanDe(plan);
  return _lote3aSoloNumero(p && p.lvar && p.lvar.folio);
}
function _lote3aHorasEntre(banda){
  const b = String(banda || '').trim();
  if(typeof HORAS_ENTRE_TOMAS !== 'undefined' && HORAS_ENTRE_TOMAS[b] != null) return String(HORAS_ENTRE_TOMAS[b]);
  return '';
}
function _lote14cTextoBlanco(p){
  // AARMS lote14c: una sola frase. El folio es el de la OMAR marcada como blanco, si ya existe.
  if(!(p && p.blancoCampo)) return 'Blanco de campo: NO según plan (N.A. lote).';
  const lote = p.loteBlanco ? String(p.loteBlanco).trim() : '';
  let folio = '';
  const lista = (typeof _cachedMuestreos !== 'undefined' && _cachedMuestreos) ? _cachedMuestreos : [];
  for(const mid of (p.omarIds || [])){
    const m = lista.find(x => String(x.id) === String(mid));
    if(!m) continue;
    let o = {};
    try { o = m.omar ? JSON.parse(m.omar) : {}; } catch(e){ o = {}; }
    if(o.blancoCampo){
      folio = String(o.folio || m.folio || '').trim();
      break;
    }
  }
  let s = 'Blanco de campo: SÍ. Lote de agua reactivo: ' + lote;
  if(folio) s += ' (OMAR ' + folio + ')';
  return s;
}
function _lote3aObservacion(omarRef, plan){
  const p = _lote3aPlanDe(plan);
  const obsBlanco = _lote14cTextoBlanco(p);
  const extra = omarRef && omarRef.campo && omarRef.campo.obs ? String(omarRef.campo.obs).trim() : '';
  return extra ? (obsBlanco + ' ' + extra) : obsBlanco;
}
function _lote3aVolumenRequerido(omarRef){
  const TABLA = [
    ['FQ', 4000], ['MP', 500], ['AsSe', 250], ['CIAN', 1000], ['FOS.', 500],
    ['DQO', 500], ['DBO5', 1000], ['SAAM', 1000], ['N.TOT', 2000], ['NO2', 500],
    ['NO3', 500], ['Hg', 500], ['HELM', 5000], ['TOC', 1000], ['CLOR', 500],
    ['CLR', 250], ['CrHx', 500]
  ];
  const paramsUsados = new Set();
  const arr = (typeof tomas !== 'undefined' && tomas) ? tomas : [];
  arr.forEach(t => {
    const ps = t.params instanceof Set ? [...t.params] : (t.params || []);
    ps.forEach(x => paramsUsados.add(x));
  });
  ((omarRef && omarRef.analitos) || []).forEach(a => paramsUsados.add(a));
  let total = 0;
  TABLA.forEach(([key, vol]) => {
    const aplica = key === 'AsSe'
      ? (paramsUsados.has('MP') || paramsUsados.has('Hg'))
      : paramsUsados.has(key);
    if(aplica) total += vol;
  });
  return total;
}
const _LOTE3A_MANUAL = { bm_s2_bdal: 1, bm_s4_bfcmt: 1, bm_s4_bfcmt_fol: 1 };
function _lote3aPintarCalculados(snap){
  if(!snap) return;
  Object.keys(snap).forEach(id => {
    if(_LOTE3A_MANUAL[id]) return;
    if(!/^bm_/.test(id)) return;
    const el = document.getElementById(id);
    if(!el) return;
    el.value = snap[id] == null ? '' : String(snap[id]);
  });
}
let _lote3aOmarPintado = null;
function _lote3aSyncManualAlOmar(){
  if(!omar || !omar.ts) return;
  if(_lote3aOmarPintado === omar.ts) return;
  _lote3aOmarPintado = omar.ts;
  const F = omar.bmForm || {};
  ['bm_s2_bdal', 'bm_s4_bfcmt', 'bm_s4_bfcmt_fol'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.value = F[id] == null ? '' : String(F[id]);
  });
}
let _lote3aSaveT = null;
function lote3aAutosaveBm(){
  clearTimeout(_lote3aSaveT);
  _lote3aSaveT = setTimeout(() => {
    try {
      leerBmForm();
      if(typeof saveMuestreoActual === 'function') saveMuestreoActual();
    } catch(e){}
  }, 400);
}
window.lote3aAutosaveBm = lote3aAutosaveBm;

function cerrarDocSuite(){
  if(typeof cerrarPagInstrumento==='function') cerrarPagInstrumento();
  else if(typeof goPage==='function'){ try{guardarBorradorActual&&guardarBorradorActual();}catch(_){} goPage('pgPlan'); }
}

// ═══════════════════════════════════════════════════════════════
// AARMS sub10-std: librería de componentes del estándar estético
// Molde = Hoja de Campo / LVAR. UNA fuente de verdad para los 17 PDFs.
// ═══════════════════════════════════════════════════════════════
const STD = {
  DARK:   [15, 23, 42],
  NAVY:   [23, 42, 74],
  ACCENT: [37, 99, 235],
  LGRAY:  [241, 245, 249],
  MGRAY:  [203, 213, 225],
  TEXT:   [51, 65, 85],
  WHITE:  [255, 255, 255],
  MUTED:  [148, 163, 184]
};
window.STD = STD;

/** Membrete unificado: logo + lab centrado + bloque oscuro derecho. Retorna y de contenido. */
function _pdfMembreteStd(doc, logo, opts, fuente){
  opts = opts || {};
  fuente = fuente || 'helvetica';
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const landscape = W > H;
  const M = opts.margin != null ? opts.margin : (landscape ? 20 : 28);
  // AARMS foliofix: bloque más alto/ligeramente más estrecho si lleva FOLIO (solo Machiote)
  // AARMS phfolio2: landscape+FOLIO clona geometría de portrait (caja alta, FOLIO dentro)
  const folioStr = (opts.folio != null && String(opts.folio).trim()) ? String(opts.folio).trim() : '';
  const tieneFolio = !!folioStr || !!opts.folioSiempre;
  let blockW = landscape
    ? (tieneFolio ? 162 : 150)
    : (tieneFolio ? 162 : 168);
  const by = landscape
    ? (tieneFolio ? 10 : 8)
    : (tieneFolio ? 10 : 14);
  const blockH = landscape
    ? (tieneFolio ? 78 : 58)
    : (tieneFolio ? 78 : 60);
  // AARMS lvartitulofix: pre-calcular fuente/ancho del título si docTituloFit (solo callers explícitos)
  const titRaw = String(opts.docTitulo || '');
  let titFs = landscape && !tieneFolio ? 9 : (tieneFolio ? 9.5 : 10);
  let titLines = null;
  if(opts.docTituloFit && titRaw){
    const padX = 24; // margen lateral cómodo dentro del bloque
    doc.setFont(fuente, 'bold');
    doc.setFontSize(titFs);
    // 1) reducir fuente hasta ~8pt
    while(titFs > 8 && doc.getTextWidth(titRaw) > blockW - padX){
      titFs -= 0.25;
      doc.setFontSize(titFs);
    }
    // 2) ensanchar caja si aún no cabe
    while(doc.getTextWidth(titRaw) > (blockW - padX) && blockW < 220){
      blockW += 4;
    }
    // holgura extra (~6pt por lado) para que no quede pegado al borde
    if(doc.getTextWidth(titRaw) <= (blockW - padX) && blockW < 220){
      blockW = Math.min(220, blockW + 12);
    }
    // 3) shrink extra si hace falta
    while(titFs > 6.5 && doc.getTextWidth(titRaw) > blockW - padX){
      titFs -= 0.25;
      doc.setFontSize(titFs);
    }
    // 4) wrap 2 líneas como último recurso
    if(doc.getTextWidth(titRaw) > (blockW - padX) && typeof doc.splitTextToSize === 'function'){
      titFs = Math.max(titFs, 7.5);
      doc.setFontSize(titFs);
      titLines = doc.splitTextToSize(titRaw, blockW - padX).slice(0, 2);
    }
  }
  const bx = W - M - blockW;
  // Logo
  if(logo && typeof addLogoProportional === 'function'){
    addLogoProportional(doc, logo, M, landscape ? 4 : 8, landscape ? 64 : 70, landscape ? 52 : 56);
  }
  // Centro lab — zona a la izquierda del bloque para que la dirección se lea completa
  const textRight = bx - 8;
  const textLeft = M + (landscape ? 70 : 78);
  const cx = (textLeft + textRight) / 2;
  doc.setFont(fuente, 'bold'); doc.setFontSize(landscape ? 12 : 12.5); doc.setTextColor(...STD.NAVY);
  doc.text('ASESORÍA Y ANÁLISIS S.C.', cx, landscape ? 18 : 20, { align:'center' });
  doc.setFont(fuente, 'normal'); doc.setFontSize(landscape ? 7.5 : 8); doc.setTextColor(...STD.TEXT);
  doc.text('Laboratorio de Alimentos y Aguas', cx, landscape ? 28 : 31, { align:'center' });
  doc.setFontSize(landscape ? 6.2 : 6.4); doc.setTextColor(100, 110, 130);
  const addrMax = Math.max(120, textRight - textLeft);
  const addr1 = 'Calle 12 Ave. Serdán Ext. 465 Int. 201  |  Edif. Puertas del Sol';
  // AARMS lote8a: FAX oficial (faltaba un dígito: 622 224 207)
  const addr2 = 'Col. Centro C.P. 85400  |  Tel: 622 224 0910  FAX 622 222 4207';
  // AARMS foliofix: dirección en 2 líneas (no queda bajo el bloque)
  if(typeof doc.splitTextToSize === 'function'){
    const a1 = doc.splitTextToSize(addr1, addrMax);
    const a2 = doc.splitTextToSize(addr2, addrMax);
    doc.text(a1, cx, landscape ? 38 : 41, { align:'center' });
    doc.text(a2, cx, landscape ? 47 : 50, { align:'center' });
  } else {
    doc.text(addr1, cx, landscape ? 38 : 41, { align:'center' });
    doc.text(addr2, cx, landscape ? 47 : 50, { align:'center' });
  }
  // Bloque oscuro derecha
  doc.setFillColor(...STD.DARK);
  if(typeof doc.roundedRect === 'function') doc.roundedRect(bx, by, blockW, blockH, 3, 3, 'F');
  else doc.rect(bx, by, blockW, blockH, 'F');
  // AARMS phfolio2: con FOLIO, tipografía/offsets idénticos portrait↔landscape (clon Hoja 1)
  const titY = tieneFolio ? 16 : (landscape ? 18 : 20);
  const subY = tieneFolio ? 30 : (landscape ? 32 : 36);
  const codY = tieneFolio ? 42 : (landscape ? 46 : 50);
  doc.setFont(fuente, 'bold'); doc.setFontSize(titFs); doc.setTextColor(...STD.WHITE);
  const titCx = bx + blockW / 2;
  if(titLines && titLines.length > 1){
    doc.text(titLines[0], titCx, by + titY - 4, { align:'center' });
    doc.text(titLines[1], titCx, by + titY + 6, { align:'center' });
  } else {
    doc.text(titRaw || titLines?.[0] || '', titCx, by + titY, { align:'center' });
  }
  if(opts.docSubtitulo){
    doc.setFont(fuente, 'normal'); doc.setFontSize(tieneFolio ? 7.5 : (landscape ? 7 : 7.5)); doc.setTextColor(210, 220, 235);
    doc.text(String(opts.docSubtitulo), bx + blockW / 2, by + subY, { align:'center' });
  }
  if(opts.codigoFormato){
    doc.setFontSize(tieneFolio ? 7 : (landscape ? 6.5 : 7)); doc.setTextColor(180, 195, 220);
    doc.text(String(opts.codigoFormato), bx + blockW / 2, by + codY, { align:'center' });
  }
  // AARMS lote3bc: el Machiote pide la etiqueta aunque el folio venga vacío
  const mostrarFolio = tieneFolio || !!opts.folioSiempre;
  if(mostrarFolio){
    doc.setDrawColor(70, 85, 110); doc.setLineWidth(0.5);
    doc.line(bx + 12, by + 50, bx + blockW - 12, by + 50);
    doc.setFont(fuente, 'bold'); doc.setFontSize(9); doc.setTextColor(200, 212, 230);
    doc.text('FOLIO:', bx + 14, by + 66);
    doc.setFont(fuente, 'bold'); doc.setFontSize(13);
    doc.setTextColor(96, 165, 250); // azul claro que resalta sobre DARK
    if(folioStr) doc.text(folioStr.substring(0, 18), bx + blockW - 14, by + 67, { align:'right' });
  }
  if(opts.extraIzq){
    doc.setFont(fuente, 'normal'); doc.setFontSize(7.5); doc.setTextColor(...STD.TEXT);
    doc.text(String(opts.extraIzq), M + (landscape ? 72 : 90), by + blockH + 10);
  }
  doc.setTextColor(0);
  const yAuto = by + blockH + 10;
  if(opts.contentY != null && !tieneFolio) return opts.contentY;
  return Math.max(yAuto, landscape ? (tieneFolio ? 98 : 76) : 86);
}
window._pdfMembreteStd = _pdfMembreteStd;

/** Barra de título de sección (oscura, texto blanco). */
function _pdfBarraSeccion(doc, titulo, x, y, ancho, fuente){
  const h = 15;
  fuente = fuente || 'helvetica';
  doc.setFillColor(...STD.DARK);
  doc.rect(x, y, ancho, h, 'F');
  doc.setFont(fuente, 'bold'); doc.setFontSize(8); doc.setTextColor(...STD.WHITE);
  doc.text(String(titulo || '').toUpperCase(), x + 6, y + 10.5);
  doc.setTextColor(0);
  return y + h;
}
window._pdfBarraSeccion = _pdfBarraSeccion;

/** Borde fino de caja contenedora. */
function _pdfCajaBorde(doc, x, y, ancho, alto){
  doc.setDrawColor(...STD.MGRAY); doc.setLineWidth(0.5);
  doc.rect(x, y, ancho, alto);
}
window._pdfCajaBorde = _pdfCajaBorde;

/**
 * AARMS phbadge: insignia Acepta/Rechaza (✓ verde / ✗ rojo).
 * estado: 'acepta' | 'rechaza' | null — null no dibuja nada.
 * opts.compact: versión chica para celdas de tabla.
 * Retorna { w, h } del badge (0 si no dibujó).
 */
function _pdfBadgeAceptaRechaza(doc, x, y, estado, opts){
  opts = opts || {};
  if(estado == null || estado === '') return { w: 0, h: 0 };
  const raw = String(estado).trim().toLowerCase();
  let kind = null;
  if(raw === 'acepta' || raw === 'a' || /^acepta/.test(raw)) kind = 'acepta';
  else if(raw === 'rechaza' || raw === 'r' || /^rechaz/.test(raw)) kind = 'rechaza';
  if(!kind) return { w: 0, h: 0 };

  const compact = !!opts.compact;
  const bw = compact ? 50 : 64;
  const bh = compact ? 9 : 11;
  const rad = compact ? 2.5 : 3.5;
  const fill = kind === 'acepta' ? [230, 244, 234] : [251, 234, 234];
  const stroke = kind === 'acepta' ? [30, 123, 52] : [179, 38, 30];
  const ink = stroke;

  doc.setFillColor(...fill);
  doc.setDrawColor(...stroke);
  doc.setLineWidth(0.7);
  if(typeof doc.roundedRect === 'function') doc.roundedRect(x, y, bw, bh, rad, rad, 'FD');
  else doc.rect(x, y, bw, bh, 'FD');

  // Ícono vectorial (no glifo ni "X" de teclado)
  doc.setDrawColor(...ink);
  doc.setLineWidth(compact ? 1.05 : 1.25);
  const ix = x + (compact ? 3.2 : 4);
  const iy = y + bh / 2;
  if(kind === 'acepta'){
    doc.line(ix, iy, ix + 2.2, iy + 2.4);
    doc.line(ix + 2.2, iy + 2.4, ix + 6.2, iy - 2.6);
  } else {
    doc.line(ix, iy - 2.6, ix + 5.4, iy + 2.6);
    doc.line(ix + 5.4, iy - 2.6, ix, iy + 2.6);
  }

  doc.setFont(opts.font || 'helvetica', 'bold');
  doc.setFontSize(compact ? 5.2 : 6.2);
  doc.setTextColor(...ink);
  doc.text(kind === 'acepta' ? 'ACEPTA' : 'RECHAZA', x + (compact ? 12 : 14), y + bh / 2 + (compact ? 1.7 : 2.1));
  doc.setTextColor(0);
  return { w: bw, h: bh };
}
window._pdfBadgeAceptaRechaza = _pdfBadgeAceptaRechaza;

/**
 * AARMS blmpfiel: marca SI/NO en celda (check vectorial limpio, sin "X" suelta).
 * Dibuja centrado en (cx, cy) si marcado=true.
 */
function _pdfBadgeSiNo(doc, cx, cy, marcado, opts){
  opts = opts || {};
  if(!marcado) return { w: 0, h: 0 };
  const sz = opts.size || 10;
  const kind = (opts.kind === 'no') ? 'no' : 'si';
  // AARMS condpulido: neutral = azul/gris (inspección); si/no default = verde/rojo (solo aceptación)
  let fill, stroke;
  if(opts.neutral){
    fill = kind === 'si' ? [226, 236, 250] : [236, 240, 245];
    stroke = kind === 'si' ? [37, 99, 235] : [100, 116, 139];
  } else {
    fill = kind === 'si' ? [230, 244, 234] : [251, 234, 234];
    stroke = kind === 'si' ? [30, 123, 52] : [179, 38, 30];
  }
  const x = cx - sz / 2, y = cy - sz / 2;
  doc.setFillColor(...fill);
  doc.setDrawColor(...stroke);
  doc.setLineWidth(0.7);
  if(typeof doc.roundedRect === 'function') doc.roundedRect(x, y, sz, sz, 2, 2, 'FD');
  else doc.rect(x, y, sz, sz, 'FD');
  doc.setDrawColor(...stroke);
  doc.setLineWidth(1.2);
  if(kind === 'si'){
    doc.line(x + 2.2, y + sz / 2, x + 4.2, y + sz - 2.4);
    doc.line(x + 4.2, y + sz - 2.4, x + sz - 2.2, y + 2.4);
  } else {
    doc.line(x + 2.5, y + 2.5, x + sz - 2.5, y + sz - 2.5);
    doc.line(x + sz - 2.5, y + 2.5, x + 2.5, y + sz - 2.5);
  }
  return { w: sz, h: sz };
}
window._pdfBadgeSiNo = _pdfBadgeSiNo;

/**
 * AARMS condcancelado + condcanceladofix: raya diagonal de cancelado (mismo criterio BM/OMAR).
 * Cruza SOLO el rectángulo pasado (típicamente celdas SI/NO) — no el texto de la actividad.
 */
function _lote4bcTachar(doc, x, y, w, h){
  try{ if(typeof window !== 'undefined') window.__lote4bcObsTachar = (window.__lote4bcObsTachar || 0) + 1; }catch(_){}
  _pdfTacharFila(doc, x, y, w, h);
}
window._lote4bcTachar = _lote4bcTachar;
// AARMS lote4bc: barra OBSERVACIONES siempre visible. Cuerpo vacío, una diagonal. Con texto, sin tacha.
function _lote4bcCuerpoObs(doc, x, y, w, texto, fuente){
  fuente = fuente || 'helvetica';
  const yBody = _pdfBarraSeccion(doc, 'OBSERVACIONES', x, y, w, fuente);
  const body = String(texto || '').trim();
  doc.setFont(fuente, 'normal');
  doc.setFontSize(8);
  const lines = body ? doc.splitTextToSize(body, Math.max(20, w - 12)) : [];
  const hBody = body ? Math.max(22, 8 + lines.length * 11) : 26;
  doc.setDrawColor(180, 188, 200);
  doc.setLineWidth(0.35);
  doc.setFillColor(252, 252, 253);
  doc.rect(x, yBody, w, hBody, 'FD');
  if(body){
    doc.setTextColor(30, 40, 60);
    let ty = yBody + 12;
    lines.forEach(ln => { doc.text(String(ln), x + 6, ty); ty += 11; });
  } else {
    _lote4bcTachar(doc, x, yBody, w, hBody);
  }
  return yBody + hBody + 4;
}
window._lote4bcCuerpoObs = _lote4bcCuerpoObs;
function _pdfTacharFila(doc, x, y, w, h, opts){
  opts = opts || {};
  const stroke = opts.color || [150, 155, 165];
  const lw = opts.lineWidth != null ? opts.lineWidth : 0.55;
  doc.setDrawColor(...stroke);
  doc.setLineWidth(lw);
  // Diagonal ↙↗ (igual que volúmenes BM / celdas OMAR canceladas)
  doc.line(x + 1, y + h - 1, x + w - 1, y + 1);
  return { w, h };
}
window._pdfTacharFila = _pdfTacharFila;

/**
 * Caja de leyenda/nota — texto NORMAL, sin letter-spacing / italic tirado.
 * CRÍTICO sub10: reemplaza pies "C r i t e r i o" rotos.
 */
function _pdfCajaLeyenda(doc, texto, x, y, ancho, fuente, opts){
  opts = opts || {};
  fuente = fuente || 'helvetica';
  const fs = opts.fontSize || 7.2;
  const pad = 6;
  const lh = fs + 2.2;
  const raw = (typeof jsPdfAscii === 'function') ? jsPdfAscii(String(texto || '')) : String(texto || '');
  doc.setFont(fuente, 'normal'); doc.setFontSize(fs);
  const lineas = (typeof doc.splitTextToSize === 'function')
    ? doc.splitTextToSize(raw, Math.max(40, ancho - pad * 2))
    : [raw];
  const alto = Math.max(lh + pad * 2, lineas.length * lh + pad * 2);
  doc.setFillColor(...STD.LGRAY); doc.setDrawColor(...STD.MGRAY); doc.setLineWidth(0.5);
  if(typeof doc.roundedRect === 'function') doc.roundedRect(x, y, ancho, alto, 2, 2, 'FD');
  else { doc.rect(x, y, ancho, alto, 'FD'); }
  doc.setTextColor(...STD.TEXT);
  doc.text(lineas, x + pad, y + pad + fs - 1);
  doc.setTextColor(0);
  return y + alto + (opts.gap != null ? opts.gap : 4);
}
window._pdfCajaLeyenda = _pdfCajaLeyenda;

/**
 * Sección = barra + cuerpo (callback) + borde envolvente.
 * drawBody(yAfterBar) → yFinal del contenido.
 */
function _pdfSeccionStd(doc, titulo, x, y, ancho, drawBody, fuente){
  const y0 = y;
  y = _pdfBarraSeccion(doc, titulo, x, y, ancho, fuente);
  if(typeof drawBody === 'function') y = drawBody(y) || y;
  const alto = Math.max(16, y - y0);
  _pdfCajaBorde(doc, x, y0, ancho, alto);
  return y + 6;
}
window._pdfSeccionStd = _pdfSeccionStd;

// ─── BPM (Plan de muestreo — F-AA-134-1) ───
// AARMS lote16: un BPM por plan, texto del formato oficial, solo se llenan los huecos.

function _lote16Plan(){
  if(typeof _planActivo === 'function'){
    const p = _planActivo();
    if(p) return p;
  }
  return _planPorOmar();
}
function _lote16Esc(s){
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _lote16Anio2(plan){
  const f = plan && plan.fecha ? String(plan.fecha) : '';
  const y = /^\d{4}/.test(f) ? f.slice(0, 4) : String(new Date().getFullYear());
  return y.slice(-2);
}
function _lote16Empresa(plan){
  if(!plan) return '';
  if(plan.empresaEnPlan) return String(plan.empresa || '').trim();
  const ms = _lote16Muestreos(plan);
  for(const m of ms){
    const o = _lote16OmarDe(m);
    const e = String((m && m.empresa) || o.empresa || '').trim();
    if(e) return e;
  }
  return String(plan.empresa || '').trim();
}
function _lote16OmarDe(m){
  if(!m) return {};
  if(m.omar && typeof m.omar === 'object') return m.omar;
  try { return JSON.parse(m.omar || '{}'); } catch(e){ return {}; }
}
function _lote16Muestreos(plan){
  const todos = typeof getMuestreos === 'function' ? getMuestreos() : [];
  return (plan && plan.omarIds || []).map(id => todos.find(x => String(x.id) === String(id))).filter(Boolean);
}
function _lote16FoliosOmar(plan){
  const out = [];
  _lote16Muestreos(plan).forEach(m => {
    const o = _lote16OmarDe(m);
    const f = String((m && m.folio) || o.folio || '').trim();
    if(f && out.indexOf(f) < 0) out.push(f);
  });
  return out.join(', ');
}
function _lote16ClavePh(){
  if(typeof _equipoActivo !== 'function') return '';
  const eq = _equipoActivo('potenciometros');
  return eq && eq.id != null && String(eq.id).trim() ? String(eq.id).trim() : '';
}
function _lote16Gps(o){
  const c = (o && o.campo) || {};
  const lat = parseFloat(String(c.gpsN || '').replace('°','').trim());
  const lngAbs = parseFloat(String(c.gpsW || '').replace('°','').trim());
  if(isNaN(lat) || isNaN(lngAbs) || lat === 0 || lngAbs === 0) return null;
  return { lat, lng: -Math.abs(lngAbs) };
}
function _lote16CroquisFuente(plan){
  const ms = _lote16Muestreos(plan);
  let elegido = null;
  for(const m of ms){
    const o = _lote16OmarDe(m);
    const foto = m.photoData && m.photoData !== 'p' ? m.photoData : '';
    const gps = _lote16Gps(o);
    if(foto || gps){ elegido = { m, o, foto, gps }; break; }
  }
  return elegido;
}
async function _lote16AsegurarFolio2(plan){
  if(!plan) return '';
  if(plan.folioBpm2) return String(plan.folioBpm2);
  if(typeof _folioTomar !== 'function') return '';
  const nums = await _folioTomar('bpm', 1, {
    planId: plan.id, doc: 'BPM', planFolio: plan.folio || '',
    ya: () => plan.folioBpm2 ? [plan.folioBpm2] : []
  });
  plan.folioBpm2 = nums && nums[0] ? nums[0] : '';
  if(plan.folioBpm2 && typeof idbPlanPut === 'function'){
    await idbPlanPut(plan);
    if(typeof refreshCache === 'function') await refreshCache();
  }
  return plan.folioBpm2 || '';
}
function _lote16Datos(plan){
  const anio = _lote16Anio2(plan);
  const foliosOmar = _lote16FoliosOmar(plan);
  const lvar = (typeof _lote3aFolioLvar === 'function') ? _lote3aFolioLvar(plan) : ((plan && plan.lvar && plan.lvar.folio) || '');
  const folPh = (typeof _lote3aFolioPh === 'function') ? _lote3aFolioPh(plan) : '';
  const clave = _lote16ClavePh();
  const blanco = !!(plan && plan.blancoCampo);
  let lote = '';
  if(blanco && typeof _lote14LoteAguaCatalogo === 'function') lote = _lote14LoteAguaCatalogo(plan) || '';
  const mu = typeof _muestreadorActual === 'function' ? _muestreadorActual() : {};
  if(plan && typeof _firmaMuestreadorAuto === 'function') _firmaMuestreadorAuto(plan);
  const fm = (plan && plan.firmas && plan.firmas.muestreador) || {};
  const fs = (plan && plan.firmas && plan.firmas.supervisor) || null;
  return {
    anio, foliosOmar, lvar: lvar || '', folPh: folPh || '', clave, blanco, lote,
    fecha: (plan && plan.fecha) || '',
    empresa: _lote16Empresa(plan),
    folio1: (plan && plan.folio) || '',
    folio2: (plan && plan.folioBpm2) || '',
    punto3: String((plan && plan.bpmPunto3) || '').trim(),
    obs: String((plan && plan.bpmObs) || '').trim(),
    muNombre: (fm.nombre || mu.nombre || '').trim(),
    muFirma: fm.firmaPng || mu.firmaPng || '',
    suNombre: fs && fs.nombre ? String(fs.nombre).trim() : '',
    suFirma: fs && fs.firmaPng ? fs.firmaPng : ''
  };
}
function _lote16Filas(plan, d){
  const croq = _lote16CroquisFuente(plan);
  const fila = (dato, valor, origen, ir, falta) => ({
    dato, valor: valor || '', origen, ir,
    estado: valor ? 'Listo' : ('Falta: ' + falta)
  });
  return [
    fila('Folio, página 1', d.folio1, 'Plan', 'plan', 'sin folio de plan'),
    fila('Folio, página 2', d.folio2, 'Contador bpm', 'plan', 'se reserva al generar el PDF'),
    fila('Fecha', d.fecha, 'Plan', 'plan', 'sin fecha'),
    fila('Empresa', d.empresa, 'Plan', 'plan', 'sin empresa'),
    fila('Folios OMAR', d.foliosOmar, 'OMAR del plan', 'plan', 'sin folio OMAR'),
    fila('Año de las bitácoras', d.anio, 'Fecha del plan', 'plan', 'sin año'),
    fila('1. Folio LVAR', d.lvar, 'LVAR', 'lvar', 'sin folio de LVAR'),
    fila('2. Clave del pH-metro', d.clave, 'Catálogo', 'catalogo', 'sin pH-metro en el catálogo'),
    fila('2 y 4. Folios de pH', d.folPh, 'Bitácora de pH', 'ph', 'sin folio de pH'),
    { dato: '5. Blanco de campo', valor: d.blanco ? 'Sí' : 'No', origen: 'Plan', ir: 'plan', estado: 'Listo' },
    d.blanco
      ? fila('5. Lote de agua reactivo', d.lote, 'Catálogo, Agua Reactivo', 'catalogo', 'sin lote en el catálogo')
      : { dato: '5. Lote de agua reactivo', valor: '', origen: 'Catálogo, Agua Reactivo', ir: 'catalogo', estado: 'Listo' },
    fila('7. Folios del Machiote', d.foliosOmar, 'Folios OMAR', 'plan', 'sin folio OMAR'),
    fila('Firma del muestreador', d.muNombre, 'Ajustes', 'ajustes', 'sin nombre en Ajustes'),
    fila('Firma del supervisor', d.suNombre, 'Firma de supervisor', 'plan', 'sin firma de supervisor')
  ].concat([
    croq
      ? { dato: '11. Croquis', valor: (croq.gps ? 'Mapa' : '') + (croq.gps && croq.foto ? ' y ' : '') + (croq.foto ? 'Foto del sitio' : ''), origen: 'Hoja de Campo', ir: 'hoja', estado: 'Listo' }
      : { dato: '11. Croquis', valor: '', origen: 'Hoja de Campo', ir: 'hoja', estado: 'Falta: sin foto ni mapa en la Hoja' }
  ]);
}
function _lote16PintarLista(plan){
  const host = document.getElementById('lote16BpmLista');
  if(!host || !plan) return;
  const filas = _lote16Filas(plan, _lote16Datos(plan));
  host.innerHTML = `<div style="display:grid;grid-template-columns:1.15fr 1.15fr .9fr .9fr;gap:8px;padding:6px 0;font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)">
      <div>Dato</div><div>Valor</div><div>Origen</div><div>Estado</div>
    </div>` + filas.map(f => {
    const col = f.estado === 'Listo' ? 'var(--green)' : '#f87171';
    const origen = `<button type="button" data-lote16-ir="${_lote16Esc(f.ir)}" style="background:none;border:none;padding:0;color:var(--acc);font-size:12px;cursor:pointer;text-align:left">${_lote16Esc(f.origen)}</button>`;
    return `<div data-lote16-fila="${_lote16Esc(f.dato)}" style="display:grid;grid-template-columns:1.15fr 1.15fr .9fr .9fr;gap:8px;padding:8px 0;border-top:1px solid var(--ln);align-items:start">
      <div style="font-size:12px;color:var(--w)">${_lote16Esc(f.dato)}</div>
      <div data-lote16-valor style="font-size:12px;color:var(--w);word-break:break-word">${_lote16Esc(f.valor)}</div>
      <div>${origen}</div>
      <div data-lote16-estado style="font-size:12px;color:${col}">${_lote16Esc(f.estado)}</div>
    </div>`;
  }).join('');
}
async function _lote16Ir(dest){
  if(dest === 'lvar' && typeof abrirLVAR === 'function'){ abrirLVAR(); return; }
  if(dest === 'catalogo'){ if(typeof goPage === 'function') goPage('pgCatalogo'); return; }
  if(dest === 'ajustes'){ if(typeof goPage === 'function') goPage('pgAjustes'); return; }
  if(dest === 'ph' && typeof abrirBitacoraPH === 'function'){ await abrirBitacoraPH(); return; }
  if(dest === 'hoja' && typeof abrirDocPlan === 'function'){ await abrirDocPlan('omars'); return; }
  if(typeof cerrarDocSuite === 'function') cerrarDocSuite();
  else if(typeof goPage === 'function') goPage('pgPlan');
}
function validarBpmParaPdf(){ return []; }
function poblarBpm(){
  const plan = _lote16Plan();
  const p3 = document.getElementById('lote16Punto3');
  const ob = document.getElementById('lote16Obs');
  if(p3 && document.activeElement !== p3) p3.value = plan && plan.bpmPunto3 ? plan.bpmPunto3 : '';
  if(ob && document.activeElement !== ob) ob.value = plan && plan.bpmObs ? plan.bpmObs : '';
  _lote16PintarLista(plan);
  const host = document.getElementById('lote16BpmLista');
  if(host && !host.dataset.lote16Click){
    host.dataset.lote16Click = '1';
    host.addEventListener('click', ev => {
      const b = ev.target.closest('[data-lote16-ir]');
      if(!b) return;
      ev.preventDefault();
      _lote16Ir(b.getAttribute('data-lote16-ir'));
    });
  }
}
function leerBpm(){
  // AARMS lote16: solo los dos textos libres. omar.bpm (y f7_preserv) no se reescribe.
  const plan = _lote16Plan();
  if(!plan) return;
  const p3 = document.getElementById('lote16Punto3');
  const ob = document.getElementById('lote16Obs');
  if(p3) plan.bpmPunto3 = String(p3.value || '').trim();
  if(ob) plan.bpmObs = String(ob.value || '').trim();
}
function abrirPagBpm(){
  const plan = _lote16Plan();
  if(!plan){ toast('Abre un plan primero','w'); return; }
  poblarBpm();
  const pl = document.getElementById('bpmPill');
  if(pl) pl.textContent = plan.folio ? ('Folio ' + plan.folio) : 'Plan';
  if(typeof _aplicarDocEstadoBadge === 'function') _aplicarDocEstadoBadge('bpm');
  goPage('pgBpm');
  if(typeof _refreshBotonesContinuarLab === 'function') _refreshBotonesContinuarLab();
}
async function guardarBpmPage(){
  leerBpm();
  const plan = _lote16Plan();
  if(plan && typeof idbPlanPut === 'function'){
    plan.ts = Date.now();
    await idbPlanPut(plan);
    if(typeof refreshCache === 'function') await refreshCache();
  }
  toast('Plan de muestreo guardado','g');
  if(typeof _actualizarGatePlanUI === 'function') _actualizarGatePlanUI();
  if(typeof _refreshBotonesContinuarLab === 'function') _refreshBotonesContinuarLab();
  if(typeof _aplicarDocEstadoBadge === 'function') _aplicarDocEstadoBadge('bpm');
  poblarBpm();
}

function _lote16Texto(doc, fuente, texto, x, y, w, size, leading){
  doc.setFont(fuente, 'normal');
  doc.setFontSize(size);
  doc.setTextColor(20, 24, 32);
  const lines = doc.splitTextToSize(String(texto || ''), w);
  lines.forEach((ln, i) => doc.text(ln, x, y + i * leading));
  return y + lines.length * leading;
}
function _lote16Caja(doc, x, y, w, h, texto, fuente){
  doc.setDrawColor(40, 48, 64);
  doc.setLineWidth(0.6);
  doc.setFillColor(252, 252, 253);
  doc.rect(x, y, w, h, 'FD');
  const body = String(texto || '').trim();
  if(!body){
    if(typeof _pdfTacharFila === 'function') _pdfTacharFila(doc, x, y, w, h);
    return;
  }
  doc.setFont(fuente, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(20, 24, 32);
  const lines = doc.splitTextToSize(body, w - 12);
  let ty = y + 14;
  lines.forEach(ln => {
    if(ty < y + h - 6){ doc.text(ln, x + 6, ty); ty += 12; }
  });
}
function _lote16Caber(iw, ih, bw, bh){
  if(!iw || !ih || !bw || !bh) return null;
  const r = iw / ih;
  let dw = bw, dh = bw / r;
  if(dh > bh){ dh = bh; dw = bh * r; }
  return { dw, dh };
}
async function _lote16Medir(src){
  if(!src || typeof preloadImg !== 'function') return null;
  const pre = await preloadImg(src);
  if(!pre || !pre.w || !pre.h) return null;
  return pre;
}
async function _lote16Croquis(doc, plan, x, y, w, h){
  doc.setDrawColor(40, 48, 64);
  doc.setLineWidth(0.7);
  doc.setFillColor(248, 249, 251);
  doc.rect(x, y, w, h, 'FD');
  const src = _lote16CroquisFuente(plan);
  let mapa = null, foto = null;
  if(src && src.gps && typeof loadMapImage === 'function'){
    try { mapa = await loadMapImage(src.gps.lat, src.gps.lng, 16, 900, 700); } catch(e){ mapa = null; }
  }
  if(src && src.foto) foto = src.foto;
  const medM = mapa ? await _lote16Medir(mapa) : null;
  const medF = foto ? await _lote16Medir(foto) : null;
  const tiene = [];
  if(medM) tiene.push({ pre: medM, pie: 'Mapa' });
  if(medF) tiene.push({ pre: medF, pie: 'Foto del sitio' });
  if(!tiene.length){
    if(typeof _pdfTacharFila === 'function') _pdfTacharFila(doc, x, y, w, h);
    return;
  }
  const pad = 10, gap = 18, pieH = 16;
  const areaH = h - pad * 2 - pieH;
  const areaW = w - pad * 2;
  if(tiene.length === 1){
    const it = tiene[0];
    const box = _lote16Caber(it.pre.w, it.pre.h, areaW, areaH);
    const dx = x + pad + (areaW - box.dw) / 2;
    const dy = y + pad + (areaH - box.dh) / 2;
    try { doc.addImage(it.pre.data, it.pre.data.indexOf('image/png') >= 0 ? 'PNG' : 'JPEG', dx, dy, box.dw, box.dh, '', 'FAST'); } catch(e){}
    doc.setFontSize(8); doc.setTextColor(40, 48, 64);
    doc.text(it.pie, x + w / 2, y + h - 8, { align: 'center' });
    doc.setDrawColor(40, 48, 64); doc.setLineWidth(0.7); doc.rect(x, y, w, h, 'S');
    return;
  }
  const colW = (areaW - gap) / 2;
  let alt = areaH;
  tiene.forEach(it => {
    const r = it.pre.w / it.pre.h;
    alt = Math.min(alt, colW / r);
  });
  tiene.forEach((it, i) => {
    const dw = alt * (it.pre.w / it.pre.h);
    const cx = x + pad + i * (colW + gap);
    const dx = cx + (colW - dw) / 2;
    const dy = y + pad + (areaH - alt) / 2;
    try { doc.addImage(it.pre.data, it.pre.data.indexOf('image/png') >= 0 ? 'PNG' : 'JPEG', dx, dy, dw, alt, '', 'FAST'); } catch(e){}
    doc.setFontSize(8); doc.setTextColor(40, 48, 64);
    doc.text(it.pie, cx + colW / 2, y + h - 8, { align: 'center' });
  });
  doc.setDrawColor(40, 48, 64); doc.setLineWidth(0.7); doc.rect(x, y, w, h, 'S');
}
function _lote16Pie(doc, fuente, d, folio, n, W, H, M){
  const y0 = H - 108;
  doc.setDrawColor(40, 48, 64); doc.setLineWidth(0.4);
  doc.line(M, y0, W - M, y0);
  doc.setFont(fuente, 'bold'); doc.setFontSize(8); doc.setTextColor(20, 24, 32);
  doc.text('Asesoría y Análisis S.C.', M, y0 + 11);
  doc.setFont(fuente, 'normal'); doc.setFontSize(8);
  doc.text('Laboratorio de Alimentos y Aguas', M, y0 + 21);
  const boxW = 92, boxH = 20, boxX = W - M - boxW;
  doc.setLineWidth(0.6); doc.rect(boxX, y0 + 4, boxW, boxH, 'S');
  doc.setFontSize(7); doc.text('Folio', boxX + 4, y0 + 12);
  doc.setFont(fuente, 'bold'); doc.setFontSize(10);
  doc.text(String(folio || ''), boxX + boxW - 6, y0 + 17, { align: 'right' });
  const col = (W - M * 2) / 2;
  const sigY = y0 + 26;
  [[d.suFirma, d.suNombre, 'Supervisor', M], [d.muFirma, d.muNombre, 'Muestreador', M + col]].forEach(([png, nom, rol, x]) => {
    if(png){ try { doc.addImage(png, 'PNG', x + 4, sigY, 78, 16, '', 'FAST'); } catch(e){} }
    doc.setDrawColor(40, 48, 64); doc.setLineWidth(0.4);
    doc.line(x + 4, sigY + 18, x + 130, sigY + 18);
    doc.setFont(fuente, 'normal'); doc.setFontSize(7); doc.setTextColor(20, 24, 32);
    if(nom) doc.text(nom, x + 4, sigY + 28);
    doc.setFont(fuente, 'bold'); doc.setFontSize(8);
    doc.text(rol, x + 4, sigY + 40);
  });
  doc.setFont(fuente, 'normal'); doc.setFontSize(8); doc.setTextColor(20, 24, 32);
  doc.text('F-AA-134-1', M, H - 22);
  doc.text('pag. ' + n + ' de 2', W - M, H - 22, { align: 'right' });
  doc.setFontSize(7); doc.setTextColor(80, 88, 100);
  doc.text('Documento generado desde AARMS', W / 2, H - 10, { align: 'center' });
}

// AARMS lote18: encabezado arriba, con el logo de los demás PDF.
async function _lote18Encabezado(doc, fuente, folio, opts){
  opts = opts || {};
  const W = doc.internal.pageSize.getWidth();
  const M = opts.m != null ? opts.m : 42;
  let logo = opts.logo || null;
  if(!logo && typeof loadLogo === 'function'){
    try { logo = await loadLogo('logo.png'); } catch(e){ logo = null; }
  }
  if(logo && typeof addLogoProportional === 'function') addLogoProportional(doc, logo, M, 16, 50, 38);
  doc.setTextColor(20, 24, 32);
  doc.setFont(fuente, 'bold'); doc.setFontSize(11);
  doc.text('Asesoría y Análisis S.C.', M + 58, 32);
  doc.setFont(fuente, 'normal'); doc.setFontSize(9);
  doc.text('Laboratorio de Alimentos y Aguas', M + 58, 45);
  doc.setFont(fuente, 'normal'); doc.setFontSize(10);
  doc.text('Folio: ' + (folio || ''), W - M, 36, { align: 'right' });
  const ancho = Math.max(72, doc.getTextWidth(String(folio || '')) + 6);
  doc.setDrawColor(20, 24, 32); doc.setLineWidth(0.6);
  doc.line(W - M - ancho, 39, W - M, 39);
  if(opts.regla){
    doc.setLineWidth(0.9);
    doc.line(M, 56, W - M, 56);
    return 70;
  }
  return 64;
}
function _lote18Firmas(doc, fuente, d, W, H, M){
  const yLine = H - 74;
  const ancho = 168;
  [[d.suFirma, d.suNombre, 'Supervisor', M + 8], [d.muFirma, d.muNombre, 'Muestreador', W / 2 + 10]].forEach(([png, nom, rol, x]) => {
    if(png){ try { doc.addImage(png, 'PNG', x + 20, yLine - 26, 100, 22, '', 'FAST'); } catch(e){} }
    doc.setDrawColor(20, 24, 32); doc.setLineWidth(0.8);
    doc.line(x, yLine, x + ancho, yLine);
    doc.setFont(fuente, 'bold'); doc.setFontSize(10); doc.setTextColor(20, 24, 32);
    doc.text(rol, x + ancho / 2, yLine + 13, { align: 'center' });
    if(nom){
      doc.setFont(fuente, 'normal'); doc.setFontSize(8);
      doc.text(String(nom), x + ancho / 2, yLine + 24, { align: 'center' });
    }
  });
}
function _lote18Codigo(doc, fuente, codigo, sub, W, H, M, aarms){
  doc.setFont(fuente, 'normal'); doc.setFontSize(8); doc.setTextColor(20, 24, 32);
  doc.text(String(codigo || ''), W - M, H - 28, { align: 'right' });
  doc.text(String(sub || ''), W - M, H - 17, { align: 'right' });
  if(aarms){
    doc.setFontSize(6.5); doc.setTextColor(120, 126, 136);
    doc.text('Documento generado desde AARMS', W - M, H - 7, { align: 'right' });
  }
}
function _lote18Vineta(doc, fuente, texto, x, y, w, size, lead, nivel){
  const pad = nivel ? 18 : 0;
  doc.setFont(fuente, 'normal'); doc.setFontSize(size); doc.setTextColor(20, 24, 32);
  const lines = doc.splitTextToSize(String(texto || ''), w - 14 - pad);
  doc.setFillColor(20, 24, 32);
  doc.circle(x + 4 + pad, y - 3, 1.15, 'F');
  lines.forEach((ln, i) => doc.text(ln, x + 12 + pad, y + i * lead));
  return y + lines.length * lead;
}
function _lote18Num(doc, fuente, n, texto, x, y, w, size, lead){
  doc.setFont(fuente, 'normal'); doc.setFontSize(size); doc.setTextColor(20, 24, 32);
  const lines = doc.splitTextToSize(String(texto || ''), w - 18);
  doc.text(String(n) + '.', x, y);
  lines.forEach((ln, i) => doc.text(ln, x + 16, y + i * lead));
  return y + Math.max(1, lines.length) * lead;
}
// AARMS lote18: renglones. Una diagonal cruza el bloque que no se usa.
function _lote18Renglones(doc, fuente, x, y, w, n, paso, texto){
  const body = String(texto || '').trim();
  doc.setDrawColor(90, 96, 108); doc.setLineWidth(0.45);
  for(let i = 0; i < n; i++) doc.line(x, y + (i + 1) * paso - 2, x + w, y + (i + 1) * paso - 2);
  if(!body){
    if(typeof _pdfTacharFila === 'function') _pdfTacharFila(doc, x, y, w, n * paso);
    return y + n * paso;
  }
  let size = 10;
  let lines = [];
  doc.setFont(fuente, 'normal');
  while(size >= 7){
    doc.setFontSize(size);
    lines = doc.splitTextToSize(body, w - 6);
    if(lines.length <= n) break;
    size -= 0.5;
  }
  doc.setTextColor(20, 24, 32);
  const cabe = lines.length <= n;
  const lead = cabe ? paso : ((n * paso - 2) / lines.length);
  lines.forEach((ln, i) => {
    const ty = y + (cabe ? (i + 1) * paso - 5 : 8 + i * lead);
    doc.text(ln, x + 2, ty);
  });
  if(cabe && lines.length < n && typeof _pdfTacharFila === 'function'){
    const y0 = y + lines.length * paso;
    _pdfTacharFila(doc, x, y0, w, (n - lines.length) * paso);
  }
  return y + n * paso;
}

async function generarPDFBpm(){
  const plan = _lote16Plan();
  if(!plan){ toast('Abre un plan primero','w'); return; }
  // AARMS lote21d: solo funde la pantalla si es este plan, y un cuadro vacío no borra el texto guardado.
  const pgBpm = document.getElementById('pgBpm');
  if(pgBpm && pgBpm.classList.contains('on')){
    const p3 = document.getElementById('lote16Punto3');
    const ob = document.getElementById('lote16Obs');
    const t3 = p3 ? String(p3.value || '').trim() : '';
    const to = ob ? String(ob.value || '').trim() : '';
    if(t3) plan.bpmPunto3 = t3;
    if(to) plan.bpmObs = to;
    if((t3 || to) && typeof idbPlanPut === 'function'){
      try{ await idbPlanPut(plan); }catch(e){}
    }
  }
  await _lote16AsegurarFolio2(plan);
  const d = _lote16Datos(plan);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter', compress: true });
  const fuente = typeof _pdfBmAplicarRoboto === 'function' ? await _pdfBmAplicarRoboto(doc) : 'helvetica';
  const W = 612, H = 792, M = 42, CW = W - M * 2;
  const logo = (typeof loadLogo === 'function') ? await loadLogo('logo.png') : null;
  const cuerpo = 10, lead = 12.5;

  let y = await _lote18Encabezado(doc, fuente, d.folio1, { logo, m: M });
  y += 16;
  doc.setFont(fuente, 'bold'); doc.setFontSize(14); doc.setTextColor(20, 24, 32);
  doc.text('Plan de Muestreo', W / 2, y, { align: 'center' });
  y += 18;
  doc.setFont(fuente, 'bold'); doc.setFontSize(11);
  doc.text('Fecha: ' + ((typeof _lote21FechaPantalla==='function' && d.fecha) ? _lote21FechaPantalla(d.fecha) : (d.fecha || '')), W - M, y, { align: 'right' });
  y += 16;
  doc.text('Empresa:', M, y);
  doc.setFont(fuente, 'normal');
  doc.text(d.empresa || '', M + doc.getTextWidth('Empresa: '), y);
  y += 16;
  const intro = 'Los datos del Cliente, el tipo de muestreo, número de descargas, parámetros y norma aplicable se localizan en la orden de muestreo de agua residual OMAR Folio: '
    + (d.foliosOmar || '') + ' localizada en la bitácora BOMAR/AA/N-3/' + d.anio;
  y = _lote16Texto(doc, fuente, intro, M, y, CW, cuerpo, lead) + 6;
  const p1 = '1.- Equipo y Material: La relación de equipo y material usado durante el muestreo se registra en la Lista de Verificación folio '
    + (d.lvar || '') + ', ubicada en la Bitácora BLVM/AA/N-3/' + d.anio + '. En la lista de verificación se indica la clave de identificación de los equipos utilizados.';
  y = _lote16Texto(doc, fuente, p1, M, y, CW, cuerpo, lead) + 4;
  const p2 = '2.- Verificación del Equipo: El equipo debe verificarse antes de salir a muestrear y se registra en la Bitácora BUCCVpH '
    + (d.clave || '') + '/AA/N-3/' + d.anio + ', folio: ' + (d.folPh || '') + '.';
  y = _lote16Texto(doc, fuente, p2, M, y, CW, cuerpo, lead) + 6;
  doc.setFont(fuente, 'bold'); doc.setFontSize(cuerpo); doc.setTextColor(20, 24, 32);
  doc.text('3.- Características de la descarga y su ubicación:', M, y);
  y += 4;
  const paso3 = 12.2;
  const n3 = Math.max(12, Math.min(22, Math.floor((H - 300 - y) / paso3)));
  y = _lote18Renglones(doc, fuente, M, y, CW, n3, paso3, d.punto3) + 8;
  const p4 = '4.- Calibración del Equipo: Los equipos se calibran al llegar al sitio de Muestreo y son registrados en la Bitácora BUCCVpH/AA/N-3/'
    + d.anio + ', en el folio: ' + (d.folPh || '');
  y = _lote16Texto(doc, fuente, p4, M, y, CW, cuerpo, lead) + 3;
  const p5 = '5.- Control de Calidad: Graficar los datos de las Muestras de control analítico en las Cartas Control de pH y conductividad respectivamente y registrar en la Bitácora de Muestreo si se aceptan o rechazan.';
  y = _lote16Texto(doc, fuente, p5, M, y, CW, cuerpo, lead) + 2;
  y = _lote18Vineta(doc, fuente, 'Como control de calidad se toma un blanco de campo una vez al mes, de acuerdo a lo establecido en el Manual de Muestreo.', M + 8, y, CW - 8, cuerpo, lead, 0) + 1;
  y = _lote18Vineta(doc, fuente, '¿Aplica tomar blanco de campo? ' + (d.blanco ? 'Sí' : 'No'), M + 8, y, CW - 8, cuerpo, lead, 1) + 1;
  _lote18Vineta(doc, fuente, 'En caso afirmativo, lote de agua reactivo utilizado: ' + (d.blanco ? (d.lote || '') : ''), M + 8, y, CW - 8, cuerpo, lead, 1);
  _lote18Firmas(doc, fuente, d, W, H, M);
  _lote18Codigo(doc, fuente, 'F-AA-134-1', 'pag. 1 de 2', W, H, M, true);

  doc.addPage();
  y = await _lote18Encabezado(doc, fuente, d.folio2, { logo, m: M });
  y += 14;
  y = _lote16Texto(doc, fuente, '6.- Tomar las muestras solicitadas y de acuerdo con lo establecido en el Manual de Muestreo AR (MMAR/AA/N-2) en los puntos 8 y 9.', M, y, CW, cuerpo, lead) + 3;
  const p7 = '7.- Prepara la muestra compuesta de acuerdo con lo escrito en el Manual de Muestreo AR (MMAR/AA/N-2), apartado 9 y registrarlo en la bitácora de Muestreo BM/AA/N-3/'
    + d.anio + ', en el folio: ' + (d.foliosOmar || '');
  y = _lote16Texto(doc, fuente, p7, M, y, CW, cuerpo, lead) + 3;
  y = _lote16Texto(doc, fuente, '8.- Preservar las muestras de acuerdo a lo indicado en el Manual de Muestreo AR punto 8 y utilizando los reactivos y preservadores indicados en la lista de verificación del punto 1 de este plan de muestreo.', M, y, CW, cuerpo, lead) + 1;
  y = _lote18Vineta(doc, fuente, 'Medir los parámetros de campo que apliquen y registrarlos junto con los datos relevantes en la hoja de campo y en la bitácora de muestreo.', M + 8, y, CW - 8, cuerpo, lead, 0) + 1;
  y = _lote18Vineta(doc, fuente, 'Colocar las muestras en una hielera con hielo.', M + 8, y, CW - 8, cuerpo, lead, 0) + 3;
  y = _lote16Texto(doc, fuente, '9.- Al término del muestreo solicitar a los responsables de la empresa (cliente) que firmen de conformidad hoja de campo y cadena de custodia.', M, y, CW, cuerpo, lead) + 3;
  y = _lote16Texto(doc, fuente, '10.-Transportar las muestras a una temperatura de 4ºC en una hielera con hielo, y entregarlas en el laboratorio.', M, y, CW, cuerpo, lead) + 6;
  doc.setFont(fuente, 'bold'); doc.setFontSize(cuerpo); doc.setTextColor(20, 24, 32);
  doc.text('11.- Croquis:', M, y);
  y += 4;
  const pieTop = H - 150;
  const obsPaso = 14;
  const croqH = Math.max(210, Math.min(320, pieTop - (4 * obsPaso) - 28 - y));
  await _lote16Croquis(doc, plan, M, y, CW, croqH);
  y += croqH + 8;
  y = _lote16Texto(doc, fuente, 'NOTA: Menciona si se realizó alguna modificación en campo al plan de muestreo.', M, y, CW, cuerpo, lead) + 4;
  doc.setFont(fuente, 'bold'); doc.setFontSize(cuerpo);
  doc.text('Observaciones:', M, y);
  y += 2;
  _lote18Renglones(doc, fuente, M, y, CW, 4, obsPaso, d.obs);
  _lote18Firmas(doc, fuente, d, W, H, M);
  _lote18Codigo(doc, fuente, 'F-AA-134-1', 'pag. 2 de 2', W, H, M, true);

  doc.save('BPM_' + (d.folio1 || 'plan') + '.pdf');
  if(document.getElementById('lote16BpmLista')) _lote16PintarLista(plan);
  toast('PDF BPM generado','g');
  if(typeof _maybeMarcarPlanDoc === 'function') await _maybeMarcarPlanDoc('bpm');
}

// ─── F-AA-264-4 Hoja 1 (laboratorio) ───

function poblarPh1(){
  if(!omar) return;
  omar.ph2644h1=omar.ph2644h1||{};
  const h=omar.ph2644h1;
  _ds('ph1_fecha', h.fecha||'');
  _ds('ph1_hora', h.hora||'');
  _ds('ph1_folio', h.folio||'');
  _ds('ph1_lote', h.lote||'');
  _ds('ph1_marca', h.marca||'');
  _ds('ph1_buffer', h.buffer||'');
  _ds('ph1_cal_l1', h.cal_l1||''); _ds('ph1_cal_l2', h.cal_l2||''); _ds('ph1_cal_l3', h.cal_l3||'');
  _ds('ph1_comp_l1', h.comp_l1||''); _ds('ph1_comp_l2', h.comp_l2||''); _ds('ph1_comp_l3', h.comp_l3||'');
  _ds('ph1_ver_l1', h.ver_l1||''); _ds('ph1_ver_l2', h.ver_l2||''); _ds('ph1_ver_l3', h.ver_l3||'');
  _ds('ph1_obs', h.obs||'');
  _ds('ph1_slope', h.slope||'');
  _ds('ph1_temp', h.temp||'');
  _ds('ph1_campo_c1', h.campo_c1||''); _ds('ph1_campo_c2', h.campo_c2||''); _ds('ph1_campo_c3', h.campo_c3||'');
  _ds('ph1_campo_crit', h.campo_crit||'');
  _ds('ph1_campo_acep', h.campo_acep||'');
}

function leerPh1(){
  // AARMS lote4a: la entrada nueva no reescribe omar.ph2644h1 desde la pantalla.
  if(document.getElementById('phLabMount')) return;
  if(!omar) return;
  omar.ph2644h1={
    fecha:_dg('ph1_fecha'), hora:_dg('ph1_hora'), folio:_dg('ph1_folio'),
    lote:_dg('ph1_lote'), marca:_dg('ph1_marca'), buffer:_dg('ph1_buffer'),
    cal_l1:_dg('ph1_cal_l1'), cal_l2:_dg('ph1_cal_l2'), cal_l3:_dg('ph1_cal_l3'),
    comp_l1:_dg('ph1_comp_l1'), comp_l2:_dg('ph1_comp_l2'), comp_l3:_dg('ph1_comp_l3'),
    ver_l1:_dg('ph1_ver_l1'), ver_l2:_dg('ph1_ver_l2'), ver_l3:_dg('ph1_ver_l3'),
    obs:_dg('ph1_obs'), slope:_dg('ph1_slope'), temp:_dg('ph1_temp'),
    campo_c1:_dg('ph1_campo_c1'), campo_c2:_dg('ph1_campo_c2'), campo_c3:_dg('ph1_campo_c3'),
    campo_crit:_dg('ph1_campo_crit'), campo_acep:_dg('ph1_campo_acep'),
  };
}

async function abrirPagPh2644Lab(){
  if(typeof _lote4aAbrir === 'function') return _lote4aAbrir();
  if(!omar||!omar.ts){ toast('Abre un OMAR primero','w'); return; }
  poblarPh1();
  if(typeof _catalogoCargar==='function') await _catalogoCargar();
  if(typeof _catalogoPrefillPhLab==='function') await _catalogoPrefillPhLab();
  const pl=document.getElementById('ph2644Pill'); if(pl) pl.textContent=omar.folio?'OMAR '+omar.folio:'OMAR';
  if(typeof _aplicarDocEstadoBadge==='function') _aplicarDocEstadoBadge('phlab');
  goPage('pgPh2644');
  // AARMS lvarfix
  if(typeof _refreshBotonesContinuarLab === 'function') _refreshBotonesContinuarLab();
}

async function guardarPh1Page(){
  leerPh1();
  try{ await saveMuestreoActual(); }catch(e){ console.warn(e); }
  toast('Phmetro (laboratorio) guardado','g');
  // AARMS lvarfix
  if(typeof _refreshBotonesContinuarLab === 'function') _refreshBotonesContinuarLab();
  // AARMS simfix
  if(typeof _actualizarGatePlanUI === 'function') _actualizarGatePlanUI();
}

async function generarPDFPh2644H1(){
  if(!omar||!omar.ts) return;
  // AARMS lote21c: con plan.ph2644 el único PDF es el de dos páginas.
  const planPh = (typeof getPlanDeMuestreo === 'function') ? getPlanDeMuestreo(omar.ts) : null;
  if(planPh && planPh.ph2644 && typeof generarPDFBitacoraPHOficial === 'function'){
    return generarPDFBitacoraPHOficial(planPh.id);
  }
  const pgPh = document.getElementById('pgPh2644');
  if(pgPh && pgPh.classList.contains('on') && !document.getElementById('phLabMount')) leerPh1();
  // AARMS v66-p0p1: fusionar catálogo antes de PDF (sin depender de abrir pantalla)
  if(typeof _catalogoCargar==='function') await _catalogoCargar();
  // AARMS lote21d: la fusión del catálogo queda en la copia que se imprime.
  const h = Object.assign({}, (omar && omar.ph2644h1) || {});
  if(typeof _catalogoFusionPh2644h1==='function'){
    _catalogoFusionPh2644h1(h);
  }
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  // AARMS sub8-pdfs: filas/firma premium (helpers Machiote, Helvetica); estructura oficial intacta
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter',compress:true});
  const W=612,M=28,CW=W-M*2,HDR=72,H=792;
  const FONT='helvetica';
  const _firmaPrem=window._pdfFirmaPremium;
  const MGRAY=[208,216,228],LGRAY=[232,238,245],DGRAY=[51,65,85],NAVY=[10,22,40],ACCENT=[37,99,235];
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
  _pdfStdHeader(doc,logo,W,M,HDR,'pH-metro','Uso, calibracion (Lab)','F-AA-264-4');
  let y=HDR+6;
  // filas premium: zebra sutil + label NAVY + valor ACCENT
  let filaIdx=0;
  const row=(a,b,yy)=>{
    if(filaIdx%2===1){ doc.setFillColor(...LGRAY); doc.rect(M,yy,CW,14,'F'); }
    else { doc.setFillColor(255,255,255); doc.rect(M,yy,CW,14,'F'); }
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.4); doc.rect(M,yy,CW,14,'S');
    doc.setFont(FONT,'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY); doc.text(jsPdfAscii(a),M+3,yy+6);
    doc.setFontSize(8); doc.text(jsPdfAscii(valStyle(b)).substring(0,100),M+3,yy+12);
    filaIdx++;
    return yy+15;
  };
  y=row('Fecha / Hora / Folio', [h.fecha,h.hora,h.folio].filter(Boolean).join(' | '), y);
  y=row('Lote / Marca / Buffer', [h.lote,h.marca,h.buffer].join(' | '), y);
  y=row('Calibracion Lab L1-L3', [h.cal_l1,h.cal_l2,h.cal_l3].join(' | '), y);
  y=row('Comprobacion calibracion Lab', [h.comp_l1,h.comp_l2,h.comp_l3].join(' | '), y);
  y=row('Verificacion Lab', [h.ver_l1,h.ver_l2,h.ver_l3].join(' | '), y);
  y=row('Observaciones', h.obs, y);
  y=row('Campo: comprobacion/verif (lecturas)', [h.campo_c1,h.campo_c2,h.campo_c3].join(' | '), y);
  y=row('Criterio / Acepta / Slope / Temp', [h.campo_crit,h.campo_acep,h.slope,h.temp].join(' | '), y);
  y+=8;
  // AARMS sub10-std: leyendas en caja
  const Ley=window.AARMS_DOC_LEYENDAS||{};
  const block=[Ley.actControl,Ley.limpiezaCod,Ley.phCriterios].filter(Boolean).join(' ');
  if(y>H-110){ doc.addPage(); _pdfStdHeader(doc,logo,W,M,HDR,'pH-metro','Uso, calibracion (Lab) — notas','F-AA-264-4'); y=HDR+14; }
  if(typeof _pdfCajaLeyenda==='function'){
    y=_pdfCajaLeyenda(doc, block || 'Criterios pH lab.', M, y, CW, FONT, { fontSize:6.8 });
  }
  if(typeof _firmaPrem==='function'){
    _firmaPrem(doc, 'Pag. 1', 'F-AA-264-4', { font:FONT, W, H, yOffset:70 });
  }
  // AARMS lote21d: el PDF viejo no reescribe el muestreo.
  doc.save(`Phmetro_Lab_OMAR-${omar.folio||omar.ts}.pdf`);
  toast('PDF Phmetro (lab) generado','g');
  if(typeof _maybeMarcarPlanDoc==='function') await _maybeMarcarPlanDoc('phlab');
}

// ─── BM Bitácora de muestreo F-AA-114-18 (5 hojas / bloques en UI) ───
const BM_FORM_IDS = [
  'bm_s1_fecha','bm_s1_empresa','bm_s1_dir','bm_s1_lugar','bm_s1_punto','bm_s1_ciudad','bm_s1_estado','bm_s1_tipo','bm_s1_nsimples','bm_s1_analitos','bm_s1_lvar','bm_s1_blvm','bm_s1_plan',
  'bm_s2_bucc','bm_s2_bucc_fol','bm_s2_ph_clave','bm_s2_blmp','bm_s2_blmp_fol','bm_s2_bdal','bm_s2_cond_ref',
  'bm_s3_arribo_h','bm_s3_arribo_d','bm_s3_recibe_nom','bm_s3_recibe_puesto','bm_s3_inicio_h','bm_s3_periodo_h','bm_s3_termo','bm_s3_malla','bm_s3_proc_temp','bm_s3_proc_temp_txt','bm_s3_od','bm_s3_recoleccion',
  'bm_s4_bfcmt','bm_s4_bfcmt_fol','bm_s4_bhcar','bm_s4_hcar_fol','bm_s4_bitph','bm_s4_bitcond','bm_s4_tira_h','bm_s4_tira_val','bm_s4_flujos','bm_s4_conserv',
  'bm_s5_bcciar','bm_s5_cciar_fol','bm_s5_prep','bm_s5_vol','bm_s5_obs1','bm_s5_obs2','bm_s5_obs3',
];

let _bmStep = 0;

function bmGoStep(n){
  const step = Math.max(0, Math.min(4, parseInt(n, 10) || 0));
  _bmStep = step;
  document.querySelectorAll('.bm-step').forEach((el, i)=>{
    el.classList.toggle('on', parseInt(el.dataset.bmStep, 10) === step);
  });
  document.querySelectorAll('.bm-panel').forEach((el, i)=>{
    el.classList.toggle('on', el.id === 'bmP'+step);
  });
  // AARMS sub4-cons: render matriz al entrar a hoja 4
  if(step === 3 && typeof _renderMachioteConservadores === 'function'){
    _renderMachioteConservadores();
  }
}

function bmStepNav(delta){ bmGoStep(_bmStep + delta); }

function _bmMigrateLegacy(){
  if(!omar) return;
  omar.bmForm = omar.bmForm || {};
  const F = omar.bmForm;
  const leg = omar.bm;
  if(!leg) return;
  if(leg.termometro && !F.bm_s3_termo) F.bm_s3_termo = leg.termometro;
  if(leg.malla && !F.bm_s3_malla) F.bm_s3_malla = leg.malla;
  if(leg.obs && !F.bm_s5_obs1) F.bm_s5_obs1 = leg.obs;
  if(leg.cuerpo && !F.bm_s1_plan) F.bm_s1_plan = leg.cuerpo;
}

function poblarBmForm(){
  _bmMigrateLegacy();
  const F = omar.bmForm || {};
  BM_FORM_IDS.forEach(id=> _ds(id, F[id] != null ? F[id] : ''));
}

function leerBmForm(){
  if(!omar) return;
  const prev = omar.bmForm || {};
  const F = {};
  // AARMS sub53-fino: no pisar con vacío si memoria ya tiene dato (PDF×todos / panel no montado)
  BM_FORM_IDS.forEach(id=>{
    const dom = _dg(id);
    const hasDom = dom !== '' && dom != null && !(typeof dom === 'boolean');
    if(hasDom) F[id] = dom;
    else if(prev[id] != null && String(prev[id]).trim() !== '') F[id] = prev[id];
    else F[id] = (typeof dom === 'boolean') ? dom : '';
  });
  omar.bmForm = F;
  omar.bm = {
    cuerpo: F.bm_s1_plan || '',
    obs: F.bm_s5_obs1 || '',
    malla: F.bm_s3_malla || '',
    termometro: F.bm_s3_termo || '',
  };
}

function _bmTrimVal(v){
  if(v==null) return '';
  return String(v).trim();
}

/** Origen único: plan + hoja + OMAR + BPM en memoria (no lee el formulario BM). */
function _bmSnapshotOrigen(){
  if(!omar||!omar.ts) return {};
  const c = omar.campo || {};
  const p = typeof _planPorOmar==='function' ? _planPorOmar() : null;
  const bpm = omar.bpm || {};
  const ini = (c.ini || omar.fecha || '').trim();
  let fecha = '';
  let horaIni = '';
  if(ini.includes('T')){ const [d,t] = ini.split('T'); fecha = d; horaIni = (t||'').substring(0,5); }
  else if(ini.length >= 10) fecha = ini.substring(0,10);
  const fe = fecha || (omar.fecha||'').substring(0,10);

  const bl = omar.blmpLab || {};
  const co = omar.colabLab || {};
  const folioPlan = p && p.folio ? String(p.folio) : '—';
  const tomasArr = typeof tomas !== 'undefined' && tomas ? tomas : [];
  const nTomas = tomasArr.length;

  // AARMS lote3a: el folio BUCCVpH sale del contador del plan, no de la pantalla de laboratorio ni del BPM

  let nPh = (omar.bitPh||[]).length;
  if(typeof _bitPhRegs==='function'){
    const br=_bitPhRegs();
    if(Array.isArray(br)) nPh = br.length;
  }
  const nCd = (omar.bitCond||[]).length;
  // AARMS sub4-cons: planBm debe declararse antes de usarse (TDZ fix)
  const planBm = (typeof _planPorOmar === 'function' && _planPorOmar())
    || (typeof _planActivo === 'function' ? _planActivo() : null);
  // AARMS sub3-flujos: resumen flujos desde plan.bitFlujos (fallback t.ls)
  const bitFlujosRegs = (planBm && Array.isArray(planBm.bitFlujos) ? planBm.bitFlujos : []).filter(r => String(r.omarTs) === String(omar.ts));
  let lines;
  if(bitFlujosRegs.length && typeof _calcBitFlujosRegistro === 'function'){
    const sumaFl = typeof _flujoSumaOmar === 'function' ? _flujoSumaOmar(omar.ts) : 0;
    lines = bitFlujosRegs
      .sort((a,b) => Number(a.toma) - Number(b.toma))
      .map(reg => {
        const c = _calcBitFlujosRegistro(reg);
        const pct = (!isNaN(c.promedio) && sumaFl > 0) ? (c.promedio / sumaFl) * 100 : NaN;
        const promTxt = !isNaN(c.promedio) ? c.promedio.toFixed(2) + ' L/s' : '—';
        const pctTxt = !isNaN(pct) ? pct.toFixed(2) + '%' : '—';
        return `T${reg.toma}  ${reg.hora||'—'}  L1=${reg.l1||'—'} L2=${reg.l2||'—'} L3=${reg.l3||'—'}  Prom=${promTxt}  ${pctTxt}${reg.metodo ? '  ('+reg.metodo+')' : ''}`;
      });
  }else{
    lines = tomasArr.map((t,i)=> `T${i+1}  ${t.hora||'—'}  flujo ${t.ls||'—'}  pH ${t.ph||'—'}  cond ${t.cond||'—'}`);
  }

  const obsBlanco = _lote14cTextoBlanco(p);

  // AARMS sub21-bittemp: termómetro y procedimiento desde plan.bitTemp
  const bitTempRegs = (planBm && Array.isArray(planBm.bitTemp) ? planBm.bitTemp : []).filter(r => String(r.omarTs) === String(omar.ts));
  const procs = bitTempRegs.map(r => {
    if(typeof _calcBitTempRegistro === 'function'){
      const c = _calcBitTempRegistro(r);
      return c.procedimiento || '';
    }
    return '';
  }).filter(Boolean);
  let procFinal = '';
  let procFinalTxt = '';
  if(procs.length){
    const cuenta = {};
    procs.forEach(pp => { cuenta[pp] = (cuenta[pp] || 0) + 1; });
    procFinal = Object.entries(cuenta).sort((a,b) => b[1] - a[1])[0][0];
    procFinalTxt = typeof _tempProcedimientoLabel === 'function' ? _tempProcedimientoLabel(procFinal) : '';
  }
  const procBm = typeof _tempProcToBmSelect === 'function' ? _tempProcToBmSelect(procFinal) : procFinal;

  const snap = {
    bm_s1_fecha: fe,
    bm_s1_empresa: omar.empresa || c.emp || '',
    bm_s1_dir: omar.direccion || c.dir || '',
    bm_s1_lugar: omar.sitio || '',
    bm_s1_punto: omar.idmuestra || c.idm || '',
    bm_s1_ciudad: omar.municipio || '',
    bm_s1_estado: '',
    bm_s1_tipo: omar.tipo || c.tipo || '',
    bm_s1_nsimples: String(nTomas),
    bm_s1_analitos: (omar.analitos||[]).join(', '),
    bm_s1_lvar: _lote3aFolioLvar(p),
    bm_s1_blvm: _lote3aSoloNumero(p && p.folio),
    // AARMS lote1b: se quitó solo la frase «hoja de campo digital»
    bm_s1_plan: `En base a la BOMAR/AA/N-3 se elaboró el plan de muestreo BPM (folio de plan ${folioPlan}). Tipo: ${omar.tipo||c.tipo||'—'}. Intervalo: ${omar.intervalo||c.int||'—'}. ${nTomas} toma(s).`,
    bm_s2_bucc: typeof _codigoBitacora === 'function' ? _codigoBitacora('BUCCVpH', 'potenciometros') : 'BUCCVpH',
    bm_s2_bucc_fol: _lote3aFolioPh(p),
    bm_s2_ph_clave: _lote3aClave('potenciometros'),
    bm_s2_blmp_fol: _lote3aFolioBlmp(p),
    bm_s2_blmp: typeof _codigoBitacora === 'function' ? _codigoBitacora('BLMP', 'potenciometros') : `Phmetro limpieza · OMAR ${omar.folio||omar.ts}${bl.fecha?' · fecha '+bl.fecha:''}`,
    bm_s2_cond_ref: typeof _codigoBitacora === 'function' ? _codigoBitacora('BLMCCVUC', 'conductimetros') : `Conductímetro lab · ${co.marca||''} ${co.clave||''}`.trim(),
    bm_s3_arribo_d: fe,
    bm_s3_arribo_h: _lote3aHora(c.arribo),
    bm_s3_recibe_nom: c.fnNom || c.ate || '',
    bm_s3_recibe_puesto: c.fnCar || '',
    bm_s3_inicio_h: horaIni,
    bm_s3_periodo_h: _lote3aBandaSinH(c.int || omar.intervalo),
    bm_s3_malla: _lote3aClave('mallas'),
    bm_s3_od: c.obs || '',
    bm_s4_bhcar: '',
    bm_s4_hcar_fol: _lote3aSoloNumero(c.hcar),
    bm_s5_cciar_fol: _lote3aSoloNumero(c.cciar),
    bm_s5_bcciar: '',
    bm_s4_bitph: (p&&p.id)
      ? `Digital · Plan ${p.folio||p.id} (${nPh} reg. pH entre tomas, bitácora única del plan)`
      : `Digital · OMAR ${omar.folio||omar.ts} (${nPh} reg. pH entre tomas)`,
    bm_s4_bitcond: `Digital · OMAR ${omar.folio||omar.ts} (${nCd} reg. conductividad)`,
    bm_s4_flujos: lines.join('\n'),
    bm_s4_conserv: _bmTrimVal(bpm.f7_preserv),
    bm_s5_obs1: _lote3aObservacion(omar, p),
  };
  // AARMS sub4-cons: snapshot de matriz de conservadores
  if(typeof _machioteInicializarConservadores === 'function') _machioteInicializarConservadores(omar);
  snap.conservadoresMatriz = {
    analitos: typeof _analitosUsadosEnOmar === 'function' ? _analitosUsadosEnOmar(omar) : [],
    totalTomas: (typeof tomas !== 'undefined' && tomas ? tomas.length : 0),
    datos: (omar.machiote && omar.machiote.conservadores) || {}
  };
  // AARMS sub21-bittemp: snapshot desde plan.bitTemp
  const termoEq = typeof _equipoActivo === 'function' ? _equipoActivo('termometros') : null;
  const claveTermo = termoEq && typeof _equipoClave === 'function' ? _equipoClave('termometros', termoEq) : '';
  snap.bm_s3_termo = claveTermo;
  snap.bm_s3_proc_temp = procBm;
  snap.bm_s3_proc_temp_txt = procFinalTxt;
  if(typeof _calcBitTempRegistro === 'function' && bitTempRegs.length){
    snap.tempData = bitTempRegs
      .sort((a,b) => Number(a.toma) - Number(b.toma))
      .map(reg => {
        const c = _calcBitTempRegistro(reg);
        return {
          toma: reg.toma,
          // AARMS humofix: preferir hora de la toma
          hora: (typeof _pdfBmHoraDeToma === 'function' ? _pdfBmHoraDeToma(omar, reg) : reg.hora),
          agua_l1: reg.agua_l1, agua_l2: reg.agua_l2, agua_l3: reg.agua_l3,
          agua_c1: c.agua_c1, agua_c2: c.agua_c2, agua_c3: c.agua_c3, agua_prom: c.agua_prom,
          amb_l1: reg.amb_l1, amb_l2: reg.amb_l2, amb_l3: reg.amb_l3,
          amb_c1: c.amb_c1, amb_c2: c.amb_c2, amb_c3: c.amb_c3, amb_prom: c.amb_prom,
          diff: c.diff,
          proc: c.procedimiento,
          fc: c.fc
        };
      });
  }
  // AARMS sub3-flujos: snapshot tabla flujos desde plan.bitFlujos
  if(bitFlujosRegs.length && typeof _calcBitFlujosRegistro === 'function'){
    const sumaTotal = typeof _flujoSumaOmar === 'function' ? _flujoSumaOmar(omar.ts) : 0;
    snap.flujosData = bitFlujosRegs
      .sort((a,b) => Number(a.toma) - Number(b.toma))
      .map(reg => {
        const c = _calcBitFlujosRegistro(reg);
        const pct = (!isNaN(c.promedio) && sumaTotal > 0) ? (c.promedio / sumaTotal) * 100 : NaN;
        return {
          toma: reg.toma,
          hora: reg.hora,
          metodo: reg.metodo,
          l1: reg.l1, l2: reg.l2, l3: reg.l3,
          promedio: c.promedio,
          pct
        };
      });
  }
  return snap;
}

/**
 * @param {Record<string,string>} snap
 * @param {boolean} soloVacios - true: no pisar texto ya capturado (apertura BM). false: «Traer datos» (sobrescribe lo trazado desde origen; excepciones históricas: bfcmt_fol, od, obs1 solo si vacíos).
 */
function _bmAplicarSnapshot(snap, soloVacios){
  if(!snap) return 0;
  const onlyIfEmpty=(id)=>{
    const v=snap[id];
    if(v==null||_bmTrimVal(v)==='') return 0;
    if(_bmTrimVal(_dg(id))) return 0;
    _ds(id,v);
    return 1;
  };
  const setOrSkip=(id)=>{
    const v=snap[id];
    if(v==null||_bmTrimVal(v)==='') return 0;
    if(soloVacios && _bmTrimVal(_dg(id))) return 0;
    _ds(id,v);
    return 1;
  };
  let n=0;
  const keys=Object.keys(snap);
  const deferOnlyEmpty=new Set(['bm_s4_bfcmt_fol','bm_s3_od','bm_s5_obs1','bm_s5_bcciar']);
  keys.forEach(k=>{
    if(deferOnlyEmpty.has(k)) return;
    n+=setOrSkip(k);
  });
  deferOnlyEmpty.forEach(k=>{
    if(!Object.prototype.hasOwnProperty.call(snap,k)) return;
    n+=onlyIfEmpty(k);
  });
  return n;
}

// AARMS bmfresco: el PDF no depende del DOM. Pisar campos calculables en omar.bmForm
// aunque el panel Machiote no esté montado (sin «Traer datos»). Observaciones
// ya capturadas (misma lista que _bmAplicarSnapshot) no se reescriben.
function _bmAplicarSnapshotEnMemoria(snap){
  if(!omar || !snap) return 0;
  const prev = omar.bmForm || {};
  const next = Object.assign({}, prev);
  const manualSiLleno = new Set(['bm_s4_bfcmt_fol','bm_s3_od','bm_s5_obs1','bm_s5_bcciar']);
  let n = 0;
  BM_FORM_IDS.forEach(id => {
    if(!Object.prototype.hasOwnProperty.call(snap, id)) return;
    const v = snap[id];
    if(v == null || _bmTrimVal(v) === '') return;
    if(manualSiLleno.has(id) && _bmTrimVal(prev[id]) !== '') return;
    next[id] = v;
    n++;
  });
  omar.bmForm = next;
  return n;
}

function bmPrefillCamposVacios(){
  if(!omar||!omar.ts) return 0;
  return _bmAplicarSnapshot(_bmSnapshotOrigen(), true);
}

function aplicarBmDesdeHojaCampo(){
  if(!omar||!omar.ts){ if(typeof toast==='function') toast('Sin OMAR','w'); return; }
  _bmAplicarSnapshot(_bmSnapshotOrigen(), false);
  leerBmForm();
  if(typeof toast==='function') toast('Campos actualizados desde Hoja de campo y datos del OMAR. Revisa cada hoja antes de PDF.','g');
}

function abrirPagBm(){
  if(!omar||!omar.ts){ toast('Abre un OMAR primero','w'); return; }
  poblarBmForm();
  _lote3aOmarPintado = omar.ts;
  // AARMS lote3a: al abrir se recalcula desde las otras bitácoras
  const snapBm = _bmSnapshotOrigen();
  _bmAplicarSnapshotEnMemoria(snapBm);
  _lote3aPintarCalculados(snapBm);
  // AARMS sub4-cons: inicializar matriz desde cadena al abrir
  if(typeof _machioteInicializarConservadores === 'function') _machioteInicializarConservadores(omar);
  // AARMS sub53-fino: selector multi-OMAR
  if(typeof _bmRenderOmarSelector === 'function') _bmRenderOmarSelector();
  const pl=document.getElementById('bmPill'); if(pl && !(typeof _bmRenderOmarSelector === 'function')) pl.textContent=omar.folio?'OMAR '+omar.folio:'OMAR';
  if(typeof _aplicarDocEstadoBadge==='function') _aplicarDocEstadoBadge('bm');
  goPage('pgBm');
  if(typeof _lote5aPintar === 'function') _lote5aPintar();
}

async function guardarBmPage(){
  leerBmForm();
  try{ await saveMuestreoActual(); }catch(e){ console.warn(e); }
  toast('Bitácora de muestreo guardada','g');
}

function regenerarBMDesdeDatos(){
  aplicarBmDesdeHojaCampo();
  toast('Datos BM regenerados (usa el botón «Traer datos…» en adelante).','g');
}

// AARMS lote5a: resumen de solo lectura. El valor sale de la misma función que imprime el PDF.
function _lote5aTxt(v){
  if(v == null) return '';
  return String(v).trim();
}
function _lote5aFila(dato, valor, origen, ir){
  const v = _lote5aTxt(valor);
  return { dato, valor: v, origen, ir: ir || '', estado: v ? 'listo' : 'falta' };
}
function _lote5aLab(dato, valor){
  const v = _lote5aTxt(valor);
  return { dato, valor: v, origen: 'Bitácora de muestreo', ir: '', estado: v ? 'listo' : 'lab' };
}
function _lote5aTabla(dato, n, m, frase, origen, ir){
  const valor = n + ' de ' + m + ' ' + frase;
  const listo = m > 0 && n >= m;
  return { dato, valor, origen, ir: ir || '', estado: listo ? 'listo' : 'falta', tipo: 'tabla' };
}
function _lote5aFaltaBit(dato, origen, ir){
  return { dato, valor: '', origen, ir, estado: 'falta' };
}
function _lote5aPlan(){
  return (typeof _planPorOmar === 'function' && _planPorOmar())
    || (typeof _planActivo === 'function' ? _planActivo() : null);
}
function _lote5aCampoPh(plan){
  return (plan && plan.ph2644 && plan.ph2644.version === 2) ? plan.ph2644.campo : null;
}
function _lote5aRegsPh(plan, omarRef){
  let regs = [];
  if(typeof _bitPhRegs === 'function') regs = (_bitPhRegs() || []).slice();
  else if(plan && Array.isArray(plan.bitPh)) regs = plan.bitPh.slice();
  return regs.filter(r => r && !r.calibGrupo && (
    !r.omarId || String(r.omarId) === String(omarRef.ts) || String(r.omarTs) === String(omarRef.ts)
  ));
}
function _lote5aModelo(){
  if(!omar || !omar.ts) return [];
  const plan = _lote5aPlan();
  const snap = _bmSnapshotOrigen();
  const F = Object.assign({}, omar.bmForm || {});
  Object.keys(snap || {}).forEach(k => {
    if(_LOTE3A_MANUAL[k]) return;
    if(/^bm_/.test(k)) F[k] = snap[k];
  });
  const c = omar.campo || {};
  const fechaRaw = F.bm_s1_fecha || (plan && plan.fecha) || omar.fecha || '';
  const nTomas = (typeof tomas !== 'undefined' && tomas) ? tomas.length : (F.bm_s1_nsimples || '');
  const nEsp = (typeof tomas !== 'undefined' && Array.isArray(tomas)) ? tomas.length : 0;
  const eqPh = typeof _equipoActivo === 'function' ? _equipoActivo('potenciometros') : null;
  const eqTermo = typeof _equipoActivo === 'function' ? _equipoActivo('termometros') : null;
  const eqCond = typeof _equipoActivo === 'function' ? _equipoActivo('conductimetros') : null;
  const campoPh = _lote5aCampoPh(plan);
  const tempData = (snap && snap.tempData) || [];
  const nTemp = tempData.filter(r => r && (r.agua_l1 || r.agua_l2 || r.agua_l3 || r.amb_l1 || r.amb_l2 || r.amb_l3)).length;
  const regsPh = _lote5aRegsPh(plan, omar);
  const nPh = regsPh.filter(r => r && (r.l1 || r.l2 || r.l3)).length;
  const flujos = (plan && Array.isArray(plan.bitFlujos)) ? plan.bitFlujos.filter(r => String(r.omarTs) === String(omar.ts)) : [];
  const nFlujo = flujos.filter(r => r && (r.l1 || r.l2 || r.l3)).length;
  const conds = (plan && Array.isArray(plan.bitCond)) ? plan.bitCond.filter(r => String(r.omarId ?? '') === String(omar.ts)) : [];
  const nCond = conds.filter(r => r && (r.l1 || r.l2 || r.l3 || r.lectura)).length;
  const usados = typeof _analitosUsadosEnOmar === 'function' ? _analitosUsadosEnOmar(omar) : [];
  const vol = typeof _lote3aVolumenRequerido === 'function' ? _lote3aVolumenRequerido(omar) : 0;
  let nComp = 0;
  for(let i = 0; i < nEsp; i++){
    const q = typeof _bitFlujosPromPorToma === 'function' ? _bitFlujosPromPorToma(omar.ts, i + 1) : NaN;
    if(!isNaN(q)) nComp++;
  }
  const bdal = typeof _pdfBmHuecoLimpio === 'function' ? _pdfBmHuecoLimpio(F.bm_s2_bdal) : _lote5aTxt(F.bm_s2_bdal);
  const bfcmt = typeof _pdfBmHuecoLimpio === 'function' ? _pdfBmHuecoLimpio(F.bm_s4_bfcmt_fol) : _lote5aTxt(F.bm_s4_bfcmt_fol);
  const c1 = [
    _lote5aFila('Fecha', typeof _pdfBmFechaOficial === 'function' ? _pdfBmFechaOficial(fechaRaw) : fechaRaw, 'OMAR', 'omar'),
    _lote5aFila('Nombre de la empresa', F.bm_s1_empresa || omar.empresa || '', 'OMAR', 'omar'),
    _lote5aFila('Dirección', F.bm_s1_dir || omar.direccion || '', 'OMAR', 'omar'),
    _lote5aFila('Lugar de muestreo', F.bm_s1_lugar || omar.sitio || '', 'OMAR', 'omar'),
    _lote5aFila('Punto de muestreo', F.bm_s1_punto || omar.idmuestra || '', 'OMAR', 'omar'),
    _lote5aFila('Ciudad', F.bm_s1_ciudad || omar.municipio || '', 'OMAR', 'omar'),
    _lote5aFila('Estado', F.bm_s1_estado || omar.estado || '', 'OMAR', 'omar'),
    _lote5aFila('Tipo de muestreo', F.bm_s1_tipo || omar.tipo || '', 'OMAR', 'omar'),
    _lote5aFila('Muestras simples', nTomas === '' || nTomas == null ? '' : String(nTomas), 'Hoja de campo', 'hoja'),
    _lote5aFila('Folio del plan', plan && plan.folio ? String(plan.folio) : '', 'Plan', 'plan'),
    _lote5aFila('Folio OMAR', omar.folio || '', 'OMAR', 'omar'),
    _lote5aFila('Folio BLVM', _lote3aFolioLvar(plan), 'LVAR', 'lvar'),
    _lote5aFila('Id potenciómetro', eqPh ? String(eqPh.id) : '', 'Catálogo', 'catalogo'),
    _lote5aFila('Folio BUCCVpH', _lote3aFolioPh(plan), 'pH F-AA-264-4', 'phlab'),
    _lote5aFila('Clave del potenciómetro', _lote3aClave('potenciometros'), 'Catálogo', 'catalogo'),
    _lote5aFila('Folio BLMP', _lote3aFolioBlmp(plan), 'BLMP', 'blmp'),
    _lote5aLab('Folio BDAL', bdal),
    _lote5aFila('Hora de arribo', _lote3aHora(c.arribo), 'Hoja de campo', 'hoja'),
    _lote5aFila('Día de arribo', typeof _pdfBmFechaOficial === 'function' ? _pdfBmFechaOficial(F.bm_s3_arribo_d || fechaRaw) : (F.bm_s3_arribo_d || ''), 'Hoja de campo', 'hoja'),
    _lote5aFila('Recibió', c.fnNom || c.ate || '', 'Hoja de campo', 'hoja'),
    _lote5aFila('Puesto', c.fnCar || '', 'Hoja de campo', 'hoja'),
    _lote5aFila('Clave de la malla', _lote3aClave('mallas'), 'Catálogo', 'catalogo')
  ];
  const c2 = [
    _lote5aFila('Hora de inicio de recolección', _lote3aHora(c.ini), 'Hoja de campo', 'hoja'),
    _lote5aFila('Periodo de descarga diaria', _lote3aBandaSinH(c.int || omar.intervalo || ''), 'Hoja de campo', 'hoja'),
    _lote5aFila('Horas entre tomas', _lote3aHorasEntre(c.int || omar.intervalo || ''), 'Hoja de campo', 'hoja'),
    _lote5aFila('Clave del termómetro', _lote3aClave('termometros'), 'Catálogo', 'catalogo'),
    _lote5aTabla('Temperaturas', nTemp, nEsp, 'tomas con temperatura', 'Temperatura', 'temp'),
    _lote5aFila('Id termómetro', eqTermo ? String(eqTermo.id) : '', 'Catálogo', 'catalogo'),
    _lote5aLab('Folio BFCMT', bfcmt),
    _lote5aFila('Folio hoja de campo', _lote3aSoloNumero(c.hcar), 'Hoja de campo', 'hoja')
  ];
  const tempOmar = (plan && Array.isArray(plan.bitTemp) ? plan.bitTemp : []).filter(r => String(r.omarTs) === String(omar.ts));
  if(!tempOmar.length) c2.push(_lote5aFaltaBit('Bitácora de temperatura', 'Temperatura', 'temp'));
  const c3 = [
    _lote5aFila('Hora de la tira', (campoPh && campoPh.tira && campoPh.tira.hora) || '', 'pH F-AA-264-4', 'ph'),
    _lote5aFila('Valor de la tira', (campoPh && campoPh.tira && campoPh.tira.valor) || '', 'pH F-AA-264-4', 'ph'),
    _lote5aFila('Rango de calibración, de', (campoPh && campoPh.rango && campoPh.rango.de) || '', 'pH F-AA-264-4', 'ph'),
    _lote5aFila('Rango de calibración, a', (campoPh && campoPh.rango && campoPh.rango.a) || '', 'pH F-AA-264-4', 'ph'),
    _lote5aFila('Folio BUCCVpH entre tomas', _lote3aFolioPh(plan), 'pH F-AA-264-4', 'phlab'),
    _lote5aTabla('pH entre tomas', nPh, nEsp, 'tomas con pH', 'pH F-AA-264-4', 'ph'),
    _lote5aFila('Id conductímetro', eqCond ? String(eqCond.id) : '', 'Catálogo', 'catalogo'),
    _lote5aFila('Folio conductímetro', _lote3aFolioCond(plan, omar.colabLab), 'Conductímetro', 'cond'),
    _lote5aTabla('Conductividad', nCond, nEsp, 'tomas con conductividad', 'Conductímetro', 'cond'),
    _lote5aFila('Método de aforo', (flujos[0] && flujos[0].metodo) || '', 'Flujos', 'flujos'),
    _lote5aTabla('Flujos', nFlujo, nEsp, 'tomas con flujo', 'Flujos', 'flujos')
  ];
  const phOmar = (plan && Array.isArray(plan.bitPh) ? plan.bitPh : []).filter(r => String(r.omarId || r.omarTs || '') === String(omar.ts));
  const condOmar = (plan && Array.isArray(plan.bitCond) ? plan.bitCond : []).filter(r => String(r.omarId || '') === String(omar.ts));
  const flujoOmar = (plan && Array.isArray(plan.bitFlujos) ? plan.bitFlujos : []).filter(r => String(r.omarTs) === String(omar.ts));
  if(!phOmar.length) c3.push(_lote5aFaltaBit('Bitácora de pH', 'pH F-AA-264-4', 'ph'));
  if(!condOmar.length) c3.push(_lote5aFaltaBit('Bitácora de conductividad', 'Conductímetro', 'cond'));
  if(!flujoOmar.length) c3.push(_lote5aFaltaBit('Bitácora de flujos', 'Flujos', 'flujos'));
  const c4 = [
    _lote5aTabla('Conservadores', usados.length, usados.length ? usados.length : nEsp, 'analitos en la tabla', 'Hoja de campo', 'hoja')
  ];
  if(typeof _machioteCloroFaltantes === 'function'){
    _machioteCloroFaltantes(omar).forEach(t => c4.push(_lote5aFaltaBit(t, 'Hoja de campo', 'hoja')));
  }
  const c5 = [
    _lote5aFila('Volumen total', vol > 0 ? String(vol) : '', 'Hoja de campo', 'hoja'),
    _lote5aTabla('Muestra compuesta', nComp, nEsp, 'tomas con flujo', 'Flujos', 'flujos'),
    _lote5aFila('Folio cadena de custodia', _lote3aSoloNumero(c.cciar), 'Hoja de campo', 'hoja'),
    _lote5aFila('Observaciones', _lote3aObservacion(omar, plan), 'Hoja de campo', 'hoja')
  ];
  return [
    { titulo: 'Generales y laboratorio', filas: c1 },
    { titulo: 'Recolección y temperatura', filas: c2 },
    { titulo: 'pH, conductividad y flujos', filas: c3 },
    { titulo: 'Conservadores', filas: c4 },
    { titulo: 'Muestra compuesta y cierre', filas: c5 }
  ];
}
function _lote5aEsc(s){
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _lote5aEstado(f){
  if(f.estado === 'lab') return 'Pendiente de laboratorio';
  if(f.estado === 'falta') return 'Falta: ' + f.dato;
  return 'Listo';
}
let _lote5aAbiertas = null;
let _lote5aOmar = null;
function _lote5aPintar(){
  const host = document.getElementById('bmResumen');
  if(!host) return;
  if(!omar || !omar.ts){
    host.innerHTML = '';
    return;
  }
  if(_lote5aOmar !== omar.ts){
    _lote5aOmar = omar.ts;
    _lote5aAbiertas = null;
  }
  const cards = _lote5aModelo();
  if(!_lote5aAbiertas) _lote5aAbiertas = {};
  cards.forEach((c, i) => {
    if(c.filas.some(f => f.estado === 'falta')) _lote5aAbiertas[i] = true;
    else if(_lote5aAbiertas[i] == null) _lote5aAbiertas[i] = false;
  });
  const F = omar.bmForm || {};
  const a = document.getElementById('bm_s2_bdal');
  const b = document.getElementById('bm_s4_bfcmt_fol');
  if(a && document.activeElement !== a) a.value = F.bm_s2_bdal == null ? '' : String(F.bm_s2_bdal);
  if(b && document.activeElement !== b) b.value = F.bm_s4_bfcmt_fol == null ? '' : String(F.bm_s4_bfcmt_fol);
  host.innerHTML = cards.map((c, i) => {
    const abierta = !!_lote5aAbiertas[i];
    const filas = c.filas.map(f => {
      const est = _lote5aEstado(f);
      const col = f.estado === 'listo' ? 'var(--green)' : (f.estado === 'lab' ? 'var(--amber)' : '#f87171');
      const origen = f.ir
        ? `<button type="button" data-lote5a-ir="${_lote5aEsc(f.ir)}" style="background:none;border:none;padding:0;color:var(--acc);font-size:12px;cursor:pointer;text-align:left">${_lote5aEsc(f.origen)}</button>`
        : `<span style="font-size:12px;color:var(--g1)">${_lote5aEsc(f.origen)}</span>`;
      return `<div data-lote5a-fila="${_lote5aEsc(f.dato)}" style="display:grid;grid-template-columns:1.1fr 1.2fr .9fr .9fr;gap:8px;padding:8px 0;border-top:1px solid var(--ln);align-items:start">
        <div style="font-size:12px;color:var(--w)">${_lote5aEsc(f.dato)}</div>
        <div data-lote5a-valor style="font-size:12px;color:var(--w);word-break:break-word">${_lote5aEsc(f.valor)}</div>
        <div>${origen}</div>
        <div data-lote5a-estado style="font-size:12px;color:${col}">${_lote5aEsc(est)}</div>
      </div>`;
    }).join('');
    return `<details data-lote5a-card="${i}" ${abierta ? 'open' : ''} style="margin-bottom:10px;background:var(--bg2);border:1px solid var(--g3);border-radius:var(--r)">
      <summary style="cursor:pointer;padding:12px 14px;font-family:var(--syne);font-weight:700;color:var(--w)">${_lote5aEsc(c.titulo)}</summary>
      <div style="padding:0 14px 10px">
        <div style="display:grid;grid-template-columns:1.1fr 1.2fr .9fr .9fr;gap:8px;padding:6px 0;font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)">
          <div>Dato</div><div>Valor</div><div>Origen</div><div>Estado</div>
        </div>
        ${filas}
      </div>
    </details>`;
  }).join('');
  host.querySelectorAll('details[data-lote5a-card]').forEach(d => {
    d.addEventListener('toggle', () => {
      const i = d.getAttribute('data-lote5a-card');
      if(!_lote5aAbiertas) _lote5aAbiertas = {};
      _lote5aAbiertas[i] = d.open;
    });
  });
  if(!host.dataset.lote5aClick){
    host.dataset.lote5aClick = '1';
    host.addEventListener('click', ev => {
      const b = ev.target.closest('[data-lote5a-ir]');
      if(!b) return;
      ev.preventDefault();
      _lote5aIr(b.getAttribute('data-lote5a-ir'));
    });
  }
}
async function _lote5aIr(dest){
  if(dest === 'hoja'){ if(typeof goPage === 'function') goPage('pg1'); return; }
  if(dest === 'omar'){ if(typeof goPage === 'function') goPage('pg0'); return; }
  if(dest === 'plan'){
    const plan = _lote5aPlan();
    if(plan && typeof abrirPlanDesdeOmar === 'function') await abrirPlanDesdeOmar(plan.id);
    else if(typeof goPage === 'function') goPage('pgPlan');
    return;
  }
  if(dest === 'lvar' && typeof abrirLVAR === 'function'){ abrirLVAR(); return; }
  if(dest === 'catalogo' && typeof abrirCatalogo === 'function'){ await abrirCatalogo(); return; }
  if(dest === 'phlab' && typeof _lote4aAbrir === 'function'){ await _lote4aAbrir(); return; }
  if(dest === 'ph' && typeof abrirBitacoraPH === 'function'){ await abrirBitacoraPH(); return; }
  if(dest === 'blmp' && typeof abrirPagBlmp === 'function'){ abrirPagBlmp(); return; }
  if(dest === 'cond' && typeof abrirFlujoConductimetro === 'function'){ await abrirFlujoConductimetro({ paso:'auto', origen:'plan' }); return; }
  if(dest === 'temp' && typeof abrirBitacoraTemp === 'function'){ await abrirBitacoraTemp({ origen:'plan' }); return; }
  if(dest === 'flujos' && typeof abrirBitacoraFlujos === 'function'){ await abrirBitacoraFlujos({ origen:'plan' }); return; }
  if(dest === 'bpm' && typeof abrirPagBpm === 'function'){ abrirPagBpm(); return; }
}
async function _lote5aGuardarFolios(){
  // AARMS lote5a: solo el folio BDAL o BFCMT. No se reescribe la hoja ni las tomas.
  if(typeof leerBmForm === 'function') leerBmForm();
  if(!omar || !omar.ts) return;
  const lista = (typeof _cachedMuestreos !== 'undefined' && _cachedMuestreos) ? _cachedMuestreos : [];
  const m = lista.find(x => String(x.id) === String(omar.ts));
  if(!m || typeof idbPut !== 'function') return;
  let o = {};
  try { o = JSON.parse(m.omar || '{}'); } catch(e){ o = {}; }
  o.bmForm = omar.bmForm || {};
  o.ts = omar.ts;
  m.omar = JSON.stringify(o);
  await idbPut(m);
}
function lote5aAlFolio(){
  if(typeof leerBmForm === 'function') leerBmForm();
  clearTimeout(_lote3aSaveT);
  _lote3aSaveT = setTimeout(() => { _lote5aGuardarFolios(); }, 400);
  _lote5aPintar();
}
async function lote5aGenerar(){
  clearTimeout(_lote3aSaveT);
  // AARMS lote21d: los cuadros solo se guardan si la bitácora en pantalla es esta OMAR.
  const pgBm = document.getElementById('pgBm');
  if(pgBm && pgBm.classList.contains('on') && typeof omar !== 'undefined' && omar && omar.ts){
    await _lote5aGuardarFolios();
  }
  return generarPDFBm();
}
async function lote5aGenerarTodos(){
  clearTimeout(_lote3aSaveT);
  await _lote5aGuardarFolios();
  return generarPDFBmTodos();
}
function _lote5cHuellaActual(){
  const cards = _lote5aModelo();
  const partes = [];
  cards.forEach(c => c.filas.forEach(f => partes.push(f.dato + '\t' + f.valor)));
  return partes.join('\n');
}
window._lote5aModelo = _lote5aModelo;
window._lote5aPintar = _lote5aPintar;
window._lote5aIr = _lote5aIr;
window.lote5aAlFolio = lote5aAlFolio;
window.lote5aGenerar = lote5aGenerar;
window.lote5aGenerarTodos = lote5aGenerarTodos;
window._lote5cHuellaActual = _lote5cHuellaActual;

// AARMS sub51c-estetica: matriz conservadores F-AA-114-18 (visual premium)
// AARMS sub52-fiel: matriz conservadores — 21 filas SIEMPRE + 6 tomas SIEMPRE
// AARMS bmconserv: valores desde MACHIOTE_CONSERVADORES; cancelado tomas/analitos no usados
function _pdfBmMatrizConservadores(doc, omarRef, y, opts){
  opts = opts || {};
  const M = opts.M != null ? opts.M : 28;
  const CW = opts.CW != null ? opts.CW : (612 - M * 2);
  const H = opts.H != null ? opts.H : 792;
  const HDR = opts.HDR != null ? opts.HDR : 36;
  const MGRAY = opts.MGRAY || [208,216,228];
  const WHITE = opts.WHITE || [255,255,255];
  const ACCENT = opts.ACCENT || [37,99,235];
  const FONT = opts.FONT || 'Roboto';
  const hdr = opts.hdr;
  if(typeof _machioteInicializarConservadores === 'function') _machioteInicializarConservadores(omarRef);
  // AARMS sub52-fiel: orden exacto del oficial (21 analitos)
  const FILAS21 = [
    { key:'FQ', nombre:'Fisicoquímico' },
    { key:'TOC', nombre:'TOC' },
    { key:'Hg', nombre:'Mercurio' },
    { key:'MP', nombre:'Metales pesados' },
    { key:'CIAN', nombre:'Cianuro' },
    { key:'FOS.', nombre:'Fósforo' },
    { key:'GYA', nombre:'Grasas y Aceites' },
    { key:'DQO', nombre:'DQO' },
    { key:'DBO5', nombre:'DBO5' },
    { key:'N.TOT', nombre:'NTK' },
    { key:'NO2', nombre:'NO₂' },
    { key:'NO3', nombre:'NO₃' },
    { key:'CTYF', nombre:'Coliformes' },
    { key:'HELM', nombre:'Huevos de Helminto' },
    { key:'ENTE.', nombre:'Enterococos' },
    { key:'ECOL', nombre:'E.Coli' },
    { key:'SAAM', nombre:'SAAM' },
    { key:'CLOR', nombre:'Cloruros' },
    { key:'TOX', nombre:'Toxicidad Aguda' },
    { key:'CLR', nombre:'Color' },
    { key:'CrHx', nombre:'Cr Hexavalente' }
  ];
  const TOTAL_TOMAS = 6;
  // AARMS bmconserv: PDF calcula en vivo (Machiote nuevo); no depende de celdas viejas
  const listTomas = (typeof _machioteTomasFuente === 'function')
    ? _machioteTomasFuente(omarRef) : [];
  const nTomasUsadas = listTomas.length;
  const nameW = 72;
  const rest = CW - nameW;
  const tomaW = rest / TOTAL_TOMAS;
  const subW = tomaW / 3;
  const rh = 10;
  const drawHead = () => {
    let x = M;
    doc.setFillColor(232, 236, 240);
    doc.rect(x, y, nameW, rh * 2, 'F');
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.35);
    doc.rect(x, y, nameW, rh * 2, 'S');
    doc.setTextColor(20); doc.setFont(FONT, 'bold'); doc.setFontSize(5.5);
    doc.text('Tomas de\nmuestra'.split('\n')[0], x + nameW / 2, y + 8, { align:'center' });
    doc.text('Analito', x + nameW / 2, y + 16, { align:'center' });
    x += nameW;
    for(let i = 1; i <= TOTAL_TOMAS; i++){
      doc.setFillColor(232, 236, 240);
      doc.rect(x, y, tomaW, rh, 'F');
      doc.setDrawColor(...MGRAY); doc.rect(x, y, tomaW, rh, 'S');
      doc.setTextColor(20); doc.setFont(FONT, 'bold'); doc.setFontSize(5.5);
      doc.text('No. ' + i, x + tomaW / 2, y + 7, { align:'center' });
      ['Conservador', 'ml', 'pH'].forEach((lab, si) => {
        doc.setFillColor(232, 236, 240);
        doc.rect(x + si * subW, y + rh, subW, rh, 'F');
        doc.setDrawColor(...MGRAY); doc.rect(x + si * subW, y + rh, subW, rh, 'S');
        doc.setTextColor(20); doc.setFont(FONT, 'bold'); doc.setFontSize(4.6);
        doc.text(lab, x + si * subW + subW / 2, y + rh + 7, { align:'center' });
      });
      x += tomaW;
    }
    y += rh * 2;
  };
  drawHead();
  FILAS21.forEach((a) => {
    if(y > H - 90){
      doc.addPage();
      if(typeof hdr === 'function') hdr('Conservadores (cont.)');
      y = HDR + 10;
      drawHead();
    }
    let x = M;
    doc.setFillColor(...WHITE);
    doc.rect(x, y, nameW, rh, 'F');
    doc.setDrawColor(...MGRAY); doc.rect(x, y, nameW, rh, 'S');
    doc.setTextColor(30); doc.setFont(FONT, 'bold'); doc.setFontSize(5.4);
    // AARMS bmconserv: nombre siempre visible (sin tachar)
    doc.text(String(a.nombre).substring(0, 18), x + 2, y + 7);
    x += nameW;
    for(let i = 1; i <= TOTAL_TOMAS; i++){
      const tomaExiste = i <= nTomasUsadas;
      const enToma = tomaExiste && typeof _analitoEnToma === 'function'
        ? _analitoEnToma(omarRef, i - 1, a.key) : false;
      const celda = (enToma && typeof _machioteConservadorCelda === 'function')
        ? _machioteConservadorCelda(a.key, listTomas[i - 1])
        : { codigo: '', ml: '', ph: '' };
      ['codigo', 'ml', 'ph'].forEach((field, si) => {
        doc.setFillColor(...WHITE);
        doc.rect(x + si * subW, y, subW, rh, 'F');
        doc.setDrawColor(...MGRAY); doc.rect(x + si * subW, y, subW, rh, 'S');
        if(enToma){
          const raw = String(celda[field] || '');
          if(raw){
            doc.setTextColor(...ACCENT);
            doc.setFont(FONT, 'bold');
            doc.setFontSize(field === 'codigo' ? 5.2 : 5.6);
            doc.text(raw.substring(0, 8), x + si * subW + subW / 2, y + 7, { align:'center' });
          }
        }
      });
      // AARMS bmconserv: cancelar tomas no usadas o analito no pedido (solo celdas datos)
      if(!tomaExiste || !enToma){
        if(typeof _pdfTacharFila === 'function'){
          _pdfTacharFila(doc, x, y, tomaW, rh, { lineWidth: 0.45 });
        }
      }
      x += tomaW;
    }
    y += rh;
  });
  y += 8;
  if(y > H - 70){
    doc.addPage();
    if(typeof hdr === 'function') hdr('Códigos de conservación');
    y = HDR + 10;
  }
  // AARMS sub10-std: leyenda de conservadores en caja (wording oficial intacto)
  const leyenda =
    'Código de conservador: 1.- H₂SO₄  2.- NaOH  3.- K₂Cr₂O₇ al 25%  4.- Hielo (4°C)  5.- No Aplica  6.- HNO₃  ' +
    '7.- Bolsa Estéril con Tiosulfato  8.- HCl  9.- HNO₃ Suprapuro  10.- H₂SO₄ 25%  11.- Bolsa Estéril sin Tiosulfatos  ' +
    '12.- Disolución Buffer  13.- Formaldehído  14.- Otro＿＿＿';
  if(typeof _pdfCajaLeyenda === 'function'){
    y = _pdfCajaLeyenda(doc, leyenda, M, y, CW, FONT, { fontSize:5.8 });
  } else {
    doc.setFont(FONT, 'normal'); doc.setFontSize(5.8); doc.setTextColor(45);
    const lines = doc.splitTextToSize(leyenda, CW);
    lines.forEach(ln => { doc.text(ln, M, y); y += 7.5; });
    y += 6;
  }
  return y;
}
window._pdfBmMatrizConservadores = _pdfBmMatrizConservadores;

// ═══════════════════════════════════════════════════════════════
// AARMS sub51a-roboto + sub51b-tildes + sub51c-estetica + sub52-fiel: PDF F-AA-114-18 Machiote
// ═══════════════════════════════════════════════════════════════

const _BM_PDF = {
  // AARMS foliofix: HDR bajo bloque con FOLIO integrado (~by+bh+gap)
  W: 612, H: 792, M: 28, HDR: 98,
  NAVY: STD.NAVY, ACCENT: STD.ACCENT, LGRAY: STD.LGRAY,
  MGRAY: STD.MGRAY, WHITE: STD.WHITE, DGRAY: STD.TEXT,
  TEXTGRAY: STD.TEXT, FONT: 'Roboto',
  HDR_FILL: STD.LGRAY, MUTED: STD.MUTED, DARK: STD.DARK
};

function _bmPdfValStyle(doc, txt, ACCENT){
  const FONT = _BM_PDF.FONT;
  // AARMS sub53-fino: vacío = vacío (lab llena a mano); jamás "—"
  const isEmpty = !txt || String(txt).trim() === '' || String(txt).trim() === '-' || String(txt).trim() === '—';
  if(isEmpty){ doc.setTextColor(170, 178, 191); doc.setFont('Roboto','normal'); }
  else { doc.setTextColor(...(ACCENT || _BM_PDF.ACCENT)); doc.setFont('Roboto','bold'); }
  return isEmpty ? '' : String(txt);
}

// AARMS sub53-fino: fecha oficial DD MM AA (espacios)
function _pdfBmFechaOficial(raw){
  if(raw == null) return '';
  const s = String(raw).trim();
  if(!s || s === '—' || s === '-') return '';
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(iso) return `${iso[3]} ${iso[2]} ${iso[1].slice(-2)}`;
  const dmy = s.match(/^(\d{1,2})[\/\-.\s]+(\d{1,2})[\/\-.\s]+(\d{2,4})$/);
  if(dmy){
    const dd = String(dmy[1]).padStart(2, '0');
    const mm = String(dmy[2]).padStart(2, '0');
    const yy = dmy[3].length === 4 ? dmy[3].slice(-2) : dmy[3].padStart(2, '0');
    return `${dd} ${mm} ${yy}`;
  }
  const dt = new Date(s);
  if(!isNaN(dt.getTime()) && /[T\-]/.test(s)){
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = String(dt.getFullYear()).slice(-2);
    return `${dd} ${mm} ${yy}`;
  }
  return s;
}
window._pdfBmFechaOficial = _pdfBmFechaOficial;

// AARMS sub53-fino: hueco vacío = '' (nunca "—" / N/A)
function _pdfBmHuecoLimpio(v){
  if(v == null) return '';
  const s = String(v).trim();
  if(!s || s === '-' || s === '—' || /^N\/?A$/i.test(s)) return '';
  return s;
}
window._pdfBmHuecoLimpio = _pdfBmHuecoLimpio;

// AARMS foliofix: FOLIO dentro del bloque oscuro del membrete (nada fuera)
function _pdfBmPageHeader(doc, logo, tit2, folioOmar){
  const { W, M, HDR, FONT } = _BM_PDF;
  const folio = _pdfBmHuecoLimpio(folioOmar);
  let yTop = HDR;
  if(typeof _pdfMembreteStd === 'function'){
    yTop = _pdfMembreteStd(doc, logo, {
      docTitulo: 'BITÁCORA DE MUESTREO', // AARMS bm5fix: tilde del título oficial
      docSubtitulo: tit2 || 'Machiote',
      codigoFormato: 'F-AA-114-18',
      folio: folio, // AARMS foliofix: integrado en el bloque
      folioSiempre: true, // AARMS lote3bc: etiqueta FOLIO visible con valor en blanco
      margin: M
    }, FONT || 'Roboto');
  } else if(typeof addLogoProportional === 'function'){
    addLogoProportional(doc, logo, M, 4, 42, 28);
  }
  const sepY = Math.max(HDR - 2, (yTop || HDR) - 6);
  doc.setDrawColor(160);
  doc.setLineWidth(0.4);
  doc.line(M, sepY, W - M, sepY);
}

function _bmPdfCtx(doc, logo, omarRef){
  const C = _BM_PDF;
  const CW = C.W - C.M * 2;
  const folio = omarRef && (omarRef.folio != null ? omarRef.folio : omarRef.ts);
  const hdr = (tit2) => _pdfBmPageHeader(doc, logo, tit2, folio);
  const vs = (txt) => _bmPdfValStyle(doc, txt, C.ACCENT);
  return { ...C, CW, logo, hdr, vs, omarFolio: folio };
}

// AARMS sub51c-estetica + sub9-firma: firma con imagen dibujada
function _pdfBmFirma(doc, paginaLabel){
  // AARMS lote3ba: la firma sale del plan de esta OMAR, aunque otro plan esté abierto
  const plan = (omar && typeof getPlanDeMuestreo === 'function' && getPlanDeMuestreo(omar.ts))
    || (typeof _planActivo === 'function' && _planActivo())
    || null;
  return _pdfFirmaPremium(doc, paginaLabel, 'F-AA-114-18', {
    font: _BM_PDF.FONT || 'Roboto',
    plan
  });
}
window._pdfBmFirma = _pdfBmFirma;

// AARMS sub9-firma: firma con imagen dibujada + nombre impreso
function _pdfEstamparFirma(doc, firma, cx, lineaY, fuente, opts){
  opts = opts || {};
  const NAVY = (_BM_PDF && _BM_PDF.NAVY) || [10,22,40];
  const anchoFirma = opts.ancho || 130, altoFirma = opts.alto || 42;
  fuente = fuente || 'helvetica';

  if(firma && firma.firmaPng){
    try {
      // AARMS lote8bc: FAST evita el modo SLOW que jsPDF activa solo cuando hay compresión
      doc.addImage(firma.firmaPng, 'PNG', cx - anchoFirma/2, lineaY - altoFirma - 2, anchoFirma, altoFirma, '', 'FAST');
    } catch(e){ console.warn('[firma img]', e); }
  }

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.6);
  doc.line(cx - 70, lineaY, cx + 70, lineaY);

  const nombre = (firma && firma.nombre) ? String(firma.nombre) : (opts.rolLabel || '');
  if(nombre){
    doc.setFont(fuente, 'bold'); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
    doc.text(nombre, cx, lineaY + 11, {align:'center'});
  }
  const cargo = (firma && firma.cargo) ? String(firma.cargo) : (opts.subLabel || '');
  if(cargo){
    doc.setFont(fuente, 'normal'); doc.setFontSize(7); doc.setTextColor(90);
    doc.text(cargo, cx, lineaY + 20, {align:'center'});
  }
  if(firma && firma.fecha){
    doc.setFont(fuente, 'normal'); doc.setFontSize(6.5); doc.setTextColor(120);
    doc.text('Revisado ' + firma.fecha + (firma.hora ? (' ' + firma.hora) : ''), cx, lineaY + 28, {align:'center'});
  }
  doc.setTextColor(0);
}
window._pdfEstamparFirma = _pdfEstamparFirma;

// AARMS sub8-pdfs + sub9-firma: firma premium reutilizable (hermanos + Machiote)
function _pdfFirmaPremium(doc, paginaLabel, formatoCodigo, opts){
  opts = opts || {};
  const FONT = opts.font || _BM_PDF.FONT || 'helvetica';
  const NAVY = _BM_PDF.NAVY;
  const TEXTGRAY = _BM_PDF.TEXTGRAY;
  const W = opts.W || (doc.internal && doc.internal.pageSize ? doc.internal.pageSize.getWidth() : _BM_PDF.W);
  const H = opts.H || (doc.internal && doc.internal.pageSize ? doc.internal.pageSize.getHeight() : _BM_PDF.H);
  // AARMS sub9-firma: más aire para imagen de firma
  const y = H - (opts.yOffset || 88);
  const midLeft = W * 0.28;
  const midRight = W * 0.72;

  let plan = opts.plan || null;
  if(!plan && typeof _planActivo === 'function') plan = _planActivo();
  if(plan && typeof _firmaMuestreadorAuto === 'function') _firmaMuestreadorAuto(plan);
  const firmas = opts.firmas || (plan && plan.firmas) || {};
  const fM = firmas.muestreador || {};
  const fS = firmas.supervisor || {};

  _pdfEstamparFirma(doc, fM, midLeft, y, FONT, {
    rolLabel: fM.nombre ? '' : 'MUESTREADOR',
    subLabel: fM.nombre ? (fM.cargo || 'Muestreador') : 'Firma de responsabilidad'
  });
  _pdfEstamparFirma(doc, fS, midRight, y, FONT, {
    rolLabel: fS.nombre ? '' : 'SUPERVISOR',
    subLabel: fS.nombre ? (fS.cargo || 'Supervisor') : 'Firma de conformidad'
  });

  doc.setFont(FONT,'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
  doc.text(paginaLabel || '', W - 40, H - 30, {align:'right'});
  doc.setFont(FONT,'normal'); doc.setFontSize(6.5); doc.setTextColor(...TEXTGRAY);
  doc.text(formatoCodigo || '', W - 40, H - 20, {align:'right'});
}
window._pdfFirmaPremium = _pdfFirmaPremium;

function _bmPdfParrafo(doc, ctx, text, y, size){
  const { M, CW, H, HDR, FONT, TEXTGRAY } = ctx;
  doc.setFont('Roboto','normal'); doc.setFontSize(size || 8.5); doc.setTextColor(...(TEXTGRAY || [60,60,65]));
  const lines = doc.splitTextToSize(String(text), CW);
  lines.forEach(ln => {
    if(y > H - 90){ doc.addPage(); ctx.hdr('cont.'); y = HDR + 16; }
    doc.text(ln, M, y); y += (size || 8.5) + 2;
  });
  return y + 6;
}

function _bmPdfTitulo(doc, ctx, text, y){
  const { M, NAVY, H, HDR, FONT } = ctx;
  if(y > H - 90){ doc.addPage(); ctx.hdr('cont.'); y = HDR + 16; }
  doc.setFont('Roboto','bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text(String(text), M, y);
  return y + 14;
}

function _bmPdfSub(doc, ctx, text, y){
  const { M, ACCENT, FONT } = ctx;
  doc.setFont('Roboto','bold'); doc.setFontSize(9.5); doc.setTextColor(...ACCENT);
  doc.text(String(text), M, y);
  return y + 13;
}

// AARMS sub51c-estetica: label + valor con colores diferenciados
function _pdfLabelValor(doc, label, valor, x, y, labelWidth, fuente){
  fuente = fuente || _BM_PDF.FONT;
  doc.setFont(fuente, 'bold');
  doc.setTextColor(60);
  doc.setFontSize(9);
  doc.text(label, x, y);
  doc.setFont(fuente, 'normal');
  doc.setTextColor(..._BM_PDF.ACCENT);
  doc.text(String(valor || '—'), x + labelWidth, y);
  doc.setTextColor(0);
}
window._pdfLabelValor = _pdfLabelValor;

// AARMS sub52-fiel: párrafo narrativo con huecos estilo formato oficial
// segments: array de {t:'texto plantilla'} y {v:'valor', w:anchoMinHueco}
// Renderiza flujo continuo con word-wrap. Valores en ACCENT + subrayado.
// Valor vacío => dibuja solo la línea de subrayado de ancho w (default 60pt).
function _pdfParrafoOficial(doc, segments, x, y, maxWidth, fuente, opts){
  opts = opts || {};
  const ACCENT = opts.accent || _BM_PDF.ACCENT;
  const fs = opts.fontSize || 9;
  const lh = opts.lineHeight || 12.5;
  fuente = fuente || _BM_PDF.FONT || 'Roboto';
  doc.setFontSize(fs);

  let cx = x, cy = y;

  const flush = (palabra, esValor, anchoHueco) => {
    doc.setFont(fuente, esValor ? 'bold' : 'normal');
    const espacio = doc.getTextWidth(' ') || (fs * 0.33);
    const w = esValor && !palabra ? (anchoHueco || 60) : doc.getTextWidth(palabra || ' ');
    if(cx + w > x + maxWidth + 0.5){ cx = x; cy += lh; }

    if(esValor){
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(0.5);
      doc.line(cx, cy + 1.5, cx + w, cy + 1.5);
      if(palabra){
        doc.setFont(fuente, 'bold');
        doc.setTextColor(...ACCENT);
        doc.text(palabra, cx, cy);
      }
    } else {
      doc.setFont(fuente, 'normal');
      doc.setTextColor(50);
      doc.text(palabra, cx, cy);
    }
    cx += w + espacio;
  };

  (segments || []).forEach(seg => {
    if(seg.t !== undefined){
      String(seg.t).split(/\s+/).filter(Boolean).forEach(p => flush(p, false));
    } else if(seg.v !== undefined){
      // AARMS sub53-fino: sin dato → solo subrayado vacío (nunca "—"/N/A)
      const val = _pdfBmHuecoLimpio(seg.v);
      flush(val, true, seg.w);
    }
  });

  doc.setTextColor(0);
  return cy + lh;
}
window._pdfParrafoOficial = _pdfParrafoOficial;

// AARMS sub52-fiel: label + valor subrayado en una línea (datos generales)
function _pdfLineaHueco(doc, label, valor, x, y, maxWidth, fuente, opts){
  opts = opts || {};
  const ACCENT = opts.accent || _BM_PDF.ACCENT;
  const fs = opts.fontSize || 8.5;
  const lh = opts.lineHeight || 12;
  const lines = opts.lines || 1;
  fuente = fuente || _BM_PDF.FONT || 'Roboto';
  doc.setFontSize(fs);
  doc.setFont(fuente, 'normal');
  doc.setTextColor(50);
  doc.text(String(label || ''), x, y);
  const labelW = doc.getTextWidth(String(label || '') + ' ');
  const valX = x + labelW;
  const valW = Math.max(40, maxWidth - labelW);
  // AARMS sub53-fino: vacío = línea sola
  const val = _pdfBmHuecoLimpio(valor);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(valX, y + 1.5, valX + valW, y + 1.5);
  if(val){
    doc.setFont(fuente, 'bold');
    doc.setTextColor(...ACCENT);
    const clipped = doc.splitTextToSize(val, valW);
    doc.text(clipped[0] || '', valX, y);
    if(lines > 1 && clipped[1]){
      doc.line(x, y + lh + 1.5, x + maxWidth, y + lh + 1.5);
      doc.text(clipped[1], x, y + lh);
      return y + lh * 2;
    }
  }
  if(lines > 1){
    doc.line(x, y + lh + 1.5, x + maxWidth, y + lh + 1.5);
    return y + lh * 2;
  }
  doc.setTextColor(0);
  return y + lh;
}
window._pdfLineaHueco = _pdfLineaHueco;

// AARMS sub52-fiel: header de tabla oficial (gris claro #E8ECF0, texto negro ~6pt)
function _pdfHeaderTablaOficial(doc, headers, x, y, cellWidths, rowHeight, FONT){
  const MGRAY = _BM_PDF.MGRAY;
  FONT = FONT || _BM_PDF.FONT || 'Roboto';
  const totalWidth = cellWidths.reduce((s, w) => s + w, 0);
  const rh = rowHeight || 18;
  doc.setFillColor(232, 236, 240);
  doc.rect(x, y, totalWidth, rh, 'F');
  doc.setDrawColor(...MGRAY);
  doc.setLineWidth(0.35);
  doc.rect(x, y, totalWidth, rh, 'S');
  doc.setFont(FONT, 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(20);
  let cx = x;
  headers.forEach((h, i) => {
    const lines = String(h == null ? '' : h).split('\n');
    const startY = y + (rh - (lines.length - 1) * 6) / 2 + 2;
    lines.forEach((ln, li) => {
      doc.text(ln, cx + cellWidths[i] / 2, startY + li * 6, { align:'center' });
    });
    doc.line(cx + cellWidths[i], y, cx + cellWidths[i], y + rh);
    cx += cellWidths[i];
  });
  return y + rh;
}
window._pdfHeaderTablaOficial = _pdfHeaderTablaOficial;

// AARMS sub52-fiel: fila tabla oficial — valores ACCENT bold; vacío = blank (no "—")
function _pdfFilaTablaOficial(doc, valores, x, y, cellWidths, rowHeight, filaIdx, opts){
  opts = opts || {};
  const ACCENT = _BM_PDF.ACCENT;
  const MGRAY = _BM_PDF.MGRAY;
  const WHITE = _BM_PDF.WHITE;
  const FONT = opts.font || _BM_PDF.FONT || 'Roboto';
  const rh = rowHeight || 11;
  const totalWidth = cellWidths.reduce((s, w) => s + w, 0);
  const bg = (filaIdx % 2 === 1) ? [248, 250, 252] : WHITE;
  doc.setFillColor(...bg);
  doc.rect(x, y, totalWidth, rh, 'F');
  doc.setDrawColor(...MGRAY);
  doc.setLineWidth(0.35);
  doc.rect(x, y, totalWidth, rh, 'S');
  doc.setFontSize(opts.fontSize || 6.2);
  let cx = x;
  valores.forEach((v, i) => {
    const empty = (v === null || v === undefined || String(v).trim() === '' || String(v).trim() === '—');
    const showDash = opts.dashEmpty === true;
    const val = empty ? (showDash ? '—' : '') : String(v);
    if(val){
      doc.setFont(FONT, 'bold');
      doc.setTextColor(...ACCENT);
      const maxChars = (opts.maxCharsArr && opts.maxCharsArr[i] != null) ? opts.maxCharsArr[i] : (opts.maxChars || 12);
      doc.text(val.substring(0, maxChars), cx + cellWidths[i] / 2, y + rh / 2 + 2.2, { align:'center' });
    }
    doc.setDrawColor(...MGRAY);
    doc.line(cx + cellWidths[i], y, cx + cellWidths[i], y + rh);
    cx += cellWidths[i];
  });
  return y + rh;
}
window._pdfFilaTablaOficial = _pdfFilaTablaOficial;

function _bmPdfKV(doc, ctx, label, val, y){
  const { M, FONT, TEXTGRAY, ACCENT, vs } = ctx;
  const fuente = FONT || 'Roboto';
  doc.setFont(fuente,'normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXTGRAY);
  doc.text(label, M, y);
  const lw = doc.getTextWidth(label + ' ');
  doc.setFont(fuente,'bold'); doc.setTextColor(...ACCENT);
  doc.text(String(vs(val)).substring(0, 72), M + Math.max(lw, 118), y);
  doc.setTextColor(0);
  return y + 12;
}

// AARMS sub10-std: header de tabla premium (STD.DARK/NAVY + WHITE)
function _pdfHeaderTablaPremium(doc, headers, x, y, cellWidths, rowHeight, FONT, opts){
  opts = opts || {};
  const NAVY = (window.STD && STD.NAVY) || _BM_PDF.NAVY;
  const WHITE = (window.STD && STD.WHITE) || _BM_PDF.WHITE;
  const DARK = (window.STD && STD.DARK) || NAVY;
  const MGRAY = (window.STD && STD.MGRAY) || [208,216,228];
  FONT = FONT || _BM_PDF.FONT || 'helvetica';
  const totalWidth = cellWidths.reduce((s, w) => s + w, 0);
  doc.setFillColor(...DARK);
  doc.rect(x, y, totalWidth, rowHeight, 'F');
  // AARMS phhoja1: bordes de casilla en encabezado
  if(opts.cellBorders){
    doc.setDrawColor(...MGRAY);
    doc.setLineWidth(0.35);
    let lx = x;
    for(let i = 0; i < cellWidths.length - 1; i++){
      lx += cellWidths[i];
      doc.line(lx, y, lx, y + rowHeight);
    }
  }
  doc.setFont(FONT, 'bold');
  doc.setFontSize(opts.fontSize || Math.min(8.5, 7.2));
  doc.setTextColor(...WHITE);
  let cx = x;
  headers.forEach((h, i) => {
    doc.text(String(h), cx + cellWidths[i]/2, y + rowHeight/2 + 2.5, {align: 'center'});
    cx += cellWidths[i];
  });
  return y + rowHeight;
}
window._pdfHeaderTablaPremium = _pdfHeaderTablaPremium;

// AARMS sub10-std: fila zebra + ACCENT + vacíos MUTED
function _pdfFilaTablaPremium(doc, valores, x, y, cellWidths, rowHeight, filaIdx, opts){
  opts = opts || {};
  const NAVY = (window.STD && STD.NAVY) || _BM_PDF.NAVY;
  const ACCENT = (window.STD && STD.ACCENT) || _BM_PDF.ACCENT;
  const LGRAY = (window.STD && STD.LGRAY) || _BM_PDF.LGRAY;
  const MGRAY = (window.STD && STD.MGRAY) || _BM_PDF.MGRAY;
  const MUTED = (window.STD && STD.MUTED) || MGRAY;
  const WHITE = (window.STD && STD.WHITE) || _BM_PDF.WHITE;
  const FONT = opts.font || _BM_PDF.FONT || 'helvetica';
  const totalWidth = cellWidths.reduce((s, w) => s + w, 0);
  if(filaIdx % 2 === 1){
    doc.setFillColor(...LGRAY);
    doc.rect(x, y, totalWidth, rowHeight, 'F');
  }
  doc.setDrawColor(...MGRAY);
  doc.setLineWidth(0.4);
  doc.rect(x, y, totalWidth, rowHeight, 'S');
  // AARMS phhoja1: bordes de casilla opcionales (molde Hoja de Campo)
  if(opts.cellBorders){
    let lx = x;
    for(let i = 0; i < cellWidths.length - 1; i++){
      lx += cellWidths[i];
      doc.line(lx, y, lx, y + rowHeight);
    }
  }
  doc.setFontSize(opts.fontSize || 7.2);
  let cx = x;
  valores.forEach((v, i) => {
    // AARMS phhoja1: blankEmpty → celdas vacías en blanco (nunca "—")
    const emptyPh = opts.blankEmpty ? '' : '—';
    const rawEmpty = (v === null || v === undefined || v === '');
    const val = rawEmpty ? emptyPh : String(v);
    if(opts.firstAccent && i === 0){
      doc.setFillColor(...ACCENT);
      doc.rect(cx, y, cellWidths[i], rowHeight, 'F');
      doc.setFont(FONT, 'bold');
      doc.setTextColor(...WHITE);
    } else if(i === 0){
      doc.setFont(FONT, 'bold');
      doc.setTextColor(...NAVY);
    } else {
      doc.setFont(FONT, (val === '—' || val === '') ? 'normal' : 'bold');
      doc.setTextColor(...((val === '—' || val === '') ? MUTED : ACCENT));
    }
    if(val !== ''){
      const maxChars = (opts.maxCharsArr && opts.maxCharsArr[i] != null)
        ? opts.maxCharsArr[i]
        : (opts.maxChars || 14);
      const txt = val.substring(0, maxChars);
      if(opts.wrapCol === i && val.length > 12){
        const lines = doc.splitTextToSize(val, cellWidths[i] - 4).slice(0, 2);
        doc.setFontSize(Math.min(opts.fontSize || 7.2, 6.5));
        lines.forEach((ln, li) => {
          doc.text(ln, cx + cellWidths[i]/2, y + 7 + li * 8, {align: 'center'});
        });
        doc.setFontSize(opts.fontSize || 7.2);
      } else {
        doc.text(txt, cx + cellWidths[i]/2, y + rowHeight/2 + 2.5, {align: 'center'});
      }
    }
    cx += cellWidths[i];
  });
  return y + rowHeight;
}
window._pdfFilaTablaPremium = _pdfFilaTablaPremium;

// AARMS humofix: hora de la toma (campo), no hora de captura del reloj
function _pdfBmHoraDeToma(omarRef, reg){
  const tomaNum = Number(reg && reg.toma);
  if(!tomaNum || !reg) return (reg && reg.hora) || '';
  let list = [];
  const oid = String(reg.omarId ?? reg.omarTs ?? '');
  const refTs = String(omarRef && (omarRef.ts || omarRef.id) || '');
  if(omarRef && (!oid || oid === refTs) && typeof _machioteTomasFuente === 'function'){
    list = _machioteTomasFuente(omarRef) || [];
  } else if(typeof _bitPhTomasArrayForOmar === 'function'){
    list = _bitPhTomasArrayForOmar(reg.omarId || reg.omarTs) || [];
  }
  const t = list[tomaNum - 1];
  return (t && t.hora) || reg.hora || '';
}
window._pdfBmHoraDeToma = _pdfBmHoraDeToma;

// AARMS sub52-fiel: tabla temperaturas — columnas oficiales, SIEMPRE 6 filas
// AARMS bmtempfix: T1/T2/T3 en casillas propias (como L1/L2/L3 de pH); FC sin "+"
function _pdfBmTablaTemperaturas(doc, snapshot, y, ctx){
  const { M, CW, FONT } = ctx;
  const MGRAY = _BM_PDF.MGRAY;
  const data = (snapshot && snapshot.tempData) || [];
  const fcGlobal = typeof _fcTermometroActual === 'function' ? _fcTermometroActual() : 0;
  const fmt = (v, d) => {
    if(v == null || v === '' || (typeof v === 'number' && isNaN(v))) return '';
    return typeof v === 'number' ? v.toFixed(d == null ? 1 : d) : String(v);
  };
  // AARMS bmtempfix: FC solo número (0.00 / 0.15 / -0.15) — sin "+" forzado
  const fmtFc = (fc) => {
    if(fc == null || fc === '') return '';
    if(typeof fc === 'number' && !isNaN(fc)) return fc.toFixed(2);
    const n = parseFloat(fc);
    if(!isNaN(n)) return n.toFixed(2);
    return String(fc).replace(/^\+/, '');
  };
  const raw = [20, 18, 18, 18, 22, 18, 18, 18, 26, 26, 18, 18, 18, 22, 18, 18, 18, 26, 26, 32];
  const s = raw.reduce((a,b)=>a+b,0);
  const cws = raw.map(w => w * (CW / s));
  const rh = 10;
  const rhHead = 20;
  const totalW = cws.reduce((a,b)=>a+b,0);
  // Encabezado 2 filas: grupos + T1/T2/T3
  doc.setFillColor(232, 236, 240);
  doc.rect(M, y, totalW, rhHead, 'F');
  doc.setDrawColor(...MGRAY);
  doc.setLineWidth(0.35);
  doc.rect(M, y, totalW, rhHead, 'S');
  const groups = [
    { label: 'Toma\nNo.', span: 1 },
    { label: 'Temp. agua (°C)', span: 3, sub: true },
    { label: 'FC', span: 1 },
    { label: 'Agua corr.', span: 3, sub: true },
    { label: 'Prom', span: 1 },
    { label: 'Report\nA', span: 1 },
    { label: 'Temp. amb. (°C)', span: 3, sub: true },
    { label: 'FC', span: 1 },
    { label: 'Amb corr.', span: 3, sub: true },
    { label: 'Report\nB', span: 1 },
    { label: 'Diff\nA-B', span: 1 },
    { label: 'Proc.', span: 1 }
  ];
  let cx = M, ci = 0;
  doc.setFont(FONT, 'bold'); doc.setFontSize(5.2); doc.setTextColor(20);
  groups.forEach(g => {
    const w = cws.slice(ci, ci + g.span).reduce((a,b)=>a+b, 0);
    if(g.sub){
      doc.text(g.label, cx + w / 2, y + 7, { align:'center' });
      let sx = cx;
      ['T1','T2','T3'].forEach((lab, si) => {
        doc.setFontSize(4.8);
        doc.text(lab, sx + cws[ci + si] / 2, y + 16, { align:'center' });
        if(si < 2) doc.line(sx + cws[ci + si], y + rhHead / 2, sx + cws[ci + si], y + rhHead);
        sx += cws[ci + si];
      });
      doc.line(cx, y + rhHead / 2, cx + w, y + rhHead / 2);
    } else {
      const lines = g.label.split('\n');
      const startY = y + (rhHead - (lines.length - 1) * 5.5) / 2 + 2;
      lines.forEach((ln, li) => doc.text(ln, cx + w / 2, startY + li * 5.5, { align:'center' }));
    }
    doc.line(cx + w, y, cx + w, y + rhHead);
    cx += w;
    ci += g.span;
  });
  y += rhHead;
  for(let i = 0; i < 6; i++){
    const r = data[i] || null;
    const fc = r && r.fc != null ? r.fc : fcGlobal;
    const fcStr = r ? fmtFc(fc) : '';
    const cell = (v) => (v == null || v === '') ? '' : String(v);
    // AARMS bmtempent: Report A/B = entero más cercano (Math.round); Diff = |A−B| enteros.
    // Solo render Machiote — no toca _calcBitTempRegistro (Prom, Proc y UI siguen con precisión real).
    const reportA = (r && typeof r.agua_prom === 'number' && !isNaN(r.agua_prom)) ? Math.round(r.agua_prom) : null;
    const reportB = (r && typeof r.amb_prom === 'number' && !isNaN(r.amb_prom)) ? Math.round(r.amb_prom) : null;
    const diffRep = (reportA != null && reportB != null) ? Math.abs(reportA - reportB) : null;
    const vals = r ? [
      String(r.toma || i + 1),
      cell(r.agua_l1), cell(r.agua_l2), cell(r.agua_l3),
      fcStr,
      fmt(r.agua_c1), fmt(r.agua_c2), fmt(r.agua_c3),
      fmt(r.agua_prom, 2),
      reportA != null ? String(reportA) : '',
      cell(r.amb_l1), cell(r.amb_l2), cell(r.amb_l3),
      fcStr,
      fmt(r.amb_c1), fmt(r.amb_c2), fmt(r.amb_c3),
      reportB != null ? String(reportB) : '',
      diffRep != null ? String(diffRep) : '',
      r.proc || ''
    ] : [String(i + 1), ...Array(19).fill('')];
    const yRow = y;
    y = _pdfFilaTablaOficial(doc, vals, M, y, cws, rh, i, { fontSize:5.2, maxChars:8 });
    // AARMS bmcancelfix: filas sin dato → cancelar celdas de datos; # de toma queda visible
    if(!r && typeof _pdfTacharFila === 'function'){
      _pdfTacharFila(doc, M + cws[0], yRow, totalW - cws[0], rh);
    }
  }
  return y + 8;
}
window._pdfBmTablaTemperaturas = _pdfBmTablaTemperaturas;

// AARMS sub52-fiel: tabla pH oficial — SIEMPRE 6 filas
function _pdfBmTablaPhEntreToma(doc, plan, omarRef, y, ctx){
  const { M, CW, FONT } = ctx;
  let regs = [];
  if(typeof _bitPhRegs === 'function') regs = (_bitPhRegs() || []).slice();
  else if(plan && Array.isArray(plan.bitPh)) regs = plan.bitPh.slice();
  regs = regs.filter(r => r && !r.calibGrupo && (
    !r.omarId || String(r.omarId) === String(omarRef.ts) || String(r.omarTs) === String(omarRef.ts)
  ));
  regs = [...regs].sort((a,b) => Number(a.toma) - Number(b.toma));
  const heads = [
    'Hora',
    'No.\ntoma',
    'Lectura\naprox.',
    'Actividad',
    'Limpieza',
    'L1',
    'L2',
    'L3',
    'Acepta/\nRechaza',
    'Promedio',
    'pH\n25°C'
  ];
  const raw = [42, 28, 42, 42, 36, 32, 32, 32, 48, 42, 36];
  const s = raw.reduce((a,b)=>a+b,0);
  const cws = raw.map(w => w * (CW / s));
  const rh = 11;
  y = _pdfHeaderTablaOficial(doc, heads, M, y, cws, 18, FONT);
  for(let i = 0; i < 6; i++){
    const r = regs[i] || null;
    let vals = ['', '', '', '', '', '', '', '', '', '', ''];
    if(r){
      const prom = typeof _phPromedio === 'function' ? _phPromedio(r.l1, r.l2, r.l3) : null;
      const ph25 = r.ph25 || (typeof _phRedondeo25 === 'function' ? _phRedondeo25(prom) : '');
      let ar = '';
      if(typeof _phAceptaRechaza === 'function'){
        ar = _phAceptaRechaza(r.l1, r.l2, r.l3, r.buffer);
        if(ar === 'PENDIENTE') ar = '';
      }
      vals = [
        _pdfBmHoraDeToma(omarRef, r),
        String(r.toma || i + 1),
        r.aprox || r.lecturaAprox || r.buffer || '',
        r.act || '',
        r.limp || '',
        r.l1 || '', r.l2 || '', r.l3 || '',
        ar,
        prom != null ? prom.toFixed(2) : '',
        ph25 || ''
      ];
    }
    y = _pdfFilaTablaOficial(doc, vals, M, y, cws, rh, i, { fontSize:6, maxChars:10 });
  }
  return y + 6;
}
window._pdfBmTablaPhEntreToma = _pdfBmTablaPhEntreToma;

// AARMS sub51b-tildes + sub52-fiel: conductividad (opcional en pág 3)
function _pdfBmTablaConductividad(doc, plan, omarRef, y, ctx){
  const { M, CW, FONT } = ctx;
  let data = [];
  if(plan && Array.isArray(plan.bitCond)){
    data = plan.bitCond.filter(r =>
      String(r.omarId ?? r.omarTs ?? '') === String(omarRef.ts) && !r.calibGrupo
    );
  }
  data = [...data].sort((a,b)=>Number(a.toma)-Number(b.toma));
  const heads = ['Hora','Toma','Act','Patrón','L1','L2','L3','Prom (µS/cm)'];
  const cw = [50, 36, 36, 50, 48, 48, 48, 70];
  const sumW = cw.reduce((a,b)=>a+b,0);
  const cws = cw.map(w => w * (CW / sumW));
  const rh = 10;
  y = _pdfHeaderTablaOficial(doc, heads, M, y, cws, 14, FONT);
  for(let i = 0; i < Math.max(6, data.length); i++){
    if(i >= 6) break;
    const r = data[i];
    let vals = ['','','','','','','',''];
    if(r){
      let prom = '';
      if(typeof _bitCondPromPorToma === 'function'){
        const p = _bitCondPromPorToma(omarRef.ts, r.toma);
        prom = !isNaN(p) ? p.toFixed(1) : '';
      } else {
        const Ls = [r.l1,r.l2,r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
        if(Ls.length) prom = (Ls.reduce((a,b)=>a+b,0)/Ls.length).toFixed(1);
      }
      vals = [
        _pdfBmHoraDeToma(omarRef, r), String(r.toma || ''), r.act || '', r.patron || '',
        r.l1 || '', r.l2 || '', r.l3 || '', prom
      ];
    }
    y = _pdfFilaTablaOficial(doc, vals, M, y, cws, rh, i, { fontSize:6, maxChars:12 });
  }
  return y + 6;
}
window._pdfBmTablaConductividad = _pdfBmTablaConductividad;

// AARMS sub52-fiel: tabla flujos — 6 filas oficiales
function _pdfBmTablaFlujos(doc, plan, omarRef, y, ctx){
  const { M, CW, FONT } = ctx;
  let data = [];
  if(plan && Array.isArray(plan.bitFlujos)){
    data = plan.bitFlujos.filter(r => String(r.omarTs) === String(omarRef.ts));
  }
  data = [...data].sort((a,b) => Number(a.toma) - Number(b.toma));
  const heads = ['Hora','No.\ntoma','Procedimiento\nutilizado','L1','L2','L3','Promedio\nde lecturas'];
  const raw = [52, 32, 160, 48, 48, 48, 70];
  const s = raw.reduce((a,b)=>a+b,0);
  const cws = raw.map(w => w * (CW / s));
  const rh = 12;
  y = _pdfHeaderTablaOficial(doc, heads, M, y, cws, 16, FONT);
  for(let i = 0; i < 6; i++){
    const r = data[i] || null;
    let vals = ['','','','','','',''];
    if(r){
      const c = typeof _calcBitFlujosRegistro === 'function' ? _calcBitFlujosRegistro(r) : {};
      vals = [
        _pdfBmHoraDeToma(omarRef, r), String(r.toma || i + 1), r.metodo || '',
        r.l1 || '', r.l2 || '', r.l3 || '',
        !isNaN(c.promedio) ? c.promedio.toFixed(2) : ''
      ];
    }
    y = _pdfFilaTablaOficial(doc, vals, M, y, cws, rh, i, { fontSize:6.2, maxChars:28, maxCharsArr:[8,4,36,8,8,8,10] });
  }
  return y + 6;
}
window._pdfBmTablaFlujos = _pdfBmTablaFlujos;

// AARMS sub52-fiel: % / Q / ml — filas 1-6
// AARMS sub53-fino: + fila Σ (suma Q | 100 | suma mL)
function _pdfBmTablaCompuesta(doc, plan, omarRef, y, ctx){
  const { M, FONT } = ctx;
  const tableW = ctx.compuestaW || (ctx.CW * 0.46);
  const x0 = ctx.compuestaX != null ? ctx.compuestaX : M;
  // AARMS lote3a: el mismo total que la tabla derecha (incluye As/Se cuando aplica)
  const volTotal = _lote3aVolumenRequerido(omarRef);
  // AARMS bmfresco: sin volumen calculable no se inventan ml (antes caía a 4000)
  const heads = ['#', 'Q (L/s)', '%', 'ml'];
  const cws = [tableW * 0.15, tableW * 0.3, tableW * 0.25, tableW * 0.3];
  const rh = 10;
  doc.setFont(FONT, 'bold'); doc.setFontSize(6.5); doc.setTextColor(30);
  doc.text('Porcentaje para cada muestra simple', x0, y);
  y += 8;
  y = _pdfHeaderTablaOficial(doc, heads, x0, y, cws, 12, FONT);
  let sumQ = 0, nData = 0;
  const filasMl = [];
  for(let i = 0; i < 6; i++){
    const tomaNum = i + 1;
    const has = (typeof tomas !== 'undefined' && tomas && tomas[i]);
    let q = NaN, pct = NaN, ml = NaN;
    if(has){
      q = typeof _bitFlujosPromPorToma === 'function' ? _bitFlujosPromPorToma(omarRef.ts, tomaNum) : NaN;
      pct = typeof _flujoPctPorToma === 'function' ? _flujoPctPorToma(omarRef.ts, tomaNum) : NaN;
      ml = (volTotal > 0 && !isNaN(pct)) ? (volTotal * pct / 100) : NaN;
      if(!isNaN(q)){ sumQ += q; nData++; }
    }
    filasMl.push({ has, tomaNum, q, pct, ml });
  }
  // AARMS lote3a: el último ml absorbe el redondeo para que Σ ml = volumen requerido
  const conMl = filasMl.filter(f => !isNaN(f.ml));
  if(conMl.length && volTotal > 0){
    conMl.forEach(f => { f.ml = Math.round(f.ml); });
    const sumR = conMl.reduce((s, f) => s + f.ml, 0);
    conMl[conMl.length - 1].ml += (volTotal - sumR);
  }
  filasMl.forEach((f, i) => {
    const vals = f.has
      ? [
          String(f.tomaNum),
          !isNaN(f.q) ? f.q.toFixed(2) : '',
          !isNaN(f.pct) ? f.pct.toFixed(1) : '',
          !isNaN(f.ml) ? String(f.ml) : ''
        ]
      : [String(f.tomaNum), '', '', ''];
    const yRow = y;
    y = _pdfFilaTablaOficial(doc, vals, x0, y, cws, rh, i, { fontSize:6.5, maxChars:10 });
    if(!f.has && typeof _pdfTacharFila === 'function'){
      _pdfTacharFila(doc, x0 + cws[0], yRow, tableW - cws[0], rh);
    }
  });
  const sigmaVals = nData > 0
    ? ['Σ', sumQ.toFixed(2).replace(/\.00$/, ''), '100', volTotal > 0 ? String(volTotal) : '']
    : ['Σ', '', '', ''];
  y = _pdfFilaTablaOficial(doc, sigmaVals, x0, y, cws, rh + 1, 99, { fontSize:6.5, maxChars:10 });
  return { y: y + 4, volTotal };
}
window._pdfBmTablaCompuesta = _pdfBmTablaCompuesta;

// AARMS sub52-fiel: volúmenes por parámetro (lado derecho)
// AARMS sub53-fino: ✓ azul si requerido; raya diagonal si no; Vol Total solo requeridos
function _pdfBmTablaVolumenesParametros(doc, plan, omarRef, y, ctx){
  const { FONT } = ctx;
  const ACCENT = _BM_PDF.ACCENT;
  const MGRAY = _BM_PDF.MGRAY;
  const WHITE = _BM_PDF.WHITE;
  const tableW = ctx.volumenesW || (ctx.CW * 0.48);
  const x0 = ctx.volumenesX != null ? ctx.volumenesX : ctx.M;
  const TABLA = [
    ['FQ', 'Fisicoquímico', 4000],
    ['MP', 'Metales pesados', 500],
    ['AsSe', 'Arsénico/Selenio', 250],
    ['CIAN', 'Cianuro', 1000],
    ['FOS.', 'Fósforo', 500],
    ['DQO', 'DQO', 500],
    ['DBO5', 'DBO5', 1000],
    ['SAAM', 'SAAM', 1000],
    ['N.TOT', 'NTK', 2000],
    ['NO2', 'NO₂', 500],
    ['NO3', 'NO₃', 500],
    ['Hg', 'Mercurio', 500],
    ['HELM', 'Huevos de Helminto', 5000],
    ['TOC', 'TOC', 1000],
    ['CLOR', 'Cloruros', 500],
    ['CLR', 'Color', 250],
    ['CrHx', 'Cr Hexavalente', 500]
  ];
  let paramsUsados = new Set();
  (tomas || []).forEach(t => {
    const ps = t.params instanceof Set ? [...t.params] : (t.params || []);
    ps.forEach(p => paramsUsados.add(p));
  });
  (omarRef.analitos || []).forEach(a => paramsUsados.add(a));
  const heads = ['Parámetro', 'Requerido', 'Volumen (ml)'];
  const cws = [tableW * 0.5, tableW * 0.22, tableW * 0.28];
  const rh = 9;
  doc.setFont(FONT, 'bold'); doc.setFontSize(6.2); doc.setTextColor(30);
  doc.text('Cantidad de muestra simple para conformar compuesta', x0, y);
  y += 8;
  y = _pdfHeaderTablaOficial(doc, heads, x0, y, cws, 12, FONT);
  let total = 0;
  TABLA.forEach((row, ri) => {
    const [key, nom, vol] = row;
    const aplica = key === 'AsSe'
      ? (paramsUsados.has('MP') || paramsUsados.has('Hg'))
      : paramsUsados.has(key);
    if(aplica) total += vol;
    const totalWidth = cws.reduce((s, w) => s + w, 0);
    const bg = (ri % 2 === 1) ? [248, 250, 252] : WHITE;
    doc.setFillColor(...bg);
    doc.rect(x0, y, totalWidth, rh, 'F');
    doc.setDrawColor(...MGRAY);
    doc.setLineWidth(0.35);
    doc.rect(x0, y, totalWidth, rh, 'S');
    let cx = x0;
    // Parámetro
    doc.setFont(FONT, 'bold');
    doc.setFontSize(5.6);
    doc.setTextColor(...ACCENT);
    doc.text(String(nom).substring(0, 22), cx + cws[0] / 2, y + rh / 2 + 2.2, { align:'center' });
    doc.line(cx + cws[0], y, cx + cws[0], y + rh);
    cx += cws[0];
    // Requerido
    if(aplica){
      // AARMS sub53-fino: ✓ dibujada (glifo U+2713 ausente en subset Roboto)
      const midX = cx + cws[1] / 2;
      const midY = y + rh / 2 + 1.2;
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(1.05);
      doc.line(midX - 3.2, midY - 0.3, midX - 0.9, midY + 2.3);
      doc.line(midX - 0.9, midY + 2.3, midX + 4.0, midY - 2.6);
    }
    doc.line(cx + cws[1], y, cx + cws[1], y + rh);
    cx += cws[1];
    // Volumen: visible solo si aplica; si no, se tacha con diagonal
    if(aplica){
      doc.setFont(FONT, 'bold');
      doc.setFontSize(5.6);
      doc.setTextColor(...ACCENT);
      doc.text(String(vol), cx + cws[2] / 2, y + rh / 2 + 2.2, { align:'center' });
    }
    // AARMS sub53-fino: raya diagonal sobre Requerido+Volumen si NO aplica
    if(!aplica){
      const xL = x0 + cws[0];
      const xR = x0 + totalWidth;
      doc.setDrawColor(150, 155, 165);
      doc.setLineWidth(0.55);
      doc.line(xL + 1, y + rh - 1, xR - 1, y + 1);
    }
    y += rh;
  });
  const totalLabel = 'Volumen Total de muestra mL.';
  const totalOficial = _lote3aVolumenRequerido(omarRef);
  const totalVal = totalOficial > 0 ? String(totalOficial) : '';
  y = _pdfFilaTablaOficial(doc, [totalLabel, '', totalVal], x0, y, cws, rh + 1, 99, { fontSize:5.5, maxChars:28 });
  return { y: y + 4, total: totalOficial };
}
window._pdfBmTablaVolumenesParametros = _pdfBmTablaVolumenesParametros;

// AARMS sub52-fiel: Pág 1 — narrativa oficial con huecos
async function _pdfBmPag1(doc, plan, omarRef, snapshot, ctx){
  const { M, W, HDR, NAVY, FONT, CW } = ctx;
  const ACCENT = _BM_PDF.ACCENT;
  ctx.hdr('Pág. 1/5');
  let y = HDR + 10;
  const po = (segs) => { y = _pdfParrafoOficial(doc, segs, M, y, CW, FONT, { fontSize:8, lineHeight:11, accent:ACCENT }); };
  const tit = (t, size) => {
    doc.setFont(FONT, 'bold'); doc.setFontSize(size || 10); doc.setTextColor(...NAVY);
    doc.text(t, M, y); y += (size || 10) + 3;
  };
  const titC = (t, size) => {
    doc.setFont(FONT, 'bold'); doc.setFontSize(size || 10); doc.setTextColor(...NAVY);
    doc.text(t, W / 2, y, { align:'center' }); y += (size || 10) + 4;
  };

  doc.setFont(FONT, 'bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
  doc.text('Bitácora de Muestreo', W / 2, y, { align:'center' });
  y += 14;

  const F = omarRef.bmForm || {};
  const fechaRaw = F.bm_s1_fecha || plan.fecha || omarRef.fecha || '';
  // AARMS sub53-fino: Fecha: DD MM AA
  const fecha = _pdfBmFechaOficial(fechaRaw);
  const anio2 = String(new Date().getFullYear()).slice(-2);
  y = _pdfLineaHueco(doc, 'Fecha:', fecha, M, y, CW * 0.45, FONT, { fontSize:8.5 });
  y += 2;
  tit('Datos Generales', 10);
  y = _pdfLineaHueco(doc, 'Nombre de la empresa:', F.bm_s1_empresa || omarRef.empresa || '', M, y, CW, FONT, { fontSize:8 });
  y = _pdfLineaHueco(doc, 'Dirección:', F.bm_s1_dir || omarRef.direccion || '', M, y, CW, FONT, { fontSize:8, lines:2 });
  y = _pdfLineaHueco(doc, 'Lugar de muestreo:', F.bm_s1_lugar || omarRef.sitio || '', M, y, CW, FONT, { fontSize:8 });
  y = _pdfLineaHueco(doc, 'Punto de muestreo:', F.bm_s1_punto || omarRef.idmuestra || '', M, y, CW, FONT, { fontSize:8 });
  // Ciudad + Estado misma línea
  const mitad = CW * 0.52;
  const yCiudad = _pdfLineaHueco(doc, 'Ciudad:', F.bm_s1_ciudad || omarRef.municipio || '', M, y, mitad - 8, FONT, { fontSize:8 });
  _pdfLineaHueco(doc, 'Estado:', F.bm_s1_estado || omarRef.estado || '', M + mitad, y, CW - mitad, FONT, { fontSize:8 });
  y = yCiudad + 2;

  const nTomas = (typeof tomas !== 'undefined' && tomas) ? tomas.length : (F.bm_s1_nsimples || '');
  const blvm = _lote3aFolioLvar(plan);

  po([
    { t:'En base a la Bitácora de orden de muestreo BOMAR/AA/N-3 se procede a elaborar el plan de muestreo el cual queda asentado en la bitácora BPM/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:', en el folio No.:' },
    { v: plan.folio, w: 70 },
    { t:'.' }
  ]);
  po([
    { t:'Se realizará un muestreo del tipo' },
    { v: F.bm_s1_tipo || omarRef.tipo, w: 50 },
    { t:', de' },
    { v: nTomas, w: 28 },
    { t:'muestras simples, de las cuales se determinarán los parámetros citados en la Bitácora de orden de muestreo BOMAR/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:', con folio No.' },
    { v: omarRef.folio, w: 70 },
    { t:'.' }
  ]);
  po([
    { t:'Se procede a llenar la Bitácora de lista de verificación de material de muestreo BLVM/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'folio' },
    { v: blvm, w: 60 },
    { t:', en donde se asientan las claves de los equipos, así como las características de reactivos: marca, lote y caducidad, y las disoluciones empleadas en la calibración del potenciómetro.' }
  ]);

  titC('PROCEDIMIENTO EN LABORATORIO', 10);
  tit('pH metro', 9);
  tit('Calibración, Comprobación y Verificación.', 8.5);

  const eqPh = typeof _equipoActivo === 'function' ? _equipoActivo('potenciometros') : null;
  const idPh = eqPh ? String(eqPh.id) : '';
  const folioPh = _lote3aFolioPh(plan);
  po([
    { t:'El uso, calibración, comprobación y verificación del equipo se encuentra registrada en la bitácora con código BUCCVpH' },
    { v: idPh, w: 36 },
    { t:'/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:', folio:' },
    { v: folioPh, w: 60 },
    { t:'.' }
  ]);

  tit('Limpieza y Mantenimiento', 9);
  const clavePh = _lote3aClave('potenciometros');
  const idBlmp = idPh;
  // AARMS sub53-fino: folio BLMP/BDAL texto libre (ej. 0025-0026); vacío = subrayado solo
  const blmpFol = _lote3aFolioBlmp(plan);
  const bdalFolio = _pdfBmHuecoLimpio(F.bm_s2_bdal) || _pdfBmHuecoLimpio(plan && plan.bdalFolio);
  po([
    { t:'La limpieza y mantenimiento del equipo con clave:' },
    { v: clavePh, w: 70 },
    { t:'; se encuentra registrada en la bitácora BLMP' },
    { v: idBlmp, w: 36 },
    { t:'/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'folio:' },
    { v: blmpFol, w: 70 },
    { t:'. Y las disoluciones están registradas en la bitácora BDAL/AA/N-3/01 Folio' },
    { v: bdalFolio, w: 70 },
    { t:'.' }
  ]);

  tit('Arribo a Sitio de Muestreo', 9);
  po([
    { t:'Siendo las' },
    { v: _lote3aHora((omarRef.campo && omarRef.campo.arribo) || ''), w: 40 },
    { t:'h. del día' },
    // AARMS sub53-fino: arribo en DD MM AA
    { v: _pdfBmFechaOficial(F.bm_s3_arribo_d || fechaRaw), w: 70 },
    { t:', fuimos recibidos por el Sr (a)' },
    { v: (omarRef.campo && (omarRef.campo.fnNom || omarRef.campo.ate)) || '', w: 90 },
    { t:'que ocupa el puesto' },
    { v: (omarRef.campo && omarRef.campo.fnCar) || '', w: 80 },
    { t:'de la empresa antes mencionada y misma que nos da acceso al sitio de muestreo.' }
  ]);

  tit('Procedimiento para la recolección de muestra', 9);
  po([
    { t:'Para la recolección de las muestras se cuenta con el procedimiento descrito en el Manual de Muestreo AR (MMAR/AA/N-2), la contención y conservación de las muestras se describe en la tabla ubicada en el punto 8 del manual de muestreo. Los analitos a determinar son los citados en la Bitácora de orden de muestreo BOMAR/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'con folio No.' },
    { v: omarRef.folio, w: 70 },
    // AARMS bm5fix: texto oficial de modificaciones (después de los analitos de la BOMAR)
    { t:'. En caso de tener modificaciones en la petición de analitos en campo estos solo quedarán asentados en la hoja de campo correspondiente' }
  ]);
  // AARMS bmfresco: texto oficial de OD (informativo; no se registran datos de OD aquí)
  po([
    { t:'Si el cliente solicita oxígeno disuelto esta determinación se realiza inmediatamente al llegar al laboratorio, se debe evitar que la muestra se agite o entre en contacto con el aire, de acuerdo con el procedimiento descrito en el Manual de Muestreo AR (MMAR/AA/N-2)' }
  ]);
  const claveMalla = _lote3aClave('mallas');
  po([
    { t:'Para la Materia flotante se utiliza la Malla con clave' },
    { v: claveMalla, w: 70 },
    { t:', y siguiendo los procedimientos del Manual de Muestreo AR (MMAR/AA/N-2), se registra resultado en la hoja de campo.' }
  ]);

  _pdfBmFirma(doc, 'Pág. 1 de 5');
}
window._pdfBmPag1 = _pdfBmPag1;

// AARMS sub52-fiel: Pág 2 — recolección + 3 procedimientos + tabla temp
async function _pdfBmPag2(doc, plan, omarRef, snapshot, ctx){
  const { M, HDR, FONT, CW, NAVY } = ctx;
  const ACCENT = _BM_PDF.ACCENT;
  ctx.hdr('Pág. 2/5');
  let y = HDR + 10;
  const po = (segs) => { y = _pdfParrafoOficial(doc, segs, M, y, CW, FONT, { fontSize:8, lineHeight:10.5, accent:ACCENT }); };
  const tit = (t) => {
    doc.setFont(FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text(t, M, y); y += 11;
  };
  const F = omarRef.bmForm || {};
  const anio2 = String(new Date().getFullYear()).slice(-2);

  po([
    // AARMS bm5fix: el manual de muestreo es MMAR/AA/N-2, igual que el resto del documento
    { t:'Para determinación de pH, Conductividad Eléctrica y Temperatura, se realiza siguiendo los procedimientos citados en el manual de muestreo con clave MMAR/AA/N-2, se registra resultado en la hoja de campo.' }
  ]);

  tit('Recolección de muestras');
  po([
    { t:'Siendo las' },
    { v: _lote3aHora((omarRef.campo && omarRef.campo.ini) || ''), w: 40 },
    { t:'h, se inicia la recolección de muestras. El periodo de descarga diaria es de:' },
    { v: _lote3aBandaSinH((omarRef.campo && omarRef.campo.int) || omarRef.intervalo || ''), w: 40 },
    { t:'h, por lo tanto, la recolección de la(s) muestra(s) será en periodos de tiempo de' },
    { v: _lote3aHorasEntre((omarRef.campo && omarRef.campo.int) || omarRef.intervalo || ''), w: 40 },
    { t:'h, entre tomas.' }
  ]);

  const eqTermo = typeof _equipoActivo === 'function' ? _equipoActivo('termometros') : null;
  const claveTermo = _lote3aClave('termometros');
  po([
    { t:'Para la medición de temperatura, se utiliza el termómetro con clave:' },
    { v: claveTermo, w: 70 },
    { t:', se procede a tomar la temperatura de medio ambiente y del cuerpo de agua, utilizando uno de los siguientes procedimientos:' }
  ]);
  // AARMS sub52-fiel: LOS 3 procedimientos exactos del oficial
  const procs = [
    '- La lectura se realiza directamente en el sitio de la descarga.',
    '- La lectura no se puede realizar en el sitio de la descarga y la temperatura del agua y la del medio ambiente no difiere en más de 5°C, se procede a utilizar un recipiente de polietileno.',
    '- La lectura no se puede realizar en el sitio de la descarga y la temperatura del agua y la del medio ambiente difiere en más de 5°C, se procede a utilizar un vaso Dewar.'
  ];
  doc.setFont(FONT, 'normal'); doc.setFontSize(7.5); doc.setTextColor(50);
  procs.forEach(p => {
    const lines = doc.splitTextToSize(p, CW);
    lines.forEach(ln => { doc.text(ln, M, y); y += 9; });
    y += 1;
  });
  y += 2;

  y = _pdfBmTablaTemperaturas(doc, snapshot, y, ctx);

  const idTermo = eqTermo ? String(eqTermo.id) : '';
  po([
    { t:'FC es el factor de corrección para las mediciones de temperatura. Se tomó de la bitácora BFCMT' },
    { v: idTermo, w: 36 },
    { t:'/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:', del folio' },
    { v: F.bm_s4_bfcmt_fol, w: 50 },
    { t:'.' }
  ]);

  tit('pH metro');
  doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
  doc.text('Calibración, Comprobación y Verificación.', M, y); y += 10;

  const eqPh = typeof _equipoActivo === 'function' ? _equipoActivo('potenciometros') : null;
  const clavePh2 = _lote3aClave('potenciometros');
  const idPh = eqPh ? String(eqPh.id) : '';
  // AARMS lote4c: hora, valor de tira y rango salen del campo del plan. Sin campo, en blanco.
  const _phPlanC = (omarRef && omarRef.ts && typeof getPlanDeMuestreo === 'function') ? getPlanDeMuestreo(omarRef.ts) : null;
  const _campoC = (_phPlanC && _phPlanC.ph2644 && _phPlanC.ph2644.version === 2) ? _phPlanC.ph2644.campo : null;
  const rangoMin = (_campoC && _campoC.rango && _campoC.rango.de) || '';
  const rangoMax = (_campoC && _campoC.rango && _campoC.rango.a) || '';
  const tiraHoraC = (_campoC && _campoC.tira && _campoC.tira.hora) || '';
  const tiraValC = (_campoC && _campoC.tira && _campoC.tira.valor) || '';
  po([
    { t:'Siendo las' },
    { v: tiraHoraC, w: 40 },
    { t:'h se procede a determinar pH utilizando una tira reactiva dando un valor aproximado:' },
    { v: tiraValC, w: 36 },
    { t:'. Derivado de esta medición, se procede a calibrar el equipo con clave:' },
    { v: clavePh2, w: 70 },
    { t:'en el rango de:' },
    { v: rangoMin, w: 28 },
    { t:'a' },
    { v: rangoMax, w: 28 },
    { t:', el uso, calibración, comprobación y verificación del equipo se encuentra registrada en la bitácora con código BUCCVpH' },
    { v: idPh, w: 36 },
    { t:'/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'; folio:' },
    { v: _lote3aFolioPh(plan), w: 70 },
    { t:'.' }
  ]);

  po([
    { t:'Los criterios para realizar calibración o solamente verificación en los puntos subsecuentes a la toma de inicio del muestreo son los siguientes:' }
  ]);
  po([
    { t:'1.- Se calibra, comprueba y verifica la calibración utilizando MCR, si el pH de la descarga no se encuentra dentro del intervalo en el que se calibró el equipo inicialmente.' }
  ]);
  po([
    { t:'2.- Se verifica utilizando muestras control si el pH de la descarga se mantiene dentro del intervalo de pH donde se calibró el equipo.' }
  ]);

  po([
    { t:'Los datos generados complementarios al muestreo quedan asentados en la Bitácora de hoja de campo BHCAR/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'con folio No.' },
    { v: _lote3aSoloNumero(omarRef.campo && omarRef.campo.hcar), w: 70 },
    { t:'.' }
  ]);

  _pdfBmFirma(doc, 'Pág. 2 de 5');
}
window._pdfBmPag2 = _pdfBmPag2;

// AARMS sub52-fiel: Pág 3 — pH / Cond / Flujos / Cálculos en blanco
async function _pdfBmPag3(doc, plan, omarRef, snapshot, ctx){
  const { M, HDR, FONT, CW, NAVY } = ctx;
  const ACCENT = _BM_PDF.ACCENT;
  ctx.hdr('Pág. 3/5');
  let y = HDR + 8;
  const po = (segs) => { y = _pdfParrafoOficial(doc, segs, M, y, CW, FONT, { fontSize:7.5, lineHeight:10, accent:ACCENT }); };
  const tit = (t) => {
    doc.setFont(FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text(t, M, y); y += 10;
  };
  const F = omarRef.bmForm || {};
  const anio2 = String(new Date().getFullYear()).slice(-2);

  po([
    { t:'El registro de las actividades que se realizan entre cada toma de muestra, referentes a la determinación de pH se encuentra en la siguiente tabla.' }
  ]);

  y = _pdfBmTablaPhEntreToma(doc, plan, omarRef, y, ctx);

  doc.setFont(FONT, 'normal'); doc.setFontSize(5.8); doc.setTextColor(80);
  const notes = [
    'Criterio de aceptación de lecturas de muestra: No debe haber una diferencia mayor a 0.03 unidades de pH entre lecturas independientes realizadas',
    'Código de actividad de control: Ca = Calibración  Co = Comprobación  V = Verificación',
    'Código de Limpieza: 1.- Agua tridestilada  2.- Detergente suave  3.- Disolución de HCl 1:1',
    'Nota: La lectura aproximada de pH se puede realizar con tiras comerciales, papel pH o cualquier otro medio que el laboratorio autorice.'
  ];
  notes.forEach(n => {
    const ls = doc.splitTextToSize(n, CW);
    ls.forEach(ln => { doc.text(ln, M, y); y += 7; });
  });
  y += 2;

  const eqPh = typeof _equipoActivo === 'function' ? _equipoActivo('potenciometros') : null;
  const idPh = eqPh ? String(eqPh.id) : '';
  po([
    { t:'El registro del uso, calibración, comprobación y/o verificación que se realizó entre cada toma de muestra se encuentra en la bitácora BUCCVpH' },
    { v: idPh, w: 36 },
    { t:'/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'en el folio:' },
    { v: _lote3aFolioPh(plan), w: 70 },
    { t:'.' }
  ]);

  tit('Conductividad');
  const eqCond = typeof _equipoActivo === 'function' ? _equipoActivo('conductimetros') : null;
  const idCond = eqCond ? String(eqCond.id) : '';
  // AARMS bm5fix: mismo mecanismo que folioPh (folio ya guardado del doc oficial). El texto fijo de arriba no cambia.
  const folioCond = _lote3aFolioCond(plan, omarRef.colabLab);
  po([
    { t:'La evidencia de la limpieza, calibración, comprobación, verificación y uso del conductímetro se encuentra registrada en la Bitácora de Limpieza, Mantenimiento, Calibración, Comprobación, Verificación y Uso del Conductímetro BLMCCVUC' },
    { v: idCond, w: 36 },
    { t:'/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'en el folio:' },
    { v: folioCond, w: 50 },
    { t:'.' }
  ]);

  tit('Reporte de Flujos');
  const primerFlujo = ((plan && plan.bitFlujos) || []).find(r => String(r.omarTs) === String(omarRef.ts));
  const metodo = (primerFlujo && primerFlujo.metodo) || '';
  po([
    { t:'En la siguiente tabla se registran las lecturas de los flujos obtenidos durante el muestreo de la descarga, a continuación, se refiere el método de aforo utilizado:' }
  ]);
  // AARMS sub52-fiel: hueco LARGO de 2 renglones para método
  y = _pdfLineaHueco(doc, '', metodo, M, y, CW, FONT, { fontSize:8, lines:2 });
  y += 2;

  y = _pdfBmTablaFlujos(doc, plan, omarRef, y, ctx);

  // AARMS sub10-std: hueco de Cálculos en caja con barra (contenido en blanco oficial)
  const yCalc0 = y;
  y = _pdfBarraSeccion(doc, 'Calculos', M, y, CW, FONT);
  const yCalcCuerpo = y;
  y += 90;
  _pdfCajaBorde(doc, M, yCalc0, CW, y - yCalc0);
  _pdfTacharFila(doc, M, yCalcCuerpo, CW, y - yCalcCuerpo);
  y += 6;

  _pdfBmFirma(doc, 'Pág. 3 de 5');
}
window._pdfBmPag3 = _pdfBmPag3;

// AARMS sub52-fiel: Pág 4 — matriz 21×6
async function _pdfBmPag4(doc, plan, omarRef, snapshot, ctx){
  const { M, HDR, NAVY, CW, H, MGRAY, LGRAY, WHITE, ACCENT, DGRAY, FONT } = ctx;
  ctx.hdr('Pág. 4/5');
  let y = HDR + 10;
  doc.setFont(FONT, 'bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text('Tabla de registros de uso de conservadores:', M, y);
  y += 12;
  y = _pdfBmMatrizConservadores(doc, omarRef, y, {
    M, CW, H, HDR: ctx.HDR, NAVY, DGRAY, WHITE, MGRAY, LGRAY, ACCENT, FONT,
    hdr: (t) => ctx.hdr(t || 'Conservadores')
  });
  _pdfBmFirma(doc, 'Pág. 4 de 5');
}
window._pdfBmPag4 = _pdfBmPag4;

// AARMS sub52-fiel: Pág 5 — compuesta lado a lado + Obs subrayadas
async function _pdfBmPag5(doc, plan, omarRef, snapshot, ctx){
  const { M, W, HDR, FONT, CW, NAVY } = ctx;
  const ACCENT = _BM_PDF.ACCENT;
  ctx.hdr('Pág. 5/5');
  let y = HDR + 8;
  const po = (segs) => { y = _pdfParrafoOficial(doc, segs, M, y, CW, FONT, { fontSize:7.5, lineHeight:10, accent:ACCENT }); };
  const F = omarRef.bmForm || {};
  const anio2 = String(new Date().getFullYear()).slice(-2);

  doc.setFont(FONT, 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVY);
  doc.text('Preparación de la muestra compuesta', M, y);
  y += 12;
  po([
    { t:'Una vez realizado cada uno de los muestreos se procede a calcular la porción de muestra que cada monitoreo simple aporta a la muestra compuesta, esto se realiza utilizando la herramienta matemática del porciento ponderado el cual se basa en el flujo de descarga al momento de efectuar la toma simple.' }
  ]);

  // AARMS sub52-fiel: DOS TABLAS LADO A LADO
  const gap = 10;
  const leftW = CW * 0.42;
  const rightW = CW - leftW - gap;
  const yTop = y;
  const left = _pdfBmTablaCompuesta(doc, plan, omarRef, yTop, { ...ctx, compuestaX: M, compuestaW: leftW });
  const right = _pdfBmTablaVolumenesParametros(doc, plan, omarRef, yTop, { ...ctx, volumenesX: M + leftW + gap, volumenesW: rightW });
  y = Math.max(left.y, right.y) + 4;

  doc.setFont(FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(60);
  doc.text('Para calcular Vol. de cada muestra simple: V= (Volumen total requerido * %) /100', M, y);
  y += 12;

  // AARMS sub10-std: Ejemplo de cálculo en caja (hueco oficial)
  const yEj0 = y;
  y = _pdfBarraSeccion(doc, 'Ejemplo de calculo', M, y, CW, FONT);
  const yEjCuerpo = y;
  y += 70;
  _pdfCajaBorde(doc, M, yEj0, CW, y - yEj0);
  _pdfTacharFila(doc, M, yEjCuerpo, CW, y - yEjCuerpo);
  y += 6;

  po([
    { t:'Para la preparación de la muestra compuesta se utiliza una probeta para la medición de los volúmenes calculados en el cuadro anterior. Para grasas y aceites y Coliformes no aplica la preparación de muestra compuesta. Como muestra de resguardo se utiliza el sobrante de la muestra de Fisicoquímicos. Posteriormente se trasvasa y preserva conforme a F-AA-01A-3, se etiquetan los envases y se colocan en hielera a 4°C ± 2°C.' }
  ]);

  po([
    { t:'Ver Bitácora de Cadena de Custodia Interna AR, BCCIAR/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'con folio' },
    { v: _lote3aSoloNumero(omarRef.campo && omarRef.campo.cciar), w: 70 },
    { t:'.' }
  ]);

  // AARMS sub10-std: Observaciones en caja con líneas (formato oficial)
  // AARMS bm5fix: aire bajo la barra, igual que la caja de observaciones de pH/BLMP
  const yObs0 = y;
  y = _pdfBarraSeccion(doc, 'Observaciones', M, y, CW, FONT);
  const obsFs = 8;
  const obsPad = 6;
  y += 4 + obsPad;
  const obsTxt = _lote3aObservacion(omarRef, plan);
  const obsParts = obsTxt ? doc.splitTextToSize(obsTxt, CW - obsPad * 2) : [];
  let yLibre = null;
  for(let i = 0; i < 4; i++){
    const yLinea = y;
    const base = y + obsFs - 1;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.5);
    doc.line(M + obsPad, base + 2.2, M + CW - obsPad, base + 2.2);
    if(obsParts[i]){
      doc.setFont(FONT, 'bold');
      doc.setFontSize(obsFs);
      doc.setTextColor(...ACCENT);
      doc.text(obsParts[i], M + obsPad, base);
    } else if(yLibre == null) {
      yLibre = yLinea;
    }
    y += 16;
  }
  // AARMS lote4ca: una sola diagonal sobre todo el bloque de renglones sin usar.
  if(yLibre != null) _lote4bcTachar(doc, M, yLibre, CW, y - yLibre);
  _pdfCajaBorde(doc, M, yObs0, CW, y - yObs0);
  y += 6;

  _pdfBmFirma(doc, 'Pág. 5 de 5');
}
window._pdfBmPag5 = _pdfBmPag5;

// AARMS sub51a-roboto: generar PDF Machiote con Roboto
// AARMS lote3ba: el PDF sale del registro del OMAR pedido, no de la pantalla
function _lote3baTomarRegistro(id){
  const mid = id || (typeof omar !== 'undefined' && omar && omar.ts);
  if(!mid) return null;
  // El registro guardado manda. La copia en memoria puede ser la OMAR a medias del localStorage.
  const lista = (typeof _cachedMuestreos !== 'undefined' && _cachedMuestreos) ? _cachedMuestreos : [];
  const m = lista.find(x => String(x.id) === String(mid));
  if(!m){
    if(typeof omar !== 'undefined' && omar && String(omar.ts) === String(mid)){
      return { omar: omar, tomas: (typeof tomas !== 'undefined' && Array.isArray(tomas)) ? tomas : [] };
    }
    return null;
  }
  let copia = {};
  try { copia = JSON.parse(m.omar || '{}'); } catch(e){ copia = {}; }
  copia.ts = m.id;
  if(m.empresa && !copia.empresa) copia.empresa = m.empresa;
  if(m.folio && !copia.folio) copia.folio = m.folio;
  let tomasCopia = [];
  try { tomasCopia = JSON.parse(JSON.stringify(m.tomas || [])); } catch(e){ tomasCopia = []; }
  return { omar: copia, tomas: tomasCopia };
}

async function generarPDFBm(omarId){
  const reg = _lote3baTomarRegistro(omarId);
  if(!reg || !reg.omar || !reg.omar.ts){ toast('Sin OMAR','w'); return; }
  const prevOmar = (typeof omar !== 'undefined') ? omar : null;
  const prevTomas = (typeof tomas !== 'undefined') ? tomas : null;
  omar = reg.omar;
  tomas = reg.tomas;
  const prevSinGuardar = window._lote3baSinGuardar;
  window._lote3baSinGuardar = true;
  try {
  const plan = (typeof _planActivo === 'function' && _planActivo())
    || (typeof getPlanDeMuestreo === 'function' ? getPlanDeMuestreo(omar.ts) : null)
    || (typeof _planPorOmar === 'function' ? _planPorOmar() : null);
  if(!plan){ toast('Selecciona un OMAR y plan primero','w'); return; }
  // AARMS bmconserv: cloro obligatorio (mismo toast faltantes que checkCamposCompletos)
  if(typeof _machioteCloroFaltantes === 'function'){
    const cloroFalt = _machioteCloroFaltantes(omar);
    if(cloroFalt.length){
      toast('Faltan: ' + cloroFalt.join(', '), 'w');
      return;
    }
  }
  // AARMS sub9-firma: estampar firma del muestreador desde config
  if(typeof _firmaMuestreadorAuto === 'function') _firmaMuestreadorAuto(plan);

  if(typeof _machioteInicializarConservadores === 'function') _machioteInicializarConservadores(omar);
  const snapshot = _bmSnapshotOrigen();
  // AARMS lote3ba: el snapshot entra en la copia en memoria. No se lee ni se guarda la pantalla.
  _bmAplicarSnapshotEnMemoria(snapshot);

  const { jsPDF } = window.jspdf;
  const logo = await loadLogo(LOGO_PDF_URI);
  const doc = new jsPDF({ orientation:'portrait', unit:'pt', format:'letter', compress:true });

  // AARMS sub51a-roboto: inyectar Roboto (fallback helvetica)
  let fuente = 'helvetica';
  if(typeof _pdfBmAplicarRoboto === 'function'){
    fuente = await _pdfBmAplicarRoboto(doc) || 'helvetica';
  }
  _BM_PDF.FONT = fuente;

  const ctx = _bmPdfCtx(doc, logo, omar);

  await _pdfBmPag1(doc, plan, omar, snapshot, ctx);
  doc.addPage();
  await _pdfBmPag2(doc, plan, omar, snapshot, ctx);
  doc.addPage();
  await _pdfBmPag3(doc, plan, omar, snapshot, ctx);
  doc.addPage();
  await _pdfBmPag4(doc, plan, omar, snapshot, ctx);
  doc.addPage();
  await _pdfBmPag5(doc, plan, omar, snapshot, ctx);

  // AARMS lote5c: una versión nueva solo si la huella de los datos cambió. El PDF descargado es el mismo.
  try {
    const blobVer = doc.output('blob');
    if(typeof _lote5cRegistrar === 'function') await _lote5cRegistrar(plan, omar, blobVer);
  } catch(e){ console.warn('[lote5c]', e); }

  // AARMS sub53-fino: nombre por folio OMAR (no del plan)
  const folio = omar.folio || omar.ts;
  const fecha = (typeof _lote21HoyFecha==='function'?_lote21HoyFecha():_lote4hoy().fecha);
  const fname = `Bitacora_Muestreo_${folio}_${fecha}.pdf`;
  // AARMS sub53-fino: save (captura envuelve constructor) + fallback output
  if(typeof doc.save === 'function') doc.save(fname);
  else if(typeof entregarPDF === 'function') await entregarPDF(doc.output('blob'), fname);
  else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(doc.output('blob'));
    a.download = fname;
    a.click();
  }
  toast('PDF Bitácora de Muestreo F-AA-114-18 (5 páginas) generado','g');
  if(typeof _maybeMarcarPlanDoc === 'function') await _maybeMarcarPlanDoc('bm');
  } finally {
    window._lote3baSinGuardar = prevSinGuardar;
    omar = prevOmar;
    tomas = prevTomas;
  }
}
window.generarPDFBm = generarPDFBm;

// AARMS sub53-fino: un Machiote por cada OMAR del plan
async function generarPDFBmTodos(){
  const plan = (typeof _planActivo === 'function' && _planActivo()) || null;
  const ids = (plan && plan.omarIds) || [];
  if(!ids.length){ toast('Sin OMARs en el plan','w'); return; }
  toast(`Generando ${ids.length} Machiote(s)…`, 'g');
  // AARMS lote3ba: cada PDF lee su registro. No se abre ni se guarda el OMAR de la pantalla.
  for(const id of ids){
    await generarPDFBm(id);
    await new Promise(r => setTimeout(r, 200));
  }
  toast(`${ids.length} Machiotes generados`, 'g');
}
window.generarPDFBmTodos = generarPDFBmTodos;

// AARMS sub53-fino: selector OMAR en pgBm
function _bmRenderOmarSelector(){
  const sel = document.getElementById('bmOmarSelect');
  const pill = document.getElementById('bmPill');
  const lbl = document.getElementById('bmOmarActivoLbl');
  const plan = (typeof _planActivo === 'function' && _planActivo()) || null;
  const ids = (plan && plan.omarIds) || [];
  const cur = omar && omar.ts ? String(omar.ts) : '';
  const labelFn = (typeof _omarLabelConFecha === 'function')
    ? _omarLabelConFecha
    : (id) => 'OMAR ' + id;
  if(pill){
    pill.textContent = cur
      ? ((typeof _omarLabelConFechaFromObj === 'function' && omar)
        ? _omarLabelConFechaFromObj(omar)
        : labelFn(cur))
      : 'OMAR';
  }
  if(lbl){
    lbl.textContent = cur
      ? ((typeof _omarLabelConFechaFromObj === 'function' && omar)
        ? _omarLabelConFechaFromObj(omar)
        : labelFn(cur))
      : 'Sin OMAR activo';
  }
  if(!sel) return;
  const prev = sel.value;
  sel.innerHTML = '';
  if(!ids.length){
    const opt = document.createElement('option');
    opt.value = cur || '';
    opt.textContent = cur ? labelFn(cur) : '— Sin OMARs en el plan —';
    sel.appendChild(opt);
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  ids.forEach(id => {
    const opt = document.createElement('option');
    opt.value = String(id);
    opt.textContent = labelFn(id);
    if(String(id) === cur) opt.selected = true;
    sel.appendChild(opt);
  });
  if(cur && !ids.map(String).includes(cur)){
    const opt = document.createElement('option');
    opt.value = cur;
    opt.textContent = labelFn(cur) + ' (fuera del plan)';
    opt.selected = true;
    sel.appendChild(opt);
  }
  if(prev && !sel.value) sel.value = prev;
}
window._bmRenderOmarSelector = _bmRenderOmarSelector;

async function bmCambiarOmar(id){
  if(!id) return;
  if(omar && String(omar.ts) === String(id)) return;
  // AARMS sub53-fino: persistir BM actual antes de cambiar
  if(typeof leerBmForm === 'function') leerBmForm();
  try{ if(typeof saveMuestreoActual === 'function') await saveMuestreoActual(); }catch(_){}
  if(typeof cargarMuestreo === 'function') await cargarMuestreo(id);
  if(typeof abrirPagBm === 'function') abrirPagBm();
  else {
    if(typeof poblarBmForm === 'function') poblarBmForm();
    _bmRenderOmarSelector();
  }
}
window.bmCambiarOmar = bmCambiarOmar;


// ─── PDF Bitácora pH F-AA-264-4 FIEL (UNA bitácora del plan, 2 páginas oficiales) ───
// AARMS ph2644-fiel: Pág.1 = 6 bloques lab+campo; Pág.2 = tabla 14 cols todos los OMARs
// Numeración NO.TOMA por ronda+OMAR, reinicia por día. Estética molde Hoja de Campo.
// AARMS phfix2: bitácora pH F-AA-264-4 — criterio real, V entre tomas, CA/CA/CO/CO entre días
// AARMS phnum: numeración dinámica Pág. X de N + encabezado en continuaciones
// AARMS phhoja1: Hoja 1 filas exactas 3/3/2/3/3/2, vacías en blanco, molde Hoja de Campo
// AARMS phverif1: Verificación Lab/Campo = 1 fila (patrón 3/3/1/3/3/1)
// AARMS phbadge: badge ✓/✗ Acepta-Rechaza (Hoja 1 + Entre Tomas)
// AARMS phfolio2: folio individual por hoja + caja FOLIO landscape clon + SLOPE/PENDIENTE merge CA
// AARMS phslopefix: CA → 1 celda tabla normal (L2→ACEPTA, rowspan 2) "PENDIENTE SLOPE XX% PENDIENTE"
// AARMS phslopeaccept: CA → merge L2→pH25 = SLOPE grande; ACEPTA por renglón con _phAceptaRechaza
// AARMS phslopeaesthetic: SLOPE = ACCENT + centrado _pdfFilaTablaPremium, fs ~1.4× datos
window.generarPDFBitacoraPHOficial = async function generarPDFBitacoraPHOficialV2(planId){
  // AARMS lote4a: el PDF sale del registro del plan pedido. No guarda la pantalla ni lee sus cuadros.
  let planPh = null;
  if(planId){
    planPh = (typeof _cachedPlanes !== 'undefined' && _cachedPlanes) ? (_cachedPlanes.find(p => p.id === planId) || null) : null;
    if(!planPh){ toast('No está el plan de esa bitácora','w'); return; }
  } else {
    planPh = (typeof _planActivo === 'function') ? _planActivo() : null;
    if(!planPh && typeof omar !== 'undefined' && omar?.ts && typeof getPlanDeMuestreo === 'function'){
      planPh = getPlanDeMuestreo(omar.ts);
    }
  }
  if(!planPh && !(typeof omar !== 'undefined' && omar?.ts)){
    toast('Abre un plan u OMAR para generar la bitácora pH','w');
    return;
  }

  let regs = [];
  if(planPh && Array.isArray(planPh.bitPh)) regs = planPh.bitPh.slice();
  else if(!planId && typeof omar !== 'undefined' && omar && Array.isArray(omar.bitPh)) regs = omar.bitPh.slice();

  const phN = (planPh && typeof _lote4Ph === 'function') ? _lote4Ph(planPh) : null;
  if(phN){
    const ir = (donde) => {
      if(donde === 'campo' && typeof abrirBitacoraPH === 'function') abrirBitacoraPH();
      else if(typeof _lote4aAbrir === 'function') _lote4aAbrir();
    };
    if(typeof _lote4Rechazos === 'function'){
      const rech = _lote4Rechazos(planPh);
      if(rech.length){
        toast('Rechaza: ' + rech.map(r => r.texto).join('; '), 'w', {
          ms: 9000,
          onClick: () => ir(rech[0] && rech[0].donde)
        });
        return;
      }
    }
    if(typeof _lote4Faltantes === 'function'){
      const faltan = _lote4Faltantes(planPh);
      if(faltan.length){
        toast('Faltan: ' + faltan.map(f => f.texto).join('; '), 'w', {
          ms: 9000,
          onClick: () => ir(faltan[0] && faltan[0].donde)
        });
        return;
      }
    }
  }

  const folioMap = {};
  if(planPh && (planPh.omarIds || []).length){
    for(const mid of planPh.omarIds){
      const m = (typeof _cachedMuestreos !== 'undefined' && _cachedMuestreos)
        ? _cachedMuestreos.find(x => x.id === mid) : null;
      let fol = '—';
      if(m){
        try{ const o = m.omar ? JSON.parse(m.omar) : {}; fol = o.folio ? String(o.folio) : String(mid); }
        catch(e){ fol = String(mid); }
      }
      folioMap[String(mid)] = fol;
    }
  }
  if(!planId && typeof omar !== 'undefined' && omar?.ts){
    folioMap[String(omar.ts)] = folioMap[String(omar.ts)] || (omar.folio || String(omar.ts));
  }

  let h = (planPh && typeof _lote4LegacyH === 'function') ? _lote4LegacyH(planPh) : {};
  const tieneHoja = !!(phN && (phN.lab || phN.campo)) || !!(h && (h.cal_l1 || h.comp_l1 || h.ver_l1 || h.folio || h.campo_c1 || h.campo_v1 || h.campo_ver_l1));
  if(!regs.length && !tieneHoja){
    toast('Agrega registros en la bitácora pH.','w');
    return;
  }
  if(!phN && typeof _catalogoCargar === 'function') await _catalogoCargar();
  if(!phN && typeof _catalogoFusionPh2644h1 === 'function' && h){
    try{ _catalogoFusionPh2644h1(h); }catch(_){}
  }

  if(planPh && typeof window._lote2aAsegurarPh === 'function'){
    try{ await window._lote2aAsegurarPh(planPh); }catch(e){ console.warn('[lote2a ph]', e); }
  }
  let folioDocPh = (planPh && planPh.bitPhFolioDoc) || '';
  if(!folioDocPh && !planId && typeof _bitPhFolioDocGet === 'function') folioDocPh = _bitPhFolioDocGet() || '';
  if(!folioDocPh && !planId) folioDocPh = (omar && omar.bitPhFolioDoc) || '';
  if(!folioDocPh) folioDocPh = h.folio || '';

  // AARMS phfolio2: un folio individual por hoja física (rango → folio1 / folio2)
  const _phFoliosPorHoja = (rango) => {
    const s = String(rango || '').trim();
    if(!s) return { f1: '', f2: '' };
    const parts = s.split(/\s*[-–—/]\s*/).map(x => x.trim()).filter(Boolean);
    if(parts.length >= 2) return { f1: parts[0], f2: parts[1] };
    return { f1: s, f2: s };
  };
  const folioHojas = _phFoliosPorHoja(folioDocPh);
  const folioHoja1 = folioHojas.f1 || undefined;
  const folioHoja2 = folioHojas.f2 || folioHojas.f1 || undefined;

  const { jsPDF } = window.jspdf;
  const logo = await loadLogo(LOGO_PDF_URI);
  const FONT = 'helvetica';
  const NAVY = (window.STD && STD.NAVY) || [10,22,40];
  const TEXT = (window.STD && STD.TEXT) || [30,41,59];
  const WHITE = (window.STD && STD.WHITE) || [255,255,255];
  const DARK = (window.STD && STD.DARK) || NAVY;

  const fmtFecha = (s) => {
    if(!s) return '';
    const p = String(s).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0].slice(-2)}` : String(s).substring(0, 10);
  };
  const cell = (v) => (v == null || v === '') ? '' : String(v);
  const asci = (v) => (typeof jsPdfAscii === 'function') ? jsPdfAscii(String(v == null ? '' : v)) : String(v == null ? '' : v);
  const actOficial = (a) => {
    const u = String(a || '').trim().toUpperCase();
    if(u === 'CA' || u === 'CALIBRACION' || u === 'CALIBRACIÓN') return 'CA';
    if(u === 'CO' || u === 'COMPROBACION' || u === 'COMPROBACIÓN') return 'CO';
    if(u === 'V' || u === 'VERIFICACION' || u === 'VERIFICACIÓN') return 'V';
    return u || '';
  };
  const prom3 = (a, b, c) => {
    if(typeof _phPromedio === 'function') return _phPromedio(a, b, c);
    const Ls = [a, b, c].map(x => parseFloat(x)).filter(n => !isNaN(n));
    return Ls.length === 3 ? Ls.reduce((s, n) => s + n, 0) / 3 : null;
  };
  const aceCalc = (l1, l2, l3, buf) => {
    if(typeof _phAceptaRechaza === 'function') return _phAceptaRechaza(l1, l2, l3, buf) || '';
    return '';
  };
  const ph25Calc = (l1, l2, l3) => {
    if(typeof _phA25 === 'function') return _phA25(l1, l2, l3);
    const p = prom3(l1, l2, l3);
    return p != null ? (Math.round(p * 10) / 10).toFixed(1) : '';
  };

  const subPlan = planPh && planPh.id
    ? ('Plan ' + asci(planPh.folio || planPh.id).substring(0, 24) + ' · ' + String((planPh.omarIds || []).length) + ' OMAR(s)')
    : ('OMAR ' + asci((omar && omar.folio) || '-'));
  // AARMS lote4a: la empresa sale del plan pedido, no de la OMAR abierta en pantalla.
  let empresaPdf = (planPh && planPh.empresa) || '';
  if(!empresaPdf && planPh && (planPh.omarIds || []).length && typeof _cachedMuestreos !== 'undefined'){
    const midEmp = planPh.omarIds[0];
    const mEmp = _cachedMuestreos.find(x => String(x.id) === String(midEmp));
    if(mEmp){
      empresaPdf = mEmp.empresa || '';
      if(!empresaPdf && mEmp.omar){
        try{ empresaPdf = JSON.parse(mEmp.omar).empresa || ''; }catch(_){}
      }
    }
  }
  if(!empresaPdf && !planId && omar) empresaPdf = omar.empresa || '';
  let subTxt = subPlan + '  |  ' + asci(empresaPdf).substring(0, 40);
  if(folioDocPh) subTxt += '  |  Folio: ' + asci(folioDocPh).substring(0, 28);

  const folioOmarOf = (r) => {
    if(r && (r.calibGrupo || r.sinTomaFolio || r._entreDias)) return '—';
    if(r && r.folioOmar) return String(r.folioOmar);
    const oid = r && r.omarId != null && r.omarId !== '' ? String(r.omarId) : String((omar && omar.ts) || '');
    return folioMap[oid] || (omar && omar.folio) || '—';
  };

  // AARMS phfix2: construir filas — V por toma; CA/CA/CO/CO al terminar el día (si hay día siguiente)
  const buildFilasEntreTomas = (allRegs) => {
    const list = (allRegs || []).filter(r => r && !r._skip);
    const isCalib = (r) => !!(r.calibGrupo || r.sinTomaFolio || r._entreDias);
    const isCA = (r) => actOficial(r.act) === 'CA';
    const isCO = (r) => actOficial(r.act) === 'CO';
    const vRows = list.filter(r => !isCalib(r) && (r.toma || r.omarId));
    const calibRows = list.filter(isCalib);

    const byDay = new Map();
    vRows.forEach(r => {
      const d = String(r.fecha || '');
      if(!byDay.has(d)) byDay.set(d, []);
      byDay.get(d).push(r);
    });
    const days = [...byDay.keys()].sort((a, b) => a.localeCompare(b));

    // Bloques calib agrupados (orden CA,CA,CO,CO)
    const grupos = new Map();
    calibRows.forEach(r => {
      const g = r.calibGrupo || ('_loose_' + String(r.fecha || '') + '_' + String(r.hora || ''));
      if(!grupos.has(g)) grupos.set(g, []);
      grupos.get(g).push(r);
    });
    const bloques = [...grupos.values()].map(rows => {
      rows.sort((a, b) => (Number(a.calibPaso) || 0) - (Number(b.calibPaso) || 0));
      const fe = String(rows[0].fecha || '');
      return { fecha: fe, rows };
    }).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const usados = new Set();

    const synthBloque = (fechaDia, seedRow) => {
      const horaFin = (seedRow && seedRow.hora) || '23:00';
      const base = {
        fecha: fechaDia || '',
        hora: horaFin,
        toma: '',
        act: 'CA',
        lote: (seedRow && seedRow.lote) || h.lote || '',
        marca: (seedRow && seedRow.marca) || h.marca || '',
        buffer: (seedRow && seedRow.buffer) || h.buffer || '',
        l1: '', l2: '', l3: '',
        sinTomaFolio: true,
        _entreDias: true,
        pendienteBuf1: true,
        slopePct: ''
      };
      const b1 = h.buffer || '7.00';
      const b2 = h.buffer2 || h.buffer_alt || '4.00';
      return [
        { ...base, calibPaso: 1, act: 'CA', buffer: b1 },
        { ...base, calibPaso: 2, act: 'CA', buffer: b2 },
        { ...base, calibPaso: 3, act: 'CO', buffer: b1, pendienteBuf1: false },
        { ...base, calibPaso: 4, act: 'CO', buffer: b2, pendienteBuf1: false }
      ];
    };

    const pickBloque = (fechaDia, fechaNext) => {
      for(let i = 0; i < bloques.length; i++){
        if(usados.has(i)) continue;
        const bf = bloques[i].fecha;
        if(bf === fechaDia || bf === fechaNext || (!bf && fechaDia)){
          usados.add(i);
          return bloques[i].rows;
        }
      }
      for(let i = 0; i < bloques.length; i++){
        if(usados.has(i)) continue;
        usados.add(i);
        return bloques[i].rows;
      }
      return null;
    };

    const out = [];
    days.forEach((day, di) => {
      const dayRows = (byDay.get(day) || []).slice().sort((a, b) => {
        const ta = Number(a.toma) || 0, tb = Number(b.toma) || 0;
        if(ta !== tb) return ta - tb;
        const ha = String(a.hora || ''), hb = String(b.hora || '');
        if(ha !== hb) return ha.localeCompare(hb);
        return folioOmarOf(a).localeCompare(folioOmarOf(b));
      });
      dayRows.forEach(r => {
        out.push(Object.assign({}, r, { act: 'V', _forcedV: true }));
      });
      // AARMS phfix2: al terminar las tomas del día (si hay día siguiente) → CA/CA/CO/CO
      if(di < days.length - 1){
        const last = dayRows[dayRows.length - 1];
        const bloque = pickBloque(day, days[di + 1]) || synthBloque(day, last);
        bloque.forEach(r => {
          out.push(Object.assign({}, r, {
            sinTomaFolio: true,
            _entreDias: true,
            toma: '',
            folioOmar: ''
          }));
        });
      }
    });
    // Calib sobrantes (mismo día único / sin cruce) al final
    bloques.forEach((b, i) => {
      if(usados.has(i)) return;
      b.rows.forEach(r => out.push(Object.assign({}, r, { sinTomaFolio: true, _entreDias: true, toma: '', folioOmar: '' })));
    });
    return out;
  };

  // ═══════════════ PÁGINA 1 — portrait, 6 bloques ═══════════════
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter', compress: true });
  let W = 612, H = 792, M = 28, CW = W - M * 2, HDR = 86;

  let yTop1 = HDR;
  const hdrP1 = () => {
    // AARMS phfix2: sin extraIzq (evita encimar con el título de sección)
    // AARMS phfolio2: folio individual de Hoja 1
    yTop1 = _pdfMembreteStd(doc, logo, {
      docTitulo: 'pH-metro',
      docSubtitulo: 'Uso, calibracion y verificacion',
      codigoFormato: 'F-AA-264-4',
      folio: folioHoja1,
      margin: M,
      contentY: HDR
    }, FONT);
  };
  hdrP1();
  let y = Math.max(yTop1 || 98, 98);
  doc.setFont(FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
  doc.text(asci('USO, CALIBRACION, COMPROBACION Y VERIFICACION DEL pH-METRO'), M + CW / 2, y, { align: 'center' });
  y += 11;
  doc.setFont(FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...TEXT);
  doc.text(subTxt, M + CW / 2, y, { align: 'center' });
  y += 12;

  // AARMS phhoja1 / phverif1: Hoja 1 — 6 bloques con filas exactas 3/3/1/3/3/1; vacías en blanco
  const drawTablaBloque = (heads, rows, yy) => {
    const n = heads.length;
    const cws = heads.map(() => CW / n);
    const rhH = 12;
    const rh = 14; // altura suficiente para escritura a mano (molde Hoja de Campo)
    yy = _pdfHeaderTablaPremium(doc, heads.map(hh => asci(hh)), M, yy, cws, rhH, FONT, {
      cellBorders: true, fontSize: 6.2
    });
    rows.forEach((vals, ri) => {
      const row = (vals || []).map(v => asci(cell(v)));
      while(row.length < n) row.push('');
      yy = _pdfFilaTablaPremium(doc, row, M, yy, cws, rh, ri, {
        fontSize: 7, maxChars: 16, font: FONT, blankEmpty: true, cellBorders: true
      });
    });
    return yy + 2;
  };
  const drawCriterioLine = (texto, yy, opts) => {
    opts = opts || {};
    // AARMS phbadge: criterio textual + badge (sin "Se acepta: X")
    let estado = null;
    if(opts.acepta){
      const a = String(opts.aceptaVal || '').trim();
      if(a && !/^pendiente$/i.test(a)){
        if(a === 'Acepta' || /^acepta/i.test(a)) estado = 'acepta';
        else if(a === 'Rechaza' || /^rechaz/i.test(a)) estado = 'rechaza';
      }
    }
    const badgeW = estado ? 66 : 0;
    const textMax = Math.max(40, CW - 6 - badgeW);
    doc.setFont(FONT, 'normal'); doc.setFontSize(5.8); doc.setTextColor(...TEXT);
    const lines = doc.splitTextToSize(asci(texto), textMax);
    doc.text(lines, M + 2, yy + 6);
    const textH = lines.length * 7 + 2;
    if(estado && typeof _pdfBadgeAceptaRechaza === 'function'){
      const bh = 11;
      const bx = M + CW - badgeW;
      const by = yy + Math.max(1, (textH - bh) / 2);
      _pdfBadgeAceptaRechaza(doc, bx, by, estado, { font: FONT });
    }
    return yy + Math.max(textH, estado ? 14 : textH);
  };
  const drawBloque = (titulo, heads, rows, criterios, yy) => {
    if(yy > H - 130){
      doc.addPage();
      hdrP1();
      yy = Math.max(yTop1 || 98, 98) + 8;
    }
    const y0 = yy;
    yy = _pdfBarraSeccion(doc, titulo, M, yy, CW, FONT);
    yy = drawTablaBloque(heads, rows, yy);
    (criterios || []).forEach(c => {
      if(typeof c === 'string') yy = drawCriterioLine(c, yy);
      else yy = drawCriterioLine(c.text, yy, c);
    });
    _pdfCajaBorde(doc, M, y0, CW, Math.max(18, yy - y0));
    return yy + 5;
  };
  /** Rellena a nRows; filas sobrantes = arrays vacíos (celdas en blanco). */
  const padRows = (filled, nRows, nCols) => {
    const out = (filled || []).slice(0, nRows).map(r => {
      const row = (r || []).slice();
      while(row.length < nCols) row.push('');
      return row;
    });
    while(out.length < nRows) out.push(Array(nCols).fill(''));
    return out;
  };

  const H_CAL = ['FECHA','HORA','LOTE','MARCA','BUFFER','LECTURA','ACTIVIDAD'];
  const H_COMP = ['FECHA','HORA','LOTE','MARCA','BUFFER','LECTURA 1','LECTURA 2','LECTURA 3','PROMEDIO','ACTIVIDAD'];

  const labN = phN && phN.lab ? phN.lab : null;
  const campoN = phN && phN.campo ? phN.campo : null;
  const num2 = (v) => {
    const n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    return isNaN(n) ? (v == null ? '' : String(v)) : n.toFixed(2);
  };
  const filaCalPdf = (f) => {
    if(!f || (String(f.lectura || '').trim() === '' && !f.buffer && !f.lote)) return ['', '', '', '', '', '', ''];
    const lect = String(f.lectura || '').trim();
    return [fmtFecha(f.fecha) || '', f.hora || '', f.lote || '', f.marca || '', num2(f.buffer), lect ? num2(lect) : '', lect ? 'CA' : ''];
  };
  const filaLectPdf = (f, act) => {
    if(!f) return Array(10).fill('');
    const has = [f.l1, f.l2, f.l3].some(x => x != null && String(x).trim() !== '');
    if(!has && !f.buffer && !f.lote) return Array(10).fill('');
    const p = prom3(f.l1, f.l2, f.l3);
    return [fmtFecha(f.fecha) || '', f.hora || '', f.lote || '', f.marca || '', num2(f.buffer), f.l1 || '', f.l2 || '', f.l3 || '', p != null ? Number(p).toFixed(2) : '', has ? act : ''];
  };
  const fechaLab = fmtFecha(h.fecha) || '';
  const horaLab = h.hora || '';
  const lote = h.lote || '';
  const marca = h.marca || '';
  const buffer = h.buffer || '';
  const slope = labN ? (labN.b1.slope || '') : (h.slope || '');
  const temp = labN ? (labN.b1.temp || '') : (h.temp || '');
  // AARMS lote4a: estructura nueva, badge por fila. El plan viejo conserva la regla anterior (slope o texto).
  const acepManual = h.campo_acep || '';
  const acepCalViejo = (/acepta/i.test(String(acepManual)) ? 'Acepta' : (/rechaz/i.test(String(acepManual)) ? 'Rechaza' : (h.slope ? 'Acepta' : '')));
  const acepCompViejo = aceCalc(h.comp_l1, h.comp_l2, h.comp_l3, buffer);
  const acepComp = labN ? _lote4PdfEstado(_lote4EstadoComp(labN.b2.filas).a) : acepCompViejo;
  const acepComp2 = labN ? _lote4PdfEstado(_lote4EstadoComp(labN.b2.filas).b) : acepCompViejo;
  const acepVer = labN ? _lote4PdfEstado(_lote4EstadoVer(labN.b3.filas)) : aceCalc(h.ver_l1, h.ver_l2, h.ver_l3, buffer);
  const acepCalLab = labN ? _lote4PdfEstado(_lote4EstadoCal(labN.b1.filas)) : acepCalViejo;

  const feedSrc = (campoN && campoN.b6 && campoN.b6.filas && campoN.b6.filas[0]) ? {
    campo_v1: campoN.b6.filas[0].l1, campo_v2: campoN.b6.filas[0].l2, campo_v3: campoN.b6.filas[0].l3,
    buffer: campoN.b6.filas[0].buffer, campo_fecha: campoN.b6.filas[0].fecha, campo_hora: campoN.b6.filas[0].hora
  } : h;
  if(typeof _cartasFeedDesdePhCampo === 'function'){
    try{
      const mid0 = planPh && planPh.omarIds && planPh.omarIds[0];
      const folioOmarCtx = (mid0 && folioMap[String(mid0)] && folioMap[String(mid0)] !== '—') ? folioMap[String(mid0)] : ((!planId && omar && (omar.folio || omar.id)) || '');
      const planIdCtx = (planPh && planPh.id) || '';
      await _cartasFeedDesdePhCampo(feedSrc, { folioOMAR: folioOmarCtx, planId: planIdCtx });
    }catch(_eCc){}
  }
  const acepCampoViejo = aceCalc(h.campo_c1, h.campo_c2, h.campo_c3, buffer);
  const acepCampoComp = campoN ? _lote4PdfEstado(_lote4EstadoComp(campoN.b5.filas).a) : acepCampoViejo;
  const acepCampoComp2 = campoN ? _lote4PdfEstado(_lote4EstadoComp(campoN.b5.filas).b) : acepCampoViejo;
  const acepCampoVer = campoN ? _lote4PdfEstado(_lote4EstadoVer(campoN.b6.filas)) : aceCalc(h.campo_v1 || h.campo_ver_l1, h.campo_v2 || h.campo_ver_l2, h.campo_v3 || h.campo_ver_l3, buffer);
  const acepCalCampo = campoN ? _lote4PdfEstado(_lote4EstadoCal(campoN.b4.filas)) : acepManual;

  // AARMS lote4a: cada fila con su fecha, hora y buffer. El molde de la hoja no cambia.
  const calLabRows = [];
  if(labN){
    labN.b1.filas.forEach(f => calLabRows.push(filaCalPdf(f)));
  } else {
    [h.cal_l1, h.cal_l2, h.cal_l3].forEach((lect) => {
      if(lect != null && String(lect).trim() !== ''){
        calLabRows.push([fechaLab, horaLab, lote, marca, buffer, String(lect).trim(), 'CA']);
      }
    });
  }
  y = drawBloque('1. Calibracion en el Laboratorio', H_CAL,
    padRows(calLabRows, 3, 7),
    [{
      text: 'Criterio de aceptacion: ____   Slope: ' + (slope || '____') + '   Temperatura: ' + (temp || '____'),
      acepta: true,
      aceptaVal: acepCalLab
    }], y);

  const compLabFilled = labN
    ? labN.b2.filas.map(f => filaLectPdf(f, 'CO'))
    : ((h.comp_l1 || h.comp_l2 || h.comp_l3)
      ? [[fechaLab, horaLab, lote, marca, buffer, h.comp_l1||'', h.comp_l2||'', h.comp_l3||'',
          (prom3(h.comp_l1, h.comp_l2, h.comp_l3) != null ? prom3(h.comp_l1, h.comp_l2, h.comp_l3).toFixed(2) : ''), 'CO']]
      : []);
  y = drawBloque('2. Comprobacion de Calibracion en Laboratorio', H_COMP,
    padRows(compLabFilled, 3, 10),
    [
      { text: 'La medicion no debe desviarse por mas de ± 0,05 UpH del valor nominal del patron de referencia', acepta: true, aceptaVal: acepComp },
      { text: 'No debera haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas', acepta: true, aceptaVal: acepComp2 }
    ], y);

  const verLabFilled = labN
    ? labN.b3.filas.map(f => filaLectPdf(f, 'V'))
    : ((h.ver_l1 || h.ver_l2 || h.ver_l3)
      ? [[fechaLab, horaLab, lote, marca, buffer, h.ver_l1||'', h.ver_l2||'', h.ver_l3||'',
          (prom3(h.ver_l1, h.ver_l2, h.ver_l3) != null ? prom3(h.ver_l1, h.ver_l2, h.ver_l3).toFixed(2) : ''), 'V']]
      : []);
  y = drawBloque('3. Verificacion en Laboratorio', H_COMP,
    padRows(verLabFilled, 1, 10),
    [
      { text: 'Criterio de aceptacion: No debe haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas.', acepta: true, aceptaVal: acepVer },
      { text: 'El promedio no debe desviarse mas de 0.05 UpH del Valor Nominal, graficarlo.' }
    ], y);

  const fechaCampo = fmtFecha(h.campo_fecha || h.fecha) || fechaLab;
  const horaCampo = h.campo_hora || horaLab;
  const slopeCampo = campoN ? (campoN.b4.slope || '') : (h.campo_slope || '');
  const tempCampo = campoN ? (campoN.b4.temp || '') : (h.campo_temp || '');
  const calCampoRows = [];
  if(campoN){
    campoN.b4.filas.forEach(f => calCampoRows.push(filaCalPdf(f)));
  } else {
    [h.campo_cal_l1 || h.campo_cal, h.campo_cal_l2, h.campo_cal_l3].forEach((lect) => {
      if(lect != null && String(lect).trim() !== ''){
        calCampoRows.push([fechaCampo, horaCampo, lote, marca, buffer, String(lect).trim(), 'CA']);
      }
    });
  }
  y = drawBloque('4. Calibracion en el Campo', H_CAL,
    padRows(calCampoRows, 3, 7),
    [{
      text: 'Criterio de aceptacion: ____   Slope: ' + (slopeCampo || '____') + '   Temperatura: ' + (tempCampo || '____'),
      acepta: true,
      aceptaVal: acepCalCampo
    }], y);

  const campCompFilled = campoN
    ? campoN.b5.filas.map(f => filaLectPdf(f, 'CO'))
    : ((h.campo_c1 || h.campo_c2 || h.campo_c3)
      ? [[fechaCampo, horaCampo, lote, marca, buffer, h.campo_c1||'', h.campo_c2||'', h.campo_c3||'',
          (prom3(h.campo_c1, h.campo_c2, h.campo_c3) != null ? prom3(h.campo_c1, h.campo_c2, h.campo_c3).toFixed(2) : ''), 'CO']]
      : []);
  y = drawBloque('5. Comprobacion de Calibracion en Campo', H_COMP,
    padRows(campCompFilled, 3, 10),
    [
      { text: 'La medicion no debe desviarse por mas de ± 0,05 UpH del valor nominal del patron de referencia', acepta: true, aceptaVal: acepCampoComp },
      { text: 'No debera haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas', acepta: true, aceptaVal: acepCampoComp2 }
    ], y);

  const campV1 = h.campo_v1 || h.campo_ver_l1 || '';
  const campV2 = h.campo_v2 || h.campo_ver_l2 || '';
  const campV3 = h.campo_v3 || h.campo_ver_l3 || '';
  const campVerFilled = campoN
    ? campoN.b6.filas.map(f => filaLectPdf(f, 'V'))
    : ((campV1 || campV2 || campV3)
      ? [[fechaCampo, horaCampo, lote, marca, buffer, campV1, campV2, campV3,
          (prom3(campV1, campV2, campV3) != null ? prom3(campV1, campV2, campV3).toFixed(2) : ''), 'V']]
      : []);
  y = drawBloque('6. Verificacion en Campo', H_COMP,
    padRows(campVerFilled, 1, 10),
    [
      { text: 'Criterio de aceptacion: No debe haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas.', acepta: true, aceptaVal: acepCampoVer },
      { text: 'El promedio no debe desviarse mas de 0.05 UpH del Valor Nominal, graficarlo.' }
    ], y);

  y = _lote4bcCuerpoObs(doc, M, y, CW, (phN && phN.obs) || h.obs || '', FONT);
  // AARMS phnum: pie "Pág. X de N" se estampa al final (total real)

  // ═══════════════ PÁGINA 2+ — landscape, tabla 14 cols ═══════════════
  doc.addPage('letter', 'landscape');
  W = 792; H = 612; M = 18; CW = W - M * 2; HDR = 86;

  let yTop2 = HDR;
  const hdrP2 = () => {
    // AARMS phnum / phfolio2: misma _pdfMembreteStd que Hoja 1; folio individual hoja 2
    yTop2 = _pdfMembreteStd(doc, logo, {
      docTitulo: 'pH-metro',
      docSubtitulo: 'Entre tomas',
      codigoFormato: 'F-AA-264-4',
      folio: folioHoja2,
      margin: M,
      contentY: HDR
    }, FONT);
  };
  hdrP2();
  y = Math.max(yTop2 || 98, 98);
  doc.setFont(FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
  doc.text(asci('Calibracion, Comprobacion y/o Verificacion Entre Toma De Muestras'), M + CW / 2, y, { align: 'center' });
  y += 10;
  doc.setFont(FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...TEXT);
  doc.text(subTxt, M + CW / 2, y, { align: 'center' });
  y += 10;

  // AARMS phfix2: 14 columnas oficiales; anchos para evitar encimados en encabezado
  const heads14 = [
    'FECHA','HORA','FOLIO OMAR','NO. DE TOMA','ACTIVIDAD DE CONTROL',
    'LOTE','MARCA','BUFFER','LECTURA 1','LECTURA 2','LECTURA 3',
    'PROMEDIO','pH 25°C','ACEPTA O RECHAZA'
  ];
  const raw14 = [48, 36, 50, 48, 62, 46, 48, 42, 44, 44, 44, 50, 46, 70];
  const s14 = raw14.reduce((a, b) => a + b, 0);
  const cw14 = raw14.map(w => w * (CW / s14));

  const filas = buildFilasEntreTomas(regs);

  const ySec0 = y;
  y = _pdfBarraSeccion(doc, 'Registros entre tomas (todos los OMARs del plan)', M, y, CW, FONT);

  // Encabezado con wrap (evita "NO. DE TOMA" / "ACTIVIDAD DE CONTROL" encimados)
  const drawHead14 = () => {
    const rhH = 22;
    const totalWidth = cw14.reduce((s, w) => s + w, 0);
    doc.setFillColor(...DARK);
    doc.rect(M, y, totalWidth, rhH, 'F');
    doc.setFont(FONT, 'bold'); doc.setFontSize(5.6); doc.setTextColor(...WHITE);
    let cx = M;
    heads14.forEach((hh, i) => {
      const lines = doc.splitTextToSize(asci(hh), Math.max(18, cw14[i] - 3)).slice(0, 3);
      const startY = y + (rhH - lines.length * 6.2) / 2 + 5;
      lines.forEach((ln, li) => {
        doc.text(ln, cx + cw14[i] / 2, startY + li * 6.2, { align: 'center' });
      });
      cx += cw14[i];
    });
    y += rhH;
  };
  drawHead14();

  const rh = 11;
  let rowIdx = 0;
  let yBox0 = ySec0;
  const ACCENT = (window.STD && STD.ACCENT) || [37,99,235];
  const LGRAY = (window.STD && STD.LGRAY) || [248,250,252];
  const MGRAY = (window.STD && STD.MGRAY) || [208,216,228];
  const leftW14 = cw14.slice(0, 9).reduce((s, w) => s + w, 0);
  // AARMS phslopeaccept: merge solo L2+L3+PROMEDIO+pH25 (4 cols); ACEPTA queda fuera
  const mergeW14 = cw14.slice(9, 13).reduce((s, w) => s + w, 0);
  const aceW14 = cw14[13];
  const totalW14 = leftW14 + mergeW14 + aceW14;

  // AARMS phslopeaccept: CA — L1 + celdas vacías L2→ACEPTA (slope/badge se dibujan encima)
  const _phCaLeftVals = (row, actLbl) => {
    const esEntre = !!(row.calibGrupo || row.sinTomaFolio || row._entreDias);
    const l1v = (row.l1 != null && row.l1 !== '') ? String(row.l1) : 'PENDIENTE';
    return [
      fmtFecha(row.fecha),
      row.hora || '',
      esEntre ? '—' : folioOmarOf(row),
      esEntre ? '—' : String(row.toma || ''),
      actLbl,
      row.lote || '',
      row.marca || '',
      row.buffer || '',
      l1v,
      '', '', '', '', '' // L2→ACEPTA vacías (merge slope + badge encima)
    ].map(v => asci(cell(v)));
  };

  // AARMS phslopeaccept: ACEPTA CA = misma fn que Hoja 1 (±0.05 vs buffer vía _phAceptaRechaza 2-arg)
  const _phCaAceKind = (row) => {
    if(!row || row.l1 == null || String(row.l1).trim() === '') return null;
    const raw = (typeof _phAceptaRechaza === 'function')
      ? _phAceptaRechaza(row.l1, row.buffer)
      : null;
    if(raw == null || raw === '') return null;
    if(/^acepta$/i.test(String(raw))) return 'acepta';
    if(/^rechaza$/i.test(String(raw))) return 'rechaza';
    return null;
  };

  // AARMS phslopeaesthetic: solo letras ACCENT sobre el formato (sin borrar líneas ni cajas)
  const _phDrawCaSlopeGrande = (yTop, nRows, slopePctVal) => {
    const hMerge = rh * nRows;
    const txt = asci(slopePctVal ? ('SLOPE ' + slopePctVal + '%') : 'SLOPE ____');
    const x0 = M + leftW14;
    const x1 = x0 + mergeW14;
    const padX = 5;
    let fs = Math.min(14, hMerge - 6);
    doc.setFont(FONT, 'bold');
    doc.setFontSize(fs);
    while(doc.getTextWidth(txt) > mergeW14 - padX * 2 && fs > 10){
      fs -= 0.35;
      doc.setFontSize(fs);
    }
    const tw = doc.getTextWidth(txt);
    const avail = mergeW14 - padX * 2;
    const charSpace = Math.min(1.4, Math.max(0, (avail - tw) / Math.max(1, txt.length - 1)));
    doc.setTextColor(...ACCENT);
    // Encima del grid intacto — mismas celdas del formato, sin tocar bordes
    doc.text(txt, (x0 + x1) / 2, yTop + hMerge / 2 + fs * 0.32, { align: 'center', charSpace });
  };

  const _phDrawCaAceBadge = (yRow, kind) => {
    if(!kind || typeof _pdfBadgeAceptaRechaza !== 'function') return;
    const bx = M + leftW14 + mergeW14 + Math.max(1, (aceW14 - 50) / 2);
    const by = yRow + Math.max(0.5, (rh - 9) / 2);
    _pdfBadgeAceptaRechaza(doc, bx, by, kind, { compact: true, font: FONT });
  };

  for(let fi = 0; fi < filas.length; fi++){
    const r = filas[fi];
    const actPeek = actOficial(r.act) || (r._forcedV ? 'V' : '');
    const rNextPeek = filas[fi + 1];
    const actNextPeek = rNextPeek ? (actOficial(rNextPeek.act) || (rNextPeek._forcedV ? 'V' : '')) : '';
    const pairPeek = actPeek === 'CA' && actNextPeek === 'CA';
    const needH = pairPeek ? (rh * 2) : rh;
    if(y + needH > H - 118){
      _pdfCajaBorde(doc, M, yBox0, CW, Math.max(16, y - yBox0));
      doc.addPage('letter', 'landscape');
      hdrP2();
      y = Math.max(yTop2 || 98, 98) + 4;
      doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
      doc.text(asci('Calibracion, Comprobacion y/o Verificacion Entre Toma De Muestras (cont.)'), M + CW / 2, y, { align: 'center' });
      y += 10;
      yBox0 = y;
      y = _pdfBarraSeccion(doc, 'Registros entre tomas (cont.)', M, y, CW, FONT);
      drawHead14();
    }
    const act = actOficial(r.act) || (r._forcedV ? 'V' : '');
    const esCA = act === 'CA';
    const esCO = act === 'CO';
    const esEntreDias = !!(r.calibGrupo || r.sinTomaFolio || r._entreDias);
    const slopePct = String(r.slopePct || '').trim();

    let l1 = r.l1 || '';
    let l2 = r.l2 || '';
    let l3 = r.l3 || '';
    let promStr = '';
    let p25 = '';
    let ace = '';

    if(esCA){
      // AARMS phslopeaccept: merge L2→pH25 = SLOPE grande; ACEPTA badge real por renglón
      const r2 = filas[fi + 1];
      const act2 = r2 ? (actOficial(r2.act) || (r2._forcedV ? 'V' : '')) : '';
      const esPar = act2 === 'CA';
      const yTop = y;
      const slopeVal = slopePct || String((esPar && r2 && r2.slopePct) || '').trim();
      y = _pdfFilaTablaPremium(doc, _phCaLeftVals(r, act), M, y, cw14, rh, rowIdx, {
        fontSize: 5.8, maxChars: 12, font: FONT, blankEmpty: true
      });
      _phDrawCaAceBadge(yTop, _phCaAceKind(r));
      if(esPar){
        const y2 = y;
        y = _pdfFilaTablaPremium(doc, _phCaLeftVals(r2, 'CA'), M, y, cw14, rh, rowIdx + 1, {
          fontSize: 5.8, maxChars: 12, font: FONT, blankEmpty: true
        });
        _phDrawCaAceBadge(y2, _phCaAceKind(r2));
        // AARMS phslopeaesthetic: sin cellBorders en CA → celda merge limpia (sin rayas L2|L3|…)
        _phDrawCaSlopeGrande(yTop, 2, slopeVal);
        rowIdx += 2;
        fi++;
      } else {
        _phDrawCaSlopeGrande(yTop, 1, slopeVal);
        rowIdx++;
      }
      continue;
    }

    if(esCO || act === 'V'){
      const p = prom3(r.l1, r.l2, r.l3);
      promStr = p != null ? p.toFixed(2) : '';
      p25 = ph25Calc(r.l1, r.l2, r.l3);
      ace = aceCalc(r.l1, r.l2, r.l3, r.buffer);
      if(ace === 'PENDIENTE' && (r.pendienteBuf1 || r.pendienteBuf2)) ace = 'PENDIENTE';
    }

    const vals = [
      fmtFecha(r.fecha),
      r.hora || '',
      esEntreDias ? '—' : folioOmarOf(r),
      esEntreDias ? '—' : String(r.toma || ''),
      act,
      r.lote || '',
      r.marca || '',
      r.buffer || '',
      l1,
      l2,
      l3,
      promStr,
      p25,
      // AARMS phbadge: Acepta/Rechaza → badge en celda; PENDIENTE queda texto
      (/^acepta$/i.test(String(ace)) || /^rechaza$/i.test(String(ace))) ? '' : ace
    ].map(v => asci(cell(v)));
    const yRow = y;
    y = _pdfFilaTablaPremium(doc, vals, M, y, cw14, rh, rowIdx, {
      fontSize: 5.8, maxChars: 12, font: FONT
    });
    if(typeof _pdfBadgeAceptaRechaza === 'function'){
      let aceKind = null;
      if(/^acepta$/i.test(String(ace))) aceKind = 'acepta';
      else if(/^rechaza$/i.test(String(ace))) aceKind = 'rechaza';
      if(aceKind){
        let cx = M;
        for(let i = 0; i < 13; i++) cx += cw14[i];
        const bw = 50;
        const bx = cx + Math.max(1, (cw14[13] - bw) / 2);
        const by = yRow + Math.max(0.5, (rh - 9) / 2);
        _pdfBadgeAceptaRechaza(doc, bx, by, aceKind, { compact: true, font: FONT });
      }
    }
    rowIdx++;
  }
  if(!filas.length){
    doc.setFont(FONT, 'italic'); doc.setFontSize(8); doc.setTextColor(120);
    doc.text('Sin registros entre tomas capturados.', M + 8, y + 14);
    y += 24;
  }
  _pdfCajaBorde(doc, M, yBox0, CW, Math.max(16, y - yBox0));
  y += 8;

  const blmpFol = (omar && omar.blmp && (omar.blmp.folio || omar.blmp.aapt)) || '____';
  const notaBlmp = 'la limpieza entre lecturas se encuentra registrada en la bitacora BLMP____/AA/N-3/____ Folio. ' + asci(String(blmpFol));
  const codAct = 'CODIGO DE ACTIVIDAD DE CONTROL: CA: Calibracion · CO: Comprobacion · V: Verificacion';
  const crit = 'CRITERIO DE ACEPTACION O RECHAZO: La medicion no debe desviarse por mas de ± 0,05 UpH del valor nominal del patron de referencia. No debera haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas.';
  if(y > H - 160){
    doc.addPage('letter', 'landscape');
    hdrP2();
    y = Math.max(yTop2 || 98, 98);
    doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
    doc.text(asci('Calibracion, Comprobacion y/o Verificacion Entre Toma De Muestras (cont.)'), M + CW / 2, y, { align: 'center' });
    y += 10;
  }
  y = _pdfCajaLeyenda(doc, notaBlmp, M, y, CW, FONT, { fontSize: 6.5 });
  y = _pdfCajaLeyenda(doc, codAct, M, y, CW, FONT, { fontSize: 6.5 });
  y = _pdfCajaLeyenda(doc, crit, M, y, CW, FONT, { fontSize: 6.5 });
  y = _lote4bcCuerpoObs(doc, M, y, CW, '', FONT);

  // Firmas en la última página; pie de página se reescribe abajo con total real
  _pdfFirmaPremium(doc, '', '', {
    font: FONT, W, H, yOffset: 78, plan: planPh || undefined
  });

  // AARMS phnum: pie con numeración real al final
  const totalPag = doc.getNumberOfPages();
  for(let i = 1; i <= totalPag; i++){
    doc.setPage(i);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const mx = 18;
    doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
    doc.text('Pag. ' + i + ' de ' + totalPag, pw - mx, ph - 22, { align: 'right' });
    doc.setFont(FONT, 'normal'); doc.setFontSize(6.5); doc.setTextColor(120);
    doc.text('F-AA-264-4', pw - mx, ph - 12, { align: 'right' });
  }

  const pdfSlug = planPh && planPh.id
    ? `Plan-${String(planPh.folio || planPh.id || '').replace(/[^\w\-]+/g, '_')}`
    : `OMAR-${(omar && (omar.folio || omar.ts)) || 'ph'}`;
  doc.save(`bitacora_ph_${pdfSlug}.pdf`);
  toast('PDF bitácora pH F-AA-264-4 (plan completo) generado','g');
  if(typeof _maybeMarcarPlanDoc === 'function') await _maybeMarcarPlanDoc('phcam');
};


// AARMS lote8e: Temperatura y Flujos no tienen PDF propio. Las lecturas se imprimen en el Machiote.
// Exponer para onclick en HTML y app.js (drawer / FAB)
window.abrirPagBpm=abrirPagBpm;
window.validarBpmParaPdf=validarBpmParaPdf;
window.guardarBpmPage=guardarBpmPage;
window.generarPDFBpm=generarPDFBpm;
window.abrirPagBm=abrirPagBm;
window.regenerarBMDesdeDatos=regenerarBMDesdeDatos;
window.aplicarBmDesdeHojaCampo=aplicarBmDesdeHojaCampo;
window.bmGoStep=bmGoStep;
window.bmStepNav=bmStepNav;
window.guardarBmPage=guardarBmPage;
window.generarPDFBm=generarPDFBm;
window.abrirPagPh2644Lab=abrirPagPh2644Lab;
window.guardarPh1Page=guardarPh1Page;
window.generarPDFPh2644H1=generarPDFPh2644H1;
window.cerrarDocSuite=cerrarDocSuite;

// ═══════════════════════════════════════════════════════════════
// AARMS sub7-od: PDF Bitácora OD — 4 páginas (NMX-AA-012 / F-AA-114-18 OD)
// AARMS sub8-pdfs: tablas/firma premium (helpers Machiote, Helvetica); columnas oficiales intactas
// ═══════════════════════════════════════════════════════════════
function _pdfODFirma(doc, paginaLabel){
  // AARMS sub8-pdfs: delega a firma genérica (formato OD)
  const _firmaPrem = window._pdfFirmaPremium || _pdfFirmaPremium;
  return _firmaPrem(doc, paginaLabel, 'F-AA-114-18 OD', { font: 'helvetica', W: 612, H: 792, yOffset: 70 });
}

function _pdfODTablaSimple(doc, y, heads, rows, M, CW, NAVY, ACCENT, LGRAY, WHITE, MGRAY){
  const FONT = 'helvetica';
  const _hdrPrem = window._pdfHeaderTablaPremium || _pdfHeaderTablaPremium;
  const _filaPrem = window._pdfFilaTablaPremium || _pdfFilaTablaPremium;
  const n = heads.length;
  const cws = heads.map(() => CW / n);
  const rh = 11;
  y = _hdrPrem(doc, heads, M, y, cws, 12, FONT);
  (rows || []).forEach((row, ri) => {
    const vals = (row || []).map(v => jsPdfAscii(String(v == null || v === '' ? '' : v)));
    y = _filaPrem(doc, vals, M, y, cws, rh, ri, {
      firstAccent: true, fontSize: 6.2, maxChars: 18, font: FONT
    });
  });
  return y + 8;
}

async function _pdfODPag1(doc, plan, logo){
  // AARMS sub10-std
  const W=612, H=792, M=28, HDR=86;
  const FONT='helvetica';
  const NAVY=STD.NAVY;
  const _lv = window._pdfLabelValor || _pdfLabelValor;
  const CW = W - M * 2;
  _pdfMembreteStd(doc, logo, {
    docTitulo: 'OXIGENO DISUELTO',
    docSubtitulo: 'Pag. 1/4 — Datos',
    codigoFormato: 'F-AA-114-18 OD',
    margin: M,
    contentY: HDR
  }, FONT);
  let y = HDR + 6;
  const bit = plan.bitOD || {};
  const eqOx = typeof _equipoActivo === 'function' ? _equipoActivo('oximetros') : null;
  const clave = eqOx && typeof _equipoClave === 'function' ? _equipoClave('oximetros', eqOx) : '-';
  const codigo = typeof _codigoBitacora === 'function' ? _codigoBitacora('BPA', 'oximetros') : 'BPA';
  y = _pdfSeccionStd(doc, 'Datos generales', M, y, CW, (yy) => {
    [['Codigo bitacora:', codigo],['Folio:', bit.folio || '-'],['Equipo oximetro:', clave],['Plan:', plan.folio || plan.id || '-'],['Norma:', 'NMX-AA-012-SCFI-2001']].forEach(([lab, val]) => {
      _lv(doc, lab, jsPdfAscii(String(val)), M + 4, yy + 4, 110, FONT);
      yy += 14;
    });
    return yy + 4;
  }, FONT);
  y = _pdfSeccionStd(doc, 'Reactivos / estandares', M, y, CW, (yy) => {
    const R = bit.reactivos || {};
    [['Lote 0 mg/L:', R.lote_zero],['Cad. 0 mg/L:', R.cad_zero],['Lote 100% sat:', R.lote_sat],['Cad. 100% sat:', R.cad_sat],['Agua reactivo:', R.agua_reactivo_lote]].forEach(([lab, val]) => {
      _lv(doc, lab, jsPdfAscii(String(val || '-')), M + 4, yy + 4, 100, FONT);
      yy += 14;
    });
    return yy + 4;
  }, FONT);
  y = _pdfCajaLeyenda(doc, 'Atemperar estandares segun procedimiento del oximetro antes de calibracion lab/campo.', M, y, CW, FONT, { fontSize:7.2 });
  _pdfODFirma(doc, 'Pag. 1 de 4');
}

async function _pdfODPag2(doc, plan, logo){
  // AARMS sub10-std
  const W=612, M=28, HDR=86, CW=W-M*2;
  const FONT='helvetica';
  const NAVY=STD.NAVY, ACCENT=STD.ACCENT, LGRAY=STD.LGRAY, WHITE=STD.WHITE, MGRAY=STD.MGRAY;
  _pdfMembreteStd(doc, logo, { docTitulo:'OXIGENO DISUELTO', docSubtitulo:'Pag. 2/4 — Laboratorio', codigoFormato:'F-AA-114-18 OD', margin:M, contentY:HDR }, FONT);
  let y = HDR + 6;
  const bit = plan.bitOD || {};
  const z = bit.calibLab?.zero || {}, s = bit.calibLab?.sat100 || {};
  y = _pdfSeccionStd(doc, 'Tabla 1 — Calibracion laboratorio', M, y, CW, (yy) =>
    _pdfODTablaSimple(doc, yy, ['Punto','Fecha','Hora','Temp','Lectura','Criterio','Acepta'], [
      ['0 mg/L', z.fecha, z.hora, z.temp, z.lectura, z.criterio, z.acepta],
      ['100% sat', s.fecha, s.hora, s.temp, s.lectura, s.criterio, s.acepta]
    ], M, CW, NAVY, ACCENT, LGRAY, WHITE, MGRAY), FONT);
  const vrows = (bit.verifLab || []).map((r,i) => [String(i+1), r.fecha, r.hora, r.temp, r.lectura, r.criterio, r.acepta]);
  if(!vrows.length) vrows.push(['-','-','-','-','-','-','-']);
  y = _pdfSeccionStd(doc, 'Tabla 2 — Verificacion laboratorio', M, y, CW, (yy) =>
    _pdfODTablaSimple(doc, yy, ['#','Fecha','Hora','Temp','Lectura','Criterio','Acepta'], vrows, M, CW, NAVY, ACCENT, LGRAY, WHITE, MGRAY), FONT);
  _pdfODFirma(doc, 'Pag. 2 de 4');
}

async function _pdfODPag3(doc, plan, logo){
  // AARMS sub10-std
  const W=612, M=28, HDR=86, CW=W-M*2;
  const FONT='helvetica';
  const NAVY=STD.NAVY, ACCENT=STD.ACCENT, LGRAY=STD.LGRAY, WHITE=STD.WHITE, MGRAY=STD.MGRAY;
  _pdfMembreteStd(doc, logo, { docTitulo:'OXIGENO DISUELTO', docSubtitulo:'Pag. 3/4 — Campo', codigoFormato:'F-AA-114-18 OD', margin:M, contentY:HDR }, FONT);
  let y = HDR + 6;
  const bit = plan.bitOD || {};
  const z = bit.calibCampo?.zero || {}, s = bit.calibCampo?.sat100 || {};
  y = _pdfSeccionStd(doc, 'Tabla 3 — Calibracion campo', M, y, CW, (yy) =>
    _pdfODTablaSimple(doc, yy, ['Punto','Fecha','Hora','Temp','Lectura','Criterio','Acepta'], [
      ['0 mg/L', z.fecha, z.hora, z.temp, z.lectura, z.criterio, z.acepta],
      ['100% sat', s.fecha, s.hora, s.temp, s.lectura, s.criterio, s.acepta]
    ], M, CW, NAVY, ACCENT, LGRAY, WHITE, MGRAY), FONT);
  const vrows = (bit.verifCampo || []).map((r,i) => [String(i+1), r.fecha, r.hora, r.temp, r.lectura, r.criterio, r.acepta]);
  if(!vrows.length) vrows.push(['-','-','-','-','-','-','-']);
  y = _pdfSeccionStd(doc, 'Tabla 4 — Verificacion campo', M, y, CW, (yy) =>
    _pdfODTablaSimple(doc, yy, ['#','Fecha','Hora','Temp','Lectura','Criterio','Acepta'], vrows, M, CW, NAVY, ACCENT, LGRAY, WHITE, MGRAY), FONT);
  _pdfODFirma(doc, 'Pag. 3 de 4');
}

async function _pdfODPag4(doc, plan, logo){
  // AARMS sub10-std
  const W=612, M=28, HDR=86, CW=W-M*2;
  const FONT='helvetica';
  const NAVY=STD.NAVY, ACCENT=STD.ACCENT, LGRAY=STD.LGRAY, WHITE=STD.WHITE, MGRAY=STD.MGRAY;
  _pdfMembreteStd(doc, logo, { docTitulo:'OXIGENO DISUELTO', docSubtitulo:'Pag. 4/4 — Lecturas', codigoFormato:'F-AA-114-18 OD', margin:M, contentY:HDR }, FONT);
  let y = HDR + 6;
  const regs = [...((plan.bitOD && plan.bitOD.lecturas) || [])].sort((a,b)=>Number(a.toma)-Number(b.toma));
  const rows = regs.map(r => {
    const prom = typeof _odPromedioLectura === 'function' ? _odPromedioLectura(r) : NaN;
    let temp = '-';
    if(typeof _bitTempPromAguaPorToma === 'function'){
      const tv = _bitTempPromAguaPorToma(r.omarTs, r.toma);
      if(!isNaN(tv)) temp = tv.toFixed(1);
    }
    return [String(r.toma), r.fecha||'', r.hora||'', r.folioOmar||'', temp, r.lectura1||'', r.lectura2||'', isNaN(prom)?'':prom.toFixed(2), r.horaFinal||''];
  });
  if(!rows.length) rows.push(['-','-','-','-','-','-','-','-','-']);
  y = _pdfSeccionStd(doc, 'Tabla 5 — Lecturas OD por toma', M, y, CW, (yy) =>
    _pdfODTablaSimple(doc, yy, ['#','Fecha','Hora','OMAR','Temp','L1','L2','Prom','H.fin'], rows, M, CW, NAVY, ACCENT, LGRAY, WHITE, MGRAY), FONT);
  _pdfODFirma(doc, 'Pag. 4 de 4');
}

async function _lote17GenerarPDFOD(plan){
  if(!plan){ toast('Selecciona un plan','w'); return; }
  if(typeof _lote17OdAsegurar === 'function') _lote17OdAsegurar(plan);
  if(typeof _lote17OdSyncLecturas === 'function') _lote17OdSyncLecturas(plan);
  let b = plan.bitOD || {};
  if((typeof _lote17OdVerifRechazada === 'function') && (_lote17OdVerifRechazada(plan, 'lab') || _lote17OdVerifRechazada(plan, 'campo'))){
    toast('La verificación se rechazó. Repítela para generar el PDF.','w');
    return;
  }
  if(typeof _lote17OdTieneDatos === 'function' && _lote17OdTieneDatos(b) && typeof _lote17OdAsegurarFolios === 'function'){
    await _lote17OdAsegurarFolios(plan);
  }else if(!(b.folios || []).length && typeof _lote17OdAsegurarFolios === 'function'){
    await _lote17OdAsegurarFolios(plan);
  }
  // AARMS lote18: el folio queda en el objeto que acaba de reservarlo.
  b = plan.bitOD || b;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'pt', format:'letter', compress:true });
  const fuente = typeof _pdfBmAplicarRoboto === 'function' ? await _pdfBmAplicarRoboto(doc) : 'helvetica';
  const W = 612, H = 792, M = 36, CW = W - M * 2;
  const anio = typeof _lote17Anio2 === 'function' ? _lote17Anio2(plan) : '';
  const lects = b.lecturas || [];
  const paginas = 4 + Math.max(0, Math.ceil(lects.length / 14) - 1);
  const folios = (b.folios || []).slice();
  while(folios.length < paginas) folios.push('');
  const eq = typeof _equipoActivo === 'function' ? _equipoActivo('oximetros') : null;
  const clave = (eq && typeof _equipoClave === 'function') ? _equipoClave('oximetros', eq) : '';
  const dis = (typeof _lote17OdDisoluciones === 'function') ? _lote17OdDisoluciones() : [{}, {}];
  const mu = typeof _muestreadorActual === 'function' ? _muestreadorActual() : {};
  const su = (plan.firmas && plan.firmas.supervisor) || {};
  const omarFolios = [];
  lects.forEach(r => { if(r.folioOmar && omarFolios.indexOf(r.folioOmar) < 0) omarFolios.push(r.folioOmar); });
  const txt = (t, x, y, w, size, lead) => _lote16Texto(doc, fuente, t, x, y, w, size, lead);
  const logo = (typeof loadLogo === 'function') ? await loadLogo('logo.png') : null;
  const cuerpo = 11, lead = 15.5;
  // AARMS lote18: el membrete sube y el pie queda en las firmas.
  const pie = (n, folio) => {
    _lote18Firmas(doc, fuente, { suFirma: su.firmaPng || '', suNombre: su.nombre || '', muFirma: mu.firmaPng || '', muNombre: mu.nombre || '' }, W, H, M);
    _lote18Codigo(doc, fuente, '', 'ODC-1/' + n + ' DE ' + paginas, W, H, M, false);
  };
  const abre = async (folio) => _lote18Encabezado(doc, fuente, folio, { logo, m: M, regla: true });
  const tablaCal = (y, filas) => {
    // AARMS lote19b: el texto del encabezado queda como en el formato oficial.
    const heads = ['Fecha','Hora','Operación Realizada','Lectura Inicial','Ajuste','Lectura Final','Unidades'];
    const ws = [64, 42, 184, 68, 56, 74, 52];
    doc.setFont(fuente, 'bold'); doc.setFontSize(8); doc.setTextColor(20, 24, 32);
    doc.setFillColor(226, 232, 240); doc.setDrawColor(40, 48, 64); doc.setLineWidth(0.4);
    let x = M;
    heads.forEach((h, i) => {
      doc.setFillColor(226, 232, 240); doc.setTextColor(20, 24, 32);
      doc.rect(x, y, ws[i], 28, 'FD');
      doc.text(h, x + 2, y + 12, { maxWidth: ws[i] - 4 });
      x += ws[i];
    });
    y += 28;
    filas.forEach(f => {
      const vals = [f.fecha||'', f.hora||'', f.op, f.ini||'', f.ajuste||'', f.fin||'', '%'];
      x = M;
      doc.setFont(fuente, 'normal'); doc.setFontSize(9);
      const alto = 36;
      vals.forEach((v, i) => {
        doc.rect(x, y, ws[i], alto);
        const lines = doc.splitTextToSize(String(v), ws[i] - 4);
        doc.text(lines.slice(0, 2), x + 2, y + 14);
        x += ws[i];
      });
      y += alto;
    });
    return y;
  };
  const tablaVer = (y, v, rotulo) => {
    const prom = (typeof _lote17OdProm === 'function') ? _lote17OdProm(v.l1, v.l2) : NaN;
    const dic = (String(v.l1||'').trim() && String(v.l2||'').trim() && typeof _lote17OdDictamen === 'function') ? _lote17OdDictamen(prom) : '';
    // AARMS lote19b: el rótulo del encabezado sigue al oficial. La columna Resultado se queda, con el dictamen calculado.
    const heads = ['Fecha','Hora',rotulo,'Lectura 1','Lectura 2','Lectura promedio','Criterio','Unidades','Resultado'];
    const ws = [64, 42, 52, 48, 48, 64, 52, 46, 124];
    const headH = 40;
    doc.setFont(fuente, 'bold'); doc.setFontSize(7); doc.setTextColor(20, 24, 32);
    doc.setFillColor(226, 232, 240); doc.setDrawColor(40, 48, 64);
    let x = M;
    heads.forEach((h, i) => {
      doc.setFillColor(226, 232, 240); doc.setTextColor(20, 24, 32);
      doc.rect(x, y, ws[i], headH, 'FD');
      const lines = doc.splitTextToSize(h, ws[i] - 4);
      doc.text(lines.slice(0, 3), x + 2, y + 10);
      x += ws[i];
    });
    y += headH;
    const vals = [v.fecha||'', v.hora||'', 'Control', v.l1||'', v.l2||'', Number.isFinite(prom) ? prom.toFixed(2) : '', '0 – 1.6', '%', dic];
    x = M;
    doc.setFont(fuente, 'normal'); doc.setFontSize(9);
    vals.forEach((val, i) => { doc.rect(x, y, ws[i], 26); doc.text(String(val), x + 2, y + 16, { maxWidth: ws[i] - 3 }); x += ws[i]; });
    return y + 26;
  };
  const d0 = dis[0] || {}, d1 = dis[1] || {};
  const zL = (b.calibLab && b.calibLab.zero) || {};
  const sL = (b.calibLab && b.calibLab.sat) || {};
  const zC = (b.calibCampo && b.calibCampo.zero) || {};
  const sC = (b.calibCampo && b.calibCampo.sat) || {};

  const aspectos = () => {
    y = txt('En caso de tener problemas durante la estandarización, revisar los siguientes aspectos:', M, y, CW, cuerpo, lead) + 2;
    y = _lote18Num(doc, fuente, 1, 'La membrana se encuentra perforada lo cual genera suciedad en la superficie del cátodo siendo esto una interferencia. En este caso reemplazar la membrana vieja por una nueva, véase el manual MMA/AA/N-3.', M + 8, y, CW - 8, cuerpo, lead) + 2;
    y = _lote18Num(doc, fuente, 2, 'El electrodo está sucio. De ser así, lavar el electrodo con agua tridestilada hasta que toda la suciedad haya desaparecido.', M + 8, y, CW - 8, cuerpo, lead) + 2;
    y = _lote18Num(doc, fuente, 3, 'La presencia de sal en las muestras puede afectar la estandarización del oxímetro.', M + 8, y, CW - 8, cuerpo, lead) + 2;
    y = txt('Si la falla o error no es atribuible a las causas antes mencionadas, comunicarlo al supervisor.', M, y, CW, cuerpo, lead) + 8;
  };
  const calibTxt = (tabla) => {
    y = txt('La calibración se realiza en los siguientes 2 puntos:', M, y, CW, cuerpo, lead) + 2;
    y = _lote18Num(doc, fuente, 1, 'Utilizando la disolución estándar de calibración de concentración 0 mg/l ó nula.', M + 8, y, CW - 8, cuerpo, lead) + 1;
    y = _lote18Num(doc, fuente, 2, 'Exponiendo al ambiente sin restricción la celda hasta obtener aproximadamente el 100% de saturación.', M + 8, y, CW - 8, cuerpo, lead) + 2;
    y = txt(tabla, M, y, CW, cuerpo, lead) + 8;
  };

  let y = await abre(folios[0]);
  y += 8;
  doc.setFont(fuente, 'bold'); doc.setFontSize(13); doc.setTextColor(20,24,32);
  doc.text('BITÁCORA DE OXÍGENO DISUELTO EN CAMPO', W / 2, y, { align:'center' });
  y += 16;
  doc.setFontSize(11);
  doc.text('NMX-AA-012-SCFI-2001', W / 2, y, { align:'center' });
  y += 28;
  doc.setFont(fuente, 'bold'); doc.setFontSize(11);
  doc.text('FECHA: ' + (plan.fecha || ''), W - M, y, { align:'right' });
  y += 24;
  y = txt('FOLIOS OMAR: ' + omarFolios.join(', '), M, y, CW, cuerpo, lead) + 18;
  y = txt('Código del procedimiento utilizado: ' + (b.proc || '') + ', el Procedimiento para este analito se encuentra en la bitácora BPA/AA/N-3/' + anio + ' en los folios ' + (b.bpaDesde || '') + ' al ' + (b.bpaHasta || '') + '.', M, y, CW, cuerpo, lead) + 18;
  doc.setFont(fuente, 'bold'); doc.setFontSize(12); doc.text('EQUIPO UTILIZADO', M, y); y += 20;
  y = txt('AA/OX/' + (clave ? String(clave).replace(/^AA\/OX\//, '') : '') + '.', M, y, CW, cuerpo, lead) + 18;
  doc.setFont(fuente, 'bold'); doc.setFontSize(12); doc.text('REACTIVOS', M, y); y += 20;
  y = txt('Disolución concentración nula estándar de calibración (0 mgO₂/L) No. lote ' + (d0.lote || '') + ' Trasvase a recipiente No. ' + (d0.recipiente || '') + ' la preparación de esta disolución se encuentra registrada en la bitácora BDBO5D/AA/N-3/' + anio + ' en el folio: ' + (d0.folioBdbo || ''), M, y, CW, cuerpo, lead) + 14;
  y = txt('Disolución concentración nula estándar de trabajo (0 mgO₂/L) No. lote ' + (d1.lote || '') + ' Trasvase a recipiente No. ' + (d1.recipiente || '') + ' la preparación de esta disolución se encuentra registrada en la bitácora BDBO5D/AA/N-3/' + anio + ' en el folio: ' + (d1.folioBdbo || ''), M, y, CW, cuerpo, lead) + 18;
  doc.setFont(fuente, 'bold'); doc.setFontSize(12); doc.text('CONTROL DE VERIFICACIÓN', M, y); y += 20;
  y = txt('Se utiliza como control de verificación la disolución de concentración nula, (estándar de trabajo 0 mgO₂/L).', M, y, CW, cuerpo, lead) + 12;
  y = txt('El criterio de aceptación para este control se encuentra en el manual MCA/AA/N-3, apartado CAOD/AA/M-8.', M, y, CW, cuerpo, lead) + 18;
  doc.setFont(fuente, 'bold'); doc.setFontSize(12); doc.text('ATEMPERAR LOS ESTÁNDARES EN LABORATORIO', M, y); y += 20;
  txt('Siendo las ' + (b.horaAtemp || '') + ' hrs., se procede a atemperar los estándares de calibración y trabajo, a la temperatura ambiental de laboratorio.', M, y, CW, cuerpo, lead);
  pie(1, folios[0]);

  doc.addPage();
  y = await abre(folios[1]);
  y += 10;
  doc.setFont(fuente, 'bold'); doc.setFontSize(12); doc.text('CALIBRACIÓN DEL EQUIPO EN LABORATORIO', M, y); y += 16;
  calibTxt('Los datos se registran en la tabla #1');
  doc.setFont(fuente, 'bold'); doc.setFontSize(11); doc.text('Tabla # 1  datos de calibración de Oxímetro en laboratorio', W / 2, y, { align:'center' }); y += 8;
  y = tablaCal(y, [
    Object.assign({ op:'Calibración a 0 mg/L ó concentración nula' }, zL),
    Object.assign({ op:'Calibración / Concentración al 100%' }, sL)
  ]) + 8;
  aspectos();
  doc.setFont(fuente, 'bold'); doc.setFontSize(12); doc.text('VERIFICACIÓN DEL EQUIPO EN LABORATORIO', M, y); y += 16;
  y = txt('En la verificación se utiliza la disolución estándar de trabajo de concentración 0 mgO₂/L ó nula, como control analítico y los datos obtenidos se registran en la tabla # 2', M, y, CW, cuerpo, lead) + 8;
  doc.setFont(fuente, 'bold'); doc.setFontSize(11); doc.text('Tabla # 2  datos de verificación de Oxímetro en laboratorio', W / 2, y, { align:'center' }); y += 8;
  tablaVer(y, b.verifLab || {}, 'Verificación en Laboratorio');
  pie(2, folios[1]);

  doc.addPage();
  y = await abre(folios[2]);
  y += 10;
  doc.setFont(fuente, 'bold'); doc.setFontSize(12); doc.text('CALIBRACIÓN DEL EQUIPO EN CAMPO', M, y); y += 16;
  calibTxt('Los datos se registran en la tabla # 3');
  doc.setFont(fuente, 'bold'); doc.setFontSize(11); doc.text('Tabla # 3  datos de calibración de Oxímetro en campo', W / 2, y, { align:'center' }); y += 8;
  y = tablaCal(y, [
    Object.assign({ op:'Calibración a 0 mg/L ó concentración nula' }, zC),
    Object.assign({ op:'Calibración / Concentración al 100%' }, sC)
  ]) + 8;
  aspectos();
  doc.setFont(fuente, 'bold'); doc.setFontSize(12); doc.text('VERIFICACIÓN DEL EQUIPO EN CAMPO', M, y); y += 16;
  y = txt('En la verificación se utiliza la disolución estándar de trabajo de concentración 0 mgO₂/L ó nula, como control analítico y los datos obtenidos se registran en la tabla # 4', M, y, CW, cuerpo, lead) + 8;
  doc.setFont(fuente, 'bold'); doc.setFontSize(11); doc.text('Tabla # 4  datos de verificación de Oxímetro en campo', W / 2, y, { align:'center' }); y += 8;
  tablaVer(y, b.verifCampo || {}, 'Verificación en campo');
  pie(3, folios[2]);

  const dibujaT5 = async (inicio, folio, n) => {
    doc.addPage();
    y = await abre(folio);
    y += 8;
    doc.setFont(fuente, 'bold'); doc.setFontSize(12); doc.setTextColor(20,24,32);
    if(inicio === 0){
      doc.text('PROCEDIMIENTO', M, y); y += 16;
      y = txt('La lectura de oxígeno disuelto se realiza como a continuación se describe:', M, y, CW, cuerpo, lead) + 2;
      y = _lote18Num(doc, fuente, 1, 'Tomar una porción de muestra, evitando en medida de lo posible agitar la para evitar formación de burbujas e intercambio gaseoso con el ambiente.', M + 8, y, CW - 8, cuerpo, lead) + 1;
      y = _lote18Num(doc, fuente, 2, 'Sumergir el electrodo en la muestra y esperar a que la lectura se estabilice.', M + 8, y, CW - 8, cuerpo, lead) + 1;
      y = _lote18Num(doc, fuente, 3, 'Registrar los datos en la tabla # 5.', M + 8, y, CW - 8, cuerpo, lead) + 1;
      y = _lote18Num(doc, fuente, 4, 'Tomar lecturas por duplicado, repitiendo el procedimiento aquí descrito a partir del punto 2.', M + 8, y, CW - 8, cuerpo, lead) + 6;
      const primero = omarFolios[0] || '';
      const ultimo = omarFolios[omarFolios.length - 1] || '';
      y = txt('La temperatura de las muestras se encuentra registrada en la bitácora de hoja de campo BHCAR/AA/N-3/' + anio + ' en el folio OMAR ' + primero + ' al folio OMAR ' + ultimo + '.', M, y, CW, cuerpo, lead) + 10;
    }
    doc.setFont(fuente, 'bold'); doc.setFontSize(11);
    doc.text(inicio === 0 ? 'Tabla # 5 datos obtenidos en campo' : 'Tabla # 5 datos obtenidos en campo (continuación)', W / 2, y, { align:'center' });
    y += 8;
    // AARMS lote19b: encabezados de la Tabla 5 como en el formato oficial. Mismas columnas.
    const heads = ['Fecha','Hora','Folio OMAR','Identificación de la muestra','Tiempo','Lectura 1','Lectura 2','Promedio OD (mgO₂/L)'];
    const ws = [58, 40, 62, 130, 48, 62, 62, 78];
    const reserva = inicio === 0 ? 48 : 8;
    const cabe = Math.max(16, Math.min(26, Math.floor((H - 130 - y - reserva) / 14)));
    const headH = 36;
    let x = M;
    doc.setFont(fuente, 'bold'); doc.setFontSize(8); doc.setTextColor(20, 24, 32);
    doc.setFillColor(226, 232, 240); doc.setDrawColor(40, 48, 64);
    heads.forEach((h, i) => {
      doc.setFillColor(226, 232, 240); doc.setTextColor(20, 24, 32);
      doc.rect(x, y, ws[i], headH, 'FD');
      doc.text(h, x + 2, y + 12, { maxWidth: ws[i] - 4 });
      x += ws[i];
    });
    y += headH;
    for(let i = 0; i < 14; i++){
      const r = lects[inicio + i];
      if(!r){
        doc.rect(M, y, CW, cabe);
        if(typeof _pdfTacharFila === 'function') _pdfTacharFila(doc, M, y, CW, cabe);
      }else{
        const prom = (typeof _lote17OdProm === 'function') ? _lote17OdProm(r.l1, r.l2) : NaN;
        const vals = [r.fecha||'', r.hora||'', r.folioOmar||'', r.idMuestra||'', r.tiempo||'', r.l1||'', r.l2||'', Number.isFinite(prom) ? prom.toFixed(2) : ''];
        x = M;
        doc.setFont(fuente, 'normal'); doc.setFontSize(8);
        vals.forEach((val, k) => { doc.rect(x, y, ws[k], cabe); doc.text(String(val), x + 2, y + cabe / 2 + 3, { maxWidth: ws[k] - 3 }); x += ws[k]; });
      }
      y += cabe;
    }
    if(inicio === 0){
      y += 12;
      doc.setFont(fuente, 'bold'); doc.setFontSize(11);
      doc.text('HORA  ' + (b.horaFin || ''), M, y); y += 14;
      txt('Una vez terminada las lecturas lavar el electrodo con agua tridestilada, secar y apagar el equipo.', M, y, CW, cuerpo, lead);
    }
    pie(n, folio);
  };
  const bloques = Math.max(1, Math.ceil(lects.length / 14) || 1);
  for(let p = 0; p < bloques; p++) await dibujaT5(p * 14, folios[3 + p], 4 + p);

  doc.save('OD_' + (folios[0] || plan.folio || 'plan') + '.pdf');
  toast('PDF de oxígeno disuelto generado','g');
  if(typeof _maybeMarcarPlanDoc === 'function') await _maybeMarcarPlanDoc('bitod');
  // AARMS lote21d: generar el OD viejo no vuelve a escribir el plan.
}

async function generarPDFBitOD(){
  const plan0 = (typeof _planActivo === 'function' && _planActivo())
    || (typeof getPlanDeMuestreo === 'function' && omar?.ts ? getPlanDeMuestreo(omar.ts) : null);
  if(plan0 && typeof _lote17OdEsViejo === 'function' && !_lote17OdEsViejo(plan0)){
    return _lote17GenerarPDFOD(plan0);
  }
  const plan = plan0;
  if(!plan){ toast('Selecciona un plan','w'); return; }
  if(typeof _bitODInicializar === 'function') _bitODInicializar(plan);
  if(!plan.bitOD){ toast('No hay datos de OD','w'); return; }
  // AARMS sub8-pdfs: 4 páginas con helpers premium (Helvetica)
  const { jsPDF } = window.jspdf;
  const logo = await loadLogo(LOGO_PDF_URI);
  const doc = new jsPDF({ orientation:'portrait', unit:'pt', format:'letter', compress:true });
  await _pdfODPag1(doc, plan, logo);
  doc.addPage();
  await _pdfODPag2(doc, plan, logo);
  doc.addPage();
  await _pdfODPag3(doc, plan, logo);
  doc.addPage();
  await _pdfODPag4(doc, plan, logo);
  const folio = plan.bitOD.folio || plan.folio || 'sin-folio';
  const fecha = (typeof _lote21HoyFecha==='function'?_lote21HoyFecha():_lote4hoy().fecha);
  doc.save(`Bitacora_OD_${folio}_${fecha}.pdf`);
  toast('PDF Bitacora OD (4 paginas) generado','g');
  if(typeof _maybeMarcarPlanDoc === 'function') await _maybeMarcarPlanDoc('bitod');
}
window.generarPDFBitOD = generarPDFBitOD;
window._pdfODPag1 = _pdfODPag1;
window._pdfODPag2 = _pdfODPag2;
window._pdfODPag3 = _pdfODPag3;
window._pdfODPag4 = _pdfODPag4;

// AARMS v65: versiones Blob de generadores PDF (documents-suite)
async function generarPDFBpmBlob(){
  const cap = window._pdfCaptureOutput;
  if(typeof cap !== 'function') return null;
  return cap(() => generarPDFBpm());
}
async function generarPDFPh2644H1Blob(){
  const cap = window._pdfCaptureOutput;
  if(typeof cap !== 'function') return null;
  return cap(() => generarPDFPh2644H1());
}
async function generarPDFBmBlob(){
  const cap = window._pdfCaptureOutput;
  if(typeof cap !== 'function') return null;
  return cap(() => generarPDFBm());
}
async function generarPDFBitacoraPHOficialBlob(){
  const cap = window._pdfCaptureOutput;
  if(typeof cap !== 'function') return null;
  return cap(() => generarPDFBitacoraPHOficial());
}
async function generarPDFBitODBlob(){
  const cap = window._pdfCaptureOutput;
  if(typeof cap !== 'function') return null;
  return cap(() => generarPDFBitOD());
}
window.generarPDFBpmBlob = generarPDFBpmBlob;
window.generarPDFPh2644H1Blob = generarPDFPh2644H1Blob;
window.generarPDFBmBlob = generarPDFBmBlob;
window.generarPDFBitacoraPHOficialBlob = generarPDFBitacoraPHOficialBlob;
window.generarPDFBitODBlob = generarPDFBitODBlob;

// ═══════════════════════════════════════════════════════════════
// AARMS blmpfiel + blmppulido + blmppulido2: PDF BLMP fiel LMP-1 (2 páginas)
// Tildes: sub51b (_pdfBmAplicarRoboto + Roboto) — conectado al render BLMP
// ═══════════════════════════════════════════════════════════════
window._blmpGenerarPdfFiel = async function _blmpGenerarPdfFiel(rec){
  if(!rec || !rec.aapt){
    if(typeof toast === 'function') toast('Sin registro BLMP para PDF','w');
    return;
  }
  const { jsPDF } = window.jspdf || {};
  if(!jsPDF){ if(typeof toast === 'function') toast('jsPDF no disponible','w'); return; }
  const logo = (typeof loadLogo === 'function') ? await loadLogo(typeof LOGO_PDF_URI !== 'undefined' ? LOGO_PDF_URI : 'logo_pdf.png') : null;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter', compress: true });
  // AARMS blmppulido2 / sub51b-tildes: Roboto obligatorio para acentos y ñ
  let FONT = 'helvetica';
  if(typeof _pdfBmAplicarRoboto === 'function'){
    FONT = await _pdfBmAplicarRoboto(doc) || 'helvetica';
  }
  if(FONT !== 'Roboto'){
    console.warn('[blmppulido2] Roboto no cargó — tildes pueden fallar. FONT=', FONT);
  }
  const W = 612, H = 792, M = 28, CW = W - M * 2;
  const NAVY = STD.NAVY, ACCENT = STD.ACCENT, LGRAY = STD.LGRAY, MGRAY = STD.MGRAY, TEXT = STD.TEXT, WHITE = STD.WHITE, DARK = STD.DARK;
  // AARMS blmpfolio2: cada página física = folio propio consecutivo (como pH)
  const disp = (f) => (typeof window._blmpFolioDisplay === 'function')
    ? window._blmpFolioDisplay(f)
    : String(f || '').replace(/^LMP-/i, '') || '----';
  let folioP1 = disp(rec.folio);
  let folioP2 = disp(rec.folioP2);
  if(!folioP2 || folioP2 === folioP1 || folioP2 === '----'){
    // Seguridad: si el registro llegó sin folioP2, reservar el siguiente
    if(typeof window._blmpAsignarFolios === 'function'){
      const next = await window._blmpAsignarFolios(1);
      folioP2 = disp(next[0]);
      rec.folioP2 = folioP2;
      if(typeof idbBlmpPut === 'function'){
        try{ await idbBlmpPut(rec); }catch(_){}
      }
      if(typeof _blmpVincularPlanRef === 'function'){
        try{ await _blmpVincularPlanRef(rec); }catch(_){}
      }
    }
  }
  const aapt = String(rec.aapt || '').trim();
  // AARMS blmppulido2: jsPdfAscii limpia símbolos raros pero conserva tildes/ñ
  const T = (t) => (typeof jsPdfAscii === 'function') ? jsPdfAscii(String(t == null ? '' : t)) : String(t == null ? '' : t);

  const verifKeys = (typeof window._BLMP_VERIF_KEYS !== 'undefined' && window._BLMP_VERIF_KEYS.length)
    ? window._BLMP_VERIF_KEYS
    : [
      { key: 'v_panel', label: 'El panel del equipo se encuentra dañado' },
      { key: 'v_cables', label: 'Los cables no se encuentran con daños visibles en sus uniones o cuerpo' },
      { key: 'v_cuerpo', label: 'El cuerpo del equipo se encuentra sucio' },
      { key: 'v_error', label: 'El equipo manda algún código de error en la pantalla principal' },
      { key: 'v_vida', label: 'La batería cuenta con vida útil suficiente para realizar el muestreo' },
      { key: 'v_eEnv', label: 'El electrodo presenta señales de envejecimiento' },
      { key: 'v_eSuc', label: 'El electrodo presenta suciedad en su cuerpo' },
      { key: 'v_eComp', label: 'El cuerpo del electrodo no presenta señales de daño y no le faltan partes' },
      { key: 'v_calib', label: 'El pHmetro permite ser calibrado' }
    ];

  // AARMS blmppulido2: caja OBSERVACIONES auto-alto (Pág 1 y Sección 3)
  const drawObsBox = (yy, texto, maxBottom) => {
    yy = _pdfBarraSeccion(doc, 'OBSERVACIONES', M, yy, CW, FONT) + 4;
    const fs = 8, pad = 6, lh = fs + 2.2;
    const obsRaw = T(texto || '');
    doc.setFont(FONT, obsRaw ? 'bold' : 'normal');
    doc.setFontSize(fs);
    const maxBoxH = Math.max(36, (maxBottom != null ? maxBottom : (H - 100)) - yy);
    const maxLines = Math.max(2, Math.floor((maxBoxH - pad * 2) / lh));
    if(!obsRaw){
      const altoVacio = 36;
      doc.setFillColor(...LGRAY); doc.setDrawColor(...MGRAY); doc.setLineWidth(0.5);
      if(typeof doc.roundedRect === 'function') doc.roundedRect(M, yy, CW, altoVacio, 2, 2, 'FD');
      else doc.rect(M, yy, CW, altoVacio, 'FD');
      // AARMS lote4bc: cuerpo vacío, una diagonal. La barra de arriba se queda.
      _lote4bcTachar(doc, M, yy, CW, altoVacio);
      return yy + altoVacio + 8;
    }
    let ol = doc.splitTextToSize(obsRaw, Math.max(40, CW - pad * 2));
    if(ol.length > maxLines){
      ol = ol.slice(0, maxLines);
      const last = ol[ol.length - 1] || '';
      ol[ol.length - 1] = last.length > 3 ? (last.slice(0, -3) + '...') : (last + '...');
    }
    const alto = Math.max(36, ol.length * lh + pad * 2);
    doc.setFillColor(...LGRAY); doc.setDrawColor(...MGRAY); doc.setLineWidth(0.5);
    if(typeof doc.roundedRect === 'function') doc.roundedRect(M, yy, CW, alto, 2, 2, 'FD');
    else doc.rect(M, yy, CW, alto, 'FD');
    doc.setTextColor(...ACCENT); doc.setFont(FONT, 'bold');
    doc.setFontSize(fs);
    doc.text(ol, M + pad, yy + pad + fs - 1);
    return yy + alto + 8;
  };

  const drawMixedLine = (parts, x, yy, maxW, fs) => {
    doc.setFontSize(fs || 8);
    let cx = x, cy = yy;
    const lineH = (fs || 8) + 2.5;
    parts.forEach(p => {
      const raw = T(p.t || '');
      if(!raw) return;
      doc.setFont(FONT, p.accent ? 'bold' : 'normal');
      doc.setTextColor(...(p.accent ? ACCENT : TEXT));
      const words = raw.split(/(\s+)/);
      words.forEach(w => {
        if(!w) return;
        const ww = doc.getTextWidth(w);
        if(cx + ww > x + maxW && cx > x){ cx = x; cy += lineH; }
        doc.text(w, cx, cy);
        cx += ww;
      });
    });
    return cy + lineH;
  };

  const hdr = (folioPag) => {
    // AARMS blmpfolio2: FOLIO distinto por página; subtítulo = equipo real; LMP-1 una vez
    let yTop = _pdfMembreteStd(doc, logo, {
      docTitulo: 'BITÁCORA LIMPIEZA',
      docSubtitulo: 'pH-metro — ' + (aapt || 'AA/PT/____'),
      codigoFormato: 'LMP-1',
      folio: folioPag,
      margin: M
    }, FONT);
    doc.setFont(FONT, 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVY);
    const tit = 'BITÁCORA DE LIMPIEZA Y MANTENIMIENTO DE pHmetro: ' + (aapt || 'AA/PT/____');
    const titLines = doc.splitTextToSize(T(tit), CW);
    doc.text(titLines, M, yTop + 4);
    yTop += 4 + titLines.length * 12 + 4;
    return yTop;
  };

  // ── Página 1: Verificación visual ──
  let y = hdr(folioP1);
  y = _pdfBarraSeccion(doc, '1. VERIFICACIÓN VISUAL DEL EQUIPO', M, y, CW, FONT);
  // AARMS blmppulido2: aire entre barra e intro; hora/fecha en azul
  y += 12;
  y = drawMixedLine([
    { t: 'Siendo las ' },
    { t: (rec.hora || '____'), accent: true },
    { t: ' hrs del día ' },
    { t: (rec.fecha || '________'), accent: true },
    { t: ' se procede a realizar la verificación visual del cuerpo del pHmetro y su electrodo.' }
  ], M, y, CW, 8);
  y += 10;

  const colAct = CW - 90, colSi = 45, colNo = 45;
  const rowH = 22;
  const drawTableHead = (yy) => {
    doc.setFillColor(...DARK);
    doc.rect(M, yy, CW, 16, 'F');
    doc.setFont(FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...WHITE);
    doc.text('ACTIVIDAD', M + 6, yy + 11);
    doc.text('SI', M + colAct + colSi / 2, yy + 11, { align: 'center' });
    doc.text('NO', M + colAct + colSi + colNo / 2, yy + 11, { align: 'center' });
    return yy + 16;
  };
  y = drawTableHead(y);

  const v = rec.verificacion || {};
  verifKeys.forEach((item, i) => {
    const val = String(v[item.key] || '').toUpperCase();
    const isSi = val === 'SI';
    const isNo = val === 'NO';
    if(i % 2 === 0){ doc.setFillColor(...LGRAY); doc.rect(M, y, CW, rowH, 'F'); }
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.4);
    doc.rect(M, y, colAct, rowH, 'S');
    doc.rect(M + colAct, y, colSi, rowH, 'S');
    doc.rect(M + colAct + colSi, y, colNo, rowH, 'S');
    doc.setFont(FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...TEXT);
    const numLabel = (i + 1) + '. ' + item.label;
    const lines = doc.splitTextToSize(T(numLabel), colAct - 10);
    doc.text(lines.slice(0, 2), M + 5, y + 9);
    if(isSi) _pdfBadgeSiNo(doc, M + colAct + colSi / 2, y + rowH / 2, true, { kind: 'si', size: 11 });
    if(isNo) _pdfBadgeSiNo(doc, M + colAct + colSi + colNo / 2, y + rowH / 2, true, { kind: 'no', size: 11 });
    y += rowH;
  });

  y += 10;
  y = drawObsBox(y, rec.obs_v, H - 100);

  if(typeof _pdfFirmaPremium === 'function'){
    // AARMS blmppulido2: pie "Pág. X de N" + código LMP-1 separado
    _pdfFirmaPremium(doc, 'Pág. 1 de 2', 'LMP-1', { font: FONT, W, H, yOffset: 88 });
  } else {
    doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
    doc.text('Pág. 1 de 2', W - M, H - 22, { align: 'right' });
    doc.setFont(FONT, 'normal'); doc.setFontSize(6.5); doc.setTextColor(...STD.MUTED);
    doc.text('LMP-1', W - M, H - 12, { align: 'right' });
  }

  // ── Página 2 ──
  doc.addPage();
  if(typeof _pdfBmAplicarRoboto === 'function'){
    await _pdfBmAplicarRoboto(doc);
  }
  y = hdr(folioP2);
  y = _pdfBarraSeccion(doc, '2. ACTIVIDADES DE LIMPIEZA', M, y, CW, FONT) + 8;
  doc.setFont(FONT, 'normal'); doc.setFontSize(8); doc.setTextColor(...TEXT);
  const ctx2 = 'De acuerdo a las observaciones realizadas anteriormente se enuncian las actividades de limpieza generadas por la verificación del equipo.';
  const ctx2Lines = doc.splitTextToSize(T(ctx2), CW);
  doc.text(ctx2Lines, M, y);
  y += ctx2Lines.length * 10 + 6;
  doc.setFont(FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
  doc.text('ACTIVIDAD REALIZADA.', W / 2, y, { align: 'center' });
  y += 12;

  const cH = 36, cF = 70, cC = 70, cJ = CW - cH - cF - cC;
  const actRowH = 18;
  doc.setFillColor(...DARK);
  doc.rect(M, y, CW, 15, 'F');
  doc.setFont(FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  let cx = M;
  [['HORA', cH], ['FECHA', cF], ['CÓDIGO DE ACTIVIDAD', cC], ['JUSTIFICACIÓN', cJ]].forEach(([t, w]) => {
    doc.text(T(t), cx + w / 2, y + 10, { align: 'center' });
    cx += w;
  });
  y += 15;

  const acts = Array.isArray(rec.actividades) ? rec.actividades.filter(a => a && (a.hora || a.fecha || a.codigo || a.justificacion)) : [];
  const minRows = Math.max(6, acts.length);
  for(let i = 0; i < minRows; i++){
    const a = acts[i] || {};
    if(i % 2 === 0){ doc.setFillColor(...LGRAY); doc.rect(M, y, CW, actRowH, 'F'); }
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.4);
    let x0 = M;
    [cH, cF, cC, cJ].forEach(w => { doc.rect(x0, y, w, actRowH, 'S'); x0 += w; });
    doc.setFont(FONT, acts[i] ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...(acts[i] ? ACCENT : STD.MUTED));
    const vals = [a.hora || '', a.fecha || '', a.codigo || '', a.justificacion || ''];
    x0 = M;
    [cH, cF, cC, cJ].forEach((w, vi) => {
      const t = T(vals[vi]).substring(0, vi === 3 ? 42 : 12);
      doc.text(t, x0 + 4, y + 12);
      x0 += w;
    });
    y += actRowH;
  }

  y += 10;
  y = _pdfBarraSeccion(doc, 'CODIFICACIÓN DE ACTIVIDADES', M, y, CW, FONT) + 4;
  const codRows = [
    { c: '1', t: 'Enjuagar con agua tridestilada o desionizada el electrodo.' },
    { c: '2', t: 'Limpiar el electrodo con alcohol tallando suavemente.' },
    { c: '', t: 'En caso de que el cuerpo del equipo presente impurezas, grasas y aceites que se adhieren en el momento de la toma, lavar con las siguientes disoluciones:' },
    { c: '3', t: 'Lavar el electrodo con detergente suave.' },
    { c: '4', t: 'Lavar con disolución de HCl 1:1, tallar suavemente con un algodón hasta eliminar todo el residuo.' }
  ];
  const cCod = 36, cAct = CW - cCod;
  doc.setFillColor(...DARK);
  doc.rect(M, y, CW, 14, 'F');
  doc.setFont(FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text(T('CÓDIGO'), M + cCod / 2, y + 10, { align: 'center' });
  doc.text('ACTIVIDAD', M + cCod + 6, y + 10);
  y += 14;
  codRows.forEach((r, i) => {
    const lines = doc.splitTextToSize(T(r.t), cAct - 10);
    const rh = Math.max(16, lines.length * 9 + 6);
    if(i % 2 === 0){ doc.setFillColor(...LGRAY); doc.rect(M, y, CW, rh, 'F'); }
    doc.setDrawColor(...MGRAY); doc.rect(M, y, cCod, rh, 'S'); doc.rect(M + cCod, y, cAct, rh, 'S');
    doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
    if(r.c) doc.text(r.c, M + cCod / 2, y + 11, { align: 'center' });
    doc.setFont(FONT, r.c ? 'normal' : 'bold'); doc.setFontSize(r.c ? 7 : 6.5); doc.setTextColor(...TEXT);
    doc.text(lines, M + cCod + 5, y + 10);
    y += rh;
  });
  y += 6;
  doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
  doc.text(T('Nota: Realizar la limpieza del equipo antes y después de su uso'), M, y);
  y += 14;

  y = _pdfBarraSeccion(doc, '3. ACTIVIDADES DE MANTENIMIENTO', M, y, CW, FONT) + 8;
  // AARMS blmppulido2: texto fijo en gris; solo datos capturados en azul
  const m = rec.mantenimiento || {};
  const folioCee = m.folioCee || '______';
  const folioApt = m.folioApartado || (aapt.replace(/^AA\/PT\//i, '') || '______');
  const folioFaa = m.folioFaa22 || '______';
  y = drawMixedLine([
    { t: 'Las actividades de mantenimiento se encuentran registradas en la carpeta de expediente de equipo CEE/AA/N-3/' },
    { t: String(folioCee), accent: true },
    { t: ', en el apartado AA/PT/' },
    { t: String(folioApt), accent: true },
    { t: '. En el formato F-AA-22(vigente) en el folio ' },
    { t: String(folioFaa), accent: true },
    { t: '.' }
  ], M, y, CW, 8.5);
  y += 10;
  y = drawObsBox(y, rec.obs, H - 100);

  if(typeof _pdfFirmaPremium === 'function'){
    _pdfFirmaPremium(doc, 'Pág. 2 de 2', 'LMP-1', { font: FONT, W, H, yOffset: 88 });
  } else {
    doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
    doc.text('Pág. 2 de 2', W - M, H - 22, { align: 'right' });
    doc.setFont(FONT, 'normal'); doc.setFontSize(6.5); doc.setTextColor(...STD.MUTED);
    doc.text('LMP-1', W - M, H - 12, { align: 'right' });
  }

  const safeName = String(folioP1).replace(/[^\w\-]+/g, '_');
  doc.save('BLMP_' + safeName + '_' + String(aapt).replace(/[^\w\-]+/g, '_') + '.pdf');
  // AARMS blmpfolio2: toast con ambos folios; archivo usa folio pág. 1
  if(typeof toast === 'function') toast('PDF BLMP · folios ' + folioP1 + ' / ' + folioP2, 'g');
};


// ═══════════════════════════════════════════════════════════════
// AARMS condfiel + condpulido + condcancelado + condcanceladofix: Bitácora Conductímetro F-AA-289-2 FIEL (3 págs, 1 PDF/plan)
// Reutiliza: _pdfMembreteStd, _pdfBarraSeccion, _pdfBadgeSiNo,
// _pdfBadgeAceptaRechaza, _pdfFirmaPremium, _pdfBmAplicarRoboto, tablas premium
// ═══════════════════════════════════════════════════════════════
window._condGenerarPdfFiel = async function _condGenerarPdfFiel(opts){
  opts = opts || {};
  const plan = opts.plan || null;
  const c = Object.assign({}, opts.colab || {});
  let folios = opts.folios || [c.folio, c.folioP2, c.folioP3];
  if(!folios || folios.length < 3){
    if(typeof window._condAsignarFolios === 'function'){
      folios = await window._condAsignarFolios(3);
    } else {
      folios = ['0001','0002','0003'];
    }
  }
  const folioP1 = String(folios[0] || '----');
  const folioP2 = String(folios[1] || '----');
  const folioP3 = String(folios[2] || '----');

  const { jsPDF } = window.jspdf || {};
  if(!jsPDF){ if(typeof toast === 'function') toast('jsPDF no disponible','w'); return; }
  const logo = (typeof loadLogo === 'function')
    ? await loadLogo(typeof LOGO_PDF_URI !== 'undefined' ? LOGO_PDF_URI : 'logo_pdf.png')
    : null;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter', compress: true });
  let FONT = 'helvetica';
  if(typeof _pdfBmAplicarRoboto === 'function'){
    FONT = await _pdfBmAplicarRoboto(doc) || 'helvetica';
  }
  const W = 612, H = 792, M = 28, CW = W - M * 2;
  const NAVY = STD.NAVY, ACCENT = STD.ACCENT, LGRAY = STD.LGRAY, MGRAY = STD.MGRAY;
  const TEXT = STD.TEXT, WHITE = STD.WHITE, DARK = STD.DARK;
  const T = (t) => (typeof jsPdfAscii === 'function') ? jsPdfAscii(String(t == null ? '' : t)) : String(t == null ? '' : t);
  const cell = (v) => (v == null || v === '') ? '' : String(v);
  const fmtFecha = (s) => {
    if(!s) return '';
    const p = String(s).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0].slice(-2)}` : String(s).substring(0, 10);
  };
  const clave = String(c.clave || '').trim() || 'AA/CO/____';
  const vnPm = (vn, inc) => {
    if(typeof window._condVnPm === 'function') return window._condVnPm(vn, inc);
    const a = parseFloat(String(vn||'').replace(',','.')); const b = Math.abs(parseFloat(String(inc||'').replace(',','.')));
    if(isNaN(a)||isNaN(b)) return { plus:'', minus:'' };
    return { plus: String(Math.round((a+b)*100)/100), minus: String(Math.round((a-b)*100)/100) };
  };
  // AARMS condfiel: ±5% — lecturas vs VN; si no hay VN, dispersión (max-min)/avg
  const acePct5 = (l1, l2, l3, vn) => {
    const Ls = [l1,l2,l3].map(x => parseFloat(String(x||'').replace(',','.'))).filter(n => !isNaN(n));
    if(Ls.length < 2) return null;
    const nom = parseFloat(String(vn||'').replace(',','.'));
    if(!isNaN(nom) && nom !== 0){
      const ok = Ls.every(v => Math.abs(v - nom) / Math.abs(nom) <= 0.05);
      return ok ? 'acepta' : 'rechaza';
    }
    const avg = Ls.reduce((a,b)=>a+b,0) / Ls.length;
    if(!avg) return null;
    const pct = ((Math.max(...Ls) - Math.min(...Ls)) / Math.abs(avg)) * 100;
    return pct <= 5 ? 'acepta' : 'rechaza';
  };
  const prom3 = (a,b,c) => {
    const Ls = [a,b,c].map(x => parseFloat(String(x||'').replace(',','.'))).filter(n => !isNaN(n));
    return Ls.length === 3 ? (Math.round((Ls.reduce((s,n)=>s+n,0)/3)*100)/100) : null;
  };
  const siNo = (v) => {
    const u = String(v||'').trim().toUpperCase();
    if(u === 'SI' || u === 'SÍ' || v === true) return 'SI';
    if(u === 'NO' || v === false) return 'NO';
    return '';
  };
  const chk = (v) => !!v && v !== 'NO' && v !== false && v !== 'false';

  const drawObsBox = (yy, texto, maxBottom) => {
    yy = _pdfBarraSeccion(doc, 'OBSERVACIONES', M, yy, CW, FONT) + 4;
    const fs = 8, pad = 6, lh = fs + 2.2;
    const obsRaw = T(texto || '');
    doc.setFont(FONT, obsRaw ? 'bold' : 'normal');
    doc.setFontSize(fs);
    const maxBoxH = Math.max(32, (maxBottom != null ? maxBottom : (H - 100)) - yy);
    const maxLines = Math.max(2, Math.floor((maxBoxH - pad * 2) / lh));
    if(!obsRaw){
      const altoVacio = 32;
      doc.setFillColor(...LGRAY); doc.setDrawColor(...MGRAY); doc.setLineWidth(0.5);
      if(typeof doc.roundedRect === 'function') doc.roundedRect(M, yy, CW, altoVacio, 2, 2, 'FD');
      else doc.rect(M, yy, CW, altoVacio, 'FD');
      // AARMS lote4bc: cuerpo vacío, una diagonal. La barra de arriba se queda.
      _lote4bcTachar(doc, M, yy, CW, altoVacio);
      return yy + altoVacio + 6;
    }
    let ol = doc.splitTextToSize(obsRaw, Math.max(40, CW - pad * 2));
    if(ol.length > maxLines){
      ol = ol.slice(0, maxLines);
      const last = ol[ol.length - 1] || '';
      ol[ol.length - 1] = last.length > 3 ? (last.slice(0, -3) + '...') : (last + '...');
    }
    const alto = Math.max(32, ol.length * lh + pad * 2);
    doc.setFillColor(...LGRAY); doc.setDrawColor(...MGRAY); doc.setLineWidth(0.5);
    if(typeof doc.roundedRect === 'function') doc.roundedRect(M, yy, CW, alto, 2, 2, 'FD');
    else doc.rect(M, yy, CW, alto, 'FD');
    doc.setTextColor(...ACCENT); doc.setFont(FONT, 'bold');
    doc.setFontSize(fs);
    doc.text(ol, M + pad, yy + pad + fs - 1);
    return yy + alto + 6;
  };

  const hdr = (folioPag, subExtra) => {
    // AARMS condpulido: subtítulo = equipo; F-AA-289-2 una sola vez (codigoFormato)
    let yTop = _pdfMembreteStd(doc, logo, {
      docTitulo: 'CONDUCTÍMETRO',
      docSubtitulo: clave || 'AA/CO/____',
      codigoFormato: 'F-AA-289-2',
      folio: folioPag,
      margin: M
    }, FONT);
    doc.setFont(FONT, 'bold'); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
    const tit = 'Bitácora de Limpieza, Mantenimiento, Calibración, Comprobación, Verificación y Uso del Conductivimetro';
    const titLines = doc.splitTextToSize(T(tit), CW);
    doc.text(titLines, M + CW / 2, yTop + 2, { align: 'center' });
    yTop += 2 + titLines.length * 10 + 2;
    doc.setFont(FONT, 'normal'); doc.setFontSize(7.5); doc.setTextColor(...TEXT);
    doc.text(T('IDENTIFICACIÓN DE EQUIPO: '), M, yTop + 8);
    doc.setFont(FONT, 'bold'); doc.setTextColor(...ACCENT);
    doc.text(T(clave), M + doc.getTextWidth(T('IDENTIFICACIÓN DE EQUIPO: ')), yTop + 8);
    if(subExtra){
      doc.setFont(FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...TEXT);
      doc.text(T(subExtra), W - M, yTop + 8, { align: 'right' });
    }
    return yTop + 14;
  };

  const pieFirma = (pagLabel) => {
    if(typeof _pdfFirmaPremium === 'function'){
      _pdfFirmaPremium(doc, pagLabel, 'F-AA-289-2', {
        font: FONT, W, H, yOffset: 88, plan: plan || undefined
      });
    } else {
      doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
      doc.text(pagLabel, W - M, H - 22, { align: 'right' });
      doc.setFont(FONT, 'normal'); doc.setFontSize(6.5); doc.setTextColor(...STD.MUTED);
      doc.text('F-AA-289-2', W - M, H - 12, { align: 'right' });
    }
  };

  // AARMS condpulido + condcanceladofix: SI→tachar celda NO; NO→tachar celda SI; sin respuesta→ambas
  const drawSiNoTable = (yy, rows, opts) => {
    opts = opts || {};
    const neutral = !!opts.neutral;
    const colAct = CW - 90, colSi = 45, colNo = 45, rowH = 18;
    const xSi = M + colAct, xNo = M + colAct + colSi;
    doc.setFillColor(...DARK);
    doc.rect(M, yy, CW, 14, 'F');
    doc.setFont(FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE);
    doc.text('ACTIVIDAD', M + 5, yy + 10);
    doc.text('SI', xSi + colSi / 2, yy + 10, { align: 'center' });
    doc.text('NO', xNo + colNo / 2, yy + 10, { align: 'center' });
    yy += 14;
    rows.forEach((r, i) => {
      if(i % 2 === 0){ doc.setFillColor(...LGRAY); doc.rect(M, yy, CW, rowH, 'F'); }
      doc.setDrawColor(...MGRAY); doc.setLineWidth(0.4);
      doc.rect(M, yy, colAct, rowH, 'S');
      doc.rect(xSi, yy, colSi, rowH, 'S');
      doc.rect(xNo, yy, colNo, rowH, 'S');
      doc.setFont(FONT, 'normal'); doc.setFontSize(6.5); doc.setTextColor(...TEXT);
      const lines = doc.splitTextToSize(T(r.label), colAct - 8);
      doc.text(lines.slice(0, 2), M + 4, yy + 8);
      const sn = siNo(r.val);
      if(sn === 'SI'){
        _pdfBadgeSiNo(doc, xSi + colSi / 2, yy + rowH / 2, true, { kind: 'si', size: 10, neutral });
        // AARMS condcanceladofix: celda NO no usada → tachar solo esa celda
        if(typeof _pdfTacharFila === 'function') _pdfTacharFila(doc, xNo, yy, colNo, rowH);
      } else if(sn === 'NO'){
        _pdfBadgeSiNo(doc, xNo + colNo / 2, yy + rowH / 2, true, { kind: 'no', size: 10, neutral });
        if(typeof _pdfTacharFila === 'function') _pdfTacharFila(doc, xSi, yy, colSi, rowH);
      } else if(typeof _pdfTacharFila === 'function'){
        _pdfTacharFila(doc, xSi, yy, colSi, rowH);
        _pdfTacharFila(doc, xNo, yy, colNo, rowH);
      }
      yy += rowH;
    });
    return yy;
  };

  const drawMiniTable = (yy, heads, rowVals, cws, opts) => {
    opts = opts || {};
    const rhH = opts.headH || 18;
    const rh = opts.rowH || 14;
    const fsH = opts.fsH || 5.4;
    const fs = opts.fs || 6.2;
    const total = cws.reduce((a,b)=>a+b,0);
    doc.setFillColor(...DARK);
    doc.rect(M, yy, total, rhH, 'F');
    doc.setFont(FONT, 'bold'); doc.setFontSize(fsH); doc.setTextColor(...WHITE);
    let cx = M;
    heads.forEach((hh, i) => {
      const lines = doc.splitTextToSize(T(hh), Math.max(16, cws[i] - 2)).slice(0, 3);
      const startY = yy + (rhH - lines.length * 6) / 2 + 5;
      lines.forEach((ln, li) => doc.text(ln, cx + cws[i] / 2, startY + li * 6, { align: 'center' }));
      cx += cws[i];
    });
    yy += rhH;
    (rowVals || []).forEach((vals, ri) => {
      const mapped = (vals || []).map(v => T(cell(v)));
      while(mapped.length < heads.length) mapped.push('');
      if(typeof _pdfFilaTablaPremium === 'function'){
        yy = _pdfFilaTablaPremium(doc, mapped, M, yy, cws, rh, ri, {
          fontSize: fs, maxChars: 18, font: FONT, blankEmpty: true, cellBorders: true
        });
      } else {
        let x = M;
        mapped.forEach((v, i) => {
          doc.setFillColor(...(ri % 2 ? WHITE : LGRAY));
          doc.rect(x, yy, cws[i], rh, 'F');
          doc.setDrawColor(...MGRAY); doc.rect(x, yy, cws[i], rh, 'S');
          doc.setFont(FONT, 'bold'); doc.setFontSize(fs); doc.setTextColor(...ACCENT);
          doc.text(String(v).substring(0, 14), x + cws[i] / 2, yy + rh / 2 + 2, { align: 'center' });
          x += cws[i];
        });
        yy += rh;
      }
    });
    return yy;
  };

  const drawCriterioBadge = (yy, texto, estado) => {
    const badgeW = estado ? 66 : 0;
    const textMax = Math.max(40, CW - 6 - badgeW);
    doc.setFont(FONT, 'normal'); doc.setFontSize(5.8); doc.setTextColor(...TEXT);
    const lines = doc.splitTextToSize(T(texto), textMax);
    doc.text(lines, M + 2, yy + 6);
    const textH = lines.length * 7 + 2;
    if(estado && typeof _pdfBadgeAceptaRechaza === 'function'){
      const bx = M + CW - badgeW;
      const by = yy + Math.max(1, (textH - 11) / 2);
      _pdfBadgeAceptaRechaza(doc, bx, by, estado, { font: FONT });
    }
    return yy + Math.max(textH, estado ? 14 : textH) + 2;
  };

  // ── Página 1 ──
  let y = hdr(folioP1);
  y = _pdfBarraSeccion(doc, 'ACTIVIDAD DE VERIFICACIÓN, LIMPIEZA Y MANTENIMIENTO', M, y, CW, FONT);
  y += 8;
  doc.setFont(FONT, 'normal'); doc.setFontSize(8); doc.setTextColor(...TEXT);
  doc.text(T('Fecha: '), M, y);
  doc.setFont(FONT, 'bold'); doc.setTextColor(...ACCENT);
  doc.text(T(fmtFecha(c.fecha) || '________'), M + 36, y);
  doc.setFont(FONT, 'normal'); doc.setTextColor(...TEXT);
  doc.text(T('Hora: '), M + 130, y);
  doc.setFont(FONT, 'bold'); doc.setTextColor(...ACCENT);
  doc.text(T(c.hora || '____'), M + 160, y);
  y += 10;

  // Orden oficial: 1 panel, 2 cables, 3 cuerpo, 4 error, 5 envejec, 6 suciedad, 7 partes
  const verifRows = [
    { label: '1. El panel del equipo se encuentra dañado', val: c.v1 },
    { label: '2. Los cables se encuentran dañados', val: c.v2 },
    { label: '3. El cuerpo del equipo se encuentra sucio', val: c.v3 },
    { label: '4. El equipo manda código de error', val: c.v7 },
    { label: '5. La celda presenta señales de envejecimiento', val: c.v4 },
    { label: '6. La celda presenta suciedad', val: c.v5 },
    { label: '7. El equipo y/o la celda no le faltan partes', val: c.v6 }
  ];
  doc.setFont(FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...NAVY);
  doc.text(T('VERIFICACIÓN'), M, y + 8); y += 12;
  // AARMS condpulido: Verificación = marcas neutras (no rojo/verde de aceptación)
  y = drawSiNoTable(y, verifRows, { neutral: true });
  y += 6;

  // Limpieza — AARMS condpulido + condcancelado: Cuerpo/Celda aparte; sin marca → tachar
  doc.setFont(FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...NAVY);
  doc.text(T('LIMPIEZA'), M, y + 8); y += 10;
  const limpItems = [
    { label: 'Enjuagar con agua', done: chk(c.l_enj) },
    { label: 'Limpiar con alcohol', done: chk(c.l_alc) },
    { label: 'Quitar grasa | HCl', done: !!(chk(c.l_grasa) || chk(c.l_hcl)) },
    { label: 'Detergente', done: chk(c.l_det) }
  ];
  {
    const colActL = CW * 0.72, colSiL = CW * 0.28, rowHL = 16;
    doc.setFillColor(...DARK);
    doc.rect(M, y, CW, 14, 'F');
    doc.setFont(FONT, 'bold'); doc.setFontSize(6); doc.setTextColor(...WHITE);
    doc.text('ACTIVIDAD', M + 5, y + 10);
    doc.text('SI/NO', M + colActL + colSiL / 2, y + 10, { align: 'center' });
    y += 14;
    limpItems.forEach((it, i) => {
      if(i % 2 === 0){ doc.setFillColor(...LGRAY); doc.rect(M, y, CW, rowHL, 'F'); }
      doc.setDrawColor(...MGRAY); doc.setLineWidth(0.4);
      doc.rect(M, y, colActL, rowHL, 'S');
      doc.rect(M + colActL, y, colSiL, rowHL, 'S');
      doc.setFont(FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...TEXT);
      doc.text(T(it.label), M + 5, y + 11);
      if(it.done){
        doc.setFont(FONT, 'bold'); doc.setTextColor(...ACCENT);
        doc.text('SI', M + colActL + colSiL / 2, y + 11, { align: 'center' });
      } else if(typeof _pdfTacharFila === 'function'){
        // AARMS condcanceladofix: línea solo en columna SI/NO
        _pdfTacharFila(doc, M + colActL, y, colSiL, rowHL);
      }
      y += rowHL;
    });
  }
  y += 4;
  doc.setFont(FONT, 'normal'); doc.setFontSize(7.5); doc.setTextColor(...TEXT);
  doc.text(T('Cuerpo / Celda: '), M, y + 8);
  const donde = String(c.limp_donde || '').trim();
  if(donde){
    doc.setFont(FONT, 'bold'); doc.setTextColor(...ACCENT);
    doc.text(T(donde), M + 78, y + 8);
  } else {
    doc.setFont(FONT, 'bold'); doc.setTextColor(...ACCENT);
    doc.text(T('________'), M + 78, y + 8);
  }
  doc.setFont(FONT, 'normal'); doc.setTextColor(...TEXT);
  doc.text(T('Actividad Efectiva: '), M + 200, y + 8);
  const ef = siNo(c.l_efectiva);
  if(ef === 'SI') _pdfBadgeSiNo(doc, M + 310, y + 5, true, { kind: 'si', size: 11 });
  else if(ef === 'NO') _pdfBadgeSiNo(doc, M + 310, y + 5, true, { kind: 'no', size: 11 });
  else { doc.setFont(FONT, 'bold'); doc.setTextColor(...ACCENT); doc.text(T('____'), M + 300, y + 8); }
  y += 16;

  // Mantenimiento — AARMS condcancelado: sin capturar = tachar (no forzar NO)
  doc.setFont(FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...NAVY);
  doc.text(T('MANTENIMIENTO'), M, y + 8); y += 10;
  const mantVal = (campo, key) => {
    if(c.mant_na && c.mant_na[campo]) return 'NO'; // N.A. explicito = respondido NO
    if(chk(c[key])) return 'SI';
    if(c[key] === 'NO' || c[key] === 'SI') return String(c[key]).toUpperCase();
    // AARMS condcancelado: checkbox sin marcar = sin respuesta → cancelar
    return '';
  };
  const mantRows = [
    { label: 'Remplazo de Baterías', val: mantVal('baterias','m_bat') },
    { label: 'Remplazo de Celdas', val: mantVal('celdas','m_cel') },
    { label: 'Replatinización', val: mantVal('replatinizacion','m_rep') },
    { label: 'Envío técnico externo', val: mantVal('envio_tecnico','m_ext') }
  ];
  y = drawSiNoTable(y, mantRows);
  y += 6;
  y = drawObsBox(y, c.obs, H - 100);
  pieFirma('Pág. 1 de 3');

  // ── Página 2 — Lab + arranca Campo Cal ──
  doc.addPage();
  if(typeof _pdfBmAplicarRoboto === 'function'){ try{ await _pdfBmAplicarRoboto(doc); }catch(_){} }
  y = hdr(folioP2);
  y = _pdfBarraSeccion(doc, 'ACTIVIDAD EN LABORATORIO', M, y, CW, FONT);
  y += 6;

  const calVn = c.cal_vn || c.mrc_nom || '';
  const calInc = c.cal_inc || '';
  const calPm = vnPm(calVn, calInc);
  const calHeads = ['FECHA','HORA','LOTE','MARCA','V. NOMINAL','INCERT.','VN+I','VN−I','LECTURA µS/cm','ACEPTA / RECHAZA'];
  const calCwRaw = [48,36,48,40,48,42,44,44,56,90];
  const calSum = calCwRaw.reduce((a,b)=>a+b,0);
  const calCw = calCwRaw.map(w => w * (CW / calSum));
  doc.setFont(FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY);
  doc.text(T('Calibración (Material de Referencia)'), M, y + 7); y += 10;
  const calAcep = String(c.cal_acep || '').trim();
  const calRow = [[
    fmtFecha(c.cal_fecha || c.fecha), c.cal_hora || '', c.cal_lote || c.mrc_lote || '',
    c.cal_marca || 'N/A', calVn, calInc ? ('±' + String(calInc).replace(/^±/,'')) : '',
    calPm.plus, calPm.minus, c.cal_lect || '',
    (/^acepta|^rechaz/i.test(calAcep) ? '' : calAcep)
  ]];
  const yCalRow = y;
  y = drawMiniTable(y, calHeads, calRow, calCw, { headH: 20, rowH: 15, fs: 6, fsH: 5.2 });
  if(/^acepta/i.test(calAcep) || /^rechaz/i.test(calAcep)){
    const kind = /^acepta/i.test(calAcep) ? 'acepta' : 'rechaza';
    let cx = M; for(let i=0;i<9;i++) cx += calCw[i];
    _pdfBadgeAceptaRechaza(doc, cx + Math.max(1,(calCw[9]-54)/2), yCalRow + 20 + 2, kind, { compact:true, font:FONT });
  }
  y = _pdfCajaLeyenda(doc,
    '1. Para disoluciones patrón comerciales se debe cumplir con el valor de incertidumbre indicado en el certificado.  2. Para disoluciones preparadas en el laboratorio se debe estimar la incertidumbre y cumplir con el valor.',
    M, y, CW, FONT, { fontSize: 5.8 });

  // Comprobación Lab
  const compVn = c.comp_vn || calVn || c.mrc_nom || '';
  const compL1 = c.comp_l1 || c.mrc_l1 || '';
  const compL2 = c.comp_l2 || c.mrc_l2 || '';
  const compL3 = c.comp_l3 || c.mrc_l3 || '';
  const compEstado = acePct5(compL1, compL2, compL3, compVn);
  const compHeads = ['FECHA','HORA','LOTE','MARCA','V. NOMINAL','L1','L2','L3','PROMEDIO','ACEPTA / RECHAZA'];
  const compCwR = [48,36,48,44,52,40,40,40,52,90];
  const compSum = compCwR.reduce((a,b)=>a+b,0);
  const compCw = compCwR.map(w => w * (CW / compSum));
  doc.setFont(FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY);
  doc.text(T('Comprobación (Material de Referencia)'), M, y + 7); y += 10;
  const compProm = prom3(compL1, compL2, compL3);
  const yComp = y;
  y = drawMiniTable(y, compHeads, [[
    fmtFecha(c.comp_fecha || c.fecha), c.comp_hora || '', c.comp_lote || c.cal_lote || c.mrc_lote || '',
    c.comp_marca || c.cal_marca || '', compVn, compL1, compL2, compL3,
    compProm != null ? String(compProm) : '', ''
  ]], compCw, { headH: 18, rowH: 14, fs: 6.2, fsH: 5.2 });
  if(compEstado){
    let cx = M; for(let i=0;i<9;i++) cx += compCw[i];
    _pdfBadgeAceptaRechaza(doc, cx + Math.max(1,(compCw[9]-54)/2), yComp + 18 + 2, compEstado, { compact:true, font:FONT });
  }
  y = drawCriterioBadge(y,
    'No debe de haber una diferencia no mayor a ±5% entre lecturas independientes del valor nominal del MRC utilizado',
    compEstado);

  // Verificación Lab
  const verVn = c.ver_vn || c.ctrl_nom || '';
  const verL1 = c.ver_l1 || c.ctrl_l1 || '';
  const verL2 = c.ver_l2 || c.ctrl_l2 || '';
  const verL3 = c.ver_l3 || c.ctrl_l3 || '';
  const verEstado = acePct5(verL1, verL2, verL3, verVn);
  doc.setFont(FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY);
  doc.text(T('Verificación (muestra control)'), M, y + 7); y += 10;
  const verProm = prom3(verL1, verL2, verL3);
  const yVer = y;
  y = drawMiniTable(y, compHeads, [[
    fmtFecha(c.ver_fecha || c.fecha), c.ver_hora || '', c.ver_lote || c.ctrl_lote || '',
    c.ver_marca || '', verVn, verL1, verL2, verL3,
    verProm != null ? String(verProm) : '', ''
  ]], compCw, { headH: 18, rowH: 14, fs: 6.2, fsH: 5.2 });
  if(verEstado){
    let cx = M; for(let i=0;i<9;i++) cx += compCw[i];
    _pdfBadgeAceptaRechaza(doc, cx + Math.max(1,(compCw[9]-54)/2), yVer + 18 + 2, verEstado, { compact:true, font:FONT });
  }
  y = drawCriterioBadge(y,
    'No debe de haber una diferencia no mayor a ±5% entre lecturas independientes del valor nominal del control utilizado',
    verEstado);

  // Campo — Calibración
  y += 2;
  y = _pdfBarraSeccion(doc, 'ACTIVIDAD EN CAMPO', M, y, CW, FONT);
  y += 6;
  const ccVn = c.campo_cal_vn || '';
  const ccInc = c.campo_cal_inc || '';
  const ccPm = vnPm(ccVn, ccInc);
  const ccAcep = String(c.campo_cal_acep || '').trim();
  doc.setFont(FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY);
  doc.text(T('Calibración (Material de Referencia)'), M, y + 7); y += 10;
  const yCc = y;
  y = drawMiniTable(y, calHeads, [[
    fmtFecha(c.campo_cal_fecha), c.campo_cal_hora || '', c.campo_cal_lote || '',
    c.campo_cal_marca || '', ccVn, ccInc ? ('±' + String(ccInc).replace(/^±/,'')) : '',
    ccPm.plus, ccPm.minus, c.campo_cal_lect || '',
    (/^acepta|^rechaz/i.test(ccAcep) ? '' : ccAcep)
  ]], calCw, { headH: 20, rowH: 15, fs: 6, fsH: 5.2 });
  if(/^acepta/i.test(ccAcep) || /^rechaz/i.test(ccAcep)){
    const kind = /^acepta/i.test(ccAcep) ? 'acepta' : 'rechaza';
    let cx = M; for(let i=0;i<9;i++) cx += calCw[i];
    _pdfBadgeAceptaRechaza(doc, cx + Math.max(1,(calCw[9]-54)/2), yCc + 20 + 2, kind, { compact:true, font:FONT });
  }
  y = _pdfCajaLeyenda(doc,
    '1. Para disoluciones patrón comerciales se debe cumplir con el valor de incertidumbre indicado en el certificado.  2. Para disoluciones preparadas en el laboratorio se debe estimar la incertidumbre y cumplir con el valor.',
    M, y, CW, FONT, { fontSize: 5.8 });
  pieFirma('Pág. 2 de 3');

  // ── Página 3 — Campo Comp/Ver + Entre Tomas ──
  doc.addPage();
  if(typeof _pdfBmAplicarRoboto === 'function'){ try{ await _pdfBmAplicarRoboto(doc); }catch(_){} }
  y = hdr(folioP3);

  const fccVn = c.campo_comp_vn || '';
  const fccL1 = c.campo_comp_l1 || '', fccL2 = c.campo_comp_l2 || '', fccL3 = c.campo_comp_l3 || '';
  const fccEst = acePct5(fccL1, fccL2, fccL3, fccVn);
  doc.setFont(FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY);
  doc.text(T('Comprobación (Material de Referencia) — Campo'), M, y + 7); y += 10;
  const fccProm = prom3(fccL1, fccL2, fccL3);
  const yFcc = y;
  y = drawMiniTable(y, compHeads, [[
    fmtFecha(c.campo_comp_fecha), c.campo_comp_hora || '', c.campo_comp_lote || '',
    c.campo_comp_marca || '', fccVn, fccL1, fccL2, fccL3,
    fccProm != null ? String(fccProm) : '', ''
  ]], compCw, { headH: 18, rowH: 14, fs: 6.2, fsH: 5.2 });
  if(fccEst){
    let cx = M; for(let i=0;i<9;i++) cx += compCw[i];
    _pdfBadgeAceptaRechaza(doc, cx + Math.max(1,(compCw[9]-54)/2), yFcc + 18 + 2, fccEst, { compact:true, font:FONT });
  }
  y = drawCriterioBadge(y,
    'No debe de haber una diferencia no mayor a ±5% entre lecturas independientes del valor nominal del MRC utilizado',
    fccEst);

  const fcvVn = c.campo_ver_vn || '';
  const fcvL1 = c.campo_ver_l1 || '', fcvL2 = c.campo_ver_l2 || '', fcvL3 = c.campo_ver_l3 || '';
  const fcvEst = acePct5(fcvL1, fcvL2, fcvL3, fcvVn);
  doc.setFont(FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY);
  doc.text(T('Verificación (Muestra Control) — Campo'), M, y + 7); y += 10;
  const fcvProm = prom3(fcvL1, fcvL2, fcvL3);
  const yFcv = y;
  y = drawMiniTable(y, compHeads, [[
    fmtFecha(c.campo_ver_fecha), c.campo_ver_hora || '', c.campo_ver_lote || '',
    c.campo_ver_marca || '', fcvVn, fcvL1, fcvL2, fcvL3,
    fcvProm != null ? String(fcvProm) : '', ''
  ]], compCw, { headH: 18, rowH: 14, fs: 6.2, fsH: 5.2 });
  if(fcvEst){
    let cx = M; for(let i=0;i<9;i++) cx += compCw[i];
    _pdfBadgeAceptaRechaza(doc, cx + Math.max(1,(compCw[9]-54)/2), yFcv + 18 + 2, fcvEst, { compact:true, font:FONT });
  }
  y = drawCriterioBadge(y,
    'No debe de haber una diferencia no mayor a ±5% entre lecturas independientes del valor nominal del control utilizado',
    fcvEst);

  y += 2;
  doc.setFont(FONT, 'normal'); doc.setFontSize(6.5); doc.setTextColor(...TEXT);
  const intro1 = 'El registro de las actividades que se realizan entre cada toma de muestra, referentes a la determinación de conductividad se encuentra en la siguiente tabla:';
  // AARMS bm5fix: mismo código de manual que el resto (MMAR/AA/N-2)
  const intro2 = 'El Procedimiento de recolección utilizado está descrito en el Manual de Muestreo con clave MMAR/AA/N-2';
  let il = doc.splitTextToSize(T(intro1), CW);
  doc.text(il, M, y + 6); y += il.length * 8 + 2;
  il = doc.splitTextToSize(T(intro2), CW);
  doc.text(il, M, y + 6); y += il.length * 8 + 4;

  // Entre Tomas — todos los OMARs del plan
  let regs = [];
  if(plan && Array.isArray(plan.bitCond) && plan.bitCond.length){
    regs = plan.bitCond.slice();
  } else if(typeof _bitCondRegs === 'function'){
    regs = (_bitCondRegs() || []).slice();
  } else if(typeof omar !== 'undefined' && Array.isArray(omar.bitCond)){
    regs = omar.bitCond.slice();
  }

  const folioMap = {};
  if(plan && (plan.omarIds || []).length && typeof _cachedMuestreos !== 'undefined'){
    for(const mid of plan.omarIds){
      const m = _cachedMuestreos.find(x => x.id === mid);
      let fol = '—';
      if(m){
        try{ const o = m.omar ? JSON.parse(m.omar) : {}; fol = o.folio ? String(o.folio) : String(mid); }
        catch(e){ fol = String(mid); }
      }
      folioMap[String(mid)] = fol;
    }
  }
  if(typeof omar !== 'undefined' && omar?.ts){
    folioMap[String(omar.ts)] = folioMap[String(omar.ts)] || (omar.folio || String(omar.ts));
  }
  const folioOmarOf = (r) => {
    if(r && r.folioOmar) return String(r.folioOmar);
    const oid = r && r.omarId != null && r.omarId !== '' ? String(r.omarId) : (r && r.omarTs != null ? String(r.omarTs) : '');
    return folioMap[oid] || (omar && omar.folio) || '—';
  };

  // Ordenar por fecha / omar / toma (numeración reinicia conceptualmente por día+OMAR vía columnas)
  regs.sort((a, b) => {
    const fa = String(a.fecha || ''), fb = String(b.fecha || '');
    if(fa !== fb) return fa.localeCompare(fb);
    const oa = folioOmarOf(a), ob = folioOmarOf(b);
    if(oa !== ob) return oa.localeCompare(ob);
    return (Number(a.toma) || 0) - (Number(b.toma) || 0);
  });

  // AARMS condpulido: encabezados oficiales completos (sin ACT/CÓD abreviados)
  const etHeads = ['HORA','FOLIO OMAR','NO. DE TOMA','ACTIVIDAD DE CONTROL','CÓDIGO','L1','L2','L3','ACEPTA O RECHAZA','PROMEDIO','DATO A REPORTAR'];
  const etRaw = [36, 52, 42, 62, 36, 32, 32, 32, 68, 48, 52];
  const etSum = etRaw.reduce((a,b)=>a+b,0);
  const etCw = etRaw.map(w => w * (CW / etSum));

  // AARMS condpulido: sin texto inventado "(TODOS LOS OMARS…)"
  y = _pdfBarraSeccion(doc, 'ENTRE TOMAS', M, y, CW, FONT);
  y += 2;
  // header
  const rhH = 22;
  doc.setFillColor(...DARK);
  doc.rect(M, y, CW, rhH, 'F');
  doc.setFont(FONT, 'bold'); doc.setFontSize(4.8); doc.setTextColor(...WHITE);
  let hx = M;
  etHeads.forEach((hh, i) => {
    const lines = doc.splitTextToSize(T(hh), Math.max(14, etCw[i] - 2)).slice(0, 3);
    const startY = y + (rhH - lines.length * 5.4) / 2 + 4.2;
    lines.forEach((ln, li) => doc.text(ln, hx + etCw[i] / 2, startY + li * 5.4, { align: 'center' }));
    hx += etCw[i];
  });
  y += rhH;

  const rh = 12;
  let rowIdx = 0;
  regs.forEach((r) => {
    if(y + rh > H - 130){
      // AARMS condfiel: portrait fijo — si no cabe, continuar en misma orientación (aviso en toast)
      pieFirma('Pág. 3 de 3 (cont.)');
      doc.addPage();
      if(typeof _pdfBmAplicarRoboto === 'function'){ /* already in doc */ }
      y = hdr(folioP3, 'Entre tomas (cont.)');
      doc.setFillColor(...DARK);
      doc.rect(M, y, CW, rhH, 'F');
      doc.setFont(FONT, 'bold'); doc.setFontSize(4.8); doc.setTextColor(...WHITE);
      hx = M;
      etHeads.forEach((hh, i) => {
        const lines = doc.splitTextToSize(T(hh), Math.max(14, etCw[i] - 2)).slice(0, 3);
        const startY = y + (rhH - lines.length * 5.4) / 2 + 4.2;
        lines.forEach((ln, li) => doc.text(ln, hx + etCw[i] / 2, startY + li * 5.4, { align: 'center' }));
        hx += etCw[i];
      });
      y += rhH;
    }
    const actU = String(r.act || '').trim();
    let horaPdf = r.hora || '';
    const actUp = actU.toUpperCase();
    if(actUp !== 'CA' && actUp !== 'CO' && actUp !== 'CA' && !r.calibGrupo){
      const omarRef = { ts: r.omarId || r.omarTs || (omar && omar.ts), id: r.omarId || r.omarTs };
      if(typeof _pdfBmHoraDeToma === 'function'){
        horaPdf = _pdfBmHoraDeToma(omarRef, r) || r.hora || '';
      }
    }
    const p = prom3(r.l1, r.l2, r.l3);
    const est = acePct5(r.l1, r.l2, r.l3, null); // entre tomas: dispersión ±5%
    const promStr = p != null ? String(p) : '';
    const vals = [
      horaPdf, folioOmarOf(r), String(r.toma || ''), actU, r.limp || '',
      r.l1 || '', r.l2 || '', r.l3 || '', '',
      promStr, promStr
    ].map(v => T(cell(v)));
    const yRow = y;
    if(typeof _pdfFilaTablaPremium === 'function'){
      y = _pdfFilaTablaPremium(doc, vals, M, y, etCw, rh, rowIdx, {
        fontSize: 5.8, maxChars: 12, font: FONT, blankEmpty: true, cellBorders: true
      });
    } else {
      y += rh;
    }
    if(est && typeof _pdfBadgeAceptaRechaza === 'function'){
      let cx = M; for(let i=0;i<8;i++) cx += etCw[i];
      _pdfBadgeAceptaRechaza(doc, cx + Math.max(0.5,(etCw[8]-50)/2), yRow + Math.max(0.5,(rh-9)/2), est, { compact:true, font:FONT });
    }
    rowIdx++;
  });
  if(!regs.length){
    doc.setFont(FONT, 'italic'); doc.setFontSize(8); doc.setTextColor(120);
    doc.text(T('Sin registros entre tomas en el plan.'), M + 6, y + 12);
    y += 22;
  }
  y += 6;
  y = drawCriterioBadge(y, 'No debe haber una diferencia mayor a ±5% entre lecturas independientes.', null);
  const Ley = window.AARMS_DOC_LEYENDAS || {};
  y = _pdfCajaLeyenda(doc, Ley.actControlCond || 'Código de actividad de control: Ca= Calibración. Co= Comprobación. V= Verificación.', M, y, CW, FONT, { fontSize: 6.2 });
  y = _pdfCajaLeyenda(doc, Ley.limpiezaCodCond || 'Código de Limpieza: 1.- Agua Tridestilada 2.- Detergente Suave 3.- Disolución de HCl 1:1', M, y, CW, FONT, { fontSize: 6.2 });

  // Firmas en última página
  const totalPag = doc.getNumberOfPages();
  doc.setPage(totalPag);
  pieFirma('Pág. ' + totalPag + ' de ' + totalPag);
  // Reescribir pies de pág. 1–2 si total>3 (cont. entre tomas)
  if(totalPag === 3){
    // already set
  } else if(totalPag > 3){
    for(let i = 1; i <= totalPag; i++){
      doc.setPage(i);
      doc.setFont(FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY);
      doc.text('Pág. ' + i + ' de ' + totalPag, W - M, H - 22, { align: 'right' });
      doc.setFont(FONT, 'normal'); doc.setFontSize(6.5); doc.setTextColor(...STD.MUTED);
      doc.text('F-AA-289-2', W - M, H - 12, { align: 'right' });
    }
  }

  const pdfSlug = plan && plan.id
    ? `Plan-${String(plan.folio || plan.id || '').replace(/[^\w\-]+/g, '_')}`
    : `OMAR-${(omar && (omar.folio || omar.ts)) || 'cond'}`;
  doc.save(`Bitacora_Conductimetro_${pdfSlug}_${folioP1}.pdf`);
  if(typeof toast === 'function'){
    toast('PDF Conductímetro F-AA-289-2 · folios ' + folioP1 + ' / ' + folioP2 + ' / ' + folioP3, 'g');
    if(totalPag > 3){
      toast('Entre tomas requirió página extra (sigue en portrait). Si prefieres landscape, indícalo.', 'w');
    }
  }
};


})();
