# Component inventory

- ExactCloneFrame: viewport shell, responsive fallback, source document, load transition, delay message.
- Source-owned regions: Editions header, hero canvas, chapter index, feature chapters, sticky media, product cards, video/Rive sequences, CTA and footer.
- Local evidence: desktop/tablet/mobile full-page captures, 24 component captures, extracted computed styles and DOM topology, downloaded fonts and 135 media assets.

Source-owned regions remain within the frame because the target relies on proprietary WebGL timelines and a large set of coordinated interactions. Keeping them together is necessary for behavioral and pixel fidelity.
