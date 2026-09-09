# Output plan — Choice Archive / History Roll

## Route

- `/history/` — a full-screen archive of accepted decisions stored under `entangled-shelter:decisions:v1`.
- `/` — gains restrained “选择档案” entry points in the existing navigation and closing section.

## Reference behavior translated from paper-roll-nine.vercel.app

- A heavy paper ribbon stays in continuous motion.
- Pointer position steers direction and speed with inertia.
- Idle state keeps the mechanism moving automatically.
- A short click pauses or resumes; dragging and wheel input move the archive without toggling pause.
- Fixed corner HUD communicates identity, count, and controls.

## Entangled Shelter adaptation

- Replace the reference portfolio sheets with real decision records: exact accepted time, category, game mode, result name, and result detail.
- Keep the established olive / ivory / burgundy palette, Chinese editorial typography, fine linework, and classical image treatment.
- Use an original generated Victorian printing-room background. No reference-site assets are reused.
- Preserve a useful empty state and direct route back to the main decision experience.

## Validation

- TypeScript and ESLint.
- Existing choice-logic suite.
- Static-export build, including `/history/index.html`.
- Video decode/probe and representative-frame checks.
- NAS response and asset checks after release.

