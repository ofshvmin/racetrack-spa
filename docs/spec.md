# Implementation Spec — Thunder Ridge Speedway

**Date:** 2026-04-10
**Companion ADR:** `docs/decisions/2026-04-10-initial-build.md`
**Assumption:** Track name "Thunder Ridge Speedway" is a placeholder stored in `site.json`.

---

## 1. File Plan

Every file to create or modify, with its purpose.

### Configuration

| File | Action | Purpose |
|---|---|---|
| `astro.config.mjs` | Modify | Add `@tailwindcss/vite` plugin, set `site` URL, configure `output: 'static'` |
| `tsconfig.json` | No change | Already extends `astro/tsconfigs/strict` |
| `package.json` | No change | Dependencies already installed |

### Styles

| File | Action | Purpose |
|---|---|---|
| `src/styles/global.css` | Create | Tailwind v4 entry point with `@import "tailwindcss"`, `@theme` design tokens, base resets |

### Content (JSON data files)

| File | Action | Purpose |
|---|---|---|
| `src/content/site.json` | Create | Global site data: track name, tagline, contact info, social links, admission prices |
| `src/content/schedule.json` | Create | Array of event objects for the season calendar |
| `src/content/about.json` | Create | Ownership story, values list, optional owner quote |
| `src/content/info.json` | Create | Driver requirements, spectator policies, facility details, directions |

### Layouts

| File | Action | Purpose |
|---|---|---|
| `src/layouts/BaseLayout.astro` | Create | Shared HTML shell: `<head>`, meta tags, nav, footer, slot for page content |

### Components

| File | Action | Purpose |
|---|---|---|
| `src/components/Nav.astro` | Create | Site navigation with mobile hamburger toggle |
| `src/components/Footer.astro` | Create | Site footer with contact info, social links, copyright |
| `src/components/Hero.astro` | Create | Full-width hero banner with heading, tagline, CTA button |
| `src/components/EventCard.astro` | Create | Single event display card (used in schedule list and homepage preview) |
| `src/components/ScheduleList.astro` | Create | Renders an array of events as a list of EventCard components |
| `src/components/ValueProps.astro` | Create | Grid of value proposition items (icon placeholder + heading + description) |

### Pages

| File | Action | Purpose |
|---|---|---|
| `src/pages/index.astro` | Modify | Home page: Hero, ValueProps, upcoming events preview, new chapter teaser |
| `src/pages/schedule.astro` | Create | Full season calendar using ScheduleList |
| `src/pages/about.astro` | Create | Ownership story, values, optional owner quote |
| `src/pages/info.astro` | Create | Combined drivers and spectator information |
| `src/pages/contact.astro` | Create | Contact form (Formspree), address, map embed, social links |

### Public / Static

| File | Action | Purpose |
|---|---|---|
| `public/robots.txt` | Create | Allow all crawlers, reference sitemap |

### Documentation

| File | Action | Purpose |
|---|---|---|
| `CONTENT_GUIDE.md` | Create | Instructions for non-developers on editing JSON content files |

---

## 2. Configuration Details

### astro.config.mjs

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://thunderridgespeedway.com', // placeholder — update before launch
  vite: {
    plugins: [tailwindcss()],
  },
});
```

No other Astro integrations. The `output` defaults to `'static'` in Astro, so it does not need to be set explicitly.

---

## 3. Design Tokens

Defined in `src/styles/global.css` using Tailwind v4's `@theme` directive. These become CSS custom properties AND generate Tailwind utility classes automatically.

```css
@import "tailwindcss";

