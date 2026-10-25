import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    // `server-only` throws outside a React Server environment; tests exercise
    // server modules directly, so replace it with an empty module here only.
    alias: {
      "server-only": new URL("./tests/unit/stubs/server-only.ts", import.meta.url).pathname,
    },
    restoreMocks: true,
  },
});
