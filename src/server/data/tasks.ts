import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { requireUser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";

import { unwrap } from "./errors";

export type StudyTask = Tables<"study_tasks"> & { subject: { id: string; name: string } | null };

const TASK_SELECT = "*, subject:subjects(id, name)" as const;
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

function sortTasks(a: StudyTask, b: StudyTask) {
  return (
    a.scheduled_date.localeCompare(b.scheduled_date) ||
    (a.start_time ?? "99").localeCompare(b.start_time ?? "99") ||
    PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] -
      PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ||
    a.created_at.localeCompare(b.created_at)
  );
}

export type PlannerTasks = {
  overdue: StudyTask[];
  today: StudyTask[];
  upcoming: StudyTask[];
  recentlyCompleted: StudyTask[];
};

/** Tasks grouped for the planner, relative to the student's own "today". */
export async function getPlannerTasks(today: string, subjectId?: string): Promise<PlannerTasks> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  let open = supabase.from("study_tasks").select(TASK_SELECT).eq("status", "planned");
  let done = supabase
    .from("study_tasks")
    .select(TASK_SELECT)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);
  if (subjectId) {
    open = open.eq("subject_id", subjectId);
    done = done.eq("subject_id", subjectId);
  }
  const [openResult, doneResult] = await Promise.all([open.limit(200), done]);
  const openTasks = unwrap(openResult, "We couldn't load your tasks.") as StudyTask[];
  const doneTasks = unwrap(doneResult, "We couldn't load your tasks.") as StudyTask[];

  openTasks.sort(sortTasks);
  return {
    overdue: openTasks.filter((t) => t.scheduled_date < today),
    today: [
      ...openTasks.filter((t) => t.scheduled_date === today),
      ...doneTasks.filter((t) => t.scheduled_date === today),
    ],
    upcoming: openTasks.filter((t) => t.scheduled_date > today),
    recentlyCompleted: doneTasks.filter((t) => t.scheduled_date !== today),
  };
}

export async function getTask(id: string): Promise<StudyTask | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  return unwrap(
    await supabase.from("study_tasks").select(TASK_SELECT).eq("id", id).maybeSingle(),
    "We couldn't load this task.",
  ) as StudyTask | null;
}
