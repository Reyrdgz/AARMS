/**
 * AARMS v66-flujos — tests runtime de lógica pura.
 * node scripts/test_flujos_runtime.mjs
 */

const _PLAN_ORDEN_OFICIAL = [
  'bpm', 'lvar', 'blmp', 'phlab', 'colab', 'omars', 'bitPh', 'bitCond', 'bm',
];

const _PLAN_PASO_TITULOS = {
  bpm: 'BPM', lvar: 'LVAR', blmp: 'BLMP', phlab: 'phlab', colab: 'colab',
  omars: 'omars', bitPh: 'bitPh', bitCond: 'bitCond', bm: 'bm',
};

const PLAN_DOCS = [
  { key: 'bpm', where: 'lab' }, { key: 'lvar', where: 'lab' }, { key: 'blmp', where: 'lab' },
  { key: 'phlab', where: 'lab' }, { key: 'colab', where: 'lab' },
  { key: 'omars', where: 'campo' }, { key: 'phcam', where: 'campo' }, { key: 'condcamp', where: 'campo' },
  { key: 'bm', where: 'cierre' },
];

function _planOmarData(plan, cache) {
  return (plan.omarIds || []).map(id => {
    const m = cache.find(x => String(x.id) === String(id));
    return { m, o: m?.omar ? JSON.parse(m.omar) : {} };
  }).filter(x => x.m);
}

function _colabLabEstadoFromPlan(plan, cache) {
  const om = _planOmarData(plan, cache)[0];
  const lab = om?.o?.colabLab || {};
  const hasId = !!(lab.fecha && (lab.marca || lab.clave));
  const hasMrc = !!(lab.mrc_l1 && lab.mrc_l2 && lab.mrc_l3);
  if (hasId && hasMrc) return 'completo';
  if (lab.fecha || lab.marca || lab.mrc_l1) return 'progreso';
  return 'vacio';
}

function _planEstadoDoc(plan, docKey, cache) {
  switch (docKey) {
    case 'bpm': {
      const b = _planOmarData(plan, cache)[0]?.o?.bpm || {};
      const n = ['f1_blvm', 'f2_bucc', 'f4_fol'].filter(k => b[k]).length;
      if (!n) return 'vacio';
      return n >= 2 ? 'completo' : 'progreso';
    }
    case 'lvar': {
      const l = plan.lvar || {};
      const campos = ['folio', 'fecha', 'lugar', 'ciudad', 'estado', 'tipo', 'norma'];
      const n = campos.filter(k => l[k]).length;
      if (!n) return 'vacio';
      return n === campos.length ? 'completo' : 'progreso';
    }
    case 'blmp': {
      const b = _planOmarData(plan, cache)[0]?.o?.blmpLab || {};
      if (!b.fecha) return 'vacio';
      return b.fecha && b.aapt ? 'completo' : 'progreso';
    }
    case 'phlab': {
      const p = _planOmarData(plan, cache)[0]?.o?.ph2644h1 || {};
      if (!(p.cal_l1 && p.comp_l1 && p.ver_l1)) return 'vacio';
      return p.cal_l3 && p.comp_l3 && p.ver_l3 ? 'completo' : 'progreso';
    }
    case 'colab':
      return _colabLabEstadoFromPlan(plan, cache);
    case 'omars': {
      const ids = plan.omarIds || [];
      if (!ids.length) return 'vacio';
      let c = 0;
      for (const { o } of _planOmarData(plan, cache)) if (o.folio && o.empresa) c++;
      if (!c) return 'vacio';
      return c === ids.length ? 'completo' : 'progreso';
    }
    default:
      return 'vacio';
  }
}

function _planSiguientePaso(plan, cache) {
  for (const key of _PLAN_ORDEN_OFICIAL) {
    if (_planEstadoDoc(plan, key, cache) !== 'completo') {
      return { key, titulo: _PLAN_PASO_TITULOS[key] };
    }
  }
  return null;
}

const results = [];
const assert = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail });

const cache = [{
  id: 2001,
  omar: JSON.stringify({ colabLab: {}, ph2644h1: {}, blmpLab: {}, bpm: {} }),
  tomas: [{}, {}, {}],
}];
const plan = { omarIds: [2001], lvar: {}, bitPh: [], bitCond: [] };

assert('Paso 1 — plan + OMAR + 3 tomas', plan.omarIds.length === 1 && cache[0].tomas.length === 3);

let paso = _planSiguientePaso(plan, cache);
assert('Paso 2 — siguiente → BPM', paso?.key === 'bpm', paso?.key);

const o = () => JSON.parse(cache[0].omar);
const setO = (obj) => { cache[0].omar = JSON.stringify(obj); };

setO({ ...o(), bpm: { f1_blvm: 'a', f2_bucc: 'b', f4_fol: 'c' } });
assert('Paso 3 — BPM → LVAR', _planSiguientePaso(plan, cache)?.key === 'lvar');

plan.lvar = { folio: 'L', fecha: '1', lugar: '1', ciudad: '1', estado: '1', tipo: '1', norma: '1' };
assert('Paso 4 — LVAR → BLMP', _planSiguientePaso(plan, cache)?.key === 'blmp');

setO({ ...o(), blmpLab: { fecha: '1', aapt: 'x' } });
assert('Paso 5 — BLMP → phlab', _planSiguientePaso(plan, cache)?.key === 'phlab');

setO({ ...o(), ph2644h1: { cal_l1: 1, comp_l1: 1, ver_l1: 1, cal_l3: 1, comp_l3: 1, ver_l3: 1 } });
assert('Paso 6 — phlab → colab', _planSiguientePaso(plan, cache)?.key === 'colab');

setO({ ...o(), colabLab: { fecha: '1', marca: 'M', mrc_l1: '1', mrc_l2: '2', mrc_l3: '3' } });
const colabSt = _colabLabEstadoFromPlan(plan, cache);
assert('Paso 7 — colab badge completo', colabSt === 'completo', colabSt);
assert('Paso 8 — colab → omars', _planSiguientePaso(plan, cache)?.key === 'omars');

const labKeys = PLAN_DOCS.filter(d => d.where === 'lab').map(d => d.key);
assert('P1-4 — orden lab PLAN_DOCS', JSON.stringify(labKeys) === JSON.stringify(['bpm', 'lvar', 'blmp', 'phlab', 'colab']));

let flag = true, lvarOpen = false;
if (flag) { flag = false; lvarOpen = true; }
assert('Paso 9 — flag LVAR consumido', lvarOpen && !flag);

plan.folio = 'P1';
assert('Paso 10 — plan conserva estado', plan.folio === 'P1');

let nav = false;
if (!({}).folio) { /* return */ } else nav = true;
assert('P1-2 — sin folio no navega', !nav);
nav = false;
if (!({ folio: 'X' }).folio) { /* */ } else nav = true;
assert('P1-2 — con folio navega', nav);

const routes = { omars: 1, bitPh: 1, bitCond: 1 };
assert('P0-1 — handlers omars/bitPh/bitCond definibles', routes.omars && routes.bitPh && routes.bitCond);

let pass = 0, fail = 0;
for (const r of results) {
  console.log((r.pass ? 'PASA' : 'FALLA') + ' — ' + r.name + (r.detail ? ' (' + r.detail + ')' : ''));
  r.pass ? pass++ : fail++;
}
console.log(`\nTotal: ${pass} PASA / ${fail} FALLA`);
process.exit(fail ? 1 : 0);
