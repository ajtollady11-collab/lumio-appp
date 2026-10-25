import { BookOpen, Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { SubjectCard } from "@/components/learning/subject-card";
import { SubjectFormDialog } from "@/components/learning/subject-form-dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { GridSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/states";
import { todayInZone } from "@/lib/dates";
import { getProfile } from "@/server/data/profile";
import { getSubjectStats, listSubjects } from "@/server/data/subjects";

export const metadata: Metadata = { title: "My Learning" };

export default function LearningPage(props: PageProps<"/app/learning">) {
  return (
    <>
      <PageHeader
        title="My Learning"
        description="Your subjects and the topics inside them. Open a subject to see its tasks, flashcards and quizzes."
      />
      <Suspense fallback={<GridSkeleton label="Loading your subjects" />}>
        <LearningContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

const EMPTY_STATS = { topics: 0, tasksTotal: 0, tasksCompleted: 0, flashcards: 0, quizAttempts: 0 };

async function LearningContent({
  searchParams,
}: {
  searchParams: PageProps<"/app/learning">["searchParams"];
}) {
  const params = await searchParams;
  const [profile, subjects, stats] = await Promise.all([
    getProfile(),
    listSubjects(),
    getSubjectStats(),
  ]);
  const today = todayInZone(profile.timezone);
  const addButton = (
    <SubjectFormDialog
      openAfterCreate
      defaultOpen={params.new === "1"}
      trigger={<Button icon={<Plus className="size-4" aria-hidden="true" />}>Add subject</Button>}
    />
  );

  if (!subjects.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Add your first subject"
        description="Subjects organise everything else: topics, study tasks, flashcards and quizzes. Add one you're studying now."
        action={addButton}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          {subjects.length} subject{subjects.length === 1 ? "" : "s"}
        </p>
        {addButton}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((s) => (
          <li key={s.id}>
            <SubjectCard subject={{ ...s, stats: stats.get(s.id) ?? EMPTY_STATS }} today={today} />
          </li>
        ))}
      </ul>
    </div>
  );
}
