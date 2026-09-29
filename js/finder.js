// 거꾸로 찾기: 원하는 효과나 가진 재료에서 출발해 좋은 조합을 찾는다.
// 모든 후보는 cook()으로 실제 계산해서 확인하므로 결과는 요리하기 탭과 같다.
(function (root) {
  const D = root.ZDATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const C = root.ZCOOK || (typeof require !== 'undefined' ? require('./cook.js') : null);
  const { EFFECTS, GAMES } = D;
  const { cook, recipeBook } = C;

  const MAX_POT = 5;
  const TIMED = (type) => (EFFECTS[type].baseTime || 0) > 0;
  const isCritItem = (m) => (m.crit || 0) >= 100;                // 용의 소재 · 별의 조각
  const isRandom = (m) => m.en === 'Monster Extract' || m.tag === 'CookOther'; // 몬스터엑기스 · 요정
  const hpValue = (res) => (res.fullRecovery ? 120 : res.hp || 0);

  // 결과를 비교할 점수 (클수록 좋음). 효과 크기 → 정렬 기준 → 재료 수 적은 순
  function effectSize(e) {
    if (!e) return [0, 0];
    if (e.extraHearts != null) return [e.extraHearts, 0];
    if (e.gloomHearts != null) return [e.gloomHearts, 0];
    if (e.wheels != null) return [e.wheels, 0];
    return [e.level, e.seconds];
  }

  function scoreOf(res, sort) {
    const [size, time] = effectSize(res.effect);
    const hp = hpValue(res);
    const few = -res.mats.length;
    if (sort === 'hp') return [size, hp, time, few];
    if (sort === 'few') return [size, few, time, hp];
    return [size, time, hp, few]; // 'time'
  }

  const better = (a, b) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
    return false;
  };

  // 크기 1~5의 중복 조합을 모두 돈다
  function eachMultiset(items, visit) {
    const pick = [];
    const rec = (start) => {
      if (pick.length) visit(pick);
      if (pick.length === MAX_POT) return;
      for (let i = start; i < items.length; i++) {
        pick.push(items[i]);
        rec(i);
        pick.pop();
      }
    };
    rec(0);
  }

  // 결과가 같은(이름·효과·회복량) 조합은 점수가 가장 좋은 것 하나만 남긴다
  function topDistinct(found, sort, limit) {
    found.sort((a, b) => (better(a.score, b.score) ? -1 : better(b.score, a.score) ? 1 : 0));
    const seen = new Set();
    const out = [];
    for (const f of found) {
      const e = f.res.effect;
      const key = [f.res.ko, e && effectSize(e).join('/'), hpValue(f.res)].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
      if (out.length >= limit) break;
    }
    return out;
  }

  // 원하는 효과로 찾기
  // opts: { type, minLevel, allowCrit, allowElixir, sort, limit }
  function findByEffect(game, opts) {
    const { type, minLevel = 1, allowCrit = false, allowElixir = true, sort = 'time', limit = 12, pool } = opts;
    const allowed = pool ? new Set(pool) : null;
    const mats = GAMES[game].materials.filter((m) => !isRandom(m) && m.tag !== 'CookOre' && (!allowed || allowed.has(m.id)));

    const effItems = mats.filter((m) => m.eff === type && (allowElixir || m.tag !== 'CookInsect'));
    if (!effItems.length) return [];
    const neutral = mats.filter((m) => !m.eff && m.tag !== 'CookInsect' && (allowCrit || !isCritItem(m)));

    // 효과 없는 재료 중 시간 · 회복량을 가장 많이 더하는 것만 후보로 둔다 (탐색량 줄이기)
    const timeOf = (m) => (m.base ?? 30) + (m.sTime || 0);
    const food = neutral.filter((m) => m.tag !== 'CookEnemy');
    const pickTop = (list, key, n) => [...list].sort((a, b) => key(b) - key(a)).slice(0, n);
    let boosters = [
      ...(TIMED(type) ? pickTop(food, timeOf, 6) : []),
      ...pickTop(food, (m) => (m.hp || 0) * 2 + (m.sHp || 0), 4),
      ...(allowElixir ? pickTop(neutral.filter((m) => m.tag === 'CookEnemy'), timeOf, 3) : []),
    ];
    boosters = [...new Map(boosters.map((m) => [m.id, m])).values()];

    const candidates = [...effItems, ...boosters];
    const found = [];
    eachMultiset(candidates, (pick) => {
      if (!pick.some((m) => m.eff === type)) return;
      const ids = pick.map((m) => m.id);
      const res = cook(ids, game);
      if (!res || !res.effect || res.effect.type !== type) return;
      if (res.effect.level != null && res.effect.level < minLevel) return;
      found.push({ ids, res, score: scoreOf(res, sort) });
    });
    return topDistinct(found, sort, limit);
  }

  // 가진 재료로 찾기
  // - picks: 회복량이 가장 많은 조합, 가진 재료로 낼 수 있는 효과마다 가장 좋은 조합
  // - meals: 만들 수 있는 요리마다 기본 조합 하나 (레시피 조건만 채운 것)
  function findFromInventory(game, ownedIds) {
    const owned = ownedIds.map((id) => C.material(game, id)).filter((m) => m && !isRandom(m));
    if (!owned.length) return { picks: [], meals: [] };
    const pool = owned.map((m) => m.id);
    const picks = [];

    // 회복량 최대: 회복량을 많이 주는 재료 몇 가지로만 조합한다
    // 맥스 재료는 체력 완전 회복이라 따로(맥스 효과 최고) 보여주고 여기서는 뺀다
    const hpItems = [...owned].filter((m) => !['CookOre', 'CookEnemy', 'CookInsect'].includes(m.tag) && m.eff !== 'LifeMaxUp')
      .sort((a, b) => ((b.hp || 0) * 2 + (b.sHp || 0)) - ((a.hp || 0) * 2 + (a.sHp || 0))).slice(0, 7);
    let bestHp = null;
    eachMultiset(hpItems, (pick) => {
      const ids = pick.map((m) => m.id);
      const res = cook(ids, game);
      if (!res || res.kind === 'dubious' || res.kind === 'rockhard') return;
      const score = [hpValue(res), -ids.length];
      if (!bestHp || better(score, bestHp.score)) bestHp = { ids, res, score, label: '회복량 최대 (맥스 재료 제외)' };
    });
    if (bestHp) picks.push(bestHp);

    for (const type of effectsFor(game)) {
      if (!owned.some((m) => m.eff === type)) continue;
      const [top] = findByEffect(game, { type, pool, allowCrit: true, sort: 'time', limit: 1 });
      if (top) picks.push({ ...top, label: `${EFFECTS[type].prefix} 효과 최고` });
    }

    const G = GAMES[game];
    const rows = [...G.recipes, ...G.singles].filter((r) => !['dubious', 'fail', 'rockhard'].includes(r.kind));
    const meals = new Map();
    for (const row of rows) {
      if (meals.has(row.en)) continue;
      // 레시피의 각 조건을 가진 재료로 채운다 (효과 없는 재료 우선, 조건마다 후보 몇 개만)
      const choices = row.parts.map((part) => owned
        .filter((m) => part.some((o) => o === m.id || o === m.tag))
        .sort((a, b) => (a.eff ? 1 : 0) - (b.eff ? 1 : 0))
        .slice(0, 4));
      if (choices.some((c) => !c.length) || row.parts.length > MAX_POT) continue;
      let tries = 0;
      const rec = (i, picked) => {
        if (meals.has(row.en) || tries > 40) return;
        if (i === row.parts.length) {
          tries++;
          const res = cook(picked, game);
          if (res && res.recipe && res.recipe.en === row.en && res.kind !== 'dubious') {
            meals.set(row.en, { ids: [...picked], res, score: scoreOf(res, 'hp') });
          }
          return;
        }
        for (const m of choices[i]) {
          if (picked.includes(m.id)) continue;
          picked.push(m.id);
          rec(i + 1, picked);
          picked.pop();
        }
      };
      rec(0, []);
    }
    const bookOrder = new Map(recipeBook(game).map((r, i) => [r.en, i]));
    const list = [...meals.values()].sort((a, b) => (bookOrder.get(a.res.recipe.en) ?? 999) - (bookOrder.get(b.res.recipe.en) ?? 999));
    return { picks, meals: list };
  }

  // 이 게임에서 찾을 수 있는 효과 목록 (재료가 있는 것만)
  function effectsFor(game) {
    const types = new Set(GAMES[game].materials.filter((m) => m.eff && !isRandom(m)).map((m) => m.eff));
    return Object.keys(EFFECTS).filter((t) => types.has(t));
  }

  const api = { findByEffect, findFromInventory, effectsFor, TIMED };
  root.ZFIND = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
