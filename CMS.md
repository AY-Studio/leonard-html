# Statamic component map

How this static build maps onto Statamic. The current markup is the **locked
visual reference** — components below reproduce it exactly; content becomes
fields, style differences become toggles. Nothing here changes how the site
looks.

Terminology: "fixed template" = a collection entry rendered by one dedicated
template (editor fills fields, layout is set). "Page builder" = a page entry
with a **Replicator** of stackable block "sets". "Simple text" = header + one
rich-text body.

---

## Page types

**1. Fixed templates** (structured fields, layout set):
`products` (listing) · `product` (single) · `contact` · `news` (listing) ·
`article` (news single) · `case-studies` (listing) · `case-study` (single).

**2. Page builder** (required Hero + Replicator of blocks):
`home` · `services` · `industries` · `about` · `careers` · richer content pages.

**3. Simple text** (header band + `.leonard-prose` body):
`terms` · `privacy` · any pure-text page. Already exactly this shape today.

---

## Hero — a REQUIRED, first-only field group (not a block)

Enforced by structure: it always renders first and can't be placed elsewhere, so
it lives *above* the Replicator, not inside it. One is mandatory.

- **Variant** (select) → modifier class on `.leonard-hero-ratio`:
  - full-bleed photo — `--full` (home)
  - boxed photo — plain `.leonard-hero-ratio` (products/services/industries/contact/case-studies)
  - dark, no photo — `--screen` + `bg-dark` (news/case-study/search)
  - centred — centred scrim (contact/terms/careers)
- **Fields:** eyebrow (text), heading (text), intro (`.leonard-rte`), image
  (photo variants), optional video link (home), optional CTAs.

---

## Block library (Replicator sets, page-builder pages)

Each block is a self-contained `<section>` that owns its own top gap
(`pt-section` for contained, `mt-section` for coloured bands) — order-independent.
All rich text uses the `.leonard-rte` wrapper (class-less inner HTML).

| Block | Fields | Variants / toggles |
| --- | --- | --- |
| **Statement band** | eyebrow, heading, body (rte), decorative mark on/off | — |
| **Stats band** | 4× {value, suffix, label, description}, heading, intro, button | **layout: boxed \| full-bleed** ⚠︎ (see refactor list) |
| **Feature list** | items[] {icon, title, body (rte)} | — (pinned accordion at lg+) |
| **Band row** (photo/copy) | eyebrow?, heading, body (rte), buttons[] | **dark bg** (`.bg-dark-deep`) · **image side** (`order-lg-2`) · **rounded photo** (`.leonard-media-round`) |
| **Home-safe band** | heading, body (rte), list[], buttons[], image | — (yellow `bg-primary`) |
| **Testimonials** (3-up) | quotes[] {stars, quote, name, role} | — · **extracted → `partials/testimonials.html`** |
| **Photo CTA** | heading, body (rte), image, buttons[] | **style: photo-scrim \| corner-tick** ⚠︎ (see refactor list) |
| **Newsletter** | heading, note | — · **extracted → `partials/newsletter.html`** |
| **Partners marquee** | (logo strip image) | — (spacing per instance) |

Content-driven components (photo-CTA, Home-safe, statement, band-row, marquee)
share **identical markup** across pages — only the field values differ, so each
is one template + fields.

---

## Fixed-template field maps

- **Products (listing):** hero · statement band · **product bands[]** {anchor id,
  eyebrow, name, render image, discover link} · stats · testimonials · photo-CTA ·
  newsletter. First band drops `leonard-product-gap` → derive from loop index.
- **Product (single):** hero {eyebrow, name, render, watermark} · statement ·
  spec table[] · stats · testimonials · enquiry form.
- **Contact:** hero · enquiry form · direct-lines[] {icon, label, value} ·
  where-we-work: **regions[]** {number (derive from index, don't store "01"),
  name, body (rte)} + map · photo-CTA.
- **News (listing):** hero · filter bar (categories) · **cards[]** {image, tag,
  date, title, link, video? flag} · events (intro + register form) · newsletter.
- **Article (single):** header {breadcrumb, category, read-time, title, date} ·
  hero image · **body = `.leonard-prose` (Bard/rich-text)** · share · related
  cards[] · CTA. This is the model prose page.
- **Case studies (listing):** hero · filter bar · **case rows[]** {eyebrow
  (derive "01" from index), title, type, solution, thumb, link} · stats ·
  testimonials · CTA.
- **Case study (single):** hero · body blocks (heading + rte + images/gallery) ·
  pull quote · enquiry form. Body copy is Bard-style.

---

## Conventions (already followed — keep to them)

- **Rich text → wrapper, never per-tag classes.** `.leonard-rte` (short band
  copy) / `.leonard-prose` (long-form). Component-level choices ride on the
  wrapper as utilities (`mw-body`, `fs-7/fs-9`, `text-secondary`, `text-white`,
  `fw-normal`, `mx-auto`) — they map to component settings, not to any paragraph.
- **Variants → toggleable modifier classes, never `:nth-child`/position.**
  Confirmed the alternating band colours are explicit `.bg-dark-deep` per
  instance (not `:nth-child`), image side is `order-lg-2`, rounded photo is
  `.leonard-media-round`, hero is `--full`/`--screen`. All map to CMS toggles.
- **Spacing is order-independent.** Every block owns a top-only 6rem/10rem gap;
  coloured bands use `mt-section` (gap stays page-green outside the colour),
  contained sections use `pt-section`. Do **not** normalise these to one — it
  would move a band's gap inside its colour.
- **Don't store derived values.** Loop indices ("01/02/03", "Case study 01")
  come from position, not a stored field.

---

## Flagged for the next step (variant refactor — Option B)

These are single components with a genuine style variant, currently expressed as
two different markups. To make them fully toggle-driven in the static build too,
unify each into one markup + a modifier class (pixel-verified via output diff):

- **Stats band** → `.leonard-stats` + `.leonard-stats--boxed`. Boxed = contained
  `bg-primary` panel with `p-4`; full-bleed = `bg-primary` section with
  `py-7 py-lg-8`. Note the padding differs between the two, not just the wrapper.
- **CTA** → one component + `style` toggle: photo-scrim (`.leonard-scrim` over an
  image, `partials/` TBD) vs corner-tick (`partials/cta.html`, `bg-dark-deep`
  with `.leonard-corners`).

---

## Already extracted (single source of truth, output verified byte-identical)

- `partials/newsletter.html` — used by index, products, services, news.
- `partials/testimonials.html` — used by products, services, case-studies.
- `partials/header.html`, `partials/footer.html`, `partials/cta.html` — pre-existing.
