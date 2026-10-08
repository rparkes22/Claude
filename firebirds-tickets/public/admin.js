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
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${MON[m - 1]} ${d}, ${y}`; };
  const fmtTime = (t) => { const [h, m] = t.split(':').map(Number); const hh = h % 12 || 12; return `${hh}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`; };
  const fmtStamp = (s) => s ? new Date(s).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' }) : '';

  let toastTimer;
  function toast(msg, isError = false) {
    const t = $('#toast'); t.textContent = msg; t.className = `toast show${isError ? ' error' : ''}`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
  }
  async function api(path, opts = {}) {
    const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.endsWith('/login')) { showLogin(); throw new Error('Please log in'); }
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
  }

  const state = { games: [], winners: [], settings: {}, current: null };

  // ---------- auth ----------
  function showLogin() { $('#login-panel').hidden = false; $('#admin-panel').hidden = true; $('#logout-btn').hidden = true; }
  function showAdmin() { $('#login-panel').hidden = true; $('#admin-panel').hidden = false; $('#logout-btn').hidden = false; }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: $('#pw').value }) }); $('#pw').value = ''; showAdmin(); await refresh(); }
    catch (err) { toast(err.message, true); }
  });
  $('#logout-btn').addEventListener('click', async () => { await api('/api/admin/logout', { method: 'POST' }); showLogin(); });

  // ---------- tabs ----------
  for (const b of document.querySelectorAll('.tabs button')) {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
      for (const t of ['games', 'winners', 'settings']) $(`#tab-${t}`).hidden = t !== b.dataset.tab;
    });
  }

  // ---------- data ----------
  async function refresh() {
    const d = await api('/api/admin/overview');
    state.games = d.games; state.winners = d.winners; state.settings = d.settings; state.today = d.today;
    renderStats(); renderGames(); renderWinners(); renderSettings();
  }

  function renderStats() {
    const open = state.games.filter((g) => g.status === 'open');
    const entries = state.games.reduce((n, g) => n + g.entry_count, 0);
    const next = open.find((g) => g.expected_draw_date <= state.today) || open[0];
    $('#stats').replaceChildren(
      el('div', { class: 'stat' }, el('b', {}, String(open.length)), el('span', {}, 'games open')),
      el('div', { class: 'stat' }, el('b', {}, String(entries)), el('span', {}, 'active entries')),
      el('div', { class: 'stat' }, el('b', {}, String(state.winners.length)), el('span', {}, 'winners so far')),
      el('div', { class: 'stat' }, el('b', {}, next ? `${MON[Number(next.date.slice(5, 7)) - 1]} ${Number(next.date.slice(8))}` : '—'), el('span', {}, next ? `next draw: ${next.opponent}` : 'no draws pending')),
    );
  }

  function statusLabel(g) {
    if (g.status === 'drawn') return `🏆 ${g.winner.name}`;
    if (g.status === 'past') return 'Played';
    if (g.status === 'closed') return 'Closed';
    return g.expected_draw_date <= state.today ? '⏰ Ready to draw' : `Open · draw ${fmtDate(g.expected_draw_date)}`;
  }

  function renderGames() {
    const body = $('#games-body'); body.replaceChildren();
    for (const g of state.games) {
      const tr = el('tr', { class: g.status === 'drawn' ? 'drawn' : (!g.is_active ? 'inactive' : '') },
        el('td', {}, `${fmtDate(g.date)} ${fmtTime(g.time)}`),
        el('td', {}, g.opponent),
        el('td', {}, [g.theme, g.giveaway ? `🎁 ${g.giveaway}` : ''].filter(Boolean).join(' · ') || '—'),
        el('td', {}, String(g.entry_count)),
        el('td', {}, statusLabel(g)),
        el('td', {}, el('div', { class: 'row-actions' },
          el('button', { class: 'btn small ' + (g.status === 'open' && g.expected_draw_date <= state.today ? '' : 'ghost'), onclick: () => openEntries(g) }, g.status === 'drawn' ? 'Entries' : 'Entries / draw'),
          el('button', { class: 'btn ghost small', onclick: () => openGameForm(g) }, 'Edit'),
          el('button', { class: 'btn ghost small', onclick: () => deleteGame(g) }, '🗑'))),
      );
      body.append(tr);
    }
  }

  function renderWinners() {
    const body = $('#winners-body'); body.replaceChildren();
    if (!state.winners.length) body.append(el('tr', {}, el('td', { colspan: 6, class: 'muted' }, 'No winners yet.')));
    for (const w of state.winners) {
      body.append(el('tr', {},
        el('td', {}, `${fmtDate(w.date)} vs. ${w.opponent}`), el('td', {}, w.name), el('td', {}, w.email),
        el('td', {}, fmtStamp(w.drawn_at)), el('td', {}, `${w.pool_size} entered`),
        el('td', {}, el('button', { class: 'btn ghost small', onclick: () => undoWinner(w) }, 'Undo draw'))));
    }
  }

  // ---------- entries & draw ----------
  async function openEntries(g) {
    state.current = g;
    const d = await api(`/api/admin/games/${g.id}/entries`);
    $('#entries-title').textContent = `vs. ${g.opponent} — ${fmtDate(g.date)}`;
    $('#entries-sub').textContent = `${d.entries.length} entered. ${d.winner ? `Winner: ${d.winner.name}` : 'No winner drawn yet.'}`;
    const reveal = $('#winner-reveal'); reveal.hidden = true; reveal.replaceChildren();
    const body = $('#entries-body'); body.replaceChildren();
    if (!d.entries.length) body.append(el('tr', {}, el('td', { colspan: 5, class: 'muted' }, 'No entries yet.')));
    d.entries.forEach((e, i) => body.append(el('tr', {},
      el('td', {}, String(i + 1)), el('td', {}, e.name), el('td', {}, e.email), el('td', {}, fmtStamp(e.created_at)),
      el('td', {}, d.winner ? '' : el('button', { class: 'btn ghost small', onclick: () => removeEntry(g, e) }, 'Remove')))));
    $('#draw-btn').hidden = !!d.winner || !d.entries.length;
    $('#entries-dialog').showModal();
  }

  async function removeEntry(g, e) {
    if (!confirm(`Remove ${e.name}'s entry for ${g.opponent}?`)) return;
    try { await api(`/api/admin/games/${g.id}/entries/${e.id}`, { method: 'DELETE' }); toast('Entry removed'); await refresh(); await openEntries(state.games.find((x) => x.id === g.id)); }
    catch (err) { toast(err.message, true); }
  }

  $('#draw-btn').addEventListener('click', async () => {
    const g = state.current;
    if (!confirm(`Draw a winner for ${g.opponent} on ${fmtDate(g.date)}? This cannot be re-rolled without undoing.`)) return;
    try {
      const r = await api(`/api/admin/games/${g.id}/draw`, { method: 'POST' });
      const reveal = $('#winner-reveal');
      reveal.hidden = false;
      reveal.replaceChildren(el('div', {}, '🎉 Winner!'), el('div', { class: 'name' }, r.winner.name), el('div', { class: 'muted' }, `${r.winner.email} · drawn from ${r.winner.pool_size} eligible entr${r.winner.pool_size === 1 ? 'y' : 'ies'}`));
      $('#draw-btn').hidden = true;
      $('#entries-sub').textContent = `Winner: ${r.winner.name}. Their entries for other games were removed.`;
      await refresh();
    } catch (err) { toast(err.message, true); }
  });
  $('#entries-close').addEventListener('click', () => $('#entries-dialog').close());

  async function undoWinner(w) {
    if (!confirm(`Undo the draw for ${w.opponent} on ${fmtDate(w.date)}? ${w.name} will no longer be the winner and becomes eligible again.`)) return;
    try { await api(`/api/admin/games/${w.game_id}/winner`, { method: 'DELETE' }); toast('Draw undone'); await refresh(); }
    catch (err) { toast(err.message, true); }
  }

  // ---------- game form ----------
  let editing = null;
  function openGameForm(g) {
    editing = g || null;
    $('#game-title').textContent = g ? 'Edit game' : 'Add home game';
    $('#g-date').value = g?.date || ''; $('#g-time').value = g?.time || '19:00'; $('#g-opp').value = g?.opponent || '';
    $('#g-theme').value = g?.theme || ''; $('#g-give').value = g?.giveaway || ''; $('#g-notes').value = g?.notes || '';
    $('#g-active').checked = g ? g.is_active : true;
    $('#game-dialog').showModal();
  }
  $('#add-game-btn').addEventListener('click', () => openGameForm(null));
  $('#game-cancel').addEventListener('click', () => $('#game-dialog').close());
  $('#game-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = { date: $('#g-date').value, time: $('#g-time').value, opponent: $('#g-opp').value, theme: $('#g-theme').value, giveaway: $('#g-give').value, notes: $('#g-notes').value, is_active: $('#g-active').checked };
    try {
      if (editing) await api(`/api/admin/games/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/api/admin/games', { method: 'POST', body: JSON.stringify(body) });
      $('#game-dialog').close(); toast('Game saved'); await refresh();
    } catch (err) { toast(err.message, true); }
  });
  async function deleteGame(g) {
    if (!confirm(`Delete ${g.opponent} on ${fmtDate(g.date)}? All ${g.entry_count} entries for it are removed too.`)) return;
    try { await api(`/api/admin/games/${g.id}`, { method: 'DELETE' }); toast('Game deleted'); await refresh(); }
    catch (err) { toast(err.message, true); }
  }

  // ---------- settings ----------
  function perkRow(p = {}) {
    const row = el('div', { class: 'perk-row' },
      el('input', { placeholder: '🎟️', value: p.icon || '', maxlength: 8, 'data-k': 'icon' }),
      el('input', { placeholder: 'Title', value: p.title || '', maxlength: 80, 'data-k': 'title' }),
      el('input', { placeholder: 'Details', value: p.detail || '', maxlength: 300, 'data-k': 'detail' }),
      el('button', { class: 'btn ghost small', type: 'button', onclick: () => row.remove() }, '✕'));
    return row;
  }
  function renderSettings() {
    const s = state.settings;
    $('#perk-rows').replaceChildren(...(s.perks || []).map(perkRow));
    $('#s-season').value = s.season_label || ''; $('#s-intro').value = s.intro_text || '';
    $('#s-tickets').value = s.tickets_per_game || 2; $('#s-lead').value = s.draw_lead_days ?? 3;
  }
  $('#add-perk-btn').addEventListener('click', () => $('#perk-rows').append(perkRow()));
  $('#save-settings-btn').addEventListener('click', async () => {
    const perks = [...document.querySelectorAll('#perk-rows .perk-row')].map((r) => ({
      icon: r.querySelector('[data-k=icon]').value, title: r.querySelector('[data-k=title]').value, detail: r.querySelector('[data-k=detail]').value,
    }));
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ perks, season_label: $('#s-season').value, intro_text: $('#s-intro').value, tickets_per_game: $('#s-tickets').value, draw_lead_days: $('#s-lead').value }) });
      toast('Saved'); await refresh();
    } catch (err) { toast(err.message, true); }
  });
  $('#reset-btn').addEventListener('click', async () => {
    if (prompt('Type RESET to wipe all entries and winners. This cannot be undone.') !== 'RESET') return;
    try { await api('/api/admin/reset-season', { method: 'POST', body: JSON.stringify({ confirm: 'RESET' }) }); toast('Season reset'); await refresh(); }
    catch (err) { toast(err.message, true); }
  });

  // ---------- boot ----------
  api('/api/admin/session').then((s) => { if (s.admin) { showAdmin(); return refresh(); } showLogin(); }).catch(() => showLogin());
})();
