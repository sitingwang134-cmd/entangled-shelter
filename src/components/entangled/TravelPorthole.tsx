"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./TravelPorthole.module.css";

type DragState = { pointerId: number; startY: number; startOpen: number; currentOpen: number; moved: boolean } | null;

export function TravelPorthole({ onExplore }: { onExplore: () => void }) {
  const drag = useRef<DragState>(null);
  const [open, setOpen] = useState(100);
  const [dragging, setDragging] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const clamp = (value: number) => Math.min(100, Math.max(0, value));

  function begin(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, startY: event.clientY, startOpen: open, currentOpen: open, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setParallax({
      x: ((event.clientX - rect.left) / rect.width - .5) * 10,
      y: ((event.clientY - rect.top) / rect.height - .5) * 8,
    });
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const distance = event.clientY - drag.current.startY;
    drag.current.moved ||= Math.abs(distance) > 4;
    drag.current.currentOpen = clamp(drag.current.startOpen - (distance / rect.height) * 125);
    setOpen(drag.current.currentOpen);
  }

  function end(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    const gesture = drag.current;
    drag.current = null;
    setDragging(false);
    setOpen(gesture.moved ? (gesture.currentOpen >= 50 ? 100 : 0) : (gesture.startOpen >= 50 ? 0 : 100));
  }

  function keyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowUp") { event.preventDefault(); setOpen((value) => clamp(value + 10)); }
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen((value) => clamp(value - 10)); }
    if (event.key === "Home") { event.preventDefault(); setOpen(100); }
    if (event.key === "End") { event.preventDefault(); setOpen(0); }
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); setOpen((value) => value >= 50 ? 0 : 100); }
  }

  return <div className={styles.stage} data-depth-section>
    <div className={styles.ambient} aria-hidden="true"><i /><i /><i /></div>
    <div className={styles.frame}>
      <div className={styles.fur} aria-hidden="true" />
      <div className={styles.goldBezel}>
        <div
          className={`${styles.viewport} ${dragging ? styles.dragging : ""}`}
          role="slider"
          aria-label="Royal window shade"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-orientation="vertical"
          aria-valuenow={Math.round(open)}
          aria-valuetext={`${Math.round(open)} percent open`}
          tabIndex={0}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          onPointerLeave={() => !drag.current && setParallax({ x: 0, y: 0 })}
          onKeyDown={keyDown}
        >
          <div className={styles.vista} style={{ transform: `scale(1.09) translate3d(${parallax.x}px, ${parallax.y}px, 0)` }} />
          <div className={styles.haze} aria-hidden="true" />
          <div className={styles.shade} style={{ transform: `translateY(calc(${-open}% - ${open * .9}px))` }} aria-hidden="true">
            <div className={styles.shadePattern} />
            <div className={styles.shadeRail}><span /></div>
          </div>
          <div className={styles.glass} aria-hidden="true" />
          <span className={styles.dragHint} aria-hidden="true">DRAG THE SILK SHADE</span>
        </div>
      </div>
    </div>
    <div className={styles.caption}>
      <span>THE ROYAL PASSAGE · III</span>
      <p>Draw the curtain. Let elsewhere in.</p>
      <button type="button" onClick={onExplore}>EXPLORE WANDER <span aria-hidden="true">↗</span></button>
    </div>
  </div>;
}
