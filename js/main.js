import "../scss/styles.scss";

// Import only the Bootstrap JS the design actually needs.
// Collapse — the mobile navbar. Dropdown — the Products/Services mega-menus,
// which open on click (hover only affects the cards inside them, in CSS).
import Collapse from "bootstrap/js/dist/collapse";
import Dropdown from "bootstrap/js/dist/dropdown";
import Offcanvas from "bootstrap/js/dist/offcanvas";

// AOS (Animate On Scroll) — drives the graceful content fade-ins. Elements
// opt in with `data-aos` attributes; initReveal() also auto-tags the columns of
// each row so the whole site gets the reveal without hand-editing every page.
import AOS from "aos";
import "aos/dist/aos.css";

// GLightbox — click-to-play video (and image) lightbox, used by the News video
// cards. Industry-standard, dependency-free; auto-detects YouTube/Vimeo, traps
// focus, closes on ESC/backdrop, and stops playback on close. Beats a bespoke
// modal for a11y and for not shipping a player we'd have to maintain.
import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";

// GSAP + ScrollTrigger — drives the homepage feature section: pin it and reveal
// the features one at a time as you scroll (initFeatureSteps). Industry-standard
// for scroll-pinned sequences; free as of 2025.
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
// ScrambleTextPlugin — the "decode" reveal on titles. A GSAP bonus plugin, free
// since GreenSock went fully free; ships in the `gsap` package.
import ScrambleTextPlugin from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

// Lenis (Studio Freight) — the industry-standard smooth-scroll, paired with
// GSAP ScrollTrigger. It smooths the *native* scroll (no wrapper transform), so
// the sticky header, sticky photo band, CSS scroll-timelines and fixed overlays
// all keep working — unlike a transform-based smoother.
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// ---------------------------------------------------------------------------
// Sticky nav: hide on scroll down, reveal on scroll up
// ---------------------------------------------------------------------------
// The pinning itself is CSS (`position: sticky`); this only decides when the
// bar should be out of the way. Rules:
//
//   * ignore jitter below a few px, so a trackpad twitch doesn't flap it
//   * never hide near the top of the page — there is nothing to reclaim yet
//   * never hide while a mega-menu is open, or the panel would fly off screen
//   * never hide while focus is inside the header, which would strand a
//     keyboard user on an invisible control
//
// Reads are batched into a rAF so the scroll listener itself stays cheap.


// ---------------------------------------------------------------------------
// Stat count-up
// ---------------------------------------------------------------------------
// Each stat carries its real value as text, so it is correct with no JS at all
// and for anyone who prefers reduced motion — the animation only ever replaces
// a number that is already there. Runs once, the first time it scrolls into
// view, then stops observing.

const COUNT_S = 2; // seconds

