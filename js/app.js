const LOGO_APP_URI = 'logo_transparent.png';
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
});

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
const PAGES=['pgHome','pg0','pg1'];
function showPage(n){
  PAGES.forEach((id,i)=>{const e=document.getElementById(id);if(e)e.classList.toggle('on',i===n);});
  window.scrollTo({top:0,behavior:'smooth'});
}

function goHome(){
  closeFabMenu();
  renderHome();
  showPage(0);
}

function iniciarNuevoMuestreo(){
  // Limpiar cualquier modal o overlay que pueda estar activo
  document.getElementById('modalMuestreos')?.remove();
  closeFabMenu();
  saveMuestreoActual();
  // Reset estado
  omar={};tomas=[];sigData=null;sigData2=null;
  lastPDFBlob=null;lastPDFClienteBlob=null;lastPDFCadenaBlob=null;
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
  showPage(1);
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
  const lista=getMuestreos();
  const cnt=document.getElementById('homeCnt');
  const div=document.getElementById('homeLista');
  if(!cnt||!div)return;
  cnt.textContent=lista.length;
  // Tokeniza el filtro: todas las palabras deben aparecer (AND).
  // Acepta tildes o sin tildes por parte del usuario.
  const quitarTildes = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const tokens = filtro ? filtro.split(/\s+/).filter(Boolean).map(quitarTildes) : [];
  // Aplicar filtro (tokens + rango rápido)
  const filtrados = lista.filter(m=>{
    const omarObj=m.omar?JSON.parse(m.omar):{};
    const fechaISO=omarObj.fecha||m.fecha||'';
    // Filtro rápido por rango
    if(!matchesQuickFilter(fechaISO)) return false;
    // Si no hay texto de búsqueda, pasa
    if(tokens.length===0) return true;
    const empresa=(omarObj.empresa||'').toLowerCase();
    const folio=(m.folio||'').toLowerCase();
    const muestreador=(omarObj.muestreador||'').toLowerCase();
    const fechaIdx=buildFechaIndex(fechaISO);
    const haystack = quitarTildes(empresa+' '+folio+' '+muestreador+' '+fechaIdx);
    return tokens.every(tk=>haystack.includes(tk));
  });
  if(lista.length===0){
    div.innerHTML='<div style="text-align:center;padding:24px;color:var(--g2);font-size:13px">Sin muestreos guardados aún</div>';
    return;
  }
  if(filtrados.length===0){
    const qlabel = _quickFilter ? ' en el rango seleccionado' : '';
    div.innerHTML='<div style="text-align:center;padding:24px;color:var(--g2);font-size:13px">Sin resultados para "'+filtro+'"'+qlabel+'</div>';
    return;
  }
  div.innerHTML='';
  filtrados.forEach(m=>{
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
    div.appendChild(el);
  });
}

function cargarMuestreo(id){
  const lista=getMuestreos();
  const m=lista.find(x=>String(x.id)===String(id));
  if(!m){toast('No se encontró el registro','r');return;}
  if(m.omar){
    omar=JSON.parse(m.omar);
    localStorage.setItem('aarms_omar',m.omar);
    analitosSel=new Set(omar.analitos||[]);
    document.querySelectorAll('.ai').forEach(el=>{
      el.classList.toggle('on',analitosSel.has(el.dataset.a));
    });
    document.getElementById('acnt').textContent=analitosSel.size+' seleccionados';
  }
  tomas=(m.tomas||[]).map(t=>({...t,params:new Set(t.params||[])}));
  sigData=m.sigData||null;
  sigData2=m.sigData2||null;
  if(sigData){try{updSig&&updSig();}catch(e){}}
  if(sigData2){try{updSig2&&updSig2();}catch(e){}}
  document.getElementById('modalMuestreos')?.remove();
  loadCampoFromOMAR();
  buildCusTable();
  renderTomas();
  updTCnt();
  showPage(2);
  goSec(0);
  toast('Muestreo cargado ✓','g');
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
  omar={folio:g('o_omar'),ssar:g('o_ssar'),muestreador:g('o_muest'),elaboro:g('o_elab'),empresa:g('o_emp'),
    contacto:g('o_cont'),puesto:g('o_puest'),direccion:g('o_dir'),municipio:g('o_mun'),
    telefono:g('o_tel'),sitio:g('o_sitio'),idmuestra:g('o_idm'),norma:getNorma(),
    mat:document.getElementById('o_mat').value,fecha:g('o_fecha'),tipo:g('o_tipo'),
    intervalo:g('o_int'),ndesc:g('o_ndesc'),ntomas:g('o_ntomas'),
    analitos:[...analitosSel],reglas:g('o_reglas'),ts:Date.now()};
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
  'SAAM':'SAAM','Salinidad':'FQ','SDT':'FQ','Color':'CLR',
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
  showPage(2);
  goSec(0);
}
function irOMAR(){closeFabMenu();showPage(1);}

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
}

