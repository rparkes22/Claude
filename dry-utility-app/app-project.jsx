// Blueprint — dedicated project page.
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

// ---- IID Capacity Study Submittal ----
// Clients often ask for this instead of starting the formal Will Serve process:
// it establishes whether the project is viable, takes about 7 weeks, and does not
// authorise coordination work. A WSL can follow later on the same project.
function CapacityStudyPanel({ p, canWrite, onCapacityEdit, hasWsl }) {
  const cs = deriveCapacityStudy(p.capacityStudy);
  const [editing, setEditing] = React.useState(false);
  const [submitted, setSubmitted] = React.useState('');
  const [received, setReceived] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const start = () => {
    setSubmitted(p.capacityStudy?.submitted || TODAY.toISOString().slice(0, 10));
    setReceived(p.capacityStudy?.received || '');
    setOutcome(p.capacityStudy?.outcome || '');
    setNotes(p.capacityStudy?.notes || '');
    setEditing(true);
  };
  const save = () => {
    if (!submitted) return;
    onCapacityEdit(p.id, { submitted, received: received || null, outcome: outcome || null, notes: notes.trim() || null });
    setEditing(false);
  };
  const OUTCOMES = [
    { id: '', label: 'Not determined' },
    { id: 'capacity', label: 'Capacity available' },
    { id: 'constrained', label: 'Capacity constrained' },
    { id: 'upgrades', label: 'Upgrades required' },
  ];
  const outcomeMeta = { capacity: 'b-ok', constrained: 'b-amber', upgrades: 'b-warn' };

  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Capacity Study <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-4)' }}>— IID viability</span></h2>
        {canWrite && !editing && (
          <button className="btn btn-ghost btn-sm" onClick={start}>{cs ? 'Edit' : 'Log submittal'}</button>
        )}
      </div>
      <div style={{ padding: 16 }}>
        {editing && (
          <div style={{ border: '1px solid var(--primary)', background: 'var(--primary-tint)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Submitted to IID</label>
              <input type="date" className="input" style={{ height: 32, fontSize: 12.5 }} value={submitted} onChange={e => setSubmitted(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Results received <span style={{ fontWeight: 400, color: 'var(--ink-4)' }}>— leave blank while awaiting</span></label>
              <input type="date" className="input" style={{ height: 32, fontSize: 12.5 }} value={received} onChange={e => setReceived(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Finding</label>
              <select className="select" style={{ height: 32, fontSize: 12.5 }} value={outcome} onChange={e => setOutcome(e.target.value)}>
                {OUTCOMES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Notes</label>
              <textarea className="input" style={{ height: 54, fontSize: 12.5, padding: 8, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Substation, available capacity, constraints…" />
            </div>
            {submitted && !received && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 12 }}>
                Results expected around <b className="mono" style={{ color: 'var(--ink)' }}>{fmt(addDays(submitted, CAPACITY_STUDY_WEEKS * 7))}</b> ({CAPACITY_STUDY_WEEKS}-week typical turnaround).
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={!submitted}><ProjIcon name="check" size={12} />Save</button>
              <button className="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              {cs && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warn)', marginLeft: 'auto' }} onClick={() => { onCapacityEdit(p.id, null); setEditing(false); }}>Remove</button>}
            </div>
          </div>
        )}
        {cs ? (
          <React.Fragment>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span className="badge b-ok"><span className="badge-dot"></span>Submitted {fmtShort(cs.submitted)}</span>
              {cs.state === 'received'
                ? <span className="badge b-blue"><span className="badge-dot"></span>Results {fmtShort(cs.received)}</span>
                : <span className={`badge ${cs.state === 'overdue' ? 'b-warn' : 'b-amber'}`}><span className="badge-dot"></span>{cs.state === 'overdue' ? `Overdue · ${cs.daysOverdue}d` : `Week ${cs.weeksOut} of ${cs.turnaroundWeeks}`}</span>}
              {cs.outcome && <span className={`badge ${outcomeMeta[cs.outcome] || 'b-gray'}`}><span className="badge-dot"></span>{(OUTCOMES.find(o => o.id === cs.outcome) || {}).label}</span>}
            </div>
            {cs.state !== 'received' && (
              <React.Fragment>
                <div className="wsl-bar">
                  <div className="wsl-bar-fill" style={{ width: `${Math.min(100, (cs.daysOut / (cs.turnaroundWeeks * 7)) * 100)}%`, background: cs.state === 'overdue' ? 'var(--warn)' : 'var(--amber)', opacity: 0.45 }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--ink-4)', fontFamily: 'Geist Mono, monospace' }}>
                  <span>{fmtShort(cs.submitted)}</span><span>expected {fmtShort(cs.expected)}</span>
                </div>
              </React.Fragment>
            )}
            {cs.notes && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, background: 'var(--surface-2)', borderRadius: 8, padding: '9px 11px' }}>{cs.notes}</div>}
            {!hasWsl && (
              <div className="callout info" style={{ marginTop: 12 }}>
                <ProjIcon name="alert" size={16} />
                <div>Viability only — a <b>Will Serve Letter</b> is still required before coordination work. Clients typically request one once the project gears up.</div>
              </div>
            )}
          </React.Fragment>
        ) : !editing && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>
            No capacity study submitted. Clients often request one to test project viability before committing to the formal Will Serve process — roughly a {CAPACITY_STUDY_WEEKS}-week turnaround with IID.
          </div>
        )}
      </div>
    </div>
  );
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
function InfoEditModal({ p, users, onClose, onSave, onDelete }) {
  const cc = p.clientContact || {};
  const [f, setF] = React.useState({ code: p.code, name: p.name, client: p.client, clientContact: cc.name || '', clientEmail: cc.email || '', clientPhone: cc.phone || '', street: p.location.street, city: p.location.city, state: p.location.state, zip: p.location.zip, utility: p.utility || '', apn: p.apn || '', mapRef: p.mapRef || '', acreage: p.acreage || '', contractDate: p.contractDate || '', pm: p.pm || '' });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const valid = f.code.trim() && f.name.trim() && f.client.trim();
  const save = () => {
    if (!valid) return;
    onSave({ code: f.code.trim(), name: f.name.trim(), client: f.client.trim(), clientContact: { name: f.clientContact.trim(), email: f.clientEmail.trim(), phone: f.clientPhone.trim() }, utility: f.utility.trim(), apn: f.apn.trim(), mapRef: f.mapRef.trim(), acreage: f.acreage.trim(), contractDate: f.contractDate || null, pm: f.pm || '', location: { street: f.street.trim(), city: f.city.trim(), state: f.state.trim(), zip: f.zip.trim() } });
  };
  const F = (k, label, ph) => <InfoFld label={label} ph={ph} value={f[k]} onChange={set(k)} onEnter={save} />;
  return (
    <div className="modal-backdrop open" onClick={backdropClose(onClose)}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr', gap: '0 10px' }}>
            {F('client', 'Client')}
            <div className="field" style={{ marginBottom: 10 }}>
              <label>MSA project manager</label>
              <select className="select" style={{ height: 32, fontSize: 12.5 }} value={f.pm} onChange={set('pm')}>
                <option value="">Unassigned</option>
                {(users || []).map(u => <option key={u.id} value={u.initials}>{u.name}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Primary utility</label>
              <select className="select" style={{ height: 32, fontSize: 12.5 }} value={f.utility} onChange={set('utility')}>
                <option value="IID">IID</option><option value="SCE">SCE</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 10px' }}>
            {F('clientContact', 'Client contact')}
            {F('clientEmail', 'Contact email')}
            {F('clientPhone', 'Contact phone')}
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
  // Same override shape as getResearchRows: legacy string/null = received date,
  // or { sent, received, noResponse } once dates are edited / closed as no-response.
  const rows = [...(p.research || []), ...added].map(r => {
    const o = ov[p.id] || {};
    if (!Object.prototype.hasOwnProperty.call(o, r.id)) return { ...r, noResponse: false };
    const v = o[r.id];
    if (v === null || typeof v === 'string') return { ...r, received: v, noResponse: false };
    return { ...r, sent: v.sent || r.sent, received: v.received || null, noResponse: !!v.noResponse };
  });
  const resolved = (r) => !!(r.received || r.noResponse);
  // marked finished — at setup, or closed out later from the Modules panel
  const priorResearch = moduleIsDone(p, 'research');
  const done = rows.filter(resolved).length;
  const receivedCount = rows.filter(r => r.received).length;
  const noRespCount = rows.filter(r => r.noResponse && !r.received).length;
  const researchComplete = priorResearch || (rows.length > 0 && done === rows.length);
  // write a full override entry for a row, preserving the other fields
  const patchRow = (r, patch) => {
    if (!canWrite) return;
    const cur = { sent: r.sent, received: r.received || null, noResponse: !!r.noResponse };
    const next = { ...ov, [p.id]: { ...(ov[p.id] || {}), [r.id]: { ...cur, ...patch } } };
    persist(next);
    window.dispatchEvent(new Event('msa-research-updated'));
  };
  // research complete → auto-create the follow-on "Existing Utility Plan" task (once)
  const EUB_KEY = 'msa_app_eub_created_v1';
  const eubExists = p.tasks.some(t => /existing utility (base|plan)/i.test(t.name));
  React.useEffect(() => {
    if (!researchComplete || !canWrite || !onTaskAdd || eubExists) return;
    if (moduleIsDone(p, 'eub')) return; // the plan is already recorded as issued
    let created = {}; try { created = JSON.parse(localStorage.getItem(EUB_KEY)) || {}; } catch (e) {}
    if (created[p.id]) return; // was created before (may have been deleted on purpose)
    onTaskAdd(p.id, { agency: null, taskId: 'eub-' + Date.now(), name: 'Existing Utility Plan', status: 'none', date: null, assignee: 'u1' });
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
  const toggle = (r) => patchRow(r, r.received ? { received: null } : { received: TODAY.toISOString().slice(0, 10), noResponse: false });
  const toggleNoResponse = (r) => patchRow(r, r.noResponse ? { noResponse: false } : { noResponse: true, received: null });
  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Utility research <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-4)' }}>— jurisdiction verification</span></h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="meta">{rows.length ? `${receivedCount}/${rows.length} received${noRespCount ? ` · ${noRespCount} no response` : ''}${done < rows.length ? ` · ${daysBetween(rows[0].sent, TODAY)}d since letters sent` : ''}` : 'no letters yet'}</span>
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
          <span>{priorResearch && rows.length === 0
            ? <><b>Utility Research already complete</b> — recorded as finished rather than run from here.</>
            : priorResearch && done < rows.length
              ? <><b>Utility Research marked complete</b> — {rows.length - done} letter{rows.length - done === 1 ? '' : 's'} still unanswered here; the module was closed out by hand.</>
              : <><b>Utility Research complete</b> — {receivedCount} of {rows.length} response{rows.length === 1 ? '' : 's'} received{noRespCount ? `, ${noRespCount} closed as no response` : ''}.</>}</span>
          <span style={{ color: 'var(--ink-3)' }}>{eubExists ? 'Next task “Existing Utility Plan” is on the task list — assigned to Michael Schreiber.' : canWrite ? 'Creating “Existing Utility Plan” task for Michael Schreiber…' : 'Next step: Existing Utility Plan (Michael Schreiber).'}</span>
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
        <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)' }}>{priorResearch
          ? <>Recorded as complete — no letters were sent from here. {canWrite ? 'Use “Generate letters” if any further research is needed.' : ''}</>
          : <>No research letters sent yet. {canWrite ? 'Use “Generate letters” to send the standard request to every agency serving this region — the log of who they went to, when, and responses builds here.' : ''}</>}</div>
      ) : (
      <React.Fragment>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 8 }}>Jurisdiction summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 8 }}>
          {rows.map(r => {
            const a = AGENCIES[r.agency];
            const j = jurOf(r);
            const confirmed = r.received && j === 'has';
            const cleared = (r.received && j === 'none') || r.noResponse;
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
                  {r.noResponse ? 'No response' : confirmed ? 'Has facilities' : cleared ? 'None in area' : r.received ? 'Received — outcome?' : `Awaiting · ${daysBetween(r.sent, TODAY)}d`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="task-table" style={{ width: '100%' }}>
          <thead><tr><th style={{ paddingLeft: 16 }}>Utility</th><th>Sent to</th><th>Method</th><th>Letter sent</th><th>Research received</th><th style={{ paddingRight: 16 }}>Letter</th></tr></thead>
          <tbody>
            {rows.map(r => {
              const a = AGENCIES[r.agency];
              const waiting = !resolved(r);
              const days = daysBetween(r.sent, TODAY);
              return (
                <tr key={r.id} style={r.noResponse ? { opacity: 0.72 } : null}>
                  <td style={{ paddingLeft: 16, fontWeight: 600, color: 'var(--ink)' }}>{r.label}{r.logged && <span className="badge b-teal" style={{ marginLeft: 8, fontSize: 10 }}>logged{r.by ? ` · ${r.by}` : ''}</span>}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>{a && <span className="util-tag util-iid mono">{a.short}</span>}<span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{r.agency === 'cvwd' ? 'CVWD online portal' : r.to}</span></span></td>
                  <td><span className={`badge ${r.agency === 'cvwd' ? 'b-blue' : 'b-gray'}`} style={{ fontSize: 10 }}>{r.agency === 'cvwd' ? 'Portal' : 'Email'}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {canWrite ? (
                      <input type="date" className="input" style={{ height: 26, fontSize: 11.5, width: 132, padding: '0 7px' }} value={r.sent || ''} title="Date the letter went out — editable" onChange={e => patchRow(r, { sent: e.target.value })} />
                    ) : <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{fmtShort(r.sent)}</span>}
                  </td>
                  <td style={{ minWidth: 268 }}>
                    {/* line 1: the response date (or no-response state); line 2: the actions for it */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        {r.noResponse ? (
                          <span className="badge b-gray"><span className="badge-dot"></span>No response</span>
                        ) : canWrite ? (
                          <input type="date" className="input" style={{ height: 26, fontSize: 11.5, width: 132, padding: '0 7px', borderColor: r.received ? 'var(--ok)' : days > 45 ? 'var(--warn)' : 'var(--border)' }} value={r.received || ''} title="Date the response came back — editable" onChange={e => patchRow(r, { received: e.target.value || null, noResponse: false })} />
                        ) : (
                          <span className={`badge ${r.received ? 'b-ok' : days > 45 ? 'b-warn' : 'b-amber'}`}><span className="badge-dot"></span>{r.received ? `Received ${fmtShort(r.received)}` : `Waiting · ${days}d`}</span>
                        )}
                        {!r.received && !r.noResponse && <span className={`badge ${days > 45 ? 'b-warn' : 'b-amber'}`} style={{ fontSize: 10 }}><span className="badge-dot"></span>{days}d</span>}
                        {!resolved(r) && fu[r.id] && <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'Geist Mono, monospace' }}>f/u {fmtShort(fu[r.id])}</span>}
                      </div>
                      {canWrite && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {!r.received && !r.noResponse && <button className="btn btn-ghost btn-sm" style={{ height: 21, fontSize: 10.5, padding: '0 6px' }} title="Stamp today's date as the response date" onClick={() => toggle(r)}>Today</button>}
                          {r.received && (
                            <React.Fragment>
                              <button className={`btn btn-sm ${jurOf(r) === 'has' ? 'btn-primary' : 'btn-ghost'}`} style={{ height: 21, fontSize: 10.5, padding: '0 6px' }} title="Agency confirmed facilities / jurisdiction in the area" onClick={() => setJurisdiction(r, jurOf(r) === 'has' ? null : 'has')}>Has facilities</button>
                              <button className={`btn btn-sm ${jurOf(r) === 'none' ? 'btn-primary' : 'btn-ghost'}`} style={{ height: 21, fontSize: 10.5, padding: '0 6px' }} title="Agency confirmed no facilities in the area" onClick={() => setJurisdiction(r, jurOf(r) === 'none' ? null : 'none')}>None</button>
                            </React.Fragment>
                          )}
                          <button className={`btn btn-sm ${r.noResponse ? 'btn-primary' : 'btn-ghost'}`} style={{ height: 21, fontSize: 10.5, padding: '0 6px' }} title="Agency never responded — closes the letter out without a response" onClick={() => toggleNoResponse(r)}>{r.noResponse ? 'Undo' : 'No response'}</button>
                          {waiting && daysBetween(fu[r.id] || r.sent, TODAY) >= 30 && <button className="btn btn-ghost btn-sm" style={{ height: 21, fontSize: 10.5, padding: '0 6px' }} title="Record that you contacted this agency — resets the reminder" onClick={() => logFu(r)}>Log follow-up</button>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ paddingRight: 16, whiteSpace: 'nowrap' }}>
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
    eub: p.tasks.some(t => /existing utility (base|plan)/i.test(t.name)),
  };
  return { ...defaults, ...(loadModuleOv()[p.id] || {}) };
}
// A module can be recorded as finished at any point in a project's life — work the client
// had done before the job reached us, or a deliverable that closed out away from the app.
// This flag is what the timeline and the module bodies read, so a finished module stops
// chasing responses instead of showing outstanding work forever.
const MODULE_DONE_KEY = 'msa_app_module_done_v1';
function loadModuleDone() { try { return JSON.parse(localStorage.getItem(MODULE_DONE_KEY)) || {}; } catch (e) { return {}; } }
function persistModuleDone(d) { try { localStorage.setItem(MODULE_DONE_KEY, JSON.stringify(d)); } catch (e) {} window.dispatchEvent(new Event('msa-modules-updated')); }
// The wizard's `preComplete` booleans are read as completions with no date, so the two
// routes to "already done" — ticked at setup, or marked later — land in one shape. A
// null entry is a tombstone: it reopens a module that was ticked at setup.
function getModuleDone(p) {
  const pre = (p && p.preComplete) || {};
  const out = {};
  if (pre.research) out.research = { date: null, atSetup: true };
  if (pre.eub) out.eub = { date: null, atSetup: true };
  Object.assign(out, (loadModuleDone()[p.id] || {}));
  Object.keys(out).forEach(k => { if (!out[k]) delete out[k]; });
  return out;
}
const moduleIsDone = (p, id) => !!getModuleDone(p)[id];
const MODULE_DEFS = [
  { id: 'research', name: 'Utility Research', desc: 'Standardized letters to every agency in the project region to verify jurisdiction — sent log, responses, and jurisdiction summary. Typically 6–8 weeks from contract execution; completion creates the Existing Utility Plan task.' },
  { id: 'eub', name: 'Existing Utility Plan', desc: 'Plot each agency\u2019s research response onto the project base map — per-utility plot log and deliverable stage through QC to issue. Michael Schreiber.' },
  { id: 'coordination', name: 'Utility Coordination', desc: 'Hand-off tracking between agencies, engineering, and the client — enable only the tracks the project needs: SCE Rule 15 / Rule 16, Gas Co backbone / meters, Frontier, Spectrum.' },
];
function ModulesPanel({ p, modules, done, canWrite, onToggle, onComplete, onReopen }) {
  const [marking, setMarking] = React.useState(null); // module id being closed out
  const [when, setWhen] = React.useState('');
  const startMark = (id) => { setWhen(TODAY.toISOString().slice(0, 10)); setMarking(id); };
  const nDone = MODULE_DEFS.filter(m => modules[m.id] && done[m.id]).length;
  const nOn = MODULE_DEFS.filter(m => modules[m.id]).length;
  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Modules</h2>
        <span className="meta">{nOn} active{nDone ? ` · ${nDone} complete` : ''}</span>
      </div>
      <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {MODULE_DEFS.map(m => {
          const on = modules[m.id];
          const fin = on ? done[m.id] : null;
          return (
            <div key={m.id} className="mod-card" data-module={m.id} style={{ border: fin ? '1px solid var(--ok)' : on ? '1px solid var(--primary)' : '1px dashed var(--border-strong)', background: fin ? 'var(--ok-tint, rgba(22,163,74,0.07))' : on ? 'var(--primary-tint)' : 'var(--surface-2)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', flex: 1 }}>{m.name}</span>
                {fin
                  ? <span className="badge b-ok" style={{ fontSize: 9.5 }}><span className="badge-dot"></span>complete</span>
                  : on && <span className="badge b-blue" style={{ fontSize: 9.5 }}><span className="badge-dot"></span>active</span>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '4px 0 8px', lineHeight: 1.45 }}>{m.desc}</div>
              {fin && (
                <div style={{ fontSize: 11.5, color: 'var(--ok)', fontWeight: 600, marginBottom: 8 }}>
                  {fin.date ? `Completed ${fmtShort(fin.date)}` : 'Completed before this project was set up'}
                </div>
              )}
              {canWrite && marking === m.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Completed</label>
                  <input className="input" type="date" style={{ height: 26, fontSize: 11.5, width: 138 }} value={when} onChange={e => setWhen(e.target.value)} />
                  <button className="btn btn-primary btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => { onComplete(m.id, when); setMarking(null); }}>Save</button>
                  <button className="btn btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => setMarking(null)}>Cancel</button>
                </div>
              )}
              {canWrite && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {!on && <button className="btn btn-primary btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => onToggle(m.id, true)}>+ Add to project</button>}
                  {on && !fin && marking !== m.id && <button className="btn btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => startMark(m.id)}><ProjIcon name="check" size={11} />Mark complete</button>}
                  {on && fin && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => onReopen(m.id)}>Reopen</button>}
                  {on && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => { if (window.confirm(`Remove the ${m.name} module from this project? Its log stays saved and comes back if you re-add it.`)) onToggle(m.id, false); }}>Remove module</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- project tasks panel (user tasks, incl. auto-created follow-ons like Existing Utility Plan) ----
// ---- project timeline: contract → research (6–8 wks) → existing utility base → coordination → complete ----
function ProjTimeline({ p, modules }) {
  // modules marked finished — at setup, or closed out later from the Modules panel
  const priorDone = getModuleDone(p);
  const doneSub = (id, fallback) => priorDone[id].date ? `complete ${fmtShort(priorDone[id].date)}` : fallback;
  const rows = getResearchRows(p);
  const firstSent = rows.length ? rows.reduce((m, r) => r.sent < m ? r.sent : m, rows[0].sent) : null;
  const lastRecv = rows.length && rows.every(r => r.received) ? rows.reduce((m, r) => r.received > m ? r.received : m, rows[0].received) : null;
  const contractD = p.contractDate || null;
  const resWeeks = (contractD || firstSent) ? Math.max(1, Math.ceil(daysBetween(contractD || firstSent, lastRecv || TODAY) / 7)) : null;
  const eub = p.tasks.find(t => /existing utility (base|plan)/i.test(t.name));
  const eubSt = (typeof eubLoad === 'function' ? eubLoad() : {})[p.id];
  const eubIssued = eubSt && eubSt.stage === 3;
  const cm = ((typeof cmLoad === 'function' ? cmLoad() : {})[p.id]?.items) || [];
  const cmOpen = cm.filter(i => !i.closed).length;
  const wd = deriveWsl(p.wsl);
  const stages = [
    { lab: 'Contract executed', state: 'done', sub: contractD ? fmtShort(contractD) : firstSent ? `letters out ${fmtShort(firstSent)}` : 'date not set' },
    modules.research !== false && { lab: 'Utility Research', state: priorDone.research || lastRecv ? 'done' : firstSent ? 'active' : 'todo', sub: priorDone.research && !lastRecv ? doneSub('research', 'complete before setup') : lastRecv ? `complete · ${resWeeks} wks` : firstSent ? `week ${resWeeks} of 6–8` : '6–8 wks typical', late: !priorDone.research && !lastRecv && firstSent && resWeeks > 8 },
    { lab: 'Existing Utility Plan', state: priorDone.eub || eubIssued || (eub && eub.status === 'ok') ? 'done' : (eub || eubSt) ? 'active' : 'todo', sub: priorDone.eub && !eubIssued ? doneSub('eub', 'complete before setup') : eubIssued ? `issued${eubSt.issued ? ' ' + fmtShort(eubSt.issued) : ''}` : eubSt ? EUB_STAGES[eubSt.stage] : eub ? SUB_META[eub.status].label : 'follows research' },
    modules.coordination && { lab: 'Utility Coordination', state: priorDone.coordination || (cm.length && !cmOpen) ? 'done' : cm.length ? 'active' : 'todo', sub: priorDone.coordination ? doneSub('coordination', 'complete') : cm.length ? `${cmOpen} open · ${cm.length - cmOpen} closed` : 'not started' },
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

function ProjTasksPanel({ p, canWrite, users, userLoads, onTaskUpdate, onTaskRename, onTaskDelete, onTaskSetDue, onTaskSetDate, onTaskAssign, onTaskAdd, wsl }) {
  const tasks = p.tasks.filter(t => t.user);
  const capStudy = deriveCapacityStudy(p.capacityStudy);
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [pickId, setPickId] = React.useState('custom');
  const [newDue, setNewDue] = React.useState('');
  const [newSubmitted, setNewSubmitted] = React.useState(TODAY.toISOString().slice(0, 10));
  const [editKey, setEditKey] = React.useState(null);
  const [editName, setEditName] = React.useState('');
  // Task templates from Agency Setup, grouped by the project's agencies. Anything already
  // on the project drops out so the same template can't be added twice.
  const catalogGroups = React.useMemo(() => (p.agencies || [])
    .map(aid => ({ aid, agency: AGENCIES[aid], items: tasksForAgency(aid).filter(ct => !p.tasks.some(t => t.taskId === ct.id)) }))
    .filter(g => g.agency && g.items.length), [p.agencies, p.tasks]);
  const findTemplate = (id) => {
    for (const g of catalogGroups) { const t = g.items.find(x => x.id === id); if (t) return { ...t, aid: g.aid }; }
    return null;
  };
  const pickTemplate = (id) => {
    setPickId(id);
    const t = id === 'custom' ? null : findTemplate(id);
    setName(t ? t.name : '');
  };
  const startAdd = () => { setNewSubmitted(TODAY.toISOString().slice(0, 10)); setNewDue(''); setName(''); setPickId('custom'); setAdding(true); };
  const save = () => {
    const n = name.trim();
    if (!n) return;
    const t = pickId === 'custom' ? null : findTemplate(pickId);
    // date = the submittal date for this task, not a bare "created on" stamp
    onTaskAdd(p.id, { agency: t ? t.aid : null, taskId: t ? t.id : 'custom-' + Date.now(), name: n, status: 'none', date: newSubmitted || null, due: newDue || null });
    setAdding(false); setName(''); setNewDue(''); setPickId('custom');
  };
  if (!tasks.length && !canWrite) return null;
  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Project tasks <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-4)' }}>— Utility Coordination</span></h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="meta">{tasks.length ? `${tasks.filter(t => t.status === 'ok').length}/${tasks.length} complete` : 'none'}</span>
          {canWrite && !adding && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={startAdd}>+ Add task</button>}
        </div>
      </div>
      {/* Coordination work is authorised by the Will Serve Letter — surface its state here. */}
      {!wsl ? (
        <div style={{ padding: '9px 16px', borderBottom: '1px solid var(--border)', background: 'var(--amber-tint)', color: 'var(--amber-ink)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ProjIcon name="clock" size={13} />
          <span>
            No Will Serve Letter recorded yet — coordination tasks run off the WSL, which is valid <b>1 year</b> from issue with a <b>6-month extension</b> available.
            {capStudy ? <> A capacity study {capStudy.state === 'received' ? 'has come back' : 'is out with IID'}, but that covers viability only.</> : null}
          </span>
        </div>
      ) : wsl.state === 'expired' ? (
        <div style={{ padding: '9px 16px', borderBottom: '1px solid var(--border)', background: 'var(--warn-tint)', color: 'var(--warn-ink)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ProjIcon name="clock" size={13} />
          <span><b>Will Serve Letter expired {fmtShort(wsl.effectiveExpiry.toISOString().slice(0, 10))}</b>{wsl.extensionUsed ? ' — extension already used.' : ` — a ${wsl.extensionMonths}-month extension is still available.`}</span>
        </div>
      ) : (
        <div style={{ padding: '9px 16px', borderBottom: '1px solid var(--border)', fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <ProjIcon name="check" size={12} />
          <span>Authorised by the Will Serve Letter — <b style={{ color: 'var(--ink-2)' }}>{wsl.daysLeft}d</b> remaining{wsl.extensionUsed ? ` (${wsl.extensionMonths}-month extension applied)` : `, ${wsl.extensionMonths}-month extension available`}.</span>
        </div>
      )}
      {adding && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--primary-tint)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {catalogGroups.length > 0 && (
            <select className="select" style={{ width: 'auto', minWidth: 200, height: 30, fontSize: 12.5 }} value={pickId} onChange={e => pickTemplate(e.target.value)} title="Templates come from Agency Setup">
              <option value="custom">Custom task…</option>
              {catalogGroups.map(g => (
                <optgroup key={g.aid} label={g.agency.name}>
                  {g.items.map(ct => <option key={ct.id} value={ct.id}>{ct.name}{ct.days ? ` (${ct.days})` : ''}</option>)}
                </optgroup>
              ))}
            </select>
          )}
          <input className="input" autoFocus style={{ height: 30, fontSize: 12.5, flex: 1, minWidth: 180 }} placeholder="Task — e.g. Existing Utility Plan" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600 }}>
            Submitted
            <input type="date" className="input" style={{ height: 30, fontSize: 12, width: 140 }} value={newSubmitted} onChange={e => setNewSubmitted(e.target.value)} title="Date this submittal went out" />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600 }}>
            Deadline
            <input type="date" className="input" style={{ height: 30, fontSize: 12, width: 140 }} value={newDue} onChange={e => setNewDue(e.target.value)} title="Optional deadline for this task" />
          </label>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={!name.trim()}>Add</button>
          <button className="btn btn-sm" onClick={() => { setAdding(false); setNewDue(''); }}>Cancel</button>
        </div>
      )}
      {tasks.length === 0 && !adding && <div style={{ padding: 16, fontSize: 12.5, color: 'var(--ink-4)' }}>No tasks yet. Completing Utility Research adds “Existing Utility Plan” automatically.</div>}
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
                    {users.map(x => { const load = userLoads ? userLoads[x.id] : null; return <option key={x.id} value={x.id}>{x.name}{load ? ` (${load.load} open)` : ''}</option>; })}
                  </select>
                ) : u && <span className="meta">{u.name}</span>}
                {canWrite ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Submittal date">
                    <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sub</span>
                    <input type="date" className="input" style={{ height: 28, fontSize: 11.5, width: 132 }} value={t.date || ''} onChange={e => onTaskSetDate(p.id, t._key, e.target.value || null)} />
                  </span>
                ) : t.date && <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>submitted {fmtShort(t.date)}</span>}
                {canWrite ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Deadline">
                    <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Due</span>
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

function ProjectPage({ p, canWrite, currentUser, users, userLoads, onBack, onWslAction, onWslEdit, onCapacityEdit, onTaskUpdate, onTaskRename, onTaskDelete, onTaskSetDue, onTaskSetDate, onTaskAssign, onTaskAdd, onDdUpdate, onPhaseUpdate, onInfoUpdate, onProjectDelete, onGoReport }) {
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
      if (wd.extensionUsed) ev.push({ ts: wd.originalExpiry.toISOString(), kind: 'wsl', text: `${wd.extensionManual ? 'Extension' : wd.extensionMonths + '-month extension'} applied — final expiry set`, tag: 'WSL' });
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
  const moduleDone = React.useMemo(() => getModuleDone(p), [p, moduleRev]);
  const completeModule = (id, date) => {
    const day = date || TODAY.toISOString().slice(0, 10);
    const entry = { date: day, by: currentUser ? currentUser.initials : null };
    // The plan module carries its own stage stepper — drive it too, so the module page and
    // the modules panel never disagree about whether the plan is out. Remember the stage it
    // was at so reopening puts it back where it was rather than guessing.
    if (id === 'eub' && typeof eubLoad === 'function') {
      const all = eubLoad();
      const st = all[p.id] || { stage: 0, plots: {}, issued: null };
      entry.prevStage = st.stage;
      eubPersist({ ...all, [p.id]: { ...st, stage: EUB_STAGES.length - 1, issued: day } });
    }
    const done = loadModuleDone();
    persistModuleDone({ ...done, [p.id]: { ...(done[p.id] || {}), [id]: entry } });
    bumpModules();
  };
  const reopenModule = (id) => {
    const done = loadModuleDone();
    const entry = (done[p.id] || {})[id] || {};
    if (id === 'eub' && entry.prevStage != null && typeof eubLoad === 'function') {
      const all = eubLoad();
      if (all[p.id]) eubPersist({ ...all, [p.id]: { ...all[p.id], stage: entry.prevStage, issued: null } });
    }
    // null rather than delete: a module ticked complete during setup lives on the project
    // record itself, so it needs a tombstone to stay reopened.
    persistModuleDone({ ...done, [p.id]: { ...(done[p.id] || {}), [id]: null } });
    bumpModules();
  };

  const fill = !wd ? null : (wd.state === 'expired' || wd.state === 'critical') ? 'var(--warn)' : wd.state === 'warning' ? 'var(--amber)' : 'var(--ok)';
  const todayPos = wd ? Math.max(0, Math.min(100, ((TODAY - wd.issued) / (wd.effectiveExpiry - wd.issued)) * 100)) : 0;
  const canExtend = wd && !wd.extensionUsed && wd.state !== 'expired';

  // WSL date editing
  const [wslEditing, setWslEditing] = React.useState(false);
  const [editIssued, setEditIssued] = React.useState('');
  const [editExt, setEditExt] = React.useState(false);
  const [editExtMonths, setEditExtMonths] = React.useState(6);
  // Expiry and extension dates are normally derived, but agencies don't always follow
  // the 1-year / 6-month rule and sometimes grant time after the fact — so both can be
  // overridden by hand. Empty means "use the derived date".
  const [editExpires, setEditExpires] = React.useState('');
  const [editExtExpires, setEditExtExpires] = React.useState('');
  const iso = (d) => d ? parseDate(d).toISOString().slice(0, 10) : '';
  const startWslEdit = () => {
    setEditIssued(wd ? wd.issued.toISOString().slice(0, 10) : TODAY.toISOString().slice(0, 10));
    setEditExt(wd ? !!wd.extensionUsed : false);
    setEditExtMonths(wd && wd.extensionMonths != null ? wd.extensionMonths : 6);
    setEditExpires(wd && wd.expiryManual ? iso(wd.originalExpiry) : '');
    setEditExtExpires(wd && wd.extensionManual ? iso(wd.extensionExpiry) : '');
    setWslEditing(true);
  };
  // what the dates will be once saved — derived unless overridden
  const previewWsl = React.useMemo(() => {
    if (!editIssued) return null;
    return deriveWsl({
      issued: editIssued,
      extensionUsed: editExt,
      extensionMonths: Number(editExtMonths) || 6,
      expires: editExpires || undefined,
      extensionExpires: editExtExpires || undefined,
    });
  }, [editIssued, editExt, editExtMonths, editExpires, editExtExpires]);
  const saveWslEdit = () => {
    if (!editIssued) return;
    onWslEdit(p.id, {
      issued: editIssued,
      extensionUsed: editExt,
      extensionMonths: Number(editExtMonths) || 6,
      // only store overrides that were actually entered
      expires: editExpires || undefined,
      extensionExpires: editExtExpires || undefined,
    });
    setWslEditing(false);
  };

  return (
    <div>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <button className="btn btn-icon" onClick={onBack} title="Back to dashboard"><ProjIcon name="back" /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em' }}>
              <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 18, fontWeight: 500 }}>{p.code}</span>
              <span style={{ color: 'var(--ink-4)', margin: '0 8px', fontWeight: 300 }}>·</span>
              {p.name}
            </h2>
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
            {/* the number now leads the heading above, so it isn't repeated here */}
            <span>
              {p.client}
              {p.clientContact && p.clientContact.name ? <span style={{ color: 'var(--ink-4)' }}> · {p.clientContact.name}</span> : null}
            </span>
            {p.clientContact && p.clientContact.email && <a href={`mailto:${p.clientContact.email}`} style={{ textDecoration: 'none', fontSize: 12 }} title="Client contact email">{p.clientContact.email}</a>}
            {p.clientContact && p.clientContact.phone && <span className="mono" style={{ fontSize: 12 }} title="Client contact phone">{p.clientContact.phone}</span>}
            <span title="MSA project manager" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <ProjIcon name="user" size={12} />PM: {(users || []).find(u => u.initials === p.pm)?.name || (p.pm && p.pm !== '—' ? p.pm : 'Unassigned')}
            </span>
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
      {infoEditOpen && <InfoEditModal p={p} users={users} onClose={() => setInfoEditOpen(false)} onSave={(patch) => { onInfoUpdate(p.id, patch); setInfoEditOpen(false); }} onDelete={onProjectDelete ? () => { if (window.confirm(`Delete “${p.name}” (${p.code})? This removes it from all views — tasks, notes, and research history included. This cannot be undone.`)) onProjectDelete(p.id); } : null} />}

      <ProjTimeline p={p} modules={modules} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 16, alignItems: 'start' }}>
        {/* left: modules + DD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <ModulesPanel p={p} modules={modules} done={moduleDone} canWrite={canWrite} onToggle={toggleModule} onComplete={completeModule} onReopen={reopenModule} />

          {modules.research && <ResearchPanel key={p.id} p={p} canWrite={canWrite} onGenerate={() => setLetterGenOpen(true)} onEditInfo={() => setInfoEditOpen(true)} onTaskAdd={onTaskAdd} />}

          {modules.eub && <EubModule p={p} canWrite={canWrite} />}

          {modules.coordination && <CoordModule p={p} canWrite={canWrite} currentUser={currentUser} users={users} />}

          <ProjTasksPanel p={p} canWrite={canWrite} users={users} userLoads={userLoads} wsl={wd} onTaskUpdate={onTaskUpdate} onTaskRename={onTaskRename} onTaskDelete={onTaskDelete} onTaskSetDue={onTaskSetDue} onTaskSetDate={onTaskSetDate} onTaskAssign={onTaskAssign} onTaskAdd={onTaskAdd} />

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
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>Expiration date <span style={{ fontWeight: 400, color: 'var(--ink-4)' }}>— leave blank for 1 year from issue</span></label>
                    <input type="date" className="input" style={{ height: 32, fontSize: 12.5 }} value={editExpires}
                      placeholder={previewWsl ? iso(previewWsl.derivedExpiry) : ''}
                      onChange={e => setEditExpires(e.target.value)} />
                    {!editExpires && previewWsl && (
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 3 }}>Using {fmt(previewWsl.derivedExpiry)}</div>
                    )}
                  </div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>Extension length <span style={{ fontWeight: 400, color: 'var(--ink-4)' }}>— months, usually 6</span></label>
                    <input type="number" min="1" max="36" className="input" style={{ height: 32, fontSize: 12.5 }} value={editExtMonths} onChange={e => setEditExtMonths(e.target.value)} />
                  </div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label>Extension date <span style={{ fontWeight: 400, color: 'var(--ink-4)' }}>— leave blank to add the months above</span></label>
                    <input type="date" className="input" style={{ height: 32, fontSize: 12.5 }} value={editExtExpires}
                      onChange={e => setEditExtExpires(e.target.value)} />
                    {!editExtExpires && previewWsl && (
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 3 }}>Using {fmt(previewWsl.derivedExtensionExpiry)}</div>
                    )}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginBottom: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editExt} onChange={e => setEditExt(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    Extension already granted
                  </label>
                  {previewWsl && (
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 12 }}>
                      Effective expiry: <b className="mono" style={{ color: 'var(--ink)' }}>{fmt(previewWsl.effectiveExpiry)}</b>
                      {(editExpires || (editExt && editExtExpires)) && <span className="badge b-amber" style={{ marginLeft: 7, fontSize: 9.5 }}>entered by hand</span>}
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
                  {/* status stays "Sent" for the life of the project — expiry is separate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="badge b-ok"><span className="badge-dot"></span>Sent {fmtShort(wd.issued)}</span>
                    {wd.state === 'expired' && <span className="badge b-warn"><span className="badge-dot"></span>Expired</span>}
                    {wd.extensionUsed && <span className="badge b-violet"><span className="badge-dot"></span>Extension used ({wd.extensionMonths} mo)</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span className="mono" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: fill }}>{wd.state === 'expired' ? Math.abs(wd.daysLeft) : wd.daysLeft}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{wd.state === 'expired' ? `days past expiry (${fmtShort(wd.effectiveExpiry)})` : 'days until expiry'}</span>
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
                    <div className="kv" style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5, gap: 12 }}><span style={{ color: 'var(--ink-3)', width: 110 }}>Extension</span><span>{wd.extensionUsed ? (wd.extensionManual ? `Granted to ${fmt(wd.extensionExpiry)}` : `Used (${wd.extensionMonths} mo)`) : (wd.extensionManual ? `Available to ${fmt(wd.extensionExpiry)}` : `Available (1× ${wd.extensionMonths} mo)`)}</span></div>
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
                      <div><b>Extension available.</b> {wd.extensionManual ? 'An extension date has been entered' : `One ${wd.extensionMonths}-month extension`} can move expiry to {fmt(wd.extensionExpiry)}.</div>
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
                  <div><b>No WSL on file yet.</b> IID projects require a Will Serve Letter before coordination work — valid 1 year from issuance, one 6-month extension. Clients often run a capacity study first to test viability. {canWrite ? 'Use “Log WSL” above once issued.' : ''}</div>
                </div>
              )}
            </div>
          </div>

          {p.utility !== 'SCE' && <CapacityStudyPanel p={p} canWrite={canWrite} onCapacityEdit={onCapacityEdit} hasWsl={!!wd} />}

          <div className="panel">
            <div className="panel-hd"><h2>Client reporting</h2></div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* cadence sets the reporting period, so it has to be changeable — a project
                    left on the wrong one files reports against the wrong window */}
                {canWrite ? (
                  <select className="select" style={{ width: 'auto', height: 26, fontSize: 12, paddingLeft: 8, paddingRight: 24, fontWeight: 600 }}
                    value={p.reporting.cadence} title="Reporting cadence"
                    onChange={e => onInfoUpdate(p.id, { reporting: { ...p.reporting, cadence: e.target.value } })}>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                ) : <span className="badge b-blue"><span className="badge-dot"></span>{p.reporting.cadence}</span>}
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

Object.assign(window, { ProjectPage, ProjIcon, getModuleDone, moduleIsDone });
