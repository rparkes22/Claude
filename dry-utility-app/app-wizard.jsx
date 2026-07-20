// Dry Utility App — Add Project wizard.
// Step 1: Project number, name, client, location (street/city/state/zip)
// Step 2: City determines the agency list → select agencies
// Step 3: Select service modules (Utility Research / Coordination) → review & create

function WizIcon({ name, size = 14 }) {
  const p = {
    check: 'M3 8l3 3 7-7',
    x: 'M3 3l10 10M13 3L3 13',
    back: 'M10 3L5 8l5 5',
    go: 'M3 8h9m0 0l-3-3m3 3l-3 3',
    pin: 'M8 14s5-5 5-9a5 5 0 1 0-10 0c0 4 5 9 5 9zm0-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    building: 'M3 14V3h6v11M9 6h4v8M5 5h2M5 8h2M5 11h2M11 8h0M11 11h0M2 14h13',
    task: 'M4 2h6l2 2v10H4V2zm2 6l1.5 1.5L11 6',
  }[name];
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={p} /></svg>;
}

const WIZ_STEPS = [
  { n: 1, label: 'Project details' },
  { n: 2, label: 'Agencies' },
  { n: 3, label: 'Modules & review' },
];

function AddProjectWizard({ open, onClose, onCreate, existingCodes }) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    code: '', name: '', client: '',
    street: '', city: '', state: 'CA', zip: '', contractDate: '',
  });
  const [agencies, setAgencies] = React.useState([]);      // agency ids
  const [modules, setModules] = React.useState({ research: true, coordination: false });
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    if (open) { setStep(1); setForm({ code: '', name: '', client: '', street: '', city: '', state: 'CA', zip: '', contractDate: '' }); setAgencies([]); setModules({ research: true, coordination: false }); setErr(null); }
  }, [open]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(null); };

  // city change resets downstream selections
  const setCity = (city) => {
    setForm(f => ({ ...f, city }));
    setAgencies([]); setErr(null);
  };

  const cityAgencies = form.city ? [
    ...(CITY_AGENCIES[form.city] || []),
    ...Object.keys(AGENCIES).filter(aid => AGENCIES[aid].custom && !(CITY_AGENCIES[form.city] || []).includes(aid)),
  ] : [];

  const toggleAgency = (aid) => {
    setErr(null);
    setAgencies(prev => prev.includes(aid) ? prev.filter(x => x !== aid) : [...prev, aid]);
  };

  const validate1 = () => {
    if (!form.code.trim()) return 'Project number is required.';
    if (existingCodes.includes(form.code.trim().toUpperCase())) return `Project number ${form.code.trim().toUpperCase()} already exists.`;
    if (!form.name.trim()) return 'Project name is required.';
    if (!form.client.trim()) return 'Client is required.';
    if (!form.street.trim()) return 'Street address is required.';
    if (!form.city) return 'City is required — it determines the agency list.';
    if (!/^\d{5}$/.test(form.zip.trim())) return 'Enter a 5-digit ZIP code.';
    return null;
  };
  const validate2 = () => agencies.length === 0 ? 'Select at least one agency.' : null;
  const validate3 = () => (modules.research || modules.coordination) ? null : 'Select at least one module.';

  const next = () => {
    const v = step === 1 ? validate1() : step === 2 ? validate2() : validate3();
    if (v) { setErr(v); return; }
    if (step < 3) { setStep(step + 1); return; }
    // create — streamlined: no per-agency micro-tasks; modules drive the project page
    const pid = 'up' + Date.now();
    try {
      const ov = JSON.parse(localStorage.getItem('msa_app_modules_v1')) || {};
      ov[pid] = { research: !!modules.research, coordination: !!modules.coordination };
      localStorage.setItem('msa_app_modules_v1', JSON.stringify(ov));
    } catch (e) {}
    const utility = agencies.includes('iid') ? 'IID' : agencies.includes('sce') ? 'SCE' : '—';
    onCreate({
      id: pid,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      client: form.client.trim(),
      location: { street: form.street.trim(), city: form.city, state: form.state, zip: form.zip.trim() },
      contractDate: form.contractDate || null,
      utility, pm: '—', phase: 'Lead',
      agencies: agencies.slice(),
      tasks: [],
      wsl: null,
      dd: [],
      reporting: { cadence: 'Bi-weekly', lastSent: null, changes: 0 },
      userAdded: true,
    });
  };

  return (
    <div className={`modal-backdrop ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="modal" style={{ width: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>Add project</h3>
              <div className="m-sub">{WIZ_STEPS[step - 1].label} — step {step} of 3</div>
            </div>
            <button className="modal-close" onClick={onClose}><WizIcon name="x" /></button>
          </div>
          <div className="wiz-steps">
            {WIZ_STEPS.map(s => (
              <div key={s.n} className={`wiz-step ${step === s.n ? 'now' : step > s.n ? 'done' : ''}`}>
                <span className="wiz-n">{step > s.n ? <WizIcon name="check" size={10} /> : s.n}</span>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-body">
          {err && <div className="login-err">{err}</div>}

          {/* STEP 1 — details + location */}
          {step === 1 && (
            <div>
              <div className="form-row">
                <div className="field">
                  <label>Project number <span className="req">*</span></label>
                  <input className="input mono" value={form.code} onChange={e => set('code', e.target.value)} placeholder="DRU-2201" />
                </div>
                <div className="field">
                  <label>Client <span className="req">*</span></label>
                  <input className="input" value={form.client} onChange={e => set('client', e.target.value)} placeholder="Helio Partners" />
                </div>
              </div>
              <div className="field">
                <label>Project name <span className="req">*</span></label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mecca Substation Interconnect" />
              </div>
              <div className="field">
                <label>Street address <span className="req">*</span></label>
                <input className="input" value={form.street} onChange={e => set('street', e.target.value)} placeholder="1200 Industrial Way" />
              </div>
              <div className="form-row-3">
                <div className="field">
                  <label>City <span className="req">*</span></label>
                  <select className="select" value={form.city} onChange={e => setCity(e.target.value)}>
                    <option value="">Select city…</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>State</label>
                  <select className="select" value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="CA">CA</option>
                    <option value="AZ">AZ</option>
                    <option value="NV">NV</option>
                  </select>
                </div>
                <div className="field">
                  <label>ZIP <span className="req">*</span></label>
                  <input className="input mono" value={form.zip} onChange={e => set('zip', e.target.value.replace(/[^\d]/g, '').slice(0, 5))} placeholder="92243" />
                </div>
                <div className="field">
                  <label>Contract executed</label>
                  <input type="date" className="input" value={form.contractDate} onChange={e => set('contractDate', e.target.value)} />
                </div>
              </div>
              {form.city && (
                <div className="hint" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <WizIcon name="pin" size={13} />
                  {form.city} has {(CITY_AGENCIES[form.city] || []).length} serving agencies — you'll pick them next.
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — agencies for city */}
          {step === 2 && (() => {
            const AgencyCard = ({ aid }) => {
              const a = AGENCIES[aid];
              if (!a) return null;
              const on = agencies.includes(aid);
              return (
                <div className={`agency-card ${on ? 'on' : ''}`} onClick={() => toggleAgency(aid)}>
                  <div className="agency-top">
                    <span className="agency-check">{on && <WizIcon name="check" size={10} />}</span>
                    <span className="agency-name">{a.name}</span>
                    <span className="util-tag util-iid mono" style={{ marginLeft: 4 }}>{a.short}</span>
                    <span className="agency-kind">{a.kind}</span>
                  </div>
                  <div className="agency-note">{a.note}</div>
                </div>
              );
            };
            const otherAgencies = Object.keys(AGENCIES).filter(aid => !cityAgencies.includes(aid))
              .sort((x, y) => AGENCIES[x].name.localeCompare(AGENCIES[y].name));
            return (
              <div>
                <div className="hint" style={{ marginBottom: 12, marginTop: 0 }}>
                  Agencies serving <b style={{ color: 'var(--ink)' }}>{form.city}, {form.state}</b> — select all that apply to this project.
                </div>
                <div className="agency-list">
                  {cityAgencies.map(aid => <AgencyCard key={aid} aid={aid} />)}
                </div>
                {otherAgencies.length > 0 && (
                  <details style={{ marginTop: 14 }}>
                    <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer', userSelect: 'none' }}>
                      All other agencies ({otherAgencies.length}){agencies.filter(a => otherAgencies.includes(a)).length > 0 ? ` · ${agencies.filter(a => otherAgencies.includes(a)).length} selected` : ''}
                    </summary>
                    <div className="agency-list" style={{ marginTop: 10 }}>
                      {otherAgencies.map(aid => <AgencyCard key={aid} aid={aid} />)}
                    </div>
                  </details>
                )}
              </div>
            );
          })()}

          {/* STEP 3 — modules + summary */}
          {step === 3 && (
            <div>
              <div className="hint" style={{ marginBottom: 12, marginTop: 0 }}>
                Choose the service modules for this project. You can add or remove modules later on the project page.
              </div>
              {[
                { id: 'research', name: 'Utility Research', desc: `Standardized jurisdiction-verification letters to the ${agencies.length} selected ${agencies.length === 1 ? 'agency' : 'agencies'} — sent log, responses, jurisdiction summary.` },
                { id: 'coordination', name: 'Utility Coordination', desc: 'Hand-off tracking by worksheet track — SCE Rule 15 / Rule 16, Gas Co backbone / meters, Frontier, Spectrum. Pick tracks after the project is created.' },
              ].map(m => {
                const on = modules[m.id];
                return (
                  <div key={m.id} className={`agency-card ${on ? 'on' : ''}`} style={{ marginBottom: 8 }} onClick={() => { setErr(null); setModules(prev => ({ ...prev, [m.id]: !prev[m.id] })); }}>
                    <div className="agency-top">
                      <span className="agency-check">{on && <WizIcon name="check" size={10} />}</span>
                      <span className="agency-name">{m.name}</span>
                    </div>
                    <div className="agency-note">{m.desc}</div>
                  </div>
                );
              })}
              <div className="summary-box" style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', fontWeight: 700, marginBottom: 6 }}>Review</div>
                <div className="kv"><span className="k">Project</span><span className="v mono">{form.code.toUpperCase()}</span></div>
                <div className="kv"><span className="k">Name</span><span className="v">{form.name}</span></div>
                <div className="kv"><span className="k">Client</span><span className="v">{form.client}</span></div>
                <div className="kv"><span className="k">Location</span><span className="v">{form.street}, {form.city}, {form.state} {form.zip}</span></div>
                {form.contractDate && <div className="kv"><span className="k">Contract</span><span className="v mono">{form.contractDate}</span></div>}
                <div className="kv"><span className="k">Agencies</span><span className="v">{agencies.map(a => AGENCIES[a].short).join(' · ')}</span></div>
                <div className="kv"><span className="k">Modules</span><span className="v">{[modules.research && 'Utility Research', modules.coordination && 'Utility Coordination'].filter(Boolean).join(' · ') || '—'}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-ft">
          {step > 1 && <button className="btn" onClick={() => { setStep(step - 1); setErr(null); }}><WizIcon name="back" size={13} />Back</button>}
          <div style={{ flex: 1 }}></div>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={next}>
            {step < 3 ? <>Continue <WizIcon name="go" size={13} /></> : <><WizIcon name="check" size={13} />Create project</>}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AddProjectWizard, WizIcon });
