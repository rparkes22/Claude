// Utility Coordination section for project pages (Dry Utility App).
// Shown only on projects that carry a coordination-type task.
// Workbook tabs (one per utility track) → hand-off steppers per document,
// with a view toggle to a ball-in-court board. Data: Job 2417 workbook
// (coord-2417-data.jsx), tracks mapped to the project's agencies.

const COORD_TASK_RE = /coordination|joint trench/i;
const hasCoordination = (p) => p.tasks.some(t => COORD_TASK_RE.test(t.name));

// ---- hand-off logging (persisted per project/track/group) ----
const COORD_LOG_KEY = 'msa_app_coord_log_v1';
function loadCoordLog() { try { return JSON.parse(localStorage.getItem(COORD_LOG_KEY)) || {}; } catch (e) { return {}; } }
function persistCoordLog(l) { try { localStorage.setItem(COORD_LOG_KEY, JSON.stringify(l)); } catch (e) {} }
const dateToSerial = (iso) => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(1899, 11, 30)) / 86400000);
const groupKey = (trackId, secName, groupName) => `${trackId}|${secName || ''}|${groupName}`;
const STATION_META = [
  { col: 'r', lab: 'Received from utility' },
  { col: 's', lab: 'Sent to client' },
  { col: 'b', lab: 'Back from client' },
  { col: 'f', lab: 'Forwarded to utility' },
];
// merge logged entries into a group as synthetic steps so deriveBall + rails pick them up
function withLog(group, entries) {
  if (!entries || !entries.length) return group;
  const steps = [...(group.steps || []), ...entries.map(e => ({ label: 'Logged — ' + STATION_META.find(s => s.col === e.col).lab, [e.col]: e.serial }))];
  return { ...group, steps, _log: entries };
}

// ---- nudge reminders (persisted per project/group) ----
const NUDGE_KEY = 'msa_app_coord_nudges_v1';
function loadNudges() { try { return JSON.parse(localStorage.getItem(NUDGE_KEY)) || {}; } catch (e) { return {}; } }
function persistNudges(n) { try { localStorage.setItem(NUDGE_KEY, JSON.stringify(n)); } catch (e) {} }
const STALE_DAYS = 14;        // waiting this long = stale
const RENUDGE_DAYS = 7;       // nudge older than this = time to nudge again
const daysAgo = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
const HOLDER_TO = { utility: 'the utility contact', client: 'the client', msa: 'the MSA assignee' };
// nudge state for one hand-off: { stale, lastNudge, due }
function nudgeState(ball, days, nudges) {
  const active = ['utility', 'client', 'msa'].includes(ball.holder);
  const stale = active && days != null && days >= STALE_DAYS;
  const lastNudge = nudges && nudges.length ? nudges[nudges.length - 1] : null;
  const due = stale && (!lastNudge || daysAgo(lastNudge.ts) >= RENUDGE_DAYS);
  return { stale, lastNudge, due };
}
function NudgeControl({ ball, days, nudges, canWrite, onNudge, utility }) {
  const { stale, lastNudge, due } = nudgeState(ball, days, nudges);
  if (!['utility', 'client', 'msa'].includes(ball.holder)) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      {lastNudge && (
        <span style={{ fontSize: 10.5, color: due ? 'var(--amber)' : 'var(--ink-4)', whiteSpace: 'nowrap' }} title={`Nudged by ${lastNudge.by}`}>
          nudged {daysAgo(lastNudge.ts) === 0 ? 'today' : daysAgo(lastNudge.ts) + 'd ago'}
        </span>
      )}
      {canWrite && (
        <button className="btn btn-sm" onClick={onNudge}
          style={due
            ? { height: 24, fontSize: 11, background: 'var(--amber-tint)', borderColor: 'var(--amber)', color: 'var(--amber-ink, var(--amber))', fontWeight: 600 }
            : { height: 24, fontSize: 11 }}
          title={`Send a reminder to ${(HOLDER_TO[ball.holder] || '').replace('utility', utility || 'utility')}`}>
          {due ? '⚠ Nudge — stale' : 'Nudge'}
        </button>
      )}
    </span>
  );
}

