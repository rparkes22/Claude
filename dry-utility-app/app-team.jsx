// Blueprint — Team workload view.
// Per-user open-task load across all active projects, broken down by what is still out
// with an agency awaiting a response, plus per-user task lists.

function TeamPage({ projects, users, canWrite, onTaskAssign, onOpenProject, showToast }) {
  const [expandedUser, setExpandedUser] = React.useState(null);
  const [dismissed, setDismissed] = React.useState([]);
  // No per-person task cap. Load is uneven by design — the division manager carries a
  // large share — so the workload bar is scaled against the busiest person rather than
  // an arbitrary limit, and nobody is flagged "over capacity".

  // task ownership: explicit assignee, else the project's PM (by initials)
  const rows = React.useMemo(() => {
    const byUser = users.map(u => ({ u, tasks: [] }));
    const find = (pred) => byUser.find(pred);
    projects.forEach(p => p.tasks.forEach(t => {
      // one definition of a project task across the app: the ones people create. Retired
      // agency micro-tasks were still counted here while the dashboard and the project
      // panel ignored them, so the same person had two different open loads.
      if (!t.user) return;
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
      // out with an agency and not back yet — the pressure a deadline used to stand in for
      r.awaiting = r.tasks.filter(x => taskState(x.t).awaiting).length;
      r.stale = r.tasks.filter(x => taskState(x.t).stale).length;
      r.resubmit = r.tasks.filter(x => x.t.status === 'resubmit').length;
      r.projects = new Set(r.tasks.map(x => x.p.id)).size;
      r.tasks.sort((a, b) => {
        const od = (x) => taskState(x.t).stale ? 0 : taskState(x.t).awaiting ? 1 : 2;
        if (od(a) !== od(b)) return od(a) - od(b);
        if (a.t.date && b.t.date) return parseDate(a.t.date) - parseDate(b.t.date);
        return 0;
      });
    });
    return byUser.sort((a, b) => b.tasks.length - a.tasks.length);
  }, [projects, users]);

  const maxLoad = Math.max(1, ...rows.map(r => r.tasks.length));
  const avatarColors = ['#1d4e89', '#0f766e', '#6d28d9', '#b45309', '#be185d', '#4d7c0f'];

  // Rebalancing looks at imbalance between people, not at a cap: only suggest a move
  // while the busiest person is carrying meaningfully more than the lightest.
  const SPREAD = 3; // tasks of difference before a move is worth suggesting
  const suggestions = React.useMemo(() => {
    const loads = rows.map(r => ({ u: r.u, n: r.tasks.length, pool: [...r.tasks] }));
    const out = [];
    for (let step = 0; step < 4; step++) {
      loads.sort((a, b) => b.n - a.n);
      const busiest = loads[0];
      const lightest = loads[loads.length - 1];
      if (!busiest || !lightest || busiest.u.id === lightest.u.id) break;
      if (busiest.n - lightest.n < SPREAD) break;
      const candidates = busiest.pool.filter(x => x.t.status !== 'resubmit');
      if (!candidates.length) break;
      candidates.sort((a, b) => {
        if (!a.t.date && b.t.date) return -1;
        if (a.t.date && !b.t.date) return 1;
        if (a.t.date && b.t.date) return parseDate(b.t.date) - parseDate(a.t.date);
        return 0;
      });
      const pick = candidates[0];
      busiest.pool = busiest.pool.filter(x => x !== pick);
      busiest.n--; lightest.n++;
      out.push({ from: busiest.u, to: lightest.u, p: pick.p, t: pick.t, id: `${pick.p.id}|${pick.t._key}` });
    }
    return out;
  }, [rows]);
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

      <div className={`modal-backdrop ${digestOpen ? 'open' : ''}`} onClick={backdropClose(() => setDigestOpen(false))}>
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
                  <div style={{ fontWeight: 600, marginTop: 4 }}>Blueprint workload digest — week of {fmt(TODAY)}</div>
                </div>
                <div style={{ padding: 16, fontSize: 13, lineHeight: 1.6 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 12 }}>
                    <thead><tr style={{ textAlign: 'left', color: 'var(--ink-3)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}><th style={{ padding: '4px 8px 4px 0' }}>Person</th><th style={{ padding: '4px 8px' }}>Open</th><th style={{ padding: '4px 8px' }}>Share</th><th style={{ padding: '4px 0' }}>Awaiting</th></tr></thead>
                    <tbody>
                      {(() => { const total = rows.reduce((n, r) => n + r.tasks.length, 0) || 1; return rows.map(r => {
                        return (
                          <tr key={r.u.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{r.u.name}</td>
                            <td className="mono" style={{ padding: '5px 8px' }}>{r.tasks.length}</td>
                            <td className="mono" style={{ padding: '5px 8px' }}>{Math.round((r.tasks.length / total) * 100)}%</td>
                            <td className="mono" style={{ padding: '5px 0', color: r.stale > 0 ? 'var(--warn)' : 'var(--ink-3)' }}>{r.awaiting}</td>
                          </tr>
                        );
                      }); })()}
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
        const busiest = rows[0];
        const lightest = rows[rows.length - 1];
        if (!busiest || !lightest || !visibleSuggestions.length) return null;
        return (
          <div className="callout warn" style={{ margin: '0 0 14px' }}>
            <Icon name="clock" size={16} />
            <div><b>Uneven load:</b> {busiest.u.name} is carrying {busiest.tasks.length} open task{busiest.tasks.length === 1 ? '' : 's'} against {lightest.u.name}'s {lightest.tasks.length} — see the suggested moves below.</div>
          </div>
        );
      })()}
      {visibleSuggestions.length > 0 && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-hd">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--amber)' }}><Icon name="alert" size={14} /></span>Rebalancing suggestions</h2>
            <span className="meta">{visibleSuggestions.length} suggested move{visibleSuggestions.length === 1 ? '' : 's'} to even out the load</span>
          </div>
          {visibleSuggestions.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', fontSize: 12.5, flexWrap: 'wrap' }}>
              <span className="util-tag util-iid mono">{AGENCIES[s.t.agency]?.short || s.t.agency}</span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.t.name}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 11.5 }}><span className="proj-no">{s.p.code}</span> {s.p.name}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto', color: 'var(--ink-2)' }}>
                <b>{s.from.name.split(' ')[0]}</b> → <b>{s.to.name.split(' ')[0]}</b>
              </span>
              {canWrite && <button className="btn btn-primary btn-sm" onClick={() => onTaskAssign(s.p.id, s.t._key, s.to.id)}>Reassign</button>}
              <button className="btn btn-ghost btn-sm" onClick={() => setDismissed(d => [...d, s.id])}>Dismiss</button>
            </div>
          ))}
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink-4)' }}>Suggestions move the least-urgent tasks (not yet submitted, or most recently submitted; resubmittals excluded) from the busiest person to the lightest, and only while the gap is 3 tasks or more.</div>
        </div>
      )}
      <div className="grid-wrap">
        <table className="grid">
          <thead><tr><th style={{ width: 220 }}>Team member</th><th>Open load</th><th style={{ width: 96 }}>Awaiting</th><th style={{ width: 90 }}>45d+ out</th><th style={{ width: 90 }}>Resubmit</th><th style={{ width: 90 }}>Projects</th><th style={{ width: 60 }}></th></tr></thead>
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
                      // relative to the busiest person, so a heavy load reads as heavy
                      // without implying anyone has exceeded a limit
                      const pct = Math.round((r.tasks.length / maxLoad) * 100);
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 320 }}>
                          <span style={{ flex: 1, height: 9, background: 'var(--surface-3)', borderRadius: 100, overflow: 'hidden', position: 'relative' }}>
                            <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 100, background: r.stale > 0 ? 'var(--amber)' : 'var(--primary)', opacity: 0.85 }}></span>
                          </span>
                          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.tasks.length}</span>
                        </span>
                      );
                    })()}
                  </td>
                  <td>{r.awaiting > 0 ? <span className="days-chip warn">{r.awaiting}</span> : <span style={{ color: 'var(--ink-4)' }}>—</span>}</td>
                  <td>{r.stale > 0 ? <span className="days-chip crit">{r.stale}</span> : <span style={{ color: 'var(--ink-4)' }}>—</span>}</td>
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
                        const st = taskState(t);
                        return (
                          <div key={i} className="row-main" onClick={(e) => { e.stopPropagation(); onOpenProject(p.id); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer', fontSize: 12.5 }}>
                            <span className="util-tag util-iid mono">{AGENCIES[t.agency]?.short || t.agency}</span>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{t.name}</span>
                            <span style={{ color: 'var(--ink-3)', fontSize: 11.5 }}><span className="proj-no">{p.code}</span> {p.name}</span>
                            {implicit && <span className="badge b-gray" style={{ fontSize: 9.5 }} title="Not explicitly assigned — falls to this user as project PM">via PM</span>}
                            <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                              {st.received
                                ? <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>received {fmtShort(st.received)}</span>
                                : st.awaiting
                                  ? <span className="mono" style={{ fontSize: 11.5, color: st.stale ? 'var(--warn)' : 'var(--ink-3)', fontWeight: st.stale ? 600 : 400 }}>out {st.days}d · sent {fmtShort(st.submitted)}</span>
                                  : null}
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
      <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ink-4)' }}>Open load = unapproved tasks either assigned to the person or unassigned on projects they PM. There is no per-person cap — bars are scaled against the busiest person. Click a row to see the task list.</div>
    </div>
  );
}

Object.assign(window, { TeamPage });
