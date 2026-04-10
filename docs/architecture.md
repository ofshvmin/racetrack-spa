# Architecture

## System Overview
This is a static marketing website. Astro compiles `.astro` pages and components into plain HTML/CSS at build time. The output is a folder of static files deployed to a CDN. There is no server, no database, and no runtime JavaScript by default.

## Key Technical Decisions
- **Astro over Next.js:** The site has no client-side interactivity that justifies a React runtime. Astro ships zero JS by default, builds fast, and outputs plain HTML that any static host can serve. This keeps hosting costs near zero and eliminates an entire class of runtime bugs.
- **No backend:** Content volume (a schedule with ~20–40 entries per season, a few informational pages) does not justify a database or API. JSON files in the repo are the content layer.
- **No CMS for MVP:** The maintainer edits JSON files and pushes to trigger a rebuild. If this becomes friction, a lightweight CMS (Decap, Tina) can be layered on in Phase 2 without changing the site architecture.
- **Tailwind CSS:** Utility-first styling avoids naming conventions, keeps styles co-located with markup, and produces small CSS bundles via purging. Design tokens live in the Tailwind config.
- **Formspree for contact:** No server-side code needed. The form POSTs directly to a hosted endpoint that forwards to email.

## Data Flow

### Page Build (every page)
`src/content/*.json` → imported in `.astro` page → rendered to HTML at build time → static files in `dist/`

### Schedule Display
`src/content/schedule.json` → `pages/schedule.astro` imports the array → maps over entries → renders event cards → static HTML

### Contact Form (only runtime interaction)
User fills form → browser POSTs to Formspree endpoint → Formspree forwards to designated email → user sees thank-you message (client-side redirect or inline confirmation)

## Directory Responsibilities
| Directory | Purpose |
|---|---|
| `src/pages/` | One `.astro` file per route — the site's URL structure |
| `src/layouts/` | Shared page shells (BaseLayout with `<head>`, nav, footer) |
| `src/components/` | Reusable UI blocks (EventCard, Hero, ValueProps, etc.) |
| `src/content/` | JSON data files — the only files edited for content updates |
| `src/assets/` | Images and fonts processed by Astro's build pipeline |
| `src/styles/` | Global CSS entry point, Tailwind directives |
| `public/` | Static files served as-is (favicons, downloadable PDFs, robots.txt) |
| `docs/` | This file, ADRs |

## Content Schema

### schedule.json
```json
[
  {
    "id": "2026-05-17-opening-night",
    "title": "Opening Night",
    "date": "2026-05-17",
    "gateTime": "4:00 PM",
    "raceTime": "6:00 PM",
    "divisions": ["Sportsman Modified", "Street Stock", "4-Cylinder"],
    "featured": true,
    "notes": "Season opener — first 100 fans receive a free t-shirt"
  }
]
```

### site.json
```json
{
  "trackName": "[Track Name]",
  "tagline": "A new chapter for local racing.",
  "address": "[Full Address]",
  "phone": "[Phone]",
  "email": "[Email]",
  "socialLinks": {
    "facebook": "",
    "instagram": ""
  },
  "admissionGeneral": "$12",
  "admissionKids": "Free under 10",
  "pitPass": "$30"
}
```

## External Dependencies
| Service | Purpose | Failure behavior |
|---|---|---|
| Formspree | Contact form delivery | Form shows error; rest of site unaffected |
| Google Maps embed | Map on contact page | Map iframe shows fallback; address text still visible |
| Static host (Netlify/Vercel) | Serves built files | Site down entirely (CDN-level, rare) |

## What's Not Needed
- Server-side rendering
- Client-side routing
- State management
- Authentication
- Database
- API layer
- Server Actions
- WebSocket connections
- Session management

If you find yourself reaching for any of these, stop and reconsider.
