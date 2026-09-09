"""Decode DepthFlow exports and check motion, loop continuity, and artwork frames."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public" / "entangled"
QA = OUTPUT / "qa"


def main() -> None:
    QA.mkdir(exist_ok=True)
    manifest = json.loads((OUTPUT / "media-manifest.json").read_text(encoding="utf-8"))
    sheet = Image.new("RGB", (2160, 918), "#191919")
    draw = ImageDraw.Draw(sheet)
    results = []
    for index, entry in enumerate(manifest["assets"]):
        asset_id = entry["id"]
        stream = entry["files"][".mp4"]["probe"]["streams"][0]
        width = 360
        height = round(stream["height"] * width / stream["width"] / 2) * 2
        decoded = subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(OUTPUT / f"{asset_id}.mp4"),
            "-vf", f"select=eq(n\\,0)+eq(n\\,60)+eq(n\\,180)+eq(n\\,239),scale={width}:{height}",
            "-fps_mode", "passthrough", "-pix_fmt", "rgb24", "-f", "rawvideo", "pipe:1",
        ], check=True, capture_output=True)
        frames = np.frombuffer(decoded.stdout, dtype=np.uint8).reshape((-1, height, width, 3))
        assert len(frames) == 4, (asset_id, len(frames))
        delta = lambda left, right: float(np.abs(left.astype(np.float32) - right.astype(np.float32)).mean())
        motion = delta(frames[1], frames[2])
        seam = delta(frames[0], frames[3])
        assert motion > 0.35, f"No measurable animation: {asset_id}"
        assert seam < motion * 0.40, f"Loop seam is too large relative to motion: {asset_id}"
        result = {
            "id": asset_id,
            "selectedFrames": [0, 60, 180, 239],
            "motionMeanAbsolutePixelDifference": round(motion, 4),
            "loopSeamMeanAbsolutePixelDifference": round(seam, 4),
            "loopSeamToMotionRatio": round(seam / motion, 4),
            "passed": True,
        }
        results.append(result)
        x = (index % 3) * 720
        y = (index // 3) * 306
        sheet.paste(Image.fromarray(frames[1]), (x, y + 24))
        sheet.paste(Image.fromarray(frames[2]), (x + 360, y + 24))
        draw.text((x + 8, y + 6), f"{asset_id}  |  2 seconds / 6 seconds", fill="white")
        print(json.dumps(result), flush=True)
    sheet.save(QA / "all-motion.jpg", quality=92)
    (QA / "video-qa.json").write_text(json.dumps(results, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
