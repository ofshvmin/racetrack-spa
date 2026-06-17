# Self-serve admin: race results editor

## Context

The track owner (a non-technical user) plus 1–3 helpers need to post and edit race results on `chemungspeedrome.com` without going through Daniel. Today, results are typed/texted to Daniel and committed by hand — slow, error-prone, and a single point of failure during race season.

This is the **first deliberate exception** to the project's "no backend / no auth / no API" rule documented in `CLAUDE.md`. The intent is to keep that rule for content rendering (the public site stays mostly static), but add a tightly-scoped, well-guarded admin surface for editing the JSON content layer the rest of the site already reads.

**Outcome:** clients log in with a magic link, fill a schema-locked form, hit publish, and the public site rebuilds via the existing push-to-main flow within ~30 seconds — with all the guardrails needed to prevent erroneous or malformed results from going live.

**Scope of this build:** results only. The admin shell is structured so adding schedule and sponsor editors later is mostly schema + a new endpoint, not a re-architecture.

---

## Architecture (recommended approach only)

### Astro mode change
- `output: 'server'` with `@astrojs/vercel` adapter. (Astro 6 removed `hybrid` — server mode + opt-in prerender is the equivalent.)
- Every existing public page gets `export const prerender = true;` in its frontmatter. Build output for those pages is byte-identical to today.
- Admin pages set `prerender = false` so they run on-demand and can read the auth cookie server-side.

### API style
All new admin endpoints live under `/api/admin/*.js` as **Vercel Functions** — same style as the existing `api/contact.js` (Node handler, `req`/`res`, `res.redirect`, Resend client). This avoids mixing Vercel Functions and Astro endpoints in the same repo.

