# Content Update Guide

This guide explains how to update the website content. All content lives in JSON files inside `src/content/`. After editing any file, push to the repository — the hosting platform rebuilds and deploys automatically.

---

## Updating the Race Schedule

Edit `src/content/schedule.json`. Each event looks like this:

```json
{
  "id": "2026-06-13-june-racing",
  "title": "June Racing Night",
  "date": "2026-06-13",
  "gateTime": "4:00 PM",
  "raceTime": "6:00 PM",
  "divisions": ["Sportsman Modified", "Street Stock", "4-Cylinder"],
  "featured": false,
  "notes": "Optional one-sentence note about the event"
}
```

### Field Rules
| Field | Required | Format | Notes |
|---|---|---|---|
| `id` | Yes | `YYYY-MM-DD-slug` | Must be unique. Use the date + a short descriptor. |
| `title` | Yes | String | The event's display name |
| `date` | Yes | `YYYY-MM-DD` | ISO date format |
| `gateTime` | Yes | `H:MM AM/PM` | When gates open |
| `raceTime` | Yes | `H:MM AM/PM` | When racing starts |
| `divisions` | Yes | Array of strings | At least one required |
| `featured` | No | `true` or `false` | Only one event should be featured at a time |
| `notes` | No | String | Keep to one sentence. Omit the field entirely if no note. |

### Adding an Event
1. Open `src/content/schedule.json`
2. Add a new entry to the array (maintain chronological order)
3. Ensure the `id` is unique
4. Save, commit, push

### Removing/Canceling an Event
- To cancel: remove the entry from the JSON array entirely
- Or add a note: `"notes": "CANCELLED — check back for rescheduling"`

---

## Updating Site Info (Track Name, Address, Contact)

Edit `src/content/site.json`. This file controls:
- Track name (appears in nav, footer, page titles)
- Address (footer, contact page)
- Phone and email
- Social media links
- Admission prices
- Formspree form endpoint
- Email signup URL

```json
{
  "trackName": "Thunder Ridge Speedway",
  "tagline": "A new chapter for local racing.",
  "address": "1200 Speedway Blvd, Millbrook, NY 12545",
  "phone": "(845) 555-0199",
  "email": "info@thunderridgespeedway.com",
  "socialLinks": {
    "facebook": "https://facebook.com/thunderridgespeedway",
    "instagram": "https://instagram.com/thunderridgespeedway"
  },
  "admissionGeneral": "$12",
  "admissionKids": "Free under 12",
  "pitPass": "$30",
  "formspreeEndpoint": "https://formspree.io/f/YOUR_FORM_ID",
  "emailSignupUrl": ""
}
```

**Leave `emailSignupUrl` empty** until an email provider (Mailchimp, Buttondown, etc.) is set up. The email signup section on the home page will be hidden automatically.

---

## Updating the About Page

Edit `src/content/about.json`. Fields:
- `headline` — the main H2 on the about page
- `subheadline` — supporting sentence shown on the home page teaser
- `story` — 2–3 paragraphs of about copy. Use `\n\n` between paragraphs.
- `ownerMessage` — a short quote attributed to management
- `values` — array of 4 value proposition objects:
  ```json
  { "icon": "🏁", "title": "Fair Competition", "description": "One sentence." }
  ```

---

## Updating Track Info (Drivers & Spectators)

Edit `src/content/info.json`. The structure is:

```json
{
  "drivers": {
    "headline": "Driver & Team Information",
    "intro": "Intro paragraph...",
    "sections": [
      {
        "title": "Registration & Check-In",
        "items": ["Item one", "Item two"]
      }
    ]
  },
  "spectators": {
    "headline": "Spectator Information",
    "intro": "Intro paragraph...",
    "sections": [...]
  }
}
```

---

## Setting Up Formspree (Contact Form)

1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form and copy the endpoint URL (looks like `https://formspree.io/f/abcdefgh`)
3. Paste it into `site.json` under `formspreeEndpoint`
4. Push the change — the contact form will now deliver submissions to your email

---

## Deployment

The site is deployed on Netlify/Vercel. Every push to the `main` branch triggers an automatic rebuild. Changes are live within ~1 minute after pushing.

To preview changes locally:
```bash
pnpm dev        # start local dev server at localhost:4321
pnpm build      # test the production build
pnpm preview    # preview the production build locally
```
