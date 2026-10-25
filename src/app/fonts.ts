import localFont from "next/font/local";

/**
 * Inter (variable weight), self-hosted under the SIL Open Font License 1.1 — see
 * ./fonts/licenses. File from Fontsource 5.3.0, Latin subset. Serving it ourselves
 * means no third-party font request from a student's browser.
 */
export const inter = localFont({
  src: "./fonts/inter-latin-wght.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});
