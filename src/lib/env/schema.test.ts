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
    expect(
      parseServerEnv({ APP_ENV: "production", VERCEL_GIT_COMMIT_SHA: "abc1234def" }),
    ).toMatchObject({
      APP_ENV: "production",
      VERCEL_GIT_COMMIT_SHA: "abc1234def",
      TUTOR_MODEL: "claude-sonnet-5-5",
      TUTOR_PROVIDER: "anthropic",
    });
  });

  it("treats Supabase and Anthropic settings as optional", () => {
    const env = parseServerEnv({ APP_ENV: "local" });
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it("requires the Supabase URL and key together", () => {
    expect(() =>
      parseServerEnv({ APP_ENV: "local", SUPABASE_URL: "https://x.supabase.co" }),
    ).toThrow(/together/);
    expect(
      parseServerEnv({
        APP_ENV: "local",
        SUPABASE_URL: "https://x.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "pk",
      }).SUPABASE_URL,
    ).toBe("https://x.supabase.co");
  });

  it("never allows the test tutor provider in production", () => {
    expect(() => parseServerEnv({ APP_ENV: "production", TUTOR_PROVIDER: "test" })).toThrow(
      /never be used in production/,
    );
    expect(() => parseServerEnv({ VERCEL_ENV: "production", TUTOR_PROVIDER: "test" })).toThrow(
      EnvValidationError,
    );
    expect(parseServerEnv({ APP_ENV: "preview", TUTOR_PROVIDER: "test" }).TUTOR_PROVIDER).toBe(
      "test",
    );
  });

  it("rejects an unknown tutor provider", () => {
    expect(() => parseServerEnv({ APP_ENV: "local", TUTOR_PROVIDER: "openai" })).toThrow(
      EnvValidationError,
    );
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
