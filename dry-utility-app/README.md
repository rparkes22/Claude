# MSA — Dry Utility App

Prototype web app for MSA Consulting's Dry Utility Division: project tracker, Will-Serve-Letter
monitoring, utility research letters, utility coordination (Job 2417), team workload, client
reports, and admin (users, agencies, task catalog).

Imported from the Claude Design project ("Dry Utility App.html" + its 15 JSX modules).

## Run

No build step. Serve the folder over HTTP (Babel Standalone transpiles the JSX in-browser):

```sh
cd dry-utility-app
python3 -m http.server 8000
# open http://localhost:8000/Dry%20Utility%20App.html
```

Sign in with one of the demo users on the login screen.

## Data & attachments (Supabase)

The app syncs its state to a Supabase backend (project `msa-project-tracker`,
`kqjanadbdtyfirureylk.supabase.co`), configured inline in the HTML `<head>` via
`window.MSA_SUPABASE` and implemented in `app-store.js`:

- Every `msa_app_*` localStorage key is mirrored to the `app_state` table
  (debounced, last-write-wins), and pulled back on page load — so project edits,
  notes, and settings are shared across devices and users. The login session and
  notification read-state stay per-device.
- Note and contract attachments (PDFs etc.) upload to the public `attachments`
  Storage bucket; only the URL is kept in app state, so there is no file-size cap.
- If Supabase is unreachable the app silently falls back to localStorage-only
  mode (small attachments embed as data URLs, as before).

Security note: this is prototype-grade — the publishable key has full read/write
access to `app_state` and the bucket via permissive RLS policies. Anyone with the
key (i.e. anyone who can view the page source) can read/modify the data. Move to
Supabase Auth + row-level policies before using it with real client data.

## Notes on the import

- `vendor/` holds React 18.3.1, ReactDOM 18.3.1, and @babel/standalone 7.29.0 — the same
  versions the original loaded from unpkg — so the app runs offline. Only the three
  `<script>` tags in the HTML `<head>` were changed.
- Fixed a hooks-order crash on login in `app-main.jsx` (a `useMemo` sat after the
  `LoginScreen` early return, so signing in threw "Rendered more hooks than during the
  previous render"). The memo was moved above the early return; no behavior change.
- The design project's `uploads/*.pdf` demo attachments (research letters, exhibit) are not
  mirrored; links to them in project p9's research tab will 404. The app itself is unaffected.
