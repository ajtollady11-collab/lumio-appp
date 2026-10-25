import type { Metadata, Viewport } from "next";

import { brand } from "@/lib/brand";
import { publicEnv } from "@/lib/env/public";

import { atkinson, fraunces } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: publicEnv.NEXT_PUBLIC_SITE_URL
    ? new URL(publicEnv.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`,
  },
  description:
    "An AI tutor for GCSE Maths, in development. It teaches, sets practice, checks your working and plans revision from what you actually did.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${atkinson.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg text-text">
        <a
          href="#main"
          className="sr-only rounded-md bg-surface px-4 py-2 text-text focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
