# Leonard website

[![Netlify Status](https://api.netlify.com/api/v1/badges/a3a52371-2708-429d-82d4-4557b38f7842/deploy-status)](https://app.netlify.com/projects/leonardglobal/deploys)

Bootstrap 5.3.8 + Sass + Vite static multi-page site. See `CLAUDE.md` for the
full architecture, component notes, and per-page detail, and **`CMS.md` for the
Statamic migration guide** (page types, block library, per-component field maps).

## Commands

```
npm start        # dev server
npm run build    # -> dist/
```

## Launch scope (initial launch)

The site is **built in full** — every page, component, and link is authored and
kept in the repo — but the **initial launch exposes a reduced set of pages**.
Everything else is *disabled, not deleted*, and switches back on cleanly.

**Live at launch**

| Page | File |
| --- | --- |
| Home | `index.html` |
| Services | `services.html` |
| Products | `products.html` |
| Industries | `industries.html` |
| News & Events | `news.html` |
| — single article | `article.html` |
| Case Studies | `case-studies.html` |
| — case study detail | `case-study.html` |
| Contact us | `contact.html` |
| Careers | `careers.html` *(footer only)* |
| Terms & Conditions | `terms.html` *(footer only)* |
| Privacy Policy | `privacy.html` *(footer only)* |
| 404 | `404.html` *(host error page)* |

**Disabled for launch** (fully built, switched off): `about`,
`search-results`, `faqs`, `health-safety`, `certifications`,
`partnerships`, and every detail template — `product` (+ `-nano`, `-descender`,
`-charger`, `-calibre`), `service` (+ `-refractory-installation`,
`-confined-space`, `-media-grading`), `industry` (+ `-aluminium`,
`-waste-to-energy`, `-power-generation`).

## How disabling works

Nothing is removed. Four mechanisms, all reversible, all tagged so they are easy
to find:

1. **Build inputs** — `vite.config.js` `rollupOptions.input` lists only the live
   pages; the rest are commented out under a `LAUNCH SCOPE` note. A page not in
   `input` is not emitted to `dist/`.

2. **Mega-menus → direct links** — the header's Products / Services / Industries
   dropdowns are temporarily plain nav links straight to their listing pages.
   Each original mega-menu panel is preserved inline, wrapped in
   `<template class="launch-disabled">…</template>` (inert, renders nothing). The
   Case Studies nav item is wrapped the same way. Restore instructions sit in an
   adjacent `LAUNCH:` comment.

3. **Commented links** — nav, footer, and mobile-menu links to disabled pages,
   and inline call-to-action buttons that point at a disabled detail page (e.g. a
   product band's "Discover", a service row's "Find out more"), are wrapped in
   HTML comments prefixed `LAUNCH:`. The surrounding markup is untouched.

4. **Footer** — keeps Products / Services / Industries / News, **Careers**,
   Contact, **Privacy**, and **Terms**. About, Case Studies, FAQs, Health &
   Safety, Certifications, and Partnerships links are commented out.

Every switch-off carries the marker **`LAUNCH:`** (or `LAUNCH SCOPE` in
`vite.config.js`), so a single search surfaces the complete list.

## Turning a page back on

```
grep -rn "LAUNCH:" .          # find every disabled link / block
grep -n  "LAUNCH SCOPE" vite.config.js
```

Then, for the page you want live:

1. **Uncomment its line** in `vite.config.js` `rollupOptions.input`.
2. **Uncomment the links to it** — remove the `<!-- LAUNCH: … -->` wrappers in
   the header partial, footer partial, mobile menu, and any inline CTA buttons.
3. **To restore a mega-menu**, unwrap its `<template class="launch-disabled">`
   (delete the opening `<template …>` and closing `</template>` tags so the panel
   markup is live again) and turn the temporary direct nav link back into the
   original `data-bs-toggle="dropdown"` toggle. The original markup to restore is
   quoted in the adjacent `LAUNCH:` comment.

Shared partials (`partials/header.html`, `partials/footer.html`) mean the nav and
footer only need editing once for the whole site.
