// Blueprint — Dashboard summary page (home).

// month calendar of deadlines: WSL expiries + report due dates
function DeadlineCalendar({ projects, onOpenProject }) {
  const [offset, setOffset] = React.useState(0); // months from current
  const base = new Date(TODAY.getFullYear(), TODAY.getMonth() + offset, 1);
  const year = base.getFullYear(), month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isToday = (d) => offset === 0 && d === TODAY.getDate();

  // gather deadline events keyed by day-of-month (weekdays only; weekend deadlines roll Sat→Fri, Sun→Mon)
  const events = React.useMemo(() => {
    const map = {};
    const push = (date, ev) => {
      const dt = parseDate(date);
      const dow = dt.getDay();
      if (dow === 6) { dt.setDate(dt.getDate() - 1); ev = { ...ev, rolled: 'Sat' }; }
      else if (dow === 0) { dt.setDate(dt.getDate() + 1); ev = { ...ev, rolled: 'Sun' }; }
      if (dt.getFullYear() === year && dt.getMonth() === month) {
        (map[dt.getDate()] = map[dt.getDate()] || []).push(ev);
      }
    };
    projects.forEach(p => {
      const wd = deriveWsl(p.wsl);
      // expiry dates stop being deadlines once the letter is closed out
      if (wd && !wd.complete) {
        push(wd.effectiveExpiry, { kind: 'wsl', sev: wd.state === 'expired' || wd.state === 'critical' ? 'crit' : wd.state === 'warning' ? 'warn' : 'ok', label: `WSL expires — ${projLabel(p)}`, pid: p.id });
        if (!wd.extensionUsed) push(wd.originalExpiry, { kind: 'wsl-orig', sev: 'warn', label: `1-yr mark (ext deadline) — ${projLabel(p)}`, pid: p.id });
      }
      if (p.reporting.lastSent) {
        const next = parseDate(p.reporting.lastSent);
        next.setDate(next.getDate() + (p.reporting.cadence === 'Weekly' ? 7 : 14));
        push(next, { kind: 'report', sev: 'info', label: `${p.reporting.cadence} report due — ${projLabel(p)}`, pid: p.id });
      }
      p.tasks.forEach(t => {
        if (t.user && t.due && t.status !== 'ok') push(t.due, { kind: 'task', sev: daysBetween(t.due, TODAY) > 0 ? 'crit' : 'warn', label: `${t.name} due — ${projLabel(p)}`, pid: p.id });
      });
      // coordination track milestone deadlines (unlogged, with a due date)
      if (typeof cmLoad === 'function' && typeof CM_MILESTONES !== 'undefined') {
        const cmd = cmLoad()[p.id];
        if (cmd && cmd.ms) (cmd.tracks || []).forEach(tid => {
          const defs = CM_MILESTONES[tid] || [];
          const trk = (typeof CM_TRACKS !== 'undefined' ? CM_TRACKS : []).find(t => t.id === tid);
          defs.forEach((lab, i) => {
            const e = (cmd.ms[tid] || {})[i];
            if (e && e.due && !e.date) push(e.due, { kind: 'milestone', sev: daysBetween(e.due, TODAY) > 0 ? 'crit' : 'warn', label: `${lab} — ${trk ? trk.lab : tid} · ${projLabel(p)}`, pid: p.id });
          });
        });
      }
    });
    return map;
  }, [projects, year, month]);

  const sevColor = { crit: 'var(--warn)', warn: 'var(--amber)', ok: 'var(--ok)', info: 'var(--blue)' };
  const monthName = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const [hoverDay, setHoverDay] = React.useState(null);

  const cells = [];
  {
    // weekday-only grid: column = Mon..Fri
    const firstWeekdayCol = { 0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 0 }; // dow of the 1st -> starting column of its (first shown) weekday
    let started = false;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow === 0 || dow === 6) continue;
      if (!started) { for (let i = 0; i < dow - 1; i++) cells.push(null); started = true; }
      cells.push(d);
    }
  }

  return (
    <div className="panel" style={{ gridColumn: '1 / -1' }}>
      <div className="panel-hd">
        <h2>Deadline calendar</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-sm btn-icon" style={{ width: 26, height: 26 }} onClick={() => setOffset(o => o - 1)} title="Previous month"><Icon name="chevL" size={12} /></button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{monthName}</span>
          <button className="btn btn-sm btn-icon" style={{ width: 26, height: 26 }} onClick={() => setOffset(o => o + 1)} title="Next month"><Icon name="chev" size={12} /></button>
          {offset !== 0 && <button className="btn btn-ghost btn-sm" onClick={() => setOffset(0)}>Today</button>}
        </div>
      </div>
      <div style={{ padding: '10px 14px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
            <div key={d} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', fontWeight: 700, textAlign: 'center', padding: '3px 0' }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`}></div>;
            const evs = events[d] || [];
            return (
              <div key={d}
                onMouseEnter={() => setHoverDay(d)} onMouseLeave={() => setHoverDay(null)}
                style={{
                  minHeight: 82, border: '1px solid ' + (isToday(d) ? 'var(--primary)' : 'var(--border)'),
                  borderRadius: 7, padding: '4px 6px', position: 'relative',
                  background: isToday(d) ? 'var(--primary-tint)' : evs.length ? 'var(--surface)' : 'var(--surface)',
                  boxShadow: isToday(d) ? '0 0 0 1px var(--primary)' : 'none',
                }}>
                <div style={{ fontSize: 10.5, fontFamily: 'Geist Mono, monospace', color: isToday(d) ? 'var(--primary)' : 'var(--ink-4)', fontWeight: isToday(d) ? 700 : 500 }}>{d}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                  {/* taller cells fit a third entry before the "+n more" roll-up */}
                  {evs.slice(0, 3).map((ev, ei) => (
                    <button key={ei} onClick={() => onOpenProject(ev.pid)} title={ev.label}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit', minWidth: 0, width: '100%' }}>
                      <span style={{ width: 6, height: 6, borderRadius: ev.kind === 'milestone' ? 1 : (ev.kind === 'report' || ev.kind === 'task') ? 2 : '50%', background: sevColor[ev.sev], flexShrink: 0, transform: ev.kind === 'milestone' ? 'rotate(45deg)' : 'none' }}></span>
                      <span style={{ fontSize: 9.5, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{ev.label.split(' — ')[1] || ev.label}</span>
                    </button>
                  ))}
                  {evs.length > 3 && <span style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'Geist Mono, monospace' }}>+{evs.length - 3} more</span>}
                </div>
                {hoverDay === d && evs.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 30, width: 240, background: 'var(--ink)', color: 'white', borderRadius: 8, padding: '8px 10px', boxShadow: 'var(--shadow-lg)', marginTop: 2 }}>
                    {evs.map((ev, ei) => (
                      <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, padding: '3px 0', lineHeight: 1.35 }}>
                        <span style={{ width: 6, height: 6, borderRadius: ev.kind === 'milestone' ? 1 : (ev.kind === 'report' || ev.kind === 'task') ? 2 : '50%', background: sevColor[ev.sev], flexShrink: 0, transform: ev.kind === 'milestone' ? 'rotate(45deg)' : 'none' }}></span>
                        {ev.label}{ev.rolled ? ` (falls on ${ev.rolled})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--warn)' }}></span>WSL expiry (critical)</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)' }}></span>1-yr mark / warning</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)' }}></span>WSL expiry (clear)</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--blue)' }}></span>Client report due</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--amber)' }}></span>Task due</span>
        </div>
      </div>
    </div>
  );
}

function DashPage({ projects, users, currentUser, onOpenProject, onGoPage }) {
  const wds = projects.map(p => ({ p, wd: deriveWsl(p.wsl) }));
  const wslAttention = wds.filter(x => x.wd && !x.wd.complete && x.wd.state !== 'active').sort((a, b) => a.wd.daysLeft - b.wd.daysLeft);

  // my open tasks: explicitly assigned to me, or unassigned on projects I PM
  const myProjects = projects.filter(p => p.pm === currentUser.initials);
  const myTasks = [];
  projects.forEach(p => p.tasks.forEach(t => {
    if (!t.user) return; // agency micro-tasks retired — dashboards track user-created tasks only
    if (t.status === 'ok') return;
    if (t.assignee ? t.assignee === currentUser.id : p.pm === currentUser.initials) myTasks.push({ p, t });
  }));
  // research letters are Domonique's responsibility — outstanding ones surface in her task list
  if (currentUser.id === 'u2') projects.forEach(p => {
    const waiting = (typeof getResearchRows === 'function' ? getResearchRows(p) : []).filter(r => !r.received && !r.noResponse && (r.owner || 'u2') === 'u2');
    if (waiting.length) myTasks.push({ p, t: { name: `Utility research follow-up — ${waiting.length} letter${waiting.length === 1 ? '' : 's'} outstanding`, status: 'review', due: null, research: true } });
  });
  myTasks.sort((a, b) => {
    const od = (x) => x.t.due && daysBetween(x.t.due, TODAY) > 0 ? 0 : x.t.due ? 1 : x.t.status === 'resubmit' ? 2 : 3;
    if (od(a) !== od(b)) return od(a) - od(b);
    if (a.t.due && b.t.due) return parseDate(a.t.due) - parseDate(b.t.due);
    return 0;
  });
  const reportsDue = projects.filter(p => p.reporting.lastSent && daysBetween(p.reporting.lastSent, TODAY) >= (p.reporting.cadence === 'Weekly' ? 7 : 14));

  // utility research: outstanding letters (sent, nothing received) across projects
  const research = React.useMemo(() => {
    const recOv = (() => { try { return JSON.parse(localStorage.getItem('msa_app_research_v1')) || {}; } catch (e) { return {}; } })();
    const added = typeof loadAddedResearch === 'function' ? loadAddedResearch() : {};
    const out = [];
    projects.forEach(p => {
      const rows = [...(p.research || []), ...(added[p.id] || [])].map(r => {
        const o = recOv[p.id] || {};
        return Object.prototype.hasOwnProperty.call(o, r.id) ? { ...r, received: o[r.id] } : r;
      });
      if (rows.length) out.push({ p, total: rows.length, received: rows.filter(r => r.received).length, waiting: rows.filter(r => !r.received), oldest: Math.max(0, ...rows.filter(r => !r.received).map(r => daysBetween(r.sent, TODAY))) });
    });
    return out.sort((a, b) => b.oldest - a.oldest);
  }, [projects]);
  const researchWaiting = research.reduce((n, x) => n + x.waiting.length, 0);

  // phase distribution
  const phaseCounts = {};
  projects.forEach(p => { phaseCounts[p.phase] = (phaseCounts[p.phase] || 0) + 1; });

  // recent activity across all projects (task + dd dates)
  const recent = [];
  projects.forEach(p => {
    p.tasks.forEach(t => { if (t.user && t.date) recent.push({ ts: t.date, text: `${t.name} — ${SUB_META[t.status].label}`, proj: p, tag: t.agency ? (AGENCIES[t.agency]?.short || t.agency) : 'Task' }); });
  });
  projects.forEach(p => {
    const recOv = (() => { try { return JSON.parse(localStorage.getItem('msa_app_research_v1')) || {}; } catch (e) { return {}; } })();
    const added = typeof loadAddedResearch === 'function' ? (loadAddedResearch()[p.id] || []) : [];
    [...(p.research || []), ...added].forEach(r => {
      const rec = Object.prototype.hasOwnProperty.call(recOv[p.id] || {}, r.id) ? (recOv[p.id] || {})[r.id] : r.received;
      if (rec) recent.push({ ts: rec, text: `Research received — ${r.label}`, proj: p, tag: AGENCIES[r.agency]?.short || 'UR' });
      else if (r.sent) recent.push({ ts: r.sent, text: `Research letter sent — ${r.label}`, proj: p, tag: AGENCIES[r.agency]?.short || 'UR' });
    });
  });
  recent.sort((a, b) => parseDate(b.ts) - parseDate(a.ts));

  // team workload summary (mirrors the Team page ownership rule)
  const workload = React.useMemo(() => {
    const rows = (users || []).map(u => ({ u, open: 0, overdue: 0 }));
    projects.forEach(p => p.tasks.forEach(t => {
      if (!t.user) return;
      if (t.status === 'ok') return;
      const r = t.assignee ? rows.find(x => x.u.id === t.assignee) : rows.find(x => x.u.initials === p.pm);
      if (!r) return;
      r.open++;
      if (t.due && daysBetween(t.due, TODAY) > 0) r.overdue++;
    }));
    // research letters count toward Domonique's load
    const dm = rows.find(x => x.u.id === 'u2');
    if (dm) projects.forEach(p => {
      const waiting = (typeof getResearchRows === 'function' ? getResearchRows(p) : []).filter(r => !r.received && !r.noResponse && (r.owner || 'u2') === 'u2');
      if (waiting.length) dm.open++;
    });
    return rows.sort((a, b) => b.open - a.open);
  }, [projects, users]);
  const maxLoad = Math.max(1, ...workload.map(r => r.open));

  const firstName = currentUser.name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em' }}>{greeting}, {firstName}</h2>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>{fmt(TODAY)} · {projects.length} active projects · {wslAttention.length} WSL{wslAttention.length === 1 ? '' : 's'} need attention</div>
      </div>

      {/* KPI row */}
      <div className="kpis">
        <button className="kpi clickable" onClick={() => onGoPage('tracker')}><div className="k-ic" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}><Icon name="tracker" size={16} /></div><div><div className="k-val">{projects.length}</div><div className="k-lab">Projects</div></div></button>
        <button className="kpi clickable" onClick={() => onGoPage('wsl')}><div className="k-ic" style={{ background: 'var(--warn-tint)', color: 'var(--warn)' }}><Icon name="clock" size={16} /></div><div><div className="k-val">{wslAttention.length}</div><div className="k-lab">WSL needing attention</div></div></button>
        <button className="kpi clickable" onClick={() => onGoPage('tracker')}><div className="k-ic" style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}><Icon name="file" size={16} /></div><div><div className="k-val">{researchWaiting}</div><div className="k-lab">Research letters outstanding</div></div></button>
        <button className="kpi clickable" onClick={() => onGoPage('reports')}><div className="k-ic" style={{ background: 'var(--blue-tint)', color: 'var(--blue)' }}><Icon name="report" size={16} /></div><div><div className="k-val">{reportsDue.length}</div><div className="k-lab">Reports due</div></div></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        {/* my tasks */}
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-hd">
            <h2>My tasks</h2>
            <span className="meta">assigned to you, or unassigned on your {myProjects.length} project{myProjects.length === 1 ? '' : 's'} · {myTasks.length} open</span>
          </div>
          {myProjects.length === 0 && myTasks.length === 0 && <div style={{ padding: 18, fontSize: 12.5, color: 'var(--ink-4)' }}>Nothing assigned to you yet.</div>}
          {(myProjects.length > 0 || myTasks.length > 0) && myTasks.length === 0 && <div style={{ padding: 18, fontSize: 12.5, color: 'var(--ink-4)' }}>All caught up — every task on your plate is approved. ✓</div>}
          {myTasks.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {myTasks.slice(0, 10).map(({ p, t }, i) => {
                const m = SUB_META[t.status];
                const overdue = t.due && t.status !== 'ok' && daysBetween(t.due, TODAY) > 0;
                return (
                  <div key={i} onClick={() => onOpenProject(p.id)} className="row-main" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 12.5, minWidth: 0 }}>
                    <span className="util-tag util-iid mono">{AGENCIES[t.agency]?.short || t.agency}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}><span className="proj-no">{p.code}</span> {p.name}{t.due ? ` · due ${fmtShort(t.due)}` : ''}</div>
                    </div>
                    {overdue
                      ? <span className="days-chip crit">{daysBetween(t.due, TODAY)}d late</span>
                      : <span className={`badge ${m.badge}`}><span className="badge-dot"></span>{m.label}</span>}
                  </div>
                );
              })}
            </div>
          )}
          {myTasks.length > 10 && <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 11.5, color: 'var(--ink-4)' }}>+{myTasks.length - 10} more across your projects</div>}
        </div>

        {/* WSL attention */}
        <div className="panel">
          <div className="panel-hd">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--warn)' }}><Icon name="alert" size={14} /></span>Will Serve — act soon</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => onGoPage('wsl')}>View all</button>
          </div>
          {wslAttention.length === 0 && <div style={{ padding: 18, fontSize: 12.5, color: 'var(--ink-4)' }}>All letters in good standing.</div>}
          {wslAttention.slice(0, 5).map(({ p, wd }) => (
            <div key={p.id} onClick={() => onOpenProject(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 12.5 }} className="row-main">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}><span className="proj-no">{p.code}</span> {p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.client} · {p.location.city}</div>
              </div>
              {wd.extensionUsed && <span className="badge b-violet" style={{ fontSize: 10 }}>ext used</span>}
              {wd.state === 'expired'
                ? <span className="days-chip crit">expired</span>
                : <span className={`days-chip ${wd.state === 'critical' ? 'crit' : 'warn'}`}>{wd.daysLeft}d</span>}
            </div>
          ))}
        </div>

        {/* research letters outstanding */}
        <div className="panel">
          <div className="panel-hd">
            <h2>Research letters outstanding</h2>
            <span className="meta">{researchWaiting}</span>
          </div>
          {researchWaiting === 0 && <div style={{ padding: 18, fontSize: 12.5, color: 'var(--ink-4)' }}>All research responses are in.</div>}
          {research.filter(x => x.waiting.length).slice(0, 5).map(({ p, total, received, waiting, oldest }, i) => (
            <div key={i} onClick={() => onOpenProject(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 12.5 }} className="row-main">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}><span className="proj-no">{p.code}</span> {p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{waiting.slice(0, 4).map(w => AGENCIES[w.agency]?.short || w.label).join(' · ')}{waiting.length > 4 ? ` +${waiting.length - 4}` : ''}</div>
              </div>
              <span className={`badge ${oldest > 45 ? 'b-warn' : 'b-amber'}`}><span className="badge-dot"></span>{received}/{total} · {oldest}d</span>
            </div>
          ))}
        </div>

        {/* phase distribution */}
        <div className="panel">
          <div className="panel-hd"><h2>Projects by phase</h2></div>
          <div style={{ padding: '12px 16px 16px' }}>
            {PHASES.filter(ph => phaseCounts[ph]).map(ph => (
              <div key={ph} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                <span className={`badge ${PHASE_META[ph].badge}`} style={{ width: 110, justifyContent: 'flex-start' }}><span className="badge-dot"></span>{ph}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--surface-3)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ width: `${(phaseCounts[ph] / projects.length) * 100}%`, height: '100%', background: 'var(--primary)', opacity: 0.75, borderRadius: 100 }}></div>
                </div>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', width: 18, textAlign: 'right' }}>{phaseCounts[ph]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* team workload */}
        <div className="panel">
          <div className="panel-hd">
            <h2>Team workload</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => onGoPage('team')}>View team</button>
          </div>
          <div style={{ padding: '12px 16px 14px' }}>
            {workload.map(({ u, open, overdue }) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                <span className="avatar" style={{ width: 22, height: 22, background: 'var(--primary)', fontSize: 9, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600, flexShrink: 0 }}>{u.initials}</span>
                <span style={{ fontSize: 12.5, width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--surface-3)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ width: `${(open / maxLoad) * 100}%`, height: '100%', background: overdue > 0 ? 'var(--warn)' : 'var(--primary)', opacity: 0.75, borderRadius: 100 }}></div>
                </div>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', width: 20, textAlign: 'right' }}>{open}</span>
                {overdue > 0 ? <span className="days-chip crit" style={{ flexShrink: 0 }}>{overdue} late</span> : <span style={{ width: 0 }}></span>}
              </div>
            ))}
          </div>
        </div>

        {/* utility research status */}
        {research.length > 0 && (
          <div className="panel">
            <div className="panel-hd">
              <h2>Utility research</h2>
              <span className="meta">{researchWaiting} letter{researchWaiting === 1 ? '' : 's'} outstanding</span>
            </div>
            {research.slice(0, 5).map(({ p, total, received, waiting, oldest }) => (
              <div key={p.id} onClick={() => onOpenProject(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 12.5 }} className="row-main">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}><span className="proj-no">{p.code}</span> {p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{waiting.length ? `waiting on ${waiting.slice(0, 3).map(r => AGENCIES[r.agency]?.short || r.agency).join(', ')}${waiting.length > 3 ? ` +${waiting.length - 3}` : ''}` : 'all research received'}</div>
                </div>
                <div style={{ width: 54, height: 8, background: 'var(--surface-3)', borderRadius: 100, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ width: `${(received / total) * 100}%`, height: '100%', background: received === total ? 'var(--ok)' : 'var(--blue)', borderRadius: 100 }}></div>
                </div>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', width: 34, textAlign: 'right' }}>{received}/{total}</span>
                {waiting.length > 0 && <span className={`days-chip ${oldest > 45 ? 'crit' : 'warn'}`} style={{ flexShrink: 0 }}>{oldest}d</span>}
              </div>
            ))}
          </div>
        )}

        {/* recent activity */}
        <div className="panel">
          <div className="panel-hd"><h2>Recent activity</h2></div>
          {recent.slice(0, 6).map((ev, i) => (
            <div key={i} onClick={() => onOpenProject(ev.proj.id)} style={{ display: 'flex', gap: 10, padding: '9px 16px', borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 12.5 }} className="row-main">
              <span className="util-tag util-iid mono" style={{ marginTop: 2 }}>{ev.tag}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: 'var(--ink)', lineHeight: 1.35 }}>{ev.text}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'Geist Mono, monospace', marginTop: 1 }}>{ev.proj.code} · {ev.proj.name} · {fmtShort(ev.ts)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* deadline calendar */}
        <DeadlineCalendar projects={projects} onOpenProject={onOpenProject} />
      </div>
    </div>
  );
}

Object.assign(window, { DashPage });
