// node test/cook.test.js
// 기대값은 나무위키 문서의 레시피 표와 예시를 기준으로 한다.
const assert = require('assert');
require('../js/data.js');
const { cook } = require('../js/cook.js');

const cases = [
  // [게임, 재료, 기대 요리 이름(한글), 추가 확인]
  ['botw', ['hylian_shroom'], '버섯 꼬치구이'],
  ['botw', ['razorshroom', 'razorshroom'], '파워 버섯 꼬치구이'],
  ['botw', ['hylian_shroom', 'stamella_shroom', 'rushroom', 'razorshroom'], '버섯구이 곱빼기'], // 효과 충돌 → 효과 없음
  ['botw', ['raw_meat', 'hylian_shroom'], '고기 꼬치구이와 버섯'],
  ['botw', ['razorclaw_crab'], '파워 해산물 꼬치구이'],
  ['botw', ['hyrule_bass'], '생선 꼬치구이'],
  ['botw', ['apple', 'tabantha_wheat', 'goat_butter', 'cane_sugar'], '애플파이'],
  ['botw', ['palm_fruit', 'tabantha_wheat', 'goat_butter', 'cane_sugar'], '프루트 파이'],
  ['botw', ['apple', 'goat_butter'], '버터 바른 사과'],
  ['botw', ['apple', 'courser_bee_honey'], '원기 꿀에 절인 사과'],
  ['botw', ['courser_bee_honey'], '원기 벌꿀 사탕'],
  ['botw', ['hylian_rice', 'goron_spice', 'raw_meat'], '짐승 고기 카레'],
  ['botw', ['hylian_rice', 'goron_spice', 'raw_prime_meat'], '상급 고기 카레'],
  ['botw', ['hylian_rice', 'goron_spice'], '카레라이스'],
  ['botw', ['hylian_rice', 'raw_meat'], '고기 주먹밥'],
  ['botw', ['hydromelon', 'voltfruit', 'hearty_radish', 'fresh_milk'], '하트 밀크수프'],
  ['botw', ['palm_fruit', 'hydromelon', 'voltfruit', 'rock_salt'], '과일전골'], // 브아이 밋 브오이는 왕눈 신규
  ['totk', ['palm_fruit', 'hydromelon', 'voltfruit', 'rock_salt'], '브아이 밋 브오이'],
  ['botw', ['hylian_rice', 'mighty_porgy', 'hearty_blueshell_snail', 'goat_butter', 'rock_salt'], '해물 파에야'],
  ['totk', ['hylian_rice', 'mighty_porgy', 'razorclaw_crab', 'goat_butter', 'rock_salt'], '파워 해물 파에야'],
  ['botw', ['fortified_pumpkin', 'raw_meat'], '튼튼 고기를 넣은 호박'],
  ['botw', ['fresh_milk', 'rock_salt', 'swift_carrot'], '고고 야채 크림수프'],
  ['botw', ['hightail_lizard', 'bokoblin_horn'], '고고 물약'],
  ['botw', ['hightail_lizard', 'bokoblin_horn', 'rushroom'], '고고 물약'], // 같은 효과 식재료는 추가 가능
  ['totk', ['fleet_lotus_seeds', 'hightail_lizard'], '애매한 요리'],       // 몬스터 부위 없음
  ['botw', ['raw_meat', 'bokoblin_horn'], '애매한 요리'],
  ['totk', ['raw_meat', 'bokoblin_horn'], '애매한 요리'],
  ['botw', ['apple', 'amber'], '너무 딱딱한 요리'],
  ['botw', ['fairy'], '요정의 활력수'],
  ['botw', ['bird_egg'], '오믈렛'],
  ['botw', ['fresh_milk'], '핫밀크'],
  ['botw', ['raw_meat', 'spicy_pepper'], '화끈 스파이시 고기구이'],
  ['botw', ['spicy_pepper', 'spicy_pepper'], '화끈 따끈따끈볶음'],
  ['totk', ['spicy_pepper', 'apple'], '화끈 과일전골'],
  ['botw', ['hearty_durian', 'apple'], '맥스 과일전골'],
  ['botw', ['hylian_rice', 'raw_whole_bird', 'bird_egg', 'goat_butter'], '특급 치킨 필래프'],
  ['botw', ['raw_gourmet_meat', 'rock_salt'], '특급 고기 소금구이'],
  ['botw', ['rock_salt'], '애매한 요리'],
  ['botw', ['rock_salt', 'rock_salt', 'apple'], '애매한 요리'], // 암염이 더 많음
  ['botw', ['monster_extract', 'hylian_rice', 'rock_salt'], '몬스터 주먹밥'],
  ['totk', ['monster_extract', 'hylian_rice', 'rock_salt'], '몬스터 주먹밥'],
  ['totk', ['hylian_tomato', 'hateno_cheese', 'tabantha_wheat'], '토마토 피자'],
  ['totk', ['hylian_tomato'], '토마토전골'],
  ['totk', ['hylian_tomato', 'apple'], '과일전골'],
  ['totk', ['stambulb'], '원기 통구이'],
  ['totk', ['stambulb', 'hyrule_herb'], '원기 야채구이'],
  ['totk', ['stambulb', 'goat_butter'], '원기 버터볶음'],
  ['totk', ['raw_bird_thigh', 'oil_jar'], '오일 상급 새 고기 튀김'],
  ['totk', ['sundelion', 'sundelion', 'hylian_tomato', 'hylian_tomato', 'hylian_tomato'], '정화 야채 토마토찜'],
  ['totk', ['brightcap', 'brightcap'], '등불 버섯 꼬치구이'],
  ['totk', ['sticky_lizard', 'chuchu_jelly'], '논슬립 물약'],
  ['totk', ['dark_clump', 'hylian_rice', 'goron_spice'], '항독 마인 카레'],
  ['totk', ['wildberry', 'mighty_bananas', 'tabantha_wheat', 'cane_sugar'], '파워 프루트케이크'],
  ['totk', ['palm_fruit', 'mighty_bananas', 'tabantha_wheat', 'cane_sugar'], '파워 튀긴 바나나'],
  ['totk', ['hearty_truffle', 'big_hearty_truffle'], '맥스 버섯 꼬치구이', (r) => r.effect.extraHearts === 5],
  ['totk', ['hearty_truffle', 'endura_carrot'], '버섯쌈구이'],
  // 하이랄토마토 + 칼날바나나 → 하트 3칸, 공격력 Lv1, 80초
  ['totk', ['hylian_tomato', 'mighty_bananas'], '파워 과일전골', (r) => r.hp === 12 && r.effect.level === 1 && r.effect.seconds === 80],
  // 칼날바나나 4개 → 공격력 Lv3
  ['totk', ['mighty_bananas', 'mighty_bananas', 'mighty_bananas', 'mighty_bananas'], '파워 과일전골', (r) => r.effect.level === 3],
  // 칼날바나나 4개 + 용의 뿔 → 30분
  ['totk', ['mighty_bananas', 'mighty_bananas', 'mighty_bananas', 'mighty_bananas', 'dinraal_horn'], '파워 과일전골', (r) => r.effect.seconds === 1800],
];

let fail = 0;
for (const [game, ids, want, check] of cases) {
  const r = cook(ids, game);
  const got = r && r.ko;
  const ok = got === want && (!check || check(r));
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} [${game}] ${ids.join(' + ')} → ${got}${ok ? '' : ` (기대: ${want})`}`);
}
assert.strictEqual(fail, 0, `${fail} case(s) failed`);
console.log(`all ${cases.length} passed`);
