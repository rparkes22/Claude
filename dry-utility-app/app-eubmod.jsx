// Blueprint — Existing Utility Plan module.
// Follows Utility Research: plot each responding agency's facilities onto the
// project base map. Per-utility plot status + overall deliverable stage.
// Responsibility: Michael Schreiber (Dry Utility Manager).

const EUBM_KEY = 'msa_app_eubmod_v1';
function eubLoad() { try { return JSON.parse(localStorage.getItem(EUBM_KEY)) || {}; } catch (e) { return {}; } }
function eubPersist(d) { try { localStorage.setItem(EUBM_KEY, JSON.stringify(d)); } catch (e) {} window.dispatchEvent(new Event('msa-eub-updated')); }

const EUB_STAGES = ['Compiling records', 'Drafting base', 'Internal QC', 'Issued'];
const EUB_PLOT = {
  todo: { label: 'Not started', badge: 'b-gray' },
  prog: { label: 'Plotting', badge: 'b-amber' },
  done: { label: 'Plotted', badge: 'b-ok' },
  na: { label: 'No facilities', badge: 'b-gray' },
};

function EubModule({ p, canWrite }) {
  const [rev, bump] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    window.addEventListener('msa-research-updated', bump);
    return () => window.removeEventListener('msa-research-updated', bump);
  }, []);
  const all = eubLoad();
  const st = all[p.id] || { stage: 0, plots: {}, issued: null };
  const save = (next) => { eubPersist({ ...all, [p.id]: next }); bump(); };

  const rows = (typeof getResearchRows === 'function' ? getResearchRows(p) : []);
  let jur = {}; try { jur = (JSON.parse(localStorage.getItem('msa_app_jurisdiction_v1')) || {})[p.id] || {}; } catch (e) {}
  const sources = rows.map(r => {
    // nothing to plot when the agency reported no facilities or never responded
    const none = jur[r.id] === 'none' || r.noResponse;
    return { r, none, plot: none ? 'na' : (st.plots[r.id] || 'todo') };
  });
  const plottable = sources.filter(s => !s.none);
  const plotted = plottable.filter(s => s.plot === 'done').length;
  const researchDone = rows.length > 0 && rows.every(r => r.received || r.noResponse);

  const setPlot = (r, val) => { if (!canWrite) return; save({ ...st, plots: { ...st.plots, [r.id]: val } }); };
  const setStage = (i) => {
    if (!canWrite) return;
    save({ ...st, stage: i, issued: i === EUB_STAGES.length - 1 ? (st.issued || TODAY.toISOString().slice(0, 10)) : null });
  };

  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Existing Utility Plan <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-4)' }}>— plot responses onto the base map</span></h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="meta">{plottable.length ? `${plotted}/${plottable.length} plotted` : 'awaiting research'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-3)' }}><span style={{ width: 18, height: 18, fontSize: 8.5, borderRadius: '50%', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'inline-grid', placeItems: 'center', fontWeight: 700 }}>MS</span>Michael Schreiber</span>
        </div>
      </div>
      {!researchDone && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--amber-tint)', fontSize: 12, color: 'var(--amber-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ProjIcon name="clock" size={13} />
          <span><b>Utility Research still in progress</b> — {rows.filter(r => !r.received && !r.noResponse).length} response{rows.filter(r => !r.received && !r.noResponse).length === 1 ? '' : 's'} outstanding. Facilities can be plotted as responses arrive.</span>
        </div>
      )}
      {/* deliverable stage stepper */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
        {EUB_STAGES.map((s, i) => {
          const on = i <= st.stage;
          const cur = i === st.stage;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setStage(i)} disabled={!canWrite} style={{ font: 'inherit', cursor: canWrite ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 12px', borderRadius: 100, border: cur ? '1px solid var(--primary)' : '1px solid ' + (on ? 'var(--ok)' : 'var(--border)'), background: cur ? 'var(--primary-tint)' : on ? 'var(--ok-tint, rgba(22,163,74,0.07))' : 'var(--surface)', color: cur ? 'var(--primary)' : on ? 'var(--ok)' : 'var(--ink-4)', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {on && !cur && <ProjIcon name="check" size={10} />}{s}{i === EUB_STAGES.length - 1 && st.issued ? ` · ${fmtShort(st.issued)}` : ''}
              </button>
              {i < EUB_STAGES.length - 1 && <span style={{ width: 16, height: 1, background: 'var(--border-strong)' }}></span>}
            </div>
          );
        })}
      </div>
      {/* per-utility plot log */}
      {sources.length === 0 ? (
        <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)' }}>No research letters yet — the base map is built from agency research responses. Add the Utility Research module first.</div>
      ) : (
        <table className="sub-table" style={{ width: '100%' }}>
          <thead><tr><th style={{ paddingLeft: 16 }}>Utility</th><th>Records</th><th>Plot status</th></tr></thead>
          <tbody>
            {sources.map(({ r, none, plot }) => {
              const m = EUB_PLOT[plot];
              return (
                <tr key={r.id} style={none ? { opacity: 0.55 } : null}>
                  <td style={{ paddingLeft: 16, fontWeight: 600, color: 'var(--ink)' }}>{r.label}</td>
                  <td>{r.received ? <span className="badge b-ok" style={{ fontSize: 10 }}><span className="badge-dot"></span>Received {fmtShort(r.received)}</span> : r.noResponse ? <span className="badge b-gray" style={{ fontSize: 10 }}><span className="badge-dot"></span>No response</span> : <span className="badge b-amber" style={{ fontSize: 10 }}><span className="badge-dot"></span>Awaiting response</span>}</td>
                  <td>
                    {none ? <span className="badge b-gray" style={{ fontSize: 10 }}>{r.noResponse ? "No response — N/A" : "No facilities — N/A"}</span>
                      : canWrite ? (
                        <select className="select" style={{ width: 130, height: 26, fontSize: 11.5, paddingLeft: 8, fontWeight: 600, color: plot === 'done' ? 'var(--ok)' : plot === 'prog' ? 'var(--amber)' : 'var(--ink-3)' }} value={plot} onChange={e => setPlot(r, e.target.value)} disabled={!r.received && plot === 'todo' && false}>
                          <option value="todo">Not started</option>
                          <option value="prog">Plotting</option>
                          <option value="done">Plotted</option>
                        </select>
                      ) : <span className={`badge ${m.badge}`}><span className="badge-dot"></span>{m.label}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

Object.assign(window, { EubModule, eubLoad, EUB_STAGES });