function initCountUp() {
  const stats = document.querySelectorAll("[data-countup]");
  if (!stats.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Drive the count with a GSAP tween of a proxy value rather than a hand-rolled
  // rAF loop: GSAP runs on the shared, Lenis-synced ticker and its `snap` rounds
  // the value every frame, so the digits step cleanly. `power2.out` is the
  // counter-standard ease: a fast start (so it never "holds" on the small stats'
  // low integers, which read as harsh on an ease-in) into an even, smooth
  // deceleration that settles on the final value without stalling at the end.
  const run = (el) => {
    const target = Number(el.dataset.countup);
    if (!Number.isFinite(target)) return;
    // Optional suffix (e.g. "+") kept on every frame — the count-up overwrites
    // the whole text node, so a suffix baked into the markup would be lost.
    const suffix = el.dataset.countupSuffix || "";
    const counter = { val: 0 };
    el.textContent = "0" + suffix;
    gsap.to(counter, {
      val: target,
      duration: COUNT_S,
      ease: "power2.out",
      snap: { val: 1 },
      onUpdate: () => {
        el.textContent = String(Math.round(counter.val)) + suffix;
      },
      onComplete: () => {
        el.textContent = String(target) + suffix;
      },
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        run(entry.target);
      }
    },
    { threshold: 0.6 }
  );
  stats.forEach((el) => io.observe(el));
}

const HIDE_CLASS = "leonard-header--hidden";
const JITTER = 6; // px of movement to ignore
const KEEP_VISIBLE_UNTIL = 140; // px from top before hiding is allowed

function initStickyNav() {
  const header = document.querySelector(".leonard-header");
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const delta = y - lastY;
    if (Math.abs(delta) < JITTER) return;

    const menuOpen = !!header.querySelector(".dropdown-menu.show");
    const holdsFocus = header.contains(document.activeElement);

    if (delta > 0 && y > KEEP_VISIBLE_UNTIL && !menuOpen && !holdsFocus) {
      header.classList.add(HIDE_CLASS);
    } else if (delta < 0) {
      header.classList.remove(HIDE_CLASS);
    }
    lastY = y;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  // Opening a menu or tabbing into the bar must always bring it back.
  header.addEventListener("focusin", () => header.classList.remove(HIDE_CLASS));
  header.addEventListener("show.bs.dropdown", () => header.classList.remove(HIDE_CLASS));
}

// ---------------------------------------------------------------------------
// Corner "+" tick draw-in
// ---------------------------------------------------------------------------
// The ticks are two strokes (see _custom.scss). This adds `--anim` (which sets
// them to zero-scale) then `is-drawn` the first time each set scrolls into view,
// so the "-" wipes in and then the "|". Progressive enhancement: without this
// the ticks are the finished "+", and it is skipped entirely under reduced
// motion. Runs once per set, then unobserves.

function initCornerDraw() {
  const sets = document.querySelectorAll(".leonard-corners");
  if (!sets.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  // Fire as each set ENTERS view, not at 50% coverage. `.leonard-corners` is
  // inset:0 of its band, so on a tall band (e.g. the homepage "Home safe"
  // statement) 50% is only reached once the top ticks have scrolled off the top
  // — they'd then draw unseen. threshold:0 + a bottom rootMargin triggers a
  // little after the top edge enters, so the ticks are on screen as they draw,
  // on bands of any height.
  //
  // The band (and its columns) also fade in via AOS (~700ms). Firing the draw at
  // the same instant hides it inside the fade, so hold `is-drawn` back until the
  // fade has run — the ticks then draw in as a distinct beat over the settled band.
  const DRAW_DELAY = 750; // > AOS fade duration (700ms)
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        const set = entry.target;
        window.setTimeout(() => set.classList.add("is-drawn"), DRAW_DELAY);
      }
    },
    { threshold: 0, rootMargin: "0px 0px -15% 0px" }
  );

  sets.forEach((set) => {
    set.classList.add("leonard-corners--anim");
    io.observe(set);
  });
}

// ---------------------------------------------------------------------------
// Custom cursor
// ---------------------------------------------------------------------------
// The brand mark follows the mouse and inverts against its backdrop
// (mix-blend-mode lives in CSS). A DOM element rather than a CSS cursor image,
// because CSS cursors can't blend. Only on fine pointers, so touch is untouched.
// Positioning is transform-only inside a rAF, so a flood of mousemoves collapses
// to one write per frame.

const CURSOR_MARK =
  '<svg viewBox="0 0 14.2588 14.4804" aria-hidden="true">' +
  '<path d="M13.2356 0H1.02323L0 1.03753V6.20588L1.01848 7.2402L0 8.27451V13.4445L1.02323 14.4804H13.2356L14.2588 13.4429V8.27451L13.2403 7.2402L14.2588 6.20588V1.03592L13.2356 0ZM9.49532 9.64289H4.76347V4.83751H9.49532V9.64289Z"/>' +
  "</svg>";

const INTERACTIVE = "a, button, .btn, label, summary, select, [role='button'], input, textarea";
const TEXT_FIELD =
  "textarea, input:not([type=checkbox], [type=radio], [type=submit], [type=button])";

function initCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const el = document.createElement("div");
  el.className = "leonard-cursor";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = CURSOR_MARK;
  document.body.appendChild(el);
  document.documentElement.classList.add("leonard-has-cursor");

  let x = 0;
  let y = 0;
  let seen = false;
  let ticking = false;

  const draw = () => {
    ticking = false;
    // The -50% centres the mark's hole on the true pointer position.
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  };

  document.addEventListener(
    "mousemove",
    (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!seen) {
        seen = true;
        el.classList.add("is-visible");
      }
      // A text field wants its own I-beam; everything actionable grows the mark.
      const t = e.target;
      el.classList.toggle("is-text", !!(t.closest && t.closest(TEXT_FIELD)));
      el.classList.toggle("is-active", !!(t.closest && t.closest(INTERACTIVE)) && !(t.closest && t.closest(TEXT_FIELD)));
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(draw);
      }
    },
    { passive: true }
  );

  // Off the window entirely — hide it; bring it back on return.
  document.addEventListener("mouseleave", () => el.classList.remove("is-visible"));
  document.addEventListener("mouseenter", () => {
    if (seen) el.classList.add("is-visible");
  });
}

