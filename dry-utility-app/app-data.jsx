// Blueprint — shared data, auth store, agency/task catalogs.
// Exposed on window for the other Babel scripts.

const TODAY = new Date('2026-07-13T00:00:00');

// Parse date-only strings (YYYY-MM-DD) as LOCAL midnight, not UTC — avoids off-by-one
// display in negative-UTC-offset locales (e.g. US Pacific).
const parseDate = (d) => (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) ? new Date(d + 'T00:00:00') : new Date(d);
const addYears = (d, n) => { const x = parseDate(d); x.setFullYear(x.getFullYear() + n); return x; };
const addMonths = (d, n) => { const x = parseDate(d); x.setMonth(x.getMonth() + n); return x; };
const addDays = (d, n) => { const x = parseDate(d); x.setDate(x.getDate() + n); return x; };
const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
const fmt = (d) => parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtShort = (d) => parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ===== USERS & ROLES =====
// Roles: admin (full access + user mgmt), editor (read/write projects), viewer (read-only)
const SEED_USERS = [
  { id: 'u1', name: 'Michael Schreiber', initials: 'MS', email: 'mschreiber@msaconsultinginc.com', role: 'admin',  title: 'Dry Utility Manager' },
  { id: 'u2', name: 'Domonique Moreno',  initials: 'DM', email: 'dmoreno@msaconsultinginc.com',    role: 'editor', title: 'Project Manager' },
  { id: 'u3', name: 'Marco Celedon',     initials: 'MC', email: 'mceledon@msaconsultinginc.com',   role: 'editor', title: 'Project Engineer' },
];

const ROLE_META = {
  admin:  { label: 'Admin',  cls: 'role-admin',  desc: 'Full access · manage users & permissions' },
  editor: { label: 'Editor', cls: 'role-editor', desc: 'Read & write projects, letters, reports' },
  viewer: { label: 'Viewer', cls: 'role-viewer', desc: 'Read-only access' },
};

const PERMS = [
  { key: 'viewProjects',  label: 'View projects, WSL & reports', admin: true, editor: true, viewer: true },
  { key: 'addProjects',   label: 'Add / edit projects',          admin: true, editor: true, viewer: false },
  { key: 'editTasks',     label: 'Update agency tasks & submittals', admin: true, editor: true, viewer: false },
  { key: 'wslActions',    label: 'WSL extensions & re-applications', admin: true, editor: true, viewer: false },
  { key: 'genReports',    label: 'Generate client reports',      admin: true, editor: true, viewer: false },
  { key: 'manageUsers',   label: 'Manage users & permissions',   admin: true, editor: false, viewer: false },
];
const can = (user, permKey) => { const p = PERMS.find(x => x.key === permKey); return p ? !!p[user.role === 'admin' ? 'admin' : user.role === 'editor' ? 'editor' : 'viewer'] : false; };

// persistence
const LS_USERS = 'msa_app_users_v1';
const LS_SESSION = 'msa_app_session_v1';
const LS_PROJECTS = 'msa_app_projects_v1';
function loadUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_USERS));
    if (!stored) return SEED_USERS;
    // migrate seed users to current roster (v2): replace old seed entries by id, keep admin-added users
    const oldNames = ['Jordan Reyes', 'Sam Kowalski', 'Mia Alvarez', 'Priya Holt'];
    if (stored.some(u => oldNames.includes(u.name))) {
      const extras = stored.filter(u => !['u1', 'u2', 'u3', 'u4'].includes(u.id));
      const next = [...SEED_USERS, ...extras];
      persistUsers(next);
      return next;
    }
    return stored;
  } catch (e) { return SEED_USERS; }
}
function persistUsers(u) { try { localStorage.setItem(LS_USERS, JSON.stringify(u)); } catch (e) {} }
function loadSession() { try { return localStorage.getItem(LS_SESSION) || null; } catch (e) { return null; } }
function persistSession(id) { try { id ? localStorage.setItem(LS_SESSION, id) : localStorage.removeItem(LS_SESSION); } catch (e) {} }
function loadUserProjects() { try { return JSON.parse(localStorage.getItem(LS_PROJECTS)) || []; } catch (e) { return []; } }
function persistUserProjects(p) { try { localStorage.setItem(LS_PROJECTS, JSON.stringify(p)); } catch (e) {} }

