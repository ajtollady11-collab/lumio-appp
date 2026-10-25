import { ArrowLeft, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { QuestionEditor } from "@/components/revision/question-editor";
import { QuizActions } from "@/components/revision/revision-actions";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/progress";
import { CardListSkeleton } from "@/components/ui/skeletons";
import { dateInZone, friendlyDate, todayInZone } from "@/lib/dates";
import { getProfile } from "@/server/data/profile";
import { getQuizForEditing } from "@/server/data/revision";
import { listSubjects } from "@/server/data/subjects";

export const metadata: Metadata = { title: "Quiz" };

export default function QuizPage(props: PageProps<"/app/revision/quizzes/[quizId]">) {
  return (
    <>
      <Link
        href="/app/revision"
        className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Revision
      </Link>
      <Suspense fallback={<CardListSkeleton label="Loading quiz" />}>
        <QuizContent params={props.params} />
      </Suspense>
    </>
  );
}

async function QuizContent({
  params,
}: {
  params: PageProps<"/app/revision/quizzes/[quizId]">["params"];
}) {
  const { quizId } = await params;
  if (!z.uuid().safeParse(quizId).success) notFound();
  const data = await getQuizForEditing(quizId);
  if (!data) notFound();
  const [subjects, profile] = await Promise.all([listSubjects(), getProfile()]);
  const today = todayInZone(profile.timezone);
  const { quiz, questions, attempts } = data;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.015em] break-words">{quiz.title}</h1>
          <p className="mt-1 text-[0.9375rem] text-text-muted">
            {quiz.subject?.name ?? "No subject"} · {questions.length} question
            {questions.length === 1 ? "" : "s"}
          </p>
          {quiz.description ? (
            <p className="mt-2 max-w-2xl text-sm text-text-muted">{quiz.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {questions.length ? (
            <ButtonLink
              href={`/app/revision/quizzes/${quiz.id}/take`}
              icon={<Play className="size-4" aria-hidden="true" />}
            >
              Take quiz
            </ButtonLink>
          ) : null}
          <QuizActions
            quiz={{
              id: quiz.id,
              title: quiz.title,
              description: quiz.description,
              subjectId: quiz.subject_id,
            }}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          />
        </div>
      </header>

      {attempts.length ? (
        <section
          aria-labelledby="attempts-heading"
          className="rounded-md border border-border bg-surface p-5 shadow-card"
        >
          <h2 id="attempts-heading" className="mb-2 text-[0.9375rem] font-semibold">
            Your attempts
          </h2>
          <ul className="flex flex-wrap gap-2">
            {attempts.map((a) => (
              <li key={a.id}>
                <Badge tone="neutral" className="py-1 text-[0.8125rem]">
                  {a.score}/{a.total} ·{" "}
                  {friendlyDate(dateInZone(new Date(a.completed_at), profile.timezone), today)}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="rounded-sm bg-surface-muted px-4 py-3 text-sm text-text-muted">
        You write these questions and choose the correct answers, so your score is only as accurate
        as your answer key.
      </p>

      <QuestionEditor quizId={quiz.id} questions={questions} />
    </div>
  );
}
