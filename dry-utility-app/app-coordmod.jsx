// Dry Utility App — Utility Coordination module (generic, per-project).
// Hand-off items per utility track: Received from utility → Sent to client →
// Back from client → Forwarded to utility. Ball-in-court derived from the log.
// Views: track tabs with steppers, or ball-in-court board. Nudges for stale hand-offs.

const CM_KEY = 'msa_app_coordmod_v1';
function cmLoad() { try { return JSON.parse(localStorage.getItem(CM_KEY)) || {}; } catch (e) { return {}; } }
function cmPersist(d) { try { localStorage.setItem(CM_KEY, JSON.stringify(d)); } catch (e) {} window.dispatchEvent(new Event('msa-coord-updated')); }

const CM_STATIONS = [
  { col: 'r', lab: 'Received from utility', next: 'msa' },
  { col: 's', lab: 'Sent to client', next: 'client' },
  { col: 'b', lab: 'Back from client', next: 'msa' },
  { col: 'f', lab: 'Forwarded to utility', next: 'utility' },
];
const CM_HOLDER = {
  utility: { lab: 'Utility', badge: 'b-amber' },
  client: { lab: 'Client', badge: 'b-blue' },
  msa: { lab: 'MSA', badge: 'b-violet' },
  done: { lab: 'Complete', badge: 'b-ok' },
};
// ball-in-court from log: nothing yet → utility; r → msa; s → client; b → msa; f → utility (or done if closed)
function cmBall(item) {
  const log = item.log || [];
  if (item.closed) return { holder: 'done', since: item.closed, step: 'Closed out' };
  if (!log.length) return { holder: 'utility', since: item.created, step: 'Awaiting first package from utility' };
  const last = log[log.length - 1];
  const st = CM_STATIONS.find(s => s.col === last.col);
  return { holder: st.next, since: last.date, step: st.lab };
}
const cmDays = (iso) => iso ? Math.max(0, daysBetween(iso, TODAY)) : null;

// coordination tracks — mirror the worksheets in the firm's Utility Coordination Tracking Form
// per-track milestone sequences — mirror the columns on each worksheet of the tracking form
const CM_MILESTONES = {
  sce15: ['Application & plans submitted', 'Design deposit paid', 'Draft design received', 'Rule 15 contract received', 'Contract executed & returned', 'Construction scheduled', 'Energized'],
  sce16: ['Service application submitted', 'Service design received', 'Rule 16 contract executed', 'Panels inspected / released', 'Meters set'],
  gasbb: ['Application submitted', 'Design deposit paid', 'Main extension design received', 'Contract executed', 'Construction scheduled', 'Gas main installed'],
  gasmtr: ['Meter application submitted', 'Meter set schedule received', 'Houselines inspected', 'Meters set'],
  frontier: ['Joint trench application submitted', 'Composite design received', 'JT agreement executed', 'Facilities placed'],
  twc: ['Application submitted', 'Design received', 'Agreement executed', 'Cable placed'],
};
// typical days from the previous milestone (index-aligned with CM_MILESTONES); admins can tune via the Task catalog page
const CM_DUR_KEY = 'msa_app_cmdur_v1';
const CM_MS_DUR_DEFAULT = {
  sce15: [14, 14, 42, 21, 14, 30, 45],
  sce16: [14, 42, 21, 30, 14],
  gasbb: [14, 14, 56, 21, 30, 45],
  gasmtr: [14, 21, 30, 14],
  frontier: [14, 42, 21, 60],
  twc: [14, 42, 21, 60],
};
function cmDurLoadOv() { try { return JSON.parse(localStorage.getItem(CM_DUR_KEY)) || {}; } catch (e) { return {}; } }
function cmDur(trackId) { const ov = cmDurLoadOv(); return ov[trackId] || CM_MS_DUR_DEFAULT[trackId] || []; }
function cmDurPersist(ov) { try { localStorage.setItem(CM_DUR_KEY, JSON.stringify(ov)); } catch (e) {} window.dispatchEvent(new Event('msa-coord-updated')); }
const CM_TRACKS = [
  { id: 'sce15', lab: 'SCE — Rule 15', agency: 'sce' },
  { id: 'sce16', lab: 'SCE — Rule 16', agency: 'sce' },
  { id: 'gasbb', lab: 'Gas Co — Backbone', agency: 'socalgas' },
  { id: 'gasmtr', lab: 'Gas Co — Meters', agency: 'socalgas' },
  { id: 'frontier', lab: 'Frontier', agency: 'frontier' },
  { id: 'twc', lab: 'Spectrum', agency: 'spectrum' },
];

