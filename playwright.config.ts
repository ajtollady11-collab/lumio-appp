import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * End-to-end tests run against a production build (`next start`), not the dev
 * server, so they exercise the same output Vercel serves.
 * Set E2E_BASE_URL to run the suite against a deployed preview instead.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    ...(process.env.CI ? [{ name: "mobile-webkit", use: { ...devices["iPhone 14"] } }] : []),
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm start --port ${PORT}`,
        url: `${BASE_URL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
