// 젤다의 전설 야생의 숨결(BotW) / 왕국의 눈물(TotK) 요리 데이터
// 주요 출처: 나무위키 「젤다의 전설 브레스 오브 더 와일드/아이템」, 「젤다의 전설 티어스 오브 더 킹덤/아이템/요리」
//
// hp: 날것 기준 회복량(1/4 하트 단위). 냄비 요리는 2배가 된다.
// eff: 효과 종류, pot: 효과 포인트
// time: 효과 지속시간에 더해지는 초 (0이면 효과 재료는 효과 기본값, 일반 재료는 30초)
// g: 등장 게임 (생략 시 두 게임 모두)
(function (root) {
  const B = ['botw'];
  const T = ['totk'];

  // ---------------------------------------------------------------- 효과
  // prefix: 요리 이름 앞에 붙는 수식어, lv: 단계 기준 포인트 (나무위키: 30 이상 Lv2, 45 이상 Lv3)
  const EFFECTS = {
    hearty:     { prefix: '맥스',     ko: '체력 완전 회복 + 추가 하트',       en: 'Hearty',     icon: '💛' },
    energizing: { prefix: '원기',     ko: '스태미나 회복',                   en: 'Energizing', icon: '🟢' },
    enduring:   { prefix: '스태미나', ko: '스태미나 완전 회복 + 추가 스태미나', en: 'Enduring',   icon: '🟡' },
    attack:     { prefix: '파워',     ko: '공격력 업',   en: 'Mighty',    icon: '⚔️', time: 50,  lv: [30, 45] },
    defense:    { prefix: '튼튼',     ko: '방어 업',     en: 'Tough',     icon: '🛡️', time: 50,  lv: [30, 45] },
    speed:      { prefix: '고고',     ko: '이동력 업',   en: 'Hasty',     icon: '👟', time: 60,  lv: [30, 45] },
    stealth:    { prefix: '은밀',     ko: '조용함 업',   en: 'Sneaky',    icon: '🌙', time: 120, lv: [30, 45] },
    cold:       { prefix: '화끈',     ko: '추위 가드',   en: 'Spicy',     icon: '🔥', time: 150, lv: [30] },
    heat:       { prefix: '썰렁',     ko: '더위 가드',   en: 'Chilly',    icon: '❄️', time: 150, lv: [30] },
    shock:      { prefix: '일렉트로', ko: '전기 가드',   en: 'Electro',   icon: '⚡', time: 150, lv: [30, 45] },
    fire:       { prefix: '방염',     ko: '불꽃 가드',   en: 'Fireproof', icon: '🧯', time: 150, lv: [30] },
    bright:     { prefix: '등불',     ko: '발광',       en: 'Bright',    icon: '💡', time: 120, lv: [30, 45], g: T },
    sticky:     { prefix: '논슬립',   ko: '미끄럼 경감', en: 'Sticky',    icon: '🦎', time: 120, lv: [30, 45], g: T },
    swim:       { prefix: '스위밍',   ko: '헤엄 스피드 업', en: 'Rapid',  icon: '🌊', time: 30, lv: [], fixedLevel: 1, g: T },
    scorching:  { prefix: '이글이글', ko: '고온 시 화염 공격', en: 'Scorching', icon: '🌋', time: 30, lv: [], fixedLevel: 1, g: T },
    biting:     { prefix: '깡깡',     ko: '저온 시 냉기 공격', en: 'Biting', icon: '🧊', time: 30, lv: [], fixedLevel: 1, g: T },
    stormy:     { prefix: '우르릉',   ko: '뇌우 시 전기 공격', en: 'Stormy', icon: '🌩️', time: 30, lv: [], fixedLevel: 1, g: T },
    gloomguard: { prefix: '항독',     ko: '독기 가드',   en: 'Gloom-Resistant', icon: '🟣', time: 120, lv: [30, 45], g: T },
    sunny:      { prefix: '정화',     ko: '독기 침식 체력 복구', en: 'Sunny', icon: '☀️', g: T },
  };

  // ---------------------------------------------------------------- 재료
  // [id, 영어명(위키 표기), 한국어명(한글판), 분류, hp, 효과, 포인트, 시간, 게임, 추가태그]
  const RAW = [
    // 과일
    ['apple', 'Apple', '사과', 'fruit', 2],
    ['golden_apple', 'Golden Apple', '황금 사과', 'fruit', 8, null, 0, 0, T, ['crit']],
    ['wildberry', 'Wildberry', '딸기', 'fruit', 2],
    ['palm_fruit', 'Palm Fruit', '야자열매', 'fruit', 4],
    ['hylian_tomato', 'Hylian Tomato', '하이랄토마토', 'fruit', 4, null, 0, 0, T, ['tomato']],
    ['dazzlefruit', 'Dazzlefruit', '광휘의 열매', 'fruit', 2, null, 0, 0, T],
    ['hydromelon', 'Hydromelon', '썰렁멜론', 'fruit', 4, 'heat', 7],
    ['voltfruit', 'Voltfruit', '찌릿찌릿프루트', 'fruit', 2, 'shock', 7],
    ['spicy_pepper', 'Spicy Pepper', '따끈따끈초 열매', 'fruit', 2, 'cold', 7],
    ['mighty_bananas', 'Mighty Bananas', '칼날바나나', 'fruit', 2, 'attack', 14, 0, null, ['banana']],
    ['fleet_lotus_seeds', 'Fleet-Lotus Seeds', '고고연꽃 열매', 'fruit', 2, 'speed', 14],
    ['hearty_durian', 'Hearty Durian', '맥스두리안', 'fruit', 12, 'hearty', 4],
    ['fire_fruit', 'Fire Fruit', '화염의 열매', 'fruit', 0, 'scorching', 1, 0, T],
    ['ice_fruit', 'Ice Fruit', '냉기의 열매', 'fruit', 0, 'biting', 1, 0, T],
    ['shock_fruit', 'Shock Fruit', '전기 열매', 'fruit', 0, 'stormy', 1, 0, T],
    ['splash_fruit', 'Splash Fruit', '물 열매', 'fruit', 0, 'swim', 1, 0, T],

    // 버섯
    ['hylian_shroom', 'Hylian Shroom', '하이랄버섯', 'mushroom', 2],
    ['skyshroom', 'Skyshroom', '하늘버섯', 'mushroom', 2, null, 0, 0, T],
    ['hearty_truffle', 'Hearty Truffle', '맥스트러플', 'mushroom', 8, 'hearty', 1],
    ['big_hearty_truffle', 'Big Hearty Truffle', '큰맥스트러플', 'mushroom', 12, 'hearty', 4],
    ['endura_shroom', 'Endura Shroom', '활력버섯', 'mushroom', 4, 'enduring', 1],
    ['stamella_shroom', 'Stamella Shroom', '원기버섯', 'mushroom', 4, 'energizing', 1],
    ['chillshroom', 'Chillshroom', '썰렁버섯', 'mushroom', 2, 'heat', 7],
    ['sunshroom', 'Sunshroom', '따끈따끈버섯', 'mushroom', 2, 'cold', 7],
    ['zapshroom', 'Zapshroom', '찌릿찌릿버섯', 'mushroom', 2, 'shock', 7],
    ['rushroom', 'Rushroom', '고고버섯', 'mushroom', 2, 'speed', 7],
    ['razorshroom', 'Razorshroom', '칼날버섯', 'mushroom', 2, 'attack', 7],
    ['ironshroom', 'Ironshroom', '갑옷버섯', 'mushroom', 2, 'defense', 7],
    ['silent_shroom', 'Silent Shroom', '은밀버섯', 'mushroom', 2, 'stealth', 7],
    ['brightcap', 'Brightcap', '조명버섯', 'mushroom', 2, 'bright', 7, 0, T],

    // 채소
    ['swift_carrot', 'Swift Carrot', '고고당근', 'veg', 2, 'speed', 7, 60, null, ['carrot']],
    ['endura_carrot', 'Endura Carrot', '활력당근', 'veg', 8, 'enduring', 4, 0, null, ['carrot']],
    ['fortified_pumpkin', 'Fortified Pumpkin', '갑옷호박', 'veg', 2, 'defense', 7, 50, null, ['pumpkin']],
    ['sun_pumpkin', 'Sun Pumpkin', '해품이호박', 'veg', 2, 'sunny', 1, 0, T, ['pumpkin']],
    ['stambulb', 'Stambulb', '원기초', 'veg', 4, 'energizing', 1, 0, T],
    ['hearty_radish', 'Hearty Radish', '맥스순무', 'veg', 10, 'hearty', 3, 0, null, ['radish']],
    ['big_hearty_radish', 'Big Hearty Radish', '큰맥스순무', 'veg', 16, 'hearty', 5, 0, null, ['radish']],

    // 약초 · 꽃
    ['hyrule_herb', 'Hyrule Herb', '하이랄초', 'flower', 4],
    ['korok_frond', 'Korok Frond', '코로그 잎새', 'flower', 0, null, 0, 0, T],
    ['cool_safflina', 'Cool Safflina', '썰렁허브', 'flower', 0, 'heat', 7],
    ['warm_safflina', 'Warm Safflina', '따끈따끈허브', 'flower', 0, 'cold', 7],
    ['electric_safflina', 'Electric Safflina', '찌릿찌릿허브', 'flower', 0, 'shock', 7],
    ['swift_violet', 'Swift Violet', '고고제비꽃', 'flower', 0, 'speed', 14],
    ['mighty_thistle', 'Mighty Thistle', '칼날초', 'flower', 0, 'attack', 7],
    ['armoranth', 'Armoranth', '갑옷초', 'flower', 0, 'defense', 7],
    ['blue_nightshade', 'Blue Nightshade', '은밀초', 'flower', 0, 'stealth', 7],
    ['silent_princess', 'Silent Princess', '고요한 공주', 'flower', 0, 'stealth', 21, 60],
    ['sundelion', 'Sundelion', '해품이꽃', 'flower', 0, 'sunny', 3, 0, T],

    // 견과
    ['acorn', 'Acorn', '도토리', 'nut', 1, null, 0, 50],
    ['chickaloo_tree_nut', 'Chickaloo Tree Nut', '작은 새 나무 열매', 'nut', 2, null, 0, 40],

    // 고기
    ['raw_meat', 'Raw Meat', '짐승 고기', 'meat', 4],
    ['raw_prime_meat', 'Raw Prime Meat', '상급 짐승 고기', 'meat', 6],
    ['raw_gourmet_meat', 'Raw Gourmet Meat', '특급 짐승 고기', 'meat', 12],
    ['raw_bird_drumstick', 'Raw Bird Drumstick', '새 고기', 'poultry', 4],
    ['raw_bird_thigh', 'Raw Bird Thigh', '상급 새 고기', 'poultry', 6],
    ['raw_whole_bird', 'Raw Whole Bird', '특급 새 고기', 'poultry', 12],

    // 생선
    ['hyrule_bass', 'Hyrule Bass', '하이랄배스', 'fish', 4],
    ['hearty_bass', 'Hearty Bass', '맥스배스', 'fish', 8, 'hearty', 2],
    ['staminoka_bass', 'Staminoka Bass', '원기배스', 'fish', 4, 'energizing', 3],
    ['hearty_salmon', 'Hearty Salmon', '맥스연어', 'fish', 16, 'hearty', 4, 0, null, ['salmon']],
    ['chillfin_trout', 'Chillfin Trout', '썰렁송어', 'fish', 4, 'heat', 14],
    ['sizzlefin_trout', 'Sizzlefin Trout', '따끈따끈송어', 'fish', 4, 'cold', 14],
    ['voltfin_trout', 'Voltfin Trout', '찌릿찌릿송어', 'fish', 4, 'shock', 14],
    ['stealthfin_trout', 'Stealthfin Trout', '은밀송어', 'fish', 4, 'stealth', 14],
    ['mighty_carp', 'Mighty Carp', '칼날잉어', 'fish', 4, 'attack', 14],
    ['armored_carp', 'Armored Carp', '갑옷잉어', 'fish', 4, 'defense', 14],
    ['sanke_carp', 'Sanke Carp', '달록잉어', 'fish', 4],
    ['mighty_porgy', 'Mighty Porgy', '칼날도미', 'fish', 4, 'attack', 21, 0, null, ['porgy']],
    ['armored_porgy', 'Armored Porgy', '갑옷도미', 'fish', 2, 'defense', 21, 0, null, ['porgy']],
    ['glowing_cave_fish', 'Glowing Cave Fish', '조명동굴어', 'fish', 4, 'bright', 14, 0, T],
    ['ancient_arowana', 'Ancient Arowana', '고대아로와나', 'fish', 4, null, 0, 0, T],

    // 게 · 조개 (나무위키 분류상 어류지만 일부 레시피에서 구분)
    ['razorclaw_crab', 'Razorclaw Crab', '칼날게', 'seafood', 4, 'attack', 14, 0, null, ['crab']],
    ['ironshell_crab', 'Ironshell Crab', '갑옷게', 'seafood', 4, 'defense', 14, 0, null, ['crab']],
    ['bright_eyed_crab', 'Bright-Eyed Crab', '원기게', 'seafood', 4, 'energizing', 2, 0, null, ['crab']],
    ['hearty_blueshell_snail', 'Hearty Blueshell Snail', '맥스소라', 'seafood', 4, 'hearty', 3, 0, B, ['snail']],
    ['sneaky_river_snail', 'Sneaky River Snail', '은밀우렁이', 'seafood', 4, 'stealth', 14, 0, null, ['snail']],

    // 농 · 축산물 · 조미료
    ['courser_bee_honey', 'Courser Bee Honey', '원기벌의 벌꿀', 'other', 8, 'energizing', 2, 0, null, ['honey']],
    ['hylian_rice', 'Hylian Rice', '하이랄 쌀', 'other', 4, null, 0, 60, null, ['rice']],
    ['bird_egg', 'Bird Egg', '새의 알', 'other', 4, null, 0, 0, null, ['egg']],
    ['tabantha_wheat', 'Tabantha Wheat', '타반타 밀', 'other', 4, null, 0, 0, null, ['wheat']],
    ['fresh_milk', 'Fresh Milk', '신선 우유', 'other', 2, null, 0, 0, null, ['milk']],
    ['cane_sugar', 'Cane Sugar', '사탕수수', 'other', 0, null, 0, 80, null, ['sugar']],
    ['goat_butter', 'Goat Butter', '염소 버터', 'other', 0, null, 0, 80, null, ['butter']],
    ['hateno_cheese', 'Hateno Cheese', '하테노 치즈', 'other', 4, null, 0, 0, T, ['cheese']],
    ['oil_jar', 'Oil Jar', '기름병', 'other', 0, null, 0, 0, T, ['oil']],
    ['rock_salt', 'Rock Salt', '암염', 'other', 0, null, 0, 0, null, ['salt']],
    ['goron_spice', 'Goron Spice', '고론의 향신료', 'other', 0, null, 0, 0, null, ['spice']],
    ['monster_extract', 'Monster Extract', '몬스터엑기스', 'other', 0, null, 0, 0, null, ['extract']],
    ['dark_clump', 'Dark Clump', '어둠 덩어리', 'other', 0, 'gloomguard', 14, 0, T, ['dark']],

    // 특수
    ['fairy', 'Fairy', '요정', 'special', 0, null, 0, 30, null, ['fairy', 'neutral']],
    ['star_fragment', 'Star Fragment', '별의 조각', 'special', 0, null, 0, 30, null, ['neutral', 'crit']],
    ['dinraal_scale', "Dinraal's Scale", '올드래곤의 비늘', 'dragon', 0, null, 0, 90, null, ['neutral', 'crit']],
    ['dinraal_claw', "Dinraal's Claw", '올드래곤의 발톱', 'dragon', 0, null, 0, 210, null, ['neutral', 'crit']],
    ['dinraal_fang', "Shard of Dinraal's Fang", '올드래곤의 이빨 조각', 'dragon', 0, null, 0, 630, null, ['neutral', 'crit']],
    ['dinraal_horn', "Shard of Dinraal's Horn", '올드래곤의 뿔 조각', 'dragon', 0, null, 0, 1800, null, ['neutral', 'crit']],
    ['naydra_scale', "Naydra's Scale", '넬드래곤의 비늘', 'dragon', 0, null, 0, 90, null, ['neutral', 'crit']],
    ['naydra_claw', "Naydra's Claw", '넬드래곤의 발톱', 'dragon', 0, null, 0, 210, null, ['neutral', 'crit']],
    ['naydra_fang', "Shard of Naydra's Fang", '넬드래곤의 이빨 조각', 'dragon', 0, null, 0, 630, null, ['neutral', 'crit']],
    ['naydra_horn', "Shard of Naydra's Horn", '넬드래곤의 뿔 조각', 'dragon', 0, null, 0, 1800, null, ['neutral', 'crit']],
    ['farosh_scale', "Farosh's Scale", '필로드래곤의 비늘', 'dragon', 0, null, 0, 90, null, ['neutral', 'crit']],
    ['farosh_claw', "Farosh's Claw", '필로드래곤의 발톱', 'dragon', 0, null, 0, 210, null, ['neutral', 'crit']],
    ['farosh_fang', "Shard of Farosh's Fang", '필로드래곤의 이빨 조각', 'dragon', 0, null, 0, 630, null, ['neutral', 'crit']],
    ['farosh_horn', "Shard of Farosh's Horn", '필로드래곤의 뿔 조각', 'dragon', 0, null, 0, 1800, null, ['neutral', 'crit']],

    // 벌레 · 도마뱀 (물약 재료)
    ['hot_footed_frog', 'Hot-Footed Frog', '고고개구리', 'critter', 0, 'speed', 14],
    ['hightail_lizard', 'Hightail Lizard', '고고도마뱀', 'critter', 0, 'speed', 21],
    ['tireless_frog', 'Tireless Frog', '활력개구리', 'critter', 0, 'enduring', 4],
    ['hearty_lizard', 'Hearty Lizard', '맥스도마뱀', 'critter', 0, 'hearty', 2],
    ['restless_cricket', 'Restless Cricket', '원기메뚜기', 'critter', 0, 'energizing', 1],
    ['energetic_rhino_beetle', 'Energetic Rhino Beetle', '원기장수풍뎅이', 'critter', 0, 'energizing', 4],
    ['bladed_rhino_beetle', 'Bladed Rhino Beetle', '칼날장수풍뎅이', 'critter', 0, 'attack', 21],
    ['rugged_rhino_beetle', 'Rugged Rhino Beetle', '갑옷장수풍뎅이', 'critter', 0, 'defense', 21],
    ['winterwing_butterfly', 'Winterwing Butterfly', '썰렁호랑나비', 'critter', 0, 'heat', 14],
    ['summerwing_butterfly', 'Summerwing Butterfly', '따끈따끈호랑나비', 'critter', 0, 'cold', 14],
    ['thunderwing_butterfly', 'Thunderwing Butterfly', '찌릿찌릿호랑나비', 'critter', 0, 'shock', 14],
    ['smotherwing_butterfly', 'Smotherwing Butterfly', '방염호랑나비', 'critter', 0, 'fire', 14],
    ['cold_darner', 'Cold Darner', '썰렁왕잠자리', 'critter', 0, 'heat', 14],
    ['warm_darner', 'Warm Darner', '따끈따끈왕잠자리', 'critter', 0, 'cold', 14],
    ['electric_darner', 'Electric Darner', '찌릿찌릿왕잠자리', 'critter', 0, 'shock', 14],
    ['fireproof_lizard', 'Fireproof Lizard', '방염도마뱀', 'critter', 0, 'fire', 21],
    ['sunset_firefly', 'Sunset Firefly', '고요반딧불이', 'critter', 0, 'stealth', 14],
    ['deep_firefly', 'Deep Firefly', '어둠반딧불이', 'critter', 0, 'bright', 14, 0, T],
    ['sticky_frog', 'Sticky Frog', '접착개구리', 'critter', 0, 'sticky', 14, 0, T],
    ['sticky_lizard', 'Sticky Lizard', '접착도마뱀', 'critter', 0, 'sticky', 21, 0, T],

    // 몬스터 소재 (time = 지속시간 증가량, 나무위키: 뿔 70초 · 이빨 110초 · 간 190초)
    ['bokoblin_horn', 'Bokoblin Horn', '보코블린의 뿔', 'monster', 0, null, 0, 70],
    ['bokoblin_fang', 'Bokoblin Fang', '보코블린의 이빨', 'monster', 0, null, 0, 110],
    ['bokoblin_guts', 'Bokoblin Guts', '보코블린의 간', 'monster', 0, null, 0, 190],
    ['moblin_horn', 'Moblin Horn', '모리블린의 뿔', 'monster', 0, null, 0, 70],
    ['moblin_fang', 'Moblin Fang', '모리블린의 이빨', 'monster', 0, null, 0, 110],
    ['moblin_guts', 'Moblin Guts', '모리블린의 간', 'monster', 0, null, 0, 190],
    ['lizalfos_horn', 'Lizalfos Horn', '리잘포스의 뿔', 'monster', 0, null, 0, 70],
    ['lizalfos_talon', 'Lizalfos Talon', '리잘포스의 발톱', 'monster', 0, null, 0, 110],
    ['lizalfos_tail', 'Lizalfos Tail', '리잘포스의 꼬리', 'monster', 0, null, 0, 190],
    ['icy_lizalfos_tail', 'Icy Lizalfos Tail', '리잘포스의 푸른 꼬리', 'monster', 0, null, 0, 190, B],
    ['red_lizalfos_tail', 'Red Lizalfos Tail', '리잘포스의 붉은 꼬리', 'monster', 0, null, 0, 190, B],
    ['yellow_lizalfos_tail', 'Yellow Lizalfos Tail', '리잘포스의 노란 꼬리', 'monster', 0, null, 0, 190, B],
    ['lynel_horn', 'Lynel Horn', '라이넬의 뿔', 'monster', 0, null, 0, 70, B],
    ['lynel_hoof', 'Lynel Hoof', '라이넬의 발굽', 'monster', 0, null, 0, 110],
    ['lynel_guts', 'Lynel Guts', '라이넬의 간', 'monster', 0, null, 0, 490],
    ['chuchu_jelly', 'Chuchu Jelly', '츄츄젤리', 'monster', 0, null, 0, 70],
    ['white_chuchu_jelly', 'White Chuchu Jelly', '하얀츄츄젤리', 'monster', 0, null, 0, 110],
    ['red_chuchu_jelly', 'Red Chuchu Jelly', '빨간츄츄젤리', 'monster', 0, null, 0, 110],
    ['yellow_chuchu_jelly', 'Yellow Chuchu Jelly', '노란츄츄젤리', 'monster', 0, null, 0, 110],
    ['keese_wing', 'Keese Wing', '키이스의 날개', 'monster', 0, null, 0, 70],
    ['ice_keese_wing', 'Ice Keese Wing', '아이스 키이스의 날개', 'monster', 0, null, 0, 110, B],
    ['fire_keese_wing', 'Fire Keese Wing', '파이어 키이스의 날개', 'monster', 0, null, 0, 110, B],
    ['electric_keese_wing', 'Electric Keese Wing', '일렉트로 키이스의 날개', 'monster', 0, null, 0, 110, B],
    ['keese_eyeball', 'Keese Eyeball', '키이스의 눈알', 'monster', 0, null, 0, 190],
    ['octorok_tentacle', 'Octorok Tentacle', '옥타의 다리', 'monster', 0, null, 0, 70],
    ['octorok_eyeball', 'Octorok Eyeball', '옥타의 눈알', 'monster', 0, null, 0, 110],
    ['octo_balloon', 'Octo Balloon', '옥타 풍선', 'monster', 0, null, 0, 70],
    ['molduga_fin', 'Molduga Fin', '몰드래고의 등지느러미', 'monster', 0, null, 0, 110],
    ['molduga_guts', 'Molduga Guts', '몰드래고의 간', 'monster', 0, null, 0, 190],
    ['hinox_toenail', 'Hinox Toenail', '히녹스의 발톱', 'monster', 0, null, 0, 70],
    ['hinox_tooth', 'Hinox Tooth', '히녹스의 이빨', 'monster', 0, null, 0, 110],
    ['hinox_guts', 'Hinox Guts', '히녹스의 간', 'monster', 0, null, 0, 190],
    ['ancient_screw', 'Ancient Screw', '고대의 나사', 'monster', 0, null, 0, 70, B],
    ['ancient_spring', 'Ancient Spring', '고대의 스프링', 'monster', 0, null, 0, 70, B],
    ['ancient_gear', 'Ancient Gear', '고대의 톱니', 'monster', 0, null, 0, 110, B],
    ['ancient_shaft', 'Ancient Shaft', '고대의 샤프트', 'monster', 0, null, 0, 110, B],
    ['ancient_core', 'Ancient Core', '고대의 코어', 'monster', 0, null, 0, 190, B],
    ['giant_ancient_core', 'Giant Ancient Core', '고대의 거대한 코어', 'monster', 0, null, 0, 190, B],
    ['gibdo_wing', 'Gibdo Wing', '기브도의 날개', 'monster', 0, null, 0, 70, T],
    ['gibdo_bone', 'Gibdo Bone', '기브도의 뼈', 'monster', 0, null, 0, 110, T],
    ['gibdo_guts', 'Gibdo Guts', '기브도의 간', 'monster', 0, null, 0, 190, T, ['crit']],
    ['aerocuda_wing', 'Aerocuda Wing', '에어로쿠다의 날개', 'monster', 0, null, 0, 70, T],
    ['aerocuda_eyeball', 'Aerocuda Eyeball', '에어로쿠다의 눈알', 'monster', 0, null, 0, 110, T],
    ['horriblin_horn', 'Horriblin Horn', '호리블린의 뿔', 'monster', 0, null, 0, 70, T],
    ['horriblin_claw', 'Horriblin Claw', '호리블린의 발톱', 'monster', 0, null, 0, 110, T],
    ['horriblin_guts', 'Horriblin Guts', '호리블린의 간', 'monster', 0, null, 0, 190, T],
    ['like_like_stone', 'Like Like Stone', '라이크라이크의 돌', 'monster', 0, null, 0, 110, T],
    ['frox_fingernail', 'Frox Fingernail', '프록스의 손톱', 'monster', 0, null, 0, 110, T],
    ['frox_fang', 'Frox Fang', '프록스의 이빨', 'monster', 0, null, 0, 110, T],
    ['frox_guts', 'Frox Guts', '프록스의 간', 'monster', 0, null, 0, 190, T],

    // 광물 · 기타 (넣으면 너무 딱딱한 요리)
    ['flint', 'Flint', '부싯돌', 'mineral', 0],
    ['amber', 'Amber', '호박', 'mineral', 0],
    ['opal', 'Opal', '오팔', 'mineral', 0],
    ['luminous_stone', 'Luminous Stone', '야광석', 'mineral', 0],
    ['topaz', 'Topaz', '토파즈', 'mineral', 0],
    ['ruby', 'Ruby', '루비', 'mineral', 0],
    ['sapphire', 'Sapphire', '사파이어', 'mineral', 0],
    ['diamond', 'Diamond', '다이아몬드', 'mineral', 0],
    ['wood', 'Wood', '장작 묶음', 'mineral', 0],
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
    { id: 'veg', ko: '채소' },
    { id: 'flower', ko: '약초·꽃' },
    { id: 'nut', ko: '견과' },
    { id: 'meat', ko: '육류', also: ['poultry'] },
    { id: 'fish', ko: '어패류', also: ['seafood'] },
    { id: 'other', ko: '농축산물·조미료' },
    { id: 'critter', ko: '벌레류' },
    { id: 'monster', ko: '몬스터 부위' },
    { id: 'special', ko: '용·요정·별', also: ['dragon'] },
    { id: 'mineral', ko: '광석' },
  ];

  // ---------------------------------------------------------------- 레시피
  // req: 필요한 재료 슬롯 목록. 각 슬롯은 태그 하나 또는 태그 배열(그중 하나).
  //      각 슬롯은 서로 다른 재료로 채워야 한다. 기본 재료만 갖추면 다른 재료를 더 넣어도 된다.
  // only: 이 태그에 속하는 재료로만 만들어야 하는 경우.
  // distinct: 서로 다른 재료 종류가 최소 몇 개 필요한지.
  // pri: 우선순위(기본값 = 슬롯 개수). 여러 레시피가 맞으면 높은 쪽이 선택된다.
  const R = (en, ko, req, opt = {}) => ({ en, ko, req, ...opt });
  const SEA = 'seafoodany';                       // 어패류 전체
  const MEAT_PRIME = ['raw_prime_meat', 'raw_bird_thigh'];
  const MEAT_GOURMET = ['raw_gourmet_meat', 'raw_whole_bird'];

  const RECIPES = [
    // 꼬치구이 · 볶음
    R('Mushroom Skewer', '버섯 꼬치구이', ['mushroom'], { only: ['mushroom'], pri: 1 }),
    R('Copious Mushroom Skewers', '버섯구이 곱빼기', ['mushroom'], { only: ['mushroom'], distinct: 4, pri: 4 }),
    R('Meat Skewer', '고기 꼬치구이', ['meatany'], { only: ['meatany'], pri: 1 }),
    R('Copious Meat Skewers', '고기 꼬치구이 곱빼기', ['meatany'], { only: ['meatany'], distinct: 4, pri: 4 }),
    R('Fish Skewer', '생선 꼬치구이', ['fish'], { only: [SEA], pri: 1 }),
    R('Seafood Skewer', '해산물 꼬치구이', ['seafood'], { only: ['seafood'], pri: 1.1 }),
    R('Copious Seafood Skewers', '생선 꼬치구이 곱빼기', [SEA], { only: [SEA], distinct: 4, pri: 4 }),
    R('Simmered Fruit', '과일전골', ['fruit'], { only: ['fruit'], pri: 1 }),
    R('Copious Simmered Fruit', '과일전골 곱빼기', ['fruit'], { only: ['fruit'], distinct: 4, pri: 4 }),
    R('Fried Wild Greens', '야채구이', ['greens'], { only: ['greens'], pri: 1 }),
    R('Copious Fried Wild Greens', '야채구이 곱빼기', ['greens'], { only: ['greens'], distinct: 4, pri: 4 }),
    R('Sautéed Nuts', '너츠볶음', ['nut'], { only: ['nut'], pri: 1 }),
    R('Spicy Sautéed Peppers', '따끈따끈볶음', ['spicy_pepper'], { only: ['spicy_pepper'], pri: 1.5 }),
    R('Meat and Mushroom Skewer', '고기 꼬치구이와 버섯', ['meatany', 'mushroom'], { only: ['meatany', 'mushroom'] }),
    R('Fish and Mushroom Skewer', '생선 꼬치구이와 버섯', [SEA, 'mushroom'], { only: [SEA, 'mushroom'] }),
    R('Meat and Seafood Fry', '고기와 생선구이', ['meatany', SEA], { only: ['meatany', SEA] }),
    R('Prime Meat and Seafood Fry', '상급 고기와 생선구이', [MEAT_PRIME, SEA], { only: ['meatany', SEA], pri: 2.5 }),
    R('Gourmet Meat and Seafood Fry', '특급 고기와 생선구이', [MEAT_GOURMET, SEA], { only: ['meatany', SEA], pri: 2.6 }),
    R('Fruit and Mushroom Mix', '과일 버섯무침', ['fruit', 'mushroom'], { only: ['fruit', 'mushroom'] }),
    R('Steamed Fruit', '과일찜', ['fruit', 'greens'], { only: ['fruit', 'greens'] }),
    R('Steamed Mushrooms', '버섯쌈구이', ['mushroom', 'greens'], { only: ['mushroom', 'greens'] }),
    R('Steamed Meat', '고기쌈구이', ['meatany', 'greens'], { only: ['meatany', 'greens'] }),
    R('Steamed Fish', '생선쌈구이', [SEA, 'greens'], { only: [SEA, 'greens'] }),
    R('Pepper Steak', '스파이시 고기구이', ['meatany', 'spicy_pepper'], { pri: 2.3 }),
    R('Pepper Seafood', '스파이시 생선구이', [SEA, 'spicy_pepper'], { pri: 2.3 }),
    R('Meat-Stuffed Pumpkin', '고기를 넣은 호박', ['pumpkin', 'meatany'], { pri: 2.4 }),

    // 암염
    R('Salt-Grilled Greens', '야채 소금구이', ['salt', 'greens']),
    R('Salt-Grilled Mushrooms', '버섯 소금구이', ['salt', 'mushroom']),
    R('Salt-Grilled Fish', '생선 소금구이', ['salt', SEA]),
    R('Salt-Grilled Crab', '게 소금구이', ['salt', 'crab'], { pri: 2.1 }),
    R('Salt-Grilled Meat', '고기 소금구이', ['salt', 'meatany']),
    R('Salt-Grilled Prime Meat', '상급 고기 소금구이', ['salt', MEAT_PRIME], { pri: 2.1 }),
    R('Salt-Grilled Gourmet Meat', '특급 고기 소금구이', ['salt', MEAT_GOURMET], { pri: 2.2 }),

    // 고론의 향신료
    R('Spiced Meat Skewer', '짐승 스테이크', ['spice', 'raw_meat'], { pri: 2.1 }),
    R('Prime Spiced Meat Skewer', '상급 짐승 스테이크', ['spice', 'raw_prime_meat'], { pri: 2.1 }),
    R('Gourmet Spiced Meat Skewer', '특급 짐승 스테이크', ['spice', 'raw_gourmet_meat'], { pri: 2.1 }),
    R('Herb Sauté', '향긋한 나물볶음', ['spice', 'greens']),
    R('Fragrant Mushroom Sauté', '향긋한 버섯볶음', ['spice', 'mushroom']),
    R('Crab Stir-Fry', '게 볶음', ['crab', 'spice'], { pri: 2.1 }),

    // 벌꿀
    R('Honey Candy', '벌꿀 사탕', ['honey'], { only: ['honey'], pri: 1.5 }),
    R('Honeyed Apple', '꿀에 절인 사과', ['honey', 'apple'], { pri: 2.2 }),
    R('Honeyed Fruits', '꿀에 절인 과일', ['honey', 'fruit']),
    R('Glazed Veggies', '달게 조린 야채', ['honey', 'greens']),
    R('Glazed Mushrooms', '달게 조린 버섯', ['honey', 'mushroom']),
    R('Glazed Meat', '달게 조린 고기', ['honey', 'meatany']),
    R('Glazed Seafood', '달게 조린 생선', ['honey', SEA]),

    // 뫼니에르
    R('Seafood Meunière', '생선 뫼니에르', ['wheat', 'butter', SEA]),
    R('Porgy Meunière', '도미 뫼니에르', ['wheat', 'butter', 'porgy'], { pri: 3.1 }),
    R('Salmon Meunière', '연어 뫼니에르', ['wheat', 'butter', 'salmon'], { pri: 3.1 }),

    // 수프 · 스튜
    R('Creamy Heart Soup', '하트 밀크수프', ['radish', 'hydromelon', 'voltfruit', 'milk'], { pri: 10 }),
    R('Cream of Vegetable Soup', '야채 밀크수프', ['milk', 'salt', 'greens']),
    R('Veggie Cream Soup', '야채 크림수프', ['milk', 'salt', ['carrot', 'pumpkin']], { pri: 3.1 }),
    R('Creamy Seafood Soup', '생선 밀크수프', ['milk', 'salt', 'greens', SEA]),
    R('Creamy Meat Soup', '고기 밀크수프', ['milk', 'salt', 'greens', 'meatany']),
    R('Cream of Mushroom Soup', '버섯 밀크수프', ['milk', 'salt', 'greens', 'mushroom']),
    R('Carrot Stew', '당근 스튜', ['milk', 'wheat', 'butter', 'carrot'], { pri: 4.2 }),
    R('Pumpkin Stew', '호박 스튜', ['milk', 'wheat', 'butter', 'pumpkin'], { pri: 4.2 }),
    R('Meat Stew', '고기 스튜', ['milk', 'wheat', 'butter', 'meatany'], { pri: 4.1 }),
    R('Prime Meat Stew', '상급 고기 스튜', ['milk', 'wheat', 'butter', MEAT_PRIME], { pri: 4.3 }),
    R('Gourmet Meat Stew', '특급 고기 스튜', ['milk', 'wheat', 'butter', MEAT_GOURMET], { pri: 4.4 }),
    R('Clam Chowder', '조개 차우더', ['milk', 'wheat', 'butter', 'hearty_blueshell_snail'], { g: B, pri: 4.3 }),
    R('Snail Chowder', '조개 차우더', ['milk', 'wheat', 'butter', 'sneaky_river_snail'], { g: T, pri: 4.3 }),

    // 쌀
    R('Curry Rice', '카레라이스', ['rice', 'spice'], { pri: 2.5 }),
    R('Vegetable Curry', '야채 카레', ['rice', 'spice', ['carrot', 'pumpkin']], { pri: 3.1 }),
    R('Seafood Curry', '해산물 카레', ['rice', 'spice', ['porgy', 'hearty_blueshell_snail']], { pri: 3.1 }),
    R('Poultry Curry', '치킨 카레', ['rice', 'spice', 'raw_bird_drumstick'], { pri: 3.1 }),
    R('Prime Poultry Curry', '상급 치킨 카레', ['rice', 'spice', 'raw_bird_thigh'], { pri: 3.1 }),
    R('Gourmet Poultry Curry', '특급 치킨 카레', ['rice', 'spice', 'raw_whole_bird'], { pri: 3.1 }),
    R('Meat Curry', '짐승 고기 카레', ['rice', 'spice', 'raw_meat'], { pri: 3.1 }),
    R('Prime Meat Curry', '상급 고기 카레', ['rice', 'spice', 'raw_prime_meat'], { pri: 3.1 }),
    R('Gourmet Meat Curry', '특급 고기 카레', ['rice', 'spice', 'raw_gourmet_meat'], { pri: 3.1 }),
    R('Curry Pilaf', '카레 필래프', ['rice', 'egg', 'butter', 'spice']),
    R('Poultry Pilaf', '치킨 필래프', ['rice', 'egg', 'butter', 'raw_bird_drumstick'], { pri: 4.1 }),
    R('Prime Poultry Pilaf', '상급 치킨 필래프', ['rice', 'egg', 'butter', 'raw_bird_thigh'], { pri: 4.1 }),
    R('Gourmet Poultry Pilaf', '특급 치킨 필래프', ['rice', 'egg', 'butter', 'raw_whole_bird'], { pri: 4.1 }),
    R('Seafood Paella', '해물 파에야', ['rice', 'butter', 'salt', 'porgy', 'hearty_blueshell_snail'], { g: B }),
    R('Seafood Paella', '해물 파에야', ['rice', 'butter', 'salt', 'porgy', 'crab'], { g: T }),
    R('Vegetable Risotto', '야채 리조또', ['rice', 'butter', 'salt', ['carrot', 'pumpkin']], { pri: 4.1 }),
    R('Mushroom Risotto', '버섯 리조또', ['rice', 'butter', 'salt', 'mushroom']),
    R('Salmon Risotto', '연어 리조또', ['rice', 'butter', 'salt', 'salmon'], { pri: 4.1 }),
    R('Crab Risotto', '게살 리조또', ['rice', 'butter', 'salt', 'crab'], { pri: 4.1 }),
    R('Fried Egg and Rice', '달걀프라이라이스', ['rice', 'egg'], { pri: 2.4 }),
    R('Seafood Fried Rice', '해물볶음밥', ['rice', 'salt', ['porgy', 'hearty_blueshell_snail']], { pri: 3.1 }),
    R('Crab Omelet with Rice', '게살 달걀볶음밥', ['egg', 'salt', 'rice', 'crab'], { pri: 4.1 }),
    R('Meat and Rice Bowl', '짐승 고기덮밥', ['rice', 'salt', 'raw_meat'], { pri: 3.1 }),
    R('Prime Meat and Rice Bowl', '상급 짐승 고기덮밥', ['rice', 'salt', 'raw_prime_meat'], { pri: 3.1 }),
    R('Gourmet Meat and Rice Bowl', '특급 짐승 고기덮밥', ['rice', 'salt', 'raw_gourmet_meat'], { pri: 3.1 }),
    R('Veggie Rice Balls', '야채 주먹밥', ['rice', 'greens'], { pri: 2.4 }),
    R('Mushroom Rice Balls', '버섯 주먹밥', ['rice', 'mushroom'], { pri: 2.4 }),
    R('Meaty Rice Balls', '고기 주먹밥', ['rice', 'meatany'], { pri: 2.4 }),
    R('Seafood Rice Balls', '해물 주먹밥', ['rice', SEA], { pri: 2.4 }),

    // 달걀
    R('Omelet', '오믈렛', ['egg'], { only: ['egg'], pri: 1.5 }),
    R('Vegetable Omelet', '야채 오믈렛', ['egg', 'butter', 'salt', 'greens']),
    R('Mushroom Omelet', '버섯 오믈렛', ['egg', 'butter', 'salt', 'mushroom']),

    // 밀 · 디저트
    R('Wheat Bread', '밀 빵', ['wheat', 'salt']),
    R('Warm Milk', '핫밀크', ['milk'], { only: ['milk'], pri: 1.5 }),
    R('Apple Pie', '애플파이', ['wheat', 'sugar', 'butter', 'apple'], { pri: 4.2 }),
    R('Fruit Pie', '프루트 파이', ['wheat', 'sugar', 'butter', 'fruit'], { pri: 4.1 }),
    R('Pumpkin Pie', '호박 케이크', ['wheat', 'sugar', 'butter', 'pumpkin'], { pri: 4.2 }),
    R('Carrot Cake', '당근 케이크', ['wheat', 'sugar', 'butter', 'carrot'], { pri: 4.2 }),
    R('Nutcake', '너츠 케이크', ['wheat', 'sugar', 'butter', 'nut'], { pri: 4.2 }),
    R('Egg Tart', '에그 타르트', ['egg', 'wheat', 'sugar', 'butter'], { pri: 4.2 }),
    R('Fish Pie', '피시 파이', ['wheat', 'salt', 'butter', SEA], { pri: 4.1 }),
    R('Meat Pie', '미트 파이', ['wheat', 'salt', 'butter', 'meatany'], { pri: 4.1 }),
    R('Fruitcake', '프루트케이크', ['wheat', 'sugar', ['apple', 'wildberry'], 'fruit'], { pri: 4.3 }),
    R('Hot Buttered Apple', '버터 바른 사과', ['apple', 'butter'], { pri: 2.2 }),
    R('Fried Bananas', '튀긴 바나나', ['banana', 'wheat', 'sugar']),
    R('Egg Pudding', '달걀 푸딩', ['milk', 'egg', 'sugar']),
    R('Plain Crepe', '플레인 크레이프', ['milk', 'egg', 'wheat', 'sugar']),
    R('Honey Crepe', '벌꿀 크레이프', ['milk', 'egg', 'wheat', 'sugar', 'honey']),
    R('Wildberry Crepe', '딸기 크레이프', ['milk', 'egg', 'wheat', 'sugar', 'wildberry']),

    // 몬스터엑기스
    R('Monster Stew', '몬스터전골', ['extract', 'meatany', SEA], { pri: 20 }),
    R('Monster Soup', '몬스터수프', ['extract', 'milk', 'wheat', 'butter'], { pri: 21 }),
    R('Monster Curry', '몬스터 카레', ['extract', 'rice', 'spice'], { pri: 20 }),
    R('Monster Rice Balls', '몬스터 주먹밥', ['extract', 'rice', 'salt'], { pri: 20 }),
    R('Monster Cake', '몬스터 케이크', ['extract', 'wheat', 'sugar', 'butter'], { pri: 21 }),

    // 왕국의 눈물 신규 요리
    R('Steamed Tomatoes', '야채 토마토찜', ['greens', 'tomato'], { g: T, only: ['greens', 'tomato'], pri: 2.1 }),
    R('Cooked Stambulb', '통구이', ['stambulb'], { g: T, only: ['stambulb'], pri: 1.5 }),
    R('Buttered Stambulb', '버터볶음', ['stambulb', 'butter'], { g: T, pri: 2.3 }),
    R('Fragrant Seafood Stew', '오일 해산물전골', [SEA, 'stambulb', 'oil'], { g: T, pri: 3.3 }),
    R('Deep-Fried Drumstick', '오일 새 고기 튀김', ['raw_bird_drumstick', 'oil'], { g: T, pri: 2.3 }),
    R('Deep-Fried Thigh', '오일 상급 새 고기 튀김', ['raw_bird_thigh', 'oil'], { g: T, pri: 2.3 }),
    R('Deep-Fried Bird Roast', '오일 특급 새 고기 튀김', ['raw_whole_bird', 'oil'], { g: T, pri: 2.3 }),
    R('Simmered Tomato', '토마토전골', ['tomato'], { g: T, only: ['tomato'], pri: 1.5 }),
    R('Fruity Tomato Stew', '토마토수프', ['tomato', 'milk', 'salt'], { g: T, pri: 3.2 }),
    R('Tomato Mushroom Stew', '버섯 토마토전골', ['mushroom', 'tomato'], { g: T, pri: 2.3 }),
    R('Tomato Seafood Soup', '해산물 토마토수프', [SEA, 'tomato'], { g: T, pri: 2.3 }),
    R('Cheesy Curry', '치즈 카레', ['spice', 'rice', 'cheese'], { g: T, pri: 3.2 }),
    R('Cheesy Risotto', '치즈 리조또', [[SEA, 'mushroom'], 'rice', 'salt', 'cheese'], { g: T, pri: 4.2 }),
    R('Crunchy Fried Rice', '고슬고슬 볶음밥', ['rice', 'egg', 'meatany', 'oil'], { g: T, pri: 4.2 }),
    R('Cheesy Meat Bowl', '치즈 짐승 고기 덮밥', ['rice', 'raw_meat', 'salt', 'cheese'], { g: T, pri: 4.2 }),
    R('Prime Cheesy Meat Bowl', '상급 치즈 짐승 고기 덮밥', ['rice', 'raw_prime_meat', 'salt', 'cheese'], { g: T, pri: 4.2 }),
    R('Gourmet Cheesy Meat Bowl', '특급 치즈 짐승 고기 덮밥', ['rice', 'raw_gourmet_meat', 'salt', 'cheese'], { g: T, pri: 4.2 }),
    R('Veggie Porridge', '야채 우유 죽', ['greens', 'rice', 'milk'], { g: T, pri: 3.2 }),
    R('Melty Cheesy Bread', '사르르 치즈빵', ['wheat', 'cheese'], { g: T, pri: 2.3 }),
    R('Hylian Tomato Pizza', '토마토 피자', ['wheat', 'cheese', 'tomato'], { g: T, pri: 3.3 }),
    R('Cheesy Tomato', '치즈 토마토', ['tomato', 'cheese'], { g: T, pri: 2.3 }),
    R('Cheesy Baked Fish', '해산물과 치즈구이', [SEA, 'cheese'], { g: T, pri: 2.3 }),
    R('Cheesy Omelet', '치즈 오믈렛', ['egg', 'salt', 'mushroom', 'cheese'], { g: T, pri: 4.2 }),
    R('Cheesecake', '치즈케이크', ['wheat', 'sugar', 'cheese'], { g: T, pri: 3.3 }),
    R('Noble Pursuit', '브아이 밋 브오이', ['palm_fruit', 'hydromelon', 'voltfruit', 'salt'], { g: T, pri: 10 }),
    R('Dark Stew', '마인 전골', ['dark', 'meatany', SEA], { g: T, pri: 20 }),
    R('Dark Soup', '마인 수프', ['dark', 'milk', 'wheat', 'butter'], { g: T, pri: 21 }),
    R('Dark Curry', '마인 카레', ['dark', 'rice', 'spice'], { g: T, pri: 20 }),
    R('Dark Rice Ball', '마인 주먹밥', ['dark', 'rice', 'salt'], { g: T, pri: 20 }),
    R('Dark Cake', '마인 케이크', ['dark', 'wheat', 'sugar', 'butter'], { g: T, pri: 21 }),
  ];

  // 특수 결과
  const SPECIAL = {
    dubious: { en: 'Dubious Food', ko: '애매한 요리' },
    rockhard: { en: 'Rock-Hard Food', ko: '너무 딱딱한 요리' },
    fairy: { en: 'Fairy Tonic', ko: '요정의 활력수' },
  };

  root.ZDATA = { EFFECTS, INGREDIENTS, CATEGORIES, RECIPES, SPECIAL };
  if (typeof module !== 'undefined') module.exports = root.ZDATA;
})(typeof window !== 'undefined' ? window : globalThis);
