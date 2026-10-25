import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { requireUser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";

import { unwrap, unwrapRows } from "./errors";

export type Collection = Tables<"flashcard_collections"> & {
  subject: { id: string; name: string } | null;
  cards: { count: number }[];
};
export type Flashcard = Tables<"flashcards">;
export type Quiz = Tables<"quizzes"> & {
  subject: { id: string; name: string } | null;
  questions: { count: number }[];
};
export type QuizQuestion = Tables<"quiz_questions">;
export type QuizAttempt = Tables<"quiz_attempts">;

/** A question as shown while taking a quiz: no answer key. */
export type QuizQuestionForAttempt = Pick<QuizQuestion, "id" | "position" | "prompt" | "options">;

export async function listCollections(subjectId?: string): Promise<Collection[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("flashcard_collections")
    .select("*, subject:subjects(id, name), cards:flashcards(count)")
    .order("updated_at", { ascending: false });
  if (subjectId) query = query.eq("subject_id", subjectId);
  return unwrap(await query, "We couldn't load your collections.") as Collection[];
}

export async function getCollection(id: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const collection = unwrap(
    await supabase
      .from("flashcard_collections")
      .select("*, subject:subjects(id, name)")
      .eq("id", id)
      .maybeSingle(),
    "We couldn't load this collection.",
  );
  if (!collection) return null;
  const cards = unwrapRows(
    await supabase
      .from("flashcards")
      .select("*")
      .eq("collection_id", id)
      .order("created_at")
      .limit(500),
    "We couldn't load the cards.",
  );
  return { collection: collection as Omit<Collection, "cards">, cards };
}

/** Review counts per card in a collection, for the "last reviewed" indicators. */
export async function getCollectionReviewStats(collectionId: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const rows = unwrapRows(
    await supabase
      .from("flashcard_reviews")
      .select("remembered, reviewed_at, card:flashcards!inner(collection_id)")
      .eq("card.collection_id", collectionId)
      .order("reviewed_at", { ascending: false })
      .limit(1000),
    "We couldn't load review history.",
  );
  return {
    reviews: rows.length,
    remembered: rows.filter((r) => r.remembered).length,
    lastReviewedAt: rows[0]?.reviewed_at ?? null,
  };
}

export async function listQuizzes(subjectId?: string): Promise<Quiz[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("quizzes")
    .select("*, subject:subjects(id, name), questions:quiz_questions(count)")
    .order("updated_at", { ascending: false });
  if (subjectId) query = query.eq("subject_id", subjectId);
  return unwrap(await query, "We couldn't load your quizzes.") as Quiz[];
}

export async function getQuizForEditing(id: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const quiz = unwrap(
    await supabase
      .from("quizzes")
      .select("*, subject:subjects(id, name)")
      .eq("id", id)
      .maybeSingle(),
    "We couldn't load this quiz.",
  );
  if (!quiz) return null;
  const questions = unwrapRows(
    await supabase.from("quiz_questions").select("*").eq("quiz_id", id).order("position"),
    "We couldn't load the questions.",
  );
  const attempts = unwrapRows(
    await supabase
      .from("quiz_attempts")
      .select("id, score, total, completed_at")
      .eq("quiz_id", id)
      .order("completed_at", { ascending: false })
      .limit(10),
    "We couldn't load your attempts.",
  );
  return { quiz: quiz as Omit<Quiz, "questions">, questions, attempts };
}

/** Questions for taking a quiz. The answer key and explanations are never sent. */
export async function getQuizForAttempt(id: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const quiz = unwrap(
    await supabase.from("quizzes").select("id, title, description").eq("id", id).maybeSingle(),
    "We couldn't load this quiz.",
  );
  if (!quiz) return null;
  const questions = unwrapRows(
    await supabase
      .from("quiz_questions")
      .select("id, position, prompt, options")
      .eq("quiz_id", id)
      .order("position"),
    "We couldn't load the questions.",
  ) as QuizQuestionForAttempt[];
  return { quiz, questions };
}

export async function listRecentAttempts(limit = 5) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  return unwrapRows(
    await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, quiz_title, score, total, completed_at")
      .order("completed_at", { ascending: false })
      .limit(limit),
    "We couldn't load your recent quizzes.",
  );
}
