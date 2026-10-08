// What must be true of a build before it goes live.
//
// This lives in the repo rather than in the Vercel bootstrap so that adding a check is an
// ordinary commit: the bootstrap fetches this branch and runs whatever this file says.
// Every entry here is a bug that actually shipped once, or a wiring mistake that would
// make the app look fine on a file listing while being broken in the browser.
//
// Run by build.js at deploy time; `dir` is the extracted app directory.
const fs = require('fs');
const path = require('path');

module.exports = function check(dir) {
  const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
  const has = (f) => fs.existsSync(path.join(dir, f));
  const files = fs.readdirSync(dir);
  const fail = (m) => { throw new Error(m); };

  const index = read('index.html'), data = read('app-data.jsx'), main = read('app-main.jsx');
  const proj = read('app-project.jsx'), letters = read('app-letters.jsx');
  const catalog = read('app-catalog.jsx'), team = read('app-team.jsx');

  // ---------------------------------------------------------------- it is the right app
  if (!files.includes('app-store.js')) fail('app-store.js missing — wrong branch?');
  for (const a of ['blueprint-logo.svg', 'new-letterhead.svg', '2nd-page-letterhead.svg']) {
    if (!has('assets/' + a)) fail('assets/' + a + ' missing');
  }
  if (!/MSA Blueprint/.test(index)) fail('index.html is not the Blueprint build');
  if (!/blueprint-logo\.svg/.test(index)) fail('index.html is missing the Blueprint favicon');

  // ---------------------------------------------------------------- printing & reports
  if (!/\.no-print/.test(index)) fail('index.html predates the print-scope fix');
  if (!/td\.msa-doc-body/.test(index)) fail('index.html predates the report side-margin fix');
  if (!/LetterheadDoc/.test(letters) || !/new-letterhead\.svg/.test(letters)) fail('app-letters.jsx predates the letterhead work');
  if (!/ReportTimeline/.test(main)) fail('app-main.jsx predates the report timeline');
  if (!/periodFor/.test(main)) fail('app-main.jsx predates fixed reporting periods');
  if (!/fmtNum\(m\.date\)/.test(main)) fail('the report timeline is not using numeric dates');
  if (/SCE Electrical Review/.test(main)) fail('app-main.jsx still carries the SCE review block');
  // the header meta block wrapped raggedly as a flex row
  if (!/display: grid/.test((index.match(/\.tb-meta \{[^}]*\}/) || [''])[0]))
    fail('the report header meta block is not a grid');
  if (!/m m-wide/.test(main)) fail('the report header does not span the Location field');

  // ---------------------------------------------------------------- data & vocabulary
  if (!/SEED_SLIDE/.test(data)) fail('app-data.jsx predates the real-date calendar');
  if (/const TODAY = new Date\('20/.test(data)) fail('app-data.jsx still pins TODAY to a fixed date');
  if (!/deleteProjects/.test(data)) fail('app-data.jsx predates the delete-project permission');
  if (!/wsl.completed/.test(data)) fail('app-data.jsx predates closing out a Will Serve Letter');
  if (!/function taskState/.test(data)) fail('app-data.jsx predates submitted/received tasks');
  if (!/const fmtNum/.test(data)) fail('app-data.jsx predates the numeric timeline dates');
  if (!/function deriveEar/.test(data)) fail('app-data.jsx predates the SCE electrical analysis review');
  if (/Rule 20 undergrounding/.test(data)) fail('app-data.jsx still calls Rule 20 undergrounding');
  for (const c of ['Yucca Valley', 'Joshua Tree', 'Morongo Valley']) {
    if (!data.includes(`'${c}'`)) fail(`app-data.jsx is missing ${c}`);
  }
  // CVWD runs sanitation across the west valley, so no Coachella Valley city may omit it
  for (const c of ['Palm Springs', 'Desert Hot Springs', 'Indio', 'La Quinta', 'Palm Desert',
                   'Cathedral City', 'Rancho Mirage', 'Indian Wells', 'Coachella']) {
    const line = (data.match(new RegExp(`'${c}':[^\\]]*\\]`)) || [''])[0];
    if (!/'cvwd'/.test(line)) fail(`${c} is missing CVWD`);
  }
  if (!/cwa:\s*\{/.test(data)) fail('the Coachella Water Agency is not in the directory');
  if (!/'cwa'/.test((data.match(/'Coachella':[^\]]*\]/) || [''])[0]))
    fail('Coachella is missing its own water agency');
  // one word for a task's state; "Approved" belongs to the agency's own decision
  if (/label: 'Approved'/.test(data)) fail('a task status is still labelled Approved');
  if (!/ok: \{ cls: 'sd-ok', label: 'Complete'/.test(data)) fail('app-data.jsx predates the Complete wording');
  if (!/EAR_STATES = \[[^\]]*'Approved'/.test(data)) fail('the SCE review should keep the agency word Approved');

  // ---------------------------------------------------------------- project page
  if (!/Shared templates/.test(catalog)) fail('app-catalog.jsx predates the Agency Setup restructure');
  if (!/getModuleDone/.test(proj)) fail('app-project.jsx predates marking modules complete');
  if (!/onTaskSetReceived/.test(proj)) fail('app-project.jsx predates the received date');
  if (!/Add utility/.test(proj)) fail('app-project.jsx predates adding a utility after the fact');
  if (!/EAR_STATES/.test(proj)) fail('app-project.jsx predates the editable EAR');
  if (/\bd late\b/.test(proj) || /\bd late\b/.test(team)) fail('a task layout still flags work late');
  if (/45d\+ out/.test(team)) fail('the workload table still carries the late-flavoured column');
  if (/>Assignee<\/th>/.test(proj)) fail('project tasks still carry the assignee column');
  if (!/function ApprovalChip/.test(main)) fail('app-main.jsx predates the WSL/EAR column');
  if (/util-sce">SCE · n\/a/.test(main)) fail('the tracker still labels missing WSLs as SCE');
  if (!/sentFor/.test(letters)) fail('app-letters.jsx predates per-recipient letter status');
  // the letter wording is editable, and keeps its {tokens} so the fields still drive it
  if (!/DEFAULT_LETTER/.test(letters)) fail('app-letters.jsx predates the editable letter text');
  if (!/function fillTokens/.test(letters)) fail('the letter text is not token-substituted');
  if (!/\{site\}/.test(letters)) fail('the default letter body lost its tokens');
  if (!/LETTER_OV_KEY/.test(letters)) fail('letter edits are not persisted per project');
  if (!/letter=\{letterFor\(r\)\}/.test(letters)) fail('printed letters do not use the edited wording');
  if (!/letter=\{letterFor\(preview\)\}/.test(letters)) fail('the preview does not use the edited wording');
  // a .field inside a .field makes "the Sign-off field" ambiguous to any selector
  if (/className="field"[\s\S]{0,400}?className="field"[\s\S]{0,80}?Sign-off/.test(letters))
    fail('the letter editor nests a .field inside a .field again');
  if (!/popstate/.test(main)) fail('app-main.jsx predates browser-Back navigation');
  // a status change must never restamp the day the submittal went out
  if (/patchTask\(pid, taskKey, \{ status, date:/.test(main))
    fail('a task status change still overwrites the submitted date');
  if (!/if \(status !== 'none' && !t\.date\)/.test(main))
    fail('app-main.jsx predates the submitted-date fix');

  // ---------------------------------------------------------------- single sign-on
  // A half-wired SSO is worse than none: the login screen would offer a Microsoft button
  // that goes nowhere, so check the whole chain rather than just the file's presence.
  if (!files.includes('app-sso.js')) fail('app-sso.js missing — the SSO commit is not on this branch');
  const sso = read('app-sso.js'), store = read('app-store.js'), auth = read('app-auth.jsx');
  if (!/MSA_AUTH/.test(sso)) fail('app-sso.js does not expose MSA_AUTH');
  if (!/provider=azure/.test(sso)) fail('app-sso.js is not wired to the Azure provider');
  if (!/msa_auth_session_v1/.test(sso)) fail('app-sso.js is not storing a session');
  if (/msa_app_auth/.test(sso)) fail('the auth session uses an msa_app_* key — it would be synced to the server');
  if (!/__msaAuthReady/.test(sso) || !/__msaAuthReady/.test(store))
    fail('app-store.js does not wait for the session before its first pull');
  if (!/MSA_AUTH[\s\S]{0,60}token/.test(store)) fail('app-store.js is not sending the user JWT');
  if (!/Sign in with Microsoft/.test(auth)) fail('the login screen has no Microsoft button');
  if (!/MSA_AUTH/.test(main)) fail('app-main.jsx does not resolve the signed-in identity');
  // compare the <script> tags themselves — a nearby comment naming the other file would
  // fool a plain indexOf
  const tagAt = (f) => index.indexOf(`<script src="${f}"`);
  if (tagAt('app-sso.js') < 0) fail('index.html has no app-sso.js script tag');
  if (tagAt('app-sso.js') > tagAt('app-store.js')) fail('app-sso.js must load before app-store.js');
  for (const f of ['sso/README.md', 'sso/lock-down-rls.sql']) {
    if (!has(f)) fail(f + ' missing — the setup runbook did not ship');
  }
};
