import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Logo } from "@/components/brand/logo";
import {
  EducationStep,
  GoalsStep,
  PreferenceStep,
  SubjectsStep,
  SummaryStep,
  WelcomeStep,
} from "@/components/onboarding/steps";
import { LoadingBlock, Skeleton } from "@/components/ui/states";
import { EDUCATION_LEVELS, GOALS, LEARNING_PREFERENCES, labelFor } from "@/lib/options";
import { requireUser } from "@/server/auth";
import { getProfile } from "@/server/data/profile";
import { listSubjects } from "@/server/data/subjects";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: `Set up ${brand.name}` };

const STEPS = [
  {
    title: `Let's make ${brand.name} yours.`,
    description: `A few quick questions so ${brand.name} can support the way you learn.`,
  },
  {
    title: "What stage are you at?",
    description: "This helps the tutor pitch explanations at the right level.",
  },
  {
    title: "What are you studying?",
    description: "Pick from the list or add your own. You can add topics later.",
  },
  { title: "What would you like to achieve?", description: "Choose as many as you like." },
  {
    title: "How do you like things explained?",
    description: "Optional — the tutor will lean towards this style.",
  },
  {
    title: "You're all set",
    description: "Here's what you told us. You can change any of it in Settings.",
  },
] as const;

export default function OnboardingPage(props: PageProps<"/onboarding">) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <Logo />
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 justify-center px-4 pt-4 pb-16 focus:outline-none sm:pt-10"
      >
        <div className="w-full max-w-xl">
          <Suspense fallback={<OnboardingSkeleton />}>
            <Onboarding searchParams={props.searchParams} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function OnboardingSkeleton() {
  return (
    <LoadingBlock label="Loading">
      <Skeleton className="h-1.5 w-full" />
      <Skeleton className="mt-8 h-8 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-8 h-40 w-full rounded-md" />
    </LoadingBlock>
  );
}

async function Onboarding({
  searchParams,
}: {
  searchParams: PageProps<"/onboarding">["searchParams"];
}) {
  await requireUser("/onboarding");
  const [params, profile] = await Promise.all([searchParams, getProfile()]);
  const reached = Math.min(Math.max(profile.onboarding_step, 1), 6);
  const requested = Number(typeof params.step === "string" ? params.step : NaN);

  if (!Number.isInteger(requested)) {
    if (profile.onboarding_completed_at) redirect("/app");
    redirect(`/onboarding?step=${reached}`);
  }
  // Steps can be revisited but not skipped.
  if (requested < 1 || requested > reached) redirect(`/onboarding?step=${reached}`);
  const step = requested;
  const meta = STEPS[step - 1]!;
  const subjects = step === 3 || step === 6 ? await listSubjects() : [];

  return (
    <>
      <div className="flex items-center justify-between gap-4 text-sm text-text-muted">
        {step > 1 ? (
          <Link
            href={`/onboarding?step=${step - 1}`}
            className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-sm px-2 font-medium hover:bg-surface-muted hover:text-text"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Back
          </Link>
        ) : (
          <span />
        )}
        <span>
          Step {step} of {STEPS.length}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={step}
        className="mt-3 grid grid-cols-6 gap-1.5"
      >
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={i < step ? "h-1.5 rounded-full bg-brand" : "h-1.5 rounded-full bg-border"}
          />
        ))}
      </div>

      <section
        aria-labelledby="step-title"
        className="mt-8 rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        <h1 id="step-title" className="text-2xl font-semibold tracking-[-0.015em] text-balance">
          {meta.title}
        </h1>
        <p className="mt-2 text-[0.9375rem] text-text-muted">{meta.description}</p>

        {step === 1 ? <WelcomeStep /> : null}
        {step === 2 ? (
          <EducationStep level={profile.education_level} other={profile.education_level_other} />
        ) : null}
        {step === 3 ? <SubjectsStep existing={subjects.map((s) => s.name)} /> : null}
        {step === 4 ? <GoalsStep goals={profile.goals} /> : null}
        {step === 5 ? <PreferenceStep preference={profile.learning_preference} /> : null}
        {step === 6 ? (
          <>
            <dl className="mt-6 divide-y divide-border rounded-md border border-border">
              {[
                {
                  label: "Stage",
                  value:
                    profile.education_level === "other"
                      ? profile.education_level_other
                      : labelFor(EDUCATION_LEVELS, profile.education_level),
                  step: 2,
                },
                { label: "Subjects", value: subjects.map((s) => s.name).join(", "), step: 3 },
                {
                  label: "Goals",
                  value: profile.goals
                    .map((g) => labelFor(GOALS, g))
                    .filter(Boolean)
                    .join(", "),
                  step: 4,
                },
                {
                  label: "Explanations",
                  value: labelFor(LEARNING_PREFERENCES, profile.learning_preference),
                  step: 5,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-4 px-4 py-3 text-sm">
                  <dt className="w-24 shrink-0 text-text-muted">{row.label}</dt>
                  <dd className="min-w-0 flex-1 font-medium">
                    {row.value || <span className="font-normal text-text-muted">Not set</span>}
                  </dd>
                  <Link
                    href={`/onboarding?step=${row.step}`}
                    className="shrink-0 font-medium text-primary hover:underline"
                  >
                    Edit<span className="sr-only"> {row.label.toLowerCase()}</span>
                  </Link>
                </div>
              ))}
            </dl>
            <SummaryStep />
          </>
        ) : null}
      </section>
    </>
  );
}
