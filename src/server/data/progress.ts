import "server-only";

import { requireUser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";

import { unwrap } from "./errors";

export type DailyActivity = {
  day: string;
  tasks: number;
  cards: number;
  quizzes: number;
  tutor: number;
};

export type ProgressSummary = {
  tasksCompleted: number;
  tasksTotal: number;
  minutesCompleted: number;
  cardsReviewed: number;
  cardsRemembered: number;
  quizzesCompleted: number;
  quizQuestionsAnswered: number;
  quizQuestionsCorrect: number;
  tutorQuestions: number;
  subjects: number;
  flashcards: number;
  today: string;
  daily: DailyActivity[];
};

type RawSummary = {
  tasks_completed: number;
  tasks_total: number;
  minutes_completed: number;
  cards_reviewed: number;
  cards_remembered: number;
  quizzes_completed: number;
  quiz_questions_answered: number;
  quiz_questions_correct: number;
  tutor_questions: number;
  subjects: number;
  flashcards: number;
  today: string;
  daily: DailyActivity[];
};

/** Totals computed by the database from the student's stored records only. */
export async function getProgressSummary(timeZone: string): Promise<ProgressSummary> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const raw = unwrap(
    await supabase.rpc("get_progress_summary", { p_timezone: timeZone }),
    "We couldn't load your progress.",
  ) as unknown as RawSummary;
  return {
    tasksCompleted: Number(raw.tasks_completed),
    tasksTotal: Number(raw.tasks_total),
    minutesCompleted: Number(raw.minutes_completed),
    cardsReviewed: Number(raw.cards_reviewed),
    cardsRemembered: Number(raw.cards_remembered),
    quizzesCompleted: Number(raw.quizzes_completed),
    quizQuestionsAnswered: Number(raw.quiz_questions_answered),
    quizQuestionsCorrect: Number(raw.quiz_questions_correct),
    tutorQuestions: Number(raw.tutor_questions),
    subjects: Number(raw.subjects),
    flashcards: Number(raw.flashcards),
    today: raw.today,
    daily: raw.daily ?? [],
  };
}
