import { beforeEach, describe, expect, it, vi } from "vitest";

describe("getHealthReport", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("reports environment, short commit and timestamp", async () => {
    vi.stubEnv("APP_ENV", "preview");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "0123456789abcdef");
    const { getHealthReport } = await import("./health");

    expect(getHealthReport(new Date("2026-10-25T12:00:00Z"))).toEqual({
      status: "ok",
      environment: "preview",
      commit: "0123456",
      checkedAt: "2026-10-25T12:00:00.000Z",
    });
  });

  it("returns a null commit when none is available", async () => {
    vi.stubEnv("APP_ENV", "local");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
    const { getHealthReport } = await import("./health");

    expect(getHealthReport().commit).toBeNull();
  });

  it("never exposes environment variables beyond the allow-listed fields", async () => {
    vi.stubEnv("APP_ENV", "local");
    vi.stubEnv("SOME_SECRET_KEY", "should-not-appear");
    const { getHealthReport } = await import("./health");

    const serialised = JSON.stringify(getHealthReport());
    expect(serialised).not.toContain("should-not-appear");
    expect(Object.keys(getHealthReport()).sort()).toEqual([
      "checkedAt",
      "commit",
      "environment",
      "status",
    ]);
  });
});
