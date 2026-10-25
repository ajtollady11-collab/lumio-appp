"use server";

import "server-only";

import { redirect } from "next/navigation";

import {
  educationStepSchema,
  goalsSchema,
  learningPreferenceSchema,
  subjectsStepSchema,
  timezoneSchema,
  type ActionState,
} from "@/lib/validation";
import { runMutation, text, texts, validate } from "@/server/action-utils";
import { requireUser } from "@/server/auth";
import { unwrap } from "@/server/data/errors";
import { getProfile, updateProfile } from "@/server/data/profile";
import { createSupabaseServerClient } from "@/server/supabase";

/**
 * Onboarding saves after every step, so a refresh or a closed tab resumes where the
 * student left off (profiles.onboarding_step). Steps:
 * 1 welcome · 2 education · 3 subjects · 4 goals · 5 preference · 6 summary
 */
async function advanceTo(step: number) {
  const profile = await getProfile();
  if (profile.onboarding_step < step) await updateProfile({ onboarding_step: step });
}

export async function startOnboarding(formData: FormData): Promise<void> {
  await requireUser("/onboarding");
  const tz = timezoneSchema.safeParse(text(formData, "timezone"));
  await updateProfile({
    onboarding_step: 2,
    ...(tz.success && tz.data ? { timezone: tz.data } : {}),
  });
  redirect("/onboarding?step=2");
}

export async function saveEducationStep(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("/onboarding");
  const parsed = validate(educationStepSchema, {
    educationLevel: text(formData, "educationLevel"),
    educationLevelOther: text(formData, "educationLevelOther"),
  });
  if (!parsed.ok) return parsed.state;
  const result = await runMutation(async () => {
    await updateProfile({
      education_level: parsed.data.educationLevel,
      education_level_other:
        parsed.data.educationLevel === "other" ? parsed.data.educationLevelOther : null,
    });
    await advanceTo(3);
  });
  if (result.status === "error") return result;
  redirect("/onboarding?step=3");
}

export async function saveSubjectsStep(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/onboarding");
  const parsed = validate(
    subjectsStepSchema,
    texts(formData, "subjects")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  if (!parsed.ok) {
    return {
      status: "error",
      fieldErrors: {
        subjects:
          parsed.state.fieldErrors?.form ??
          Object.values(parsed.state.fieldErrors ?? {})[0] ??
          "Check your subjects.",
      },
    };
  }
  const result = await runMutation(async () => {
    const supabase = await createSupabaseServerClient();
    const existing =
      unwrap(await supabase.from("subjects").select("name"), "We couldn't check your subjects.") ??
      [];
    const have = new Set(existing.map((s) => s.name.trim().toLowerCase()));
    const toAdd = parsed.data.filter((name) => !have.has(name.toLowerCase()));
    if (toAdd.length) {
      unwrap(
        await supabase.from("subjects").insert(toAdd.map((name) => ({ user_id: user.id, name }))),
        "We couldn't save your subjects.",
      );
    }
    await advanceTo(4);
  });
  if (result.status === "error") return result;
  redirect("/onboarding?step=4");
}

export async function saveGoalsStep(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("/onboarding");
  const parsed = validate(goalsSchema, texts(formData, "goals"));
  if (!parsed.ok) {
    return { status: "error", fieldErrors: { goals: "Choose at least one goal." } };
  }
  const result = await runMutation(async () => {
    await updateProfile({ goals: parsed.data });
    await advanceTo(5);
  });
  if (result.status === "error") return result;
  redirect("/onboarding?step=5");
}

export async function savePreferenceStep(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("/onboarding");
  const skip = text(formData, "intent") === "skip";
  const parsed = validate(
    learningPreferenceSchema,
    skip ? null : text(formData, "learningPreference") || null,
  );
  if (!parsed.ok)
    return {
      status: "error",
      fieldErrors: { learningPreference: "Choose an option or skip this step." },
    };
  const result = await runMutation(async () => {
    await updateProfile({ learning_preference: parsed.data });
    await advanceTo(6);
  });
  if (result.status === "error") return result;
  redirect("/onboarding?step=6");
}

export async function completeOnboarding(_: ActionState): Promise<ActionState> {
  await requireUser("/onboarding");
  const result = await runMutation(async () => {
    const profile = await getProfile();
    if (!profile.education_level || profile.goals.length === 0) {
      return {
        status: "error",
        message: "A few required answers are missing. Go back and complete each step.",
      };
    }
    if (!profile.onboarding_completed_at) {
      await updateProfile({
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 6,
      });
    }
  });
  if (result.status === "error") return result;
  redirect("/app?welcome=1");
}