function CoordModule({ p, canWrite, currentUser, users }) {
  const [rev, bump] = React.useReducer(x => x + 1, 0);
  const all = cmLoad();
  const items = (all[p.id] && all[p.id].items) || [];
  const tracks = (all[p.id] && all[p.id].tracks) || null; // null = not configured yet
  const save = (nextItems, nextTracks) => { cmPersist({ ...all, [p.id]: { ...(all[p.id] || {}), items: nextItems, tracks: nextTracks !== undefined ? nextTracks : tracks } }); bump(); };
  const owners = (all[p.id] && all[p.id].owners) || {};
  const fin = (all[p.id] && all[p.id].fin) || {};
  const setFin = (trackId, field, val) => {
    if (!canWrite) return;
    const trk = { ...(fin[trackId] || {}) };
    if (val) trk[field] = val; else delete trk[field];
    cmPersist({ ...all, [p.id]: { ...(all[p.id] || {}), items, tracks, fin: { ...fin, [trackId]: trk } } }); bump();
  };
  const setOwner = (trackId, uid) => {
    if (!canWrite) return;
    const next = { ...owners };
    if (uid) next[trackId] = uid; else delete next[trackId];
    cmPersist({ ...all, [p.id]: { ...(all[p.id] || {}), items, tracks, owners: next } }); bump();
  };
  const deps = (all[p.id] && all[p.id].deps) || {};
  const setDep = (trackId, dep) => {
    if (!canWrite) return;
    const next = { ...deps };
    if (dep) next[trackId] = dep; else delete next[trackId];
    cmPersist({ ...all, [p.id]: { ...(all[p.id] || {}), items, tracks, deps: next } }); bump();
  };
  const depMet = (dep) => { if (!dep) return true; const e = ((ms[dep.track] || {})[dep.ms]); return !!(e && e.date); };
  const depLabel = (dep) => { const trk = CM_TRACKS.find(t => t.id === dep.track); const lab = (CM_MILESTONES[dep.track] || [])[dep.ms]; return `${trk ? trk.lab : dep.track} · ${lab || 'milestone ' + (dep.ms + 1)}`; };
  const ms = (all[p.id] && all[p.id].ms) || {};
  const setMs = (trackId, idx, date) => {
    if (!canWrite) return;
    const trk = { ...(ms[trackId] || {}) };
    const prev = trk[idx] || {};
    if (date) {
      trk[idx] = { ...prev, date, by: currentUser ? currentUser.initials : '' };
      // auto-set the next milestone's deadline from its typical duration
      const dur = cmDur(trackId)[idx + 1];
      if (dur && (CM_MILESTONES[trackId] || [])[idx + 1]) {
        const nx = trk[idx + 1] || {};
        if (!nx.date && !nx.due) { const d = parseDate(date); d.setDate(d.getDate() + dur); trk[idx + 1] = { ...nx, due: d.toISOString().slice(0, 10), auto: true }; }
      }
    }
    else if (prev.due) trk[idx] = { due: prev.due, ...(prev.auto ? { auto: true } : {}) };
    else delete trk[idx];
    cmPersist({ ...all, [p.id]: { ...(all[p.id] || {}), items, tracks, ms: { ...ms, [trackId]: trk } } }); bump();
  };
  const autoFillDues = (trackId) => {
    if (!canWrite) return;
    const defs = CM_MILESTONES[trackId] || [];
    const durs = cmDur(trackId);
    const trk = { ...(ms[trackId] || {}) };
    // anchor: last logged milestone date, else today
    let cursor = TODAY;
    defs.forEach((_, i) => { if (trk[i] && trk[i].date) cursor = parseDate(trk[i].date); });
    let filled = 0;
    defs.forEach((_, i) => {
      const e = trk[i] || {};
      if (e.date) return;
      const d = new Date(cursor); d.setDate(d.getDate() + (durs[i] || 21));
      if (!e.due) { trk[i] = { ...e, due: d.toISOString().slice(0, 10), auto: true }; filled++; cursor = d; }
      else cursor = parseDate(e.due);
    });
    if (!filled) return;
    cmPersist({ ...all, [p.id]: { ...(all[p.id] || {}), items, tracks, ms: { ...ms, [trackId]: trk } } }); bump();
  };
  const setMsDue = (trackId, idx, due) => {
    if (!canWrite) return;
    const trk = { ...(ms[trackId] || {}) };
    const prev = { ...(trk[idx] || {}) };
    if (due) { prev.due = due; delete prev.auto; } else { delete prev.due; delete prev.auto; }
    if (Object.keys(prev).length) trk[idx] = prev; else delete trk[idx];
    cmPersist({ ...all, [p.id]: { ...(all[p.id] || {}), items, tracks, ms: { ...ms, [trackId]: trk } } }); bump();
  };
  const saveTracks = (t) => save(items, t);
  const [editTracks, setEditTracks] = React.useState(false);

  const [view, setView] = React.useState('tracks'); // tracks | board
  const activeTracks = CM_TRACKS.filter(t => (tracks || []).includes(t.id));
  const [tab, setTab] = React.useState(null);
  const activeTab = tab && (tracks || []).concat('other').includes(tab) ? tab : (activeTracks[0] && activeTracks[0].id) || null;

  const [adding, setAdding] = React.useState(false);
  const [nName, setNName] = React.useState('');
  const [nTrack, setNTrack] = React.useState(null);

  const addItem = () => {
    const name = nName.trim();
    if (!name) return;
    const trk = CM_TRACKS.find(t => t.id === (nTrack || activeTab)) || activeTracks[0];
    save([...items, { id: 'cm' + Date.now(), agency: trk ? trk.agency : (p.agencies[0] || ''), track: trk ? trk.id : null, name, created: TODAY.toISOString().slice(0, 10), log: [], nudges: [] }]);
    setAdding(false); setNName('');
  };
  const logStation = (item, col) => {
    if (!canWrite) return;
    const next = items.map(i => i.id === item.id ? { ...i, log: [...(i.log || []), { col, date: TODAY.toISOString().slice(0, 10), by: currentUser ? currentUser.initials : '' }] } : i);
    save(next);
  };
  const undoLast = (item) => {
    if (!canWrite || !(item.log || []).length) return;
    const next = items.map(i => i.id === item.id ? { ...i, log: i.log.slice(0, -1) } : i);
    save(next);
  };
  const toggleClosed = (item) => {
    if (!canWrite) return;
    save(items.map(i => i.id === item.id ? { ...i, closed: i.closed ? null : TODAY.toISOString().slice(0, 10) } : i));
  };
  const removeItem = (item) => {
    if (!canWrite || !window.confirm(`Remove “${item.name}” and its hand-off log?`)) return;
    save(items.filter(i => i.id !== item.id));
  };
  const nudge = (item) => {
    if (!canWrite) return;
    save(items.map(i => i.id === item.id ? { ...i, nudges: [...(i.nudges || []), { ts: new Date().toISOString(), by: currentUser ? currentUser.name : '' }] } : i));
  };
  const addNote = (item, text) => {
    if (!canWrite || !text.trim()) return;
    save(items.map(i => i.id === item.id ? { ...i, notes: [...(i.notes || []), { text: text.trim(), ts: TODAY.toISOString().slice(0, 10), by: currentUser ? currentUser.initials : '' }] } : i));
  };
  const setDue = (item, due) => {
    if (!canWrite) return;
    save(items.map(i => i.id === item.id ? { ...i, due: due || null } : i));
  };
  const [openDetail, setOpenDetail] = React.useState(null);

  const openItems = items.filter(i => !i.closed).map(i => ({ item: i, ball: cmBall(i), days: cmDays(cmBall(i).since) }));
  const staleCount = openItems.filter(x => x.days >= STALE_DAYS).length;

  const Stepper = ({ item }) => {
    const log = item.log || [];
    const doneCount = {};
    log.forEach(e => { doneCount[e.col] = (doneCount[e.col] || 0) + 1; });
    const lastOf = (col) => { const es = log.filter(e => e.col === col); return es.length ? es[es.length - 1] : null; };
    // next expected station = station after the last logged one (cycles allowed)
    const lastIdx = log.length ? CM_STATIONS.findIndex(s => s.col === log[log.length - 1].col) : -1;
    const nextIdx = (lastIdx + 1) % CM_STATIONS.length;
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap' }}>
        {CM_STATIONS.map((s, i) => {
          const e = lastOf(s.col);
          const isNext = !item.closed && i === (log.length ? nextIdx : 0);
          return (
            <div key={s.col} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ minWidth: 128, borderRadius: 8, padding: '7px 10px', border: e ? '1px solid var(--ok)' : isNext ? '1px dashed var(--primary)' : '1px dashed var(--border-strong)', background: e ? 'var(--ok-tint, rgba(22,163,74,0.07))' : isNext ? 'var(--primary-tint)' : 'var(--surface-2)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: e ? 'var(--ok)' : isNext ? 'var(--primary)' : 'var(--ink-4)' }}>{s.lab}</div>
                <div style={{ fontSize: 11.5, marginTop: 2, color: 'var(--ink-2)' }}>
                  {e ? <span className="mono">{fmtShort(e.date)}{e.by ? ` · ${e.by}` : ''}{doneCount[s.col] > 1 ? ` ·×${doneCount[s.col]}` : ''}</span>
                    : isNext && canWrite ? <button className="btn btn-primary btn-sm" style={{ height: 20, fontSize: 10, padding: '0 8px' }} onClick={() => logStation(item, s.col)}>Log today</button>
                    : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                </div>
              </div>
              {i < CM_STATIONS.length - 1 && <span style={{ width: 14, height: 1, background: 'var(--border-strong)' }}></span>}
            </div>
          );
        })}
      </div>
    );
  };

  const ItemDetail = ({ item }) => {
    const [note, setNote] = React.useState('');
    const STL = { r: 'Received from utility', s: 'Sent to client', b: 'Back from client', f: 'Forwarded to utility' };
    const events = [
      { ts: item.created, text: 'Item opened', by: '' },
      ...(item.log || []).map(e => ({ ts: e.date, text: STL[e.col], by: e.by })),
      ...(item.nudges || []).map(n => ({ ts: n.ts.slice(0, 10), text: 'Nudge sent', by: n.by })),
      ...(item.notes || []).map(n => ({ ts: n.ts, text: n.text, by: n.by, note: true })),
      ...(item.closed ? [{ ts: item.closed, text: 'Closed out', by: '' }] : []),
    ].sort((a, b) => parseDate(a.ts) - parseDate(b.ts));
    const overdue = item.due && !item.closed && daysBetween(item.due, TODAY) > 0;
    return (
      <div style={{ marginTop: 8, borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap', fontSize: 11.5 }}>
          <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, color: 'var(--ink-4)' }}>Expected by</span>
          {canWrite
            ? <input type="date" className="input" style={{ height: 26, fontSize: 11.5, width: 130, borderColor: overdue ? 'var(--warn)' : 'var(--border)', color: overdue ? 'var(--warn)' : 'var(--ink-2)' }} value={item.due || ''} onChange={e => setDue(item, e.target.value)} />
            : <span className="mono">{item.due ? fmtShort(item.due) : '—'}</span>}
          {overdue && <span className="badge b-warn"><span className="badge-dot"></span>{daysBetween(item.due, TODAY)}d past expected</span>}
        </div>
        <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, color: 'var(--ink-4)', marginBottom: 6 }}>History</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {events.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11.5, alignItems: 'baseline' }}>
              <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 10.5, minWidth: 52, flexShrink: 0 }}>{fmtShort(e.ts)}</span>
              <span style={{ color: e.note ? 'var(--ink-2)' : 'var(--ink-3)', fontStyle: e.note ? 'italic' : 'normal' }}>{e.text}{e.by ? ` — ${e.by}` : ''}</span>
            </div>
          ))}
        </div>
        {canWrite && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input className="input" style={{ height: 28, fontSize: 12, flex: 1 }} placeholder="Add a note — e.g. spoke with SCE planner, revised package expected next week" value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { addNote(item, note); setNote(''); } }} />
            <button className="btn btn-sm" onClick={() => { addNote(item, note); setNote(''); }} disabled={!note.trim()}>Note</button>
          </div>
        )}
      </div>
    );
  };

  const ItemRow = ({ item }) => {
    const ball = cmBall(item);
    const days = cmDays(ball.since);
    const h = CM_HOLDER[ball.holder];
    const isOpen = openDetail === item.id;
    const extras = (item.log || []).length + (item.notes || []).length + (item.nudges || []).length;
    return (
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span onClick={() => setOpenDetail(isOpen ? null : item.id)} style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', textDecoration: item.closed ? 'line-through' : 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }} title={isOpen ? 'Hide detail' : 'Show detail'}>
            <span style={{ display: 'inline-block', transition: 'transform 0.12s', transform: isOpen ? 'rotate(90deg)' : 'none', color: 'var(--ink-4)', fontSize: 10 }}>▸</span>{item.name}
          </span>
          {item.due && !item.closed && daysBetween(item.due, TODAY) > 0 && <span className="badge b-warn"><span className="badge-dot"></span>past expected</span>}
          <span className={`badge ${h.badge}`}><span className="badge-dot"></span>{item.closed ? 'Complete' : `Ball: ${h.lab} · ${days}d`}</span>
          {!item.closed && <NudgeControl ball={ball} days={days} nudges={item.nudges} canWrite={canWrite} onNudge={() => nudge(item)} utility={AGENCIES[item.agency]?.short} />}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
            {canWrite && (item.log || []).length > 0 && !item.closed && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} title="Remove last logged station" onClick={() => undoLast(item)}>undo</button>}
            {canWrite && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => toggleClosed(item)}>{item.closed ? 'reopen' : 'close out'}</button>}
            {canWrite && <button className="btn btn-ghost btn-sm" style={{ height: 22, padding: '0 6px', color: 'var(--warn)' }} title="Remove item" onClick={() => removeItem(item)}><ProjIcon name="x" size={10} /></button>}
          </span>
        </div>
        {!item.closed && <Stepper item={item} />}
        {ball.step && !isOpen && <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>Last action — {ball.step}{ball.since ? ` · ${fmtShort(ball.since)}` : ''}{extras > 0 ? ` · ${extras} event${extras === 1 ? '' : 's'}` : ''}</div>}
        {isOpen && <ItemDetail item={item} />}
      </div>
    );
  };

  const TrackMilestones = ({ trackId }) => {
    const defs = CM_MILESTONES[trackId] || [];
    if (!defs.length) return null;
    const got = ms[trackId] || {};
    const logged = (i) => got[i] && got[i].date;
    const doneN = defs.filter((_, i) => logged(i)).length;
    const nextIdx = defs.findIndex((_, i) => !logged(i));
    const dep = deps[trackId];
    const blocked = dep && !depMet(dep);
    const depOptions = activeTracks.filter(t => t.id !== trackId).flatMap(t => (CM_MILESTONES[t.id] || []).map((lab, i) => ({ v: `${t.id}:${i}`, lab: `${t.lab} — ${lab}` })));
    const f = fin[trackId] || {};
    const money = (v) => { const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); };
    const FinField = ({ field, label, placeholder, width = 110 }) => {
      const [v, setV] = React.useState(f[field] || '');
      React.useEffect(() => { setV(f[field] || ''); }, [f[field]]);
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)' }}>{label}</span>
          {canWrite
            ? <input className="input" style={{ height: 22, fontSize: 11.5, width }} placeholder={placeholder} value={v} onChange={e => setV(e.target.value)} onBlur={() => setFin(trackId, field, v.trim())} onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }} />
            : <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{(field === 'deposit' || field === 'contract') ? (money(f[field]) || '—') : (f[field] || '—')}</span>}
        </span>
      );
    };
    return (
      <div style={{ margin: '10px 16px 0', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)' }}>Track milestones</span>
          <span className={`badge ${doneN === defs.length ? 'b-ok' : 'b-gray'}`}>{doneN}/{defs.length}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 4, minWidth: 0, maxWidth: '100%' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)' }}>Owner</span>
            {canWrite && users
              ? <select className="select" style={{ width: 'auto', maxWidth: 170, minWidth: 0, height: 22, fontSize: 11, paddingLeft: 6 }} value={owners[trackId] || ''} onChange={e => setOwner(trackId, e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              : <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{(users || []).find(u => u.id === owners[trackId])?.name || '—'}</span>}
          </span>
          {canWrite && doneN < defs.length && <button className="btn btn-ghost btn-sm" style={{ height: 20, fontSize: 10.5, marginLeft: 'auto' }} title="Fill empty deadlines from typical durations, cascading from the last logged milestone" onClick={() => autoFillDues(trackId)}>Auto-set deadlines</button>}
        </div>
        {blocked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 8, border: '1px solid var(--amber)', background: 'var(--amber-tint)', padding: '6px 10px', fontSize: 11.5, color: 'var(--amber-ink)', marginBottom: 8 }}>
            <ProjIcon name="lock" size={11} /><b>Blocked</b> — waiting on {depLabel(dep)}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {defs.map((lab, i) => {
            const e = got[i];
            const isDone = e && e.date;
            const isNext = i === nextIdx;
            const overdue = e && e.due && !isDone && daysBetween(e.due, TODAY) > 0;
            return (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '5px 9px', fontSize: 11.5, border: isDone ? '1px solid var(--ok)' : overdue ? '1px solid var(--warn)' : isNext ? '1px dashed var(--primary)' : '1px dashed var(--border-strong)', background: isDone ? 'var(--ok-tint, rgba(22,163,74,0.07))' : overdue ? 'var(--warn-tint, rgba(220,38,38,0.06))' : isNext ? 'var(--primary-tint)' : 'var(--surface)' }}>
                <span style={{ fontWeight: 600, color: isDone ? 'var(--ok)' : overdue ? 'var(--warn)' : isNext ? 'var(--primary)' : 'var(--ink-4)' }}>{i + 1}. {lab}</span>
                {isDone
                  ? <>
                      {canWrite
                        ? <input type="date" className="input" style={{ height: 20, fontSize: 10.5, width: 112, padding: '0 4px' }} value={e.date} onChange={ev => setMs(trackId, i, ev.target.value)} />
                        : <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{fmtShort(e.date)}</span>}
                      {e.by && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{e.by}</span>}
                      {canWrite && <button className="btn btn-ghost btn-sm" style={{ height: 18, padding: '0 4px', fontSize: 10, color: 'var(--warn)' }} title="Clear" onClick={() => setMs(trackId, i, null)}>×</button>}
                    </>
                  : <>
                      {canWrite
                        ? <input type="date" className="input" title={`Deadline — reminders fire as it approaches${e && e.auto ? ' (auto-set from typical duration)' : ''}`} style={{ height: 20, fontSize: 10.5, width: 112, padding: '0 4px', borderColor: overdue ? 'var(--warn)' : 'var(--border)', color: overdue ? 'var(--warn)' : e && e.auto ? 'var(--ink-4)' : 'var(--ink-3)', fontStyle: e && e.auto ? 'italic' : 'normal' }} value={(e && e.due) || ''} onChange={ev => setMsDue(trackId, i, ev.target.value)} />
                        : e && e.due && <span className="mono" style={{ fontSize: 10.5, color: overdue ? 'var(--warn)' : 'var(--ink-4)' }}>due {fmtShort(e.due)}</span>}
                      {overdue && <span className="badge b-warn" style={{ fontSize: 9.5 }}>{daysBetween(e.due, TODAY)}d late</span>}
                      {canWrite && isNext && <button className="btn btn-primary btn-sm" style={{ height: 20, fontSize: 10, padding: '0 8px' }} onClick={() => setMs(trackId, i, TODAY.toISOString().slice(0, 10))}>Log today</button>}
                    </>}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 9, paddingTop: 8, borderTop: '1px dashed var(--border)', alignItems: 'center' }}>
          <FinField field="deposit" label="Design deposit" placeholder="$ amount" />
          <FinField field="depositRef" label="Check / PO #" placeholder="ref" width={90} />
          <FinField field="contract" label="Contract amount" placeholder="$ amount" />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, maxWidth: '100%' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', flexShrink: 0 }}>Blocked by</span>
            {canWrite && depOptions.length
              ? <select className="select" style={{ width: 'auto', maxWidth: 'min(250px, 100%)', minWidth: 0, height: 22, fontSize: 11, paddingLeft: 6, color: dep ? (blocked ? 'var(--amber-ink)' : 'var(--ok)') : 'var(--ink-4)' }} value={dep ? `${dep.track}:${dep.ms}` : ''} onChange={e => { const v = e.target.value; if (!v) setDep(trackId, null); else { const [t, i2] = v.split(':'); setDep(trackId, { track: t, ms: +i2 }); } }}>
                  <option value="">Nothing</option>
                  {depOptions.map(o => <option key={o.v} value={o.v}>{o.lab}</option>)}
                </select>
              : <span style={{ fontSize: 11.5, color: dep ? (blocked ? 'var(--amber-ink)' : 'var(--ok)') : 'var(--ink-4)' }}>{dep ? depLabel(dep) + (blocked ? '' : ' — met') : '—'}</span>}
          </span>
          {f.deposit && money(f.deposit) && <span className="badge b-gray" style={{ fontSize: 9.5 }}>deposit {money(f.deposit)}{f.contract && money(f.contract) ? ` · contract ${money(f.contract)}` : ''}</span>}
        </div>
      </div>
    );
  };

  // legacy items without a track → map by agency to the first matching track; unmatched → 'other'
  const trackOf = (i) => i.track || (CM_TRACKS.find(t => t.agency === i.agency) || {}).id || 'other';
  const otherItems = items.filter(i => trackOf(i) === 'other' || !(tracks || []).includes(trackOf(i)));
  const tabTracks = [...activeTracks, ...(otherItems.length ? [{ id: 'other', lab: 'Other', agency: null }] : [])];
  const TrackPicker = ({ initial, onDone, onCancel }) => {
    const [sel, setSel] = React.useState(initial || []);
    const tog = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    // only the project's own agencies up front; anything already enabled counts as on-project
    const onProjectTracks = CM_TRACKS.filter(t => p.agencies.includes(t.agency) || (initial || []).includes(t.id));
    const otherTracks = CM_TRACKS.filter(t => !onProjectTracks.includes(t));
    const [showOther, setShowOther] = React.useState(false);
    const TrackBtn = ({ t }) => {
      const on = sel.includes(t.id);
      const inProject = p.agencies.includes(t.agency);
      return (
        <button onClick={() => tog(t.id)} style={{ font: 'inherit', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: on ? '1.5px solid var(--primary)' : '1px solid var(--border)', background: on ? 'var(--primary-tint)' : 'var(--surface)' }}>
          <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: on ? 'none' : '1.5px solid var(--border-strong)', background: on ? 'var(--primary)' : 'transparent', display: 'grid', placeItems: 'center', color: '#fff' }}>{on && <ProjIcon name="check" size={10} />}</span>
          <span>
            <span style={{ display: 'block', fontWeight: 700, fontSize: 12.5, color: 'var(--ink)' }}>{t.lab}</span>
            <span style={{ display: 'block', fontSize: 10.5, color: inProject ? 'var(--ink-4)' : 'var(--amber-ink)' }}>{AGENCIES[t.agency]?.short || t.agency}{inProject ? '' : ' — not on this project'}</span>
          </span>
        </button>
      );
    };
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 10 }}><b>Which coordination tracks does this project need?</b> One per worksheet in the coordination tracking form — these are the agencies selected for this project.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8, marginBottom: 12 }}>
          {onProjectTracks.map(t => <TrackBtn key={t.id} t={t} />)}
        </div>
        {/* Tracks for agencies that aren't on this project stay tucked away, but
            remain available for the cases where one needs adding later. */}
        {otherTracks.length > 0 && (
          showOther ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', fontWeight: 700, margin: '0 0 6px' }}>Other tracks — agencies not on this project</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                {otherTracks.map(t => <TrackBtn key={t.id} t={t} />)}
              </div>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => setShowOther(true)}>+ Add another track ({otherTracks.length})</button>
          )
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => onDone(sel)} disabled={!sel.length}>Enable {sel.length || ''} track{sel.length === 1 ? '' : 's'}</button>
          {onCancel && <button className="btn btn-sm" onClick={onCancel}>Cancel</button>}
        </div>
      </div>
    );
  };

  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Utility coordination <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-4)' }}>— hand-off tracking</span></h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {staleCount > 0 && <span className="badge b-amber"><span className="badge-dot"></span>{staleCount} stale</span>}
          <span className="meta">{openItems.length} open · {items.filter(i => i.closed).length} complete</span>
          {tracks && canWrite && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} title="Change which tracks are enabled" onClick={() => setEditTracks(true)}>Tracks…</button>}
          <div className="lens" style={{ padding: 2 }}>
            <button className={view === 'tracks' ? 'active' : ''} style={{ height: 22, fontSize: 10.5 }} onClick={() => setView('tracks')}>Tracks</button>
            <button className={view === 'board' ? 'active' : ''} style={{ height: 22, fontSize: 10.5 }} onClick={() => setView('board')}>Ball-in-court</button>
          </div>
          {canWrite && tracks && !editTracks && !adding && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => { setAdding(true); setNTrack(activeTab && activeTab !== 'other' ? activeTab : (activeTracks[0] ? activeTracks[0].id : null)); }}>+ Hand-off item</button>}
        </div>
      </div>
      {(!tracks || editTracks) && (
        canWrite
          ? <TrackPicker initial={tracks || CM_TRACKS.filter(t => p.agencies.includes(t.agency)).map(t => t.id)} onDone={(sel) => { saveTracks(sel); setEditTracks(false); }} onCancel={tracks ? () => setEditTracks(false) : null} />
          : <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)' }}>Coordination tracks not configured yet — an editor selects which worksheets apply.</div>
      )}
      {tracks && !editTracks && <>
      {adding && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--primary-tint)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" autoFocus style={{ height: 30, fontSize: 12.5, flex: 1, minWidth: 180 }} placeholder="Item — e.g. Rule 15 contract, meter set schedule, joint trench composite" value={nName} onChange={e => setNName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addItem(); }} />
          <select className="select" style={{ width: 'auto', height: 30, fontSize: 12 }} value={nTrack || activeTab || ''} onChange={e => setNTrack(e.target.value)}>
            {activeTracks.map(t => <option key={t.id} value={t.id}>{t.lab}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={addItem} disabled={!nName.trim()}>Add</button>
          <button className="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      )}
      {items.length === 0 && !adding && (
        <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)' }}>No hand-off items yet in {activeTracks.length} enabled track{activeTracks.length === 1 ? '' : 's'}. {canWrite ? 'Add the documents and packages that cycle between the utility, MSA, and the client — each gets a four-station hand-off tracker.' : ''}</div>
      )}
      {view === 'tracks' && (
        <>
          {tabTracks.length > 1 && (
            <div style={{ display: 'flex', gap: 4, padding: '10px 16px 0', flexWrap: 'wrap' }}>
              {tabTracks.map(t => {
                const open = items.filter(i => (t.id === 'other' ? otherItems.includes(i) : trackOf(i) === t.id) && !i.closed).length;
                const ou = t.id !== 'other' && users ? users.find(u => u.id === owners[t.id]) : null;
                const blk = t.id !== 'other' && deps[t.id] && !depMet(deps[t.id]);
                return (
                  <button key={t.id} className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : ''}`} style={{ height: 26, fontSize: 11, ...(blk && activeTab !== t.id ? { borderColor: 'var(--amber)', color: 'var(--amber-ink)' } : {}) }} onClick={() => setTab(t.id)}>
                    {blk ? '⚠ ' : ''}{t.lab}{ou ? ` · ${ou.initials}` : ''}{open > 0 ? ` · ${open}` : ''}
                  </button>
                );
              })}
            </div>
          )}
          {activeTab && activeTab !== 'other' && <TrackMilestones trackId={activeTab} />}
          <div style={{ marginTop: 8 }}>
            {items.filter(i => tabTracks.length > 1 ? (activeTab === 'other' ? otherItems.includes(i) : trackOf(i) === activeTab) : true).map(i => <ItemRow key={i.id} item={i} />)}
          </div>
        </>
      )}
      {items.length > 0 && view === 'board' && (
        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {openItems.sort((a, b) => b.days - a.days).map(({ item, ball, days }) => {
            const h = CM_HOLDER[ball.holder];
            return (
              <div key={item.id} style={{ border: days >= STALE_DAYS ? '1px solid var(--amber)' : '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', background: days >= STALE_DAYS ? 'var(--amber-tint)' : 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="util-tag util-iid mono">{AGENCIES[item.agency]?.short || item.agency}</span>
                  <span className={`badge ${h.badge}`} style={{ fontSize: 9.5 }}>{h.lab}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)', marginBottom: 6 }}>{item.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: days >= STALE_DAYS ? 'var(--amber-ink)' : 'var(--ink)' }}>{days}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>days waiting · since {fmtShort(ball.since)}</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 4 }}>{ball.step}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <NudgeControl ball={ball} days={days} nudges={item.nudges} canWrite={canWrite} onNudge={() => nudge(item)} utility={AGENCIES[item.agency]?.short} />
                </div>
              </div>
            );
          })}
          {openItems.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>Nothing open — all hand-offs complete.</div>}
        </div>
      )}
      </>}
    </div>
  );
}

Object.assign(window, { CoordModule, cmLoad, cmBall, cmDays, CM_TRACKS, CM_MILESTONES, cmDur, cmDurLoadOv, cmDurPersist, CM_MS_DUR_DEFAULT });
