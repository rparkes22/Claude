// Dry Utility App — dedicated project page.
// One full page per project: services grouped by agency, WSL, due diligence, reporting.

function ProjIcon({ name, size = 14 }) {
  const p = {
    back: 'M10 3L5 8l5 5',
    check: 'M3 8l3 3 7-7',
    x: 'M3 3l10 10M13 3L3 13',
    pin: 'M8 14s5-5 5-9a5 5 0 1 0-10 0c0 4 5 9 5 9zm0-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    building: 'M3 14V3h6v11M9 6h4v8M5 5h2M5 8h2M5 11h2M11 8h0M11 11h0M2 14h13',
    clock: 'M8 4v4l2.5 1.5M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z',
    refresh: 'M13 7a5 5 0 1 0-1 4m1 1V9h-3',
    report: 'M3 2h7l3 3v9H3V2zm7 0v3h3M5.5 8h5M5.5 11h3',
    alert: 'M8 2l6 11H2L8 2zM8 7v3M8 12h0',
    lock: 'M4 7V5a4 4 0 0 1 8 0v2M3 7h10v7H3V7z',
    print: 'M5 6V2h6v4M5 12H3V7h10v5h-2M5 10h6v4H5v-4z',
    user: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 14a6 6 0 0 1 12 0',
    clip: 'M13 7l-5.2 5.2a3 3 0 0 1-4.2-4.2L9 2.6a2 2 0 0 1 2.8 2.8L6.6 10.6a1 1 0 0 1-1.4-1.4L10 4.4',
    edit: 'M11.5 2.5a1.4 1.4 0 0 1 2 2L6 12l-2.7.7L4 10l7.5-7.5z',
    file: 'M4 2h5l3 3v9H4V2zm5 0v3h3',
    download: 'M8 2v8m0 0l3-3m-3 3L5 7M2 13h12',
  }[name];
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={p} /></svg>;
}

