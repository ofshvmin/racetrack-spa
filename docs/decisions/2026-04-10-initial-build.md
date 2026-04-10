# ADR: Initial Build — Stack Choices and Key Decisions

**Date:** 2026-04-10
**Status:** Accepted

## Context

Thunder Ridge Speedway (placeholder name — TBD by owner) needs a marketing and event-information website. The site has five pages, no user accounts, no e-commerce, and a content volume of roughly 20-40 schedule entries per season plus a handful of informational pages. The audience is local race fans checking dates, times, and directions on their phones.

The Astro minimal template has been scaffolded. Tailwind CSS v4 and `@tailwindcss/vite` are installed. This ADR records the foundational decisions before any implementation begins.

## Decisions

### 1. Astro (static output) over Next.js or other frameworks

**Decision:** Use Astro in static-output mode. Zero client-side JavaScript by default.

**Rationale:**
- No page on this site requires client-side state, routing, or hydration.
- Astro ships zero JS unless explicitly opted in. Next.js ships a React runtime even for static pages.
- Build output is plain HTML/CSS files deployable to any static host (Netlify, Vercel, S3, literally anything). No vendor lock-in to serverless functions or edge runtimes.
- Astro's component model (`.astro` files) handles templating without introducing a UI framework dependency.

**Rejected alternatives:**
- Next.js: Unnecessary React runtime, SSR complexity for a site with no dynamic data.
- Hugo/11ty: Viable, but Astro's component model is more ergonomic for a developer already working in the JS ecosystem, and Tailwind v4 integration via Vite is first-class.
- Plain HTML: Five pages with shared nav/footer/layout would mean duplicated markup and painful maintenance.

### 2. Tailwind CSS v4 with CSS-based design tokens (not tailwind.config.mjs)

**Decision:** Define all design tokens using `@theme` directives in `src/styles/global.css`. No `tailwind.config.mjs` file.

**Rationale:**
- Tailwind v4 moved configuration into CSS. The `@theme` block defines custom properties that Tailwind utilities consume directly. This is the canonical v4 approach.
- A `tailwind.config.mjs` file still works in v4 for backward compatibility, but mixing both config surfaces creates confusion. Pick one; CSS is the v4 default.
- Design tokens as CSS custom properties are inspectable in browser DevTools, usable in arbitrary CSS when needed, and require no build tooling to understand.

**Tokens defined:**
- `--color-brand-red` — primary accent (CTA buttons, highlights)
- `--color-surface-dark` — page background (near-black)
- `--color-surface-mid` — card/section background (dark gray)
- `--color-text-primary` — body text (white/near-white)
- `--color-text-muted` — secondary text (light gray)
- `--font-family-display` — headings (system font stack, no external dependency)
- `--font-family-body` — body text (system font stack)

### 3. JSON content layer (no CMS, no database)

**Decision:** All updatable content lives in JSON files under `src/content/`. Components import these files at build time via standard ES module imports.

**Rationale:**
- Content volume is small and changes infrequently (schedule updated seasonally, about/info pages updated rarely).
- JSON files are version-controlled, diffable, and require zero infrastructure.
- Any developer or technically comfortable stakeholder can edit a JSON file and push to trigger a rebuild.
- If this becomes friction, a git-based CMS (Decap, Tina) can be layered on top without changing the site architecture. The JSON files become the CMS's storage format.

**Content files:**
- `site.json` — track name, contact info, social links, admission prices
- `schedule.json` — array of event objects (date, time, divisions, notes)
- `about.json` — ownership story, values, optional owner quote
- `info.json` — driver requirements, spectator policies, directions

### 4. Formspree for contact form (no backend)

**Decision:** The contact form POSTs directly to a Formspree endpoint. No server-side code.

**Rationale:**
- A contact form is the only runtime interaction on the site.
- Formspree handles spam filtering, email delivery, and GDPR compliance.
- Free tier supports the expected volume (a handful of submissions per week).
- If Formspree goes down, the rest of the site is unaffected.

### 5. No client-side JavaScript (with two exceptions)

**Decision:** Ship zero JS by default. Allow minimal inline scripts only for:
1. Mobile navigation toggle (hamburger menu open/close)
2. Contact form client-side validation (optional progressive enhancement)

**Rationale:**
- Every byte of JS is a byte that has to be parsed on a 2019 Android phone on cellular data at a racetrack parking lot. The audience profile demands performance over polish.
- Both exceptions are small inline scripts (< 20 lines each), not framework code.

### 6. No new npm dependencies beyond what is installed

**Decision:** The project uses `astro`, `tailwindcss`, and `@tailwindcss/vite`. No additional dependencies are planned or approved.

**Rationale:**
- Astro's built-in `<Image>` component handles image optimization (uses `sharp`, already a transitive dependency).
- Astro's built-in sitemap integration (`@astrojs/sitemap`) is the only addition under consideration, and only if manual `sitemap.xml` proves insufficient.
- "Nice to have" is not justification for a dependency.

## Consequences

- Content updates require editing JSON and pushing to the repo. Non-technical stakeholders will need a developer's help or a future CMS integration.
- No analytics are included in this build. Adding a tracking script is a separate decision.
- The placeholder track name "Thunder Ridge Speedway" appears in `site.json` and is trivially changeable.
- The dark palette is hardcoded in design tokens. A light mode is not planned and would require a separate design pass.

## Assumptions

- The track name "Thunder Ridge Speedway" is a placeholder. The real name will be substituted in `src/content/site.json` before launch.
- The site will be deployed to Netlify or Vercel. The build output is host-agnostic, but deployment config (redirects, headers) may vary.
- No Google Fonts. System font stack keeps the site fast and avoids GDPR/privacy concerns with third-party font loading.
