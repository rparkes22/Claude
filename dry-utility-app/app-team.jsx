// Dry Utility App — Team workload view.
// Per-user open-task load across all active projects, with overdue and
// due-soon breakdowns and per-user task lists.

function TeamPage({ projects, users, canWrite, onTaskAssign, onOpenProject, showToast }) {
  const [expandedUser, setExpandedUser] = React.useState(null);
  const [dismissed, setDismissed] = React.useState([]);
  // per-person capacity (open-task limit), persisted
  const CAP_KEY = 'msa_app_capacity_v1';
  const DEFAULT_CAP = 8;
  const [caps, setCaps] = React.useState(() => { try { return JSON.parse(localStorage.getItem(CAP_KEY)) || {}; } catch (e) { return {}; } });
  const capOf = (uid) => caps[uid] ?? DEFAULT_CAP;
  const setCap = (uid, v) => setCaps(prev => {
    const next = { ...prev, [uid]: Math.max(1, Math.min(30, v)) };
    try { localStorage.setItem(CAP_KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  });

  // task ownership: explicit assignee, else the project's PM (by initials)
  const rows = React.useMemo(() => {
    const byUser = users.map(u => ({ u, tasks: [] }));
    const find = (pred) => byUser.find(pred);
    projects.forEach(p => p.tasks.forEach(t => {
      if (t.status === 'ok') return;
      const owner = t.assignee
        ? find(r => r.u.id === t.assignee)
        : find(r => r.u.initials === p.pm);
      if (owner) owner.tasks.push({ p, t, implicit: !t.assignee });
    }));
    // research letters — Domonique's standing responsibility
    projects.forEach(p => {
      const waiting = (typeof getResearchRows === 'function' ? getResearchRows(p) : []).filter(r => !r.received && (r.owner || 'u2') === 'u2');
      if (!waiting.length) return;
      const owner = find(r => r.u.id === 'u2');
      if (owner) owner.tasks.push({ p, t: { name: `Utility research — ${waiting.length} letter${waiting.length === 1 ? '' : 's'} outstanding`, status: 'review', due: null, research: true }, implicit: false });
    });
    // coordination tracks — counted toward their owner's workload
    projects.forEach(p => {
      if (typeof cmLoad !== 'function') return;
      const cmd = cmLoad()[p.id];
      if (!cmd || !cmd.owners) return;
      (cmd.tracks || []).forEach(tid => {
        const uid = cmd.owners[tid];
        if (!uid) return;
        const defs = (typeof CM_MILESTONES !== 'undefined' ? CM_MILESTONES[tid] : []) || [];
        const got = (cmd.ms || {})[tid] || {};
        const doneN = defs.filter((_, i) => got[i] && got[i].date).length;
        if (defs.length && doneN >= defs.length) return;
        const trk = (typeof CM_TRACKS !== 'undefined' ? CM_TRACKS : []).find(t => t.id === tid);
        const nextDue = defs.reduce((m, _, i) => { const e = got[i]; return e && e.due && !e.date && (!m || e.due < m) ? e.due : m; }, null);
        const owner = find(r => r.u.id === uid);
        if (owner) owner.tasks.push({ p, t: { name: `${trk ? trk.lab : tid} — coordination track · ${doneN}/${defs.length} milestones`, status: 'review', due: nextDue, coord: true }, implicit: false });
      });
    });
    byUser.forEach(r => {
      r.overdue = r.tasks.filter(x => x.t.due && daysBetween(x.t.due, TODAY) > 0).length;
      r.dueSoon = r.tasks.filter(x => x.t.due && daysBetween(x.t.due, TODAY) <= 0 && daysBetween(TODAY, x.t.due) <= 7).length;
      r.resubmit = r.tasks.filter(x => x.t.status === 'resubmit').length;
      r.projects = new Set(r.tasks.map(x => x.p.id)).size;
      r.tasks.sort((a, b) => {
        const od = (x) => x.t.due && daysBetween(x.t.due, TODAY) > 0 ? 0 : x.t.due ? 1 : 2;
        if (od(a) !== od(b)) return od(a) - od(b);
        if (a.t.due && b.t.due) return parseDate(a.t.due) - parseDate(b.t.due);
        return 0;
      });
    });
    return byUser.sort((a, b) => b.tasks.length - a.tasks.length);
  }, [projects, users]);

  const maxLoad = Math.max(1, ...rows.map(r => r.tasks.length));
  const avatarColors = ['#1d4e89', '#0f766e', '#6d28d9', '#b45309', '#be185d', '#4d7c0f'];

  // rebalancing: move tasks from over-capacity people to those with the most headroom
  const suggestions = React.useMemo(() => {
    const loads = rows.map(r => ({ u: r.u, n: r.tasks.length, cap: capOf(r.u.id), pool: [...r.tasks] }));
    const out = [];
    for (let step = 0; step < 4; step++) {
      loads.sort((a, b) => (b.n - b.cap) - (a.n - a.cap));
      const busiest = loads[0];
      const lightest = loads.slice().sort((a, b) => (a.n - a.cap) - (b.n - b.cap))[0];
      if (!busiest || !lightest || busiest.u.id === lightest.u.id) break;
      const overBy = busiest.n - busiest.cap;
      const headroom = lightest.cap - lightest.n;
      if (overBy <= 0 || headroom <= 0) break;
      const candidates = busiest.pool.filter(x => x.t.status !== 'resubmit');
      if (!candidates.length) break;
      candidates.sort((a, b) => {
        if (!a.t.due && b.t.due) return -1;
        if (a.t.due && !b.t.due) return 1;
        if (a.t.due && b.t.due) return parseDate(b.t.due) - parseDate(a.t.due);
        return 0;
      });
      const pick = candidates[0];
      busiest.pool = busiest.pool.filter(x => x !== pick);
      busiest.n--; lightest.n++;
      out.push({ from: busiest.u, to: lightest.u, p: pick.p, t: pick.t, id: `${pick.p.id}|${pick.t._key}` });
    }
    return out;
  }, [rows, caps]);
  const visibleSuggestions = suggestions.filter(s => !dismissed.includes(s.id));

  // weekly digest config (persisted)
  const DIGEST_KEY = 'msa_app_digest_v1';
  const [digest, setDigest] = React.useState(() => { try { return { enabled: true, day: 'Monday', recipients: ['mschreiber@msaconsultinginc.com'], ...(JSON.parse(localStorage.getItem(DIGEST_KEY)) || {}) }; } catch (e) { return { enabled: true, day: 'Monday', recipients: ['mschreiber@msaconsultinginc.com'] }; } });
  const [digestOpen, setDigestOpen] = React.useState(false);
  const [newRcpt, setNewRcpt] = React.useState('');
  const saveDigest = (next) => { setDigest(next); try { localStorage.setItem(DIGEST_KEY, JSON.stringify(next)); } catch (e) {} };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className={`toggle-pill ${digest.enabled ? 'on' : ''}`} style={{ height: 28, fontSize: 12, opacity: canWrite ? 1 : 0.6, pointerEvents: canWrite ? 'auto' : 'none' }} onClick={() => saveDigest({ ...digest, enabled: !digest.enabled })}>
          <span className="sw"></span>Weekly workload digest {digest.enabled ? 'on' : 'off'}
        </div>
        {digest.enabled && (
          <>
            <select className="select" style={{ width: 'auto', height: 28, fontSize: 12 }} disabled={!canWrite} value={digest.day} onChange={e => saveDigest({ ...digest, day: e.target.value })}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d}>{d}</option>)}
            </select>
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>to {digest.recipients.join(', ')}</span>
            {canWrite && (
              <span style={{ display: 'inline-flex', gap: 6 }}>
                <input className="input" style={{ height: 28, fontSize: 11.5, width: 190 }} placeholder="add@msaconsultinginc.com" value={newRcpt} onChange={e => setNewRcpt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && /^\S+@\S+\.\S+$/.test(newRcpt.trim()) && !digest.recipients.includes(newRcpt.trim())) { saveDigest({ ...digest, recipients: [...digest.recipients, newRcpt.trim()] }); setNewRcpt(''); } }} />
                {digest.recipients.length > 1 && <button className="btn btn-ghost btn-sm" style={{ height: 28 }} onClick={() => saveDigest({ ...digest, recipients: digest.recipients.slice(0, 1) })}>Reset</button>}
              </span>
            )}
          </>
        )}
        <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setDigestOpen(true)}>Preview digest</button>
      </div>

      <div className={`modal-backdrop ${digestOpen ? 'open' : ''}`} onClick={() => setDigestOpen(false)}>
        {digestOpen && (
          <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-hd">
              <div><h3>Weekly workload digest</h3><div className="m-sub">Sends every {digest.day} morning</div></div>
              <button className="modal-close" onClick={() => setDigestOpen(false)}><Icon name="x" /></button>
            </div>
            <div className="modal-body">
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 12 }}>
                  <div><span style={{ color: 'var(--ink-3)' }}>From:</span> alerts@msaconsultinginc.com</div>
                  <div><span style={{ color: 'var(--ink-3)' }}>To:</span> {digest.recipients.join(', ')}</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>Dry Utility workload digest — week of {fmt(TODAY)}</div>
                </div>
                <div style={{ padding: 16, fontSize: 13, lineHeight: 1.6 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 12 }}>
                    <thead><tr style={{ textAlign: 'left', color: 'var(--ink-3)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}><th style={{ padding: '4px 8px 4px 0' }}>Person</th><th style={{ padding: '4px 8px' }}>Open</th><th style={{ padding: '4px 8px' }}>Capacity</th><th style={{ padding: '4px 8px' }}>Overdue</th><th style={{ padding: '4px 0' }}>Status</th></tr></thead>
                    <tbody>
                      {rows.map(r => {
                        const cap = capOf(r.u.id);
                        const over = r.tasks.length > cap;
                        return (
                          <tr key={r.u.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{r.u.name}</td>
                            <td className="mono" style={{ padding: '5px 8px' }}>{r.tasks.length}</td>
                            <td className="mono" style={{ padding: '5px 8px' }}>{cap}</td>
                            <td className="mono" style={{ padding: '5px 8px', color: r.overdue > 0 ? 'var(--warn)' : 'var(--ink-3)' }}>{r.overdue}</td>
                            <td style={{ padding: '5px 0' }}>{over ? <b style={{ color: 'var(--warn)' }}>+{r.tasks.length - cap} over capacity</b> : r.tasks.length === cap ? <b style={{ color: 'var(--amber)' }}>at capacity</b> : 'ok'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {visibleSuggestions.length > 0 && (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>Suggested moves</div>
                      <ul style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: 12.5 }}>
                        {visibleSuggestions.map(s => <li key={s.id}>{s.t.name} ({s.p.name}): {s.from.name.split(' ')[0]} → {s.to.name.split(' ')[0]}</li>)}
                      </ul>
                    </>
                  )}
                  <div style={{ marginTop: 6 }}><span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>Open Team page</span></div>
                </div>
              </div>
            </div>
            <div className="modal-ft" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setDigestOpen(false)}>Close</button>
              <button className="btn btn-primary" disabled={!canWrite} onClick={() => { setDigestOpen(false); showToast && showToast(`Test digest sent to ${digest.recipients.length} recipient${digest.recipients.length > 1 ? 's' : ''}`); }}>Send test email</button>
            </div>
          </div>
        )}
      </div>
      {(() => {
        const over = rows.filter(r => r.tasks.length > capOf(r.u.id));
        const at = rows.filter(r => r.tasks.length === capOf(r.u.id));
        if (!over.length && !at.length) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {over.length > 0 && (
              <div className="callout crit" style={{ margin: 0 }}>
                <Icon name="alert" size={16} />
                <div><b>Over capacity:</b> {over.map(r => `${r.u.name} (${r.tasks.length}/${capOf(r.u.id)})`).join(', ')} — {visibleSuggestions.length > 0 ? 'see rebalancing suggestions below.' : 'no teammate currently has headroom to absorb the overflow.'}</div>
              </div>
            )}
            {at.length > 0 && (
              <div className="callout warn" style={{ margin: 0 }}>
                <Icon name="clock" size={16} />
                <div><b>At capacity:</b> {at.map(r => `${r.u.name} (${r.tasks.length}/${capOf(r.u.id)})`).join(', ')} — any new assignment will trigger an over-capacity warning.</div>
              </div>
            )}
          </div>
        );
      })()}
      {visibleSuggestions.length > 0 && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-hd">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--amber)' }}><Icon name="alert" size={14} /></span>Rebalancing suggestions</h2>
            <span className="meta">{visibleSuggestions.length} suggested move{visibleSuggestions.length === 1 ? '' : 's'} to bring everyone under capacity</span>
          </div>
          {visibleSuggestions.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', fontSize: 12.5, flexWrap: 'wrap' }}>
              <span className="util-tag util-iid mono">{AGENCIES[s.t.agency]?.short || s.t.agency}</span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.t.name}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>{s.p.name}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto', color: 'var(--ink-2)' }}>
                <b>{s.from.name.split(' ')[0]}</b> → <b>{s.to.name.split(' ')[0]}</b>
              </span>
              {canWrite && <button className="btn btn-primary btn-sm" onClick={() => onTaskAssign(s.p.id, s.t._key, s.to.id)}>Reassign</button>}
              <button className="btn btn-ghost btn-sm" onClick={() => setDismissed(d => [...d, s.id])}>Dismiss</button>
            </div>
          ))}
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink-4)' }}>Suggestions move the least-urgent tasks (unscheduled or furthest due date; resubmittals excluded) from people over their capacity to teammates with headroom.</div>
        </div>
      )}
      <div className="grid-wrap">
        <table className="grid">
          <thead><tr><th style={{ width: 220 }}>Team member</th><th>Open load vs capacity</th><th style={{ width: 110 }}>Capacity</th><th style={{ width: 90 }}>Overdue</th><th style={{ width: 90 }}>Due 7d</th><th style={{ width: 90 }}>Resubmit</th><th style={{ width: 90 }}>Projects</th><th style={{ width: 60 }}></th></tr></thead>
          <tbody>
            {rows.map((r, ri) => (
              <React.Fragment key={r.u.id}>
                <tr className="row-main" onClick={() => setExpandedUser(expandedUser === r.u.id ? null : r.u.id)}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                      <span className="avatar" style={{ width: 26, height: 26, background: avatarColors[ri % avatarColors.length], fontSize: 10, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600 }}>{r.u.initials}</span>
                      <span>
                        <span style={{ fontWeight: 600, color: 'var(--ink)', display: 'block', fontSize: 13 }}>{r.u.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.u.title}</span>
                      </span>
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const cap = capOf(r.u.id);
                      const over = r.tasks.length > cap;
                      const pct = Math.min(100, (r.tasks.length / cap) * 100);
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 320 }}>
                          <span style={{ flex: 1, height: 9, background: 'var(--surface-3)', borderRadius: 100, overflow: 'hidden', position: 'relative' }}>
                            <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 100, background: over ? 'var(--warn)' : r.overdue > 0 ? 'var(--amber)' : 'var(--primary)', opacity: 0.85 }}></span>
                          </span>
                          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', color: over ? 'var(--warn)' : 'var(--ink)' }}>{r.tasks.length}/{cap}</span>
                          {over && <span className="days-chip crit" style={{ flexShrink: 0 }}>+{r.tasks.length - cap} over</span>}
                        </span>
                      );
                    })()}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {canWrite ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <button className="btn btn-sm btn-icon" style={{ width: 22, height: 22 }} onClick={() => setCap(r.u.id, capOf(r.u.id) - 1)}>−</button>
                        <span className="mono" style={{ fontSize: 12.5, width: 20, textAlign: 'center' }}>{capOf(r.u.id)}</span>
                        <button className="btn btn-sm btn-icon" style={{ width: 22, height: 22 }} onClick={() => setCap(r.u.id, capOf(r.u.id) + 1)}>+</button>
                      </span>
                    ) : <span className="mono" style={{ fontSize: 12.5 }}>{capOf(r.u.id)}</span>}
                  </td>
                  <td>{r.overdue > 0 ? <span className="days-chip crit">{r.overdue}</span> : <span style={{ color: 'var(--ink-4)' }}>—</span>}</td>
                  <td>{r.dueSoon > 0 ? <span className="days-chip warn">{r.dueSoon}</span> : <span style={{ color: 'var(--ink-4)' }}>—</span>}</td>
                  <td>{r.resubmit > 0 ? <span className="badge b-amber"><span className="badge-dot"></span>{r.resubmit}</span> : <span style={{ color: 'var(--ink-4)' }}>—</span>}</td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{r.projects}</td>
                  <td style={{ textAlign: 'right', color: 'var(--ink-4)', fontSize: 11 }}>{expandedUser === r.u.id ? '⌃' : '⌄'}</td>
                </tr>
                {expandedUser === r.u.id && (
                  <tr className="detail-row"><td colSpan="8" style={{ background: 'var(--bg)', padding: 0 }}>
                    <div style={{ padding: '10px 16px 14px' }}>
                      {r.tasks.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-4)', padding: '8px 0' }}>No open tasks. ✓</div>}
                      {r.tasks.map(({ p, t, implicit }, i) => {
                        const m = SUB_META[t.status];
                        const overdue = t.due && daysBetween(t.due, TODAY) > 0;
                        return (
                          <div key={i} className="row-main" onClick={(e) => { e.stopPropagation(); onOpenProject(p.id); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer', fontSize: 12.5 }}>
                            <span className="util-tag util-iid mono">{AGENCIES[t.agency]?.short || t.agency}</span>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{t.name}</span>
                            <span style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>{p.name}</span>
                            {implicit && <span className="badge b-gray" style={{ fontSize: 9.5 }} title="Not explicitly assigned — falls to this user as project PM">via PM</span>}
                            <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                              {t.due && <span className="mono" style={{ fontSize: 11.5, color: overdue ? 'var(--warn)' : 'var(--ink-3)', fontWeight: overdue ? 600 : 400 }}>due {fmtShort(t.due)}{overdue ? ` · ${daysBetween(t.due, TODAY)}d late` : ''}</span>}
                              <span className={`badge ${m.badge}`}><span className="badge-dot"></span>{m.label}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ink-4)' }}>Open load = unapproved tasks either assigned to the person or unassigned on projects they PM. Capacity is each person's open-task limit — bars turn red past it. Click a row to see the task list.</div>
    </div>
  );
}

Object.assign(window, { TeamPage });
