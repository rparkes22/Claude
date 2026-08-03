// Dry Utility App — shell, tracker, WSL page, reports page.
// Uses globals from app-data.jsx, app-auth.jsx, app-wizard.jsx.

function Icon({ name, size = 14 }) {
  const p = {
    tracker: 'M2 3h5v5H2V3zm7 0h5v5H9V3zM2 10h5v3H2v-3zm7 0h5v3H9v-3z',
    dash: 'M2 8a6 6 0 1 1 12 0M8 8l3-3M2 13h12',
    team: 'M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 13a4.5 4.5 0 0 1 9 0M11 6.8a2.2 2.2 0 1 0-1.6-3.9M11.2 8.9a4 4 0 0 1 3.3 4.1',
    wsl: 'M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 4v4l2.5 1.5',
    report: 'M3 2h7l3 3v9H3V2zm7 0v3h3M5.5 8h5M5.5 11h3',
    users: 'M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 14a4.5 4.5 0 0 1 9 0M11 7a2.5 2.5 0 1 0-1.5-4.5M11.5 9.5a4.5 4.5 0 0 1 3 4.5',
    chev: 'M6 4l4 4-4 4',
    chevL: 'M10 4L6 8l4 4',
    search: 'M11 11l3 3M5 8a3 3 0 1 1 6 0 3 3 0 0 1-6 0z',
    plus: 'M3 8h10M8 3v10',
    check: 'M3 8l3 3 7-7',
    x: 'M3 3l10 10M13 3L3 13',
    file: 'M4 2h5l3 3v9H4V2z',
    clip: 'M13 7l-5.2 5.2a3 3 0 0 1-4.2-4.2L9 2.6a2 2 0 0 1 2.8 2.8L6.6 10.6a1 1 0 0 1-1.4-1.4L10 4.4',
    edit: 'M11.5 2.5a1.4 1.4 0 0 1 2 2L6 12l-2.7.7L4 10l7.5-7.5z',
    download: 'M8 2v8m0 0l3-3m-3 3L5 7M2 13h12',
    clock: 'M8 4v4l2.5 1.5M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z',
    refresh: 'M13 7a5 5 0 1 0-1 4m1 1V9h-3',
    alert: 'M8 2l6 11H2L8 2zM8 7v3M8 12h0',
    pin: 'M8 14s5-5 5-9a5 5 0 1 0-10 0c0 4 5 9 5 9zm0-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    logout: 'M6 14H3V2h3M10 11l3-3-3-3M13 8H6',
    print: 'M5 6V2h6v4M5 12H3V7h10v5h-2M5 10h6v4H5v-4z',
    bolt: 'M9 2L3 9h4l-1 5 6-7H8l1-5z',
    building: 'M3 14V3h6v11M9 6h4v8M5 5h2M5 8h2M5 11h2M11 8h0M11 11h0M2 14h13',
    lock: 'M4 7V5a4 4 0 0 1 8 0v2M3 7h10v7H3V7z',
    bell: 'M8 2a3 3 0 0 0-3 3c0 4-1.5 5-1.5 5h9S11 9 11 5a3 3 0 0 0-3-3zM6.5 13a1.5 1.5 0 0 0 3 0',
  }[name];
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={p} /></svg>;
}

function PhaseBadge({ phase }) {
  const m = PHASE_META[phase] || { badge: 'b-gray' };
  return <span className={`badge ${m.badge}`}><span className="badge-dot"></span>{phase}</span>;
}
function TaskDots({ tasks }) {
  if (!tasks.length) return <span className="cell-muted">—</span>;
  return (
    <span className="sub-dots">
      {tasks.map((t, i) => {
        const m = SUB_META[t.status];
        return (
          <span key={i} className={`sub-dot ${m.cls}`} title={`${AGENCIES[t.agency]?.short || t.agency} · ${t.name} — ${m.label}`}>
            {t.status === 'ok' && <Icon name="check" size={9} />}
            {t.status === 'resubmit' && <Icon name="x" size={9} />}
            {t.status === 'review' && '•'}
          </span>
        );
      })}
    </span>
  );
}
function DDPips({ dd }) {
  const active = dd.filter(d => d.status !== 'na');
  const done = active.filter(d => d.status === 'done').length;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className="dd-pips">
        {dd.map((d, i) => <span key={i} className={`dd-pip ${d.status === 'done' ? 'dd-done' : d.status === 'prog' ? 'dd-prog' : d.status === 'na' ? 'dd-na' : 'dd-todo'}`} title={`${d.name} — ${DD_META[d.status].label}`}></span>)}
      </span>
      <span className="mini-pct">{done}/{active.length}</span>
    </span>
  );
}
function WslChip({ wd }) {
  if (!wd) return <span className="util-tag util-sce">SCE · n/a</span>;
  // The letter stays "Sent" once issued; expiry rides alongside it as a separate signal.
  const cls = wd.state === 'expired' || wd.state === 'critical' ? 'crit' : wd.state === 'warning' ? 'warn' : 'ok';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className="badge b-ok" style={{ padding: '1px 7px', fontSize: 10 }}><span className="badge-dot"></span>Sent</span>
      <span className={`days-chip ${cls}`}>{wd.state === 'expired' ? `expired ${fmtShort(wd.effectiveExpiry)}` : `${wd.daysLeft}d`}</span>
      {wd.needsExtension && <span className="badge b-amber" style={{ padding: '1px 6px', fontSize: 10 }} title="6-month extension still available">extend</span>}
      {wd.extensionUsed && <span className="badge b-violet" style={{ padding: '1px 6px', fontSize: 10 }}>ext used</span>}
    </span>
  );
}
const locString = (l) => `${l.street}, ${l.city}, ${l.state} ${l.zip}`;

// ===== TRACKER detail expansion =====
// research rows for a project (seed + logged), with received overrides applied
// Override entries are either the legacy shape (a received date string, or null)
// or { sent, received, noResponse } once a date has been edited or the agency has
// been marked as never responding. A letter is "resolved" when a response came
// back or it was closed out as no-response.
window.getResearchRows = function getResearchRows(p) {
  let ov = {}; try { ov = JSON.parse(localStorage.getItem('msa_app_research_v1')) || {}; } catch (e) {}
  const added = (typeof loadAddedResearch === 'function' ? (loadAddedResearch()[p.id] || []) : []);
  const o = ov[p.id] || {};
  return [...(p.research || []), ...added].map(r => {
    if (!Object.prototype.hasOwnProperty.call(o, r.id)) return { ...r, noResponse: false };
    const v = o[r.id];
    if (v === null || typeof v === 'string') return { ...r, received: v, noResponse: false };
    return { ...r, sent: v.sent || r.sent, received: v.received || null, noResponse: !!v.noResponse };
  });
}
// A letter no longer needs chasing once it is received or closed as no-response.
window.researchResolved = function researchResolved(r) { return !!(r.received || r.noResponse); };

