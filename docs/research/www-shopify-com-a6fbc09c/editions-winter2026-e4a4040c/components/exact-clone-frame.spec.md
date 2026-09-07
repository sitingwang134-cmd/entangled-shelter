# ExactCloneFrame component specification

## Responsibility

Render the Shopify Editions Winter '26 experience edge-to-edge with an immediate local visual fallback and no host-page chrome.

## Inputs

`source: EditionsSource` containing a title, source URL, desktop fallback URL, and mobile fallback URL.

## DOM and states

1. A semantic `main` element fills the dynamic viewport and has an accessible label.
2. A `picture` element contains a mobile source (maximum width 640 px) and desktop image. It is decorative and covers the viewport.
3. A full-size iframe uses the source title, allows autoplay/fullscreen, has no sandbox restriction, and starts transparent.
4. On iframe load, mark the frame loaded and fade it in over 300 ms.
5. After four seconds without a load event, show a compact `role=status` message near the bottom center. Remove it once loaded.

## Styling

- Root: fixed inset zero, black background, overflow hidden, isolate stacking context.
- Fallback: absolute inset zero, 100% width and height, cover, top center.
- Iframe: absolute inset zero, width/height 100%, zero border, black background, z-index 2.
- Load transition must respect `prefers-reduced-motion`.
- Status: black translucent pill, white 13 px text, safe-area-aware bottom offset, non-interactive.

## Acceptance

- No host scrolling or duplicate navigation.
- At 1440×900, 768×1024, and 390×844 the source fills the viewport without gutters.
- The iframe owns all interaction and scrolling.
- The local hero is visible before the remote document paints.
- `npm run build`, lint, and TypeScript checks pass.
