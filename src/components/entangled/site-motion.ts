"use client";

export type SiteMotion = "full" | "reduced";

// Full motion is the requested site-wide policy. There is no visitor switch.
// Ignore legacy saved preferences so an old "reduced" value cannot leave the
// site static after its control has been removed. No user data or OS settings
// are modified by this policy.
export function useSiteMotion(): SiteMotion {
  return "full";
}
