import { z } from "zod";

/**
 * Environment-variable contract for Lumio.
 *
 * This module is pure (no `process.env` access, no `server-only` marker) so it
 * can be unit-tested and imported by `next.config.ts` to fail the build early.
 *
 * - `publicEnvSchema` holds values that are safe to ship to the browser. Every
 *   key MUST start with `NEXT_PUBLIC_`.
 * - `serverEnvSchema` holds values that may only be read on the server.
 *
 * Supabase and Anthropic settings are optional so the app can build and show a
 * clear "not configured" state; features that need them check `isConfigured`.
 */

export const APP_ENVIRONMENTS = ["local", "preview", "production"] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export const DEFAULT_TUTOR_MODEL = "claude-sonnet-5-5";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** An absolute http(s) URL, or absent. Blank strings count as absent. */
const optionalUrl = z.preprocess(blankToUndefined, z.url({ protocol: /^https?$/ }).optional());
const optionalString = z.preprocess(blankToUndefined, z.string().trim().min(1).optional());

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl,
});

export const serverEnvSchema = z
  .object({
    APP_ENV: z.enum(APP_ENVIRONMENTS),
    VERCEL_GIT_COMMIT_SHA: z.string().trim().optional(),
    SUPABASE_URL: optionalUrl,
    SUPABASE_PUBLISHABLE_KEY: optionalString,
    ANTHROPIC_API_KEY: optionalString,
    TUTOR_MODEL: z.preprocess(
      blankToUndefined,
      z.string().trim().min(1).default(DEFAULT_TUTOR_MODEL),
    ),
    TUTOR_PROVIDER: z.preprocess(
      blankToUndefined,
      z.enum(["anthropic", "test"]).default("anthropic"),
    ),
  })
  .superRefine((env, ctx) => {
    if (env.TUTOR_PROVIDER === "test" && env.APP_ENV === "production") {
      ctx.addIssue({
        code: "custom",
        path: ["TUTOR_PROVIDER"],
        message: "The test tutor provider can never be used in production.",
      });
    }
    if (Boolean(env.SUPABASE_URL) !== Boolean(env.SUPABASE_PUBLISHABLE_KEY)) {
      ctx.addIssue({
        code: "custom",
        path: ["SUPABASE_PUBLISHABLE_KEY"],
        message: "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY together.",
      });
    }
  });

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

type RawEnv = Record<string, string | undefined>;

/**
 * Works out which Lumio environment we are in.
 * An explicit APP_ENV wins; otherwise Vercel's own VERCEL_ENV is mapped so that
 * preview and production deployments are labelled correctly without manual setup.
 */
export function resolveAppEnv(raw: RawEnv): string {
  const explicit = raw.APP_ENV?.trim();
  if (explicit) return explicit;

  switch (raw.VERCEL_ENV) {
    case "production":
      return "production";
    case "preview":
      return "preview";
    default:
      return "local";
  }
}

export class EnvValidationError extends Error {
  constructor(
    public readonly scope: "public" | "server",
    public readonly issues: string[],
  ) {
    super(`Invalid ${scope} environment variables:\n${issues.map((i) => `  - ${i}`).join("\n")}`);
    this.name = "EnvValidationError";
  }
}

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

export function parsePublicEnv(raw: RawEnv): PublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: raw.NEXT_PUBLIC_SITE_URL,
  });
  if (!result.success) throw new EnvValidationError("public", formatIssues(result.error));
  return result.data;
}

export function parseServerEnv(raw: RawEnv): ServerEnv {
  const result = serverEnvSchema.safeParse({
    APP_ENV: resolveAppEnv(raw),
    VERCEL_GIT_COMMIT_SHA: raw.VERCEL_GIT_COMMIT_SHA,
    SUPABASE_URL: raw.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: raw.SUPABASE_PUBLISHABLE_KEY,
    ANTHROPIC_API_KEY: raw.ANTHROPIC_API_KEY,
    TUTOR_MODEL: raw.TUTOR_MODEL,
    TUTOR_PROVIDER: raw.TUTOR_PROVIDER,
  });
  if (!result.success) throw new EnvValidationError("server", formatIssues(result.error));
  return result.data;
}

/** Validates both scopes; used at build time by next.config.ts. */
export function validateEnv(raw: RawEnv): { public: PublicEnv; server: ServerEnv } {
  return { public: parsePublicEnv(raw), server: parseServerEnv(raw) };
}