// ===== AGENCIES BY CITY =====
// Once a city is chosen, these are the agencies offered for selection.
const CITY_AGENCIES = {
  'El Centro':   ['iid', 'socalgas', 'cityec', 'att'],
  'Brawley':     ['iid', 'socalgas', 'citybr', 'frontier'],
  'Calexico':    ['iid', 'socalgas', 'citycx', 'att'],
  'Imperial':    ['iid', 'socalgas', 'county', 'att'],
  'Holtville':   ['iid', 'socalgas', 'county', 'frontier'],
  'Westmorland': ['iid', 'socalgas', 'county', 'frontier'],
  'Niland':      ['iid', 'socalgas', 'county', 'frontier'],
  'Heber':       ['iid', 'socalgas', 'county', 'att'],
  'Coachella':   ['iid', 'sce', 'socalgas', 'scgt', 'citych', 'countyriv', 'cvwd', 'frontier', 'spectrum', 'sprint'],
  'Thermal':     ['iid', 'socalgas', 'scgt', 'countyriv', 'cvwd', 'frontier', 'spectrum', 'sprint'],
  'Mecca':       ['iid', 'socalgas', 'scgt', 'countyriv', 'cvwd', 'frontier', 'spectrum', 'sprint'],
  'County of Riverside': ['iid', 'sce', 'socalgas', 'scgt', 'countyriv', 'cvwd', 'frontier', 'spectrum', 'sprint'],
  'Indio':       ['iid', 'sce', 'socalgas', 'scgt', 'cityin', 'countyriv', 'frontier', 'iwa', 'vsd', 'cvwd', 'myoma', 'spectrum', 'sprint'],
  'La Quinta':   ['iid', 'sce', 'socalgas', 'scgt', 'citylq', 'countyriv', 'cvwd', 'frontier', 'spectrum'],
  'Palm Desert': ['sce', 'socalgas', 'scgt', 'citypd', 'countyriv', 'cvwd', 'myoma', 'frontier', 'spectrum'],
  'Palm Springs':       ['sce', 'socalgas', 'scgt', 'citypsp', 'countyriv', 'dwa', 'frontier', 'spectrum', 'sprint'],
  'Cathedral City':     ['sce', 'socalgas', 'scgt', 'cityccy', 'countyriv', 'cvwd', 'dwa', 'frontier', 'spectrum'],
  'Desert Hot Springs': ['sce', 'socalgas', 'scgt', 'citydhs', 'countyriv', 'mswd', 'hdwd', 'frontier', 'spectrum'],
  'Rancho Mirage':      ['sce', 'socalgas', 'scgt', 'cityrm', 'countyriv', 'cvwd', 'frontier', 'spectrum'],
  'Indian Wells':       ['sce', 'socalgas', 'scgt', 'cityiw', 'countyriv', 'cvwd', 'frontier', 'spectrum'],
};
const CITIES = Object.keys(CITY_AGENCIES);
// Admin city management: added cities, per-city agency-list edits, removals (persisted)
const CITIES_KEY = 'msa_app_cities_v1';
function loadCityMods() { try { return { added: {}, edited: {}, removed: [], ...(JSON.parse(localStorage.getItem(CITIES_KEY)) || {}) }; } catch (e) { return { added: {}, edited: {}, removed: [] }; } }
function persistCityMods(m) { try { localStorage.setItem(CITIES_KEY, JSON.stringify(m)); } catch (e) {} }
const BASE_CITY_AGENCIES = JSON.parse(JSON.stringify(CITY_AGENCIES));
(() => {
  const m = loadCityMods();
  Object.entries(m.edited).forEach(([c, ids]) => { if (CITY_AGENCIES[c]) CITY_AGENCIES[c] = ids; });
  Object.entries(m.added).forEach(([c, ids]) => { if (!CITY_AGENCIES[c]) { CITY_AGENCIES[c] = ids; CITIES.push(c); } });
  m.removed.forEach(c => { delete CITY_AGENCIES[c]; const i = CITIES.indexOf(c); if (i >= 0) CITIES.splice(i, 1); });
  CITIES.sort();
})();
function addCity(name, ids) {
  if (CITY_AGENCIES[name]) return false;
  CITY_AGENCIES[name] = ids; CITIES.push(name); CITIES.sort();
  const m = loadCityMods();
  m.added[name] = ids;
  m.removed = m.removed.filter(c => c !== name);
  persistCityMods(m);
  return true;
}
function updateCityAgencies(name, ids) {
  if (!CITY_AGENCIES[name]) return;
  CITY_AGENCIES[name] = ids;
  const m = loadCityMods();
  if (m.added[name]) m.added[name] = ids; else m.edited[name] = ids;
  persistCityMods(m);
}
function removeCity(name) {
  if (!CITY_AGENCIES[name]) return;
  delete CITY_AGENCIES[name];
  const i = CITIES.indexOf(name); if (i >= 0) CITIES.splice(i, 1);
  const m = loadCityMods();
  if (m.added[name]) delete m.added[name];
  else { m.removed.push(name); delete m.edited[name]; }
  persistCityMods(m);
}
function restoreCity(name) {
  const base = BASE_CITY_AGENCIES[name];
  if (!base) return;
  const m = loadCityMods();
  m.removed = m.removed.filter(c => c !== name);
  delete m.edited[name];
  persistCityMods(m);
  CITY_AGENCIES[name] = base;
  if (!CITIES.includes(name)) { CITIES.push(name); CITIES.sort(); }
}
const isCustomCity = (name) => !!loadCityMods().added[name];
const isEditedCity = (name) => !!loadCityMods().edited[name];
const removedCities = () => loadCityMods().removed.slice();

