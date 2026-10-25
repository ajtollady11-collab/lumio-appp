/**
 * Row-level security and database-function tests against a real Supabase stack
 * (GoTrue + PostgREST + Postgres with supabase/migrations applied).
 *
 * Two students, A and B. Every test asserts what B can and cannot do with A's data,
 * using B's own signed-in client — exactly what a malicious browser could attempt.
 */
import { beforeAll, describe, expect, it } from "vitest";

import { anonClient, createTestUser, type TestUser } from "./helpers";

let a: TestUser;
let b: TestUser;
const ids = {} as Record<
  "subject" | "topic" | "task" | "collection" | "card" | "quiz" | "question",
  string
>;

beforeAll(async () => {
  a = await createTestUser("Alex");
  b = await createTestUser("Blake");

  const subject = await a.client
    .from("subjects")
    .insert({ user_id: a.id, name: "Chemistry", exam_board: "AQA" })
    .select("id")
    .single();
  if (subject.error) throw subject.error;
  ids.subject = subject.data.id;

  const topic = await a.client
    .from("topics")
    .insert({ user_id: a.id, subject_id: ids.subject, name: "Moles" })
    .select("id")
    .single();
  if (topic.error) throw topic.error;
  ids.topic = topic.data.id;

  const task = await a.client
    .from("study_tasks")
    .insert({
      user_id: a.id,
      subject_id: ids.subject,
      title: "Revise moles",
      scheduled_date: "2026-11-01",
    })
    .select("id")
    .single();
  if (task.error) throw task.error;
  ids.task = task.data.id;

  const collection = await a.client
    .from("flashcard_collections")
    .insert({ user_id: a.id, name: "Chemistry basics", subject_id: ids.subject })
    .select("id")
    .single();
  if (collection.error) throw collection.error;
  ids.collection = collection.data.id;

  const card = await a.client
    .from("flashcards")
    .insert({
      user_id: a.id,
      collection_id: ids.collection,
      front: "Avogadro constant?",
      back: "6.02 × 10²³",
    })
    .select("id")
    .single();
  if (card.error) throw card.error;
  ids.card = card.data.id;

  const quiz = await a.client
    .from("quizzes")
    .insert({ user_id: a.id, title: "Moles check", subject_id: ids.subject })
    .select("id")
    .single();
  if (quiz.error) throw quiz.error;
  ids.quiz = quiz.data.id;

  const questions = await a.client
    .from("quiz_questions")
    .insert([
      {
        user_id: a.id,
        quiz_id: ids.quiz,
        position: 1,
        prompt: "Mr of H2O?",
        options: ["16", "18", "20"],
        correct_option: 1,
      },
      {
        user_id: a.id,
        quiz_id: ids.quiz,
        position: 2,
        prompt: "Mr of CO2?",
        options: ["28", "44"],
        correct_option: 1,
        explanation: "12 + 2 × 16",
      },
    ])
    .select("id, position")
    .order("position");
  if (questions.error) throw questions.error;
  ids.question = questions.data[0]!.id;
});

describe("profiles", () => {
  it("are created automatically with the display name from sign-up", async () => {
    const { data, error } = await a.client.from("profiles").select("id, display_name").single();
    expect(error).toBeNull();
    expect(data).toEqual({ id: a.id, display_name: "Alex" });
  });

  it("are invisible to other students", async () => {
    const { data } = await b.client.from("profiles").select("id").eq("id", a.id);
    expect(data).toEqual([]);
  });

  it("cannot be changed by another student", async () => {
    await b.client.from("profiles").update({ display_name: "Hacked" }).eq("id", a.id);
    const { data } = await a.client.from("profiles").select("display_name").single();
    expect(data?.display_name).toBe("Alex");
  });

  it("reject values outside the allowed sets", async () => {
    const { error } = await a.client
      .from("profiles")
      .update({ goals: ["become_a_wizard"] })
      .eq("id", a.id);
    expect(error).not.toBeNull();
  });
});

