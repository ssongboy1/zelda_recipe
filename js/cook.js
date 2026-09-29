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
      if (r.distinct && types.length < r.distinct) continue;
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
    return Math.round(points * 0.2 * 10) / 10; // 1포인트 = 기력 게이지 1/5
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
      e.gloomHearts = Math.min(points, 10);
    } else {
      e.level = 1 + def.lv.filter((th) => points >= th).length;
      e.maxLevel = def.lv.length + 1;
      let t = 0;
      for (const i of items) {
        if (i.eff === key) t += def.time;
        else if (i.cat === 'monster' || i.cat === 'dragon' || i.id === 'star_fragment') t += i.time;
        else if (i.cat !== 'special') t += BASE_TIME;
      }
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
    const neutral = items.filter((i) => hasTag(i, 'neutral'));
    const foods = items.filter((i) => !['critter', 'monster', 'mineral'].includes(i.cat) && !hasTag(i, 'neutral'));

    const dubious = (why) => {
      if (why) notes.push(why);
      return { kind: 'dubious', ...SPECIAL.dubious, img: SPECIAL.dubious.en, hp: Math.max(4, rawHp), notes, items };
    };

    // 광물 · 장작이 들어가면 먹을 수 없는 요리
    if (items.some((i) => i.cat === 'mineral')) {
      notes.push('광물이나 장작은 먹을 수 없어요. 1/4하트만 회복됩니다.');
      return { kind: 'rockhard', ...SPECIAL.rockhard, img: SPECIAL.rockhard.en, hp: 1, notes, items };
    }

    // 요정만
    if (fairies === items.length) {
      return { kind: 'fairy', ...SPECIAL.fairy, img: SPECIAL.fairy.en, hp: Math.min(MAX_HP, FAIRY_HP * fairies), notes, items };
    }

    // 엘릭서: 벌레/도마뱀 + 몬스터 소재
    if (critters.length > 0) {
      if (foods.length > 0) return dubious('벌레·도마뱀은 일반 식재료와 함께 요리할 수 없어요.');
      if (monsters.length === 0) return dubious('엘릭서를 만들려면 몬스터 소재가 하나 이상 필요해요.');
      const effect = computeEffect(items, notes);
      if (!effect) return dubious();
      const name = `${effect.en} Elixir`;
      const res = {
        kind: 'elixir', en: name, ko: `${effect.ko} 엘릭서`, img: name,
        hp: Math.min(MAX_HP, rawHp * 2 + FAIRY_HP * fairies), effect, notes, items,
      };
      if (effect.key === 'hearty') res.fullRecovery = true;
      return res;
    }

    if (foods.length === 0) {
      if (monsters.length > 0) return dubious('몬스터 소재만으로는 요리가 되지 않아요. 벌레·도마뱀과 함께 넣으면 엘릭서가 됩니다.');
      return dubious('먹을 수 있는 재료가 필요해요.');
    }

    if (monsters.length > 0) {
      if (game === 'botw') return dubious('야숨에서는 몬스터 소재를 일반 식재료와 섞으면 수상한 요리가 돼요.');
      notes.push('왕눈에서는 몬스터 소재가 효과 시간을 늘려줘요.');
    }
    if (neutral.some((i) => i.cat === 'dragon' || i.id === 'star_fragment')) {
      notes.push('용의 소재·별의 조각은 효과 시간을 늘리고 대성공 확률을 높여요.');
    }

    const recipe = matchRecipe(foods, game);
    if (!recipe) return dubious('이 조합에 맞는 레시피가 없어요.');

    const effect = computeEffect(items, notes);
    const en = effect ? `${effect.en} ${recipe.en}` : recipe.en;
    const ko = effect ? `${recipe.ko} (${effect.ko})` : recipe.ko;
    const res = {
      kind: 'dish', en, ko, img: recipe.en, recipe,
      hp: Math.min(MAX_HP, rawHp * 2 + FAIRY_HP * fairies), effect, notes, items,
    };
    if (effect && effect.key === 'hearty') res.fullRecovery = true;
    return res;
  }

  const api = { cook, matchRecipe, BY_ID, inGame, slotMatches, MAX_HP };
  root.ZCOOK = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
