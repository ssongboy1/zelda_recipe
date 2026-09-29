// node test/finder.test.js
const assert = require('assert');
const D = require('../js/data.js');
const { cook } = require('../js/cook.js');
const F = require('../js/finder.js');

const id = (game, en) => D.GAMES[game].materials.find((m) => m.en === en).id;

for (const game of ['botw', 'totk']) {
  // 파워 Lv3 조합: 모두 실제로 파워 Lv3 이상이어야 하고, 용의 소재를 쓰지 않아야 한다
  const lv3 = F.findByEffect(game, { type: 'AttackUp', minLevel: 3 });
  assert.ok(lv3.length > 0, `${game}: 파워 Lv3 조합 없음`);
  for (const f of lv3) {
    const r = cook(f.ids, game);
    assert.strictEqual(r.effect.type, 'AttackUp');
    assert.ok(r.effect.level >= 3);
    assert.ok(r.mats.every((m) => (m.crit || 0) < 100), '용의 소재를 쓰면 안 됨');
  }
  // 용의 소재를 허용하면 30분짜리 조합이 가장 먼저 나온다
  const withDragon = F.findByEffect(game, { type: 'AttackUp', minLevel: 3, allowCrit: true });
  assert.strictEqual(withDragon[0].res.effect.seconds, 1800, `${game}: 30분 조합이 첫 번째가 아님`);
  // 물약을 빼면 벌레류가 들어가지 않는다
  for (const f of F.findByEffect(game, { type: 'AllSpeed', allowElixir: false })) {
    assert.ok(f.res.mats.every((m) => m.tag !== 'CookInsect'));
  }
  // 가진 재료로 찾기: 결과는 가진 재료만 쓴다
  const owned = ['Apple', 'Raw Meat', 'Hylian Rice', 'Rock Salt', 'Mighty Bananas', 'Bird Egg'].map((n) => id(game, n));
  const { picks, meals } = F.findFromInventory(game, owned);
  assert.ok(meals.length >= 5, `${game}: 만들 수 있는 요리가 너무 적음 (${meals.length})`);
  for (const f of [...picks, ...meals]) {
    assert.ok(f.ids.every((x) => owned.includes(x)), '가진 재료가 아닌 것이 섞임');
    assert.notStrictEqual(cook(f.ids, game).kind, 'dubious');
  }
  assert.ok(picks.some((p) => p.res.effect && p.res.effect.type === 'AttackUp'), `${game}: 파워 추천 없음`);
  console.log(`ok ${game}: 파워 Lv3 ${lv3.length}개, 가진 재료로 요리 ${meals.length}가지 · 추천 ${picks.length}개`);
}
console.log('finder tests passed');
