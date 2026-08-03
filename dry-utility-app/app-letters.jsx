// Research-letter generator — MSA "Utility Research Request" template (from uploaded letters).
// Recipient address book: verbatim from the project 2913 letter set; extendable per agency.
const LETTER_RECIPIENTS = [
  { id: 'lr-iid',  agency: 'iid',      label: 'Power (IID)',            attn: 'Imperial Irrigation District', email: 'RecordsManagement@IID.com', addr: ['81600 Avenue 58', 'La Quinta, CA 92253'] },
  { id: 'lr-cvwd', agency: 'cvwd',     label: 'Water / CVWD Drain',     attn: 'Coachella Valley Water District', email: 'PRARequests@cvwd.org', addr: ['51501 Tyler Street', 'Coachella, CA 92236'], method: 'portal', portalNote: 'CVWD requests go through their online records portal — all other agencies are by email.' },
  { id: 'lr-iwa',  agency: 'iwa',      label: 'Water (IWA)',            attn: 'Indio Water Authority', email: 'IWAEngineering@indio.org', addr: ['83-101 Avenue 45', 'Indio, CA 92201'] },
  { id: 'lr-myo',  agency: 'myoma',    label: 'Water (Myoma)',          attn: 'Myoma Dunes Mutual Water Co.', contact: 'Michelle', email: 'service@myoma.com', addr: ['79050 Avenue 42', 'Bermuda Dunes, CA 92203'] },
  { id: 'lr-vsd',  agency: 'vsd',      label: 'Sewer (VSD)',            attn: 'Valley Sanitary District', email: 'steve@valley-sanitary.org', addr: ['45-500 Van Buren', 'Indio, CA 92201'] },
  { id: 'lr-scgd', agency: 'socalgas', label: 'Gas — Distribution',     attn: 'Southern California Gas Company (Distribution)', email: 'SCGSERegionRedlandsUtilityRequest@semprautilities.com', addr: ['1981 Lugonia Ave', 'Redlands, CA 92374'] },
  { id: 'lr-scgt', agency: 'scgt',     label: 'Gas — Transmission',     attn: 'Southern California Gas Company (Transmission)', email: 'socalgastransmissionutilityrequest@semprautilities.com', addr: ['251 E. First Street', 'Beaumont, CA 92223'] },
  { id: 'lr-ftr',  agency: 'frontier', label: 'Telephone (Frontier)',   attn: 'Frontier Communications', contact: 'Lisa Jacobson', email: 'lisa.jacobson@dynamictelco.com', addr: ['295 N. Sunrise Way', 'Palm Springs, CA 92262'] },
  { id: 'lr-spc',  agency: 'spectrum', label: 'Cable (Spectrum)', attn: 'Spectrum', email: 'DL-Socal-charter-engineering@charter.com', addr: ['105 Kent Street', 'Iron Mountain, MI 49801'] },
  { id: 'lr-spr',  agency: 'sprint',   label: 'Fiber (Sprint / Cogent)', attn: 'Sprint Planning and Engineering Department', contact: 'Jeffrey York', email: 'jyork@cogentco.com', addr: ['282 South Sycamore Ave.', 'Rialto, CA 92376'] },
  { id: 'lr-att',  agency: 'att',      label: 'Telephone (AT&T)',       attn: 'AT&T Engineering', email: 'osp.requests@att.com', addr: ['1265 N Van Buren St', 'Anaheim, CA 92807'] },
];

// Admin contact management: edits to built-ins + custom recipients, persisted.
const CONTACTS_KEY = 'msa_app_letter_contacts_v1';
function loadContactMods() { try { return { edited: {}, added: [], removed: [], ...(JSON.parse(localStorage.getItem(CONTACTS_KEY)) || {}) }; } catch (e) { return { edited: {}, added: [], removed: [] }; } }
function persistContactMods(m) { try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(m)); } catch (e) {} window.dispatchEvent(new Event('msa-contacts-updated')); }
function getLetterRecipients() {
  const m = loadContactMods();
  return [
    ...LETTER_RECIPIENTS.filter(r => !m.removed.includes(r.id)).map(r => m.edited[r.id] ? { ...r, ...m.edited[r.id], edited: true } : r),
    ...m.added.map(r => ({ ...r, custom: true })),
  ];
}
function updateRecipient(id, patch) {
  const m = loadContactMods();
  const custom = m.added.find(r => r.id === id);
  if (custom) m.added = m.added.map(r => r.id === id ? { ...r, ...patch } : r);
  else m.edited[id] = { ...(m.edited[id] || {}), ...patch };
  persistContactMods(m);
}
function addRecipient(r) { const m = loadContactMods(); m.added.push(r); persistContactMods(m); }
function removeRecipient(id) {
  const m = loadContactMods();
  if (m.added.some(r => r.id === id)) m.added = m.added.filter(r => r.id !== id);
  else { m.removed.push(id); delete m.edited[id]; }
  persistContactMods(m);
}
function resetRecipient(id) { const m = loadContactMods(); delete m.edited[id]; m.removed = m.removed.filter(x => x !== id); persistContactMods(m); }

