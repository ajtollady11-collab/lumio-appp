import { CalendarPlus, CalendarCheck2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { TaskFormDialog } from "@/components/planner/task-form-dialog";
import { TaskItem } from "@/components/planner/task-item";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CardListSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/states";
import { friendlyDate, fullDate, todayInZone } from "@/lib/dates";
import { getProfile } from "@/server/data/profile";
import { listSubjects } from "@/server/data/subjects";
import { getPlannerTasks, type StudyTask } from "@/server/data/tasks";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Study Planner" };

export default function PlannerPage(props: PageProps<"/app/planner">) {
  return (
    <>
      <PageHeader
        title="Study Planner"
        description="Plan focused study sessions and tick them off as you go. Only tasks you complete count towards your progress."
      />
      <Suspense fallback={<CardListSkeleton label="Loading your planner" />}>
        <PlannerContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function PlannerContent({
  searchParams,
}: {
  searchParams: PageProps<"/app/planner">["searchParams"];
}) {
  const params = await searchParams;
  const [profile, subjects] = await Promise.all([getProfile(), listSubjects()]);
  const today = todayInZone(profile.timezone);
  const tasks = await getPlannerTasks(today);
  const subjectOptions = subjects.map((s) => ({ id: s.id, name: s.name }));
  const hasAny =
    tasks.overdue.length +
      tasks.today.length +
      tasks.upcoming.length +
      tasks.recentlyCompleted.length >
    0;

  const addButton = (
    <TaskFormDialog
      subjects={subjectOptions}
      today={today}
      defaultOpen={params.new === "1"}
      trigger={
        <Button icon={<CalendarPlus className="size-4" aria-hidden="true" />}>Add task</Button>
      }
    />
  );

  if (!hasAny) {
    return (
      <EmptyState
        icon={CalendarCheck2}
        title="Plan your first study session"
        description={`Add a task for something you want to study — a topic, a past paper or a revision session. Give it a date and ${brand.name} will show it on your dashboard that day.`}
        action={addButton}
      />
    );
  }

  const groupByDate = (list: StudyTask[]) => {
    const groups = new Map<string, StudyTask[]>();
    for (const t of list)
      groups.set(t.scheduled_date, [...(groups.get(t.scheduled_date) ?? []), t]);
    return [...groups.entries()];
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">{addButton}</div>

      {tasks.overdue.length ? (
        <Card aria-labelledby="overdue-heading">
          <CardHeader
            id="overdue-heading"
            title="Overdue"
            description="Complete these, move them to a new date, or delete them if they no longer matter."
          />
          <ul className="-my-3 divide-y divide-border">
            {tasks.overdue.map((t) => (
              <TaskItem key={t.id} task={t} today={today} subjects={subjectOptions} showDate />
            ))}
          </ul>
        </Card>
      ) : null}

      <Card aria-labelledby="today-heading">
        <CardHeader id="today-heading" title="Today" description={fullDate(today)} />
        {tasks.today.length ? (
          <ul className="-my-3 divide-y divide-border">
            {tasks.today.map((t) => (
              <TaskItem key={t.id} task={t} today={today} subjects={subjectOptions} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">Nothing planned for today.</p>
        )}
      </Card>

      <Card aria-labelledby="upcoming-heading">
        <CardHeader id="upcoming-heading" title="Upcoming" />
        {tasks.upcoming.length ? (
          <div className="flex flex-col gap-5">
            {groupByDate(tasks.upcoming).map(([date, list]) => (
              <section key={date} aria-label={friendlyDate(date, today)}>
                <h3 className="text-xs font-semibold tracking-wide text-text-muted">
                  {friendlyDate(date, today)}
                </h3>
                <ul className="divide-y divide-border">
                  {list.map((t) => (
                    <TaskItem key={t.id} task={t} today={today} subjects={subjectOptions} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No upcoming tasks. Add one to plan ahead.</p>
        )}
      </Card>

      {tasks.recentlyCompleted.length ? (
        <Card aria-labelledby="done-heading">
          <CardHeader id="done-heading" title="Recently completed" />
          <ul className="-my-3 divide-y divide-border">
            {tasks.recentlyCompleted.map((t) => (
              <TaskItem key={t.id} task={t} today={today} subjects={subjectOptions} showDate />
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
