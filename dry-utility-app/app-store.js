// Supabase persistence layer for the MSA Dry Utility App.
//
// The app was written against localStorage (every piece of state lives under a
// `msa_app_*` key). Rather than rewrite that data flow, this shim:
//   1. pulls all rows from the `app_state` table into localStorage before the
//      React app boots (window.__msaStoreReady resolves when done), and
//   2. patches Storage.prototype.setItem/removeItem so writes to `msa_app_*`
//      keys are mirrored to Supabase (debounced, last-write-wins).
// If Supabase is unreachable the app runs exactly as before, localStorage-only.
(function () {
  'use strict';

  var CFG = window.MSA_SUPABASE || {};
  var URL_BASE = CFG.url;
  var API_KEY = CFG.key;
  // Keys that must stay per-device: login session and notification read-state.
  var LOCAL_ONLY = { msa_app_session_v1: 1, msa_app_notif_read_v1: 1 };
  var syncable = function (k) {
    return typeof k === 'string' && k.indexOf('msa_app_') === 0 && !LOCAL_ONLY[k];
  };

  var online = false;
  var headers = {
    apikey: API_KEY,
    Authorization: 'Bearer ' + API_KEY,
    'Content-Type': 'application/json',
  };

  function pullAll() {
    if (!URL_BASE || !API_KEY) return Promise.resolve(false);
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctl && setTimeout(function () { ctl.abort(); }, 4000);
    return fetch(URL_BASE + '/rest/v1/app_state?select=k,v', {
      headers: headers,
      signal: ctl ? ctl.signal : undefined,
    })
      .then(function (r) {
        if (!r.ok) throw new Error('app_state fetch ' + r.status);
        return r.json();
      })
      .then(function (rows) {
        rows.forEach(function (row) {
          if (syncable(row.k)) {
            try { rawSetItem.call(localStorage, row.k, row.v); } catch (e) {}
          }
        });
        online = true;
        return true;
      })
      .catch(function (e) {
        console.warn('[msa-store] offline mode (' + (e && e.message) + ')');
        return false;
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  // ---- write mirroring (debounced per key) ----
  var pendingUpserts = {};
  var pendingDeletes = {};
  var flushTimer = null;

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, 400);
  }

  function flush() {
    flushTimer = null;
    if (!online) return;
    var rows = Object.keys(pendingUpserts).map(function (k) {
      return { k: k, v: pendingUpserts[k], updated_at: new Date().toISOString() };
    });
    var dels = Object.keys(pendingDeletes);
    pendingUpserts = {};
    pendingDeletes = {};
    if (rows.length) {
      fetch(URL_BASE + '/rest/v1/app_state?on_conflict=k', {
        method: 'POST',
        headers: Object.assign({}, headers, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify(rows),
      }).catch(function (e) { console.warn('[msa-store] upsert failed', e); });
    }
    dels.forEach(function (k) {
      fetch(URL_BASE + '/rest/v1/app_state?k=eq.' + encodeURIComponent(k), {
        method: 'DELETE',
        headers: headers,
      }).catch(function (e) { console.warn('[msa-store] delete failed', e); });
    });
  }

  var rawSetItem = Storage.prototype.setItem;
  var rawRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) {
    rawSetItem.call(this, k, v);
    if (this === window.localStorage && syncable(k)) {
      delete pendingDeletes[k];
      pendingUpserts[k] = String(v);
      scheduleFlush();
    }
  };
  Storage.prototype.removeItem = function (k) {
    rawRemoveItem.call(this, k);
    if (this === window.localStorage && syncable(k)) {
      delete pendingUpserts[k];
      pendingDeletes[k] = 1;
      scheduleFlush();
    }
  };
  window.addEventListener('beforeunload', function () { if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; flush(); } });

  // ---- attachment uploads (used by the project-page notes feature) ----
  // Returns a Promise of { name, size, type, url } or null when offline.
  window.__msaUploadAttachment = function (file, projectId) {
    if (!online) return Promise.resolve(null);
    var safeName = String(file.name).replace(/[^A-Za-z0-9._ -]/g, '_');
    var path = encodeURIComponent(projectId) + '/' + Date.now() + '-' + encodeURIComponent(safeName);
    return fetch(URL_BASE + '/storage/v1/object/attachments/' + path, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: 'Bearer ' + API_KEY,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: file,
    }).then(function (r) {
      if (!r.ok) throw new Error('upload ' + r.status);
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL_BASE + '/storage/v1/object/public/attachments/' + path,
      };
    }).catch(function (e) {
      console.warn('[msa-store] attachment upload failed', e);
      return null;
    });
  };

  window.__msaStoreOnline = function () { return online; };
  window.__msaStoreReady = pullAll();
})();
