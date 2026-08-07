# Statamic migration guide

How this static build maps onto Statamic. The current markup is the **locked
visual reference** — the CMS reproduces it exactly; content becomes fields, style
differences become toggles (variant field → modifier class). Nothing here changes
how the site looks.

**Fieldtypes used below:** `text`, `textarea`, `toggle`, `select`, `Bard`
(rich text), `Assets` (images), `Link`, `Entries` (relate to other entries),
`Grid`/`Replicator` (repeatable rows/blocks). "Bard → `.leonard-rte`" means the
rich-text field renders inside a `.leonard-rte` (or `.leonard-prose`) wrapper so
the class-less HTML it emits is styled by the wrapper — **never per-tag classes.**

---

## 1. Page types

| Type | Statamic | Pages |
| --- | --- | --- |
| **Fixed template** | collection entry + one dedicated template; sections are structured fields/loops | `products` (listing) · `product` (single) · `contact` · `news` (listing) · `article` (news single) · `case-studies` (listing) · `case-study` (single) |
| **Page builder** | `pages` collection: required Hero field-group **+** a Replicator of block "sets" the editor stacks/orders | home · services · industries · about · careers · richer content pages |
| **Simple text** | `pages` collection: header field-group **+** one Bard body | terms · privacy · any pure-text page |

---

## 2. Statamic structure at a glance

**Collections** (each with a blueprint + template): `pages`, `products`,
`services`, `industries`, `news`, `case_studies`, plus singletons for
`contact`. Detail items (`product`, `service`, `industry`, `case_study`,
`article`) are entries in their collection.

**Taxonomies:** `news_categories` (News / Case study / Insights / Video /
Events), `industries`, `services` (for relating detail pages + tagging).

**Globals:** `site` (contact email, phone, social links, addresses),
`accreditations` (the footer badge list), `newsletter` (heading/note).

**Navs (Structures):** `main_nav` (the header items + their mega-menu children),
`footer_nav` (the footer link columns), `mobile_nav`.

**Everything else is front-end** (the JS effects in §9) and rides on templates,
not content.

---

## 3. Globals & chrome

- **Header** (`partials/header.html`) → template partial fed by the `main_nav`
  structure. Each top nav item optionally owns a **mega-menu** (a set of cards
  relating to product/service/industry/case-study entries). Launch note: the
  mega-menus are currently disabled (nav items link straight to listings); in
  Statamic that's a per-item "show mega-menu" toggle. Search icon + "Make an
  inquiry" CTA are header settings.
- **Footer** (`partials/footer.html`) → `footer_nav` (Company / Products /
  Information columns) + `site` global (email, addresses, socials) +
  `accreditations` global (Avetta / ISO / MSHA). The footer wordmark reveal is
  front-end.
- **Site settings** (`site` global): contact email (`office@leonardglobal.com`),
  social URLs, office addresses, copyright line.

---

## 4. Hero — required, first-only field group

Enforced by structure: renders first, can't be reordered, one is mandatory — so
it lives **above** the Replicator, not inside it. (See §11 for the merged model.)

| Field | Type | Notes |
| --- | --- | --- |
| variant | select | full-bleed photo (`--full`) · boxed photo · dark no-photo (`--screen`) · centred |
| eyebrow | text | small label |
| heading | text | supports a manual line break |
| intro | Bard → `.leonard-rte` | short copy |
| image | Assets | photo variants only |
| video | Link | optional (home hero "watch") |
| buttons | Grid {label, link, style} | optional |

---

## 5. Page-builder block library (Replicator sets)

Every block is a self-contained `<section>` that owns its top gap (`pt-section`
contained / `mt-section` coloured bands) → order-independent. Rich text always
uses the `.leonard-rte` wrapper.

### Statement band — `.leonard-statement__title` + `.leonard-corners`
`eyebrow` (text) · `heading` (text, neutral-lightest) · `body` (Bard →
`.leonard-rte`) · `show_mark` (toggle → decorative `.leonard-statement__mark`).

### Stats band — `.leonard-stats` *(merged, see §11.4)*
`heading` · `intro` (Bard) · `stats` Grid {value (int), suffix (text, e.g. "+"),
label/description (text)} ×4 · `button` (Link) · `layout` select (full-bleed /
boxed = `--boxed`). Count-up + `data-countup` is front-end.

### Feature list — `.leonard-feature-section` / `.leonard-steps`
`heading` · `intro` (Bard) · `items` Grid {icon (Assets/select), title (text),
body (Bard → `.leonard-rte`)}. Pinned scroll-accordion is front-end (lg+).

### Band row — `.leonard-band-row` *(photo/copy)*
`eyebrow?` · `heading` · `body` (Bard → `.leonard-rte`) · `image` (Assets) ·
`buttons` Grid. **Toggles:** `dark_bg` (`.bg-dark-deep`) · `image_side`
(`order-lg-2`) · `rounded_photo` (`.leonard-media-round`). Anchor id from slug.

### "Home safe" band — yellow `bg-primary`
`heading` · `body` (Bard) · `list` Grid {label} (■ bullets) · `buttons` Grid ·
`image` (Assets).

