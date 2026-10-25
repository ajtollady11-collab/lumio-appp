import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { AuthCard, NotConfiguredNotice } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { Skeleton } from "@/components/ui/states";
import { isSupabaseConfigured } from "@/server/supabase";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email you signed up with and we'll send you a reset link."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <ForgotContent />
      </Suspense>
    </AuthCard>
  );
}

async function ForgotContent() {
  await connection();
  const configured = isSupabaseConfigured();
  return (
    <div className="flex flex-col gap-4">
      {!configured ? <NotConfiguredNotice /> : null}
      <ForgotPasswordForm disabled={!configured} />
    </div>
  );
}