// Which workbook tracks are relevant for a project's agencies
function coordTracksFor(p) {
  const T = JOB2417.tracks;
  const out = [];
  if (p.agencies.includes('sce')) out.push(T.SCE_R15, T.SCE_R16);
  if (p.agencies.includes('socalgas')) out.push(T.GAS_BACKBONE, T.GAS_METERS);
  if (p.agencies.includes('frontier')) out.push(T.FRONTIER);
  if (p.agencies.includes('att')) out.push(T.TWC);
  if (out.length === 0) out.push(T.GAS_BACKBONE); // fallback so section never renders empty
  return out;
}

// Flatten a track into { name, groups: [...] } sections for the stepper view
function trackSections(track) {
  if (track.workOrders) return track.workOrders.map(wo => ({ name: wo.name || wo.lots, groups: wo.groups || (wo.steps ? [{ name: 'Rule 16 contract — ' + wo.lots, steps: wo.steps, state: wo.state === 'open' ? undefined : 'done', comment: wo.status, reconcile: wo.reconcile }] : []) }));
  if (track.phases) return [{ name: null, groups: track.phases }];
  return [{ name: null, groups: track.groups || [] }];
}

function trackOpenCount(track) {
  let n = 0;
  trackSections(track).forEach(sec => sec.groups.forEach(g => {
    const b = deriveBall(g);
    if (['client', 'msa', 'utility'].includes(b.holder)) n++;
  }));
  return n;
}

function CoordBoardCard({ item, nudges, canWrite, onNudge }) {
  const { track, group, ball, days } = item;
  const sev = days > 300 ? 'sev-hot' : days > 90 ? 'sev-warm' : 'sev-ok';
  return (
    <div className={'bcard ' + sev}>
      <div className="bcard-top">
        <span className={'util-chip uc-' + track.tag.toLowerCase()}>{track.tag}</span>
        <span className="bcard-track">{track.utilityFull}</span>
      </div>
      <div className="bcard-name">{group.name}{item.woName ? ' · ' + item.woName : ''}</div>
      <div className="bcard-days">
        <span className="bcard-num mono">{days}</span>
        <span className="bcard-unit">days<br />waiting</span>
        <span className="bcard-since">since {xd(ball.since)}</span>
      </div>
      {ball.step && <div className="bcard-last">Last action — {ball.step}</div>}
      {group.reconcile && <div className="cgroup-reconcile" style={{ marginTop: 8, fontSize: 11 }}>⚑ {group.reconcile}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 9 }}>
        <NudgeControl ball={ball} days={days} nudges={nudges} canWrite={canWrite} onNudge={onNudge} utility={track.utility} />
      </div>
    </div>
  );
}