describe("owner-only tables", () => {
  const tables = [
    ["subjects", "subject"],
    ["topics", "topic"],
    ["study_tasks", "task"],
    ["flashcard_collections", "collection"],
    ["flashcards", "card"],
    ["quizzes", "quiz"],
    ["quiz_questions", "question"],
  ] as const;

  for (const [table, key] of tables) {
    it(`${table}: another student cannot read, update or delete`, async () => {
      const read = await b.client.from(table).select("id").eq("id", ids[key]);
      expect(read.data).toEqual([]);

      const update = await b.client.from(table).delete().eq("id", ids[key]).select("id");
      expect(update.data).toEqual([]);

      const stillThere = await a.client.from(table).select("id").eq("id", ids[key]);
      expect(stillThere.data).toHaveLength(1);
    });

    it(`${table}: signed-out visitors see nothing`, async () => {
      const { data, error } = await anonClient().from(table).select("id");
      expect(data ?? []).toEqual([]);
      if (error) expect(error.code).toBe("42501");
    });
  }

  it("rejects rows inserted with another student's user id", async () => {
    const { error } = await b.client.from("subjects").insert({ user_id: a.id, name: "Spoofed" });
    expect(error).not.toBeNull();
  });

  it("rejects attaching a topic to another student's subject", async () => {
    const { error } = await b.client
      .from("topics")
      .insert({ user_id: b.id, subject_id: ids.subject, name: "Sneaky" });
    expect(error).not.toBeNull();
  });

  it("rejects attaching a card to another student's collection", async () => {
    const { error } = await b.client
      .from("flashcards")
      .insert({ user_id: b.id, collection_id: ids.collection, front: "x", back: "y" });
    expect(error).not.toBeNull();
  });

  it("rejects linking a task to another student's subject", async () => {
    const { error } = await b.client
      .from("study_tasks")
      .insert({ user_id: b.id, subject_id: ids.subject, title: "x", scheduled_date: "2026-11-01" });
    expect(error).not.toBeNull();
  });

  it("rejects moving an owned row to another student", async () => {
    const own = await b.client
      .from("subjects")
      .insert({ user_id: b.id, name: "Physics" })
      .select("id")
      .single();
    const { error } = await b.client
      .from("subjects")
      .update({ user_id: a.id })
      .eq("id", own.data!.id);
    expect(error).not.toBeNull();
  });

  it("enforces one subject name per student, case-insensitively", async () => {
    const { error } = await a.client.from("subjects").insert({ user_id: a.id, name: "chemistry" });
    expect(error?.code).toBe("23505");
  });

  it("keeps a task when its subject is deleted, clearing only the link", async () => {
    const subject = await b.client
      .from("subjects")
      .insert({ user_id: b.id, name: "Temporary" })
      .select("id")
      .single();
    const task = await b.client
      .from("study_tasks")
      .insert({
        user_id: b.id,
        subject_id: subject.data!.id,
        title: "Linked",
        scheduled_date: "2026-11-02",
      })
      .select("id")
      .single();
    await b.client.from("subjects").delete().eq("id", subject.data!.id);
    const { data } = await b.client
      .from("study_tasks")
      .select("subject_id, user_id")
      .eq("id", task.data!.id)
      .single();
    expect(data).toEqual({ subject_id: null, user_id: b.id });
  });
});

