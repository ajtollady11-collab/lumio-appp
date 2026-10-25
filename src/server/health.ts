import "server-only";

import { getServerEnv } from "@/server/env";

export type HealthReport = {
  status: "ok";
  environment: string;
  commit: string | null;
  checkedAt: string;
};

/**
 * Liveness report for uptime monitoring.
 * M1a has no database yet; dependency checks (Supabase) are added in M1c.
 * Never include secrets, user data or internal hostnames here — the endpoint is public.
 */
export function getHealthReport(now: Date = new Date()): HealthReport {
  const env = getServerEnv();
  return {
    status: "ok",
    environment: env.APP_ENV,
    commit: env.VERCEL_GIT_COMMIT_SHA ? env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : null,
    checkedAt: now.toISOString(),
  };
}
