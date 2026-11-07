"use client";
import { useSyncExternalStore } from "react";
export type SiteMotion = "full" | "reduced";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
export function useSiteMotion(): SiteMotion {
  return useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full", () => "full");
}