// Width of the OS scrollbar, measured with a throwaway probe (works regardless
// of the root's current overflow, unlike innerWidth - clientWidth once the
// scrollbar is already gone). 0 on overlay-scrollbar systems.
function getScrollbarWidth() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll";
  document.body.appendChild(probe);
  const w = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  return w;
}

// Homepage intro splash. The CSS keyframes drive the whole sequence; this only
// (a) tears the overlay out when it is not meant to run — no `leonard-intro-on`
// class means no-JS reached the markup, or reduced motion is on (the <head>
// script skips it) — and (b) removes the node and unlocks scroll once the exit
// animation ends, so the finished homepage is left clean with no fixed layer or
// scroll lock lingering. Only present on the homepage.
function initIntro() {
  const root = document.documentElement;
  const intro = document.getElementById("leonardIntro");
  if (!intro) return;

  // Not activated (no JS path / reduced motion): drop it so it can never trap
  // the page, and leave scroll unlocked.
  if (!root.classList.contains("leonard-intro-on")) {
    intro.remove();
    return;
  }

  // The <head> lock (overflow:hidden) removes the scrollbar; without this the
  // page would be laid out wider while locked and then reflow — jumping left —
  // when the scrollbar returns on exit. Padding the root by the scrollbar width
  // holds the content at its scrollbar-present width the whole time. The fixed
  // overlay ignores this padding, so it still covers the full window.
  const sbw = getScrollbarWidth();
  if (sbw > 0) root.style.paddingRight = sbw + "px";

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    intro.remove();
    root.style.paddingRight = ""; // restore in lockstep with the scrollbar
    root.classList.remove("leonard-intro-on"); // restore scrolling
  };

  // The exit (translateY) is the last animation; clean up when it ends.
  intro.addEventListener("animationend", (e) => {
    if (e.animationName === "leonard-intro-exit") finish();
  });

  // Safety net: if animationend never fires (interrupted, animations off),
  // clean up just past the full sequence so the page is never left locked.
  window.setTimeout(finish, 3600);
}

// Page transition — a yellow screen that slides up from the bottom to cover the
// current page on leaving, then continues up and out through the top on the
// arriving page to reveal it. Full-reload MPA, so the two halves live on
// different documents and are stitched together with a sessionStorage flag:
//   leaving  → set flag, run the cover animation, then navigate
//   arriving → a <head> script reads the flag and covers before first paint
//              (`.leonard-pt-arriving`), and here we run the reveal.
// Off under reduced motion (links navigate normally; an arriving page uncovers
// instantly). The panel lives in the header partial. See _custom.scss.
function initPageTransition() {
  const html = document.documentElement;
  const panel = document.querySelector(".leonard-pt");
  if (!panel) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Arriving: play the reveal (the panel is already covering) ---
  if (html.classList.contains("leonard-pt-arriving")) {
    try {
      sessionStorage.removeItem("leonard-pt"); // so a reload doesn't replay it
    } catch (e) {}
    if (reduce) {
      html.classList.remove("leonard-pt-arriving"); // uncover instantly
    } else {
      let done = false;
      const finishReveal = () => {
        if (done) return;
        done = true;
        panel.classList.remove("leonard-pt--revealing");
        html.classList.remove("leonard-pt-arriving"); // reverts panel to hidden
      };
      panel.addEventListener("animationend", (e) => {
        if (e.animationName === "leonard-pt-reveal") finishReveal();
      });
      window.setTimeout(finishReveal, 1000); // safety net
      panel.classList.add("leonard-pt--revealing");
    }
  }

  if (reduce) return; // no cover animation under reduced motion

  // --- Leaving: cover, then navigate ---
  let navigating = false;
  document.addEventListener("click", (e) => {
    if (navigating || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest && e.target.closest("a[href]");
    if (!link) return;
    if (link.target && link.target !== "_self") return; // new tab / frame
    if (link.hasAttribute("download")) return;
    if (link.dataset.noTransition !== undefined) return;
    if (link.getAttribute("data-bs-toggle")) return; // dropdown / offcanvas togglers
    if ((link.getAttribute("rel") || "").includes("external")) return;

    let url;
    try {
      url = new URL(link.href, location.href);
    } catch (err) {
      return;
    }
    if (url.origin !== location.origin) return; // external
    if (url.protocol !== "http:" && url.protocol !== "https:") return; // mailto / tel
    if (url.href === location.href) return; // exact same URL
    // same page, only a hash change → let the browser scroll, no transition
    if (url.pathname === location.pathname && url.search === location.search && url.hash) {
      return;
    }

    e.preventDefault();
    navigating = true;
    try {
      sessionStorage.setItem("leonard-pt", "1");
    } catch (err) {}

    let went = false;
    const go = () => {
      if (went) return;
      went = true;
      window.location.href = url.href;
    };
    panel.addEventListener("animationend", (e2) => {
      if (e2.animationName === "leonard-pt-cover") go();
    });
    window.setTimeout(go, 600); // safety if animationend never fires
    panel.classList.add("leonard-pt--covering");
  });

  // Back/forward from the bfcache can restore this page mid-transition; reset.
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    navigating = false;
    panel.classList.remove("leonard-pt--covering", "leonard-pt--revealing");
    html.classList.remove("leonard-pt-arriving");
    try {
      sessionStorage.removeItem("leonard-pt");
    } catch (err) {}
  });
}

