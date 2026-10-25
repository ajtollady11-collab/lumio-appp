import { ArrowRight, CalendarClock } from "lucide-react";
import Link from "next/link";

import { ProgressBar } from "@/components/ui/progress";
import { daysBetween, longDate } from "@/lib/dates";

export type SubjectCardData = {
  id: string;
  name: string;
  level: string | null;
  qualification: string | null;
  exam_board: string | null;
  exam_date: string | null;
  stats: {
    topics: number;
    tasksTotal: number;
    tasksCompleted: number;
    flashcards: number;
    quizAttempts: number;
  };
};

export function courseLine(
  s: Pick<SubjectCardData, "level" | "qualification" | "exam_board">,
): string | null {
  const parts = [s.qualification, s.level, s.exam_board].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function SubjectCard({ subject, today }: { subject: SubjectCardData; today: string }) {
  const { stats } = subject;
  const course = courseLine(subject);
  const daysToExam = subject.exam_date ? daysBetween(today, subject.exam_date) : null;
  const facts = [
    stats.topics ? `${stats.topics} topic${stats.topics === 1 ? "" : "s"}` : null,
    stats.flashcards ? `${stats.flashcards} flashcard${stats.flashcards === 1 ? "" : "s"}` : null,
    stats.quizAttempts
      ? `${stats.quizAttempts} quiz attempt${stats.quizAttempts === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/app/learning/${subject.id}`}
      className="group flex h-full flex-col rounded-md border border-border bg-surface p-5 shadow-card transition-[border-color,box-shadow] hover:border-border-strong/40 hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-text">{subject.name}</h3>
          <p className="mt-0.5 truncate text-sm text-text-muted">
            {course ?? "No course details yet"}
          </p>
        </div>
        <ArrowRight
          className="mt-1 size-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>

      {daysToExam !== null && daysToExam >= 0 ? (
        <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text">
          <CalendarClock className="size-3.5" aria-hidden="true" />
          {daysToExam === 0
            ? "Exam today"
            : `Exam in ${daysToExam} day${daysToExam === 1 ? "" : "s"}`}
          <span className="font-normal text-text-muted">· {longDate(subject.exam_date!)}</span>
        </p>
      ) : null}

      <div className="mt-auto pt-5">
        {stats.tasksTotal > 0 ? (
          <>
            <div className="mb-1.5 flex justify-between text-xs text-text-muted">
              <span>Planned tasks done</span>
              <span className="font-medium text-text">
                {stats.tasksCompleted} of {stats.tasksTotal}
              </span>
            </div>
            <ProgressBar
              value={stats.tasksCompleted}
              max={stats.tasksTotal}
              label={`${subject.name}: planned tasks completed`}
              tone="success"
            />
          </>
        ) : null}
        <p className="mt-2 text-xs text-text-muted">
          {facts.length
            ? facts.join(" · ")
            : stats.tasksTotal
              ? ""
              : "No activity yet — open it to add topics or plan a task."}
        </p>
      </div>
    </Link>
  );
}