@theme {
  --color-brand-red: #dc2626;
  --color-surface-dark: #111111;
  --color-surface-mid: #1e1e1e;
  --color-text-primary: #f5f5f5;
  --color-text-muted: #9ca3af;

  --font-family-display: "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif";
  --font-family-body: "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif";
}
```

**Usage in components:** `class="bg-surface-dark text-text-primary"` — Tailwind v4 generates utilities from `@theme` custom properties automatically.

**Base styles** (also in `global.css`, after the `@theme` block):

```css
@layer base {
  body {
    @apply bg-surface-dark text-text-primary font-body antialiased;
  }

  h1, h2, h3, h4 {
    @apply font-display;
  }
}
```

---

## 4. Content Schemas

### src/content/site.json

```json
{
  "trackName": "Thunder Ridge Speedway",
  "tagline": "A new chapter for local racing.",
  "seoDescription": "Thunder Ridge Speedway — amateur stock car racing in [Region]. Weekly events, family-friendly atmosphere, affordable admission.",
  "address": {
    "street": "1234 Speedway Drive",
    "city": "Ridgeville",
    "state": "PA",
    "zip": "17000"
  },
  "phone": "(555) 123-4567",
  "email": "info@thunderridgespeedway.com",
  "socialLinks": {
    "facebook": "https://facebook.com/thunderridgespeedway",
    "instagram": "https://instagram.com/thunderridgespeedway"
  },
  "admission": {
    "general": "$12",
    "kids": "Free under 10",
    "seniors": "$8",
    "pitPass": "$30"
  },
  "formspreeEndpoint": "https://formspree.io/f/PLACEHOLDER"
}
```

**Notes:** `formspreeEndpoint` is consumed only by the contact page. All address fields are strings — no structured geocoding.

### src/content/schedule.json

```json
{
  "season": "2026",
  "events": [
    {
      "id": "2026-05-17-opening-night",
      "title": "Opening Night",
      "date": "2026-05-17",
      "gateTime": "4:00 PM",
      "raceTime": "6:00 PM",
      "divisions": ["Sportsman Modified", "Street Stock", "4-Cylinder"],
      "featured": true,
      "cancelled": false,
      "notes": "Season opener — first 100 fans receive a free t-shirt"
    }
  ]
}
```

**Field contract:**
- `id` (string): URL-safe slug, used as list key. Convention: `YYYY-MM-DD-short-name`.
- `date` (string): ISO 8601 date. Components parse and format this for display.
- `gateTime`, `raceTime` (string): Human-readable times. Not parsed — displayed as-is.
- `divisions` (string[]): List of racing divisions for the event.
- `featured` (boolean): If true, event appears in homepage preview section.
- `cancelled` (boolean): If true, event renders with cancelled styling/badge.
- `notes` (string): Optional. Free-text shown below the event details.

### src/content/about.json

```json
{
  "headline": "A New Chapter",
  "story": [
    "Thunder Ridge Speedway has been a cornerstone of local motorsport for over three decades.",
    "Under new ownership, we're committed to preserving the traditions that made this track special while investing in the facilities, safety, and fan experience that will carry it forward."
  ],
  "values": [
    {
      "heading": "Safety First",
      "description": "Modern safety equipment, trained officials, and strict tech inspection for every event."
    },
    {
      "heading": "Family Friendly",
      "description": "Affordable admission, a welcoming atmosphere, and entertainment for all ages."
    },
    {
      "heading": "Driver Development",
      "description": "Programs and divisions designed to grow the next generation of racers."
    }
  ],
  "ownerQuote": {
    "text": "This track gave me my start. Now it's our turn to give back.",
    "attribution": "— [Owner Name], Owner"
  }
}
```

**Field contract:**
- `story` (string[]): Array of paragraphs. Rendered as sequential `<p>` elements.
- `values` (object[]): Rendered as a grid of cards on the about page.
- `ownerQuote` (object|null): If null or omitted, the quote section is not rendered.

### src/content/info.json

```json
{
  "spectators": {
    "headline": "Spectator Information",
    "items": [
      {
        "heading": "Gates & Timing",
        "content": "Gates open two hours before green flag. Races typically run 3-4 hours."
      },
      {
        "heading": "What to Bring",
        "content": "Ear protection recommended. Coolers permitted (no glass). Blankets and lawn chairs welcome."
      },
      {
        "heading": "Parking",
        "content": "Free parking adjacent to the grandstands. Overflow lot available for special events."
      }
    ]
  },
  "drivers": {
    "headline": "Driver & Pit Information",
    "items": [
      {
        "heading": "Registration",
        "content": "All drivers must register and pass tech inspection before each event. Pit gates open three hours before race time."
      },
      {
        "heading": "Safety Requirements",
        "content": "Full fire suit, SA-rated helmet, neck restraint, and five-point harness required. Full rulebook available for download."
      },
      {
        "heading": "Divisions",
        "content": "Sportsman Modified, Street Stock, 4-Cylinder. See the schedule for division-specific events."
      }
    ]
  },
  "directions": {
    "headline": "Getting Here",
    "content": "Located 15 minutes north of [City] on Route 123. Look for the speedway entrance on the left past mile marker 45.",
    "mapEmbedUrl": "https://www.google.com/maps/embed?pb=PLACEHOLDER"
  }
}
```

**Field contract:**
- `spectators.items` and `drivers.items` share the same shape: `{ heading: string, content: string }`. Rendered identically.
- `directions.mapEmbedUrl` (string): Full Google Maps embed URL. Rendered in an `<iframe>`. If empty string, iframe is not rendered.

---

## 5. Component Interfaces

### BaseLayout.astro

```typescript
interface Props {
  title: string;           // Page <title> — prepended to " | Thunder Ridge Speedway"
  description: string;     // <meta name="description">
}
```

**Slot:** Default slot receives page content, rendered inside `<main>`.

**Responsibilities:**
- Renders `<html>`, `<head>` (charset, viewport, title, description, favicon links, global.css import), `<body>`
- Includes `<Nav />` before `<main>` and `<Footer />` after
- Imports `site.json` for track name (used in title suffix and passed to Nav/Footer)
- Sets `lang="en"` on `<html>`
- Adds JSON-LD structured data for LocalBusiness on home page only (controlled via optional `isHome` prop or a conditional in index.astro)

**Additional optional prop:**

```typescript
  isHome?: boolean;       // If true, renders JSON-LD LocalBusiness schema
