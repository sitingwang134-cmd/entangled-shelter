# Visual and behavior QA

Date: 2026-09-07

The local route was exercised in headless Edge against the running Next.js application.

| Viewport | Host viewport | Horizontal overflow | Source attached | Scroll moved | Page errors |
| --- | --- | --- | --- | --- | --- |
| 1440 × 900 | exact | none | yes | yes | 0 |
| 768 × 1024 | exact | none | yes | yes | 0 |
| 390 × 844 | exact | none | yes | yes | 0 |

All three embedded documents exposed the expected Editions and Sidekick content. Pixel comparison against the source capture was 100% identical for the 1440 × 900 and 390 × 844 first viewport. The saved 768 px research capture represents a different stateful header phase after the original full-page lazy-load pass; the local frame continues to use the source's own responsive header and behavior.

Evidence is saved in `docs/design-references/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/qa/`, with machine-readable results in `qa-results.json`.
