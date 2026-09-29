// node test/cook.test.js
const assert = require('assert');
require('../js/data.js');
const { cook } = require('../js/cook.js');

const cases = [
  ['botw', ['hylian_shroom'], 'Mushroom Skewer'],
  ['botw', ['razorshroom', 'razorshroom'], 'Mighty Mushroom Skewer'],
  ['botw', ['hylian_shroom', 'stamella_shroom', 'rushroom', 'razorshroom'], 'Copious Mushroom Skewers'], // 효과 충돌 → 효과 없음
  ['botw', ['hylian_shroom', 'skyshroom'], 'Mushroom Skewer'], // skyshroom 은 야숨에 없음 → 무시
  ['botw', ['hylian_shroom', 'chillshroom', 'sunshroom', 'zapshroom'], 'Copious Mushroom Skewers'],
  ['botw', ['raw_meat', 'hylian_shroom'], 'Meat and Mushroom Skewer'],
  ['botw', ['apple', 'tabantha_wheat', 'goat_butter', 'cane_sugar'], 'Apple Pie'],
  ['botw', ['apple', 'goat_butter'], 'Hot Buttered Apple'],
  ['botw', ['apple', 'courser_bee_honey'], 'Energizing Honeyed Apple'],
  ['botw', ['courser_bee_honey'], 'Energizing Honey Candy'],
  ['botw', ['hylian_rice', 'goron_spice', 'raw_meat'], 'Meat Curry'],
  ['botw', ['hylian_rice', 'goron_spice'], 'Curry Rice'],
  ['botw', ['hydromelon', 'voltfruit', 'hearty_radish', 'fresh_milk'], 'Creamy Heart Soup'],
  ['botw', ['palm_fruit', 'hydromelon', 'voltfruit', 'rock_salt'], 'Noble Pursuit'],
  ['botw', ['hylian_rice', 'mighty_porgy', 'hearty_blueshell_snail', 'goat_butter', 'rock_salt'], 'Seafood Paella'],
  ['botw', ['hightail_lizard', 'bokoblin_horn'], 'Hasty Elixir'],
  ['botw', ['hightail_lizard', 'apple'], 'Dubious Food'],
  ['botw', ['raw_meat', 'bokoblin_horn'], 'Dubious Food'],
  ['totk', ['raw_meat', 'bokoblin_horn'], 'Meat Skewer'],
  ['botw', ['apple', 'amber'], 'Rock-Hard Food'],
  ['botw', ['fairy'], 'Fairy Tonic'],
  ['botw', ['bird_egg'], 'Omelet'],
  ['botw', ['fresh_milk'], 'Warm Milk'],
  ['botw', ['raw_meat', 'spicy_pepper'], 'Spicy Pepper Steak'],
  ['botw', ['spicy_pepper', 'spicy_pepper'], 'Spicy Sautéed Peppers'],
  ['botw', ['hearty_durian', 'apple'], 'Hearty Simmered Fruit'],
  ['botw', ['hylian_rice', 'raw_whole_bird', 'bird_egg', 'goat_butter'], 'Gourmet Poultry Pilaf'],
  ['botw', ['raw_gourmet_meat', 'rock_salt'], 'Salt-Grilled Gourmet Meat'],
  ['totk', ['hylian_tomato', 'hateno_cheese', 'tabantha_wheat'], 'Hylian Tomato Pizza'],
  ['totk', ['brightcap', 'brightcap'], 'Bright Mushroom Skewer'],
  ['totk', ['sticky_lizard', 'chuchu_jelly'], 'Sticky Elixir'],
  ['botw', ['monster_extract', 'hylian_rice', 'rock_salt'], 'Monster Rice Balls'],
  ['botw', ['rock_salt'], 'Dubious Food'],
];

let fail = 0;
for (const [game, ids, want] of cases) {
  const r = cook(ids, game);
  const got = r && r.en;
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} [${game}] ${ids.join(' + ')} → ${got}${ok ? '' : ` (기대: ${want})`}`);
}
const m = cook(['razorshroom', 'razorshroom', 'razorshroom', 'razorshroom', 'razorshroom'], 'botw');
console.log('5x razorshroom:', m.effect.level, m.effect.seconds, m.hp);
assert.strictEqual(fail, 0, `${fail} case(s) failed`);
console.log('all passed');
