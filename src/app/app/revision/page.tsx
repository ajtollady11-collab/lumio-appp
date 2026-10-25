import { Layers, ListChecks, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CollectionFormDialog, QuizFormDialog } from "@/components/revision/revision-forms";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/progress";
import { GridSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/states";
import { friendlyDate, todayInZone, dateInZone } from "@/lib/dates";
import { getProfile } from "@/server/data/profile";
import { listCollections, listQuizzes, listRecentAttempts } from "@/server/data/revision";
import { listSubjects } from "@/server/data/subjects";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Revision" };

export default function RevisionPage(props: PageProps<"/app/revision">) {
  return (
    <>
      <PageHeader
        title="Revision"
        description="Test yourself with flashcards and quizzes you write. Each card you review and quiz you take is saved to your progress."
      />
      <Suspense fallback={<GridSkeleton label="Loading your revision" />}>
        <RevisionContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function RevisionContent({
  searchParams,
}: {
  searchParams: PageProps<"/app/revision">["searchParams"];
}) {
  const params = await searchParams;
  const subjectParam = typeof params.subject === "string" ? params.subject : undefined;
  const [profile, subjects, collections, quizzes, attempts] = await Promise.all([
    getProfile(),
    listSubjects(),
    listCollections(),
    listQuizzes(),
    listRecentAttempts(5),
  ]);
  const today = todayInZone(profile.timezone);
  const subjectOptions = subjects.map((s) => ({ id: s.id, name: s.name }));
  const defaultSubjectId = subjectOptions.some((s) => s.id === subjectParam)
    ? subjectParam
    : undefined;
  const firstWithCards = collections.find((c) => (c.cards[0]?.count ?? 0) > 0);

  // The header and empty-state buttons share one dialog design; only the header
  // copy opens itself from a `?new=` link so the dialog never appears twice.
  const newCollection = (openFromUrl = false) => (
    <CollectionFormDialog
      subjects={subjectOptions}
      defaultSubjectId={defaultSubjectId}
      defaultOpen={openFromUrl && params.new === "collection"}
      trigger={
        <Button icon={<Plus className="size-4" aria-hidden="true" />}>New collection</Button>
      }
    />
  );
  const newQuiz = (openFromUrl = false) => (
    <QuizFormDialog
      subjects={subjectOptions}
      defaultSubjectId={defaultSubjectId}
      defaultOpen={openFromUrl && params.new === "quiz"}
      trigger={
        <Button variant="secondary" icon={<Plus className="size-4" aria-hidden="true" />}>
          New quiz
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {firstWithCards ? (
          <ButtonLink href={`/app/revision/${firstWithCards.id}/review`} variant="subtle">
            Start a review session
          </ButtonLink>
        ) : null}
        {newQuiz(true)}
        {newCollection(true)}
      </div>

      <section aria-labelledby="collections-heading">
        <h2 id="collections-heading" className="mb-3 text-[0.9375rem] font-semibold">
          Flashcard collections
        </h2>
        {collections.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {collections.map((c) => {
              const count = c.cards[0]?.count ?? 0;
              return (
                <li
                  key={c.id}
                  className="flex flex-col rounded-md border border-border bg-surface p-5 shadow-card"
                >
                  <Link href={`/app/revision/${c.id}`} className="group">
                    <h3 className="font-semibold group-hover:text-primary">{c.name}</h3>
                    <p className="mt-0.5 text-sm text-text-muted">
                      {c.subject?.name ?? "No subject"} · {count} card{count === 1 ? "" : "s"}
                    </p>
                  </Link>
                  <div className="mt-auto flex gap-2 pt-4">
                    {count > 0 ? (
                      <ButtonLink href={`/app/revision/${c.id}/review`} size="sm">
                        Review
                      </ButtonLink>
                    ) : null}
                    <ButtonLink href={`/app/revision/${c.id}`} variant="secondary" size="sm">
                      {count > 0 ? "Edit cards" : "Add cards"}
                    </ButtonLink>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={Layers}
            title="No flashcard collections yet"
            description={`Create a collection, add a few cards, then review them. ${brand.name} records whether you remembered each one.`}
            action={newCollection()}
          />
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="quizzes-heading">
          <h2 id="quizzes-heading" className="mb-3 text-[0.9375rem] font-semibold">
            Quizzes
          </h2>
          {quizzes.length ? (
            <ul className="flex flex-col gap-3">
              {quizzes.map((q) => {
                const count = q.questions[0]?.count ?? 0;
                return (
                  <li
                    key={q.id}
                    className="flex items-center gap-4 rounded-md border border-border bg-surface p-4 shadow-card"
                  >
                    <ListChecks className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
                    <Link href={`/app/revision/quizzes/${q.id}`} className="group min-w-0 flex-1">
                      <p className="truncate font-medium group-hover:text-primary">{q.title}</p>
                      <p className="text-sm text-text-muted">
                        {q.subject?.name ?? "No subject"} · {count} question{count === 1 ? "" : "s"}
                      </p>
                    </Link>
                    {count > 0 ? (
                      <ButtonLink href={`/app/revision/quizzes/${q.id}/take`} size="sm">
                        Take quiz
                      </ButtonLink>
                    ) : (
                      <ButtonLink
                        href={`/app/revision/quizzes/${q.id}`}
                        size="sm"
                        variant="secondary"
                      >
                        Add questions
                      </ButtonLink>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={ListChecks}
              title="No quizzes yet"
              description={`Write multiple-choice questions to test yourself. ${brand.name} marks your answers against the key you set.`}
              action={newQuiz()}
            />
          )}
        </section>

        <Card aria-labelledby="attempts-heading" className="h-fit">
          <CardHeader id="attempts-heading" title="Recent quiz results" />
          {attempts.length ? (
            <ul className="divide-y divide-border">
              {attempts.map((a) => {
                const percent = Math.round((a.score / a.total) * 100);
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.quiz_title}</p>
                      <p className="text-xs text-text-muted">
                        {friendlyDate(
                          dateInZone(new Date(a.completed_at), profile.timezone),
                          today,
                        )}
                      </p>
                    </div>
                    <Badge tone={percent >= 70 ? "success" : percent >= 40 ? "warning" : "neutral"}>
                      {a.score}/{a.total}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">
              Your quiz scores will appear here after you take a quiz.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
