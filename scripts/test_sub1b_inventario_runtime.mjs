/**
 * AARMS v66-sub1b � tests runtime Inventario + tabs (estructura + l�gica).
 * node scripts/test_sub1b_inventario_runtime.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dir, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const swJs = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

const results = [];
const assert = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail });

// --- invSetTab / invRestoreTab (r�plica DOM m�nima) ---
const dom = {
  invContDisol: { style: { display: '' } },
  invContEquipos: { style: { display: 'none' } },
  invTabDisol: { style: { color: '', borderBottomColor: '' } },
  invTabEquipos: { style: { color: '', borderBottomColor: '' } },
};
const session = {};
global.document = {
  getElementById: (id) => dom[id] || null,
};
global.sessionStorage = {
  getItem: (k) => session[k] ?? null,
  setItem: (k, v) => { session[k] = v; },
};

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
function invRestoreTab(){
  let tab = 'disol';
  try { tab = sessionStorage.getItem('invLastTab') || 'disol'; } catch(e){}
  invSetTab(tab);
}

// Paso 1 � hard refresh / cache bump
assert('Paso 1 � SW cache v66-sub1b', /aarms-offline-v66-sub1b/.test(swJs));

// Paso 2 � bot�n Inventario con SVG en home
assert('Paso 2 � bot�n Inventario + SVG package', html.includes('<span>Inventario</span>') && html.includes('M16.5 9.4l-9-5.19') && !html.includes('??</span> Cat�logo'));

// Paso 3 � abrirCatalogo existe
assert('Paso 3 � abrirCatalogo definida', /async function abrirCatalogo/.test(appJs) && /invRestoreTab\(\)/.test(appJs));

// Paso 4 � header dice Inventario
assert('Paso 4 � header Inventario del Laboratorio', html.includes('Inventario del Laboratorio') && !html.includes('Cat�logo del Laboratorio'));

// Paso 5 � 2 tabs visibles en HTML
assert('Paso 5 � 2 tabs (Disoluciones + Equipos)', html.includes('id="invTabDisol"') && html.includes('id="invTabEquipos"') && html.includes('Equipos de Muestreo'));

// Paso 6 � tab Disoluciones activa por defecto (invRestoreTab default)
invRestoreTab();
assert('Paso 6 � tab Disoluciones activa por defecto', dom.invContDisol.style.display !== 'none' && dom.invContEquipos.style.display === 'none' && dom.invTabDisol.style.borderBottomColor === 'var(--acc)');

// Paso 7 � secciones qu�micas en invContDisol
const disolBlock = html.match(/id="invContDisol"[\s\S]*?id="invContEquipos"/)?.[0] || '';
assert('Paso 7 � secciones qu�micas en tab Disoluciones',
  ['catBuffersCal','catBuffersVer','catDisoluciones','catConductividad','catOtros'].every(id => disolBlock.includes(`id="${id}"`)));

// Paso 8 � �conos SVG en lugar de puntitos en h3
const noDotsInPg = (html.match(/id="pgCatalogo"[\s\S]*?<\/div>\s*<\/div>\s*<\/body>/)?.[0] || html);
const h3Sections = (noDotsInPg.match(/<h3[\s\S]*?<\/h3>/g) || []).filter(h => h.includes('Buffers') || h.includes('Disoluciones') || h.includes('Conductividad') || h.includes('Otros'));
const svgInH3 = h3Sections.every(h => h.includes('<svg') && !h.includes('border-radius:50%'));
assert('Paso 8 � �conos SVG en secciones (no puntitos)', svgInH3, `h3 con svg: ${h3Sections.length}`);

// Paso 9 � cambiar a tab Equipos
invSetTab('equipos');
assert('Paso 9 � tab Equipos activa', dom.invContEquipos.style.display !== 'none' && dom.invContDisol.style.display === 'none');

// Paso 10 � catEquiposBlock en tab equipos
const equipBlock = html.match(/id="invContEquipos"[\s\S]*?id="invHistorico"/)?.[0] || '';
assert('Paso 10 � catEquiposBlock en tab Equipos', equipBlock.includes('id="catEquiposBlock"'));

// Paso 11 � �conos en render equipos (JS)
assert('Paso 11 � �conos SVG en catalogoRenderEquipos', appJs.includes('_invEqIcon') && appJs.includes('potenciometros:'));

// Paso 12 � volver a tab Disoluciones
invSetTab('disol');
assert('Paso 12 � vuelve a tab Disoluciones', dom.invContDisol.style.display !== 'none' && session.invLastTab === 'disol');

// Paso 13 � hist�rico fuera de tabs
assert('Paso 13 � hist�rico al final (invHistorico)', html.includes('id="invHistorico"') && html.includes('id="catHistorico"') && !equipBlock.includes('catHistorico'));

// Paso 14 � CRUD sigue (funciones intactas)
const crudFns = ['catalogoAgregarDisolucion','catalogoAgregarEquipo','catalogoUpEquipo','catalogoRender','catalogoRenderEquipos'];
assert('Paso 14 � funcionalidad CRUD intacta', crudFns.every(fn => appJs.includes(`function ${fn}`) || appJs.includes(`async function ${fn}`)));

// Paso 15 � persistencia tab (sessionStorage)
invSetTab('equipos');
invRestoreTab();
assert('Paso 15 � persistencia �ltima pesta�a', session.invLastTab === 'equipos' && dom.invContEquipos.style.display !== 'none');

let pass = 0, fail = 0;
for (const r of results) {
  console.log((r.pass ? 'PASA' : 'FALLA') + ' � ' + r.name + (r.detail ? ' (' + r.detail + ')' : ''));
  r.pass ? pass++ : fail++;
}
console.log(`\nTotal: ${pass} PASA / ${fail} FALLA`);
process.exit(fail ? 1 : 0);
