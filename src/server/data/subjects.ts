import "server-only";

import { cache } from "react";

import type { Tables } from "@/lib/supabase/database.types";
import { requireUser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";

import { unwrap, unwrapRows } from "./errors";

export type Subject = Tables<"subjects">;
export type Topic = Tables<"topics">;
export type SubjectStats = {
  topics: number;
  tasksTotal: number;
  tasksCompleted: number;
  flashcards: number;
  quizAttempts: number;
  lastActivityAt: string | null;
};

export const listSubjects = cache(async (): Promise<Subject[]> => {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  return unwrapRows(
    await supabase.from("subjects").select("*").order("name"),
    "We couldn't load your subjects.",
  );
});

/** Returns null when the subject does not exist or belongs to someone else. */
export async function getSubject(id: string): Promise<Subject | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  return unwrap(
    await supabase.from("subjects").select("*").eq("id", id).maybeSingle(),
    "We couldn't load this subject.",
  );
}

export const getSubjectStats = cache(async (): Promise<Map<string, SubjectStats>> => {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const rows = unwrapRows(
    await supabase.rpc("get_subject_overview"),
    "We couldn't load subject activity.",
  );
  return new Map(
    rows.map((r) => [
      r.subject_id,
      {
        topics: Number(r.topics),
        tasksTotal: Number(r.tasks_total),
        tasksCompleted: Number(r.tasks_completed),
        flashcards: Number(r.flashcards),
        quizAttempts: Number(r.quiz_attempts),
        lastActivityAt: r.last_activity_at ?? null,
      },
    ]),
  );
});

export async function listTopics(subjectId: string): Promise<Topic[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  return unwrapRows(
    await supabase.from("topics").select("*").eq("subject_id", subjectId).order("created_at"),
    "We couldn't load the topics.",
  );
}
