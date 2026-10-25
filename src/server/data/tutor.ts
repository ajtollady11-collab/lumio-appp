import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { requireUser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";

import { unwrap, unwrapRows } from "./errors";

export type Conversation = Tables<"conversations"> & {
  subject: { id: string; name: string } | null;
};
export type StoredMessage = Pick<Tables<"messages">, "id" | "role" | "content" | "created_at">;

export async function listConversations(limit = 30): Promise<Conversation[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  return unwrapRows(
    await supabase
      .from("conversations")
      .select("*, subject:subjects(id, name)")
      .order("updated_at", { ascending: false })
      .limit(limit),
    "We couldn't load your conversations.",
  ) as Conversation[];
}

/** A conversation and its most recent messages (oldest first), or null if not the user's. */
export async function getConversation(id: string, messageLimit = 100) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const conversation = unwrap(
    await supabase
      .from("conversations")
      .select("*, subject:subjects(id, name)")
      .eq("id", id)
      .maybeSingle(),
    "We couldn't load this conversation.",
  ) as Conversation | null;
  if (!conversation) return null;
  const messages = unwrapRows(
    await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", id)
      .order("id", { ascending: false })
      .limit(messageLimit),
    "We couldn't load the messages.",
  ).reverse() as StoredMessage[];
  return { conversation, messages };
}