const AGENCIES = {
  iid:      { id: 'iid',      name: 'Imperial Irrigation District', short: 'IID', kind: 'Electric', note: 'Will Serve Letter required — 1yr validity, one 6-mo extension' },
  sce:      { id: 'sce',      name: 'Southern California Edison',   short: 'SCE', kind: 'Electric', note: 'No WSL — electrical analysis review process' },
  socalgas: { id: 'socalgas', name: 'SoCalGas — Distribution',      short: 'SCG-D', kind: 'Gas',    note: 'Gas will-serve & main extension design — Redlands region office' },
  scgt:     { id: 'scgt',     name: 'SoCalGas — Transmission',      short: 'SCG-T', kind: 'Gas',    note: 'Transmission research & crossing review — Beaumont office' },
  att:      { id: 'att',      name: 'AT&T',                         short: 'ATT', kind: 'Telecom',  note: 'Joint trench & fiber coordination' },
  frontier: { id: 'frontier', name: 'Frontier Communications',      short: 'FTR', kind: 'Telecom',  note: 'Joint trench & relocation coordination' },
  cityec:   { id: 'cityec',   name: 'City of El Centro',            short: 'CEC', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  citybr:   { id: 'citybr',   name: 'City of Brawley',              short: 'CBR', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  citycx:   { id: 'citycx',   name: 'City of Calexico',             short: 'CCX', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  citych:   { id: 'citych',   name: 'City of Coachella',            short: 'CCH', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  cityin:   { id: 'cityin',   name: 'City of Indio',                short: 'CIN', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  citylq:   { id: 'citylq',   name: 'City of La Quinta',            short: 'CLQ', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  citypd:   { id: 'citypd',   name: 'City of Palm Desert',          short: 'CPD', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  county:   { id: 'county',   name: 'County of Imperial',           short: 'CoI', kind: 'County',   note: 'Encroachment & road plan review' },
  countyriv:{ id: 'countyriv', name: 'County of Riverside',         short: 'CoR', kind: 'County',   note: 'Encroachment & road plan review' },
  citypsp:  { id: 'citypsp',  name: 'City of Palm Springs',         short: 'CPS', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  cityccy:  { id: 'cityccy',  name: 'City of Cathedral City',       short: 'CCC', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  citydhs:  { id: 'citydhs',  name: 'City of Desert Hot Springs',   short: 'DHS', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  cityrm:   { id: 'cityrm',   name: 'City of Rancho Mirage',        short: 'CRM', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  cityiw:   { id: 'cityiw',   name: 'City of Indian Wells',         short: 'CIW', kind: 'Municipal', note: 'Encroachment & improvement plan review' },
  dwa:      { id: 'dwa',      name: 'Desert Water Authority',       short: 'DWA', kind: 'Water',    note: 'Water research & will-serve — Palm Springs area' },
  hdwd:     { id: 'hdwd',     name: 'Hi Desert Water District',     short: 'HDWD', kind: 'Water',   note: 'Water research & will-serve — Yucca Valley area' },
  mswd:     { id: 'mswd',     name: 'Mission Springs Water District', short: 'MSWD', kind: 'Water',  note: 'Water & sewer research — Desert Hot Springs area' },
  cvwd:     { id: 'cvwd',     name: 'Coachella Valley Water District', short: 'CVWD', kind: 'Water',  note: 'Water / drain research & will-serve — PRARequests@cvwd.org' },
  vsd:      { id: 'vsd',      name: 'Valley Sanitary District',     short: 'VSD', kind: 'Sewer',    note: 'Sewer research & capacity — 45-500 Van Buren, Indio' },
  iwa:      { id: 'iwa',      name: 'Indio Water Authority',        short: 'IWA', kind: 'Water',    note: 'Water research & will-serve — IWAEngineering@indio.org' },
  myoma:    { id: 'myoma',    name: 'Myoma Dunes Mutual Water Co.', short: 'MYO', kind: 'Water',    note: 'Water research — Bermuda Dunes area' },
  spectrum: { id: 'spectrum', name: 'Spectrum', short: 'SPC', kind: 'Telecom',  note: 'Cable research & relocation coordination' },
  sprint:   { id: 'sprint',   name: 'Sprint (Cogent)',              short: 'SPR', kind: 'Telecom',  note: 'Fiber research — Planning & Engineering, Rialto' },
};
// Pristine snapshot for resets (before custom merges/overrides)
const BASE_AGENCIES = JSON.parse(JSON.stringify(AGENCIES));
// Admin-added agencies (persisted) merged into the directory at load
const CUSTOM_AGENCIES_KEY = 'msa_app_custom_agencies_v1';
function loadCustomAgencies() { try { return JSON.parse(localStorage.getItem(CUSTOM_AGENCIES_KEY)) || {}; } catch (e) { return {}; } }
function persistCustomAgencies(a) { try { localStorage.setItem(CUSTOM_AGENCIES_KEY, JSON.stringify(a)); } catch (e) {} }
Object.entries(loadCustomAgencies()).forEach(([id, a]) => { AGENCIES[id] = { ...a, custom: true }; });
// Admin edits to built-in agencies (name/short/kind overrides, persisted)
const AGENCY_OV_KEY = 'msa_app_agency_overrides_v1';
function loadAgencyOverrides() { try { return JSON.parse(localStorage.getItem(AGENCY_OV_KEY)) || {}; } catch (e) { return {}; } }
function persistAgencyOverrides(o) { try { localStorage.setItem(AGENCY_OV_KEY, JSON.stringify(o)); } catch (e) {} }
Object.entries(loadAgencyOverrides()).forEach(([id, o]) => { if (AGENCIES[id]) AGENCIES[id] = { ...AGENCIES[id], ...o, edited: true }; });
function updateAgency(id, patch) {
  if (!AGENCIES[id]) return;
  if (AGENCIES[id].custom) {
    AGENCIES[id] = { ...AGENCIES[id], ...patch };
    const next = loadCustomAgencies();
    next[id] = { ...next[id], ...patch };
    persistCustomAgencies(next);
  } else {
    AGENCIES[id] = { ...AGENCIES[id], ...patch, edited: true };
    persistAgencyOverrides({ ...loadAgencyOverrides(), [id]: { ...loadAgencyOverrides()[id], ...patch } });
  }
}
function resetAgency(id) {
  const base = BASE_AGENCIES[id];
  if (!base) return;
  AGENCIES[id] = { ...base };
  const next = loadAgencyOverrides();
  delete next[id];
  persistAgencyOverrides(next);
}
function addAgency(a) {
  const entry = { ...a, custom: true };
  AGENCIES[a.id] = entry;
  persistCustomAgencies({ ...loadCustomAgencies(), [a.id]: a });
}
function removeAgency(id) {
  if (!AGENCIES[id] || !AGENCIES[id].custom) return;
  delete AGENCIES[id];
  const next = loadCustomAgencies();
  delete next[id];
  persistCustomAgencies(next);
}

// Coordination tasks offered per agency (typical durations shown as guidance).
//
// Two layers, so a template is written once and reaches every agency it applies to:
//   KIND_TASKS   — shared per agency kind; every agency of that kind inherits them,
//                  including custom agencies an admin adds later.
//   AGENCY_TASKS — only what is genuinely specific to one agency, layered on top.
// Research request letters are NOT here — the Utility Research module owns those.
const AGENCY_KINDS = ['Electric', 'Gas', 'Water', 'Sewer', 'Telecom', 'Municipal', 'County', 'Other'];
const KIND_TASKS = {
  Electric: [
    { id: 'k-el-load', name: 'Load calculation package',     days: '2–3 wks' },
    { id: 'k-el-app',  name: 'Service application',          days: '1–2 wks' },
    { id: 'k-el-dsgn', name: 'Service design submittal',     days: '6–10 wks' },
  ],
  Gas: [
    { id: 'k-gas-ws',   name: 'Gas will-serve request',      days: '2–4 wks' },
    { id: 'k-gas-main', name: 'Main extension design',       days: '6–8 wks' },
    { id: 'k-gas-stub', name: 'Service stub coordination',   days: '2–3 wks' },
  ],
  Water: [
    { id: 'k-wtr-ws',  name: 'Water will-serve request',     days: '4–6 wks' },
    { id: 'k-wtr-poc', name: 'Point-of-connection review',   days: '3–4 wks' },
  ],
  Sewer: [
    { id: 'k-swr-cap', name: 'Sewer capacity / will-serve',  days: '4–6 wks' },
    { id: 'k-swr-poc', name: 'Point-of-connection review',   days: '3–4 wks' },
  ],
  Telecom: [
    { id: 'k-tel-jt',   name: 'Joint trench design',         days: '4–6 wks' },
    { id: 'k-tel-rel',  name: 'Facility relocation coordination', days: 'varies' },
    { id: 'k-tel-conf', name: 'Utility conflict review',     days: '2–3 wks' },
  ],
  Municipal: [
    { id: 'k-mun-enc', name: 'Encroachment permit',          days: '3–6 wks' },
    { id: 'k-mun-imp', name: 'Street improvement plan review', days: '6–10 wks' },
    { id: 'k-mun-tcp', name: 'Traffic control plan',         days: '2–4 wks' },
  ],
  County: [
    { id: 'k-cty-enc', name: 'Encroachment permit',          days: '3–6 wks' },
    { id: 'k-cty-rd',  name: 'Road improvement plan review', days: '6–10 wks' },
    { id: 'k-cty-tcp', name: 'Traffic control plan',         days: '2–4 wks' },
  ],
  Other: [],
};
const AGENCY_TASKS = {
  iid:      [
    { id: 'iid-wsl',  name: 'Will Serve Letter application', days: '4–8 wks' },
    { id: 'iid-cap',  name: 'Capacity study submittal',      days: '7 wks' },
    { id: 'iid-ext',  name: 'WSL extension request',         days: '2–3 wks' },
  ],
  sce:      [
    { id: 'sce-ear',  name: 'Electrical analysis review',    days: '8–12 wks' },
    { id: 'sce-r20',  name: 'Rule 20 undergrounding coordination', days: 'varies' },
  ],
  scgt:     [
    { id: 'scgt-xng', name: 'Transmission crossing review',  days: '6–10 wks' },
  ],
  cvwd:     [
    { id: 'cvwd-drn', name: 'Drainage crossing review',      days: '4–6 wks' },
  ],
};

// Admin-defined catalog tasks (persisted).
//   { [agencyId]: [customTask], _ov: { [agencyId]: { [taskId]: patch } },
//     _kind: { [kind]: { ov: { [taskId]: patch }, add: [customTask] } } }
// A patch of { removed: true } hides a built-in template without deleting it.
const CATALOG_KEY = 'msa_app_task_catalog_v1';
function loadTaskCatalog() { try { return JSON.parse(localStorage.getItem(CATALOG_KEY)) || {}; } catch (e) { return {}; } }
function persistTaskCatalog(c) { try { localStorage.setItem(CATALOG_KEY, JSON.stringify(c)); } catch (e) {} }

// Shared templates for one agency kind, with admin edits/additions applied.
function tasksForKind(kind, cat) {
  const c = cat || loadTaskCatalog();
  const k = (c._kind && c._kind[kind]) || {};
  const ov = k.ov || {};
  const base = (KIND_TASKS[kind] || [])
    .map(t => ov[t.id] ? { ...t, ...ov[t.id], edited: !!(ov[t.id].name || ov[t.id].days) } : t)
    .filter(t => !t.removed);
  return [...base, ...(k.add || [])].map(t => ({ ...t, shared: true, kind }));
}
// Everything an agency offers: shared kind templates + agency-specific + admin customs.
// Per-agency overrides win, so a shared template can be renamed or hidden for one agency.
const tasksForAgency = (aid) => {
  const cat = loadTaskCatalog();
  const ov = (cat._ov && cat._ov[aid]) || {};
  const kind = (AGENCIES[aid] || {}).kind;
  const base = [...tasksForKind(kind, cat), ...(AGENCY_TASKS[aid] || [])]
    .map(t => ov[t.id] ? { ...t, ...ov[t.id], edited: !!(ov[t.id].name || ov[t.id].days) } : t)
    .filter(t => !t.removed);
  return [...base, ...(cat[aid] || [])];
};

// ===== PROJECTS (progress/pct intentionally removed) =====
const SEED_PROJECTS = [
  {
    id: 'p9', code: '2913.001', name: 'Avenue 40 & Jefferson', client: 'RFP 3102',
    location: { street: 'NEC Avenue 40 & Jefferson St', city: 'Indio', state: 'CA', zip: '92203' },
    utility: 'IID', pm: 'MS', phase: 'Due Diligence',
    apn: '691-110-005', mapRef: '5410 A2, A3', acreage: '≈78 ac (2 parcels)',
    agencies: ['iid', 'cvwd', 'vsd', 'iwa', 'socalgas', 'scgt', 'frontier', 'spectrum', 'sprint', 'myoma', 'cityin'],
    tasks: [
      { agency: 'iid',  taskId: 'iid-wsl', name: 'Will Serve Letter application', status: 'none', date: null },
      { agency: 'cvwd', taskId: 'cvwd-res', name: 'Utility research request', status: 'review', date: '2026-05-12' },
      { agency: 'vsd',  taskId: 'vsd-res',  name: 'Utility research request', status: 'review', date: '2026-05-12' },
      { agency: 'iwa',  taskId: 'iwa-res',  name: 'Utility research request', status: 'review', date: '2026-05-12' },
    ],
    wsl: null,
    // client asked for a viability study before committing to the formal WSL process
    capacityStudy: { submitted: '2026-05-18', received: null, outcome: null, notes: 'Load estimate 4.2 MW across both parcels — asked IID to confirm capacity at the Avenue 40 feeder.' },
    dd: [
      { name: 'Title Report', status: 'todo', date: null },
      { name: 'ALTA Survey', status: 'todo', date: null },
      { name: 'Geotech Report', status: 'todo', date: null },
      { name: 'Environmental (Phase I)', status: 'todo', date: null },
      { name: 'Utility Research', status: 'prog', date: '2026-05-12' },
      { name: 'Flood / FEMA', status: 'todo', date: null },
    ],
    reporting: { cadence: 'Bi-weekly', lastSent: '2026-07-01', changes: 2 },
    research: [
      { id: 'r-iid',  agency: 'iid',      label: 'Power (IID)',                sent: '2026-05-12', received: null, to: 'RecordsManagement@IID.com', file: 'uploads/IID Research Letter.pdf' },
      { id: 'r-cvwd', agency: 'cvwd',     label: 'Water / CVWD Drain',         sent: '2026-05-12', received: '2026-06-03', to: 'PRARequests@cvwd.org', file: 'uploads/CVWD Research Letter.pdf' },
      { id: 'r-iwa',  agency: 'iwa',      label: 'Water (IWA)',                sent: '2026-05-12', received: '2026-06-10', to: 'IWAEngineering@indio.org', file: 'uploads/IWA Research Letter.pdf' },
      { id: 'r-myo',  agency: 'myoma',    label: 'Water (Myoma)',              sent: '2026-05-12', received: null, to: 'service@myoma.com', file: 'uploads/Myoma Water District Research Letter.pdf' },
      { id: 'r-vsd',  agency: 'vsd',      label: 'Sewer (VSD)',                sent: '2026-05-12', received: null, to: 'steve@valley-sanitary.org', file: 'uploads/VSD Research Letter.pdf' },
      { id: 'r-scgd', agency: 'socalgas', label: 'Gas — Distribution',         sent: '2026-05-12', received: '2026-05-28', to: 'SCGSERegionRedlands…@semprautilities.com', file: 'uploads/Gas-Distribution Research Letter.pdf' },
      { id: 'r-scgt', agency: 'scgt',     label: 'Gas — Transmission',         sent: '2026-05-12', received: null, to: 'socalgastransmission…@semprautilities.com', file: 'uploads/Gas-Transmission Research Letter.pdf' },
      { id: 'r-ftr',  agency: 'frontier', label: 'Telephone (Frontier)',       sent: '2026-05-12', received: null, to: 'lisa.jacobson@dynamictelco.com', file: 'uploads/Frontier Research Letter.pdf' },
      { id: 'r-spc',  agency: 'spectrum', label: 'Cable (Spectrum)',     sent: '2026-05-12', received: null, to: 'DL-Socal-charter-engineering@charter.com', file: 'uploads/Spectrum Research Letter.pdf' },
      { id: 'r-spr',  agency: 'sprint',   label: 'Fiber (Sprint / Cogent)',    sent: '2026-05-12', received: null, to: 'jyork@cogentco.com', file: 'uploads/Sprint Research Letter.pdf' },
    ],
    exhibits: [{ name: 'RFP 3102 — Project Exhibit', file: 'uploads/P3102 Exhibit.pdf' }],
  },
  {
    id: 'p1', code: '2150', name: 'Salton Sea Solar', client: 'Helio Partners',
    location: { street: '4210 Garst Rd', city: 'Niland', state: 'CA', zip: '92257' },
    utility: 'IID', pm: 'DM', phase: 'Submitted',
    agencies: ['iid', 'socalgas', 'county'],
    tasks: [
      { agency: 'iid', taskId: 'iid-wsl',  name: 'Will Serve Letter application', status: 'ok',     date: '2025-06-15' },
      { agency: 'iid', taskId: 'iid-dsgn', name: 'Service design submittal',      status: 'review', date: '2026-05-20' },
      { agency: 'socalgas', taskId: 'scg-ws', name: 'Gas will-serve request',     status: 'ok',     date: '2025-09-12' },
      { agency: 'county', taskId: 'mun-enc', name: 'Encroachment permit',         status: 'resubmit', date: '2026-05-28' },
    ],
    wsl: { issued: '2025-06-15', extensionUsed: true },
    dd: [
      { name: 'Title Report', status: 'done', date: '2025-05-02' },
      { name: 'ALTA Survey', status: 'done', date: '2025-05-20' },
      { name: 'Geotech Report', status: 'done', date: '2025-06-01' },
      { name: 'Environmental (Phase I)', status: 'done', date: '2025-05-18' },
      { name: 'Utility Research', status: 'prog', date: '2026-05-30' },
      { name: 'Flood / FEMA', status: 'done', date: '2025-05-22' },
    ],
    reporting: { cadence: 'Weekly', lastSent: '2026-07-10', changes: 3 },
  },
  {
    id: 'p2', code: '2104', name: 'Imperial Farm Solar 4', client: 'Helio Partners',
    location: { street: '1876 Aten Rd', city: 'Imperial', state: 'CA', zip: '92251' },
    utility: 'IID', pm: 'MS', phase: 'Design',
    agencies: ['iid', 'county'],
    tasks: [
      { agency: 'iid', taskId: 'iid-wsl',  name: 'Will Serve Letter application', status: 'ok',     date: '2025-07-22' },
      { agency: 'iid', taskId: 'iid-load', name: 'Electrical load study',         status: 'review', date: '2026-06-15' },
      { agency: 'county', taskId: 'mun-imp', name: 'Street improvement plan review', status: 'none', date: null },
    ],
    wsl: { issued: '2025-07-22', extensionUsed: false },
    dd: [
      { name: 'Title Report', status: 'done', date: '2025-06-20' },
      { name: 'ALTA Survey', status: 'done', date: '2025-07-05' },
      { name: 'Geotech Report', status: 'prog', date: '2026-05-10' },
      { name: 'Environmental (Phase I)', status: 'done', date: '2025-07-01' },
      { name: 'Utility Research', status: 'todo', date: null },
      { name: 'Flood / FEMA', status: 'done', date: '2025-07-02' },
    ],
    reporting: { cadence: 'Bi-weekly', lastSent: '2026-07-01', changes: 2 },
  },
  {
    id: 'p3', code: '2098', name: 'Heber Solar Field', client: 'Helio Partners',
    location: { street: '905 Heber Ave', city: 'Heber', state: 'CA', zip: '92249' },
    utility: 'IID', pm: 'DM', phase: 'Due Diligence',
    agencies: ['iid', 'socalgas', 'county'],
    tasks: [
      { agency: 'iid', taskId: 'iid-wsl', name: 'Will Serve Letter application', status: 'ok', date: '2026-03-01' },
      { agency: 'socalgas', taskId: 'scg-ws', name: 'Gas will-serve request', status: 'review', date: '2026-06-20' },
    ],
    wsl: { issued: '2026-03-01', extensionUsed: false },
    // viability study came back first; the client then requested the Will Serve Letter
    capacityStudy: { submitted: '2025-11-10', received: '2026-01-05', outcome: 'upgrades', notes: 'Capacity available subject to a feeder upgrade at the substation.' },
    dd: [
      { name: 'Title Report', status: 'done', date: '2026-02-15' },
      { name: 'ALTA Survey', status: 'prog', date: '2026-05-28' },
      { name: 'Geotech Report', status: 'todo', date: null },
      { name: 'Environmental (Phase I)', status: 'prog', date: '2026-05-12' },
      { name: 'Utility Research', status: 'todo', date: null },
      { name: 'Flood / FEMA', status: 'done', date: '2026-02-20' },
    ],
    reporting: { cadence: 'Bi-weekly', lastSent: '2026-06-29', changes: 1 },
  },
  {
    id: 'p4', code: '2092', name: 'Brawley Industrial', client: 'Mason Industrial',
    location: { street: '310 Best Rd', city: 'Brawley', state: 'CA', zip: '92227' },
    utility: 'IID', pm: 'MC', phase: 'Construction',
    agencies: ['iid', 'socalgas', 'citybr', 'frontier'],
    tasks: [
      { agency: 'iid', taskId: 'iid-wsl', name: 'Will Serve Letter application', status: 'ok', date: '2024-12-20' },
      { agency: 'iid', taskId: 'iid-ext', name: 'WSL extension request',        status: 'ok', date: '2025-11-30' },
      { agency: 'iid', taskId: 'iid-dsgn', name: 'Service design submittal',    status: 'ok', date: '2025-10-15' },
      { agency: 'socalgas', taskId: 'scg-main', name: 'Main extension design',  status: 'ok', date: '2025-09-01' },
      { agency: 'citybr', taskId: 'mun-enc', name: 'Encroachment permit',       status: 'ok', date: '2025-08-10' },
      { agency: 'frontier', taskId: 'ftr-jt', name: 'Joint trench design',      status: 'ok', date: '2025-09-20' },
    ],
    wsl: { issued: '2024-12-20', extensionUsed: true },
    dd: [
      { name: 'Title Report', status: 'done', date: '2024-11-10' },
      { name: 'ALTA Survey', status: 'done', date: '2024-12-01' },
      { name: 'Geotech Report', status: 'done', date: '2024-12-10' },
      { name: 'Environmental (Phase I)', status: 'done', date: '2024-11-20' },
      { name: 'Utility Research', status: 'done', date: '2024-12-05' },
      { name: 'Flood / FEMA', status: 'done', date: '2024-11-22' },
    ],
    reporting: { cadence: 'Weekly', lastSent: '2026-07-11', changes: 4 },
  },
  {
    id: 'p5', code: '2110', name: 'Calexico Logistics', client: 'WestRanch Dev.',
    location: { street: '2455 Enrico Fermi Dr', city: 'Calexico', state: 'CA', zip: '92231' },
    utility: 'IID', pm: 'MS', phase: 'Design',
    agencies: ['iid', 'socalgas', 'citycx', 'att'],
    tasks: [
      { agency: 'iid', taskId: 'iid-wsl', name: 'Will Serve Letter application', status: 'ok', date: '2025-11-12' },
      { agency: 'iid', taskId: 'iid-dsgn', name: 'Service design submittal',     status: 'review', date: '2026-06-25' },
      { agency: 'att', taskId: 'att-jt', name: 'Joint trench design',            status: 'review', date: '2026-06-25' },
      { agency: 'citycx', taskId: 'mun-tcp', name: 'Traffic control plan',       status: 'none', date: null },
    ],
    wsl: { issued: '2025-11-12', extensionUsed: false },
    dd: [
      { name: 'Title Report', status: 'done', date: '2025-10-15' },
      { name: 'ALTA Survey', status: 'done', date: '2025-11-01' },
      { name: 'Geotech Report', status: 'done', date: '2025-11-08' },
      { name: 'Environmental (Phase I)', status: 'done', date: '2025-10-20' },
      { name: 'Utility Research', status: 'prog', date: '2026-05-15' },
      { name: 'Flood / FEMA', status: 'done', date: '2025-10-22' },
    ],
    reporting: { cadence: 'Weekly', lastSent: '2026-07-08', changes: 2 },
  },
  {
    id: 'p6', code: '2076', name: 'El Centro Phase 2', client: 'City of El Centro',
    location: { street: '1275 W Main St', city: 'El Centro', state: 'CA', zip: '92243' },
    utility: 'IID', pm: 'MS', phase: 'Submitted',
    agencies: ['iid', 'socalgas', 'cityec'],
    tasks: [
      { agency: 'iid', taskId: 'iid-wsl', name: 'Will Serve Letter application', status: 'ok', date: '2025-04-11' },
      { agency: 'iid', taskId: 'iid-dsgn', name: 'Service design submittal',     status: 'resubmit', date: '2026-06-30' },
      { agency: 'cityec', taskId: 'mun-imp', name: 'Street improvement plan review', status: 'review', date: '2026-07-01' },
    ],
    wsl: { issued: '2025-04-11', extensionUsed: false },
    dd: [
      { name: 'Title Report', status: 'done', date: '2025-03-10' },
      { name: 'ALTA Survey', status: 'done', date: '2025-03-28' },
      { name: 'Geotech Report', status: 'done', date: '2025-04-02' },
      { name: 'Environmental (Phase I)', status: 'done', date: '2025-03-15' },
      { name: 'Utility Research', status: 'done', date: '2025-04-05' },
      { name: 'Flood / FEMA', status: 'na', date: null },
    ],
    reporting: { cadence: 'Weekly', lastSent: '2026-07-10', changes: 5 },
  },
  {
    id: 'p7', code: '2160', name: 'Indio Townhomes', client: 'Hayes & Co.',
    location: { street: '82640 Miles Ave', city: 'Indio', state: 'CA', zip: '92201' },
    utility: 'SCE', pm: 'DM', phase: 'Design',
    agencies: ['sce', 'socalgas', 'cityin'],
    tasks: [
      { agency: 'sce', taskId: 'sce-ear', name: 'Electrical analysis review', status: 'ok', date: '2026-04-10' },
      { agency: 'sce', taskId: 'sce-load', name: 'Load calculation package',  status: 'ok', date: '2026-03-28' },
      { agency: 'socalgas', taskId: 'scg-stub', name: 'Service stub coordination', status: 'review', date: '2026-06-18' },
      { agency: 'cityin', taskId: 'mun-enc', name: 'Encroachment permit',     status: 'none', date: null },
    ],
    wsl: null, sce: { ear: 'Approved', earDate: '2026-04-10' },
    dd: [
      { name: 'Title Report', status: 'done', date: '2026-03-01' },
      { name: 'ALTA Survey', status: 'done', date: '2026-03-20' },
      { name: 'Geotech Report', status: 'prog', date: '2026-05-15' },
      { name: 'Environmental (Phase I)', status: 'done', date: '2026-03-10' },
      { name: 'Utility Research', status: 'done', date: '2026-04-01' },
      { name: 'Flood / FEMA', status: 'done', date: '2026-03-12' },
    ],
    reporting: { cadence: 'Bi-weekly', lastSent: '2026-07-06', changes: 1 },
  },
  {
    id: 'p8', code: '2134', name: 'Coachella Solar', client: 'Hayes & Co.',
    location: { street: '46200 Dillon Rd', city: 'Coachella', state: 'CA', zip: '92236' },
    utility: 'IID', pm: 'DM', phase: 'Submitted',
    agencies: ['iid', 'citych', 'frontier'],
    tasks: [
      { agency: 'iid', taskId: 'iid-wsl', name: 'Will Serve Letter application', status: 'ok', date: '2025-05-20' },
      { agency: 'iid', taskId: 'iid-ext', name: 'WSL extension request',         status: 'ok', date: '2026-04-15' },
      { agency: 'citych', taskId: 'mun-enc', name: 'Encroachment permit',        status: 'review', date: '2026-06-22' },
      { agency: 'frontier', taskId: 'ftr-jt', name: 'Joint trench design',       status: 'review', date: '2026-06-22' },
    ],
    wsl: { issued: '2025-05-20', extensionUsed: true },
    dd: [
      { name: 'Title Report', status: 'done', date: '2025-04-15' },
      { name: 'ALTA Survey', status: 'done', date: '2025-05-02' },
      { name: 'Geotech Report', status: 'done', date: '2025-05-10' },
      { name: 'Environmental (Phase I)', status: 'done', date: '2025-04-20' },
      { name: 'Utility Research', status: 'done', date: '2025-05-15' },
      { name: 'Flood / FEMA', status: 'done', date: '2025-04-22' },
    ],
    reporting: { cadence: 'Weekly', lastSent: '2026-07-09', changes: 2 },
  },
];

// WSL derivation
// ---- IID Capacity Study Submittal ----
// A lighter-weight alternative clients ask for before committing to the formal
// Will Serve Letter process: it tests project viability rather than reserving
// service. Roughly a 7-week turnaround, and it carries no validity clock — the
// study either is still out with IID or its results are back. A client may ask
// for a Will Serve Letter at any point afterwards; the two live side by side on
// the project, and only the WSL authorises coordination work.
const CAPACITY_STUDY_WEEKS = 7;
function deriveCapacityStudy(cs) {
  if (!cs || !cs.submitted) return null;
  const submitted = parseDate(cs.submitted);
  const received = cs.received ? parseDate(cs.received) : null;
  const expected = addDays(submitted, CAPACITY_STUDY_WEEKS * 7);
  const daysOut = daysBetween(submitted, TODAY);
  const weeksOut = Math.max(1, Math.ceil(daysOut / 7));
  const daysOverdue = received ? 0 : daysBetween(expected, TODAY);
  const state = received ? 'received' : daysOverdue > 0 ? 'overdue' : 'awaiting';
  return { ...cs, submitted, received, expected, daysOut, weeksOut, daysOverdue, state, turnaroundWeeks: CAPACITY_STUDY_WEEKS };
}

// ---- modal backdrop dismissal ----
// A DOM click fires on the nearest common ancestor of where the press started and
// where it ended. Selecting text in a field near the edge of a dialog and releasing
// past it therefore fires "click" on the backdrop and used to dismiss the dialog,
// losing the edit. Only treat it as a dismissal when the press *began* on the
// backdrop too. The capture-phase listener runs before React's handlers, so the
// recorded target is always current.
let lastMouseDownTarget = null;
if (typeof document !== 'undefined') {
  document.addEventListener('mousedown', (e) => { lastMouseDownTarget = e.target; }, true);
}
function backdropClose(onClose) {
  return (e) => {
    if (e.target !== e.currentTarget) return;              // released on the dialog itself
    if (lastMouseDownTarget !== e.currentTarget) return;   // press started inside the dialog
    onClose();
  };
}

function deriveWsl(wsl) {
  if (!wsl) return null;
  const issued = parseDate(wsl.issued);
  const originalExpiry = addYears(issued, 1);
  // the extension is usually 6 months but can be negotiated shorter or longer
  const extensionMonths = wsl.extensionMonths == null ? 6 : Number(wsl.extensionMonths);
  const effectiveExpiry = wsl.extensionUsed ? addMonths(originalExpiry, extensionMonths) : originalExpiry;
  const daysLeft = daysBetween(TODAY, effectiveExpiry);
  let state;
  if (daysLeft < 0) state = 'expired';
  else if (daysLeft <= 30) state = 'critical';
  else if (daysLeft <= 60) state = 'warning';
  else state = 'active';
  // Once a WSL has gone out its status stays "Sent" — expiry is tracked separately
  // by `state`, and never downgrades the fact that the letter was issued.
  const status = 'Sent';
  // An extension is worth chasing when time is short (or already gone) and the
  // single 6-month extension has not been used yet.
  const needsExtension = !wsl.extensionUsed && (state === 'warning' || state === 'critical' || state === 'expired');
  return { ...wsl, issued, originalExpiry, effectiveExpiry, daysLeft, state, status, sent: true, needsExtension, extensionMonths };
}

const PHASE_META = {
  'Lead': { badge: 'b-gray' }, 'Due Diligence': { badge: 'b-violet' }, 'Design': { badge: 'b-blue' },
  'Submitted': { badge: 'b-amber' }, 'Construction': { badge: 'b-teal' }, 'Closeout': { badge: 'b-ok' },
  'Complete': { badge: 'b-ok' },
};
const PHASES = Object.keys(PHASE_META);
const SUB_META = {
  ok: { cls: 'sd-ok', label: 'Approved', badge: 'b-ok' },
  review: { cls: 'sd-review', label: 'In review', badge: 'b-amber' },
  resubmit: { cls: 'sd-resubmit', label: 'Resubmit', badge: 'b-warn' },
  none: { cls: 'sd-none', label: 'Not started', badge: 'b-gray' },
};
const DD_META = {
  done: { cls: 'dd-done', label: 'Complete' },
  prog: { cls: 'dd-prog', label: 'In progress' },
  todo: { cls: 'dd-todo', label: 'Not started' },
  na: { cls: 'dd-na', label: 'N/A' },
};

Object.assign(window, {
  TODAY, parseDate, addYears, addMonths, daysBetween, fmt, fmtShort,
  SEED_USERS, ROLE_META, PERMS, can,
  backdropClose,
  loadUsers, persistUsers, loadSession, persistSession, loadUserProjects, persistUserProjects,
  CITY_AGENCIES, CITIES, AGENCIES, AGENCY_KINDS, AGENCY_TASKS, KIND_TASKS, tasksForAgency, tasksForKind,
  loadTaskCatalog, persistTaskCatalog, addAgency, removeAgency, updateAgency, resetAgency,
  addCity, updateCityAgencies, removeCity, restoreCity, isCustomCity, isEditedCity, removedCities,
  SEED_PROJECTS, deriveWsl, deriveCapacityStudy, CAPACITY_STUDY_WEEKS, addDays, PHASE_META, PHASES, SUB_META, DD_META,
});
