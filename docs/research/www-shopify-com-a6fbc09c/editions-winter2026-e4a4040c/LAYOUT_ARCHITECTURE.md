# Layout architecture

`app/page.tsx` redirects the root route to `/editions/winter2026`. A Next.js `beforeFiles` rewrite serves the captured Shopify source document from `public/sites/.../mirror-live.html` at that clean URL.

The captured document is the top-level browsing context, so the browser owns one native scrollbar and wheel, touch, keyboard, sticky positioning, canvas/WebGL, media-query, and accessibility behavior all operate in the same document. This replaces the earlier cross-origin iframe shell, whose nested scroll context did not reliably receive wheel input in the in-app browser.
