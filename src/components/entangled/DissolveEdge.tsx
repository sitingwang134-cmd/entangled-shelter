"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSiteMotion } from "./site-motion";

gsap.registerPlugin(ScrollTrigger);

/** Reveal the incoming section itself, so the outgoing scene remains visible through the grain. */
export function DissolveEdge() {
  const ref = useRef<HTMLSpanElement>(null);
  const motion = useSiteMotion();
  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 720, h = 216;
    canvas.width = w;
    canvas.height = h;
    const frame = ctx.createImageData(w, h);
    const grain = new Float32Array(w * h);
    const edge = new Float32Array(w);
    for (let i = 0; i < grain.length; i++) {
      const hash = Math.sin(i * 127.1) * 43758.5453;
      grain[i] = hash - Math.floor(hash);
    }
    let lastStep = -1;
    const paint = (progress: number) => {
      const step = Math.round(progress * 240);
      if (step === lastStep) return;
      lastStep = step;
      const position = step / 240;
      const time = position * 4;
      const threshold = .75 - position * .65;
      // Every part of the mask is a pure function of scroll position.
      // Stopping freezes it; reversing restores precisely the same grain.
      const driftX = Math.floor(time * 19) % w;
      const driftY = Math.floor(time * 11) % h;
      for (let x = 0; x < w; x++) {
        edge[x] = .10 * Math.sin(x * .008 + time * .85)
          + .055 * Math.sin(x * .031 - time * 1.3)
          + .022 * Math.sin(x * .097 + time * 2.1);
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const noise = grain[((y + driftY) % h) * w + (x + driftX) % w];
        const field = y / h + edge[x] + noise * .095;
        frame.data[(y * w + x) * 4 + 3] = Math.round(Math.max(0, Math.min(1, (field - threshold) * 65)) * 255);
      }
      ctx.putImageData(frame, 0, 0);
      section.style.setProperty("--seam-mask", `url("${canvas.toDataURL()}")`);
    };
    paint(0);
    section.dataset.dissolve = "ready";
    const trigger = motion === "reduced" ? null : ScrollTrigger.create({
      trigger: section, start: "top bottom", end: "top -45%",
      onUpdate: self => paint(self.progress),
      onRefresh: self => paint(self.progress),
    });
    if (trigger) paint(trigger.progress);
    return () => {
      trigger?.kill();
      section.style.removeProperty("--seam-mask");
      delete section.dataset.dissolve;
    };
  }, [motion]);
  return <span ref={ref} hidden aria-hidden="true" />;
}
