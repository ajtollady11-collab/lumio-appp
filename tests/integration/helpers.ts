import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Integration tests need SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (start the stack: `supabase start` or scripts/sandbox-stack/stack.sh up).",
  );
}

export type Client = SupabaseClient<Database>;

export function anonClient(): Client {
  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type TestUser = { id: string; email: string; client: Client };

/** Creates a fresh account and returns a client signed in as it. */
export async function createTestUser(name = "Test student"): Promise<TestUser> {
  const client = anonClient();
  const email = `student-${randomUUID()}@example.com`;
  const password = `pw-${randomUUID()}`;
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });
  if (error) throw error;
  if (!data.session) {
    // Projects that require email confirmation return no session; sign in explicitly.
    const signIn = await client.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
  }
  return { id: data.user!.id, email, client };
}