```

### Nav.astro

```typescript
interface Props {
  trackName: string;      // Displayed as logo text / home link
}
```

**Behavior:**
- Renders `<nav>` with track name as home link, plus links to /schedule, /about, /info, /contact
- Desktop: horizontal link bar
- Mobile: hamburger button that toggles a vertical menu via a minimal inline `<script>` (toggle a class, no framework)
- Highlights current page link using `Astro.url.pathname`

### Footer.astro

```typescript
interface Props {
  trackName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email: string;
  socialLinks: {
    facebook: string;
    instagram: string;
  };
}
```

**Behavior:**
- Renders `<footer>` with contact info, social links (as icon-style text links or SVG icons), and copyright line with dynamic year
- Social links only render if the URL string is non-empty

### Hero.astro

```typescript
interface Props {
  headline: string;       // H1 text
  tagline: string;        // Subheading text below H1
  ctaText: string;        // Button label
  ctaHref: string;        // Button link target (e.g., "/schedule")
}
```

**Behavior:**
- Full-width section with dark background (optionally a background image via CSS)
- Centered text content with the H1, tagline paragraph, and a CTA button link
- The CTA is an `<a>` styled as a button, not a `<button>` element (it navigates)

### EventCard.astro

```typescript
interface Props {
  id: string;
  title: string;
  date: string;           // ISO date string — component formats for display
  gateTime: string;
  raceTime: string;
  divisions: string[];
  featured: boolean;
  cancelled: boolean;
  notes?: string;
}
```

**Behavior:**
- Renders a card (`<article>`) with formatted date, title, times, division list, and optional notes
- If `cancelled` is true: displays a "CANCELLED" badge and applies muted/strikethrough styling
- If `featured` is true: applies a subtle accent border or highlight (visual only, no behavioral difference)
- Date formatting: parse the ISO string and display as "Saturday, May 17" (use `Date` object and `toLocaleDateString` — no dependency needed)

### ScheduleList.astro

```typescript
interface Props {
  events: Array<{
    id: string;
    title: string;
    date: string;
    gateTime: string;
    raceTime: string;
    divisions: string[];
    featured: boolean;
    cancelled: boolean;
    notes?: string;
  }>;
  limit?: number;          // If set, only render the first N events (for homepage preview)
  showPastEvents?: boolean; // If false (default), filter out events before today's date
}
```

**Behavior:**
- Filters events by date (unless `showPastEvents` is true)
- Sorts events chronologically (ascending)
- Slices to `limit` if provided
- Maps over filtered array and renders an `<EventCard>` for each
- If no events remain after filtering, renders an "No upcoming events" message

### ValueProps.astro

```typescript
interface Props {
  items: Array<{
    heading: string;
    description: string;
  }>;
}
```

**Behavior:**
- Renders a responsive grid (1 column mobile, 3 columns desktop) of value proposition cards
- Each card has a heading and description paragraph
- No icons in MVP — heading text carries the meaning. Icon slots can be added later.

---

## 6. Page Specifications

### index.astro (Home)

**Route:** `/`
**Title:** `"Thunder Ridge Speedway — A New Chapter for Local Racing"`
**Description:** From `site.json` `seoDescription` field

**Imports:** `site.json`, `schedule.json`, `about.json`

**Sections (top to bottom):**
1. `<Hero>` — headline from `site.tagline`, CTA pointing to `/schedule`
2. `<ValueProps>` — items from `about.json` `values` array
3. `<ScheduleList>` — upcoming featured events, `limit={3}`, `showPastEvents={false}`
4. "New Chapter" teaser — short text from `about.json` `story[0]` with a link to `/about`

**JSON-LD:** LocalBusiness structured data block in a `<script type="application/ld+json">` tag, populated from `site.json`.

### schedule.astro

**Route:** `/schedule`
**Title:** `"Schedule"`
**Description:** `"Full 2026 season schedule for Thunder Ridge Speedway."`

**Imports:** `schedule.json`

**Sections:**
1. Page heading (H1): "2026 Season Schedule" (year from `schedule.json` `season` field)
2. `<ScheduleList>` — all events, `showPastEvents={true}` (show the full season)

### about.astro

**Route:** `/about`
**Title:** `"About"`
**Description:** `"Learn about Thunder Ridge Speedway's new ownership and vision."`

**Imports:** `about.json`

**Sections:**
1. Page heading (H1): from `about.json` `headline`
2. Story paragraphs: iterate `about.json` `story` array, render as `<p>` elements
3. Values grid: `<ValueProps>` with `about.json` `values`
4. Owner quote (conditional): if `about.json` `ownerQuote` is present, render a `<blockquote>`

### info.astro

**Route:** `/info`
**Title:** `"Info"`
**Description:** `"Everything you need to know — spectator guide, driver requirements, and directions."`

**Imports:** `info.json`

**Sections:**
1. Page heading (H1): "Track Information"
2. Spectator section: H2 from `info.json` `spectators.headline`, then a list of items rendered as H3 + paragraph pairs
3. Driver section: H2 from `info.json` `drivers.headline`, same item rendering
4. Directions section: H2 from `info.json` `directions.headline`, paragraph from `content`, Google Maps `<iframe>` from `mapEmbedUrl` (conditionally rendered)

### contact.astro

**Route:** `/contact`
**Title:** `"Contact"`
**Description:** `"Get in touch with Thunder Ridge Speedway."`

**Imports:** `site.json`

**Sections:**
1. Page heading (H1): "Contact Us"
2. Contact form: `<form>` with `action` set to `site.json` `formspreeEndpoint`, `method="POST"`
   - Fields: Name (text, required), Email (email, required), Message (textarea, required)
   - Submit button styled with `bg-brand-red`
   - No client-side validation beyond HTML5 `required` attributes in MVP
3. Contact details: address, phone, email from `site.json` (rendered alongside or below the form)
4. Map embed: `<iframe>` with Google Maps embed URL from `info.json` `directions.mapEmbedUrl`

**Note:** The contact page imports both `site.json` (for form endpoint and contact details) and `info.json` (for map embed URL). This is a minor cross-concern but avoids duplicating the map URL.

---

## 7. Data Flow

```
src/content/site.json ──────┬──> BaseLayout.astro (track name in <title>, passed to Nav + Footer)
                             ├──> index.astro (hero tagline, JSON-LD)
                             └──> contact.astro (form endpoint, contact details)

