# NAS deployment — 2026-09-08

## Current release — Original 3D Roll V11 (2026-09-09)

- `/history` now restores the original Three.js r128 physical roll and trailing ribbon from paper-roll-nine.vercel.app. Removed the vertical DOM ribbon and printing-room backdrop from this route.
- Original geometry, solver, pointer raycast, camera, idle motion, pre-roll and UV synchronization retained. Original movement reproduced under identical test inputs (positions, rotations, vertices, UVs and camera compared).
- Same-origin iframe owns the scene lifecycle; libraries hosted locally in `/entangled/paper-roll/`. Browser history is read safely, full timestamps shown on paper and in a readable list, with eight records per atlas bank. No invented decisions or storage writes.
- TypeScript/static build, ESLint and original-vs-restored runtime geometry tests passed. Visual acceptance remains with the user; CUA reference navigation timed out.
- Backup: `/vol2/entangled-shelter/backups/before-20260909-original-roll-v11`.
- Archive: `/home/zzp/20260909-original-roll-v11.tar.gz`.

## Previous release — Decision Archive + Video V10 (2026-09-09)

- Live pages: `http://192.168.31.214:3090/` and `http://192.168.31.214:3090/history`.
- Added a persistent choice archive reading `entangled-shelter:decisions:v1`. Each receipt prints the accepted result, detail, category, game mode, and full local timestamp. It never seeds, clears, or rewrites history.
- The archive adapts the inspected paper-roll interaction: inertial auto-roll, vertical pointer steering, horizontal reel yaw, drag and wheel control, and short-click pause/resume. The visual system stays within Entangled Shelter's olive, ivory, burgundy, Chinese editorial and classical-image direction.
- Original archive background generated with built-in image generation: `/entangled/history-press.webp`; prompt/provenance record in `docs/research/paper-roll-nine-vercel-app/history-roll/OUTPUT_PLAN.md`.
- Food video now uses the user's corrected `C:/Users/admin/Desktop/9月9日 (1).mp4`, re-encoded directly from source as cache-safe `/entangled/food-film-v10.mp4`: H.264 High Level 4.1, yuv420p, 1920×1080, 30fps, AAC, fixed two-second keyframes and fast-start. Full decode and representative frame checks passed.
- Static build ID: `VrZLyAjRdXddN5QmsO1DS`. Lint, TypeScript, static export, 672 choice assertions, history-roll structure checks, chapter-entry checks, Nginx configuration, HTTP 200 and byte-level comparison of both HTML pages plus 129 assets passed.
- Backup: `/vol2/entangled-shelter/backups/before-20260909-history-v10`.
- Archive: `/home/zzp/20260909-history-v10.tar.gz`; SHA-256 `9a5dd85edfb8c874deef8042395c7449646d962398ef68359d050e112378831e`.
- Browser visual and interaction acceptance remains with the user.

## Previous release — Corrected Source Video V9 (2026-09-09)

- Source: `C:/Users/admin/Desktop/9月9日 (1).mp4`. Sampled 7.5–10 seconds at 4fps: previously corrupted pepper-grinder shot now appears intact. Full software decode passed. No shots removed.
- Delivery uses the same compatible 1080p/30fps Baseline encoding as V8; new `/entangled/food-film-v9.mp4` and matching poster. Controls/audio/layout unchanged. Original file untouched.
- Backup: `/vol2/entangled-shelter/backups/before-20260909-video-v9`.
- Archive: `/home/zzp/entangled-shelter-20260909-video-v9.tar.gz`; SHA-256 `8d263d21a424d41a8451123b1713a590141c31ec78b55d873a1c42d4a285ae7a`.
- Lint, TypeScript/static and regular builds, input/output decode checks passed. Webpage visual acceptance remains with user.
- Correction to V8 diagnosis: finer sampling later confirmed that both earlier user files contain visibly corrupted frames around 8.25–8.75s despite successful decoding. The hardware compatibility hypothesis was not the cause demonstrated by that evidence; V9 replaces the damaged source.

## Previous release — Video Compatibility V8 (2026-09-09)

- User reported block corruption during browser playback. Source software-decoded frame at 8 seconds appeared intact; complete source/delivery decoding reported no error. Hardware decoder incompatibility suspected, not confirmed.
- Re-encoded original September 9 video to H.264 Constrained Baseline Level 4.0, 1920×1080, 30fps, yuv420p, one reference frame, no B frames, one-second keyframe interval, capped 8Mbps, AAC 160kbps, fast-start MP4. File: `/entangled/food-film-v8.mp4`, 17,597,516 bytes. Original untouched; player and audio behavior preserved.
- Backup: `/vol2/entangled-shelter/backups/before-20260909-video-v8`.
- Archive: `/home/zzp/entangled-shelter-20260909-video-v8.tar.gz`; SHA-256 `4083308b9c0e51234af84b3b33337ac09d0b4329e6902880ee7d8495a2d5ae4f`.
- Full strict software decode, lint, static/normal production builds passed. User must confirm actual browser playback; no claim that hardware playback was independently reproduced or verified.

