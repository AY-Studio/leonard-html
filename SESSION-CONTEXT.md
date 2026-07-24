# Session context — Leonard site (relume rebuild)

Snapshot for resuming work. **Read `CLAUDE.md` first** — it is the authoritative,
detailed record of every decision, trap, and pattern. This file is the quick
orientation on top of it.

## What this project is

The Leonard marketing site, built **Bootstrap 5.3.8 + Sass + Vite**,
Bootstrap-first (design system lives in Sass variables + the `$utilities` map,
not layered CSS). Multi-page static HTML with a custom `htmlPartials()` Vite
plugin resolving `<!-- #include partials/… -->`. Palette: dk-grey `#002529`
(page), yellow `#ffdb00`, lt-grey `#d8dfe5`, neutral-lightest `#eee`,
neutral-lighter `#ccc`. Fonts: Gilroy-Heavy (display, self-hosted) + Input Mono
/ Input Mono Narrow (Adobe kit). Font Awesome kit for icons.

Everything is sourced from the **leonard---relume** Figma
(`mPTA94teYC8ZLZw2VGmfMT`); the old `Leonard.fig` (clinker) is fully superseded.
Figma is read via the **desktop MCP server** (`figma-desktop`,
`http://127.0.0.1:3845/mcp`) — it reads whichever doc is open; asset URLs
(`localhost:3845/assets/…`) only serve while Figma is open, so images are
downloaded into `public/img/`.

## Commands

- `npm start` — Vite dev server (http://localhost:5173)
- `npm run build` — builds to `dist/` (currently green)

## Pages (all built, registered in `vite.config.js` → rollupOptions.input)

| File | What | Figma node |
| --- | --- | --- |
| `index.html` | Homepage | Home `10203:36188` |
| `products.html` | Products listing | `10203:36337` |
| `product.html` | Product detail (Axis) | `10203:36406` |
| `services.html` | Services listing | `10203:36389` |
| `service.html` | Service detail (Robotic Arm Demolition) | `10204:57140` |
| `industries.html` | Industries listing | `10204:120627` |
| `industry.html` | Industry detail (Cement & Lime) | `10204:121873` |
| `case-studies.html` | Case Studies listing | `10204:117483` |
| `case-study.html` | Case study article (BWSC Lisahally) | `10204:118064` |
| `news.html` | Latest News index (Bootstrap block grid) | `10204:123460` |
| `article.html` | News article + WYSIWYG `.leonard-prose` demo | `10204:124285` |
| `contact.html` | Contact | `10204:119280` |
| `about.html` | About (content from gleonard.com, our style) | not in Figma |
| `terms.html` | Terms & Conditions (`.leonard-prose` text) | not in Figma |
| `privacy.html` | Privacy Policy (`.leonard-prose` text) | not in Figma |
| `faqs.html` / `health-safety.html` / `certifications.html` / `partnerships.html` | Footer content pages | not in Figma |
| `404.html` | Not-found page | not in Figma |

**Detail-page variants** — one real page per listing item, named by slug, cloned
from the base template with only the identifying fields swapped (see CLAUDE.md
"Detail-page variants"): `product-{nano,descender,charger,calibre}.html`,
`service-{refractory-installation,confined-space,media-grading}.html`,
`industry-{aluminium,waste-to-energy,power-generation}.html`. Listing
"Discover"/"Find out more" buttons link to these; mega-menus deep-link to the
listing sections. **30 pages total.**

Shared: `partials/header.html` (desktop mega-menus + **mobile offcanvas menu**),
`partials/footer.html`. All cross-linked through the mega-menus and footer; every
detail page is one template populated with one real variant (the rest of the
nav/cards point at it as a placeholder).

## Recently completed (this session, newest last)

1. All the listing/detail templates above + the WYSIWYG prose system.
2. **Contact page** with a `.leonard-form--dark` variant (transparent inputs for
   forms on the dark page vs the white `$input-bg` used on light bands).
3. **Homepage hero → full-bleed, near-full-viewport**:
   `.leonard-hero-ratio--full` (in `scss/_custom.scss`). Section is `pt-4 pb-4`
   with **no container** (image full-width); copy wrapped in its own
   `container-xxl` to stay on grid. Height `calc(100svh - 150px)` at lg+ (thin
   green edge top+bottom), **`70svh` on mobile**.
4. **Mobile menu rebuilt** as a full-screen light **Offcanvas**
   (`.leonard-mobile-nav` / `#leonardMobileNav`) replacing the old collapse
   reflow. Products expands (Collapse accordion) to child pages. Offcanvas lives
   OUTSIDE `.leonard-header` (the header transforms on scroll and would trap a
   fixed panel). Added `offcanvas`+`close` SCSS, `Offcanvas` JS, `logo-dark.svg`.

## Open items / next steps (see CLAUDE.md "Next steps")

1. **Confirm copy typos** with client, then fix in `index.html`: `REFACTORY`
   (→ REFRACTORY), `ROBOTIC ARM SOLTUTIONS`, `FASTER DEPLYOMENT`, `proven to to
   be`. Several are reproduced verbatim across pages on purpose.
2. **Placeholders to confirm** (all faithful to Figma): lorem body copy on the
   case-study + article; "Projects in the kill zone" wording; duplicate
   Calibre/Refractory mega-menu cards; Dallas/Singapore office addresses on
   Contact; Power Generation's body copy (media-grading placeholder); the
   article/news cards cycle 3 placeholder templates.
3. **Build real variants** by duplicating the detail templates (only one of
   each is populated) + a **news article** page per post. Register each in
   `rollupOptions.input`.
4. **Build the remaining bits**: real Services mega-menu imagery (still old
   `service-1…6.webp`, 2 duplicate cards); wire "#" placeholder links
   (video, most CTAs).

## Verification workflow used

Screenshots + measurements via **CDP** against headless Chrome on port 9222
(scripts written to the session scratchpad, not committed). Emulate widths with
`Emulation.setDeviceMetricsOverride`; scroll with `behavior:'instant'`; force
`loading=lazy`→`eager` before full-page shots. The dev server + that Chrome were
just stopped; restart with `npm start` and relaunch Chrome with
`--remote-debugging-port=9222 --user-data-dir=<scratch>/cdp-profile` if needed.
Standing check: **zero page overflow at 320/390/768/992/1200/1400/1728/1920**.

## Key custom classes (all in `scss/_custom.scss`)

`.leonard-hero-ratio(+--full)`, `.leonard-scrim`, `.leonard-statement__title/__mark`,
`.leonard-corners(+--bleed)` (animated + ticks), `.leonard-marquee`,
`.leonard-reveal` (parallax), `.leonard-stack` (stacking features),
`.leonard-product`, `.leonard-quote`, `.leonard-media-round`, `.leonard-tag`,
`.leonard-case`, `.leonard-detail`, `.leonard-outcomes`, `.leonard-pages`,
`.leonard-prose` (WYSIWYG), `.leonard-form(+--dark)`, `.leonard-mobile-nav` +
`.leonard-mnav*` (mobile menu), `.leonard-footer(-reveal)`, custom cursor
(`.leonard-cursor`, JS in `main.js`).
