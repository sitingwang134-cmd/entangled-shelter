# Component inventory

- Root redirect: sends `/` to the canonical local path `/editions/winter2026`.
- Local mirror route: a `beforeFiles` rewrite serves the captured source as the top-level document.
- Source-owned regions: Editions header, hero canvas, chapter index, feature chapters, sticky media, product cards, video/Rive sequences, CTA, and footer.
- Local evidence: desktop/tablet/mobile full-page captures, 24 component captures, extracted computed styles and DOM topology, downloaded fonts and 135 media assets.

Source-owned regions remain together inside the captured document because the target relies on proprietary WebGL timelines and a large set of coordinated interactions. Serving that document at the top level is necessary for both behavioral fidelity and native scrolling.
