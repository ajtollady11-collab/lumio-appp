import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/states";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password">
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ResetContent />
      </Suspense>
    </AuthCard>
  );
}

/** Reached from the emailed link via /auth/callback, which signs the student in first. */
async function ResetContent() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[0.9375rem] text-text-muted">
          This reset link has expired or was already used. Request a new one to choose a password.
        </p>
        <ButtonLink href="/forgot-password" variant="secondary">
          Request a new link
        </ButtonLink>
      </div>
    );
  }
  return <ResetPasswordForm />;
}
