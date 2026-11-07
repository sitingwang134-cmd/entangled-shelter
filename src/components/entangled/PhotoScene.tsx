"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useSiteMotion } from "./site-motion";
import styles from "./PhotoScene.module.css";

/** Photograph motion uses a rigid plane: never distort a new photo with an old depth map. */
export function PhotoScene({ image, alt, focus = .5, priority = false, atmosphere = false }: {
  image: string; alt: string; focus?: number; priority?: boolean; atmosphere?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const motion = useSiteMotion();
  useEffect(() => {
    const element = host.current;
    if (!element || motion === "reduced") return;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      element.dataset.visible = String(visible);
    });
    observer.observe(element);
    const move = (event: PointerEvent) => {
      if (!visible || event.pointerType !== "mouse") return;
      element.style.setProperty("--photo-x", `${(event.clientX / window.innerWidth - .5) * -48}px`);
      element.style.setProperty("--photo-y", `${(event.clientY / window.innerHeight - .5) * -32}px`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("pointermove", move); };
  }, [motion]);
  return <div ref={host} className={styles.scene} data-motion={motion} data-atmosphere={atmosphere}>
    <div className={styles.drift}><div className={styles.pointer}>
      <Image src={image} alt={alt} fill unoptimized sizes="100vw" preload={priority}
        className={styles.photo} style={{ objectPosition: `${focus * 100}% center` }} />
    </div></div>
    {atmosphere && <><div className={styles.water} aria-hidden="true"><Image src={image} alt="" fill unoptimized sizes="100vw" className={styles.photo} style={{objectPosition:`${focus * 100}% center`}} /></div><div className={styles.sun} aria-hidden="true" /><div className={styles.reflection} aria-hidden="true" /><div className={styles.mist} aria-hidden="true" /></>}
  </div>;
}
