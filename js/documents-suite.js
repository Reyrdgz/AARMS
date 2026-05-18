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
  goPage('pgBpm');
  setTimeout(()=>{ try{ if(typeof _bpmRefreshVistaSitio==='function') _bpmRefreshVistaSitio(); }catch(_){} }, 0);
}

async function guardarBpmPage(){
  leerBpm();
  const pend=validarBpmParaPdf();
  try{ await saveMuestreoActual(); }catch(e){ console.warn(e); }
  if(pend.length) toast('Borrador guardado. Para PDF faltan: '+pend.length+' requisito(s). Revisa los campos.','w');
  else toast('Plan de muestreo guardado ✓','g');
}

async function generarPDFBpm(){
  if(!omar||!omar.ts){ toast('Sin OMAR','w'); return; }
  leerBpm();
  const pend=validarBpmParaPdf();
  if(pend.length){
    toast('Completa todos los campos del BPM antes del PDF ('+pend.length+' pendiente(s)). Ej.: '+pend.slice(0,3).join(' · '),'w');
    return;
  }
  const b=omar.bpm||{};
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612,M=28,CW=W-M*2,H=792,HDR=72;
  const NAVY=[10,22,40],WHITE=[255,255,255],MGRAY=[208,216,228],DGRAY=[51,65,85];
  let y=HDR+6;
  const hdrPg=()=>{ _pdfStdHeader(doc,logo,W,M,HDR,'PLAN DE MUESTREO','BPM F-AA-134-1','Digital'); y=HDR+6; };
  hdrPg();
  const ensure=(need)=>{ if(y+need>H-40){ doc.addPage(); hdrPg(); } };
  const para=(txt,yy)=>{ ensure(40); yy=y; const t=jsPdfAscii(txt||''); const lines=doc.splitTextToSize(t,CW-8); doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal'); doc.setFontSize(8.2); doc.text(lines,M+4,yy); return yy+lines.length*9.8+4; };
  const sec=(t,yy)=>{ ensure(24); yy=y; doc.setFillColor(...NAVY); doc.rect(M,yy,CW,11,'F'); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8.8); doc.text(jsPdfAscii(t),M+4,yy+7.5); return yy+14; };
  const kv=(label,val,yy)=>para(label+': '+String(val!=null&&val!==''?val:'—'), yy);

  y=sec('Identificación', y);
  y=kv('Fecha',b.fecha,y); y=kv('Empresa',b.empresa,y); y=kv('Folio plan BPM',b.folio_bpm,y);
  y=kv('Folio OMAR',b.omar,y); y=kv('BOMAR / referencia',b.bomar,y);
  y=kv('Tipo de muestreo',b.tipo_muestreo,y); y=kv('Matriz',b.matriz,y); y=kv('Contacto en sitio',b.contacto_site,y);

  y=sec('1. Equipo y material', y);
  y=kv('Lista verificación (LVAR)',b.f1_lvar,y); y=kv('Bitácora BLVM',b.f1_blvm,y);
  y=para('Otros equipos / material: '+jsPdfAscii(b.f1_equip_obs||'—'), y);

  y=sec('2. Verificación del equipo', y);
  y=kv('Código BUCCVpH',b.f2_bucc,y); y=kv('Folio',b.f2_bucc_fol,y);
  y=kv('Conforme',b.f2_cumple,y); y=para('Observaciones: '+jsPdfAscii(b.f2_obs||'—'), y);

  y=sec('3. Características de la descarga y ubicación', y);
  y=kv('Tipo de descarga / fuente',b.f3_tipo_fuente,y);
  y=para('Descripción del punto: '+jsPdfAscii(b.f3_descripcion||'—'), y);
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
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...DGRAY);
    const jt=jsPdfAscii(b.justif_sin_foto||'');
    (doc.splitTextToSize(jt,half-14)).slice(0,8).forEach((ln,i)=>{ doc.text(ln,M+7,y+12+i*9); });
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
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...DGRAY);
    const jg=jsPdfAscii(hasCoords?'Mapa no disponible.':(b.justif_sin_gps||''));
    (doc.splitTextToSize(jg,half-14)).slice(0,8).forEach((ln,i)=>{ doc.text(ln,M+half+gap+7,y+12+i*9); });
  }
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...NAVY);
  doc.text(jsPdfAscii('Mapa OSM / justificacion GPS'),M+half+gap+6,y+boxH-10);
  doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(...DGRAY);
  doc.text(jsPdfAscii('N: '+(String(c.gpsN||'').trim()||'—')+'   W: '+(String(c.gpsW||'').trim()||'—')),M+half+gap+6,y+boxH-3);
  y+=boxH+10;

  y=sec('4. Calibración al llegar al sitio', y);
  y=kv('Folio BUCCVpH en sitio',b.f4_fol,y); y=kv('Buffers / soluciones',b.f4_buffers,y);
  y=kv('Lecturas / comprobación',b.f4_lecturas,y); y=kv('Temperatura',b.f4_temp,y); y=kv('Resultado conforme',b.f4_conforme,y);

  y=sec('5. Control de calidad en campo', y);
  y=kv('Blanco de campo',b.f5_blanco,y); y=kv('Lote agua reactivo',b.f5_lote,y);
  y=kv('Muestra duplicada',b.f5_duplicado,y); y=kv('Parámetro duplicado',b.f5_dup_param,y);
  y=para('Otros CC: '+jsPdfAscii(b.f5_otros_cc||'—'), y);

  y=sec('6. Procedimiento de muestreo', y);
  y=kv('Tipo (simple/compuesto)',b.f6_tipo_m,y); y=kv('Intervalo',b.f6_intervalo,y);
  y=kv('Num. submuestras / tomas',b.f6_num_sub,y); y=kv('Volumen / condiciones',b.f6_volumen,y);
  y=para('Detalle procedimiento: '+jsPdfAscii(b.f6_proc||'—'), y);

  y=sec('7. Preservación y conservación', y);
  y=para(jsPdfAscii(b.f7_preserv||'—'), y);
  y=kv('Cadena de frio',b.f7_cad_frio,y); y=kv('Etiquetado conforme',b.f7_etiq,y);

  y=sec('8. Muestra compuesta — Bitácora BM', y);
  y=kv('Código BM',b.f7_bm,y); y=kv('Folio BM',b.f7_folio,y);

  y=sec('9. Cadena de custodia', y);
  y=para('Registros / folios: '+jsPdfAscii(b.f8_cc||'—'), y);
  y=kv('Conforme',b.f8_conforme,y);

  y=sec('10. Transporte al laboratorio', y);
  y=para(jsPdfAscii(b.f9_trans||'—'), y);
  y=kv('Hora arribo / estimado',b.f9_hora_lab,y);

  y=sec('11. Documentación anexa', y);
  y=para(jsPdfAscii(b.f10_anexos||'—'), y);

  y=sec('12. Modificaciones y observaciones finales', y);
  y=para('Modificaciones al plan: '+jsPdfAscii(b.f11_modif||'—'), y);
  y=para('Observaciones: '+jsPdfAscii(b.f11_obs||'—'), y);

  y=sec('Croquis', y);
  y=para(jsPdfAscii(b.croquis||'—'), y);

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
/* ─── pH-metro Hoja 1 (F-AA-264-4) — vive en plan.phlab ───
   6 secciones: 3 LAB (Calib/Comp/Verif) + 3 CAMPO (Calib/Comp/Verif) */
