import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const neueMontreal = localFont({
  src: "./fonts/neue-montreal-bold.woff2",
  variable: "--font-neue-montreal",
  weight: "700",
  display: "swap",
});

const imperialScript = localFont({
  src: "./fonts/imperial-script.woff2",
  variable: "--font-imperial-script",
  weight: "400",
  display: "swap",
});

const hwCigars = localFont({
  src: "./fonts/hw-cigars.woff2",
  variable: "--font-hw-cigars",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shopify Editions | Winter '26",
  description:
    "Explore 150+ product updates that make running your business easier and more powerful.",
  icons: {
    icon: "/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/media/002-favicon_256-d66c3413d0.png",
    apple:
      "/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/media/001-fav-180-32a238a06c.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${neueMontreal.variable} ${imperialScript.variable} ${hwCigars.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
