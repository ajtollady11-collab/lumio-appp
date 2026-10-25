import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { QuizRunner } from "@/components/revision/quiz-runner";
import { ButtonLink } from "@/components/ui/button";
import { CardListSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/states";
import { getQuizForAttempt } from "@/server/data/revision";

export const metadata: Metadata = { title: "Take quiz" };

export default function TakeQuizPage(props: PageProps<"/app/revision/quizzes/[quizId]/take">) {
  return (
    <Suspense fallback={<CardListSkeleton label="Loading quiz" />}>
      <TakeContent params={props.params} />
    </Suspense>
  );
}

async function TakeContent({
  params,
}: {
  params: PageProps<"/app/revision/quizzes/[quizId]/take">["params"];
}) {
  const { quizId } = await params;
  if (!z.uuid().safeParse(quizId).success) notFound();
  const data = await getQuizForAttempt(quizId);
  if (!data) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <Link
        href={`/app/revision/quizzes/${quizId}`}
        className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to quiz
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.015em] break-words">
          {data.quiz.title}
        </h1>
        <p className="mt-1 text-[0.9375rem] text-text-muted">
          {data.questions.length} question{data.questions.length === 1 ? "" : "s"} · answers are
          revealed after you submit
        </p>
      </header>
      {data.questions.length ? (
        <QuizRunner quizId={quizId} title={data.quiz.title} questions={data.questions} />
      ) : (
        <EmptyState
          title="This quiz has no questions yet"
          description="Add at least one question before taking the quiz."
          action={<ButtonLink href={`/app/revision/quizzes/${quizId}`}>Add questions</ButtonLink>}
        />
      )}
    </div>
  );
}