const PHLAB_FIELDS = [
  'folio','aapt','fecha','hora',
  // ── LAB ──
  // Calibración Lab: fecha · hora · lote · marca · buffer · lectura · ACTIVIDAD · criterio · slope · temp · acepta/rechaza
  'lab_cal_fecha','lab_cal_hora','lab_cal_lote','lab_cal_marca','lab_cal_buffer','lab_cal_lec','lab_cal_act','lab_cal_crit','lab_cal_slope','lab_cal_temp','lab_cal_ar',
  // Comprobación Lab: fecha · hora · lote · marca · buffer · L1 L2 L3 · promedio · ACTIVIDAD · 2 acepta/rechaza
  'lab_com_fecha','lab_com_hora','lab_com_lote','lab_com_marca','lab_com_buffer','lab_com_l1','lab_com_l2','lab_com_l3','lab_com_act','lab_com_ar1','lab_com_ar2',
  // Verificación Lab: igual a Comp + activia + criterio
  'lab_ver_fecha','lab_ver_hora','lab_ver_lote','lab_ver_marca','lab_ver_buffer','lab_ver_l1','lab_ver_l2','lab_ver_l3','lab_ver_act','lab_ver_ar',
  // ── CAMPO ──
  'cam_cal_fecha','cam_cal_hora','cam_cal_lote','cam_cal_marca','cam_cal_buffer','cam_cal_lec','cam_cal_act','cam_cal_crit','cam_cal_slope','cam_cal_temp','cam_cal_ar',
  'cam_com_fecha','cam_com_hora','cam_com_lote','cam_com_marca','cam_com_buffer','cam_com_l1','cam_com_l2','cam_com_l3','cam_com_act','cam_com_ar1','cam_com_ar2',
  'cam_ver_fecha','cam_ver_hora','cam_ver_lote','cam_ver_marca','cam_ver_buffer','cam_ver_l1','cam_ver_l2','cam_ver_l3','cam_ver_act','cam_ver_ar',
  'obs','realizo','superviso'
];

function abrirPagPh2644Lab(){
  if(typeof _currentPlanId==='undefined' || !_currentPlanId){ toast('Abre un plan primero','w'); return; }
  const plan = (_cachedPlanes||[]).find(p=>p.id===_currentPlanId);
  if(!plan) return;
  const aapt = plan.lvar?.equipos?.potenciometro?.num ? 'AA/PT/'+plan.lvar.equipos.potenciometro.num : '';
  // Pre-llenado: leer plan.phlab y aplicar defaults
  plan.phlab = plan.phlab || {};
  PHLAB_FIELDS.forEach(id=>{
    const e=document.getElementById('ph1_'+id); if(!e) return;
    let v = plan.phlab[id];
    if(v==null || v==='') {
      if(id==='aapt') v=aapt;
      else if(id==='fecha') v=plan.fecha||'';
      else if(id==='hora') v=new Date().toTimeString().slice(0,5);
      else if(id==='realizo') v=plan.muestreador||'';
      else v='';
    }
    if(e.type==='checkbox') e.checked=!!v; else e.value=v;
  });
  const pl=document.getElementById('ph2644Pill');
  if(pl) pl.textContent = plan.folio ? 'Plan '+plan.folio : 'Plan';
  goPage('pgPh2644');
  // Autoguardado debounced
  const pg = document.getElementById('pgPh2644');
  if(pg && !pg._auto){
    let t=null;
    const fire = ()=>{
      const p = (_cachedPlanes||[]).find(p=>p.id===_currentPlanId); if(!p) return;
      p.phlab = p.phlab || {};
      PHLAB_FIELDS.forEach(id=>{
        const e=document.getElementById('ph1_'+id); if(!e) return;
        p.phlab[id] = e.type==='checkbox' ? e.checked : (e.value||'').trim();
      });
      p.docs = p.docs || {};
      p.docs.phlab = {done: !!p.phlab.aapt, updatedAt: Date.now()};
      guardarPlan(p);
    };
    const debounced = e=>{ if(!e.target.matches('input,textarea,select')) return; clearTimeout(t); t=setTimeout(fire,600); };
    pg.addEventListener('input', debounced);
    pg.addEventListener('change', debounced);
    pg._auto = true;
  }
  // Calcular promedios/criterios al abrir (en caso de datos previos)
  setTimeout(()=>{
    ['lab_com','cam_com'].forEach(p=>{ try{ ph1ComprobCheck(p); }catch(e){} });
    ['lab_ver','cam_ver'].forEach(p=>{ try{ ph1VerifCheck(p); }catch(e){} });
  }, 50);
}

