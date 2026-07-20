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

Sign in with one of the demo users on the login screen. All state (session, project edits,
overrides) persists in `localStorage`.

## Notes on the import

- `vendor/` holds React 18.3.1, ReactDOM 18.3.1, and @babel/standalone 7.29.0 — the same
  versions the original loaded from unpkg — so the app runs offline. Only the three
  `<script>` tags in the HTML `<head>` were changed.
- Fixed a hooks-order crash on login in `app-main.jsx` (a `useMemo` sat after the
  `LoginScreen` early return, so signing in threw "Rendered more hooks than during the
  previous render"). The memo was moved above the early return; no behavior change.
- The design project's `uploads/*.pdf` demo attachments (research letters, exhibit) are not
  mirrored; links to them in project p9's research tab will 404. The app itself is unaffected.
