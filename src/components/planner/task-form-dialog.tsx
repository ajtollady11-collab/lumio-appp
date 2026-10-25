"use client";

import { useCallback, useState, type ReactNode } from "react";

import { createTask, updateTask } from "@/actions/tasks";
import { useActionWithSuccess } from "@/components/forms/use-action-feedback";
import { useConsumeOpenFlag } from "@/components/forms/use-consume-open-flag";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormMessage, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { TASK_PRIORITIES } from "@/lib/options";

export type TaskFormValues = {
  id?: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  scheduledDate: string;
  startTime: string | null;
  durationMinutes: number | null;
  priority: string;
};

type SubjectOption = { id: string; name: string };

export function TaskFormDialog({
  trigger,
  subjects,
  today,
  initial,
  defaultSubjectId,
  defaultOpen = false,
}: {
  trigger: ReactNode;
  subjects: SubjectOption[];
  today: string;
  initial?: TaskFormValues;
  defaultSubjectId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useConsumeOpenFlag(defaultOpen);
  const [formKey, setFormKey] = useState(0);
  const toast = useToast();
  const editing = Boolean(initial?.id);

  const onSuccess = useCallback(
    (state: { message?: string }) => {
      setOpen(false);
      setFormKey((k) => k + 1);
      if (state.message) toast.success(state.message);
    },
    [toast],
  );
  const [state, formAction, pending] = useActionWithSuccess(
    editing ? updateTask : createTask,
    onSuccess,
  );
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={editing ? "Edit study task" : "Add a study task"}
        description={
          editing
            ? undefined
            : "Plan a focused piece of study. Only the title and date are required."
        }
      >
        <form key={formKey} action={formAction} className="flex flex-col gap-4" noValidate>
          {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
          {state.status === "error" && state.message ? (
            <FormMessage tone="error">{state.message}</FormMessage>
          ) : null}
          <TextField
            id="task-title"
            name="title"
            label="What will you study?"
            placeholder="e.g. Practise simultaneous equations"
            defaultValue={initial?.title}
            maxLength={120}
            required
            error={errors.title}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="task-date"
              name="scheduledDate"
              type="date"
              label="Date"
              defaultValue={initial?.scheduledDate ?? today}
              required
              error={errors.scheduledDate}
            />
            <TextField
              id="task-time"
              name="startTime"
              type="time"
              label="Start time"
              optional
              defaultValue={initial?.startTime ?? ""}
              error={errors.startTime}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="task-subject"
              name="subjectId"
              label="Subject"
              optional
              defaultValue={initial?.subjectId ?? defaultSubjectId ?? ""}
              error={errors.subjectId}
            >
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
            <TextField
              id="task-duration"
              name="durationMinutes"
              type="number"
              inputMode="numeric"
              min={5}
              max={600}
              step={5}
              label="Estimated minutes"
              optional
              placeholder="30"
              defaultValue={initial?.durationMinutes ?? ""}
              error={errors.durationMinutes}
            />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Priority</legend>
            <div className="flex gap-2">
              {TASK_PRIORITIES.map((p) => (
                <label
                  key={p.value}
                  className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-sm border border-border-strong/50 text-sm font-medium has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary has-focus-visible:outline-2 has-focus-visible:outline-brand"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    defaultChecked={(initial?.priority ?? "medium") === p.value}
                    className="sr-only"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>
          <TextAreaField
            id="task-description"
            name="description"
            label="Notes"
            optional
            rows={3}
            maxLength={2000}
            defaultValue={initial?.description ?? ""}
            error={errors.description}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} loadingText="Saving…">
              {editing ? "Save changes" : "Add task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