### Testimonials (3-up) — `.leonard-quote` · **extracted → `partials/testimonials.html`**
`quotes` Grid {stars (int), quote (textarea), name (text), role (text)}.

### CTA — `.leonard-cta` *(merged, see §11.3)*
`heading` · `body` (Bard) · `buttons` Grid · `style` select (photo =
`--photo` + `image` Assets / band = `--band` corner-tick).

### Newsletter — `.leonard-newsletter` · **extracted → `partials/newsletter.html`**
`heading` · `note` (text). Pulls the `newsletter` global; form is front-end.

### Partners marquee — `.leonard-marquee`
`strip` (Assets, the logo image). Duplicated internally for the loop (front-end).

### Photo band reveal — `.leonard-reveal`
`image` (Assets). Pinned parallax reveal is front-end; usually paired with the
covering block above it.

### Prose block — generic `.leonard-prose`
`body` (Bard → `.leonard-prose`) for any general page needing free rich text
(headings, lists, tables, figures, image alignments, embeds). This is the
`article` body pattern reused as a block.

### Pull quote — dark band + `.leonard-corners`
`quote` (textarea) · `name` (text) · `source` (text).

---

## 5b. Per-page block sequence (page-builder pages)

Each block on these pages is marked **in the markup** — a `<!-- ▐ BLOCK: name -->`
comment + `data-block="slug"` on the section — so the Replicator order is
unambiguous. Sequence (Hero is the required first field group, then the blocks):

- **index (home):** Statement band · Partners marquee · *Content block* (who-we-are)
  · Stats band · **Photo band reveal** (pins the photo; the "one solution" content
  rides over it) · Feature list · Newsletter
- **services:** Statement band · Home-safe band · Band row ×5 (site-surveys + 4
  services) · *Content block* · Stats band · Testimonials · CTA · Newsletter
- **industries:** Home-safe band · Band row ×4 · Stats band · CTA
- **about:** **Photo band reveal** (composite — the stats / how-we-work / story
  content sections ride over the pinned photo; shown as reveal + 3 *Content
  blocks*) · CTA
- **careers:** *Content block* header + 2 *Content blocks* · CTA

`Content block` = a bespoke content section with no library-block class (free
`.leonard-rte` copy) → a **Prose block** (§5) or a page-specific set. The
**Photo band reveal** is a *composite*: one block that pins a photo while the
content blocks inside it scroll over — model it as a block that contains a nested
Replicator, or keep it bespoke per page.

---

## 6. Fixed-template collections (blueprints)

### products (listing)
Hero + Statement block + **`product_bands`** Entries→`products` (loops each
product's {anchor id, eyebrow, name, render image, discover link}; first band
drops `leonard-product-gap` → derive from index) + Stats + Testimonials + CTA +
Newsletter.

### product (single, collection `products`)
`eyebrow` · `name` (→ hero H1 + watermark) · `render` (Assets) · Statement
{heading, body Bard} · **`spec`** Grid {item, col1, col2} (the `.leonard-spec`
table) · Stats + Testimonials + enquiry Form (`Enquire about {name}`).

### contact (singleton)
Hero · enquiry **Form** (`.leonard-form--dark`) · **`direct_lines`** Grid {icon,
label, value} · **`regions`** Grid {name, body (Bard → `.leonard-rte fs-9`)} +
map (Assets); "01/02/03" derive from index · CTA. (Region body wrapped — see
§10.)

### news (listing)
Hero · filter bar (from `news_categories` taxonomy; front-end only) · **cards**
Entries→`news` {image, category tag, date, title, link, `is_video` toggle →
`.leonard-tag--video`} in a `.leonard-card` grid · events {intro + register
Form} · Newsletter.

### article (single, collection `news`)
`category` · `read_time` · `title` · `date` · hero `image` · **`body`** Bard →
**`.leonard-prose`** (the model prose page) · share links · **related** Entries→
`news` (3 cards) · CTA.

