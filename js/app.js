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

  function imageUrls(name, game) {
    const file = name.replace(/ /g, '_');
    const enc = (f) => encodeURIComponent(f);
    const order = game === 'totk' ? ['totk', 'botw'] : ['botw', 'totk'];
    const urls = [];
    for (const g of order) {
      const P = GAME_PREFIX[g];
      urls.push(
        `https://zeldawiki.wiki/wiki/Special:FilePath/${enc(`${P}_${file}_Icon.png`)}`,
        `https://www.zeldadungeon.net/wiki/Special:FilePath/${enc(`${file}_-_${P}_icon.png`)}`,
        `https://zelda.fandom.com/wiki/Special:FilePath/${enc(`${P}_${file}_Icon.png`)}`,
      );
    }
    return urls;
  }

  const imgCache = new Map(); // key -> 성공한 URL 또는 null(모두 실패)

  function thumb(name, game, emojiKey, size = '') {
    const key = `${game}|${name}`;
    const emoji = EMOJI[emojiKey] || '❔';
    const cached = imgCache.get(key);
    if (cached === null) return `<span class="thumb ${size}"><span class="emoji">${emoji}</span></span>`;
    const urls = cached ? [cached] : imageUrls(name, game);
    return `<span class="thumb ${size}" data-key="${esc(key)}" data-emoji="${emoji}">` +
      `<img alt="" referrerpolicy="no-referrer" src="${esc(urls[0])}" data-urls="${esc(urls.join('|'))}" data-i="0"></span>`;
  }

  const IMG_TIMEOUT = 6000; // 응답이 없는 주소는 이 시간 뒤 다음 후보로

  function nextImage(img) {
    const urls = img.dataset.urls.split('|');
    const i = Number(img.dataset.i) + 1;
    if (i < urls.length) {
      img.dataset.i = i;
      img.dataset.t = Date.now();
      img.src = urls[i];
    } else {
      const box = img.parentElement;
      imgCache.set(box.dataset.key, null);
      box.innerHTML = `<span class="emoji">${box.dataset.emoji}</span>`;
    }
  }

  document.addEventListener('error', (ev) => {
    const img = ev.target;
    if (img instanceof HTMLImageElement && img.dataset.urls) nextImage(img);
  }, true);

  document.addEventListener('load', (ev) => {
    const img = ev.target;
    if (img instanceof HTMLImageElement && img.dataset.urls) {
      img.dataset.done = '1';
      imgCache.set(img.parentElement.dataset.key, img.currentSrc || img.src);
    }
  }, true);

  setInterval(() => {
    const now = Date.now();
    document.querySelectorAll('img[data-urls]:not([data-done])').forEach((img) => {
      if (img.complete && img.naturalWidth > 0) { img.dataset.done = '1'; return; }
      if (!img.dataset.t) { img.dataset.t = now; return; }
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
  }

  function effectHtml(e) {
    if (!e) return '';
    let body = `${e.icon} <b>${esc(e.ko)}</b>`;
    if (e.level) {
      body += ` <span class="stars" title="${e.level}단계">${'★'.repeat(e.level)}${'☆'.repeat(e.maxLevel - e.level)}</span>`;
      body += ` <span class="muted">· ${fmtTime(e.seconds)}</span>`;
    }
    if (e.wheels != null) body += ` <span class="muted">· 기력 게이지 ${e.wheels}바퀴</span>`;
    if (e.extraHearts != null) body += `<div style="margin-top:4px">${heartsHtml(e.extraHearts * 4, true)} <span class="muted">노란 하트 +${e.extraHearts}</span></div>`;
    if (e.gloomHearts != null) body += ` <span class="muted">· 음기 하트 ${e.gloomHearts}칸 회복</span>`;
    return `<div class="stat"><span class="stat-label">효과</span><div>${body}</div></div>`;
  }

  function renderResult() {
    const box = $('#result');
    const res = cook(state.pot, state.game);
    if (!res) {
      box.innerHTML = '<div class="result-empty">🍲<br>재료를 넣으면 여기에 요리 결과가 나와요</div>';
      return;
    }
    const kindLabel = {
      dish: ['요리', ''], elixir: ['엘릭서', 'elixir'], fairy: ['영약', 'elixir'],
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
    const full = state.pot.length >= MAX_POT;
    const counts = {};
    state.pot.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });

    $('#grid').innerHTML = list.length ? list.map((i) => `
      <button type="button" class="tile" data-add="${i.id}" title="${esc(i.en)}"${full ? ' disabled' : ''}>
        ${i.eff ? `<span class="tile-eff" title="${esc(EFFECTS[i.eff].ko)}">${EFFECTS[i.eff].icon}</span>` : ''}
        ${counts[i.id] ? `<span class="tile-count">${counts[i.id]}</span>` : ''}
        ${thumb(i.en, state.game, i.cat)}
        <span class="tile-name">${esc(i.ko)}</span>
      </button>`).join('') : '<div class="empty-grid">검색 결과가 없어요</div>';
  }

  function renderCook() {
    renderPot();
    renderResult();
    renderGrid();
    saveHash();
  }

  // ------------------------------------------------------------ 렌더링: 도감
  const TAG_KO = {
    meatany: '고기', meat: '짐승 고기', poultry: '새고기', seafoodany: '생선·해산물', fish: '생선',
    seafood: '게·조개', fruit: '과일', mushroom: '버섯', greens: '채소·허브·꽃', nut: '견과',
    crab: '게', snail: '소라·우렁이', porgy: '도미', salmon: '튼튼 연어', pumpkin: '호박',
    carrot: '당근', radish: '튼튼 무', honey: '벌꿀', sugar: '사탕수수 설탕', butter: '염소 버터',
    milk: '신선한 우유', egg: '새알', cheese: '하테노 치즈', wheat: '타반타 밀', rice: '하이랄 쌀',
    salt: '암염', spice: '고론 향신료', extract: '몬스터 엑기스', banana: '마이티 바나나', apple: '사과',
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
  }

  function render() {
    renderGameSwitch();
    renderCats();
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
