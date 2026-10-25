import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  CheckCircle2,
  Layers,
  ListChecks,
  MessageCircle,
  Plus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { courseLine } from "@/components/learning/subject-card";
import { TaskItem } from "@/components/planner/task-item";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, LoadingBlock, Skeleton } from "@/components/ui/states";
import { ProgressBar } from "@/components/ui/progress";
import { fullDate, greetingForHour, todayInZone } from "@/lib/dates";
import { getProfile, type Profile } from "@/server/data/profile";
import { getProgressSummary, type ProgressSummary } from "@/server/data/progress";
import { listCollections, type Collection } from "@/server/data/revision";
import { getSubjectStats, listSubjects, type Subject } from "@/server/data/subjects";
import { getPlannerTasks, type PlannerTasks } from "@/server/data/tasks";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <LoadingBlock label="Loading your dashboard">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-40" />
      <Skeleton className="mt-8 h-36 w-full rounded-md" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
      </div>
    </LoadingBlock>
  );
}

function firstName(displayName: string | null): string | null {
  const first = displayName?.trim().split(/\s+/)[0];
  return first || null;
}

function hourInZone(timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  }).format(new Date());
  return Number(hour);
}

async function Dashboard() {
  const profile = await getProfile();
  const today = todayInZone(profile.timezone);
  const [tasks, subjects, stats, collections, summary] = await Promise.all([
    getPlannerTasks(today),
    listSubjects(),
    getSubjectStats(),
    listCollections(),
    getProgressSummary(profile.timezone),
  ]);
  const name = firstName(profile.display_name);
  const greeting = greetingForHour(hourInZone(profile.timezone));
  const subjectOptions = subjects.map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-[-0.015em] sm:text-[1.75rem]">
          {greeting}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-1 text-[0.9375rem] text-text-muted">{fullDate(today)}</p>
      </header>

      <TodaysFocus profile={profile} tasks={tasks} subjects={subjects} collections={collections} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card aria-labelledby="today-tasks">
            <CardHeader
              id="today-tasks"
              title="Today's tasks"
              description={
                tasks.today.length
                  ? `${tasks.today.filter((t) => t.status === "completed").length} of ${tasks.today.length} done`
                  : undefined
              }
              action={
                <ButtonLink
                  href="/app/planner?new=1"
                  variant="ghost"
                  size="sm"
                  icon={<Plus className="size-4" aria-hidden="true" />}
                >
                  Add task
                </ButtonLink>
              }
            />
            {tasks.today.length || tasks.overdue.length ? (
              <ul className="flex flex-col gap-2">
                {[...tasks.overdue, ...tasks.today].slice(0, 6).map((t) => (
                  <li key={t.id}>
                    <TaskItem
                      task={t}
                      today={today}
                      subjects={subjectOptions}
                      showDate={t.scheduled_date !== today}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={CalendarPlus}
                title="Nothing planned for today"
                description="Plan a short study session so you know exactly what to work on."
                action={
                  <ButtonLink href="/app/planner?new=1" size="sm" variant="secondary">
                    Plan a session
                  </ButtonLink>
                }
              />
            )}
            {tasks.today.length + tasks.overdue.length > 6 ? (
              <Link
                href="/app/planner"
                className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              >
                See all in the planner
              </Link>
            ) : null}
          </Card>

          <Card aria-labelledby="subjects-heading">
            <CardHeader
              id="subjects-heading"
              title="Your subjects"
              action={
                subjects.length ? (
                  <Link
                    href="/app/learning"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View all
                  </Link>
                ) : undefined
              }
            />
            {subjects.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {subjects.slice(0, 4).map((s) => {
                  const st = stats.get(s.id);
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/app/learning/${s.id}`}
                        className="flex h-full flex-col rounded-sm border border-border p-4 transition-colors hover:border-border-strong/40 hover:bg-surface-muted"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-text-muted">
                          {courseLine(s) ?? `${st?.topics ?? 0} topics`}
                        </span>
                        <span className="mt-3 flex items-center gap-2 text-xs text-text-muted">
                          <ProgressBar
                            value={st?.tasksCompleted ?? 0}
                            max={st?.tasksTotal ?? 0}
                            label={`${s.name} tasks completed`}
                            className="flex-1"
                          />
                          <span className="tabular-nums">
                            {st?.tasksCompleted ?? 0}/{st?.tasksTotal ?? 0} tasks
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={BookOpen}
                title="No subjects yet"
                description="Add the subjects you're studying to organise topics, tasks and revision."
                action={
                  <ButtonLink href="/app/learning?new=1" size="sm" variant="secondary">
                    Add a subject
                  </ButtonLink>
                }
              />
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <QuickActions />
          <ProgressSnapshot summary={summary} />
        </div>
      </div>
    </>
  );
}

type Focus = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

/** A single, deterministic suggestion built only from the student's own records. */
function chooseFocus(
  profile: Profile,
  tasks: PlannerTasks,
  subjects: Subject[],
  collections: Collection[],
): Focus {
  if (!profile.onboarding_completed_at) {
    return {
      icon: Sparkles,
      eyebrow: "Finish setting up",
      title: `Tell ${brand.name} what you're studying`,
      body: "A few quick questions help the tutor pitch explanations at the right level.",
      href: "/onboarding",
      cta: "Continue setup",
    };
  }
  if (tasks.overdue.length) {
    const t = tasks.overdue[0]!;
    return {
      icon: CalendarPlus,
      eyebrow: `${tasks.overdue.length} overdue ${tasks.overdue.length === 1 ? "task" : "tasks"}`,
      title: t.title,
      body: "Catch up on this one, or move it to a day that works better.",
      href: "/app/planner",
      cta: "Open planner",
    };
  }
  const next = tasks.today.find((t) => t.status !== "completed");
  if (next) {
    return {
      icon: CheckCircle2,
      eyebrow: "Next up today",
      title: next.title,
      body: next.subject ? `Planned for ${next.subject.name}.` : "Planned for today.",
      href: "/app/planner",
      cta: "Open planner",
    };
  }
  if (!subjects.length) {
    return {
      icon: BookOpen,
      eyebrow: "Get started",
      title: "Add your first subject",
      body: "Subjects keep your topics, study tasks and flashcards together.",
      href: "/app/learning?new=1",
      cta: "Add a subject",
    };
  }
  const withCards = collections.find((c) => (c.cards[0]?.count ?? 0) > 0);
  if (withCards) {
    return {
      icon: Layers,
      eyebrow: tasks.today.length ? "Today's plan is done" : "Quick revision",
      title: `Review “${withCards.name}”`,
      body: "Run through your flashcards and mark the ones you remembered.",
      href: `/app/revision/${withCards.id}/review`,
      cta: "Start reviewing",
    };
  }
  return {
    icon: CalendarPlus,
    eyebrow: tasks.today.length ? "Today's plan is done" : "Plan your day",
    title: tasks.today.length
      ? "Nice work — everything for today is complete"
      : "Plan a study session",
    body: tasks.today.length
      ? "Plan tomorrow, or make some flashcards for what you covered."
      : "Choose a subject and a time, then tick it off when you're done.",
    href: "/app/planner?new=1",
    cta: "Plan a session",
  };
}

function TodaysFocus(props: {
  profile: Profile;
  tasks: PlannerTasks;
  subjects: Subject[];
  collections: Collection[];
}) {
  const focus = chooseFocus(props.profile, props.tasks, props.subjects, props.collections);
  return (
    <section
      aria-labelledby="focus-heading"
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:p-6"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
        <focus.icon className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          Today&apos;s focus · {focus.eyebrow}
        </p>
        <h2 id="focus-heading" className="mt-1 text-lg font-semibold text-balance">
          {focus.title}
        </h2>
        <p className="mt-1 text-sm text-text-muted">{focus.body}</p>
      </div>
      <ButtonLink
        href={focus.href}
        className="shrink-0"
        icon={<ArrowRight className="size-4" aria-hidden="true" />}
      >
        {focus.cta}
      </ButtonLink>
    </section>
  );
}

const QUICK_ACTIONS = [
  { href: "/app/tutor", label: "Ask the tutor", icon: MessageCircle },
  { href: "/app/planner?new=1", label: "Plan a session", icon: CalendarPlus },
  { href: "/app/revision?new=collection", label: "Make flashcards", icon: Layers },
  { href: "/app/revision?new=quiz", label: "Create a quiz", icon: ListChecks },
];

function QuickActions() {
  return (
    <Card aria-labelledby="quick-actions">
      <CardHeader id="quick-actions" title="Quick actions" />
      <ul className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="flex h-full flex-col gap-2 rounded-sm border border-border p-3 text-sm font-medium transition-colors hover:border-border-strong/40 hover:bg-surface-muted"
            >
              <a.icon className="size-4 text-primary" aria-hidden="true" />
              {a.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ProgressSnapshot({ summary }: { summary: ProgressSummary }) {
  const week = summary.daily.slice(-7);
  const sum = (key: "tasks" | "cards" | "quizzes" | "tutor") =>
    week.reduce((n, d) => n + Number(d[key] ?? 0), 0);
  const rows = [
    { label: "Tasks completed", value: sum("tasks") },
    { label: "Flashcards reviewed", value: sum("cards") },
    { label: "Quizzes taken", value: sum("quizzes") },
    { label: "Tutor questions", value: sum("tutor") },
  ];
  const any = rows.some((r) => r.value > 0);
  return (
    <Card aria-labelledby="snapshot">
      <CardHeader
        id="snapshot"
        title="Last 7 days"
        action={
          <Link href="/app/progress" className="text-sm font-medium text-primary hover:underline">
            Progress
          </Link>
        }
      />
      {any ? (
        <dl className="flex flex-col divide-y divide-border">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
            >
              <dt className="text-text-muted">{r.label}</dt>
              <dd className="font-semibold tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-text-muted">
          Nothing recorded this week yet. Complete a task, review flashcards or take a quiz and it
          will show here.
        </p>
      )}
    </Card>
  );
}
