// 젤다의 전설 야생의 숨결(BotW) / 왕국의 눈물(TotK) 요리 데이터
// hp: 날것 기준 회복량(1/4 하트 단위). 요리하면 2배가 된다.
// eff: 효과 종류, pot: 효과 포인트, time: 효과 시간에 더해지는 초
// g: 등장 게임 (생략 시 두 게임 모두)
(function (root) {
  const B = ['botw'];
  const T = ['totk'];

  // ---------------------------------------------------------------- 효과
  const EFFECTS = {
    hearty:     { ko: '하트 최대치 증가', en: 'Hearty',     icon: '💛' },
    energizing: { ko: '기력 회복',       en: 'Energizing', icon: '🟢' },
    enduring:   { ko: '기력 최대치 증가', en: 'Enduring',   icon: '🟡' },
    attack:     { ko: '공격력 업',       en: 'Mighty',     icon: '⚔️', time: 50,  lv: [5, 7] },
    defense:    { ko: '방어력 업',       en: 'Tough',      icon: '🛡️', time: 50,  lv: [5, 7] },
    speed:      { ko: '이동속도 업',     en: 'Hasty',      icon: '👟', time: 60,  lv: [5, 7] },
    stealth:    { ko: '은밀성 업',       en: 'Sneaky',     icon: '🌙', time: 120, lv: [6, 9] },
    cold:       { ko: '추위 저항',       en: 'Spicy',      icon: '🔥', time: 150, lv: [6] },
    heat:       { ko: '더위 저항',       en: 'Chilly',     icon: '❄️', time: 150, lv: [6] },
    shock:      { ko: '전기 저항',       en: 'Electro',    icon: '⚡', time: 150, lv: [4, 6] },
    fire:       { ko: '불꽃 저항',       en: 'Fireproof',  icon: '🧯', time: 120, lv: [7] },
    bright:     { ko: '발광',           en: 'Bright',     icon: '💡', time: 120, lv: [5, 7], g: T },
    sticky:     { ko: '미끄럼 방지',     en: 'Sticky',     icon: '🦎', time: 120, lv: [5, 7], g: T },
    sunny:      { ko: '음기 회복',       en: 'Sunny',      icon: '☀️', g: T },
  };

  // ---------------------------------------------------------------- 재료
  // [id, 영어명(위키 표기), 한국어명, 분류, hp, 효과, 포인트, 추가시간, 게임, 추가태그]
  const RAW = [
    // 과일
    ['apple', 'Apple', '사과', 'fruit', 2],
    ['golden_apple', 'Golden Apple', '황금 사과', 'fruit', 12, null, 0, 0, T, ['apple']],
    ['wildberry', 'Wildberry', '산딸기', 'fruit', 2],
    ['palm_fruit', 'Palm Fruit', '야자 열매', 'fruit', 4],
    ['hylian_tomato', 'Hylian Tomato', '하이랄 토마토', 'fruit', 4, null, 0, 0, T],
    ['hydromelon', 'Hydromelon', '하이드로 멜론', 'fruit', 2, 'heat', 1],
    ['voltfruit', 'Voltfruit', '볼트 프루트', 'fruit', 2, 'shock', 1],
    ['mighty_bananas', 'Mighty Bananas', '마이티 바나나', 'fruit', 2, 'attack', 1, 0, null, ['banana']],
    ['spicy_pepper', 'Spicy Pepper', '매운 고추', 'fruit', 2, 'cold', 1],
    ['hearty_durian', 'Hearty Durian', '튼튼 두리안', 'fruit', 24, 'hearty', 4],

    // 버섯
    ['hylian_shroom', 'Hylian Shroom', '하이랄 버섯', 'mushroom', 2],
    ['skyshroom', 'Skyshroom', '하늘 버섯', 'mushroom', 2, null, 0, 0, T],
    ['hearty_truffle', 'Hearty Truffle', '튼튼 트뤼플', 'mushroom', 8, 'hearty', 1],
    ['big_hearty_truffle', 'Big Hearty Truffle', '큰 튼튼 트뤼플', 'mushroom', 16, 'hearty', 2],
    ['endura_shroom', 'Endura Shroom', '엔듀라 버섯', 'mushroom', 4, 'enduring', 1],
    ['stamella_shroom', 'Stamella Shroom', '스태미나 버섯', 'mushroom', 2, 'energizing', 1],
    ['chillshroom', 'Chillshroom', '냉기 버섯', 'mushroom', 2, 'heat', 1],
    ['sunshroom', 'Sunshroom', '온기 버섯', 'mushroom', 2, 'cold', 1],
    ['zapshroom', 'Zapshroom', '전기 버섯', 'mushroom', 2, 'shock', 1],
    ['rushroom', 'Rushroom', '날쌘 버섯', 'mushroom', 2, 'speed', 1],
    ['razorshroom', 'Razorshroom', '마이티 버섯', 'mushroom', 2, 'attack', 1],
    ['ironshroom', 'Ironshroom', '아이언 버섯', 'mushroom', 2, 'defense', 1],
    ['silent_shroom', 'Silent Shroom', '사일런트 버섯', 'mushroom', 2, 'stealth', 1],
    ['brightcap', 'Brightcap', '빛 버섯', 'mushroom', 2, 'bright', 1, 0, T],
    ['puffshroom', 'Puffshroom', '연기 버섯', 'mushroom', 2, 'stealth', 1, 0, T],

    // 채소 · 허브
    ['hyrule_herb', 'Hyrule Herb', '하이랄 풀', 'veg', 4],
    ['swift_carrot', 'Swift Carrot', '날쌘 당근', 'veg', 2, 'speed', 1, 0, null, ['carrot']],
    ['endura_carrot', 'Endura Carrot', '엔듀라 당근', 'veg', 8, 'enduring', 4, 0, null, ['carrot']],
    ['fortified_pumpkin', 'Fortified Pumpkin', '단단 호박', 'veg', 2, 'defense', 1, 0, null, ['pumpkin']],
    ['sun_pumpkin', 'Sun Pumpkin', '태양 호박', 'veg', 4, 'bright', 1, 0, T, ['pumpkin']],
    ['stambulb', 'Stambulb', '스태미나 구근', 'veg', 4, 'energizing', 1, 0, T],
    ['hearty_radish', 'Hearty Radish', '튼튼 무', 'veg', 20, 'hearty', 3, 0, null, ['radish']],
    ['big_hearty_radish', 'Big Hearty Radish', '큰 튼튼 무', 'veg', 32, 'hearty', 5, 0, null, ['radish']],

    // 꽃
    ['cool_safflina', 'Cool Safflina', '냉기 사플리나', 'flower', 0, 'heat', 1],
    ['warm_safflina', 'Warm Safflina', '온기 사플리나', 'flower', 0, 'cold', 1],
    ['electric_safflina', 'Electric Safflina', '전기 사플리나', 'flower', 0, 'shock', 1],
    ['swift_violet', 'Swift Violet', '날쌘 제비꽃', 'flower', 0, 'speed', 2],
    ['mighty_thistle', 'Mighty Thistle', '마이티 엉겅퀴', 'flower', 0, 'attack', 1],
    ['armoranth', 'Armoranth', '아머란스', 'flower', 0, 'defense', 1],
    ['blue_nightshade', 'Blue Nightshade', '푸른 나이트셰이드', 'flower', 0, 'stealth', 1],
    ['silent_princess', 'Silent Princess', '고요한 공주', 'flower', 0, 'stealth', 3],
    ['sundelion', 'Sundelion', '태양 민들레', 'flower', 0, 'sunny', 1, 0, T],

    // 견과
    ['acorn', 'Acorn', '도토리', 'nut', 2],
    ['chickaloo_tree_nut', 'Chickaloo Tree Nut', '치카루 나무 열매', 'nut', 2],

    // 고기
    ['raw_meat', 'Raw Meat', '짐승 고기', 'meat', 4],
    ['raw_prime_meat', 'Raw Prime Meat', '상급 짐승 고기', 'meat', 6, null, 0, 0, null, ['prime']],
    ['raw_gourmet_meat', 'Raw Gourmet Meat', '최상급 짐승 고기', 'meat', 12, null, 0, 0, null, ['gourmet']],
    ['raw_bird_drumstick', 'Raw Bird Drumstick', '새 다리살', 'poultry', 4],
    ['raw_bird_thigh', 'Raw Bird Thigh', '상급 새 허벅지살', 'poultry', 6, null, 0, 0, null, ['prime']],
    ['raw_whole_bird', 'Raw Whole Bird', '최상급 통새', 'poultry', 12, null, 0, 0, null, ['gourmet']],

    // 생선
    ['hyrule_bass', 'Hyrule Bass', '하이랄 배스', 'fish', 4],
    ['hearty_bass', 'Hearty Bass', '튼튼 배스', 'fish', 8, 'hearty', 2],
    ['staminoka_bass', 'Staminoka Bass', '스태미나 배스', 'fish', 4, 'energizing', 3],
    ['hearty_salmon', 'Hearty Salmon', '튼튼 연어', 'fish', 16, 'hearty', 4, 0, null, ['salmon']],
    ['chillfin_trout', 'Chillfin Trout', '냉기 송어', 'fish', 4, 'heat', 2],
    ['sizzlefin_trout', 'Sizzlefin Trout', '온기 송어', 'fish', 4, 'cold', 2],
    ['voltfin_trout', 'Voltfin Trout', '전기 송어', 'fish', 4, 'shock', 2],
    ['stealthfin_trout', 'Stealthfin Trout', '사일런트 송어', 'fish', 4, 'stealth', 2],
    ['mighty_carp', 'Mighty Carp', '마이티 잉어', 'fish', 4, 'attack', 2],
    ['armored_carp', 'Armored Carp', '아머 잉어', 'fish', 4, 'defense', 2],
    ['sanke_carp', 'Sanke Carp', '비단잉어', 'fish', 4],
    ['mighty_porgy', 'Mighty Porgy', '마이티 도미', 'fish', 4, 'attack', 3, 0, null, ['porgy']],
    ['armored_porgy', 'Armored Porgy', '아머 도미', 'fish', 4, 'defense', 3, 0, null, ['porgy']],
    ['glowing_cave_fish', 'Glowing Cave Fish', '빛나는 동굴 물고기', 'fish', 4, 'bright', 2, 0, T],

    // 갑각류 · 조개
    ['razorclaw_crab', 'Razorclaw Crab', '마이티 게', 'seafood', 4, 'attack', 2, 0, null, ['crab']],
    ['ironshell_crab', 'Ironshell Crab', '아이언 게', 'seafood', 4, 'defense', 2, 0, null, ['crab']],
    ['bright_eyed_crab', 'Bright-Eyed Crab', '기운 게', 'seafood', 4, 'energizing', 2, 0, null, ['crab']],
    ['hearty_blueshell_snail', 'Hearty Blueshell Snail', '튼튼 소라', 'seafood', 12, 'hearty', 3, 0, null, ['snail']],
    ['sneaky_river_snail', 'Sneaky River Snail', '사일런트 우렁이', 'seafood', 4, 'stealth', 2, 0, null, ['snail']],

    // 조미료 · 기타 식재료
    ['courser_bee_honey', 'Courser Bee Honey', '벌꿀', 'other', 8, 'energizing', 2, 0, null, ['honey']],
    ['cane_sugar', 'Cane Sugar', '사탕수수 설탕', 'other', 0, null, 0, 0, null, ['sugar']],
    ['goat_butter', 'Goat Butter', '염소 버터', 'other', 0, null, 0, 0, null, ['butter']],
    ['fresh_milk', 'Fresh Milk', '신선한 우유', 'other', 2, null, 0, 0, null, ['milk']],
    ['bird_egg', 'Bird Egg', '새알', 'other', 4, null, 0, 0, null, ['egg']],
    ['hateno_cheese', 'Hateno Cheese', '하테노 치즈', 'other', 4, null, 0, 0, T, ['cheese']],
    ['tabantha_wheat', 'Tabantha Wheat', '타반타 밀', 'other', 4, null, 0, 0, null, ['wheat']],
    ['hylian_rice', 'Hylian Rice', '하이랄 쌀', 'other', 4, null, 0, 0, null, ['rice']],
    ['rock_salt', 'Rock Salt', '암염', 'other', 0, null, 0, 0, null, ['salt']],
    ['goron_spice', 'Goron Spice', '고론 향신료', 'other', 0, null, 0, 0, null, ['spice']],
    ['monster_extract', 'Monster Extract', '몬스터 엑기스', 'other', 0, null, 0, 0, B, ['extract']],

    // 특수
    ['fairy', 'Fairy', '요정', 'special', 0, null, 0, 0, null, ['fairy', 'neutral']],
    ['star_fragment', 'Star Fragment', '별의 조각', 'special', 0, null, 0, 30, null, ['neutral']],
    ['dinraal_scale', "Dinraal's Scale", '딘라루의 비늘', 'dragon', 0, null, 0, 90, null, ['neutral']],
    ['naydra_claw', "Naydra's Claw", '네르드라의 발톱', 'dragon', 0, null, 0, 180, null, ['neutral']],
    ['farosh_fang', "Shard of Farosh's Fang", '파로쉬의 이빨 조각', 'dragon', 0, null, 0, 630, null, ['neutral']],
    ['dinraal_horn', "Shard of Dinraal's Horn", '딘라루의 뿔 조각', 'dragon', 0, null, 0, 1800, null, ['neutral']],

    // 벌레 · 도마뱀 (엘릭서 재료)
    ['hot_footed_frog', 'Hot-Footed Frog', '날쌘 개구리', 'critter', 0, 'speed', 1],
    ['hightail_lizard', 'Hightail Lizard', '날쌘 도마뱀', 'critter', 0, 'speed', 2],
    ['tireless_frog', 'Tireless Frog', '엔듀라 개구리', 'critter', 0, 'enduring', 4],
    ['hearty_lizard', 'Hearty Lizard', '튼튼 도마뱀', 'critter', 0, 'hearty', 2],
    ['fireproof_lizard', 'Fireproof Lizard', '불꽃 저항 도마뱀', 'critter', 0, 'fire', 1],
    ['smotherwing_butterfly', 'Smotherwing Butterfly', '불꽃 저항 나비', 'critter', 0, 'fire', 1],
    ['restless_cricket', 'Restless Cricket', '기운 귀뚜라미', 'critter', 0, 'energizing', 1],
    ['energetic_rhino_beetle', 'Energetic Rhino Beetle', '기운 장수풍뎅이', 'critter', 0, 'energizing', 4],
    ['rugged_rhino_beetle', 'Rugged Rhino Beetle', '아이언 장수풍뎅이', 'critter', 0, 'defense', 2],
    ['bladed_rhino_beetle', 'Bladed Rhino Beetle', '마이티 장수풍뎅이', 'critter', 0, 'attack', 2],
    ['summerwing_butterfly', 'Summerwing Butterfly', '냉기 나비', 'critter', 0, 'heat', 1],
    ['winterwing_butterfly', 'Winterwing Butterfly', '온기 나비', 'critter', 0, 'cold', 1],
    ['thunderwing_butterfly', 'Thunderwing Butterfly', '전기 나비', 'critter', 0, 'shock', 1],
    ['cold_darner', 'Cold Darner', '냉기 잠자리', 'critter', 0, 'heat', 1],
    ['warm_darner', 'Warm Darner', '온기 잠자리', 'critter', 0, 'cold', 1],
    ['electric_darner', 'Electric Darner', '전기 잠자리', 'critter', 0, 'shock', 1],
    ['sunset_firefly', 'Sunset Firefly', '사일런트 반딧불이', 'critter', 0, 'stealth', 1],
    ['deep_firefly', 'Deep Firefly', '심층 반딧불이', 'critter', 0, 'bright', 1, 0, T],
    ['sticky_frog', 'Sticky Frog', '끈적 개구리', 'critter', 0, 'sticky', 1, 0, T],
    ['sticky_lizard', 'Sticky Lizard', '끈적 도마뱀', 'critter', 0, 'sticky', 2, 0, T],

    // 몬스터 소재 (time = 효과 시간 증가량)
    ['bokoblin_horn', 'Bokoblin Horn', '보코블린의 뿔', 'monster', 0, null, 0, 40],
    ['bokoblin_fang', 'Bokoblin Fang', '보코블린의 이빨', 'monster', 0, null, 0, 70],
    ['bokoblin_guts', 'Bokoblin Guts', '보코블린의 간', 'monster', 0, null, 0, 110],
    ['moblin_horn', 'Moblin Horn', '모리블린의 뿔', 'monster', 0, null, 0, 70],
    ['moblin_fang', 'Moblin Fang', '모리블린의 이빨', 'monster', 0, null, 0, 110],
    ['moblin_guts', 'Moblin Guts', '모리블린의 간', 'monster', 0, null, 0, 190],
    ['lizalfos_horn', 'Lizalfos Horn', '리자르포스의 뿔', 'monster', 0, null, 0, 70],
    ['lizalfos_talon', 'Lizalfos Talon', '리자르포스의 발톱', 'monster', 0, null, 0, 110],
    ['lizalfos_tail', 'Lizalfos Tail', '리자르포스의 꼬리', 'monster', 0, null, 0, 190],
    ['lynel_horn', 'Lynel Horn', '라이넬의 뿔', 'monster', 0, null, 0, 190, B],
    ['lynel_saber_horn', 'Lynel Saber Horn', '라이넬의 검 뿔', 'monster', 0, null, 0, 190, T],
    ['lynel_hoof', 'Lynel Hoof', '라이넬의 발굽', 'monster', 0, null, 0, 190],
    ['lynel_guts', 'Lynel Guts', '라이넬의 간', 'monster', 0, null, 0, 190],
    ['chuchu_jelly', 'Chuchu Jelly', '츄츄 젤리', 'monster', 0, null, 0, 40],
    ['red_chuchu_jelly', 'Red Chuchu Jelly', '빨간 츄츄 젤리', 'monster', 0, null, 0, 40],
    ['white_chuchu_jelly', 'White Chuchu Jelly', '하얀 츄츄 젤리', 'monster', 0, null, 0, 40],
    ['yellow_chuchu_jelly', 'Yellow Chuchu Jelly', '노란 츄츄 젤리', 'monster', 0, null, 0, 40],
    ['keese_wing', 'Keese Wing', '키스의 날개', 'monster', 0, null, 0, 40],
    ['keese_eyeball', 'Keese Eyeball', '키스의 눈알', 'monster', 0, null, 0, 70],
    ['octorok_tentacle', 'Octorok Tentacle', '옥타록의 다리', 'monster', 0, null, 0, 40],
    ['octorok_eyeball', 'Octorok Eyeball', '옥타록의 눈알', 'monster', 0, null, 0, 70],
    ['octo_balloon', 'Octo Balloon', '옥타 풍선', 'monster', 0, null, 0, 40, B],
    ['hinox_toenail', 'Hinox Toenail', '히녹스의 발톱', 'monster', 0, null, 0, 110],
    ['hinox_tooth', 'Hinox Tooth', '히녹스의 이빨', 'monster', 0, null, 0, 190],
    ['hinox_guts', 'Hinox Guts', '히녹스의 간', 'monster', 0, null, 0, 190],
    ['molduga_fin', 'Molduga Fin', '몰드가의 지느러미', 'monster', 0, null, 0, 110],
    ['molduga_guts', 'Molduga Guts', '몰드가의 간', 'monster', 0, null, 0, 190],
    ['ancient_screw', 'Ancient Screw', '고대 나사', 'monster', 0, null, 0, 40, B],
    ['ancient_spring', 'Ancient Spring', '고대 스프링', 'monster', 0, null, 0, 40, B],
    ['ancient_gear', 'Ancient Gear', '고대 톱니바퀴', 'monster', 0, null, 0, 70, B],
    ['ancient_shaft', 'Ancient Shaft', '고대 샤프트', 'monster', 0, null, 0, 110, B],
    ['ancient_core', 'Ancient Core', '고대 코어', 'monster', 0, null, 0, 190, B],
    ['giant_ancient_core', 'Giant Ancient Core', '거대 고대 코어', 'monster', 0, null, 0, 190, B],
    ['gibdo_wing', 'Gibdo Wing', '기브도의 날개', 'monster', 0, null, 0, 70, T],
    ['gibdo_bone', 'Gibdo Bone', '기브도의 뼈', 'monster', 0, null, 0, 110, T],
    ['gibdo_guts', 'Gibdo Guts', '기브도의 간', 'monster', 0, null, 0, 190, T],
    ['aerocuda_wing', 'Aerocuda Wing', '에어로쿠다의 날개', 'monster', 0, null, 0, 70, T],
    ['aerocuda_eyeball', 'Aerocuda Eyeball', '에어로쿠다의 눈알', 'monster', 0, null, 0, 70, T],
    ['horriblin_horn', 'Horriblin Horn', '호리블린의 뿔', 'monster', 0, null, 0, 70, T],
    ['horriblin_claw', 'Horriblin Claw', '호리블린의 발톱', 'monster', 0, null, 0, 110, T],
    ['horriblin_guts', 'Horriblin Guts', '호리블린의 간', 'monster', 0, null, 0, 190, T],
    ['like_like_stone', 'Like Like Stone', '라이크라이크의 돌', 'monster', 0, null, 0, 110, T],
    ['frox_fang', 'Frox Fang', '프록스의 이빨', 'monster', 0, null, 0, 190, T],
    ['frox_fingernail', 'Frox Fingernail', '프록스의 손톱', 'monster', 0, null, 0, 110, T],
    ['frox_guts', 'Frox Guts', '프록스의 간', 'monster', 0, null, 0, 190, T],

    // 광물 · 기타 (넣으면 딱딱한 요리)
    ['flint', 'Flint', '부싯돌', 'mineral', 0],
    ['amber', 'Amber', '호박석', 'mineral', 0],
    ['opal', 'Opal', '오팔', 'mineral', 0],
    ['luminous_stone', 'Luminous Stone', '야광석', 'mineral', 0],
    ['topaz', 'Topaz', '토파즈', 'mineral', 0],
    ['ruby', 'Ruby', '루비', 'mineral', 0],
    ['sapphire', 'Sapphire', '사파이어', 'mineral', 0],
    ['diamond', 'Diamond', '다이아몬드', 'mineral', 0],
    ['wood', 'Wood', '장작', 'mineral', 0],
  ];

  const CATEGORY_TAGS = {
    veg: ['greens'], flower: ['greens'],
    meat: ['meatany'], poultry: ['meatany'],
    fish: ['seafoodany'], seafood: ['seafoodany'],
  };

  const INGREDIENTS = RAW.map(([id, en, ko, cat, hp, eff, pot, time, g, tags]) => ({
    id, en, ko, cat,
    hp: hp || 0,
    eff: eff || null,
    pot: pot || 0,
    time: time || 0,
    g: g || ['botw', 'totk'],
    tags: [id, cat, ...(CATEGORY_TAGS[cat] || []), ...(tags || [])],
  }));

  const CATEGORIES = [
    { id: 'all', ko: '전체' },
    { id: 'fruit', ko: '과일' },
    { id: 'mushroom', ko: '버섯' },
    { id: 'veg', ko: '채소·허브' },
    { id: 'flower', ko: '꽃' },
    { id: 'nut', ko: '견과' },
    { id: 'meat', ko: '고기', also: ['poultry'] },
    { id: 'fish', ko: '생선·해산물', also: ['seafood'] },
    { id: 'other', ko: '조미료·기타' },
    { id: 'critter', ko: '벌레·도마뱀' },
    { id: 'monster', ko: '몬스터 소재' },
    { id: 'special', ko: '특수', also: ['dragon'] },
    { id: 'mineral', ko: '광물' },
  ];

  // ---------------------------------------------------------------- 레시피
  // req: 필요한 재료 슬롯 목록. 각 슬롯은 태그 하나 또는 태그 배열(그중 하나).
  //      각 슬롯은 서로 다른 재료로 채워야 한다.
  // only: 이 태그에 속하는 재료로만 만들어야 하는 경우.
  // distinct: 서로 다른 재료 종류가 최소 몇 개 필요한지.
  // pri: 우선순위(기본값 = 슬롯 개수). 여러 레시피가 맞으면 높은 쪽이 선택된다.
  const R = (en, ko, req, opt = {}) => ({ en, ko, req, ...opt });
  const MEAT_PRIME = ['raw_prime_meat', 'raw_bird_thigh'];
  const MEAT_GOURMET = ['raw_gourmet_meat', 'raw_whole_bird'];
  const SEA = 'seafoodany';

  const RECIPES = [
    // 단일 분류 요리
    R('Mushroom Skewer', '버섯 꼬치구이', ['mushroom'], { only: ['mushroom'], pri: 1 }),
    R('Copious Mushroom Skewers', '버섯 듬뿍 꼬치구이', ['mushroom'], { only: ['mushroom'], distinct: 4, pri: 4 }),
    R('Meat Skewer', '고기 꼬치구이', ['meatany'], { only: ['meatany'], pri: 1 }),
    R('Copious Meat Skewers', '고기 듬뿍 꼬치구이', ['meatany'], { only: ['meatany'], distinct: 4, pri: 4 }),
    R('Fish Skewer', '생선 꼬치구이', [SEA], { only: [SEA], pri: 1 }),
    R('Copious Seafood Skewers', '해산물 듬뿍 꼬치구이', [SEA], { only: [SEA], distinct: 4, pri: 4 }),
    R('Simmered Fruit', '과일 조림', ['fruit'], { only: ['fruit'], pri: 1 }),
    R('Copious Simmered Fruit', '과일 듬뿍 조림', ['fruit'], { only: ['fruit'], distinct: 4, pri: 4 }),
    R('Fried Wild Greens', '산나물 볶음', ['greens'], { only: ['greens'], pri: 1 }),
    R('Copious Fried Wild Greens', '산나물 듬뿍 볶음', ['greens'], { only: ['greens'], distinct: 4, pri: 4 }),
    R('Sautéed Nuts', '견과류 볶음', ['nut'], { only: ['nut'], pri: 1 }),
    R('Sautéed Peppers', '고추 볶음', ['spicy_pepper'], { only: ['spicy_pepper'], pri: 1.5 }),

    // 두 분류 조합
    R('Meat and Mushroom Skewer', '고기와 버섯 꼬치구이', ['meatany', 'mushroom'], { only: ['meatany', 'mushroom'] }),
    R('Fish and Mushroom Skewer', '생선과 버섯 꼬치구이', [SEA, 'mushroom'], { only: [SEA, 'mushroom'] }),
    R('Meat and Seafood Fry', '고기와 해산물 볶음', ['meatany', SEA], { only: ['meatany', SEA] }),
    R('Prime Meat and Seafood Fry', '상급 고기와 해산물 볶음', [MEAT_PRIME, SEA], { only: ['meatany', SEA], pri: 2.5 }),
    R('Gourmet Meat and Seafood Fry', '최상급 고기와 해산물 볶음', [MEAT_GOURMET, SEA], { only: ['meatany', SEA], pri: 2.6 }),
    R('Fruit and Mushroom Mix', '과일과 버섯 볶음', ['fruit', 'mushroom'], { only: ['fruit', 'mushroom'] }),
    R('Steamed Mushrooms', '버섯 찜', ['mushroom', 'greens'], { only: ['mushroom', 'greens'] }),
    R('Steamed Fruit', '과일 찜', ['fruit', 'greens'], { only: ['fruit', 'greens'] }),
    R('Steamed Meat', '고기 찜', ['meatany', 'greens'], { only: ['meatany', 'greens'] }),
    R('Steamed Fish', '생선 찜', [SEA, 'greens'], { only: [SEA, 'greens'] }),
    R('Pepper Steak', '페퍼 스테이크', ['meatany', 'spicy_pepper'], { pri: 2.3 }),
    R('Pepper Seafood', '페퍼 시푸드', ['fish', 'spicy_pepper'], { pri: 2.3 }),

    // 소금
    R('Salt-Grilled Mushrooms', '버섯 소금구이', ['mushroom', 'salt']),
    R('Salt-Grilled Greens', '산나물 소금구이', ['greens', 'salt']),
    R('Salt-Grilled Meat', '고기 소금구이', ['meatany', 'salt']),
    R('Salt-Grilled Prime Meat', '상급 고기 소금구이', [MEAT_PRIME, 'salt'], { pri: 2.1 }),
    R('Salt-Grilled Gourmet Meat', '최상급 고기 소금구이', [MEAT_GOURMET, 'salt'], { pri: 2.2 }),
    R('Salt-Grilled Fish', '생선 소금구이', ['fish', 'salt']),
    R('Salt-Grilled Crab', '게 소금구이', ['crab', 'salt'], { pri: 2.1 }),

    // 꿀
    R('Honey Candy', '꿀 사탕', ['honey'], { only: ['honey'], pri: 1.5 }),
    R('Honeyed Apple', '구운 꿀사과', ['apple', 'honey'], { pri: 2.2 }),
    R('Honeyed Fruits', '과일 꿀조림', ['fruit', 'honey']),
    R('Glazed Mushrooms', '버섯 꿀조림', ['mushroom', 'honey']),
    R('Glazed Veggies', '채소 꿀조림', ['greens', 'honey']),
    R('Glazed Meat', '고기 꿀조림', ['meatany', 'honey']),
    R('Glazed Seafood', '해산물 꿀조림', [SEA, 'honey']),

    // 고론 향신료
    R('Fragrant Mushroom Sauté', '향긋한 버섯 볶음', ['mushroom', 'spice']),
    R('Herb Sauté', '허브 볶음', ['greens', 'spice']),
    R('Spiced Meat Skewer', '향신료 고기 꼬치구이', ['meatany', 'spice']),
    R('Prime Spiced Meat Skewer', '상급 향신료 고기 꼬치구이', [MEAT_PRIME, 'spice'], { pri: 2.1 }),
    R('Gourmet Spiced Meat Skewer', '최상급 향신료 고기 꼬치구이', [MEAT_GOURMET, 'spice'], { pri: 2.2 }),
    R('Crab Stir-Fry', '게 볶음', ['crab', 'spice'], { pri: 2.1 }),

    // 버터 · 우유 · 달걀
    R('Hot Buttered Apple', '구운 버터사과', ['apple', 'butter'], { pri: 2.2 }),
    R('Warm Milk', '따뜻한 우유', ['milk'], { only: ['milk', 'sugar'], pri: 1.5 }),
    R('Omelet', '오믈렛', ['egg'], { only: ['egg'], pri: 1.5 }),
    R('Egg Pudding', '달걀 푸딩', ['egg', 'milk', 'sugar']),
    R('Mushroom Omelet', '버섯 오믈렛', ['egg', 'mushroom', 'salt', 'butter']),
    R('Vegetable Omelet', '채소 오믈렛', ['egg', 'greens', 'salt', 'butter']),

    // 쌀
    R('Mushroom Rice Balls', '버섯 주먹밥', ['rice', 'mushroom'], { pri: 2.4 }),
    R('Veggie Rice Balls', '산나물 주먹밥', ['rice', 'greens'], { pri: 2.4 }),
    R('Seafood Rice Balls', '해산물 주먹밥', ['rice', 'fish'], { pri: 2.4 }),
    R('Fried Egg and Rice', '달걀 볶음밥', ['rice', 'egg'], { pri: 2.4 }),
    R('Meat and Rice Bowl', '고기 덮밥', ['rice', 'meat', 'salt']),
    R('Prime Meat and Rice Bowl', '상급 고기 덮밥', ['rice', 'raw_prime_meat', 'salt'], { pri: 3.1 }),
    R('Gourmet Meat and Rice Bowl', '최상급 고기 덮밥', ['rice', 'raw_gourmet_meat', 'salt'], { pri: 3.2 }),
    R('Seafood Fried Rice', '해산물 볶음밥', ['rice', ['crab', 'snail'], 'salt'], { pri: 3.1 }),
    R('Poultry Pilaf', '새고기 필라프', ['rice', 'poultry', 'egg', 'butter']),
    R('Prime Poultry Pilaf', '상급 새고기 필라프', ['rice', 'raw_bird_thigh', 'egg', 'butter'], { pri: 4.1 }),
    R('Gourmet Poultry Pilaf', '최상급 새고기 필라프', ['rice', 'raw_whole_bird', 'egg', 'butter'], { pri: 4.2 }),
    R('Crab Omelet with Rice', '게살 오므라이스', ['rice', 'crab', 'egg', 'salt'], { pri: 4.1 }),
    R('Mushroom Risotto', '버섯 리소토', ['rice', 'mushroom', 'butter', 'salt']),
    R('Vegetable Risotto', '채소 리소토', ['rice', ['carrot', 'pumpkin'], 'butter', 'salt'], { pri: 4.1 }),
    R('Salmon Risotto', '연어 리소토', ['rice', 'salmon', 'butter', 'salt'], { pri: 4.1 }),
    R('Crab Risotto', '게살 리소토', ['rice', 'crab', 'butter', 'salt'], { pri: 4.1 }),
    R('Seafood Paella', '해산물 파에야', ['rice', 'porgy', 'snail', 'butter', 'salt']),
    R('Curry Rice', '카레라이스', ['rice', 'spice'], { pri: 2.5 }),
    R('Curry Pilaf', '카레 필라프', ['rice', 'spice', 'butter']),
    R('Meat Curry', '고기 카레', ['rice', 'spice', 'meat'], { pri: 3.1 }),
    R('Gourmet Meat Curry', '최상급 고기 카레', ['rice', 'spice', 'raw_gourmet_meat'], { pri: 3.3 }),
    R('Poultry Curry', '새고기 카레', ['rice', 'spice', 'poultry'], { pri: 3.1 }),
    R('Prime Poultry Curry', '상급 새고기 카레', ['rice', 'spice', 'raw_bird_thigh'], { pri: 3.2 }),
    R('Gourmet Poultry Curry', '최상급 새고기 카레', ['rice', 'spice', 'raw_whole_bird'], { pri: 3.3 }),
    R('Vegetable Curry', '채소 카레', ['rice', 'spice', ['carrot', 'pumpkin']], { pri: 3.1 }),
    R('Seafood Curry', '해산물 카레', ['rice', 'spice', ['porgy', 'hearty_blueshell_snail']], { pri: 3.1 }),

    // 밀
    R('Wheat Bread', '밀빵', ['wheat', 'salt']),
    R('Fried Bananas', '바나나 튀김', ['banana', 'wheat', 'sugar']),
    R('Plain Crepe', '크레이프', ['wheat', 'sugar', 'egg', 'milk']),
    R('Wildberry Crepe', '산딸기 크레이프', ['wheat', 'sugar', 'egg', 'milk', 'wildberry']),
    R('Honey Crepe', '꿀 크레이프', ['wheat', 'sugar', 'egg', 'milk', 'honey']),
    R('Nutcake', '견과류 케이크', ['nut', 'wheat', 'sugar', 'butter']),
    R('Fruitcake', '과일 케이크', [['apple', 'wildberry'], 'fruit', 'wheat', 'sugar'], { pri: 4.1 }),
    R('Apple Pie', '애플파이', ['apple', 'wheat', 'butter', 'sugar'], { pri: 4.2 }),
    R('Egg Tart', '에그타르트', ['egg', 'wheat', 'butter', 'sugar'], { pri: 4.2 }),
    R('Carrot Cake', '당근 케이크', ['carrot', 'wheat', 'sugar', 'butter'], { pri: 4.2 }),
    R('Pumpkin Pie', '호박 파이', ['pumpkin', 'wheat', 'butter', 'sugar'], { pri: 4.2 }),
    R('Meat Pie', '미트파이', ['meatany', 'wheat', 'salt', 'butter'], { pri: 4.1 }),
    R('Seafood Meunière', '해산물 뫼니에르', ['fish', 'wheat', 'butter']),
    R('Porgy Meunière', '도미 뫼니에르', ['porgy', 'wheat', 'butter'], { pri: 3.1 }),
    R('Salmon Meunière', '연어 뫼니에르', ['salmon', 'wheat', 'butter'], { pri: 3.1 }),

    // 수프 · 스튜
    R('Cream of Vegetable Soup', '채소 크림수프', ['greens', 'milk', 'salt']),
    R('Cream of Mushroom Soup', '버섯 크림수프', ['mushroom', 'greens', 'milk', 'salt']),
    R('Creamy Meat Soup', '고기 크림수프', ['meatany', 'greens', 'milk', 'salt']),
    R('Creamy Seafood Soup', '해산물 크림수프', ['fish', 'greens', 'milk', 'salt']),
    R('Carrot Stew', '당근 스튜', ['carrot', 'milk', 'butter', 'wheat'], { pri: 4.2 }),
    R('Pumpkin Stew', '호박 스튜', ['pumpkin', 'milk', 'butter', 'wheat'], { pri: 4.2 }),
    R('Meat Stew', '고기 스튜', ['meatany', 'milk', 'butter', 'wheat'], { pri: 4.1 }),
    R('Prime Meat Stew', '상급 고기 스튜', [MEAT_PRIME, 'milk', 'butter', 'wheat'], { pri: 4.3 }),
    R('Gourmet Meat Stew', '최상급 고기 스튜', [MEAT_GOURMET, 'milk', 'butter', 'wheat'], { pri: 4.4 }),
    R('Clam Chowder', '클램 차우더', ['hearty_blueshell_snail', 'wheat', 'butter', 'milk'], { pri: 4.3 }),
    R('Creamy Heart Soup', '하트 크림수프', ['hydromelon', 'voltfruit', 'radish', 'milk'], { pri: 10 }),
    R('Noble Pursuit', '고귀한 향연', ['palm_fruit', 'hydromelon', 'voltfruit', 'salt'], { pri: 10 }),

    // 몬스터 엑기스 (야숨)
    R('Monster Stew', '몬스터 스튜', ['extract', 'meatany', SEA], { g: B, pri: 20 }),
    R('Monster Soup', '몬스터 수프', ['extract', 'wheat', 'milk', 'butter'], { g: B, pri: 21 }),
    R('Monster Curry', '몬스터 카레', ['extract', 'rice', 'spice'], { g: B, pri: 20 }),
    R('Monster Rice Balls', '몬스터 주먹밥', ['extract', 'rice', 'salt'], { g: B, pri: 20 }),
    R('Monster Cake', '몬스터 케이크', ['extract', 'sugar', 'wheat', 'butter'], { g: B, pri: 21 }),

    // 왕눈 신규
    R('Buttered Stambulb', '스태미나 구근 버터구이', ['stambulb', 'butter'], { g: T, pri: 2.3 }),
    R('Cheesy Tomato', '치즈 토마토', ['hylian_tomato', 'cheese'], { g: T, pri: 2.4 }),
    R('Cheesy Baked Fish', '생선 치즈구이', ['fish', 'cheese'], { g: T, pri: 2.4 }),
    R('Cheesy Omelet', '치즈 오믈렛', ['egg', 'cheese'], { g: T, pri: 2.4 }),
    R('Cheesy Risotto', '치즈 리소토', ['rice', 'cheese', 'butter'], { g: T, pri: 3.2 }),
    R('Cheesy Meat Bowl', '치즈 고기 덮밥', ['rice', 'meatany', 'cheese'], { g: T, pri: 3.3 }),
    R('Melty Cheesy Bread', '치즈 빵', ['wheat', 'cheese', 'salt'], { g: T, pri: 3.2 }),
    R('Cheesecake', '치즈 케이크', ['wheat', 'cheese', 'sugar'], { g: T, pri: 3.2 }),
    R('Hylian Tomato Pizza', '하이랄 토마토 피자', ['hylian_tomato', 'cheese', 'wheat'], { g: T, pri: 3.4 }),
    R('Meat-Stuffed Pumpkin', '호박 고기찜', ['pumpkin', 'meatany'], { g: T, pri: 2.4 }),
  ];

  // 특수 결과
  const SPECIAL = {
    dubious: { en: 'Dubious Food', ko: '수상한 요리' },
    rockhard: { en: 'Rock-Hard Food', ko: '돌처럼 딱딱한 요리' },
    fairy: { en: 'Fairy Tonic', ko: '요정의 영약' },
    elixir: { en: 'Elixir', ko: '엘릭서' },
  };

  root.ZDATA = { EFFECTS, INGREDIENTS, CATEGORIES, RECIPES, SPECIAL };
  if (typeof module !== 'undefined') module.exports = root.ZDATA;
})(typeof window !== 'undefined' ? window : globalThis);