async function cerrarPagPh2644Lab(){
  const plan = (_cachedPlanes||[]).find(p=>p.id===_currentPlanId);
  if(plan){
    plan.phlab = plan.phlab || {};
    PHLAB_FIELDS.forEach(id=>{
      const e=document.getElementById('ph1_'+id); if(!e) return;
      plan.phlab[id] = e.type==='checkbox' ? e.checked : (e.value||'').trim();
    });
    plan.docs = plan.docs || {};
    plan.docs.phlab = {done: !!plan.phlab.aapt, updatedAt: Date.now()};
    await guardarPlan(plan);
    await abrirPlan(_currentPlanId);
  } else goHome();
}

async function guardarPh1Page(){
  await cerrarPagPh2644Lab();
}

async function generarPDFPh2644H1(){
  if(typeof _currentPlanId==='undefined' || !_currentPlanId){ toast('Sin plan activo','w'); return; }
  const plan = (_cachedPlanes||[]).find(p=>p.id===_currentPlanId);
  if(!plan) return;
  // Sync UI -> plan
  plan.phlab = plan.phlab || {};
  PHLAB_FIELDS.forEach(id=>{
    const e=document.getElementById('ph1_'+id); if(!e) return;
    plan.phlab[id] = e.type==='checkbox' ? e.checked : (e.value||'').trim();
  });
  const h = plan.phlab;
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612,M=28,CW=W-M*2,HDR=72,H=792;
  const MGRAY=[208,216,228],LGRAY=[232,238,245],DGRAY=[51,65,85],NAVY=[10,22,40],WHITE=[255,255,255];
  _pdfStdHeader(doc,logo,W,M,HDR,'pH-metro','F-AA-264-4 Hoja 1','Digital');
  let y=HDR+6;
  const row=(a,b,yy)=>{ doc.setFillColor(...LGRAY); doc.rect(M,yy,CW,14,'F'); doc.setDrawColor(...MGRAY); doc.rect(M,yy,CW,14,'S'); doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...NAVY); doc.text(jsPdfAscii(a),M+3,yy+6); doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...DGRAY); doc.text(jsPdfAscii(String(b||'-')).substring(0,110),M+3,yy+12); return yy+15; };
  const sec=(t,yy)=>{ doc.setFillColor(...NAVY); doc.rect(M,yy,CW,11,'F'); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(t,M+4,yy+7.5); return yy+13; };
  const sub=(t,yy)=>{ doc.setFillColor(60,90,130); doc.rect(M,yy,CW,9,'F'); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.text(t,M+3,yy+6.5); return yy+11; };
  const need=n=>{ if(y+n>H-30){ doc.addPage(); _pdfStdHeader(doc,logo,W,M,HDR,'pH-metro','(cont.)','Digital'); y=HDR+8; } };
  y=row('Equipo (AA/PT) / Folio / Fecha / Hora', [h.aapt,h.folio,h.fecha,h.hora].filter(Boolean).join(' | '), y);
  // LAB
  y=sec('ACTIVIDAD EN LABORATORIO', y);
  y=sub('Calibracion', y);
  y=row('Lote / Marca / Buffer / Lectura / Slope / Temp / A-R', [h.lab_cal_lote,h.lab_cal_marca,h.lab_cal_buffer,h.lab_cal_lec,h.lab_cal_slope,h.lab_cal_temp,h.lab_cal_ar].join(' | '), y);
  need(40); y=sub('Comprobacion', y);
  y=row('Lote / Marca / Buffer', [h.lab_com_lote,h.lab_com_marca,h.lab_com_buffer].join(' | '), y);
  y=row('L1 / L2 / L3 / A-R', [h.lab_com_l1,h.lab_com_l2,h.lab_com_l3,h.lab_com_ar].join(' | '), y);
  need(40); y=sub('Verificacion', y);
  y=row('Lote / Marca / Buffer', [h.lab_ver_lote,h.lab_ver_marca,h.lab_ver_buffer].join(' | '), y);
  y=row('L1 / L2 / L3 / A-R', [h.lab_ver_l1,h.lab_ver_l2,h.lab_ver_l3,h.lab_ver_ar].join(' | '), y);
  // CAMPO
  need(80); y=sec('ACTIVIDAD EN CAMPO', y);
  y=sub('Calibracion', y);
  y=row('Lote / Marca / Buffer / Lectura / Slope / Temp / A-R', [h.cam_cal_lote,h.cam_cal_marca,h.cam_cal_buffer,h.cam_cal_lec,h.cam_cal_slope,h.cam_cal_temp,h.cam_cal_ar].join(' | '), y);
  need(40); y=sub('Comprobacion', y);
  y=row('Lote / Marca / Buffer', [h.cam_com_lote,h.cam_com_marca,h.cam_com_buffer].join(' | '), y);
  y=row('L1 / L2 / L3 / A-R', [h.cam_com_l1,h.cam_com_l2,h.cam_com_l3,h.cam_com_ar].join(' | '), y);
  need(40); y=sub('Verificacion', y);
  y=row('Lote / Marca / Buffer', [h.cam_ver_lote,h.cam_ver_marca,h.cam_ver_buffer].join(' | '), y);
  y=row('L1 / L2 / L3 / A-R', [h.cam_ver_l1,h.cam_ver_l2,h.cam_ver_l3,h.cam_ver_ar].join(' | '), y);
  if(h.obs){ need(20); y=row('Observaciones', h.obs, y); }
  y=row('Realizo / Superviso', [h.realizo,h.superviso].filter(Boolean).join('  |  '), y);
  y+=8;
  const Ley=window.AARMS_DOC_LEYENDAS||{};
  const block=[Ley.actControl,Ley.limpiezaCod,Ley.phCriterios].filter(Boolean).join(' ');
  doc.setFont('helvetica','italic'); doc.setFontSize(6.5); doc.setTextColor(100,110,125);
  let yleg=y;
  (typeof doc.splitTextToSize==='function'?doc.splitTextToSize(jsPdfAscii(block),CW-6):[block]).forEach(ln=>{
    if(yleg>H-32){ doc.addPage(); _pdfStdHeader(doc,logo,W,M,HDR,'pH-metro','Notas','Digital'); yleg=HDR+14; }
    doc.text(ln,M+3,yleg); yleg+=8;
  });
  plan.docs = plan.docs || {};
  plan.docs.phlab = {done: true, updatedAt: Date.now()};
  await guardarPlan(plan);
  doc.save(`Phmetro_Plan-${plan.folio||plan.id}.pdf`);
  toast('PDF pH-metro generado','g');
  if(typeof marcarPlanDocDone==='function') await marcarPlanDocDone('phlab', _currentPlanId);
  if(typeof abrirPlan==='function' && _currentPlanId) await abrirPlan(_currentPlanId);
}

