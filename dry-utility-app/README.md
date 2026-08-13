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
4. **Utility Coordination** — driven by the Will Serve Letter. A year from issue with a
   6-month extension is only the usual case: both the **expiry** and the **extension
   date** can be entered by hand on the WSL record, because agencies don't always follow
   the rule and sometimes grant time after the fact. A hand-entered date always wins over
   the derived one, and the record says which it is. Project tasks live here and can be
   given a deadline when they are created.

Calendar arithmetic clamps to the end of the target month rather than rolling over, so a
letter issued 31 Aug runs to 28 Feb — not 3 Mar — and 29 Feb + 1 year is 28 Feb.

Work a client had done before the project reached us can be marked complete during
project creation — Utility Research and the Existing Utility Plan are then recorded as
finished rather than started from scratch.

## People, roles & workload

`admin` (full access including users), `manager` (full project access and assigns work,
plus agency setup, but no user admin), `editor` (read/write projects, letters, reports),
`viewer` (read-only). Permissions are declared once in `PERMS` and read through `can()`;
an unrecognised role falls back to read-only rather than silently gaining access.

Every project carries an **MSA project manager**, set at creation (defaulting to whoever
is creating it) and editable afterwards. The PM drives task ownership on the Team page and
is named on the client report.

There is **no per-person task cap**. Load is uneven by design — the division manager
carries a large share — so workload bars are scaled against the busiest person, nobody is
flagged "over capacity", and an assignment is never blocked. Rebalancing suggestions key
off the gap between the busiest and lightest person (3 tasks or more), not a limit.

## Client reports

Reports are laid out on the letterhead and paginate without splitting a section, table row
or card across a page break. **Issue & file** stores the report exactly as it reads that
day; printing files it too. The record is per project, newest first, and each entry is a
frozen snapshot — a report that has gone to a client never changes as the project moves on.

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
reports** — is laid out on MSA's own letterhead artwork, mirroring the printed stationery:

- `assets/new-letterhead.svg` — **page 1**: the logo lockup at the top, contact line at the foot.
- `assets/2nd-page-letterhead.svg` — **every page after**: the contact line only, no lockup.

Both files are full-page (8.5×11) artwork. `Letterhead` / `LetterFoot` / `LetterheadDoc` in
`app-letters.jsx` show each through a fixed-aspect *window* — the header band reveals the
top 1.35in of page 1, the footer band the bottom 0.8in — so the artwork keeps its own scale
whether it's a 7.2in on-screen preview or a printed page, with no cropping or rescaling.

Placement follows the two-file split: the header band sits in normal document flow, so it
appears once, on page 1; the footer band lives in `<tfoot>`, which browsers redraw at the
foot of every printed page. (`position: fixed` was tried first and is not dependable —
negative offsets into the `@page` margin get clipped, and page one is skipped.)

Page geometry is `@page { margin: 0.62in 0 0 0 }` with `@page :first { margin-top: 0 }`, so
page 1 sits flush and the lockup lands where the artwork puts it, while later pages drop
below the fold. Letters are the exception: every letter is its own page 1, so
`doPrint()` installs a scoped `@page { margin: 0 }` for that job and removes it afterwards.
Content is inset by `.msa-doc-body`, clear of both bands.

The **app** logo is separate: `assets/blueprint-logo.svg`, the MS monogram on a blueprint
field, used in the sidebar, on the login screen, and as the browser-tab icon. Client-facing
documents carry the letterhead, not the app badge.

`assets/msa-consulting-logo-color.svg` is the standalone colour logo; it is not referenced
by the app, since the letterhead artwork already contains the lockup.

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
