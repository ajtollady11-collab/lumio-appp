import type { Metadata, Viewport } from "next";

import { brand } from "@/lib/brand";
import { publicEnv } from "@/lib/env/public";

import { inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: publicEnv.NEXT_PUBLIC_SITE_URL
    ? new URL(publicEnv.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    locale: "en_GB",
  },
  // Kept out of search results until launch and the trademark check (D21).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#faf9f6",
  // Lets the layout shrink with the on-screen keyboard so the tutor composer stays visible.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg text-text">
        <a
          href="#main"
          className="sr-only rounded-md bg-surface px-4 py-2 text-sm font-medium text-text shadow-raised focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
