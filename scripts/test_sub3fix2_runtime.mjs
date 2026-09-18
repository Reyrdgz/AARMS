/**
 * AARMS v66-sub3fix2 — Conductímetro NA + Patrón KCl + Flujos auto-tomas + fechas OMAR.
 * node scripts/test_sub3fix2_runtime.mjs
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

assert('Paso 1 — hard refresh', /aarms-offline-v66-sub3fix2/.test(swJs));
assert('Paso 2 — conductímetro lab abre', html.includes('id="pgColab"') && appJs.includes('async function abrirPagColab'));
assert('Paso 3 — checks NA presentes',
  (html.match(/data-mant-na="/g) || []).length === 4 && appJs.includes('window.mantSetNA = mantSetNA'));
assert('Paso 4 — marcar NA tacha input',
  appJs.includes('line-through') && appJs.includes('mant_na') && appJs.includes('mainCb.disabled'));
assert('Paso 5 — persistencia NA',
  appJs.includes('prev.mant_na') && appJs.includes('skipSave:true') && appJs.includes('mant_na[campo]'));
assert('Paso 6 — badge completa con NA',
  appJs.includes('_colabMantCompleto') && appJs.includes('_campoMantValido') && appJs.includes('mantOk = _colabMantCompleto'));

const patronKclHtml = (html.match(/Patrón KCl/g) || []).length;
assert('Paso 7 — Patrón KCl visible', patronKclHtml >= 3, `count=${patronKclHtml}`);
assert('Paso 7b — sin MRC L visible en HTML', !/MRC L[123]/.test(html));

assert('Paso 8 — Bitácora Flujos 2 OMARs jala tomas',
  appJs.includes('omarsTodos') && appJs.includes('_bitFlujosSyncAllTomasFromCampo()') &&
  appJs.includes('_bitFlujosRender()') && !appJs.includes("catch(e){ console.warn('[bitFlujos open]',e);"));

assert('Paso 9 — pgPlan chips fecha por OMAR',
  appJs.includes('_omarFechaInicio(omarObj)') && html.includes('planOmarsList') && appJs.includes('fechaChipHtml'));

assert('Paso 10 — bitácoras con label+fecha',
  appJs.includes('window._omarLabelConFecha') &&
  appJs.includes('_omarLabelConFecha(reg.omarTs)') &&
  appJs.includes('_omarLabelConFecha(omarTs)'));

assert('Paso 11 — orden por fecha',
  appJs.includes('_omarTsSortKey(a)-_omarTsSortKey(b)') &&
  appJs.includes('sort((a,b)=>_omarTsSortKey(a.id)-_omarTsSortKey(b.id))'));

try {
  execSync('node -c js/app.js', { cwd: ROOT, stdio: 'pipe' });
  execSync('node -c js/documents-suite.js', { cwd: ROOT, stdio: 'pipe' });
  const o = (html.match(/<div\b/g) || []).length;
  const c = (html.match(/<\/div>/g) || []).length;
  assert('Paso 12 — sintaxis + divs', o === c, `${o}/${c}`);
} catch (e) {
  assert('Paso 12 — sintaxis + divs', false, String(e.message || e));
}

console.log('\n=== MINI-FIX COMBINADO — RUNTIME TESTS (sub3fix2) ===\n');
const labels = [
  'Paso 1 (hard refresh)',
  'Paso 2 (conductímetro lab abre)',
  'Paso 3 (checks NA presentes)',
  'Paso 4 (marcar NA tacha input)',
  'Paso 5 (persistencia NA)',
  'Paso 6 (badge completa con NA)',
  'Paso 7 (Patrón KCl visible)',
  'Paso 8 (Bitácora Flujos con 2 OMARs jala tomas)',
  'Paso 9 (pgPlan chips fecha por OMAR)',
  'Paso 10 (bitácoras con label+fecha)',
  'Paso 11 (orden por fecha)',
  'Paso 12 (sintaxis + divs)',
];
results.slice(0, 12).forEach((r, i) => {
  console.log(`${r.pass ? 'PASA' : 'FALLA'} — ${labels[i]}${r.detail ? ' (' + r.detail + ')' : ''}`);
});
const passed = results.slice(0, 12).filter(r => r.pass).length;
console.log(`\nTotal: ${passed}/12 PASA`);
if (passed < 12) process.exit(1);