// ---- edit project info modal ----
function InfoFld({ label, value, onChange, ph, onEnter }) {
  return (
    <div className="field" style={{ marginBottom: 10 }}>
      <label>{label}</label>
      <input className="input" style={{ height: 32, fontSize: 12.5 }} placeholder={ph || ''} value={value} onChange={onChange} onKeyDown={e => { if (e.key === 'Enter') onEnter(); }} />
    </div>
  );
}
function InfoEditModal({ p, onClose, onSave, onDelete }) {
  const [f, setF] = React.useState({ code: p.code, name: p.name, client: p.client, street: p.location.street, city: p.location.city, state: p.location.state, zip: p.location.zip, utility: p.utility || '', apn: p.apn || '', mapRef: p.mapRef || '', acreage: p.acreage || '', contractDate: p.contractDate || '' });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const valid = f.code.trim() && f.name.trim() && f.client.trim();
  const save = () => {
    if (!valid) return;
    onSave({ code: f.code.trim(), name: f.name.trim(), client: f.client.trim(), utility: f.utility.trim(), apn: f.apn.trim(), mapRef: f.mapRef.trim(), acreage: f.acreage.trim(), contractDate: f.contractDate || null, location: { street: f.street.trim(), city: f.city.trim(), state: f.state.trim(), zip: f.zip.trim() } });
  };
  const F = (k, label, ph) => <InfoFld label={label} ph={ph} value={f[k]} onChange={set(k)} onEnter={save} />;
  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div><h3>Edit project info</h3><div className="m-sub">{p.code} · {p.name}</div></div>
          <button className="btn btn-icon" onClick={onClose}><ProjIcon name="x" /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0 10px' }}>
            {F('code', 'Project number', 'e.g. 2913.001')}
            {F('name', 'Project name')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 10px' }}>
            {F('client', 'Client')}
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Primary utility</label>
              <select className="select" style={{ height: 32, fontSize: 12.5 }} value={f.utility} onChange={set('utility')}>
                <option value="IID">IID</option><option value="SCE">SCE</option>
              </select>
            </div>
          </div>
          {F('street', 'Street address')}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 100px', gap: '0 10px' }}>
            {F('city', 'City')}
            {F('state', 'State')}
            {F('zip', 'ZIP')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 10px' }}>
            {F('apn', 'APN (optional)', 'e.g. 600-340-041')}
            {F('mapRef', 'Map ref (optional)', 'e.g. TB 5470-D4')}
            {F('acreage', 'Acreage (optional)', 'e.g. 24.5 ac')}
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Contract executed</label>
              <input type="date" className="input" style={{ width: '100%', height: 34, fontSize: 13 }} value={f.contractDate} onChange={set('contractDate')} />
            </div>
          </div>
          <div className="hint" style={{ marginTop: 2 }}>Note: changing the city does not re-run agency selection — manage this project's agencies &amp; tasks from the task list below.</div>
        </div>
        <div className="modal-ft">
          {onDelete && <button className="btn btn-sm" style={{ color: 'var(--warn)', borderColor: 'var(--warn)', marginRight: 'auto' }} onClick={onDelete}><ProjIcon name="x" size={11} />Delete project</button>}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!valid}><ProjIcon name="check" size={13} />Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ---- contracts panel (reference documents per project) ----
function ContractsPanel({ p, canWrite, currentUser }) {
  const CONTRACTS_KEY = 'msa_app_contracts_v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(CONTRACTS_KEY)) || {}; } catch (e) { return {}; } };
  const [all, setAll] = React.useState(load);
  const contracts = all[p.id] || [];
  const persist = (next) => { setAll(next); try { localStorage.setItem(CONTRACTS_KEY, JSON.stringify(next)); } catch (e) {} };

  const [adding, setAdding] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [agency, setAgency] = React.useState(p.agencies[0] || '');
  const [amount, setAmount] = React.useState('');
  const [status, setStatus] = React.useState('draft');
  const [file, setFile] = React.useState(null);
  const fileRef = React.useRef(null);
  const fmtSize = (b) => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b + ' B';

  const onPick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const fallback = () => {
      if (f.size <= 512 * 1024) {
        const r = new FileReader();
        r.onload = () => setFile({ name: f.name, size: f.size, type: f.type, dataUrl: r.result });
        r.readAsDataURL(f);
      } else setFile({ name: f.name, size: f.size, type: f.type });
    };
    if (window.__msaUploadAttachment) {
      window.__msaUploadAttachment(f, p.id).then(up => up ? setFile(up) : fallback());
    } else fallback();
    e.target.value = '';
  };
  const save = () => {
    const t = title.trim();
    if (!t) return;
    const entry = { id: 'c' + Date.now(), title: t, agency, amount: amount.trim(), status, file, by: currentUser ? currentUser.name : '', ts: new Date().toISOString().slice(0, 10) };
    persist({ ...all, [p.id]: [entry, ...contracts] });
    setAdding(false); setTitle(''); setAmount(''); setStatus('draft'); setFile(null);
  };
  const remove = (id) => {
    if (!window.confirm('Remove this contract reference?')) return;
    persist({ ...all, [p.id]: contracts.filter(c => c.id !== id) });
  };
  const CSTAT = { draft: { label: 'Draft', badge: 'b-gray' }, sent: { label: 'Out for signature', badge: 'b-amber' }, executed: { label: 'Executed', badge: 'b-ok' }, paid: { label: 'Paid', badge: 'b-blue' } };

  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Contracts</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="meta">{contracts.length || 'none'}</span>
          {canWrite && !adding && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => setAdding(true)}>+ Add</button>}
        </div>
      </div>
      {adding && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--primary-tint)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="input" autoFocus style={{ height: 30, fontSize: 12.5 }} placeholder="Contract title — e.g. IID Rule 15 agreement #302205" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select className="select" style={{ width: 'auto', flex: 1, minWidth: 100, height: 30, fontSize: 12 }} value={agency} onChange={e => setAgency(e.target.value)}>
              {p.agencies.map(aid => <option key={aid} value={aid}>{AGENCIES[aid]?.short || aid}</option>)}
              <option value="">Other</option>
            </select>
            <input className="input" style={{ height: 30, fontSize: 12, width: 110 }} placeholder="$ amount" value={amount} onChange={e => setAmount(e.target.value)} />
            <select className="select" style={{ width: 'auto', height: 30, fontSize: 12 }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="draft">Draft</option><option value="sent">Out for signature</option><option value="executed">Executed</option><option value="paid">Paid</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><ProjIcon name="clip" size={12} />{file ? 'Replace file' : 'Attach file'}</button>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onPick} />
            {file && <span style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><ProjIcon name="file" size={11} />{file.name} · {fmtSize(file.size)}</span>}
            <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={!title.trim()}>Save</button>
              <button className="btn btn-sm" onClick={() => { setAdding(false); setFile(null); }}>Cancel</button>
            </span>
          </div>
        </div>
      )}
      <div>
        {contracts.length === 0 && !adding && <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)' }}>No contracts on file. {canWrite ? 'Use “+ Add” to log agreements, fee letters, and executed contracts for reference.' : ''}</div>}
        {contracts.map(c => {
          const st = CSTAT[c.status] || CSTAT.draft;
          return (
            <div key={c.id} style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {c.agency && AGENCIES[c.agency] && <span className="util-tag util-iid mono">{AGENCIES[c.agency].short}</span>}
                <span style={{ fontWeight: 600, color: 'var(--ink)', flex: 1, minWidth: 0 }}>{c.title}</span>
                {canWrite && <button className="btn btn-ghost btn-sm" style={{ height: 22, padding: '0 6px', color: 'var(--warn)' }} title="Remove" onClick={() => remove(c.id)}><ProjIcon name="x" size={10} /></button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                <span className={`badge ${st.badge}`}><span className="badge-dot"></span>{st.label}</span>
                {c.amount && <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{c.amount.startsWith('$') ? c.amount : '$' + c.amount}</span>}
                <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'Geist Mono, monospace' }}>{fmtShort(c.ts)}{c.by ? ` · ${c.by}` : ''}</span>
                {c.file && (
                  (c.file.url || c.file.dataUrl)
                    ? <a href={c.file.url || c.file.dataUrl} target={c.file.url ? '_blank' : undefined} rel="noreferrer" download={c.file.url ? undefined : c.file.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}><ProjIcon name="download" size={11} />{c.file.name}</a>
                    : <span title="Stored reference — file too large to embed in prototype" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--ink-3)' }}><ProjIcon name="file" size={11} />{c.file.name}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function AgencyPanel({ agency, tasks, p, canWrite, users, userLoads, currentUser, onTaskUpdate, onTaskRename, onTaskDelete, onTaskSetDue, onTaskAssign, onTaskAdd }) {
  const [adding, setAdding] = React.useState(false);
  const [pickId, setPickId] = React.useState('');
  const [customName, setCustomName] = React.useState('');
  const [editKey, setEditKey] = React.useState(null);
  const [editName, setEditName] = React.useState('');
  const catalog = tasksForAgency(agency.id).filter(ct => !tasks.some(t => t.taskId === ct.id));
  const startAdd = () => { setPickId(catalog[0]?.id || 'custom'); setCustomName(''); setAdding(true); };
  const save = () => {
    let task;
    if (pickId === 'custom') {
      const name = customName.trim();
      if (!name) return;
      task = { agency: agency.id, taskId: 'custom-' + Date.now(), name, status: 'none', date: null };
    } else {
      const ct = catalog.find(c => c.id === pickId);
      if (!ct) return;
      task = { agency: agency.id, taskId: ct.id, name: ct.name, status: 'none', date: null };
    }
    onTaskAdd(p.id, task);
    setAdding(false);
  };
  return (
    <div className="panel">
      <div className="panel-hd">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <ProjIcon name="building" size={14} />{agency.name}
          <span className="util-tag util-iid mono">{agency.short}</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="meta">{agency.kind} · {tasks.filter(t => t.status === 'ok').length}/{tasks.length} approved</span>
          {canWrite && !adding && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={startAdd}>+ Add task</button>}
        </div>
      </div>
      {adding && (
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', background: 'var(--primary-tint)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="select" style={{ width: 'auto', minWidth: 220, height: 30, fontSize: 12.5 }} value={pickId} onChange={e => setPickId(e.target.value)}>
            {catalog.map(ct => <option key={ct.id} value={ct.id}>{ct.name}{ct.days ? ` (${ct.days})` : ''}</option>)}
            <option value="custom">Custom task…</option>
          </select>
          {pickId === 'custom' && (
            <input className="input" style={{ height: 30, fontSize: 12.5, flex: 1, minWidth: 180 }} autoFocus placeholder="Task name" value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} />
          )}
          <button className="btn btn-primary btn-sm" onClick={save} disabled={pickId === 'custom' && !customName.trim()}>Add</button>
          <button className="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      )}
      <div className="grid-scroll">
        <table className="grid">
          <thead><tr><th>Task / service</th><th>Status</th><th>Assignee</th><th>Due</th><th style={{ textAlign: 'right' }}>Last activity</th>{canWrite && <th style={{ width: 64 }}></th>}</tr></thead>
          <tbody>
            {tasks.map((t, i) => {
              const m = SUB_META[t.status];
              return (
                <tr key={t._key || i}>
                  <td style={{ fontWeight: 500, color: 'var(--ink)' }}>
                    {editKey === t._key ? (
                      <input className="input" autoFocus style={{ height: 28, fontSize: 12.5, width: '100%' }} value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { onTaskRename(p.id, t._key, editName); setEditKey(null); } if (e.key === 'Escape') setEditKey(null); }}
                        onBlur={() => { if (editName.trim() && editName.trim() !== t.name) onTaskRename(p.id, t._key, editName); setEditKey(null); }} />
                    ) : t.name}
                  </td>
                  <td>
                    {canWrite ? (
                      <select
                        className="select"
                        style={{ width: 130, height: 28, fontSize: 12, paddingLeft: 8, borderColor: 'var(--border)', color: m.badge === 'b-warn' ? 'var(--warn)' : m.badge === 'b-amber' ? 'var(--amber)' : m.badge === 'b-ok' ? 'var(--ok)' : 'var(--ink-3)', fontWeight: 600 }}
                        value={t.status}
                        onChange={e => onTaskUpdate(p.id, t._key, e.target.value)}
                      >
                        <option value="none">Not started</option>
                        <option value="review">In review</option>
                        <option value="resubmit">Resubmit</option>
                        <option value="ok">Approved</option>
                      </select>
                    ) : (
                      <span className={`badge ${m.badge}`}><span className="badge-dot"></span>{m.label}</span>
                    )}
                  </td>
                  <td>
                    {(() => {
                      const u = users.find(x => x.id === t.assignee);
                      return canWrite ? (
                        <select className="select" style={{ width: 168, height: 28, fontSize: 12, paddingLeft: 8, color: u ? 'var(--ink-2)' : 'var(--ink-4)' }} value={t.assignee || ''} onChange={e => onTaskAssign(p.id, t._key, e.target.value)}>
                          <option value="">Unassigned</option>
                          {users.map(x => {
                            const l = userLoads && userLoads[x.id];
                            const over = l && l.load >= l.cap;
                            return <option key={x.id} value={x.id}>{x.name}{l ? ` — ${l.load}/${l.cap}${over ? ' ⚠ full' : ''}` : ''}</option>;
                          })}
                        </select>
                      ) : u ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <span className="avatar" style={{ width: 20, height: 20, background: 'var(--primary)', fontSize: 8.5, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600 }}>{u.initials}</span>
                          {u.name.split(' ')[0]}
                        </span>
                      ) : <span style={{ color: 'var(--ink-4)' }}>—</span>;
                    })()}
                  </td>
                  <td>
                    {(() => {
                      const overdue = t.due && t.status !== 'ok' && daysBetween(t.due, TODAY) > 0;
                      return canWrite ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <input type="date" className="input" style={{ height: 28, fontSize: 11.5, width: 132, borderColor: overdue ? 'var(--warn)' : 'var(--border)', color: overdue ? 'var(--warn)' : 'var(--ink-2)', fontWeight: overdue ? 600 : 400 }} value={t.due || ''} onChange={e => onTaskSetDue(p.id, t._key, e.target.value)} />
                          {overdue && <span className="badge b-warn" style={{ fontSize: 10 }}>{daysBetween(t.due, TODAY)}d late</span>}
                        </span>
                      ) : t.due ? (
                        <span className="mono" style={{ fontSize: 12, color: overdue ? 'var(--warn)' : 'var(--ink-3)', fontWeight: overdue ? 600 : 400 }}>{fmtShort(t.due)}{overdue ? ` · ${daysBetween(t.due, TODAY)}d late` : ''}</span>
                      ) : <span style={{ color: 'var(--ink-4)' }}>—</span>;
                    })()}
                  </td>
                  <td className="mono" style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-3)' }}>{t.date ? `${fmtShort(t.date)}, ${parseDate(t.date).getFullYear()}` : '—'}</td>
                  {canWrite && (
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px', fontSize: 11 }} title="Rename task" onClick={() => { setEditKey(t._key); setEditName(t.name); }}><ProjIcon name="edit" size={12} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px', color: 'var(--warn)' }} title="Delete task" onClick={() => { if (window.confirm(`Delete “${t.name}” from ${agency.short}?`)) onTaskDelete(p.id, t._key); }}><ProjIcon name="x" size={11} /></button>
                    </td>
                  )}
                </tr>
              );
            })}
            {tasks.length === 0 && <tr><td colSpan={canWrite ? 6 : 5} style={{ color: 'var(--ink-4)' }}>No tasks opened with this agency yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- utility research module (letters → jurisdiction verification log) ----
const RESEARCH_TASK_RE = /utility research|research request/i;
const hasResearchTask = (p) => p.tasks.some(t => RESEARCH_TASK_RE.test(t.name));
function ResearchPanel({ p, canWrite, onGenerate, onEditInfo, onTaskAdd }) {
  const RES_KEY = 'msa_app_research_v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(RES_KEY)) || {}; } catch (e) { return {}; } };
  const [ov, setOv] = React.useState(load); // { projectId: { rowId: receivedDate|null } }
  const persist = (next) => { setOv(next); try { localStorage.setItem(RES_KEY, JSON.stringify(next)); } catch (e) {} };
  const [added, setAdded] = React.useState(() => loadAddedResearch()[p.id] || []);
  React.useEffect(() => {
    const sync = () => setAdded(loadAddedResearch()[p.id] || []);
    window.addEventListener('msa-research-updated', sync);
    return () => window.removeEventListener('msa-research-updated', sync);
  }, [p.id]);
  const removeAdded = (id) => {
    const all = loadAddedResearch();
    persistAddedResearch({ ...all, [p.id]: (all[p.id] || []).filter(r => r.id !== id) });
  };
  const [fu, setFu] = React.useState(() => loadResearchFu()[p.id] || {});
  const logFu = (r) => {
    const all = loadResearchFu();
    const next = { ...all, [p.id]: { ...(all[p.id] || {}), [r.id]: TODAY.toISOString().slice(0, 10) } };
    persistResearchFu(next);
    setFu(next[p.id]);
  };
  const rows = [...(p.research || []), ...added].map(r => {
    const o = ov[p.id] || {};
    return Object.prototype.hasOwnProperty.call(o, r.id) ? { ...r, received: o[r.id] } : r;
  });
  const done = rows.filter(r => r.received).length;
  const researchComplete = rows.length > 0 && done === rows.length;
  // research complete → auto-create the follow-on "Existing Utility Base" task (once)
  const EUB_KEY = 'msa_app_eub_created_v1';
  const eubExists = p.tasks.some(t => /existing utility base/i.test(t.name));
  React.useEffect(() => {
    if (!researchComplete || !canWrite || !onTaskAdd || eubExists) return;
    let created = {}; try { created = JSON.parse(localStorage.getItem(EUB_KEY)) || {}; } catch (e) {}
    if (created[p.id]) return; // was created before (may have been deleted on purpose)
    onTaskAdd(p.id, { agency: null, taskId: 'eub-' + Date.now(), name: 'Existing Utility Base', status: 'none', date: null, assignee: 'u1' });
    created[p.id] = true; try { localStorage.setItem(EUB_KEY, JSON.stringify(created)); } catch (e) {}
  }, [researchComplete, eubExists, canWrite, p.id]);
  // letter format requirements — every research letter needs these fields
  const reqs = [
    { label: 'Project #', val: p.code },
    { label: 'APN', val: p.apn },
    { label: 'Thomas Bros', val: p.mapRef },
    { label: 'Address', val: p.location.street ? `${p.location.street}, ${p.location.city}` : '' },
  ];
  const missing = reqs.filter(r => !r.val);
  // jurisdiction outcomes: after research comes back — has facilities vs. none in area
  const JUR_KEY = 'msa_app_jurisdiction_v1';
  const loadJur = () => { try { return JSON.parse(localStorage.getItem(JUR_KEY)) || {}; } catch (e) { return {}; } };
  const [jur, setJur] = React.useState(loadJur); // { projectId: { rowId: 'has'|'none' } }
  const setJurisdiction = (r, val) => {
    if (!canWrite) return;
    const next = { ...jur, [p.id]: { ...(jur[p.id] || {}), [r.id]: val } };
    setJur(next); try { localStorage.setItem(JUR_KEY, JSON.stringify(next)); } catch (e) {}
  };
  const jurOf = (r) => (jur[p.id] || {})[r.id] || null;
  const catOf = (label) => (label.split(/\(|—|\//)[0] || label).trim();
  const toggle = (r) => {
    if (!canWrite) return;
    const next = { ...ov, [p.id]: { ...(ov[p.id] || {}), [r.id]: r.received ? null : TODAY.toISOString().slice(0, 10) } };
    persist(next);
  };
  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Utility research <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-4)' }}>— jurisdiction verification</span></h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="meta">{rows.length ? `${done}/${rows.length} received${done < rows.length ? ` · ${daysBetween(rows[0].sent, TODAY)}d since letters sent` : ''}` : 'no letters yet'}</span>
          {canWrite && onGenerate && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={onGenerate}>Generate letters</button>}
        </div>
      </div>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
        <ProjIcon name="clock" size={12} />
        <span>Typical duration: <b style={{ color: 'var(--ink-2)' }}>6–8 weeks from contract execution</b>{rows.length > 0 && !researchComplete ? <span className="mono" style={{ marginLeft: 6 }}>· week {Math.max(1, Math.ceil(daysBetween(rows[rows.length - 1].sent, TODAY) / 7))} since letters went out</span> : ''}</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="avatar" style={{ width: 18, height: 18, fontSize: 8.5, borderRadius: '50%', background: 'var(--violet-tint)', color: 'var(--violet)', display: 'inline-grid', placeItems: 'center', fontWeight: 700 }}>DM</span>Letters — Domonique Moreno</span>
      </div>
      {researchComplete && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--ok-tint, rgba(22,163,74,0.07))', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, flexWrap: 'wrap' }}>
          <ProjIcon name="check" size={13} />
          <span><b>Utility Research complete</b> — all {rows.length} responses received.</span>
          <span style={{ color: 'var(--ink-3)' }}>{eubExists ? 'Next task “Existing Utility Base” is on the task list — assigned to Michael Schreiber.' : canWrite ? 'Creating “Existing Utility Base” task for Michael Schreiber…' : 'Next step: Existing Utility Base (Michael Schreiber).'}</span>
        </div>
      )}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 11.5 }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, fontWeight: 700, color: 'var(--ink-4)' }}>Letter fields</span>
        {reqs.map(r => (
          <span key={r.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: r.val ? 'var(--ink-2)' : 'var(--amber-ink)' }}>
            <span className={`badge ${r.val ? 'b-ok' : 'b-amber'}`} style={{ fontSize: 10 }}><span className="badge-dot"></span>{r.label}</span>
            <span className="mono" style={{ fontSize: 11 }}>{r.val || 'missing'}</span>
          </span>
        ))}
        {missing.length > 0 && canWrite && onEditInfo && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={onEditInfo}>Add in project info</button>}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)' }}>No research letters sent yet. {canWrite ? 'Use “Generate letters” to send the standard request to every agency serving this region — the log of who they went to, when, and responses builds here.' : ''}</div>
      ) : (
      <React.Fragment>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 8 }}>Jurisdiction summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 8 }}>
          {rows.map(r => {
            const a = AGENCIES[r.agency];
            const j = jurOf(r);
            const confirmed = r.received && j === 'has';
            const cleared = r.received && j === 'none';
            const pending = !r.received;
            const style = confirmed
              ? { border: '1px solid var(--ok)', background: 'var(--ok-tint, rgba(22,163,74,0.07))' }
              : cleared
                ? { border: '1px dashed var(--border-strong)', background: 'var(--surface-2)', opacity: 0.75 }
                : r.received
                  ? { border: '1px solid var(--blue)', background: 'var(--blue-tint)' }
                  : { border: '1px dashed var(--amber)', background: 'var(--amber-tint)' };
            return (
              <div key={r.id} style={{ borderRadius: 8, padding: '8px 10px', ...style }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)' }}>{catOf(r.label)}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', margin: '2px 0 3px', textDecoration: cleared ? 'line-through' : 'none' }}>{a ? a.short : r.label}</div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: confirmed ? 'var(--ok)' : cleared ? 'var(--ink-4)' : r.received ? 'var(--blue)' : 'var(--amber-ink)' }}>
                  {confirmed ? 'Has facilities' : cleared ? 'None in area' : r.received ? 'Received — outcome?' : `Awaiting · ${daysBetween(r.sent, TODAY)}d`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="task-table" style={{ width: '100%' }}>
          <thead><tr><th style={{ paddingLeft: 16 }}>Utility</th><th>Sent to</th><th>Method</th><th>Letter sent</th><th>Research received</th><th style={{ textAlign: 'right', paddingRight: 16 }}>Letter</th></tr></thead>
          <tbody>
            {rows.map(r => {
              const a = AGENCIES[r.agency];
              const waiting = !r.received;
              const days = daysBetween(r.sent, TODAY);
              return (
                <tr key={r.id}>
                  <td style={{ paddingLeft: 16, fontWeight: 600, color: 'var(--ink)' }}>{r.label}{r.logged && <span className="badge b-teal" style={{ marginLeft: 8, fontSize: 10 }}>logged{r.by ? ` · ${r.by}` : ''}</span>}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>{a && <span className="util-tag util-iid mono">{a.short}</span>}<span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{r.agency === 'cvwd' ? 'CVWD online portal' : r.to}</span></span></td>
                  <td><span className={`badge ${r.agency === 'cvwd' ? 'b-blue' : 'b-gray'}`} style={{ fontSize: 10 }}>{r.agency === 'cvwd' ? 'Portal' : 'Email'}</span></td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{fmtShort(r.sent)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${r.received ? 'b-ok' : days > 45 ? 'b-warn' : 'b-amber'}`}><span className="badge-dot"></span>{r.received ? `Received ${fmtShort(r.received)}` : `Waiting · ${days}d`}</span>
                      {!r.received && fu[r.id] && <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'Geist Mono, monospace' }}>f/u {fmtShort(fu[r.id])}</span>}
                      {canWrite && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 11, padding: '0 7px' }} onClick={() => toggle(r)}>{waiting ? 'Mark received' : 'Undo'}</button>}
                      {canWrite && r.received && (
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                          <button className={`btn btn-sm ${jurOf(r) === 'has' ? 'btn-primary' : 'btn-ghost'}`} style={{ height: 22, fontSize: 10.5, padding: '0 7px' }} title="Agency confirmed facilities / jurisdiction in the area" onClick={() => setJurisdiction(r, jurOf(r) === 'has' ? null : 'has')}>Has facilities</button>
                          <button className={`btn btn-sm ${jurOf(r) === 'none' ? 'btn-primary' : 'btn-ghost'}`} style={{ height: 22, fontSize: 10.5, padding: '0 7px' }} title="Agency confirmed no facilities in the area" onClick={() => setJurisdiction(r, jurOf(r) === 'none' ? null : 'none')}>None</button>
                        </span>
                      )}
                      {canWrite && waiting && daysBetween(fu[r.id] || r.sent, TODAY) >= 30 && <button className="btn btn-sm" style={{ height: 22, fontSize: 11, padding: '0 7px' }} title="Record that you contacted this agency — resets the reminder" onClick={() => logFu(r)}>Log follow-up</button>}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 16, whiteSpace: 'nowrap' }}>
                    {r.file && <a href={r.file} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}><ProjIcon name="file" size={11} />PDF</a>}
                    {r.logged && canWrite && <button className="btn btn-ghost btn-sm" style={{ height: 22, padding: '0 6px', color: 'var(--warn)', marginLeft: 6 }} title="Remove logged letter" onClick={() => removeAdded(r.id)}><ProjIcon name="x" size={10} /></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </React.Fragment>
      )}
      {p.exhibits && p.exhibits.length > 0 && (
        <div style={{ padding: '9px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {p.exhibits.map((x, i) => <a key={i} href={x.file} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}><ProjIcon name="clip" size={12} />{x.name}</a>)}
        </div>
      )}
    </div>
  );
}

// ---- project modules (streamlined: overarching service modules instead of per-agency micro-tasks) ----
const MODULES_KEY = 'msa_app_modules_v1';
function loadModuleOv() { try { return JSON.parse(localStorage.getItem(MODULES_KEY)) || {}; } catch (e) { return {}; } }
function persistModuleOv(m) { try { localStorage.setItem(MODULES_KEY, JSON.stringify(m)); } catch (e) {} }
function getProjectModules(p) {
  const defaults = {
    research: hasResearchTask(p) || (p.research && p.research.length > 0) || (loadAddedResearch()[p.id] || []).length > 0,
    coordination: hasCoordination(p),
    eub: p.tasks.some(t => /existing utility base/i.test(t.name)),
  };
  return { ...defaults, ...(loadModuleOv()[p.id] || {}) };
}
const MODULE_DEFS = [
  { id: 'research', name: 'Utility Research', desc: 'Standardized letters to every agency in the project region to verify jurisdiction — sent log, responses, and jurisdiction summary. Typically 6–8 weeks from contract execution; completion creates the Existing Utility Base task.' },
  { id: 'eub', name: 'Existing Utility Base', desc: 'Plot each agency\u2019s research response onto the project base map — per-utility plot log and deliverable stage through QC to issue. Michael Schreiber.' },
  { id: 'coordination', name: 'Utility Coordination', desc: 'Hand-off tracking between agencies, engineering, and the client — enable only the tracks the project needs: SCE Rule 15 / Rule 16, Gas Co backbone / meters, Frontier, Spectrum.' },
];
function ModulesPanel({ p, modules, canWrite, onToggle }) {
  return (
    <div className="panel">
      <div className="panel-hd"><h2>Modules</h2><span className="meta">{MODULE_DEFS.filter(m => modules[m.id]).length} active</span></div>
      <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {MODULE_DEFS.map(m => {
          const on = modules[m.id];
          return (
            <div key={m.id} style={{ border: on ? '1px solid var(--primary)' : '1px dashed var(--border-strong)', background: on ? 'var(--primary-tint)' : 'var(--surface-2)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', flex: 1 }}>{m.name}</span>
                {on && <span className="badge b-ok" style={{ fontSize: 9.5 }}><span className="badge-dot"></span>active</span>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '4px 0 8px', lineHeight: 1.45 }}>{m.desc}</div>
              {canWrite && (
                on
                  ? <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => { if (window.confirm(`Remove the ${m.name} module from this project? Its log stays saved and comes back if you re-add it.`)) onToggle(m.id, false); }}>Remove module</button>
                  : <button className="btn btn-primary btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => onToggle(m.id, true)}>+ Add to project</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- project tasks panel (user tasks, incl. auto-created follow-ons like Existing Utility Base) ----
// ---- project timeline: contract → research (6–8 wks) → existing utility base → coordination → complete ----
function ProjTimeline({ p, modules }) {
  const rows = getResearchRows(p);
  const firstSent = rows.length ? rows.reduce((m, r) => r.sent < m ? r.sent : m, rows[0].sent) : null;
  const lastRecv = rows.length && rows.every(r => r.received) ? rows.reduce((m, r) => r.received > m ? r.received : m, rows[0].received) : null;
  const contractD = p.contractDate || null;
  const resWeeks = (contractD || firstSent) ? Math.max(1, Math.ceil(daysBetween(contractD || firstSent, lastRecv || TODAY) / 7)) : null;
  const eub = p.tasks.find(t => /existing utility base/i.test(t.name));
  const eubSt = (typeof eubLoad === 'function' ? eubLoad() : {})[p.id];
  const eubIssued = eubSt && eubSt.stage === 3;
  const cm = ((typeof cmLoad === 'function' ? cmLoad() : {})[p.id]?.items) || [];
  const cmOpen = cm.filter(i => !i.closed).length;
  const wd = deriveWsl(p.wsl);
  const stages = [
    { lab: 'Contract executed', state: 'done', sub: contractD ? fmtShort(contractD) : firstSent ? `letters out ${fmtShort(firstSent)}` : 'date not set' },
    modules.research !== false && { lab: 'Utility Research', state: lastRecv ? 'done' : firstSent ? 'active' : 'todo', sub: lastRecv ? `complete · ${resWeeks} wks` : firstSent ? `week ${resWeeks} of 6–8` : '6–8 wks typical', late: !lastRecv && firstSent && resWeeks > 8 },
    { lab: 'Existing Utility Base', state: eubIssued || (eub && eub.status === 'ok') ? 'done' : (eub || eubSt) ? 'active' : 'todo', sub: eubIssued ? `issued${eubSt.issued ? ' ' + fmtShort(eubSt.issued) : ''}` : eubSt ? EUB_STAGES[eubSt.stage] : eub ? SUB_META[eub.status].label : 'follows research' },
    modules.coordination && { lab: 'Utility Coordination', state: cm.length ? (cmOpen ? 'active' : 'done') : 'todo', sub: cm.length ? `${cmOpen} open · ${cm.length - cmOpen} closed` : 'not started' },
    wd && { lab: 'Will Serve', state: wd.state === 'expired' ? 'late' : wd.state === 'ok' ? 'done' : 'active', sub: wd.state === 'expired' ? 'expired' : `${wd.daysLeft}d left`, late: wd.state === 'expired' || wd.state === 'critical' },
    { lab: 'Complete', state: p.phase === 'Complete' ? 'done' : 'todo', sub: p.phase === 'Complete' ? (p.completedOn ? fmtShort(p.completedOn) : 'archived') : p.phase },
  ].filter(Boolean);
  const C = { done: 'var(--ok)', active: 'var(--primary)', todo: 'var(--border-strong)', late: 'var(--warn)' };
  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 16px 12px', overflowX: 'auto' }}>
        {stages.map((s, i) => {
          const col = s.late ? C.late : C[s.state];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flex: i < stages.length - 1 ? 1 : 'none' }}>
              <div style={{ paddingRight: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: s.state === 'todo' ? 'var(--surface)' : col, border: `2px solid ${col}`, display: 'grid', placeItems: 'center', color: 'white' }}>{s.state === 'done' && !s.late && <ProjIcon name="check" size={7} />}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.state === 'todo' ? 'var(--ink-4)' : 'var(--ink)', whiteSpace: 'nowrap' }}>{s.lab}</span>
                </div>
                <div style={{ fontSize: 10.5, color: s.late ? 'var(--warn)' : 'var(--ink-4)', fontWeight: s.late ? 700 : 400, marginTop: 3, paddingLeft: 18, whiteSpace: 'nowrap' }}>{s.sub}</div>
              </div>
              {i < stages.length - 1 && <span style={{ flex: 1, height: 2, background: s.state === 'done' ? C.done : 'var(--border)', margin: '5px 8px 0', minWidth: 12 }}></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjTasksPanel({ p, canWrite, users, userLoads, onTaskUpdate, onTaskRename, onTaskDelete, onTaskSetDue, onTaskAssign, onTaskAdd }) {
  const tasks = p.tasks.filter(t => t.user);
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [editKey, setEditKey] = React.useState(null);
  const [editName, setEditName] = React.useState('');
  const save = () => {
    const n = name.trim();
    if (!n) return;
    onTaskAdd(p.id, { agency: null, taskId: 'custom-' + Date.now(), name: n, status: 'none', date: null });
    setAdding(false); setName('');
  };
  if (!tasks.length && !canWrite) return null;
  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Project tasks</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="meta">{tasks.length ? `${tasks.filter(t => t.status === 'ok').length}/${tasks.length} complete` : 'none'}</span>
          {canWrite && !adding && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => setAdding(true)}>+ Add task</button>}
        </div>
      </div>
      {adding && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--primary-tint)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input" autoFocus style={{ height: 30, fontSize: 12.5, flex: 1 }} placeholder="Task — e.g. Existing Utility Base" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} />
          <button className="btn btn-primary btn-sm" onClick={save} disabled={!name.trim()}>Add</button>
          <button className="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      )}
      {tasks.length === 0 && !adding && <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)' }}>No tasks yet. Completing Utility Research adds “Existing Utility Base” automatically.</div>}
      {tasks.length > 0 && (
        <div style={{ padding: '4px 0' }}>
          {tasks.map((t, i) => {
            const m = SUB_META[t.status];
            const overdue = t.due && t.status !== 'ok' && daysBetween(t.due, TODAY) > 0;
            const u = users.find(x => x.id === t.assignee);
            return (
              <div key={t._key || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: i ? '1px solid var(--border)' : 'none', fontSize: 12.5, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--ink)', flex: 1, minWidth: 140 }}>
                  {editKey === t._key ? (
                    <input className="input" autoFocus style={{ height: 28, fontSize: 12.5, width: '100%' }} value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { onTaskRename(p.id, t._key, editName); setEditKey(null); } if (e.key === 'Escape') setEditKey(null); }}
                      onBlur={() => { if (editName.trim() && editName.trim() !== t.name) onTaskRename(p.id, t._key, editName); setEditKey(null); }} />
                  ) : t.name}
                </span>
                {canWrite ? (
                  <select className="select" style={{ width: 122, height: 28, fontSize: 12, paddingLeft: 8, fontWeight: 600, color: m.badge === 'b-ok' ? 'var(--ok)' : 'var(--ink-3)' }} value={t.status} onChange={e => onTaskUpdate(p.id, t._key, e.target.value)}>
                    <option value="none">Not started</option>
                    <option value="review">In progress</option>
                    <option value="ok">Complete</option>
                  </select>
                ) : <span className={`badge ${m.badge}`}><span className="badge-dot"></span>{m.label}</span>}
                {canWrite ? (
                  <select className="select" style={{ width: 150, height: 28, fontSize: 12, paddingLeft: 8, color: u ? 'var(--ink-2)' : 'var(--ink-4)' }} value={t.assignee || ''} onChange={e => onTaskAssign(p.id, t._key, e.target.value || null)}>
                    <option value="">Unassigned</option>
                    {users.map(x => { const load = userLoads ? userLoads[x.id] : null; return <option key={x.id} value={x.id}>{x.name}{load ? ` (${load.open}${load.cap ? '/' + load.cap : ''})` : ''}</option>; })}
                  </select>
                ) : u && <span className="meta">{u.name}</span>}
                {canWrite ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <input type="date" className="input" style={{ height: 28, fontSize: 11.5, width: 132, borderColor: overdue ? 'var(--warn)' : 'var(--border)', color: overdue ? 'var(--warn)' : 'var(--ink-2)' }} value={t.due || ''} onChange={e => onTaskSetDue(p.id, t._key, e.target.value || null)} />
                    {overdue && <span className="badge b-warn" style={{ fontSize: 10 }}>{daysBetween(t.due, TODAY)}d late</span>}
                  </span>
                ) : t.due && <span className="mono" style={{ fontSize: 11.5, color: overdue ? 'var(--warn)' : 'var(--ink-3)' }}>due {fmtShort(t.due)}</span>}
                {canWrite && (
                  <span style={{ display: 'inline-flex', gap: 2 }}>
                    <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px' }} title="Rename" onClick={() => { setEditKey(t._key); setEditName(t.name); }}><ProjIcon name="edit" size={11} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px', color: 'var(--warn)' }} title="Delete" onClick={() => { if (window.confirm(`Delete task “${t.name}”?`)) onTaskDelete(p.id, t._key); }}><ProjIcon name="x" size={10} /></button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProjectPage({ p, canWrite, currentUser, users, userLoads, onBack, onWslAction, onWslEdit, onTaskUpdate, onTaskRename, onTaskDelete, onTaskSetDue, onTaskAssign, onTaskAdd, onDdUpdate, onPhaseUpdate, onInfoUpdate, onProjectDelete, onGoReport }) {
  const wd = deriveWsl(p.wsl);
  const [letterGenOpen, setLetterGenOpen] = React.useState(false);
  const [infoEditOpen, setInfoEditOpen] = React.useState(false);
  const [, forceResearch] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    window.addEventListener('msa-research-updated', forceResearch);
    return () => window.removeEventListener('msa-research-updated', forceResearch);
  }, []);
  const ddActive = p.dd.filter(d => d.status !== 'na');
  const ddDone = ddActive.filter(d => d.status === 'done').length;

  // ---- notes (persisted per project) ----
  const NOTES_KEY = 'msa_app_notes_v1';
  const loadNotes = () => { try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; } catch (e) { return {}; } };
  const [allNotes, setAllNotes] = React.useState(loadNotes);
  const [draft, setDraft] = React.useState('');
  const [attachments, setAttachments] = React.useState([]); // pending files for the draft
  const fileInputRef = React.useRef(null);
  const notes = allNotes[p.id] || [];
  const fmtSize = (b) => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b + ' B';
  const onPickFiles = (e) => { ingestFiles([...(e.target.files || [])]); e.target.value = ''; };
  const ingestFiles = (files) => {
    if (!files.length) return;
    const mapped = files.map(f => new Promise(res => {
      const fallback = () => {
        // offline fallback: small files as data URLs so previews/downloads survive reload; large files metadata-only
        if (f.size <= 512 * 1024) {
          const r = new FileReader();
          r.onload = () => res({ name: f.name, size: f.size, type: f.type, dataUrl: r.result });
          r.onerror = () => res({ name: f.name, size: f.size, type: f.type });
          r.readAsDataURL(f);
        } else res({ name: f.name, size: f.size, type: f.type });
      };
      // preferred path: upload to Supabase Storage, keep only the public URL
      if (window.__msaUploadAttachment) {
        window.__msaUploadAttachment(f, p.id).then(up => up ? res(up) : fallback());
      } else fallback();
    }));
    Promise.all(mapped).then(list => setAttachments(prev => [...prev, ...list]));
  };
  // drag & drop
  const [dragOver, setDragOver] = React.useState(false);
  const dragDepth = React.useRef(0);
  const onDragEnter = (e) => { e.preventDefault(); dragDepth.current++; setDragOver(true); };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDragLeave = (e) => { e.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (dragDepth.current === 0) setDragOver(false); };
  const onDrop = (e) => { e.preventDefault(); dragDepth.current = 0; setDragOver(false); ingestFiles([...(e.dataTransfer?.files || [])]); };
  const removeAttachment = (i) => setAttachments(prev => prev.filter((_, idx) => idx !== i));
  const addNote = () => {
    const text = draft.trim();
    if (!text && attachments.length === 0) return;
    const next = { ...allNotes, [p.id]: [{ id: 'n' + Date.now(), text, files: attachments, author: currentUser.name, initials: currentUser.initials, ts: new Date().toISOString() }, ...notes] };
    setAllNotes(next);
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(next)); } catch (e) {}
    setDraft(''); setAttachments([]);
  };
  const removeNote = (nid) => {
    const next = { ...allNotes, [p.id]: notes.filter(n => n.id !== nid) };
    setAllNotes(next);
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(next)); } catch (e) {}
  };

  // ---- activity log (derived from project history + notes) ----
  const activity = React.useMemo(() => {
    const ev = [];
    p.tasks.forEach(t => { if (t.user && t.date) ev.push({ ts: t.date, kind: 'task', text: `${t.name} — ${SUB_META[t.status].label}`, tag: t.agency ? (AGENCIES[t.agency]?.short || t.agency) : 'Task' }); });
    if (wd) {
      ev.push({ ts: wd.issued.toISOString(), kind: 'wsl', text: 'Will Serve Letter issued by IID', tag: 'WSL' });
      if (wd.extensionUsed) ev.push({ ts: wd.originalExpiry.toISOString(), kind: 'wsl', text: '6-month extension applied — final expiry set', tag: 'WSL' });
    }
    if (p.sce?.earDate) ev.push({ ts: p.sce.earDate, kind: 'wsl', text: `SCE electrical review — ${p.sce.ear}`, tag: 'SCE' });
    if (p.reporting.lastSent) ev.push({ ts: p.reporting.lastSent, kind: 'report', text: `${p.reporting.cadence} client report sent`, tag: 'RPT' });
    notes.forEach(n => ev.push({ ts: n.ts, kind: 'note', text: n.text, files: n.files || [], author: n.author, initials: n.initials, noteId: n.id }));
    return ev.sort((a, b) => parseDate(b.ts) - parseDate(a.ts));
  }, [p, notes, wd]);

  // tasks grouped by agency, in the project's agency order
  const byAgency = p.agencies.map(aid => ({
    agency: AGENCIES[aid] || { id: aid, name: aid, short: aid, kind: '' },
    tasks: p.tasks.filter(t => t.agency === aid),
  }));

  // active modules (persisted; defaults derived from existing data)
  const [moduleRev, bumpModules] = React.useReducer(x => x + 1, 0);
  const modules = React.useMemo(() => getProjectModules(p), [p, moduleRev]);
  const toggleModule = (id, on) => {
    const ov = loadModuleOv();
    persistModuleOv({ ...ov, [p.id]: { ...(ov[p.id] || {}), [id]: on } });
    bumpModules();
  };

  const fill = !wd ? null : (wd.state === 'expired' || wd.state === 'critical') ? 'var(--warn)' : wd.state === 'warning' ? 'var(--amber)' : 'var(--ok)';
  const todayPos = wd ? Math.max(0, Math.min(100, ((TODAY - wd.issued) / (wd.effectiveExpiry - wd.issued)) * 100)) : 0;
  const canExtend = wd && !wd.extensionUsed && wd.state !== 'expired';

  // WSL date editing
  const [wslEditing, setWslEditing] = React.useState(false);
  const [editIssued, setEditIssued] = React.useState('');
  const [editExt, setEditExt] = React.useState(false);
  const startWslEdit = () => {
    setEditIssued(wd ? wd.issued.toISOString().slice(0, 10) : TODAY.toISOString().slice(0, 10));
    setEditExt(wd ? !!wd.extensionUsed : false);
    setWslEditing(true);
  };
  const saveWslEdit = () => {
    if (!editIssued) return;
    onWslEdit(p.id, { issued: editIssued, extensionUsed: editExt });
    setWslEditing(false);
  };

  return (
    <div>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <button className="btn btn-icon" onClick={onBack} title="Back to dashboard"><ProjIcon name="back" /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em' }}>{p.name}</h2>
            {canWrite ? (
              <select className="select" style={{ width: 'auto', height: 28, fontSize: 12, fontWeight: 600, paddingLeft: 9, paddingRight: 26 }} value={p.phase} onChange={e => onPhaseUpdate(p.id, e.target.value)} title="Project status">
                {PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
              </select>
            ) : (
              <span className={`badge ${PHASE_META[p.phase]?.badge || 'b-gray'}`}><span className="badge-dot"></span>{p.phase}</span>
            )}
            {p.phase === 'Complete' && <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>archived{p.completedOn ? ` ${fmt(p.completedOn)}` : ''} — hidden from dashboard &amp; projects</span>}
            {p.userAdded && <span className="badge b-teal">new</span>}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12.5, color: 'var(--ink-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="mono">{p.code}</span>
            <span>{p.client}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><ProjIcon name="pin" size={12} />{p.location.street}, {p.location.city}, {p.location.state} {p.location.zip}</span>
            <span className={`util-tag util-${(p.utility || '').toLowerCase() === 'sce' ? 'sce' : 'iid'}`}>{p.utility}</span>
            {p.apn && <span className="mono" title="Assessor's Parcel Number">APN {p.apn}</span>}
            {p.mapRef && <span className="mono" title="Thomas Bros. map reference">TB {p.mapRef}</span>}
            {p.acreage && <span>{p.acreage}</span>}
            {p.contractDate && <span title="Contract execution date">Contract {fmtShort(p.contractDate)}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canWrite && <button className="btn btn-icon" title="Edit project info" onClick={() => setInfoEditOpen(true)}><ProjIcon name="edit" size={13} /></button>}
          {canWrite && <button className="btn" onClick={() => setLetterGenOpen(true)}><ProjIcon name="edit" size={13} />Research letters</button>}
          <button className="btn" onClick={onGoReport}><ProjIcon name="report" size={13} />Client report</button>
        </div>
      </div>

      <LetterGenModal p={p} open={letterGenOpen} onClose={() => setLetterGenOpen(false)} currentUser={currentUser} />
      {infoEditOpen && <InfoEditModal p={p} onClose={() => setInfoEditOpen(false)} onSave={(patch) => { onInfoUpdate(p.id, patch); setInfoEditOpen(false); }} onDelete={onProjectDelete ? () => { if (window.confirm(`Delete “${p.name}” (${p.code})? This removes it from all views — tasks, notes, and research history included. This cannot be undone.`)) onProjectDelete(p.id); } : null} />}

      <ProjTimeline p={p} modules={modules} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 16, alignItems: 'start' }}>
        {/* left: modules + DD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <ModulesPanel p={p} modules={modules} canWrite={canWrite} onToggle={toggleModule} />

          {modules.research && <ResearchPanel key={p.id} p={p} canWrite={canWrite} onGenerate={() => setLetterGenOpen(true)} onEditInfo={() => setInfoEditOpen(true)} onTaskAdd={onTaskAdd} />}

          {modules.eub && <EubModule p={p} canWrite={canWrite} />}

          <ProjTasksPanel p={p} canWrite={canWrite} users={users} userLoads={userLoads} onTaskUpdate={onTaskUpdate} onTaskRename={onTaskRename} onTaskDelete={onTaskDelete} onTaskSetDue={onTaskSetDue} onTaskAssign={onTaskAssign} onTaskAdd={onTaskAdd} />

          {modules.coordination && <CoordModule p={p} canWrite={canWrite} currentUser={currentUser} users={users} />}

          <div className="panel">
            <div className="panel-hd"><h2>Notes &amp; activity</h2><span className="meta">{activity.length} entries</span></div>
            <div style={{ padding: '14px 16px 6px' }}>
              {canWrite ? (
                <div style={{ marginBottom: 14 }}
                  onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                >
                  <div style={{ display: 'flex', gap: 8, position: 'relative', borderRadius: 10, outline: dragOver ? '2px dashed var(--primary)' : 'none', outlineOffset: 3, background: dragOver ? 'var(--primary-tint)' : 'transparent', transition: 'background 0.12s' }}>
                    {dragOver && (
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 2, pointerEvents: 'none', borderRadius: 10 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: 'white', padding: '7px 14px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, boxShadow: 'var(--shadow-md)' }}>
                          <ProjIcon name="clip" size={13} />Drop files to attach
                        </span>
                      </div>
                    )}
                    <textarea
                      className="input"
                      style={{ height: 'auto', minHeight: 62, padding: '9px 12px', resize: 'vertical', flex: 1, lineHeight: 1.45 }}
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote(); }}
                      placeholder="Add a note — call summaries, agency conversations, field observations… (⌘↵ to post, drag files anywhere here)"
                    ></textarea>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn" title="Attach files" onClick={() => fileInputRef.current?.click()}><ProjIcon name="clip" size={13} />Attach</button>
                      <button className="btn btn-primary" onClick={addNote} disabled={!draft.trim() && attachments.length === 0}>Post</button>
                    </div>
                    <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={onPickFiles} />
                  </div>
                  {attachments.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {attachments.map((f, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 6px 3px 9px', borderRadius: 100, background: 'var(--primary-tint)', color: 'var(--primary)', fontSize: 11.5, fontWeight: 600 }}>
                          <ProjIcon name="file" size={11} />{f.name}
                          <span style={{ fontWeight: 400, color: 'var(--ink-3)', fontFamily: 'Geist Mono, monospace', fontSize: 10 }}>{fmtSize(f.size)}</span>
                          <button style={{ width: 15, height: 15, borderRadius: '50%', border: 0, background: 'transparent', color: 'var(--primary)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }} onClick={() => removeAttachment(i)} title="Remove"><ProjIcon name="x" size={9} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}><span className="readonly-note"><ProjIcon name="lock" size={11} />Read-only — notes disabled</span></div>
              )}
              <div>
                {activity.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 11, padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                    {ev.kind === 'note'
                      ? <span className="avatar" style={{ width: 24, height: 24, fontSize: 9.5, background: userColor(ev.author || '?'), marginTop: 1 }}>{ev.initials}</span>
                      : <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', flexShrink: 0, marginTop: 1 }}>
                          <ProjIcon name={ev.kind === 'wsl' ? 'clock' : ev.kind === 'report' ? 'report' : ev.kind === 'dd' ? 'check' : 'building'} size={12} />
                        </span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: ev.kind === 'note' ? 'var(--ink)' : 'var(--ink-2)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                        {ev.kind === 'note' && <b style={{ fontWeight: 600 }}>{ev.author} · </b>}{ev.text}
                      </div>
                      {ev.kind === 'note' && ev.files && ev.files.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          {ev.files.map((f, fi) => {
                            const href = f.url || f.dataUrl; // url = Supabase Storage; dataUrl = offline fallback
                            const isImg = href && (f.type || '').startsWith('image/');
                            return isImg ? (
                              <a key={fi} href={href} target={f.url ? '_blank' : undefined} rel="noreferrer" download={f.url ? undefined : f.name} title={`${f.name} · ${fmtSize(f.size)}`} style={{ display: 'block', width: 84, height: 60, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <img src={href} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              </a>
                            ) : (
                              <a key={fi} href={href || '#'} target={f.url ? '_blank' : undefined} rel="noreferrer" download={!f.url && f.dataUrl ? f.name : undefined} onClick={href ? undefined : (e) => e.preventDefault()} title={f.url ? 'Open' : f.dataUrl ? 'Download' : 'Stored reference — file too large to embed in prototype'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>
                                <ProjIcon name="file" size={11} />{f.name}
                                <span style={{ fontWeight: 400, color: 'var(--ink-4)', fontFamily: 'Geist Mono, monospace', fontSize: 10 }}>{fmtSize(f.size)}</span>
                                {href && <ProjIcon name="download" size={10} />}
                              </a>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 2, fontFamily: 'Geist Mono, monospace', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {fmtShort(ev.ts)}, {parseDate(ev.ts).getFullYear()}
                        {ev.tag && <span className="util-tag util-iid" style={{ fontSize: 9 }}>{ev.tag}</span>}
                        {ev.kind === 'note' && <span className="badge b-amber" style={{ fontSize: 9, padding: '0 6px' }}>note</span>}
                        {ev.kind === 'note' && ev.files && ev.files.length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><ProjIcon name="clip" size={10} />{ev.files.length}</span>}
                        {ev.kind === 'note' && canWrite && ev.author === currentUser.name && (
                          <button className="btn btn-ghost" style={{ height: 18, padding: '0 6px', fontSize: 10, color: 'var(--warn)' }} onClick={() => removeNote(ev.noteId)}>delete</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {activity.length === 0 && <div style={{ padding: '14px 0 20px', color: 'var(--ink-4)', fontSize: 12.5 }}>No activity yet.</div>}
              </div>
            </div>
          </div>
        </div>

        {/* right: WSL / SCE + reporting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 74 }}>
          <div className="panel">
            <div className="panel-hd">
              <h2>{wd ? 'Will Serve Letter' : p.utility === 'SCE' ? 'SCE electrical review' : 'Will Serve Letter'}</h2>
              {canWrite && (wd || p.agencies.includes('iid')) && !wslEditing && (
                <button className="btn btn-ghost btn-sm" onClick={startWslEdit}>{wd ? 'Edit dates' : 'Log WSL'}</button>
              )}
            </div>
            <div style={{ padding: 16 }}>
              {wslEditing && (
                <div style={{ border: '1px solid var(--primary)', background: 'var(--primary-tint)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>Issued date</label>
                    <input type="date" className="input" style={{ height: 32, fontSize: 12.5 }} value={editIssued} onChange={e => setEditIssued(e.target.value)} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginBottom: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editExt} onChange={e => setEditExt(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    6-month extension already used
                  </label>
                  {editIssued && (
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 12 }}>
                      Effective expiry: <b className="mono" style={{ color: 'var(--ink)' }}>{fmt(addMonths(addYears(new Date(editIssued + 'T00:00:00'), 1), editExt ? 6 : 0))}</b>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveWslEdit} disabled={!editIssued}><ProjIcon name="check" size={12} />Save</button>
                    <button className="btn btn-sm" onClick={() => setWslEditing(false)}>Cancel</button>
                    {wd && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warn)', marginLeft: 'auto' }} onClick={() => { onWslEdit(p.id, null); setWslEditing(false); }}>Remove WSL</button>}
                  </div>
                </div>
              )}
              {wd ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span className="mono" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: fill }}>{wd.state === 'expired' ? 'DEAD' : wd.daysLeft}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{wd.state === 'expired' ? `expired ${fmtShort(wd.effectiveExpiry)}` : 'days until expiry'}</span>
                  </div>
                  <div className="wsl-bar">
                    <div className="wsl-bar-fill" style={{ width: `${Math.min(todayPos, 100)}%`, background: fill, opacity: 0.4 }}></div>
                    <div className="wsl-bar-today" style={{ left: `${todayPos}%` }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--ink-4)', fontFamily: 'Geist Mono, monospace' }}>
                    <span>{fmtShort(wd.issued)}</span><span>{fmtShort(wd.effectiveExpiry)}</span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div className="kv" style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5, gap: 12 }}><span style={{ color: 'var(--ink-3)', width: 110 }}>Issued</span><span className="mono">{fmt(wd.issued)}</span></div>
                    <div className="kv" style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5, gap: 12 }}><span style={{ color: 'var(--ink-3)', width: 110 }}>Original expiry</span><span className="mono">{fmt(wd.originalExpiry)}</span></div>
                    <div className="kv" style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5, gap: 12 }}><span style={{ color: 'var(--ink-3)', width: 110 }}>Extension</span><span>{wd.extensionUsed ? 'Used (6 mo)' : 'Available (1×)'}</span></div>
                    <div className="kv" style={{ display: 'flex', padding: '6px 0', fontSize: 12.5, gap: 12 }}><span style={{ color: 'var(--ink-3)', width: 110 }}>Effective expiry</span><span className="mono" style={{ color: fill }}>{fmt(wd.effectiveExpiry)}</span></div>
                  </div>
                  {wd.state === 'critical' && wd.extensionUsed && (
                    <div className="callout crit" style={{ marginTop: 12 }}>
                      <ProjIcon name="alert" size={16} />
                      <div><b>No extensions remain.</b> If not complete by {fmt(wd.effectiveExpiry)}, re-application is required (~18 months).</div>
                    </div>
                  )}
                  {(wd.state === 'critical' || wd.state === 'warning') && !wd.extensionUsed && (
                    <div className="callout warn" style={{ marginTop: 12 }}>
                      <ProjIcon name="clock" size={16} />
                      <div><b>Extension available.</b> One 6-month extension can move expiry to {fmt(addMonths(wd.originalExpiry, 6))}.</div>
                    </div>
                  )}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {wd.state === 'expired'
                      ? <button className="btn btn-warn btn-sm" disabled={!canWrite} onClick={() => onWslAction(p.id, 'reapply')}><ProjIcon name="refresh" size={12} />Reapply</button>
                      : canExtend
                        ? <button className="btn btn-primary btn-sm" disabled={!canWrite} onClick={() => onWslAction(p.id, 'extend')}><ProjIcon name="clock" size={12} />Request extension</button>
                        : <button className="btn btn-sm" disabled><ProjIcon name="check" size={12} />No extension available</button>}
                    {!canWrite && <span className="readonly-note"><ProjIcon name="lock" size={11} />Read-only</span>}
                  </div>
                </>
              ) : p.utility === 'SCE' ? (
                <div className="callout info">
                  <ProjIcon name="alert" size={16} />
                  <div><b>No Will Serve Letter required.</b> SCE runs an electrical-analysis review. Status: <b>{p.sce?.ear || 'Not started'}</b>{p.sce?.earDate ? ` (as of ${fmtShort(p.sce.earDate)})` : ''}.</div>
                </div>
              ) : (
                <div className="callout warn">
                  <ProjIcon name="clock" size={16} />
                  <div><b>No WSL on file yet.</b> IID projects require a Will Serve Letter — valid 1 year from issuance, one 6-month extension. {canWrite ? 'Use “Log WSL” above once issued.' : ''}</div>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-hd"><h2>Client reporting</h2></div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge b-blue"><span className="badge-dot"></span>{p.reporting.cadence}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                  {p.reporting.lastSent ? `last sent ${fmtShort(p.reporting.lastSent)}` : 'no report sent yet'}
                </span>
              </div>
              <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={onGoReport}><ProjIcon name="report" size={12} />Open report</button>
            </div>
          </div>

          <ContractsPanel p={p} canWrite={canWrite} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProjectPage, ProjIcon });
