# Entangled Shelter design direction

- Product goal: help people with choice paralysis decide what to eat, wear, or do for travel through playful chance-based interactions.
- Tone: surreal, editorial, decisive.
- Layout: a narrative landing page leading into three full-viewport category portals and a focused modal choice lab.
- Typography: oversized geometric headlines paired with an expressive editorial serif and script accent.
- Color: black and ivory foundations, with coral for food, ochre for style, blue for travel, and acid green for system actions.
- Motion: real estimated-depth WebGL scenes, a 185svh sticky opening, scroll-scrubbed chapter camera/title transitions, floating 3D playing cards, viewport reveals and tactile game flips. Reduced-motion gets the same content with static composition.
- Signature differentiator: the “possibility collapse” choice lab turns indecision into a theatrical three-step ritual.

Final source assets: all nine images supplied in `C:/Users/admin/Desktop/11`. Originals remain untouched. Local derivative names: station, levitate, salt, room, doorway, angels, hands, atelier, car. DepthFlow/Depth Anything pipeline and provenance are documented separately.

The original Shopify route remains at `/editions/winter2026` as a preserved reference. `/` is the independent, editable Entangled Shelter experience, with no dependence on Shopify runtime scripts or remote images.

## Reference motion translated into this product

1. Full-viewport illustrated stage with camera depth → image + real neural depth + browser parallax-occlusion shader.
2. Sticky scroll narrative → 185svh opening followed by three full-screen chapter stages and overlaid editorial cards.
3. Fixed 20/80 chapter navigation → desktop chapter rail, compact mobile header/menu, active section and theme changes.
4. Large animated chapter typography → Taste / Style / Wander titles drift relative to images, not plain scroll reveals.
5. Interactive media modal → an accessible focused choice laboratory with animated physical playing cards.
6. Polished state changes → pointer tilts, image masks, staggered entrance, win/lose feedback, busy locking and restoration of focus.

## Game invariant

Every final accepted choice requires a prior guess/bet and a successful round. A wrong guess, loss or tie never produces an accepted decision. Food, style and travel each support concrete candidates and user-added options.
