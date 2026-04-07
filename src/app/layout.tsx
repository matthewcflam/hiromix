import type { Metadata } from "next";
import { Inter, Reenie_Beanie } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "BETTER OFF® — THE LOOKBACK",
  description: "A cinematic timeline archive of visual memories and creative work",
  keywords: ["portfolio", "photography", "visual arts", "archive"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${reenieBeanie.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