// Scroll reveal, powered by AOS. A graceful opacity fade (`data-aos="fade"` —
// movement-free) as content enters view. We auto-tag the COLUMNS of each
// top-level row (the row is only the trigger; its columns are what fade) and
// the footer link columns, staggering ~100ms per item *within each visual row*
// so a two-column row reads left-then-right, a card grid ripples row by row,
// and the footer columns arrive one after another. AOS itself owns the
// observing, timing and once-only behaviour.
//
// Any element can opt in / override by putting `data-aos` in the markup — the
// auto-tagger skips elements that already have it. To keep it flash-free we only
// tag rows that are entirely below the fold when this runs (off-screen, so
// hiding them is invisible); anything already on screen stays visible. Disabled
// under reduced motion.
function initReveal() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduce) {
    const rows = [];
    const collect = (scope, skip) => {
      if (!scope) return;
      scope.querySelectorAll(".row").forEach((row) => {
        if (skip && row.closest(skip)) return; // e.g. the footer reveal band
        if (row.closest("form")) return; // leave form fields alone
        if (row.parentElement.closest(".row")) return; // top-level rows only
        rows.push(row);
      });
    };
    // Skip the feature section — GSAP (initFeatureSteps) owns its reveal, so AOS
    // must not also hide its columns.
    collect(document.querySelector("main"), ".leonard-feature-section");
    collect(document.querySelector(".leonard-footer"), ".leonard-footer-reveal");

    rows.forEach((row) => {
      if (row.getBoundingClientRect().top < window.innerHeight) return; // in view → no flash
      const items = Array.from(row.children).filter(
        (el) => el.getClientRects().length && !el.hasAttribute("data-aos"),
      );
      if (!items.length) return;
      // Group by visual row (same offsetTop) and stagger 100ms within each, so
      // the delay resets per row instead of piling up down a tall grid.
      const byRow = new Map();
      items.forEach((el) => {
        const key = Math.round(el.offsetTop);
        if (!byRow.has(key)) byRow.set(key, []);
        byRow.get(key).push(el);
      });
      byRow.forEach((group) => {
        group.forEach((el, i) => {
          el.setAttribute("data-aos", "fade");
          if (i) el.setAttribute("data-aos-delay", String(i * 100));
        });
      });
    });
  }

  AOS.init({
    duration: 700,
    easing: "ease-out",
    once: true,
    offset: 80,
    disable: () => reduce,
  });
}

