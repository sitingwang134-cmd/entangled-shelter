import { ExactCloneFrame } from "@/components/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/ExactCloneFrame";
import type { EditionsSource } from "@/types/editions";

const editionsSource: EditionsSource = {
  title: "Shopify Editions Winter '26",
  sourceUrl: "https://www.shopify.com/editions/winter2026",
  fallbackDesktop:
    "/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/desktop-hero-fallback.png",
  fallbackMobile:
    "/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/mobile-hero-fallback.png",
};

export default function Home() {
  return <ExactCloneFrame source={editionsSource} />;
}
