import { CheckCircle2, Clock, Layers, ListChecks, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActivityChart } from "@/components/progress/activity-chart";
import { StatTile } from "@/components/progress/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { GridSkeleton } from "@/components/ui/skeletons";
import { formatMinutes } from "@/lib/dates";
import { getProfile } from "@/server/data/profile";
import { getProgressSummary } from "@/server/data/progress";
import { getSubjectStats, listSubjects } from "@/server/data/subjects";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <>
      <PageHeader
        title="Progress"
        description={`What you've done in ${brand.name}, counted from your saved activity. Nothing here is estimated or predicted.`}
      />
      <Suspense fallback={<GridSkeleton label="Loading your progress" items={4} />}>
        <ProgressContent />
      </Suspense>
    </>
  );
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

async function ProgressContent() {
  const profile = await getProfile();
  const [summary, subjects, stats] = await Promise.all([
    getProgressSummary(profile.timezone),
    listSubjects(),
    getSubjectStats(),
  ]);
  const anyActivity =
    summary.tasksCompleted +
      summary.cardsReviewed +
      summary.quizzesCompleted +
      summary.tutorQuestions >
    0;

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Totals" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={CheckCircle2}
          label="Study tasks completed"
          value={summary.tasksCompleted}
          detail={summary.tasksTotal ? `of ${summary.tasksTotal} planned` : "None planned yet"}
        />
        <StatTile
          icon={Layers}
          label="Flashcards reviewed"
          value={summary.cardsReviewed}
          detail={
            summary.cardsReviewed
              ? `Remembered ${pct(summary.cardsRemembered, summary.cardsReviewed)}%`
              : "No reviews yet"
          }
        />
        <StatTile
          icon={ListChecks}
          label="Quizzes completed"
          value={summary.quizzesCompleted}
          detail={
            summary.quizQuestionsAnswered
              ? `${pct(summary.quizQuestionsCorrect, summary.quizQuestionsAnswered)}% of answers correct`
              : "No quizzes yet"
          }
        />
        <StatTile
          icon={MessageCircle}
          label="Tutor questions"
          value={summary.tutorQuestions}
          detail={summary.tutorQuestions ? "Answered by the AI tutor" : "Ask your first question"}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card aria-labelledby="activity-heading">
          <CardHeader
            id="activity-heading"
            title="Last 14 days"
            description="Each bar is one day of saved activity."
          />
          {anyActivity ? (
            <ActivityChart days={summary.daily} today={summary.today} />
          ) : (
            <p className="text-sm text-text-muted">
              Nothing recorded yet. Completing a planned task, reviewing a flashcard, finishing a
              quiz or asking the tutor a question each adds to this chart.
            </p>
          )}
        </Card>

        <Card aria-labelledby="time-heading" className="h-fit">
          <CardHeader id="time-heading" title="Planned study completed" />
          <div className="flex items-center gap-3">
            <Clock className="size-5 text-text-muted" aria-hidden="true" />
            <p className="text-2xl font-semibold tabular-nums">
              {summary.minutesCompleted ? formatMinutes(summary.minutesCompleted) : "0 min"}
            </p>
          </div>
          <p className="mt-2 text-sm text-text-muted">
            The estimated time on study tasks you&apos;ve marked complete. Tasks without an estimate
            aren&apos;t counted.
          </p>
        </Card>
      </div>

      <Card aria-labelledby="by-subject-heading">
        <CardHeader id="by-subject-heading" title="By subject" />
        {subjects.length ? (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-text-muted">
                <tr>
                  <th scope="col" className="px-1 py-2 font-medium">
                    Subject
                  </th>
                  <th scope="col" className="px-1 py-2 font-medium">
                    Tasks done
                  </th>
                  <th scope="col" className="px-1 py-2 font-medium">
                    Topics
                  </th>
                  <th scope="col" className="px-1 py-2 font-medium">
                    Flashcards
                  </th>
                  <th scope="col" className="px-1 py-2 font-medium">
                    Quiz attempts
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => {
                  const st = stats.get(s.id);
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <th scope="row" className="px-1 py-2.5 font-medium">
                        <Link href={`/app/learning/${s.id}`} className="hover:text-primary">
                          {s.name}
                        </Link>
                      </th>
                      <td className="px-1 py-2.5 tabular-nums">
                        {st?.tasksTotal ? `${st.tasksCompleted} of ${st.tasksTotal}` : "—"}
                      </td>
                      <td className="px-1 py-2.5 tabular-nums">{st?.topics || "—"}</td>
                      <td className="px-1 py-2.5 tabular-nums">{st?.flashcards || "—"}</td>
                      <td className="px-1 py-2.5 tabular-nums">{st?.quizAttempts || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            <Link
              href="/app/learning?new=1"
              className="font-medium text-primary underline underline-offset-2"
            >
              Add a subject
            </Link>{" "}
            to see your activity broken down by subject.
          </p>
        )}
      </Card>

      <p className="text-xs text-text-muted">
        {brand.name} doesn&apos;t predict grades. These figures describe what you&apos;ve done here,
        not how you&apos;ll perform in an exam.
      </p>
    </div>
  );
}
