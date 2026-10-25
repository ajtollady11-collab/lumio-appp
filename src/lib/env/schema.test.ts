import { describe, expect, it } from "vitest";

import {
  EnvValidationError,
  parsePublicEnv,
  parseServerEnv,
  resolveAppEnv,
  validateEnv,
} from "./schema";

describe("resolveAppEnv", () => {
  it("prefers an explicit APP_ENV", () => {
    expect(resolveAppEnv({ APP_ENV: "preview", VERCEL_ENV: "production" })).toBe("preview");
  });

  it("maps Vercel environments when APP_ENV is absent", () => {
    expect(resolveAppEnv({ VERCEL_ENV: "production" })).toBe("production");
    expect(resolveAppEnv({ VERCEL_ENV: "preview" })).toBe("preview");
    expect(resolveAppEnv({ VERCEL_ENV: "development" })).toBe("local");
  });

  it("defaults to local outside Vercel", () => {
    expect(resolveAppEnv({})).toBe("local");
    expect(resolveAppEnv({ APP_ENV: "   " })).toBe("local");
  });
});

describe("parseServerEnv", () => {
  it("accepts a valid environment", () => {
    expect(parseServerEnv({ APP_ENV: "production", VERCEL_GIT_COMMIT_SHA: "abc1234def" })).toEqual({
      APP_ENV: "production",
      VERCEL_GIT_COMMIT_SHA: "abc1234def",
    });
  });

  it("rejects an unknown APP_ENV with a readable message", () => {
    expect(() => parseServerEnv({ APP_ENV: "staging" })).toThrow(EnvValidationError);
    try {
      parseServerEnv({ APP_ENV: "staging" });
    } catch (error) {
      expect((error as EnvValidationError).scope).toBe("server");
      expect((error as Error).message).toContain("APP_ENV");
    }
  });
});

describe("parsePublicEnv", () => {
  it("treats a missing or blank site URL as absent", () => {
    expect(parsePublicEnv({}).NEXT_PUBLIC_SITE_URL).toBeUndefined();
    expect(parsePublicEnv({ NEXT_PUBLIC_SITE_URL: "  " }).NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });

  it("accepts an https URL", () => {
    expect(
      parsePublicEnv({ NEXT_PUBLIC_SITE_URL: "https://example.com" }).NEXT_PUBLIC_SITE_URL,
    ).toBe("https://example.com");
  });

  it("rejects a malformed or non-http URL", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SITE_URL: "not a url" })).toThrow(EnvValidationError);
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" })).toThrow(
      EnvValidationError,
    );
  });
});

describe("validateEnv", () => {
  it("validates both scopes together", () => {
    const result = validateEnv({ VERCEL_ENV: "preview" });
    expect(result.server.APP_ENV).toBe("preview");
    expect(result.public.NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });
});
