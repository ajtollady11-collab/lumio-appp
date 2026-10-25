import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { logOut } from "@/actions/auth";
import { DeleteAccount, PreferencesForm, ProfileForm } from "@/components/settings/settings-forms";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CardListSkeleton } from "@/components/ui/skeletons";
import { requireUser } from "@/server/auth";
import { getProfile } from "@/server/data/profile";
import { listSubjects } from "@/server/data/subjects";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Settings" };

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-5 border-t border-border py-8 first:border-t-0 first:pt-0 lg:grid-cols-[16rem_minmax(0,1fr)]"
    >
      <div>
        <h2 id={id} className="text-[0.9375rem] font-semibold">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile, learning preferences, account and privacy."
      />
      <Suspense fallback={<CardListSkeleton label="Loading settings" />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  const [user, profile, subjects] = await Promise.all([
    requireUser(),
    getProfile(),
    listSubjects(),
  ]);
  return (
    <div className="rounded-md border border-border bg-surface px-5 py-8 shadow-card sm:px-8">
      <Section id="profile-heading" title="Profile">
        <ProfileForm
          displayName={profile.display_name}
          educationLevel={profile.education_level}
          educationLevelOther={profile.education_level_other}
        />
      </Section>

      <Section
        id="preferences-heading"
        title="Learning preferences"
        description="Used to personalise the AI tutor's explanations."
      >
        <PreferencesForm goals={profile.goals} learningPreference={profile.learning_preference} />
      </Section>

      <Section id="subjects-heading" title="Subjects">
        <p className="text-sm text-text-muted">
          {subjects.length
            ? `You're studying ${subjects.map((s) => s.name).join(", ")}.`
            : "You haven't added any subjects yet."}
        </p>
        <ButtonLink href="/app/learning" variant="secondary" size="sm" className="mt-3">
          Manage subjects
        </ButtonLink>
      </Section>

      <Section id="account-heading" title="Account">
        <dl className="text-sm">
          <dt className="text-text-muted">Email</dt>
          <dd className="mt-0.5 font-medium break-all">{user.email ?? "Not available"}</dd>
        </dl>
        <div className="mt-5 flex flex-col gap-3">
          <form action={logOut}>
            <Button
              type="submit"
              variant="secondary"
              icon={<LogOut className="size-4" aria-hidden="true" />}
            >
              Log out
            </Button>
          </form>
          <DeleteAccount />
        </div>
      </Section>

      <Section id="privacy-heading" title="Privacy">
        <div className="flex flex-col gap-3 text-sm text-text-muted">
          <p>{brand.name} stores what you add or do here so it can show it back to you:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>your email address and first name, and the profile answers you chose to give;</li>
            <li>your subjects, topics, study tasks, flashcards, quizzes and quiz results;</li>
            <li>your tutor conversations, plus usage counts used to limit requests.</li>
          </ul>
          <p>
            When you ask the tutor a question, your message, recent messages in that conversation,
            and your stage, subjects, goals and preference are sent to our AI provider (Anthropic)
            to generate a reply. Your name and email are not sent.
          </p>
          <p>
            Deleting your account removes this data from {brand.name}&apos;s live database
            immediately; copies in database backups expire after a limited period.{" "}
            <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">
              Read the privacy notice
            </Link>{" "}
            (draft).
          </p>
        </div>
      </Section>
    </div>
  );
}
