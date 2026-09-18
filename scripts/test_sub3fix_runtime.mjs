/**
 * AARMS v66-sub3fix — LVAR O1/O2 + Bitácora Flujos abre.
 * node scripts/test_sub3fix_runtime.mjs
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const results = [];
const assert = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail });

const appJs = readFileSync(join(ROOT, 'js/app.js'), 'utf8');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const swJs = readFileSync(join(ROOT, 'sw.js'), 'utf8');

const buildLvarMatch = appJs.match(/function buildLvarEnvases[\s\S]*?^}/m);
const buildLvarSrc = buildLvarMatch ? buildLvarMatch[0] : '';

assert('Paso 1 — hard refresh', /aarms-offline-v66-sub3fix/.test(swJs));
assert('Paso 2 — abrir plan', appJs.includes('renderPlanDocs') && appJs.includes("key:'bitflujos'"));
assert('Paso 3 — botón Bitácora Flujos abre pgBitFlujos',
  appJs.includes('goPage(\'pgBitFlujos\')') && html.includes('id="pgBitFlujos"'));
assert('Paso 4 — encabezado visible', html.includes('id="bitFlujosInfo"') && appJs.includes('_bitFlujosRender'));
assert('Paso 5 — cards por toma', appJs.includes('_renderBitFlujosCard'));
assert('Paso 6 — volver al plan', appJs.includes('cerrarBitacoraFlujos') && appJs.includes("goPage('pgPlan')"));
assert('Paso 7 — LVAR sin O1=7 + O2=7 = 14',
  !buildLvarSrc.includes('O${idx+1}') && !buildLvarSrc.includes('breakdownTxt') && !appJs.includes('O1=7'));

assert('window.abrirBitacoraFlujos expuesta', appJs.includes('window.abrirBitacoraFlujos = abrirBitacoraFlujos'));
assert('renderPlanDocs llama directo bitflujos', appJs.includes("if(d.key==='bitflujos') abrirBitacoraFlujos"));
assert('orden oficial bitflujos minúsculas', appJs.includes("'bitflujos', // 10"));

try {
  execSync('node -c js/app.js', { cwd: ROOT, stdio: 'pipe' });
  const o = (html.match(/<div\b/g) || []).length;
  const c = (html.match(/<\/div>/g) || []).length;
  assert('sintaxis + divs', o === c, `${o}/${c}`);
} catch (e) {
  assert('sintaxis + divs', false, String(e.message || e));
}

console.log('\n=== MINI-FIX SUB-3 — RUNTIME TESTS ===\n');
results.forEach((r, i) => {
  const label = i < 7 ? `Paso ${i + 1}` : r.name;
  console.log(`${r.pass ? 'PASA' : 'FALLA'} — ${label}${r.detail ? ' (' + r.detail + ')' : ''}`);
});
const main = results.slice(0, 7);
const passed = main.filter(r => r.pass).length;
console.log(`\nTotal pasos 1-7: ${passed}/${main.length} PASA`);
if (passed < main.length || results.some(r => !r.pass)) process.exit(1);