// Smooth scrolling via Lenis, driven off GSAP's ticker with ScrollTrigger kept
// in sync — the setup GSAP and Lenis both recommend. `anchors: true` gives
// smooth in-page #hash jumps. Off under reduced motion (respects the user's
// preference); the page then uses the browser's native scroll.
function initSmoothScroll() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    anchors: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Roll every button's label on hover: wrap the label text in two stacked copies
// inside a clipped one-line window (the CSS rolls them). Also tag the square
// brand mark ("brick", arrow-dark.svg) so it spins 45° — carets are left alone.
// Runs once; skips already-wrapped and icon-only buttons. The alt copy is
// aria-hidden so the accessible name stays a single label.
function initButtonFx() {
  document.querySelectorAll(".btn").forEach((btn) => {
    if (btn.classList.contains("leonard-btn-slide")) return;

    const textNodes = [...btn.childNodes].filter(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
    );
    if (!textNodes.length) return; // icon-only button — nothing to roll

    const text = textNodes
      .map((n) => n.textContent)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const label = document.createElement("span");
    label.className = "leonard-btn-slide__label";

    const main = document.createElement("span");
    main.className = "leonard-btn-slide__text";
    main.textContent = text;

    const alt = document.createElement("span");
    alt.className = "leonard-btn-slide__text leonard-btn-slide__text--alt";
    alt.setAttribute("aria-hidden", "true");
    alt.textContent = text;

    label.append(main, alt);
    btn.insertBefore(label, textNodes[0]);
    textNodes.forEach((n) => n.remove());
    btn.classList.add("leonard-btn-slide");

    const brick = btn.querySelector('img[src*="arrow-dark"]');
    if (brick) brick.classList.add("leonard-btn-slide__brick");
  });
}

// Enerblock-style title reveal on `[data-scramble]`: a solid block wipes in
// left→right over the hidden title, then wipes out the same way to uncover the
// text, which decodes (GSAP ScrambleTextPlugin) in its wake. POC: the homepage
// hero <h1>. The final text stays in the markup (correct with no JS / for SEO)
// and is mirrored into aria-label so screen readers get the real title while it
// scrambles. Off under reduced motion.
//
// The build (and crucially the HIDE) happens immediately on load, so the final
// text never flashes before the reveal — even while the homepage intro is still
// lifting. Only PLAYING the timeline is deferred until the intro lifts (or runs
// straight away on pages without one).
function initScramble() {
  const targets = gsap.utils.toArray("[data-scramble]");
  if (!targets.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Build + HIDE each title immediately so the final text never flashes before
  // the reveal (even during the homepage intro lift). Measuring/playing is
  // deferred until fonts are ready (accurate widths) AND the intro has lifted.
  const setups = targets.map((el) => {
    // Rebuild the title as: a __text wrapper holding one span PER WORD (real
    // spaces kept as text nodes, so line breaks / footprint are preserved and the
    // scramble can't merge words), plus a solid __block overlay for the wipe.
    // Walk the original child nodes so hard line breaks (<br>) — used in several
    // of these titles — are preserved rather than lost via textContent.
    const nodes = [...el.childNodes];
    const textWrap = document.createElement("span");
    textWrap.className = "leonard-scramble__text";
    const words = [];
    let ariaText = "";
    nodes.forEach((node) => {
      if (node.nodeName === "BR") {
        textWrap.appendChild(document.createElement("br"));
        ariaText += " ";
      } else if (node.nodeType === Node.TEXT_NODE) {
        ariaText += node.textContent;
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (/\s/.test(part)) {
            textWrap.appendChild(document.createTextNode(part));
          } else if (part) {
            const span = document.createElement("span");
            span.className = "leonard-scramble__word";
            span.textContent = part;
            textWrap.appendChild(span);
            words.push(span);
          }
        });
      } else {
        // Any other inline element: keep it as-is (not scrambled).
        textWrap.appendChild(node.cloneNode(true));
        ariaText += node.textContent;
      }
    });
    el.setAttribute("aria-label", ariaText.replace(/\s+/g, " ").trim());

    const block = document.createElement("span");
    block.className = "leonard-scramble__block";
    block.setAttribute("aria-hidden", "true");

    el.textContent = "";
    el.append(textWrap, block);
    el.classList.add("leonard-scramble");

    // Hidden state applied NOW — title blank from load until the reveal plays.
    gsap.set(textWrap, { opacity: 0 });
    gsap.set(block, { scaleX: 0, transformOrigin: "left center" });

    return { el, textWrap, block, words };
  });

  // Play ONE title's reveal (measure with fonts loaded, then run the timeline).
  const play = ({ el, textWrap, block, words }) => {
    // Lock the height, and PIN each word to its final rendered width, so the
    // changing scramble characters (proportional glyphs vary in width even at a
    // fixed count) can't shift anything horizontally — no more jumping.
    el.style.minHeight = el.offsetHeight + "px";
    // Size the wipe block to the full content width, so it also covers titles
    // whose text overflows the element (e.g. the big product names).
    block.style.width = el.scrollWidth + "px";
    const widths = words.map((s) => s.getBoundingClientRect().width);
    words.forEach((s, wi) => {
      s.style.display = "inline-block";
      s.style.width = widths[wi] + "px";
    });

    const tl = gsap.timeline({
      onComplete: () => {
        el.style.minHeight = "";
        block.remove();
        words.forEach((s) => {
          s.style.display = "";
          s.style.width = "";
        });
      },
    });

    // 1. Block wipes IN left→right over the (still hidden) text.
    tl.to(block, { scaleX: 1, duration: 0.35, ease: "power2.inOut" });

    // 2. At full cover, reveal the text (still behind the block) and wipe the
    //    block OUT the same way — its left edge retreats right, uncovering the
    //    text left→right — while each word scrambles/decodes in its wake.
    tl.addLabel("reveal");
    tl.set(textWrap, { opacity: 1 }, "reveal");
    tl.set(block, { transformOrigin: "right center" }, "reveal");
    tl.to(block, { scaleX: 0, duration: 0.5, ease: "power2.inOut" }, "reveal");
    words.forEach((span, wi) => {
      tl.to(
        span,
        {
          duration: 0.85,
          ease: "none",
          scrambleText: {
            text: span.textContent,
            chars: "upperCase",
            speed: 0.6,
            tweenLength: false,
          },
        },
        "reveal+=" + wi * 0.08
      );
    });
  };

  // Fire each title as it enters view (once). Titles already on screen when we
  // arm — the heroes — play immediately; section titles further down decode as
  // they scroll in, so the reveal isn't wasted off-screen.
  const playAll = () => {
    setups.forEach((setup) => {
      const rect = setup.el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
        play(setup);
      } else {
        ScrollTrigger.create({
          trigger: setup.el,
          start: "top 85%",
          once: true,
          onEnter: () => play(setup),
        });
      }
    });
  };

  // Play once fonts are ready (so pinned widths are correct) AND any full-page
  // cover has lifted — the homepage intro splash (`leonard-intro-on`) or the
  // page-transition panel on in-site navigation (`leonard-pt-arriving`) — so the
  // reveal is never spent unseen behind one. With no cover it resolves at once.
  const html = document.documentElement;
  const covered = () =>
    html.classList.contains("leonard-intro-on") ||
    html.classList.contains("leonard-pt-arriving");
  const coverLifted = new Promise((resolve) => {
    if (!covered()) return resolve();
    const obs = new MutationObserver(() => {
      if (!covered()) {
        obs.disconnect();
        resolve();
      }
    });
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
  });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.all([coverLifted, fontsReady]).then(playAll);
}

