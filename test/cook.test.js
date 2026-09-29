// node test/cook.test.js
// 나무위키 문서의 레시피 표와 예시를 기준으로 한 확인용 테스트
const assert = require('assert');
const D = require('../js/data.js');
const { cook } = require('../js/cook.js');

const ids = (game, names) => names.map((n) => {
  const m = D.GAMES[game].materials.find((x) => x.en === n);
  if (!m) throw new Error(`${game}: 재료 없음 ${n}`);
  return m.id;
});

const cases = [
  // [게임, 재료(영어), 기대 요리 이름(한글), 추가 확인]
  ['botw', ['Hylian Shroom'], '버섯 꼬치구이'],
  ['botw', ['Razorshroom', 'Razorshroom'], '파워 버섯 꼬치구이'],
  ['botw', ['Hylian Shroom', 'Stamella Shroom', 'Rushroom', 'Razorshroom'], '버섯구이 곱빼기'], // 효과 충돌 → 효과 없음
  ['botw', ['Raw Meat', 'Hylian Shroom'], '고기 꼬치구이와 버섯'],
  ['botw', ['Apple', 'Tabantha Wheat', 'Goat Butter', 'Cane Sugar'], '애플파이'],
  ['botw', ['Apple', 'Goat Butter'], '버터 바른 사과'],
  ['botw', ['Courser Bee Honey'], '원기 벌꿀 사탕'],
  ['botw', ['Hylian Rice', 'Goron Spice', 'Raw Prime Meat'], '상급 고기 카레'],
  ['botw', ['Hydromelon', 'Voltfruit', 'Hearty Radish', 'Fresh Milk'], '하트 밀크수프'],
  ['botw', ['Hightail Lizard', 'Bokoblin Horn'], '고고 물약'],
  ['botw', ['Raw Meat', 'Bokoblin Horn'], '애매한 요리'],
  ['botw', ['Apple', 'Amber'], '너무 딱딱한 요리'],
  ['botw', ['Fairy'], '요정의 활력수'],
  ['botw', ['Hearty Durian', 'Apple'], '맥스 과일전골'],
  ['botw', ['Monster Extract', 'Hylian Rice', 'Rock Salt'], '몬스터 주먹밥'],
  ['totk', ['Palm Fruit', 'Hydromelon', 'Voltfruit', 'Rock Salt'], '브아이 밋 브오이'],
  ['totk', ['Fleet-Lotus Seeds', 'Hightail Lizard'], '애매한 요리'], // 몬스터 부위 없음
  ['totk', ['Raw Meat', 'Bokoblin Horn'], '애매한 요리'],
  ['totk', ['Hylian Tomato', 'Hateno Cheese', 'Tabantha Wheat'], '토마토 피자'],
  ['totk', ['Stambulb', 'Goat Butter'], '원기 버터볶음'],
  ['totk', ['Sticky Lizard', 'Chuchu Jelly'], '논슬립 물약'],
  // 칼날바나나 대신 넣어도 사과나 딸기 중 하나는 있어야 프루트케이크 (나무위키 각주)
  ['totk', ['Wildberry', 'Mighty Bananas', 'Tabantha Wheat', 'Cane Sugar'], '파워 프루트케이크'],
  // 하이랄토마토 + 칼날바나나 → 하트 3칸, 파워 Lv1, 1:20 (나무위키 예시)
  ['totk', ['Hylian Tomato', 'Mighty Bananas'], '파워 과일전골', (r) => r.hp === 12 && r.effect.level === 1 && r.effect.seconds === 80],
  // 칼날바나나 4개 → 파워 Lv3
  ['totk', ['Mighty Bananas', 'Mighty Bananas', 'Mighty Bananas', 'Mighty Bananas'], '파워 과일전골', (r) => r.effect.level === 3],
  // 맥스트러플(+1) + 큰맥스트러플(+4) → 노란 하트 +5
  ['totk', ['Hearty Truffle', 'Big Hearty Truffle'], '맥스 버섯 꼬치구이', (r) => r.effect.extraHearts === 5],
  // 칼날바나나 4개 + 용의 뿔 → 30분, 대성공 확정
  ['totk', ['Mighty Bananas', 'Mighty Bananas', 'Mighty Bananas', 'Mighty Bananas', "Dinraal's Horn"], '파워 과일전골', (r) => r.effect.seconds === 1800 && r.crit === 100],
];

let fail = 0;
for (const [game, names, want, check] of cases) {
  const r = cook(ids(game, names), game);
  const got = r && r.ko;
  const ok = got === want && (!check || check(r));
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} [${game}] ${names.join(' + ')} → ${got}${ok ? '' : ` (기대: ${want})`}`);
}
assert.strictEqual(fail, 0, `${fail} case(s) failed`);
console.log(`all ${cases.length} passed`);
