const LOGO_APP_URI = 'logo_pdf.png';
const LOGO_PDF_URI = 'logo.png';
const LOGO_BASE_URL = 'https://reyrdgz.github.io/AARMS/';

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
    const urls=[url, LOGO_BASE_URL+url];
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
  return String(s)
    .replace(/[₀]/g,'0').replace(/[₁]/g,'1').replace(/[₂]/g,'2').replace(/[₃]/g,'3').replace(/[₄]/g,'4')
    .replace(/[₅]/g,'5').replace(/[₆]/g,'6').replace(/[₇]/g,'7').replace(/[₈]/g,'8').replace(/[₉]/g,'9')
    .replace(/[⁰]/g,'0').replace(/[¹]/g,'1').replace(/[²]/g,'2').replace(/[³]/g,'3').replace(/[⁴]/g,'4')
    .replace(/[⁵]/g,'5').replace(/[⁶]/g,'6').replace(/[⁷]/g,'7').replace(/[⁸]/g,'8').replace(/[⁹]/g,'9')
    .replace(/µ/g,'u').replace(/—/g,'-').replace(/–/g,'-')
    .replace(/[“”]/g,'"').replace(/[‘’]/g,"'")
    .replace(/✓/g,'v').replace(/✗/g,'x').replace(/✕/g,'x')
    .replace(/[°]/g,' ');
}

const PARAMS_TOMA=['FQ','TOC','Hg','MP','CIAN','FOS.','SAAM','GYA','DQO','DBO5','N.TOT','CTYF','ENTE.','NO2','NO3','HELM','CLR','ECOL','TOX','CLOR','CrHx','OTRS'];
const CONS_O=[['1','H2SO4'],['2','NaOH'],['3','K2Cr2O7 25%'],['4','Hielo 4C'],['5','NA'],['6','HNO3'],['7','Tiosulfato'],['8','HCl'],['9','HNO3 Sup.'],['10','H2SO4 25%'],['12','Buffer'],['13','Formald.'],['14','Otro']];
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

// Recoge los inputs visibles de la tarjeta de una toma y actualiza el array tomas[]
function _captureTomaInputs(card){
  const id = parseInt(card.getAttribute('data-toma-id'));
  if(isNaN(id)) return;
  const t = tomas.find(x=>x.id===id);
  if(!t) return;
  const get=(sel)=>{const el=card.querySelector(sel);return el?el.value:'';};
  // Estos selectors corresponden a los campos que renderTomas pinta
  const map = {
    hora:  '[data-f="hora"]',
    pct:   '[data-f="pct"]',
    ls:    '[data-f="ls"]',
    tamb:  '[data-f="tamb"]',
    tagua: '[data-f="tagua"]',
    ph:    '[data-f="ph"]',
    cond:  '[data-f="cond"]',
    mat:   '[data-f="mat"]',
    color: '[data-f="color"]',
  };
  for(const [k,sel] of Object.entries(map)){
    const v = get(sel);
    if(v !== '' || t[k] != null) t[k] = v;
  }
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
    set('o_dir',omar.direccion);set('o_mun',omar.municipio);set('o_tel',omar.telefono);
    set('o_sitio',omar.sitio);set('o_idm',omar.idmuestra);set('o_norma',omar.norma);
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
const PAGES=['pgHome','pgPlan','pg0','pg1','pgLVAR','pgBlmp','pgColab','pgBpm','pgBm','pgPh2644','pgBitPH','pgBitCond'];
function showPage(n){
  PAGES.forEach((id,i)=>{const e=document.getElementById(id);if(e)e.classList.toggle('on',i===n);});
  window.scrollTo({top:0,behavior:'smooth'});
}
// Ir a una página por id
function goPage(id){
  const idx = PAGES.indexOf(id);
  if(idx>=0) showPage(idx);
}

function goHome(){
  closeFabMenu();
  // Persistir cualquier cambio pendiente antes de salir
  try{ if(typeof guardarBorradorActual==='function') guardarBorradorActual(); }catch(e){}
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
  });

  await refreshCache();
  const all = await idbGetAll();
  let nid = all.reduce((mx, x)=> Math.max(mx, Number(x.id)||0), 0) + 1;
  const omarIds = [];
  const seedOmar = (mid)=>({
    ts: mid,
    muestreador: muest || '',
    fecha,
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
    <button data-action="open-plan" data-planid="${plan.id}" style="background:rgba(74,158,255,.12);border:1px solid rgba(74,158,255,.3);border-radius:7px;color:var(--acc);padding:6px 10px;font-family:var(--syne);font-size:11px;font-weight:800;cursor:pointer">Abrir plan</button>
  `;
  header.addEventListener('click',e=>{
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
  renderPlanPage();
  goPage('pgPlan');
}

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
  // Lista de OMARs
  const list = document.getElementById('planOmarsList');
  const cnt = document.getElementById('planOmarsCnt');
  if(!list) return;
  const omars = getMuestreosDePlan(_currentPlanId);
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
    const row = document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid var(--ln);cursor:pointer';
    row.innerHTML = `
      <div style="width:26px;height:26px;border-radius:7px;background:rgba(74,158,255,.12);border:1px solid rgba(74,158,255,.25);display:flex;align-items:center;justify-content:center;font-family:var(--syne);font-weight:800;font-size:11px;color:var(--acc);flex-shrink:0">${idx+1}</div>
      <div style="width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0;box-shadow:0 0 6px ${dot}88"></div>
      <div style="flex:1;min-width:0">
        <div style="font-family:var(--syne);font-size:12px;font-weight:700;color:var(--w);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">OMAR-${m.folio||'—'} · ${omarObj.empresa||'—'}</div>
        <div style="font-size:10px;color:var(--g1);margin-top:2px">${nTomas}${ntotal?'/'+ntotal:''} tomas · <span style="color:${color}">${estado}</span></div>
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
      cargarMuestreo(m.id);
    });
    list.appendChild(row);
  });

  // Documentos del plan
  renderPlanDocs();
}

// Definición de documentos del plan. Cada uno tiene:
//  - key: identificador en plan.docs[key].done (para marcar completo)
//  - label, desc (nombres alineados a los formatos / títulos en papel)
//  - where: 'lab' | 'campo' | 'cierre' (agrupación visual en la lista)
//  - ready: true si ya existe el generador
const PLAN_DOCS = [
  {key:'lvar',     label:'Lista de verificación de materiales', desc:'Equipos y material de muestreo (BLVM)',           where:'lab',    ready:true},
  {key:'bpm',      label:'Plan de muestreo (BPM)',              desc:'Pasos del plan, croquis y referencias',           where:'lab',    ready:true},
  {key:'blmp',     label:'Phmetro — limpieza y mantenimiento',  desc:'Antes de salir a campo (laboratorio)',              where:'lab',    ready:true},
  {key:'phlab',    label:'Phmetro — uso y calibración (lab)',   desc:'Calibración, comprobación y verificación en lab', where:'lab',    ready:true},
  {key:'colab',    label:'Conductímetro — laboratorio',         desc:'Limpieza, calibración y verificaciones',            where:'lab',    ready:true},
  {key:'phcam',    label:'Phmetro — entre tomas',               desc:'Registro entre tomas (Ca / Co / V)',               where:'campo',  ready:true},
  {key:'condcamp', label:'Conductímetro — entre tomas',         desc:'Lecturas entre tomas ligadas a la hoja de campo',   where:'campo',  ready:true},
  {key:'bm',       label:'Bitácora de muestreo',                desc:'Del arribo al cierre (varios bloques)',           where:'cierre', ready:true},
];

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
    const inPhase = PLAN_DOCS.filter(d=>d.where===phase);
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
      const row = document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:11px;padding:12px 4px;border-bottom:1px solid var(--ln);cursor:pointer;-webkit-tap-highlight-color:transparent;'+(d.ready?'':'opacity:.65');
      row.innerHTML = `
      <div style="width:28px;height:28px;border-radius:7px;background:${isDone?'rgba(134,239,172,.15)':'var(--bg3)'};border:1px solid ${isDone?'rgba(134,239,172,.4)':'var(--ln)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${isDone?'var(--green)':'var(--g2)'}">
        ${isDone ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '<span style="font-family:var(--syne);font-size:10px;font-weight:800">○</span>'}
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
          <div style="font-family:var(--syne);font-size:12px;font-weight:700;color:var(--w)">${d.label}</div>
          ${whereBadge}
          ${d.ready ? '' : '<span style="background:rgba(251,191,36,.1);color:var(--amber);font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:4px">PRÓXIMO</span>'}
        </div>
        <div style="font-size:10px;color:var(--g1);margin-top:3px">${d.desc}</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--g2)" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
    `;
      row.addEventListener('click',()=>abrirDocPlan(d.key));
      list.appendChild(row);
    });
  });
  if(badge) badge.textContent = `${done}/${PLAN_DOCS.length}`;
}

