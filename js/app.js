(function () {
  const { EFFECTS, INGREDIENTS, CATEGORIES, RECIPES } = window.ZDATA;
  const { cook, BY_ID, inGame, slotMatches, MAX_HP } = window.ZCOOK;

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

  const available = () => INGREDIENTS.filter((i) => inGame(i, state.game));

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
    if (list) state.pot = list.split(',').filter((id) => BY_ID[id] && inGame(BY_ID[id], state.game)).slice(0, MAX_POT);
  }

  function setGame(game) {
    state.game = game;
    state.pot = state.pot.filter((id) => inGame(BY_ID[id], game));
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
        const ing = BY_ID[id];
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
      body += ` <span class="stars" title="${e.level}단계">${'★'.repeat(e.level)}${'☆'.repeat(e.maxLevel - e.level)}</span>`;
      body += ` <span class="muted">· ${fmtTime(e.seconds)}</span>`;
    }
    if (e.wheels != null) body += ` <span class="muted">· 스태미나 게이지 ${e.wheels}바퀴</span>`;
    if (e.extraHearts != null) body += `<div style="margin-top:4px">${heartsHtml(e.extraHearts * 4, true)} <span class="muted">노란 하트 +${e.extraHearts}</span></div>`;
    if (e.gloomHearts != null) body += ` <span class="muted">· 독기 침식 하트 ${e.gloomHearts}칸 복구</span>`;
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
    if (res.recipe) {
      recipeHtml = `<div class="stat"><span class="stat-label">레시피</span><div class="recipe-req">${reqHtml(res.recipe)}</div></div>`;
    }

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
  const TAG_KO = {
    meatany: '육류', meat: '짐승 고기류', poultry: '새 고기류', seafoodany: '어패류', fish: '생선',
    seafood: '게·우렁이', fruit: '과일', mushroom: '버섯', greens: '채소·약초', nut: '견과류',
    crab: '게', snail: '소라·우렁이', porgy: '도미', salmon: '맥스연어', pumpkin: '호박',
    carrot: '당근', radish: '순무', honey: '원기벌의 벌꿀', sugar: '사탕수수', butter: '염소 버터',
    milk: '신선 우유', egg: '새의 알', cheese: '하테노 치즈', wheat: '타반타 밀', rice: '하이랄 쌀',
    salt: '암염', spice: '고론의 향신료', extract: '몬스터엑기스', banana: '칼날바나나', apple: '사과',
    tomato: '하이랄토마토', oil: '기름병', dark: '어둠 덩어리',
  };
  const tagKo = (t) => TAG_KO[t] || (BY_ID[t] && BY_ID[t].ko) || t;

  function reqHtml(r) {
    const parts = r.req.map((slot) => esc(Array.isArray(slot) ? slot.map(tagKo).join(' 또는 ') : tagKo(slot)));
    let html = parts.join('<span class="plus">+</span>');
    if (r.distinct) html = `서로 다른 ${esc(tagKo(r.req[0]))} ${r.distinct}종류 이상`;
    if (r.only && !r.distinct) html += ` <span class="muted">(${r.only.map(tagKo).join('·')}만)</span>`;
    return html;
  }

  // 레시피를 만드는 예시 재료 조합 (효과 없는 재료 우선, 실제로 그 요리가 나오는지 확인)
  function exampleFor(r) {
    const pool = available().filter((i) => !['critter', 'monster', 'mineral', 'special', 'dragon'].includes(i.cat))
      .sort((a, b) => (a.eff ? 1 : 0) - (b.eff ? 1 : 0));
    const slots = r.distinct ? Array(r.distinct).fill(r.req[0]) : r.req;
    const makes = (ids) => { const res = cook(ids, state.game); return res && res.recipe === r; };
    let first = null;
    const search = (i, picked) => {
      if (i === slots.length) {
        if (!first) first = [...picked];
        return makes(picked) ? picked : null;
      }
      for (const ing of pool.filter((x) => !picked.includes(x.id) && slotMatches(x, slots[i])).slice(0, 8)) {
        const found = search(i + 1, [...picked, ing.id]);
        if (found) return found;
      }
      return null;
    };
    return search(0, []) || first || [];
  }

  function renderBook() {
    const q = state.bookQuery.trim().toLowerCase();
    const list = RECIPES.filter((r) => inGame(r, state.game) &&
      (!q || r.ko.toLowerCase().includes(q) || r.en.toLowerCase().includes(q)));
    $('#book').innerHTML = list.map((r, idx) => `
      <div class="recipe">
        ${thumb(r.en, state.game, 'dish', 'sm')}
        <div class="recipe-body">
          <div class="recipe-name">${esc(r.ko)}${r.g && r.g.length === 1 ? `<span class="badge-new">${r.g[0] === 'totk' ? '왕눈' : '야숨'} 전용</span>` : ''}</div>
          <div class="recipe-en">${esc(r.en)}</div>
          <div class="recipe-req">${reqHtml(r)}</div>
        </div>
        <button type="button" class="ghost" data-try="${RECIPES.indexOf(r)}">담기</button>
      </div>`).join('') || '<div class="empty-grid">검색 결과가 없어요</div>';
    loadImages($('#book'));
  }

  function render() {
    renderGameSwitch();
    renderCats();
    renderGrid();
    renderCook();
    renderBook();
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
    state.pot = exampleFor(RECIPES[Number(b.dataset.try)]);
    document.querySelector('.tabs button[data-tab="cook"]').click();
    renderCook();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  loadHash();
  render();
})();
