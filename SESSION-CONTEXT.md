# Leonard site — new-session start-here

**Read this first for orientation, then `CLAUDE.md` for the authoritative,
per-component detail.** This file is the fast mental model + an index into the
other docs. Keep it current when the architecture shifts.

Doc map:
- **`CLAUDE.md`** — the detailed record of every component, decision, trap and
  pattern (auto-loaded each session). The source of truth.
- **`CMS.md`** — the Statamic migration guide (page types, block library,
  per-component field maps).
- **`README.md`** — launch scope (which pages ship at launch; how disabling works).
- **This file** — orientation, principles, tooling, current state, doc index.

---

## 1. What this is

The **Leonard** marketing website — an industrial brand (refractory installation
+ robotic demolition). A **static multi-page site**: **Bootstrap 5.3.8 + Sass +
Vite**, hand-authored HTML, **destined for Statamic CMS** (see §7). Deployed to
Netlify (`leonardglobal.netlify.app`).

- **Bootstrap-first** on purpose: the design system lives in **Sass variables +
  the `$utilities` map**, not layered CSS. Reach for a variable override or a
  `$utilities` entry before writing anything in `_custom.scss`.
- Sourced from the **leonard---relume** Figma (`mPTA94teYC8ZLZw2VGmfMT`); the old
  `Leonard.fig` (clinker) is superseded. Figma is read via the **desktop MCP
  server** (`figma-desktop`, `http://127.0.0.1:3845/mcp`) — it reads whatever doc
  is open; asset URLs only serve while Figma is open, so images are downloaded
  into `public/img/`.

## 2. Run & verify

```
npm start          # Vite dev server (http://localhost:5173)
npm run build      # -> dist/ (keep green)
```

- **`?noanim` test switch** — add `?noanim` to any URL (or set
  `localStorage['leonard-noanim']='1'`) to strip every load/scroll animation
  (intro, page-transition, title scramble, AOS reveal, count-up, parallax, hero
  video) and render the **final state** immediately. Essential for clean
  screenshots. Gate is at the top of `init()` in `js/main.js` (`const NO_ANIM`).
- **Verification is by headless-Chrome screenshot + Python/PIL measurement**
  (`/Applications/Google Chrome.app/.../Google Chrome --headless --screenshot=...
  --window-size=W,H --hide-scrollbars <url>?noanim`). No ffmpeg locally.
  - **Typekit fonts don't load offline in headless** → it falls back to a wider
    mono, so the **navbar can *look* like it wraps below ~1500px in headless
    while fitting fine in a real browser** (same class of artifact as the
    documented "nav fits exactly at 1200"). Don't chase headless-only wraps.
  - Reduced-motion / `?noanim` shows posters & final states; use them.
  - Overflow check is **per-element** (`scrollWidth > clientWidth` AND
    `overflow-x: visible`, skipping clipping ancestors) — comparing rects to the
    viewport gives false positives on the marquee/watermark.

## 3. Stack & external libraries

| Lib | Version | Role |
| --- | --- | --- |
| **Bootstrap** | 5.3.8 | design system (Sass vars + utilities), grid, components |
| **Sass** | 1.93 | compiles `scss/` |
| **Vite** | 7.1 | build + dev; custom `htmlPartials()` plugin resolves `<!-- #include -->` |
| **GSAP** | 3.15 | `ScrollTrigger` (feature-stack pin), `ScrambleTextPlugin` (title decode), count-up, parallax |
| **Lenis** | 1.3 | smooth scroll (smooths *native* scroll, so sticky/`view-timeline`/fixed all still work) |
| **AOS** | 2.3 | opacity-only scroll reveals; `initReveal()` auto-tags rows |
| **GLightbox** | 3.3 | click-to-play video/image lightbox (News cards) |
| **Font Awesome** | Pro 7.3.1 kit, **CSS/webfont mode** | icons (script in each `<head>`) |
| **Adobe Typekit** | `input-mono` / `input-mono-narrow` | body/nav/button type (`<link>` in each `<head>`) |
| **Gilroy-Heavy** | self-hosted woff2 | display type (`.font-display`, `.display-*`) |

