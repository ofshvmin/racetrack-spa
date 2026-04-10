# CLAUDE.md

## Project Overview
[Track Name] is a marketing and event-information website for an amateur stock car racetrack under new ownership. It is a static site built with Astro, Tailwind CSS, and a JSON content layer — not a web application.

## Tech Stack
- **Framework:** Astro (static output, zero client JS by default)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + shared design tokens in config
- **Content:** JSON data files in `src/content/` — schedule, track info, about copy
- **Contact form:** Formspree (or equivalent hosted endpoint)
- **Deployment:** Netlify or Vercel static hosting
- **Package manager:** pnpm

## Key Commands
```bash
pnpm dev          # Start Astro dev server
pnpm build        # Production build to dist/
pnpm preview      # Preview production build locally
pnpm lint         # ESLint
```

## Architecture
This is a static site. There is no backend, no database, no authentication, no client-side routing, and no SPA behavior. Astro renders every page to HTML at build time.

See `docs/architecture.md` for the full system overview.

### Directory Structure
```
src/
  content/            ← JSON data files (schedule, site copy, track info)
  layouts/            ← Astro layout templates (BaseLayout, etc.)
  pages/              ← Astro pages — one per route
  components/         ← Astro components (.astro) — reusable UI blocks
  styles/             ← Global CSS and Tailwind entry point
  assets/             ← Images, logos, fonts
public/               ← Static files served as-is (favicons, PDFs, robots.txt)
docs/                 ← Architecture doc, decisions
```

### Content Update Workflow
1. Edit the relevant JSON file in `src/content/`
2. Commit and push (or merge PR)
3. Hosting platform auto-rebuilds and deploys

No CMS, no admin panel, no database.

## Pages
| Route | File | Purpose |
|---|---|---|
| `/` | `pages/index.astro` | Hero, value props, upcoming events preview, new chapter teaser |
| `/schedule` | `pages/schedule.astro` | Full season calendar with event cards |
| `/about` | `pages/about.astro` | New ownership story, values, optional owner message |
| `/info` | `pages/info.astro` | Combined drivers and spectator info |
| `/contact` | `pages/contact.astro` | Contact form, address, map embed, socials |

## Coding Rules

### General
- Do not introduce client-side JavaScript unless a specific interaction demands it (mobile nav toggle, form validation). Default to zero JS.
- Do not add React, Vue, or any UI framework. Astro components handle everything.
- Do not add a backend, database, auth system, or API layer. If you think one is needed, stop and explain why before proceeding.

### Styling
- Tailwind utility classes for all styling. No inline styles, no CSS Modules.
- Design tokens (colors, fonts, spacing) defined in `tailwind.config.mjs` — no hardcoded hex values in templates.
- Dark base palette: charcoal/black backgrounds, white text, red accents.

### Content / Data
- All updatable content (schedule, about copy, track info) lives in JSON files under `src/content/`.
- Components read from these files at build time via standard imports.
- Never hardcode event dates, times, or division lists in page templates.

### Images
- Use Astro's `<Image>` component for optimization.
- Photos in `src/assets/` (processed at build) or `public/` (served as-is for large files).
- Every image must have descriptive alt text.

### SEO
- Every page sets a unique `<title>` and `<meta name="description">` via layout props.
- Proper heading hierarchy (one H1 per page).
- JSON-LD structured data for local business on the home page.
- `robots.txt` and `sitemap.xml` generated at build.

### Accessibility
- Semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<footer>`).
- ARIA only where native semantics fall short.
- All interactive elements keyboard-accessible.
- Color contrast meets WCAG 2.1 AA.

## What This Project Is Not
- Not a web application. No client-side state management.
- Not a MERN stack. No Express, no MongoDB, no Mongoose.
- Not an SPA. No client-side routing, no React, no TanStack Query, no Zustand.
- Not a CMS-backed site. Content lives in flat files.

If a task seems to require any of the above, re-read the requirements document and simplify.

## Agents
Delegate to specialists when needed. See `.claude/agents/` for definitions.

| Agent | When to invoke |
|---|---|
| `architect` | New pages, structural changes, dependency decisions |
| `frontend` | Component implementation, styling, accessibility, layout |
| `content` | Writing/editing site copy, schedule data, SEO text |
| `debugger` | Build failures, broken layouts, deployment issues |