function CoordSection({ p, canWrite, currentUser }) {
  const tracks = coordTracksFor(p);
  const [tabId, setTabId] = React.useState(tracks[0].id);
  const [view, setView] = React.useState('steppers'); // steppers | board
  const [log, setLog] = React.useState(loadCoordLog);
  const track = tracks.find(t => t.id === tabId) || tracks[0];
  const sections = trackSections(track);
  const projLog = log[p.id] || {};
  const [nudges, setNudges] = React.useState(loadNudges);
  const projNudges = nudges[p.id] || {};
  const addNudge = (gKey) => {
    setNudges(prev => {
      const next = { ...prev, [p.id]: { ...(prev[p.id] || {}), [gKey]: [...((prev[p.id] || {})[gKey] || []), { ts: new Date().toISOString(), by: currentUser ? currentUser.name : 'Unknown' }] } };
      persistNudges(next);
      return next;
    });
  };
  // key for a board item (mirrors the stepper's section naming)
  const boardKey = (it) => groupKey(it.track.id, it.woName === it.group.name ? null : it.woName, it.group.name);
  const addLog = (gKey, entry) => {
    setLog(prev => {
      const next = { ...prev, [p.id]: { ...(prev[p.id] || {}), [gKey]: [...((prev[p.id] || {})[gKey] || []), entry] } };
      persistCoordLog(next);
      return next;
    });
  };

  // board items scoped to this project's tracks
  const boardItems = React.useMemo(() => {
    const ids = new Set(tracks.map(t => t.id));
    return openItems().filter(it => ids.has(it.track.id));
  }, [p.id, log]);
  const laneOf = (h) => boardItems.filter(i => i.ball.holder === h);

  return (
    <div className="panel">
      <div className="panel-hd">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          Utility coordination
          <span className="badge b-gray" title="Sample data from the Job 2417 workbook — live coordination logging comes with the production build">demo data</span>
        </h2>
        <div className="lens" style={{ padding: 3 }}>
          <button className={view === 'steppers' ? 'active' : ''} onClick={() => setView('steppers')}>Hand-offs</button>
          <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>Ball-in-court</button>
        </div>
      </div>

      {view === 'steppers' ? (
        <>
          <div className="util-tabs">
            {tracks.map(t => {
              const open = trackOpenCount(t);
              return (
                <button key={t.id} className={'util-tab' + (tabId === t.id ? ' active' : '')} onClick={() => setTabId(t.id)}>
                  <span className={'util-chip uc-' + t.tag.toLowerCase()}>{t.tag}</span>
                  {t.utility} — {t.track}
                  {open > 0 && <span className="ut-n">{open}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
            {track.meta && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{track.meta}</div>}
            {track.contact && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{track.contact}</div>}
            {sections.map((sec, si) => (
              <React.Fragment key={si}>
                {sec.name && <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', fontWeight: 700, marginTop: si > 0 ? 6 : 0 }}>{sec.name}</div>}
                {sec.groups.map((g, gi) => {
                  const gk = groupKey(track.id, sec.name, g.name);
                  return <HandoffStepperApp key={gi} group={withLog(g, projLog[gk])} utility={track.utility} canWrite={canWrite} currentUser={currentUser} onLog={(entry) => addLog(gk, entry)} nudges={projNudges[gk]} onNudge={() => addNudge(gk)} />;
                })}
              </React.Fragment>
            ))}
          </div>
        </>
      ) : (
        <div className="coord-lanes">
          {[['Waiting on utility', 'bc-utility', 'utility', 'Nothing pending with utilities.'],
            ['Waiting on client', 'bc-client', 'client', 'Nothing pending with the client.'],
            ["In MSA's court", 'bc-msa', 'msa', 'Inbox zero — nothing is waiting on MSA. ✓']].map(([title, cls, h, empty]) => {
            const items = laneOf(h);
            return (
              <div className="lane" key={h}>
                <div className={'lane-hd ' + cls}><span className="ball-dot"></span>{title}<span className="lane-n">{items.length}</span></div>
                <div className="lane-body">
                  {items.length === 0 ? <div className="lane-empty">{empty}</div> : items.map((it, i) => <CoordBoardCard key={i} item={it} nudges={projNudges[boardKey(it)]} canWrite={canWrite} onNudge={() => addNudge(boardKey(it))} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// App-local copies of the exploration's Ball + HandoffStepper (self-contained
// so the app doesn't depend on coord-shared.jsx / design-canvas files).
function CoordBall({ ball, days }) {
  const meta = BALL_META[ball.holder];
  return (
    <span className={'ball-chip ' + meta.cls}>
      <span className="ball-dot"></span>{meta.label}
      {days != null && days > 0 && ball.holder !== 'done' && <span className="ball-days">{days}d</span>}
    </span>
  );
}

function HandoffStepperApp({ group, utility, canWrite, currentUser, onLog, nudges, onNudge }) {
  const ball = deriveBall(group);
  const [logging, setLogging] = React.useState(false);
  const [logCol, setLogCol] = React.useState(null);
  const [logDate, setLogDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [logNote, setLogNote] = React.useState('');
  const last = { r: null, s: null, b: null, f: null };
  (group.steps || []).forEach((s) => ['r', 's', 'b', 'f'].forEach((c) => { if (s[c] != null) last[c] = s[c]; }));
  const stations = [
    { lab: 'Rec’d from ' + utility, date: last.r },
    { lab: 'Sent to client', date: last.s },
    { lab: 'Back from client', date: last.b },
    { lab: 'Fwd to ' + utility, date: last.f },
  ];
  const isDone = ball.holder === 'done';
  const isPending = ball.holder === 'pending' || ball.holder === 'na';
  // suggest the next empty station in chain order
  const nextCol = STATION_META.find(s => last[s.col] == null)?.col || 'f';
  const startLog = () => { setLogCol(nextCol); setLogDate(new Date().toISOString().slice(0, 10)); setLogNote(''); setLogging(true); };
  const saveLog = () => {
    if (!logCol || !logDate) return;
    onLog({ col: logCol, serial: dateToSerial(logDate), note: logNote.trim(), by: currentUser ? currentUser.name : 'Unknown', ts: new Date().toISOString() });
    setLogging(false);
  };
  let holdIdx = -1;
  if (!isDone && !isPending) {
    if (ball.holder === 'client') holdIdx = 1;
    else if (ball.holder === 'msa') holdIdx = last.b === ball.since ? 2 : 0;
    else if (ball.holder === 'utility') holdIdx = 3;
  }
  return (
    <div className={'hstep' + (isDone ? ' hstep-done' : '') + (isPending ? ' hstep-pending' : '')}>
      <div className="hstep-top">
        <div className="hstep-name">{group.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NudgeControl ball={ball} days={waitDays(ball.since)} nudges={nudges} canWrite={canWrite} onNudge={onNudge} utility={utility} />
          {canWrite && !isDone && !logging && <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }} onClick={startLog}>+ Log hand-off</button>}
          <CoordBall ball={ball} days={waitDays(ball.since)} />
        </div>
      </div>
      {logging && (
        <div style={{ border: '1px solid var(--primary)', background: 'var(--primary-tint)', borderRadius: 9, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 9 }}>
            {STATION_META.map(s => (
              <button key={s.col} className="btn btn-sm" onClick={() => setLogCol(s.col)}
                style={logCol === s.col ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white', height: 26, fontSize: 11 } : { height: 26, fontSize: 11 }}>
                {s.lab.replace('utility', utility)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" className="input" style={{ height: 30, fontSize: 12, width: 150 }} value={logDate} onChange={e => setLogDate(e.target.value)} />
            <input className="input" style={{ height: 30, fontSize: 12, flex: 1, minWidth: 160 }} placeholder="Note (optional) — e.g. sent via email to planner" value={logNote} onChange={e => setLogNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveLog(); }} />
            <button className="btn btn-primary btn-sm" onClick={saveLog} disabled={!logCol || !logDate}>Save</button>
            <button className="btn btn-sm" onClick={() => setLogging(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="hstep-rail">
        {stations.map((stn, i) => {
          const reached = stn.date != null;
          return (
            <React.Fragment key={i}>
              {i > 0 && <div className={'hstep-link' + (reached ? ' on' : '')}></div>}
              <div className={'hstep-node' + (reached ? ' on' : '') + (holdIdx === i ? ' holding ' + BALL_META[ball.holder].cls : '')}>
                <div className="hstep-dot">{reached ? '✓' : ''}</div>
                <div className="hstep-lab">{stn.lab}</div>
                <div className="hstep-date mono">{stn.date != null ? xdShort(stn.date) : '—'}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {!isDone && !isPending && ball.holder === 'utility' && last.r == null && (
        <div className="hstep-wait">Submitted {xdShort(last.f)} — waiting on {utility} for <b>{waitDays(ball.since)} days</b></div>
      )}
      {group.comment && <div className="cgroup-note"><b>Status</b> {group.comment}</div>}
      {group.reconcile && <div className="cgroup-reconcile">⚑ {group.reconcile}</div>}
      {group._log && group._log.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {group._log.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 11.5, color: 'var(--ink-3)' }}>
              <span className="mono" style={{ color: 'var(--ink-2)', flexShrink: 0 }}>{xdShort(e.serial)}</span>
              <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{STATION_META.find(s => s.col === e.col).lab.replace('utility', utility)}</span>
              {e.note && <span>— {e.note}</span>}
              <span style={{ marginLeft: 'auto', flexShrink: 0 }}>logged by {e.by}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CoordSection, hasCoordination, coordTracksFor, groupKey, loadNudges, nudgeState });
