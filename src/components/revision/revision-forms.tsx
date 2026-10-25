"use client";

import { useCallback, useState, type ReactNode } from "react";

import { createCollection, createQuiz, updateCollection, updateQuiz } from "@/actions/revision";
import { useActionWithSuccess } from "@/components/forms/use-action-feedback";
import { useConsumeOpenFlag } from "@/components/forms/use-consume-open-flag";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormMessage, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

type SubjectOption = { id: string; name: string };

function SubjectSelect({
  id,
  subjects,
  defaultValue,
  error,
}: {
  id: string;
  subjects: SubjectOption[];
  defaultValue?: string | null;
  error?: string;
}) {
  return (
    <SelectField
      id={id}
      name="subjectId"
      label="Subject"
      optional
      defaultValue={defaultValue ?? ""}
      error={error}
    >
      <option value="">No subject</option>
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </SelectField>
  );
}

function useDialogForm(
  action: Parameters<typeof useActionWithSuccess>[0],
  setOpen: (open: boolean) => void,
) {
  const toast = useToast();
  const onSuccess = useCallback(
    (state: { message?: string }) => {
      setOpen(false);
      if (state.message) toast.success(state.message);
    },
    [setOpen, toast],
  );
  return useActionWithSuccess(action, onSuccess);
}

export function CollectionFormDialog({
  trigger,
  subjects,
  initial,
  defaultSubjectId,
  defaultOpen = false,
}: {
  trigger: ReactNode;
  subjects: SubjectOption[];
  initial?: { id: string; name: string; subjectId: string | null };
  defaultSubjectId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useConsumeOpenFlag(defaultOpen);
  const [state, formAction, pending] = useDialogForm(
    initial ? updateCollection : createCollection,
    setOpen,
  );
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={initial ? "Edit collection" : "New flashcard collection"}
        description={
          initial
            ? undefined
            : "Group cards you want to review together, such as one topic or one exam paper."
        }
      >
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
          {state.status === "error" && state.message ? (
            <FormMessage tone="error">{state.message}</FormMessage>
          ) : null}
          <TextField
            id="collection-name"
            name="name"
            label="Collection name"
            placeholder="e.g. Cell biology key terms"
            defaultValue={initial?.name}
            maxLength={80}
            required
            error={errors.name}
          />
          <SubjectSelect
            id="collection-subject"
            subjects={subjects}
            defaultValue={initial?.subjectId ?? defaultSubjectId}
            error={errors.subjectId}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} loadingText="Saving…">
              {initial ? "Save changes" : "Create collection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function QuizFormDialog({
  trigger,
  subjects,
  initial,
  defaultSubjectId,
  defaultOpen = false,
}: {
  trigger: ReactNode;
  subjects: SubjectOption[];
  initial?: { id: string; title: string; description: string | null; subjectId: string | null };
  defaultSubjectId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useConsumeOpenFlag(defaultOpen);
  const [state, formAction, pending] = useDialogForm(initial ? updateQuiz : createQuiz, setOpen);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={initial ? "Edit quiz" : "New quiz"}
        description={
          initial ? undefined : "Write your own multiple-choice questions, then test yourself."
        }
      >
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
          {state.status === "error" && state.message ? (
            <FormMessage tone="error">{state.message}</FormMessage>
          ) : null}
          <TextField
            id="quiz-title"
            name="title"
            label="Quiz title"
            placeholder="e.g. Forces and motion check"
            defaultValue={initial?.title}
            maxLength={120}
            required
            error={errors.title}
          />
          <TextAreaField
            id="quiz-description"
            name="description"
            label="Description"
            optional
            rows={2}
            maxLength={500}
            defaultValue={initial?.description ?? ""}
            error={errors.description}
          />
          <SubjectSelect
            id="quiz-subject"
            subjects={subjects}
            defaultValue={initial?.subjectId ?? defaultSubjectId}
            error={errors.subjectId}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} loadingText="Saving…">
              {initial ? "Save changes" : "Create quiz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
