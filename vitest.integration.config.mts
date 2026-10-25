import { defineConfig } from "vitest/config";

// Integration tests talk to a running Supabase stack (see docs/runbook/local-development.md).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
