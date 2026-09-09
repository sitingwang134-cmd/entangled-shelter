# Entangled Shelter — media pipeline

## Source and output contract

All artwork comes from the user's nine original files in `C:\Users\admin\Desktop\11`.
Originals are read only. Conversion keeps their composition and dimensions.

| ID | Original filename | Dimensions | Main role |
| --- | --- | --- | --- |
| station | c6ba27b965e132a79646e273d492aa50.png | 1683 × 935 | Hero |
| levitate | b9bfda1946154fc5b34f69230e4fb4af.png | 1672 × 941 | Main chapter |
| salt | ca5d52147c41a196f304c860c91b903d.png | 1672 × 941 | Travel chapter |
| room | ab42ed12497adc3c3a94b6772f3b2ce1.jpg | 1320 × 862 | Secondary scene |
| doorway | 22e23f764e222536c4ee66b9dc5caec6.jpg | 1320 × 1035 | Secondary scene |
| angels | c72c135981063fdc384fd4cd39ddb6fd.jpg | 1095 × 730 | Secondary scene |
| hands | d0f7e7755ca167e3c4bcd80ae78ee13d.jpg | 735 × 490 | Closing detail |
| atelier | dfd9a2a0cfae41d6e44b663f1f08e6bd.jpg | 1276 × 960 | Fashion chapter |
| car | ff20746e599470a2afead3774d31270d.jpg | 2316 × 1291 | Secondary travel scene |

Generated assets live in `public/entangled/`:

- `{id}.webp`: RGB image, source dimensions, WebP quality 91 / method 6.
- `{id}-depth.png`: 8-bit grayscale, same dimensions, near white / far black.
- `{id}.mp4`: an actual DepthFlow render for each of the nine images.
- `media-manifest.json`: source/output SHA-256 hashes, dimensions, sizes, package versions, depth statistics and video probes.

## Authentic depth processing

The depth stage uses `depthflow.estimators.anything.DepthAnythingV2(model="small")`.
It runs the official pretrained `depth-anything/Depth-Anything-V2-small-hf` model,
then DepthFlow's own normalization, Gaussian filtering and foreground-expansion
postprocessing. The resulting depth is resized with bicubic resampling to the
original image's dimensions and encoded as an 8-bit PNG. These are inferred
depth maps, not brightness maps or hand-drawn masks.

The media script is `scripts/media/process_assets.py`. Stages are separate so
image preparation, inference, rendering and verification can be repeated.

```powershell
& '.tools\depthflow\Scripts\python.exe' -X utf8 'scripts\media\process_assets.py' prepare
& '.tools\depthflow\Scripts\python.exe' -X utf8 'scripts\media\process_assets.py' depth
& '.tools\depthflow\Scripts\python.exe' -X utf8 'scripts\media\process_assets.py' render
& '.tools\depthflow\Scripts\python.exe' -X utf8 'scripts\media\process_assets.py' verify
& '.tools\depthflow\Scripts\python.exe' -X utf8 'scripts\media\qa_frames.py'
```

## Local runtime

The project uses an isolated virtual environment at `.tools/depthflow`, created
with the bundled Python 3.12.14. Installation is pinned to `depthflow==1.0.1`.
The machine has an NVIDIA GeForce RTX 3070 with 8 GB VRAM and an existing FFmpeg
installation (FFmpeg 8.1.2). Depth inference ran successfully on CPU using Torch
2.14.0; video rendering used the RTX 3070 through headless OpenGL. Exact installed
dependency versions are recorded by verification in `media-manifest.json`.

```powershell
& '.tools\depthflow\Scripts\python.exe' -m pip install 'depthflow==1.0.1'
```

The initial PyPI download was slow, so installation was completed through the
Tsinghua University PyPI mirror (`https://pypi.tuna.tsinghua.edu.cn/simple`).
Model weights were downloaded from the official Hugging Face repository.
Use `-X utf8` when rendering on Chinese Windows: ShaderFlow reads its GLSL files
using the process default text encoding, and GBK otherwise causes a decode error.
No global encoding settings or third-party package source files were modified.

## Rendering and limitations

The custom `DepthScene` subclass follows DepthFlow's official batch example,
using the headless backend and a complete sine/cosine orbit for a seamless loop.
Source size limits export size; H.264 is encoded at CRF 21. The default export
is 8 seconds / 30 fps / up to 1600 pixels wide.

Depth video is a pre-rendered asset. The webpage's live pointer/scroll reaction
is a separate WebGL renderer using the same original image and estimated depth
map. Neither method reconstructs hidden geometry or animates individual limbs.
Thin hair, floating paper, fences and complex overlaps require restrained motion.
The native low-resolution `hands` image is used as a detail rather than claiming
new high-resolution detail through a larger export.

## Official references

- [DepthFlow project](https://github.com/BrokenSource/DepthFlow)
- [Image/depth inputs and artifact guidance](https://depth.tremeschin.com/docs/inputs/)
- [Official depth estimators](https://depth.tremeschin.com/docs/estimators/)
- [Exporting and batch rendering](https://depth.tremeschin.com/docs/exporting/)
- [Python installation](https://depth.tremeschin.com/get/pypi/)

## Verification

Completed and verified on 2026-09-07:

- 9 WebP images, 1,534,838 bytes combined.
- 9 genuine estimated depth PNGs, 687,841 bytes combined.
- 9 DepthFlow MP4 videos, 8,374,980 bytes combined.
- Every video is H.264 / YUV420p / 8 seconds / 30 fps / 240 frames, with faststart.
- Each image/depth pair has the exact source dimensions. All depth files are
  grayscale with nontrivial variation (standard deviation 61.175–88.127).
- FFprobe parsed all nine video streams successfully.
- `scripts/media/qa_frames.py` decoded frames 0, 60, 180 and 239 from every export.
  All nine showed measurable motion and a loop-boundary difference smaller than
  40% of the maximum sampled motion. This is a numerical sanity check, not a
  claim that lossy-encoded loop frames are pixel-identical.
- `public/entangled/qa/all-motion.jpg` was visually inspected: all nine scenes
  render with the intended images, stable subject silhouettes and mild parallax;
  no black scene or missing image was found in the sampled frames.
- Exact file hashes and stream metadata are in `media-manifest.json`;
  per-clip motion/seam measurements are in `qa/video-qa.json`.
