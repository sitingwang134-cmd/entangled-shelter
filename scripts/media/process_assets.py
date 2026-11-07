"""Build Entangled Shelter media from the nine untouched user source images.

Run in .tools/depthflow. All depth is inferred by DepthFlow's official
DepthAnythingV2 Small estimator; it is never painted or approximated.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import math
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(r"C:\Users\admin\Desktop\11")
OUTPUT = ROOT / "public" / "entangled"
ASSETS = {
    "station": "c6ba27b965e132a79646e273d492aa50.png",
    "levitate": "b9bfda1946154fc5b34f69230e4fb4af.png",
    "salt": "ca5d52147c41a196f304c860c91b903d.png",
    "room": "ab42ed12497adc3c3a94b6772f3b2ce1.jpg",
    "doorway": "22e23f764e222536c4ee66b9dc5caec6.jpg",
    "angels": "c72c135981063fdc384fd4cd39ddb6fd.jpg",
    "hands": "d0f7e7755ca167e3c4bcd80ae78ee13d.jpg",
    "atelier": "dfd9a2a0cfae41d6e44b663f1f08e6bd.jpg",
    "car": "ff20746e599470a2afead3774d31270d.jpg",
}


def source_image(asset_id: str) -> Image.Image:
    with Image.open(SOURCE / ASSETS[asset_id]) as opened:
        return ImageOps.exif_transpose(opened).convert("RGB")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare(asset_ids: list[str]) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for asset_id in asset_ids:
        image = source_image(asset_id)
        image.save(OUTPUT / f"{asset_id}.webp", "WEBP", quality=91, method=6)
        print(f"PREPARED {asset_id} {image.width}x{image.height}", flush=True)


def estimate(asset_ids: list[str]) -> None:
    from depthflow.estimators.anything import DepthAnythingV2

    estimator = DepthAnythingV2(model="small")
    for asset_id in asset_ids:
        print(f"ESTIMATING {asset_id} with DepthAnythingV2 Small", flush=True)
        image = source_image(asset_id)
        depth = estimator.estimate(np.array(image, copy=True))
        # Preserve the estimator's relative distances; resizing only restores
        # source-image dimensions. White is near, black is far.
        depth_image = Image.fromarray(np.round(np.clip(depth, 0, 1) * 255).astype(np.uint8))
        depth_image = depth_image.resize(image.size, Image.Resampling.BICUBIC)
        depth_image.save(OUTPUT / f"{asset_id}-depth.png", optimize=True)
        print(f"DEPTH {asset_id} {depth.shape} -> {image.size}", flush=True)


def render(asset_ids: list[str], seconds: float, fps: int, width: int) -> None:
    from attrs import define
    from depthflow.scene import DepthScene, DepthState

    @define
    class ShelterScene(DepthScene):
        amplitude: float = 0.12

        def update(self) -> None:
            # A complete sine/cosine period yields a seamless slow orbit.
            self.state.height = 0.16
            self.state.isometric = 0.60
            self.state.steady = 0.35
            self.state.offset = (
                self.amplitude * math.sin(self.cycle),
                self.amplitude * 0.40 * math.cos(self.cycle),
            )

    scene = ShelterScene(backend="headless")
    scene.ffmpeg.h264(preset="slow", crf=21)
    for asset_id in asset_ids:
        image = source_image(asset_id)
        video_width = min(width, image.width) // 2 * 2
        video_height = round(video_width * image.height / image.width) // 2 * 2
        scene.state = DepthState()
        scene.amplitude = 0.08 if asset_id in {"room", "angels", "hands"} else 0.12
        scene.input(image=image, depth=OUTPUT / f"{asset_id}-depth.png")
        print(f"RENDERING {asset_id} {video_width}x{video_height} {seconds}s {fps}fps", flush=True)
        scene.main(
            output=OUTPUT / f"{asset_id}.mp4",
            time=seconds,
            fps=fps,
            width=video_width,
            height=video_height,
            ssaa=1.0,
        )
        print(f"RENDERED {asset_id}", flush=True)


def verify() -> None:
    import torch

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceDirectory": str(SOURCE),
        "depthMethod": "DepthFlow DepthAnythingV2 Small official estimator; normalized near-white; official Gaussian/max-filter postprocessing; bicubic resize to source dimensions",
        "inferenceDevice": str(torch.accelerator.current_accelerator() or "cpu"),
        "versions": {},
        "assets": [],
    }
    for package in ("depthflow", "shaderflow", "torch", "torchvision", "transformers", "pillow"):
        try:
            manifest["versions"][package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            manifest["versions"][package] = None
    for asset_id, source_name in ASSETS.items():
        source_path = SOURCE / source_name
        original = source_image(asset_id)
        entry = {
            "id": asset_id,
            "source": source_name,
            "sourceSha256": sha256(source_path),
            "width": original.width,
            "height": original.height,
            "files": {},
        }
        for suffix in (".webp", "-depth.png", ".mp4"):
            path = OUTPUT / f"{asset_id}{suffix}"
            if not path.exists():
                raise FileNotFoundError(f"Missing required generated asset: {path}")
            file_data = {"url": f"/entangled/{path.name}", "bytes": path.stat().st_size, "sha256": sha256(path)}
            if suffix != ".mp4":
                with Image.open(path) as generated:
                    assert generated.size == original.size, (asset_id, generated.size, original.size)
                    file_data["mode"] = generated.mode
                    if suffix == "-depth.png":
                        assert generated.mode == "L"
                        values = np.asarray(generated)
                        assert np.std(values) > 5, f"Depth map has insufficient variation: {asset_id}"
                        file_data["min"] = int(values.min())
                        file_data["max"] = int(values.max())
                        file_data["std"] = round(float(values.std()), 3)
            else:
                result = subprocess.run([
                    "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                    "stream=codec_name,width,height,r_frame_rate,nb_frames,pix_fmt:format=duration",
                    "-of", "json", str(path),
                ], check=True, capture_output=True, text=True)
                file_data["probe"] = json.loads(result.stdout)
            entry["files"][suffix] = file_data
        manifest["assets"].append(entry)
    (OUTPUT / "media-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(manifest, indent=2, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stage", choices=("prepare", "depth", "render", "verify", "all"))
    parser.add_argument("--ids", nargs="+", choices=ASSETS, default=list(ASSETS))
    parser.add_argument("--seconds", type=float, default=8)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--width", type=int, default=1600)
    args = parser.parse_args()
    if args.stage in {"prepare", "all"}:
        prepare(args.ids)
    if args.stage in {"depth", "all"}:
        estimate(args.ids)
    if args.stage in {"render", "all"}:
        render(args.ids, args.seconds, args.fps, args.width)
    if args.stage in {"verify", "all"}:
        verify()

