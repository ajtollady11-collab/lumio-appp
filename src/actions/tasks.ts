"use server";

import "server-only";

import { z } from "zod";

import { taskSchema, type ActionState } from "@/lib/validation";
import { runMutation, text, validate } from "@/server/action-utils";
import { requireUser } from "@/server/auth";
import { UserFacingError, unwrap } from "@/server/data/errors";
import { createSupabaseServerClient } from "@/server/supabase";

const idSchema = z.uuid();

function taskInput(formData: FormData) {
  return {
    title: text(formData, "title"),
    description: text(formData, "description"),
    subjectId: text(formData, "subjectId"),
    scheduledDate: text(formData, "scheduledDate"),
    startTime: text(formData, "startTime"),
    durationMinutes: text(formData, "durationMinutes"),
    priority: text(formData, "priority") || "medium",
  };
}

export async function createTask(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = validate(taskSchema, taskInput(formData));
  if (!parsed.ok) return parsed.state;
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("study_tasks").insert({
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        subject_id: parsed.data.subjectId,
        scheduled_date: parsed.data.scheduledDate,
        start_time: parsed.data.startTime,
        duration_minutes: parsed.data.durationMinutes,
        priority: parsed.data.priority,
      }),
      "We couldn't add this task.",
    );
  }, "Task added to your planner.");
}

export async function updateTask(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return { status: "error", message: "This task no longer exists." };
  const parsed = validate(taskSchema, taskInput(formData));
  if (!parsed.ok) return parsed.state;
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    const rows = unwrap(
      await supabase
        .from("study_tasks")
        .update({
          title: parsed.data.title,
          description: parsed.data.description,
          subject_id: parsed.data.subjectId,
          scheduled_date: parsed.data.scheduledDate,
          start_time: parsed.data.startTime,
          duration_minutes: parsed.data.durationMinutes,
          priority: parsed.data.priority,
        })
        .eq("id", id.data)
        .select("id"),
      "We couldn't save this task.",
    );
    if (!rows?.length) throw new UserFacingError("This task no longer exists.");
  }, "Task updated.");
}

/** Marks a task complete or reopens it. Completion time is recorded by the server. */
export async function setTaskCompleted(taskId: string, completed: boolean): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(taskId);
  if (!id.success) return { status: "error", message: "This task no longer exists." };
  return runMutation(
    async () => {
      const supabase = await createSupabaseServerClient();
      const rows = unwrap(
        await supabase
          .from("study_tasks")
          .update(
            completed
              ? { status: "completed", completed_at: new Date().toISOString() }
              : { status: "planned", completed_at: null },
          )
          .eq("id", id.data)
          .select("id"),
        "We couldn't update this task.",
      );
      if (!rows?.length) throw new UserFacingError("This task no longer exists.");
    },
    completed ? "Task completed." : "Task reopened.",
  );
}

export async function deleteTask(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return { status: "error", message: "This task no longer exists." };
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("study_tasks").delete().eq("id", id.data),
      "We couldn't delete this task.",
    );
  }, "Task deleted.");
}