describe("records students cannot forge", () => {
  it("messages cannot be inserted directly", async () => {
    const { error } = await a.client.from("messages").insert({
      conversation_id: crypto.randomUUID(),
      user_id: a.id,
      role: "assistant",
      content: "fake",
    });
    expect(error).not.toBeNull();
  });

  it("AI usage cannot be inserted, edited or deleted", async () => {
    const insert = await a.client.from("ai_requests").insert({ user_id: a.id });
    expect(insert.error).not.toBeNull();
  });

  it("quiz attempts cannot be inserted directly", async () => {
    const { error } = await a.client.from("quiz_attempts").insert({
      user_id: a.id,
      quiz_id: ids.quiz,
      quiz_title: "Moles check",
      score: 99,
      total: 99,
      results: [],
    });
    expect(error).not.toBeNull();
  });

  it("flashcard reviews can be recorded only for your own cards", async () => {
    const own = await a.client
      .from("flashcard_reviews")
      .insert({ user_id: a.id, flashcard_id: ids.card, remembered: true });
    expect(own.error).toBeNull();
    const other = await b.client
      .from("flashcard_reviews")
      .insert({ user_id: b.id, flashcard_id: ids.card, remembered: true });
    expect(other.error).not.toBeNull();
  });
});

describe("tutor exchange functions", () => {
  it("store a complete exchange and keep it private", async () => {
    const reserved = await a.client.rpc("reserve_tutor_request");
    expect(reserved.error).toBeNull();

    const completed = await a.client.rpc("complete_tutor_request", {
      p_request_id: reserved.data!,
      p_user_content: "What is a mole?",
      p_assistant_content: "A mole is an amount of substance…",
      p_model: "test-model",
      p_input_tokens: 10,
      p_output_tokens: 20,
      p_subject_id: ids.subject,
    });
    expect(completed.error).toBeNull();
    const conversationId = completed.data!;

    const messages = await a.client
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("id");
    expect(messages.data?.map((m) => m.role)).toEqual(["user", "assistant"]);

    const conversation = await a.client
      .from("conversations")
      .select("title, subject_id")
      .eq("id", conversationId)
      .single();
    expect(conversation.data).toEqual({ title: "What is a mole?", subject_id: ids.subject });

    expect(
      (await b.client.from("messages").select("id").eq("conversation_id", conversationId)).data,
    ).toEqual([]);
    expect(
      (await b.client.from("conversations").select("id").eq("id", conversationId)).data,
    ).toEqual([]);
  });

  it("refuse to complete another student's request or append to their conversation", async () => {
    const reservedA = await a.client.rpc("reserve_tutor_request");
    const hijack = await b.client.rpc("complete_tutor_request", {
      p_request_id: reservedA.data!,
      p_user_content: "x",
      p_assistant_content: "y",
      p_model: "m",
      p_input_tokens: 0,
      p_output_tokens: 0,
    });
    expect(hijack.error?.message).toContain("request_not_found");

    const conversations = await a.client.from("conversations").select("id").limit(1).single();
    const reservedB = await b.client.rpc("reserve_tutor_request");
    const intrude = await b.client.rpc("complete_tutor_request", {
      p_request_id: reservedB.data!,
      p_user_content: "x",
      p_assistant_content: "y",
      p_model: "m",
      p_input_tokens: 0,
      p_output_tokens: 0,
      p_conversation_id: conversations.data!.id,
    });
    expect(intrude.error?.message).toContain("conversation_not_found");
  });

  it("do not save anything for a failed request", async () => {
    const before = await a.client.from("messages").select("id", { count: "exact", head: true });
    const reserved = await a.client.rpc("reserve_tutor_request");
    const failed = await a.client.rpc("fail_tutor_request", {
      p_request_id: reserved.data!,
      p_error_code: "timeout",
    });
    expect(failed.error).toBeNull();
    const after = await a.client.from("messages").select("id", { count: "exact", head: true });
    expect(after.count).toBe(before.count);

    const request = await a.client
      .from("ai_requests")
      .select("status, error_code")
      .eq("id", reserved.data!)
      .single();
    expect(request.data).toEqual({ status: "failed", error_code: "timeout" });
  });

  it("enforce the short-window rate limit", async () => {
    const c = await createTestUser("Rate limited");
    for (let i = 0; i < 20; i++) {
      const r = await c.client.rpc("reserve_tutor_request");
      expect(r.error).toBeNull();
    }
    const blocked = await c.client.rpc("reserve_tutor_request");
    expect(blocked.error?.message).toContain("rate_limited_short");
  });

  it("reject signed-out callers", async () => {
    const { error } = await anonClient().rpc("reserve_tutor_request");
    expect(error).not.toBeNull();
  });
});

