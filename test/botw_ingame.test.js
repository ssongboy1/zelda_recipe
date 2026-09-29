// node test/botw_ingame.test.js
// 야생의 숨결에서 실제로 요리해 확인한 결과(test/fixtures/botw_ingame.json)와 비교한다.
const assert = require('assert');
const cases = require('./fixtures/botw_ingame.json');
const D = require('../js/data.js');
const { cook } = require('../js/cook.js');

const byEn = Object.fromEntries(D.GAMES.botw.materials.map((m) => [m.en, m.id]));
const ALIAS = { MovingSpeed: 'AllSpeed', Quietness: 'QuietnessUp', Fireproof: 'ResistBurn', GutsRecover: 'StaminaRecover', ExGutsMaxUp: 'ExStaminaMaxUp' };
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

let fail = 0;
for (const c of cases) {
  const r = cook(c.ingredients.map((n) => byEn[n]), 'botw');
  const problems = [];
  const name = r.kind === 'elixir' ? r.en : r.kind === 'dubious' ? 'Dubious Food' : r.recipe.en;
  if (name !== c.name) problems.push(`name ${name} ≠ ${c.name}`);

  const e = r.effect;
  const want = c.effect && c.effect !== 'None' ? ALIAS[c.effect] || c.effect : null;
  if (c.effect !== undefined && (e ? e.type : null) !== want) problems.push(`effect ${e && e.type} ≠ ${want}`);
  if (e && want === e.type) {
    if (e.type === 'LifeMaxUp') {
      if (c.level != null && e.extraHearts !== c.level) problems.push(`extra hearts ${e.extraHearts} ≠ ${c.level}`);
    } else if (e.type === 'StaminaRecover') {
      if (c.stamina != null && e.wheels !== c.stamina) problems.push(`stamina ${e.wheels} ≠ ${c.stamina}`);
    } else if (e.type === 'ExStaminaMaxUp') {
      if (c.stamina_extra != null && e.wheels !== c.stamina_extra) problems.push(`extra stamina ${e.wheels} ≠ ${c.stamina_extra}`);
    } else {
      if (c.level != null && e.level !== c.level) problems.push(`level ${e.level} ≠ ${c.level}`);
      if (c.time && mmss(e.seconds) !== c.time) problems.push(`time ${mmss(e.seconds)} ≠ ${c.time}`);
    }
  }
  // 맥스 요리는 체력 완전 회복이라 회복량을 비교하지 않는다
  if (c.hp != null && !(e && e.type === 'LifeMaxUp') && Math.min(r.hp, 120) !== c.hp) problems.push(`hp ${r.hp} ≠ ${c.hp}`);

  if (problems.length) {
    fail++;
    if (fail <= 25) console.log(`FAIL ${c.ingredients.join(' + ')}: ${problems.join(', ')}`);
  }
}
console.log(`${cases.length - fail} / ${cases.length} match`);
assert.strictEqual(fail, 0);
