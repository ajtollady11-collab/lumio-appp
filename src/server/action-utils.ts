import "server-only";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";

import { fieldErrorsFrom, type ActionState } from "@/lib/validation";
import { UserFacingError } from "@/server/data/errors";
import { SupabaseNotConfiguredError } from "@/server/supabase";
import { brand } from "@/lib/brand";

/** Reads a text field from FormData ("" when missing or not a string). */
export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function texts(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((v): v is string => typeof v === "string");
}

/** Validates input; returns either the parsed value or an error state for the form. */
export function validate<T extends z.ZodType>(
  schema: T,
  input: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; state: ActionState } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    state: {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(result.error),
    },
  };
}

/**
 * Runs a mutation and converts failures to a safe message. Framework control flow
 * (redirect, notFound) is re-thrown. Unknown errors are logged without user content.
 */
export async function runMutation(
  fn: () => Promise<void | ActionState>,
  successMessage?: string,
): Promise<ActionState> {
  try {
    const result = await fn();
    revalidatePath("/app", "layout");
    return result ?? { status: "success", message: successMessage };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UserFacingError) return { status: "error", message: error.message };
    if (error instanceof SupabaseNotConfiguredError) {
      return {
        status: "error",
        message: `${brand.name}'s database isn't configured yet, so changes can't be saved.`,
      };
    }
    console.error(
      "[action] unexpected failure",
      error instanceof Error ? error.name : typeof error,
    );
    return {
      status: "error",
      message: "Something went wrong and nothing was saved. Please try again.",
    };
  }
}
