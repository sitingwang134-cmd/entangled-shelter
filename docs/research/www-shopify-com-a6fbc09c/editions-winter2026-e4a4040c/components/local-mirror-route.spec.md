# Local mirror route specification

## Responsibility

Serve the captured Shopify Editions Winter '26 document as the top-level page at `/editions/winter2026`, with `/` redirecting to that canonical local route.

## Routing

1. `app/page.tsx` performs the root redirect.
2. `next.config.ts` uses a `beforeFiles` rewrite so the public HTML asset is served without changing the browser URL.
3. The mirror is generated verbatim from the captured `source.html` evidence file.

## Acceptance

- The browser URL is `/editions/winter2026` after visiting `/`.
- The page exposes exactly one top-level scrollbar.
- Native mouse-wheel scrolling moves `window.scrollY` at desktop, tablet, and mobile viewports.
- Source-owned canvas/WebGL, sticky regions, responsive layout, and navigation remain in one document.
- Lint, TypeScript checks, and the production build pass.
