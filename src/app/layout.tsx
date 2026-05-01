import type { Metadata } from "next";
import { Inter, Reenie_Beanie, Roboto } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const reenieBeanie = Reenie_Beanie({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-reenie",
  display: "swap",
});

const roboto = Roboto({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "For Anne, my love",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, reenieBeanie.variable, roboto.variable, "font-sans")}>
      <head>
        {/* Preload critical assets */}
        <link rel="preload" as="image" href="/assets/callmeifyougetlost.png" />
        {/* Preconnect to external CDNs */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Prefetch adjacent timeline images for smooth navigation */}
        <link rel="prefetch" as="image" href="/assets/yellownote.jpg" />
        <link rel="prefetch" as="image" href="/assets/greennote.jpg" />
        <link rel="prefetch" as="image" href="/assets/linedpaper.jpg" />
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
