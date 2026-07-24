import { defineConfig } from "vite";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

const root = process.cwd();

/**
 * Build-time HTML partials.
 *
 * The header carries four mega-menus and is ~26KB — two thirds of a page — so
 * copying it into every template would mean keeping the nav in sync by hand
 * across every page. This resolves `<!-- #include partials/header.html -->`
 * at build time using Vite's own transformIndexHtml hook, so the output is
 * still plain static HTML with no runtime cost and no extra dependency.
 *
 * Includes resolve recursively so a partial can pull in another one.
 */
function htmlPartials() {
  const INCLUDE = /<!--\s*#include\s+(\S+?)\s*-->/g;

  const expand = (html, seen = new Set()) =>
    html.replace(INCLUDE, (match, file) => {
      const path = resolve(root, file);
      if (seen.has(path)) {
        throw new Error(`Circular #include of ${file}`);
      }
      let partial;
      try {
        partial = readFileSync(path, "utf8");
      } catch {
        throw new Error(`#include target not found: ${file}`);
      }
      return expand(partial, new Set(seen).add(path));
    });

  return {
    name: "html-partials",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => expand(html),
    },
    // Editing a partial should refresh the page in dev, not just the file that
    // happens to import it (nothing "imports" an HTML partial).
    handleHotUpdate({ file, server }) {
      if (file.startsWith(resolve(root, "partials"))) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
  };
}

export default defineConfig({
  plugins: [htmlPartials()],
  css: {
    preprocessorOptions: {
      scss: {
        // Lets stylesheets write `@import "bootstrap/scss/..."` instead of
        // reaching back through ../node_modules
        includePaths: [resolve(root, "node_modules")],
        // Bootstrap 5.3 still ships @import-based Sass; silence the noise
        // until it moves to @use
        quietDeps: true,
        silenceDeprecations: ["import", "global-builtin", "color-functions"],
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        products: resolve(root, "products.html"),
        product: resolve(root, "product.html"),
        "product-nano": resolve(root, "product-nano.html"),
        "product-descender": resolve(root, "product-descender.html"),
        "product-charger": resolve(root, "product-charger.html"),
        "product-calibre": resolve(root, "product-calibre.html"),
        services: resolve(root, "services.html"),
        service: resolve(root, "service.html"),
        "service-refractory-installation": resolve(root, "service-refractory-installation.html"),
        "service-confined-space": resolve(root, "service-confined-space.html"),
        "service-media-grading": resolve(root, "service-media-grading.html"),
        "case-studies": resolve(root, "case-studies.html"),
        "case-study": resolve(root, "case-study.html"),
        industries: resolve(root, "industries.html"),
        industry: resolve(root, "industry.html"),
        "industry-aluminium": resolve(root, "industry-aluminium.html"),
        "industry-waste-to-energy": resolve(root, "industry-waste-to-energy.html"),
        "industry-power-generation": resolve(root, "industry-power-generation.html"),
        news: resolve(root, "news.html"),
        article: resolve(root, "article.html"),
        contact: resolve(root, "contact.html"),
        about: resolve(root, "about.html"),
        "search-results": resolve(root, "search-results.html"),
        terms: resolve(root, "terms.html"),
        privacy: resolve(root, "privacy.html"),
        notFound: resolve(root, "404.html"),
        faqs: resolve(root, "faqs.html"),
        "health-safety": resolve(root, "health-safety.html"),
        certifications: resolve(root, "certifications.html"),
        partnerships: resolve(root, "partnerships.html"),
      },
    },
  },
});
