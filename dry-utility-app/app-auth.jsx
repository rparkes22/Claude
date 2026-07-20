// Dry Utility App — login screen + Users & Permissions page.
// Uses globals from app-data.jsx. Exports to window.

function AuthIcon({ name, size = 14 }) {
  const p = {
    go: 'M3 8h9m0 0l-3-3m3 3l-3 3',
    check: 'M3 8l3 3 7-7',
    x: 'M3 3l10 10M13 3L3 13',
    user: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 14a6 6 0 0 1 12 0',
    plus: 'M3 8h10M8 3v10',
    shield: 'M8 1.5l5 2v4c0 3.5-2.2 5.8-5 7-2.8-1.2-5-3.5-5-7v-4l5-2z',
    lock: 'M4 7V5a4 4 0 0 1 8 0v2M3 7h10v7H3V7z',
    trash: 'M3 4h10M6 4V2h4v2M5 4v9h6V4M7 7v4M9 7v4',
  }[name];
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={p} /></svg>;
}

const userColor = (s) => {
  const palette = ['#1d4e89', '#0f766e', '#7c3aed', '#b45309', '#15803d', '#be185d'];
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return palette[Math.abs(h) % palette.length];
};
function UserAvatar({ user, size = 28 }) {
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.37, background: userColor(user.name) }} title={user.name}>{user.initials}</span>;
}
function RoleBadge({ role }) {
  const m = ROLE_META[role];
  return <span className={`role-badge ${m.cls}`}>{m.label}</span>;
}

// ===== LOGIN =====
function LoginScreen({ users, onLogin }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState(null);

  const submit = (e) => {
    e.preventDefault();
    const u = users.find(x => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) { setErr('No account found for that email. Ask an admin to invite you.'); return; }
    if (!pw.trim()) { setErr('Enter your password.'); return; }
    onLogin(u);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-mark">M</div>
          <div>
            <div className="login-name">MSA Consulting</div>
            <div className="login-tag">Dry Utility Division</div>
          </div>
        </div>
        <h2 className="login-h">Sign in to continue</h2>
        {err && <div className="login-err">{err}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(null); }} placeholder="you@msaconsultinginc.com" autoComplete="off" />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(null); }} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Sign in <AuthIcon name="go" size={14} />
          </button>
        </form>
        <div className="login-divider">Demo — sign in as</div>
        <div className="demo-users">
          {users.slice(0, 3).map(u => (
            <button key={u.id} className="demo-user" onClick={() => onLogin(u)}>
              <UserAvatar user={u} size={30} />
              <div>
                <div className="du-name">{u.name}</div>
                <div className="du-role">{u.title}</div>
              </div>
              <span style={{ marginLeft: 'auto' }}><RoleBadge role={u.role} /></span>
              <span className="du-go"><AuthIcon name="go" size={13} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== USERS & PERMISSIONS PAGE =====
function UsersPage({ users, setUsers, currentUser, showToast }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('viewer');

  const invite = () => {
    const nm = name.trim();
    const em = email.trim();
    if (!nm || !em) { showToast('Name and email are required'); return; }
    if (users.some(u => u.email.toLowerCase() === em.toLowerCase())) { showToast('That email already has an account'); return; }
    const initials = nm.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const next = [...users, { id: 'u' + Date.now(), name: nm, initials, email: em, role, title: 'Invited — pending first sign-in' }];
    setUsers(next); persistUsers(next);
    setName(''); setEmail(''); setRole('viewer');
    showToast(`Invite sent to ${em}`);
  };
  const setUserRole = (id, r) => {
    const next = users.map(u => u.id === id ? { ...u, role: r } : u);
    setUsers(next); persistUsers(next);
    showToast('Role updated');
  };
  const removeUser = (id) => {
    if (id === currentUser.id) { showToast("You can't remove yourself"); return; }
    const next = users.filter(u => u.id !== id);
    setUsers(next); persistUsers(next);
    showToast('User removed');
  };

  return (
    <div>
      <div className="invite-grid">
        {/* user list */}
        <div className="panel">
          <div className="panel-hd"><h2>Team members</h2><span className="meta">{users.length}</span></div>
          <div>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: '1px solid var(--border)' }}>
                <UserAvatar user={u} size={32} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name} {u.id === currentUser.id && <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>(you)</span>}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email} · {u.title}</div>
                </div>
                <select className="select" style={{ width: 96, height: 30, fontSize: 12 }} value={u.role} onChange={e => setUserRole(u.id, e.target.value)} disabled={u.id === currentUser.id}>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button className="btn btn-sm btn-ghost" title="Remove user" onClick={() => removeUser(u.id)} disabled={u.id === currentUser.id} style={{ color: 'var(--warn)' }}>
                  <AuthIcon name="trash" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* invite + matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel">
            <div className="panel-hd"><h2>Invite a new user</h2></div>
            <div style={{ padding: '16px 18px' }}>
              <div className="form-row">
                <div className="field">
                  <label>Full name <span className="req">*</span></label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Morgan" />
                </div>
                <div className="field">
                  <label>Email <span className="req">*</span></label>
                  <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="amorgan@msaconsultinginc.com" />
                </div>
              </div>
              <div className="field">
                <label>Role</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {Object.keys(ROLE_META).map(r => (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1px solid ' + (role === r ? 'var(--primary)' : 'var(--border)'), background: role === r ? 'var(--primary-tint)' : 'white', borderRadius: 9, cursor: 'pointer', fontSize: 12.5 }}>
                      <input type="radio" name="invite-role" checked={role === r} onChange={() => setRole(r)} style={{ accentColor: 'var(--primary)' }} />
                      <RoleBadge role={r} />
                      <span style={{ color: 'var(--ink-3)' }}>{ROLE_META[r].desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={invite}><AuthIcon name="plus" size={13} />Send invite</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-hd"><h2>Role permissions</h2></div>
            <div style={{ padding: '4px 18px 14px' }}>
              <table className="perm-matrix">
                <thead><tr><th>Permission</th><th>Admin</th><th>Editor</th><th>Viewer</th></tr></thead>
                <tbody>
                  {PERMS.map(p => (
                    <tr key={p.key}>
                      <td>{p.label}</td>
                      <td>{p.admin ? <span className="perm-yes"><AuthIcon name="check" size={13} /></span> : <span className="perm-no"><AuthIcon name="x" size={11} /></span>}</td>
                      <td>{p.editor ? <span className="perm-yes"><AuthIcon name="check" size={13} /></span> : <span className="perm-no"><AuthIcon name="x" size={11} /></span>}</td>
                      <td>{p.viewer ? <span className="perm-yes"><AuthIcon name="check" size={13} /></span> : <span className="perm-no"><AuthIcon name="x" size={11} /></span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, UsersPage, UserAvatar, RoleBadge, AuthIcon, userColor });