function letterBody(f) {
  return [
    `We are in the process of working on a new project in ${f.siteDesc}. We need any information your agency may have regarding existing utilities within the area described. Please include maps or atlases and As-Built plans for both above and below ground facilities if applicable.`,
    `We’ve included the Thomas Brother’s Map reference and Assessor’s Parcel Map location for your convenience.`,
    `Please include the MSA number when responding to this request. If you have any questions, please feel free to contact ${f.contactName} at ${f.contactEmail}.`,
    `I appreciate your help in this matter.`,
  ];
}

function LetterSheet({ r, f }) {
  return (
    <div className="letter-sheet">
      <div className="letter-msa-hd">
        <div className="letter-msa-logo">MSA CONSULTING, INC.</div>
        <div className="letter-msa-sub">34200 Bob Hope Drive, Rancho Mirage, CA 92270 · 760.320.9811 · msaconsultinginc.com</div>
      </div>
      <div className="letter-date">{fmt(f.date)}</div>
      <div className="letter-addr">
        {r.contact && <div>{r.contact}</div>}
        <div>{r.attn}</div>
        <div>{r.email}</div>
        {r.addr.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      <div className="letter-subj">
        <div><b>Subject: Utility Research Request</b></div>
        <div>MSA Job #: {f.jobNo}</div>
        <div>Map reference: {f.mapRef}</div>
        <div>APN: {f.apn}</div>
      </div>
      <div className="letter-body">
        <p>To whom it may concern:</p>
        {letterBody(f).map((p, i) => <p key={i}>{p}</p>)}
        <p>Thank you,</p>
        <div className="letter-sig">
          <div className="letter-sig-name">{f.signerName}</div>
          <div>{f.signerTitle}</div>
        </div>
      </div>
    </div>
  );
}

// Scales the fixed-width letter sheet down to fit the preview pane.
function PreviewScaler({ children }) {
  const SHEET_W = 691; // 7.2in at 96dpi
  const ref = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / SHEET_W));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: SHEET_W }}>{children}</div>
    </div>
  );
}

// Letters logged from the generator into each project's research tracker
const RES_ADDED_KEY = 'msa_app_research_added_v1';
function loadAddedResearch() { try { return JSON.parse(localStorage.getItem(RES_ADDED_KEY)) || {}; } catch (e) { return {}; } }
function persistAddedResearch(m) { try { localStorage.setItem(RES_ADDED_KEY, JSON.stringify(m)); } catch (e) {} window.dispatchEvent(new Event('msa-research-updated')); }