## Previous release — Food Video V7 (2026-09-09)

- Replaced food video with user-supplied `C:/Users/admin/Desktop/9月9日.mp4`: 2560×1440 H.264/AAC, approximately 20 seconds. Stream-copy fast-start delivery, no quality reduction; source untouched.
- New cache-safe paths: `/entangled/food-film-v7.mp4` and `/entangled/food-film-v7.webp`. Same player, muted looping autoplay, controls and aspect ratio.
- Backup: `/vol2/entangled-shelter/backups/before-20260909-video-v7`.
- Archive: `/home/zzp/entangled-shelter-20260909-video-v7.tar.gz`; SHA-256 `96527d39d50682c05acee35e4dacaaaf2b59d0a0b982aafd825dc2f44e1c752b`.
- Lint, static and normal production builds, video decode passed. Final browser playback / visual acceptance belongs to user.

## Previous release — Food Video V6 (2026-09-09)

- Same site: http://192.168.31.214:3090/. Food story visual replaced with the user's supplied 20-second 1920×1080 video. Other chapters and choice/game logic unchanged.
- Native video controls, muted autoplay, looping, inline mobile playback and full 16:9 frame. Sound retained and user-controllable. Autoplay is subject to browser policy; play controls remain available.
- Local source: `C:/Users/admin/Desktop/ef72fa2d0e3b78e3c532b6f3ef3ee57e_raw.mp4` (unchanged). Delivery: `public/entangled/food-film-v6.mp4`, stream-copy fast-start MP4; poster extracted at 0.5 seconds.
- Backup: `/vol2/entangled-shelter/backups/before-20260909-video-v6`.
- Archive: `/home/zzp/entangled-shelter-20260909-video-v6.tar.gz`; SHA-256 `0e0be077af80ed3edb57e1287739ec6f1a21f1ae51c8dd175dc779239f49a980`.
- Lint, TypeScript production builds, chapter entry checks and full video decode passed. Browser playback and visual acceptance reserved for user.

## Previous release — Chapter Entries V5 (2026-09-09)

- Same LAN address and container: http://192.168.31.214:3090/.
- Only three homepage chapter entry panels changed: translucent dark olive, cream editorial typography, individual chapter headings and numbered rows, replacing pastel panels and oversized suits. Existing Next.js implementation and homepage visual language reused; no external component inspiration.
- Files: `src/components/entangled/EntangledShelter.tsx`, `src/components/entangled/EntangledShelter.module.css`; code-only entrance checks in `scripts/qa-chapter-entries.mjs`.
- V4 backup: `/vol2/entangled-shelter/backups/before-20260909-entry-v5`.
- Archive prepared September 8, deployed September 9: `/home/zzp/entangled-shelter-20260908-entry-v5.tar.gz`.
- Archive SHA-256: `eaba5aebddfcad5d5a79951271f2f2cf1f60e988591d100a3e9b085669e777c3`.
- Lint, TypeScript, static build and chapter structure checks passed. User performs final visual acceptance; no browser screenshot QA in this revision.

## Previous release — Choice Room V4 (historical)

- LAN: **http://192.168.31.214:3090/**; existing container, port mapping and Cloudflare routing preserved.
- 60 individually generated option illustrations, redesigned catalog selector, separate poker / RPS duel / sealed-envelope lottery interfaces and animations.
- Active directory: `/vol2/entangled-shelter/dist`.
- V3 backup: `/vol2/entangled-shelter/backups/before-20260908-choice-v4`.
- Archive: `/home/zzp/entangled-shelter-20260908-choice-v4.tar.gz`.
- Archive SHA-256: `8218b952cee1c50bb828f43e41e905c6efbaf3236ec39479f304ea4d6f41ec0e`.
- Static build ID: `Pm2PdNQt3XZpptXAU0fFm`.
- Lint, TypeScript, static export and normal production build passed. 672 existing logic assertions, 1292+ lottery / independent-game SSR assertions, three category SSR renders and 60 image decodes/hash checks passed.
- Deployed HTML and **117 assets** match the exported release byte-for-byte; full-motion markup present and no motion toggle. See [deployment/nas-release-check.json](deployment/nas-release-check.json).
- Final webpage visual and interaction acceptance is reserved for the user. No browser QA was performed for V4.
- [V4 changes, generated image records and code structure](CHOICE_ROOM_V4.zh-CN.md).