// ── TOMAS ──
function addToma(){
  const id=tid++;
  const now=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false});
  const params=getParamsFromOMAR(); // Pre-seleccionar params de la OMAR
  tomas.push({id,hora:now,pct:'',ls:'',tamb:'',tagua:'',ph:'',mat:'',cond:'',color:'',olor:null,cloro:null,params});
  renderTomas();
  updTCnt();
  setTimeout(()=>{const b=document.getElementById('tb'+id);if(b)b.classList.add('op');},60);
}
function delToma(id){tomas=tomas.filter(t=>t.id!==id);renderTomas();updTCnt();}
function togToma(id){
  const b=document.getElementById('tb'+id),c=document.getElementById('tc'+id);
  const o=b.classList.toggle('op');c.classList.toggle('op',o);
}
function upT(id,k,v){const t=tomas.find(t=>t.id===id);if(t)t[k]=v;}
function togP(tomaId,p){
  const t=tomas.find(t=>t.id===tomaId);if(!t)return;
  t.params.has(p)?t.params.delete(p):t.params.add(p);
  document.querySelectorAll('#tb'+tomaId+' .pm').forEach(el=>{
    el.classList.toggle('on',t.params.has(el.dataset.p));
  });
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
      <div class="f"><label>Materia flotante</label><select onchange="upT(${t.id},'mat',this.value)"><option value="">—</option><option ${t.mat==='Ausente'?'selected':''}>Ausente</option><option ${t.mat==='Presente'?'selected':''}>Presente</option></select></div>
      <div class="f"><label>Conductividad µS/cm</label><input type="number" placeholder="µS/cm" value="${t.cond}" inputmode="numeric" style="color:var(--w)" onchange="upT(${t.id},'cond',this.value)"></div>
    </div>
    <div class="g4" style="margin-bottom:12px">
      <div class="f"><label>Color</label><input type="text" placeholder="ej. Café" value="${t.color}" style="color:var(--w)" onchange="upT(${t.id},'color',this.value)"></div>
      <div class="f"><label>Olor</label><div class="sino"><div class="sino-b si ${t.olor===true?'on':''}" onclick="upT(${t.id},'olor',true);this.classList.add('on');this.nextElementSibling.classList.remove('on')">SI</div><div class="sino-b no ${t.olor===false?'on':''}" onclick="upT(${t.id},'olor',false);this.classList.add('on');this.previousElementSibling.classList.remove('on')">NO</div></div></div>
      <div class="f"><label>Cloro</label><div class="sino"><div class="sino-b si ${t.cloro===true?'on':''}" onclick="upT(${t.id},'cloro',true);this.classList.add('on');this.nextElementSibling.classList.remove('on')">SI</div><div class="sino-b no ${t.cloro===false?'on':''}" onclick="upT(${t.id},'cloro',false);this.classList.add('on');this.previousElementSibling.classList.remove('on')">NO</div></div></div>
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
          <div style="font-family:var(--syne);font-size:15px;font-weight:800;color:${sigData?'var(--green)':'#f87171'}">${sigData?'✓ Firmado':'Sin firma'}</div>
        </div>
        ${analitos?`<div style="background:var(--bg3);border-radius:10px;padding:12px;grid-column:span 2">
          <div style="font-size:10px;color:var(--g1);text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono)">Analitos</div>
          <div style="font-size:12px;color:var(--w);margin-top:4px">${analitos}</div>
        </div>`:''}
      </div>

      ${faltantes.length>0?`
      <div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:10px;padding:12px;margin-bottom:16px">
        <div style="font-family:var(--syne);font-size:12px;font-weight:800;color:var(--amber);margin-bottom:8px">Campos incompletos</div>
        ${faltantes.map(f=>`<div style="font-size:12px;color:var(--g1);padding:2px 0">· ${f}</div>`).join('')}
      </div>`:'<div style="background:rgba(134,239,172,.08);border:1px solid rgba(134,239,172,.25);border-radius:10px;padding:12px;margin-bottom:16px"><div style="font-family:var(--syne);font-size:12px;font-weight:800;color:var(--green)">✓ Todo completo</div></div>'}

      <div style="display:flex;gap:10px">
        <button onclick="this.closest('div[style*=fixed]').remove()" style="flex:1;padding:12px;border-radius:10px;background:var(--bg3);border:1px solid var(--ln2);color:var(--g1);cursor:pointer;font-family:var(--syne);font-weight:700;font-size:14px">Cancelar</button>
        <button onclick="this.closest('div[style*=fixed]').remove();genPDF('${tipo}')" style="flex:1;padding:12px;border-radius:10px;background:var(--acc);border:none;color:#fff;cursor:pointer;font-family:var(--syne);font-weight:800;font-size:14px">Generar PDF</button>
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
  el.textContent=ok?'✓ Firma capturada':'Sin firma';
  el.className='sigst'+(ok?' ok':'');
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
function handlePhoto(input){
  if(!input.files||!input.files[0])return;
  const reader=new FileReader();
  reader.onload=e=>{
    photoData=e.target.result;
    document.getElementById('photoImg').src=photoData;
    document.getElementById('photoPreview').style.display='block';
    document.getElementById('delPhotoBtn').style.display='inline-flex';
    toast('Foto de registro agregada ✓','g');
  };
  reader.readAsDataURL(input.files[0]);
}
function delPhoto(){
  photoData=null;
  document.getElementById('photoPreview').style.display='none';
  document.getElementById('delPhotoBtn').style.display='none';
  document.getElementById('camInput').value='';
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
  };
  reader.readAsDataURL(input.files[0]);
}
function delPhoto2(){
  photoData2=null;
  document.getElementById('photoPreview2').style.display='none';
  document.getElementById('delPhotoBtn2').style.display='none';
  document.getElementById('camInput2').value='';
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
const DB_NAME='aarms_db', DB_VER=1, STORE='muestreos';
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
    };
    req.onsuccess=e=>{_db=e.target.result;res(_db);};
    req.onerror=e=>rej(e);
  });
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
let _cachedMuestreos=[];