describe("quiz scoring", () => {
  it("scores against the stored answer key and records the attempt", async () => {
    const questions = await a.client
      .from("quiz_questions")
      .select("id, position")
      .eq("quiz_id", ids.quiz)
      .order("position");
    const [q1, q2] = questions.data!;
    const { data, error } = await a.client.rpc("submit_quiz_attempt", {
      p_quiz_id: ids.quiz,
      p_answers: { [q1!.id]: 1, [q2!.id]: 0 },
    });
    expect(error).toBeNull();
    const result = data as {
      score: number;
      total: number;
      results: { is_correct: boolean; correct_option: number }[];
    };
    expect(result.score).toBe(1);
    expect(result.total).toBe(2);
    expect(result.results.map((r) => r.is_correct)).toEqual([true, false]);
    expect(result.results[1]!.correct_option).toBe(1);

    const attempts = await a.client
      .from("quiz_attempts")
      .select("score, total")
      .eq("quiz_id", ids.quiz);
    expect(attempts.data).toContainEqual({ score: 1, total: 2 });
  });

  it("counts unanswered and invalid answers as incorrect", async () => {
    const { data } = await a.client.rpc("submit_quiz_attempt", {
      p_quiz_id: ids.quiz,
      p_answers: {},
    });
    expect((data as { score: number }).score).toBe(0);
  });

  it("refuses another student's quiz", async () => {
    const { error } = await b.client.rpc("submit_quiz_attempt", {
      p_quiz_id: ids.quiz,
      p_answers: {},
    });
    expect(error?.message).toContain("quiz_not_found");
  });

  it("rejects a question whose correct answer is not one of its options", async () => {
    const { error } = await a.client.from("quiz_questions").insert({
      user_id: a.id,
      quiz_id: ids.quiz,
      position: 3,
      prompt: "Bad",
      options: ["a", "b"],
      correct_option: 2,
    });
    expect(error).not.toBeNull();
  });
});

describe("progress summary", () => {
  it("reflects only the caller's own records", async () => {
    const summaryA = await a.client.rpc("get_progress_summary", { p_timezone: "Europe/London" });
    const summaryB = await b.client.rpc("get_progress_summary", { p_timezone: "Europe/London" });
    const sa = summaryA.data as Record<string, number>;
    const sb = summaryB.data as Record<string, number>;
    expect(sa.cards_reviewed).toBe(1);
    expect(sa.quizzes_completed).toBeGreaterThanOrEqual(1);
    expect(sb.cards_reviewed).toBe(0);
    expect(sb.quizzes_completed).toBe(0);
    expect((summaryA.data as { daily: unknown[] }).daily).toHaveLength(14);
  });

  it("falls back to UTC for an unknown time zone", async () => {
    const { error } = await a.client.rpc("get_progress_summary", { p_timezone: "Not/AZone" });
    expect(error).toBeNull();
  });
});

describe("account deletion", () => {
  it("removes the account and every row that belonged to it", async () => {
    const d = await createTestUser("Leaving");
    await d.client.from("subjects").insert({ user_id: d.id, name: "History" });
    const { error } = await d.client.rpc("delete_my_account");
    expect(error).toBeNull();

    // The old session's token still parses, but its user and data are gone.
    const subjects = await d.client.from("subjects").select("id");
    expect(subjects.data ?? []).toEqual([]);
    const relogin = await anonClient().auth.signInWithPassword({
      email: d.email,
      password: "irrelevant",
    });
    expect(relogin.error).not.toBeNull();
  });
});
