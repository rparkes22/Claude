# MSA Blueprint

Blueprint — the web app for MSA Consulting's Dry Utility Division: project tracker, Will-Serve-Letter
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

## Workflow

1. **Create the project** — number, name, client plus client contact (name/email/phone),
   address, and the client's contract, which uploads on creation and lands in the
   project's Contracts panel.
2. **Utility Research** — generate the standard request letters for the selected
   agencies. Each letter tracks the date it went out and the date the response came
   back (both editable), or can be closed out as **No response** when an agency never
   replies. No-response agencies are excluded from outstanding-letter counts and are
   marked N/A on the Existing Utility Plan.
3. **Existing Utility Plan** — created automatically once every letter is resolved;
   plots each responding agency's facilities and tracks the deliverable through QC.
4. **Utility Coordination** — driven by the Will Serve Letter, valid **1 year** from
   issue with one extension, **6 months by default but editable per project** on the
   WSL record. Project tasks live here and can be given a deadline when they are created.

Work a client had done before the project reached us can be marked complete during
project creation — Utility Research and the Existing Utility Plan are then recorded as
finished rather than started from scratch.

## Agency Setup (admin)

One page, three tabs, and the agency row is the unit of everything:

- **Agencies** — grouped by kind and collapsed to a line each. Expand one to edit its
  identity, its letter contacts, and its coordination task templates in place.
- **Cities** — which agencies serve where; this drives the Add Project wizard.
- **Shared templates** — task templates defined once per agency *kind*
  (Electric, Gas, Water, Sewer, Telecom, Municipal, County). Every agency of that kind
  inherits them, including agencies added later. An individual agency can rename or hide
  an inherited template for itself without affecting the rest.

Templates surface on a project under **+ Add task**, grouped by the project's agencies,
with a free-text custom entry always available. Anything already on the project drops out
of the list. Research request letters are deliberately *not* templates here — the Utility
Research module owns those.

Coordination milestone durations live on the Utility Coordination page's **Durations**
tab, next to the deadlines they drive.

### IID: Capacity Study vs. Will Serve Letter

For IID, clients often ask for a **Capacity Study Submittal** before committing to the
formal Will Serve process. It tests project viability, runs about **7 weeks**, and has
no validity clock — it is either still out with IID or its results are back. It does
**not** authorise coordination work: the WSL is still required, and clients typically
request one later, once the project gears up. Both records live on the same project,
so the study stays in the history after the letter is issued.

## Branding & letterhead

Anything that leaves the office on paper — **Utility Research letters** and **client
reports** — is laid out on the MSA letterhead: the centred logo lockup with the two
discipline lines at the top, and the rule plus `34200 Bob Hope Drive · 760.320.9811 ·
msaconsultinginc.com` at the foot. It repeats on **every page**, not just the first.

`Letterhead` / `LetterFoot` / `LetterheadDoc` live in `app-letters.jsx` and are shared by
both documents, so the two can't drift apart. `LetterheadDoc` wraps content in a table and
puts the letterhead in `<thead>` and the contact line in `<tfoot>` — browsers redraw those
at the top and bottom of each printed page. (`position: fixed` was tried first and is not
dependable: negative offsets into the `@page` margin get clipped, and page one is skipped.)
Letters pass `singlePage`, which fixes the table to one page so the contact line sits at
the page foot rather than tucked under a short letter.

Two SVGs, both placeholders drawn to match the letterhead — drop the official artwork in
at the same paths and it updates everywhere at once:

- `assets/msa-mark.svg` — the circular MS monogram, used on letters and reports.
- `assets/msa-logo.svg` — the nav/login lockup.

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
