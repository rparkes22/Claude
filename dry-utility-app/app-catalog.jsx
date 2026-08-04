// Blueprint — Task Catalog (admin only).
// Pre-defined tasks per agency (e.g. Will Serve Letter, SCE Rule 15 / Rule 16)
// that editors can then add to any project from the agency panels.
// Built-in templates are editable via overrides (name/duration, hide/restore);
// custom entries can be edited or removed outright.

// ---- cities management ----
function CitiesPanel({ showToast }) {
  const [rev, setRev] = React.useState(0);
  const [adding, setAdding] = React.useState(false);
  const [cityName, setCityName] = React.useState('');
  const [editingCity, setEditingCity] = React.useState(null); // city name
  const bump = () => setRev(r => r + 1);
  const agencyIds = Object.keys(AGENCIES);
  const toggleCityAgency = (city, aid) => {
    const cur = CITY_AGENCIES[city] || [];
    const next = cur.includes(aid) ? cur.filter(x => x !== aid) : [...cur, aid];
    updateCityAgencies(city, next);
    bump();
  };
  const createCity = () => {
    const n = cityName.trim();
    if (!n) return;
    if (!addCity(n, ['socalgas'])) { showToast('That city already exists'); return; }
    setAdding(false); setCityName(''); setEditingCity(n); bump();
    showToast(`City added — ${n}. Pick its serving agencies.`);
  };
  const removed = removedCities();
  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      <div className="panel-hd">
        <h2>Cities &amp; serving agencies</h2>
        {!adding
          ? <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => setAdding(true)}>+ Add city</button>
          : (
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <input className="input" autoFocus style={{ height: 28, fontSize: 12.5, width: 170 }} placeholder="City name" value={cityName} onChange={e => setCityName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createCity(); }} />
              <button className="btn btn-primary btn-sm" style={{ height: 26 }} onClick={createCity} disabled={!cityName.trim()}>Add</button>
              <button className="btn btn-sm" style={{ height: 26 }} onClick={() => setAdding(false)}>Cancel</button>
            </span>
          )}
      </div>
      <div style={{ padding: '6px 16px 12px' }}>
        {CITIES.map(city => {
          const ids = CITY_AGENCIES[city] || [];
          const custom = isCustomCity(city);
          const edited = isEditedCity(city);
          const open = editingCity === city;
          return (
            <div key={city} style={{ borderBottom: '1px solid var(--border)', padding: '7px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 12.5, width: 110 }}>{city}</span>
                {custom && <span className="badge b-teal" style={{ fontSize: 9.5 }}>custom</span>}
                {!custom && edited && <span className="badge b-amber" style={{ fontSize: 9.5 }}>edited</span>}
                <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                  {ids.map(aid => AGENCIES[aid] ? <span key={aid} className="util-tag util-iid mono" title={AGENCIES[aid].name}>{AGENCIES[aid].short}</span> : null)}
                  {ids.length === 0 && <span style={{ fontSize: 11.5, color: 'var(--warn)' }}>no agencies — city won't work in the wizard</span>}
                </span>
                <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => setEditingCity(open ? null : city)}>{open ? 'done' : 'edit'}</button>
                {!custom && edited && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => { restoreCity(city); bump(); showToast('City reset to original'); }}>reset</button>}
                <button className="btn btn-ghost btn-sm" style={{ height: 22, padding: '0 6px', color: 'var(--warn)' }} title="Remove city" onClick={() => { if (window.confirm(`Remove ${city} from the city list? New projects won't be able to pick it.`)) { removeCity(city); if (open) setEditingCity(null); bump(); showToast(`City removed — ${city}`); } }}><Icon name="x" size={10} /></button>
              </div>
              {open && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: '8px 0 4px 110px' }}>
                  {agencyIds.map(aid => {
                    const on = ids.includes(aid);
                    return (
                      <button key={aid} className="btn btn-sm" title={AGENCIES[aid].name} onClick={() => toggleCityAgency(city, aid)}
                        style={on ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white', height: 24, fontSize: 10.5 } : { height: 24, fontSize: 10.5 }}>
                        <span className="mono">{AGENCIES[aid].short}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {removed.length > 0 && (
          <div style={{ padding: '8px 0 2px', fontSize: 11.5, color: 'var(--ink-4)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            Removed: {removed.map(c => <button key={c} className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => { restoreCity(c); bump(); showToast(`City restored — ${c}`); }}>{c} ↺ restore</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- agency contacts (letter recipient address book) ----
function ContactsPanel({ showToast }) {
  const [rev, setRev] = React.useState(0);
  const bump = () => setRev(r => r + 1);
  const book = getLetterRecipients();
  const [editing, setEditing] = React.useState(null); // recipient id or 'new'
  const blank = { label: '', agency: Object.keys(AGENCIES)[0], attn: '', contact: '', email: '', addr1: '', addr2: '' };
  const [f, setF] = React.useState(blank);
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const startEdit = (r) => { setEditing(r.id); setF({ label: r.label, agency: r.agency, attn: r.attn, contact: r.contact || '', email: r.email, addr1: r.addr[0] || '', addr2: r.addr[1] || '' }); };
  const startNew = () => { setEditing('new'); setF(blank); };
  const save = () => {
    if (!f.label.trim() || !f.attn.trim() || !f.email.trim()) return;
    const patch = { label: f.label.trim(), agency: f.agency, attn: f.attn.trim(), contact: f.contact.trim() || undefined, email: f.email.trim(), addr: [f.addr1.trim(), f.addr2.trim()].filter(Boolean) };
    if (editing === 'new') { addRecipient({ id: 'lrc-' + Date.now(), ...patch }); showToast(`Contact added — ${patch.label}`); }
    else { updateRecipient(editing, patch); showToast('Contact updated'); }
    setEditing(null); bump();
  };
  const kindOrder = (r) => (AGENCIES[r.agency]?.name || 'zz');
  const rows = [...book].sort((a, b) => kindOrder(a).localeCompare(kindOrder(b)));
  const Field = ({ k, label, w }) => (
    <div className="field" style={{ marginBottom: 8, width: w }}><label>{label}</label><input className="input" style={{ height: 28, fontSize: 12 }} value={f[k]} onChange={set(k)} /></div>
  );
  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      <div className="panel-hd">
        <h2>Agency contacts <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-4)' }}>— used by the research-letter generator</span></h2>
        {editing !== 'new' && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={startNew}>+ Add contact</button>}
      </div>
      <div style={{ padding: '4px 16px 12px' }}>
        {rows.map(r => (
          <div key={r.id} style={{ borderBottom: '1px solid var(--border)', padding: '7px 0' }}>
            {editing === r.id ? (
              <ContactForm f={f} set={set} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5 }}>
                {AGENCIES[r.agency] && <span className="util-tag util-iid mono" title={AGENCIES[r.agency].name}>{AGENCIES[r.agency].short}</span>}
                <span style={{ fontWeight: 600, width: 170 }}>{r.label}</span>
                <span style={{ color: 'var(--ink-3)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.contact ? r.contact + ' · ' : ''}{r.email} · {r.addr.join(', ')}</span>
                {r.custom && <span className="badge b-teal" style={{ fontSize: 9.5 }}>custom</span>}
                {r.edited && <span className="badge b-amber" style={{ fontSize: 9.5 }}>edited</span>}
                <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => startEdit(r)}>edit</button>
                {r.edited && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => { resetRecipient(r.id); bump(); showToast('Contact reset to original'); }}>reset</button>}
                <button className="btn btn-ghost btn-sm" style={{ height: 22, padding: '0 6px', color: 'var(--warn)' }} title="Remove contact" onClick={() => { if (window.confirm(`Remove ${r.label} from the address book?`)) { removeRecipient(r.id); bump(); showToast('Contact removed'); } }}><Icon name="x" size={10} /></button>
              </div>
            )}
          </div>
        ))}
        {editing === 'new' && <div style={{ padding: '10px 0 2px' }}><ContactForm f={f} set={set} onSave={save} onCancel={() => setEditing(null)} isNew /></div>}
        {loadContactMods().removed.length > 0 && (
          <div style={{ padding: '8px 0 2px', fontSize: 11.5, color: 'var(--ink-4)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            Removed:
            {loadContactMods().removed.map(id => {
              const base = LETTER_RECIPIENTS.find(r => r.id === id);
              return base ? <button key={id} className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => { resetRecipient(id); bump(); showToast(`Restored — ${base.label}`); }}>restore {base.label}</button> : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactForm({ f, set, onSave, onCancel, isNew }) {
  return (
    <div style={{ border: '1px solid var(--primary)', background: 'var(--primary-tint)', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div className="field" style={{ marginBottom: 8 }}><label>Utility label</label><input className="input" autoFocus={isNew} style={{ height: 28, fontSize: 12 }} placeholder="e.g. Water (DWA)" value={f.label} onChange={set('label')} /></div>
        <div className="field" style={{ marginBottom: 8 }}><label>Agency</label>
          <select className="select" style={{ height: 28, fontSize: 12 }} value={f.agency} onChange={set('agency')}>
            {Object.keys(AGENCIES).map(aid => <option key={aid} value={aid}>{AGENCIES[aid].name}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 8 }}><label>Attn / organization line</label><input className="input" style={{ height: 28, fontSize: 12 }} value={f.attn} onChange={set('attn')} /></div>
        <div className="field" style={{ marginBottom: 8 }}><label>Contact person (optional)</label><input className="input" style={{ height: 28, fontSize: 12 }} value={f.contact} onChange={set('contact')} /></div>
        <div className="field" style={{ marginBottom: 8 }}><label>Email</label><input className="input" style={{ height: 28, fontSize: 12 }} value={f.email} onChange={set('email')} /></div>
        <div className="field" style={{ marginBottom: 8 }}><label>Street address</label><input className="input" style={{ height: 28, fontSize: 12 }} value={f.addr1} onChange={set('addr1')} /></div>
        <div className="field" style={{ marginBottom: 8 }}><label>City, State ZIP</label><input className="input" style={{ height: 28, fontSize: 12 }} value={f.addr2} onChange={set('addr2')} /></div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={!f.label.trim() || !f.attn.trim() || !f.email.trim()}><Icon name="check" size={12} />{isNew ? 'Add contact' : 'Save'}</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function CatalogPage({ projects, showToast }) {
  const [catalog, setCatalog] = React.useState(loadTaskCatalog);
  const [agencyRev, setAgencyRev] = React.useState(0); // bump to re-read AGENCIES
  const [addingAgency, setAddingAgency] = React.useState(false);
  const [agName, setAgName] = React.useState('');
  const [agShort, setAgShort] = React.useState('');
  const [agKind, setAgKind] = React.useState('Municipal');
  const [addingFor, setAddingFor] = React.useState(null);
  const [name, setName] = React.useState('');
  const [days, setDays] = React.useState('');
  const [editing, setEditing] = React.useState(null); // { aid, id, builtin }
  const [eName, setEName] = React.useState('');
  const [eDays, setEDays] = React.useState('');
  const save = (next) => { setCatalog(next); persistTaskCatalog(next); };

  const agencyIds = Object.keys(AGENCIES);
  const createAgency = () => {
    const n = agName.trim(), s = agShort.trim().toUpperCase();
    if (!n || !s) return;
    const id = 'ag-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16);
    if (AGENCIES[id]) { showToast('An agency with that name already exists'); return; }
    addAgency({ id, name: n, short: s, kind: agKind, note: 'Custom agency' });
    setAgencyRev(r => r + 1);
    setAddingAgency(false); setAgName(''); setAgShort('');
    showToast(`Agency added — ${n}`);
  };
  const [agEditing, setAgEditing] = React.useState(null); // agency id being edited
  const [agEName, setAgEName] = React.useState('');
  const [agEShort, setAgEShort] = React.useState('');
  const [agEKind, setAgEKind] = React.useState('Municipal');
  const startAgencyEdit = (aid) => { const a = AGENCIES[aid]; setAgEditing(aid); setAgEName(a.name); setAgEShort(a.short); setAgEKind(a.kind || 'Municipal'); };
  const saveAgencyEdit = () => {
    const n = agEName.trim(), s = agEShort.trim().toUpperCase();
    if (!n || !s || !agEditing) return;
    updateAgency(agEditing, { name: n, short: s, kind: agEKind });
    setAgEditing(null); setAgencyRev(r => r + 1);
    showToast('Agency updated');
  };
  const deleteAgency = (aid) => {
    const a = AGENCIES[aid];
    const inUse = (projects || []).filter(p => p.agencies.includes(aid)).length;
    if (!window.confirm(`Remove ${a.name}?${inUse ? ` It is used on ${inUse} project${inUse > 1 ? 's' : ''} — those panels will show the raw id.` : ''}`)) return;
    removeAgency(aid);
    setAgencyRev(r => r + 1);
    showToast(`Agency removed — ${a.name}`);
  };
  const ovFor = (aid) => (catalog._ov && catalog._ov[aid]) || {};
  const setOv = (aid, id, patch) => {
    const ov = { ...(catalog._ov || {}) };
    ov[aid] = { ...(ov[aid] || {}), [id]: patch === null ? undefined : { ...(ov[aid] || {})[id], ...patch } };
    if (patch === null) delete ov[aid][id];
    save({ ...catalog, _ov: ov });
  };
  const builtinFor = (aid) => (AGENCY_TASKS[aid] || AGENCY_TASKS.municipal).map(t => {
    const o = ovFor(aid)[t.id];
    return o ? { ...t, ...o, edited: !!(o.name || o.days) } : t;
  });

  const addTask = (aid) => {
    const n = name.trim();
    if (!n) return;
    const entry = { id: `cat-${aid}-${Date.now()}`, name: n, days: days.trim() || 'varies', custom: true };
    save({ ...catalog, [aid]: [...(catalog[aid] || []), entry] });
    setAddingFor(null); setName(''); setDays('');
    showToast(`Added to ${AGENCIES[aid].short} catalog — ${n}`);
  };
  const removeTask = (aid, id) => {
    save({ ...catalog, [aid]: (catalog[aid] || []).filter(t => t.id !== id) });
    showToast('Catalog task removed');
  };
  const startEdit = (aid, t, builtin) => { setEditing({ aid, id: t.id, builtin }); setEName(t.name); setEDays(t.days || ''); };
  const saveEdit = () => {
    const n = eName.trim();
    if (!n || !editing) return;
    if (editing.builtin) {
      setOv(editing.aid, editing.id, { name: n, days: eDays.trim() || 'varies' });
    } else {
      save({ ...catalog, [editing.aid]: (catalog[editing.aid] || []).map(t => t.id === editing.id ? { ...t, name: n, days: eDays.trim() || 'varies' } : t) });
    }
    setEditing(null);
    showToast('Template updated');
  };

  const EditRow = ({ onSave }) => (
    <td colSpan="3" style={{ background: 'var(--primary-tint)' }}>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '2px 0' }}>
        <input className="input" autoFocus style={{ height: 28, fontSize: 12.5, flex: 1, minWidth: 170 }} value={eName} onChange={e => setEName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') setEditing(null); }} />
        <input className="input" style={{ height: 28, fontSize: 12.5, width: 100 }} placeholder="duration" value={eDays} onChange={e => setEDays(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSave(); }} />
        <button className="btn btn-primary btn-sm" style={{ height: 26 }} onClick={onSave} disabled={!eName.trim()}>Save</button>
        <button className="btn btn-sm" style={{ height: 26 }} onClick={() => setEditing(null)}>Cancel</button>
      </span>
    </td>
  );

  return (
    <div>
      <CitiesPanel showToast={showToast} />
      <ContactsPanel showToast={showToast} />
      <div className="callout info" style={{ marginBottom: 14 }}>
        <Icon name="alert" size={16} />
        <div><b>Agency directory.</b> These agencies appear in the Add Project wizard (matched by city) and drive the Utility Research module's letter recipients. Add, rename, or remove agencies here; letter contacts are managed above.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {!addingAgency ? (
          <button className="btn btn-primary btn-sm" onClick={() => setAddingAgency(true)}><Icon name="plus" size={12} />Add agency</button>
        ) : (
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', background: 'var(--primary-tint)', border: '1px solid var(--primary)', borderRadius: 9, padding: '8px 12px' }}>
            <input className="input" autoFocus style={{ height: 30, fontSize: 12.5, width: 220 }} placeholder="Agency name — e.g. City of Blythe" value={agName} onChange={e => setAgName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createAgency(); }} />
            <input className="input" style={{ height: 30, fontSize: 12.5, width: 80 }} placeholder="Short" maxLength={4} value={agShort} onChange={e => setAgShort(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createAgency(); }} />
            <select className="select" style={{ width: 'auto', height: 30, fontSize: 12.5 }} value={agKind} onChange={e => setAgKind(e.target.value)}>
              {['Municipal', 'County', 'Electric', 'Gas', 'Telecom', 'Water', 'Other'].map(k => <option key={k}>{k}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={createAgency} disabled={!agName.trim() || !agShort.trim()}>Create</button>
            <button className="btn btn-sm" onClick={() => setAddingAgency(false)}>Cancel</button>
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        {agencyIds.map(aid => {
          const a = AGENCIES[aid];
          return (
            <div className="panel" key={aid}>
              <div className="panel-hd">
                {agEditing === aid ? (
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    <input className="input" autoFocus style={{ height: 28, fontSize: 12.5, flex: 1, minWidth: 150 }} value={agEName} onChange={e => setAgEName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveAgencyEdit(); if (e.key === 'Escape') setAgEditing(null); }} />
                    <input className="input" style={{ height: 28, fontSize: 12.5, width: 70 }} maxLength={4} value={agEShort} onChange={e => setAgEShort(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveAgencyEdit(); }} />
                    <select className="select" style={{ width: 'auto', height: 28, fontSize: 12 }} value={agEKind} onChange={e => setAgEKind(e.target.value)}>
                      {['Municipal', 'County', 'Electric', 'Gas', 'Telecom', 'Water', 'Other'].map(k => <option key={k}>{k}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" style={{ height: 26 }} onClick={saveAgencyEdit} disabled={!agEName.trim() || !agEShort.trim()}>Save</button>
                    <button className="btn btn-sm" style={{ height: 26 }} onClick={() => setAgEditing(null)}>Cancel</button>
                  </span>
                ) : (
                  <>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{a.name}<span className="util-tag util-iid mono">{a.short}</span>{a.custom && <span className="badge b-teal">custom</span>}{!a.custom && a.edited && <span className="badge b-amber">edited</span>}</h2>
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px' }} title="Edit agency" onClick={() => startAgencyEdit(aid)}><Icon name="edit" size={11} /></button>
                  {!a.custom && a.edited && <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px', fontSize: 10.5 }} title="Reset to original" onClick={() => { resetAgency(aid); setAgencyRev(r => r + 1); showToast('Agency reset to original'); }}>reset</button>}
                  {a.custom && <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 6px', color: 'var(--warn)' }} title="Remove agency" onClick={() => deleteAgency(aid)}><Icon name="x" size={10} /></button>}
                </span>
                  </>
                )}
              </div>
              <div style={{ padding: '8px 16px 12px', fontSize: 11.5, color: 'var(--ink-4)' }}>{a.kind}{a.note ? ` — ${a.note}` : ''}</div>
            </div>
          );
        })}
      </div>
      <CoordDurationsPanel showToast={showToast} />
    </div>
  );
}

// admin editor for coordination-track typical durations (drives auto-set deadlines)
function CoordDurationsPanel({ showToast }) {
  const [, bump] = React.useReducer(x => x + 1, 0);
  if (typeof CM_TRACKS === 'undefined' || typeof CM_MILESTONES === 'undefined') return null;
  const ov = cmDurLoadOv();
  const setDur = (tid, idx, val) => {
    const cur = (ov[tid] || CM_MS_DUR_DEFAULT[tid] || []).slice();
    const n = parseInt(val, 10);
    cur[idx] = isNaN(n) || n < 1 ? (CM_MS_DUR_DEFAULT[tid] || [])[idx] || 21 : n;
    cmDurPersist({ ...ov, [tid]: cur }); bump();
  };
  const resetTrack = (tid) => { const next = { ...ov }; delete next[tid]; cmDurPersist(next); bump(); showToast('Durations reset to defaults'); };
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 10px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Coordination — typical durations</h2>
        <span className="meta" style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>days from the previous milestone · drives auto-set deadlines on every project</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        {CM_TRACKS.map(t => {
          const defs = CM_MILESTONES[t.id] || [];
          const durs = ov[t.id] || CM_MS_DUR_DEFAULT[t.id] || [];
          const edited = !!ov[t.id] && JSON.stringify(ov[t.id]) !== JSON.stringify(CM_MS_DUR_DEFAULT[t.id]);
          const total = durs.slice(0, defs.length).reduce((s, d) => s + (d || 0), 0);
          return (
            <div className="panel" key={t.id}>
              <div className="panel-hd">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{t.lab}{edited && <span className="badge b-amber">edited</span>}</h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="meta" style={{ fontSize: 11 }}>≈ {Math.round(total / 7)} wks end-to-end</span>
                  {edited && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => resetTrack(t.id)}>reset</button>}
                </span>
              </div>
              <div style={{ padding: '6px 16px 12px' }}>
                {defs.map((lab, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                    <span style={{ flex: 1, color: 'var(--ink-2)' }}>{i + 1}. {lab}</span>
                    <input type="number" min="1" className="input" style={{ width: 62, height: 24, fontSize: 11.5, textAlign: 'right' }} value={durs[i] || ''} onChange={e => setDur(t.id, i, e.target.value)} />
                    <span style={{ fontSize: 10.5, color: 'var(--ink-4)', width: 26 }}>days</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { CatalogPage });
