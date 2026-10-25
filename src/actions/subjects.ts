"use server";

import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import { subjectSchema, topicSchema, type ActionState } from "@/lib/validation";
import { runMutation, text, validate } from "@/server/action-utils";
import { requireUser } from "@/server/auth";
import { UserFacingError, unwrap, unwrapOne } from "@/server/data/errors";
import { createSupabaseServerClient } from "@/server/supabase";

const idSchema = z.uuid();

function subjectInput(formData: FormData) {
  return {
    name: text(formData, "name"),
    level: text(formData, "level"),
    qualification: text(formData, "qualification"),
    examBoard: text(formData, "examBoard"),
    examDate: text(formData, "examDate"),
  };
}

export async function createSubject(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = validate(subjectSchema, subjectInput(formData));
  if (!parsed.ok) return parsed.state;
  let newId: string | null = null;
  const result = await runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    const row = unwrapOne(
      await supabase
        .from("subjects")
        .insert({
          user_id: user.id,
          name: parsed.data.name,
          level: parsed.data.level,
          qualification: parsed.data.qualification,
          exam_board: parsed.data.examBoard,
          exam_date: parsed.data.examDate,
        })
        .select("id")
        .single(),
      "We couldn't add this subject.",
    );
    newId = row.id;
  });
  if (result.status === "error" || !newId) return result;
  if (text(formData, "redirect") === "subject") redirect(`/app/learning/${newId}?created=1`);
  return { status: "success", message: `${parsed.data.name} added.` };
}

export async function updateSubject(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return { status: "error", message: "This subject no longer exists." };
  const parsed = validate(subjectSchema, subjectInput(formData));
  if (!parsed.ok) return parsed.state;
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    const rows = unwrap(
      await supabase
        .from("subjects")
        .update({
          name: parsed.data.name,
          level: parsed.data.level,
          qualification: parsed.data.qualification,
          exam_board: parsed.data.examBoard,
          exam_date: parsed.data.examDate,
        })
        .eq("id", id.data)
        .select("id"),
      "We couldn't save this subject.",
    );
    if (!rows?.length) throw new UserFacingError("This subject no longer exists.");
  }, "Subject updated.");
}

export async function deleteSubject(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return { status: "error", message: "This subject no longer exists." };
  const result = await runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("subjects").delete().eq("id", id.data),
      "We couldn't delete this subject.",
    );
  });
  if (result.status === "error") return result;
  redirect("/app/learning?deleted=1");
}

export async function createTopic(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const subjectId = idSchema.safeParse(text(formData, "subjectId"));
  if (!subjectId.success) return { status: "error", message: "This subject no longer exists." };
  const parsed = validate(topicSchema, {
    name: text(formData, "name"),
    description: text(formData, "description"),
  });
  if (!parsed.ok) return parsed.state;
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("topics").insert({
        user_id: user.id,
        subject_id: subjectId.data,
        name: parsed.data.name,
        description: parsed.data.description,
      }),
      "We couldn't add this topic.",
    );
  }, `${parsed.data.name} added.`);
}

export async function updateTopic(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return { status: "error", message: "This topic no longer exists." };
  const parsed = validate(topicSchema, {
    name: text(formData, "name"),
    description: text(formData, "description"),
  });
  if (!parsed.ok) return parsed.state;
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase
        .from("topics")
        .update({ name: parsed.data.name, description: parsed.data.description })
        .eq("id", id.data),
      "We couldn't save this topic.",
    );
  }, "Topic updated.");
}

export async function deleteTopic(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return { status: "error", message: "This topic no longer exists." };
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("topics").delete().eq("id", id.data),
      "We couldn't delete this topic.",
    );
  }, "Topic deleted.");
}
