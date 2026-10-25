import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { createSupabaseServerClient, isSupabaseConfigured } from "@/server/supabase";

export type SessionUser = { id: string; email: string | null };

/**
 * The signed-in user for this request, verified by Supabase (`getClaims` checks
 * the JWT), or null. Deduplicated per request with React `cache`.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Session checks compare token expiry with the current time, so they must run at
  // request time and never inside a prerender or runtime prefetch.
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
});

/** For pages and actions that need a user: redirects to log in when there is none. */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  return user;
}