## Previous release — Choice Room V3 (historical)

- LAN: **http://192.168.31.214:3090/**; same `entangled-shelter` container and `3090:80` mapping.
- 60 candidates, ten per batch, persistent cross-batch selections; oil-painting choice room, 15 locally hosted mood photographs, engraved SVG hands and richer game animation.
- Current directory: `/vol2/entangled-shelter/dist`.
- Previous motion-v2 release is preserved at `/vol2/entangled-shelter/backups/before-20260908-choice-v3`.
- Archive: `/home/zzp/entangled-shelter-20260908-choice-v3.tar.gz`.
- Archive SHA-256: `61dd0565a9e0b395e22bccb5ef00c84e63ebb722b0591bba6e18ce219bf12c20`.
- Static build ID: `DMjK-MzM650XZP3dR8iG6`.
- Validation: lint, TypeScript, static export, normal Next.js production build, 672 logic assertions, three SSR choice-room renders, 15 image decodes/hash checks, Nginx configuration and HTTP 200 all passed.
- Deployed HTML and **56 assets** match the local export byte-for-byte. Current report: [deployment/nas-release-check.json](deployment/nas-release-check.json).
- No browser visual test was performed. User owns final visual/interaction acceptance. Cloudflare hostname mapping was not changed.
- [V3 changes, source files and verification scope](CHOICE_ROOM_V3.zh-CN.md).

## Previous release — Motion V2 (historical)

- LAN address: **http://192.168.31.214:3090/**
- Container: `entangled-shelter`, existing `nginx:alpine`, port `3090:80`, restart policy `unless-stopped`.
- Site directory: `/vol2/entangled-shelter/dist`.
- Previous release retained at `/vol2/entangled-shelter/backups/before-20260908-motion-v2`.
- Uploaded archive: `/home/zzp/entangled-shelter-20260908-motion-v2.tar.gz`.
- Archive SHA-256: `7996e9b853abe839b2d156a670e2bafa599ad5c0a371813c255d7aa0021773d9`.
- Static export build ID: `0wvL5titQkbs4dSM_1yT0`.
- Local Node server build ID: `h9FwUUk7OTO31Wmxz2_EF` (same source, separate build).

The existing container, Nginx configuration and other NAS services were preserved. Only this site's content directory was replaced after creating a recoverable backup. The container was stopped briefly during the directory swap and then restarted; Nginx configuration validation and HTTP checks passed.

## Behavior

Full motion is always enabled. The on-page motion control was removed, and legacy saved `reduced` values no longer affect the site. Existing browser storage and operating-system preferences are not modified.

Pointer displacement is approximately 1.6× the previous amplitude. Automatic drift is approximately 4.5×, with a shorter orbit period. Scroll-linked depth displacement is approximately 1.5×. The overscan margin and poster crop were increased together to accommodate the camera range; original artwork files were not altered.

## Verification

- `npm run build:static`: passed.
- `npm run check`: lint, TypeScript and normal production build passed.
- `node scripts/qa-choice-logic.mjs`: 336 assertions passed.
- `node scripts/verify-nas-release.mjs`: the deployed HTML and 40 scripts/styles/fonts/media files match the local export byte-for-byte. Full-motion markup is present and the removed control is absent.
- [Deployment integrity report](deployment/nas-release-check.json).

These are build, logic and HTTP-integrity checks. Visual acceptance of the increased amplitude is left to the user, as requested; older browser/performance reports are not represented as a fresh visual review of this release.

## Rebuild

```powershell
npm run build:static
```

This generates `out/` for Nginx. The static export omits the Node-only Shopify reference rewrite; the main Entangled Shelter application and all its assets are self-contained. Regular `npm run build` / `npm run start` still support the local Node deployment and its reference route. A static build should not be run concurrently with the local Node server, because both use `.next/` while building.

## Public hostname

Cloudflare Tunnel is running in remotely managed token mode. Its hostname routing was **not modified**. The public entry point is pending the user's choice between the existing apex domain, a dedicated subdomain, or LAN-only access. The presence of `chenjiayao.cloud` is not proof that it currently routes to port 3090.

## Recovery

Keep the backup until the new version is accepted. Recovery must target only the `entangled-shelter` container and its dedicated `dist` directory: stop that container, preserve the current release under a new backup name, restore `before-20260908-motion-v2` to `dist`, then start the same container. Do not modify other containers or delete the backup as part of a routine restart.
