import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it.each(["/app", "/app/planner?new=1", "/onboarding?step=3"])(
    "allows same-site path %s",
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    },
  );

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "app",
    "/app\r\nSet-Cookie: x",
    undefined,
    ["/app"],
  ])("rejects %s", (value) => {
    expect(safeNextPath(value)).toBe("/app");
  });
});
