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
  title: "Entangled Shelter — A Refuge for the Beautifully Undecided",
  icons: { icon: "/entangled/icon.svg" },
  description:
    "An interactive refuge where appetite, style, and travel are entrusted to instinct, a little play, and a little chance.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d0b",
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