function DetailPanel({ p, canWrite, onWslAction, showToast }) {
  const [tab, setTab] = React.useState('tasks');
  const wd = deriveWsl(p.wsl);
  const ddActive = p.dd.filter(d => d.status !== 'na');
  const ddDone = ddActive.filter(d => d.status === 'done').length;
  const tasksOk = p.tasks.filter(t => t.status === 'ok').length;
  const resRows = getResearchRows(p);
  const resGot = resRows.filter(r => r.received).length;
  const cmData = (typeof cmLoad === 'function' ? cmLoad() : {})[p.id] || {};
  const cmItems = cmData.items || [];
  const cmOpen = cmItems.filter(i => !i.closed);
  const cmTracks = (typeof CM_TRACKS !== 'undefined' ? CM_TRACKS : []).filter(t => (cmData.tracks || []).includes(t.id));
  const cmMs = cmData.ms || {};
  return (
    <div className="detail-panel">
      <div className="detail-side">
        <h5>{p.name}</h5>
        <div className="ds-code">{p.code} · {p.client}</div>
        <div className="ds-loc"><Icon name="pin" size={11} /> {p.location.street}<br />{p.location.city}, {p.location.state} {p.location.zip}</div>
        <PhaseBadge phase={p.phase} />
        <div className="detail-tabs">
          <button className={`detail-tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>Research <span className="dt-count">{resGot}/{resRows.length}</span></button>
          {(cmItems.length > 0 || cmTracks.length > 0) && <button className={`detail-tab ${tab === 'coord' ? 'active' : ''}`} onClick={() => setTab('coord')}>Coordination <span className="dt-count">{cmOpen.length} open</span></button>}
          <button className={`detail-tab ${tab === 'wsl' ? 'active' : ''}`} onClick={() => setTab('wsl')}>{wd ? 'Will Serve' : 'SCE review'}</button>
        </div>
      </div>
      <div className="detail-main">
        {tab === 'tasks' && (
          <div>
            <h6>Utility research — jurisdiction verification</h6>
            <table className="sub-table">
              <thead><tr><th>Utility</th><th>Agency</th><th>Sent</th><th>Status</th></tr></thead>
              <tbody>
                {resRows.map((r, i) => {
                  const a = AGENCIES[r.agency];
                  const days = daysBetween(r.sent, TODAY);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{r.label}</td>
                      <td><span className="util-tag util-iid mono">{a?.short || r.agency}</span></td>
                      <td className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtShort(r.sent)}</td>
                      <td><span className={`badge ${r.received ? 'b-ok' : days > 45 ? 'b-warn' : 'b-amber'}`}><span className="badge-dot"></span>{r.received ? `Received ${fmtShort(r.received)}` : `Waiting · ${days}d`}</span></td>
                    </tr>
                  );
                })}
                {resRows.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-4)' }}>No research letters sent — add the Utility Research module on the project page.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'coord' && (
          <div>
            {cmTracks.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <h6>Track progress</h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {cmTracks.map(t => {
                    const defs = (typeof CM_MILESTONES !== 'undefined' ? CM_MILESTONES[t.id] : []) || [];
                    const got = cmMs[t.id] || {};
                    const doneN = defs.filter((_, i) => got[i] && got[i].date).length;
                    const nextIdx = defs.findIndex((_, i) => !(got[i] && got[i].date));
                    const overdueN = defs.filter((_, i) => got[i] && got[i].due && !got[i].date && daysBetween(got[i].due, TODAY) > 0).length;
                    const pct = defs.length ? Math.round(doneN / defs.length * 100) : 0;
                    const dep = (cmData.deps || {})[t.id];
                    const depE = dep && (cmMs[dep.track] || {})[dep.ms];
                    const blocked = dep && !(depE && depE.date);
                    const depTrk = blocked ? (typeof CM_TRACKS !== 'undefined' ? CM_TRACKS : []).find(x => x.id === dep.track) : null;
                    return (
                      <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', minWidth: 170, flex: '1 1 170px', maxWidth: 240, background: 'var(--surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <span style={{ fontWeight: 700, fontSize: 11.5, color: 'var(--ink)', flex: 1 }}>{t.lab}</span>
                          <span className="mono" style={{ fontSize: 10.5, color: doneN === defs.length ? 'var(--ok)' : 'var(--ink-4)' }}>{doneN}/{defs.length}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-3, var(--border))', overflow: 'hidden', marginBottom: 5 }}>
                          <div style={{ width: pct + '%', height: '100%', borderRadius: 2, background: doneN === defs.length ? 'var(--ok)' : 'var(--primary)' }}></div>
                        </div>
                        <div style={{ fontSize: 10.5, color: blocked ? 'var(--amber-ink)' : overdueN ? 'var(--warn)' : 'var(--ink-4)' }}>{blocked ? `Blocked — waiting on ${depTrk ? depTrk.lab : dep.track}` : overdueN ? `${overdueN} milestone${overdueN === 1 ? '' : 's'} overdue` : doneN === defs.length ? 'All milestones complete' : nextIdx >= 0 ? `Next: ${defs[nextIdx]}` : '—'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <h6>Utility coordination — hand-off status</h6>
            <table className="sub-table">
              <thead><tr><th>Item</th><th>Agency</th><th>Ball in court</th><th>Last action</th><th>Waiting</th></tr></thead>
              <tbody>
                {cmItems.map((it, i) => {
                  const ball = cmBall(it);
                  const days = cmDays(ball.since);
                  const H = { utility: ['Utility', 'b-amber'], client: ['Client', 'b-blue'], msa: ['MSA', 'b-violet'], done: ['Complete', 'b-ok'] }[ball.holder];
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--ink)', textDecoration: it.closed ? 'line-through' : 'none' }}>{it.name}</td>
                      <td><span className="util-tag util-iid mono">{AGENCIES[it.agency]?.short || it.agency}</span></td>
                      <td><span className={`badge ${H[1]}`}><span className="badge-dot"></span>{H[0]}</span></td>
                      <td style={{ fontSize: 11.5 }}>{ball.step}{ball.since ? ` · ${fmtShort(ball.since)}` : ''}</td>
                      <td>{it.closed ? <span className="cell-muted">—</span> : <span className={`badge ${days >= 30 ? 'b-warn' : days >= 14 ? 'b-amber' : 'b-gray'}`}>{days}d</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'wsl' && <WslDetail p={p} wd={wd} canWrite={canWrite} onWslAction={onWslAction} />}
      </div>
    </div>
  );
}

function WslDetail({ p, wd, canWrite, onWslAction }) {
  if (!wd) {
    return (
      <div>
        <h6>Utility — Southern California Edison</h6>
        <div className="callout info">
          <Icon name="alert" size={16} />
          <div><b>No Will Serve Letter required.</b> SCE runs an electrical-analysis review instead. Current status: <b>{p.sce?.ear || 'Not started'}</b>{p.sce?.earDate ? ` (as of ${fmtShort(p.sce.earDate)})` : ''}. No 1-year expiry clock applies.</div>
        </div>
      </div>
    );
  }
  const total = wd.effectiveExpiry - wd.issued;
  const todayPos = Math.max(0, Math.min(100, ((TODAY - wd.issued) / total) * 100));
  const fill = wd.state === 'expired' || wd.state === 'critical' ? 'var(--warn)' : wd.state === 'warning' ? 'var(--amber)' : 'var(--ok)';
  const canExtend = !wd.extensionUsed && wd.state !== 'expired';
  return (
    <div>
      <h6>Will Serve Letter — IID</h6>
      <div className="wsl-strip">
        <div className="wsl-box">
          <div className="wb-lab">Status</div>
          <div className="wb-val" style={{ color: 'var(--ok)', fontFamily: 'inherit', fontSize: 15 }}>Sent</div>
          <div className="wb-sub">issued {fmtShort(wd.issued)}</div>
        </div>
        <div className="wsl-box">
          <div className="wb-lab">{wd.state === 'expired' ? 'Past expiry' : 'Days left'}</div>
          <div className="wb-val" style={{ color: fill }}>{wd.state === 'expired' ? `${Math.abs(wd.daysLeft)}d` : `${wd.daysLeft}d`}</div>
          <div className="wb-sub">expire{wd.state === 'expired' ? 'd' : 's'} {fmt(wd.effectiveExpiry)}</div>
        </div>
        <div className="wsl-box">
          <div className="wb-lab">Extension</div>
          <div className="wb-val" style={{ color: wd.extensionUsed ? 'var(--violet)' : 'var(--ink)' }}>{wd.extensionUsed ? 'Used' : 'Available'}</div>
          <div className="wb-sub">{wd.extensionUsed ? '6mo · no more' : '1× 6-month'}</div>
        </div>
      </div>
      <div className="wsl-bar">
        <div className="wsl-bar-fill" style={{ width: `${Math.min(todayPos, 100)}%`, background: fill, opacity: 0.4 }}></div>
        <div className="wsl-bar-today" style={{ left: `${todayPos}%` }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--ink-4)', fontFamily: 'Geist Mono, monospace' }}>
        <span>{fmtShort(wd.issued)}</span><span>{fmtShort(wd.effectiveExpiry)}</span>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        {wd.state === 'expired'
          ? <button className="btn btn-warn btn-sm" disabled={!canWrite} onClick={() => onWslAction(p.id, 'reapply')}><Icon name="refresh" size={12} />Reapply for new WSL</button>
          : canExtend
            ? <button className="btn btn-primary btn-sm" disabled={!canWrite} onClick={() => onWslAction(p.id, 'extend')}><Icon name="clock" size={12} />Request 6-month extension</button>
            : <button className="btn btn-sm" disabled><Icon name="check" size={12} />No extension available</button>}
        {!canWrite && <span className="readonly-note"><Icon name="lock" size={11} />Read-only role</span>}
      </div>
    </div>
  );
}

// ===== TRACKER PAGE =====
function TrackerPage({ projects, completed = [], canWrite, onAddClick, onWslAction, showToast, onOpenProject }) {
  const [search, setSearch] = React.useState('');
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [agencyFilter, setAgencyFilter] = React.useState([]); // agency ids
  const [expanded, setExpanded] = React.useState(null);
  const [sort, setSort] = React.useState({ key: null, dir: 1 }); // dir 1 asc, -1 desc
  const setSortKey = (key) => setSort(s => s.key === key ? (s.dir === 1 ? { key, dir: -1 } : { key: null, dir: 1 }) : { key, dir: 1 });
  const SORT_VAL = {
    project: p => p.name.toLowerCase(),
    client: p => p.client.toLowerCase(),
    location: p => (p.location.city + ' ' + p.location.street).toLowerCase(),
    contract: p => p.contractDate ? parseDate(p.contractDate).getTime() : Infinity,
    phase: p => PHASES.indexOf(p.phase),
    tasks: p => { const r = getResearchRows(p); return r.length ? r.filter(x => x.received).length / r.length : -1; },
    wsl: p => { const w = deriveWsl(p.wsl); return w ? (w.state === 'expired' ? -1 : w.daysLeft) : Infinity; },
  };

  // agencies present across projects, with counts
  const agencyCounts = React.useMemo(() => {
    const map = {};
    projects.forEach(p => p.agencies.forEach(a => { map[a] = (map[a] || 0) + 1; }));
    return Object.keys(map).sort((a, b) => map[b] - map[a]).map(id => ({ id, count: map[id], meta: AGENCIES[id] || { short: id, name: id } }));
  }, [projects]);
  const toggleAgency = (id) => setAgencyFilter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = React.useMemo(() => {
    let r = projects.slice();
    if (agencyFilter.length) r = r.filter(p => agencyFilter.every(a => p.agencies.includes(a)));
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || locString(p.location).toLowerCase().includes(q));
    }
    return r;
  }, [projects, search, agencyFilter]);

  const groups = React.useMemo(() => {
    let rows = filtered;
    if (sort.key) {
      const val = SORT_VAL[sort.key];
      rows = filtered.slice().sort((a, b) => {
        const va = val(a), vb = val(b);
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
      });
    }
    return [{ key: null, rows }];
  }, [filtered, sort]);

  const kpis = React.useMemo(() => {
    const wds = projects.map(p => deriveWsl(p.wsl)).filter(Boolean);
    return {
      total: projects.length,
      wslRisk: wds.filter(w => w.state !== 'active').length,
      tasksPending: projects.reduce((n, p) => n + getResearchRows(p).filter(r => !r.received).length, 0),
    };
  }, [projects]);

  const COLS = 7;
  return (
    <div>
      <div className="kpis">
        <div className="kpi"><div className="k-ic" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}><Icon name="tracker" size={16} /></div><div><div className="k-val">{kpis.total}</div><div className="k-lab">Projects</div></div></div>
        <div className="kpi"><div className="k-ic" style={{ background: 'var(--warn-tint)', color: 'var(--warn)' }}><Icon name="clock" size={16} /></div><div><div className="k-val">{kpis.wslRisk}</div><div className="k-lab">WSL needing attention</div></div></div>
        <div className="kpi"><div className="k-ic" style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}><Icon name="file" size={16} /></div><div><div className="k-val">{kpis.tasksPending}</div><div className="k-lab">Research letters outstanding</div></div></div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects, clients, addresses…" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', fontWeight: 700, marginRight: 2 }}>Agency</span>
          {agencyCounts.map(({ id, count, meta }) => (
            <button key={id} className="btn btn-sm" title={meta.name} onClick={() => toggleAgency(id)}
              style={agencyFilter.includes(id)
                ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white', height: 26, fontSize: 11, padding: '0 9px' }
                : { height: 26, fontSize: 11, padding: '0 9px' }}>
              <span className="mono">{meta.short}</span>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9.5, opacity: 0.7 }}>{count}</span>
            </button>
          ))}
          {agencyFilter.length > 0 && <button className="btn btn-ghost btn-sm" style={{ height: 26, fontSize: 11 }} onClick={() => setAgencyFilter([])}>Clear</button>}
        </div>
        <div className="toolbar-spacer"></div>
        {canWrite
          ? <button className="btn btn-primary" onClick={onAddClick}><Icon name="plus" />Add project</button>
          : <span className="readonly-note"><Icon name="lock" size={11} />Read-only — ask an admin for Editor access</span>}
      </div>

      <div className="grid-wrap">
        <div className="grid-scroll">
          <table className="grid">
            <thead>
              <tr>
                {[['project', 'Project', 'col-project'], ['client', 'Client'], ['location', 'Location'], ['contract', 'Contract'], ['phase', 'Phase'], ['tasks', 'Research'], ['wsl', 'WSL']].map(([key, lab, cls]) => (
                  <th key={key} className={cls || ''} onClick={() => setSortKey(key)}
                    style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {lab}
                      <span style={{ fontSize: 9, color: sort.key === key ? 'var(--primary)' : 'var(--ink-4)', opacity: sort.key === key ? 1 : 0.45 }}>
                        {sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '⇅'}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <React.Fragment key={g.key || 'all'}>
                  {g.key && (
                    <tr className="group-row">
                      <td colSpan={COLS}>
                        <div className="group-label">{g.key}<span className="group-count">{g.rows.length}</span></div>
                      </td>
                    </tr>
                  )}
                  {g.rows.map(p => (
                    <React.Fragment key={p.id}>
                      <tr className={`row-main ${expanded === p.id ? 'expanded' : ''}`} onClick={() => onOpenProject(p.id)}>
                        <td className="col-project">
                          <div className="proj-cell">
                            <span className="proj-expand"><Icon name="chev" size={13} /></span>
                            <div className="proj-info">
                              <div className="proj-name">{p.name}{p.userAdded ? ' ·' : ''} {p.userAdded && <span className="badge b-teal" style={{ fontSize: 9, padding: '0 6px' }}>new</span>}</div>
                              <div className="proj-code">{p.code} · {p.utility}</div>
                            </div>
                          </div>
                        </td>
                        <td>{p.client}</td>
                        <td style={{ fontSize: 12 }}>{p.location.city}, {p.location.state} <span className="cell-muted mono" style={{ fontSize: 10.5 }}>{p.location.zip}</span></td>
                        <td className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{p.contractDate ? fmtShort(p.contractDate) : <span className="cell-muted">—</span>}</td>
                        <td><PhaseBadge phase={p.phase} /></td>
                        <td>{(() => { const r = getResearchRows(p); if (!r.length) return <span className="cell-muted">—</span>; const got = r.filter(x => x.received).length; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className={`badge ${got === r.length ? 'b-ok' : 'b-amber'}`} style={{ fontSize: 10 }}><span className="badge-dot"></span>{got}/{r.length}</span><span className="cell-muted" style={{ fontSize: 10.5 }}>received</span></span>; })()}</td>
                        <td><WslChip wd={deriveWsl(p.wsl)} /></td>
                      </tr>
                      {expanded === p.id && (
                        <tr className="detail-row">
                          <td colSpan={COLS}>
                            <DetailPanel p={p} canWrite={canWrite} onWslAction={onWslAction} showToast={showToast} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
              {filtered.length === 0 && <tr><td colSpan={COLS}><div className="empty"><h3>No projects match</h3><p>Try a different search.</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {completed.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCompleted(s => !s)} style={{ color: 'var(--ink-3)' }}>
            {showCompleted ? '▾' : '▸'} Completed projects ({completed.length})
          </button>
          {showCompleted && (
            <div className="grid-wrap" style={{ marginTop: 8, opacity: 0.85 }}>
              <table className="grid">
                <thead><tr><th className="col-project">Project</th><th>Client</th><th>Location</th><th>Completed</th><th style={{ textAlign: 'right' }}>Status</th></tr></thead>
                <tbody>
                  {completed.map(p => (
                    <tr key={p.id} className="row-main" onClick={() => onOpenProject(p.id)}>
                      <td className="col-project"><div className="proj-name">{p.name}</div><div className="proj-code">{p.code}</div></td>
                      <td>{p.client}</td>
                      <td style={{ fontSize: 12 }}>{p.location.city}, {p.location.state}</td>
                      <td className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.completedOn ? fmt(p.completedOn) : '—'}</td>
                      <td style={{ textAlign: 'right' }}><span className="badge b-ok"><span className="badge-dot"></span>Complete</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== WSL EMAIL ALERTS =====
const ALERTS_KEY = 'msa_app_wsl_alerts_v1';
const DEFAULT_ALERTS = { enabled: true, thresholds: [60, 30, 14, 7], recipients: ['mschreiber@msaconsultinginc.com'], includeExpired: true };
function loadAlerts() { try { return { ...DEFAULT_ALERTS, ...(JSON.parse(localStorage.getItem(ALERTS_KEY)) || {}) }; } catch (e) { return DEFAULT_ALERTS; } }
function persistAlerts(a) { try { localStorage.setItem(ALERTS_KEY, JSON.stringify(a)); } catch (e) {} }
const THRESHOLD_OPTIONS = [90, 60, 30, 14, 7];

function EmailAlertsPanel({ rows, canWrite, showToast }) {
  const [cfg, setCfg] = React.useState(loadAlerts);
  const [newEmail, setNewEmail] = React.useState('');
  const [preview, setPreview] = React.useState(null); // { p, wd, threshold }
  const save = (next) => { setCfg(next); persistAlerts(next); };
  const toggleThreshold = (t) => {
    if (!canWrite) return;
    const ts = cfg.thresholds.includes(t) ? cfg.thresholds.filter(x => x !== t) : [...cfg.thresholds, t].sort((a, b) => b - a);
    save({ ...cfg, thresholds: ts });
  };
  const addRecipient = () => {
    const em = newEmail.trim();
    if (!em || !/^\S+@\S+\.\S+$/.test(em)) { showToast('Enter a valid email'); return; }
    if (cfg.recipients.includes(em)) { showToast('Already a recipient'); return; }
    save({ ...cfg, recipients: [...cfg.recipients, em] });
    setNewEmail('');
  };
  const removeRecipient = (em) => save({ ...cfg, recipients: cfg.recipients.filter(x => x !== em) });

  // upcoming alerts: for each letter, next threshold it will cross
  const schedule = React.useMemo(() => {
    if (!cfg.enabled) return [];
    const out = [];
    rows.forEach(({ p, wd }) => {
      if (wd.state === 'expired') {
        if (cfg.includeExpired) out.push({ p, wd, threshold: 'expired', when: 'daily until resolved', days: null });
        return;
      }
      const upcoming = cfg.thresholds.filter(t => wd.daysLeft > t).sort((a, b) => b - a)[0];
      const active = cfg.thresholds.filter(t => wd.daysLeft <= t).sort((a, b) => a - b)[0];
      if (active !== undefined) {
        out.push({ p, wd, threshold: active, when: 'triggered — in current digest', days: wd.daysLeft, active: true });
      } else if (upcoming !== undefined) {
        const d = new Date(wd.effectiveExpiry); d.setDate(d.getDate() - upcoming);
        out.push({ p, wd, threshold: upcoming, when: `sends ${fmtShort(d)}, ${d.getFullYear()}`, days: upcoming });
      }
    });
    return out.sort((a, b) => (a.wd.daysLeft ?? -1) - (b.wd.daysLeft ?? -1));
  }, [rows, cfg]);

  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      <div className="panel-hd">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="alert" size={14} />Email alerts — WSL deadlines</h2>
        <div className={`toggle-pill ${cfg.enabled ? 'on' : ''}`} style={{ height: 28, fontSize: 12, opacity: canWrite ? 1 : 0.6, pointerEvents: canWrite ? 'auto' : 'none' }} onClick={() => save({ ...cfg, enabled: !cfg.enabled })}>
          <span className="sw"></span>{cfg.enabled ? 'On' : 'Off'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0 }}>
        {/* settings */}
        <div style={{ padding: 16, borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', fontWeight: 700, marginBottom: 8 }}>Send when days-to-expiry hits</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {THRESHOLD_OPTIONS.map(t => (
              <button key={t} className="btn btn-sm" disabled={!canWrite} onClick={() => toggleThreshold(t)}
                style={cfg.thresholds.includes(t) ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' } : null}>{t}d</button>
            ))}
            <button className="btn btn-sm" disabled={!canWrite} onClick={() => save({ ...cfg, includeExpired: !cfg.includeExpired })}
              style={cfg.includeExpired ? { background: 'var(--warn)', borderColor: 'var(--warn)', color: 'white' } : null}>expired</button>
          </div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', fontWeight: 700, margin: '14px 0 8px' }}>Recipients</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cfg.recipients.map(em => (
              <div key={em} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="mono">{em}</span>
                {canWrite && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warn)', height: 22, padding: '0 6px' }} onClick={() => removeRecipient(em)}><Icon name="x" size={10} /></button>}
              </div>
            ))}
          </div>
          {canWrite && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input className="input" style={{ height: 30, fontSize: 12 }} value={newEmail} onChange={e => setNewEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addRecipient(); }} placeholder="add@msaconsultinginc.com" />
              <button className="btn btn-sm" onClick={addRecipient}><Icon name="plus" size={12} /></button>
            </div>
          )}
        </div>
        {/* schedule */}
        <div style={{ padding: '10px 16px 14px' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', fontWeight: 700, margin: '6px 0 8px' }}>Upcoming notifications · {schedule.length}</div>
          {!cfg.enabled && <div style={{ fontSize: 12.5, color: 'var(--ink-4)', padding: '10px 0' }}>Alerts are off — no emails will be sent.</div>}
          {cfg.enabled && schedule.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-4)', padding: '10px 0' }}>No letters within the configured thresholds.</div>}
          {cfg.enabled && schedule.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)', fontSize: 12.5 }}>
              <span className={`badge ${s.threshold === 'expired' ? 'b-warn' : s.active ? 'b-amber' : 'b-gray'}`}>
                <span className="badge-dot"></span>{s.threshold === 'expired' ? 'expired' : `${s.threshold}d alert`}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.p.name}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>{s.when}</span>
              <span style={{ marginLeft: 'auto' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreview(s)}>Preview email</button>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* email preview modal */}
      <div className={`modal-backdrop ${preview ? 'open' : ''}`} onClick={backdropClose(() => setPreview(null))}>
        {preview && (
          <div className="modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-hd">
              <div>
                <h3>Email preview</h3>
                <div className="m-sub">What recipients receive when this alert fires</div>
              </div>
              <button className="modal-close" onClick={() => setPreview(null)}><Icon name="x" /></button>
            </div>
            <div className="modal-body">
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 12 }}>
                  <div><span style={{ color: 'var(--ink-3)' }}>From:</span> alerts@msaconsultinginc.com</div>
                  <div><span style={{ color: 'var(--ink-3)' }}>To:</span> {cfg.recipients.join(', ')}</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>
                    {preview.threshold === 'expired'
                      ? `⚠️ WSL EXPIRED — ${preview.p.name} (${preview.p.code})`
                      : `WSL expires in ${preview.wd.daysLeft} days — ${preview.p.name} (${preview.p.code})`}
                  </div>
                </div>
                <div style={{ padding: 16, fontSize: 13, lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 10px' }}>The Will Serve Letter for <b>{preview.p.name}</b> ({preview.p.code} · {preview.p.client}) {preview.threshold === 'expired' ? <>has <b style={{ color: 'var(--warn)' }}>expired</b> as of {fmt(preview.wd.effectiveExpiry)}.</> : <>expires on <b>{fmt(preview.wd.effectiveExpiry)}</b> — <b style={{ color: preview.wd.daysLeft <= 30 ? 'var(--warn)' : 'var(--amber)' }}>{preview.wd.daysLeft} days from today</b>.</>}</p>
                  <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
                    <li>Issued: {fmt(preview.wd.issued)}</li>
                    <li>Extension: {preview.wd.extensionUsed ? 'already used — none remain' : 'one 6-month extension still available'}</li>
                    <li>Location: {preview.p.location.city}, {preview.p.location.state}</li>
                  </ul>
                  <p style={{ margin: 0 }}>{preview.threshold === 'expired' ? 'Re-application with IID is required (~18-month process). Open the project to start.' : preview.wd.extensionUsed ? 'No extensions remain — the project must complete before expiry.' : 'Consider filing the 6-month extension if construction will not finish in time.'}</p>
                  <div style={{ marginTop: 14 }}><span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>Open in MSA Dry Utility</span></div>
                </div>
              </div>
            </div>
            <div className="modal-ft" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setPreview(null)}>Close</button>
              <button className="btn btn-primary" disabled={!canWrite} onClick={() => { setPreview(null); showToast(`Test email sent to ${cfg.recipients.length} recipient${cfg.recipients.length > 1 ? 's' : ''}`); }}>Send test email</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== WSL PAGE =====
function WslPage({ projects, canWrite, onWslAction, onOpenProject, showToast }) {
  const rows = projects.map(p => ({ p, wd: deriveWsl(p.wsl) })).filter(x => x.wd).sort((a, b) => a.wd.daysLeft - b.wd.daysLeft);
  // capacity studies run independently of the WSL clock — outstanding ones first
  const capRows = projects
    .map(p => ({ p, cs: deriveCapacityStudy(p.capacityStudy), wd: deriveWsl(p.wsl) }))
    .filter(x => x.cs)
    .sort((a, b) => (a.cs.state === 'received' ? 1 : 0) - (b.cs.state === 'received' ? 1 : 0) || b.cs.daysOut - a.cs.daysOut);
  const sceRows = projects.filter(p => !p.wsl && p.utility === 'SCE');
  return (
    <div>
      <EmailAlertsPanel rows={rows} canWrite={canWrite} showToast={showToast} />
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-hd"><h2>IID Will Serve Letters</h2><span className="meta">{rows.length} · sorted by urgency</span></div>
        <div className="grid-scroll">
          <table className="grid">
            <thead><tr><th>Project</th><th>Client</th><th>City</th><th>Issued</th><th>Expires</th><th>Extension</th><th style={{ textAlign: 'right' }}>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map(({ p, wd }) => {
                const canExtend = !wd.extensionUsed && wd.state !== 'expired';
                return (
                  <tr key={p.id} className="row-main" onClick={() => onOpenProject(p.id)}>
                    <td><div className="proj-name">{p.name}</div><div className="proj-code">{p.code}</div></td>
                    <td>{p.client}</td>
                    <td style={{ fontSize: 12 }}>{p.location.city}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmtShort(wd.issued)}, {parseDate(wd.issued).getFullYear()}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmtShort(wd.effectiveExpiry)}, {parseDate(wd.effectiveExpiry).getFullYear()}</td>
                    <td>{wd.extensionUsed ? <span className="badge b-violet"><span className="badge-dot"></span>used</span> : <span className="badge b-gray">available</span>}</td>
                    <td style={{ textAlign: 'right' }}><WslChip wd={wd} /></td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      {wd.state === 'expired'
                        ? <button className="btn btn-sm btn-warn" disabled={!canWrite} onClick={() => onWslAction(p.id, 'reapply')}><Icon name="refresh" size={12} />Reapply</button>
                        : canExtend && wd.state !== 'active'
                          ? <button className="btn btn-sm" disabled={!canWrite} onClick={() => onWslAction(p.id, 'extend')}><Icon name="clock" size={12} />Extend</button>
                          : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {capRows.length > 0 && (
        <div className="panel">
          <div className="panel-hd">
            <h2>IID Capacity Studies <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-4)' }}>— viability, {CAPACITY_STUDY_WEEKS}-week turnaround</span></h2>
            <span className="meta">{capRows.length} · does not authorise coordination</span>
          </div>
          <div className="grid-scroll">
            <table className="grid">
              <thead><tr><th>Project</th><th>Client</th><th>Submitted</th><th>Expected</th><th>Finding</th><th style={{ textAlign: 'right' }}>Status</th><th>Will Serve</th></tr></thead>
              <tbody>
                {capRows.map(({ p, cs, wd }) => (
                  <tr key={p.id} className="row-main" onClick={() => onOpenProject(p.id)}>
                    <td><div className="proj-name">{p.name}</div><div className="proj-code">{p.code}</div></td>
                    <td>{p.client}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmtShort(cs.submitted)}</td>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{cs.state === 'received' ? '—' : fmtShort(cs.expected)}</td>
                    <td>{cs.outcome
                      ? <span className={`badge ${cs.outcome === 'capacity' ? 'b-ok' : cs.outcome === 'upgrades' ? 'b-warn' : 'b-amber'}`}><span className="badge-dot"></span>{cs.outcome === 'capacity' ? 'Capacity available' : cs.outcome === 'upgrades' ? 'Upgrades required' : 'Constrained'}</span>
                      : <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>—</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      {cs.state === 'received'
                        ? <span className="badge b-blue"><span className="badge-dot"></span>Results {fmtShort(cs.received)}</span>
                        : <span className={`badge ${cs.state === 'overdue' ? 'b-warn' : 'b-amber'}`}><span className="badge-dot"></span>{cs.state === 'overdue' ? `Overdue ${cs.daysOverdue}d` : `Week ${cs.weeksOut}/${cs.turnaroundWeeks}`}</span>}
                    </td>
                    <td>{wd ? <span className="badge b-ok"><span className="badge-dot"></span>Sent</span> : <span className="badge b-gray">not requested</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="panel">
        <div className="panel-hd"><h2>SCE projects — electrical analysis review</h2><span className="meta">{sceRows.length} · no WSL clock</span></div>
        <div className="grid-scroll">
          <table className="grid">
            <thead><tr><th>Project</th><th>Client</th><th>City</th><th>Review status</th><th>As of</th></tr></thead>
            <tbody>
              {sceRows.map(p => (
                <tr key={p.id} className="row-main" onClick={() => onOpenProject(p.id)}>
                  <td><div className="proj-name">{p.name}</div><div className="proj-code">{p.code}</div></td>
                  <td>{p.client}</td>
                  <td style={{ fontSize: 12 }}>{p.location.city}</td>
                  <td><span className={`badge ${p.sce?.ear === 'Approved' ? 'b-ok' : 'b-amber'}`}><span className="badge-dot"></span>{p.sce?.ear || 'Not started'}</span></td>
                  <td className="mono" style={{ fontSize: 12 }}>{p.sce?.earDate ? fmtShort(p.sce.earDate) : '—'}</td>
                </tr>
              ))}
              {sceRows.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--ink-4)', padding: 14 }}>No SCE projects.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===== REPORTS PAGE =====
function ReportsPage({ projects, canWrite, showToast, initialCode }) {
  const [code, setCode] = React.useState(initialCode || projects[0]?.code || '');
  React.useEffect(() => { if (initialCode) setCode(initialCode); }, [initialCode]);
  const project = projects.find(p => p.code === code) || projects[0];
  if (!project) return <div className="empty"><h3>No projects yet</h3></div>;
  const wd = deriveWsl(project.wsl);
  const cadence = project.reporting.cadence;
  const periodDays = cadence === 'Weekly' ? 7 : 14;
  const periodStart = new Date(TODAY); periodStart.setDate(periodStart.getDate() - periodDays + 1);
  const inPeriod = (d) => d && parseDate(d) >= periodStart && parseDate(d) <= TODAY;
  const changedTasks = project.tasks.filter(t => t.user && inPeriod(t.date));
  const changes = [];
  changedTasks.forEach(t => changes.push(`${t.name}: ${SUB_META[t.status].label}`));
  const rptResearch = getResearchRows(project);
  rptResearch.forEach(r => { if (inPeriod(r.received)) changes.push(`Utility research received — ${r.label}`); else if (inPeriod(r.sent)) changes.push(`Research letter sent — ${r.label}`); });
  const cmItemsRpt = ((typeof cmLoad === 'function' ? cmLoad() : {})[project.id]?.items) || [];
  const eubStRpt = (typeof eubLoad === 'function' ? eubLoad() : {})[project.id] || null;
  const hasEubSec = !!(eubStRpt || project.tasks.some(t => /existing utility base/i.test(t.name)));
  const cmNum = hasEubSec ? '04' : '03';
  const nextNum = String(3 + (hasEubSec ? 1 : 0) + (cmItemsRpt.length ? 1 : 0)).padStart(2, '0');
  cmItemsRpt.forEach(it => {
    (it.log || []).forEach(e => { if (inPeriod(e.date)) { const st = { r: 'Received from utility', s: 'Sent to client', b: 'Back from client', f: 'Forwarded to utility' }[e.col]; changes.push(`${it.name} — ${st}`); } });
    if (inPeriod(it.closed)) changes.push(`${it.name} — hand-off closed out`);
  });
  if (wd && wd.state !== 'active') changes.push(wd.state === 'expired' ? 'Will Serve Letter expired — re-application required' : `Will Serve Letter — ${wd.daysLeft} days to expiry`);
  const ddActive = project.dd.filter(d => d.status !== 'na');
  const ddDone = ddActive.filter(d => d.status === 'done').length;

  const steps = [];
  const resWaiting = rptResearch.filter(r => !r.received);
  if (resWaiting.length) steps.push({ t: `Follow up on ${resWaiting.length} outstanding research ${resWaiting.length === 1 ? 'letter' : 'letters'} (${resWaiting.slice(0, 3).map(r => AGENCIES[r.agency]?.short || r.label).join(', ')}${resWaiting.length > 3 ? '…' : ''}).`, o: `Oldest has waited ${Math.max(...resWaiting.map(r => daysBetween(r.sent, TODAY)))} days.` });
  const cmStale = cmItemsRpt.filter(it => !it.closed).map(it => ({ it, ball: cmBall(it), days: cmDays(cmBall(it).since) })).filter(x => x.days >= 14).sort((a, b) => b.days - a.days);
  if (cmStale.length) steps.push({ t: `Nudge ${cmStale.length} stale coordination hand-off${cmStale.length === 1 ? '' : 's'} — starting with ${cmStale[0].it.name} (${AGENCIES[cmStale[0].it.agency]?.short || ''}).`, o: `With ${({ utility: 'the utility', client: 'the client', msa: 'MSA' })[cmStale[0].ball.holder]} for ${cmStale[0].days} days.` });
  if (wd && wd.state !== 'active' && wd.state !== 'expired') steps.push({ t: `Stay ahead of the WSL expiry (${fmt(wd.effectiveExpiry)}).`, o: `${wd.daysLeft} days remaining${wd.extensionUsed ? ' — no extension left.' : '; one 6-month extension available.'}` });
  if (wd && wd.state === 'expired') steps.push({ t: 'File new Will Serve Letter application with IID.', o: 'Re-application is an ~18-month process.' });
  const openDD = project.dd.find(d => d.status === 'prog') || project.dd.find(d => d.status === 'todo');
  if (openDD) steps.push({ t: `Complete ${openDD.name} for the due-diligence package.`, o: `Currently ${DD_META[openDD.status].label}.` });
  if (steps.length === 0) steps.push({ t: `Maintain ${cadence.toLowerCase()} client coordination.`, o: 'Standing item.' });

  return (
    <div>
      <div className="toolbar">
        <select className="select" style={{ width: 320 }} value={code} onChange={e => setCode(e.target.value)}>
          {projects.map(p => <option key={p.code} value={p.code}>{p.name} · {p.client}</option>)}
        </select>
        <span className="badge b-blue"><span className="badge-dot"></span>{cadence}</span>
        <div className="toolbar-spacer"></div>
        <button className="btn btn-primary" disabled={!canWrite} onClick={() => { window.print(); }}><Icon name="print" size={14} />Print / Save PDF</button>
        {!canWrite && <span className="readonly-note"><Icon name="lock" size={11} />Read-only role</span>}
      </div>

      <div className="report-stage">
        <div className="sheet">
          <div className="lh">
            <div className="lh-brand">
              <div className="lh-mark">M</div>
              <div><div className="lh-name">MSA Consulting</div><div className="lh-tag">Civil Engineering · Dry Utility Division</div></div>
            </div>
            <div className="lh-right">
              <div className="lh-doc">{cadence} Project Update</div>
              <div className="lh-period">{fmtShort(periodStart)} – {fmtShort(TODAY)}</div>
              <div className="lh-dates">{TODAY.getFullYear()}</div>
            </div>
          </div>
          <div className="tb-project">{project.name}</div>
          <div className="tb-meta">
            <div className="m"><div className="l">Client</div><div className="v">{project.client}</div></div>
            <div className="m"><div className="l">Project No.</div><div className="v mono">{project.code}</div></div>
            <div className="m"><div className="l">Location</div><div className="v">{locString(project.location)}</div></div>
            <div className="m"><div className="l">Phase</div><div className="v">{project.phase}</div></div>
          </div>

          {changes.length > 0 && (
            <div className="changes-box">
              <div className="changes-hd"><Icon name="bolt" size={14} />Changes Since Last Report · {changes.length}</div>
              <ul className="changes-list">{changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}

          <div className="section">
            <div className="section-hd"><h2>{wd ? 'Will Serve Letter' : 'SCE Electrical Review'}</h2><span className="num">01</span></div>
            {wd ? (
              <div className="wsl-strip">
                <div className="wsl-box"><div className="wb-lab">Days to expiry</div><div className="wb-val" style={{ color: wd.daysLeft <= 60 ? 'var(--warn)' : 'var(--ink)' }}>{wd.state === 'expired' ? 'Expired' : wd.daysLeft}</div><div className="wb-sub">{fmt(wd.effectiveExpiry)}</div></div>
                <div className="wsl-box"><div className="wb-lab">Issued</div><div className="wb-val">{fmtShort(wd.issued)}</div><div className="wb-sub">{parseDate(wd.issued).getFullYear()}</div></div>
                <div className="wsl-box"><div className="wb-lab">Extension</div><div className="wb-val">{wd.extensionUsed ? 'Used' : 'Available'}</div><div className="wb-sub">{wd.extensionUsed ? 'no further' : '1× 6-month'}</div></div>
              </div>
            ) : (
              <div className="wsl-strip">
                <div className="wsl-box"><div className="wb-lab">Review status</div><div className="wb-val" style={{ fontSize: 15 }}>{project.sce?.ear || 'Not started'}</div><div className="wb-sub">{project.sce?.earDate ? `as of ${fmtShort(project.sce.earDate)}` : ''}</div></div>
                <div className="wsl-box"><div className="wb-lab">Process</div><div className="wb-val" style={{ fontSize: 15, fontFamily: 'inherit' }}>Electrical analysis</div><div className="wb-sub">no WSL required</div></div>
              </div>
            )}
          </div>

          <div className="section">
            <div className="section-hd"><h2>Utility Research</h2><span className="num">02</span></div>
            {(() => {
              const recOv = (() => { try { return JSON.parse(localStorage.getItem('msa_app_research_v1')) || {}; } catch (e) { return {}; } })();
              const added = typeof loadAddedResearch === 'function' ? (loadAddedResearch()[project.id] || []) : [];
              const rows = [...(project.research || []), ...added].map(r => {
                const o = recOv[project.id] || {};
                return Object.prototype.hasOwnProperty.call(o, r.id) ? { ...r, received: o[r.id] } : r;
              });
              if (!rows.length) return <div style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>No research letters sent for this project.</div>;
              const got = rows.filter(r => r.received).length;
              const waiting = rows.length - got;
              return (
                <>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 8 }}>{got} of {rows.length} agency responses received.{waiting > 0 ? ` ${waiting} outstanding letter${waiting === 1 ? '' : 's'} — followed up by Domonique Moreno, Project Manager.` : ' Research phase complete — Existing Utility Plan preparation with Michael Schreiber, Dry Utility Manager.'}</div>
                  <table className="rp-table">
                    <thead><tr><th>Utility</th><th>Letter sent</th><th>Status</th><th style={{ textAlign: 'right' }}>Received</th></tr></thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.label}</td>
                          <td className="mono">{fmtShort(r.sent)}</td>
                          <td><span className={`badge ${r.received ? 'b-ok' : daysBetween(r.sent, TODAY) > 45 ? 'b-warn' : 'b-amber'}`}><span className="badge-dot"></span>{r.received ? 'Received' : `Awaiting response · ${daysBetween(r.sent, TODAY)}d`}</span></td>
                          <td style={{ textAlign: 'right' }} className="mono">{r.received ? fmtShort(r.received) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              );
            })()}
          </div>

          {hasEubSec && (() => {
            const st = eubStRpt || { stage: 0, plots: {} };
            let jur = {}; try { jur = (JSON.parse(localStorage.getItem('msa_app_jurisdiction_v1')) || {})[project.id] || {}; } catch (e) {}
            const rows = getResearchRows(project).filter(r => jur[r.id] !== 'none');
            const plotted = rows.filter(r => (st.plots || {})[r.id] === 'done').length;
            return (
              <div className="section">
                <div className="section-hd"><h2>Existing Utility Plan</h2><span className="num">03</span></div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 8 }}>
                  Deliverable stage: <b>{EUB_STAGES[st.stage]}</b>{st.stage === 3 && st.issued ? ` (${fmtShort(st.issued)})` : ''} · {plotted} of {rows.length} responding utilities plotted onto the base map. Prepared by Michael Schreiber, Dry Utility Manager.
                </div>
              </div>
            );
          })()}

          {(() => {
            const cm = (typeof cmLoad === 'function' ? cmLoad() : {})[project.id];
            const cmItems = (cm && cm.items) || [];
            if (!cmItems.length) return null;
            const open = cmItems.filter(i => !i.closed);
            return (
              <div className="section">
                <div className="section-hd"><h2>Utility Coordination</h2><span className="num">{cmNum}</span></div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 8 }}>{open.length} open hand-off{open.length === 1 ? '' : 's'} · {cmItems.length - open.length} complete.</div>
                <table className="rp-table">
                  <thead><tr><th>Item</th><th>Agency</th><th>Ball in court</th><th>Last action</th><th style={{ textAlign: 'right' }}>Waiting</th></tr></thead>
                  <tbody>
                    {cmItems.map((it, i) => {
                      const ball = cmBall(it);
                      const days = cmDays(ball.since);
                      const H = { utility: ['Utility', 'b-amber'], client: ['Client', 'b-blue'], msa: ['MSA', 'b-violet'], done: ['Complete', 'b-ok'] }[ball.holder];
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: it.closed ? 'line-through' : 'none' }}>{it.name}</td>
                          <td>{AGENCIES[it.agency]?.short || it.agency}</td>
                          <td><span className={`badge ${H[1]}`}><span className="badge-dot"></span>{H[0]}</span></td>
                          <td style={{ fontSize: 12 }}>{ball.step}{ball.since ? ` · ${fmtShort(ball.since)}` : ''}</td>
                          <td style={{ textAlign: 'right' }} className="mono">{it.closed ? '—' : `${days}d`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          <div className="section">
            <div className="section-hd"><h2>Next Steps</h2><span className="num">{nextNum}</span></div>
            <div className="steps">
              {steps.slice(0, 4).map((s, i) => (
                <div className="step" key={i}><div className="step-n">{i + 1}</div><div className="step-body">{s.t}<div className="so">{s.o}</div></div></div>
              ))}
            </div>
          </div>

          <div className="foot">
            <div className="foot-note">
              Standardized {cadence.toLowerCase()} update. Highlighted items reflect changes since the prior report. Current as of {fmt(TODAY)}.
              <div style={{ marginTop: 4 }}>Prepared by MSA Consulting Dry Utility Division</div>
            </div>
            <div className="foot-page">{project.code}<br />Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SHELL =====
const PAGES = [
  { id: 'dash', label: 'Dashboard', icon: 'dash' },
  { id: 'tracker', label: 'Projects', icon: 'tracker' },
  { id: 'research', label: 'Utility Research', icon: 'file' },
  { id: 'coord', label: 'Utility Coordination', icon: 'team' },
  { id: 'team', label: 'Team', icon: 'team' },
  { id: 'wsl', label: 'Will Serve', icon: 'wsl' },
  { id: 'reports', label: 'Client Reports', icon: 'report' },
];

// ===== NOTIFICATION BELL =====
const READ_KEY = 'msa_app_notif_read_v1';
function loadRead() { try { return JSON.parse(localStorage.getItem(READ_KEY)) || []; } catch (e) { return []; } }
function persistRead(ids) { try { localStorage.setItem(READ_KEY, JSON.stringify(ids)); } catch (e) {} }

function buildNotifications(projects) {
  const out = [];
  projects.forEach(p => {
    const wd = deriveWsl(p.wsl);
    if (wd) {
      if (wd.state === 'expired') out.push({ id: `wsl-exp-${p.id}`, pid: p.id, sev: 'crit', icon: 'clock', title: `WSL expired — ${p.name}`, sub: `Sent ${fmtShort(wd.issued)} · lapsed ${fmtShort(wd.effectiveExpiry)} · re-application required`, ts: wd.effectiveExpiry });
      else if (wd.state === 'critical') out.push({ id: `wsl-crit-${p.id}`, pid: p.id, sev: 'crit', icon: 'clock', title: `WSL expires in ${wd.daysLeft} days — ${p.name}`, sub: wd.extensionUsed ? 'No extensions remain' : 'Extension still available', ts: TODAY });
      else if (wd.state === 'warning') out.push({ id: `wsl-warn-${p.id}`, pid: p.id, sev: 'warn', icon: 'clock', title: `WSL expires in ${wd.daysLeft} days — ${p.name}`, sub: `Expiry ${fmtShort(wd.effectiveExpiry)}`, ts: TODAY });
      // (capacity-study alerts are handled below — they apply with or without a WSL)
      // Filing the one 6-month extension is time-critical and easy to miss, so it
      // gets its own escalating alert on top of the expiry countdown above.
      if (wd.needsExtension) {
        out.push({
          id: `wsl-ext-${p.id}`, pid: p.id,
          sev: wd.state === 'expired' || wd.state === 'critical' ? 'crit' : 'warn',
          icon: 'clock',
          title: wd.state === 'expired'
            ? `Extension window closing — ${p.name}`
            : `File the 6-month WSL extension — ${p.name}`,
          sub: wd.state === 'expired'
            ? `WSL lapsed ${fmtShort(wd.effectiveExpiry)} — the unused 6-month extension is the fastest route back`
            : `${wd.daysLeft}d left · extends expiry to ${fmtShort(addMonths(wd.effectiveExpiry, 6))}`,
          ts: TODAY,
        });
      }
    }
    p.tasks.forEach(t => {
      if (t.due && t.status !== 'ok' && daysBetween(t.due, TODAY) > 0) out.push({ id: `due-${p.id}-${t._key || t.taskId}`, pid: p.id, sev: 'warn', icon: 'clock', title: `Task overdue — ${t.name}`, sub: `${p.name} · due ${fmtShort(t.due)} · ${daysBetween(t.due, TODAY)}d late`, ts: t.due });
    });
    // Capacity study still out past its typical turnaround — chase IID.
    const cs = deriveCapacityStudy(p.capacityStudy);
    if (cs && cs.state === 'overdue') {
      out.push({
        id: `cap-late-${p.id}`, pid: p.id,
        sev: cs.daysOverdue >= 14 ? 'crit' : 'warn', icon: 'clock',
        title: `Capacity study overdue — ${p.name}`,
        sub: `Submitted ${fmtShort(cs.submitted)} · ${cs.turnaroundWeeks}-week turnaround passed ${cs.daysOverdue}d ago`,
        ts: cs.expected,
      });
    }
    const due = p.reporting.lastSent && daysBetween(p.reporting.lastSent, TODAY) >= (p.reporting.cadence === 'Weekly' ? 7 : 14);
    if (due) out.push({ id: `rpt-${p.id}`, pid: p.id, sev: 'info', icon: 'report', title: `${p.reporting.cadence} report due — ${p.name}`, sub: `Last sent ${fmtShort(p.reporting.lastSent)}`, ts: TODAY });
    // stale utility research letters: sent, nothing received, no recent follow-up (30d threshold)
    {
      const recOv = (() => { try { return JSON.parse(localStorage.getItem('msa_app_research_v1')) || {}; } catch (e) { return {}; } })();
      const added = typeof loadAddedResearch === 'function' ? (loadAddedResearch()[p.id] || []) : [];
      const fu = typeof loadResearchFu === 'function' ? (loadResearchFu()[p.id] || {}) : {};
      const rows = [...(p.research || []), ...added].map(r => {
        const o = recOv[p.id] || {};
        return Object.prototype.hasOwnProperty.call(o, r.id) ? { ...r, received: o[r.id] } : r;
      });
      const stale = rows.filter(r => !r.received && daysBetween(fu[r.id] || r.sent, TODAY) >= 30)
        .sort((a, b) => daysBetween(b.sent, TODAY) - daysBetween(a.sent, TODAY));
      stale.slice(0, 3).forEach(r => {
        const silent = daysBetween(fu[r.id] || r.sent, TODAY);
        out.push({ id: `res-${p.id}-${r.id}-${fu[r.id] || r.sent}`, pid: p.id, sev: silent >= 45 ? 'warn' : 'info', icon: 'file', title: `Research follow-up — ${r.label}`, sub: `${p.name} · sent ${fmtShort(r.sent)} · ${silent}d silent${fu[r.id] ? ' · followed up ' + fmtShort(fu[r.id]) : ''}`, ts: r.sent });
      });
      if (stale.length > 3) out.push({ id: `res-more-${p.id}`, pid: p.id, sev: 'info', icon: 'file', title: `${stale.length - 3} more research letters need follow-up`, sub: p.name, ts: TODAY });
    }
    // utility coordination: open hand-offs waiting on someone (worst 3 per project)
    if (typeof hasCoordination === 'function' && hasCoordination(p)) {
      const ids = new Set(coordTracksFor(p).map(t => t.id));
      const holderLabel = { utility: 'waiting on utility', client: 'waiting on client', msa: "in MSA's court" };
      const allNudges = loadNudges()[p.id] || {};
      openItems().filter(it => ids.has(it.track.id)).slice(0, 3).forEach(it => {
        const gk = groupKey(it.track.id, it.woName === it.group.name ? null : it.woName, it.group.name);
        const ns = nudgeState(it.ball, it.days, allNudges[gk]);
        out.push({
          id: `coord-${p.id}-${it.track.id}-${(it.group.name || '').replace(/\W+/g, '')}`,
          pid: p.id,
          sev: ns.due ? 'warn' : it.ball.holder === 'msa' ? 'warn' : 'info',
          icon: 'clip',
          title: `${ns.due ? 'Nudge due — ' : ''}${it.group.name}${it.woName ? ' · ' + it.woName : ''}`,
          sub: `${p.name} · ${it.track.tag} · ${holderLabel[it.ball.holder]} ${it.days != null ? it.days + 'd' : ''}${ns.lastNudge ? ' · last nudged ' + Math.floor((Date.now() - new Date(ns.lastNudge.ts).getTime()) / 86400000) + 'd ago' : ''}`,
          ts: TODAY,
        });
      });
    }
    // coordination track milestone deadlines
    if (typeof cmLoad === 'function' && typeof CM_MILESTONES !== 'undefined') {
      const cmd = cmLoad()[p.id];
      if (cmd && cmd.ms) {
        (cmd.tracks || []).forEach(tid => {
          const defs = CM_MILESTONES[tid] || [];
          const trk = (typeof CM_TRACKS !== 'undefined' ? CM_TRACKS : []).find(t => t.id === tid);
          defs.forEach((lab, i) => {
            const e = (cmd.ms[tid] || {})[i];
            if (!e || !e.due || e.date) return;
            const d = daysBetween(e.due, TODAY);
            if (d > 0) out.push({ id: `cmms-over-${p.id}-${tid}-${i}`, pid: p.id, sev: d >= 14 ? 'crit' : 'warn', icon: 'clock', title: `Milestone overdue — ${lab}`, sub: `${p.name} · ${trk ? trk.lab : tid} · due ${fmtShort(e.due)} · ${d}d late`, ts: e.due });
            else if (d >= -7) out.push({ id: `cmms-soon-${p.id}-${tid}-${i}`, pid: p.id, sev: 'info', icon: 'clock', title: `Milestone due ${d === 0 ? 'today' : 'in ' + (-d) + 'd'} — ${lab}`, sub: `${p.name} · ${trk ? trk.lab : tid} · due ${fmtShort(e.due)}`, ts: e.due });
          });
        });
      }
    }
  });
  return out.sort((a, b) => (a.sev === 'crit' ? 0 : a.sev === 'warn' ? 1 : 2) - (b.sev === 'crit' ? 0 : b.sev === 'warn' ? 1 : 2));
}

function NotificationBell({ projects, onOpenProject }) {
  const [open, setOpen] = React.useState(false);
  const [read, setRead] = React.useState(loadRead);
  const ref = React.useRef(null);
  const [tick, bump] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    window.addEventListener('msa-research-updated', bump);
    window.addEventListener('msa-coord-updated', bump);
    return () => { window.removeEventListener('msa-research-updated', bump); window.removeEventListener('msa-coord-updated', bump); };
  }, []);
  const items = React.useMemo(() => buildNotifications(projects), [projects, tick]);
  const unread = items.filter(n => !read.includes(n.id));
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const markAll = () => { const ids = items.map(n => n.id); setRead(ids); persistRead(ids); };
  const clickItem = (n) => {
    const next = [...new Set([...read, n.id])];
    setRead(next); persistRead(next);
    setOpen(false);
    onOpenProject(n.pid);
  };
  const sevColor = { crit: 'var(--warn)', warn: 'var(--amber)', info: 'var(--blue)' };
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="btn btn-icon" title="Notifications" onClick={() => setOpen(o => !o)} style={open ? { background: 'var(--surface-2)' } : null}>
        <Icon name="bell" />
        {unread.length > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 100, background: 'var(--warn)', color: 'white', fontSize: 9.5, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 4px', fontFamily: 'Geist Mono, monospace', border: '2px solid var(--surface)' }}>{unread.length}</span>
        )}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 40, right: 0, width: 360, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
          <div style={{ padding: '11px 15px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications {unread.length > 0 && <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>· {unread.length} new</span>}</span>
            {unread.length > 0 && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 11 }} onClick={markAll}>Mark all read</button>}
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {items.length === 0 && <div style={{ padding: '26px 16px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 12.5 }}>All clear — nothing needs attention.</div>}
            {items.map(n => {
              const isRead = read.includes(n.id);
              return (
                <button key={n.id} onClick={() => clickItem(n)} style={{ display: 'flex', gap: 11, width: '100%', textAlign: 'left', padding: '11px 15px', border: 0, borderBottom: '1px solid var(--border)', background: isRead ? 'var(--surface)' : 'var(--primary-tint)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: sevColor[n.sev], flexShrink: 0, marginTop: 1 }}><Icon name={n.icon} size={13} /></span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: isRead ? 500 : 600, color: 'var(--ink)', lineHeight: 1.35 }}>{n.title}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{n.sub}</span>
                  </span>
                  {!isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', marginLeft: 'auto', marginTop: 6, flexShrink: 0 }}></span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [users, setUsers] = React.useState(loadUsers);
  const [sessionId, setSessionId] = React.useState(loadSession);
  const [page, setPage] = React.useState('dash');
  const [openProjectId, setOpenProjectId] = React.useState(null);
  const [reportCode, setReportCode] = React.useState(null);
  const [userProjects, setUserProjects] = React.useState(loadUserProjects);
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const CAPSTUDY_KEY = 'msa_app_capstudy_v1';
  const [capStudies, setCapStudies] = React.useState(() => { try { return JSON.parse(localStorage.getItem(CAPSTUDY_KEY)) || {}; } catch (e) { return {}; } }); // projectId -> capacity study
  const saveCapStudies = (updater) => setCapStudies(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    try { localStorage.setItem(CAPSTUDY_KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  });
  const WSL_KEY = 'msa_app_wsl_overrides_v1';
  const [wslOverrides, setWslOverrides] = React.useState(() => { try { return JSON.parse(localStorage.getItem(WSL_KEY)) || {}; } catch (e) { return {}; } }); // projectId -> wsl override
  const saveWslOverrides = (updater) => setWslOverrides(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    try { localStorage.setItem(WSL_KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  });
  const TASKS_KEY = 'msa_app_task_overrides_v1';
  const [taskOverrides, setTaskOverrides] = React.useState(() => { try { return JSON.parse(localStorage.getItem(TASKS_KEY)) || {}; } catch (e) { return {}; } }); // projectId -> { taskKey: {status,date} }
  const DD_KEY = 'msa_app_dd_overrides_v1';
  const [ddOverrides, setDdOverrides] = React.useState(() => { try { return JSON.parse(localStorage.getItem(DD_KEY)) || {}; } catch (e) { return {}; } }); // projectId -> { ddName: {status,date} }
  const PHASE_KEY = 'msa_app_phase_overrides_v1';
  const [phaseOverrides, setPhaseOverrides] = React.useState(() => { try { return JSON.parse(localStorage.getItem(PHASE_KEY)) || {}; } catch (e) { return {}; } }); // projectId -> phase
  const INFO_KEY = 'msa_app_info_overrides_v1';
  const [infoOverrides, setInfoOverrides] = React.useState(() => { try { return JSON.parse(localStorage.getItem(INFO_KEY)) || {}; } catch (e) { return {}; } }); // projectId -> {code,name,client,location,utility,apn,mapRef,acreage}
  const DELETED_KEY = 'msa_app_deleted_projects_v1';
  const [deletedIds, setDeletedIds] = React.useState(() => { try { return JSON.parse(localStorage.getItem(DELETED_KEY)) || []; } catch (e) { return []; } });
  const ADDED_TASKS_KEY = 'msa_app_added_tasks_v1';
  const [addedTasks, setAddedTasks] = React.useState(() => { try { return JSON.parse(localStorage.getItem(ADDED_TASKS_KEY)) || {}; } catch (e) { return {}; } }); // projectId -> [task]
  const [toast, setToast] = React.useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const currentUser = users.find(u => u.id === sessionId) || null;

  const projects = React.useMemo(() => {
    const merged = [...SEED_PROJECTS, ...userProjects].filter(p => !deletedIds.includes(p.id));
    return merged.map(p => {
      let out = p;
      if (addedTasks[p.id] && addedTasks[p.id].length) out = { ...out, tasks: [...out.tasks, ...addedTasks[p.id].map(t => ({ ...t, user: true }))] };
      // stable per-task keys (assigned before overrides/removal so they never shift)
      out = { ...out, tasks: out.tasks.map((t, i) => ({ ...t, _key: `${t.agency}:${t.taskId}:${i}` })) };
      if (Object.prototype.hasOwnProperty.call(wslOverrides, p.id)) out = { ...out, wsl: wslOverrides[p.id] };
      if (Object.prototype.hasOwnProperty.call(capStudies, p.id)) out = { ...out, capacityStudy: capStudies[p.id] };
      const to = taskOverrides[p.id];
      if (to) {
        out = { ...out, tasks: out.tasks.map(t => to[t._key] ? { ...t, ...to[t._key] } : t) };
      }
      out = { ...out, tasks: out.tasks.filter(t => !t.removed) };
      const ddo = ddOverrides[p.id];
      if (ddo) {
        out = { ...out, dd: out.dd.map(d => ddo[d.name] ? { ...d, ...ddo[d.name] } : d) };
      }
      if (phaseOverrides[p.id]) {
        const po = phaseOverrides[p.id];
        out = typeof po === 'string' ? { ...out, phase: po } : { ...out, phase: po.phase, completedOn: po.completedOn };
      }
      if (infoOverrides[p.id]) {
        const io = infoOverrides[p.id];
        out = { ...out, ...io, location: { ...out.location, ...(io.location || {}) } };
      }
      return out;
    });
  }, [userProjects, wslOverrides, capStudies, taskOverrides, ddOverrides, phaseOverrides, addedTasks, infoOverrides, deletedIds]);

  // completed projects live in the archive, not the working views
  const activeProjects = React.useMemo(() => projects.filter(p => p.phase !== 'Complete'), [projects]);

  const onTaskAdd = (pid, task) => {
    if (!canWrite) return;
    setAddedTasks(prev => {
      const next = { ...prev, [pid]: [...(prev[pid] || []), task] };
      try { localStorage.setItem(ADDED_TASKS_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    showToast(`Task added — ${task.name}`);
  };

  const onProjectDelete = (pid) => {
    if (!isAdmin) return;
    const p = projects.find(x => x.id === pid);
    setOpenProjectId(null);
    if (userProjects.some(x => x.id === pid)) {
      const next = userProjects.filter(x => x.id !== pid);
      setUserProjects(next); persistUserProjects(next);
    } else {
      setDeletedIds(prev => { const next = [...prev, pid]; try { localStorage.setItem(DELETED_KEY, JSON.stringify(next)); } catch (e) {} return next; });
    }
    showToast(`Project deleted${p ? ' — ' + p.name : ''}`);
  };

  const onInfoUpdate = (pid, patch) => {
    if (!canWrite) return;
    setInfoOverrides(prev => {
      const next = { ...prev, [pid]: { ...(prev[pid] || {}), ...patch, location: { ...((prev[pid] || {}).location || {}), ...(patch.location || {}) } } };
      try { localStorage.setItem(INFO_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    showToast('Project info updated');
  };

  const onPhaseUpdate = (pid, phase) => {
    const p = projects.find(x => x.id === pid);
    if (!p) return;
    setPhaseOverrides(prev => {
      const next = { ...prev, [pid]: { phase, completedOn: phase === 'Complete' ? TODAY.toISOString().slice(0, 10) : null } };
      try { localStorage.setItem(PHASE_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    showToast(phase === 'Complete' ? `${p.name} marked complete — moved to archive` : `${p.name} → ${phase}`);
  };

  const canWrite = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'editor') : false;
  const isAdmin = currentUser?.role === 'admin';

  const login = (u) => { setSessionId(u.id); persistSession(u.id); showToast(`Welcome, ${u.name.split(' ')[0]}`); };
  const logout = () => { setSessionId(null); persistSession(null); setPage('tracker'); };

  const onWslAction = (pid, action) => {
    if (!canWrite) return;
    const p = projects.find(x => x.id === pid);
    if (!p) return;
    if (action === 'extend') {
      saveWslOverrides(prev => ({ ...prev, [pid]: { ...p.wsl, extensionUsed: true } }));
      showToast(`Extension filed for ${p.name}`);
    } else {
      saveWslOverrides(prev => ({ ...prev, [pid]: { issued: TODAY.toISOString().slice(0, 10), extensionUsed: false } }));
      showToast(`New WSL application submitted for ${p.name}`);
    }
  };

  const onWslEdit = (pid, wsl) => {
    if (!canWrite) return;
    const p = projects.find(x => x.id === pid);
    if (!p) return;
    if (wsl === null) {
      saveWslOverrides(prev => ({ ...prev, [pid]: null }));
      showToast(`WSL record removed for ${p.name}`);
    } else {
      saveWslOverrides(prev => ({ ...prev, [pid]: wsl }));
      showToast(`WSL dates updated for ${p.name}`);
    }
  };

  // Capacity study submittals — logged, edited, or cleared per project.
  const onCapacityEdit = (pid, cs) => {
    if (!canWrite) return;
    const p = projects.find(x => x.id === pid);
    if (!p) return;
    if (cs === null) {
      saveCapStudies(prev => ({ ...prev, [pid]: null }));
      showToast(`Capacity study removed for ${p.name}`);
    } else {
      saveCapStudies(prev => ({ ...prev, [pid]: cs }));
      showToast(cs.received ? `Capacity study results logged for ${p.name}` : `Capacity study submittal logged for ${p.name}`);
    }
  };

  const patchTask = (pid, key, patch) => setTaskOverrides(prev => {
    const next = { ...prev, [pid]: { ...(prev[pid] || {}), [key]: { ...((prev[pid] || {})[key] || {}), ...patch } } };
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  });

  const onTaskUpdate = (pid, taskKey, status) => {
    if (!canWrite) return;
    const p = projects.find(x => x.id === pid);
    const t = p && p.tasks.find(x => x._key === taskKey);
    if (!t) return;
    patchTask(pid, taskKey, { status, date: TODAY.toISOString().slice(0, 10) });
    showToast(`${t.name} → ${SUB_META[status].label}`);
  };

  const onTaskRename = (pid, taskKey, name) => {
    if (!canWrite || !name.trim()) return;
    patchTask(pid, taskKey, { name: name.trim() });
    showToast('Task renamed');
  };

  const onTaskSetDue = (pid, taskKey, due) => {
    if (!canWrite) return;
    patchTask(pid, taskKey, { due: due || null });
    showToast(due ? `Due date set — ${fmt(due)}` : 'Due date cleared');
  };

  const onTaskAssign = (pid, taskKey, userId) => {
    if (!canWrite) return;
    const u = users.find(x => x.id === userId);
    if (u) {
      // capacity check (same ownership rule as the Team page)
      let caps = {}; try { caps = JSON.parse(localStorage.getItem('msa_app_capacity_v1')) || {}; } catch (e) {}
      const cap = caps[u.id] ?? 8;
      let load = 0;
      projects.filter(x => x.phase !== 'Complete').forEach(pr => pr.tasks.forEach(t => {
        if (t.status === 'ok') return;
        if (pr.id === pid && t._key === taskKey) return; // the task being moved
        if (t.assignee ? t.assignee === u.id : pr.pm === u.initials) load++;
      }));
      if (load + 1 > cap && !window.confirm(`${u.name} is already at ${load}/${cap} capacity. Assign anyway?`)) return;
    }
    patchTask(pid, taskKey, { assignee: userId || null });
    showToast(u ? `Assigned to ${u.name}` : 'Assignee cleared');
  };

  const onTaskDelete = (pid, taskKey) => {
    if (!canWrite) return;
    const p = projects.find(x => x.id === pid);
    const t = p && p.tasks.find(x => x._key === taskKey);
    patchTask(pid, taskKey, { removed: true });
    showToast(t ? `Task removed — ${t.name}` : 'Task removed');
  };

  const onDdUpdate = (pid, ddName, status) => {
    if (!canWrite) return;
    setDdOverrides(prev => {
      const next = { ...prev, [pid]: { ...(prev[pid] || {}), [ddName]: { status, date: status === 'todo' || status === 'na' ? null : TODAY.toISOString().slice(0, 10) } } };
      try { localStorage.setItem(DD_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    showToast(`${ddName} → ${DD_META[status].label}`);
  };

  const onCreateProject = (proj) => {
    const next = [...userProjects, proj];
    setUserProjects(next); persistUserProjects(next);
    setWizardOpen(false);
    showToast(`${proj.code} · ${proj.name} created`);
  };

  // per-user open load vs capacity (for assignee dropdowns)
  // NOTE: must stay above the LoginScreen early return — hooks can't come after a conditional return.
  const userLoads = React.useMemo(() => {
    let caps = {}; try { caps = JSON.parse(localStorage.getItem('msa_app_capacity_v1')) || {}; } catch (e) {}
    const map = {};
    users.forEach(u => { map[u.id] = { load: 0, cap: caps[u.id] ?? 8 }; });
    projects.filter(x => x.phase !== 'Complete').forEach(pr => pr.tasks.forEach(t => {
      if (t.status === 'ok') return;
      const u = t.assignee ? users.find(x => x.id === t.assignee) : users.find(x => x.initials === pr.pm);
      if (u && map[u.id]) map[u.id].load++;
    }));
    return map;
  }, [projects, users, taskOverrides]);

  if (!currentUser) return <LoginScreen users={users} onLogin={login} />;

  const openProject = openProjectId ? projects.find(x => x.id === openProjectId) : null;
  const pageTitle = openProject ? 'Project' : page === 'dash' ? 'Dashboard' : page === 'tracker' ? 'Projects' : page === 'research' ? 'Utility Research' : page === 'coord' ? 'Utility Coordination' : page === 'team' ? 'Team Workload' : page === 'wsl' ? 'Will Serve Letters' : page === 'reports' ? 'Client Reports' : page === 'catalog' ? 'Agencies & Contacts' : 'Users & Permissions';
  const existingCodes = projects.map(p => p.code.toUpperCase());

  return (
    <div className="shell">
      <nav className="sidenav">
        <div className="sn-brand">
          <img className="sn-logo" src="assets/msa-logo.svg" alt="MSA Consulting, Inc." />
          <div className="sn-sub">Dry Utility Division</div>
        </div>
        {PAGES.map(pg => (
          <button key={pg.id} className={`sn-item ${page === pg.id && !openProject ? 'active' : ''}`} onClick={() => { setPage(pg.id); setOpenProjectId(null); }}>
            <Icon name={pg.icon} />{pg.label}
            {pg.id === 'tracker' && <span className="sn-count">{projects.length}</span>}
          </button>
        ))}        {isAdmin && (
          <>
            <div className="sn-sec">Admin</div>
            <button className={`sn-item ${page === 'users' ? 'active' : ''}`} onClick={() => { setPage('users'); setOpenProjectId(null); }}>
              <Icon name="users" />Users &amp; access
              <span className="sn-count">{users.length}</span>
            </button>
            <button className={`sn-item ${page === 'catalog' ? 'active' : ''}`} onClick={() => { setPage('catalog'); setOpenProjectId(null); }}>
              <Icon name="file" />Task catalog
            </button>
          </>
        )}
        <div className="sn-foot">
          <div className="sn-user">
            <UserAvatar user={currentUser} size={30} />
            <div style={{ minWidth: 0 }}>
              <div className="u-name">{currentUser.name}</div>
              <RoleBadge role={currentUser.role} />
            </div>
          </div>
          <button className="sn-item" onClick={logout} style={{ marginTop: 4 }}>
            <Icon name="logout" />Sign out
          </button>
        </div>
      </nav>

      <div className="main">
        <div className="topbar">
          <h1>{pageTitle}</h1>
          <div className="topbar-spacer"></div>
          {!canWrite && <span className="readonly-note"><Icon name="lock" size={11} />Viewer — read only</span>}
          <NotificationBell projects={activeProjects} onOpenProject={(pid) => { setOpenProjectId(pid); }} />
        </div>
        <div className="content">
          {openProject ? (
            <ProjectPage
              users={users}
              userLoads={userLoads}
              onTaskAssign={onTaskAssign}
              p={openProject}
              canWrite={canWrite}
              currentUser={currentUser}
              onBack={() => setOpenProjectId(null)}
              onWslAction={onWslAction}
              onWslEdit={onWslEdit}
              onCapacityEdit={onCapacityEdit}
              onTaskUpdate={onTaskUpdate}
              onTaskRename={onTaskRename}
              onTaskSetDue={onTaskSetDue}
              onTaskDelete={onTaskDelete}
              onTaskAdd={onTaskAdd}
              onDdUpdate={onDdUpdate}
              onPhaseUpdate={onPhaseUpdate}
              onInfoUpdate={onInfoUpdate}
              onProjectDelete={isAdmin ? onProjectDelete : null}
              onGoReport={() => { setReportCode(openProject.code); setOpenProjectId(null); setPage('reports'); }}
            />
          ) : (
            <>
              {page === 'dash' && <DashPage projects={activeProjects} users={users} currentUser={currentUser} onOpenProject={setOpenProjectId} onGoPage={setPage} />}
              {page === 'tracker' && <TrackerPage projects={activeProjects} completed={projects.filter(p => p.phase === 'Complete')} canWrite={canWrite} onAddClick={() => setWizardOpen(true)} onWslAction={onWslAction} showToast={showToast} onOpenProject={setOpenProjectId} />}
              {page === 'research' && <ResearchPage projects={activeProjects} onOpenProject={setOpenProjectId} />}
              {page === 'coord' && <CoordPage projects={activeProjects} onOpenProject={setOpenProjectId} users={users} />}
              {page === 'wsl' && <WslPage projects={activeProjects} canWrite={canWrite} onWslAction={onWslAction} onOpenProject={setOpenProjectId} showToast={showToast} />}
              {page === 'reports' && <ReportsPage projects={projects} canWrite={canWrite} showToast={showToast} initialCode={reportCode} />}
              {page === 'team' && <TeamPage projects={activeProjects} users={users} canWrite={canWrite} onTaskAssign={onTaskAssign} onOpenProject={setOpenProjectId} showToast={showToast} />}
              {page === 'users' && isAdmin && <UsersPage users={users} setUsers={setUsers} currentUser={currentUser} showToast={showToast} />}
              {page === 'catalog' && isAdmin && <CatalogPage projects={projects} showToast={showToast} />}
            </>
          )}
        </div>
      </div>

      <AddProjectWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreate={onCreateProject} existingCodes={existingCodes} />
      <div className={`toast ${toast ? 'show' : ''}`}><Icon name="check" size={16} />{toast}</div>
    </div>
  );
}

// Wait for the Supabase state pull (resolves immediately in offline mode) so the
// first render sees synced data instead of stale local copies.
(window.__msaStoreReady || Promise.resolve()).then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
});
