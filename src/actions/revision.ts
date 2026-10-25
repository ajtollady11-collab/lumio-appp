"use server";

import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  collectionSchema,
  flashcardSchema,
  quizQuestionSchema,
  quizSchema,
  type ActionState,
} from "@/lib/validation";
import { runMutation, text, texts, validate } from "@/server/action-utils";
import { requireUser } from "@/server/auth";
import { UserFacingError, unwrap, unwrapOne } from "@/server/data/errors";
import { createSupabaseServerClient } from "@/server/supabase";

const idSchema = z.uuid();
const missing = (what: string): ActionState => ({
  status: "error",
  message: `This ${what} no longer exists.`,
});

// --- Flashcard collections -------------------------------------------------------
export async function createCollection(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = validate(collectionSchema, {
    name: text(formData, "name"),
    subjectId: text(formData, "subjectId"),
  });
  if (!parsed.ok) return parsed.state;
  let newId: string | null = null;
  const result = await runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    newId = unwrapOne(
      await supabase
        .from("flashcard_collections")
        .insert({ user_id: user.id, name: parsed.data.name, subject_id: parsed.data.subjectId })
        .select("id")
        .single(),
      "We couldn't create this collection.",
    ).id;
  });
  if (result.status === "error" || !newId) return result;
  redirect(`/app/revision/${newId}`);
}

export async function updateCollection(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return missing("collection");
  const parsed = validate(collectionSchema, {
    name: text(formData, "name"),
    subjectId: text(formData, "subjectId"),
  });
  if (!parsed.ok) return parsed.state;
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase
        .from("flashcard_collections")
        .update({ name: parsed.data.name, subject_id: parsed.data.subjectId })
        .eq("id", id.data),
      "We couldn't save this collection.",
    );
  }, "Collection updated.");
}

export async function deleteCollection(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return missing("collection");
  const result = await runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("flashcard_collections").delete().eq("id", id.data),
      "We couldn't delete this collection.",
    );
  });
  if (result.status === "error") return result;
  redirect("/app/revision?deleted=collection");
}

// --- Flashcards ------------------------------------------------------------------
function cardInput(formData: FormData) {
  return {
    front: text(formData, "front"),
    back: text(formData, "back"),
    topic: text(formData, "topic"),
  };
}

export async function createCard(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const collectionId = idSchema.safeParse(text(formData, "collectionId"));
  if (!collectionId.success) return missing("collection");
  const parsed = validate(flashcardSchema, cardInput(formData));
  if (!parsed.ok) return parsed.state;
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("flashcards").insert({
        user_id: user.id,
        collection_id: collectionId.data,
        front: parsed.data.front,
        back: parsed.data.back,
        topic: parsed.data.topic,
      }),
      "We couldn't add this card.",
    );
  }, "Card added.");
}

export async function updateCard(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return missing("card");
  const parsed = validate(flashcardSchema, cardInput(formData));
  if (!parsed.ok) return parsed.state;
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase
        .from("flashcards")
        .update({ front: parsed.data.front, back: parsed.data.back, topic: parsed.data.topic })
        .eq("id", id.data),
      "We couldn't save this card.",
    );
  }, "Card updated.");
}

export async function deleteCard(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return missing("card");
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("flashcards").delete().eq("id", id.data),
      "We couldn't delete this card.",
    );
  }, "Card deleted.");
}

/**
 * Records one review answer. Called as each card is rated, so a session that is
 * abandoned part-way still keeps the cards already reviewed.
 */
export async function recordCardReview(cardId: string, remembered: boolean): Promise<ActionState> {
  const user = await requireUser();
  const id = idSchema.safeParse(cardId);
  if (!id.success) return missing("card");
  try {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase
        .from("flashcard_reviews")
        .insert({ user_id: user.id, flashcard_id: id.data, remembered }),
      "We couldn't save that answer.",
    );
    return { status: "success" };
  } catch (error) {
    if (error instanceof UserFacingError) return { status: "error", message: error.message };
    return { status: "error", message: "We couldn't save that answer. Check your connection." };
  }
}

// --- Quizzes ---------------------------------------------------------------------
function quizInput(formData: FormData) {
  return {
    title: text(formData, "title"),
    description: text(formData, "description"),
    subjectId: text(formData, "subjectId"),
  };
}