### Auth: magic-link via Resend, HMAC-signed tokens, browser-bound
1. User goes to `/admin` → no session → sign-in form (single email field).
2. `POST /api/admin/auth-request` with `{email}`:
   - If email is in `ADMIN_EMAILS` allow-list, generate `token = HMAC-SHA256({email, nonce, expires:+15min}, ADMIN_SESSION_SECRET)` and email the link via Resend.
   - Set a short-lived `pending-login-nonce` cookie (httpOnly, SameSite=Strict) so the link is bound to the browser that requested it. Replay from a different device fails.
   - **Always** return the same "check your email" response (don't leak which emails are allow-listed).
   - In-memory LRU rate limit: 5 requests / 10 min per IP. Survives within a warm function instance — adequate at this scale.
3. `GET /api/admin/auth-verify?token=...`:
   - Verify HMAC, expiry, and that the `pending-login-nonce` cookie matches the nonce in the token.
   - On success: set 7-day `admin-session` cookie (httpOnly, SameSite=Strict, signed JWT-like payload of `{email, expires}`) and 303 to `/admin`.
4. `POST /api/admin/auth-logout` → clear cookie, 303 to `/admin`.

Uses stdlib `crypto` (no `jose`/JWT library) — `createHmac`, `timingSafeEqual`, ~30 lines total.

### CSRF: triple defense
Every mutating endpoint (`/api/admin/*/save`, `/api/admin/auth-logout`) checks:
- `admin-session` cookie is valid (auth)
- `Origin` header matches the deployed origin (CSRF)
- `X-Requested-With: fetch` header is present (rejects classic form-CSRF)

Cookie itself is `SameSite=Strict`. Synchronizer tokens are overkill for 4 trusted users.

### Admin pages
- `/admin` — landing. Sign-in form if no session; if signed in, shows a card grid: **Results** (active), **Schedule** (disabled, "Coming soon"), **Sponsors** (disabled, "Coming soon"). `prerender = false`.
- `/admin/results` — race-night list joining `schedule.json` (races only, `type === "race"`) with `results.json` (which dates have results). Each row links to the editor. Canceled races shown visually flagged but still editable. `prerender = false`.
- `/admin/results/[date]` — the editor. Pre-populated if results exist for that date; blank otherwise. `prerender = false`.

Shared `AdminShell.astro` layout: server-side cookie check → redirect to `/admin` if missing; renders top bar with "Signed in as X" + logout form + `noindex` meta. Strictly structural — no admin-feature awareness.

### The form (`/admin/results/[date]`)
Vanilla JS in a `<script>` block — same precedent as `src/pages/results.astro` (235 lines of focused vanilla DOM). No UI framework added.

UI elements:
- One block per division (config-driven, currently Modifieds / Hobby / 4 Cyl).
- **Heat winners**: chip input, free text but autocompleted from past heat names.
- **Finishing order**: add/remove driver rows, positions auto-numbered, native HTML5 drag-to-reorder.
- **Driver name**: text input with `<datalist>` autocomplete from all drivers seen in `results.json` history (data inlined at server render time — fresh per visit, no cache layer).
- **Tag selector**: `None / DNS / DQ / BF` radio popover per row (uses native `<dialog>` or 20 lines of click-outside JS). No free-text tag field — impossible to type "(BFF)" or break the data shape.
- **Mandatory Preview**: toggle that renders the actual public results card markup with current form data, shown side-by-side with the currently-published version (if editing). Preview reuses the markup from `results.astro` extracted into a small `.astro` partial so it's byte-identical to what will go live.
- **Save & Publish**: button → POST → confirmation modal ("Publish results for {title} ({date})?") → final commit. On success: green banner "Posted. Site updates in ~30 seconds. View commit →".

### Commit endpoint: `POST /api/admin/results/save`
1. Verify session, CSRF triple, payload schema.
2. Fetch current `src/content/results.json` from GitHub Contents API (returns the file's `sha`).
3. Strip base64 newlines (a known Contents API gotcha), decode, parse JSON.
4. Upsert the entry for this date; sort entries by date descending.
5. PUT back via Contents API with the original `sha` (GitHub's `If-Match`-like atomicity — no manual diffing needed).
6. On 409 conflict, retry once with fresh fetch+merge. If still conflicting, return 409 with "Someone else just saved — please reload."
7. Commit metadata:
   - **Author**: `Chemung Speedrome Admin <admin@chemungspeedrome.com>`
   - **Message**: `Results: {title} ({date}) — via admin ({email})`
   - The submitter's email in the message gives a clear audit trail without exposing it elsewhere.
8. Response: `{commitSha, commitUrl}`.

Vercel auto-rebuilds on the resulting push to `main`.

### Schema validation (`api/_lib/schema-results.js`)
Pure function, no deps. Validates:
- `date` matches a `type === "race"` entry in `schedule.json`
- `divisions[].slug` ∈ `{b-mod, hobby, 4cyl, super, vintage}`
- `feature[].pos` is sequential from 1, no duplicates
- `feature[].driver` non-empty, trimmed
- `dnf` entries: either string or `{driver, tag}` where `tag ∈ {DNS, DQ, BF, DNF}`
- Returns `{ok: true}` or `{ok: false, errors: [{field, message}]}`

### Robots / SEO
- Add `Disallow: /admin/` to `public/robots.txt`.
- Fix the existing **stale `thunderridgespeedway.com` sitemap URL** in `robots.txt` to `chemungspeedrome.com` — pre-existing bug, fix while we're touching the file.
- Admin pages emit `<meta name="robots" content="noindex,nofollow">` for belt-and-suspenders.

---

## Files to create

### Vercel Functions (`/api/admin/`)
- `api/admin/auth-request.js` — POST email, allow-list check, rate limit, send Resend magic link, set browser-binding nonce cookie.
- `api/admin/auth-verify.js` — GET token, verify HMAC + nonce + expiry, set session cookie, 303 to `/admin`.
- `api/admin/auth-logout.js` — POST, clear session cookie, 303 to `/admin`.
- `api/admin/results/save.js` — POST, session + CSRF + schema validation, GitHub read-merge-write.

### Shared helpers (`/api/_lib/`)
- `api/_lib/session.js` — HMAC sign/verify, cookie parse/serialize, `requireSession(req)`, allow-list check, timing-safe compare.
- `api/_lib/github.js` — `readJsonFile(path) → {data, sha}`, `writeJsonFile(path, data, sha, message, authorEmail)`, 409 retry helper. Reads `GITHUB_TOKEN`, `GITHUB_REPO`.
- `api/_lib/rate-limit.js` — in-memory LRU for IP throttling.
- `api/_lib/schema-results.js` — pure validator for race-night payload.
- `api/_lib/csrf.js` — `requireCsrf(req, expectedOrigin)`: Origin check + `X-Requested-With` check.

### Astro pages & layouts
- `src/layouts/AdminShell.astro` — server-side cookie check via `_lib/session.js`, renders header + `<slot />`, `noindex` meta. Structural only.
- `src/pages/admin/index.astro` — sign-in form OR landing cards. `prerender = false`.
- `src/pages/admin/results/index.astro` — race-night list. `prerender = false`.
- `src/pages/admin/results/[date].astro` — the editor. `prerender = false`.
- `src/components/admin/ResultsCardPreview.astro` — extracted from the public results card markup so preview is byte-identical to public render. Reused by both `/results` and the admin preview.

## Files to modify

- `astro.config.mjs` — add `@astrojs/vercel` adapter import, `output: 'server'`, `adapter: vercel()`.
- `package.json` — add `@astrojs/vercel` dep.
- `src/pages/index.astro`, `about.astro`, `contact.astro`, `drivers.astro`, `info.astro`, `results.astro`, `schedule.astro`, `standings.astro`, `visit.astro` — add `export const prerender = true;` to each frontmatter.
- `src/pages/results.astro` — extract the results-card markup into `ResultsCardPreview.astro` and import it (keeps the public page byte-identical, enables reuse by admin preview).
- `public/robots.txt` — add `Disallow: /admin/` + fix stale sitemap URL.
- `CLAUDE.md` — append an **Admin (deliberate exception)** section documenting why the backend rule was broken, the env-var list, and the auth model in one paragraph.

---

## Environment variables

Add to Vercel project settings (Production + Preview + Development):
- `ADMIN_EMAILS` — comma-separated allow-list, e.g. `owner@track.com,scorer@track.com`. 1–4 emails.
- `ADMIN_SESSION_SECRET` — random 32+ byte hex string (`openssl rand -hex 32`). Used for HMAC signing.
- `GITHUB_TOKEN` — fine-grained GitHub PAT scoped to `ofshvmin/racetrack-spa` with `contents: write`. **PATs expire (max 1 year)** — add a calendar reminder. Long-term, consider a GitHub App.
- `GITHUB_REPO` — `ofshvmin/racetrack-spa` (optional; could be hardcoded but env-var keeps it portable).
- `RESEND_API_KEY` — already configured.

Resend `from` for admin emails: use the same `onboarding@resend.dev` as `api/contact.js` until DNS verification for `chemungspeedrome.com` completes. This is documented in project memory as a known pending item.

---

## Reused patterns / utilities

- **Resend client setup**: copy from `api/contact.js` — same import, same `RESEND_API_KEY` env var.
- **303 redirect pattern**: copy from `api/contact.js:34` — both `auth-verify` and `auth-logout` use the same pattern.
- **HTML escape helper**: `esc()` in `api/contact.js:41-47` — reusable for the magic-link email body.
- **Email HTML template style**: model magic-link email on `buildHtml()` in `api/contact.js:49-81` for visual consistency.
- **Client-side JS precedent**: `src/pages/results.astro` 235 lines of vanilla DOM (driver search, jump rail, IntersectionObserver) is the precedent for the admin form's vanilla-JS approach. No framework.
- **Results card markup**: the existing `.class-panel` / `.field` / `.notes` DOM in `results.astro:114-149` is the source of truth — extract to `ResultsCardPreview.astro` and import in both places.
- **JSON schema patterns**: existing `dnf` polymorphism (string-or-`{driver, tag}`) drives the validator's union handling.

---

## Phased rollout (one branch, but stage commits to make review reviewable)

1. **Infrastructure switch (no behavior change for public site)**: add `@astrojs/vercel`, switch to `output: 'server'`, add `prerender = true` to all 9 existing pages, verify the public site is byte-identical via diff of `dist/`.
2. **Shared libs**: `_lib/session.js`, `_lib/github.js`, `_lib/csrf.js`, `_lib/rate-limit.js`, `_lib/schema-results.js`. Unit-testable in isolation.
3. **Auth endpoints + admin landing**: `auth-request`, `auth-verify`, `auth-logout`, `AdminShell.astro`, `/admin/index.astro`. Verify magic-link flow end-to-end.
4. **Results editor**: `/admin/results/index.astro`, `/admin/results/[date].astro`, `ResultsCardPreview.astro`, `save.js`. Verify create + edit cycle.
5. **Robots, CLAUDE.md, env-var docs, README admin section.**

---

## Verification

End-to-end manual test plan (run with `pnpm dev` then deploy to a Preview):

**Auth happy path:**
1. Visit `/admin` → see sign-in form.
2. Enter an allow-listed email → see "Check your email."
3. Open the email, click the link → land on `/admin` signed in.
4. Bookmark works for 7 days; logout clears session.

**Auth failure modes (each should fail gracefully with a useful message):**
- Non-allow-listed email → same "check your email" response, no email sent.
- Expired link (>15 min) → "Link expired, request a new one."
- Link clicked in a different browser than the request originated → "Link no longer valid."
- Rate limit: 6th request in 10 min from same IP → "Too many requests."

**Results editor happy path:**
1. Land on `/admin/results` → list of scheduled race nights with status markers.
2. Click an upcoming race → blank editor for that date.
3. Add drivers, mark a DQ, drag to reorder → Preview shows correct rendering.
4. Save → confirmation modal → confirm → success banner with commit link.
5. Open public `/results` (after ~30s) → new entry visible, identical to preview.

**Editing existing results:**
1. Pick a past race with results → form pre-populated.
2. Fix a typo → save → public site updates.
3. Open the GitHub commit → diff shows only the intended change.

**Concurrency / conflict:**
1. Two tabs editing same date → second save returns 409 with a clear "reload" message.
2. Two tabs editing different dates → both succeed.

**Security smoke tests:**
- Direct `POST /api/admin/results/save` without session cookie → 401.
- Same with valid cookie but bad Origin → 403.
- Same with valid cookie, valid Origin, but no `X-Requested-With` → 403.
- Curl `/api/admin/auth-request` with random email at high rate → rate-limited at 5/10min.

**Public-site regression check:**
- After Astro mode switch, diff `dist/` before vs after — public pages byte-identical.
- All 9 public pages still render at the expected URLs.
- Lighthouse/Core Web Vitals score on `/results` unchanged.

---

## Out of scope (deliberately deferred)

- **Schedule editor** — admin landing has the disabled card; build when needed.
- **Sponsor editor** — same.
- **Standings / per-driver stat correction tools** — standings derive from results, so fixing results fixes standings.
- **Image uploads** (sponsor logos, photos) — would require object storage; defer until requested.
- **Audit log UI** — the GitHub commit history *is* the audit log. Don't replicate.
- **Soft delete / undo last** — handled by "edit existing" + the GitHub commit history. If owner wants a one-tap undo, add later.
- **Multi-factor auth, password fallback, account management** — out of scope at this user count.
- **GitHub App** (vs PAT) — defer until PAT rotation becomes annoying.
- **DNS verification for `chemungspeedrome.com` Resend domain** — pre-existing open item, tracked separately in project memory.

---

## Risks accepted

- **15-min magic-link replay window from the same browser**: someone with inbox access during that window can sign in. Mitigated by browser-binding nonce; further hardening (single-use via storage) deferred.
- **GitHub PAT expiry** (~1 year): manual renewal required; documented in CLAUDE.md.
- **Last-write-wins on same-date concurrent edits**: 409 surfaces the conflict; we don't attempt three-way merge.
- **In-memory rate limit reset on cold start**: an attacker who can trigger cold starts can bypass; acceptable at this scale and threat model.
- **Free Resend tier limits**: 3,000 emails/month. Magic-link volume is in single digits/week. No concern.