All JS animation is in **`js/main.js`**, gated on `prefers-reduced-motion` **and**
the `NO_ANIM` switch. Init functions: `initSmoothScroll, initPageTransition,
initIntro, initCountUp, initCornerDraw, initReveal, initFeatureSteps,
initParallax, initScramble, initHeroVideo` (animation — skipped under NO_ANIM) +
`initStickyNav, initCursor, initLightbox, initVideoHero, initButtonFx` (always on).

## 4. Repo map

```
index.html, products.html, product.html, services.html, service.html,
industries.html, industry.html, case-studies.html, case-study.html, news.html,
article.html, contact.html, about.html, terms.html, privacy.html, 404.html,
faqs/health-safety/certifications/partnerships.html
  + detail-page slug variants: product-{nano,descender,charger,calibre}.html,
    service-{refractory-installation,confined-space,media-grading}.html,
    industry-{aluminium,waste-to-energy,power-generation}.html
  + search-results.html, careers.html         (~33 registered in vite.config.js)

partials/   header.html (nav + 4 mega-menus + mobile offcanvas), footer.html,
            stats.html, testimonials.html, newsletter.html, cta.html
            ← shared, pulled in via `<!-- #include partials/x.html -->`
scss/       styles.scss (import order), _tokens.scss (design system),
            _utilities-custom.scss ($utilities additions), _fonts.scss,
            _custom.scss (only what Bootstrap can't express),
            _nav-engineered.scss (isolated nav treatment — see §9)
js/main.js  imports styles.scss + Bootstrap JS + the libs above
public/     img/, fonts/, favicons
vite.config.js  htmlPartials() plugin + rollupOptions.input (register every page)
```

**Every new page must be registered** in `build.rollupOptions.input` or Vite
won't emit it. Partials need no registration (resolved at build).

## 5. SCSS structure & the Bootstrap-first rules

`scss/styles.scss` import order (Bootstrap's "include parts" pattern):
functions → **`_tokens`** (var overrides) → required BS → `utilities` →
**`_utilities-custom`** (extends `$utilities` map) → optional BS components →
`utilities/api` → `_fonts` → **`_custom`** → **`_nav-engineered`** (last, so it
overrides the plain nav in `_custom`).

- **Type scale** = `$display-font-sizes` → `.display-1…6` + named
  `.display-h1/-h2/-h3` (96/72/48), `.display-stat` (200), `.display-wordmark`
  (300). RFS makes them fluid (`$rfs-breakpoint: 1728px` = the Figma canvas). No
  `clamp()` maths except where noted (product names).
- **Spacing** `$spacers` extended 6/7/8/9 = 64/96/160/224px → `py-7`, `px-lg-8`.
  Named `section` spacer (2.5rem/40px) → `pt-section`/`mt-section`.
- **Colours** — see palette below; mapped onto BS theme colours so `.bg-primary`,
  `.text-dark`, `.btn-outline-dark` speak the brand.
- **Utilities carry `!important`** (`$enable-important-utilities`). Reach for a
  utility only when it must beat something; a heading that needs a colour gets it
  from a component rule, not a utility.
- Custom utilities in `_utilities-custom.scss`: `.lh-tight/.lh-flat`, `.ls-wide`,
  `.minw-*/.minh-*` (37/54/78px), `.mw-hl/-stmt/-body/-body-lg` (`ch` measures —
  put on the text element, not a wrapper), `.bg-neutral`(#eee)/`.bg-neutral-lighter`(#ccc)/`.bg-dark-deep`.

### Palette (`_tokens.scss`, exact)

| Var | Hex | Figma | BS map |
| --- | --- | --- | --- |
| `$leonard-dk-grey` | `#253746` | Clinker | `$dark`, `$body-bg` (**page bg**) |
| `$leonard-yellow` | `#ffdd00` | Flame | `$primary` (**the action colour**) |
| `$leonard-grey` | `#768592` | Brick | `$secondary` |
| `$leonard-lt-grey` | `#d8dfe2` | Zinc | `$light` |
| `$leonard-neutral-lightest` | `#eee` | — | `.bg-neutral` |
| `$leonard-neutral-lighter` | `#ccc` | — | `.bg-neutral-lighter` |
| `$leonard-dk-grey-deep` | `shade-color($dk-grey,35%)` | — (derived) | `.bg-dark-deep` |

### Boxed vs full-bleed pattern (recurring)

A yellow/light band is **boxed** (inset panel, page-green around it) vs
**full-bleed** (edge-to-edge) purely by *which element carries `container-xxl` vs
`bg-*`*:
- **Boxed:** `<section class="container-xxl …"><div class="bg-primary p-4">…</div></section>`
- **Full-bleed:** `<section class="bg-primary …"><div class="container-xxl py-7">…</div></section>`

`$container-max-widths` xxl = **1729px**, so below that a `container-xxl` is
100%-width minus a **22px gutter** → boxed inset is ~22px (≈ Figma's 24px);
margins widen past 1729. Homepage stats, products stats, and the "One solution"
band are boxed; case-studies/services/industries stats are full-bleed.

### Style traps (full list in CLAUDE.md "Traps already hit")

- **Gutter trap:** a `.row`'s negative margin is `$grid-gutter-width/2` = 22px;
  the parent needs ≥ that padding or the page overflows. `p-4` (24px) is the safe
  minimum around a row; avoid `g-5/gx-5` on tight parents.
- **Heading colour:** `h1–h6` get `--bs-heading-color` which beats an inherited
  band colour → set colour explicitly on headings on light bands.
- **`.text-secondary` is the fixed brand grey `#768592`**, *not* theme-aware —
  illegible on the dark page. Use **`.text-body-secondary`** for muted text on
  dark bands.
- Trimming Bootstrap imports silently breaks components (e.g. dropdown needs its
  partial for `display:none`).

## 6. Naming & structure conventions

- **`.leonard-*`** prefixes every custom class/component.
- **Page-builder markers** (for the CMS migration): top-level blocks carry an
  HTML comment `<!-- ▐ BLOCK: <name> -->` **and** `data-block="<slug>"` on the
  section. Present on index/services/industries/about/careers; other pages not
  yet marked (e.g. news has none — don't add just one).
- **Shared markup = a partial** in `partials/`, pulled with
  `<!-- #include partials/x.html -->`. If content is duplicated across pages with
  the same info, it should be a partial (e.g. `stats.html` is the title + 4
  count-up stats, included inside each page's own boxed/full-bleed wrapper).
- **Launch-scoping:** everything is built but the initial launch exposes a subset
  (see `README.md`). Disabled links/blocks are wrapped in HTML comments prefixed
  **`LAUNCH:`**; disabled pages are commented out of `rollupOptions.input` under a
  `LAUNCH SCOPE` note; mega-menus are stubbed to direct links with the panel kept
  in an inert `<template class="launch-disabled">`. `grep -rn "LAUNCH:"` surfaces
  everything.

## 7. Statamic CMS — the goal

The site will be rebuilt in **Statamic**. Content model (see **`CMS.md`** for the
full block library + per-component field maps):

- **Fixed single-template pages** for *products, product detail, contact, news
  index, news article* — the content team fills fields, structure is fixed.
- **Page-builder pages** (Replicator/"ACF flexible content") for general pages —
  a library of the site's components the editor stacks in any order.
- **A simple-text template** for legal-type pages (Terms, Privacy).
- **A hero is mandatory and only ever first** — the one rule to enforce.
- **Components with more than one visual style vary by a toggle class**, not a
  fork (e.g. boxed vs full-bleed = a class the CMS toggles; alternating
  photo/copy rows via `order-lg-*`). Document the variant classes in the readme.
- **WYSIWYG-friendly markup:** prose is a single `.leonard-prose` column that
  styles **raw, class-less HTML** (what a WordPress/Statamic editor emits) — wrap
  text regions in a `div` with the class, don't hang classes on every `<p>`.
- The exact demo content is **the client's real copy under review — do NOT swap
  to dummy content** when refactoring.

## 8. Design taste & working style (learned from the client)

- **Restraint over decoration.** Rejected on the navbar: a `mix-blend-mode:
  difference` reactive accent, a brushed-steel gradient ("cheap"), and
  corner-tick "engineered detailing". Presence should come from structure, type,
  and precision — not texture/chrome.
- **Yellow (`#ffdd00`) is the *action* colour** — CTA, logo, interactive
  hover/focus. Don't spend it on non-interactive ornament (it competes with the
  real call-to-action). "Best UX" tie-breaks that way.
- **Mock and show, don't describe.** For any visual change, render it (headless
  screenshot / a quick isolated temp page) and let the client decide on sight.
- **Don't break existing CSS**; prefer Bootstrap utilities/vars; keep experiments
  isolated & revertible; preserve the client's exact copy.
- Report outcomes honestly (if a screenshot shows a wrap, say whether it's real
  vs a headless-font artifact).

## 9. Current state & active experiments (newest first)

- **Navbar treatment is an isolated experiment** in `scss/_nav-engineered.scss`
  (imported after `_custom` so it overrides the plain bar). It is currently just
  a **darker fill `#212f3c` + a subtle top/bottom hairline** (so the bar stays
  delineated over same-colour sections). An "engineered detailing" pass (corner
  "+" ticks + zone dividers + extra padding) was built then **removed at the
  client's request** — the file's header has the history + revert steps
  (`grep "NAV TEST"` / delete the `@import`). Logo/button are back to plain `px-3`.
- **Homepage hero is a background video** — a client CDN mp4
  (`leonard-homepage-loop.mp4`) that **bleeds up under the navbar** (no top
  green strip; `.leonard-hero-bleed` pulls the section up 102px). `poster` =
  frame 1 (`/img/hero-poster.jpg`, grabbed with headless Chrome). Plays only when
  motion is welcome (`initHeroVideo`, `preload="none"`); poster otherwise. The
  "Watch full video" button is **commented out** (client asked to hide).
- **`.leonard-hero-ratio--full` is shared by 6 heroes** (home / products /
  services / industries / contact / case-study). The homepage's full-height +
  bleed is **scoped to `.leonard-hero-bleed .leonard-hero-ratio--full`** — the
  base `--full` stays `calc(100svh - 150px)` for the others. Don't edit the base
  height without re-scoping, or the other five overflow the fold.
- **`partials/stats.html`** — the 4 count-up stats were de-duplicated from 14
  pages into this partial (included inside each page's own wrapper + Safety
  button). Editing the stats is now one file.
- **News hero** is now an **image hero** (`news-1.webp`) matching the industries
  pattern (was a no-photo `--screen` band; `case-study.html` is now the sole
  `--screen` user).
- **"One solution" band** (homepage) is **boxed**; its Descender/Vertical-Access
  label is left-aligned with a yellow left rule, still positioned top-right.
- **Products stats** are boxed (were full-bleed).

## 10. Open items / next steps (also CLAUDE.md "Next steps")

1. Confirm & fix client copy typos (`REFACTORY`→REFRACTORY, `SOLTUTIONS`,
   `DEPLYOMENT`, `proven to to be`) — reproduced verbatim on purpose until then.
2. Populate the detail-page slug variants with real per-item content (each base
   template currently holds one real item; siblings are clones).
3. Real Services mega-menu imagery/titles (still old `service-1…6.webp`, 2
   duplicate cards).
4. Wire remaining `#` placeholder links (video, social, some CTAs) — these are
   intentional placeholders until destinations exist.
5. The homepage hero mp4 is ~27 MB — consider a lighter/mobile source.
