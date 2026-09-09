# Network Audit — Reference Capture

The reference audit identified image, font, script, and media requests needed to understand the public page structure. Production implementation uses local project assets and bundled dependencies; it does not depend on the reference website at runtime.

## Runtime expectations

- Main routes must render with no cross-origin reference assets.
- Fonts are loaded from local WOFF2 files.
- Choice illustrations, chapter art, depth maps, film, and porthole art are served from `public/entangled/`.
- The paper-roll archive bundles Three.js and GSAP locally.
- The generated static output must contain no asset larger than 25 MiB for Cloudflare Pages compatibility.

## Verification

Use the production build, browser console inspection, and static-output size audit before publishing. A failed media request, missing local bundle, or unexpected reference-domain request is a release blocker.
