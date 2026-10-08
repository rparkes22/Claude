# Entra ID single sign-on — setup runbook

Blueprint signs in through **Supabase Auth** with **Microsoft Entra ID** as the identity
provider. Entra proves who you are; Blueprint's own Users page still decides what you can
do (admin / manager / editor / viewer).

The app code is already in place and deployed. What is left is the three bits of
configuration only you can do, in this order. **Steps 1–3 are safe to do at any time and
change nothing for current users. Step 4 is the one that locks the data down — read its
warning first.**

Project reference: `kqjanadbdtyfirureylk` · App URL: `https://msa-dry-utility-app.vercel.app`

---

## 1 · Register the application in Azure

[portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App
registrations** → **New registration**.

| Field | Value |
| --- | --- |
| Name | `MSA Blueprint` |
| Supported account types | **Accounts in this organizational directory only** (single tenant) |
| Redirect URI | platform **Web**, value `https://kqjanadbdtyfirureylk.supabase.co/auth/v1/callback` |

Single tenant is what restricts sign-in to MSA accounts — do not pick multitenant.

The redirect URI is **Supabase's** callback, not Blueprint's. The browser never handles
the Azure response directly; that is what lets the client secret stay on Supabase's
server instead of in the page source.

Then, from the registration's **Overview**, copy these two for step 2:

- **Application (client) ID**
- **Directory (tenant) ID**

### Add a client secret

**Certificates & secrets** → **Client secrets** → **New client secret**. Description
`Supabase Auth`, expiry 24 months.

Copy the **Value** immediately — Azure shows it once, and the Secret ID is not it.

> **Put the expiry date in a calendar.** When this secret expires, sign-in stops working
> for everyone with no warning. That is the single most common way this setup breaks.

### Two optional hardening steps

- **Token configuration** → **Add optional claim** → ID → `xms_edov`. This tells Supabase
  whether Entra has actually verified the email address, which guards against someone
  claiming an address they do not own. Supabase recommends it.
- **Enterprise applications** → MSA Blueprint → **Properties** → *Assignment required*
  **Yes**, then assign only the Dry Utility group under **Users and groups**. Without this,
  anyone in the MSA tenant can sign in (as a viewer, but still).

---

## 2 · Point Supabase at it

Supabase dashboard → **Authentication** → **Sign In / Providers** → **Azure**:

| Field | Value |
| --- | --- |
| Enable Sign in with Azure | on |
| Application (client) ID | from step 1 |
| Secret Value | the secret **Value** from step 1 |
| Azure Tenant URL | `https://login.microsoftonline.com/<Directory (tenant) ID>` |

The tenant URL must be the MSA directory ID. Leaving it at the default `common` would let
any Microsoft account reach the sign-in page.

Then **Authentication** → **URL Configuration**:

- **Site URL**: `https://msa-dry-utility-app.vercel.app`
- **Redirect URLs** — add each of these. Supabase refuses to return a session to a URL
  that is not listed, which shows up as sign-in appearing to do nothing:

```
https://msa-dry-utility-app.vercel.app
https://msa-dry-utility-app.vercel.app/**
https://*-msaconsulting.vercel.app/**
http://localhost:8000/**
```

The third line covers the per-deployment preview URLs; the fourth is for running it
locally.

---

## 3 · Sign in and check it worked

Open the app and use **Sign in with Microsoft**.

- You should land in Blueprint as yourself. Ryan, Mike, Domonique and Marco are matched by
  email address and keep the roles they already have.
- Anyone else signs in as a **viewer**, with the title "Signed in with Microsoft — role not
  set", and appears on the Users page for you to promote.
- Sign out and in again to confirm it is repeatable.

If something goes wrong the login screen shows Microsoft's own reason. The usual ones:

| What you see | Cause |
| --- | --- |
| Sign-in appears to do nothing, returns to login | The app URL is not in **Redirect URLs** (step 2) |
| `AADSTS50011` redirect URI mismatch | The Azure redirect URI is not exactly the Supabase callback |
| "User is not assigned to this application" | *Assignment required* is on and you are not assigned |
| `invalid_client` / works then stops months later | The client secret is wrong or has expired |
| "Error getting user email from external provider" | The email scope or the email claim is missing |

---

## 4 · Lock the database down

**Do this only once step 3 works**, and ideally with everyone out of the app.

Until this step, the publishable key sitting in the page source grants full read/write to
the whole database — anyone who views source can read every project, note and contract
without signing in at all. SSO on its own does not change that; it gates the interface.
This step is what makes the sign-in actually protect the data.

Supabase dashboard → **SQL Editor** → paste and run
[`lock-down-rls.sql`](./lock-down-rls.sql).

It replaces the permissive policies with ones that require a Supabase JWT whose email ends
in `@msaconsultinginc.com`, for both `app_state` and the `attachments` bucket. The file
ends with two checks: the policy list, and a `curl` that should stop returning data.

### What this changes

- **The email fallback becomes local-only.** It never authenticated anything, so it
  produces no Supabase session; after this step someone signing in that way works against
  their own browser storage and will not see or save shared data. It stays on the login
  screen as a way back in if Entra breaks — not as a way to use the app.
- **Attachment URLs stay public.** The `attachments` bucket is a public bucket, so
  existing object links remain readable by anyone holding the link, policies
  notwithstanding. Making it private needs the app to mint signed URLs — a follow-up,
  noted at the top of the SQL file.

---

## How it works, briefly

```
Blueprint ──signIn()──▶ Supabase /auth/v1/authorize?provider=azure
                               │
                               ▼
                       login.microsoftonline.com
                               │
                               ▼
              Supabase /auth/v1/callback  (holds the client secret)
                               │
     ◀──── redirect back with the session in the URL fragment ────
                               │
Blueprint captures it, scrubs the address bar, and from then on every
Supabase request carries that user's JWT instead of the publishable key.
```

`app-sso.js` does this over plain REST — no Supabase SDK, because the app has no build
step. The session lives in `localStorage` under `msa_auth_session_v1`, deliberately **not**
an `msa_app_*` key, since those are mirrored to the server and a token must never be.
`app-store.js` waits for the session to settle before its first pull, so a signed-in user's
very first request already carries their JWT.

Roles are not read from Entra. Entra is identity only; `PERMS` and the Users page remain
the authority on what anyone can do.
