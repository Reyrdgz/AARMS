const LOGO_APP_URI = 'logo_glow_sinFondo.png';
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
const CONS_O=[['1','H2SO4'],['2','NaOH'],['3','K2Cr2O7 25%'],['4','Hielo 4C'],['5','NA'],['6','HNO3'],['7','Bolsa c/tios.'],['8','HCl'],['9','HNO3 Sup.'],['10','H2SO4 25%'],['11','Bolsa s/tios.'],['12','Buffer'],['13','Formald.'],['14','Otro']];
const ENV_O=[['1','Vidrio BA 1L'],['2','Plást 1L'],['3','Plást 4L'],['4','Plást 500mL'],['5','Plást 5L'],['6','Bolsa 300mL'],['7','Bolsa+Tios 300mL'],['8','V.Amb 1L'],['9','Bolsa+Tios 100mL'],['10','V.Amb 40mL'],['11','V.Amb 250mL'],['12','Bolsa 100mL'],['13','Plást 2L']];
const VOLS={FQ:4000,TOC:1000,Hg:500,MP:500,CIAN:1000,'FOS.':500,SAAM:1000,GYA:1000,DQO:500,DBO5:1000,'N.TOT':2000,CTYF:100,'ENTE.':250,NO2:500,NO3:500,HELM:5000,CLR:250,ECOL:100,TOX:40,CLOR:500,CrHx:500,OTRS:500};

let omar={},tomas=[],tid=1,analitosSel=new Set(),sigData=null,toastT;

// ── INIT ──
window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('o_fecha').value=new Date().toISOString().split('T')[0];
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
    showOmarRes();
  }catch(e){console.error(e);}
}

