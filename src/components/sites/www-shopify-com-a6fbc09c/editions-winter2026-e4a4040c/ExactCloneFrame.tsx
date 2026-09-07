"use client";

import { useEffect, useState } from "react";

import type { CloneFrameState, EditionsSource } from "@/types/editions";

import styles from "./ExactCloneFrame.module.css";

interface ExactCloneFrameProps {
  source: EditionsSource;
}

export function ExactCloneFrame({ source }: ExactCloneFrameProps) {
  const [state, setState] = useState<CloneFrameState>({
    loaded: false,
    delayed: false,
  });

  useEffect(() => {
    if (state.loaded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setState((current) =>
        current.loaded ? current : { ...current, delayed: true },
      );
    }, 4_000);

    return () => window.clearTimeout(timeoutId);
  }, [state.loaded]);

  const handleLoad = () => {
    setState({ loaded: true, delayed: false });
  };

  return (
    <main className={styles.root} aria-label={`${source.title} website clone`}>
      <picture className={styles.fallback} aria-hidden="true">
        <source media="(max-width: 640px)" srcSet={source.fallbackMobile} />
        <img src={source.fallbackDesktop} alt="" />
      </picture>

      <iframe
        className={`${styles.frame} ${state.loaded ? styles.frameLoaded : ""}`}
        src={source.sourceUrl}
        title={source.title}
        allow="autoplay; fullscreen"
        onLoad={handleLoad}
      />

      {state.delayed && !state.loaded ? (
        <p className={styles.status} role="status">
          正在载入完整互动体验…
        </p>
      ) : null}
    </main>
  );
}
