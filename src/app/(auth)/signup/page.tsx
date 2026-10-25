import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { AuthCard, NotConfiguredNotice } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/auth-forms";
import { Skeleton } from "@/components/ui/states";
import { isSupabaseConfigured } from "@/server/supabase";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      description="It takes about a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <SignUpContent />
      </Suspense>
    </AuthCard>
  );
}

async function SignUpContent() {
  await connection();
  const configured = isSupabaseConfigured();
  return (
    <div className="flex flex-col gap-4">
      {!configured ? <NotConfiguredNotice /> : null}
      <SignUpForm disabled={!configured} />
    </div>
  );
}
