// Blueprint — Utility Coordination page: every hand-off across every project.
function CoordPage({ projects, onOpenProject, users }) {
  const [view, setView] = React.useState('tracks'); // tracks | handoffs
  const [filter, setFilter] = React.useState('all'); // all | msa | client | utility | stale
  const [q, setQ] = React.useState('');
  const [, bump] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    window.addEventListener('msa-coord-updated', bump);
    return () => window.removeEventListener('msa-coord-updated', bump);
  }, []);
  const rows = React.useMemo(() => {
    const all = cmLoad();
    const out = [];
    projects.forEach(p => {
      ((all[p.id] && all[p.id].items) || []).forEach(item => {
        const ball = cmBall(item);
        out.push({ p, item, ball, days: cmDays(ball.since) });
      });
    });
    return out.sort((a, b) => (a.item.closed ? 1 : 0) - (b.item.closed ? 1 : 0) || b.days - a.days);
  }, [projects, filter, q]);
  const open = rows.filter(x => !x.item.closed);
  const stale = open.filter(x => x.days >= 14);
  const byHolder = (h) => open.filter(x => x.ball.holder === h);
  const H = { utility: ['Utility', 'b-amber'], client: ['Client', 'b-blue'], msa: ['MSA', 'b-violet'], done: ['Complete', 'b-ok'] };
  const shown = rows.filter(x => {
    if (filter === 'stale' && (x.item.closed || x.days < 14)) return false;
    if (['msa', 'client', 'utility'].includes(filter) && (x.item.closed || x.ball.holder !== filter)) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!(x.p.name.toLowerCase().includes(s) || x.p.code.toLowerCase().includes(s) || x.item.name.toLowerCase().includes(s) || (AGENCIES[x.item.agency]?.name || '').toLowerCase().includes(s))) return false;
    }
    return true;
  });
  // track rows: one per enabled track per project
  const trackRows = React.useMemo(() => {
    const all = cmLoad();
    const out = [];
    projects.forEach(p => {
      const cmd = all[p.id];
      if (!cmd || !cmd.tracks) return;
      cmd.tracks.forEach(tid => {
        const trk = (typeof CM_TRACKS !== 'undefined' ? CM_TRACKS : []).find(t => t.id === tid);
        const defs = (typeof CM_MILESTONES !== 'undefined' ? CM_MILESTONES[tid] : []) || [];
        const got = (cmd.ms || {})[tid] || {};
        const doneN = defs.filter((_, i) => got[i] && got[i].date).length;
        const nextIdx = defs.findIndex((_, i) => !(got[i] && got[i].date));
        const nextDue = nextIdx >= 0 && got[nextIdx] && got[nextIdx].due ? got[nextIdx].due : null;
        const overdueN = defs.filter((_, i) => got[i] && got[i].due && !got[i].date && daysBetween(got[i].due, TODAY) > 0).length;
        const dep = (cmd.deps || {})[tid];
        const depE = dep && ((cmd.ms || {})[dep.track] || {})[dep.ms];
        const blocked = !!(dep && !(depE && depE.date));
        const depTrk = blocked ? (typeof CM_TRACKS !== 'undefined' ? CM_TRACKS : []).find(x => x.id === dep.track) : null;
        const owner = (users || []).find(u => u.id === (cmd.owners || {})[tid]) || null;
        out.push({ p, tid, trk, defs, doneN, nextIdx, nextDue, overdueN, blocked, depTrk, owner, done: defs.length > 0 && doneN >= defs.length });
      });
    });
    return out.sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || b.overdueN - a.overdueN || (a.nextDue || '9999').localeCompare(b.nextDue || '9999'));
  }, [projects, users]);
  const trkOpen = trackRows.filter(r => !r.done);
  const trkOverdue = trkOpen.filter(r => r.overdueN > 0);
  const trkBlocked = trkOpen.filter(r => r.blocked);
  const shownTracks = trackRows.filter(r => {
    if (filter === 'stale' && !r.overdueN) return false;
    if (filter === 'blocked' && !r.blocked) return false;
    if (filter === 'done' && !r.done) return false;
    if (filter === 'all' && r.done) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!(r.p.name.toLowerCase().includes(s) || r.p.code.toLowerCase().includes(s) || (r.trk ? r.trk.lab.toLowerCase() : r.tid).includes(s) || (r.owner && r.owner.name.toLowerCase().includes(s)))) return false;
    }
    return true;
  });
  const KPI = ({ id, n, lab, tint, color, icon }) => (
    <button className={`kpi clickable ${filter === id ? 'kpi-active' : ''}`} style={filter === id ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' } : null} onClick={() => setFilter(filter === id ? 'all' : id)}>
      <div className="k-ic" style={{ background: tint, color }}><Icon name={icon} size={16} /></div>
      <div><div className="k-val">{n}</div><div className="k-lab">{lab}</div></div>
    </button>
  );
  return (
    <div>
      {view === 'tracks' ? (
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <KPI id="all" n={trkOpen.length} lab="Active tracks" tint="var(--primary-tint)" color="var(--primary)" icon="tracker" />
          <KPI id="stale" n={trkOverdue.length} lab="With overdue milestones" tint="var(--warn-tint)" color="var(--warn)" icon="alert" />
          <KPI id="blocked" n={trkBlocked.length} lab="Blocked by dependency" tint="var(--amber-tint)" color="var(--amber)" icon="wsl" />
          <KPI id="done" n={trackRows.length - trkOpen.length} lab="Tracks complete" tint="var(--ok-tint, rgba(22,163,74,0.1))" color="var(--ok)" icon="report" />
        </div>
      ) : (
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <KPI id="all" n={open.length} lab="Open hand-offs" tint="var(--primary-tint)" color="var(--primary)" icon="tracker" />
        <KPI id="msa" n={byHolder('msa').length} lab="Ball with MSA" tint="var(--violet-tint)" color="var(--violet)" icon="users" />
        <KPI id="client" n={byHolder('client').length} lab="Ball with client" tint="var(--blue-tint)" color="var(--blue)" icon="report" />
        <KPI id="utility" n={byHolder('utility').length} lab="Ball with utility" tint="var(--amber-tint)" color="var(--amber)" icon="wsl" />
        <KPI id="stale" n={stale.length} lab="Stale (14+ days)" tint="var(--warn-tint)" color="var(--warn)" icon="alert" />
      </div>
      )}
      <div className="toolbar">
        <div className="lens" style={{ padding: 2, marginRight: 10 }}>
          <button className={view === 'tracks' ? 'active' : ''} style={{ height: 24, fontSize: 11 }} onClick={() => { setView('tracks'); setFilter('all'); }}>Tracks</button>
          <button className={view === 'handoffs' ? 'active' : ''} style={{ height: 24, fontSize: 11 }} onClick={() => { setView('handoffs'); setFilter('all'); }}>Hand-offs</button>
        </div>
        <div className="search-box">
          <Icon name="search" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects, items, agencies…" />
        </div>
        <div className="toolbar-spacer"></div>
        <span className="meta" style={{ fontSize: 12, color: 'var(--ink-4)' }}>{view === 'tracks' ? `${shownTracks.length} of ${trackRows.length} tracks` : `${shown.length} of ${rows.length} hand-offs`}</span>
      </div>
      {view === 'tracks' ? (
      <div className="grid-wrap">
        <div className="grid-scroll">
          <table className="grid">
            <thead><tr><th className="col-project">Project</th><th>Track</th><th>Owner</th><th style={{ minWidth: 160 }}>Progress</th><th>Next milestone</th><th>Deadline</th><th>Status</th></tr></thead>
            <tbody>
              {shownTracks.map((r, i) => {
                const pct = r.defs.length ? Math.round(r.doneN / r.defs.length * 100) : 0;
                const dLate = r.nextDue && daysBetween(r.nextDue, TODAY) > 0 ? daysBetween(r.nextDue, TODAY) : 0;
                return (
                  <tr key={i} className="row-main" style={{ cursor: 'pointer' }} onClick={() => onOpenProject(r.p.id)}>
                    <td className="col-project"><div className="proj-info"><div className="proj-name">{r.p.name}</div><div className="proj-code">{r.p.code} · {r.p.client}</div></div></td>
                    <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.trk ? r.trk.lab : r.tid}</td>
                    <td>{r.owner ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><UserAvatar user={r.owner} size={20} /><span style={{ fontSize: 12 }}>{r.owner.name}</span></span> : <span className="cell-muted">—</span>}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--surface-3, var(--border))', overflow: 'hidden', minWidth: 70 }}><div style={{ width: pct + '%', height: '100%', background: r.done ? 'var(--ok)' : 'var(--primary)' }}></div></div>
                        <span className="mono" style={{ fontSize: 11, color: r.done ? 'var(--ok)' : 'var(--ink-3)' }}>{r.doneN}/{r.defs.length}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{r.done ? <span className="cell-muted">complete</span> : r.nextIdx >= 0 ? r.defs[r.nextIdx] : '—'}</td>
                    <td>{r.nextDue ? <span className={`mono ${dLate ? '' : ''}`} style={{ fontSize: 12, color: dLate ? 'var(--warn)' : 'var(--ink-3)' }}>{fmtShort(r.nextDue)}{dLate ? ` · ${dLate}d late` : ''}</span> : <span className="cell-muted">—</span>}</td>
                    <td>
                      {r.done ? <span className="badge b-ok"><span className="badge-dot"></span>Complete</span>
                        : r.blocked ? <span className="badge b-amber" title={`Waiting on ${r.depTrk ? r.depTrk.lab : ''}`}><span className="badge-dot"></span>Blocked · {r.depTrk ? r.depTrk.lab : 'dependency'}</span>
                        : r.overdueN ? <span className="badge b-warn"><span className="badge-dot"></span>{r.overdueN} overdue</span>
                        : <span className="badge b-gray"><span className="badge-dot"></span>On track</span>}
                    </td>
                  </tr>
                );
              })}
              {shownTracks.length === 0 && <tr><td colSpan="7" style={{ padding: 18, color: 'var(--ink-4)' }}>No tracks match. Tracks are enabled from each project's Utility Coordination module.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
      <div className="grid-wrap">
        <div className="grid-scroll">
          <table className="grid">
            <thead><tr><th className="col-project">Project</th><th>Hand-off item</th><th>Agency</th><th>Ball in court</th><th>Last action</th><th>Waiting</th></tr></thead>
            <tbody>
              {shown.map(({ p, item, ball, days }, i) => {
                const h = H[ball.holder];
                return (
                  <tr key={i} className="row-main" style={{ cursor: 'pointer' }} onClick={() => onOpenProject(p.id)}>
                    <td className="col-project">
                      <div className="proj-info">
                        <div className="proj-name">{p.name}</div>
                        <div className="proj-code">{p.code} · {p.client}</div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: item.closed ? 'line-through' : 'none' }}>{item.name}</td>
                    <td><span className="util-tag util-iid mono">{AGENCIES[item.agency]?.short || item.agency}</span></td>
                    <td><span className={`badge ${item.closed ? 'b-ok' : h[1]}`}><span className="badge-dot"></span>{item.closed ? 'Complete' : h[0]}</span></td>
                    <td style={{ fontSize: 12 }}>{ball.step}{ball.since ? ` · ${fmtShort(ball.since)}` : ''}</td>
                    <td>{item.closed ? <span className="cell-muted">—</span> : <span className={`days-chip ${days >= 30 ? 'crit' : days >= 14 ? 'warn' : ''}`}>{days}d</span>}</td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan="6" style={{ padding: 18, color: 'var(--ink-4)' }}>No hand-offs match. Coordination items are added from each project's Utility Coordination module.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
Object.assign(window, { CoordPage });
