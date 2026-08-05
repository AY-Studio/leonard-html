# Leonard homepage

Built from `Leonard.fig`. The homepage is complete.

## Two Figma files are in play

| File | Key | Used for |
| --- | --- | --- |
| **leonard---relume** | `mPTA94teYC8ZLZw2VGmfMT` | **homepage, Products, Product detail, header/footer** |
| Leonard.fig (clinker) | local file | — (superseded) |

Homepage (`Home` = `10203:36188`), Products (`10203:36337`) and Product detail
(`10203:36406`) are all now sourced from the newer **relume** file. The clinker
file is fully superseded — nothing live builds from it any more.

**The desktop MCP server reads whichever document is open in the Figma desktop
app**, cloud file or local — the file key in a URL is irrelevant to it. So there
is nothing to download; just open the file you want and it resolves node ids
against that. If a node id 404s, the wrong document is frontmost.

### Homepage hero — full-bleed, near-full viewport

The homepage hero is a **full-width, high-impact open**: `.leonard-hero-ratio`
plus the `.leonard-hero-ratio--full` modifier, which drops the `.ratio`
aspect-ratio spacer (`&::before { content: none }`) and sizes to the screen.

- **Full-bleed width** — the section has **no `container-xxl`** (`class="pt-4
  pb-4"`), so the image spans the whole viewport. The *copy* is wrapped in its
  own `container-xxl` inside the overlay so it stays on the page grid; the image
  does not.
- **Desktop height** `calc(100svh - 150px)` (lg+) — viewport less the sticky
  header (102px) and the section's `pt-4` + `pb-4` (24px each), leaving a thin
  page-green edge above and below.
- **Mobile height 70svh** — a full 100vh reads awkwardly tall in portrait. A
  `min-height` guards short landscape screens.
- `svh` throughout with a `vh` fallback. Only the homepage uses `--full`; the
  other pages keep the aspect-ratio crops.

### Homepage intro splash (`.leonard-intro`)

Built to the Figma **"start loader"** frame (`10203:35838`): a solid **yellow**
(`#ffdb00`) screen with the **dark-green LEONARD wordmark** dead-centre, a faint
**spirograph ring motif** behind it (grey `#425057` at 25% opacity, up and to
the left), and a small **`Input Mono` "360°"** label below-left. Markup in
`index.html`, styles in `_custom.scss`, lifecycle in `main.js` `initIntro()`.

Sequence, all **CSS keyframes** (no JS timing): yellow screen → **logo reveal
0–0.8s** (the wordmark is wiped in bottom→top by an animated `clip-path:
inset(100% 0 0 0)→inset(0)`, so only the clip moves and the logo never shifts;
`ease-in-out` so the wipe travels visibly across the full 0.8s) → **"360°"
0.6–1.0s** (short upward fade) → **rings 0.9–2.0s** drawn with
`stroke-dashoffset 1→0` on a `pathLength="1"` compound path → **hold 0.3s** →
**exit 2.3–3.1s** `translateY(0→-100%)` (its own height = 100vh), lifting
straight up over the already-rendered page with **no fade**.

Layout is anchored to the centred wordmark: `--intro-w` is the wordmark width
(`clamp(260px, 68vw, 1100px)`) and the ring motif and "360°" are placed/sized
off it with the exact fractions the Figma frame uses (wordmark 1181px wide on a
1728×1117 frame, rings' top-left at frame (−0.64, −73.9), "360°" at (688.9,
756)), so it stays faithful and fully responsive. The wordmark asset is
`intro-wordmark.svg` (the dark-green export); the rings are the single compound
path from node `10203:35852` with `vector-effect: non-scaling-stroke` for a
hairline at any size.

Load-order details that matter:

- **Activated before first paint.** A tiny inline `<script>` in the `<head>`
  adds `.leonard-intro-on` to `<html>` synchronously (gated on *not*
  reduced-motion), and inline critical CSS there covers the screen + locks
  scroll + sets the pre-animation states — so the render-blocking stylesheet
  paints the overlay correctly on frame one, **no flash of the homepage**.
- **Progressive enhancement.** The overlay is `display:none` by default; only
  `.leonard-intro-on` shows it. No JS → the class is never added → the page is
  usable immediately. Under `prefers-reduced-motion: reduce` the `<head>` script
  skips it, and `initIntro()` removes the node outright. Both verified: overlay
  gone, no scroll lock, `scrollY` free.
- **Cleanup is JS.** `initIntro()` removes the node and drops `.leonard-intro-on`
  (restoring scroll) on the exit animation's `animationend`
  (`leonard-intro-exit`), with a `setTimeout(3600)` safety net so the page can
  never be left locked. The `.leonard-intro` node is gone from the DOM when done.
- **No scrollbar reflow.** The lock is `overflow:hidden`, which removes the
  scrollbar; left uncompensated the page would sit wider while locked and then
  jump left when the scrollbar returns on exit. `initIntro()` measures the
  scrollbar width (a throwaway `overflow:scroll` probe — `innerWidth −
  clientWidth` is useless once the scrollbar is already gone) and sets
  `padding-right` on `<html>` to match, cleared in `finish()` in lockstep with
  the scrollbar. This is Bootstrap's ScrollBarHelper trick; `scrollbar-gutter`
  was tried but its reserved gutter is *outside* the `fixed inset:0` overlay
  (100vw excludes it), leaving a page-coloured strip down the right edge. The
  padding approach keeps the overlay covering the whole window. No-op where the
  scrollbar is an overlay (width 0).
- The overlay's inline `<head>` cover is **`#ffdb00`** (must match the yellow
  screen); the pre-animation states there hide `.leonard-intro__logo` (clip),
  `.leonard-intro__360` (opacity) and `.leonard-intro__rings path` (dashoffset).
- **The intro only plays on a direct/first visit.** Its `<head>` script also
  checks `sessionStorage['leonard-pt']` and skips when the page was reached via a
  page transition (see below) — otherwise the LEONARD splash would replay on
  every "home" click. Arriving via a transition plays the plain yellow reveal
  instead (same yellow-out-the-top motion, no branding).

### Page transition (`.leonard-pt`)