// ─── BM Bitácora de muestreo F-AA-114-18 (5 hojas / bloques en UI) ───
const BM_FORM_IDS = [
  'bm_s1_fecha','bm_s1_empresa','bm_s1_dir','bm_s1_lugar','bm_s1_punto','bm_s1_ciudad','bm_s1_estado','bm_s1_tipo','bm_s1_nsimples','bm_s1_analitos','bm_s1_lvar','bm_s1_blvm','bm_s1_plan',
  'bm_s2_bucc','bm_s2_bucc_fol','bm_s2_ph_clave','bm_s2_blmp','bm_s2_cond_ref',
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
  const F = {};
  BM_FORM_IDS.forEach(id=>{ F[id] = _dg(id); });
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
  const lines = tomasArr.map((t,i)=> `T${i+1}  ${t.hora||'—'}  flujo ${t.ls||'—'}  pH ${t.ph||'—'}  cond ${t.cond||'—'}`);

  const blancoSi = !!(p&&p.blancoCampo);
  const loteB = p&&p.loteBlanco ? String(p.loteBlanco).trim() : '';
  const obsBlanco = blancoSi
    ? (loteB
      ? `Blanco de campo: SÍ (plan). Lote agua reactivo: ${loteB}.`
      : 'Blanco de campo: SÍ según plan — capture el lote en Datos del plan → Opciones avanzadas.')
    : 'Blanco de campo: NO según plan (N.A. lote).';

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
    bm_s2_bucc: 'BUCCVpH',
    bm_s2_bucc_fol: buccFol,
    bm_s2_ph_clave: ph1.marca || '',
    bm_s2_blmp: `Phmetro limpieza · OMAR ${omar.folio||omar.ts}${bl.fecha?' · fecha '+bl.fecha:''}`,
    bm_s2_cond_ref: `Conductímetro lab · ${co.marca||''} ${co.clave||''}`.trim(),
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
    bm_s4_bfcmt_fol: _bmTrimVal(bpm.f4_fol),
    bm_s5_obs1: obsBlanco,
  };
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
  bmGoStep(0);
  const pl=document.getElementById('bmPill'); if(pl) pl.textContent=omar.folio?'OMAR '+omar.folio:'OMAR';
  goPage('pgBm');
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

