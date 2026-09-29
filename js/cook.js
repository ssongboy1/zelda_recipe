// 요리 계산 엔진
// 게임의 요리 로직(CookingMgr)을 분석한 공개 구현을 바탕으로 한다.
//  - 야생의 숨결: savage13/cooking
//  - 왕국의 눈물: Echocolat/TOTK-Cooking-Calculator
// 두 게임은 계산식이 같고, 레시피를 고르는 방식과 재료 수치만 다르다.
(function (root) {
  const D = root.ZDATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const { EFFECTS, GAMES, TAG_KO } = D;

  const MAX_HP = 120;         // 30하트 (1/4 하트 단위)
  const MAX_TIME = 30 * 60;   // 30분
  const TIME_PER_ITEM = 30;   // 재료 하나당 기본 30초
  const f32 = Math.fround;    // 게임은 32비트 실수로 계산한다

  // 게임별 재료 색인
  const INDEX = {};
  for (const [game, G] of Object.entries(GAMES)) {
    INDEX[game] = Object.fromEntries(G.materials.map((m) => [m.id, m]));
  }
  const material = (game, id) => INDEX[game][id];
  const isTag = (opt) => opt.startsWith('Cook');
  const unique = (list) => [...new Map(list.map((m) => [m.id, m])).values()];

  // ------------------------------------------------------------------ 레시피 찾기
  // 왕국의 눈물: 재료 "종류" 목록으로 판정한다. 각 조건마다 앞쪽 선택지부터 먼저 찾는다.
  function matchTotk(G, mats) {
    const uniq = unique(mats);
    const hits = (m, opt) => m.id === opt || m.tag === opt;
    const singleMatch = (first) => G.singles.find((r) => r.parts[0].some((opt) => hits(first, opt)));

    if (uniq.length === 1) return singleMatch(uniq[0]) || null;

    for (const r of G.recipes) {
      if (r.parts.length > uniq.length) continue;
      const left = [...uniq];
      const ok = r.parts.every((part) => part.some((opt) => {
        const i = left.findIndex((m) => hits(m, opt));
        if (i < 0) return false;
        left.splice(i, 1);
        return true;
      }));
      if (ok) return r;
    }
    // 맞는 레시피가 없고 조미료가 섞여 있으면 첫 재료로 단일 레시피를 한 번 더 찾는다
    const tags = new Set(uniq.map((m) => m.tag));
    if (tags.has('CookSpice') && tags.size >= 2) return singleMatch(uniq[0]) || null;
    return null;
  }

  // 야생의 숨결: 한 종류만 넣었을 때는 단일 레시피, 아니면 순서대로 판정한다.
  // 조건에 맞는 재료를 찾으면 그 재료는 개수와 상관없이 모두 소비된다.
  function matchBotw(G, mats) {
    if (unique(mats).length === 1) {
      const m = mats[0];
      const r = G.singles.find((row) => row.parts[0].some((opt) => opt === m.id || opt === m.tag));
      if (r) return r;
    }
    for (const r of G.recipes) {
      let left = [...mats];
      let ok = true;
      for (const part of r.parts) {
        let found = null;
        if (isTag(part[0])) {
          // 태그 조건: 선택지를 모두 훑고 마지막으로 맞은 것을 쓴다 (게임 동작 그대로)
          for (const opt of part) {
            const m = left.find((x) => x.tag === opt);
            if (m) found = m;
          }
        } else {
          const opt = part.find((o) => left.some((x) => x.id === o));
          if (opt) found = left.find((x) => x.id === opt);
        }
        if (!found) { ok = false; break; }
        left = left.filter((x) => x.id !== found.id);
      }
      if (ok) return r;
    }
    return null;
  }

  function findRecipe(game, mats) {
    return game === 'totk' ? matchTotk(GAMES[game], mats) : matchBotw(GAMES[game], mats);
  }

  // ------------------------------------------------------------------ 효과
  function effectLevel(type, potency, game) {
    const E = EFFECTS[type];
    if (type === 'LifeMaxUp' || type === 'LifeRepair') {
      // 1/4 하트 단위 → 하트 수. 왕눈은 가장 가까운 한 칸으로 반올림, 야숨은 내림
      const q = Math.min(potency * E.rate, E.max);
      if (game === 'totk') return Math.max(4, 4 * Math.round(q / 4)) / 4;
      return Math.max(1, Math.floor(q / 4));
    }
    const raw = Math.min(f32(f32(E.rate) * potency), E.max);
    return Math.max(E.min, Math.floor(raw));
  }

  function computeEffect(game, mats, recipe, notes) {
    const types = [...new Set(mats.filter((m) => m.eff).map((m) => m.eff))];
    if (types.length === 0) return null;
    if (types.length > 1) {
      notes.push(`서로 다른 효과(${types.map((t) => EFFECTS[t].prefix).join(', ')})가 섞여서 효과가 사라졌어요.`);
      return null;
    }
    const type = types[0];
    const E = EFFECTS[type];
    const potency = mats.filter((m) => m.eff === type).reduce((s, m) => s + m.pot, 0);
    const level = effectLevel(type, potency, game);
    const e = { type, prefix: E.prefix, ko: E.ko, en: E.en, icon: E.icon, potency };

    if (type === 'LifeMaxUp') e.extraHearts = level;
    else if (type === 'LifeRepair') e.gloomHearts = level;
    else if (type === 'StaminaRecover' || type === 'ExStaminaMaxUp') e.wheels = Math.round(level / 5 * 10) / 10;
    else {
      e.level = level;
      e.maxLevel = E.max;
      // 지속시간: 재료마다 30초 + 효과 재료마다 효과 기본 시간 + 재료별 추가 시간
      const count = mats.filter((m) => m.eff === type).length;
      let t = mats.reduce((s, m) => s + (m.base ?? TIME_PER_ITEM), 0) + count * E.baseTime;
      if (game === 'totk') {
        // 몬스터 부위는 개수만큼, 나머지 재료는 종류당 한 번만 더한다
        t += mats.filter((m) => m.tag === 'CookEnemy').reduce((s, m) => s + (m.sTime || 0), 0);
        t += unique(mats).filter((m) => m.tag !== 'CookEnemy').reduce((s, m) => s + (m.sTime || 0), 0);
        t += recipe.bonusTime || 0;
      } else {
        t += mats.reduce((s, m) => s + (m.sTime || 0), 0);
      }
      e.seconds = Math.min(t, MAX_TIME);
    }
    return e;
  }

  // ------------------------------------------------------------------ 요리
  function failNote(mats, notes) {
    const food = mats.filter((m) => !['CookInsect', 'CookEnemy', 'CookOre'].includes(m.tag));
    const bugs = mats.some((m) => m.tag === 'CookInsect');
    const parts = mats.some((m) => m.tag === 'CookEnemy');
    if (bugs && !parts) notes.push('벌레류는 몬스터 부위와 함께 넣어야 물약이 돼요.');
    else if (parts && !bugs) notes.push(food.length ? '몬스터 부위는 식재료와 함께 요리할 수 없어요. 벌레류와 함께 넣으면 물약이 됩니다.' : '몬스터 부위만으로는 요리가 되지 않아요. 벌레류와 함께 넣으면 물약이 됩니다.');
    else if (bugs && parts) notes.push('물약에는 벌레류·몬스터 부위와 같은 효과(또는 효과 없는) 재료만 넣을 수 있어요.');
    else notes.push('이 조합에 맞는 레시피가 없어요.');
  }

  function cook(ids, game) {
    const G = GAMES[game];
    const mats = ids.map((id) => material(game, id)).filter(Boolean);
    if (mats.length === 0) return null;
    const notes = [];
    const rawHp = mats.reduce((s, m) => s + (m.hp || 0), 0);
    const base = { mats, notes };

    const dubious = (hp) => ({ ...base, kind: 'dubious', ko: '애매한 요리', en: 'Dubious Food', img: 'Dubious Food', hp });

    let recipe = findRecipe(game, mats);
    if (!recipe) {
      failNote(mats, notes);
      return dubious(game === 'totk' ? 4 : Math.max(4, rawHp));
    }
    if (recipe.kind === 'rockhard') {
      notes.push('광석이나 장작처럼 먹을 수 없는 것이 들어갔어요. 1/4하트만 회복됩니다.');
      return { ...base, kind: 'rockhard', ko: recipe.ko, en: recipe.en, img: recipe.img, hp: 1, recipe };
    }
    if (recipe.kind === 'dubious' || recipe.kind === 'fail') {
      failNote(mats, notes);
      return { ...dubious(Math.max(4, rawHp)), recipe };
    }

    const effect = recipe.kind === 'fairy' ? null : computeEffect(game, mats, recipe, notes);
    if (recipe.kind === 'elixir' && !effect) {
      if (!notes.length) notes.push('물약에는 효과가 있는 벌레류가 필요해요.');
      return dubious(Math.max(4, rawHp));
    }

    // 회복량: 재료 회복량 × 2 + 재료별 추가 회복(종류당 한 번) + 레시피 보너스
    let hp = rawHp * 2;
    hp += unique(mats).filter((m) => game !== 'totk' || m.tag !== 'CookEnemy').reduce((s, m) => s + (m.sHp || 0), 0);
    hp += recipe.bonusHp || 0;
    hp = Math.max(0, Math.min(MAX_HP, hp));
    if (game === 'totk' && !effect && hp === 0) hp = 1; // 왕눈: 효과도 회복도 없는 요리는 1/4하트

    // 대성공 확률: 재료 중 가장 높은 대성공 보너스 + 재료 종류 수에 따른 기본 확률
    const hasExtract = mats.some((m) => m.en === 'Monster Extract');
    let crit = Math.min(100, Math.max(0, ...mats.map((m) => m.crit || 0)) + G.critByTypes[unique(mats).length - 1]);
    if (hasExtract) {
      crit = 0;
      notes.push('몬스터엑기스는 회복량·효과 단계·지속시간을 무작위로 바꾸고, 대성공이 나지 않아요. 표시된 값은 엑기스 효과를 빼고 계산한 값이에요.');
    } else if (crit >= 100) {
      notes.push('용의 소재나 별의 조각이 들어가서 반드시 대성공해요. 대성공하면 하트 +3칸, 효과 1단계 상승, 지속시간 +5분 중 하나가 붙어요.');
    }

    const res = { ...base, recipe, effect, hp, crit, img: recipe.img };
    if (recipe.kind === 'elixir') {
      Object.assign(res, { kind: 'elixir', ko: `${effect.prefix} ${G.elixir.ko}`, en: `${effect.en} ${G.elixir.en}` });
      res.img = res.en;
    } else {
      Object.assign(res, {
        kind: recipe.kind === 'fairy' ? 'fairy' : 'dish',
        ko: effect ? `${effect.prefix} ${recipe.ko}` : recipe.ko,
        en: effect ? `${effect.en} ${recipe.en}` : recipe.en,
      });
    }
    if (effect && effect.type === 'LifeMaxUp') res.fullRecovery = true;
    if (hp >= MAX_HP) res.fullRecovery = true;
    return res;
  }

  // ------------------------------------------------------------------ 레시피 도감용
  // 요리마다 가장 간단한 판정 조건 한 줄을 고른다
  function recipeBook(game) {
    const G = GAMES[game];
    const best = new Map();
    for (const r of [...G.recipes, ...G.singles]) {
      if (r.kind === 'dubious' || r.kind === 'fail' || r.kind === 'rockhard') continue;
      const cur = best.get(r.en);
      if (!cur || r.parts.length < cur.parts.length || (r.parts.length === cur.parts.length && cur.single && !r.single)) {
        best.set(r.en, r);
      }
    }
    return [...best.values()].sort((a, b) => (a.book || 999) - (b.book || 999));
  }

  function optionLabel(game, opt) {
    if (isTag(opt)) return TAG_KO[opt] || opt;
    const m = material(game, opt);
    return m ? m.ko : null;
  }

  const api = { cook, findRecipe, recipeBook, optionLabel, material, MAX_HP, INDEX };
  root.ZCOOK = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
