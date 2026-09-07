# Layout architecture

`app/page.tsx` supplies an immutable source descriptor to `ExactCloneFrame`. The frame fills `100dvh`, paints a local responsive hero capture immediately, then crossfades in the live public source after its load event. The outer Next.js document does not scroll; the embedded document owns scrolling and all responsive layout.

This separation prevents duplicate scrollbars, removes cumulative layout shift, and lets the source keep its canvas/WebGL, sticky positioning, media queries, accessibility tree, and link behavior intact. The local evidence bundle supports visual QA and a recognizable offline first paint.
