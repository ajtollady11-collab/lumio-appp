import "server-only";

import { cache } from "react";

import type { Tables } from "@/lib/supabase/database.types";
import { requireUser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";

import { UserFacingError, unwrap } from "./errors";

export type Profile = Tables<"profiles">;

/** The signed-in student's profile (created automatically at sign-up). */
export const getProfile = cache(async (): Promise<Profile> => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const profile = unwrap(
    await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    "We couldn't load your profile.",
  );
  if (!profile) throw new UserFacingError("Your profile is missing. Please sign out and in again.");
  return profile;
});

type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "display_name"
    | "education_level"
    | "education_level_other"
    | "goals"
    | "learning_preference"
    | "onboarding_step"
    | "onboarding_completed_at"
    | "timezone"
  >
>;

export async function updateProfile(update: ProfileUpdate): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  unwrap(
    await supabase.from("profiles").update(update).eq("id", user.id),
    "We couldn't save your changes.",
  );
}
