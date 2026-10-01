// Entra ID single sign-on for Blueprint, via Supabase Auth.
//
// Why there is no Supabase SDK here: the app has no build step (Babel Standalone
// transpiles the JSX in the browser), and app-store.js already talks to Supabase over
// plain REST. This does the same for GoTrue, so SSO costs the app nothing at load time.
//
// The flow, all of it in the browser:
//   1. signIn() sends the browser to  /auth/v1/authorize?provider=azure
//   2. Supabase bounces to Microsoft; Microsoft returns to Supabase's /callback
//   3. Supabase redirects back here with the session in the URL *fragment*
//   4. we capture it, scrub the fragment, and hand app-store.js a real user JWT
//
// The Azure client secret lives in Supabase, never in this page — which is the whole
// reason this route can actually protect the data, unlike a browser-only OAuth client.
(function () {
  'use strict';

  var CFG = window.MSA_SUPABASE || {};
  var BASE = CFG.url ? CFG.url.replace(/\/+$/, '') + '/auth/v1' : null;
  var KEY = CFG.key;
  // Deliberately NOT an `msa_app_*` key: app-store.js mirrors those to Supabase, and a
  // session token is per-device and must never be written to shared storage.
  var SESSION_KEY = 'msa_auth_session_v1';
  var SKEW_MS = 60 * 1000;          // refresh a minute early rather than racing expiry

  var session = null;   // { access_token, refresh_token, expires_at }
  var user = null;      // { id, email, name }

  function readStored() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function store(s) {
    session = s;
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  // The session comes back in the fragment (implicit flow), which never reaches a server
  // and must be cleared from the address bar so it stays out of history and bookmarks.
  function captureFromUrl() {
    var h = (window.location.hash || '').replace(/^#/, '');
    if (!h || h.indexOf('access_token=') === -1) return null;
    var q = new URLSearchParams(h);
    var at = q.get('access_token');
    if (!at) return null;
    var expiresIn = parseInt(q.get('expires_in') || '3600', 10);
    var s = {
      access_token: at,
      refresh_token: q.get('refresh_token') || null,
      expires_at: Date.now() + expiresIn * 1000,
    };
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (e) { window.location.hash = ''; }
    return s;
  }

  // Microsoft can also hand back an error in the fragment (consent declined, user not
  // assigned to the app). Surface it rather than silently showing the login screen again.
  function captureError() {
    var h = (window.location.hash || '').replace(/^#/, '');
    if (!h || h.indexOf('error') === -1) return null;
    var q = new URLSearchParams(h);
    var e = q.get('error_description') || q.get('error');
    if (!e) return null;
    try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (err) {}
    return decodeURIComponent(String(e).replace(/\+/g, ' '));
  }

  function fetchUser() {
    if (!BASE || !session) return Promise.resolve(null);
    return fetch(BASE + '/user', {
      headers: { apikey: KEY, Authorization: 'Bearer ' + session.access_token },
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (u) {
        if (!u || !u.email) return null;
        var meta = u.user_metadata || {};
        user = {
          id: u.id,
          email: u.email,
          // Entra supplies one of these depending on how the tenant is configured
          name: meta.full_name || meta.name || meta.preferred_username || u.email,
        };
        return user;
      })
      .catch(function () { return null; });
  }

  function refresh() {
    if (!BASE || !session || !session.refresh_token) return Promise.resolve(false);
    return fetch(BASE + '/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.access_token) { store(null); return false; }
        store({
          access_token: d.access_token,
          refresh_token: d.refresh_token || session.refresh_token,
          expires_at: Date.now() + (d.expires_in || 3600) * 1000,
        });
        return true;
      })
      .catch(function () { return false; });
  }

  var lastError = null;

  // Resolved before React boots, so the app knows on first render whether someone is
  // signed in — no flash of the login screen for a signed-in user.
  window.__msaAuthReady = (function () {
    if (!BASE) return Promise.resolve(null);
    lastError = captureError();
    var fromUrl = captureFromUrl();
    if (fromUrl) store(fromUrl);
    else session = readStored();
    if (!session) return Promise.resolve(null);
    var fresh = session.expires_at && session.expires_at - Date.now() > SKEW_MS
      ? Promise.resolve(true) : refresh();
    return fresh.then(function (okNow) {
      if (!okNow && !session) return null;
      return fetchUser();
    }).then(function (u) {
      if (!u) store(null);   // token no longer resolves to a user — treat as signed out
      return u;
    });
  })();

  window.MSA_AUTH = {
    configured: function () { return !!BASE; },
    // Where Microsoft sends us back to. Must be allowlisted in Supabase under
    // Authentication → URL Configuration → Redirect URLs, or Supabase refuses it.
    redirectTo: function () { return window.location.origin + window.location.pathname; },
    signIn: function () {
      if (!BASE) return;
      var url = BASE + '/authorize?provider=azure'
        + '&redirect_to=' + encodeURIComponent(this.redirectTo())
        // email is required — Supabase rejects an Azure identity with no address.
        // offline_access is what gets us a refresh token.
        + '&scopes=' + encodeURIComponent('email offline_access');
      window.location.assign(url);
    },
    signOut: function () {
      var tok = session && session.access_token;
      store(null); user = null;
      if (!BASE || !tok) return Promise.resolve();
      return fetch(BASE + '/logout', {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + tok },
      }).catch(function () {}).then(function () {});
    },
    user: function () { return user; },
    // app-store.js asks for this on every request, so a refreshed token is picked up
    // without anything having to be re-wired.
    token: function () {
      if (!session) return null;
      if (session.expires_at && session.expires_at - Date.now() <= SKEW_MS) refresh();
      return session.access_token;
    },
    error: function () { return lastError; },
    clearError: function () { lastError = null; },
  };
})();
