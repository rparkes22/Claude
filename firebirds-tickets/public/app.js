(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined) n.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined) n.append(kid.nodeType ? kid : document.createTextNode(kid));
    return n;
  };

  const state = { games: [], settings: {}, today: '', me: null, filter: 'upcoming' };
  const store = {
    get(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  // ---------- helpers ----------
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function parts(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return { y, m, d, dow: DOW[dt.getUTCDay()], mon: MONTHS[m - 1], monLong: MONTHS_LONG[m - 1] };
  }
  function fmtTime(t) {
    const [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'p.m.' : 'a.m.';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return m ? `${hh}:${String(m).padStart(2, '0')} ${ap}` : `${hh} ${ap}`;
  }
  function fmtDate(iso) { const p = parts(iso); return `${p.dow}, ${p.mon} ${p.d}`; }

  let toastTimer;
  function toast(msg, isError = false) {
    const t = $('#toast');
    t.textContent = msg; t.className = `toast show${isError ? ' error' : ''}`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
  }

  // ---------- data ----------
  async function loadSchedule() {
    const data = await api('/api/schedule');
    state.games = data.games; state.settings = data.settings; state.today = data.today;
    renderHeader(); renderPerks(); renderSchedule();
  }

  async function loadMe() {
    const email = $('#my-email').value.trim().toLowerCase();
    if (!email) { state.me = null; renderMe(); renderSchedule(); return; }
    try {
      state.me = await api(`/api/me?email=${encodeURIComponent(email)}`);
    } catch (e) { state.me = null; toast(e.message, true); }
    renderMe(); renderSchedule();
  }

  // ---------- render ----------
  function renderHeader() {
    const s = state.settings;
    $('#season-label').textContent = `Coachella Valley Firebirds · Acrisure Arena · ${s.season_label || ''}`;
    $('#intro-text').textContent = s.intro_text || '';
  }

  function renderPerks() {
    const s = state.settings;
    $('#perks-tag').textContent = `${s.tickets_per_game || 2} tickets per game, on the company.`;
    const box = $('#perks'); box.replaceChildren();
    for (const p of s.perks || []) {
      box.append(el('div', { class: 'perk' }, el('div', { class: 'icon' }, p.icon || '⭐'), el('div', {}, el('strong', {}, p.title), el('span', {}, p.detail))));
    }
    if (!(s.perks || []).length) box.append(el('div', { class: 'muted' }, 'Perks will be posted soon.'));
  }

  function renderMe() {
    const box = $('#me-status');
    if (!state.me) { box.textContent = ''; return; }
    if (state.me.won) {
      box.textContent = `🏆 You won tickets for ${state.me.won.opponent} on ${fmtDate(state.me.won.date)}. Thanks for playing — you're set for this season!`;
    } else {
      const n = state.me.entered_game_ids.length;
      box.textContent = n ? `You're entered in ${n} drawing${n === 1 ? '' : 's'}. Good luck!` : 'You have no entries yet. Pick a game below.';
    }
  }

  function renderSchedule() {
    const box = $('#schedule'); box.replaceChildren();
    const mine = new Set(state.me?.entered_game_ids || []);
    let games = state.games;
    if (state.filter === 'upcoming') games = games.filter((g) => g.status !== 'past');
    if (state.filter === 'mine') games = games.filter((g) => mine.has(g.id) || (state.me?.won && state.me.won.game_id === g.id));
    $('#count-text').textContent = `${games.length} game${games.length === 1 ? '' : 's'}`;
    if (!games.length) {
      box.append(el('div', { class: 'empty' }, state.filter === 'mine' ? (state.me ? 'No entries yet. Pick a game!' : 'Enter your email above to see your entries.') : 'No games to show.'));
      return;
    }
    let lastMonth = '';
    for (const g of games) {
      const p = parts(g.date);
      const monthKey = `${p.monLong} ${p.y}`;
      if (monthKey !== lastMonth) { box.append(el('div', { class: 'month' }, monthKey)); lastMonth = monthKey; }
      box.append(renderGame(g, mine.has(g.id)));
    }
  }

  function renderGame(g, entered) {
    const p = parts(g.date);
    const cls = ['game', g.status, entered ? 'mine' : ''].join(' ').trim();
    const badges = [];
    if (g.theme) badges.push(el('span', { class: 'badge' }, g.theme));
    if (g.giveaway) badges.push(el('span', { class: 'badge gift' }, `🎁 ${g.giveaway}`));
    if (g.notes) badges.push(el('span', { class: 'badge note', title: g.notes }, 'ℹ️ ' + g.notes));
    if (g.winner) badges.push(el('span', { class: 'badge winner' }, `🏆 ${g.winner.name}`));

    const action = el('div', { class: 'action' });
    const iWon = state.me?.won;
    if (g.status === 'drawn') {
      action.append(el('span', { class: 'status-text win' }, g.winner.name === state.me?.won?.name && iWon?.game_id === g.id ? 'You won this one!' : 'Winner drawn'));
    } else if (g.status === 'past') {
      action.append(el('span', { class: 'status-text' }, 'Played'));
    } else if (g.status === 'closed') {
      action.append(el('span', { class: 'status-text' }, 'Entries closed'));
    } else {
      action.append(el('span', { class: 'count' }, `${g.entry_count} entered · drawn early ${parts(g.date).mon}`));
      if (iWon) {
        action.append(el('span', { class: 'status-text' }, 'Already a winner this season'));
      } else if (entered) {
        action.append(el('button', { class: 'btn ghost small', onclick: () => withdraw(g) }, '✓ Entered · withdraw'));
      } else {
        action.append(el('button', { class: 'btn small', onclick: () => openEnter(g) }, 'Enter me'));
      }
    }

    return el('div', { class: cls, 'data-id': g.id },
      el('div', { class: 'date' }, el('div', { class: 'dow' }, p.dow), el('div', { class: 'day' }, String(p.d)), el('div', { class: 'mon' }, p.mon)),
      el('div', { class: 'info' },
        el('div', { class: 'opp' }, `vs. ${g.opponent}`),
        el('div', { class: 'meta' }, `${fmtTime(g.time)} · Acrisure Arena`),
        badges.length ? el('div', { class: 'badges' }, badges) : null),
      action);
  }

  // ---------- actions ----------
  let pendingGame = null;
  function openEnter(g) {
    pendingGame = g;
    $('#enter-title').textContent = `vs. ${g.opponent}`;
    $('#enter-sub').textContent = `${fmtDate(g.date)} at ${fmtTime(g.time)}${g.theme ? ` · ${g.theme}` : ''}`;
    $('#enter-name').value = $('#my-name').value || store.get('fb_name');
    $('#enter-email').value = $('#my-email').value || store.get('fb_email');
    $('#enter-dialog').showModal();
    ($('#enter-name').value ? $('#enter-email') : $('#enter-name')).focus();
  }

  async function submitEnter(ev) {
    ev.preventDefault();
    const name = $('#enter-name').value.trim();
    const email = $('#enter-email').value.trim().toLowerCase();
    try {
      await api(`/api/games/${pendingGame.id}/entries`, { method: 'POST', body: JSON.stringify({ name, email }) });
      $('#enter-dialog').close();
      remember(name, email);
      toast(`You're in for ${pendingGame.opponent} on ${fmtDate(pendingGame.date)}. Good luck!`);
      await Promise.all([loadSchedule(), loadMe()]);
    } catch (e) { toast(e.message, true); }
  }

  async function withdraw(g) {
    const email = $('#my-email').value.trim().toLowerCase();
    if (!email) return toast('Enter your email first', true);
    if (!confirm(`Withdraw your entry for ${g.opponent} on ${fmtDate(g.date)}?`)) return;
    try {
      await api(`/api/games/${g.id}/entries`, { method: 'DELETE', body: JSON.stringify({ email }) });
      toast('Entry withdrawn');
      await Promise.all([loadSchedule(), loadMe()]);
    } catch (e) { toast(e.message, true); }
  }

  function remember(name, email) {
    if (name) { store.set('fb_name', name); $('#my-name').value = name; }
    if (email) { store.set('fb_email', email); $('#my-email').value = email; }
  }

  // ---------- wire up ----------
  $('#enter-form').addEventListener('submit', submitEnter);
  $('#enter-cancel').addEventListener('click', () => $('#enter-dialog').close());
  $('#remember-btn').addEventListener('click', () => { remember($('#my-name').value.trim(), $('#my-email').value.trim().toLowerCase()); loadMe(); });
  $('#my-email').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#remember-btn').click(); });
  for (const chip of document.querySelectorAll('.chip')) {
    chip.addEventListener('click', () => {
      state.filter = chip.dataset.filter;
      document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === chip));
      renderSchedule();
    });
  }

  $('#my-name').value = store.get('fb_name');
  $('#my-email').value = store.get('fb_email');
  loadSchedule().then(loadMe).catch((e) => toast(e.message, true));
})();
