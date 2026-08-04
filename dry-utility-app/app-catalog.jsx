// Blueprint — Agency Setup (admin only).
//
// One agency row is the unit of everything: its letter contacts and its coordination
// task templates are edited inside that row rather than in three separate lists that
// each repeat the directory. Cities and the shared kind templates get their own tabs.
//
// Templates come in three layers, shown separately so it is obvious what is inherited:
//   shared  — from the agency's kind (edit once on the Shared templates tab)
//   built-in — specific to this agency
//   custom  — added here by an admin
// Any of the first two can be hidden for one agency without deleting it.

// ---- catalog mutation helpers ----
function catSetOv(aid, id, patch) {
  const cat = loadTaskCatalog();
  const ov = { ...(cat._ov || {}) };
  const forAgency = { ...(ov[aid] || {}) };
  if (patch === null) delete forAgency[id]; else forAgency[id] = { ...forAgency[id], ...patch };
  ov[aid] = forAgency;
  persistTaskCatalog({ ...cat, _ov: ov });
}
function catAddCustom(aid, task) {
  const cat = loadTaskCatalog();
  persistTaskCatalog({ ...cat, [aid]: [...(cat[aid] || []), task] });
}
function catEditCustom(aid, id, patch) {
  const cat = loadTaskCatalog();
  persistTaskCatalog({ ...cat, [aid]: (cat[aid] || []).map(t => t.id === id ? { ...t, ...patch } : t) });
}
function catRemoveCustom(aid, id) {
  const cat = loadTaskCatalog();
  persistTaskCatalog({ ...cat, [aid]: (cat[aid] || []).filter(t => t.id !== id) });
}
function kindMut(kind, fn) {
  const cat = loadTaskCatalog();
  const all = { ...(cat._kind || {}) };
  const entry = { ov: { ...((all[kind] || {}).ov || {}) }, add: [...((all[kind] || {}).add || [])] };
  fn(entry);
  all[kind] = entry;
  persistTaskCatalog({ ...cat, _kind: all });
}
const kindSetOv = (kind, id, patch) => kindMut(kind, e => { if (patch === null) delete e.ov[id]; else e.ov[id] = { ...e.ov[id], ...patch }; });
const kindAddCustom = (kind, task) => kindMut(kind, e => { e.add.push(task); });
const kindEditCustom = (kind, id, patch) => kindMut(kind, e => { e.add = e.add.map(t => t.id === id ? { ...t, ...patch } : t); });
const kindRemoveCustom = (kind, id) => kindMut(kind, e => { e.add = e.add.filter(t => t.id !== id); });

// ---- template views (unfiltered, so hidden entries can be restored) ----
function agencyTemplateView(aid) {
  const cat = loadTaskCatalog();
  const ov = (cat._ov && cat._ov[aid]) || {};
  const apply = (t) => ov[t.id] ? { ...t, ...ov[t.id], edited: !!(ov[t.id].name || ov[t.id].days) } : t;
  const rows = [...tasksForKind((AGENCIES[aid] || {}).kind, cat), ...(AGENCY_TASKS[aid] || [])].map(apply);
  return {
    shared: rows.filter(t => t.shared && !t.removed),
    own: rows.filter(t => !t.shared && !t.removed),
    custom: cat[aid] || [],
    hidden: rows.filter(t => t.removed),
  };
}
function kindTemplateView(kind) {
  const cat = loadTaskCatalog();
  const k = (cat._kind && cat._kind[kind]) || {};
  const ov = k.ov || {};
  const apply = (t) => ov[t.id] ? { ...t, ...ov[t.id], edited: !!(ov[t.id].name || ov[t.id].days) } : t;
  const base = (KIND_TASKS[kind] || []).map(apply);
  return { base: base.filter(t => !t.removed), hidden: base.filter(t => t.removed), add: k.add || [] };
}

