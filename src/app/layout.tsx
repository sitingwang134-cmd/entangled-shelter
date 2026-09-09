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
  title: "Entangled Shelter — 选择困难症避难所",
  icons: { icon: "/entangled/icon.svg" },
  description:
    "一个帮助选择困难症做决定的 vibe coding 实验：美食、穿搭、旅行，交给扑克、剪刀石头布和先猜后抽。",
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
      lang="zh-CN"
      className={`${neueMontreal.variable} ${imperialScript.variable} ${hwCigars.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
