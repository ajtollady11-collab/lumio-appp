"use server";

import "server-only";

import { redirect } from "next/navigation";

import { preferencesSchema, profileSchema, type ActionState } from "@/lib/validation";
import { runMutation, text, texts, validate } from "@/server/action-utils";
import { requireUser } from "@/server/auth";
import { unwrap } from "@/server/data/errors";
import { updateProfile } from "@/server/data/profile";
import { createSupabaseServerClient } from "@/server/supabase";

export async function saveProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = validate(profileSchema, {
    displayName: text(formData, "displayName"),
    educationLevel: text(formData, "educationLevel") || null,
    educationLevelOther: text(formData, "educationLevelOther"),
  });
  if (!parsed.ok) return parsed.state;
  return runMutation(
    () =>
      updateProfile({
        display_name: parsed.data.displayName,
        education_level: parsed.data.educationLevel,
        education_level_other:
          parsed.data.educationLevel === "other" ? parsed.data.educationLevelOther : null,
      }),
    "Profile saved.",
  );
}

export async function savePreferences(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = validate(preferencesSchema, {
    goals: texts(formData, "goals"),
    learningPreference: text(formData, "learningPreference") || null,
  });
  if (!parsed.ok) return parsed.state;
  return runMutation(
    () =>
      updateProfile({
        goals: parsed.data.goals,
        learning_preference: parsed.data.learningPreference,
      }),
    "Learning preferences saved.",
  );
}

/**
 * Permanently deletes the account and all its data. The student must type DELETE;
 * the database function removes the auth user, which cascades to every table.
 */
export async function deleteAccount(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  if (text(formData, "confirmation").trim() !== "DELETE") {
    return {
      status: "error",
      fieldErrors: { confirmation: "Type DELETE in capitals to confirm." },
    };
  }
  const result = await runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    unwrap(
      await supabase.rpc("delete_my_account"),
      "We couldn't delete your account. Nothing was removed.",
    );
    await supabase.auth.signOut({ scope: "local" });
  });
  if (result.status === "error") return result;
  redirect("/?accountDeleted=1");
}
