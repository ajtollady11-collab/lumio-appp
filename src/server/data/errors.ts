import "server-only";

import type { PostgrestError, PostgrestSingleResponse } from "@supabase/supabase-js";

/** An error safe to show to the student; the technical detail stays in server logs. */
export class UserFacingError extends Error {
  constructor(
    message: string,
    public readonly code: string = "error",
  ) {
    super(message);
    this.name = "UserFacingError";
  }
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  subjects_user_name_key: "You already have a subject with that name.",
  topics_subject_name_key: "This subject already has a topic with that name.",
  quiz_questions_quiz_id_position_key: "That question position is already used.",
};

/** Maps a database error to a message a student can act on, and logs the detail. */
export function toUserFacing(error: PostgrestError, fallback: string): UserFacingError {
  if (error.code === "23505") {
    const constraint = Object.keys(CONSTRAINT_MESSAGES).find((k) => error.message.includes(k));
    return new UserFacingError(
      constraint ? CONSTRAINT_MESSAGES[constraint]! : "That already exists.",
      "duplicate",
    );
  }
  if (error.code === "23503") {
    return new UserFacingError(
      "Something this refers to no longer exists. Refresh and try again.",
      "missing_reference",
    );
  }
  if (error.code === "42501" || error.code === "PGRST301") {
    return new UserFacingError("You don't have access to that. Try signing in again.", "forbidden");
  }
  console.error("[data]", fallback, { code: error.code, message: error.message });
  return new UserFacingError(fallback);
}

/** Throws a user-facing error when a Supabase call failed; returns data otherwise. */
export function unwrap<T>(result: { data: T; error: PostgrestError | null }, fallback: string): T {
  if (result.error) throw toUserFacing(result.error, fallback);
  return result.data;
}

/** Like `unwrap`, for list queries: a successful query always yields an array. */
export function unwrapRows<T>(
  result: { data: T[] | null; error: PostgrestError | null },
  fallback: string,
): T[] {
  if (result.error) throw toUserFacing(result.error, fallback);
  return result.data ?? [];
}

/** For `.single()` inserts and lookups that must return a row. */
export function unwrapOne<T>(result: PostgrestSingleResponse<T>, fallback: string): NonNullable<T> {
  if (result.error) throw toUserFacing(result.error, fallback);
  if (result.data === null || result.data === undefined) throw new UserFacingError(fallback);
  return result.data as NonNullable<T>;
}
