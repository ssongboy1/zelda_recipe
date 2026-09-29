// 무작위 재료 조합으로 이 앱의 계산 결과를 공개 참조 구현과 비교한다 (개발용).
// 사용법: node tools/verify.mjs <savage13/cooking 경로> <TOTK-Cooking-Calculator 경로> [조합 수]
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require('../js/data.js');
const { cook } = require('../js/cook.js');
const D = globalThis.ZDATA;

const [botwDir, totkDir, nArg] = process.argv.slice(2);
const N = Number(nArg || 5000);

// 재현 가능한 난수
let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

function combos(game) {
  const mats = D.GAMES[game].materials;
  const food = mats.filter((m) => !['CookEnemy', 'CookInsect', 'CookOre'].includes(m.tag));
  const out = [];
  for (let i = 0; i < N; i++) {
    const n = 1 + Math.floor(rand() * 5);
    // 절반은 식재료만, 나머지는 아무 재료나 (물약 · 실패 경우 포함)
    const pool = rand() < 0.5 ? food : mats;
    const c = [];
    for (let j = 0; j < n; j++) {
      // 같은 재료를 반복해서 넣는 경우도 자주 나오도록
      c.push(j > 0 && rand() < 0.3 ? c[j - 1] : pool[Math.floor(rand() * pool.length)]);
    }
    out.push(c);
  }
  return out;
}

function mine(game, c) {
  const r = cook(c.map((m) => m.id), game);
  const e = r.effect;
  let level = null;
  if (e) {
    if (e.extraHearts != null) level = e.extraHearts * 4;
    else if (e.gloomHearts != null) level = e.gloomHearts * 4;
    else if (e.wheels != null) level = Math.round(e.wheels * 5);
    else level = e.level;
  }
  return {
    meal: r.kind === 'dubious' ? 'Dubious Food' : r.recipe.en,
    effect: e ? e.type : null,
    level,
    time: e && e.seconds != null ? e.seconds : null,
    hp: r.fullRecovery && (!e || e.type !== 'LifeMaxUp') ? 120 : (e && e.type === 'LifeMaxUp' ? null : r.hp),
    crit: r.kind === 'dubious' || r.kind === 'rockhard' ? null : r.crit,
  };
}

const TIMED = new Set(['AttackUp', 'DefenseUp', 'AllSpeed', 'QuietnessUp', 'ResistCold', 'ResistHot', 'ResistElectric', 'ResistBurn',
  'LightEmission', 'NotSlippy', 'SwimSpeedUp', 'AttackUpHot', 'AttackUpCold', 'AttackUpThunderstorm', 'MiasmaGuard']);

function compare(game, list, refs, norm) {
  const diffs = {};
  let bad = 0;
  list.forEach((c, i) => {
    const a = mine(game, c);
    const b = norm(refs[i], c);
    const keys = Object.keys(a).filter((k) => b[k] !== undefined && JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    if (keys.length) {
      bad++;
      for (const k of keys) {
        (diffs[k] = diffs[k] || []).push(`${c.map((m) => m.en).join(' + ')} → mine ${JSON.stringify(a[k])} / ref ${JSON.stringify(b[k])} (${a.meal})`);
      }
    }
  });
  console.log(`\n== ${game}: ${list.length} combos, ${bad} differ`);
  for (const [k, v] of Object.entries(diffs)) {
    console.log(`  [${k}] ${v.length}`);
    v.slice(0, 6).forEach((s) => console.log('     ', s));
  }
}

// ---- 왕국의 눈물
if (totkDir) {
  const list = combos('totk');
  const refs = JSON.parse(execFileSync('python3', [path.join(here, 'totk_reference.py'), totkDir],
    { input: JSON.stringify(list.map((c) => c.map((m) => m.en))), maxBuffer: 1 << 28 }).toString());
  compare('totk', list, refs, (r, c) => {
    const failed = ['Dubious Food', 'Rock-Hard Food'].includes(r.meal);
    const effect = failed || r.meal === 'Fairy Tonic' ? null : r.effect;
    return {
      meal: r.meal === 'Rock-Hard Food' ? 'Rock-Hard Food' : r.meal,
      effect,
      level: effect ? r.level : null,
      time: effect && TIMED.has(effect) ? r.time : null,
      hp: effect === 'LifeMaxUp' ? null : (r.hp >= 120 ? 120 : r.hp),
      crit: failed ? null : Math.min(100, r.crit),
    };
  });
}

// ---- 야생의 숨결
if (botwDir) {
  const { CookingData } = await import(path.join(path.resolve(botwDir), 'bundle.js'));
  const pot = new CookingData();
  const list = combos('botw');
  const refs = list.map((c) => pot.cook(c.map((m) => m.en)));
  const ALIAS = { MovingSpeed: 'AllSpeed', Quietness: 'QuietnessUp', Fireproof: 'ResistBurn', GutsRecover: 'StaminaRecover', ExGutsMaxUp: 'ExStaminaMaxUp' };
  compare('botw', list, refs, (r) => {
    let meal = r.name;
    if (/Elixir$/.test(meal)) meal = 'Elixir';
    const effect = r.effect && r.effect !== 'None' ? (ALIAS[r.effect] || r.effect) : null;
    let level = null;
    if (effect === 'LifeMaxUp') level = r.level * 4;
    else if (effect === 'StaminaRecover') level = Math.round(r.stamina * 5);
    else if (effect === 'ExStaminaMaxUp') level = Math.round(r.stamina_extra * 5);
    else if (effect) level = r.level;
    const failed = meal === 'Dubious Food' || meal === 'Rock-Hard Food';
    return {
      meal, effect: failed ? null : effect, level: failed ? null : level,
      time: r.time_sec != null && !failed ? r.time_sec : null,
      // 몬스터엑기스가 든 요정의 활력수는 회복량이 무작위라 참조 구현은 최댓값을 보여준다
      hp: effect === 'LifeMaxUp' || (meal === 'Fairy Tonic' && r.items.includes('Monster Extract')) ? undefined : Math.min(120, r.hp),
      // 몬스터엑기스가 들어가면 대성공이 나지 않는다 (이 앱은 0%로 표시)
      crit: failed ? null : r.items.includes('Monster Extract') ? 0 : Math.min(100, r.crit_rate),
    };
  });
}
