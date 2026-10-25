"use client";

import { useCallback, useState, type ReactNode } from "react";

import { createSubject, updateSubject } from "@/actions/subjects";
import { useActionWithSuccess } from "@/components/forms/use-action-feedback";
import { useConsumeOpenFlag } from "@/components/forms/use-consume-open-flag";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormMessage, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export type SubjectFormValues = {
  id: string;
  name: string;
  level: string | null;
  qualification: string | null;
  examBoard: string | null;
  examDate: string | null;
};

export function SubjectFormDialog({
  trigger,
  initial,
  defaultOpen = false,
  openAfterCreate = false,
}: {
  trigger: ReactNode;
  initial?: SubjectFormValues;
  defaultOpen?: boolean;
  openAfterCreate?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useConsumeOpenFlag(defaultOpen);
  const [formKey, setFormKey] = useState(0);
  const toast = useToast();
  const editing = Boolean(initial);
  const onSuccess = useCallback(
    (state: { message?: string }) => {
      setOpen(false);
      setFormKey((k) => k + 1);
      if (state.message) toast.success(state.message);
    },
    [toast],
  );
  const [state, formAction, pending] = useActionWithSuccess(
    editing ? updateSubject : createSubject,
    onSuccess,
  );
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={editing ? "Edit subject" : "Add a subject"}
        description="Only the name is required. Course details help the tutor pitch explanations at the right level."
      >
        <form key={formKey} action={formAction} className="flex flex-col gap-4" noValidate>
          {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
          {openAfterCreate ? <input type="hidden" name="redirect" value="subject" /> : null}
          {state.status === "error" && state.message ? (
            <FormMessage tone="error">{state.message}</FormMessage>
          ) : null}
          <TextField
            id="subject-name"
            name="name"
            label="Subject name"
            placeholder="e.g. Chemistry"
            defaultValue={initial?.name}
            maxLength={80}
            required
            error={errors.name}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="subject-level"
              name="level"
              label="Level or year"
              optional
              placeholder="e.g. Year 11, A-level"
              defaultValue={initial?.level ?? ""}
              maxLength={80}
              error={errors.level}
            />
            <TextField
              id="subject-qualification"
              name="qualification"
              label="Qualification or course"
              optional
              placeholder="e.g. GCSE, BTEC, IB"
              defaultValue={initial?.qualification ?? ""}
              maxLength={80}
              error={errors.qualification}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="subject-board"
              name="examBoard"
              label="Exam board or curriculum"
              optional
              placeholder="e.g. AQA"
              defaultValue={initial?.examBoard ?? ""}
              maxLength={80}
              error={errors.examBoard}
            />
            <TextField
              id="subject-exam-date"
              name="examDate"
              type="date"
              label="Exam date"
              optional
              defaultValue={initial?.examDate ?? ""}
              error={errors.examDate}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} loadingText="Saving…">
              {editing ? "Save changes" : "Add subject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