async function generarPDFBm(){
  if(!omar||!omar.ts){ toast('Sin OMAR','w'); return; }
  leerBmForm();
  const F = omar.bmForm || {};
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612,M=28,CW=W-M*2,H=792,HDR=72;
  const NAVY=[10,22,40],DGRAY=[51,65,85],WHITE=[255,255,255],MGRAY=[208,216,228],LGRAY=[232,238,245];
  const hdr=(tit2)=>{ _pdfStdHeader(doc,logo,W,M,HDR,'BITACORA DE MUESTREO',tit2,'Digital'); };
  const row=(label,val,yy)=>{
    const t = jsPdfAscii(String(val||'-'));
    const lines = doc.splitTextToSize(t, CW-10).slice(0, 5);
    const h = 14 + lines.length * 9;
    doc.setFillColor(...LGRAY); doc.rect(M,yy,CW,h,'F'); doc.setDrawColor(...MGRAY); doc.rect(M,yy,CW,h,'S');
    doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(6.8); doc.text(jsPdfAscii(label), M+3, yy+6);
    doc.setFont('normal'); doc.setTextColor(...DGRAY); doc.setFontSize(7.5);
    lines.forEach((ln,i)=>{ doc.text(ln, M+3, yy+12+i*9); });
    return yy+h;
  };
  const sec=(t,yy)=>{ doc.setFillColor(...NAVY); doc.rect(M,yy,CW,10,'F'); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(jsPdfAscii(t), M+4, yy+7); return yy+12; };
  const block=(title, pairs, yy)=>{
    yy=sec(title, yy);
    pairs.forEach(([a,b])=>{ yy=row(a,b,yy); if(yy>H-55){ doc.addPage(); hdr(title+' (cont.)'); yy=HDR+14; } });
    return yy+6;
  };

  hdr('Datos generales');
  let y=HDR+6;
  y=block('1. Generales', [
    ['Fecha',F.bm_s1_fecha],['Empresa',F.bm_s1_empresa],['Dirección',F.bm_s1_dir],['Lugar',F.bm_s1_lugar],['Punto / ID',F.bm_s1_punto],
    ['Ciudad / Estado',[F.bm_s1_ciudad,F.bm_s1_estado].filter(Boolean).join(' · ')],
    ['Tipo / No. simples',[F.bm_s1_tipo,F.bm_s1_nsimples].filter(Boolean).join(' · ')],
    ['Analitos',F.bm_s1_analitos],['Lista verificación (BLVM / LVAR)',F.bm_s1_lvar],['Ref. BLVM / BPM',F.bm_s1_blvm],['Plan (BOMAR/BPM)',F.bm_s1_plan],
  ], y);

  doc.addPage(); hdr('Laboratorio');
  y=HDR+6;
  y=block('2. Laboratorio', [
    ['BUCCVpH',F.bm_s2_bucc],['Folio BUCCVpH',F.bm_s2_bucc_fol],['Equipo pH (clave)',F.bm_s2_ph_clave],
    ['Phmetro limpieza (BLMP)',F.bm_s2_blmp],['Conductímetro lab',F.bm_s2_cond_ref],
  ], y);

  doc.addPage(); hdr('Arribo y recolección');
  y=HDR+6;
  y=block('3. Arribo / recolección', [
    ['Fecha / hora arribo',[F.bm_s3_arribo_d,F.bm_s3_arribo_h].filter(Boolean).join(' ')],
    ['Recibió / puesto',[F.bm_s3_recibe_nom,F.bm_s3_recibe_puesto].filter(Boolean).join(' · ')],
    ['Inicio recolección (hora)',F.bm_s3_inicio_h],['Periodo descarga (h)',F.bm_s3_periodo_h],
    ['Termómetro',F.bm_s3_termo],['Malla',F.bm_s3_malla],['Proc. temperatura (código)',F.bm_s3_proc_temp],
    ['Detalle proc. temp.',F.bm_s3_proc_temp_txt],['OD / otros',F.bm_s3_od],['Recolección MM/AA/N-3',F.bm_s3_recoleccion],
  ], y);

  doc.addPage(); hdr('Campo y referencias');
  y=HDR+6;
  y=block('4. Referencias y campo', [
    ['BFCMT',F.bm_s4_bfcmt],['Folio BFCMT',F.bm_s4_bfcmt_fol],['BHCAR',F.bm_s4_bhcar],['Folio HCAR',F.bm_s4_hcar_fol],
    ['Bitácora pH entre tomas',F.bm_s4_bitph],['Bitácora conductividad',F.bm_s4_bitcond],
    ['Tira pH (hora / valor)',[F.bm_s4_tira_h,F.bm_s4_tira_val].filter(Boolean).join(' · ')],
    ['Flujos / tomas (resumen)',F.bm_s4_flujos],['Conservadores',F.bm_s4_conserv],
  ], y);

  doc.addPage(); hdr('Cierre');
  y=HDR+6;
  y=block('5. Muestra compuesta y cierre', [
    ['BCCIAR',F.bm_s5_bcciar],['Folio CCIAR',F.bm_s5_cciar_fol],['Preparación muestra compuesta',F.bm_s5_prep],
    ['Volumen / cálculos',F.bm_s5_vol],['Observaciones 1',F.bm_s5_obs1],['Observaciones 2',F.bm_s5_obs2],['Observaciones 3',F.bm_s5_obs3],
  ], y);

  y+=4;
  if(y>H-100){ doc.addPage(); hdr('Anexo · Hoja de campo'); y=HDR+14; }
  else y+=6;
  y=sec('Anexo: extracto de tomas (hoja de campo digital)', y);
  const th=11, rh=10;
  const cols=[22,40,44,44,44,40,40,40];
  const heads=['T','Hora','Tagua','Tamb','pH','Cond','Flujo','Mat'];
  let x=M;
  heads.forEach((h,i)=>{ doc.setFillColor(220,226,234); doc.rect(x,y,cols[i],th,'F'); doc.setTextColor(...NAVY); doc.setFontSize(6.5); doc.text(h,x+cols[i]/2,y+7,{align:'center'}); x+=cols[i]; });
  y+=th;
  (tomas||[]).forEach((t,i)=>{
    if(y>H-40){ doc.addPage(); hdr('Anexo tomas (cont.)'); y=HDR+14; x=M;
      heads.forEach((h,ix)=>{ doc.setFillColor(220,226,234); doc.rect(x,y,cols[ix],th,'F'); doc.setTextColor(...NAVY); doc.setFontSize(6.5); doc.text(h,x+cols[ix]/2,y+7,{align:'center'}); x+=cols[ix]; });
      y+=th;
    }
    x=M; const vals=[`T${i+1}`,t.hora||'',t.tagua||'',t.tamb||'',t.ph||'',t.cond||'',t.ls||'',(t.mat||'').substring(0,8)];
    vals.forEach((v,j)=>{ doc.setDrawColor(200,208,220); doc.rect(x,y,cols[j],rh,'S'); doc.setFontSize(7); doc.setTextColor(...DGRAY); doc.text(jsPdfAscii(String(v)).substring(0,14),x+cols[j]/2,y+7,{align:'center'}); x+=cols[j]; });
    y+=rh;
  });

  await saveMuestreoActual();
  doc.save(`Bitacora_Muestreo_OMAR-${omar.folio||omar.ts}.pdf`);
  toast('PDF Bitácora de muestreo (5 bloques) generado','g');
  if(typeof _maybeMarcarPlanDoc==='function') await _maybeMarcarPlanDoc('bm');
}

