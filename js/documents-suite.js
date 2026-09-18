/**
 * AARMS — Documentos extendidos (BPM F-AA-134-1, BM F-AA-114-18, pH F-AA-264-4 Hoja 1,
 * PDF bitácora pH hoja 2 mejorada). Carga después de app.js.
 */
(function(){
'use strict';

function _dg(id){ const e=document.getElementById(id); if(!e) return ''; if(e.type==='checkbox') return e.checked; return (e.value||'').trim(); }
function _ds(id,v){ const e=document.getElementById(id); if(!e) return; if(e.type==='checkbox') e.checked=!!v; else e.value=v!=null?String(v):''; }

function _planPorOmar(){
  const mid = typeof omar !== 'undefined' && omar && omar.ts;
  if(!mid || typeof _cachedPlanes === 'undefined') return null;
  return _cachedPlanes.find(p=>(p.omarIds||[]).includes(mid)) || null;
}

function _lvarFolioPlan(){
  const p=_planPorOmar();
  const lv=p&&p.lvar&&p.lvar.folio;
  return lv?String(lv):'';
}

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
  const tieneFolio = !!folioStr;
  const blockW = landscape
    ? (tieneFolio ? 162 : 150)
    : (tieneFolio ? 162 : 168);
  const by = landscape
    ? (tieneFolio ? 10 : 8)
    : (tieneFolio ? 10 : 14);
  const blockH = landscape
    ? (tieneFolio ? 78 : 58)
    : (tieneFolio ? 78 : 60);
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
  const addr2 = 'Col. Centro C.P. 85400  |  Tel: 622 224 0910   FAX 622 224 207';
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
  doc.setFont(fuente, 'bold'); doc.setFontSize(landscape && !tieneFolio ? 9 : (tieneFolio ? 9.5 : 10)); doc.setTextColor(...STD.WHITE);
  const tit = String(opts.docTitulo || '');
  doc.text(tit, bx + blockW / 2, by + titY, { align:'center' });
  if(opts.docSubtitulo){
    doc.setFont(fuente, 'normal'); doc.setFontSize(tieneFolio ? 7.5 : (landscape ? 7 : 7.5)); doc.setTextColor(210, 220, 235);
    doc.text(String(opts.docSubtitulo), bx + blockW / 2, by + subY, { align:'center' });
  }
  if(opts.codigoFormato){
    doc.setFontSize(tieneFolio ? 7 : (landscape ? 6.5 : 7)); doc.setTextColor(180, 195, 220);
    doc.text(String(opts.codigoFormato), bx + blockW / 2, by + codY, { align:'center' });
  }
  // AARMS foliofix / phfolio2: FOLIO dentro del bloque (última línea) — número azul claro brillante
  if(tieneFolio){
    doc.setDrawColor(70, 85, 110); doc.setLineWidth(0.5);
    doc.line(bx + 12, by + 50, bx + blockW - 12, by + 50);
    doc.setFont(fuente, 'bold'); doc.setFontSize(9); doc.setTextColor(200, 212, 230);
    doc.text('FOLIO:', bx + 14, by + 66);
    doc.setFont(fuente, 'bold'); doc.setFontSize(13);
    doc.setTextColor(96, 165, 250); // azul claro que resalta sobre DARK
    doc.text(folioStr.substring(0, 18), bx + blockW - 14, by + 67, { align:'right' });
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
function _bpmTrim(id){
  const e=document.getElementById(id);
  if(!e) return '';
  if(e.type==='checkbox') return e.checked ? 'SI' : '';
  return (e.value||'').trim();
}
function _bpmHayFotoHoja(){
  return typeof photoData!=='undefined' && photoData && photoData!=='p';
}
function _bpmHayGpsHoja(){
  const c=typeof omar!=='undefined'&&omar&&omar.campo?omar.campo:{};
  const lat=parseFloat(String(c.gpsN||'').replace('°','').trim());
  const lngAbs=parseFloat(String(c.gpsW||'').replace('°','').trim());
  return !isNaN(lat)&&!isNaN(lngAbs)&&lat!==0&&lngAbs!==0;
}

/** Sincroniza blanco/lote desde el plan (fuente única) y arrastra datos típicos desde hoja de campo / OMAR sin pisar lo que ya escribió el usuario. */
function _bpmRellenoInteligente(){
  const p=_planPorOmar();
  const c=typeof omar!=='undefined'&&omar&&omar.campo?omar.campo:{};
  const blSi=!!(p&&p.blancoCampo);
  const lot=(p&&p.loteBlanco)?String(p.loteBlanco).trim():'';
  const elB=document.getElementById('bpm_f5_blanco');
  const elL=document.getElementById('bpm_f5_lote');
  if(elB) elB.value=blSi?'SI':'NO';
  if(elL) elL.value=blSi?(lot||''):'N.A.';
  const sum=document.getElementById('bpm_blanco_resumen');
  if(sum){
    if(blSi){
      sum.textContent = lot
        ? `Blanco de campo: SÍ (según plan). Lote agua reactivo: ${lot}`
        : 'Blanco de campo: SÍ según plan, pero falta el lote en el plan. Abre el plan → Opciones avanzadas y captura el lote.';
    }else{
      sum.textContent = 'Blanco de campo: NO según plan. No aplica lote de agua reactivo para blanco (N.A. en registro).';
    }
  }
  const setIf=(id,val)=>{ const e=document.getElementById(id); if(e&&!String(e.value||'').trim()&&val) e.value=String(val); };
  const partes=[];
  if(c.dir) partes.push('Dirección (hoja): '+c.dir);
  if(c.idm) partes.push('ID muestra: '+c.idm);
  if(c.hcar) partes.push('HCAR: '+c.hcar);
  if(c.mat) partes.push('Matriz (hoja): '+c.mat);
  if(c.ate) partes.push('Atención (hoja): '+c.ate);
  const descH=partes.join(' · ');
  if(descH) setIf('bpm_f3_descripcion', descH);
  setIf('bpm_f3_ambiente', c.clima||'');
  setIf('bpm_f3_hidraulica', c.obs||'');
  setIf('bpm_f3_tipo_fuente', c.tipo||'');
  const nt=typeof tomas!=='undefined'&&tomas&&tomas.length?tomas.length:0;
  if(nt) setIf('bpm_f6_num_sub', String(nt));
  setIf('bpm_f6_tipo_m', omar.tipo||c.tipo||'');
  setIf('bpm_f6_intervalo', omar.intervalo||c.int||'');
  const hcarF=(c.hcar!=null&&String(c.hcar).trim())?String(c.hcar).trim():'';
  const cciarF=(c.cciar!=null&&String(c.cciar).trim())?String(c.cciar).trim():'';
  if(hcarF||cciarF){
    const partesCc=[];
    if(hcarF) partesCc.push('Folio HCAR: '+hcarF);
    if(cciarF) partesCc.push('Folio CCIAR: '+cciarF);
    setIf('bpm_f8_cc', partesCc.join(' · '));
  }
  if(_bpmHayFotoHoja()) setIf('bpm_justif_sin_foto','N.A. — fotografía disponible en hoja de campo.');
  if(_bpmHayGpsHoja()) setIf('bpm_justif_sin_gps','N.A. — coordenadas GPS en hoja de campo.');
}

/** Lista de pendientes para PDF (y aviso al guardar). */
function validarBpmParaPdf(){
  const f=[];
  const r=(id,msg)=>{ if(!_bpmTrim(id)) f.push(msg); };
  r('bpm_fecha','Cabecera: fecha');
  r('bpm_empresa','Cabecera: empresa / cliente');
  r('bpm_omar','Cabecera: folio OMAR');
  r('bpm_bomar','Cabecera: referencia BOMAR');
  r('bpm_folio_bpm','Cabecera: folio del plan BPM');
  r('bpm_tipo_muestreo','Cabecera: tipo de muestreo');
  r('bpm_matriz','Cabecera: matriz');
  r('bpm_contacto_site','Cabecera: contacto en sitio');
  r('bpm_f1_lvar','1. Folio lista de verificación (LVAR)');
  r('bpm_f1_blvm','1. Bitácora BLVM (código/folio)');
  r('bpm_f1_equip_obs','1. Otros equipos / material relevante');
  r('bpm_f2_bucc','2. Código BUCCVpH');
  r('bpm_f2_bucc_fol','2. Folio BUCCVpH');
  r('bpm_f2_cumple','2. ¿Equipo conforme? (SI / NO / N.A.)');
  r('bpm_f2_obs','2. Observaciones de verificación');
  r('bpm_f3_tipo_fuente','3. Tipo de descarga / fuente');
  r('bpm_f3_descripcion','3. Descripción detallada del punto');
  r('bpm_f3_acceso','3. Acceso y seguridad en sitio');
  r('bpm_f3_hidraulica','3. Condiciones hidráulicas / caudal');
  r('bpm_f3_ambiente','3. Condiciones ambientales');
  r('bpm_f4_fol','4. Folio calibración en sitio (BUCCVpH)');
  r('bpm_f4_buffers','4. Buffers o soluciones usados');
  r('bpm_f4_lecturas','4. Lecturas / comprobación (valores)');
  r('bpm_f4_temp','4. Temperatura ambiente u otra relevante');
  r('bpm_f4_conforme','4. ¿Calibración conforme? (SI / NO / N.A.)');
  const pVal=typeof _planPorOmar==='function'?_planPorOmar():null;
  if(pVal && pVal.blancoCampo && !(String(pVal.loteBlanco||'').trim()))
    f.push('Plan: lote de agua reactivo (en el plan activaste blanco de campo = SI; captura el lote en Datos del plan → Opciones avanzadas)');
  r('bpm_f5_duplicado','5. ¿Muestra duplicada? (SI / NO)');
  if((_bpmTrim('bpm_f5_duplicado')||'').toUpperCase()==='SI' && !_bpmTrim('bpm_f5_dup_param')) f.push('5. Parámetro del duplicado');
  r('bpm_f5_otros_cc','5. Otros controles de calidad en campo');
  r('bpm_f6_tipo_m','6. Tipo (simple / compuesto / otro)');
  r('bpm_f6_intervalo','6. Intervalo entre submuestras');
  r('bpm_f6_num_sub','6. Número de submuestras / tomas');
  r('bpm_f6_volumen','6. Volumen o condiciones del compuesto');
  r('bpm_f6_proc','6. Procedimiento de muestreo (detalle)');
  r('bpm_f7_preserv','7. Preservación y conservación de muestras');
  r('bpm_f7_cad_frio','7. Cadena de frío (SI / NO / N.A.)');
  r('bpm_f7_etiq','7. Etiquetado conforme (SI / NO)');
  r('bpm_f7_bm','8. Código bitácora BM');
  r('bpm_f7_folio','8. Folio bitácora BM');
  r('bpm_f8_cc','9. Registro / folios cadena de custodia');
  r('bpm_f8_conforme','9. Cadena de custodia conforme (SI / NO)');
  r('bpm_f9_trans','10. Transporte al laboratorio');
  r('bpm_f9_hora_lab','10. Hora estimada o real de arribo a laboratorio');
  r('bpm_f10_anexos','11. Documentación anexa (listado o N.A.)');
  r('bpm_f11_modif','12. Modificaciones al plan en campo');
  r('bpm_f11_obs','12. Observaciones finales');
  r('bpm_croquis','Croquis (descripción o referencia)');
  r('bpm_super','Firma: supervisor');
  r('bpm_muest','Firma: muestreador');
  r('bpm_testigo_cliente','Firma: testigo / representante del cliente');
  if(!_bpmHayFotoHoja()){
    if((_bpmTrim('bpm_justif_sin_foto')||'').length<12) f.push('Vista sitio: motivo sin fotografía (≥12 caracteres) o capture foto en Hoja de campo');
  }
  if(!_bpmHayGpsHoja()){
    if((_bpmTrim('bpm_justif_sin_gps')||'').length<12) f.push('Vista sitio: motivo sin GPS (≥12 caracteres) o capture coordenadas en Hoja de campo');
  }
  return f;
}

function poblarBpm(){
  if(!omar||!omar.ts){ return; }
  omar.bpm=omar.bpm||{};
  const b=omar.bpm;
  const p=_planPorOmar();
  const mig=(n,o)=> (b[n]!==undefined&&b[n]!==null&&String(b[n]).trim()!=='') ? b[n] : (o||'');
  _ds('bpm_fecha', mig('fecha', (p&&p.fecha)||(omar.fecha)||''));
  _ds('bpm_empresa', mig('empresa', omar.empresa||''));
  _ds('bpm_omar', mig('omar', omar.folio||''));
  const CANON_BOMAR='BOMAR/AA/N-3';
  let bomVal=mig('bomar', CANON_BOMAR);
  const bomT=String(bomVal||'').trim();
  if(!bomT||/^BOMAR\/AA\/N-3\/?$/i.test(bomT)) bomVal=CANON_BOMAR;
  _ds('bpm_bomar', bomVal);
  _ds('bpm_folio_bpm', mig('folio_bpm', (p&&p.folio)||''));
  _ds('bpm_tipo_muestreo', mig('tipo_muestreo', omar.tipo||''));
  _ds('bpm_matriz', mig('matriz', (omar.mat||'')||(document.getElementById('o_mat')?document.getElementById('o_mat').value:'')||''));
  _ds('bpm_contacto_site', mig('contacto_site', omar.contacto||''));
  _ds('bpm_f1_lvar', mig('f1_lvar', _lvarFolioPlan()));
  _ds('bpm_f1_blvm', mig('f1_blvm', 'BLVM/AA/N-3/'));
  _ds('bpm_f1_equip_obs', mig('f1_equip_obs', b.f1_equip_obs||''));
  _ds('bpm_f2_bucc', mig('f2_bucc', 'BUCCVpH'));
  _ds('bpm_f2_bucc_fol', mig('f2_bucc_fol', ''));
  _ds('bpm_f2_cumple', mig('f2_cumple', ''));
  _ds('bpm_f2_obs', mig('f2_obs', ''));
  const oldF3=b.f3||'';
  _ds('bpm_f3_tipo_fuente', mig('f3_tipo_fuente', ''));
  _ds('bpm_f3_descripcion', mig('f3_descripcion', oldF3));
  _ds('bpm_f3_acceso', mig('f3_acceso', ''));
  _ds('bpm_f3_hidraulica', mig('f3_hidraulica', ''));
  _ds('bpm_f3_ambiente', mig('f3_ambiente', ''));
  _ds('bpm_f4_fol', mig('f4_fol', ''));
  _ds('bpm_f4_buffers', mig('f4_buffers', ''));
  _ds('bpm_f4_lecturas', mig('f4_lecturas', ''));
  _ds('bpm_f4_temp', mig('f4_temp', ''));
  _ds('bpm_f4_conforme', mig('f4_conforme', ''));
  _ds('bpm_f5_duplicado', mig('f5_duplicado', ''));
  _ds('bpm_f5_dup_param', mig('f5_dup_param', ''));
  _ds('bpm_f5_otros_cc', mig('f5_otros_cc', ''));
  const oldP6=b.p610||'';
  _ds('bpm_f6_tipo_m', mig('f6_tipo_m', ''));
  _ds('bpm_f6_intervalo', mig('f6_intervalo', omar.intervalo||''));
  _ds('bpm_f6_num_sub', mig('f6_num_sub', ''));
  _ds('bpm_f6_volumen', mig('f6_volumen', ''));
  _ds('bpm_f6_proc', mig('f6_proc', oldP6));
  _ds('bpm_f7_preserv', mig('f7_preserv', ''));
  _ds('bpm_f7_cad_frio', mig('f7_cad_frio', ''));
  _ds('bpm_f7_etiq', mig('f7_etiq', ''));
  _ds('bpm_f7_bm', mig('f7_bm', 'BM/AA/N-3/'));
  _ds('bpm_f7_folio', mig('f7_folio', ''));
  _ds('bpm_f8_cc', mig('f8_cc', ''));
  (function(){
    const el=document.getElementById('bpm_f8_cc');
    if(!el) return;
    const t=String(el.value||'').replace(/\s+/g,' ').trim();
    if(/^HCAR:\s*[—\-–]\s*·\s*CCIAR:\s*[—\-–]$/i.test(t)) el.value='';
  })();
  _ds('bpm_f8_conforme', mig('f8_conforme', ''));
  _ds('bpm_f9_trans', mig('f9_trans', ''));
  _ds('bpm_f9_hora_lab', mig('f9_hora_lab', ''));
  _ds('bpm_f10_anexos', mig('f10_anexos', ''));
  _ds('bpm_f11_modif', mig('f11_modif', b.modif||''));
  _ds('bpm_f11_obs', mig('f11_obs', b.obs||''));
  _ds('bpm_croquis', mig('croquis', b.croquis||''));
  _ds('bpm_super', mig('super', ''));
  _ds('bpm_muest', mig('muest', omar.muestreador||''));
  _ds('bpm_testigo_cliente', mig('testigo_cliente', ''));
  _ds('bpm_justif_sin_foto', mig('justif_sin_foto', ''));
  _ds('bpm_justif_sin_gps', mig('justif_sin_gps', ''));
  _bpmRellenoInteligente();
}

function leerBpm(){
  if(!omar) return;
  // AARMS simfix: no pisar omar.bpm con el form vacío si no estamos en pgBpm
  const pageOn = !!(document.getElementById('pgBpm') && document.getElementById('pgBpm').classList.contains('on'));
  const probe = document.getElementById('bpm_f1_blvm');
  const formSignal = !!(probe && String(probe.value || '').trim());
  const prev = omar.bpm || {};
  const prevGate = !!(prev.f1_blvm || prev.f2_bucc || prev.f4_fol);
  if(!pageOn && !formSignal && prevGate) return;

  const pPlan=typeof _planPorOmar==='function'?_planPorOmar():null;
  const f5Bl=(pPlan&&pPlan.blancoCampo)?'SI':'NO';
  const f5Lot=(pPlan&&pPlan.blancoCampo)?String(pPlan.loteBlanco||'').trim():'N.A.';
  omar.bpm={
    fecha:_dg('bpm_fecha'), empresa:_dg('bpm_empresa'), omar:_dg('bpm_omar'), bomar:_dg('bpm_bomar'),
    folio_bpm:_dg('bpm_folio_bpm'), tipo_muestreo:_dg('bpm_tipo_muestreo'), matriz:_dg('bpm_matriz'), contacto_site:_dg('bpm_contacto_site'),
    f1_lvar:_dg('bpm_f1_lvar'), f1_blvm:_dg('bpm_f1_blvm'), f1_equip_obs:_dg('bpm_f1_equip_obs'),
    f2_bucc:_dg('bpm_f2_bucc'), f2_bucc_fol:_dg('bpm_f2_bucc_fol'), f2_cumple:_dg('bpm_f2_cumple'), f2_obs:_dg('bpm_f2_obs'),
    f3_tipo_fuente:_dg('bpm_f3_tipo_fuente'), f3_descripcion:_dg('bpm_f3_descripcion'), f3_acceso:_dg('bpm_f3_acceso'),
    f3_hidraulica:_dg('bpm_f3_hidraulica'), f3_ambiente:_dg('bpm_f3_ambiente'),
    f3:_dg('bpm_f3_descripcion'),
    f4_fol:_dg('bpm_f4_fol'), f4_buffers:_dg('bpm_f4_buffers'), f4_lecturas:_dg('bpm_f4_lecturas'), f4_temp:_dg('bpm_f4_temp'), f4_conforme:_dg('bpm_f4_conforme'),
    f5_blanco:f5Bl, f5_lote:f5Lot, f5_duplicado:_dg('bpm_f5_duplicado'), f5_dup_param:_dg('bpm_f5_dup_param'), f5_otros_cc:_dg('bpm_f5_otros_cc'),
    f6_tipo_m:_dg('bpm_f6_tipo_m'), f6_intervalo:_dg('bpm_f6_intervalo'), f6_num_sub:_dg('bpm_f6_num_sub'), f6_volumen:_dg('bpm_f6_volumen'), f6_proc:_dg('bpm_f6_proc'),
    f7_preserv:_dg('bpm_f7_preserv'), f7_cad_frio:_dg('bpm_f7_cad_frio'), f7_etiq:_dg('bpm_f7_etiq'),
    f7_bm:_dg('bpm_f7_bm'), f7_folio:_dg('bpm_f7_folio'),
    f8_cc:_dg('bpm_f8_cc'), f8_conforme:_dg('bpm_f8_conforme'),
    f9_trans:_dg('bpm_f9_trans'), f9_hora_lab:_dg('bpm_f9_hora_lab'),
    f10_anexos:_dg('bpm_f10_anexos'),
    f11_modif:_dg('bpm_f11_modif'), f11_obs:_dg('bpm_f11_obs'),
    croquis:_dg('bpm_croquis'), modif:_dg('bpm_f11_modif'), obs:_dg('bpm_f11_obs'),
    super:_dg('bpm_super'), muest:_dg('bpm_muest'), testigo_cliente:_dg('bpm_testigo_cliente'),
    justif_sin_foto:_dg('bpm_justif_sin_foto'), justif_sin_gps:_dg('bpm_justif_sin_gps'),
    p610:'',
  };
}

function abrirPagBpm(){
  if(!omar||!omar.ts){ toast('Abre un OMAR del plan primero','w'); return; }
  poblarBpm();
  const pl=document.getElementById('bpmPill'); if(pl) pl.textContent=omar.folio?'OMAR '+omar.folio:'OMAR';
  if(typeof _aplicarDocEstadoBadge==='function') _aplicarDocEstadoBadge('bpm');
  goPage('pgBpm');
  setTimeout(()=>{ try{ if(typeof _bpmRefreshVistaSitio==='function') _bpmRefreshVistaSitio(); }catch(_){} }, 0);
  // AARMS lvarfix
  if(typeof _refreshBotonesContinuarLab === 'function') _refreshBotonesContinuarLab();
}

async function guardarBpmPage(){
  leerBpm();
  const pend=validarBpmParaPdf();
  try{ await saveMuestreoActual(); }catch(e){ console.warn(e); }
  if(pend.length) toast('Borrador guardado. Para PDF faltan: '+pend.length+' requisito(s). Revisa los campos.','w');
  else toast('Plan de muestreo guardado ✓','g');
  // AARMS lvarfix: refrescar botones continuar lab
  if(typeof _refreshBotonesContinuarLab === 'function') _refreshBotonesContinuarLab();
  // AARMS simfix
  if(typeof _actualizarGatePlanUI === 'function') _actualizarGatePlanUI();
}

async function generarPDFBpm(){
  if(!omar||!omar.ts){ toast('Sin OMAR','w'); return; }
  // AARMS simfix: solo sincronizar desde form si la pantalla BPM está abierta
  if(document.getElementById('pgBpm') && document.getElementById('pgBpm').classList.contains('on')){
    leerBpm();
  }
  const b0 = omar.bpm || {};
  const gateN = ['f1_blvm','f2_bucc','f4_fol'].filter(k => b0[k] && String(b0[k]).trim()).length;
  if(gateN < 2){
    toast('Sin datos mínimos de BPM. Abre Plan de muestreo, completa y guarda.','w');
    return;
  }
  const pend=validarBpmParaPdf();
  // AARMS simfix: no bloquear PDF si hay datos gate; huecos oficiales salen como "-"
  if(pend.length){
    toast('PDF BPM con '+pend.length+' campo(s) pendiente(s) del formato completo (se dejan en blanco).','w');
  }
  const b=omar.bpm||{};
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612,M=28,CW=W-M*2,H=792,HDR=72;
  const NAVY=[10,22,40],WHITE=[255,255,255],MGRAY=[208,216,228],DGRAY=[51,65,85],ACCENT=[37,99,235];
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
  let y=HDR+6;
  // AARMS sub10-std
  const hdrPg=()=>{ _pdfStdHeader(doc,logo,W,M,HDR,'PLAN DE MUESTREO','BPM','F-AA-134-1'); y=HDR+6; };
  hdrPg();
  const ensure=(need)=>{ if(y+need>H-40){ doc.addPage(); hdrPg(); } };
  const paraVal=(label,val,yy)=>{
    ensure(40); yy=y; doc.setFontSize(8.2);
    doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal');
    const pref = jsPdfAscii(label+': ');
    const valTxt = jsPdfAscii(valStyle(val));
    const lines = doc.splitTextToSize(valTxt, CW-8-4);
    lines.forEach((ln,i)=>{
      if(i===0){ doc.text(pref, M+4, yy); doc.text(ln, M+4+doc.getTextWidth(pref), yy); }
      else doc.text(ln, M+4, yy+i*9.8);
    });
    return yy+Math.max(1,lines.length)*9.8+4;
  };
  const sec=(t,yy)=>{ ensure(24); yy=y; doc.setFillColor(...NAVY); doc.rect(M,yy,CW,11,'F'); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8.8); doc.text(jsPdfAscii(t),M+4,yy+7.5); return yy+14; };
  const kv=(label,val,yy)=>{ ensure(40); yy=y; doc.setFontSize(8.2); doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal'); const pref=jsPdfAscii(label+': '); doc.text(pref,M+4,yy); doc.text(jsPdfAscii(valStyle(val)),M+4+doc.getTextWidth(pref),yy); return yy+9.8+4; };

  y=sec('Identificación', y);
  y=kv('Fecha',b.fecha,y); y=kv('Empresa',b.empresa,y); y=kv('Folio plan BPM',b.folio_bpm,y);
  y=kv('Folio OMAR',b.omar,y); y=kv('BOMAR / referencia',b.bomar,y);
  y=kv('Tipo de muestreo',b.tipo_muestreo,y); y=kv('Matriz',b.matriz,y); y=kv('Contacto en sitio',b.contacto_site,y);

  y=sec('1. Equipo y material', y);
  y=kv('Lista verificación (LVAR)',b.f1_lvar,y); y=kv('Bitácora BLVM',b.f1_blvm,y);
  y=paraVal('Otros equipos / material', b.f1_equip_obs, y);

  y=sec('2. Verificación del equipo', y);
  y=kv('Código BUCCVpH',b.f2_bucc,y); y=kv('Folio',b.f2_bucc_fol,y);
  y=kv('Conforme',b.f2_cumple,y); y=paraVal('Observaciones', b.f2_obs, y);

  y=sec('3. Características de la descarga y ubicación', y);
  y=kv('Tipo de descarga / fuente',b.f3_tipo_fuente,y);
  y=paraVal('Descripción del punto', b.f3_descripcion, y);
  y=kv('Acceso y seguridad',b.f3_acceso,y); y=kv('Condiciones hidráulicas / caudal',b.f3_hidraulica,y);
  y=kv('Condiciones ambientales',b.f3_ambiente,y);

  y=sec('Vista del sitio (hoja de campo)', y);
  const c=omar.campo||{};
  const lat=parseFloat(String(c.gpsN||'').replace('°','').trim());
  const lngAbs=parseFloat(String(c.gpsW||'').replace('°','').trim());
  const hasCoords=!isNaN(lat)&&!isNaN(lngAbs)&&lat!==0&&lngAbs!==0;
  const lng=-Math.abs(lngAbs);
  const boxH=118;
  const gap=8;
  const half=(CW-gap)/2;
  ensure(boxH+36);
  const imgSite=await preloadImg(typeof photoData!=='undefined'&&photoData&&photoData!=='p'?photoData:null);
  doc.setDrawColor(...MGRAY);doc.setLineWidth(0.35);
  doc.rect(M,y,half,boxH,'S');
  doc.rect(M+half+gap,y,half,boxH,'S');
  if(imgSite) drawFittedImg(doc,imgSite,M+5,y+5,half-10,boxH-22);
  else{
    doc.setFont('helvetica','normal');doc.setFontSize(7);
    const jtLines=(doc.splitTextToSize(jsPdfAscii(valStyle(b.justif_sin_foto)),half-14)).slice(0,8);
    jtLines.forEach((ln,i)=>{ doc.text(ln,M+7,y+12+i*9); });
  }
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...NAVY);
  doc.text(jsPdfAscii('Fotografia / justificacion'),M+6,y+boxH-10);
  let mapOk=false;
  if(hasCoords){
    try{
      const mW=Math.round((half-10)*2), mH=Math.round((boxH-22)*2);
      const mapB64=await loadMapImage(lat,lng,16,mW,mH);
      if(mapB64){ doc.addImage(mapB64,'PNG',M+half+gap+5,y+5,half-10,boxH-22,'','FAST'); mapOk=true; }
    }catch(_){ mapOk=false; }
  }
  if(!mapOk){
    doc.setFont('helvetica','normal');doc.setFontSize(7);
    const jgTxt=hasCoords?'Mapa no disponible.':(b.justif_sin_gps||'');
    (doc.splitTextToSize(jsPdfAscii(valStyle(jgTxt)),half-14)).slice(0,8).forEach((ln,i)=>{ doc.text(ln,M+half+gap+7,y+12+i*9); });
  }
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...NAVY);
  doc.text(jsPdfAscii('Mapa OSM / justificacion GPS'),M+half+gap+6,y+boxH-10);
  doc.setFont('helvetica','normal');doc.setFontSize(6.5);
  doc.setTextColor(...DGRAY);
  doc.text('N: ',M+half+gap+6,y+boxH-3);
  doc.text(jsPdfAscii(valStyle(String(c.gpsN||'').trim())),M+half+gap+6+doc.getTextWidth('N: '),y+boxH-3);
  const wX=M+half+gap+6+doc.getTextWidth('N: '+jsPdfAscii(valStyle(String(c.gpsN||'').trim())))+4;
  doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal');
  doc.text('W: ',wX,y+boxH-3);
  doc.text(jsPdfAscii(valStyle(String(c.gpsW||'').trim())),wX+doc.getTextWidth('W: '),y+boxH-3);
  y+=boxH+10;

  y=sec('4. Calibración al llegar al sitio', y);
  y=kv('Folio BUCCVpH en sitio',b.f4_fol,y); y=kv('Buffers / soluciones',b.f4_buffers,y);
  y=kv('Lecturas / comprobación',b.f4_lecturas,y); y=kv('Temperatura',b.f4_temp,y); y=kv('Resultado conforme',b.f4_conforme,y);

  y=sec('5. Control de calidad en campo', y);
  y=kv('Blanco de campo',b.f5_blanco,y); y=kv('Lote agua reactivo',b.f5_lote,y);
  y=kv('Muestra duplicada',b.f5_duplicado,y); y=kv('Parámetro duplicado',b.f5_dup_param,y);
  y=paraVal('Otros CC', b.f5_otros_cc, y);

  y=sec('6. Procedimiento de muestreo', y);
  y=kv('Tipo (simple/compuesto)',b.f6_tipo_m,y); y=kv('Intervalo',b.f6_intervalo,y);
  y=kv('Num. submuestras / tomas',b.f6_num_sub,y); y=kv('Volumen / condiciones',b.f6_volumen,y);
  y=paraVal('Detalle procedimiento', b.f6_proc, y);

  y=sec('7. Preservación y conservación', y);
  y=paraVal('Preservación', b.f7_preserv, y);
  y=kv('Cadena de frio',b.f7_cad_frio,y); y=kv('Etiquetado conforme',b.f7_etiq,y);

  y=sec('8. Muestra compuesta — Bitácora BM', y);
  y=kv('Código BM',b.f7_bm,y); y=kv('Folio BM',b.f7_folio,y);

  y=sec('9. Cadena de custodia', y);
  y=paraVal('Registros / folios', b.f8_cc, y);
  y=kv('Conforme',b.f8_conforme,y);

  y=sec('10. Transporte al laboratorio', y);
  y=paraVal('Transporte', b.f9_trans, y);
  y=kv('Hora arribo / estimado',b.f9_hora_lab,y);

  y=sec('11. Documentación anexa', y);
  y=paraVal('Documentación anexa', b.f10_anexos, y);

  y=sec('12. Modificaciones y observaciones finales', y);
  y=paraVal('Modificaciones al plan', b.f11_modif, y);
  y=paraVal('Observaciones', b.f11_obs, y);

  y=sec('Croquis', y);
  y=paraVal('Croquis', b.croquis, y);

  y=sec('Firmas', y);
  y=kv('Supervisor',b.super,y); y=kv('Muestreador',b.muest,y);
  y=kv('Testigo / cliente',b.testigo_cliente,y);

  ensure(20);
  doc.setFontSize(6.5);doc.setTextColor(100,110,125);doc.setFont('helvetica','italic');
  doc.text(jsPdfAscii('F-AA-134-1 · Plan de muestreo (BPM) · Documento generado desde AARMS'),M,H-22);

  await saveMuestreoActual();
  doc.save(`BPM_OMAR-${omar.folio||omar.ts}.pdf`);
  toast('PDF BPM generado','g');
  if(typeof _maybeMarcarPlanDoc==='function') await _maybeMarcarPlanDoc('bpm');
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
  leerPh1();
  // AARMS v66-p0p1: fusionar catálogo antes de PDF (sin depender de abrir pantalla)
  if(typeof _catalogoCargar==='function') await _catalogoCargar();
  omar.ph2644h1 = omar.ph2644h1 || {};
  if(typeof _catalogoFusionPh2644h1==='function'){
    _catalogoFusionPh2644h1(omar.ph2644h1);
  }
  const h=omar.ph2644h1||{};
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  // AARMS sub8-pdfs: filas/firma premium (helpers Machiote, Helvetica); estructura oficial intacta
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
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
  await saveMuestreoActual();
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

  const ph1 = omar.ph2644h1 || {};
  const bl = omar.blmpLab || {};
  const co = omar.colabLab || {};
  const folioPlan = p && p.folio ? String(p.folio) : '—';
  const tomasArr = typeof tomas !== 'undefined' && tomas ? tomas : [];
  const nTomas = tomasArr.length;

  let buccFol = _bmTrimVal(ph1.folio);
  const bf2 = _bmTrimVal(bpm.f2_bucc_fol);
  if(bf2 && buccFol && bf2 !== buccFol) buccFol = buccFol + ' / ' + bf2;
  else if(bf2 && !buccFol) buccFol = bf2;

  const blvmRef = _bmTrimVal(bpm.f1_blvm) || 'BLVM/AA/N-3/';
  let nPh = (omar.bitPh||[]).length;
  if(typeof _bitPhRegs==='function'){
    const br=_bitPhRegs();
    if(Array.isArray(br)) nPh = br.length;
  }
  const nCd = (omar.bitCond||[]).length;
  // AARMS sub4-cons: planBm debe declararse antes de usarse (TDZ fix)
  const planBm = typeof _planPorOmar === 'function' ? _planPorOmar() : (typeof _planActivo === 'function' ? _planActivo() : null);
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

  const blancoSi = !!(p&&p.blancoCampo);
  const loteB = p&&p.loteBlanco ? String(p.loteBlanco).trim() : '';
  const obsBlanco = blancoSi
    ? (loteB
      ? `Blanco de campo: SÍ (plan). Lote agua reactivo: ${loteB}.`
      : 'Blanco de campo: SÍ según plan — capture el lote en Datos del plan → Opciones avanzadas.')
    : 'Blanco de campo: NO según plan (N.A. lote).';

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
    bm_s1_lvar: typeof _lvarFolioPlan==='function' ? _lvarFolioPlan() : '',
    bm_s1_blvm: blvmRef,
    bm_s1_plan: `En base a la BOMAR/AA/N-3 se elaboró el plan de muestreo BPM (folio de plan ${folioPlan}). Tipo: ${omar.tipo||c.tipo||'—'}. Intervalo: ${omar.intervalo||c.int||'—'}. ${nTomas} toma(s) en hoja de campo digital.`,
    bm_s2_bucc: typeof _codigoBitacora === 'function' ? _codigoBitacora('BUCCVpH', 'potenciometros') : 'BUCCVpH',
    bm_s2_bucc_fol: buccFol,
    bm_s2_ph_clave: (() => {
      if(typeof _equipoActivo === 'function' && typeof _equipoClave === 'function'){
        const eqPh = _equipoActivo('potenciometros');
        if(eqPh) return _equipoClave('potenciometros', eqPh);
      }
      return ph1.marca || '';
    })(),
    bm_s2_blmp: typeof _codigoBitacora === 'function' ? _codigoBitacora('BLMP', 'potenciometros') : `Phmetro limpieza · OMAR ${omar.folio||omar.ts}${bl.fecha?' · fecha '+bl.fecha:''}`,
    bm_s2_cond_ref: typeof _codigoBitacora === 'function' ? _codigoBitacora('BLMCCVUC', 'conductimetros') : `Conductímetro lab · ${co.marca||''} ${co.clave||''}`.trim(),
    bm_s3_arribo_d: fe,
    bm_s3_arribo_h: horaIni,
    bm_s3_recibe_nom: c.fnNom || c.ate || '',
    bm_s3_recibe_puesto: c.fnCar || '',
    bm_s3_inicio_h: horaIni,
    bm_s3_periodo_h: c.int || omar.intervalo || '',
    bm_s3_od: c.obs || '',
    bm_s4_bhcar: 'BHCAR/AA/N-3/',
    bm_s4_hcar_fol: c.hcar || '',
    bm_s5_cciar_fol: c.cciar || '',
    bm_s5_bcciar: 'BCCIAR/AA/N-3/',
    bm_s4_bitph: (p&&p.id)
      ? `Digital · Plan ${p.folio||p.id} (${nPh} reg. pH entre tomas, bitácora única del plan)`
      : `Digital · OMAR ${omar.folio||omar.ts} (${nPh} reg. pH entre tomas)`,
    bm_s4_bitcond: `Digital · OMAR ${omar.folio||omar.ts} (${nCd} reg. conductividad)`,
    bm_s4_flujos: lines.join('\n'),
    bm_s4_conserv: _bmTrimVal(bpm.f7_preserv),
    bm_s4_bfcmt: typeof _codigoBitacora === 'function' ? _codigoBitacora('BFCMT', 'termometros') : '',
    bm_s4_bfcmt_fol: _bmTrimVal(bpm.f4_fol),
    bm_s5_obs1: obsBlanco,
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
  bmPrefillCamposVacios();
  // AARMS sub4-cons: inicializar matriz desde cadena al abrir
  if(typeof _machioteInicializarConservadores === 'function') _machioteInicializarConservadores(omar);
  bmGoStep(0);
  // AARMS sub53-fino: selector multi-OMAR
  if(typeof _bmRenderOmarSelector === 'function') _bmRenderOmarSelector();
  const pl=document.getElementById('bmPill'); if(pl && !(typeof _bmRenderOmarSelector === 'function')) pl.textContent=omar.folio?'OMAR '+omar.folio:'OMAR';
  if(typeof _aplicarDocEstadoBadge==='function') _aplicarDocEstadoBadge('bm');
  goPage('pgBm');
  if(typeof _renderMachioteConservadores === 'function') _renderMachioteConservadores();
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

// AARMS sub51c-estetica: matriz conservadores F-AA-114-18 (visual premium)
// AARMS sub52-fiel: matriz conservadores — 21 filas SIEMPRE + 6 tomas SIEMPRE
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
  const datos = (omarRef.machiote && omarRef.machiote.conservadores) || {};
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
  FILAS21.forEach((a, ri) => {
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
    doc.text(String(a.nombre).substring(0, 18), x + 2, y + 7);
    x += nameW;
    for(let i = 1; i <= TOTAL_TOMAS; i++){
      const cell = (datos[a.key] && datos[a.key]['toma' + i]) || { codigo:'', ml:'', ph:'' };
      const enToma = typeof _analitoEnToma === 'function' ? _analitoEnToma(omarRef, i - 1, a.key) : false;
      ['codigo', 'ml', 'ph'].forEach((field, si) => {
        doc.setFillColor(...WHITE);
        doc.rect(x + si * subW, y, subW, rh, 'F');
        doc.setDrawColor(...MGRAY); doc.rect(x + si * subW, y, subW, rh, 'S');
        const raw = enToma ? String(cell[field] || '') : '';
        if(raw){
          doc.setTextColor(...ACCENT);
          doc.setFont(FONT, 'bold');
          doc.setFontSize(field === 'codigo' ? 5.2 : 5.6);
          doc.text(raw.substring(0, 8), x + si * subW + subW / 2, y + 7, { align:'center' });
        }
      });
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
      docTitulo: 'BITACORA DE MUESTREO',
      docSubtitulo: tit2 || 'Machiote',
      codigoFormato: 'F-AA-114-18',
      folio: folio, // AARMS foliofix: integrado en el bloque
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
  const plan = (typeof _planActivo === 'function' && _planActivo()) || null;
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
      doc.addImage(firma.firmaPng, 'PNG', cx - anchoFirma/2, lineaY - altoFirma - 2, anchoFirma, altoFirma);
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
  const espacio = doc.getTextWidth(' ');

  const flush = (palabra, esValor, anchoHueco) => {
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
function _pdfBmTablaTemperaturas(doc, snapshot, y, ctx){
  const { M, CW, FONT } = ctx;
  const data = (snapshot && snapshot.tempData) || [];
  const fcGlobal = typeof _fcTermometroActual === 'function' ? _fcTermometroActual() : 0;
  const fmt = (v, d) => {
    if(v == null || v === '' || (typeof v === 'number' && isNaN(v))) return '';
    return typeof v === 'number' ? v.toFixed(d == null ? 1 : d) : String(v);
  };
  const heads = [
    'Toma\nNo.',
    'Temp. agua\n(°C)\nT1  T2  T3',
    'FC',
    'Agua corr.\nT1  T2  T3',
    'Prom',
    'Report\nA',
    'Temp. amb.\n(°C)\nT1  T2  T3',
    'FC',
    'Amb corr.\nT1  T2  T3',
    'Report\nB',
    'Diff\nA-B',
    'Proc.'
  ];
  // Compact widths summing ~CW
  const raw = [22, 70, 22, 70, 28, 28, 70, 22, 70, 28, 28, 38];
  const s = raw.reduce((a,b)=>a+b,0);
  const cws = raw.map(w => w * (CW / s));
  const rh = 10;
  y = _pdfHeaderTablaOficial(doc, heads, M, y, cws, 22, FONT);
  for(let i = 0; i < 6; i++){
    const r = data[i] || null;
    const fc = r && r.fc != null ? r.fc : fcGlobal;
    const fcStr = r ? ((fc >= 0 ? '+' : '') + (typeof fc === 'number' ? fc.toFixed(2) : String(fc))) : '';
    const agua3 = r ? [r.agua_l1, r.agua_l2, r.agua_l3].map(x => (x==null||x==='')?'':String(x)).join(' ') : '';
    const aguaC = r ? [fmt(r.agua_c1), fmt(r.agua_c2), fmt(r.agua_c3)].filter(Boolean).join(' ') : '';
    const amb3 = r ? [r.amb_l1, r.amb_l2, r.amb_l3].map(x => (x==null||x==='')?'':String(x)).join(' ') : '';
    const ambC = r ? [fmt(r.amb_c1), fmt(r.amb_c2), fmt(r.amb_c3)].filter(Boolean).join(' ') : '';
    const vals = r ? [
      String(r.toma || i + 1),
      agua3,
      fcStr,
      aguaC,
      fmt(r.agua_prom, 2),
      fmt(r.agua_prom, 2),
      amb3,
      fcStr,
      ambC,
      fmt(r.amb_prom, 2),
      fmt(r.diff, 2),
      r.proc || ''
    ] : ['', '', '', '', '', '', '', '', '', '', '', ''];
    y = _pdfFilaTablaOficial(doc, vals, M, y, cws, rh, i, { fontSize:5.4, maxChars:18 });
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
      let ar = r.ar || '';
      if(!ar && prom != null){
        const Ls = [r.l1, r.l2, r.l3].map(x => parseFloat(x)).filter(x => !isNaN(x));
        if(Ls.length === 3){
          const d = Math.max(Ls[0], Ls[1], Ls[2]) - Math.min(Ls[0], Ls[1], Ls[2]);
          ar = d <= 0.03 ? 'Acepta' : 'Rechaza';
        }
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
  const COMPUESTOS = ['FQ','MP','CIAN','FOS.','DQO','DBO5','SAAM','N.TOT','NO2','NO3','Hg','HELM','TOC','CLOR','CLR','CrHx'];
  let paramsUsados = new Set();
  (tomas || []).forEach(t => {
    const ps = t.params instanceof Set ? [...t.params] : (t.params || []);
    ps.forEach(p => paramsUsados.add(p));
  });
  let volTotal = 0;
  COMPUESTOS.forEach(k => {
    if(!paramsUsados.has(k)) return;
    const v = (typeof CADENA_DATA !== 'undefined' && CADENA_DATA[k] && CADENA_DATA[k].vol)
      ? parseFloat(CADENA_DATA[k].vol)
      : (typeof VOLS !== 'undefined' ? VOLS[k] : 0);
    if(!isNaN(v)) volTotal += v;
  });
  if(volTotal <= 0) volTotal = 4000;
  const heads = ['#', 'Q (L/s)', '%', 'ml'];
  const cws = [tableW * 0.15, tableW * 0.3, tableW * 0.25, tableW * 0.3];
  const rh = 10;
  doc.setFont(FONT, 'bold'); doc.setFontSize(6.5); doc.setTextColor(30);
  doc.text('Porcentaje para cada muestra simple', x0, y);
  y += 8;
  y = _pdfHeaderTablaOficial(doc, heads, x0, y, cws, 12, FONT);
  let sumQ = 0, sumMl = 0, nData = 0;
  for(let i = 0; i < 6; i++){
    const tomaNum = i + 1;
    const has = (typeof tomas !== 'undefined' && tomas && tomas[i]);
    let vals = [String(tomaNum), '', '', ''];
    if(has){
      const q = typeof _bitFlujosPromPorToma === 'function' ? _bitFlujosPromPorToma(omarRef.ts, tomaNum) : NaN;
      const pct = typeof _flujoPctPorToma === 'function' ? _flujoPctPorToma(omarRef.ts, tomaNum) : NaN;
      const ml = !isNaN(pct) ? (volTotal * pct / 100) : NaN;
      if(!isNaN(q)){ sumQ += q; nData++; }
      if(!isNaN(ml)) sumMl += ml;
      vals = [
        String(tomaNum),
        !isNaN(q) ? q.toFixed(2) : '',
        !isNaN(pct) ? pct.toFixed(1) : '',
        !isNaN(ml) ? ml.toFixed(0) : ''
      ];
    }
    y = _pdfFilaTablaOficial(doc, vals, x0, y, cws, rh, i, { fontSize:6.5, maxChars:10 });
  }
  // AARMS sub53-fino: fila totales Σ
  const sigmaVals = nData > 0
    ? ['Σ', sumQ.toFixed(2).replace(/\.00$/, ''), '100', String(Math.round(sumMl))]
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
  const totalVal = total > 0 ? String(total) : '';
  y = _pdfFilaTablaOficial(doc, [totalLabel, '', totalVal], x0, y, cws, rh + 1, 99, { fontSize:5.5, maxChars:28 });
  return { y: y + 4, total };
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
  const blvm = F.bm_s1_lvar || F.bm_s1_blvm || '';

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
  const folioPh = F.bm_s2_bucc_fol || (omarRef.ph2644h1 && omarRef.ph2644h1.folio) || '';
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
  const clavePh = eqPh && typeof _equipoClave === 'function' ? _equipoClave('potenciometros', eqPh) : (F.bm_s2_ph_clave || '');
  const idBlmp = idPh;
  // AARMS sub53-fino: folio BLMP/BDAL texto libre (ej. 0025-0026); vacío = subrayado solo
  const blmpFol = _pdfBmHuecoLimpio(F.bm_s2_blmp_fol);
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
    { v: F.bm_s3_arribo_h, w: 40 },
    { t:'h. del día' },
    // AARMS sub53-fino: arribo en DD MM AA
    { v: _pdfBmFechaOficial(F.bm_s3_arribo_d || fechaRaw), w: 70 },
    { t:', fuimos recibidos por el Sr (a)' },
    { v: F.bm_s3_recibe_nom, w: 90 },
    { t:'que ocupa el puesto' },
    { v: F.bm_s3_recibe_puesto, w: 80 },
    { t:'de la empresa antes mencionada y misma que nos da acceso al sitio de muestreo.' }
  ]);

  tit('Procedimiento para la recolección de muestra', 9);
  po([
    { t:'Para la recolección de las muestras se cuenta con el procedimiento descrito en el Manual de Muestreo AR (MMAR/AA/N-2), la contención y conservación de las muestras se describe en la tabla ubicada en el punto 8 del manual de muestreo. Los analitos a determinar son los citados en la Bitácora de orden de muestreo BOMAR/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'con folio No.' },
    { v: omarRef.folio, w: 70 },
    { t:'. Cualquier modificación al plan de muestreo se registra en la hoja de campo.' }
  ]);
  po([
    { t:'Si el cliente solicita oxígeno disuelto, se realiza la determinación siguiendo los procedimientos del Manual de Muestreo AR (MMAR/AA/N-2) y se registra el resultado en la hoja de campo.' }
  ]);
  const eqMalla = typeof _equipoActivo === 'function' ? _equipoActivo('mallas') : null;
  const claveMalla = eqMalla && typeof _equipoClave === 'function' ? _equipoClave('mallas', eqMalla) : (F.bm_s3_malla || '');
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
    { t:'Para determinación de pH, Conductividad Eléctrica y Temperatura, se realiza siguiendo los procedimientos citados en el manual de muestreo con clave MM/AA/N-3, se registra resultado en la hoja de campo.' }
  ]);

  tit('Recolección de muestras');
  po([
    { t:'Siendo las' },
    { v: F.bm_s3_inicio_h, w: 40 },
    { t:'h, se inicia la recolección de muestras. El periodo de descarga diaria es de:' },
    { v: F.bm_s3_periodo_h, w: 40 },
    { t:'h, por lo tanto, la recolección de la(s) muestra(s) será en periodos de tiempo de' },
    { v: omarRef.intervalo || (omarRef.campo && omarRef.campo.int) || '', w: 40 },
    { t:'h, entre tomas.' }
  ]);

  const eqTermo = typeof _equipoActivo === 'function' ? _equipoActivo('termometros') : null;
  const claveTermo = eqTermo && typeof _equipoClave === 'function' ? _equipoClave('termometros', eqTermo) : (F.bm_s3_termo || '');
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
  const clavePh2 = eqPh && typeof _equipoClave === 'function' ? _equipoClave('potenciometros', eqPh) : (F.bm_s2_ph_clave || '');
  const idPh = eqPh ? String(eqPh.id) : '';
  const rangoMin = F.bm_s4_rango_min || (omarRef.ph2644h1 && omarRef.ph2644h1.cal_l1) || '';
  const rangoMax = F.bm_s4_rango_max || (omarRef.ph2644h1 && omarRef.ph2644h1.ver_l1) || '';
  po([
    { t:'Siendo las' },
    { v: F.bm_s4_tira_h, w: 40 },
    { t:'h se procede a determinar pH utilizando una tira reactiva dando un valor aproximado:' },
    { v: F.bm_s4_tira_val, w: 36 },
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
    { v: F.bm_s2_bucc_fol, w: 70 },
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
    { v: F.bm_s4_hcar_fol || F.bm_s4_bhcar, w: 70 },
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
    { v: F.bm_s2_bucc_fol, w: 70 },
    { t:'.' }
  ]);

  tit('Conductividad');
  const eqCond = typeof _equipoActivo === 'function' ? _equipoActivo('conductimetros') : null;
  const idCond = eqCond ? String(eqCond.id) : '';
  const folioCond = (omarRef.colabLab && omarRef.colabLab.folio) || F.bm_s2_cond_ref || '';
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
  y += 90; // espacio en blanco oficial
  _pdfCajaBorde(doc, M, yCalc0, CW, y - yCalc0);
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
  y += 70;
  _pdfCajaBorde(doc, M, yEj0, CW, y - yEj0);
  y += 6;

  po([
    { t:'Para la preparación de la muestra compuesta se utiliza una probeta para la medición de los volúmenes calculados en el cuadro anterior. Para grasas y aceites y Coliformes no aplica la preparación de muestra compuesta. Como muestra de resguardo se utiliza el sobrante de la muestra de Fisicoquímicos. Posteriormente se trasvasa y preserva conforme a F-AA-01A-3, se etiquetan los envases y se colocan en hielera a 4°C ± 2°C.' }
  ]);

  po([
    { t:'Ver Bitácora de Cadena de Custodia Interna AR, BCCIAR/AA/N-3/' },
    { v: anio2, w: 28 },
    { t:'con folio' },
    { v: F.bm_s5_cciar_fol || F.bm_s5_bcciar, w: 70 },
    { t:'.' }
  ]);

  // AARMS sub10-std: Observaciones en caja con líneas (formato oficial)
  const yObs0 = y;
  y = _pdfBarraSeccion(doc, 'Observaciones', M, y, CW, FONT);
  y += 4;
  const obsTxt = [F.bm_s5_obs1, F.bm_s5_obs2, F.bm_s5_obs3].filter(Boolean).join(' ')
    || F.bm_obs || omarRef.obs || '';
  const obsParts = obsTxt ? doc.splitTextToSize(obsTxt, CW - 8) : [];
  for(let i = 0; i < 4; i++){
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.5);
    doc.line(M + 4, y + 1.5, M + CW - 4, y + 1.5);
    if(obsParts[i]){
      doc.setFont(FONT, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...ACCENT);
      doc.text(obsParts[i], M + 4, y);
    }
    y += 14;
  }
  _pdfCajaBorde(doc, M, yObs0, CW, y - yObs0);
  y += 6;

  _pdfBmFirma(doc, 'Pág. 5 de 5');
}
window._pdfBmPag5 = _pdfBmPag5;

// AARMS sub51a-roboto: generar PDF Machiote con Roboto
async function generarPDFBm(){
  if(!omar || !omar.ts){ toast('Sin OMAR','w'); return; }
  const plan = (typeof _planActivo === 'function' && _planActivo())
    || (typeof getPlanDeMuestreo === 'function' ? getPlanDeMuestreo(omar.ts) : null)
    || (typeof _planPorOmar === 'function' ? _planPorOmar() : null);
  if(!plan){ toast('Selecciona un OMAR y plan primero','w'); return; }
  // AARMS sub9-firma: estampar firma del muestreador desde config
  if(typeof _firmaMuestreadorAuto === 'function') _firmaMuestreadorAuto(plan);

  leerBmForm();
  if(typeof _machioteInicializarConservadores === 'function') _machioteInicializarConservadores(omar);
  const snapshot = _bmSnapshotOrigen();

  const { jsPDF } = window.jspdf;
  const logo = await loadLogo(LOGO_PDF_URI);
  const doc = new jsPDF({ orientation:'portrait', unit:'pt', format:'letter' });

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

  try{ await saveMuestreoActual(); }catch(e){ console.warn(e); }
  // AARMS sub53-fino: nombre por folio OMAR (no del plan)
  const folio = omar.folio || omar.ts;
  const fecha = new Date().toISOString().slice(0, 10);
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
}
window.generarPDFBm = generarPDFBm;

// AARMS sub53-fino: un Machiote por cada OMAR del plan
async function generarPDFBmTodos(){
  const plan = (typeof _planActivo === 'function' && _planActivo()) || null;
  const ids = (plan && plan.omarIds) || [];
  if(!ids.length){ toast('Sin OMARs en el plan','w'); return; }
  const prevId = omar && omar.ts;
  toast(`Generando ${ids.length} Machiote(s)…`, 'g');
  for(const id of ids){
    if(typeof cargarMuestreo === 'function') await cargarMuestreo(id);
    if(typeof poblarBmForm === 'function') poblarBmForm();
    if(typeof _bmRenderOmarSelector === 'function') _bmRenderOmarSelector();
    await generarPDFBm();
    await new Promise(r => setTimeout(r, 400));
  }
  if(prevId && String(prevId) !== String(omar && omar.ts) && typeof cargarMuestreo === 'function'){
    await cargarMuestreo(prevId);
    if(typeof poblarBmForm === 'function') poblarBmForm();
    if(typeof _bmRenderOmarSelector === 'function') _bmRenderOmarSelector();
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
window.generarPDFBitacoraPHOficial = async function generarPDFBitacoraPHOficialV2(){
  if(typeof guardarBorradorActual==='function') await guardarBorradorActual();
  if(typeof _bitPhSyncAllTomasFromCampo==='function') _bitPhSyncAllTomasFromCampo();

  // AARMS ph2644-fiel / phfix2: plan activo (todos los OMARs) — no un PDF por OMAR
  let planPh = (typeof _planActivo === 'function') ? _planActivo() : null;
  if(!planPh && typeof omar !== 'undefined' && omar?.ts && typeof getPlanDeMuestreo === 'function'){
    planPh = getPlanDeMuestreo(omar.ts);
  }
  if(!planPh && !(typeof omar !== 'undefined' && omar?.ts)){
    toast('Abre un plan u OMAR para generar la bitácora pH','w');
    return;
  }

  let regs = (typeof _bitPhRegs === 'function') ? (_bitPhRegs() || []) : ((planPh && planPh.bitPh) || (omar && omar.bitPh) || []);
  if(planPh && Array.isArray(planPh.bitPh) && planPh.bitPh.length){
    regs = planPh.bitPh.slice();
  }
  if(!regs.length && !(omar && omar.ph2644h1)){
    toast('Agrega registros en la bitácora pH.','w');
    return;
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
  if(typeof omar !== 'undefined' && omar?.ts){
    folioMap[String(omar.ts)] = folioMap[String(omar.ts)] || (omar.folio || String(omar.ts));
  }

  let h = {};
  if(typeof omar !== 'undefined' && omar){
    if(typeof leerPh1 === 'function'){ try{ leerPh1(); }catch(_){} }
    h = Object.assign({}, omar.ph2644h1 || {});
  }
  if((!h.cal_l1 && !h.folio) && planPh && (planPh.omarIds || []).length && typeof _cachedMuestreos !== 'undefined'){
    for(const mid of planPh.omarIds){
      const m = _cachedMuestreos.find(x => x.id === mid);
      if(!m || !m.omar) continue;
      try{
        const o = JSON.parse(m.omar);
        if(o.ph2644h1 && (o.ph2644h1.cal_l1 || o.ph2644h1.folio || o.ph2644h1.comp_l1)){
          h = Object.assign({}, o.ph2644h1);
          break;
        }
      }catch(_){}
    }
  }
  if(typeof _catalogoCargar === 'function') await _catalogoCargar();
  if(typeof _catalogoFusionPh2644h1 === 'function' && h){
    try{ _catalogoFusionPh2644h1(h); }catch(_){}
  }

  const folioDocPh = (typeof _bitPhFolioDocGet === 'function')
    ? (_bitPhFolioDocGet() || '')
    : ((planPh && planPh.bitPhFolioDoc) || (omar && omar.bitPhFolioDoc) || h.folio || '');

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
  let subTxt = subPlan + '  |  ' + asci((planPh && planPh.empresa) || (omar && omar.empresa) || '').substring(0, 40);
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
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
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

  const fechaLab = fmtFecha(h.fecha) || '';
  const horaLab = h.hora || '';
  const lote = h.lote || '';
  const marca = h.marca || '';
  const buffer = h.buffer || '';
  const slope = h.slope || '';
  const temp = h.temp || '';
  // AARMS phfix2: Acepta/Rechaza de Hoja 1 calculado con criterio real
  const acepComp = aceCalc(h.comp_l1, h.comp_l2, h.comp_l3, buffer);
  const acepVer = aceCalc(h.ver_l1, h.ver_l2, h.ver_l3, buffer);
  const acepCampoComp = aceCalc(h.campo_c1, h.campo_c2, h.campo_c3, buffer);
  const acepCampoVer = aceCalc(h.campo_v1 || h.campo_ver_l1, h.campo_v2 || h.campo_ver_l2, h.campo_v3 || h.campo_ver_l3, buffer);
  // AARMS cartacontrol: Verificación Campo ACEPTA → punto en carta pH-metro
  if(typeof _cartasFeedDesdePhCampo === 'function'){
    try{
      const folioOmarCtx = (omar && (omar.folio || omar.id)) || '';
      const planIdCtx = (planPh && planPh.id) || '';
      void _cartasFeedDesdePhCampo(h, { folioOMAR: folioOmarCtx, planId: planIdCtx });
    }catch(_eCc){}
  }
  const acepManual = h.campo_acep || '';
  const acepCalLab = (/acepta/i.test(String(acepManual)) ? 'Acepta' : (/rechaz/i.test(String(acepManual)) ? 'Rechaza' : (slope ? 'Acepta' : '')));

  // Bloque 1 — Calibración Lab: 3 filas; LECTURA única (cal_l1/l2/l3 → 1 por fila)
  const calLabRows = [];
  [h.cal_l1, h.cal_l2, h.cal_l3].forEach((lect) => {
    if(lect != null && String(lect).trim() !== ''){
      calLabRows.push([fechaLab, horaLab, lote, marca, buffer, String(lect).trim(), 'CA']);
    }
  });
  y = drawBloque('1. Calibracion en el Laboratorio', H_CAL,
    padRows(calLabRows, 3, 7),
    [{
      text: 'Criterio de aceptacion: ____   Slope: ' + (slope || '____') + '   Temperatura: ' + (temp || '____'),
      acepta: true,
      aceptaVal: acepCalLab
    }], y);

  // Bloque 2 — Comprobación Lab: 3 filas; L1/L2/L3/PROMEDIO
  const compProm = prom3(h.comp_l1, h.comp_l2, h.comp_l3);
  const compLabFilled = (h.comp_l1 || h.comp_l2 || h.comp_l3)
    ? [[fechaLab, horaLab, lote, marca, buffer, h.comp_l1||'', h.comp_l2||'', h.comp_l3||'',
        compProm != null ? compProm.toFixed(2) : '', 'CO']]
    : [];
  y = drawBloque('2. Comprobacion de Calibracion en Laboratorio', H_COMP,
    padRows(compLabFilled, 3, 10),
    [
      { text: 'La medicion no debe desviarse por mas de ± 0,05 UpH del valor nominal del patron de referencia', acepta: true, aceptaVal: acepComp },
      { text: 'No debera haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas', acepta: true, aceptaVal: acepComp }
    ], y);

  // Bloque 3 — Verificación Lab: 1 fila (AARMS phverif1)
  const verProm = prom3(h.ver_l1, h.ver_l2, h.ver_l3);
  const verLabFilled = (h.ver_l1 || h.ver_l2 || h.ver_l3)
    ? [[fechaLab, horaLab, lote, marca, buffer, h.ver_l1||'', h.ver_l2||'', h.ver_l3||'',
        verProm != null ? verProm.toFixed(2) : '', 'V']]
    : [];
  y = drawBloque('3. Verificacion en Laboratorio', H_COMP,
    padRows(verLabFilled, 1, 10),
    [
      { text: 'Criterio de aceptacion: No debe haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas.', acepta: true, aceptaVal: acepVer },
      { text: 'El promedio no debe desviarse mas de 0.05 UpH del Valor Nominal, graficarlo.' }
    ], y);

  // Bloques 4–6 Campo
  const fechaCampo = fmtFecha(h.campo_fecha || h.fecha) || fechaLab;
  const horaCampo = h.campo_hora || horaLab;
  const slopeCampo = h.campo_slope || slope || '';
  const tempCampo = h.campo_temp || temp || '';
  const calCampoRows = [];
  [h.campo_cal_l1 || h.campo_cal, h.campo_cal_l2, h.campo_cal_l3].forEach((lect) => {
    if(lect != null && String(lect).trim() !== ''){
      calCampoRows.push([fechaCampo, horaCampo, lote, marca, buffer, String(lect).trim(), 'CA']);
    }
  });
  y = drawBloque('4. Calibracion en el Campo', H_CAL,
    padRows(calCampoRows, 3, 7),
    [{
      text: 'Criterio de aceptacion: ____   Slope: ' + (slopeCampo || '____') + '   Temperatura: ' + (tempCampo || '____'),
      acepta: true,
      aceptaVal: acepManual
    }], y);

  const campProm = prom3(h.campo_c1, h.campo_c2, h.campo_c3);
  const campCompFilled = (h.campo_c1 || h.campo_c2 || h.campo_c3)
    ? [[fechaCampo, horaCampo, lote, marca, buffer, h.campo_c1||'', h.campo_c2||'', h.campo_c3||'',
        campProm != null ? campProm.toFixed(2) : '', 'CO']]
    : [];
  y = drawBloque('5. Comprobacion de Calibracion en Campo', H_COMP,
    padRows(campCompFilled, 3, 10),
    [
      { text: 'La medicion no debe desviarse por mas de ± 0,05 UpH del valor nominal del patron de referencia', acepta: true, aceptaVal: acepCampoComp },
      { text: 'No debera haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas', acepta: true, aceptaVal: acepCampoComp }
    ], y);

  const campV1 = h.campo_v1 || h.campo_ver_l1 || '';
  const campV2 = h.campo_v2 || h.campo_ver_l2 || '';
  const campV3 = h.campo_v3 || h.campo_ver_l3 || '';
  const campVProm = prom3(campV1, campV2, campV3);
  const campVerFilled = (campV1 || campV2 || campV3)
    ? [[fechaCampo, horaCampo, lote, marca, buffer, campV1, campV2, campV3,
        campVProm != null ? campVProm.toFixed(2) : '', 'V']]
    : [];
  // AARMS phverif1: Verificación Campo = 1 fila
  y = drawBloque('6. Verificacion en Campo', H_COMP,
    padRows(campVerFilled, 1, 10),
    [
      { text: 'Criterio de aceptacion: No debe haber una diferencia mayor a 0,03 UpH entre las lecturas independientes realizadas.', acepta: true, aceptaVal: acepCampoVer },
      { text: 'El promedio no debe desviarse mas de 0.05 UpH del Valor Nominal, graficarlo.' }
    ], y);

  y = _pdfCajaLeyenda(doc, 'OBSERVACIONES: ' + (h.obs || '_______________________________________________'), M, y, CW, FONT, { fontSize: 7 });
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
  const mergeW14 = cw14.slice(9).reduce((s, w) => s + w, 0);
  const totalW14 = leftW14 + mergeW14;

  // AARMS phslopefix: CA con misma estética que _pdfFilaTablaPremium (sin barritas verticales)
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
      '', '', '', '', '' // L2→ACEPTA vacías (se dibuja el merge encima)
    ].map(v => asci(cell(v)));
  };

  // AARMS phslopefix: L2→ACEPTA rowspan — tipografía contenida dentro de las 2 filas (padding óptico)
  const _phDrawCaSlopePendiente = (yTop, nRows, slopePctVal) => {
    const hMerge = rh * nRows;
    const slopePart = slopePctVal ? ('SLOPE ' + slopePctVal + '%') : 'SLOPE ____';
    const txt = asci('PENDIENTE   ' + slopePart + '   PENDIENTE');
    // Borrar solo la línea horizontal entre los 2 CA en la zona merge
    if(nRows >= 2){
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.35);
      doc.line(M + leftW14 + 0.2, yTop + rh, M + totalW14 - 0.2, yTop + rh);
    }
    // fs con aire arriba/abajo (~22pt de alto → ~10pt deja margen dentro de las filas)
    const fs = nRows >= 2 ? 10.2 : 7.2;
    const padY = nRows >= 2 ? 2.2 : 1.0;
    doc.setFont(FONT, 'bold'); doc.setFontSize(fs); doc.setTextColor(...ACCENT);
    // Baseline centrada ópticamente dentro del bloque (no pegada a bordes)
    const baseline = yTop + padY + (hMerge - padY * 2) / 2 + fs * 0.32;
    doc.text(txt.substring(0, 48), M + leftW14 + mergeW14 / 2, baseline, { align: 'center' });
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
      // AARMS phslopefix: misma fila premium (sin barritas); merge L2→ACEPTA tipografía grande
      const r2 = filas[fi + 1];
      const act2 = r2 ? (actOficial(r2.act) || (r2._forcedV ? 'V' : '')) : '';
      const esPar = act2 === 'CA';
      const yTop = y;
      const slopeVal = slopePct || String((esPar && r2 && r2.slopePct) || '').trim();
      y = _pdfFilaTablaPremium(doc, _phCaLeftVals(r, act), M, y, cw14, rh, rowIdx, {
        fontSize: 5.8, maxChars: 12, font: FONT, blankEmpty: true
      });
      if(esPar){
        y = _pdfFilaTablaPremium(doc, _phCaLeftVals(r2, 'CA'), M, y, cw14, rh, rowIdx + 1, {
          fontSize: 5.8, maxChars: 12, font: FONT, blankEmpty: true
        });
        _phDrawCaSlopePendiente(yTop, 2, slopeVal);
        rowIdx += 2;
        fi++;
      } else {
        _phDrawCaSlopePendiente(yTop, 1, slopeVal);
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
  y = _pdfCajaLeyenda(doc, 'OBSERVACIONES: _______________________________________________', M, y, CW, FONT, { fontSize: 7 });

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

// AARMS sub21-bittemp: PDF bitácora temperatura (espejo estética bitácora pH)
// AARMS sub8-pdfs: tablas/firma premium (helpers Machiote, Helvetica)
// AARMS sub10-std: Bit Temp — membrete STD + tabla en caja + leyenda en caja (sin letra-spaciada)
window.generarPDFBitTemp = async function generarPDFBitTemp(){
  if(!omar.ts){ toast('Sin OMAR activa','w'); return; }
  if(typeof guardarBorradorActual==='function') await guardarBorradorActual();
  if(typeof _bitTempSyncAllTomasFromCampo==='function') _bitTempSyncAllTomasFromCampo();
  const planT=typeof getPlanDeMuestreo==='function'?getPlanDeMuestreo(omar.ts):null;
  const regs=(planT&&Array.isArray(planT.bitTemp)?planT.bitTemp:[]).filter(r=>String(r.omarTs)===String(omar.ts));
  if(!regs.length){ toast('Agrega registros en la bitácora de temperatura.','w'); return; }
  const folioDoc=(typeof _bitTempFolioDocGet==='function')?(_bitTempFolioDocGet()||''):'';
  const termoEq=typeof _equipoActivo==='function'?_equipoActivo('termometros'):null;
  const termoLbl=termoEq&&typeof _equipoClave==='function'?_equipoClave('termometros',termoEq):'';
  const fcVal=typeof _fcTermometroActual==='function'?_fcTermometroActual():0;
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'landscape',unit:'pt',format:'letter'});
  const W=792,H=612,M=20,CW=W-M*2,HDR=76;
  const FONT='helvetica';
  let subTxt=(planT&&planT.id?('Plan '+jsPdfAscii(String(planT.folio||planT.id||'')).substring(0,24)):('OMAR '+jsPdfAscii(omar.folio||'-')));
  subTxt+='  |  '+jsPdfAscii(termoLbl)+'  FC '+(fcVal>=0?'+':'')+fcVal.toFixed(2);
  if(folioDoc) subTxt+='  |  Folio: '+jsPdfAscii(String(folioDoc)).substring(0,40);
  const hdrPg=()=>{
    _pdfMembreteStd(doc, logo, {
      docTitulo: 'Termometro',
      docSubtitulo: 'Bitacora entre tomas',
      codigoFormato: 'TEMP',
      extraIzq: subTxt,
      margin: M,
      contentY: HDR
    }, FONT);
  };
  hdrPg();
  let y = HDR + 4;
  const heads=['#','Hora','T1a','T2a','T3a','PromA','T1b','T2b','T3b','PromB','dT','Proc'];
  const raw=[18,40,36,36,36,42,36,36,36,42,36,58];
  const s=raw.reduce((a,b)=>a+b,0);
  const cws=raw.map(w=>w*(CW/s));
  const rh=13;
  const sorted=[...regs].sort((a,b)=>Number(a.toma)-Number(b.toma));
  y = _pdfSeccionStd(doc, 'Registros de temperatura', M, y, CW, (yy) => {
    yy = _pdfHeaderTablaPremium(doc, heads, M, yy, cws, 13, FONT);
    sorted.forEach((reg,ri)=>{
      const c=typeof _calcBitTempRegistro==='function'?_calcBitTempRegistro(reg):{};
      const vals=[
        String(ri+1), jsPdfAscii(reg.hora||''),
        jsPdfAscii(reg.agua_l1||''), jsPdfAscii(reg.agua_l2||''), jsPdfAscii(reg.agua_l3||''),
        !isNaN(c.agua_prom)?c.agua_prom.toFixed(2):'',
        jsPdfAscii(reg.amb_l1||''), jsPdfAscii(reg.amb_l2||''), jsPdfAscii(reg.amb_l3||''),
        !isNaN(c.amb_prom)?c.amb_prom.toFixed(2):'',
        !isNaN(c.diff)?c.diff.toFixed(2):'',
        jsPdfAscii(String(c.procedimiento||''))
      ];
      yy=_pdfFilaTablaPremium(doc, vals, M, yy, cws, rh, ri, {
        firstAccent:true, fontSize:6.4, maxChars:12, font:FONT
      });
    });
    return yy;
  }, FONT);
  const pie='Criterio: dT <= 5C -> Procedimiento 2 (polietileno). dT > 5C -> Procedimiento 3 (Dewar). Valores corregidos con FC del termometro asignado.';
  if(y > H - 100){ doc.addPage(); hdrPg(); y = HDR + 4; }
  y = _pdfCajaLeyenda(doc, pie, M, y, CW, FONT, { fontSize:7.2 });
  _pdfFirmaPremium(doc, 'Pag. 1', 'TEMP', { font:FONT, W, H, yOffset:70 });
  const pdfSlug=planT&&planT.id?`Plan-${String(planT.folio||planT.id||'').replace(/[^\w\-]+/g,'_')}`:`OMAR-${omar.folio||omar.ts}`;
  doc.save(`Bitacora_Temperatura_${pdfSlug}.pdf`);
  toast('PDF bitácora temperatura generado','g');
  if(typeof _maybeMarcarPlanDoc==='function') await _maybeMarcarPlanDoc('bittemp');
};

// AARMS sub10-std: Bit Flujos — membrete STD + tabla en caja + leyenda en caja
window.generarPDFBitFlujos = async function generarPDFBitFlujos(){
  if(!omar.ts){ toast('Sin OMAR activa','w'); return; }
  if(typeof guardarBorradorActual==='function') await guardarBorradorActual();
  if(typeof _bitFlujosSyncAllTomasFromCampo==='function') _bitFlujosSyncAllTomasFromCampo();
  const planT=typeof getPlanDeMuestreo==='function'?getPlanDeMuestreo(omar.ts):null;
  const regs=(planT&&Array.isArray(planT.bitFlujos)?planT.bitFlujos:[]).filter(r=>String(r.omarTs)===String(omar.ts));
  if(!regs.length){ toast('Agrega registros en la bitácora de flujos.','w'); return; }
  const folioDoc=(typeof _bitFlujosFolioDocGet==='function')?(_bitFlujosFolioDocGet()||''):'';
  const sumaTotal=typeof _flujoSumaOmar==='function'?_flujoSumaOmar(omar.ts):0;
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'landscape',unit:'pt',format:'letter'});
  const W=792,H=612,M=20,CW=W-M*2,HDR=76;
  const FONT='helvetica';
  let subTxt=(planT&&planT.id?('Plan '+jsPdfAscii(String(planT.folio||planT.id||'')).substring(0,24)):('OMAR '+jsPdfAscii(omar.folio||'-')));
  subTxt+='  |  Suma OMAR: '+(sumaTotal>0?sumaTotal.toFixed(2)+' L/s':'-');
  if(folioDoc) subTxt+='  |  Folio: '+jsPdfAscii(String(folioDoc)).substring(0,40);
  const hdrPg=()=>{
    _pdfMembreteStd(doc, logo, {
      docTitulo: 'Flujos',
      docSubtitulo: 'Bitacora entre tomas',
      codigoFormato: 'FLUJO',
      extraIzq: subTxt,
      margin: M,
      contentY: HDR
    }, FONT);
  };
  hdrPg();
  let y = HDR + 4;
  const heads=['#','Hora','Metodo','L1','L2','L3','Prom','%'];
  const raw=[18,40,160,40,40,40,48,42];
  const s=raw.reduce((a,b)=>a+b,0);
  const cws=raw.map(w=>w*(CW/s));
  const rh=14;
  const sorted=[...regs].sort((a,b)=>Number(a.toma)-Number(b.toma));
  y = _pdfSeccionStd(doc, 'Registros de flujo', M, y, CW, (yy) => {
    yy = _pdfHeaderTablaPremium(doc, heads, M, yy, cws, 13, FONT);
    sorted.forEach((reg,ri)=>{
      const c=typeof _calcBitFlujosRegistro==='function'?_calcBitFlujosRegistro(reg):{};
      const pct=(!isNaN(c.promedio)&&sumaTotal>0)?(c.promedio/sumaTotal)*100:NaN;
      const vals=[
        String(ri+1), jsPdfAscii(reg.hora||''),
        jsPdfAscii(reg.metodo||''),
        jsPdfAscii(reg.l1||''), jsPdfAscii(reg.l2||''), jsPdfAscii(reg.l3||''),
        !isNaN(c.promedio)?c.promedio.toFixed(2):'',
        !isNaN(pct)?pct.toFixed(2):''
      ];
      yy=_pdfFilaTablaPremium(doc, vals, M, yy, cws, rh, ri, {
        firstAccent:true, fontSize:6.6, maxChars:28, font:FONT, wrapCol:2, maxCharsArr:[4,8,40,8,8,8,10,8]
      });
    });
    return yy;
  }, FONT);
  const pie='Criterio: % ponderado = (promedio toma / suma promedios del OMAR) x 100. Promedio L1/L2/L3: simple, ignora vacios.';
  if(y > H - 100){ doc.addPage(); hdrPg(); y = HDR + 4; }
  y = _pdfCajaLeyenda(doc, pie, M, y, CW, FONT, { fontSize:7.2 });
  _pdfFirmaPremium(doc, 'Pag. 1', 'FLUJO', { font:FONT, W, H, yOffset:70 });
  const pdfSlug=planT&&planT.id?`Plan-${String(planT.folio||planT.id||'').replace(/[^\w\-]+/g,'_')}`:`OMAR-${omar.folio||omar.ts}`;
  doc.save(`Bitacora_Flujos_${pdfSlug}.pdf`);
  toast('PDF bitácora flujos generado','g');
  if(typeof _maybeMarcarPlanDoc==='function') await _maybeMarcarPlanDoc('bitflujos');
};

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

async function generarPDFBitOD(){
  const plan = (typeof _planActivo === 'function' && _planActivo())
    || (typeof getPlanDeMuestreo === 'function' && omar?.ts ? getPlanDeMuestreo(omar.ts) : null);
  if(!plan){ toast('Selecciona un plan','w'); return; }
  if(typeof _bitODInicializar === 'function') _bitODInicializar(plan);
  if(!plan.bitOD){ toast('No hay datos de OD','w'); return; }
  // AARMS sub8-pdfs: 4 páginas con helpers premium (Helvetica)
  const { jsPDF } = window.jspdf;
  const logo = await loadLogo(LOGO_PDF_URI);
  const doc = new jsPDF({ orientation:'portrait', unit:'pt', format:'letter' });
  await _pdfODPag1(doc, plan, logo);
  doc.addPage();
  await _pdfODPag2(doc, plan, logo);
  doc.addPage();
  await _pdfODPag3(doc, plan, logo);
  doc.addPage();
  await _pdfODPag4(doc, plan, logo);
  const folio = plan.bitOD.folio || plan.folio || 'sin-folio';
  const fecha = new Date().toISOString().slice(0,10);
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
async function generarPDFBitTempBlob(){
  const cap = window._pdfCaptureOutput;
  if(typeof cap !== 'function') return null;
  return cap(() => generarPDFBitTemp());
}
async function generarPDFBitFlujosBlob(){
  const cap = window._pdfCaptureOutput;
  if(typeof cap !== 'function') return null;
  return cap(() => generarPDFBitFlujos());
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
window.generarPDFBitTempBlob = generarPDFBitTempBlob;
window.generarPDFBitFlujosBlob = generarPDFBitFlujosBlob;
window.generarPDFBitODBlob = generarPDFBitODBlob;

})();
