"use client";

import { Check, Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useOptimistic, useState, useTransition } from "react";

import { deleteTask, setTaskCompleted } from "@/actions/tasks";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatMinutes, friendlyDate, shortTime } from "@/lib/dates";

import { TaskFormDialog } from "./task-form-dialog";

export type TaskItemData = {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  start_time: string | null;
  duration_minutes: number | null;
  priority: string;
  status: string;
  subject_id: string | null;
  subject: { id: string; name: string } | null;
};

export function TaskItem({
  task,
  today,
  subjects,
  showDate = false,
}: {
  task: TaskItemData;
  today: string;
  subjects: { id: string; name: string }[];
  showDate?: boolean;
}) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(task.status === "completed");
  const [, startTransition] = useTransition();
  const [editOpenKey, setEditOpenKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();
  const overdue = !optimisticDone && task.scheduled_date < today;

  const toggle = () => {
    const next = !optimisticDone;
    startTransition(async () => {
      setOptimisticDone(next);
      const result = await setTaskCompleted(task.id, next);
      if (result.status === "error") toast.error(result.message ?? "We couldn't update this task.");
    });
  };

  const meta = [
    showDate || overdue ? friendlyDate(task.scheduled_date, today) : null,
    shortTime(task.start_time),
    task.duration_minutes ? formatMinutes(task.duration_minutes) : null,
  ].filter(Boolean);

  return (
    <li className="group flex items-start gap-3 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={optimisticDone}
        aria-label={optimisticDone ? `Reopen “${task.title}”` : `Mark “${task.title}” complete`}
        onClick={toggle}
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
          optimisticDone
            ? "border-success bg-success text-white"
            : "border-border-strong/70 text-transparent hover:border-success hover:text-success/60",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[0.9375rem] font-medium break-words",
            optimisticDone && "text-text-muted line-through",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-text-muted">
          {task.subject ? <span>{task.subject.name}</span> : null}
          {meta.length ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue && "font-medium text-warning",
              )}
            >
              <Clock className="size-3.5" aria-hidden="true" />
              {overdue ? "Overdue · " : ""}
              {meta.join(" · ")}
            </span>
          ) : null}
          {task.priority === "high" && !optimisticDone ? (
            <Badge tone="warning">High priority</Badge>
          ) : null}
        </div>
        {task.description ? (
          <p className="mt-1 line-clamp-2 text-[0.8125rem] text-text-muted">{task.description}</p>
        ) : null}
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-sm text-text-muted hover:bg-surface-muted hover:text-text"
            aria-label={`Options for “${task.title}”`}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-40 rounded-sm border border-border bg-surface p-1 shadow-raised"
          >
            <DropdownMenu.Item
              onSelect={() => setEditOpenKey((k) => k + 1)}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-[6px] px-2.5 text-sm outline-none data-highlighted:bg-surface-muted"
            >
              <Pencil className="size-4" aria-hidden="true" /> Edit
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setConfirmOpen(true)}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-[6px] px-2.5 text-sm text-danger outline-none data-highlighted:bg-danger-soft"
            >
              <Trash2 className="size-4" aria-hidden="true" /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {editOpenKey > 0 ? (
        <TaskFormDialog
          key={editOpenKey}
          defaultOpen
          trigger={<span hidden />}
          subjects={subjects}
          today={today}
          initial={{
            id: task.id,
            title: task.title,
            description: task.description,
            subjectId: task.subject_id,
            scheduledDate: task.scheduled_date,
            startTime: shortTime(task.start_time),
            durationMinutes: task.duration_minutes,
            priority: task.priority,
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this task?"
        description={`“${task.title}” will be removed from your planner. This can't be undone.`}
        confirmLabel="Delete task"
        action={deleteTask}
        hiddenFields={{ id: task.id }}
      />
    </li>
  );
}