// Open any `.glightbox` link (the News video cards) in the lightbox rather than
// navigating. No-op on pages without one.
function initLightbox() {
  if (!document.querySelector(".glightbox")) return;
  GLightbox({ selector: ".glightbox", autoplayVideos: true });
}

// Video hero (article page): a click-to-play facade. The poster + play badge is
// swapped for an autoplaying YouTube embed on first click, so the heavy iframe
// only loads on demand. Without JS the element is a plain link to the clip.
function initVideoHero() {
  const hero = document.querySelector(".leonard-video-hero");
  if (!hero) return;
  hero.addEventListener("click", (e) => {
    e.preventDefault();
    const src = hero.dataset.videoEmbed;
    if (!src) return;
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = hero.getAttribute("aria-label") || "Video";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    hero.replaceChildren(iframe);
    hero.classList.add("is-playing");
  });
}

// Photo-CTA parallax: the background image of each `.leonard-parallax` box
// drifts vertically as the section passes through the viewport, scrubbed off
// scroll position (smooth under Lenis). The image is oversized in CSS so the
// drift never exposes an edge. Off under reduced motion — the matchMedia tears
// the tween down and clears the transform, restoring the static image.
function initParallax() {
  const boxes = gsap.utils.toArray(".leonard-parallax");
  if (!boxes.length) return;
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const tweens = boxes.map((box) => {
      const img = box.querySelector("img");
      if (!img) return null;
      return gsap.fromTo(
        img,
        { yPercent: -9 },
        {
          yPercent: 9,
          ease: "none",
          scrollTrigger: {
            trigger: box,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
    return () => tweens.forEach((t) => t && t.scrollTrigger && t.scrollTrigger.kill());
  });
}

// Homepage feature section: pin it and scroll through the features ONE AT A TIME
// as you scroll. The stage is masked to a single "slot"; the track (the list,
// with its continuous rail) translates up slot-by-slot, so each feature scrolls
// in, holds to be read, then scrolls up to the next — the rail line connecting
// them, like the original list. A hold at the end before it releases. Only at
// lg+ with motion; gsap.matchMedia() tears it down (restoring the plain,
// fully-visible list) on the mobile / reduced-motion side.
function initFeatureSteps() {
  const section = document.querySelector(".leonard-feature-section");
  if (!section) return;
  const wrap = section.querySelector(".leonard-steps");
  const steps = gsap.utils.toArray(section.querySelectorAll(".leonard-step"));
  const bodies = steps.map((s) => s.querySelector(".leonard-step__body"));
  if (!wrap || steps.length < 2 || bodies.some((b) => !b)) return;

  gsap.matchMedia().add(
    "(min-width: 992px) and (prefers-reduced-motion: no-preference)",
    () => {
      wrap.classList.add("is-active");

      // A body's full height even while collapsed — scrollHeight ignores the
      // clamped height. Re-measured on refresh (resize) so opens stay exact.
      let heights = [];
      const measure = () => {
        heights = bodies.map((b) => b.scrollHeight);
      };
      measure();

      const GAP = "0.85rem"; // title → body gap when open (matches the CSS)
      // Start: the first feature's body open, the rest collapsed to their title.
      gsap.set(bodies, { height: 0, marginTop: 0, autoAlpha: 0 });
      gsap.set(bodies[0], { height: () => heights[0], marginTop: GAP, autoAlpha: 1 });

      const HOLD = 1; // "reading" dwell per open feature
      const TRANS = 0.6; // close-one / open-next
      const tl = gsap.timeline();
      tl.to({}, { duration: HOLD }); // read feature 1
      steps.forEach((step, i) => {
        if (i === 0) return;
        // Close the current, open the next — one accordion open at a time.
        tl.to(bodies[i - 1], { height: 0, marginTop: 0, autoAlpha: 0, duration: TRANS, ease: "power1.inOut" });
        tl.to(bodies[i], { height: () => heights[i], marginTop: GAP, autoAlpha: 1, duration: TRANS, ease: "power1.inOut" }, "<");
        tl.to({}, { duration: HOLD }); // read feature i
      });
      tl.to({}, { duration: 1.4 }); // hold at the end before the section releases

      const st = ScrollTrigger.create({
        animation: tl,
        trigger: section,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * (steps.length + 1) * 0.7)}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefresh: measure,
      });

      // Teardown when leaving this breakpoint / enabling reduced motion.
      return () => {
        st.kill();
        wrap.classList.remove("is-active");
        gsap.set(bodies, { clearProps: "all" });
      };
    }
  );
}

// Test switch — add `?noanim` to the URL (or set localStorage['leonard-noanim']
// = '1') to strip every load/scroll animation and render the final state
// immediately: no intro, no page-transition cover, no title scramble, no AOS
// reveal, no count-up, no parallax. For clean screenshots and layout QA that
// aren't caught mid-animation. Structural/interactive bits still run.
const NO_ANIM =
  new URLSearchParams(window.location.search).has("noanim") ||
  window.localStorage?.getItem("leonard-noanim") === "1";

function init() {
  if (NO_ANIM) {
    // Drop the pre-paint covers the <head> scripts add, and unlock scroll.
    document.documentElement.classList.remove("leonard-intro-on", "leonard-pt-arriving");
    document.querySelector(".leonard-intro")?.remove();
  } else {
    initSmoothScroll();
    initPageTransition();
    initIntro();
    initCountUp();
    initCornerDraw();
    initReveal();
    initFeatureSteps();
    initParallax();
    initScramble();
  }

  // Always on — structural / interactive, no interference with a clean capture.
  initStickyNav();
  initCursor();
  initLightbox();
  initVideoHero();
  initButtonFx();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export { Collapse, Dropdown, Offcanvas };
