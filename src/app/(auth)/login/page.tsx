import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard, NotConfiguredNotice } from "@/components/auth/auth-card";
import { LogInForm } from "@/components/auth/auth-forms";
import { FormMessage } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/states";
import { safeNextPath } from "@/lib/safe-redirect";
import { isSupabaseConfigured } from "@/server/supabase";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to carry on learning."
      footer={
        <>
          New to {brand.name}?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const notices: Record<string, string> = {
    signedOut: "You've logged out.",
    passwordReset: "Your password has been changed. Log in with your new password.",
  };
  const notice = Object.keys(notices).find((k) => params[k]);
  const linkError = params.error === "link";
  return (
    <div className="flex flex-col gap-4">
      {!configured ? <NotConfiguredNotice /> : null}
      {notice ? <FormMessage tone="success">{notices[notice]}</FormMessage> : null}
      {linkError ? (
        <FormMessage tone="error">
          That link has expired or was already used. Log in, or request a new link.
        </FormMessage>
      ) : null}
      <LogInForm next={safeNextPath(params.next)} disabled={!configured} />
    </div>
  );
}