src/content/schedule.json ──┬──> index.astro (featured events preview via ScheduleList)
                             └──> schedule.astro (full calendar via ScheduleList)

src/content/about.json ─────┬──> index.astro (values for ValueProps, story teaser)
                             └──> about.astro (full story, values, owner quote)

src/content/info.json ──────┬──> info.astro (spectator/driver items, directions)
                             └──> contact.astro (map embed URL)
```

All imports are static ES module imports resolved at build time. No runtime fetching. Example:

```typescript
// In any .astro file's frontmatter:
import site from '../content/site.json';
import schedule from '../content/schedule.json';
```

Astro compiles this to HTML. The JSON files are not shipped to the client.

---

## 8. public/robots.txt

```
User-agent: *
Allow: /

Sitemap: https://thunderridgespeedway.com/sitemap-index.xml
```

**Note:** The sitemap URL assumes Astro's `@astrojs/sitemap` integration is added, or a manual `sitemap.xml` is placed in `public/`. If neither is done before launch, remove the Sitemap line. The `@astrojs/sitemap` integration is the one dependency worth adding — it auto-generates the sitemap from the page routes and requires zero configuration beyond the `site` field in `astro.config.mjs`. Decision on whether to add it is deferred to implementation time; the robots.txt should be updated accordingly.

---

## 9. CONTENT_GUIDE.md

A standalone file at the project root explaining:
- What each JSON file controls
- How to edit schedule entries (add, remove, mark cancelled)
- How to update about page copy
- How to update info page content
- What triggers a site rebuild (push to main branch)
- What NOT to edit (component files, config files)
- Example: adding a new event to `schedule.json`

This is a non-technical document aimed at someone who can edit a text file but is not a developer.

---

## 10. Risks and Open Items

| Risk | Severity | Mitigation |
|---|---|---|
| Track name is a placeholder | Low | Single field in `site.json` — change before launch |
| Formspree endpoint is a placeholder | Blocks launch | Must create Formspree account and replace `PLACEHOLDER` in `site.json` |
| Google Maps embed URL is a placeholder | Blocks launch | Must generate embed URL from actual track address |
| No image assets exist yet | Blocks polish | Hero can use a CSS gradient background initially; photos added when available |
| No favicon exists | Low | Astro scaffold includes default; replace before launch |
| No analytics | Acceptable for MVP | Can be added as a `<script>` in BaseLayout later |
| `@astrojs/sitemap` not yet installed | Low | Manual sitemap or add the integration at implementation time |
| System font stack may look generic | Cosmetic | Acceptable for MVP. A display font (e.g., from Google Fonts) can be added later if the owner wants a more branded look, but it adds a third-party request and ~50-100KB |

---

## 11. What Is NOT In Scope

- Image gallery or media page
- Online ticket sales
- Driver registration portal
- Results/standings database
- Blog or news section
- Dark/light mode toggle
- Internationalization
- Analytics integration
- Newsletter signup (can be added to Footer later as a Mailchimp/etc. embed)

These are all Phase 2 candidates. None require architectural changes to implement later.
