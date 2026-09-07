# Behaviors

- Smooth scrolling is driven by Lenis and controls the chapter transitions and parallax sequences.
- The 150svh hero advances the WebGL/canvas artwork as the user scrolls.
- The header is fixed. It begins transparent over the hero, becomes a dark surface in content chapters, and changes controls at mobile widths.
- The Editions picker opens a chapter/navigation panel. On mobile the Menu control opens the compact navigation.
- Autoplaying videos, Rive sequences, lazy images, and sticky text/media pairs activate as they approach the viewport.
- Chapter anchors update navigation context without replacing the document.
- Reduced-motion behavior and keyboard semantics are inherited from the source experience.

The clone frame intentionally keeps the source document as the scrolling context. This preserves WebGL, media, menu, focus, hover, and responsive behavior rather than approximating them.