// ─── PDF Bitácora pH (Hoja 2 / entre tomas) — columnas alineadas al formato oficial ───
window.generarPDFBitacoraPHOficial = async function generarPDFBitacoraPHOficialV2(){
  if(!omar.ts){ toast('Sin OMAR activa','w'); return; }
  if(typeof guardarBorradorActual==='function') await guardarBorradorActual();
  let regs=(typeof _bitPhRegs==='function')?(_bitPhRegs()||[]):(omar.bitPh||[]);
  if(!regs.length){ toast('Agrega registros en la bitácora pH.','w'); return; }
  const planPh=typeof getPlanDeMuestreo==='function'?getPlanDeMuestreo(omar.ts):null;
  const folioMap={};
  if(planPh&&(planPh.omarIds||[]).length){
    for(const mid of planPh.omarIds){
      const m=typeof _cachedMuestreos!=='undefined'&&_cachedMuestreos?_cachedMuestreos.find(x=>x.id===mid):null;
      let fol='—';
      if(m){ try{ const o=m.omar?JSON.parse(m.omar):{}; fol=o.folio?String(o.folio):String(mid); }catch(e){ fol=String(mid); } }
      folioMap[String(mid)]=fol;
    }
  }
  const folioDocPh=(typeof _bitPhFolioDocGet==='function')?(_bitPhFolioDocGet()||''):(omar.bitPhFolioDoc||'');
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'landscape',unit:'pt',format:'letter'});
  const W=792,H=612,M=20,CW=W-M*2,HDR=58;
  const MGRAY=[208,216,228],LGRAY=[232,238,245],DGRAY=[51,65,85],NAVY=[10,22,40],ACCENT=[37,99,235],WHITE=[255,255,255],BLUE=[26,58,107];
  addLogoProportional(doc,logo,M+2,4,56,48);
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(11);
  doc.text('FORMATO DE USO, CALIBRACION, COMPROBACION Y VERIFICACION DEL pH-metro',W/2,16,{align:'center'});
  doc.setFont('normal'); doc.setFontSize(8); doc.setTextColor(...BLUE);
  const subPlan=planPh&&planPh.id
    ? ('Plan '+jsPdfAscii(String(planPh.folio||planPh.id||'')).substring(0,24)+' · '+String((planPh.omarIds||[]).length)+' OMAR(s)  |  ')
    : '';
  doc.text(subPlan+'Entre tomas  |  OMAR activa '+jsPdfAscii(omar.folio||'-')+'  |  '+jsPdfAscii(omar.empresa||'').substring(0,48),W/2,28,{align:'center'});
  if(folioDocPh){
    doc.setFontSize(7.2); doc.text('Folio documento: '+jsPdfAscii(String(folioDocPh)).substring(0,88),W/2,38,{align:'center'});
  }
  doc.setFillColor(...NAVY); doc.rect(W-130,4,108,HDR-6,'F');
  doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text('Uso pH-metro',W-76,22,{align:'center'});
  doc.setFontSize(7); doc.text('Entre tomas (digital)',W-76,34,{align:'center'});
  let y=HDR+8;
  const fmtFecha=(s)=>{ if(!s) return ''; const p=String(s).split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0].slice(-2)}`:String(s).substring(0,10); };
  const folioOmarCell=(r)=>{
    if(r.sinTomaFolio||r.calibGrupo) return '—';
    if(r.folioOmar) return jsPdfAscii(String(r.folioOmar)).substring(0,12);
    const oid=r.omarId!=null&&r.omarId!==''?String(r.omarId):String(omar.ts||'');
    const f=folioMap[oid]||omar.folio||'—';
    return jsPdfAscii(String(f)).substring(0,12);
  };
  const tomaCell=(r)=>{ if(r.sinTomaFolio||r.calibGrupo) return '—'; return String(r.toma||''); };
  const heads=['#','Fecha','Hora','F.OMAR','Toma','Act','L','Lote','Mrc','Buf','L1','L2','L3','Prom','d03','±05','Obs'];
  const cw=[11,30,28,32,18,16,11,30,24,26,22,22,22,24,14,14,52];
  const xAt=(ci)=>{ let xx=M; for(let k=0;k<ci;k++)xx+=cw[k]; return xx; };
  const rowFill=(ix)=>ix%2?WHITE:LGRAY;
  const drawHead=()=>{
    let x=M;
    doc.setFont('helvetica','bold'); doc.setFontSize(5.4);
    heads.forEach((h,i)=>{ doc.setFillColor(...MGRAY); doc.rect(x,y,cw[i],13,'F'); doc.setDrawColor(170,180,195); doc.rect(x,y,cw[i],13,'S'); doc.setTextColor(...NAVY); doc.text(h,x+cw[i]/2,y+8.5,{align:'center'}); x+=cw[i]; });
    y+=13;
  };
  drawHead();
  const cell=(v,i,ix,yy,rh,fb)=>{
    const x=xAt(i);
    doc.setFillColor(...(i===0?ACCENT:fb));
    doc.rect(x,yy,cw[i],rh,'F');
    doc.setDrawColor(200,210,220);
    doc.rect(x,yy,cw[i],rh,'S');
    doc.setTextColor(...(i===0?WHITE:DGRAY));
    doc.setFont('helvetica',i===0?'bold':'normal');
    doc.setFontSize(5.8);
    doc.text(jsPdfAscii(String(v)).substring(0,16),x+cw[i]/2,yy+rh/2+2.2,{align:'center'});
  };
  const valsForRow=(r,ix,nRow)=>{
    const Ls=[r.l1,r.l2,r.l3].map(v=>parseFloat(v)).filter(n=>!isNaN(n));
    const prom=Ls.length?Ls.reduce((a,b)=>a+b,0)/Ls.length:null;
    const ok03=Ls.length===3?(Math.max(...Ls)-Math.min(...Ls))<=0.03+1e-9:null;
    const buf=parseFloat(r.buffer);
    const ok05=(Ls.length===3&&buf!=null&&!isNaN(buf)&&prom!=null)?(Math.abs(prom-buf)<=0.05+1e-6):null;
    return [String(nRow),fmtFecha(r.fecha),r.hora||'',folioOmarCell(r),tomaCell(r),r.act||'',r.limp||'',r.lote||'',r.marca||'',r.buffer||'',r.l1||'',r.l2||'',r.l3||'',prom!=null?prom.toFixed(2):'',ok03===true?'SI':ok03===false?'NO':'',ok05===true?'SI':ok05===false?'NO':'',(r.obs||'').substring(0,28)];
  };
  const drawDataRow=(r,ix,nRow,rh)=>{
    const vals=valsForRow(r,ix,nRow);
    const fb=rowFill(nRow);
    vals.forEach((v,i)=>cell(v,i,ix,y,rh,fb));
    y+=rh;
    if(y>H-52){ doc.addPage(); addLogoProportional(doc,logo,M+2,4,56,48); y=M+8; drawHead(); }
  };
  const drawCalibPair=(r1,r2,pendPair)=>{
    const rh=12;
    if(!pendPair){
      disp++; drawDataRow(r1,ix,disp,rh);
      disp++; drawDataRow(r2,ix+1,disp,rh);
      ix+=2;
      return;
    }
    const mergeW=cw[10]+cw[11]+cw[12]+cw[13];
    const xM=xAt(10);
    disp++;
    const n1=disp;
    disp++;
    const n2=disp;
    const v1=valsForRow(r1,ix,n1);
    const v2=valsForRow(r2,ix+1,n2);
    const fb=rowFill(n1);
    for(let row=0;row<2;row++){
      const vals=row===0?v1:v2;
      const yy=y+row*rh;
      for(let i=0;i<=9;i++) cell(vals[i],i,ix,yy,rh,fb);
      for(let i=14;i<=16;i++) cell(vals[i],i,ix,yy,rh,fb);
    }
    doc.setFillColor(...LGRAY);
    doc.rect(xM,y,mergeW,rh*2,'F');
    doc.setDrawColor(200,210,220);
    doc.rect(xM,y,mergeW,rh*2,'S');
    doc.setFont('helvetica','bold');
    doc.setFontSize(10);
    doc.setTextColor(130,138,155);
    doc.text('PENDIENTE',xM+mergeW/2,y+rh,{align:'center'});
    doc.setFont('helvetica','normal');
    y+=rh*2;
    ix+=2;
    if(y>H-52){ doc.addPage(); addLogoProportional(doc,logo,M+2,4,56,48); y=M+8; drawHead(); }
  };

  let ix=0, disp=0;
  while(ix<regs.length){
    const r=regs[ix], n=regs[ix+1];
    if(r&&n&&r.calibGrupo&&r.calibGrupo===n.calibGrupo&&r.calibPaso===1&&n.calibPaso===2){
      const pend=r.pendienteBuf1!==false;
      drawCalibPair(r,n,pend);
      continue;
    }
    if(r&&n&&r.calibGrupo&&r.calibGrupo===n.calibGrupo&&r.calibPaso===3&&n.calibPaso===4){
      const pend=r.pendienteBuf2!==false;
      drawCalibPair(r,n,pend);
      continue;
    }
    disp++;
    drawDataRow(r,ix,disp,12);
    ix++;
  }
  y+=10;
  const Ley=window.AARMS_DOC_LEYENDAS||{};
  const pie=[Ley.actControl,Ley.limpiezaCod,Ley.dosBufferNoche,Ley.phNotaBlmp,Ley.phCriterioOficial,Ley.phFormCodigo].filter(Boolean).join(' ');
  doc.setFontSize(5.8); doc.setTextColor(80,90,105); doc.setFont('helvetica','italic');
  const lines=(typeof doc.splitTextToSize==='function')?doc.splitTextToSize(jsPdfAscii(pie||''),CW):[pie];
  let yy=y+6;
  lines.forEach(ln=>{ if(yy>H-52){ doc.addPage(); addLogoProportional(doc,logo,M+2,4,56,48); yy=M+8; } doc.text(ln,M,yy); yy+=6.8; });
  yy+=6;
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...NAVY);
  doc.text('MUESTREO: ___________________________',M,yy); doc.text('SUPERVISO: ___________________________',M+CW/2,yy);
  yy+=14;
  doc.setFontSize(6); doc.setTextColor(100,110,125);
  doc.text(jsPdfAscii(Ley.phFormCodigo||'F-AA-264-4')+'  |  Pagina digital',M,yy);
  const pdfSlug=planPh&&planPh.id
    ? `Plan-${String(planPh.folio||planPh.id||'').replace(/[^\w\-]+/g,'_')}`
    : `OMAR-${omar.folio||omar.ts}`;
  doc.save(`Phmetro_EntreTomas_${pdfSlug}.pdf`);
  toast('PDF bitácora pH (entre tomas) generado','g');
  if(typeof _maybeMarcarPlanDoc==='function') await _maybeMarcarPlanDoc('phcam');
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
window.cerrarPagPh2644Lab=cerrarPagPh2644Lab;

/* ─── pH-metro helpers: criterios oficiales ─── */
function ph1ComprobCheck(prefix){
  const l1=parseFloat(document.getElementById('ph1_'+prefix+'_l1')?.value);
  const l2=parseFloat(document.getElementById('ph1_'+prefix+'_l2')?.value);
  const l3=parseFloat(document.getElementById('ph1_'+prefix+'_l3')?.value);
  const buf=parseFloat(document.getElementById('ph1_'+prefix+'_buffer')?.value);
  const promInp=document.getElementById('ph1_'+prefix+'_prom');
  const box=document.getElementById('ph1_'+prefix+'_check');
  const ar1=document.getElementById('ph1_'+prefix+'_ar1');
  const ar2=document.getElementById('ph1_'+prefix+'_ar2');
  if(!box) return;
  const Ls=[l1,l2,l3].filter(n=>!isNaN(n));
  if(Ls.length<3){ if(promInp) promInp.value=''; box.textContent=''; return; }
  const prom=Ls.reduce((a,b)=>a+b,0)/3;
  if(promInp) promInp.value=prom.toFixed(2);
  const diffMax=Math.max(...Ls)-Math.min(...Ls);
  const ok2 = diffMax <= 0.03;
  if(ar2 && !ar2.value) ar2.value = ok2 ? 'acepta' : 'rechaza';
  let ok1=null, txt=`Δ entre lecturas ${diffMax.toFixed(2)} UpH ${ok2?'≤':'>'} 0.03`;
  if(!isNaN(buf)){
    const desv=Math.abs(prom-buf);
    ok1 = desv <= 0.05;
    if(ar1 && !ar1.value) ar1.value = ok1 ? 'acepta' : 'rechaza';
    txt += `  ·  Prom vs nominal ${desv.toFixed(2)} UpH ${ok1?'≤':'>'} 0.05`;
  }
  box.style.color = (ok2 && (ok1===null||ok1===true)) ? 'var(--green)' : '#f87171';
  box.textContent = txt;
}
function ph1VerifCheck(prefix){
  const l1=parseFloat(document.getElementById('ph1_'+prefix+'_l1')?.value);
  const l2=parseFloat(document.getElementById('ph1_'+prefix+'_l2')?.value);
  const l3=parseFloat(document.getElementById('ph1_'+prefix+'_l3')?.value);
  const buf=parseFloat(document.getElementById('ph1_'+prefix+'_buffer')?.value);
  const box=document.getElementById('ph1_'+prefix+'_check');
  const ar=document.getElementById('ph1_'+prefix+'_ar');
  if(!box) return;
  const Ls=[l1,l2,l3].filter(n=>!isNaN(n));
  if(Ls.length<3){ box.textContent=''; return; }
  const prom=Ls.reduce((a,b)=>a+b,0)/3;
  const diffMax=Math.max(...Ls)-Math.min(...Ls);
  const ok2 = diffMax <= 0.03;
  let ok1=null;
  if(!isNaN(buf)){
    ok1 = Math.abs(prom-buf) <= 0.05;
  }
  const ok = ok2 && (ok1===null||ok1===true);
  if(ar && !ar.value) ar.value = ok ? 'acepta' : 'rechaza';
  box.style.color = ok ? 'var(--green)' : '#f87171';
  let txt=`Promedio ${prom.toFixed(2)} · Δ ${diffMax.toFixed(2)} ${ok2?'≤':'>'} 0.03`;
  if(ok1!==null) txt += ` · vs nominal ${ok1?'≤':'>'} 0.05`;
  txt += ok ? '  ✓ ACEPTA' : '  ✗ RECHAZA';
  box.textContent = txt;
}
window.ph1ComprobCheck=ph1ComprobCheck;
window.ph1VerifCheck=ph1VerifCheck;
window.guardarPh1Page=guardarPh1Page;
window.generarPDFPh2644H1=generarPDFPh2644H1;
window.cerrarDocSuite=cerrarDocSuite;

})();
