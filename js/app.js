(function () {
  const { EFFECTS, GAMES } = window.ZDATA;
  const { cook, recipeBook, optionLabel, material, MAX_HP } = window.ZCOOK;

  const CATEGORIES = [
    { id: 'all', ko: '전체' },
    { id: 'fruit', ko: '과일' },
    { id: 'mushroom', ko: '버섯' },
    { id: 'veg', ko: '채소·약초' },
    { id: 'nut', ko: '견과' },
    { id: 'meat', ko: '육류' },
    { id: 'fish', ko: '어패류' },
    { id: 'other', ko: '농축산물·조미료' },
    { id: 'critter', ko: '벌레류' },
    { id: 'monster', ko: '몬스터 부위' },
    { id: 'special', ko: '용·요정·별' },
    { id: 'mineral', ko: '광석' },
  ];
  const CAT_ORDER = Object.fromEntries(CATEGORIES.map((c, i) => [c.id, i]));
  const slotMatches = (m, part) => part.some((opt) => opt === m.id || opt === m.tag);

  const MAX_POT = 5;
  const state = { game: 'totk', pot: [], cat: 'all', query: '', bookQuery: '' };

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ------------------------------------------------------------ 이미지
  // 위키의 게임 아이콘을 여러 후보 주소로 시도하고, 모두 실패하면 이모지로 대체한다.
  const EMOJI = {
    fruit: '🍎', mushroom: '🍄', veg: '🥕', flower: '🌸', nut: '🌰', meat: '🍖', poultry: '🍗',
    fish: '🐟', seafood: '🦀', other: '🧂', critter: '🦋', monster: '👹', special: '✨', dragon: '🐉',
    mineral: '💎', dish: '🍲', elixir: '🧪', dubious: '🤢', rockhard: '🪨', fairy: '🧚',
  };
  const GAME_PREFIX = { botw: 'BotW', totk: 'TotK' };

  // 주소 후보 템플릿. 한 번 성공한 템플릿을 기억해 다음 이미지부터 먼저 시도한다.
  const TEMPLATES = [
    (P, f) => `https://zeldawiki.wiki/wiki/Special:FilePath/${encodeURIComponent(`${P}_${f}_Icon.png`)}`,
    (P, f) => `https://www.zeldadungeon.net/wiki/Special:FilePath/${encodeURIComponent(`${f}_-_${P}_icon.png`)}`,
    (P, f) => `https://zelda.fandom.com/wiki/Special:FilePath/${encodeURIComponent(`${P}_${f}_Icon.png`)}`,
  ];
  const STORE_KEY = 'hyrule-cooking-images-v1';
  const store = (() => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  })();
  store.urls = store.urls || {}; // key -> 최종 이미지 주소 (리다이렉트 이후)
  store.pref = store.pref || {}; // 게임 -> 성공한 템플릿 번호
  let saveTimer = null;
  function saveStore() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* 저장 불가 환경 */ }
    }, 500);
  }

  function imageUrls(name, game) {
    const file = name.replace(/ /g, '_');
    const games = game === 'totk' ? ['totk', 'botw'] : ['botw', 'totk'];
    const pref = store.pref[game];
    const order = TEMPLATES.map((_, i) => i).sort((x, y) => (y === pref) - (x === pref));
    const urls = [];
    for (const g of games) for (const i of order) urls.push(`${g}:${i}|${TEMPLATES[i](GAME_PREFIX[g], file)}`);
    return urls;
  }

  const failed = new Set(); // 이번 방문에서 모든 후보가 실패한 이미지
  const IMG_TIMEOUT = 4000; // 응답이 없는 주소는 이 시간 뒤 다음 후보로

  function thumb(name, game, emojiKey, size = '') {
    const key = `${game}|${name}`;
    const emoji = EMOJI[emojiKey] || '❔';
    if (failed.has(key)) return `<span class="thumb ${size}"><span class="emoji">${emoji}</span></span>`;
    const saved = store.urls[key];
    const urls = (saved ? [`saved|${saved}`] : []).concat(imageUrls(name, game));
    return `<span class="thumb ${size}" data-key="${esc(key)}" data-emoji="${emoji}">` +
      `<img alt="" referrerpolicy="no-referrer" data-urls="${esc(urls.join(' '))}" data-i="-1"></span>`;
  }

  function nextImage(img) {
    const urls = img.dataset.urls.split(' ');
    const i = Number(img.dataset.i) + 1;
    if (i < urls.length) {
      img.dataset.i = i;
      img.dataset.t = Date.now();
      img.src = urls[i].slice(urls[i].indexOf('|') + 1);
    } else {
      const box = img.parentElement;
      failed.add(box.dataset.key);
      delete store.urls[box.dataset.key];
      box.innerHTML = `<span class="emoji">${box.dataset.emoji}</span>`;
    }
  }

  document.addEventListener('error', (ev) => {
    const img = ev.target;
    if (img instanceof HTMLImageElement && img.dataset.urls) nextImage(img);
  }, true);

  document.addEventListener('load', (ev) => {
    const img = ev.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.urls) return;
    img.dataset.done = '1';
    const key = img.parentElement.dataset.key;
    const tag = img.dataset.urls.split(' ')[Number(img.dataset.i)].split('|')[0];
    if (tag !== 'saved') store.pref[key.split('|')[0]] = Number(tag.split(':')[1]);
    store.urls[key] = img.currentSrc || img.src;
    saveStore();
  }, true);

  // 화면 근처에 온 이미지만 불러온다
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        observer.unobserve(e.target);
        if (e.target.dataset.i === '-1') nextImage(e.target);
      }
    }, { rootMargin: '300px' })
    : null;

  function loadImages(rootEl) {
    rootEl.querySelectorAll('img[data-urls][data-i="-1"]').forEach((img) => {
      if (observer) observer.observe(img); else nextImage(img);
    });
  }

  setInterval(() => {
    const now = Date.now();
    document.querySelectorAll('img[data-urls][data-t]:not([data-done])').forEach((img) => {
      if (img.complete && img.naturalWidth > 0) { img.dataset.done = '1'; return; }
      if (now - Number(img.dataset.t) > IMG_TIMEOUT) nextImage(img);
    });
  }, 1000);

  // ------------------------------------------------------------ 공통
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 1600);
  }

  // 분류 순서대로, 같은 분류 안에서는 게임 속 정렬 순서대로
  const available = () => GAMES[state.game].materials
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (CAT_ORDER[a.m.cat] - CAT_ORDER[b.m.cat]) || (a.i - b.i))
    .map((x) => x.m);

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function heartsHtml(q, yellow = false) {
    const out = [];
    let left = q;
    while (left > 0) {
      const part = Math.min(4, left);
      out.push(`<span class="heart${yellow ? ' yellow' : ''}"><i style="width:${part * 25}%"></i></span>`);
      left -= part;
    }
    return `<span class="hearts">${out.join('')}</span>`;
  }

  function heartsText(q) {
    const h = q / 4;
    return Number.isInteger(h) ? `${h}` : h.toFixed(2).replace(/0$/, '');
  }

  // ------------------------------------------------------------ 상태 · URL
  function saveHash() {
    const hash = `#${state.game}${state.pot.length ? '/' + state.pot.join(',') : ''}`;
    history.replaceState(null, '', hash);
  }

  function loadHash() {
    const [game, list] = location.hash.slice(1).split('/');
    if (game === 'botw' || game === 'totk') state.game = game;
    if (list) state.pot = list.split(',').filter((id) => material(state.game, id)).slice(0, MAX_POT);
  }

  function setGame(game) {
    state.game = game;
    state.pot = state.pot.filter((id) => material(game, id));
    render();
  }

  function addToPot(id) {
    if (state.pot.length >= MAX_POT) {
      toast('냄비에는 최대 5개까지 넣을 수 있어요');
      return;
    }
    state.pot.push(id);
    renderCook();
  }

  // 목록에서 빼기: 같은 재료 중 마지막으로 넣은 것 하나를 뺀다
  function takeFromPot(id) {
    const index = state.pot.lastIndexOf(id);
    if (index >= 0) removeFromPot(index);
  }

  function removeFromPot(index) {
    state.pot.splice(index, 1);
    renderCook();
  }

  // ------------------------------------------------------------ 렌더링: 요리
  function renderGameSwitch() {
    document.querySelectorAll('.game-switch button').forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.game === state.game));
    });
    document.documentElement.dataset.game = state.game;
  }

  function renderPot() {
    const slots = [];
    for (let i = 0; i < MAX_POT; i++) {
      const id = state.pot[i];
      if (id) {
        const ing = material(state.game, id);
        slots.push(`<button type="button" class="slot filled" data-remove="${i}" title="${esc(ing.ko)} 빼기">${thumb(ing.en, state.game, ing.cat)}</button>`);
      } else {
        slots.push('<div class="slot"><span class="slot-empty">＋</span></div>');
      }
    }
    $('#pot').innerHTML = slots.join('');
    $('#pot-count').textContent = `${state.pot.length} / ${MAX_POT}`;
    loadImages($('#pot'));
  }

  function effectHtml(e) {
    if (!e) return '';
    let body = `${e.icon} <b>${esc(e.prefix)}</b> <span class="muted">${esc(e.ko)}</span>`;
    if (e.level) {
      body += ` <span class="stars" title="${e.level}단계">${'★'.repeat(e.level)}${'☆'.repeat(Math.max(0, e.maxLevel - e.level))}</span>`;
      body += ` <span class="muted">· ${fmtTime(e.seconds)}</span>`;
    }
    if (e.wheels != null) body += ` <span class="muted">· 스태미나 게이지 ${e.wheels}바퀴</span>`;
    if (e.extraHearts != null) body += `<div style="margin-top:4px">${heartsHtml(e.extraHearts * 4, true)} <span class="muted">노란 하트 +${e.extraHearts}</span></div>`;
    if (e.gloomHearts != null) body += ` <span class="muted">· 독기 대미지 하트 ${e.gloomHearts}칸 회복</span>`;
    return `<div class="stat"><span class="stat-label">효과</span><div>${body}</div></div>`;
  }

  function renderResult() {
    const box = $('#result');
    const res = cook(state.pot, state.game);
    renderMini(res);
    if (!res) {
      box.innerHTML = '<div class="result-empty">🍲<br>재료를 넣으면 여기에 요리 결과가 나와요</div>';
      return;
    }
    const kindLabel = {
      dish: ['요리', ''], elixir: ['물약', 'elixir'], fairy: ['물약', 'elixir'],
      dubious: ['실패', 'bad'], rockhard: ['실패', 'bad'],
    }[res.kind];
    const emojiKey = res.kind === 'dish' ? 'dish' : res.kind;

    let hp;
    if (res.fullRecovery) hp = '<b>하트 전체 회복</b>';
    else if (res.hp > 0) hp = `${heartsHtml(res.hp)} <span class="muted">${heartsText(res.hp)}하트${res.hp >= MAX_HP ? ' (최대)' : ''}</span>`;
    else hp = '<span class="muted">회복 없음</span>';

    let recipeHtml = '';
    if (res.recipe && res.kind !== 'rockhard' && res.kind !== 'dubious') {
      const row = BOOK[state.game].get(res.recipe.en) || res.recipe;
      recipeHtml = `<div class="stat"><span class="stat-label">레시피</span><div class="recipe-req">${reqHtml(row)}</div></div>`;
    }
    const critHtml = res.crit != null
      ? `<div class="stat"><span class="stat-label">대성공</span><div>${res.crit}% <span class="muted">확률</span></div></div>` : '';

    box.innerHTML = `
      <div class="result-main">
        <div class="result-plate">${thumb(res.img, state.game, emojiKey, 'big')}</div>
        <div>
          <span class="kind-tag ${kindLabel[1]}">${kindLabel[0]}</span>
          <div class="result-name">${esc(res.ko)}</div>
          <div class="result-en">${esc(res.en)}</div>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><span class="stat-label">회복</span><div>${hp}</div></div>
        ${effectHtml(res.effect)}
        ${critHtml}
        ${recipeHtml}
      </div>
      ${res.notes.length ? `<div class="notes">${res.notes.map((n) => `<p>💬 ${esc(n)}</p>`).join('')}</div>` : ''}
    `;
    loadImages(box);
  }

  // 휴대폰에서 냄비와 함께 화면 위에 고정되는 한 줄 요약
  function renderMini(res) {
    const box = $('#mini-result');
    if (!res) {
      box.innerHTML = '<span class="mini-empty">재료를 넣으면 완성될 요리가 여기에 나와요</span>';
      return;
    }
    const bits = [];
    if (res.fullRecovery) bits.push('하트 전체 회복');
    else if (res.hp > 0) bits.push(`❤️ ${heartsText(res.hp)}`);
    const e = res.effect;
    if (e) {
      let t = `${e.icon} ${e.prefix}`;
      if (e.level) t += ` ${'★'.repeat(e.level)} ${fmtTime(e.seconds)}`;
      if (e.extraHearts != null) t += ` +${e.extraHearts}`;
      if (e.wheels != null) t += ` ${e.wheels}바퀴`;
      bits.push(t);
    }
    const bad = res.kind === 'dubious' || res.kind === 'rockhard';
    const emojiKey = res.kind === 'dish' ? 'dish' : res.kind;
    box.innerHTML = `${thumb(res.img, state.game, emojiKey, 'sm')}
      <span class="mini-text">
        <span class="mini-name${bad ? ' bad' : ''}">${esc(res.ko)}</span>
        <span class="mini-meta">${esc(bits.join(' · ') || '회복 없음')}</span>
      </span>
      <span class="mini-more" aria-hidden="true">자세히 ↓</span>`;
    loadImages(box);
  }

  function renderCats() {
    const avail = available();
    $('#cats').innerHTML = CATEGORIES.filter((c) => c.id === 'all' || avail.some((i) => catMatch(i, c)))
      .map((c) => `<button type="button" class="chip${state.cat === c.id ? ' active' : ''}" data-cat="${c.id}">${c.ko}</button>`)
      .join('');
  }

  function catMatch(ing, c) {
    return c.id === 'all' || ing.cat === c.id || (c.also || []).includes(ing.cat);
  }

  function renderGrid() {
    const q = state.query.trim().toLowerCase();
    const cat = CATEGORIES.find((c) => c.id === state.cat) || CATEGORIES[0];
    const list = available().filter((i) => catMatch(i, cat) &&
      (!q || i.ko.toLowerCase().includes(q) || i.en.toLowerCase().includes(q)));
    $('#grid').innerHTML = list.length ? list.map((i) => `
      <div class="tile" data-id="${i.id}">
        <button type="button" class="tile-add" data-add="${i.id}" title="${esc(i.ko)} 넣기">
          ${thumb(i.en, state.game, i.cat)}
          <span class="tile-name">${esc(i.ko)}</span>
        </button>
        ${i.eff ? `<span class="tile-eff" title="${esc(EFFECTS[i.eff].prefix + ' · ' + EFFECTS[i.eff].ko)}">${EFFECTS[i.eff].icon}</span>` : ''}
        <button type="button" class="tile-remove" data-take="${i.id}" aria-label="${esc(i.ko)} 하나 빼기" hidden>− <span class="tile-count"></span></button>
      </div>`).join('') : '<div class="empty-grid">검색 결과가 없어요</div>';
    updateGrid();
    loadImages($('#grid'));
  }

  // 냄비가 바뀌면 목록은 그대로 두고 개수 표시만 바꾼다 (이미지를 다시 받지 않도록)
  function updateGrid() {
    const full = state.pot.length >= MAX_POT;
    const counts = {};
    state.pot.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    document.querySelectorAll('#grid .tile').forEach((tile) => {
      const n = counts[tile.dataset.id] || 0;
      const remove = tile.querySelector('.tile-remove');
      remove.hidden = !n;
      remove.querySelector('.tile-count').textContent = n || '';
      tile.classList.toggle('selected', n > 0);
      tile.querySelector('.tile-add').disabled = full;
    });
  }

  function renderCook() {
    renderPot();
    renderResult();
    updateGrid();
    saveHash();
  }

  // ------------------------------------------------------------ 렌더링: 도감
  // 요리별 대표 레시피 (도감과 결과 카드에 표시). 두 게임 중 한쪽에만 있는 요리 표시에도 쓴다
  const BOOK = Object.fromEntries(Object.keys(GAMES).map((g) => [g, new Map(recipeBook(g).map((r) => [r.en, r]))]));
  const MEALS = Object.fromEntries(Object.keys(GAMES).map((g) => [g, new Set(BOOK[g].keys())]));

  function partLabel(part) {
    const names = [...new Set(part.map((opt) => optionLabel(state.game, opt)).filter(Boolean))];
    return names.join(' 또는 ');
  }

  function reqHtml(r) {
    const labels = r.parts.map(partLabel);
    if (r.single) return `${esc(labels[0])} <span class="muted">(이 재료 한 종류만)</span>`;
    // 같은 분류가 여러 번 필요하면 서로 다른 재료가 그만큼 필요하다 (예: 곱빼기)
    if (labels.length > 1 && labels.every((l) => l === labels[0])) {
      return `서로 다른 ${esc(labels[0])} ${labels.length}종류`;
    }
    return labels.map(esc).join('<span class="plus">+</span>');
  }

  // 레시피를 만드는 예시 재료 조합 (효과 없는 재료 우선, 실제로 그 요리가 나오는지 확인)
  function exampleFor(r) {
    const pool = available().slice().sort((a, b) => (a.eff ? 1 : 0) - (b.eff ? 1 : 0));
    const makes = (ids) => { const res = cook(ids, state.game); return res && res.recipe && res.recipe.en === r.en; };
    let first = null;
    const search = (i, picked) => {
      if (i === r.parts.length) {
        if (!first) first = [...picked];
        return makes(picked) ? picked : null;
      }
      for (const ing of pool.filter((x) => !picked.includes(x.id) && slotMatches(x, r.parts[i])).slice(0, 6)) {
        const found = search(i + 1, [...picked, ing.id]);
        if (found) return found;
      }
      return null;
    };
    return search(0, []) || first || [];
  }

  let bookList = [];
  function renderBook() {
    const q = state.bookQuery.trim().toLowerCase();
    const other = state.game === 'totk' ? 'botw' : 'totk';
    bookList = recipeBook(state.game).filter((r) => !q || r.ko.toLowerCase().includes(q) || r.en.toLowerCase().includes(q));
    $('#book').innerHTML = bookList.map((r, idx) => `
      <div class="recipe">
        ${thumb(r.img, state.game, r.kind === 'elixir' || r.kind === 'fairy' ? 'elixir' : 'dish', 'sm')}
        <div class="recipe-body">
          <div class="recipe-name">${esc(r.ko)}${MEALS[other].has(r.en) ? '' : `<span class="badge-new">${state.game === 'totk' ? '왕눈' : '야숨'} 전용</span>`}</div>
          <div class="recipe-en">${esc(r.en)}${r.book ? ` · 레시피북 No.${r.book}` : ''}</div>
          <div class="recipe-req">${reqHtml(r)}</div>
        </div>
        <button type="button" class="ghost" data-try="${idx}">담기</button>
      </div>`).join('') || '<div class="empty-grid">검색 결과가 없어요</div>';
    loadImages($('#book'));
  }

  // ------------------------------------------------------------ 거꾸로 찾기
  const { findByEffect, findFromInventory, effectsFor, TIMED } = window.ZFIND;
  const OWNED_KEY = 'hyrule-cooking-owned-v1';
  const finder = { mode: 'effect', type: null, invQuery: '' };
  const owned = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(OWNED_KEY)) || {};
      return { botw: new Set(saved.botw || []), totk: new Set(saved.totk || []) };
    } catch { return { botw: new Set(), totk: new Set() }; }
  })();
  function saveOwned() {
    try { localStorage.setItem(OWNED_KEY, JSON.stringify({ botw: [...owned.botw], totk: [...owned.totk] })); } catch { /* 저장 불가 */ }
  }

  function setMode(mode) {
    finder.mode = mode;
    document.querySelectorAll('.seg [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    $('#mode-effect').hidden = mode !== 'effect';
    $('#mode-inventory').hidden = mode !== 'inventory';
    $('#find-results').innerHTML = '';
  }

  function renderEffectChips() {
    const types = effectsFor(state.game);
    if (!types.includes(finder.type)) finder.type = types.includes('AttackUp') ? 'AttackUp' : types[0];
    $('#eff-chips').innerHTML = types.map((t) => `
      <button type="button" class="chip${t === finder.type ? ' active' : ''}" data-eff="${t}" title="${esc(EFFECTS[t].ko)}">
        ${EFFECTS[t].icon} ${esc(EFFECTS[t].prefix)} <small>${esc(EFFECTS[t].ko)}</small>
      </button>`).join('');
    const E = EFFECTS[finder.type];
    const timed = TIMED(finder.type);
    $('#f-level-wrap').hidden = !timed;
    if (timed) {
      const prev = Number($('#f-level').value) || 1;
      $('#f-level').innerHTML = Array.from({ length: E.max }, (_, i) => `<option value="${i + 1}">Lv${i + 1} 이상</option>`).join('');
      $('#f-level').value = String(Math.min(prev, E.max));
    }
  }

  const CAT_KO = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.ko]));
  function renderInventory() {
    const q = finder.invQuery.trim().toLowerCase();
    const mine = owned[state.game];
    const groups = new Map();
    for (const m of available()) {
      if (m.en === 'Monster Extract' || m.tag === 'CookOther' || m.tag === 'CookOre') continue;
      if (q && !m.ko.toLowerCase().includes(q) && !m.en.toLowerCase().includes(q)) continue;
      if (!groups.has(m.cat)) groups.set(m.cat, []);
      groups.get(m.cat).push(m);
    }
    $('#inv-grid').innerHTML = [...groups].map(([cat, list]) => `
      <div class="inv-group">
        <h4>${esc(CAT_KO[cat] || cat)}</h4>
        <div class="inv-items">${list.map((m) => `
          <button type="button" class="inv-item" data-own="${m.id}" aria-pressed="${mine.has(m.id)}">
            ${thumb(m.en, state.game, m.cat)}${esc(m.ko)}
          </button>`).join('')}</div>
      </div>`).join('') || '<div class="find-empty">검색 결과가 없어요</div>';
    updateOwnedCount();
    loadImages($('#inv-grid'));
  }
  function updateOwnedCount() {
    const n = [...owned[state.game]].filter((id) => material(state.game, id)).length;
    $('#inv-count').textContent = n ? `(${n}개 선택)` : '';
  }

  function resultMeta(res) {
    const bits = [];
    if (res.fullRecovery) bits.push('❤️ 전체 회복');
    else if (res.hp > 0) bits.push(`❤️ ${heartsText(res.hp)}하트`);
    const e = res.effect;
    if (e) {
      let t = `${e.icon} ${esc(e.prefix)}`;
      if (e.level) t += ` <span class="stars">${'★'.repeat(e.level)}${'☆'.repeat(Math.max(0, e.maxLevel - e.level))}</span> ${fmtTime(e.seconds)}`;
      if (e.extraHearts != null) t += ` 노란 하트 +${e.extraHearts}`;
      if (e.wheels != null) t += ` 스태미나 ${e.wheels}바퀴`;
      if (e.gloomHearts != null) t += ` 독기 회복 ${e.gloomHearts}칸`;
      bits.push(t);
    }
    if (res.crit >= 100) bits.push('대성공 확정');
    return bits.join(' · ');
  }

  let findItems = [];
  function findItemHtml(f, idx) {
    const counts = new Map();
    f.ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    const ings = [...counts].map(([id, n]) => {
      const m = material(state.game, id);
      return `<span class="find-ing">${thumb(m.en, state.game, m.cat)}${esc(m.ko)}${n > 1 ? ` <b>×${n}</b>` : ''}</span>`;
    }).join('');
    const emojiKey = f.res.kind === 'dish' ? 'dish' : f.res.kind;
    return `<div class="find-item">
      ${thumb(f.res.img, state.game, emojiKey, 'sm')}
      <div>
        ${f.label ? `<span class="find-tag">${esc(f.label)}</span>` : ''}
        <div class="find-name">${esc(f.res.ko)}</div>
        <div class="find-meta">${resultMeta(f.res)}</div>
        <div class="find-ings">${ings}</div>
      </div>
      <button type="button" class="ghost" data-use="${idx}">냄비에 담기</button>
    </div>`;
  }

  function showFindResults(sections) {
    findItems = [];
    const html = sections.map(({ title, items, empty }) => {
      const start = findItems.length;
      findItems.push(...items);
      return `<div class="find-section">
        ${title ? `<h3>${esc(title)}</h3>` : ''}
        ${items.length ? `<div class="find-list">${items.map((f, i) => findItemHtml(f, start + i)).join('')}</div>` : `<div class="find-empty">${esc(empty || '찾은 조합이 없어요')}</div>`}
      </div>`;
    }).join('');
    $('#find-results').innerHTML = html;
    loadImages($('#find-results'));
    $('#find-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 계산이 끝날 때까지 버튼에 진행 상태를 보여준다
  function runBusy(button, work) {
    const label = button.innerHTML;
    button.disabled = true;
    button.textContent = '찾는 중…';
    setTimeout(() => {
      try { work(); } finally { button.disabled = false; button.innerHTML = label; updateOwnedCount(); }
    }, 30);
  }

  function runEffectSearch() {
    runBusy($('#f-go'), () => {
      const E = EFFECTS[finder.type];
      const minLevel = TIMED(finder.type) ? Number($('#f-level').value) : 1;
      const items = findByEffect(state.game, {
        type: finder.type, minLevel, sort: $('#f-sort').value,
        allowCrit: $('#f-crit').checked, allowElixir: $('#f-elixir').checked,
      });
      showFindResults([{
        title: `${E.prefix} (${E.ko})${TIMED(finder.type) ? ` Lv${minLevel} 이상` : ''} 추천 조합`,
        items,
        empty: TIMED(finder.type) && minLevel > 1 ? '이 조건으로는 만들 수 없어요. 최소 단계를 낮추거나 용의 소재 쓰기를 켜 보세요.' : '찾은 조합이 없어요',
      }]);
    });
  }

  function runInventorySearch() {
    const ids = [...owned[state.game]].filter((id) => material(state.game, id));
    if (!ids.length) {
      showFindResults([{ title: '', items: [], empty: '먼저 가진 재료를 체크하세요.' }]);
      return;
    }
    runBusy($('#inv-go'), () => {
      const { picks, meals } = findFromInventory(state.game, ids);
      showFindResults([
        { title: '추천', items: picks },
        { title: `만들 수 있는 요리 ${meals.length}가지`, items: meals, empty: '가진 재료로 만들 수 있는 요리가 없어요' },
      ]);
    });
  }

  function renderFinder() {
    renderEffectChips();
    renderInventory();
    $('#find-results').innerHTML = '';
  }

  // ------------------------------------------------------------ 요리 원리
  const GAME_KO = { botw: '야생의 숨결', totk: '왕국의 눈물' };
  let guideExamples = [];

  // "A,B|C" → 재료 목록. | 는 게임마다 이름이 다른 재료의 대안 (예: 용의 뿔)
  function exampleIds(spec) {
    const G = GAMES[state.game];
    const ids = [];
    for (const item of spec.split(',')) {
      const m = item.split('|').map((en) => G.materials.find((x) => x.en === en.trim())).find(Boolean);
      if (!m) return null;
      ids.push(m.id);
    }
    return ids;
  }

  function renderGuide() {
    document.querySelectorAll('.guide-game').forEach((el) => { el.textContent = GAME_KO[state.game]; });
    document.querySelectorAll('[data-game-only]').forEach((el) => { el.hidden = el.dataset.gameOnly !== state.game; });

    guideExamples = [];
    document.querySelectorAll('#tab-guide .ex').forEach((box) => {
      const ids = exampleIds(box.dataset.ex);
      if (!ids) { box.hidden = true; return; }
      box.hidden = false;
      const res = cook(ids, state.game);
      const idx = guideExamples.push(ids) - 1;
      const counts = new Map();
      ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
      const ings = [...counts].map(([id, n]) => {
        const m = material(state.game, id);
        return `<span class="find-ing">${thumb(m.en, state.game, m.cat)}${esc(m.ko)}${n > 1 ? ` <b>×${n}</b>` : ''}</span>`;
      }).join('<span class="ex-plus">+</span>');
      const bad = res.kind === 'dubious' || res.kind === 'rockhard';
      box.innerHTML = `
        <div class="ex-ings">${ings}</div>
        <div class="ex-arrow" aria-hidden="true">→</div>
        <div class="ex-res">
          <div class="ex-name${bad ? ' bad' : ''}">${esc(res.ko)}</div>
          <div class="find-meta">${resultMeta(res) || '회복 없음'}</div>
        </div>
        <button type="button" class="ghost" data-guide-try="${idx}">해보기</button>`;
      loadImages(box);
    });

    // 효과 단계표: 게임 데이터에서 바로 만든다
    const G = GAMES[state.game];
    const need = (E, L) => {
      for (let p = 1; p < 200; p++) if (Math.floor(Math.fround(Math.fround(E.rate) * p)) >= L) return p;
      return null;
    };
    const rows = Object.entries(EFFECTS).filter(([t, E]) => E.baseTime && G.materials.some((m) => m.eff === t)).map(([t, E]) => {
      const mats = G.materials.filter((m) => m.eff === t).sort((a, b) => b.pot - a.pot);
      return `<tr>
        <th scope="row">${E.icon} ${esc(E.prefix)}<small>${esc(E.ko)}</small></th>
        <td>×${E.rate.toFixed(2)}</td>
        <td>${need(E, 2) ?? '-'}점</td>
        <td>${E.max >= 3 ? `${need(E, 3)}점` : '<span class="muted">최대 Lv2</span>'}</td>
        <td>${E.baseTime}초</td>
        <td class="mats">${mats.map((m) => `${esc(m.ko)}<span class="pt">(${m.pot})</span>`).join(', ')}</td>
      </tr>`;
    }).join('');
    $('#guide-effects').innerHTML = `<thead><tr><th scope="col">효과</th><th scope="col">배율</th><th scope="col">Lv2</th><th scope="col">Lv3</th><th scope="col">기본 시간</th><th scope="col">재료(포인트)</th></tr></thead><tbody>${rows}</tbody>`;
    $('#guide-crit-rates').textContent = G.critByTypes.map((r, i) => `${i + 1}종류 ${r}%`).join(', ');
  }

  function render() {
    renderGameSwitch();
    renderCats();
    renderGrid();
    renderCook();
    renderBook();
    renderFinder();
    renderGuide();
  }

  // ------------------------------------------------------------ 이벤트
  document.querySelector('.game-switch').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-game]');
    if (b && b.dataset.game !== state.game) setGame(b.dataset.game);
  });

  document.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${b.dataset.tab}`));
  });

  document.querySelector('.seg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (b && b.dataset.mode !== finder.mode) setMode(b.dataset.mode);
  });
  $('#eff-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-eff]');
    if (!b) return;
    finder.type = b.dataset.eff;
    renderEffectChips();
    $('#find-results').innerHTML = '';
  });
  $('#f-go').addEventListener('click', runEffectSearch);
  $('#inv-go').addEventListener('click', runInventorySearch);
  $('#inv-search').addEventListener('input', (e) => { finder.invQuery = e.target.value; renderInventory(); });
  $('#inv-clear').addEventListener('click', () => { owned[state.game].clear(); saveOwned(); renderInventory(); });
  $('#inv-grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-own]');
    if (!b) return;
    const set = owned[state.game];
    const id = b.dataset.own;
    if (set.has(id)) set.delete(id); else set.add(id);
    b.setAttribute('aria-pressed', String(set.has(id)));
    saveOwned();
    updateOwnedCount();
  });
  $('#find-results').addEventListener('click', (e) => {
    const b = e.target.closest('[data-use]');
    if (!b) return;
    state.pot = findItems[Number(b.dataset.use)].ids.slice(0, MAX_POT);
    document.querySelector('.tabs button[data-tab="cook"]').click();
    renderCook();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#tab-guide').addEventListener('click', (e) => {
    // 목차: 주소(#냄비 상태)를 바꾸지 않고 해당 절로 스크롤만 한다
    const link = e.target.closest('.guide-toc a');
    if (link) {
      e.preventDefault();
      document.querySelector(link.getAttribute('href')).scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const b = e.target.closest('[data-guide-try]');
    if (!b) return;
    state.pot = guideExamples[Number(b.dataset.guideTry)].slice(0, MAX_POT);
    document.querySelector('.tabs button[data-tab="cook"]').click();
    renderCook();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#grid').addEventListener('click', (e) => {
    const take = e.target.closest('[data-take]');
    if (take) { takeFromPot(take.dataset.take); return; }
    const b = e.target.closest('[data-add]');
    if (b) addToPot(b.dataset.add);
  });
  $('#pot').addEventListener('click', (e) => {
    const b = e.target.closest('[data-remove]');
    if (b) removeFromPot(Number(b.dataset.remove));
  });
  $('#cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.dataset.cat;
    renderCats();
    renderGrid();
  });
  $('#search').addEventListener('input', (e) => { state.query = e.target.value; renderGrid(); });
  $('#book-search').addEventListener('input', (e) => { state.bookQuery = e.target.value; renderBook(); });
  $('#mini-result').addEventListener('click', () => {
    if (state.pot.length) $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#btn-clear').addEventListener('click', () => { state.pot = []; renderCook(); });
  $('#btn-share').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast('링크를 복사했어요');
    } catch {
      toast('복사에 실패했어요. 주소창의 링크를 사용하세요');
    }
  });
  $('#book').addEventListener('click', (e) => {
    const b = e.target.closest('[data-try]');
    if (!b) return;
    state.pot = exampleFor(bookList[Number(b.dataset.try)]);
    document.querySelector('.tabs button[data-tab="cook"]').click();
    renderCook();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  loadHash();
  render();
})();