// ---- small shared pieces ----
function TemplateEditor({ task, onSave, onCancel }) {
  const [n, setN] = React.useState(task ? task.name : '');
  const [d, setD] = React.useState(task ? (task.days || '') : '');
  const commit = () => { if (n.trim()) onSave(n.trim(), d.trim() || 'varies'); };
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0' }}>
      <input className="input" autoFocus style={{ height: 27, fontSize: 12.5, flex: 1, minWidth: 160 }} placeholder="Task name"
        value={n} onChange={e => setN(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel(); }} />
      <input className="input" style={{ height: 27, fontSize: 12.5, width: 92 }} placeholder="duration"
        value={d} onChange={e => setD(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') commit(); }} />
      <button className="btn btn-primary btn-sm" style={{ height: 25 }} onClick={commit} disabled={!n.trim()}>Save</button>
      <button className="btn btn-sm" style={{ height: 25 }} onClick={onCancel}>Cancel</button>
    </div>
  );
}

// one template line: name, duration, provenance badge, and the actions that apply to it
function TemplateRow({ t, badge, onEdit, onHide, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12.5, borderBottom: '1px solid var(--border)' }}>
      <span style={{ flex: 1, minWidth: 0 }}>{t.name}</span>
      {badge}
      {t.edited && <span className="badge b-amber" style={{ fontSize: 9.5 }}>edited</span>}
      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', width: 62, textAlign: 'right' }}>{t.days || 'varies'}</span>
      <button className="btn btn-ghost btn-sm" style={{ height: 21, fontSize: 10.5 }} onClick={onEdit}>edit</button>
      {onHide && <button className="btn btn-ghost btn-sm" style={{ height: 21, fontSize: 10.5 }} title="Hide this template here — it can be restored" onClick={onHide}>hide</button>}
      {onDelete && <button className="btn btn-ghost btn-sm" style={{ height: 21, padding: '0 6px', color: 'var(--warn)' }} title="Delete template" onClick={onDelete}><Icon name="x" size={10} /></button>}
    </div>
  );
}
function HiddenStrip({ rows, onRestore, label }) {
  if (!rows.length) return null;
  return (
    <div style={{ padding: '7px 0 2px', fontSize: 11.5, color: 'var(--ink-4)', display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
      {label || 'Hidden:'}
      {rows.map(t => <button key={t.id} className="btn btn-ghost btn-sm" style={{ height: 21, fontSize: 10.5 }} onClick={() => onRestore(t)}>{t.name} ↺ restore</button>)}
    </div>
  );
}
const SubHead = ({ children, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 2px' }}>
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--ink-3)' }}>{children}</span>
    <span style={{ flex: 1 }} />
    {right}
  </div>
);

// ---- contacts (letter recipients) for one agency ----
function ContactForm({ f, set, onSave, onCancel, isNew }) {
  return (
    <div style={{ border: '1px solid var(--primary)', background: 'var(--primary-tint)', borderRadius: 10, padding: 12, margin: '6px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div className="field" style={{ marginBottom: 8 }}><label>Utility label</label><input className="input" autoFocus={isNew} style={{ height: 28, fontSize: 12 }} placeholder="e.g. Water (DWA)" value={f.label} onChange={set('label')} /></div>
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

function AgencyContacts({ aid, bump, showToast }) {
  const rows = getLetterRecipients().filter(r => r.agency === aid);
  const removedIds = loadContactMods().removed.filter(id => (LETTER_RECIPIENTS.find(r => r.id === id) || {}).agency === aid);
  const blank = { label: '', attn: '', contact: '', email: '', addr1: '', addr2: '' };
  const [editing, setEditing] = React.useState(null);
  const [f, setF] = React.useState(blank);
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const startEdit = (r) => { setEditing(r.id); setF({ label: r.label, attn: r.attn, contact: r.contact || '', email: r.email, addr1: r.addr[0] || '', addr2: r.addr[1] || '' }); };
  const save = () => {
    if (!f.label.trim() || !f.attn.trim() || !f.email.trim()) return;
    const patch = { label: f.label.trim(), agency: aid, attn: f.attn.trim(), contact: f.contact.trim() || undefined, email: f.email.trim(), addr: [f.addr1.trim(), f.addr2.trim()].filter(Boolean) };
    if (editing === 'new') { addRecipient({ id: 'lrc-' + Date.now(), ...patch }); showToast(`Contact added — ${patch.label}`); }
    else { updateRecipient(editing, patch); showToast('Contact updated'); }
    setEditing(null); bump();
  };
  return (
    <div>
      <SubHead right={editing !== 'new' && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => { setEditing('new'); setF(blank); }}>+ Add contact</button>}>
        Letter contacts <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--ink-4)' }}>— used by the research-letter generator</span>
      </SubHead>
      {rows.length === 0 && editing !== 'new' && <div style={{ fontSize: 12, color: 'var(--ink-4)', padding: '6px 0' }}>No letter contact yet — research letters for this agency can't be addressed.</div>}
      {rows.map(r => editing === r.id ? (
        <ContactForm key={r.id} f={f} set={set} onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12.5, borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 600, width: 150 }}>{r.label}</span>
          <span style={{ color: 'var(--ink-3)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.contact ? r.contact + ' · ' : ''}{r.email}{r.addr.length ? ' · ' + r.addr.join(', ') : ''}</span>
          {r.custom && <span className="badge b-teal" style={{ fontSize: 9.5 }}>custom</span>}
          {r.edited && <span className="badge b-amber" style={{ fontSize: 9.5 }}>edited</span>}
          <button className="btn btn-ghost btn-sm" style={{ height: 21, fontSize: 10.5 }} onClick={() => startEdit(r)}>edit</button>
          {r.edited && <button className="btn btn-ghost btn-sm" style={{ height: 21, fontSize: 10.5 }} onClick={() => { resetRecipient(r.id); bump(); showToast('Contact reset to original'); }}>reset</button>}
          <button className="btn btn-ghost btn-sm" style={{ height: 21, padding: '0 6px', color: 'var(--warn)' }} title="Remove contact" onClick={() => { if (window.confirm(`Remove ${r.label} from the address book?`)) { removeRecipient(r.id); bump(); showToast('Contact removed'); } }}><Icon name="x" size={10} /></button>
        </div>
      ))}
      {editing === 'new' && <ContactForm f={f} set={set} onSave={save} onCancel={() => setEditing(null)} isNew />}
      <HiddenStrip rows={removedIds.map(id => LETTER_RECIPIENTS.find(r => r.id === id))} label="Removed:" onRestore={(r) => { resetRecipient(r.id); bump(); showToast(`Restored — ${r.label}`); }} />
    </div>
  );
}

// ---- one expanded agency: identity, contacts, task templates ----
function AgencyDetail({ aid, projects, bump, showToast }) {
  const a = AGENCIES[aid];
  const [edit, setEdit] = React.useState(null); // {scope:'shared'|'own'|'custom', id} | 'new'
  const [ident, setIdent] = React.useState(null);
  const v = agencyTemplateView(aid);
  const after = (msg) => { setEdit(null); bump(); showToast(msg); };
  const inUse = (projects || []).filter(p => p.agencies.includes(aid)).length;
  const cities = CITIES.filter(c => (CITY_AGENCIES[c] || []).includes(aid));

  const saveTemplate = (scope, id) => (name, days) => {
    if (scope === 'custom') catEditCustom(aid, id, { name, days });
    else catSetOv(aid, id, { name, days });
    after('Template updated');
  };

  return (
    <div style={{ padding: '2px 16px 16px', background: 'var(--bg-2, #fafafa)', borderTop: '1px solid var(--border)' }}>
      <SubHead right={
        <span style={{ display: 'inline-flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => setIdent(ident ? null : { name: a.name, short: a.short, kind: a.kind || 'Other' })}>{ident ? 'cancel' : 'edit agency'}</button>
          {!a.custom && a.edited && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => { resetAgency(aid); bump(); showToast('Agency reset to original'); }}>reset</button>}
        </span>
      }>Details</SubHead>
      {ident ? (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0' }}>
          <input className="input" autoFocus style={{ height: 27, fontSize: 12.5, flex: 1, minWidth: 170 }} value={ident.name} onChange={e => setIdent({ ...ident, name: e.target.value })} />
          <input className="input" style={{ height: 27, fontSize: 12.5, width: 70 }} maxLength={5} value={ident.short} onChange={e => setIdent({ ...ident, short: e.target.value })} />
          <select className="select" style={{ width: 'auto', height: 27, fontSize: 12 }} value={ident.kind} onChange={e => setIdent({ ...ident, kind: e.target.value })}>
            {AGENCY_KINDS.map(k => <option key={k}>{k}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" style={{ height: 25 }} disabled={!ident.name.trim() || !ident.short.trim()}
            onClick={() => { updateAgency(aid, { name: ident.name.trim(), short: ident.short.trim().toUpperCase(), kind: ident.kind }); setIdent(null); bump(); showToast('Agency updated'); }}>Save</button>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '4px 0' }}>
          {a.note || a.kind}
          <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 3 }}>
            {inUse ? `On ${inUse} active project${inUse > 1 ? 's' : ''}` : 'Not on any active project'} · {cities.length ? `serves ${cities.join(', ')}` : 'not assigned to a city'}
          </div>
        </div>
      )}

      <AgencyContacts aid={aid} bump={bump} showToast={showToast} />

      <SubHead right={edit !== 'new' && <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => setEdit('new')}>+ Add task</button>}>
        Task templates <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--ink-4)' }}>— offered under “+ Add task” on projects</span>
      </SubHead>
      {edit === 'new' && (
        <TemplateEditor task={null} onCancel={() => setEdit(null)}
          onSave={(name, days) => { catAddCustom(aid, { id: `cat-${aid}-${Date.now()}`, name, days, custom: true }); after(`Added to ${a.short} — ${name}`); }} />
      )}
      {v.shared.map(t => edit && edit.id === t.id ? (
        <TemplateEditor key={t.id} task={t} onSave={saveTemplate('shared', t.id)} onCancel={() => setEdit(null)} />
      ) : (
        <TemplateRow key={t.id} t={t}
          badge={<span className="badge b-blue" style={{ fontSize: 9.5 }} title={`Shared across every ${t.kind} agency`}>{t.kind}</span>}
          onEdit={() => setEdit({ scope: 'shared', id: t.id })}
          onHide={() => { catSetOv(aid, t.id, { removed: true }); after('Hidden for this agency'); }} />
      ))}
      {v.own.map(t => edit && edit.id === t.id ? (
        <TemplateEditor key={t.id} task={t} onSave={saveTemplate('own', t.id)} onCancel={() => setEdit(null)} />
      ) : (
        <TemplateRow key={t.id} t={t} badge={null}
          onEdit={() => setEdit({ scope: 'own', id: t.id })}
          onHide={() => { catSetOv(aid, t.id, { removed: true }); after('Hidden for this agency'); }} />
      ))}
      {v.custom.map(t => edit && edit.id === t.id ? (
        <TemplateEditor key={t.id} task={t} onSave={saveTemplate('custom', t.id)} onCancel={() => setEdit(null)} />
      ) : (
        <TemplateRow key={t.id} t={t} badge={<span className="badge b-teal" style={{ fontSize: 9.5 }}>custom</span>}
          onEdit={() => setEdit({ scope: 'custom', id: t.id })}
          onDelete={() => { catRemoveCustom(aid, t.id); after('Template removed'); }} />
      ))}
      {!v.shared.length && !v.own.length && !v.custom.length && (
        <div style={{ fontSize: 12, color: 'var(--ink-4)', padding: '6px 0' }}>No templates — “+ Add task” on a project will only offer a custom entry.</div>
      )}
      <HiddenStrip rows={v.hidden} onRestore={(t) => { catSetOv(aid, t.id, null); after('Template restored'); }} />
    </div>
  );
}

// ---- tab 1: agencies ----
function AgenciesTab({ projects, rev, bump, showToast }) {
  const [q, setQ] = React.useState('');
  const [openId, setOpenId] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [nf, setNf] = React.useState({ name: '', short: '', kind: 'Municipal' });

  const create = () => {
    const n = nf.name.trim(), s = nf.short.trim().toUpperCase();
    if (!n || !s) return;
    const id = 'ag-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16);
    if (AGENCIES[id]) { showToast('An agency with that name already exists'); return; }
    addAgency({ id, name: n, short: s, kind: nf.kind, note: 'Custom agency' });
    setAdding(false); setNf({ name: '', short: '', kind: 'Municipal' }); setOpenId(id); bump();
    showToast(`Agency added — ${n}. It inherits the ${nf.kind} task templates.`);
  };
  const del = (aid) => {
    const a = AGENCIES[aid];
    const inUse = (projects || []).filter(p => p.agencies.includes(aid)).length;
    if (!window.confirm(`Remove ${a.name}?${inUse ? ` It is used on ${inUse} project${inUse > 1 ? 's' : ''} — those panels will show the raw id.` : ''}`)) return;
    removeAgency(aid); if (openId === aid) setOpenId(null); bump();
    showToast(`Agency removed — ${a.name}`);
  };

  const s = q.trim().toLowerCase();
  const match = (aid) => {
    const a = AGENCIES[aid];
    if (!s) return true;
    return (a.name + ' ' + a.short + ' ' + (a.kind || '')).toLowerCase().includes(s);
  };
  const ids = Object.keys(AGENCIES).filter(match);
  const kinds = [...AGENCY_KINDS, ...new Set(ids.map(id => AGENCIES[id].kind).filter(k => k && !AGENCY_KINDS.includes(k)))];
  const contactCount = getLetterRecipients().reduce((m, r) => ({ ...m, [r.agency]: (m[r.agency] || 0) + 1 }), {});

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <input className="input" style={{ height: 30, fontSize: 12.5, width: 240 }} placeholder="Search agencies…" value={q} onChange={e => setQ(e.target.value)} />
        <span className="meta" style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{ids.length} of {Object.keys(AGENCIES).length}</span>
        <span style={{ flex: 1 }} />
        {!adding ? (
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={12} />Add agency</button>
        ) : (
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', background: 'var(--primary-tint)', border: '1px solid var(--primary)', borderRadius: 9, padding: '7px 11px' }}>
            <input className="input" autoFocus style={{ height: 28, fontSize: 12.5, width: 210 }} placeholder="Agency name — e.g. City of Blythe" value={nf.name} onChange={e => setNf({ ...nf, name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') create(); }} />
            <input className="input" style={{ height: 28, fontSize: 12.5, width: 74 }} placeholder="Short" maxLength={5} value={nf.short} onChange={e => setNf({ ...nf, short: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') create(); }} />
            <select className="select" style={{ width: 'auto', height: 28, fontSize: 12.5 }} value={nf.kind} onChange={e => setNf({ ...nf, kind: e.target.value })}>
              {AGENCY_KINDS.map(k => <option key={k}>{k}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" style={{ height: 26 }} onClick={create} disabled={!nf.name.trim() || !nf.short.trim()}>Create</button>
            <button className="btn btn-sm" style={{ height: 26 }} onClick={() => setAdding(false)}>Cancel</button>
          </span>
        )}
      </div>

      {kinds.map(kind => {
        const group = ids.filter(id => (AGENCIES[id].kind || 'Other') === kind);
        if (!group.length) return null;
        return (
          <div key={kind} className="panel" style={{ marginBottom: 12 }}>
            <div className="panel-hd"><h2>{kind}</h2><span className="meta">{group.length}</span></div>
            <div>
              {group.map(aid => {
                const a = AGENCIES[aid];
                const open = openId === aid;
                const nTpl = tasksForAgency(aid).length;
                const nCon = contactCount[aid] || 0;
                return (
                  <div key={aid} style={{ borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 16px', cursor: 'pointer' }} onClick={() => setOpenId(open ? null : aid)}>
                      <span style={{ width: 12, color: 'var(--ink-4)', fontSize: 10 }}>{open ? '▾' : '▸'}</span>
                      <span className="util-tag util-iid mono" style={{ minWidth: 46, textAlign: 'center' }}>{a.short}</span>
                      <span style={{ fontWeight: 600, fontSize: 12.5 }}>{a.name}</span>
                      {a.custom && <span className="badge b-teal" style={{ fontSize: 9.5 }}>custom</span>}
                      {!a.custom && a.edited && <span className="badge b-amber" style={{ fontSize: 9.5 }}>edited</span>}
                      <span style={{ flex: 1 }} />
                      <span className="meta" style={{ fontSize: 11.5, color: nCon ? 'var(--ink-4)' : 'var(--warn)' }}>{nCon} contact{nCon === 1 ? '' : 's'}</span>
                      <span className="meta" style={{ fontSize: 11.5, color: 'var(--ink-4)', width: 92, textAlign: 'right' }}>{nTpl} template{nTpl === 1 ? '' : 's'}</span>
                      {a.custom && <button className="btn btn-ghost btn-sm" style={{ height: 22, padding: '0 6px', color: 'var(--warn)' }} title="Remove agency" onClick={e => { e.stopPropagation(); del(aid); }}><Icon name="x" size={10} /></button>}
                    </div>
                    {open && <AgencyDetail aid={aid} projects={projects} bump={bump} showToast={showToast} />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {ids.length === 0 && <div className="panel" style={{ padding: 18, fontSize: 12.5, color: 'var(--ink-3)' }}>No agency matches “{q}”.</div>}
    </div>
  );
}

// ---- tab 2: cities ----
function CitiesTab({ rev, bump, showToast }) {
  const [adding, setAdding] = React.useState(false);
  const [cityName, setCityName] = React.useState('');
  const [editingCity, setEditingCity] = React.useState(null);
  const agencyIds = Object.keys(AGENCIES);
  const toggle = (city, aid) => {
    const cur = CITY_AGENCIES[city] || [];
    updateCityAgencies(city, cur.includes(aid) ? cur.filter(x => x !== aid) : [...cur, aid]);
    bump();
  };
  const create = () => {
    const n = cityName.trim();
    if (!n) return;
    if (!addCity(n, ['socalgas'])) { showToast('That city already exists'); return; }
    setAdding(false); setCityName(''); setEditingCity(n); bump();
    showToast(`City added — ${n}. Pick its serving agencies.`);
  };
  const removed = removedCities();
  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Cities &amp; serving agencies <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--ink-4)' }}>— drives the agency list in the Add Project wizard</span></h2>
        {!adding
          ? <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={() => setAdding(true)}>+ Add city</button>
          : (
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <input className="input" autoFocus style={{ height: 28, fontSize: 12.5, width: 170 }} placeholder="City name" value={cityName} onChange={e => setCityName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') create(); }} />
              <button className="btn btn-primary btn-sm" style={{ height: 26 }} onClick={create} disabled={!cityName.trim()}>Add</button>
              <button className="btn btn-sm" style={{ height: 26 }} onClick={() => setAdding(false)}>Cancel</button>
            </span>
          )}
      </div>
      <div style={{ padding: '4px 16px 12px' }}>
        {CITIES.map(city => {
          const ids = CITY_AGENCIES[city] || [];
          const custom = isCustomCity(city);
          const edited = isEditedCity(city);
          const open = editingCity === city;
          return (
            <div key={city} style={{ borderBottom: '1px solid var(--border)', padding: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 12.5, width: 132 }}>{city}</span>
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
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: '8px 0 4px 132px' }}>
                  {agencyIds.map(aid => {
                    const on = ids.includes(aid);
                    return (
                      <button key={aid} className="btn btn-sm" title={AGENCIES[aid].name} onClick={() => toggle(city, aid)}
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

// ---- tab 3: shared templates by agency kind ----
function SharedTemplatesTab({ rev, bump, showToast }) {
  const [edit, setEdit] = React.useState(null); // {kind, id} | {kind, id:'new'}
  const counts = Object.keys(AGENCIES).reduce((m, id) => { const k = AGENCIES[id].kind || 'Other'; return { ...m, [k]: (m[k] || 0) + 1 }; }, {});
  const after = (msg) => { setEdit(null); bump(); showToast(msg); };
  return (
    <div>
      <div className="callout info" style={{ marginBottom: 14 }}>
        <Icon name="alert" size={16} />
        <div><b>Write once, applies everywhere.</b> These templates reach every agency of the kind — including agencies added later. An individual agency can rename or hide one for itself on the Agencies tab without affecting the rest.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        {AGENCY_KINDS.map(kind => {
          const v = kindTemplateView(kind);
          const n = counts[kind] || 0;
          return (
            <div className="panel" key={kind}>
              <div className="panel-hd">
                <h2>{kind}</h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="meta" style={{ fontSize: 11 }}>{n} agenc{n === 1 ? 'y' : 'ies'}</span>
                  <button className="btn btn-ghost btn-sm" style={{ height: 22, fontSize: 10.5 }} onClick={() => setEdit({ kind, id: 'new' })}>+ Add</button>
                </span>
              </div>
              <div style={{ padding: '4px 16px 12px' }}>
                {edit && edit.kind === kind && edit.id === 'new' && (
                  <TemplateEditor task={null} onCancel={() => setEdit(null)}
                    onSave={(name, days) => { kindAddCustom(kind, { id: `k-${kind.toLowerCase()}-${Date.now()}`, name, days, custom: true }); after(`Added to the ${kind} set — ${name}`); }} />
                )}
                {v.base.map(t => edit && edit.kind === kind && edit.id === t.id ? (
                  <TemplateEditor key={t.id} task={t} onCancel={() => setEdit(null)}
                    onSave={(name, days) => { kindSetOv(kind, t.id, { name, days }); after('Template updated'); }} />
                ) : (
                  <TemplateRow key={t.id} t={t} badge={null}
                    onEdit={() => setEdit({ kind, id: t.id })}
                    onHide={() => { kindSetOv(kind, t.id, { removed: true }); after(`Hidden for all ${kind} agencies`); }} />
                ))}
                {v.add.map(t => edit && edit.kind === kind && edit.id === t.id ? (
                  <TemplateEditor key={t.id} task={t} onCancel={() => setEdit(null)}
                    onSave={(name, days) => { kindEditCustom(kind, t.id, { name, days }); after('Template updated'); }} />
                ) : (
                  <TemplateRow key={t.id} t={t} badge={<span className="badge b-teal" style={{ fontSize: 9.5 }}>custom</span>}
                    onEdit={() => setEdit({ kind, id: t.id })}
                    onDelete={() => { kindRemoveCustom(kind, t.id); after('Template removed'); }} />
                ))}
                {!v.base.length && !v.add.length && <div style={{ fontSize: 12, color: 'var(--ink-4)', padding: '6px 0' }}>No shared templates for this kind.</div>}
                <HiddenStrip rows={v.hidden} onRestore={(t) => { kindSetOv(kind, t.id, null); after('Template restored'); }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- page shell ----
function CatalogPage({ projects, showToast }) {
  const [tab, setTab] = React.useState('agencies');
  const [rev, setRev] = React.useState(0);
  const bump = () => setRev(r => r + 1);
  const TABS = [
    ['agencies', 'Agencies', `${Object.keys(AGENCIES).length}`],
    ['cities', 'Cities', `${CITIES.length}`],
    ['templates', 'Shared templates', ''],
  ];
  return (
    <div>
      <div className="seg" style={{ display: 'inline-flex', gap: 4, marginBottom: 14, background: 'var(--bg-2, #f1f5f9)', padding: 3, borderRadius: 9 }}>
        {TABS.map(([id, lab, count]) => (
          <button key={id} className="btn btn-sm" onClick={() => setTab(id)}
            style={tab === id
              ? { background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,.08)', border: '1px solid var(--border)', height: 28, fontSize: 12.5, fontWeight: 600 }
              : { background: 'transparent', border: '1px solid transparent', height: 28, fontSize: 12.5, color: 'var(--ink-3)' }}>
            {lab}{count ? <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--ink-4)' }}>{count}</span> : null}
          </button>
        ))}
      </div>
      {/* rev is a prop, not a key — the tabs re-read the mutable globals on render, so an
          expanded agency or half-finished edit survives a save */}
      {tab === 'agencies' && <AgenciesTab projects={projects} rev={rev} bump={bump} showToast={showToast} />}
      {tab === 'cities' && <CitiesTab rev={rev} bump={bump} showToast={showToast} />}
      {tab === 'templates' && <SharedTemplatesTab rev={rev} bump={bump} showToast={showToast} />}
    </div>
  );
}

Object.assign(window, { CatalogPage });
