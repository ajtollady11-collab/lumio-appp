import localFont from "next/font/local";

/**
 * Self-hosted variable fonts (SIL Open Font License 1.1 — see ./fonts/licenses).
 * Files come from the Fontsource 5.3.0 packages, Latin subset. Serving them
 * ourselves means no request reaches a third-party font CDN from a student's
 * browser, and builds never depend on Google Fonts being reachable.
 */
export const fraunces = localFont({
  src: "./fonts/fraunces-latin-wght-soft.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const atkinson = localFont({
  src: "./fonts/atkinson-hyperlegible-next-latin-wght.woff2",
  variable: "--font-atkinson",
  weight: "200 800",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
