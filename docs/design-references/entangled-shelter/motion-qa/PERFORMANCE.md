# Motion performance evidence

Unrecorded production-site samples. Native RAF and actual WebGL drawArrays dispatch timestamps are observed without changing the 60 Hz depth scheduler. Dispatch timing is not GPU completion or physical display presentation. Warm-up and chapter navigation are excluded, except the named transition sample. No CPU/network throttling and no forced software renderer.

Headless Edge on this machine; mobile viewport is emulation, not a physical phone. Other workloads and desktop refresh configuration can affect results. Video is captured in a separate browser context after the benchmark and cannot establish 60 fps presentation.

Browser: 152.0.4191.66. Generated: 2026-09-07T15:39:02.431Z. Software renderer observed: false.

Depth layer target = 60 draws/second. below60HzTarget flags samples with at least 30 intervals and mean below 55 Hz or p95 above 25 ms. Numeric results remain authoritative; a passing functional test is not substituted for frame rate.

| Scenario | Painting | Actual draws | Mean interval ms | p95 interval ms | Mean Hz | Observation |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| desktop-hero-idle | station.webp | 245 | 16.664 | 18.3 | 60.01 | Within stated sampling tolerance |
| desktop-hero-pointer | station.webp | 301 | 16.667 | 18.3 | 60 | Within stated sampling tolerance |
| desktop-food-scroll | station.webp | 305 | 16.667 | 18.4 | 60 | Within stated sampling tolerance |
| desktop-food-scroll | room.webp | 305 | 16.665 | 18.4 | 60 | Within stated sampling tolerance |
| desktop-food-scroll | doorway.webp | 297 | 16.561 | 18.4 | 60.38 | Within stated sampling tolerance |
| desktop-style-multiscene | station.webp | 301 | 16.667 | 18.3 | 60 | Within stated sampling tolerance |
| desktop-style-multiscene | levitate.webp | 301 | 16.664 | 18.4 | 60.01 | Within stated sampling tolerance |
| desktop-style-multiscene | atelier.webp | 301 | 16.663 | 18.4 | 60.01 | Within stated sampling tolerance |
| desktop-travel-to-ritual | station.webp | 303 | 16.697 | 18.3 | 59.89 | Within stated sampling tolerance |
| desktop-travel-to-ritual | salt.webp | 197 | 16.663 | 18.3 | 60.01 | Within stated sampling tolerance |
| desktop-travel-to-ritual | angels.webp | 57 | 16.407 | 18.4 | 60.95 | Within stated sampling tolerance |
| mobile-hero-idle | station.webp | 245 | 16.663 | 18.3 | 60.01 | Within stated sampling tolerance |
| mobile-hero-breathing | station.webp | 305 | 16.667 | 18.3 | 60 | Within stated sampling tolerance |
| mobile-food-scroll | room.webp | 301 | 16.666 | 18.3 | 60 | Within stated sampling tolerance |
| mobile-food-scroll | doorway.webp | 301 | 16.664 | 18.3 | 60.01 | Within stated sampling tolerance |
| mobile-style-multiscene | levitate.webp | 300 | 16.66 | 18.4 | 60.03 | Within stated sampling tolerance |
| mobile-style-multiscene | atelier.webp | 300 | 16.658 | 18.4 | 60.03 | Within stated sampling tolerance |
| mobile-travel-to-ritual | salt.webp | 303 | 16.675 | 18.4 | 59.97 | Within stated sampling tolerance |

Native RAF statistics, GPU model/driver, long tasks, visible scene counters, and raw dispatch timestamps are in the JSON files alongside this report.

Runtime errors: 0. Below-target samples: none observed in these samples.

## Evidence boundaries

The five desktop samples were recovered from their successful raw captures after a later mobile navigation assertion failed. The final mobile samples were collected separately against the same frozen production code. Legacy desktop raw files retain actual draw/RAF timestamps and GPU identity, but do not retain the before/after DOM snapshots; those fields are explicitly null in the aggregate JSON. This is not a new desktop rerun.

Desktop chapter samples include ongoing `station.webp` draw calls alongside the current chapter and card, so the observed active-renderer peak is **3**, not the **2** observed in the separate depth sweep. The resource cap holds, but these observations do not prove that every offscreen or covered scene stops drawing on every navigation path. No source-code change was made to hide this finding.

The 25.88-second visual recording is a separate 25 fps recording, not proof of 60 fps display presentation. It has zero detected nearly-full-black frames and zero browser runtime errors; sampled frames show the chapter transitions and the corrected light ritual section. The numeric benchmark observes command dispatch cadence on an RTX 3070, not physical-phone performance or GPU completion time.