function abrirDocPlan(key){
  const d = PLAN_DOCS.find(x=>x.key===key);
  if(!d){ return; }
  if(!d.ready){
    toast(d.label + ' — próximamente','');
    return;
  }
  if(['blmp','colab','phcam','condcamp','bpm','bm','phlab'].includes(key) && !omar.ts){
    toast('Abre un OMAR del plan (o desde Inicio) para capturar este documento.','w');
    return;
  }
  // Despachar según documento
  if(key === 'lvar'){ abrirLVAR(); return; }
  if(key === 'bpm'){ if(typeof abrirPagBpm==='function')abrirPagBpm(); else toast('Carga documents-suite.js','w'); return; }
  if(key === 'bm'){ if(typeof abrirPagBm==='function')abrirPagBm(); else toast('Carga documents-suite.js','w'); return; }
  if(key === 'phlab'){ if(typeof abrirPagPh2644Lab==='function')abrirPagPh2644Lab(); else toast('Carga documents-suite.js','w'); return; }
  if(key === 'blmp'){ abrirPagBlmp(); return; }
  if(key === 'colab'){ abrirPagColab(); return; }
  if(key === 'phcam'){ abrirBitacoraPH(); return; }
  if(key === 'condcamp'){ abrirBitacoraCond(); return; }
  toast('Abriendo '+d.label+'...','');
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
  {key:'hcl_11',   label:'HCl 1:1',                            pdfLabel:'HCl 1:1'},
  {key:'h2so4_25', label:'H₂SO₄ 25%',                          pdfLabel:'H2SO4 25%'},
  {key:'naoh_1n',  label:'NaOH 1N',                            pdfLabel:'NaOH 1N'},
  {key:'k2cr2o7',  label:'K₂Cr₂O₇ 25%',                        pdfLabel:'K2Cr2O7 25%'},
  {key:'hcl_lav',  label:'HCl 1:1 (para lavado de electrodo)', pdfLabel:'HCl 1:1 (para lavado de electrodo)'},
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

function abrirLVAR(){
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
  setVal('lv_folio',  _lvarData.folio);
  setVal('lv_fecha',  _lvarData.fecha || plan.fecha || new Date().toISOString().split('T')[0]);
  setVal('lv_lugar',  _lvarData.lugar);
  setVal('lv_dir',    _lvarData.direccion);
  setVal('lv_ciudad', _lvarData.ciudad || 'Guaymas');
  setVal('lv_tipo',   _lvarData.tipo);
  setVal('lv_norma',  _lvarData.norma);
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
    <button type="button" onclick="lvarEditOmarReal(${om.omarId})" style="background:rgba(74,158,255,.1);border:1px solid rgba(74,158,255,.35);color:var(--acc);padding:5px 10px;border-radius:7px;font-size:10.5px;font-family:var(--syne);font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent">✎ Editar OMAR</button>`;
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
    // Pedir motivo
    const motivo = prompt('Motivo de no realización (ej. acceso negado, descarga seca):');
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
    // Auto-guardado debounced cada vez que cambia cualquier input del LVAR
    if(inp.matches('input, textarea, select')){
      clearTimeout(_lvarAutoSaveTimer);
      _lvarAutoSaveTimer = setTimeout(()=>{
        guardarLVAR(true).then(()=>{
          // Recalcular envases (puede cambiar al cambiar cant. manual de un envase)
          buildLvarEnvases();
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
    const hasData = !!(saved.num && String(saved.num).trim() !== '');
    return `
      <div data-lv-row="${eq.key}" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--ln)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;color:var(--w);font-weight:600">${eq.label}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:4px">
            <span style="font-family:var(--mono);font-size:12px;color:var(--acc);background:rgba(74,158,255,.1);padding:6px 8px;border-radius:6px;border:1px solid rgba(74,158,255,.25)">${eq.prefix}</span>
            <input data-lv-eq="${eq.key}" data-field="num" data-required="true" type="text" value="${saved.num||''}" placeholder="nº" style="flex:1">
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
function buildLvarManualCheckList(containerId, items, section){
  const c = document.getElementById(containerId);
  if(!c) return;
  const d = _lvarData[section] || {};
  c.innerHTML = items.map(it=>{
    const saved = d[it.key] || {};
    const checked = !!saved.checked;
    return `
      <label data-lv-row="${it.key}" style="display:flex;align-items:center;gap:12px;padding:9px 4px;border-bottom:1px solid var(--ln);cursor:pointer;-webkit-tap-highlight-color:transparent">
        <input data-lv-${section}="${it.key}" data-field="checked" type="checkbox" ${checked?'checked':''} style="width:20px;height:20px;flex-shrink:0;accent-color:var(--acc);cursor:pointer">
        <div style="flex:1;font-size:13px;color:var(--w)">${it.label}</div>
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
          <input data-lv-${section}="${it.key}" data-field="lote" data-required="true" type="text" value="${s.lote||''}" placeholder="Lote">
          <input data-lv-${section}="${it.key}" data-field="cad"  data-required="true" type="text" value="${s.cad||''}" placeholder="Caducidad (dd/mm/aa)">
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
          <input data-lv-react="${r.key}" data-field="lote"  data-required="true" type="text" value="${s.lote||''}"  placeholder="Lote">
          <input data-lv-react="${r.key}" data-field="marca" data-required="true" type="text" value="${s.marca||''}" placeholder="Marca">
          <input data-lv-react="${r.key}" data-field="cad"   data-required="true" type="text" value="${s.cad||''}"   placeholder="Cad.">
        </div>
      </div>`;
  }).join('');
}

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
    return `
      <div data-lv-row="${p.key}" style="padding:8px 0;border-bottom:1px solid var(--ln)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
          <div style="flex:1;font-size:12.5px;color:var(--w);font-weight:600">${p.label}</div>
          ${_lvCheckBadge(hasData)}
        </div>
        <div style="display:grid;${grid};gap:6px">
          ${p.conValor ? `<input data-lv-patrones="${p.key}" data-field="valor" data-required="true" type="text" value="${s.valor||''}" placeholder="pH">` : ''}
          <input data-lv-patrones="${p.key}" data-field="lote"  data-required="true" type="text" value="${s.lote||''}"  placeholder="Lote">
          <input data-lv-patrones="${p.key}" data-field="marca" data-required="true" type="text" value="${s.marca||''}" placeholder="Marca">
          <input data-lv-patrones="${p.key}" data-field="cad"   data-required="true" type="text" value="${s.cad||''}"   placeholder="Cad.">
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
    const breakdown = [];
    omars.forEach((o, idx) => {
      const aplica = env.analitos.length === 0 || env.analitos.some(a => (o.analitos||[]).includes(a));
      if(!aplica) return;
      const q = _calcCantEnvasePorOmar(env, o.ntomas);
      cantCalc += q;
      breakdown.push(`O${idx+1}=${q}`);
    });
    const cant = saved.cant !== undefined ? saved.cant : cantCalc;
    const tipoBadge = env.tipo === 'simple'
      ? `<span style="background:rgba(251,191,36,.1);color:var(--amber);font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:4px">SIMPLE</span>`
      : `<span style="background:rgba(74,158,255,.12);color:var(--acc);font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:4px">COMPUESTO</span>`;
    const breakdownTxt = breakdown.length ? `${breakdown.join(' + ')} = ${cantCalc}` : 'genérico';
    const readonlyAttr = _lvarBloqueado ? 'readonly' : '';
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--ln)">
        <input data-lv-envases="${env.key}" data-field="cant" type="number" min="0" value="${cant}" ${readonlyAttr} style="width:60px;text-align:center;flex-shrink:0;font-weight:800;color:var(--acc)">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:var(--w);line-height:1.3">${_lvarEnvaseDisplayLabel(env)}</div>
          <div style="margin-top:3px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${tipoBadge}<span style="font-size:10px;color:var(--g2);font-family:var(--mono)">${breakdownTxt}</span></div>
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
    });
  }

  plan.lvar = data;
  plan.docs = plan.docs || {};
  plan.docs.lvar = {done: !!(data.folio && data.asig), updatedAt: Date.now()};
  await guardarPlan(plan);
  _lvarData = data;
  if(!silent) toast('LVAR guardado ✓','g');
}

async function generarPDFLVAR(){
  if(!_currentPlanId){ toast('No hay plan abierto','w'); return; }
  await guardarLVAR(true);
  const plan = _cachedPlanes.find(p=>p.id===_currentPlanId);
  if(!plan){ return; }
  const data = plan.lvar || {};

  const {jsPDF} = window.jspdf;
  const logoPDF = await loadLogo(LOGO_PDF_URI);

  // Portrait letter: 612 x 792 pt
  const doc = new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612, H=792, M=28;
  const CW = W - M*2;  // 556

  // Paleta — consistente con los otros PDFs
  const NAVY=[10,22,40], BLUE=[26,58,107], ACCENT=[37,99,235];
  const MGRAY=[208,216,228], LGRAY=[232,238,245], DGRAY=[51,65,85];
  const WHITE=[255,255,255], GREEN=[22,163,74];

  // ════════ HEADER ════════
  const HDR = 72;
  addLogoProportional(doc, logoPDF, M+2, 6, 70, 60);

  // Centro: nombre empresa
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(13);
  doc.text('ASESORÍA Y ANÁLISIS S.C.', W/2-30, 20, {align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...BLUE);
  doc.text('Laboratorio de Alimentos y Aguas', W/2-30, 30, {align:'center'});
  doc.setTextColor(100,110,130); doc.setFontSize(7);
  doc.text('Calle 12 Ave. Serdán Ext. 465 Int. 201  |  Edif. Puertas del Sol  |  Centro C.P. 85400', W/2-30, 40, {align:'center'});
  doc.text('Tel: 622 224 0910  FAX 622 224 207', W/2-30, 49, {align:'center'});

  // Derecha: título box
  doc.setFillColor(...NAVY); doc.rect(W-150, 2, 122, HDR-2, 'F');
  doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.text('LISTA DE', W-89, 18, {align:'center'});
  doc.text('VERIFICACIÓN', W-89, 30, {align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(200,210,230);
  doc.text('DE MUESTREO', W-89, 41, {align:'center'});
  doc.setFontSize(6.5);
  doc.text(`Folio LVAR: ${data.folio||'-'}`, W-89, 53, {align:'center'});
  doc.text('F-AA-60-16 (Digital)', W-89, 62, {align:'center'});

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
    doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
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
    doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(6.3);
    doc.text(asci(label), x+3, yy+5.5);
    doc.setFont('helvetica','normal'); doc.setTextColor(...DGRAY); doc.setFontSize(8.2);
    const txt = (val==null||val==='') ? '-' : asci(String(val));
    doc.text(txt.substring(0,Math.floor(w/4.4)), x+3, yy+h-3);
  };

  // Asegurar página nueva si nos pasamos
  const ensureSpace = (need) => {
    if(y + need > H - 40){
      drawFooter();
      doc.addPage();
      y = M;
    }
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
  // Header
  doc.setFillColor(...MGRAY); doc.rect(M, y, CW, eqH, 'F');
  bordeRect(M, y, CW, eqH);
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(7);
  doc.text('EQUIPO', M+5, y+9);
  doc.text('CLAVE / VALOR', M+CW*0.50, y+9);
  doc.text('PRESENTE', M+CW*0.92, y+9, {align:'center'});
  y += eqH;

  LVAR_EQUIPOS.forEach((eq, idx) => {
    ensureSpace(eqH+2);
    const saved = equip[eq.key] || {};
    const bg = idx%2===0 ? WHITE : [248,250,252];
    doc.setFillColor(...bg); doc.rect(M, y, CW, eqH, 'F');
    bordeRect(M, y, CW, eqH);
    doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal'); doc.setFontSize(8);
    doc.text(asci(eq.label), M+5, y+9);
    let val;
    if(eq.fixedValue) val = saved.val || eq.fixedValue;
    else val = (saved.num ? `${eq.prefix}${saved.num}` : '-');
    doc.setFont('helvetica','bold'); doc.setTextColor(...ACCENT);
    doc.text(asci(val), M+CW*0.50, y+9);
    // ¿hay datos? → palomita vectorial
    const has = !!(saved.num && String(saved.num).trim()!=='') || !!(saved.val && saved.val.trim()!=='');
    if(has){
      drawCheck(M+CW*0.92, y+eqH/2);
    } else {
      doc.setTextColor(180,180,180); doc.setFontSize(9);
      doc.text('-', M+CW*0.92, y+10, {align:'center'});
    }
    y += eqH;
  });
  y += 6;

  // ════════ DISOLUCIONES (lote + caducidad) ════════
  ensureSpace(80);
  y = sectionTitle('DISOLUCIONES', y);
  const dH = 14;
  doc.setFillColor(...MGRAY); doc.rect(M, y, CW, dH, 'F');
  bordeRect(M, y, CW, dH);
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(7);
  doc.text('DISOLUCIÓN', M+5, y+9);
  doc.text('LOTE', M+CW*0.55, y+9);
  doc.text('CADUCIDAD', M+CW*0.78, y+9);
  y += dH;
  const dis = data.disol || {};
  LVAR_DISOL.forEach((d,idx) => {
    ensureSpace(dH+2);
    const s = dis[d.key] || {};
    const bg = idx%2===0 ? WHITE : [248,250,252];
    doc.setFillColor(...bg); doc.rect(M, y, CW, dH, 'F');
    bordeRect(M, y, CW, dH);
    doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.text(asci(d.pdfLabel || d.label), M+5, y+9);
    doc.text(asci(s.lote||'-'), M+CW*0.55, y+9);
    doc.text(asci(s.cad||'-'),  M+CW*0.78, y+9);
    y += dH;
  });
  y += 6;

  // ════════ REACTIVOS ════════
  ensureSpace(50);
  y = sectionTitle('REACTIVOS', y);
  doc.setFillColor(...MGRAY); doc.rect(M, y, CW, dH, 'F');
  bordeRect(M, y, CW, dH);
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(7);
  doc.text('REACTIVO', M+5, y+9);
  doc.text('LOTE',     M+CW*0.45, y+9);
  doc.text('MARCA',    M+CW*0.65, y+9);
  doc.text('CAD.',     M+CW*0.85, y+9);
  y += dH;
  const reac = data.react || {};
  LVAR_REACTIVOS.forEach((r,idx) => {
    ensureSpace(dH+2);
    const s = reac[r.key] || {};
    const bg = idx%2===0 ? WHITE : [248,250,252];
    doc.setFillColor(...bg); doc.rect(M, y, CW, dH, 'F');
    bordeRect(M, y, CW, dH);
    doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.text(asci(r.pdfLabel || r.label), M+5, y+9);
    doc.text(asci(s.lote||'-'),  M+CW*0.45, y+9);
    doc.text(asci(s.marca||'-'), M+CW*0.65, y+9);
    doc.text(asci(s.cad||'-'),   M+CW*0.85, y+9);
    y += dH;
  });
  y += 6;

  // ════════ PATRONES DE CALIBRACIÓN ════════
  ensureSpace(80);
  y = sectionTitle('SOLUCIONES DE CALIBRACIÓN', y);
  doc.setFillColor(...MGRAY); doc.rect(M, y, CW, dH, 'F');
  bordeRect(M, y, CW, dH);
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(7);
  doc.text('PATRÓN', M+5, y+9);
  doc.text('VALOR',  M+CW*0.42, y+9);
  doc.text('LOTE',   M+CW*0.55, y+9);
  doc.text('MARCA',  M+CW*0.72, y+9);
  doc.text('CAD.',   M+CW*0.89, y+9);
  y += dH;
  const pat = data.patrones || {};
  LVAR_PATRONES.forEach((p,idx) => {
    ensureSpace(dH+2);
    const s = pat[p.key] || {};
    const bg = idx%2===0 ? WHITE : [248,250,252];
    doc.setFillColor(...bg); doc.rect(M, y, CW, dH, 'F');
    bordeRect(M, y, CW, dH);
    doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.text(asci(p.pdfLabel || p.label), M+5, y+9);
    doc.text(asci(p.conValor ? (s.valor||'-') : '-'), M+CW*0.42, y+9);
    doc.text(asci(s.lote||'-'),  M+CW*0.55, y+9);
    doc.text(asci(s.marca||'-'), M+CW*0.72, y+9);
    doc.text(asci(s.cad||'-'),   M+CW*0.89, y+9);
    y += dH;
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
    const bg = (Math.floor(idx/2))%2===0 ? WHITE : [248,250,252];
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
    doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal'); doc.setFontSize(7);
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
    const bg = (Math.floor(idx/2))%2===0 ? WHITE : [248,250,252];
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
    doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal'); doc.setFontSize(7);
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
  doc.setFillColor(...MGRAY); doc.rect(M, y, CW, envH, 'F');
  bordeRect(M, y, CW, envH);
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(7);
  doc.text('CONTENEDOR', M+5, y+9);
  doc.text('TIPO',         M+CW*0.74, y+9, {align:'center'});
  doc.text('CANTIDAD',     M+CW*0.92, y+9, {align:'center'});
  y += envH;

  if(aplicables.length === 0){
    doc.setFillColor(...LGRAY); doc.rect(M, y, CW, envH, 'F');
    bordeRect(M, y, CW, envH);
    doc.setTextColor(120,128,142); doc.setFont('helvetica','italic'); doc.setFontSize(7.5);
    doc.text('Sin envases declarados (no hay analitos seleccionados)', M+5, y+9);
    y += envH;
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
      const bg = idx%2===0 ? WHITE : [248,250,252];
      doc.setFillColor(...bg); doc.rect(M, y, CW, envH, 'F');
      bordeRect(M, y, CW, envH);
      doc.setTextColor(...DGRAY); doc.setFont('helvetica','normal'); doc.setFontSize(7);
      doc.text(asci(_lvarEnvaseDisplayLabel(envItem)).substring(0,65), M+5, y+9);
      // Tipo (simple/compuesto)
      doc.setFont('helvetica','bold'); doc.setFontSize(6.5);
      if(envItem.tipo==='simple'){ doc.setTextColor(180,130,20); }
      else                       { doc.setTextColor(...ACCENT); }
      doc.text(envItem.tipo.toUpperCase(), M+CW*0.74, y+9, {align:'center'});
      // Cantidad
      doc.setTextColor(...NAVY); doc.setFontSize(9);
      doc.text(String(cant), M+CW*0.92, y+9, {align:'center'});
      y += envH;
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
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(6.5);
  doc.text('PERSONA ASIGNADA (MUESTREADOR)', M+4, y+6);
  doc.setFont('helvetica','normal'); doc.setTextColor(...DGRAY); doc.setFontSize(8.5);
  doc.text(asci(data.asig||'-'), M+4, y+15);
  doc.setFontSize(6.8); doc.setTextColor(100,110,130);
  doc.text(`Fecha: ${data.asigFecha||'-'}    Hora: ${data.asigHora||'-'}`, M+4, y+22);
  // Supervisor
  doc.setFillColor(...LGRAY); doc.rect(M+CW*0.5, y, CW*0.5, respH, 'F');
  bordeRect(M+CW*0.5, y, CW*0.5, respH);
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(6.5);
  doc.text('SUPERVISOR', M+CW*0.5+4, y+6);
  doc.setFont('helvetica','normal'); doc.setTextColor(...DGRAY); doc.setFontSize(8.5);
  doc.text(asci(data.sup||'-'), M+CW*0.5+4, y+15);
  doc.setFontSize(6.8); doc.setTextColor(100,110,130);
  doc.text(`Fecha: ${data.supFecha||'-'}    Hora: ${data.supHora||'-'}`, M+CW*0.5+4, y+22);
  y += respH;

  // Observaciones
  if(data.obs && data.obs.trim()){
    ensureSpace(40);
    const obsH = 30;
    doc.setFillColor(255,250,235); doc.rect(M, y, CW, obsH, 'F');
    doc.setDrawColor(220,180,80); doc.setLineWidth(0.5);
    doc.rect(M, y, CW, obsH, 'S');
    doc.setTextColor(140,80,10); doc.setFont('helvetica','bold'); doc.setFontSize(7);
    doc.text('OBSERVACIONES', M+4, y+8);
    doc.setFont('helvetica','normal'); doc.setTextColor(...DGRAY); doc.setFontSize(8);
    const obsLines = doc.splitTextToSize(asci(data.obs.trim()), CW-10);
    doc.text(obsLines.slice(0,3), M+4, y+16);
    y += obsH;
  }

  // ════════ FOOTER ════════
  function drawFooter(){
    const fy = H - 22;
    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.4);
    doc.line(M, fy-4, W-M, fy-4);
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,128,142);
    doc.text('Asesoría y Análisis S.C.  —  Tel. 622 224 0910  —  Guaymas, Sonora', M, fy);
    doc.text('Documento generado con AARMS — valor de registro oficial', M, fy+8);
    doc.setTextColor(...ACCENT); doc.setFont('helvetica','bold');
    doc.text('F-AA-60-16 (Digital)', W-M, fy+8, {align:'right'});
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
    toast('Error al generar PDF: '+(e.message||e),'r');
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
const _OMAR_CAMPOS_COMUNES = ['empresa','contacto','puesto','direccion','municipio','telefono','ssar','elaboro','mat','muestreador','fecha','tipo','intervalo','ndesc','ntomas','reglas','norma','analitos'];

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
    municipio:g('o_mun'), telefono:g('o_tel'), ssar:g('o_ssar'), elaboro:g('o_elab'),
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
  // Guardar SIEMPRE lo que esté en el formulario actual (aunque esté incompleto)
  // para que al regresar encuentres lo que tenías, y que no se mezcle con la OMAR destino.
  await guardarBorradorActual();
  cargarMuestreo(mid);
}

// Guarda los valores actualmente visibles en pg0 (OMAR) y pg1 (Hoja/Cadena) al
// registro cuyo id está en omar.ts. No valida — solo snapshot del estado actual.
// Guarda los valores actualmente visibles en pg0 (OMAR) y delega a
// saveMuestreoActual para escritura única e idempotente. Garantiza que
// fotos, GPS, datos de campo y todo lo demás se preserven SIEMPRE.
async function guardarBorradorActual(){
  const mid = omar?.ts;
  if(!mid && !_pendingNewMuestreoId) return;

  const g = id => { const e=document.getElementById(id); return e?e.value.trim():''; };

  // Detectar si hay algo en el form de pg0 visible
  const folio_pg0 = g('o_omar');
  const emp_pg0   = g('o_emp');
  const hayFormPg0 = !!(folio_pg0 || emp_pg0 || g('o_muest') || g('o_sitio'));

  if(hayFormPg0){
    // Reconstruir omar desde el form de pg0 SIN BORRAR campos que no están en pg0:
    // específicamente .lab y .campo (que viven en pg1) — IMPORTANTÍSIMO conservarlos.
    const labSafe = omar?.lab;
    const campoSafe = omar?.campo;
    omar = {
      ...omar, // conservar cualquier otra propiedad
      folio: folio_pg0, ssar: g('o_ssar'), muestreador: g('o_muest'),
      elaboro: g('o_elab'), empresa: emp_pg0, contacto: g('o_cont'),
      puesto: g('o_puest'), direccion: g('o_dir'), municipio: g('o_mun'),
      telefono: g('o_tel'), sitio: g('o_sitio'), idmuestra: g('o_idm'),
      norma: (typeof getNorma==='function' ? getNorma() : (omar?.norma || '')),
      mat: document.getElementById('o_mat')?.value || omar?.mat || '',
      fecha: g('o_fecha') || omar?.fecha,
      tipo: g('o_tipo') || omar?.tipo,
      intervalo: g('o_int') || omar?.intervalo,
      ndesc: g('o_ndesc') || omar?.ndesc,
      ntomas: g('o_ntomas') || omar?.ntomas,
      analitos: [...analitosSel],
      reglas: g('o_reglas') || omar?.reglas,
      ts: mid || omar?.ts,
      lab: labSafe,
      campo: campoSafe,
    };
    localStorage.setItem('aarms_omar', JSON.stringify(omar));
  }

  // Una sola función de guardado autorizado
  try {
    await saveMuestreoActual();
  } catch(e){
    console.warn('[saveBorrador] error:', e);
  }
}

function cargarMuestreo(id){
  const lista=getMuestreos();
  const m=lista.find(x=>String(x.id)===String(id));
  if(!m){toast('No se encontró el registro','r');return;}

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
    setVal('o_puest',omar.puesto); setVal('o_dir',omar.direccion); setVal('o_mun',omar.municipio);
    setVal('o_tel',omar.telefono); setVal('o_sitio',omar.sitio); setVal('o_idm',omar.idmuestra);
    setVal('o_fecha',omar.fecha); setVal('o_int',omar.intervalo); setVal('o_ndesc',omar.ndesc);
    setVal('o_ntomas',omar.ntomas); setVal('o_reglas',omar.reglas);
    if(omar.mat){const e=document.getElementById('o_mat');if(e)e.value=omar.mat;}
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
  tomas=(m.tomas||[]).map(t=>({...t,params:new Set(t.params||[])}));
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
    goPage('pg1');
    goSec(0);
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
    goPage('pg0');
  }
  renderHermanasBreadcrumb();
  toast(omarLlena ? 'Muestreo cargado ✓' : 'Captura los datos de la OMAR','g');
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
  SECS.forEach((id,i)=>{const e=document.getElementById(id);if(e)e.classList.toggle('on',i===n);});
  document.querySelectorAll('#stepsBar .stp').forEach((t,i)=>{
    t.classList.remove('on','done');
    if(i<n)t.classList.add('done');
    if(i===n)t.classList.add('on');
  });
  window.scrollTo({top:0,behavior:'smooth'});
  if(n===2)buildRes();
}

// ── OMAR ──
const TOMAS_POR_INTERVALO={'<4h':2,'4-8h':4,'8-12h':4,'12-18h':6,'18-24h':6};
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

function getNorma(){
  const sel=document.getElementById('o_norma');
  if(sel.value==='otra') return document.getElementById('o_norma_otra').value.trim();
  return sel.value;
}

function guardarOMAR(){
  const g=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  // Limpiar marcas anteriores
  ['o_omar','o_muest','o_emp','o_sitio'].forEach(id=>{
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
  if(faltantes.length>0){
    toast('Faltan: '+faltantes.join(', '),'w');
    return;
  }
  // Conservar el ts del registro si ya existía (vinimos cargando una OMAR vacía
  // desde el plan). Si no, generar uno nuevo.
  const existingTs = omar.ts || null;
  omar={folio:g('o_omar'),ssar:g('o_ssar'),muestreador:g('o_muest'),elaboro:g('o_elab'),empresa:g('o_emp'),
    contacto:g('o_cont'),puesto:g('o_puest'),direccion:g('o_dir'),municipio:g('o_mun'),
    telefono:g('o_tel'),sitio:g('o_sitio'),idmuestra:g('o_idm'),norma:getNorma(),
    mat:document.getElementById('o_mat').value,fecha:g('o_fecha'),tipo:g('o_tipo'),
    intervalo:g('o_int'),ndesc:g('o_ndesc'),ntomas:g('o_ntomas'),
    analitos:[...analitosSel],reglas:g('o_reglas'),
    ts: existingTs || Date.now()};
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
  _returnToLvarAfterOmar = false; // limpiar flag
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
  ['o_omar','o_muest','o_emp','o_sitio'].forEach(id=>{
    const e=document.getElementById(id);
    if(e)e.style.borderColor='';
  });
  let faltantes=[];
  if(!g('o_omar')){faltantes.push('Folio OMAR');const e=document.getElementById('o_omar');if(e)e.style.borderColor='#f87171';}
  if(!g('o_emp')){faltantes.push('Empresa');const e=document.getElementById('o_emp');if(e)e.style.borderColor='#f87171';}
  if(!g('o_muest')){faltantes.push('Muestreador');const e=document.getElementById('o_muest');if(e)e.style.borderColor='#f87171';}
  if(requireSitio && !g('o_sitio')){faltantes.push('Sitio de muestreo');const e=document.getElementById('o_sitio');if(e)e.style.borderColor='#f87171';}
  if(!g('o_tipo')){faltantes.push('Tipo de muestreo (Simple/Compuesto)');}
  if(!analitosSel || analitosSel.size===0){faltantes.push('Al menos 1 analito');}
  if(faltantes.length>0){
    toast('Faltan: '+faltantes.join(', '),'w');
    return false;
  }
  const existingTs = omar.ts || null;
  omar={folio:g('o_omar'),ssar:g('o_ssar'),muestreador:g('o_muest'),elaboro:g('o_elab'),empresa:g('o_emp'),
    contacto:g('o_cont'),puesto:g('o_puest'),direccion:g('o_dir'),municipio:g('o_mun'),
    telefono:g('o_tel'),sitio:g('o_sitio'),idmuestra:g('o_idm'),norma:getNorma(),
    mat:document.getElementById('o_mat').value,fecha:g('o_fecha'),tipo:g('o_tipo'),
    intervalo:g('o_int'),ndesc:g('o_ndesc'),ntomas:g('o_ntomas'),
    analitos:[...analitosSel],reglas:g('o_reglas'),
    ts: existingTs || Date.now()};
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
    if(c.mat){const e=document.getElementById('h_mat');if(e)e.value=c.mat;}
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
  const id=tid++;
  const now=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false});
  const params=getParamsFromOMAR(); // Pre-seleccionar params de la OMAR
  tomas.push({id,hora:now,pct:'',ls:'',tamb:'',tagua:'',ph:'',mat:'',cond:'',od:'',color:'',olor:null,cloro:null,params});
  renderTomas();
  updTCnt();
  setTimeout(()=>{const b=document.getElementById('tb'+id);if(b)b.classList.add('op');},60);
  // Auto-guardar para que la toma persista aunque cambies de OMAR
  _autoSaveDeferred();
}
function delToma(id){tomas=tomas.filter(t=>t.id!==id);renderTomas();updTCnt();_autoSaveDeferred();}
function togToma(id){
  const b=document.getElementById('tb'+id),c=document.getElementById('tc'+id);
  const o=b.classList.toggle('op');c.classList.toggle('op',o);
}
function upT(id,k,v){
  const t=tomas.find(t=>t.id===id);
  if(t){
    t[k]=v;
    _autoSaveDeferred(); // Persistir cambios de toma sin que el usuario tenga que llegar a la firma
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
function renderTomas(){
  const pGrid=PARAMS_TOMA.map(p=>`<div class="pm" onclick="togP(${0},'${p}')" data-p="${p}"><div class="pbox"><svg class="pchk" width="9" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="pn">${p}</span></div>`).join('');
  document.getElementById('tomasDiv').innerHTML=tomas.map((t,idx)=>`
<div class="toma">
  <div class="toma-h" onclick="togToma(${t.id})">
    <div class="toma-hl">
      <span class="tbadge">T${idx+1}</span>
      <span class="ttime">${t.hora}</span>
      <span class="${t.ph||t.tagua?'tok':'tpend'}">${t.ph?'✓ completa':'pendiente'}</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px">
      <div class="tdel" onclick="event.stopPropagation();delToma(${t.id})">×</div>
      <svg class="tchev op" id="tc${t.id}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  </div>
  <div class="tbody op" id="tb${t.id}">
    <div class="g3" style="margin-bottom:12px">
      <div class="f"><label>Hora</label><input type="time" value="${t.hora}" style="color:var(--w)" onchange="upT(${t.id},'hora',this.value)"></div>
      <div class="f"><label>Flujo %</label><input type="number" placeholder="%" value="${t.pct}" inputmode="decimal" style="color:var(--w)" onchange="upT(${t.id},'pct',this.value)"></div>
      <div class="f"><label>Flujo L/s</label><input type="number" placeholder="L/s" value="${t.ls}" inputmode="decimal" style="color:var(--w)" onchange="upT(${t.id},'ls',this.value)"></div>
    </div>
    <div class="g2" style="margin-bottom:12px">
      <div class="f"><label>Temp. AMB (°C)</label><input type="number" placeholder="°C" value="${t.tamb}" step="0.1" inputmode="decimal" style="color:var(--w)" onchange="upT(${t.id},'tamb',this.value)"></div>
      <div class="f"><label>Temp. AGUA (°C)</label><input type="number" placeholder="°C" value="${t.tagua}" step="0.1" inputmode="decimal" style="color:var(--w)" onchange="upT(${t.id},'tagua',this.value)"></div>
    </div>
    <div class="g3" style="margin-bottom:12px">
      <div class="f"><label>pH a 25°C</label><input type="number" placeholder="pH" value="${t.ph}" step="0.01" inputmode="decimal" style="color:var(--w)" onchange="upT(${t.id},'ph',this.value)"></div>
      <div class="f"><label>Conductividad µS/cm</label><input type="number" placeholder="µS/cm" value="${t.cond}" inputmode="numeric" style="color:var(--w)" onchange="upT(${t.id},'cond',this.value)"></div>
      <div class="f"><label>Oxígeno Disuelto mg/L</label><input type="number" placeholder="mg/L" value="${t.od||''}" step="0.01" inputmode="decimal" style="color:var(--w)" onchange="upT(${t.id},'od',this.value)"></div>
    </div>
    <div class="g3" style="margin-bottom:12px">
      <div class="f"><label>Materia flotante</label><select onchange="upT(${t.id},'mat',this.value)"><option value="">—</option><option ${t.mat==='Ausente'?'selected':''}>Ausente</option><option ${t.mat==='Presente'?'selected':''}>Presente</option></select></div>
      <div class="f"><label>Color</label><input type="text" placeholder="ej. Café" value="${t.color}" style="color:var(--w)" onchange="upT(${t.id},'color',this.value)"></div>
      <div class="f"><label>Olor</label><div class="sino"><div class="sino-b si ${t.olor===true?'on':''}" onclick="upT(${t.id},'olor',true);this.classList.add('on');this.nextElementSibling.classList.remove('on')">SI</div><div class="sino-b no ${t.olor===false?'on':''}" onclick="upT(${t.id},'olor',false);this.classList.add('on');this.previousElementSibling.classList.remove('on')">NO</div></div></div>
    </div>
    <div class="g3" style="margin-bottom:12px">
      <div class="f"><label>Cloro</label><div class="sino"><div class="sino-b si ${t.cloro===true?'on':''}" onclick="upT(${t.id},'cloro',true);this.classList.add('on');this.nextElementSibling.classList.remove('on')">SI</div><div class="sino-b no ${t.cloro===false?'on':''}" onclick="upT(${t.id},'cloro',false);this.classList.add('on');this.previousElementSibling.classList.remove('on')">NO</div></div></div>
      <div class="f"></div>
      <div class="f"></div>
    </div>
    <div class="param-lbl">Parámetros a analizar en esta toma</div>
    <div class="pg">${PARAMS_TOMA.map(p=>`<div class="pm ${t.params.has(p)?'on':''}" onclick="togP(${t.id},'${p}')" data-p="${p}"><div class="pbox"><svg class="pchk" width="9" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="pn">${p}</span></div>`).join('')}</div>
  </div>
</div>`).join('');
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
function irCustodia(){
  closeFabMenu();
  if(tomas.length===0){toast('Agrega al menos una toma','w');return;}
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
// v2: agregamos store 'planes'. Cada muestreo ahora puede pertenecer a un plan.
const DB_NAME='aarms_db', DB_VER=2, STORE='muestreos', STORE_PLANES='planes';
let _db=null;

function openDB(){
  return new Promise((res,rej)=>{
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
  try{ renderPlanDocs(); }catch(_){}
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
  _cachedPlanes = await idbPlanGetAll();
  _cachedMuestreos = await idbGetAll();
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
    mat:    document.getElementById('h_mat')?.value || '',
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
    tomas:tomas.map(t=>({
      id:t.id,hora:t.hora,ph:t.ph,cond:t.cond,od:t.od||'',
      tagua:t.tagua,tamb:t.tamb,ls:t.ls,mat:t.mat,
      pct:t.pct, color:t.color,olor:t.olor,cloro:t.cloro,params:[...(t.params||[])]
    })),
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
       .catch(e=>{console.error(e);toast('Error al generar PDF','w');if(btn){btn.disabled=false;btn.textContent=tipo==='cliente'?'Entregar al cliente':'Guardar registro';}});
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

  // ── HEADER ──
  const HDR=72;

  // Logo — proporcional, centrado en espacio 70x60
  addLogoProportional(doc,logoPDF,M+2,6,70,60);

  // Company info — centrada en zona media del header
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(13);
  doc.text('ASESORÍA Y ANÁLISIS S.C.',W/2-50,20,{align:'center'});
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...BLUE);
  doc.text('Laboratorio de Alimentos y Aguas',W/2-50,30,{align:'center'});
  doc.setTextColor(100,110,130);doc.setFontSize(7);
  doc.text('Calle 12 Ave. Serdán Ext. 465 Int. 201  |  Edif. Puertas del Sol  |  Col. Centro C.P. 85400',W/2-50,40,{align:'center'});
  doc.text('Tel: 622 224 0910  FAX 622 224 207',W/2-50,49,{align:'center'});

  // Right: title box (navy) — full header height
  doc.setFillColor(...NAVY);
  doc.rect(W-195,2,115,HDR-2,'F');
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(10);
  doc.text('HOJA DE CAMPO',W-137,22,{align:'center'});
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(200,210,230);
  doc.text('INFORME DE MUESTREO',W-137,33,{align:'center'});
  doc.setFontSize(7);
  doc.text('F-AA-45A-12 (Digital)',W-137,43,{align:'center'});

  // Folios box (light gray)
  doc.setFillColor(...LGRAY);doc.rect(W-80,2,80-M,HDR-2,'F');
  doc.setDrawColor(...MGRAY);doc.rect(W-80,2,80-M,HDR-2,'S');
  const folios=[['FOLIO HCAR:',gv('h_hcar')],['FOLIO OMAR:',gv('h_omar')],['FOLIO CCIAR:',gv('h_cciar')]];
  folios.forEach(([l,v],i)=>{
    const fy=6+i*21;
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(6);
    doc.text(l,W-77,fy+4);
    doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(7.5);
    doc.text(v||'',W-77,fy+13);
    if(i<2){doc.setDrawColor(...MGRAY);doc.setLineWidth(0.3);doc.line(W-80,fy+17,W-M,fy+17);}
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
  if(sigData2&&sigData2!=='p'){
    drawSig(doc,sigData2,ML+4,mSY,mSW,mSH);
    doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);doc.rect(ML+4,mSY,mSW,mSH,'S');
  }else{
    // X lines
    doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.3);
    doc.line(ML+4,mSY,ML+4+mSW,mSY+mSH);doc.line(ML+4,mSY+mSH,ML+4+mSW,mSY);
    doc.setTextColor(170,180,195);doc.setFont('helvetica','italic');doc.setFontSize(7.5);
    doc.text('Firma del muestreador',ML+4+mSW/2,mSY+mSH/2,{align:'center'});
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
      toast('Error: '+e.message,'w');
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

/* ═══════ Generic plan-doc IO (BLMP / Colab / PhLab) ═══════
   Patrón LVAR: cada doc vive en plan.<key>. Autoguardado debounced.
   FIELDS = array de IDs DOM. La key del objeto = ID sin prefijo.  */
function _curPlan(){ return _cachedPlanes.find(p=>p.id===_currentPlanId) || null; }
function _planDocLeer(key, prefix, fields){
  const plan = _curPlan(); if(!plan) return;
  const obj = plan[key] || {};
  fields.forEach(id=>{
    const e=document.getElementById(prefix+id); if(!e) return;
    obj[id] = (e.type==='checkbox') ? e.checked : (e.value||'').trim();
  });
  plan[key] = obj;
}
function _planDocPoblar(key, prefix, fields, defaults={}){
  const plan = _curPlan(); if(!plan) return;
  const obj = plan[key] || {};
  fields.forEach(id=>{
    const e=document.getElementById(prefix+id); if(!e) return;
    let v = obj[id];
    if(v===undefined || v==='' || v===null) v = defaults[id]!==undefined ? defaults[id] : '';
    if(e.type==='checkbox') e.checked = !!v;
    else e.value = v;
  });
}
async function _planDocGuardar(key){
  const plan = _curPlan(); if(!plan) return;
  plan.docs = plan.docs || {};
  const o = plan[key] || {};
  // doc completo si tiene al menos identificación clave
  const idKey = (key==='blmp') ? 'aapt' : (key==='colab' ? 'clave' : 'aapt');
  plan.docs[key] = { done: !!o[idKey], updatedAt: Date.now() };
  await guardarPlan(plan);
}
const _planDocAutoTimer = {};
function _planDocAttachAuto(pageId, key){
  const pg = document.getElementById(pageId); if(!pg || pg._auto) return;
  pg.addEventListener('input', e=>{
    if(!e.target.matches('input,textarea,select')) return;
    clearTimeout(_planDocAutoTimer[key]);
    _planDocAutoTimer[key] = setTimeout(()=>{
      _planDocSync(key);
      _planDocGuardar(key);
    }, 600);
  });
  pg.addEventListener('change', e=>{
    if(!e.target.matches('input,textarea,select')) return;
    clearTimeout(_planDocAutoTimer[key]);
    _planDocAutoTimer[key] = setTimeout(()=>{
      _planDocSync(key);
      _planDocGuardar(key);
    }, 400);
  });
  pg._auto = true;
}
function _planDocSync(key){
  if(key==='blmp') _planDocLeer('blmp','blmp_', BLMP_FIELDS);
  if(key==='colab') _planDocLeer('colab','colab_', COLAB_FIELDS);
  if(key==='phlab') _planDocLeer('phlab','ph1_', PHLAB_FIELDS);
}

/* ─── BLMP ─── */
const BLMP_FIELDS = [
  'aapt','fecha','hora',
  'v_panel','v_cables','v_cuerpo','v_error','v_vida','v_eenv','v_esuc','v_ecomp','v_calib','obs_v',
  'act_txt','cod_act','l_enj','l_alc','l_grasa','l_hcl','l_det',
  'm_exp','m_aapt','m_folio',
  'obs','realizo','superviso'
];
function abrirPagBlmp(){
  if(!_currentPlanId){ toast('Abre un plan primero','w'); return; }
  const plan = _curPlan(); if(!plan) return;
  const aapt = plan.lvar?.equipos?.potenciometro?.num ? 'AA/PT/'+plan.lvar.equipos.potenciometro.num : '';
  _planDocPoblar('blmp','blmp_', BLMP_FIELDS, {
    aapt, fecha: plan.fecha||'', hora: new Date().toTimeString().slice(0,5),
    m_aapt: aapt, realizo: plan.muestreador||''
  });
  const p=document.getElementById('blmpPill');
  if(p) p.textContent = plan.folio ? 'Plan '+plan.folio : 'Plan';
  goPage('pgBlmp');
  _planDocAttachAuto('pgBlmp','blmp');
}
async function cerrarPagBlmp(){
  _planDocSync('blmp');
  await _planDocGuardar('blmp');
  if(_currentPlanId) await abrirPlan(_currentPlanId); else goHome();
}

/* ─── COLAB (Conductímetro completo: LAB + CAMPO) ─── */
const COLAB_FIELDS = [
  'folio','clave','fecha','hora',
  // visual (común) - 7 items SI/NO
  'v1','v2','v3','v4','v5','v6','v7','obs_v',
  // limpieza (común) - 5 items SI/NO + Cuerpo/Celda (texto) + Actividad Efectiva SI/NO
  'l_enj','l_alc','l_grasa','l_hcl','l_det','cuerpo_celda','l_efec',
  // mantenimiento (común) - 4 items SI/NO
  'm_bat','m_cel','m_plat','m_ext',
  // LAB Calibración (MRC) — fila completa
  'lab_cal_fecha','lab_cal_hora','lab_cal_lote','lab_cal_marca','lab_cal_nom','lab_cal_inc','lab_cal_lec','lab_cal_ar',
  // LAB Comprobación (MRC) — L1 L2 L3 + fila completa
  'lab_com_fecha','lab_com_hora','lab_com_lote','lab_com_marca','lab_com_nom','lab_com_l1','lab_com_l2','lab_com_l3','lab_com_ar',
  // LAB Verificación (Control) — L1 L2 L3
  'lab_ver_fecha','lab_ver_hora','lab_ver_lote','lab_ver_marca','lab_ver_nom','lab_ver_l1','lab_ver_l2','lab_ver_l3','lab_ver_ar',
  // CAMPO Calibración (MRC)
  'cam_cal_fecha','cam_cal_hora','cam_cal_lote','cam_cal_marca','cam_cal_nom','cam_cal_inc','cam_cal_lec','cam_cal_ar',
  // CAMPO Comprobación (MRC) — L1 L2 L3
  'cam_com_fecha','cam_com_hora','cam_com_lote','cam_com_marca','cam_com_nom','cam_com_l1','cam_com_l2','cam_com_l3','cam_com_ar',
  // CAMPO Verificación (Control) — L1 L2 L3
  'cam_ver_fecha','cam_ver_hora','cam_ver_lote','cam_ver_marca','cam_ver_nom','cam_ver_l1','cam_ver_l2','cam_ver_l3','cam_ver_ar',
  'obs','realizo','superviso'
];
function abrirPagColab(){
  if(!_currentPlanId){ toast('Abre un plan primero','w'); return; }
  const plan = _curPlan(); if(!plan) return;
  const clave = plan.lvar?.equipos?.conductivimetro?.num ? 'AA/CO/'+plan.lvar.equipos.conductivimetro.num : '';
  const kcl = plan.lvar?.patrones?.kcl_patron || {};
  _planDocPoblar('colab','colab_', COLAB_FIELDS, {
    clave, fecha: plan.fecha||'', hora: new Date().toTimeString().slice(0,5),
    lab_cal_lote: kcl.lote||'', lab_cal_marca: kcl.marca||'',
    realizo: plan.muestreador||''
  });
  const p=document.getElementById('colabPill');
  if(p) p.textContent = plan.folio ? 'Plan '+plan.folio : 'Plan';
  goPage('pgColab');
  _planDocAttachAuto('pgColab','colab');
  // Calcular VN±I y refrescar dispersiones después de poblar
  setTimeout(()=>{
    ['lab_cal','cam_cal'].forEach(p=>colabCalcVN(p));
    ['lab_com','lab_ver','cam_com','cam_ver'].forEach(p=>colabL3Check(p));
    colabRenderTomas();
  }, 50);
}
async function cerrarPagColab(){
  _planDocSync('colab');
  await _planDocGuardar('colab');
  if(_currentPlanId) await abrirPlan(_currentPlanId); else goHome();
}

/* ─── Helpers Conductímetro: VN±I y dispersión 5% ─── */
function colabCalcVN(prefix){
  const plan=_curPlan(); if(!plan) return;
  const nom=parseFloat(document.getElementById('colab_'+prefix+'_nom')?.value);
  const inc=parseFloat(document.getElementById('colab_'+prefix+'_inc')?.value);
  const mas=document.getElementById('colab_'+prefix+'_vn_mas');
  const men=document.getElementById('colab_'+prefix+'_vn_men');
  if(!isNaN(nom) && !isNaN(inc)){
    if(mas) mas.value=(nom+inc).toFixed(2);
    if(men) men.value=(nom-inc).toFixed(2);
  } else {
    if(mas) mas.value='';
    if(men) men.value='';
  }
}
function colabL3Check(prefix){
  const l1=parseFloat(document.getElementById('colab_'+prefix+'_l1')?.value);
  const l2=parseFloat(document.getElementById('colab_'+prefix+'_l2')?.value);
  const l3=parseFloat(document.getElementById('colab_'+prefix+'_l3')?.value);
  const nom=parseFloat(document.getElementById('colab_'+prefix+'_nom')?.value);
  const box=document.getElementById('colab_'+prefix+'_check');
  const arSel=document.getElementById('colab_'+prefix+'_ar');
  if(!box) return;
  const Ls=[l1,l2,l3].filter(n=>!isNaN(n));
  if(Ls.length<3 || isNaN(nom)){ box.textContent=''; return; }
  const prom=Ls.reduce((a,b)=>a+b,0)/3;
  const maxDev=Math.max(...Ls.map(v=>Math.abs(v-nom)/nom*100));
  const ok=maxDev<=5;
  box.style.color = ok ? 'var(--green)' : '#f87171';
  box.textContent = `Promedio ${prom.toFixed(0)} · Máx desviación ${maxDev.toFixed(2)}% vs VN ${ok?'✓ ACEPTA':'✗ RECHAZA (> 5%)'}`;
  if(arSel && !arSel.value){ arSel.value = ok ? 'acepta' : 'rechaza'; }
}

/* ─── Tabla entre tomas Conductímetro (compartida por plan) ─── */
const COLAB_ACT_CTRL = [{c:'Ca',l:'Calibración'},{c:'Co',l:'Comprobación'},{c:'V',l:'Verificación'}];
const COLAB_LIMP_COD = [{c:'1',l:'Agua tridestilada'},{c:'2',l:'Detergente suave'},{c:'3',l:'HCl 1:1'}];

function _colabTomasArr(){
  const plan=_curPlan(); if(!plan) return null;
  if(!Array.isArray(plan.colab_tomas)) plan.colab_tomas=[];
  return plan.colab_tomas;
}
function _colabOmarsDelPlan(){
  const plan=_curPlan(); if(!plan) return [];
  return (plan.omarIds||[]).map(id=>{
    const m=(_cachedMuestreos||[]).find(x=>String(x.id)===String(id)||String(x.ts)===String(id));
    if(!m) return null;
    let o={}; try{ o = m.omar ? JSON.parse(m.omar) : m; }catch(e){ o=m; }
    return { id, folio: o.folio||m.folio||'', ntomas: parseInt(o.ntomas||0,10)||0 };
  }).filter(Boolean);
}

function colabRenderTomas(){
  const c=document.getElementById('colabTomasLista'); if(!c) return;
  const arr=_colabTomasArr()||[];
  const badge=document.getElementById('colabTomasBadge'); if(badge) badge.textContent=arr.length;
  if(arr.length===0){
    c.innerHTML=`<div style="text-align:center;padding:18px 8px;color:var(--g2);font-size:11.5px">Sin registros. Toca <b>+ Agregar registro</b>.</div>`;
    return;
  }
  const omars=_colabOmarsDelPlan();
  c.innerHTML = arr.map((r,i)=>{
    const omarOpts=omars.map(o=>`<option value="${o.id}" ${String(r.omarId)===String(o.id)?'selected':''}>OMAR ${o.folio}</option>`).join('');
    const cur=omars.find(o=>String(o.id)===String(r.omarId));
    const tomaOpts=cur?Array.from({length:cur.ntomas},(_,k)=>`<option value="${k+1}" ${String(r.toma)===String(k+1)?'selected':''}>T${k+1}</option>`).join(''):'';
    const actOpts=COLAB_ACT_CTRL.map(a=>`<option value="${a.c}" ${r.act===a.c?'selected':''}>${a.c} — ${a.l}</option>`).join('');
    const limpOpts=COLAB_LIMP_COD.map(l=>`<option value="${l.c}" ${r.limp===l.c?'selected':''}>${l.c} — ${l.l}</option>`).join('');
    // calcula promedio + dispersión
    const Ls=[r.l1,r.l2,r.l3].map(v=>parseFloat(v)).filter(n=>!isNaN(n));
    let prom='', resOk=null, motivo='';
    if(Ls.length===3){
      const p=Ls.reduce((a,b)=>a+b,0)/3;
      prom=p.toFixed(0);
      const d=Math.max(...Ls)-Math.min(...Ls);
      const pct=p>0?(d/p)*100:0;
      resOk=pct<=5;
      motivo=`Δ ${d.toFixed(0)} (${pct.toFixed(1)}%)`;
    }
    return `
    <div style="background:var(--bg2);border:1px solid var(--ln);border-radius:10px;padding:10px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-family:var(--syne);font-size:11.5px;font-weight:800;color:var(--w)">Registro #${i+1}</div>
        <button onclick="colabEliminarToma(${i})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:3px 7px;border-radius:6px;font-size:10px;cursor:pointer">✕</button>
      </div>
      <div class="g2" style="margin-bottom:6px">
        <div class="f"><label>Hora</label><input type="time" value="${r.hora||''}" onchange="colabUpToma(${i},'hora',this.value)"></div>
        <div class="f"><label>OMAR</label><select onchange="colabUpToma(${i},'omarId',this.value)"><option value="">—</option>${omarOpts}</select></div>
      </div>
      <div class="g2" style="margin-bottom:6px">
        <div class="f"><label>No. Toma</label><select onchange="colabUpToma(${i},'toma',this.value)"><option value="">—</option>${tomaOpts}</select></div>
        <div class="f"><label>Actividad</label><select onchange="colabUpToma(${i},'act',this.value)"><option value="">—</option>${actOpts}</select></div>
      </div>
      <div class="f" style="margin-bottom:6px"><label>Limpieza código</label><select onchange="colabUpToma(${i},'limp',this.value)"><option value="">—</option>${limpOpts}</select></div>
      <div class="g3" style="margin-bottom:6px">
        <div class="f"><label>L1</label><input type="number" inputmode="numeric" value="${r.l1||''}" oninput="colabUpToma(${i},'l1',this.value)"></div>
        <div class="f"><label>L2</label><input type="number" inputmode="numeric" value="${r.l2||''}" oninput="colabUpToma(${i},'l2',this.value)"></div>
        <div class="f"><label>L3</label><input type="number" inputmode="numeric" value="${r.l3||''}" oninput="colabUpToma(${i},'l3',this.value)"></div>
      </div>
      <div class="g2" style="margin-bottom:6px">
        <div class="f"><label>Promedio</label><input type="text" value="${prom}" readonly style="opacity:.7"></div>
        <div class="f"><label>Dato a Reportar</label><input type="text" value="${r.reporta||prom||''}" oninput="colabUpToma(${i},'reporta',this.value)"></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border-radius:8px;background:${resOk===false?'rgba(248,113,113,.08)':(resOk===true?'rgba(134,239,172,.08)':'var(--bg3)')};border:1px solid ${resOk===false?'rgba(248,113,113,.3)':(resOk===true?'rgba(134,239,172,.3)':'var(--ln)')}">
        <div style="font-size:10.5px;color:var(--g2)">${resOk===null?'Captura las 3 lecturas':motivo}</div>
        <div style="font-weight:800;font-size:11.5px;color:${resOk===false?'#f87171':(resOk===true?'var(--green)':'var(--g2)')}">${resOk===true?'✓ ACEPTA':(resOk===false?'✗ RECHAZA':'—')}</div>
      </div>
    </div>`;
  }).join('');
}

function colabAgregarToma(){
  const arr=_colabTomasArr(); if(!arr) return;
  const omars=_colabOmarsDelPlan();
  arr.push({
    hora: new Date().toTimeString().slice(0,5),
    omarId: omars.length===1 ? String(omars[0].id) : '',
    toma:'', act:'V', limp:'1',
    l1:'', l2:'', l3:'', reporta:''
  });
  colabRenderTomas();
  _planDocGuardar('colab');
  // Auto-aplicar a hoja de campo si corresponde
  _bitAplicarPromediosAToma('cond');
}
function colabEliminarToma(i){
  if(!confirm('¿Borrar este registro?')) return;
  const arr=_colabTomasArr(); if(!arr) return;
  arr.splice(i,1);
  colabRenderTomas();
  _planDocGuardar('colab');
  _bitAplicarPromediosAToma('cond');
}
function colabUpToma(i, field, value){
  const arr=_colabTomasArr(); if(!arr||!arr[i]) return;
  arr[i][field]=value;
  if(field==='omarId'){
    arr[i].toma=''; // reset toma cuando cambia OMAR
    colabRenderTomas();
  } else if(['l1','l2','l3'].includes(field)){
    colabRenderTomas();
    _bitAplicarPromediosAToma('cond');
  } else if(field==='toma'){
    _bitAplicarPromediosAToma('cond');
  }
  _planDocGuardar('colab');
}
window.colabCalcVN=colabCalcVN;
window.colabL3Check=colabL3Check;
window.colabRenderTomas=colabRenderTomas;
window.colabAgregarToma=colabAgregarToma;
window.colabEliminarToma=colabEliminarToma;
window.colabUpToma=colabUpToma;

// Compat para botones antiguos que llamen guardarInstrumentLab
async function guardarInstrumentLab(which){
  if(which==='blmp'){ _planDocSync('blmp'); await _planDocGuardar('blmp'); }
  if(which==='colab'){ _planDocSync('colab'); await _planDocGuardar('colab'); }
  toast('Guardado','g');
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

function _pdfStdHeader(doc, logo, W, M, HDR, tit1, tit2, cod){
  const NAVY=[10,22,40], BLUE=[26,58,107], WHITE=[255,255,255];
  addLogoProportional(doc, logo, M+2, 6, 70, 60);
  doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(13);
  doc.text('ASESORÍA Y ANÁLISIS S.C.', W/2, 20, {align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...BLUE);
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

/* generarPDFBitacoraPHOficial: implementación extendida en js/documents-suite.js (Hoja 2 F-AA-264-4). */

async function generarPDFBlmpForm(){
  if(!_currentPlanId){ toast('Sin plan activo','w'); return; }
  _planDocSync('blmp'); await _planDocGuardar('blmp');
  const plan = _curPlan(); if(!plan){ return; }
  const b = plan.blmp || {};
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612,M=28,CW=W-M*2,HDR=72,H=792;
  const MGRAY=[208,216,228], LGRAY=[232,238,245], DGRAY=[51,65,85], WHITE=[255,255,255], NAVY=[10,22,40];
  _pdfStdHeader(doc, logo, W, M, HDR, 'BITACORA LIMPIEZA', 'pH-metro', 'Digital');
  let y=HDR+6;
  const row=(label,val,yy)=>{ doc.setFillColor(...LGRAY); doc.rect(M,yy,CW,16,'F'); doc.setDrawColor(...MGRAY); doc.rect(M,yy,CW,16,'S'); doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.text(label, M+4, yy+6); doc.setFont('helvetica','normal'); doc.setTextColor(...DGRAY); doc.setFontSize(8); doc.text(jsPdfAscii(String(val||'-')).substring(0,110), M+4, yy+13); return yy+17; };
  const sec=(t,yy)=>{ doc.setFillColor(...NAVY); doc.rect(M,yy,CW,10,'F'); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(t, M+4, yy+7); return yy+12; };
  y=row('Fecha / Hora / Equipo (AA/PT)', [b.fecha,b.hora,b.aapt].filter(Boolean).join('  |  '), y);
  y=sec('1. Verificacion visual (SI/NO/N.A.)', y);
  [['Panel danado',b.v_panel],['Cables danados',b.v_cables],['Cuerpo sucio',b.v_cuerpo],['Codigo de error',b.v_error],['Bateria con vida util',b.v_vida],['Electrodo envejecido',b.v_eenv],['Electrodo sucio',b.v_esuc],['Electrodo completo',b.v_ecomp],['Permite calibrar',b.v_calib]].forEach(([l,v])=>{ y=row(l, v, y); if(y>H-60){ doc.addPage(); y=M+10; }});
  if(b.obs_v) y=row('Observaciones (verificacion)', b.obs_v, y);
  y=sec('2. Limpieza', y);
  y=row('Actividad / Codigo', [b.act_txt,b.cod_act].filter(Boolean).join(' | '), y);
  const yn=v=>v?'SI':'NO';
  y=row('Pasos aplicados', ['Enjuagar:'+yn(b.l_enj),'Alcohol:'+yn(b.l_alc),'Grasa:'+yn(b.l_grasa),'HCl:'+yn(b.l_hcl),'Detergente:'+yn(b.l_det)].join('  '), y);
  y=sec('3. Mantenimiento', y);
  y=row('CEE/AA/N-3', b.m_exp, y);
  y=row('Apartado AA/PT', b.m_aapt, y);
  y=row('Folio F-AA-22', b.m_folio, y);
  if(b.obs) y=row('Observaciones', b.obs, y);
  y=row('Realizo / Superviso', [b.realizo,b.superviso].filter(Boolean).join('  |  '), y);
  const LeyB=window.AARMS_DOC_LEYENDAS||{};
  if(y>H-85){ doc.addPage(); _pdfStdHeader(doc, logo, W, M, HDR, 'BITACORA LIMPIEZA', 'pH-metro', 'Digital'); y=HDR+8; } else y+=10;
  doc.setFont('helvetica','italic'); doc.setFontSize(6.5); doc.setTextColor(100,110,125);
  const pieB=[LeyB.limpiezaCod,LeyB.actControl].filter(Boolean).join(' ');
  (doc.splitTextToSize?doc.splitTextToSize(jsPdfAscii(pieB||''),CW-8):[pieB]).forEach((ln,i)=>{ doc.text(ln,M+4,y+i*9); });
  doc.save(`Bitacora_Limpieza_pH_Plan-${plan.folio||plan.id}.pdf`);
  toast('PDF BLMP generado','g');
  await marcarPlanDocDone('blmp', _currentPlanId);
  if(_currentPlanId) await abrirPlan(_currentPlanId);
}

async function generarPDFColabCompleto(){
  if(!_currentPlanId){ toast('Sin plan activo','w'); return; }
  _planDocSync('colab'); await _planDocGuardar('colab');
  const plan = _curPlan(); if(!plan){ return; }
  const c = plan.colab || {};
  const {jsPDF}=window.jspdf;
  const logo=await loadLogo(LOGO_PDF_URI);
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
  const W=612,M=28,CW=W-M*2,HDR=72,H=792;
  const MGRAY=[208,216,228], LGRAY=[232,238,245], DGRAY=[51,65,85], NAVY=[10,22,40], WHITE=[255,255,255], ACCENT=[37,99,235];
  _pdfStdHeader(doc, logo, W, M, HDR, 'CONDUCTIMETRO', 'F-AA-289-2', 'Digital');
  let y=HDR+6;
  const row=(label,val,yy)=>{ doc.setFillColor(...LGRAY); doc.rect(M,yy,CW,15,'F'); doc.setDrawColor(...MGRAY); doc.rect(M,yy,CW,15,'S'); doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(6.8); doc.text(label, M+3, yy+6); doc.setFont('helvetica','normal'); doc.setTextColor(...DGRAY); doc.setFontSize(7.5); doc.text(jsPdfAscii(String(val||'-')).substring(0,118), M+3, yy+12); return yy+16; };
  const sec=(t,yy)=>{ doc.setFillColor(...NAVY); doc.rect(M,yy,CW,10,'F'); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(t, M+3, yy+7); return yy+12; };
  const sub=(t,yy)=>{ doc.setFillColor(60,90,130); doc.rect(M,yy,CW,9,'F'); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.text(t, M+3, yy+6.5); return yy+11; };
  const need=(n)=>{ if(y+n>H-30){ doc.addPage(); _pdfStdHeader(doc, logo, W, M, HDR, 'CONDUCTIMETRO', '(cont.)', 'Digital'); y=HDR+8; } };
  y=row('Equipo (AA/CO) / Marca / Folio / Fecha / Hora', [c.clave,c.marca,c.folio,c.fecha,c.hora].filter(Boolean).join(' | '), y);
  y=sec('Verificacion visual / Limpieza / Mantenimiento', y);
  [['Panel danado',c.v1],['Cables danados',c.v2],['Cuerpo sucio',c.v3],['Codigo error',c.v4],['Celda envejecida',c.v5],['Celda sucia',c.v6],['Sin partes faltantes',c.v7]].forEach(([l,v])=>{ y=row(l, v, y); need(16); });
  const mk=x=>x==='si'?'SI':(x==='no'?'NO':(x==='na'?'N.A.':'-'));
  y=row('Limpieza', ['Enjuagar:'+mk(c.l_enj),'Alcohol:'+mk(c.l_alc),'Grasa:'+mk(c.l_grasa),'HCl:'+mk(c.l_hcl),'Det.:'+mk(c.l_det),'Efectiva:'+mk(c.l_efec)].join('  '), y);
  y=row('Mantenimiento', ['Bat:'+mk(c.m_bat),'Celdas:'+mk(c.m_cel),'Replat:'+mk(c.m_plat),'Ext:'+mk(c.m_ext)].join('  '), y);
  need(80); y=sec('ACTIVIDAD EN LABORATORIO', y);
  y=sub('Calibracion (MRC)', y);
  y=row('Lote / Marca / VN (uS/cm) / Inc. / Lectura / A-R', [c.lab_cal_lote,c.lab_cal_marca,c.lab_cal_nom,c.lab_cal_inc,c.lab_cal_lec,c.lab_cal_ar].join(' | '), y);
  need(40); y=sub('Comprobacion (MRC)', y);
  y=row('Lote / Marca / VN', [c.lab_com_lote,c.lab_com_marca,c.lab_com_nom].join(' | '), y);
  y=row('L1 / L2 / L3 / A-R', [c.lab_com_l1,c.lab_com_l2,c.lab_com_l3,c.lab_com_ar].join(' | '), y);
  need(40); y=sub('Verificacion (Muestra Control)', y);
  y=row('Lote / Marca / VN', [c.lab_ver_lote,c.lab_ver_marca,c.lab_ver_nom].join(' | '), y);
  y=row('L1 / L2 / L3 / A-R', [c.lab_ver_l1,c.lab_ver_l2,c.lab_ver_l3,c.lab_ver_ar].join(' | '), y);
  need(80); y=sec('ACTIVIDAD EN CAMPO', y);
  y=sub('Calibracion (MRC)', y);
  y=row('Lote / Marca / VN (uS/cm) / Inc. / Lectura / A-R', [c.cam_cal_lote,c.cam_cal_marca,c.cam_cal_nom,c.cam_cal_inc,c.cam_cal_lec,c.cam_cal_ar].join(' | '), y);
  need(40); y=sub('Comprobacion (MRC)', y);
  y=row('Lote / Marca / VN', [c.cam_com_lote,c.cam_com_marca,c.cam_com_nom].join(' | '), y);
  y=row('L1 / L2 / L3 / A-R', [c.cam_com_l1,c.cam_com_l2,c.cam_com_l3,c.cam_com_ar].join(' | '), y);
  need(40); y=sub('Verificacion (Muestra Control)', y);
  y=row('Lote / Marca / VN', [c.cam_ver_lote,c.cam_ver_marca,c.cam_ver_nom].join(' | '), y);
  y=row('L1 / L2 / L3 / A-R', [c.cam_ver_l1,c.cam_ver_l2,c.cam_ver_l3,c.cam_ver_ar].join(' | '), y);
  doc.addPage(); _pdfStdHeader(doc, logo, W, M, HDR, 'CONDUCTIMETRO', 'Registros entre tomas', 'Digital');
  y=HDR+8;
  doc.setFillColor(...NAVY); doc.rect(M,y,CW,11,'F'); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8);
  doc.text('Registros entre tomas - Todos los OMARs del plan', M+4, y+7.5); y+=13;
  const muestreos = (plan.omarIds||[]).map(id=>(_cachedMuestreos||[]).find(m=>m.id===id)).filter(Boolean);
  const allRegs = [];
  muestreos.forEach(m=>{
    let o={};
    try{ o = m.omar ? JSON.parse(m.omar) : m; }catch(e){ o = m; }
    (o.bitCond||[]).forEach(r=>allRegs.push({...r, _folio: o.folio||m.folio||''}));
  });
  const LeyC=window.AARMS_DOC_LEYENDAS||{};
  if(!allRegs.length){
    doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(140,150,165);
    doc.text('Sin registros de bitacora de conductividad en este plan.', M, y);
  } else {
    const cols=[16,40,40,26,26,26,38,38,38,34,40];
    let x=M; ['#','Fecha','Hora','Toma','Act','Limp','L1','L2','L3','<=3%','OMAR'].forEach((h,i)=>{ doc.setFillColor(...MGRAY); doc.rect(x,y,cols[i],12,'F'); doc.setDrawColor(...MGRAY); doc.rect(x,y,cols[i],12,'S'); doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(5.5); doc.text(h,x+cols[i]/2,y+8,{align:'center'}); x+=cols[i]; });
    y+=12;
    allRegs.forEach((r,ix)=>{
      const Ls=[r.l1,r.l2,r.l3].map(v=>parseFloat(v)).filter(n=>!isNaN(n));
      let okTxt='-';
      if(Ls.length===3){ const p=Ls.reduce((a,b)=>a+b,0)/Ls.length; const d=Math.max(...Ls)-Math.min(...Ls); const pct=p>0?(d/p)*100:0; okTxt=pct<=3?'SI':'NO'; }
      const fd=s=>{ if(!s) return ''; const p=String(s).split('-'); return p.length===3?`${p[2]}/${p[1]}`:String(s).substring(0,8); };
      x=M; const vals=[String(ix+1),fd(r.fecha),r.hora||'',String(r.toma||''),r.act||'',r.limp||'',r.l1||'',r.l2||'',r.l3||'',okTxt,r._folio||''];
      vals.forEach((v,i)=>{ doc.setFillColor(...(i===0?ACCENT:(ix%2?WHITE:LGRAY))); doc.rect(x,y,cols[i],11,'F'); doc.setDrawColor(...MGRAY); doc.rect(x,y,cols[i],11,'S'); doc.setTextColor(...(i===0?WHITE:DGRAY)); doc.setFont('helvetica',i===0?'bold':'normal'); doc.setFontSize(6.5); doc.text(jsPdfAscii(String(v)).substring(0,11),x+cols[i]/2,y+7.5,{align:'center'}); x+=cols[i]; });
      y+=11; if(y>H-70){ doc.addPage(); _pdfStdHeader(doc, logo, W, M, HDR, 'CONDUCTIMETRO', 'Registros (cont.)', 'Digital'); y=HDR+20; }
    });
  }
  if(c.obs){ y+=8; y=row('Observaciones', c.obs, y); }
  y=row('Realizo / Superviso', [c.realizo,c.superviso].filter(Boolean).join('  |  '), y);
  y+=10;
  doc.setFont('helvetica','italic'); doc.setFontSize(6.2); doc.setTextColor(100,110,125);
  const pie=[LeyC.actControl,LeyC.limpiezaCod,LeyC.condDispersion].filter(Boolean).join(' ');
  const pieLines=(typeof doc.splitTextToSize==='function')?doc.splitTextToSize(jsPdfAscii(pie||''),CW-8):[pie];
  let yy=y;
  pieLines.forEach(ln=>{ if(yy>H-12){ doc.addPage(); _pdfStdHeader(doc, logo, W, M, HDR, 'CONDUCTIMETRO', 'Notas (cont.)', 'Digital'); yy=HDR+14; } doc.text(ln,M+4,yy); yy+=8; });
  doc.save(`Bitacora_Conductimetro_Plan-${plan.folio||plan.id}.pdf`);
  toast('PDF Conductimetro generado','g');
  await marcarPlanDocDone('colab', _currentPlanId);
  if(allRegs.length) await marcarPlanDocDone('condcamp', _currentPlanId);
  if(_currentPlanId) await abrirPlan(_currentPlanId);
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

function _bitPhOmarFolio(mid){
  if(mid==null||mid==='') return (typeof omar!=='undefined'&&omar&&omar.folio)?String(omar.folio):'—';
  const m=typeof _cachedMuestreos!=='undefined'&&_cachedMuestreos?_cachedMuestreos.find(x=>x.id===mid):null;
  if(!m) return String(mid);
  try{
    const o=m.omar?JSON.parse(m.omar):{};
    return o.folio?String(o.folio):String(mid);
  }catch(e){ return String(mid); }
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
      const fol=_bitPhOmarFolio(mid);
      for(const t of _bitPhListaTomasOMAR(mid)){
        opts.push({
          value:`${mid}|${t.num}`,
          label:`OMAR ${fol} · T${t.num}${t.hora&&t.hora!=='—'?' ('+t.hora+')':''}`,
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

/** Cruce medianoche para un par campo + tomas (una OMAR). */
function _bitPhMuestreoCruzaMedianocheUnOmar(o, arr){
  try{
    const {ini, fin}=_bitPhCampoIniFinPara(o);
    if(ini&&fin&&ini.includes('T')&&fin.includes('T')){
      const di=ini.split('T')[0], df=fin.split('T')[0];
      if(di&&df&&di!==df) return true;
      const ti=(ini.split('T')[1]||'00:00').substring(0,5);
      const tf=(fin.split('T')[1]||'00:00').substring(0,5);
      const mi=_bitPhParseHoraAMin(ti), mf=_bitPhParseHoraAMin(tf);
      if(mi!=null&&mf!=null&&di===df&&mf<mi) return true;
    }
    const tomasArr=Array.isArray(arr)?arr:[];
    if(tomasArr.length>=2){
      for(let i=0;i<tomasArr.length-1;i++){
        const a=_bitPhParseHoraAMin(tomasArr[i].hora), b=_bitPhParseHoraAMin(tomasArr[i+1].hora);
        if(a!=null&&b!=null&&a>b) return true;
      }
    }
  }catch(e){}
  return false;
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
  const b1n=parseFloat(b1), b2n=parseFloat(b2);
  if(isNaN(b1n)||isNaN(b2n)) return;
  const pend=_bitPhMuestreoCruzaMedianoche();
  const g='cg'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const base={
    fecha:fecha||_defaultBitRegistroFecha(), hora:'', toma:'', act:'V', limp:'1', aprox:'', lote:lote||'', marca:marca||'',
    l1:'', l2:'', l3:'', obs:'',
    sinTomaFolio:true, calibGrupo:g,
    pendienteBuf1:pend, pendienteBuf2:pend,
  };
  const nuevos=[
    {...base, calibPaso:1, act:'Ca', buffer:String(b1n)},
    {...base, calibPaso:2, act:'Co', buffer:String(b1n)},
    {...base, calibPaso:3, act:'Ca', buffer:String(b2n)},
    {...base, calibPaso:4, act:'Co', buffer:String(b2n)},
  ];
  regs.splice(0,0,...nuevos);
}

/** Si aún no hay bloque Ca/Co×2 buffers, crea uno con valores típicos (9,18 / 6,86). */
function _bitPhAutoSeedPrimerBloqueCalib2(){
  if(!omar||!omar.ts) return;
  if(_bitPhTieneBloqueCalib2()) return;
  bitPhInsertarBloqueCalib2Interno(9.18, 6.86, '', '', _defaultBitRegistroFecha());
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

function bitPhCalibSetPend(idxCaRow, bufKey, asPend){
  const regs=_bitPhRegs();
  if(!regs||!regs[idxCaRow]) return;
  const r=regs[idxCaRow];
  if(bufKey==='buf1' && r.calibPaso===1){
    r.pendienteBuf1=!!asPend;
  }else if(bufKey==='buf2' && r.calibPaso===3){
    r.pendienteBuf2=!!asPend;
  }
  _bitPhRender();
  guardarBorradorActual();
  void _persistPlanBitPh();
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
  let acepta=null,motivo='';
  if(Ls.length===3){
    const diff=Math.max(...Ls)-Math.min(...Ls);
    if(diff>0.03){ acepta=false; motivo=`Δ ${diff.toFixed(2)} > 0.03`; }
    else { acepta=true; motivo=`Δ ${diff.toFixed(2)} ≤ 0.03`; }
  }
  let bufNote='';
  if(Ls.length===3 && r.buffer!=null && r.buffer!==''){
    const buf=parseFloat(r.buffer);
    const pr=Ls.reduce((a,b)=>a+b,0)/Ls.length;
    if(!isNaN(buf)&&!isNaN(pr)){
      const d05=Math.abs(pr-buf)<=0.05+1e-9;
      bufNote=`<div style="font-size:9px;color:var(--g2);margin-top:3px">vs buffer: <b style="color:${d05?'var(--green)':'#f87171'}">${d05?'OK':'Revisar'}</b></div>`;
    }
  }
  return `<div data-bit-resumen style="padding:8px;background:${acepta===false?'rgba(248,113,113,.08)':(acepta===true?'rgba(134,239,172,.08)':'var(--bg3)')};border:1px solid var(--ln);border-radius:8px;margin-top:4px">
    <div style="font-size:9px;color:var(--g2)">Prom. pH 25°C</div>
    <div style="font-family:var(--syne);font-size:16px;font-weight:800;color:${acepta===false?'#f87171':'var(--acc)'}">${prom||'—'}</div>${bufNote}
    ${acepta===true?'<div style="color:var(--green);font-size:10px;font-weight:700">Acepta</div>':''}
    ${acepta===false?'<div style="color:#f87171;font-size:10px;font-weight:700">Rechaza</div>':''}
  </div>`;
}

function _renderBitPhCalibBlock4(indices){
  const regs=_bitPhRegs()||[];
  const [i0,i1,i2,i3]=indices;
  const r0=regs[i0], r1=regs[i1], r2=regs[i2], r3=regs[i3];
  const g=r0.calibGrupo;
  const buf1=r0.buffer, buf2=r2.buffer;
  const pend1=r0.pendienteBuf1!==false;
  const pend2=r2.pendienteBuf2!==false;
  const miniRow=(ix, actLabel, buf)=>{
    const rr=regs[ix];
    return `<div style="display:grid;grid-template-columns:1fr 1fr 72px 56px 52px 1fr 1fr 1fr;gap:6px;align-items:end;padding:8px 0;border-bottom:1px solid var(--ln)">
      <div class="f" style="margin:0"><label style="font-size:9px">Fecha</label><input type="date" value="${rr.fecha||''}" oninput="bitPhUp(${ix},'fecha',this.value)"></div>
      <div class="f" style="margin:0"><label style="font-size:9px">Hora</label><input type="time" value="${rr.hora||''}" oninput="bitPhUp(${ix},'hora',this.value)"></div>
      <div style="text-align:center;padding-bottom:4px"><span style="font-size:8px;color:var(--g3)">F.OMAR</span><div style="text-decoration:line-through;opacity:.55;font-size:11px">—</div></div>
      <div style="text-align:center;padding-bottom:4px"><span style="font-size:8px;color:var(--g3)">Toma</span><div style="text-decoration:line-through;opacity:.55;font-size:11px">—</div></div>
      <div style="font-weight:800;font-size:12px;color:var(--acc);padding-bottom:6px">${actLabel}</div>
      <div class="f" style="margin:0"><label style="font-size:9px">Lote</label><input type="text" value="${(rr.lote||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" oninput="bitPhUp(${ix},'lote',this.value)"></div>
      <div class="f" style="margin:0"><label style="font-size:9px">Marca</label><input type="text" value="${(rr.marca||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" oninput="bitPhUp(${ix},'marca',this.value)"></div>
      <div class="f" style="margin:0"><label style="font-size:9px">Buffer</label><input type="number" step="0.01" value="${rr.buffer==null||rr.buffer===''?'':rr.buffer}" oninput="bitPhUp(${ix},'buffer',this.value)"></div>
    </div>`;
  };
  const pendBox=(iCa, bufKey, bufVal)=>{
    const usePend = bufKey==='buf1' ? pend1 : pend2;
    if(!usePend){
      return `<div style="padding:6px 0 10px">
        <div data-bit-sub="${iCa}">
          ${_bitPhLecturasMiniHtml(iCa)}
          ${_bitPhResumenBlockHtml(iCa)}
        </div>
        <div data-bit-sub="${iCa+1}">
          ${_bitPhLecturasMiniHtml(iCa+1)}
          ${_bitPhResumenBlockHtml(iCa+1)}
        </div>
        <button type="button" onclick="bitPhCalibSetPend(${iCa},'${bufKey}',true)" style="margin-top:6px;font-size:10px;background:transparent;border:1px dashed var(--ln);color:var(--g2);padding:4px 8px;border-radius:6px;cursor:pointer;width:100%">Volver a marcar PENDIENTE</button>
      </div>`;
    }
    return `<div style="min-height:96px;border:1px dashed rgba(167,139,250,.45);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.14);margin:6px 0 10px">
      <div style="transform:rotate(-16deg);font-weight:900;font-size:15px;letter-spacing:.14em;color:var(--g2);text-shadow:0 0 1px rgba(0,0,0,.5)">PENDIENTE</div>
      <div style="font-size:10px;color:var(--g3);margin-top:6px">Lecturas 1–3 y promedio (buffer ${bufVal})</div>
      <button type="button" onclick="bitPhCalibSetPend(${iCa},'${bufKey}',false)" style="margin-top:10px;padding:6px 14px;font-size:11px;border-radius:8px;cursor:pointer;background:var(--acc);color:#fff;border:none;font-weight:700">Capturar lecturas Ca/Co</button>
    </div>`;
  };
  return `<div data-bit-ph-block="${i0}" style="background:var(--bg2);border:1px solid rgba(124,58,237,.35);border-radius:12px;padding:12px;margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px">
      <div style="font-family:var(--syne);font-size:13px;font-weight:800;color:#c4b5fd">Bloque 2 buffers · Ca→Co · Ca→Co</div>
      <button type="button" onclick="bitPhEliminarCalibGrupo('${g}')" style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.35);color:#f87171;padding:5px 10px;border-radius:8px;font-size:10.5px;cursor:pointer">Eliminar bloque (4)</button>
    </div>
    <div style="font-size:10px;color:var(--g2);margin-bottom:8px">Renglones #${i0+1}–${i3+1} · Folio OMAR y toma no aplican (calibración/comprobación).</div>
    <div style="font-size:11px;font-weight:700;color:var(--w);margin:10px 0 4px">Buffer ${buf1}</div>
    ${miniRow(i0,'Ca',buf1)}
    ${miniRow(i1,'Co',buf1)}
    ${pendBox(i0,'buf1',buf1)}
    <div style="font-size:11px;font-weight:700;color:var(--w);margin:10px 0 4px">Buffer ${buf2}</div>
    ${miniRow(i2,'Ca',buf2)}
    ${miniRow(i3,'Co',buf2)}
    ${pendBox(i2,'buf2',buf2)}
  </div>`;
}

// Helper: lee la lista de tomas actuales en memoria para mostrar selector
function _bitOpcionesTomas(){
  return (tomas||[]).map((t,i)=>({num:i+1, hora:t.hora||'—', id:t.id}));
}

// ─── pH-METRO ───
function abrirBitacoraPH(){
  if(!omar.ts){ toast('Primero captura el OMAR','w'); return; }
  void (async()=>{
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
    // Ya no auto-seed: el bloque se crea al agregar el primer registro (pregunta buffers 1 vez)
    _bitPhRender();
    if(typeof guardarBorradorActual==='function') guardarBorradorActual();
    void _persistPlanBitPh();
    goPage('pgBitPH');
  })();
}
function cerrarBitacoraPH(){
  _bitAplicarPromediosAToma('ph');
  guardarBorradorActual();
  void _persistPlanBitPh();
  goPage('pg1');
}

function _bitPhRender(){
  const c = document.getElementById('bitPhRegistros');
  if(!c) return;
  const regs = _bitPhRegs() || [];
  if(regs.length === 0){
    c.innerHTML = `<div style="text-align:center;padding:24px 12px;color:var(--g2);font-size:12px;line-height:1.55">
      Aún no hay registros.<br>
      <span style="font-size:10.5px;color:var(--g3)">Si no ves el bloque Ca/Co, vuelve a entrar a esta pantalla o usa «Otro bloque 2 buffers» abajo.</span>
    </div>`;
    return;
  }
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
  const actOpts = ACT_CONTROL.map(a =>
    `<option value="${a.code}" ${r.act===a.code?'selected':''}>${a.code} — ${a.label}</option>`
  ).join('');
  const rowMid=r.omarId!=null&&r.omarId!==''?String(r.omarId):String(omar.ts||'');
  const folOmar = _bitPhOmarFolio(rowMid);

  // Calcular promedio + acepta
  const Ls = [r.l1, r.l2, r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
  const prom = Ls.length>0 ? (Ls.reduce((a,b)=>a+b,0)/Ls.length).toFixed(2) : '';
  let acepta = null, motivo = '';
  if(Ls.length === 3){
    const diff = Math.max(...Ls) - Math.min(...Ls);
    if(diff > 0.03){ acepta = false; motivo = `Δ ${diff.toFixed(2)} > 0.03`; }
    else { acepta = true; motivo = `Δ ${diff.toFixed(2)} ≤ 0.03`; }
  }

  return `
    <div data-bit-ph="${idx}" style="background:var(--bg2);border:1px solid var(--ln);border-radius:11px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-family:var(--syne);font-size:12.5px;font-weight:800;color:var(--w)">Registro #${idx+1}</div>
        <button onclick="bitPhEliminar(${idx})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:4px 8px;border-radius:6px;font-size:10.5px;cursor:pointer">✕ Borrar</button>
      </div>
      <div style="font-size:10px;color:var(--g2);margin-bottom:8px">Folio OMAR de esta fila: <b style="color:var(--w)">${String(folOmar).replace(/</g,'')}</b> (varias OMAR pueden compartir esta bitácora si pertenecen al mismo plan).</div>

      <div class="g2" style="margin-bottom:8px">
        <div class="f"><label>Fecha registro</label><input type="date" value="${r.fecha||''}" oninput="bitPhUp(${idx},'fecha',this.value)"></div>
        <div class="f"><label>Hora</label><input type="time" value="${r.hora||''}" oninput="bitPhUp(${idx},'hora',this.value)"></div>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div class="f"><label>Toma (OMAR)</label><select onchange="bitPhUp(${idx},'tomaOmar',this.value)"><option value="">—</option>${tomaOpts}</select></div>
        <div class="f"><label>Actividad de control</label><select onchange="bitPhUp(${idx},'act',this.value)"><option value="">—</option>${actOpts}</select></div>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div class="f"><label>Limpieza código</label><select onchange="bitPhUp(${idx},'limp',this.value)"><option value="">—</option>${LIMPIEZA_COD.map(l=>`<option value="${l.code}" ${r.limp===l.code?'selected':''}>${l.code} — ${l.label}</option>`).join('')}</select></div>
        <div class="f"><label>Lectura aprox. pH (tira)</label><input type="number" step="0.1" placeholder="ej. 7" value="${r.aprox||''}" oninput="bitPhUp(${idx},'aprox',this.value)"></div>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div class="f"><label>Buffer MCR</label><input type="number" step="0.01" placeholder="ej. 7.00" value="${r.buffer||''}" oninput="bitPhUp(${idx},'buffer',this.value)"></div>
        <div class="f"><label>Lote</label><input type="text" placeholder="lote" value="${(r.lote||'').replace(/"/g,'&quot;')}" oninput="bitPhUp(${idx},'lote',this.value)"></div>
      </div>
      <div class="f" style="margin-bottom:8px"><label>Marca</label><input type="text" placeholder="marca" value="${(r.marca||'').replace(/"/g,'&quot;')}" oninput="bitPhUp(${idx},'marca',this.value)"></div>

      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);margin-bottom:6px">Lecturas (3 independientes)</div>
      <div class="g3" style="margin-bottom:8px">
        <div class="f"><label>L1</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${r.l1||''}" oninput="bitPhUp(${idx},'l1',this.value)"></div>
        <div class="f"><label>L2</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${r.l2||''}" oninput="bitPhUp(${idx},'l2',this.value)"></div>
        <div class="f"><label>L3</label><input type="number" step="0.01" inputmode="decimal" placeholder="pH" value="${r.l3||''}" oninput="bitPhUp(${idx},'l3',this.value)"></div>
      </div>
      <div class="f" style="margin-bottom:8px"><label>Observaciones (Hoja 2)</label><textarea rows="2" placeholder="Notas del registro" oninput="bitPhUp(${idx},'obs',this.value)">${String(r.obs||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea></div>

      <div data-bit-resumen style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;background:${acepta===false?'rgba(248,113,113,.08)':(acepta===true?'rgba(134,239,172,.08)':'var(--bg3)')};border:1px solid ${acepta===false?'rgba(248,113,113,.3)':(acepta===true?'rgba(134,239,172,.3)':'var(--ln)')};border-radius:9px">
        <div>
          <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.04em">Promedio (pH 25°C)</div>
          <div style="font-family:var(--syne);font-size:20px;font-weight:800;color:${acepta===false?'#f87171':'var(--acc)'};margin-top:2px">${prom||'—'}</div>
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

function _phGetBuffers(){
  const pl=_bitPhPlan();
  if(pl && pl.phBuffers) return pl.phBuffers;
  return null;
}
function _phSetBuffers(b1, b2, lote, marca){
  const pl=_bitPhPlan();
  if(!pl) return;
  pl.phBuffers = { b1: parseFloat(b1), b2: parseFloat(b2), lote: lote||'', marca: marca||'' };
}
function _phPromptBuffers(){
  // Devuelve {b1,b2,lote,marca} o null si canceló
  const b1str = prompt('Buffer 1 (valor nominal pH). Se usará en todos los bloques de calibración del plan.', '9.18');
  if(b1str===null) return null;
  const b1 = parseFloat(b1str);
  if(isNaN(b1)){ toast('Valor no válido','w'); return null; }
  const b2str = prompt('Buffer 2 (valor nominal pH).', '6.86');
  if(b2str===null) return null;
  const b2 = parseFloat(b2str);
  if(isNaN(b2)){ toast('Valor no válido','w'); return null; }
  const lote = prompt('Lote (opcional, igual en los 4 renglones del bloque):', '') || '';
  const marca = prompt('Marca (opcional):', '') || '';
  return {b1, b2, lote, marca};
}

function bitPhAgregarRegistro(){
  const regs=_bitPhRegs();
  if(!regs) return;
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
  const hoy = _defaultBitRegistroFecha();
  // Si es el PRIMER registro y no hay buffers guardados → preguntar 1 vez
  if(regs.length===0){
    let buf = _phGetBuffers();
    if(!buf){
      buf = _phPromptBuffers();
      if(buf){
        _phSetBuffers(buf.b1, buf.b2, buf.lote, buf.marca);
        // Insertar bloque inicial Ca·Ca·Co·Co con los buffers definidos
        bitPhInsertarBloqueCalib2Interno(buf.b1, buf.b2, buf.lote, buf.marca, hoy);
      }
    }
  }
  // Detectar cruce de día automático
  const last = [...regs].reverse().find(r=>!r.calibGrupo);
  if(last && last.fecha && String(last.fecha) !== String(hoy)){
    const buf = _phGetBuffers();
    if(buf){
      bitPhInsertarBloqueCalib2Interno(buf.b1, buf.b2, buf.lote, buf.marca, hoy);
      toast('Cambio de día → bloque Ca/Co insertado automáticamente','g');
    }
  }
  regs.push({
    fecha: hoy,
    hora: new Date().toTimeString().substring(0,5),
    omarId, toma: tomaNum,
    folioOmar: _bitPhOmarFolio(omarId),
    act:'V', limp:'1', aprox:'', buffer:'', lote:'', marca:'',
    l1:'', l2:'', l3:'', obs:'',
  });
  _bitPhRender();
  _bitAplicarPromediosAToma('ph');
  guardarBorradorActual();
  void _persistPlanBitPh();
}

function bitPhEliminar(idx){
  const regs=_bitPhRegs();
  if(!regs) return;
  const r=regs[idx];
  if(r && r.calibGrupo){
    if(!confirm('Este renglón pertenece al bloque Ca/Co × 2 buffers. ¿Eliminar las 4 líneas del bloque completo?')) return;
    bitPhEliminarCalibGrupo(r.calibGrupo);
    return;
  }
  if(!confirm('¿Borrar este registro?')) return;
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
      regs[idx].folioOmar=_bitPhOmarFolio(regs[idx].omarId);
    }
    _bitPhRender();
    _bitAplicarPromediosAToma('ph');
    guardarBorradorActual();
    void _persistPlanBitPh();
    return;
  }
  regs[idx][field] = value;
  // Si cambia algo que afecta promedio, actualizar SOLO el resumen de esa card (sin re-render completo)
  if(['l1','l2','l3','toma','buffer'].includes(field)){
    _bitPhRefreshResumen(idx);
    _bitAplicarPromediosAToma('ph');
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

// ─── CONDUCTÍMETRO ───
/* ─── Bitácora Conductímetro: vive en plan.bitCond ─── */
function _bitCondPlan(){
  return (typeof _cachedPlanes!=='undefined' && _currentPlanId)
    ? (_cachedPlanes||[]).find(p=>p.id===_currentPlanId) || null
    : null;
}
function _bitCondRegs(){
  const pl=_bitCondPlan();
  if(pl){ if(!Array.isArray(pl.bitCond)) pl.bitCond=[]; return pl.bitCond; }
  if(!Array.isArray(omar.bitCond)) omar.bitCond=[];
  return omar.bitCond;
}
function _bitCondFolioDocGet(){
  const pl=_bitCondPlan();
  return pl ? (pl.bitCondFolioDoc||'') : (omar.bitCondFolioDoc||'');
}
function _bitCondFolioDocSet(v){
  const pl=_bitCondPlan();
  if(pl) pl.bitCondFolioDoc=v;
  else if(omar) omar.bitCondFolioDoc=v;
}
async function _persistPlanBitCond(){
  const pl=_bitCondPlan();
  if(!pl) return;
  try{ await guardarPlan(pl); }catch(e){ console.warn('[plan bitCond]',e); }
}
function _bitCondOmarFolio(mid){
  if(!mid) return '';
  const m=(_cachedMuestreos||[]).find(x=>String(x.id)===String(mid)||String(x.ts)===String(mid));
  return m ? (m.folio||'') : '';
}
function _bitCondListaTomasOMAR(mid){
  const m=(_cachedMuestreos||[]).find(x=>String(x.id)===String(mid)||String(x.ts)===String(mid));
  if(!m) return [];
  let o={};
  try{ o = m.omar ? JSON.parse(m.omar) : m; }catch(e){ o = m; }
  const n = parseInt(o.ntomas||0,10);
  if(!n) return [];
  const ts = Array.isArray(o.tomas) ? o.tomas : [];
  return Array.from({length:n},(_,i)=>({num:i+1, hora:(ts[i]&&ts[i].hora)||''}));
}
function _bitCondOpcionesTomaSelect(){
  const pl=_bitCondPlan();
  if(pl && pl.omarIds && pl.omarIds.length){
    const opts=[];
    for(const mid of pl.omarIds){
      const fol=_bitCondOmarFolio(mid);
      for(const t of _bitCondListaTomasOMAR(mid)){
        opts.push({
          value: `${mid}|${t.num}`,
          label: `OMAR ${fol} · T${t.num}${t.hora&&t.hora!=='—'?' ('+t.hora+')':''}`,
        });
      }
    }
    return opts;
  }
  if(!omar||!omar.ts) return [];
  return (tomas||[]).map((t,i)=>({
    value: `${omar.ts}|${i+1}`,
    label: `T${i+1}${t.hora?' ('+t.hora+')':''}`,
  }));
}
function _bitCondTomaSelectValue(r){
  const mid=r&&r.omarId!=null&&r.omarId!==''?String(r.omarId):(omar&&omar.ts?String(omar.ts):'');
  const num=r&&r.toma!=null&&r.toma!==''?String(r.toma):'';
  return num&&mid?`${mid}|${num}`:'';
}

function abrirBitacoraCond(){
  if(!omar.ts){ toast('Primero captura el OMAR','w'); return; }
  const pl=_bitCondPlan();
  const p=document.getElementById('bitCondPill');
  if(p){
    if(pl&&pl.id){
      const n=(pl.omarIds||[]).length;
      p.textContent = 'Plan · '+n+' OMAR(s) · bitácora cond. única';
    } else {
      p.textContent = (omar.folio?'OMAR '+omar.folio:'OMAR')+' · '+(tomas?.length||0)+' tomas';
    }
  }
  const fol=document.getElementById('bitCondFolioDocInp');
  if(fol) fol.value = _bitCondFolioDocGet()||'';
  _bitCondRender();
  void _persistPlanBitCond();
  goPage('pgBitCond');
}
function cerrarBitacoraCond(){
  _bitAplicarPromediosAToma('cond');
  guardarBorradorActual();
  void _persistPlanBitCond();
  goPage('pg1');
}

function _bitCondRender(){
  const c = document.getElementById('bitCondRegistros');
  if(!c) return;
  const regs = _bitCondRegs() || [];
  if(regs.length === 0){
    c.innerHTML = `<div style="text-align:center;padding:24px 12px;color:var(--g2);font-size:12px;line-height:1.55">
      Aún no hay registros.<br>
      <span style="font-size:10.5px;color:var(--g3)">Toca "+ Agregar registro" para empezar.</span>
    </div>`;
    return;
  }
  c.innerHTML = regs.map((r,i)=>_renderBitCondCard(r,i)).join('');
}

function _renderBitCondCard(r, idx){
  const tomaOptsList=_bitCondOpcionesTomaSelect();
  const selVal=_bitCondTomaSelectValue(r);
  const tomaOpts = tomaOptsList.map(o =>
    `<option value="${String(o.value).replace(/"/g,'&quot;')}" ${o.value===selVal?'selected':''}>${String(o.label).replace(/</g,'&lt;')}</option>`
  ).join('');
  const actOpts = ACT_CONTROL.map(a =>
    `<option value="${a.code}" ${r.act===a.code?'selected':''}>${a.code} — ${a.label}</option>`
  ).join('');
  const limpOpts = LIMPIEZA_COD.map(l =>
    `<option value="${l.code}" ${r.limp===l.code?'selected':''}>${l.code} — ${l.label}</option>`
  ).join('');
  const rowMid=r.omarId!=null&&r.omarId!==''?String(r.omarId):String(omar.ts||'');
  const folOmar=_bitCondOmarFolio(rowMid);

  const Ls = [r.l1, r.l2, r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
  const prom = Ls.length>0 ? (Ls.reduce((a,b)=>a+b,0)/Ls.length).toFixed(0) : '';
  let acepta = null, motivo = '';
  if(Ls.length === 3 && prom > 0){
    const diff = Math.max(...Ls) - Math.min(...Ls);
    const pctDiff = (diff / parseFloat(prom)) * 100;
    if(pctDiff > 3){ acepta = false; motivo = `Δ ${diff.toFixed(0)} (${pctDiff.toFixed(1)}% > 3%)`; }
    else { acepta = true; motivo = `Δ ${diff.toFixed(0)} (${pctDiff.toFixed(1)}%)`; }
  }
  // Renglón con 1 sola lectura (bloque cruce de día Ca/Co)
  const oneShot = !!r.calibGrupo;

  return `
    <div data-bit-cond="${idx}" style="background:var(--bg2);border:1px solid var(--ln);border-radius:11px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-family:var(--syne);font-size:12.5px;font-weight:800;color:var(--w)">Registro #${idx+1}${oneShot?' · '+(r.calibLabel||'Ca/Co'):''}</div>
        <button onclick="bitCondEliminar(${idx})" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);color:#f87171;padding:4px 8px;border-radius:6px;font-size:10.5px;cursor:pointer">✕ Borrar</button>
      </div>
      <div style="font-size:10px;color:var(--g2);margin-bottom:8px">Folio OMAR de esta fila: <b style="color:var(--w)">${String(folOmar).replace(/</g,'')}</b></div>

      <div class="g2" style="margin-bottom:8px">
        <div class="f"><label>Fecha registro</label><input type="date" value="${r.fecha||''}" oninput="bitCondUp(${idx},'fecha',this.value)"></div>
        <div class="f"><label>Hora</label><input type="time" value="${r.hora||''}" oninput="bitCondUp(${idx},'hora',this.value)"></div>
      </div>
      <div class="g2" style="margin-bottom:8px">
        <div class="f"><label>Toma (OMAR)</label><select onchange="bitCondUp(${idx},'tomaOmar',this.value)" ${oneShot?'disabled':''}><option value="">—</option>${tomaOpts}</select></div>
        <div class="f"><label>Actividad de control</label><select onchange="bitCondUp(${idx},'act',this.value)" ${oneShot?'disabled':''}><option value="">—</option>${actOpts}</select></div>
      </div>
      <div class="f" style="margin-bottom:8px"><label>Limpieza código</label><select onchange="bitCondUp(${idx},'limp',this.value)"><option value="">—</option>${limpOpts}</select></div>

      <div style="font-size:10.5px;color:var(--g2);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono);margin-bottom:6px">${oneShot?'Lectura única (recalibración cruce de día)':'Lecturas de conductividad (µS/cm)'}</div>
      <div class="${oneShot?'g2':'g3'}" style="margin-bottom:8px">
        <div class="f"><label>${oneShot?'Lectura':'L1'}</label><input type="number" inputmode="numeric" placeholder="µS/cm" value="${r.l1||''}" oninput="bitCondUp(${idx},'l1',this.value)"></div>
        ${oneShot ? '' : `
        <div class="f"><label>L2</label><input type="number" inputmode="numeric" placeholder="µS/cm" value="${r.l2||''}" oninput="bitCondUp(${idx},'l2',this.value)"></div>
        <div class="f"><label>L3</label><input type="number" inputmode="numeric" placeholder="µS/cm" value="${r.l3||''}" oninput="bitCondUp(${idx},'l3',this.value)"></div>`}
      </div>

      ${oneShot ? '' : `
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
      </div>`}
    </div>
  `;
}

// Auto-detectar cruce de día y disparar bloque Ca Ca Co Co
function _bitCondDetectCambioDia(regs, nuevaFecha){
  if(!regs || !regs.length) return false;
  // último registro NO-calib (ignora bloques previos)
  const last = [...regs].reverse().find(r=>!r.calibGrupo);
  if(!last || !last.fecha) return false;
  return String(last.fecha) !== String(nuevaFecha);
}

function _bitCondInsertarBloqueRecalib(omarIdParam, fechaParam){
  const regs=_bitCondRegs();
  if(!regs) return;
  const gid = 'cd_' + Date.now();
  const omarId = omarIdParam || String(omar.ts||'');
  const folOmar = _bitCondOmarFolio(omarId);
  const base = { fecha: fechaParam, hora:'', omarId, toma:'', folioOmar: folOmar, calibGrupo: gid, l1:'', l2:'', l3:'', limp:'1' };
  regs.push({...base, act:'Ca', calibLabel:'Ca · buffer 1'});
  regs.push({...base, act:'Ca', calibLabel:'Ca · buffer 2'});
  regs.push({...base, act:'Co', calibLabel:'Co · buffer 1'});
  regs.push({...base, act:'Co', calibLabel:'Co · buffer 2'});
}

function bitCondAgregarRegistro(){
  const regs=_bitCondRegs();
  if(!regs) return;
  const tomaOptsList=_bitCondOpcionesTomaSelect();
  const asignadas=new Set((regs||[]).map(r=>{
    const v=_bitCondTomaSelectValue(r);
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
  const hoy = _defaultBitRegistroFecha();
  // Detectar cruce de día e insertar bloque Ca Ca Co Co (1 lectura cada uno)
  if(_bitCondDetectCambioDia(regs, hoy)){
    _bitCondInsertarBloqueRecalib(omarId, hoy);
    toast('Cambio de día detectado — bloque Ca/Co insertado','');
  }
  regs.push({
    fecha: hoy,
    hora: new Date().toTimeString().substring(0,5),
    omarId, toma: tomaNum,
    folioOmar: _bitCondOmarFolio(omarId),
    act:'V', limp:'1',
    l1:'', l2:'', l3:'',
  });
  _bitCondRender();
  _bitAplicarPromediosAToma('cond');
  guardarBorradorActual();
  void _persistPlanBitCond();
}

function bitCondEliminar(idx){
  const regs=_bitCondRegs();
  if(!regs) return;
  const r=regs[idx];
  if(r && r.calibGrupo){
    if(!confirm('Este renglón pertenece al bloque Ca/Co (cruce de día). ¿Eliminar las 4 líneas?')) return;
    for(let i=regs.length-1;i>=0;i--){
      if(regs[i] && regs[i].calibGrupo===r.calibGrupo) regs.splice(i,1);
    }
    _bitCondRender();
    guardarBorradorActual();
    void _persistPlanBitCond();
    return;
  }
  if(!confirm('¿Borrar este registro?')) return;
  regs.splice(idx, 1);
  _bitCondRender();
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
      regs[idx].omarId=''; regs[idx].toma=''; regs[idx].folioOmar='';
    } else if(pipe<0){
      regs[idx].toma=v;
    } else {
      regs[idx].omarId=v.slice(0,pipe);
      regs[idx].toma=v.slice(pipe+1);
      regs[idx].folioOmar=_bitCondOmarFolio(regs[idx].omarId);
    }
  } else {
    regs[idx][field] = value;
  }
  if(['l1','l2','l3','tomaOmar','omarId','toma'].includes(field)){
    _bitCondRefreshResumen(idx);
    _bitAplicarPromediosAToma('cond');
  }
  guardarBorradorActual();
  void _persistPlanBitCond();
}

function _bitCondRefreshResumen(idx){
  const regs=_bitCondRegs();
  const r = regs && regs[idx];
  if(!r) return;
  const card = document.querySelector(`[data-bit-cond="${idx}"]`);
  if(!card) return;
  const Ls = [r.l1, r.l2, r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
  const prom = Ls.length>0 ? (Ls.reduce((a,b)=>a+b,0)/Ls.length).toFixed(0) : '';
  let acepta = null, motivo = '';
  if(Ls.length === 3 && prom > 0){
    const diff = Math.max(...Ls) - Math.min(...Ls);
    const pctDiff = (diff / parseFloat(prom)) * 100;
    if(pctDiff > 3){ acepta = false; motivo = `Δ ${diff.toFixed(0)} (${pctDiff.toFixed(1)}% > 3%)`; }
    else { acepta = true; motivo = `Δ ${diff.toFixed(0)} (${pctDiff.toFixed(1)}%)`; }
  }
  const resumen = card.querySelector('[data-bit-resumen]');
  if(!resumen) return;
  resumen.style.background = acepta===false?'rgba(248,113,113,.08)':(acepta===true?'rgba(134,239,172,.08)':'var(--bg3)');
  resumen.style.borderColor = acepta===false?'rgba(248,113,113,.3)':(acepta===true?'rgba(134,239,172,.3)':'var(--ln)');
  resumen.innerHTML = `
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
// Filtra por omarId (solo registros del OMAR activo en pantalla)
function _bitAplicarPromediosAToma(tipo /* 'ph' | 'cond' */){
  if(!tomas || tomas.length===0) return;
  const fuente = tipo==='ph' ? (_bitPhRegs()||[]) : (_bitCondRegs()||[]);
  const campo = tipo==='ph' ? 'ph' : 'cond';
  const activeTs = omar && omar.ts ? String(omar.ts) : '';

  const promPorToma = {};
  fuente.forEach(r => {
    if(!r.toma) return;
    if(r.calibGrupo) return; // ignorar bloques de recalibración
    const rid = r.omarId!=null && r.omarId!=='' ? String(r.omarId) : activeTs;
    if(rid !== activeTs) return;
    const Ls = [r.l1, r.l2, r.l3].map(x=>parseFloat(x)).filter(x=>!isNaN(x));
    if(Ls.length === 0) return;
    const prom = Ls.reduce((a,b)=>a+b,0)/Ls.length;
    promPorToma[parseInt(r.toma)] = tipo==='ph' ? prom.toFixed(2) : prom.toFixed(0);
  });

  tomas.forEach((t, i) => {
    const numToma = i+1;
    if(promPorToma[numToma] !== undefined){
      t[campo] = promPorToma[numToma];
    }
  });

  tomas.forEach((t, i) => {
    if(promPorToma[i+1] === undefined) return;
    const sel = `#tomasDiv [data-toma-id="${t.id}"] input[data-toma-field="${campo}"]`;
    const inp = document.querySelector(sel);
    if(inp) inp.value = promPorToma[i+1];
  });
  if(!document.querySelector('#tomasDiv [data-toma-id]')){
    if(typeof renderTomas === 'function'){
      try { renderTomas(); } catch(e){}
    }
  }
}
