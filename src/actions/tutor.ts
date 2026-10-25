"use server";

import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/lib/validation";
import { runMutation, text } from "@/server/action-utils";
import { requireUser } from "@/server/auth";
import { unwrap } from "@/server/data/errors";
import { createSupabaseServerClient } from "@/server/supabase";

const idSchema = z.uuid();
const titleSchema = z
  .string()
  .trim()
  .min(1, "Enter a title.")
  .max(120, "Keep the title under 121 characters.");

export async function renameConversation(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  const title = titleSchema.safeParse(text(formData, "title"));
  if (!id.success) return { status: "error", message: "This conversation no longer exists." };
  if (!title.success)
    return { status: "error", fieldErrors: { title: title.error.issues[0]!.message } };
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("conversations").update({ title: title.data }).eq("id", id.data),
      "We couldn't rename this conversation.",
    );
  }, "Conversation renamed.");
}

export async function deleteConversation(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return { status: "error", message: "This conversation no longer exists." };
  const result = await runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("conversations").delete().eq("id", id.data),
      "We couldn't delete this conversation.",
    );
  });
  if (result.status === "error") return result;
  redirect("/app/tutor");
}
