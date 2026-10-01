// Blueprint — Utility Research page: every letter across every project, one view.
function ResearchPage({ projects, onOpenProject }) {
  const [filter, setFilter] = React.useState('all'); // all | waiting | overdue | received | noresp
  const [q, setQ] = React.useState('');
  const rows = React.useMemo(() => {
    const out = [];
    projects.forEach(p => {
      (typeof getResearchRows === 'function' ? getResearchRows(p) : []).forEach(r => {
        out.push({ p, r, days: daysBetween(r.sent, TODAY) });
      });
    });
    const res = (x) => (x.r.received || x.r.noResponse) ? 1 : 0;
    return out.sort((a, b) => res(a) - res(b) || b.days - a.days);
  }, [projects]);
  const waiting = rows.filter(x => !x.r.received && !x.r.noResponse);
  const overdue = waiting.filter(x => x.days > 45);
  const received = rows.filter(x => x.r.received);
  const noResp = rows.filter(x => x.r.noResponse && !x.r.received);
  const shown = rows.filter(x => {
    if (filter === 'waiting' && (x.r.received || x.r.noResponse)) return false;
    if (filter === 'overdue' && (x.r.received || x.r.noResponse || x.days <= 45)) return false;
    if (filter === 'received' && !x.r.received) return false;
    if (filter === 'noresp' && !(x.r.noResponse && !x.r.received)) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!(x.p.name.toLowerCase().includes(s) || x.p.code.toLowerCase().includes(s) || x.r.label.toLowerCase().includes(s) || (AGENCIES[x.r.agency]?.name || '').toLowerCase().includes(s))) return false;
    }
    return true;
  });
  const KPI = ({ n, lab, tint, color, icon, id }) => (
    <button className={`kpi clickable ${filter === id ? 'kpi-active' : ''}`} style={filter === id ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' } : null} onClick={() => setFilter(filter === id ? 'all' : id)}>
      <div className="k-ic" style={{ background: tint, color }}><Icon name={icon} size={16} /></div>
      <div><div className="k-val">{n}</div><div className="k-lab">{lab}</div></div>
    </button>
  );
  return (
    <div>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <KPI id="all" n={rows.length} lab="Letters sent" tint="var(--primary-tint)" color="var(--primary)" icon="file" />
        <KPI id="waiting" n={waiting.length} lab="Awaiting response" tint="var(--amber-tint)" color="var(--amber)" icon="clock" />
        <KPI id="overdue" n={overdue.length} lab="Waiting 45+ days" tint="var(--warn-tint)" color="var(--warn)" icon="alert" />
        <KPI id="received" n={received.length} lab="Responses received" tint="var(--ok-tint, rgba(22,163,74,0.08))" color="var(--ok)" icon="check" />
        <KPI id="noresp" n={noResp.length} lab="No response" tint="var(--gray-tint)" color="var(--ink-3)" icon="x" />
      </div>
      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects, utilities, agencies…" />
        </div>
        <div className="toolbar-spacer"></div>
        <span className="meta" style={{ fontSize: 12, color: 'var(--ink-4)' }}>{shown.length} of {rows.length} letters</span>
      </div>
      <div className="grid-wrap">
        <div className="grid-scroll">
          <table className="grid">
            <thead><tr><th className="col-project">Project</th><th>Utility</th><th>Agency</th><th>Method</th><th>Sent</th><th>Status</th><th>Received</th></tr></thead>
            <tbody>
              {shown.map(({ p, r, days }, i) => {
                const a = AGENCIES[r.agency];
                return (
                  <tr key={i} className="row-main" style={{ cursor: 'pointer', opacity: r.noResponse && !r.received ? 0.72 : 1 }} onClick={() => onOpenProject(p.id)}>
                    <td className="col-project">
                      <div className="proj-info">
                        <div className="proj-name">{p.name}</div>
                        <div className="proj-code">{p.code} · {p.client}</div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.label}</td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>{a && <span className="util-tag util-iid mono">{a.short}</span>}<span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{r.agency === 'cvwd' ? 'CVWD online portal' : r.to}</span></span></td>
                    <td><span className={`badge ${r.agency === 'cvwd' ? 'b-blue' : 'b-gray'}`} style={{ fontSize: 10 }}>{r.agency === 'cvwd' ? 'Portal' : 'Email'}</span></td>
                    <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtShort(r.sent)}</td>
                    <td><span className={`badge ${r.received ? 'b-ok' : r.noResponse ? 'b-gray' : days > 45 ? 'b-warn' : 'b-amber'}`}><span className="badge-dot"></span>{r.received ? 'Received' : r.noResponse ? 'No response' : `Waiting · ${days}d`}</span></td>
                    <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{r.received ? fmtShort(r.received) : '—'}</td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan="7" style={{ padding: 18, color: 'var(--ink-4)' }}>No letters match. Research letters are generated from each project's Utility Research module.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ResearchPage });
