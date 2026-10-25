"use server";

import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/safe-redirect";
import {
  logInSchema,
  newPasswordSchema,
  resetRequestSchema,
  signUpSchema,
  type ActionState,
} from "@/lib/validation";
import { text, validate } from "@/server/action-utils";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/server/supabase";
import { brand } from "@/lib/brand";

const NOT_CONFIGURED: ActionState = {
  status: "error",
  message: `Accounts aren't available yet: ${brand.name}'s authentication service hasn't been configured.`,
};

/** Absolute origin for email links: the configured site URL, else this request's host. */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signUp(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = validate(signUpSchema, {
    displayName: text(formData, "displayName"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    ageConfirmed: formData.get("ageConfirmed") ?? undefined,
  });
  if (!parsed.ok) return parsed.state;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return {
        status: "error",
        fieldErrors: { email: "An account already uses this email. Try logging in." },
      };
    }
    if (error.code === "weak_password") {
      return { status: "error", fieldErrors: { password: "Choose a stronger password." } };
    }
    console.error("[auth] sign-up failed", error.code);
    return { status: "error", message: "We couldn't create your account. Please try again." };
  }

  if (!data.session) {
    return {
      status: "success",
      message: `Check ${parsed.data.email} for a link to confirm your account, then come back to log in.`,
    };
  }
  redirect("/onboarding");
}

export async function logIn(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = validate(logInSchema, {
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (!parsed.ok) return parsed.state;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        status: "error",
        message: "Confirm your email address first, using the link we sent you.",
      };
    }
    return { status: "error", message: "That email and password don't match an account." };
  }
  redirect(safeNextPath(text(formData, "next")));
}

export async function logOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login?signedOut=1");
}

export async function requestPasswordReset(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = validate(resetRequestSchema, { email: text(formData, "email") });
  if (!parsed.ok) return parsed.state;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error && error.status !== 429) console.error("[auth] reset request failed", error.code);
  // Same response whether or not the account exists, so emails can't be enumerated.
  return {
    status: "success",
    message: `If an account uses ${parsed.data.email}, we've sent a link to reset its password. It expires in an hour.`,
  };
}

export async function updatePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = validate(newPasswordSchema, {
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.ok) return parsed.state;

  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { status: "error", message: "Your reset link has expired. Request a new one." };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return {
        status: "error",
        fieldErrors: { password: "Choose a password you haven't used here before." },
      };
    }
    return {
      status: "error",
      message: "We couldn't update your password. Request a new link and try again.",
    };
  }
  redirect("/app?passwordUpdated=1");
}
