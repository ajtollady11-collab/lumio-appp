"use client";

import { CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";

import { deleteQuestion, saveQuestion } from "@/actions/revision";
import { useActionWithSuccess } from "@/components/forms/use-action-feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type Question = {
  id: string;
  position: number;
  prompt: string;
  options: string[];
  correct_option: number;
  explanation: string | null;
};

const LETTERS = "ABCDEF";

function QuestionForm({
  quizId,
  question,
  onDone,
}: {
  quizId: string;
  question?: Question;
  onDone?: () => void;
}) {
  const toast = useToast();
  const [options, setOptions] = useState<string[]>(question?.options ?? ["", "", "", ""]);
  const [correct, setCorrect] = useState<number | null>(question?.correct_option ?? null);
  const [formKey, setFormKey] = useState(0);
  const onSuccess = useCallback(
    (state: { message?: string }) => {
      if (state.message) toast.success(state.message);
      if (!question) {
        setOptions(["", "", "", ""]);
        setCorrect(null);
        setFormKey((k) => k + 1);
      }
      onDone?.();
    },
    [onDone, question, toast],
  );
  const [state, formAction, pending] = useActionWithSuccess(saveQuestion, onSuccess);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const prefix = question ? `q-${question.id}` : "new-q";

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="quizId" value={quizId} />
      {question ? <input type="hidden" name="id" value={question.id} /> : null}
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
      <TextAreaField
        id={`${prefix}-prompt`}
        name="prompt"
        label="Question"
        rows={2}
        maxLength={1000}
        defaultValue={question?.prompt}
        required
        error={errors.prompt}
      />
      <fieldset
        aria-describedby={
          errors.options || errors.correctOption
            ? `${prefix}-options-error`
            : `${prefix}-options-hint`
        }
      >
        <legend className="text-sm font-medium">Answer options</legend>
        <p id={`${prefix}-options-hint`} className="mt-0.5 text-[0.8125rem] text-text-muted">
          Add 2 to 6 options and select the correct one. Empty options are ignored.
        </p>
        <ul className="mt-2 flex flex-col gap-2">
          {options.map((value, i) => (
            <li key={i} className="flex items-center gap-2">
              <label
                className="flex shrink-0 cursor-pointer items-center gap-2"
                title="Mark as correct answer"
              >
                <input
                  type="radio"
                  name="correctOption"
                  value={i}
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  className="size-4 accent-[var(--primary)]"
                  aria-label={`Option ${LETTERS[i]} is correct`}
                />
                <span className="w-4 text-sm font-medium text-text-muted">{LETTERS[i]}</span>
              </label>
              <input
                name="options"
                value={value}
                onChange={(e) => setOptions((o) => o.map((x, j) => (j === i ? e.target.value : x)))}
                maxLength={300}
                aria-label={`Option ${LETTERS[i]}`}
                className="h-10 min-w-0 flex-1 rounded-sm border border-border-strong/70 bg-surface px-3 text-[0.9375rem] focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-brand/35"
              />
              {options.length > 2 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-text-muted"
                  aria-label={`Remove option ${LETTERS[i]}`}
                  onClick={() => {
                    setOptions((o) => o.filter((_, j) => j !== i));
                    setCorrect((c) => (c === null ? null : c === i ? null : c > i ? c - 1 : c));
                  }}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {options.length < 6 ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            icon={<Plus className="size-4" aria-hidden="true" />}
            onClick={() => setOptions((o) => [...o, ""])}
          >
            Add option
          </Button>
        ) : null}
        {errors.options || errors.correctOption ? (
          <p
            id={`${prefix}-options-error`}
            className="mt-1 text-[0.8125rem] font-medium text-danger"
          >
            {errors.options ?? errors.correctOption}
          </p>
        ) : null}
      </fieldset>
      <TextAreaField
        id={`${prefix}-explanation`}
        name="explanation"
        label="Explanation shown after answering"
        optional
        rows={2}
        maxLength={2000}
        defaultValue={question?.explanation ?? ""}
        error={errors.explanation}
      />
      <div className="flex justify-end gap-2">
        {onDone && question ? (
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={pending} loadingText="Saving…">
          {question ? "Save question" : "Add question"}
        </Button>
      </div>
    </form>
  );
}

export function QuestionEditor({ quizId, questions }: { quizId: string; questions: Question[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const stopEditing = useCallback(() => setEditingId(null), []);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="questions-heading">
        <h2 id="questions-heading" className="mb-3 text-[0.9375rem] font-semibold">
          Questions <span className="font-normal text-text-muted">({questions.length})</span>
        </h2>
        {questions.length ? (
          <ol className="flex flex-col gap-3">
            {questions.map((q, index) => (
              <li key={q.id} className="rounded-md border border-border bg-surface p-4 shadow-card">
                {editingId === q.id ? (
                  <QuestionForm quizId={quizId} question={q} onDone={stopEditing} />
                ) : (
                  <div className="flex gap-3">
                    <span className="mt-0.5 w-6 shrink-0 text-sm text-text-muted tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words whitespace-pre-line">{q.prompt}</p>
                      <ul className="mt-2 flex flex-col gap-1 text-sm">
                        {q.options.map((o, i) => (
                          <li
                            key={i}
                            className={cn(
                              "flex items-start gap-2",
                              i === q.correct_option
                                ? "font-medium text-success"
                                : "text-text-muted",
                            )}
                          >
                            <span className="w-4 shrink-0">{LETTERS[i]}</span>
                            <span className="break-words">{o}</span>
                            {i === q.correct_option ? (
                              <>
                                <CheckCircle2
                                  className="mt-0.5 size-4 shrink-0"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">(correct answer)</span>
                              </>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      {q.explanation ? (
                        <p className="mt-2 text-sm text-text-muted">{q.explanation}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        aria-label={`Edit question ${index + 1}`}
                        onClick={() => setEditingId(q.id)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-text-muted hover:text-danger"
                        aria-label={`Delete question ${index + 1}`}
                        onClick={() => setDeleting(q)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-md border border-dashed border-border px-5 py-8 text-center text-sm text-text-muted">
            No questions yet. Add your first question below.
          </p>
        )}
      </section>

      <section
        aria-labelledby="add-question-heading"
        className="rounded-md border border-border bg-surface p-5 shadow-card"
      >
        <h2 id="add-question-heading" className="mb-3 text-[0.9375rem] font-semibold">
          Add a question
        </h2>
        <QuestionForm quizId={quizId} />
      </section>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this question?"
        description="Past attempts keep their results. This can't be undone."
        confirmLabel="Delete question"
        action={deleteQuestion}
        hiddenFields={{ id: deleting?.id ?? "" }}
      />
    </div>
  );
}