export async function createQuiz(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = validate(quizSchema, quizInput(formData));
  if (!parsed.ok) return parsed.state;
  let newId: string | null = null;
  const result = await runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    newId = unwrapOne(
      await supabase
        .from("quizzes")
        .insert({
          user_id: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          subject_id: parsed.data.subjectId,
        })
        .select("id")
        .single(),
      "We couldn't create this quiz.",
    ).id;
  });
  if (result.status === "error" || !newId) return result;
  redirect(`/app/revision/quizzes/${newId}`);
}

export async function updateQuiz(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return missing("quiz");
  const parsed = validate(quizSchema, quizInput(formData));
  if (!parsed.ok) return parsed.state;
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase
        .from("quizzes")
        .update({
          title: parsed.data.title,
          description: parsed.data.description,
          subject_id: parsed.data.subjectId,
        })
        .eq("id", id.data),
      "We couldn't save this quiz.",
    );
  }, "Quiz updated.");
}

export async function deleteQuiz(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return missing("quiz");
  const result = await runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("quizzes").delete().eq("id", id.data),
      "We couldn't delete this quiz.",
    );
  });
  if (result.status === "error") return result;
  redirect("/app/revision?deleted=quiz");
}

/** Adds a question (no id) or updates one (with id). */
export async function saveQuestion(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const quizId = idSchema.safeParse(text(formData, "quizId"));
  if (!quizId.success) return missing("quiz");
  const questionId = text(formData, "id");
  const parsed = validate(quizQuestionSchema, {
    prompt: text(formData, "prompt"),
    options: texts(formData, "options"),
    correctOption: text(formData, "correctOption") === "" ? -1 : text(formData, "correctOption"),
    explanation: text(formData, "explanation"),
  });
  if (!parsed.ok) return parsed.state;

  return runMutation(
    async () => {
      const supabase = await createSupabaseServerClient();
      const fields = {
        prompt: parsed.data.prompt,
        options: parsed.data.options,
        correct_option: parsed.data.correctOption,
        explanation: parsed.data.explanation,
      };
      if (questionId) {
        const id = idSchema.safeParse(questionId);
        if (!id.success) throw new UserFacingError("This question no longer exists.");
        unwrap(
          await supabase.from("quiz_questions").update(fields).eq("id", id.data),
          "We couldn't save this question.",
        );
        return;
      }
      const last = unwrap(
        await supabase
          .from("quiz_questions")
          .select("position")
          .eq("quiz_id", quizId.data)
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle(),
        "We couldn't add this question.",
      );
      const position = (last?.position ?? 0) + 1;
      if (position > 50) throw new UserFacingError("A quiz can have up to 50 questions.");
      unwrap(
        await supabase
          .from("quiz_questions")
          .insert({ ...fields, user_id: user.id, quiz_id: quizId.data, position }),
        "We couldn't add this question.",
      );
    },
    questionId ? "Question updated." : "Question added.",
  );
}

export async function deleteQuestion(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(text(formData, "id"));
  if (!id.success) return missing("question");
  return runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.from("quiz_questions").delete().eq("id", id.data),
      "We couldn't delete this question.",
    );
  }, "Question deleted.");
}

export type QuizResult = {
  attemptId: string;
  score: number;
  total: number;
  results: {
    question_id: string;
    prompt: string;
    options: string[];
    selected: number | null;
    correct_option: number;
    is_correct: boolean;
    explanation: string | null;
  }[];
};

/** Submits answers; the database scores them against the stored answer key. */
export async function submitQuiz(
  quizId: string,
  answers: Record<string, number>,
): Promise<{ ok: true; result: QuizResult } | { ok: false; message: string }> {
  await requireUser();
  const id = idSchema.safeParse(quizId);
  const parsedAnswers = z.record(z.uuid(), z.number().int().min(0).max(5)).safeParse(answers);
  if (!id.success || !parsedAnswers.success)
    return { ok: false, message: "Those answers couldn't be read. Try again." };
  try {
    const supabase = await createSupabaseServerClient();
    const data = unwrap(
      await supabase.rpc("submit_quiz_attempt", {
        p_quiz_id: id.data,
        p_answers: parsedAnswers.data,
      }),
      "We couldn't mark this quiz. Your answers weren't saved.",
    ) as { attempt_id: string; score: number; total: number; results: QuizResult["results"] };
    return {
      ok: true,
      result: {
        attemptId: data.attempt_id,
        score: data.score,
        total: data.total,
        results: data.results,
      },
    };
  } catch (error) {
    if (error instanceof UserFacingError) return { ok: false, message: error.message };
    return {
      ok: false,
      message: "We couldn't mark this quiz. Check your connection and try again.",
    };
  }
}
