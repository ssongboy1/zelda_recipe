// 요리 계산 엔진
(function (root) {
  const D = root.ZDATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const { EFFECTS, INGREDIENTS, RECIPES, SPECIAL } = D;

  const BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
  const MAX_HP = 120;          // 30하트 (1/4 하트 단위)
  const MAX_TIME = 30 * 60;    // 30분
  const FAIRY_HP = 40;         // 요정 1마리당 10하트
  const BASE_TIME = 30;        // 효과 없는 식재료 1개당 30초

  const inGame = (x, game) => !x.g || x.g.includes(game);
  const hasTag = (ing, tag) => ing.tags.includes(tag);
  const slotMatches = (ing, slot) =>
    Array.isArray(slot) ? slot.some((t) => hasTag(ing, t)) : hasTag(ing, slot);

  // 각 슬롯을 서로 다른 재료 종류로 채울 수 있는지 (작은 규모라 백트래킹)
  function assign(slots, types, used = new Set(), i = 0) {
    if (i === slots.length) return true;
    for (const t of types) {
      if (used.has(t.id) || !slotMatches(t, slots[i])) continue;
      used.add(t.id);
      if (assign(slots, types, used, i + 1)) return true;
      used.delete(t.id);
    }
    return false;
  }

  function matchRecipe(foods, game) {
    const types = [...new Map(foods.map((f) => [f.id, f])).values()];
    const candidates = RECIPES.filter((r) => inGame(r, game));
    let strict = null;
    let relaxed = null;

    for (const r of candidates) {
      if (!assign(r.req, types)) continue;
      if (r.distinct && types.filter((t) => slotMatches(t, r.req[0])).length < r.distinct) continue;
      const pri = r.pri ?? r.req.length;
      const onlyOk = !r.only || types.every((t) => r.only.some((tag) => hasTag(t, tag)));
      if (onlyOk) {
        if (!strict || pri > strict.pri) strict = { r, pri };
        continue;
      }
      // 딱 맞는 레시피가 없을 때를 위해, 가장 많은 재료를 설명하는 레시피를 기억
      const tags = [...r.req.flat(), ...(r.only || [])];
      const coverage = types.filter((t) => tags.some((tag) => hasTag(t, tag))).length;
      if (!relaxed || coverage > relaxed.coverage || (coverage === relaxed.coverage && pri > relaxed.pri)) {
        relaxed = { r, pri, coverage };
      }
    }
    return strict ? strict.r : relaxed ? relaxed.r : null;
  }

  function fmtWheel(points) {
    return Math.round(points * 0.2 * 10) / 10; // 1포인트 = 스태미나 게이지 1/5
  }

  // 재료 하나가 효과 지속시간에 더하는 초
  function durationOf(i, key) {
    if (i.cat === 'monster' || i.cat === 'dragon' || i.cat === 'special') return i.time;
    if (i.time) return i.time;
    if (i.eff === key) return EFFECTS[key].time;
    return BASE_TIME;
  }

  function computeEffect(items, notes) {
    const effItems = items.filter((i) => i.eff);
    const kinds = [...new Set(effItems.map((i) => i.eff))];
    if (kinds.length === 0) return null;
    if (kinds.length > 1) {
      notes.push(`서로 다른 효과(${kinds.map((k) => EFFECTS[k].ko).join(', ')})가 섞여서 효과가 사라졌어요.`);
      return null;
    }
    const key = kinds[0];
    const def = EFFECTS[key];
    const points = effItems.reduce((s, i) => s + i.pot, 0);
    const e = { key, ...def, points };

    if (key === 'hearty') {
      e.extraHearts = Math.min(points, 25);
    } else if (key === 'energizing') {
      e.wheels = Math.min(fmtWheel(points), 3);
    } else if (key === 'enduring') {
      e.wheels = Math.min(fmtWheel(points), 2);
    } else if (key === 'sunny') {
      e.gloomHearts = Math.min(points, 20);
    } else {
      e.maxLevel = def.fixedLevel || def.lv.length + 1;
      e.level = def.fixedLevel || 1 + def.lv.filter((th) => points >= th).length;
      if (def.fixedLevel) notes.push('속성 열매는 몇 개를 넣어도 효과가 Lv1로 고정돼요.');
      const t = items.reduce((s, i) => s + durationOf(i, key), 0);
      e.seconds = Math.min(t, MAX_TIME);
    }
    return e;
  }

  function cook(ids, game) {
    const items = ids.map((id) => BY_ID[id]).filter((i) => i && inGame(i, game));
    if (items.length === 0) return null;

    const notes = [];
    const rawHp = items.reduce((s, i) => s + i.hp, 0);
    const fairies = items.filter((i) => i.id === 'fairy').length;
    const critters = items.filter((i) => i.cat === 'critter');
    const monsters = items.filter((i) => i.cat === 'monster');
    const foods = items.filter((i) => !['critter', 'monster', 'mineral'].includes(i.cat) && !hasTag(i, 'neutral'));
    const heal = (hp) => Math.min(MAX_HP, hp * 2 + FAIRY_HP * fairies);

    const dubious = (why) => {
      if (why) notes.push(why);
      return { kind: 'dubious', ...SPECIAL.dubious, img: SPECIAL.dubious.en, hp: Math.max(4, rawHp), notes, items };
    };
    const critNote = () => {
      if (items.some((i) => hasTag(i, 'crit'))) {
        notes.push('용의 소재·별의 조각·황금 사과·기브도의 간을 넣으면 반드시 대성공(보너스 효과)이 나요. (보너스는 계산에 넣지 않았어요)');
      }
      if (items.some((i) => i.id === 'monster_extract')) {
        notes.push('몬스터엑기스는 효과 레벨과 지속시간을 무작위로 바꿔요. 표시된 값은 엑기스를 빼고 계산한 값이에요.');
      }
    };

    // 광석 · 장작이 들어가면 먹을 수 없는 요리
    if (items.some((i) => i.cat === 'mineral')) {
      notes.push('광석이나 장작은 먹을 수 없어요. 1/4하트만 회복됩니다.');
      return { kind: 'rockhard', ...SPECIAL.rockhard, img: SPECIAL.rockhard.en, hp: 1, notes, items };
    }

    // 요정만
    if (fairies === items.length) {
      return { kind: 'fairy', ...SPECIAL.fairy, img: SPECIAL.fairy.en, hp: Math.min(MAX_HP, FAIRY_HP * fairies), notes, items };
    }

    // 물약: 벌레류 + 몬스터 부위 (같은 효과이거나 효과 없는 식재료는 함께 넣을 수 있음)
    if (critters.length > 0 || monsters.length > 0) {
      if (critters.length === 0) {
        return dubious(foods.length
          ? '몬스터 부위는 식재료와 함께 요리할 수 없어요. 벌레류와 함께 넣어야 물약이 됩니다.'
          : '몬스터 부위만으로는 요리가 되지 않아요. 벌레류와 함께 넣으면 물약이 됩니다.');
      }
      if (monsters.length === 0) {
        return dubious(foods.length
          ? '벌레류는 식재료만으로는 요리할 수 없어요. 몬스터 부위를 하나 이상 넣어야 물약이 됩니다.'
          : '물약을 만들려면 몬스터 부위가 하나 이상 필요해요.');
      }
      const effect = computeEffect(items, notes);
      if (!effect) return dubious();
      critNote();
      const res = {
        kind: 'elixir', en: `${effect.en} Elixir`, ko: `${effect.prefix} 물약`, img: `${effect.en} Elixir`,
        hp: heal(rawHp), effect, notes, items,
      };
      if (effect.key === 'hearty') res.fullRecovery = true;
      return res;
    }

    if (foods.length === 0) return dubious('먹을 수 있는 재료가 필요해요.');

    const salts = foods.filter((i) => i.id === 'rock_salt').length;
    if (salts > foods.length - salts) return dubious('암염이 다른 식재료보다 많으면 애매한 요리가 돼요.');

    const recipe = matchRecipe(foods, game);
    if (!recipe) return dubious('이 조합에 맞는 레시피가 없어요.');

    const effect = computeEffect(items, notes);
    critNote();
    const res = {
      kind: 'dish',
      en: effect ? `${effect.en} ${recipe.en}` : recipe.en,
      ko: effect ? `${effect.prefix} ${recipe.ko}` : recipe.ko,
      img: recipe.en, recipe, hp: heal(rawHp), effect, notes, items,
    };
    if (effect && effect.key === 'hearty') res.fullRecovery = true;
    return res;
  }

  const api = { cook, matchRecipe, BY_ID, inGame, slotMatches, MAX_HP };
  root.ZCOOK = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