// ── PAGE NAV ──
function showPage(n){
  document.querySelectorAll('.page').forEach((p,i)=>p.classList.toggle('on',i===n));
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── SECTION NAV (dentro de pg1) ──
function goSec(n){
  document.querySelectorAll('#pg1 .sec').forEach((s,i)=>s.classList.toggle('on',i===n));
  document.querySelectorAll('#stepsBar .stp').forEach((t,i)=>{
    t.classList.remove('on','done');
    if(i<n)t.classList.add('done');
    if(i===n)t.classList.add('on');
  });
  window.scrollTo({top:0,behavior:'smooth'});
  if(n===2)buildRes();
}

// ── OMAR ──
function setTipo(t,silent){
  document.getElementById('o_tipo').value=t;
  document.getElementById('tb_simp').classList.toggle('btn-p',t==='Simple');
  document.getElementById('tb_simp').classList.toggle('btn-g',t!=='Simple');
  document.getElementById('tb_comp').classList.toggle('btn-p',t==='Compuesto');
  document.getElementById('tb_comp').classList.toggle('btn-g',t!=='Compuesto');
  document.getElementById('intField').style.display=t==='Compuesto'?'block':'none';
}
function setInt(el,v){
  document.querySelectorAll('#intChips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');document.getElementById('o_int').value=v;
}
function togA(el,a){
  if(analitosSel.has(a)){analitosSel.delete(a);el.classList.remove('on');}
  else{analitosSel.add(a);el.classList.add('on');}
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
  const g=id=>document.getElementById(id).value.trim();
  if(!g('o_omar')||!g('o_muest')||!g('o_emp')||!g('o_sitio')||!g('o_tipo')){
    toast('Completa los campos obligatorios (*)','w');return;
  }
  omar={folio:g('o_omar'),ssar:g('o_ssar'),muestreador:g('o_muest'),empresa:g('o_emp'),
    contacto:g('o_cont'),puesto:g('o_puest'),direccion:g('o_dir'),municipio:g('o_mun'),
    telefono:g('o_tel'),sitio:g('o_sitio'),idmuestra:g('o_idm'),norma:getNorma(),
    mat:document.getElementById('o_mat').value,fecha:g('o_fecha'),tipo:g('o_tipo'),
    intervalo:g('o_int'),ndesc:g('o_ndesc'),ntomas:g('o_ntomas'),
    analitos:[...analitosSel],reglas:g('o_reglas'),ts:Date.now()};
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
function irCampo(){
  if(!omar.folio){toast('Primero confirma la OMAR','w');return;}
  loadCampoFromOMAR();
  buildCusTable();
  showPage(1);
  goSec(0);
}
function irOMAR(){showPage(0);}

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
}

// ── TOMAS ──
function addToma(){
  const id=tid++;
  const now=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false});
  tomas.push({id,hora:now,pct:'',ls:'',tamb:'',tagua:'',ph:'',mat:'',cond:'',color:'',olor:null,cloro:null,params:new Set()});
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
function updTCnt(){document.getElementById('tcnt').textContent=tomas.length+' toma'+(tomas.length!==1?'s':'');}
function renderTomas(){
  const pGrid=PARAMS_TOMA.map(p=>`<div class="pm" onclick="togP(${0},'${p}')" data-p="${p}"><div class="pbox"><svg class="pchk" width="9" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="pn">${p}</span></div>`).join('');
  document.getElementById('tomasDiv').innerHTML=tomas.map(t=>`
<div class="toma">
  <div class="toma-h" onclick="togToma(${t.id})">
    <div class="toma-hl">
      <span class="tbadge">T${t.id}</span>
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
  'FQ'  :{pres:'1',  vol:'4000', env:'3',  ph:'<2'},
  'TOC' :{pres:'2',  vol:'1000', env:'8',  ph:'>12'},
  'Hg'  :{pres:'9',  vol:'500',  env:'4',  ph:'<2'},
  'MP'  :{pres:'6',  vol:'500',  env:'4',  ph:'<2'},
  'CIAN':{pres:'2',  vol:'1000', env:'2',  ph:'>12'},
  'FOS.':{pres:'1',  vol:'500',  env:'4',  ph:'<2'},
  'SAAM':{pres:'4',  vol:'1000', env:'2',  ph:'N/A'},
  'GYA' :{pres:'1/8',vol:'1000', env:'1',  ph:'<2'},
  'DQO' :{pres:'1',  vol:'500',  env:'4',  ph:'<2'},
  'DBO5':{pres:'4',  vol:'1000', env:'2',  ph:'N/A'},
  'N.TOT':{pres:'1', vol:'2000', env:'13', ph:'<2'},
  'CTYF':{pres:'7',  vol:'100',  env:'9',  ph:'N/A'},
  'ENTE.':{pres:'7', vol:'250',  env:'7',  ph:'N/A'},
  'NO2' :{pres:'4',  vol:'500',  env:'4',  ph:'N/A'},
  'NO3' :{pres:'1',  vol:'500',  env:'4',  ph:'<2'},
  'HELM':{pres:'13', vol:'5000', env:'5',  ph:'N/A'},
  'CLR' :{pres:'4',  vol:'250',  env:'11', ph:'N/A'},
  'ECOL':{pres:'7',  vol:'100',  env:'9',  ph:'N/A'},
  'TOX' :{pres:'4',  vol:'40',   env:'10', ph:'N/A'},
  'CLOR':{pres:'4',  vol:'500',  env:'4',  ph:'N/A'},
  'CrHx':{pres:'4',  vol:'250',  env:'11', ph:'N/A'},
  'OTRS':{pres:'',   vol:'',     env:'',   ph:''},
};
const CADENA_SIMPLES=['GYA','CTYF','ENTE.','ECOL','TOX'];

function buildCusTable(){
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
    ['N° Frascos',     p=>CADENA_DATA[p]?.env?'1':'—'],
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
const STORAGE_KEY = 'aarms_muestreos_v1';

function getMuestreos(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); }
  catch(e){ return []; }
}

function saveMuestreoActual(){
  if(!omar.folio) return;
  const lista = getMuestreos();
  const id = omar.ts || Date.now();
  const entry = {
    id,
    folio: omar.folio,
    empresa: omar.empresa,
    sitio: omar.idMuestra,
    fecha: omar.fechaIni,
    tipo: omar.tipo,
    muestreador: omar.muestreador,
    ts: id,
    tomas: tomas.map(t=>({
      id:t.id, hora:t.hora, ph:t.ph, cond:t.cond,
      tagua:t.tagua, tamb:t.tamb, ls:t.ls, mat:t.mat,
      color:t.color, olor:t.olor,
      params:[...t.params]
    })),
    omar: JSON.stringify(omar),
    sigData: sigData||null,
    sigData2: sigData2||null,
  };
  const existing = lista.findIndex(m=>m.id===id);
  if(existing>=0) lista[existing]=entry;
  else lista.unshift(entry);
  // Keep max 50 muestreos
  if(lista.length>50) lista.splice(50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function soloGuardar(){
  if(!omar.folio){toast('Primero confirma la OMAR','w');return;}
  saveMuestreoActual();
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
  // Save current before clearing
  saveMuestreoActual();
  // Clear everything
  omar={};
  tomas=[];
  sigData=null; sigData2=null;
  lastPDFBlob=null; lastPDFClienteBlob=null;
  // Clear all form fields
  document.querySelectorAll('input,select,textarea').forEach(el=>{
    if(el.type==='checkbox'||el.type==='radio') el.checked=false;
    else el.value='';
  });
  // Clear signatures
  ['sigCanvas','sigCanvas2'].forEach(id=>{
    const c=document.getElementById(id);
    if(c) c.getContext('2d').clearRect(0,0,c.width,c.height);
  });
  ['cvswrap','cvswrap2'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.classList.remove('signed');
  });
  ['cvsover','cvsover2'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.classList.remove('hide');
  });
  ['sigst','sigst2'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.textContent='Sin firma';el.className='sigst';}
  });
  // Reset share row
  const sr=document.getElementById('shareRow');
  if(sr) sr.style.display='none';
  // Go back to OMAR
  localStorage.removeItem('aarms_omar');
  showPage(0);
  document.getElementById('omarForm').style.display='block';
  document.getElementById('omarResumen').style.display='none';
  // Update muestreos count button
  try{
    const lista=getMuestreos();
    const btn=document.getElementById('btnVerMuestreos');
    if(btn) btn.textContent=lista.length>0?`Ver muestreos guardados (${lista.length})`:'Ver muestreos guardados';
  }catch(e){}
  toast('Nuevo muestreo listo — '+getMuestreos().length+' guardado(s)','g');
}

function verMuestreos(){
  const lista = getMuestreos();
  const modal = document.createElement('div');
  modal.id = 'modalMuestreos';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,8,15,.95);z-index:9999;display:flex;flex-direction:column;padding:0;overflow:hidden';

  const empty = lista.length===0;
  modal.innerHTML = `
    <div style="background:var(--bg2);border-bottom:1px solid var(--ln2);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
      <div style="font-family:var(--syne);font-size:18px;font-weight:800;color:var(--w)">Muestreos guardados</div>
      <button onclick="document.getElementById('modalMuestreos').remove()" style="background:none;border:1px solid var(--g3);border-radius:8px;color:var(--g2);font-size:13px;padding:7px 14px;cursor:pointer">Cerrar</button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:16px">
      ${empty ? `
        <div style="text-align:center;padding:60px 20px;color:var(--g2)">
          <div style="font-size:40px;margin-bottom:12px">📋</div>
          <div style="font-family:var(--syne);font-size:16px;font-weight:700;color:var(--g1);margin-bottom:8px">Sin muestreos guardados</div>
          <div style="font-size:13px">Los muestreos se guardan automáticamente cuando generas un PDF o inicias uno nuevo.</div>
        </div>
      ` : lista.map((m,i) => {
        const fecha = m.fecha ? m.fecha.replace('T',' ').substring(0,16) : '—';
        const nTomas = m.tomas ? m.tomas.length : 0;
        // Detectar si tiene datos incompletos
        const tomasConFlujoPendiente = m.tomas ? m.tomas.filter(t=>!t.ls).length : 0;
        const tomasConPhPendiente = m.tomas ? m.tomas.filter(t=>!t.ph).length : 0;
        const incompleto = tomasConFlujoPendiente>0 || tomasConPhPendiente>0;
        const pendientes = [];
        if(tomasConFlujoPendiente>0) pendientes.push(`flujo en ${tomasConFlujoPendiente} toma${tomasConFlujoPendiente>1?'s':''}`);
        if(tomasConPhPendiente>0) pendientes.push(`pH en ${tomasConPhPendiente} toma${tomasConPhPendiente>1?'s':''}`);
        return `
          <div style="background:var(--bg2);border:1px solid ${incompleto?'rgba(251,191,36,.3)':'var(--ln2)'};border-radius:12px;padding:14px 16px;margin-bottom:10px;cursor:pointer" onclick="cargarMuestreo(${m.id})">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
              <div style="font-family:var(--syne);font-size:14px;font-weight:800;color:var(--w)">${m.empresa||'Sin empresa'}</div>
              <div style="display:flex;gap:6px;align-items:center">
                ${incompleto?`<div style="font-size:10px;color:#fbbf24;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);padding:2px 7px;border-radius:99px">⚠ Pendiente</div>`:`<div style="font-size:10px;color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3);padding:2px 7px;border-radius:99px">✓ Completo</div>`}
                <div style="font-family:var(--dm);font-size:11px;color:var(--g2);background:var(--bg3);padding:3px 8px;border-radius:6px">OMAR-${m.folio||'—'}</div>
              </div>
            </div>
            <div style="font-size:12px;color:var(--g2);margin-bottom:4px">${m.sitio||'—'} &nbsp;·&nbsp; ${m.tipo||'—'}</div>
            <div style="display:flex;gap:12px;font-size:11px;color:var(--g3)">
              <span>${fecha}</span>
              <span>${nTomas} toma${nTomas!==1?'s':''}</span>
              <span style="color:var(--accent)">${m.muestreador||'—'}</span>
            </div>
            ${incompleto?`<div style="margin-top:6px;font-size:11px;color:#fbbf24">⚠ Datos pendientes: ${pendientes.join(', ')}</div>`:''}
            <div style="margin-top:10px;display:flex;gap:8px">
              <button onclick="event.stopPropagation();cargarMuestreo(${m.id})" 
                style="flex:1;padding:8px;background:var(--accent);border:none;border-radius:8px;color:#fff;font-family:var(--syne);font-size:12px;font-weight:700;cursor:pointer">
                Abrir
              </button>
              <button onclick="event.stopPropagation();eliminarMuestreo(${m.id})" 
                style="padding:8px 14px;background:none;border:1px solid rgba(248,113,113,.3);border-radius:8px;color:var(--red);font-size:12px;cursor:pointer">
                Eliminar
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  document.body.appendChild(modal);
}

function cargarMuestreo(id){
  const lista = getMuestreos();
  const entry = lista.find(m=>m.id===id);
  if(!entry){ toast('No encontrado','w'); return; }
  
  // Restore omar
  try{ 
    omar = JSON.parse(entry.omar);
    localStorage.setItem('aarms_omar', entry.omar);
  }catch(e){ toast('Error al cargar','w'); return; }

  // Restore tomas
  tomas = (entry.tomas||[]).map(t=>({
    ...t,
    params: new Set(t.params||[])
  }));

  // Restore signatures
  if(entry.sigData){ sigData=entry.sigData; updSig&&updSig(); }
  if(entry.sigData2){ sigData2=entry.sigData2; updSig2&&updSig2(); }

  // Close modal and go to hoja de campo
  document.getElementById('modalMuestreos')?.remove();
  loadCampoFromOMAR();
  buildCusTable();
  showPage(1);
  toast('Muestreo cargado ✓','g');
}

function eliminarMuestreo(id){
  const lista = getMuestreos().filter(m=>m.id!==id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  document.getElementById('modalMuestreos')?.remove();
  verMuestreos();
  toast('Muestreo eliminado','g');
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
      const fixVals=[`T${t.id}`,t.hora||'',t.pct?t.pct+'%':'',t.ls||'',
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
  const fileName='Hoja de Campo - '+empresa_lab+' ('+fecha+').pdf';
  
  try{
    const pdfBlob=doc.output('blob');
    lastPDFBlob=pdfBlob; lastPDFBlob.name=fileName;
    const blobUrl=URL.createObjectURL(pdfBlob);
    const a=document.createElement('a');
    a.href=blobUrl; a.download=fileName; a.style.display='none';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(blobUrl);},3000);
    document.getElementById('shareRow').style.display='flex';
    toast('Registro guardado ✓ — también puedes entregar al cliente','g');
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
  const CMAP={
    'FQ':'H2SO4','TOC':'NaOH','Hg':'HNO3 Sup.','MP':'HNO3',
    'CIAN':'NaOH','FOS.':'H2SO4','SAAM':'N/A','GYA':'H2SO4/HCl',
    'DQO':'H2SO4','DBO5':'Hielo 4C','N.TOT':'H2SO4',
    'CTYF':'Bolsa c/Tios.','ENTE.':'Bolsa c/Tios.','NO2':'Hielo',
    'NO3':'H2SO4','HELM':'Formaldehido','CLR':'N/A',
    'ECOL':'Bolsa c/Tios.','TOX':'Bolsa','CLOR':'N/A','CrHx':'N/A','OTRS':'N/A'
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
  const fname='Reporte de Muestreo - '+empresa_c+' ('+fecha+').pdf';
  const blob=doc.output('blob');
  lastPDFClienteBlob=blob;lastPDFClienteBlob.name=fname;
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=fname;a.style.display='none';
  document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},3000);
  document.getElementById('shareRow').style.display='flex';
  toast('Informe para cliente listo — toca Compartir','g');
}


// ─── CADENA DE CUSTODIA PDF ───────────────────────────────────────────────
let lastPDFCadenaBlob = null;

function genCadena(){
  toast('Generando Cadena de Custodia...','');
  const btn=document.getElementById('btnCadena');
  if(btn){btn.disabled=true;btn.textContent='Generando...';}
  const run=async()=>{
    try{
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
  const DATA={
    'FQ'  :{pres:'1',  vol:'4000', env:'3', ph:'<2'},
    'TOC' :{pres:'2',  vol:'1000', env:'8', ph:'>12'},
    'Hg'  :{pres:'9',  vol:'500',  env:'4', ph:'<2'},
    'MP'  :{pres:'6',  vol:'500',  env:'4', ph:'<2'},
    'CIAN':{pres:'2',  vol:'1000', env:'2', ph:'>12'},
    'FOS.':{pres:'1',  vol:'500',  env:'4', ph:'<2'},
    'SAAM':{pres:'4',  vol:'1000', env:'2', ph:'N/A'},
    'GYA' :{pres:'1/8',vol:'1000', env:'1', ph:'<2'},
    'DQO' :{pres:'1',  vol:'500',  env:'4', ph:'<2'},
    'DBO5':{pres:'4',  vol:'1000', env:'2', ph:'N/A'},
    'N.TOT':{pres:'1', vol:'2000', env:'13',ph:'<2'},
    'CTYF':{pres:'7',  vol:'100',  env:'9', ph:'N/A'},
    'ENTE.':{pres:'7', vol:'250',  env:'7', ph:'N/A'},
    'NO2' :{pres:'4',  vol:'500',  env:'4', ph:'N/A'},
    'NO3' :{pres:'1',  vol:'500',  env:'4', ph:'<2'},
    'HELM':{pres:'13', vol:'5000', env:'5', ph:'N/A'},
    'CLR' :{pres:'4',  vol:'250',  env:'11',ph:'N/A'},
    'ECOL':{pres:'7',  vol:'100',  env:'9', ph:'N/A'},
    'TOX' :{pres:'4',  vol:'40',   env:'10',ph:'N/A'},
    'CLOR':{pres:'4',  vol:'500',  env:'4', ph:'N/A'},
    'CrHx':{pres:'4',  vol:'250',  env:'11',ph:'N/A'},
    'OTRS':{pres:'',   vol:'',     env:'',  ph:''},
  };

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
    ['No. DE FRASCOS',   p=>DATA[p]?.env?'1':'',LGRAY],
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
        fillRect(px,y,PCOL,RH,isS?TEAL_L:[255,255,255]);
        doc.setDrawColor(...MGRAY);doc.setLineWidth(0.2);doc.rect(px,y,PCOL,RH,'S');
        if(val){
          doc.setTextColor(...(isS?TEAL:DGRAY));doc.setFont('helvetica','bold');doc.setFontSize(5.5);
          doc.text(String(val),px+PCOL/2,y+7.5,{align:'center'});
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
    [['7-Bolsas c/Tiosulfato  ',false]],
    [['8-HCl  ',false]],
    [['9-HNO',false],['3',true],[' Sup  ',false]],
    [['10-H',false],['2',true],['SO',false],['4',true],[' 25%  ',false]],
    [['11-Bolsas s/Tiosulfato  ',false]],
    [['12-Dil.Buffer  ',false]],
    [['13-Formaldehido 10%  ',false]],
    [['14-Otro:_____',false]],
  ];
  let cx=M+40;
  chemicals.forEach(chem=>{ cx=drawChem(chem,cx,y+7); });

  doc.setFont('helvetica','bold');doc.setFontSize(4.5);
  doc.text('TIPO ENVASE:',M+3,y+16);
  doc.setFont('helvetica','normal');doc.setFontSize(4.2);
  doc.text('1-V.Ancho1L  2-Plast.1L  3-Plast.4L  4-Plast.500mL  5-Plast.5L  6-B.Est.300mL  7-B.Est.300mL c/Tios.  8-V.Amb.1L  9-B.Est.100mL c/Tios.  10-V.Amb.40mL  11-V.Amb.250mL  12-B.Est.100mL  13-Plast.2L',M+35,y+16);
  y+=notaH+2;

  // ── FIRMAS MATRIZ ──
  const FW=CW/3;
  const firmaH=40;
  [['TRANSPORTA Y ENTREGA EN MATRIZ:',LGRAY],['INSPECCIONA EN MATRIZ:',[255,255,255]],['RECIBE EN MATRIZ:',LGRAY]].forEach(([lbl,fill],i)=>{
    const fx=M+i*FW;
    fillRect(fx,y,FW,firmaH,fill);
    outerRect(fx,y,FW,firmaH);
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(5.5);
    doc.text(lbl,fx+4,y+8);
    doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(6);
    doc.text('NOMBRE: _______________________',fx+4,y+17);
    doc.text('FIRMA:    _______________________',fx+4,y+26);
    doc.text('FECHA: ______________  HORA: ______',fx+4,y+35);
  });
  y+=firmaH;

  // ── RESPONSABLE + OBSERVACIONES ──
  const respH=30;
  fillRect(M,y,CW*0.36,respH,NAVY);
  outerRect(M,y,CW*0.36,respH);
  doc.setTextColor(...WHITE);doc.setFont('helvetica','bold');doc.setFontSize(5.5);
  doc.text('RESPONSABLE DE MUESTREO:',M+4,y+9);
  doc.setFont('helvetica','normal');doc.setFontSize(6);
  doc.text('NOMBRE: '+gv('mn_nom'),M+4,y+18);
  doc.text('FIRMA: _______________________________',M+4,y+27);

  const obsX=M+CW*0.36;
  fillRect(obsX,y,CW*0.64,respH,LGRAY);
  outerRect(obsX,y,CW*0.64,respH);
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(5.5);
  doc.text('OBSERVACIONES:',obsX+4,y+9);
  doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(6);
  const obsText=gv('h_obs');
  if(obsText)doc.text(obsText.substring(0,100),obsX+4,y+18);
  y+=respH;

  // ── SUCURSAL ──
  const sucH=38;
  [['TRANSPORTA Y ENTREGA DE MUESTRAS Y OTAR — FOLIO: ________  EN SUCURSAL:',LGRAY],['INSPECCIONA EN SUCURSAL:',[255,255,255]],['RECIBIDO EN SUCURSAL:',LGRAY]].forEach(([lbl,fill],i)=>{
    const fx=M+i*FW;
    fillRect(fx,y,FW,sucH,fill);
    outerRect(fx,y,FW,sucH);
    doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(4.5);
    const lblLines=doc.splitTextToSize(lbl,FW-8);
    doc.text(lblLines,fx+4,y+8);
    doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);doc.setFontSize(6);
    doc.text('NOMBRE: ___________________  FIRMA: ___________',fx+4,y+22);
    doc.text('FECHA: ____________  HORA: _______',fx+4,y+31);
  });
  y+=sucH;

  // ── PIE FINAL ──
  const pieH=22;
  fillRect(M,y,CW,pieH,LGRAY);
  outerRect(M,y,CW,pieH);
  doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(5.5);
  doc.text('ENVÍO DE OTAR CON FOLIO:',M+4,y+8);
  doc.setFont('helvetica','normal');doc.setTextColor(...DGRAY);
  doc.text('____________  Y CCIAR CON FOLIO: ____________  A LABORATORIO MATRIZ',M+75,y+8);
  doc.setFont('helvetica','normal');doc.setFontSize(5.5);
  doc.text('PERSONA QUE TRANSPORTA EN LAB. MATRIZ: _______________________  FIRMA: ________________  FECHA: ____________  HORA: _______',M+4,y+16);
  doc.setFont('helvetica','bold');doc.setTextColor(...ACCENT);
  doc.text('F-AA-01A-15',W-M-4,y+16,{align:'right'});

  // ── SAVE ──
  const folio=gv('h_omar')||'000';
  const fecha=now.toISOString().split('T')[0];
  const empresa=(omar.empresa||gv('h_emp')||'').substring(0,20).replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g,'').trim();
  const fname='Cadena de Custodia - '+empresa+' ('+fecha+').pdf';
  const blob=doc.output('blob');
  lastPDFCadenaBlob=blob; lastPDFCadenaBlob.name=fname;
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=fname;a.style.display='none';
  document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},3000);
  document.getElementById('shareRow').style.display='flex';
  toast('Cadena de Custodia generada ✓','g');
}

function fmtF(iso){if(!iso)return'—';const[y,m,d]=iso.split('-');return`${d}/${m}/${y}`;}
// Store last PDF blob for sharing
let lastPDFBlob = null;

let lastPDFClienteBlob = null;

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
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2800);
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
initCanvas();initCanvas2();});
let sigData2=null;
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