### case-studies (listing)
Hero · filter bar (front-end) · **rows** Entries→`case_studies` {eyebrow ("Case
study 0N" from index), title, type, solution, thumbnail, link} as `.leonard-case`
rows · Stats + Testimonials + CTA.

### case-study (single, collection `case_studies`)
`eyebrow` · `title` · `type` · `solution` · **`detail`** {client, date, role,
website} (`.leonard-detail`) · **`body`** Bard/blocks (heading + `.leonard-rte`
+ images/gallery) · Pull quote · enquiry Form.

### service / industry (detail collections)
Hero · Statement · **`challenges`/`approach`** Grid {icon, title, body Bard} ·
**`capabilities`** Grid {icon, title, body} · **`projects`** Grid {image, title,
body, tags (`.leonard-tag`), link} · **`outcomes`** ("what you gain") Grid ·
Stats + Testimonials + Pull quote + enquiry Form. (The industry "tabs" are static
today → a Grid, tabs behaviour deferred.)

---

## 7. Shared UI partials

- **Button** — `.btn` + Bootstrap variant (`btn-primary`/`btn-outline-light`/
  `btn-dark leonard-btn-lt`) + `.btn-lg`. Model as {label, link, style select}.
  The hover roll + brick-rotate are front-end (`initButtonFx`).
- **Card** — `.leonard-card` (image-zoom + yellow-rule hover): {image, tag, date,
  title, link, `is_video`}. Used by news, related, mega-menu.
- **Case/result row** — `.leonard-case` / `.leonard-result` (hairline rows).
- **Tag** — `.leonard-tag` (+`--video`): a taxonomy term.
- **Eyebrow** — `.leonard-eyebrow` (■ marker, pulses): a text field; the ■ and
  pulse are CSS.
- **Form** — `.leonard-form` (+`--dark`) *(merged, §11.2)*: {theme, fields}.
- **Filter bar / Pagination** — `.leonard-pages`: visual only today; wire to the
  taxonomy + Statamic paginate when built.

---

## 8. Front-end behaviour (template-level, NOT content)

These live in `js/main.js` + `_custom.scss`, ride on the templates, and need no
CMS fields — but the CMS must keep the markup hooks:

Intro splash · page transition · custom cursor · sticky/hiding nav · smooth
scroll (Lenis) · scroll reveal (AOS, auto-tags `.row` columns) · corner-tick
draw-in · stat count-up (`data-countup`) · feature-list pinned accordion · photo
& footer parallax reveals · CTA parallax · button hover roll · eyebrow pulse ·
**title scramble reveal** (`[data-scramble]` on hero + large yellow titles) ·
video lightbox (GLightbox) / video hero facade. All gated on
`prefers-reduced-motion`.

---

## 9. CSS / markup conventions (keep to these)

- **Rich text → wrapper, never per-tag classes.** `.leonard-rte` (band copy) /
  `.leonard-prose` (long-form). Component-level choices ride on the wrapper as
  utilities (`mw-body`, `fs-7`/`fs-9`, `text-secondary`, `text-white`,
  `fw-normal`, `mx-auto`) — they map to component settings, not to a paragraph.
- **Variants → toggleable modifier classes, never `:nth-child`/position.**
  Confirmed: band colours are explicit `.bg-dark-deep` per instance, image side
  `order-lg-2`, rounded photo `.leonard-media-round`, hero `--full`/`--screen`,
  form `--dark`. All map to CMS toggles/selects.
- **Spacing is order-independent.** Every block owns a top-only 6rem/10rem gap;
  coloured bands `mt-section` (gap stays page-green outside the colour),
  contained `pt-section`. Don't normalise to one — it would move a band's gap
  inside its colour.
- **Don't store derived values.** Loop indices ("01/02/03", "Case study 01")
  come from position.
- **Colour tokens** live in `scss/_tokens.scss` (Clinker `#253746`, Flame
  `#ffdd00`, Brick `#768592`, Zinc `#d8dfe2`); deep clinker is derived.

---

## 10. Un-wrapped prose already fixed

Body copy that a WYSIWYG couldn't reproduce was moved into wrappers (size/colour
utilities on the wrapper, look unchanged): index "One solution" band →
`.leonard-rte fs-7 ls-tight text-secondary mw-body-lg`; contact regions →
`.leonard-rte fs-9`. **Deferred:** the homepage feature-step bodies (inside the
animated accordion, one is a `<ul>` that would gain rte list margins) — wrap when
that becomes a component, with a visual pass.

---

## 11. Merged components — 1 component each, varied by a field → class

Four families are **one component** with a variant field; each carries a base +
variant class in the markup as the CMS hook. Hero & Form vary purely by class;
CTA & Stats vary by wrapper (variant selects the chrome, classes tag which).
These tag classes are **inert in the static build** (no CSS targets
`.leonard-stats`/`.leonard-cta`) → tagging changed nothing visually.

### 11.1 Hero — modifier on `.leonard-hero-ratio`
full-bleed photo `--full` (section drops container) · boxed photo (plain) · dark
no-photo `--screen` + `bg-dark` (no `<img>`) · centred. Fields per §4.

### 11.2 Enquiry form — `.leonard-form`
theme select: light (default / inside `data-bs-theme="light"`) · dark
`--dark` (on the page background). Plus a field config (contact shows all,
event-register shows just email).

### 11.3 CTA — `.leonard-cta`
style select: photo `--photo` (`.leonard-scrim` over an image + parallax) · band
`--band` (`bg-dark-deep` corner-tick). Shared fields: heading, body, buttons.

### 11.4 Stats band — `.leonard-stats`
layout select: full-bleed (default: `bg-primary` section, `container-xxl py-7`) ·
boxed `--boxed` (contained `bg-primary` panel, `p-4`, home).

**Optional later:** collapse CTA + Stats to a *single* markup + pure class toggle
(the boxed↔full-bleed bg sits on different elements → real CSS surgery, done with
before/after output diffing). Not required — the CMS template branches on the
variant anyway.

---

## 12. Extracted partials (single source of truth, output verified identical)

- `partials/newsletter.html` — index, products, services, news.
- `partials/testimonials.html` — products, services, case-studies.
- `partials/header.html`, `partials/footer.html`, `partials/cta.html` — pre-existing.

No other section is byte-identical across pages (the rest share markup but differ
in content → normal content-driven components, one template + fields).