A **yellow screen that slides up from the bottom to cover the page on leaving,
then continues up and out through the top on the next page to reveal it** — one
continuous upward motion across the navigation. It's an MPA (full reloads), so
the two halves live on different documents and are stitched with a
`sessionStorage['leonard-pt']` flag. CSS in `_custom.scss`, logic in `main.js`
`initPageTransition()`, panel markup in `partials/header.html` (body-level, so
it's on every page), and a tiny **flag→class `<head>` script on every page**
(injected after the `apple-touch-icon` link).

- **Leaving:** a delegated document click handler catches in-site `<a>` clicks,
  sets the flag, runs the **cover** animation (`translateY(100%)→0`), and
  navigates on its `animationend` (600ms safety timeout). Skips: external
  origins, `mailto:`/`tel:`, `target`/`download`, `data-bs-toggle` (dropdown /
  offcanvas togglers), `[data-no-transition]`, `rel=external`, modified/middle
  clicks, and same-page hash links (those just scroll).
- **Arriving:** the `<head>` script adds `.leonard-pt-arriving` before first
  paint, and a tiny **inline critical `<style>`** in every head
  (`.leonard-pt-arriving .leonard-pt { position:fixed; inset:0; z-index:3000;
  background:#ffdb00 }`) makes the panel **already covering at first paint —
  before any stylesheet loads**. That is what masks the flash: it works even on
  the Vite **dev server**, where the site CSS is JS-injected (a `<style>` tag
  added by `main.js`) and therefore paints late. (Prod ships the CSS as a
  render-blocking `<link>`, so there's no FOUC there regardless — this is belt
  and suspenders.) `initPageTransition()` then clears the flag and runs the
  **reveal** (`translateY(0)→-100%`), then removes the class.
- z-index **3000** — above the intro (2000) and cursor. Off under
  `prefers-reduced-motion` (links navigate normally; an arriving page uncovers
  instantly). `pageshow`/`persisted` (bfcache back-forward) resets the panel and
  flag so a restored page is never stuck yellow. Verified end-to-end: cover
  `translateY` positive→0, navigate, reveal 0→negative, classes/flag cleared.

### What relume changed on the homepage

- Nav: `Discover` → **Latest News** (the footer's Company column still says
  Discover — that is the new design, not an oversight)
- Type scale is now named: **H1 96 / H2 72 / H3 48** → `.display-h1/-h2/-h3`
- Buttons are **48px** with roomier padding, an arrow icon and no tracking →
  mapped onto `.btn-lg` so the clinker pages' 37px buttons are unaffected
- Statement: grey → `#002529`, headline now light 72px, yellow eyebrow reading
  "Home safe, every day", plus a decorative mark top-right
- Who we are: new headline ("A quiet confidence…") and a photo, not the flame
- New **full-bleed photo band** after the stats
- New **Newsletter** section before the footer
- Partners strip copy is now "Trusted by the world's most demanding industries"
- Feature band (`Frame 76`) is **`#002529`**, not the grey the clinker file used,
  and both its eyebrow and "Home safe, every day" heading are yellow

### Reading body copy out of Figma

Figma's export splits a fixed-width text box into one `<p>` per *rendered line*,
which is not the same as a paragraph. The tell:

- an **empty `<p>` containing a zero-width space** between blocks = a real
  paragraph break (the "Who we are" copy is two paragraphs, not one)
- **consecutive non-empty `<p>`s** = just line wrapping; render as one paragraph
  (the solution band's copy, "Works in cyclones…")

Also check the wrapping element: the "Faster deployment" feature copy is a
`<ul class="list-disc">` in the design — three bullets, not a run-on sentence.
It was flattened into a paragraph on the first pass. Being inside
`.leonard-rail` (itself a `<ul>`), it needs `list-style-type: disc` or the
browser renders level-two hollow circles.

### Section rhythm

The relume file uses a consistent **40px** gap between banded sections, not the
16px (`pt-3`) first used. It is a named spacer, `section` (2.5rem), so the class
is `pt-section` / `mt-section` — 40px sits between `4` (24px) and `5` (48px) on
the numeric scale and would otherwise have been mis-rounded. Measured gaps:
hero 24, statement 43, partners 24, who-we-are and stats ~140 (their `py-7
py-lg-8` covers it), then 40 for every band from the photo down to the
newsletter.

The stats box's own inset is ~21px, so it is `p-4` — `p-lg-5` (48px) was more
than double the drawn padding.

### Corner "+" tick draw-in

The `+` ticks on the statement / Descender / product bands (`.leonard-corners`)
are no longer a font glyph — each is two bars (`span::before` = the `-`,
`::after` = the `|`) in a 1em box that keeps the glyph's exact footprint, so the
static look is unchanged. That split lets them **draw in**: the `-` wipes from
the centre out, then (after a 0.28s delay) the `|`, both `scaleX/scaleY 0→1`.

`initCornerDraw()` adds `--anim` (which zeroes the strokes) then `is-drawn` the
first time each set enters view (IntersectionObserver, once). Progressive
enhancement again: no `--anim` without JS or under reduced motion, so the
default is the finished `+`. Bars are em-based (arm 0.62em, stroke 0.06em floored
at 1px) so they track fs-1's RFS scaling instead of drifting from it.

**The spans must be empty** (`<span></span>`, not `<span>+</span>`). The bars ARE
the `+`; leaving the literal glyph in renders it on top of them — a doubled mark.
This bit once: the CSS was switched to strokes but the markup kept the `+`.

### Photo band reveal (parallax)

The full-bleed photo pins while the section below rides up over it — pure CSS,
no JS:

- `.leonard-reveal__media` is `position: sticky; top: 0; z-index: 0`
- the covering section is `position: relative; z-index: 1` with an **opaque**
  page-colour background — its own background is transparent, so without that
  the pinned image shows through the container gutters either side
- both live in a `.leonard-reveal` wrapper, which is what bounds the effect:
  sticky releases at its containing block's edge, so the image is held exactly
  as long as the covering section takes to pass. Without the wrapper it would
  stay pinned behind the whole rest of the page — and, being positioned, could
  paint over the footer.

Disabled under `prefers-reduced-motion: reduce`. The sticky nav (`$zindex-sticky`,
1020) still stacks above the pinned media (0) — verified with `elementFromPoint`.

### Footer reveal

A **scroll-scrubbed parallax reveal**, not a timed animation: every frame is a
function of scroll position, and scrolling back up runs it backwards.

The tail — strapline, wordmark and legal row — sits on a full-bleed band in the
deeper green, inside a relative, clipped container. Two things scrub over one
range, linearly, no easing curve:

- `.leonard-footer-reveal__layer` drifts `translateY(-50%) → 0`, so it is
  uncovered from the top edge as it settles
- `.leonard-footer-reveal::after`, a **solid black** overlay above it, goes
  `opacity 1 → 0`

Together they read as the wordmark being uncovered *while* drifting into place,
rather than either a slide or a fade on its own.

**The range is the section's own entry** — starts as the top of the section
reaches the bottom of the viewport (`entry 0%`), completes as its bottom does
(`entry 100%`). That is a view-progress timeline, and it is self-sizing: no magic
pixel value to keep in step with the content. Because this section is the last
thing in the document, `entry 100%` lands exactly at the bottom of the page, so
it still reads as the last thing the page does **without** the hand-tuned scroll
tail earlier versions needed — the footer no longer pads itself out to buy room.

Verified linear and identical on both pages (`secH` 416):

| section | translateY | overlay |
| --- | --- | --- |
| top at viewport bottom | −160 | 1.000 |
| ¼ | −120 | 0.750 |
| ½ | −80 | 0.500 |
| ¾ | −40 | 0.250 |
| bottom at viewport bottom | 0 | 0.000 |

Implementation notes:

- **The timeline is declared on the section** (`view-timeline-name`) and consumed
  by both animations, so the layer's own transform can never feed back into the
  measurement driving it.
- **The layer is left in flow**, not absolutely positioned. A transform moves it
  either way, and in flow the container's height tracks the content instead of
  needing a hard-coded height or a spacer sibling to stand it up.
- **The overlay is black, not the band colour.** Black is what the content
  emerges from; the band colour would just dissolve into itself.
- The block sits **outside `.container-xxl`**, container moved inside onto the
  copy — a container at that level stops the colour 22px short of each edge.
- `.leonard-footer` has **`padding-bottom: 0`**: the section is the last thing in
  the footer and paints the page's bottom edge, so any footer padding shows as a
  strip of the lighter green beneath it.
- **`pointer-events: none` on the overlay is load-bearing.** It covers the whole
  section, and `opacity: 0` does *not* stop a pseudo-element receiving clicks —
  without it the Privacy / Terms / Website-by links in the legal row are dead,
  and so is their hover, with nothing on screen to explain why. This bit once.
- At max scroll the scrub lands on 0.0997% rather than a clean 0 at some widths —
  sub-pixel document rounding against `entry 100%`. That is under one 8-bit
  level, invisible; don't "fix" it by ending the range early.

`$leonard-dk-grey-deep` is **not in Figma** — dk grey is the darkest colour the
file has. It is `shade-color($leonard-dk-grey, 35%)` (`#00181b`), derived rather
than hand-picked so it tracks if dk grey is ever corrected. Worth confirming with
the designer.

#### Earlier takes, and why they went

All were measured off `enerblock.net/en`, whose footer runs `.footer__parallax`
(logo *and* sub-footer together, which is why ours wraps the same span) at
`translateY(-50%) → 0` while `.footer__over`, an opaque panel, fades `1 → 0`.
Their panel sits *behind* the content and their content is that same near-black,
so it reads as camouflage lifting; ours is light-on-dark, so the panel has to go
on top.

1. **Wordmark only** — too small a target.
2. **Whole tail, document-scroll trigger with a 260px tail** — the trigger was
   fine but needed the footer padded out to buy scroll room. The section's own
   entry gives the same landing for free.
3. **Band parked off-screen, rising `translateY(100%) → 0`, no overlay** — a
   slide-up entrance rather than a scrub reveal. Too abrupt (the whole entrance
   happened in the last ~170px) and it lost the uncovering.

### Scroll reveal (AOS)

A graceful **opacity-only** fade (`data-aos="fade"` — no movement) as content
enters the viewport, powered by the **AOS** library (`npm i aos`, imported +
`AOS.init` in `main.js`: `duration 700, easing ease-out, once, offset 80,
disable: reduced-motion`). Elements opt in with `data-aos` attributes, so any
element is individually controllable from the markup.

`initReveal()` auto-tags the site so it works without hand-editing every page:
the **columns of each top-level `.row`** (the row is only the trigger; its
columns fade) plus the **footer link columns** get `data-aos="fade"` +
`data-aos-delay` **staggered 100ms, reset per visual row** (grouped by
`offsetTop`, so a card grid ripples row-by-row rather than piling up delays down
a tall grid). A two-column row reads left-then-right; the footer columns arrive
one after another. AOS owns the observing / timing / once behaviour.

- **Opt-in / override:** the auto-tagger skips any element that already has
  `data-aos`, so you can hand-place attributes in the markup for finer control.
- **No flash:** it only tags rows **entirely below the fold** when it runs
  (off-screen, so AOS hiding them is invisible); on-screen content stays visible
  — the first screen (usually the hero) just shows, content fades as you scroll.
- **Excluded:** rows inside a `<form>` (fields shouldn't stagger), nested rows
  (top-level `.row`s only), and the `.leonard-footer-reveal` band (own animation).
- **⚠️ Class-name note:** `.leonard-reveal` is the **photo-band parallax**
  wrapper, *not* this feature — an earlier custom version reused that class and
  its `opacity:0` hid the photo band. AOS uses `data-aos`, so no collision.
- Verified: card delays `[0,100,200, 0,100,200, …]`, footer `0/100/200/300ms`,
  photo band visible, no above-fold hiding.

### Stat count-up

The four stats animate 0 → value the first time they scroll into view
(IntersectionObserver, `threshold: 0.6`, then `unobserve` — it runs once).

Each `<span>` carries its **real value as text** and `data-countup` holds the
target, so the numbers are correct with no JS at all, and the animation is
skipped outright under `prefers-reduced-motion: reduce` — it only ever replaces
a number that is already on screen. An optional **`data-countup-suffix`** (e.g.
`"+"`) is re-appended every frame — the count-up overwrites the whole text node,
so a suffix baked into the markup would otherwise be lost (used by the About
band's `30+`). The full stat band (yellow `bg-primary` box, `display-stat`
count-ups, title + description, `Safety` button) is shared by the homepage,
About, and the product/service/industry detail pages.

### Full-bleed bands

The features band is full-bleed (`bg-dark` on the `<section>`, content in an
inner `.container-xxl`) rather than an inset box. Its background matches the
page, so inset vs full-bleed is invisible *until* something sits in the gutter —
which is exactly what went wrong: `.leonard-machine` carried a `-4.5rem`
overhang from the older clinker design, where the render did bleed past the
frame. In relume it starts at x=0 of the frame, so the overhang pushed it out of
the band and off-screen, and read as the green failing to reach the edge.

### Stacking feature cards

The five features pile up as you scroll, each pinning under the last and leaving
a title-height sliver — the `stack__container` effect from `enerblock.net/en`,
measured off it (their four items are `position: sticky` at `top` 61 / 117.4 /
173.8 / 230.2px, a flat 56.4px step). Ours is `.leonard-stack` on the
`.leonard-rail` `<ul>`; the step is a `:nth-child` loop setting
`--leonard-stack-i`, and `top` is `calc(base + i * step)`.

Three things it depends on, all easy to break:

- **Each card needs an opaque background.** Without one the card underneath
  shows straight through. Invisible until they overlap, because the band is a
  flat colour.
- **The step must land exactly on the title's line box.** One title wraps to two
  lines (three at `lg`), and a step even slightly over one line shears the
  second line mid-glyph. Land on the line box and extra lines are cut at a line
  boundary, which reads as intentional. But `.display-5` is **RFS-scaled** —
  37.3px at 992, 43.2 at 1400, 48 at 1728 — so a fixed `rem` step drifts apart
  from it at every width. `@include rfs(3rem, --leonard-stack-line)` runs the
  same RFS the display scale uses, which locks them together. (The `rfs()`
  mixin does take a custom property as its target.)
- **The card has to reach out past the icon.** `.leonard-feature__icon` is
  absolutely positioned onto the rail, *outside* the card's box, so it is the
  one thing a covering card cannot paint over — leave it and the collapsed
  cards' icons pile on top of each other. The card gets a negative
  `margin-left` of `rail-gap + 19px` (19 = half the icon) with matching
  padding.
- **The rail line is drawn once, on top of the cards.** Because each card's
  opaque background reaches left past the icon it also paints over the rail's
  `border-left`. Drawing a segment per card (an earlier attempt) left the line
  broken between separated cards. Instead `.leonard-stack::after` is one
  continuous line at `z-index: 1` — above the sticky cards (which are z-auto) —
  so it runs unbroken down the whole stack. **No horizontal rules between cards**
  (an earlier `border-top` per card was wrong) and the single line stays put and
  aligned. It passes through the icon centres, which is where the rail sat in the
  non-stacked design too.

`lg`+ only: below that the icon is in flow *above* the title, so a collapsed
card would show an icon and no name. Off under `prefers-reduced-motion` too,
which restores the plain scrolling list exactly.

The last card never pins — it is the last child, so its bottom is its
containing block's bottom and sticky gives it no travel. It rides up over the
stack instead. That is not a bug; the reference does the same (its container is
exactly 4 × item height), and it is how the section hands over to the next one.

### Sticky feature intro

The feature list's left column pins and travels with the list, releasing at the
last item. That is `.leonard-sticky` (`position: sticky; top: 2rem`) at lg+,
static below — plain CSS, no JS.

It works because Bootstrap's `.row` is flex with `align-items: stretch`, so the
column is as tall as the feature list and the sticky child naturally stops where
the column ends — which is the last feature. Two things break it silently:

- any `overflow: hidden` ancestor turns sticky back into static
- if the sticky block is nearly as tall as the column there is no travel. This
  bit here: feature items were spaced `mt-7` (96px) where the design has ~160px,
  so the column was barely taller than the block and it unstuck almost at once.
  They are `mt-8` now, which matches the design *and* gives the pin room to run.

When testing sticky over CDP, scroll with `behavior:'instant'` — Bootstrap's
reboot enables smooth scrolling, so a normal `scrollTo` is still animating when
the measurement is taken and the numbers look nonsensical.

## Products page (relume `10203:36337`)

Rebuilt from relume, replacing the clinker version. Sections top to bottom:
hero (full-bleed photo + 40% scrim, `Products built for performance`),
statement band (dark, corner ticks), **five product bands**, stats (full-bleed
yellow), testimonials, CTA (`Discuss your equipment needs`), newsletter.

Most of it is homepage components reused verbatim — the hero pattern, the
`.leonard-statement__title` band, the stats band (same 18/24/50/100 count-up and
copy as the homepage), and the newsletter. New to this page: `.leonard-product`
bands, `.leonard-quote` testimonial cards, and `.leonard-scrim` (the 40% photo
wash, shared by hero and CTA).

- **Product bands** are **boxed (container-width) `#ccc`** panels
  (`$leonard-neutral-lighter` → `.bg-neutral-lighter`, a background-only utility
  like `neutral`, not a theme colour) — inset ~22px each side with the page-green
  showing around them, as drawn in Figma (`Rectangle 33…`, `x≈24 w1680` in the
  1728 frame; sharp corners, no radius). This is done by putting `container-xxl`
  on the **section** so `.leonard-product` fills the container's content box; the
  content padding (`px-4 px-lg-5`) moved onto `.leonard-product` and the old
  *inner* `container-xxl` was dropped, so the content sits exactly where it did
  before — only the grey extent changed from full-bleed to boxed. Name left in
  `.leonard-product__name`, render right, a 300px `.leonard-watermark` of the
  name bleeding off the bottom. `.leonard-product` is `position: relative;
  overflow: hidden` — the name and watermark deliberately overrun their columns,
  and the clip keeps that inside the box (verified zero overflow 320–1920, box
  inset 22px each side).
- **Anchor ids `#axis … #calibre` + `.leonard-anchor` are preserved** — the
  header mega-menu and footer deep-link into them. Don't rename.
- **Renders** map by the label baked into each: `render-323`=Axis,
  `-324`=Nano, `-325`=Descender, `-326`=Charger, `-327`=Calibre. Downloaded from
  the Figma asset server (transparent PNGs); the Figma placement mismatched some,
  the on-image label is authoritative.
- Only **Axis**'s DISCOVER goes to `/product.html`; the others self-reference
  until each gets its own detail page (same as before).

Copy reproduced verbatim from the source, placeholders included:
- **Calibre's eyebrow** is `Cement Mill Media-Recharging`, identical to
  Charger's — a duplicate in the Figma, not a real descriptor.
- The CTA's two buttons are the relume defaults **`Contact`** (envelope) and
  **`About`** (caret), wired to `#inquiry` / `#about`. Confirm the intended
  labels/links before launch.

## Which Figma template (clinker file)

**The file contains two different homepage designs, both in a frame named
`Home`, both exactly 1728x7184.** Picking the wrong one is easy — it happened
once. The live build is **`Page - clinker` -> `Home` (54:4233)**.
`Pages - flame` -> `Home` (22:3128) is an older direction and is **not** built.

To point at a template, any of these is unambiguous:

1. Paste the Figma URL — `?node-id=54-4233` maps to nodeId `54:4233`. The file
   key in the URL is irrelevant; the desktop MCP server resolves node ids
   against whatever file is open, so local files work.
2. Select the frame in Figma and say "use my selection" — with no nodeId, the
   server returns the current selection.
3. Say `page -> frame`, e.g. "clinker -> Home".

`Page - clinker` (54:3889) holds four page templates:

| Node      | Template                            |
| --------- | ----------------------------------- |
| `54:4233` | Home — superseded by the relume file |
| `92:3`    | Products — **built**                |
| `136:504` | Services                            |
| `92:973`  | Product detail — **built** (Axis)   |

Section map within Home. Note the footer is parented to the **page**, not to
`Home`, so it does not appear in the frame's child list:

| y         | Node       | Section                          |
| --------- | ---------- | -------------------------------- |
| 24–102    | `92:2`     | header (component)               |
| 122–1012  | `54:4242`  | hero                             |
| 1046–1848 | `54:4238`  | statement band                   |
| 1882–2035 | `54:4256`  | partners marquee                 |
| 2197–2966 | `92:865`   | who we are                       |
| 3105–3646 | `92:848`   | stats band                       |
| 3668–4560 | `92:892`   | one solution                     |
| 4591–6242 | `54:4234`  | feature list                     |
| 6262–7176 | `92:149`   | footer (parented to the page)    |

## Stack

Bootstrap **5.3.8** + Sass + Vite, following Bootstrap's "Include parts of
Bootstrap" Sass pattern.

### Multi-page and shared markup

The header carries four mega-menus and is ~26KB — two thirds of a page — so it
lives in `partials/` and is pulled in at build time:

```html
<!-- #include partials/header.html -->
```

`vite.config.js` defines a small inline `htmlPartials()` plugin (no extra
dependency — it uses Vite's own `transformIndexHtml` hook) that resolves those
directives recursively, errors on a missing target, and full-reloads dev when a
partial changes. Output is plain static HTML with no runtime cost.

**Every new page must be registered** in `build.rollupOptions.input`, or Vite
will not emit it.

```
index.html                homepage       (relume 10203:36188)
products.html             Products page  (Figma 92:3)
product.html              Product detail (Figma 92:973) — Axis; see below
partials/header.html      shared nav + 4 mega-menus  — edit once
partials/footer.html      shared footer
js/main.js                imports styles.scss + Collapse (for the navbar)
scss/styles.scss          import order; note utilities-custom sits between
                          `utilities` and `utilities/api`
scss/_tokens.scss         the design system: palette, type scale, spacing, grid
scss/_utilities-custom.scss  additions to the $utilities map
scss/_fonts.scss          @font-face
scss/_custom.scss         only what Bootstrap can't express (see below)
public/fonts/, public/img/
public/favicon.svg        favicon — the "O" brand mark (arrow-dark.svg's
                          notched square) in yellow on a dark-green square
public/favicon-32.png     32×32 PNG fallback (rasterised from favicon.svg)
public/apple-touch-icon.png  180×180 iOS home-screen icon (same)
```

The three favicon files sit in `public/` (Vite copies them to the `dist/` root)
and are linked in every page `<head>` right after the viewport meta:
`icon` svg + `icon` png (32) + `apple-touch-icon`. To regenerate the PNGs after
editing the SVG, re-rasterise it (no SVG converter is installed locally; a
headless-Chrome screenshot of the SVG scaled to the target size does it).

`npm start` — dev server. `npm run build` — `dist/`, ~860K. Build is green.

### Bootstrap-first, on purpose

The design system lives in Bootstrap variables and utilities, not in layered
CSS. Before adding a rule to `_custom.scss`, check whether a variable override
or a `$utilities` entry does the job.

- **Type scale** is `$display-font-sizes`, so headings are `.display-1`…
  `.display-6` plus named `.display-stat` (200px) and `.display-wordmark`
  (300px). RFS makes them fluid — there is no `clamp()` maths in the stylesheet.
- **Spacing** — `$spacers` is extended to 6/7/8/9 (64/96/160/224px) so section
  rhythm is `py-7`, `px-lg-8` etc.
- **Colours** — the Leonard palette is mapped onto `$primary`/`$secondary`/
  `$dark`/`$light`, so `.bg-primary`, `.text-primary`, `.btn-outline-dark` and
  friends all speak the brand.
- **Line-height, letter-spacing, min-width/height, max-width** are added to the
  `$utilities` map: `.lh-tight`, `.ls-wide`, `.minw-176`, `.mw-stmt`.
- **Header** is a real `.navbar navbar-expand-xxl` with Bootstrap's collapse.

`_custom.scss` is deliberately small: the ■ eyebrow marker, the hero crop
ratio, the logo marquee animation, the DESCENDER watermark, and the feature
rail. Nothing else.

## Custom cursor

The pointer is the brand mark (the notched square from the "Make an inquiry"
button, the wordmark's O), rendered as a DOM element that follows the mouse with
`mix-blend-mode: difference`, so it **inverts against whatever is behind it** and
stays legible on every band. An earlier version used CSS `cursor:` images in
fixed yellow/white; those washed out on the light bands (partners `#eee`,
Descender `#d8dfe5`, the mega panels), which is what "not responding over some
elements" was. Inversion has no fixed colour to lose.

- **DOM element, not a CSS cursor**, because CSS cursors can't carry a blend
  mode. `initCursor()` in `main.js` builds it (mark inlined from
  `arrow-dark.svg`, filled white so `difference` is a clean invert), tracks the
  mouse in a rAF (one transform write per frame), and styles live in
  `_custom.scss`.
- **Progressive enhancement:** `cursor: none` is applied via
  `.leonard-has-cursor`, a class JS adds to `<html>` — no JS, ordinary pointer.
- **Fine pointers only** (`(pointer: fine)`), so touch is untouched (verified: no
  element, no `cursor:none`).
- **States:** grows 18→26px over anything interactive (`is-active`) as feedback
  on top of the inversion; hides over text fields (`is-text`) so their I-beam
  shows; hides when the mouse leaves the window.
- Sized 18px (was a 24px image — "too big"). Hotspot is the mark's hole, so the
  click point is never covered.
- The old `public/img/cursor-*.png` files are gone; don't reference them.

## Header mega-menus

All four nav panels are Bootstrap **Dropdown** components. Bootstrap owns
show/hide, click-outside, ESC and `aria-expanded`; `_custom.scss` only restyles
the menu into a full-width panel.

| Frame     | Panel        | Layout                                |
| --------- | ------------ | ------------------------------------- |
| `54:4379` | Products     | 5 cutout renders, name + descriptor   |
| `54:4442` | Services     | 6 photos, title only (30px → `fs-3`)  |
| `54:4503` | Industries   | 6 photos, title only (26px → `fs-12`) |
| `54:4574` | Case Studies | 6 photos, title only (26px → `fs-12`) |

Discover has no panel in the design — it stays a plain link.

### Linking out of a panel

A `data-bs-toggle="dropdown"` link **cannot navigate** — Bootstrap calls
`preventDefault()` on it — so the Products nav item alone can never reach the
Products page. The panel therefore carries its own routes:

- each product card deep-links to `/products.html#axis` … `#calibre`
- a **"View all products >"** button sits beside "+ Safety First" in the panel
  header, going straight to `/products.html`

The five product blocks on the page carry matching ids plus `.leonard-anchor`
(`scroll-margin-top: 1.5rem`) so a jump does not land flush against the
viewport edge. Smooth scrolling already comes from Bootstrap's reboot
(`$enable-smooth-scroll`), behind `prefers-reduced-motion`.

The toggle's own `href` is still `/products.html`, which does nothing on click
but keeps middle-click and "open in new tab" working.

**Services** and **Case Studies** now have real pages, so each panel carries a
"View all …" link and its toggle `href` points at the listing. Services' four
real cards deep-link into `/services.html#refractory-installation` …
`#media-grading` (the two duplicate placeholder cards point at the page root);
all six Case Studies cards point at `/case-study.html` (one detail template,
like the product cards). **Industries** likewise now has a "View all industries"
link and a real toggle; its four matching cards deep-link into
`/industries.html#cement-lime` … `#power-generation`, and the two extra cards
(#biomass, #civil-infrastructure — industries not on the listing yet) point at
the page root.

Card titles use the design's exact sizes because the columns are tight — at
`fs-3` the industries card "WASTE-TO-ENERGY" wrapped to two lines, so `fs-12`
(26px) exists purely to keep it on one.

**Imagery is heavily shared** — check before exporting anything again:

- Descender card → `descender-robot.webp` (also the solution band)
- Services "Confined Space" → `service-3.webp`, reused by Industries
  Waste-to-Energy and Case Studies "World's First…"
- Case Studies reuses the **entire** Industries photo set

In Case Studies the photos do **not** correspond to their titles in the Figma
source (a cement plant sits under "Waste-to-Energy Robotic Demolition"), and
cards 4–6 still carry the Industries titles verbatim. That is placeholder art
and copy, reproduced as-is. Because the pairing is meaningless, those images
are `alt=""` (decorative) and the adjacent heading names each link — describing
them would announce something contradicting the title.

How the full-width panel works:

- At `xxl` the `.nav-item.dropdown` is set `position: static` so the absolutely
  positioned `.dropdown-menu` anchors to the `position: relative` header — i.e.
  the container's content width — rather than to the nav item.
- `data-bs-display="static"` keeps Popper from fighting that positioning.
- The mega-menus are **desktop only** (the navbar expands at `xl`). Below `xl`
  the whole thing is replaced by a separate mobile menu — see below — so the
  `.navbar-collapse` never opens on mobile (its toggler targets the offcanvas
  instead).

### Mobile menu (relume `10208:173914` / `-175080`)

Below `xl` the desktop nav is hidden and the hamburger opens a **full-screen
light Offcanvas** (`.leonard-mobile-nav`, `#leonardMobileNav`) — a dark logo +
close, uppercase mono nav rows with dashed rules, secondary links, and a
full-width yellow "Make an inquiry" CTA pinned to the foot. **Products** expands
(Bootstrap Collapse) to its five child pages in the display face; the `+`/`−`
comes from `.leonard-mnav__toggle[aria-expanded]`. The other rows are direct
links to their listing pages (matching the mockup — only Products has children).

Two things that matter:

- **The offcanvas sits OUTSIDE `.leonard-header`.** The header takes a
  `transform` when it hides on scroll, which would become the containing block
  for the `position: fixed` panel and trap it. As a body-level sibling it's fine.
- Imports added for it: `bootstrap/scss/offcanvas` + `close` in `styles.scss`,
  `Offcanvas` in `main.js`. `logo-dark.svg` (dk-grey recolour of the yellow
  logo) is the panel's dark-on-light mark.

The mobile nav labels follow the mockup, which differ from desktop: it shows
**Discover** (→ `/news.html`, i.e. Latest News) and adds **Safety First**.

### Sticky nav

The bar pins to the top, hides on the way down and returns on the way up.

**The bar locks where it starts.** `.leonard-header { position: sticky; top: 0 }`
pins the header, and the header's own `pt-4` keeps the 24px of page above the
bar — so the gap you see on load is the gap you keep when it pins. Sticky rather
than fixed, so nothing below shifts.

An earlier pass used `top: -1.5rem` (the negative of that `pt-4`) to pull the
padding off-screen and sit the bar flush against the viewport edge. **That is
not wanted** — don't reintroduce it.

Only the **`.navbar`** carries an explicit `background` (`$leonard-dk-grey`) —
at rest it only *looks* dark because the page behind it is, and content would
otherwise show through as it scrolls under. The **`.leonard-header` wrapper is
transparent**: its 24px `pt-4` strip sits over the page-green top and needs no
fill of its own. (An earlier pass filled the header too; that was removed.)

Direction handling is in `main.js` (`.leonard-header--hidden` →
`translateY(-100%)`). It deliberately refuses to hide when:

- movement is under ~6px, so trackpad jitter doesn't flap it
- you are within 140px of the top — there is nothing to reclaim yet
- **a mega-menu is open** — the panel is a child of the header and would fly
  off screen with it
- **focus is inside the header** — otherwise a keyboard user is stranded on an
  invisible control

Scroll reads are batched into a `requestAnimationFrame`, and the transition sits
behind `prefers-reduced-motion`.

Do not add `position: relative` to `.leonard-header` — sticky is already a
positioned ancestor for the mega panel, and relative would silently unstick it.

### Opening, and card hover

**The panels open on click only** — plain Bootstrap Dropdown, no JS of ours.
`js/main.js` just imports Collapse and Dropdown. (An earlier pass added
hover-to-open with intent delays; that was not wanted and has been removed. If
it is ever revisited, note that `:hover` follows the DOM rather than the box,
so the panel counts as inside its nav item despite being positioned below it.)

**The nav links themselves have a hover** (`.leonard-nav > .nav-item >
.nav-link`, CSS only): the label goes yellow and a 2px yellow rule wipes in from
the left beneath it — the footer/mega-card idiom. Two details: the rule is a
`::before` because the toggle's `::after` is the (hidden) caret; and it is
drawn as `scaleX` on a `::before` inset
`auto var(--bs-navbar-nav-link-padding-x, 0) 0.35rem`. That inline inset is the
nav-link's **own** padding (Bootstrap's `--bs-navbar-nav-link-padding-x`,
0.75rem at `xl`+) — `0` each side overhangs the label by 0.75rem, which read as
"underline wider than the text"; matching the padding var makes the rule span
exactly the label and self-track if the padding changes. `0.35rem` sits it under
the text given the `.5rem` padding-y. The open item (`.show`, its light box) is
excluded via `:not(.show)`, and the whole thing is behind
`prefers-reduced-motion`. `:focus-visible` gets it too.

**Hover belongs to the cards inside the panel**, in CSS only:

- the image eases to `scale(1.05)` over 450ms inside its clipped box
- a 3px yellow rule wipes in along the bottom edge of the media

The rule sits under the *media*, not under the title, because service titles run
to three lines — a text underline would land at a different height on each card,
whereas the media edge is a consistent baseline. Both are wrapped in
`prefers-reduced-motion: no-preference`, and `:focus-visible` gets the same
treatment plus an outline so keyboard users see it too.

**Deliberate deviations from the nav-state frames** — both confirmed with the
designer:

- Those frames number the nav (`1. PRODUCTS` …) and title (`1. OUR PRODUCTS`)
  while a panel is open. That is an artefact of the frames, not intended
  behaviour. The nav and panel titles are **never numbered**.
- The open item does keep its light-box highlight, which is real.

## Product detail template (`product.html`)

Rebuilt from relume `10203:36406`, populated with Axis. Same shape as before —
hero (light panel, `Axis` watermark, eyebrow, `<h1>`, `render-323`), statement,
spec sheet, stats, testimonials, enquiry form — but re-sourced. To add another
product, duplicate the file and swap: `<title>`, hero eyebrow, `<h1>`, watermark
text, the render, the statement copy, the spec rows and the "Enquire about …"
heading — then register it in `rollupOptions.input`.

Relume changed against the old clinker build:
- **stats** now count up (`data-countup`) and are a full-bleed yellow band with
  a green `Safety` button — the same block as the homepage / Products page
- a **testimonials** section was added (identical 3 quotes to the Products page)
- the statement typo **`D accuracy.` → `With accuracy.`** was corrected in the
  source, and `proven to to be` → `proven to be`
- spec-sheet buttons are **`Data sheet` / `Downloads`** (were `Spec sheet` /
  `Brochure`); the form heading is **`Enquire about Axis`** (British spelling,
  was `Inquire about the Axis`)

All five product cards on `products.html` now link here (`/product.html`); only
Axis is real, the rest reuse this template until each gets its own copy.

Still placeholder in the source, reproduced as such: the spec table is nine rows
of `Item / Lorem ipsum / Lorem ipsum` under two columns both headed "Title".

Two Bootstrap components appear here for the first time — `tables` and `forms`
are imported in `styles.scss` for it (they cost ~28KB of CSS).

- **Spec sheet** is a real `<table>` in `.table-responsive`, styled by
  `.leonard-spec`: Bootstrap supplies the row rules, the custom class adds the
  yellow label column and the vertical dividers. Cell type uses a fluid
  `clamp()` so all three columns still fit at 320px rather than scrolling.
- **Inquiry form** sits on a light band inside `data-bs-theme="light"`. That is
  the Bootstrap 5.3 way to invert one region — the document stays dark, but
  form controls resolve against light-mode variables. Without it the inputs
  render dark-on-light.

The design's checkbox label uses "Gill Sans Nova" from an imported UI kit
rather than the Leonard type system; it is set in the Leonard mono instead.

Palette read from the file's Local variables, so these are exact.

| Figma variable    | Hex       | Bootstrap  |
| ----------------- | --------- | ---------- |
| `LEONARD/dk grey` | `#002529` | `$dark`    |
| `LEONARD/grey`    | `#425057` | `$secondary` |
| `LEONARD/Lt grey` | `#d8dfe5` | `$light`   |
| `LEONARD/Yellow`  | `#ffdb00` | `$primary` |

The relume file adds one colour outside this palette: `color/neutral-lightest`
`#eee`, as `$leonard-neutral-lightest`. It is **not** a theme colour, so it has
a single `.bg-neutral` background utility (the partners band); the one place it
is a *text* colour — the statement headline — is a plain
`.leonard-statement__title` rule instead.

That distinction is deliberate. **Every Bootstrap utility carries
`!important`** (`$enable-important-utilities`), so reach for one only when it
genuinely has to beat something. The headline had no competing colour
declaration at all — it was merely *inheriting* `--bs-body-color` (`#d8dfe5`),
because Bootstrap's `$headings-color` is `inherit`. A class rule outranks
inheritance on its own, so no `!important` is warranted.

The general rule for this project: a heading that needs a specific colour gets
it from a component rule; utilities are for overriding, not for setting.

### Typography — both families are now real

- **Gilroy-Heavy** — display type. Self-hosted `gilroy-heavy.woff2`, converted
  with fontTools from the licensed OTF. Only Heavy is used, so only Heavy ships.
- **Input Mono / Input Mono Narrow** — everything else, from the client's Adobe
  Fonts kit: `<link rel="stylesheet" href="https://use.typekit.net/djc8uke.css">`
  in each page `<head>`, with a `preconnect` alongside it.

| Family | Weights in the kit | Used for |
| --- | --- | --- |
| `input-mono` | 100, 300, 400 | body, eyebrows, tables, forms; Thin for the "+" ticks |
| `input-mono-narrow` | 300, 400 | nav links and all `.btn` labels |

Adobe serves lowercase slugs, so the CSS family names are `input-mono` /
`input-mono-narrow` — **not** "Input Mono". They are wired through
`$font-family-mono-ui` and `$font-family-mono-narrow` in `_tokens.scss`; nothing
else references them directly, apart from `.leonard-nav .nav-link` (narrow) and
the `.font-mono` / `.font-mono-narrow` utilities.

The earlier Martian Mono stand-in is gone — no self-hosted mono file remains.

**The navbar now expands at `xl` (1200px), not `xxl`.** Real Input Mono Narrow
is enough narrower than the old stand-in to buy one breakpoint, but measurement
showed it still does not fit at `lg`: at 992px the expanded bar needs 973px of
content in a 933px bar. `navbar-expand-xl` fits exactly at 1200. If the nav ever
loses an item, re-measure before dropping it further — and keep the mega-menu's
`media-breakpoint-up(xl)` block in sync with whatever the navbar expands at, or
the panel floats while the bar is still collapsed.

### Icons — Font Awesome kit

`<script src="https://kit.fontawesome.com/462bc6ee41.js" crossorigin="anonymous">`
in each page `<head>`. Pro 7.3.1, and the kit is configured **`method: "css"`**
(webfont), not SVG-JS — see the testing note below, it changes how you verify.

| Class | Family / style | Where |
| --- | --- | --- |
| `fa-light fa-magnifying-glass` | Classic Light | header search (Figma specifies Light) |
| `fa-solid fa-play` | Classic Solid | "Watch full video" |
| `fa-solid fa-caret-right` | Classic Solid | the caret in button labels |
| `fa-brands fa-linkedin` | Brands | footer |

The caret replaced ten literal `>` characters in button labels plus three
exported arrow SVGs on the homepage. The design's arrow is a filled triangle,
which is `caret-right` (U+F0DA) — not a chevron or an arrow. Buttons follow the
design's pattern: **primary/yellow buttons carry the caret, outline ones do
not.** The larger homepage carets use `fs-4` (24px) to match the drawn size.

**Two icons are deliberately not Font Awesome:** the "Make an inquiry" square
arrow (a brand mark matching the wordmark's O) and the five feature icons — both
stay as exported SVGs. The mobile hamburger stays Bootstrap's own
`.navbar-toggler-icon`, which is CSS-only: the FA kit is a script, and a
critical nav control should not depend on it having loaded.

**Do not use `fa-lg`.** It sets `line-height: .05em`, which collapses the icon
to 1px tall inside the flex buttons here. Size with `fs-*` instead.

**Testing a CSS-mode kit:** it does *not* replace `<i>` with `<svg>`, so
`document.querySelectorAll('svg.svg-inline--fa')` returns 0 and
`window.FontAwesome` is undefined — neither means the kit is broken. Check the
`::before` `content` on the `<i>` instead; an unavailable icon resolves to an
empty string.

## Traps already hit — read before editing

**Row gutters vs container padding.** A `.row`'s negative inline margin is half
the gutter. If that exceeds the parent's horizontal padding, the page overflows.
`$grid-gutter-width` is set to `2.75rem` (44px) precisely so `.container-*`
padding (22px) equals the row's negative margin, matching Figma's 21.5px inset.
Consequences: don't use `g-5`/`gx-5` on a row whose parent has less than 24px of
padding, and keep band padding at `p-4` (24px) or more when it contains a row.
This bug appeared twice.

**Bootstrap heading colour.** `h1`–`h6` get `--bs-heading-color`, which beats a
colour inherited from a band and renders text invisible on light bands. The
display classes are used on headings throughout; set colour explicitly.

**`.text-secondary` is the brand grey `#425057`, not a theme-aware muted.** In
this build `.text-secondary` resolves to `--bs-secondary-rgb` (66,80,87 =
`#425057`, the LEONARD grey), a fixed value — so it is legible on light bands
but only ~1.7:1 on the dark page (`#002529`), i.e. illegible. For muted **meta
text on dark bands** (dates, testimonial roles, "last updated", read-time,
filter labels) use **`.text-body-secondary`**, which is theme-aware
(`--bs-secondary-color` = `rgba(216,223,229,.75)` on dark, a dark muted on
light). This bit the article "Published on …" line. The **only** place
`.text-secondary` is correct is a light band that does *not* also carry
`data-bs-theme="light"` — the homepage "One solution" (Descender) block, where
`#425057` on `#d8dfe5` reads fine. Everywhere else on the dark document uses
`.text-body-secondary`.

**Trimming Bootstrap imports breaks components silently.** `styles.scss` had no
`bootstrap/scss/dropdown`, so `.dropdown-menu` had no `display: none` and both
mega panels rendered permanently on top of the hero — while the JS `.show`
toggle appeared to do nothing. If a component behaves as if its JS is dead,
check its partial is imported before debugging the JS.

**`.show` lives on the toggle, not the `<li>`.** That is Bootstrap 5 (v4 put it
on the parent `.dropdown`), so style the open nav item via `.nav-link.show`.

**`text-uppercase` on a nav `<ul>` cascades into its dropdown panels**, which
shouted the product descriptors that are title case in the design. Uppercase
the links, not the list.

**Navbar theming in 5.3.** The base `.navbar` takes its colours from the
`$navbar-light-*` variables (via `--bs-emphasis-color`), *not* `$navbar-dark-*`
— the dark-theme block only re-declares the toggler icon. Set the **light**
variables even though this bar is dark.

**RFS reference width.** RFS defaults to a 1200px reference, but this design is
drawn at 1728. Left at the default, display type stayed far too large on phones
("INFRASTRUCTURE," alone overran a 320px viewport). `$rfs-breakpoint: 1728px`
aligns it with the canvas.

**Utilities carry `!important`.** A custom `max-width` utility on an `<img>`
beats `.img-fluid`'s `max-width:100%` and pins the image wider than its column.
`_utilities-custom.scss` therefore has no px values in its max-width set.

**RFS has no per-size floor.** Product names on the Products page are 140px and
sit in a narrow left column, and "DESCENDER" is one unbreakable word — RFS did
not scale it far enough at the small end and the block was clipping it on a
phone. `.leonard-product__name` uses an explicit `clamp()` instead. This is the
one place a clamp beats the display scale; prefer `.display-*` elsewhere.
(Overflowing the *column* at desktop is intentional — the name runs across the
product render, as drawn. Only clipping by the block was the bug.)

**`ch` units resolve against the element's own font-size.** A `max-width` in
`ch` on a *wrapper* is sized by the wrapper's 16px, not the 48px heading inside
it. Put `ch` measures on the text element itself.

**`aspect-ratio` + `min-height`.** The browser transfers a minimum height back
into the *width*, which blew the hero out to 795px inside a 390px viewport.
Change the ratio per breakpoint instead (`.leonard-hero-ratio`).

### Verifying responsive behaviour

Old headless Chrome (`--window-size=390`) will not lay out below the macOS
minimum window width — it renders wider and clips the screenshot, which looks
exactly like a CSS bug. Drive `Emulation.setDeviceMetricsOverride` over CDP
instead.

For full-page screenshots, force `loading="lazy"` images to `eager` and poll
until `document.images` are all `complete`. `captureBeyondViewport` does not
trigger lazy loading, so below-the-fold images capture blank and look like
broken assets — they are not.

The useful overflow check is per-element: find elements where
`scrollWidth > clientWidth` **and** `overflow-x` is visible, skipping anything
inside a clipping ancestor. Comparing bounding rects to the viewport alone
reports the marquee and watermark as false positives.

Current state: **zero content or page overflow at 320 / 360 / 390 / 414 / 768 /
1024 / 1280 / 1400 / 1600 / 1728 / 1920px**, reviewed visually at 390 and 1728.

## Copy typos carried over verbatim

These are in the Figma source and were **not** silently corrected, because the
copy is the client's. Worth raising before launch:

| Rendered                 | Probably meant             |
| ------------------------ | -------------------------- |
| `REFACTORY INSTALLATION` | REFRACTORY (hero + footer) |
| `ROBOTIC ARM SOLTUTIONS` | SOLUTIONS                  |
| `FASTER DEPLYOMENT`      | DEPLOYMENT                 |
| `proven to to be safer`  | proven to be               |

## Figma access

`Leonard.fig` is local, so the **desktop** MCP server is the right one:
`figma-desktop` -> `http://127.0.0.1:3845/mcp` (enable via Dev Mode -> Inspect
panel -> "Enable desktop MCP server"). The remote server `plugin:figma:figma`
shows "Needs authentication" and is unused.

- MCP tools load at session start; adding a server mid-session needs a full
  restart of Claude Code.
- On macOS the toggle is **not** under menu-bar `Figma -> Settings`. It's in Dev
  Mode's Inspect panel, or the in-window Figma logo menu -> Preferences.
- Needs a Dev or Full seat on a paid plan.
- `get_metadata` on a whole page blows the token limit and spills to a file you
  then parse. Go straight to a known node id where you can.
- Asset URLs (`http://localhost:3845/assets/...`) only serve while Figma is
  running with the file open. Download them, don't reference them.

## Known gaps

- The one-solution band's empty lower-right is what the design does.
- "WATCH FULL VIDEO" links to `#video`; no video is wired up.
- Most social/pagination/video links are still `#` fragments by design
  (`#linkedin`, `#x`, `#facebook`, `#astutely`, `#video`, `#page-*`, `#prev`,
  `#next`, `#project`, `#article`, `#office-*`, `#datasheet`, `#downloads`,
  `#website`). These have no destination page and are intentional placeholders.
- The news/case-studies **filter bars** and news/search **pagination** are
  visual only — no filtering or paging is wired.
- The header **search icon** links to **`/search-results.html`** — a results
  page modelled on a standard search layout: a **full-bleed corner-ticked header
  band** (`bg-dark-deep`, the statement/CTA motif — no photo, since a search page
  doesn't warrant the tall `.leonard-hero-ratio`) holding the title, intro and
  the search field; then a **hairline-separated list of hits** (`.leonard-result`
  — section label / title / excerpt / "read more") in a centred reading column;
  then pagination + the shared CTA. `.leonard-result` is the only new component; the hits link to
  real pages, but the **search field and pagination are not wired to a backend**
  (the query, count, and results are static placeholders). Registered in
  `vite.config.js` as `search-results`.

### Detail-page variants (products / services / industries)

Each detail template now has one real page per listing item, named by slug:

| Template file (base) | Slug siblings |
| --- | --- |
| `product.html` (Axis) | `product-nano`, `-descender`, `-charger`, `-calibre` |
| `service.html` (Robotic Arm) | `service-refractory-installation`, `-confined-space`, `-media-grading` |
| `industry.html` (Cement & Lime) | `industry-aluminium`, `-waste-to-energy`, `-power-generation` |

The base file keeps its original item; the siblings are clones with only the
**identifying** fields swapped (`<title>`, hero eyebrow/H1/render or photo, the
statement/intro copy pulled from the listing page, section heading, and the
"Enquire about …" heading). The **shared lower sections** (spec table, stats,
"our approach"/capabilities, projects, testimonials, quote, enquiry form) are
deliberately left as generic Leonard content — they read fine but are not yet
bespoke per item. Each listing page's "Discover"/"Find out more" button links to
its matching sibling; the mega-menus still deep-link to the **listing** sections
(`/products.html#axis`), which is intentional. Register every new sibling in
`vite.config.js`.

- `about.html` — sourced from gleonard.com (30+ years, UK/Ireland, the
  Planning · Organisation · Preparation · Installation approach, global reach),
  rebuilt in our style. Opens with the **Latest-News hero** (the no-photo
  `.leonard-hero-ratio--screen` band, copy pinned bottom-left), then a **pinned
  photo band** — the homepage `.leonard-reveal` pattern: the full-bleed photo is
  `position: sticky` (z 0) and the stats / how-we-work / story ride up over it
  in the opaque covering block (z 1). Reached from the footer Company column and the
  `#about` CTA buttons — **not** added to the header nav, which is measured to
  fit exactly at `xl` and would break with another item. Uses `.bg-dark-deep`
  (the deep-green `$leonard-dk-grey-deep`, added to the background-color utility
  values) for the "how we work" band — whose 4-col grid uses `gy-5` (not `g-5`,
  which overflowed 2px: a 24px negative row margin against 22px container
  padding — the gutter trap).
- `privacy.html` — standalone Privacy Policy (was sharing the Terms template);
  footer, mobile menu, and Terms §5 now point at it. Like Terms, it is a
  template and not legal advice.
- The partner marquee is one exported screenshot strip, not individual logos,
  because that is how it exists in Figma. Real logo files would be better.

  The strip is on a white background and is knocked back with
  `mix-blend-multiply` so the white becomes the band colour (`#eee`,
  `.bg-neutral`). **A blend needs a backdrop inside its own stacking context**, and
  both the mask on `.leonard-marquee` and the animation on the track create
  one — so the logos rendered on white until the band colour was painted on
  `.leonard-marquee__track` itself. If the band colour ever changes, change it
  in both places or the white returns.

  **The loop is two identical `.leonard-marquee__group`s and the track travels
  exactly one group** (`translateX(-50%)`), so the frame it restarts on is the
  frame it left — verified byte-identical at progress 0 and 1.

  Each group is **three** strips, and it has to be: the strip's height is capped
  at the drawn 81px so it stops widening at 1050px, while the band is full-bleed
  and keeps growing with the viewport. Two strips total left 678px of empty band
  at the end of every cycle at 1728 — logos visibly flashing in and out. Group
  width is now 2022–3150px against a band of 390–2560, positive headroom
  throughout. Add a fourth strip per group above ~3150px.

  Duration is **135s, not 45s**, purely because the travel is now a three-strip
  group: 14.98 / 18.91 / 23.33 px per second at 1024 / 1400 / 1728, identical to
  before. Change the strip count and the duration must move with it or the speed
  changes.

## Services page (relume `10203:36389`)

Built new (`services.html`, registered in `rollupOptions.input`). Reuses the
homepage/products components throughout — hero (`v2-services-hero` + scrim),
statement (with the `.leonard-statement__mark`), stats count-up, testimonials,
the photo CTA, newsletter. Two things specific to it:

- **"Home safe, every day"** — a full-bleed yellow band (like stats): heading,
  copy, a `■`-bulleted list (each `<li>` is a `.leonard-eyebrow`, which gives
  the square marker for free), `Safety` + `Contact us` buttons, and the
  hard-hat photo. `Safety` is the green `.leonard-btn-lt`.
- **Four service rows** (`#refractory-installation`, `#robotic-arm-demolition`,
  `#confined-space`, `#media-grading` — deep-linked from the Services mega-menu)
  alternate photo/copy via `order-lg-1/2`; below `lg` the order is dropped so
  every row stacks copy-then-photo. Each has `Find out more` + `Contact us`.

The service/safety photos are the one place with rounded corners
(`.leonard-media-round`, 24px) — Bootstrap's radii are all zeroed for the sharp
industrial look, so this is a deliberate one-off, not a site-wide change.

Placeholder to confirm before launch: the Services mega-menu still has **two
duplicate "Refractory Installation Services" cards** (the design's 6-card grid
over 4 real services) — they point at the page root rather than an anchor.

## Service detail (relume `10204:57140` → `service.html`)

The Services "Find out more" buttons all link here (one template, populated with
Robotic Arm Demolition — the hero title is a `Service title goes here`
placeholder in Figma, populated the way `product.html` was populated with Axis).
Reuses hero / statement (+ mark) / stats / testimonials / enquiry form. New
content: an intro two-col ("Precision lining systems…"), an **"Our approach"**
2×2 feature grid (photo left, four icon items), a **capabilities** list (three
icon items + photo right), and a **"Projects in the kill zone"** three-card grid
(photo + copy + `.leonard-tag` chips + View project). Feature icons are Font
Awesome stand-ins for the Figma Material Symbols. "Kill zone" is the source copy
(not "kiln") — confirm with the client.

## Case Studies (relume `10204:117483` → `case-studies.html`)

Listing: hero, a **filter bar** (`Filter by` + View all / Cement / Metals /
Energy / Robotics — visual only, no filtering wired), three **`.leonard-case`
rows** (hairline-separated, `Case study 0N` + title + Type/Solution meta +
square thumbnail, whole row links to `/case-study.html`), then shared stats /
testimonials / CTA. Two of the three row titles are Figma placeholders ("Second
case study title", "This is the third…").

## Case study detail (relume `10204:118064` → `case-study.html`)

Long-form article. The opening is now the **news-style dark hero**
(`.leonard-hero-ratio--screen`, no photo, fills ~one screen) holding the eyebrow,
title, Type/Solution meta and intro pinned bottom-left; the wide project photo
follows below it. Then heading/copy blocks (heading `col-lg-4`, body
`col-lg-7 offset-lg-1`) with
full-width photos and a two-up gallery between them, a **pull quote** (dark band
with corner ticks, Martin Rogan / Lisahally Power Plant), and the enquiry form.
The first block carries a `.leonard-detail` list (Client / Date / Role /
Website, yellow labels). **Body copy is Lorem ipsum in the source and reproduced
as such** — real case-study copy is the obvious pre-launch fill-in.

## Industries (relume `10204:120627` → `industries.html`)

Listing: hero, then **five alternating photo/copy rows** — Cement & Lime,
Aluminium, the yellow **"Home safe, every day"** band (same as Services'),
Waste-to-Energy, Power Generation — then shared stats + CTA (no testimonials or
newsletter on this one). Rows use the same `order-lg-1/2` alternation as the
Services rows and `.leonard-media-round` photos; anchors `#cement-lime` …
`#power-generation` are deep-linked from the Industries mega-menu. "Find out
more" on each row goes to `/industry.html`. Power Generation's body copy is a
Figma placeholder (media-grading text) — confirm before launch.

## Industry detail (relume `10204:121873` → `industry.html`)

Populated with Cement & Lime (the hero title is the industry name — swap per
industry, like the product/service templates). Hero → **Challenges** (intro +
three icon feature items, service-detail pattern) → furnace photo → **Specialist
maintenance** three-card grid → **"What you gain"** yellow band → pull quote
(shared with the case study) → enquiry form. The "What you gain" band is a
`.leonard-outcomes` list (Faster shutdowns / Extended campaigns / Lower costs /
Certain delivery, first row caret-marked) beside a featured "Zero personnel
entry…" block — the Figma tabs behaviour is **not wired**; it's static.

## News (relume `10204:123460` → `news.html`)

Latest-news index: a **dark hero with no photo** — `.ratio.leonard-hero-ratio`
with `bg-dark` in place of an image, copy pinned bottom-left. It carries the
**`.leonard-hero-ratio--screen`** modifier so the hero fills roughly one screen
(min-height `calc(100svh - 8rem)`, aspect spacer dropped) and the page opens on
the hero with the filters below the fold; the filter section uses `pt-7` for a
clear gap. (The case-study single hero clones this exact pattern.) Note `mw-hl`
goes on the `<h1>`, never the wrapper — on a 16px wrapper the `ch` unit collapses
it to ~320px (this bit once). Then a filter bar (View all / Category one–four,
visual only), a **Bootstrap block grid** of nine article cards
(`row row-cols-1 row-cols-sm-2 row-cols-lg-3`), a visual `.leonard-pages`
pagination (Prev / 1·2·3 / Next), and the newsletter. Cards reuse `.leonard-card`
(so the image-zoom + yellow-rule hover comes for free): a `ratio-4x3` photo, a
`.leonard-tag` category + date, an uppercase title, and a "Read more" link. All
nine are placeholder content cycling three templates (News / Case study /
Insights) and three photos; the "Latest News" nav item and footer "News" link
here.

## Article template + WYSIWYG prose (relume `10204:124285` → `article.html`)

The news-article detail page: header (breadcrumb, category chip + read-time,
title, published date), hero image, the **prose body**, "Share this post",
related-news cards, and a CTA. Every news card / "Read more" links here.

The body is a single **`.leonard-prose`** column that styles **raw, class-less
HTML** the way a WordPress editor emits it — so a content team pastes from the
WYSIWYG and it just works, no utility classes. It covers headings (h2–h6, yellow
Gilroy uppercase), paragraphs, `strong`/`em`, links, `ul`/`ol` (yellow markers —
see below), `blockquote` (yellow rule + `cite`), `table` (yellow header row; wrap it in
`.table-wrap` for mobile scroll), `figure`/`figcaption`, `code`/`pre`, `hr`, and
the editor **alignment classes**:

- `alignleft` / `alignright` — float with text wrap at `sm`+; **stack full width
  below `sm`** (a float there just leaves a sliver).
- `aligncenter` — centred block.
- `alignwide` / `alignfull` — break out past the reading measure by
  `--leonard-prose-bleed` (0 below `lg`, `4rem` at `lg`+). The break-out makes
  the column's `scrollWidth` exceed its `clientWidth` at `lg`+ — that is the
  intended effect and is absorbed by the container gutters (**zero page
  overflow**, verified 320–1920), so don't "fix" that per-element flag.

**List markers are drawn manually, not native.** `ul`/`ol` are `list-style:
none` with the marker as an absolutely-positioned `::before` (bullet, or an `ol`
`counter`) at `left: 0`, text hanging at `padding-left: 1.75rem`. Native
`list-style: outside` right-aligns the marker to the text edge, so a `•` and a
`1.` start at **different** x and a `ul` and an `ol` read as mis-indented against
each other — the text edges line up but the markers drift (measured: identical
`textLeft`, only the glyph offset differed). The manual marker gives both an
identical hanging indent, marker and text at the same x for both list types.

`article.html`'s body is a worked example exercising all of the above; duplicate
the page and replace the prose with real post content.

## Contact (relume `10204:119280` → `contact.html`)

Centred hero ("Start the conversation"), a portrait band, the **"Get started"
enquiry form**, a **"Direct lines"** three-column contact block
(email / phone / office, FA icons), **"Where we work"** (three offices as
`.leonard-case` rows + a map image), and a CTA. The header's **"Make an inquiry"**
button links here (was `#inquiry`).

- **The form is `.leonard-form.leonard-form--dark`.** `$input-bg` is a hard white
  Sass value (right for the enquiry forms that sit on light bands), so a form on
  the *dark page* needs the `--dark` modifier: transparent fields, hairline light
  borders, yellow focus + checked marker, and a light select caret. Use it for
  any form placed directly on the page rather than inside `data-bs-theme="light"`.
- The portrait's name card ("Brian Smith / Refractory Specialist") is **baked
  into the placeholder image** — don't add an overlay, it would duplicate.
- Placeholder to confirm: the Dallas and Singapore offices carry New-York and
  London addresses in the Figma source; only the phone number (`+61…`) and the
  Cookstown address are real-ish.
- Hero centring: `mw-hl` on the `<h1>`, never the wrapper (the `ch`-collapse
  trap) — same as the news hero.

## Utility pages (not in Figma — designed on brand)

- **`terms.html`** — Terms & Conditions. The **shared full-bleed corner-ticked
  header band** (`bg-dark-deep`, centred — same as `search-results.html` /
  `privacy.html`) over the `.leonard-prose` WYSIWYG body in a centred
  `col-lg-10 col-xxl-8` column (same measure as the article), so long legal text
  stays legible. **The copy is a standard template, not legal advice** — the
  client's solicitor must review it before launch. The footer "Terms &
  Conditions" link and every form's "I accept the Terms" link now point here
  (`/terms.html`). `privacy.html` uses the same header band.
- **`404.html`** — centred not-found page: big `.display-stat` "404" in yellow,
  "Page not found", a line of copy, Back-to-home / Contact-us buttons, and a row
  of section links. Vite emits it as `dist/404.html` for hosts to serve on a
  missing route.
- **Footer content pages** — `faqs.html` (a `.leonard-faq` Collapse accordion,
  same +/− idiom as the mobile menu), `health-safety.html` (reuses the "Home
  safe" yellow band + a `.leonard-prose` section), `certifications.html` (a
  `.leonard-quote`-card grid + the ISO/Avetta badge strip), `partnerships.html`
  (reuses the partners marquee + prose). All four close with the shared
  **`partials/cta.html`** ("Talk to our engineering team").
- **Link wiring** — every footer link now resolves: FAQs / Health & Safety /
  Certifications / Partnerships → their pages, Discover → `/news.html`, Terms &
  Privacy → `/terms.html`. Sitewide, `#safety` → `/health-safety.html`,
  `#inquiry` → `/contact.html`, and the header "Make an inquiry" → `/contact.html`.
  Remaining `#` fragments are deliberate placeholders only: social share
  (`#linkedin`/`#x`/`#facebook`), `#astutely`, `#video`, pagination
  (`#page-*`/`#prev`/`#next`), article/project links (`#article`/`#project`),
  office map anchors, product `#datasheet`/`#downloads`, and `#about` (no About
  page exists).

## Next steps

1. Confirm the copy typos above, then fix them in `index.html`.
2. Duplicate the product / service / case-study / industry / article detail
   templates for their real variants (only one of each is populated). Register
   each in `rollupOptions.input`.
3. Fill in the real Services mega-menu imagery/titles (still the old
   `service-1…6.webp` set with two duplicate cards).
