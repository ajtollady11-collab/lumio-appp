import { ArrowLeft, CalendarPlus, Layers, ListChecks, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { courseLine } from "@/components/learning/subject-card";
import { SubjectActions } from "@/components/learning/subject-actions";
import { TopicsPanel } from "@/components/learning/topics-panel";
import { TaskFormDialog } from "@/components/planner/task-form-dialog";
import { TaskItem } from "@/components/planner/task-item";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { CardListSkeleton } from "@/components/ui/skeletons";
import { daysBetween, longDate, todayInZone } from "@/lib/dates";
import { getProfile } from "@/server/data/profile";
import { listCollections, listQuizzes } from "@/server/data/revision";
import { getSubject, listSubjects, listTopics } from "@/server/data/subjects";
import { getPlannerTasks } from "@/server/data/tasks";

export const metadata: Metadata = { title: "Subject" };

export default function SubjectPage(props: PageProps<"/app/learning/[subjectId]">) {
  return (
    <>
      <Link
        href="/app/learning"
        className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> My Learning
      </Link>
      <Suspense fallback={<CardListSkeleton label="Loading subject" />}>
        <SubjectContent params={props.params} />
      </Suspense>
    </>
  );
}

async function SubjectContent({
  params,
}: {
  params: PageProps<"/app/learning/[subjectId]">["params"];
}) {
  const { subjectId } = await params;
  if (!z.uuid().safeParse(subjectId).success) notFound();
  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const profile = await getProfile();
  const today = todayInZone(profile.timezone);
  const [topics, tasks, collections, quizzes, subjects] = await Promise.all([
    listTopics(subject.id),
    getPlannerTasks(today, subject.id),
    listCollections(subject.id),
    listQuizzes(subject.id),
    listSubjects(),
  ]);
  const subjectOptions = subjects.map((s) => ({ id: s.id, name: s.name }));
  const openTasks = [
    ...tasks.overdue,
    ...tasks.today.filter((t) => t.status === "planned"),
    ...tasks.upcoming,
  ];
  const course = courseLine(subject);
  const daysToExam = subject.exam_date ? daysBetween(today, subject.exam_date) : null;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.015em] break-words">{subject.name}</h1>
          <p className="mt-1 text-[0.9375rem] text-text-muted">
            {[
              course,
              subject.exam_date
                ? `Exam ${longDate(subject.exam_date)}${daysToExam !== null && daysToExam >= 0 ? ` (in ${daysToExam} day${daysToExam === 1 ? "" : "s"})` : ""}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Add course details to help the tutor pitch explanations."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink
            href={`/app/tutor?subject=${subject.id}`}
            icon={<MessageCircle className="size-4" aria-hidden="true" />}
          >
            Ask the tutor
          </ButtonLink>
          <SubjectActions
            subject={{
              id: subject.id,
              name: subject.name,
              level: subject.level,
              qualification: subject.qualification,
              examBoard: subject.exam_board,
              examDate: subject.exam_date,
            }}
          />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card aria-labelledby="topics-heading">
          <CardHeader
            id="topics-heading"
            title="Topics"
            description="The units or chapters within this subject."
          />
          <TopicsPanel subjectId={subject.id} topics={topics} />
        </Card>

        <Card aria-labelledby="subject-tasks-heading">
          <CardHeader
            id="subject-tasks-heading"
            title="Study tasks"
            description={`${tasks.recentlyCompleted.length + tasks.today.filter((t) => t.status === "completed").length} completed recently`}
            action={
              <TaskFormDialog
                subjects={subjectOptions}
                today={today}
                defaultSubjectId={subject.id}
                trigger={
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<CalendarPlus className="size-4" aria-hidden="true" />}
                  >
                    Add task
                  </Button>
                }
              />
            }
          />
          {openTasks.length ? (
            <ul className="-my-3 divide-y divide-border">
              {openTasks.slice(0, 6).map((t) => (
                <TaskItem key={t.id} task={t} today={today} subjects={subjectOptions} showDate />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No open tasks for this subject.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card aria-labelledby="subject-cards-heading">
          <CardHeader
            id="subject-cards-heading"
            title="Flashcard collections"
            action={
              <ButtonLink
                href={`/app/revision?new=collection&subject=${subject.id}`}
                variant="secondary"
                size="sm"
              >
                New collection
              </ButtonLink>
            }
          />
          {collections.length ? (
            <ul className="divide-y divide-border">
              {collections.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/app/revision/${c.id}`}
                    className="flex items-center gap-3 py-3 hover:text-primary"
                  >
                    <Layers className="size-4 text-text-muted" aria-hidden="true" />
                    <span className="flex-1 font-medium">{c.name}</span>
                    <span className="text-sm text-text-muted">{c.cards[0]?.count ?? 0} cards</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No flashcards linked to this subject yet.</p>
          )}
        </Card>

        <Card aria-labelledby="subject-quizzes-heading">
          <CardHeader
            id="subject-quizzes-heading"
            title="Quizzes"
            action={
              <ButtonLink
                href={`/app/revision?new=quiz&subject=${subject.id}`}
                variant="secondary"
                size="sm"
              >
                New quiz
              </ButtonLink>
            }
          />
          {quizzes.length ? (
            <ul className="divide-y divide-border">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/app/revision/quizzes/${q.id}`}
                    className="flex items-center gap-3 py-3 hover:text-primary"
                  >
                    <ListChecks className="size-4 text-text-muted" aria-hidden="true" />
                    <span className="flex-1 font-medium">{q.title}</span>
                    <span className="text-sm text-text-muted">
                      {q.questions[0]?.count ?? 0} questions
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No quizzes linked to this subject yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