function LetterGenModal({ p, open, onClose, currentUser, showToast }) {
  const BOOK = React.useMemo(() => getLetterRecipients(), [open]);
  const relevant = BOOK.filter(r => p.agencies.includes(r.agency));
  const others = BOOK.filter(r => !p.agencies.includes(r.agency));
  const [selected, setSelected] = React.useState(() => new Set(relevant.map(r => r.id)));
  const [fields, setFields] = React.useState(null);
  const [previewId, setPreviewId] = React.useState(null);
  React.useEffect(() => {
    if (!open) return;
    setSelected(new Set(relevant.map(r => r.id)));
    setPreviewId(relevant[0]?.id || BOOK[0]?.id);
    setFields({
      date: TODAY.toISOString().slice(0, 10),
      jobNo: p.code,
      apn: p.apn || '',
      mapRef: p.mapRef || '',
      siteDesc: `a vacant property at ${p.location.street}, in the City of ${p.location.city}${p.acreage ? `. The subject site is located on approximately ${p.acreage.replace('≈', '')}` : ''}`,
      contactName: 'Michael Schreiber',
      contactEmail: 'mschreiber@msaconsultinginc.com',
      signerName: currentUser ? currentUser.name : '',
      signerTitle: currentUser && currentUser.role === 'admin' ? 'Dry Utility Manager' : 'Project Administrator',
    });
  }, [open, p.id]);
  if (!open || !fields) return null;
  const set = (k) => (e) => setFields(prev => ({ ...prev, [k]: e.target.value }));
  const toggle = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const chosen = BOOK.filter(r => selected.has(r.id));
  const preview = BOOK.find(r => r.id === previewId) || chosen[0];
  const doPrint = () => {
    if (!chosen.length) return;
    // log printed letters into the project's research tracker (dedupe on recipient email + sent date)
    const all = loadAddedResearch();
    const existing = [...(p.research || []), ...(all[p.id] || [])];
    const fresh = chosen.filter(r => !existing.some(x => x.to === r.email && x.sent === fields.date))
      .map((r, i) => ({ id: 'ra-' + Date.now() + '-' + i, agency: r.agency, label: r.label, sent: fields.date, received: null, to: r.email, file: null, logged: true, owner: 'u2', by: currentUser ? currentUser.initials : '' }));
    if (fresh.length) persistAddedResearch({ ...all, [p.id]: [...(all[p.id] || []), ...fresh] });
    const holder = document.createElement('div');
    holder.id = 'letter-print-root';
    document.body.appendChild(holder);
    const root = ReactDOM.createRoot(holder);
    root.render(<div>{chosen.map(r => <LetterSheet key={r.id} r={r} f={fields} />)}</div>);
    setTimeout(() => {
      window.print();
      setTimeout(() => { root.unmount(); holder.remove(); }, 400);
      showToast && showToast(`${chosen.length} letter${chosen.length > 1 ? 's' : ''} sent to print — save as PDF from the dialog`);
    }, 120);
  };
  const RecipRow = ({ r, dim }) => (
    <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer', fontSize: 12.5, opacity: dim && !selected.has(r.id) ? 0.65 : 1 }}>
      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} style={{ accentColor: 'var(--primary)' }} />
      <span style={{ fontWeight: 600, flex: 1 }}>{r.label}{r.method === 'portal' && <span className="badge b-blue" style={{ marginLeft: 7, fontSize: 9.5 }}>portal</span>}</span>
      <span style={{ fontSize: 10.5, color: 'var(--ink-4)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.method === 'portal' ? 'CVWD online portal' : r.email}</span>
      <button type="button" className="btn btn-ghost btn-sm" style={{ height: 20, fontSize: 10.5, padding: '0 6px' }} onClick={(e) => { e.preventDefault(); setPreviewId(r.id); }}>Preview</button>
    </label>
  );
  return (
    <div className="modal-backdrop open" onClick={backdropClose(onClose)}>
      <div className="modal" style={{ width: 'min(1060px, 94vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <div><h3>Generate research letters</h3><div className="m-sub">{p.code} · {p.name} — Utility Research Request template</div></div>
          <button className="drawer-close" style={{ width: 30, height: 30, border: 0, borderRadius: 6, background: 'var(--surface-2)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }} onClick={onClose}><ProjIcon name="x" /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 0, flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="field"><label>Letter date</label><input type="date" className="input" style={{ height: 30, fontSize: 12 }} value={fields.date} onChange={set('date')} /></div>
              <div className="field"><label>MSA Job #</label><input className="input" style={{ height: 30, fontSize: 12 }} value={fields.jobNo} onChange={set('jobNo')} /></div>
              <div className="field"><label>APN</label><input className="input" style={{ height: 30, fontSize: 12 }} value={fields.apn} onChange={set('apn')} /></div>
              <div className="field"><label>Map reference</label><input className="input" style={{ height: 30, fontSize: 12 }} value={fields.mapRef} onChange={set('mapRef')} /></div>
            </div>
            <div className="field"><label>Site description</label><textarea className="input" style={{ height: 64, fontSize: 12, padding: 8, resize: 'vertical' }} value={fields.siteDesc} onChange={set('siteDesc')} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="field"><label>Contact name</label><input className="input" style={{ height: 30, fontSize: 12 }} value={fields.contactName} onChange={set('contactName')} /></div>
              <div className="field"><label>Contact email</label><input className="input" style={{ height: 30, fontSize: 12 }} value={fields.contactEmail} onChange={set('contactEmail')} /></div>
              <div className="field"><label>Signed by</label><input className="input" style={{ height: 30, fontSize: 12 }} value={fields.signerName} onChange={set('signerName')} /></div>
              <div className="field"><label>Signer title</label><input className="input" style={{ height: 30, fontSize: 12 }} value={fields.signerTitle} onChange={set('signerTitle')} /></div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Recipients ({selected.size} selected)</label>
              {relevant.map(r => <RecipRow key={r.id} r={r} />)}
              {others.length > 0 && <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', fontWeight: 600, margin: '8px 0 2px' }}>Other agencies</div>}
              {others.map(r => <RecipRow key={r.id} r={r} dim />)}
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', overflowY: 'auto', padding: 20, minWidth: 0 }}>
            {preview ? <PreviewScaler><LetterSheet r={preview} f={fields} /></PreviewScaler> : <div style={{ fontSize: 12.5, color: 'var(--ink-4)', textAlign: 'center', paddingTop: 40 }}>Select a recipient to preview</div>}
          </div>
        </div>
        <div className="modal-ft">
          <span style={{ fontSize: 11.5, color: 'var(--ink-4)', marginRight: 'auto' }}>Prints one letter per page — choose "Save as PDF" in the print dialog</span>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={doPrint} disabled={!chosen.length}><ProjIcon name="report" size={13} />{`Print ${chosen.length} letter${chosen.length === 1 ? '' : 's'}`}</button>
        </div>
      </div>
    </div>
  );
}

// Follow-up log for research letters ({ projectId: { rowId: lastFollowUpDate } })
const RES_FU_KEY = 'msa_app_research_fu_v1';
function loadResearchFu() { try { return JSON.parse(localStorage.getItem(RES_FU_KEY)) || {}; } catch (e) { return {}; } }
function persistResearchFu(m) { try { localStorage.setItem(RES_FU_KEY, JSON.stringify(m)); } catch (e) {} window.dispatchEvent(new Event('msa-research-updated')); }

Object.assign(window, { LetterGenModal, LETTER_RECIPIENTS, getLetterRecipients, updateRecipient, addRecipient, removeRecipient, resetRecipient, loadContactMods, loadAddedResearch, persistAddedResearch, loadResearchFu, persistResearchFu });
