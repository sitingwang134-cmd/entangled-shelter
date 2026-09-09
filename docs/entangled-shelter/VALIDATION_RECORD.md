# Final production validation record

Date: 2026-09-07. Local site: `http://127.0.0.1:3000/`.

This is a record of observed command outcomes, not a reconstructed terminal transcript.

## Build

- The final source build ran `npm run check` (ESLint, TypeScript, Next.js production build) successfully, exit code 0, in terminal execution 26881.
- Production build ID: `pIYMCoqBfkynAsKpPLVZH`.
- The production server was started from that build on `127.0.0.1:3000`.
- Runtime source files were frozen before the final browser, depth and motion checks. Subsequent changes were confined to test scripts and documentation.
- Final independent `npm run lint` and `npm run typecheck` reruns both returned exit code 0 after the test scripts were updated.
- The six source hashes in the performance report were recomputed and all matched. Final HTTP checks of `/` and `/entangled/icon.svg` both returned 200.

## Browser and media evidence

- [Page regression](../design-references/entangled-shelter/page-qa/results.json): final eight widths, 360 / 390 / 640 / 768 / 939 / 940 / 1440 / 1920 px. Title, navigation, scrolling, all nine local images and no horizontal overflow passed; external requests, failed responses and application errors were absent.
- [Choice laboratory](../design-references/entangled-shelter/choice-qa/results.json): three categories, three game modes, loss/tie guards, animated reveals, keyboard focus, scroll restoration and persistence; fresh browser contexts with external network blocked.
- `node scripts/qa-choice-logic.mjs`: 336 assertions passed.
- [Depth scenes](../design-references/entangled-shelter/depth-qa/results.json): all nine paintings on desktop and mobile, pointer/scroll changes, context recovery and reduced-motion behavior.
- [Depth component stress test](../design-references/entangled-shelter/depth-qa/component-results.json): GPU slot limit and cleanup on unmount.
- [Media manifest](../../public/entangled/media-manifest.json) and [video validation](../../public/entangled/qa/video-qa.json): nine aligned image/depth pairs and nine actual DepthFlow videos. Source image hashes were rechecked: 9/9 unchanged.
- [Motion performance](../design-references/entangled-shelter/motion-qa/performance-results.json): ten unrecorded desktop/mobile-emulation scenarios, no runtime errors or below-target samples. Actual WebGL dispatch cadence was about 60 Hz on this machine's RTX 3070; it is not physical display presentation or real-phone measurement.

The structure guide links the final motion/performance evidence and explains the measurement limits. This custom site uses 2.5D image depth, not a claim of pixel-identical reconstruction of Shopify's original 3D/Rive assets.