async function refreshCache(){
  _cachedMuestreos=await idbGetAll();
  // Migrar localStorage si existe
  try{
    const old=localStorage.getItem('aarms_muestreos_v1');
    if(old){
      const lista=JSON.parse(old);
      for(const m of lista) await idbPut(m);
      localStorage.removeItem('aarms_muestreos_v1');
    }
  }catch(e){}
  return _cachedMuestreos;
}

async function saveMuestreoActual(){
  if(!omar.folio) return;
  const mid = omar.ts || Date.now();
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
  const entry={
    id:mid, folio:omar.folio, empresa:omar.empresa,
    fecha:omar.fecha, tipo:omar.tipo, muestreador:omar.muestreador, ts:mid,
    tomas:tomas.map(t=>({
      id:t.id,hora:t.hora,ph:t.ph,cond:t.cond,
      tagua:t.tagua,tamb:t.tamb,ls:t.ls,mat:t.mat,
      color:t.color,olor:t.olor,cloro:t.cloro,params:[...t.params]
    })),
    omar:JSON.stringify(omar),
    sigData:sigData||null, sigData2:sigData2||null,
  };
  await idbPut(entry);
  await refreshCache();
}

async function eliminarMuestreo(id){
  await idbDelete(id);
  await refreshCache();
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

function genPDF(tipo='lab'){
  if(!sigData||sigData==='p'){toast('El cliente debe firmar primero','w');return;}
  if(!document.getElementById('fn_nom').value.trim()){toast('Ingresa el nombre del cliente','w');return;}

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
  if(typeof window.jspdf==='undefined'){
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload=run;
    script.onerror=()=>toast('Sin conexión para generar PDF','w');
    document.head.appendChild(script);
  }else{ run(); }
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
  const fixW=[26,34,22,22,28,30,30,38,34,28,26,26]; // 12 cols = 344
  const fixSum=fixW.reduce((a,b)=>a+b,0);
  const pW=Math.floor((CW-fixSum)/PARAMS.length);
  const fixHdrs=['MUEST.','HORA','%VOL','L/s','T.AMB','T.AGU','pH25°','MAT.F','COND.','COLOR','OLOR','CLORO'];

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
        t.cond||'',t.color||'',t.olor===true?'SI':t.olor===false?'NO':'',
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

  // ════════ TOMAS TABLE ════════
  y=secH('Registro de tomas — parámetros de campo',y);
  const ROWS=[
    ['Temp. agua (°C)',t=>t.tagua||'',true],
    ['pH L1',t=>t.ph||'',false],['pH L2',t=>t.ph||'',false],['pH L3',t=>t.ph||'',false],
    ['pH prom. 25°C',t=>t.ph||'',true],
    ['Conductividad (µS/cm)',t=>t.cond||'',true],
    ['Flujo (L/s)',t=>t.ls||'',false],
    ['Materia flotante',t=>t.mat||'',true],
    ['Color',t=>t.color||'',false],
    ['Olor',t=>t.olor===true?'SI':t.olor===false?'NO':'',false],
  ];
  const LBL=120,PROM=50,nT=Math.max(tomas.length,1);
  const TW3=Math.floor((CW-LBL-PROM)/nT);
  const THR=14,TRR=12;

  // Header row
  doc.setFillColor(...K.rowBg);doc.rect(ML,y,LBL,THR,'F');
  doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(ML,y,LBL,THR,'S');
  doc.setTextColor(51,51,51);doc.setFont('helvetica','bold');doc.setFontSize(7.5);
  doc.text('Parámetro',ML+3,y+10);
  tomas.forEach((t,i)=>{
    const tx=ML+LBL+i*TW3;
    doc.setFillColor(...K.rowBg);doc.rect(tx,y,TW3,THR,'F');
    doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(tx,y,TW3,THR,'S');
    doc.setTextColor(51,51,51);doc.setFont('helvetica','bold');doc.setFontSize(7);
    doc.text('Toma '+t.id,tx+TW3/2,y+6,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);
    doc.text(t.hora||'',tx+TW3/2,y+12,{align:'center'});
  });
  const prX=ML+LBL+nT*TW3;
  doc.setFillColor(...K.promBg);doc.rect(prX,y,PROM,THR,'F');
  doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(prX,y,PROM,THR,'S');
  doc.setTextColor(51,51,51);doc.setFont('helvetica','bold');doc.setFontSize(6.5);
  doc.text('Prom.',prX+PROM/2,y+6,{align:'center'});
  doc.text('Report.',prX+PROM/2,y+12,{align:'center'});
  y+=THR;

  // Data rows
  ROWS.forEach(([lbl,fn,showProm],ri)=>{
    const rH=TRR,bg=ri%2===0?K.wht:K.rowAlt;
    doc.setFillColor(...K.rowBg);doc.rect(ML,y,LBL,rH,'F');
    doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(ML,y,LBL,rH,'S');
    doc.setTextColor(51,51,51);doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.text(lbl,ML+3,y+9);
    const vals=tomas.map(t=>fn(t));
    vals.forEach((v,i)=>{
      const tx=ML+LBL+i*TW3;
      doc.setFillColor(...bg);doc.rect(tx,y,TW3,rH,'F');
      doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(tx,y,TW3,rH,'S');
      if(v){doc.setTextColor(...K.blk);doc.setFont('helvetica','bold');doc.setFontSize(8.5);}
      else{doc.setTextColor(187,187,187);doc.setFont('helvetica','normal');doc.setFontSize(8.5);}
      doc.text(v?String(v).substring(0,10):'—',tx+TW3/2,y+9,{align:'center'});
    });
    const nums=vals.map(v=>parseFloat(v)).filter(n=>!isNaN(n));
    const prom=nums.length&&showProm?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2):'';
    doc.setFillColor(...(prom?K.tealBg:bg));doc.rect(prX,y,PROM,rH,'F');
    doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(prX,y,PROM,rH,'S');
    if(prom){doc.setTextColor(...K.teal);doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.text(prom,prX+PROM/2,y+9,{align:'center'});}
    else{doc.setTextColor(187,187,187);doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.text('—',prX+PROM/2,y+9,{align:'center'});}
    y+=rH;
  });
  // (outer border drawn inline per row)

  // Observations
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

  // ════════ CONSERVADORES ════════
  y=secH('Conservadores utilizados por toma',y);
  const conCloroR=tomas.some(t=>t.cloro===true);
  const CMAP={
    'FQ'  :'Hielo 4C',
    'TOC' :'Hielo/H2SO4 25%',
    'Hg'  :'Hielo/HNO3 Sup/K2Cr2O7',
    'MP'  :'Hielo/HNO3 Sup',
    'CIAN':'Hielo/NaOH',
    'FOS.':'Hielo',
    'SAAM':'Hielo',
    'GYA' :'Hielo/HCl',
    'DQO' :'Hielo/H2SO4',
    'DBO5':'Hielo',
    'N.TOT':'Hielo/H2SO4',
    'CTYF':conCloroR?'Hielo/Tiosulfato':'Hielo',
    'ENTE.':conCloroR?'Hielo/Tiosulfato':'Hielo',
    'NO2' :'Hielo',
    'NO3' :'Hielo',
    'HELM':'Hielo',
    'CLR' :'Hielo',
    'ECOL':conCloroR?'Hielo/Tiosulfato':'Hielo',
    'TOX' :'Hielo',
    'CLOR':'Hielo',
    'CrHx':'Hielo/Dil.Buffer',
    'OTRS':'N/A'
  };
  const SIMPLES=['GYA','CTYF','ENTE.','ECOL','TOX'];
  const allP=[...new Set([...tomas.flatMap(t=>[...t.params])])];
  const CLW=100,CCW=105,CTW=Math.floor((CW-CLW-CCW)/6);

  // Header — fill entire row first to avoid gaps
  doc.setFillColor(...K.rowBg);doc.rect(ML,y,CW,TRR,'F');
  // Param label
  doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(ML,y,CLW,TRR,'S');
  doc.setTextColor(51,51,51);doc.setFont('helvetica','bold');doc.setFontSize(7);
  doc.text('Parámetro',ML+3,y+9);
  // Conservador label
  doc.rect(ML+CLW,y,CCW,TRR,'S');
  doc.text('Conservador',ML+CLW+3,y+9);
  // T1..T6 headers — only draw for tomas that exist, grey out rest
  for(let ti=0;ti<6;ti++){
    const cx=ML+CLW+CCW+ti*CTW;
    const exists=tomas[ti]!=null;
    doc.setFillColor(...(exists?K.rowBg:[228,232,240]));
    doc.rect(cx,y,CTW,TRR,'F');
    doc.setDrawColor(...K.bdr);doc.setLineWidth(0.3);doc.rect(cx,y,CTW,TRR,'S');
    doc.setTextColor(...(exists?[51,51,51]:[170,178,190]));
    doc.setFont('helvetica','bold');doc.setFontSize(7);
    doc.text('T'+(ti+1),cx+CTW/2,y+9,{align:'center'});
  }
  y+=TRR;

  allP.slice(0,12).forEach((p,ri)=>{
    const bg=ri%2===0?K.wht:K.rowAlt,cons=CMAP[p]||'—';
    doc.setFillColor(...bg);doc.rect(ML,y,CLW,TRR,'F');
    doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(ML,y,CLW,TRR,'S');
    doc.setTextColor(...K.blk);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(p,ML+3,y+9);
    doc.setFillColor(...bg);doc.rect(ML+CLW,y,CCW,TRR,'F');
    doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(ML+CLW,y,CCW,TRR,'S');
    doc.setFontSize(7.5);doc.text(cons.substring(0,16),ML+CLW+3,y+9);
    for(let ti=0;ti<6;ti++){
      const cx=ML+CLW+CCW+ti*CTW;
      const t=tomas[ti];
      const hasP=t&&t.params.has(p);
      doc.setFillColor(...bg);doc.rect(cx,y,CTW,TRR,'F');
      doc.setDrawColor(...K.bdrCell);doc.setLineWidth(0.2);doc.rect(cx,y,CTW,TRR,'S');
      if(hasP){doc.setTextColor(0,122,96);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('v',cx+CTW/2,y+9,{align:'center'});}
    }
    y+=TRR;
  });
  // conservadores border inline

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
  if(typeof window.jspdf==='undefined'){
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload=run; s.onerror=()=>toast('Sin conexión','w');
    document.head.appendChild(s);
  }else{ run(); }
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