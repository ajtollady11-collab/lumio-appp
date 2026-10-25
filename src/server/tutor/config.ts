import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { getServerEnv } from "@/server/env";

import { AnthropicTutorProvider, TestTutorProvider, type TutorProvider } from "./provider";

export type TutorAvailability =
  { available: true; provider: TutorProvider } | { available: false; reason: "not_configured" };

let cached: TutorProvider | undefined;

/** The configured tutor provider, or a "not configured" result (never a fake AI). */
export function getTutorProvider(): TutorAvailability {
  const env = getServerEnv();
  if (env.TUTOR_PROVIDER === "test") {
    cached ??= new TestTutorProvider();
    return { available: true, provider: cached };
  }
  if (!env.ANTHROPIC_API_KEY) return { available: false, reason: "not_configured" };
  cached ??= new AnthropicTutorProvider(
    env.TUTOR_MODEL,
    new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 60_000 }),
  );
  return { available: true, provider: cached };
}

export function isTutorConfigured(): boolean {
  return getTutorProvider().available;
}

export function isTestProvider(): boolean {
  return getServerEnv().TUTOR_PROVIDER === "test";
}
