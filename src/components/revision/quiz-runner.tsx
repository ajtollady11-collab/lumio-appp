"use client";

import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { submitQuiz, type QuizResult } from "@/actions/revision";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type Question = { id: string; position: number; prompt: string; options: string[] };
const LETTERS = "ABCDEF";

/**
 * Takes a quiz. No answers are on the page until the student submits; the server
 * scores the attempt against the stored answer key and returns the results.
 */
export function QuizRunner({
  quizId,
  title,
  questions,
}: {
  quizId: string;
  title: string;
  questions: Question[];
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [pending, startTransition] = useTransition();
  const unanswered = questions.filter((q) => answers[q.id] === undefined);

  const submit = () => {
    if (unanswered.length && !showUnanswered) {
      setShowUnanswered(true);
      document.getElementById(`question-${unanswered[0]!.id}`)?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const response = await submitQuiz(quizId, answers);
      if (!response.ok) {
        setError(response.message);
        return;
      }
      setResult(response.result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  if (result) {
    const percent = Math.round((result.score / result.total) * 100);
    return (
      <div className="flex flex-col gap-5">
        <section
          className="animate-fade-in rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-text-muted">Your result</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {result.score} / {result.total}
            <span className="ml-2 text-lg font-medium text-text-muted">({percent}%)</span>
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {percent === 100
              ? "Every answer correct."
              : "Look at the explanations for the questions you missed, then try the quiz again."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setResult(null);
                setAnswers({});
                setShowUnanswered(false);
              }}
              icon={<RotateCcw className="size-4" aria-hidden="true" />}
            >
              Try again
            </Button>
            <ButtonLink
              href={`/app/tutor?ask=${encodeURIComponent(`Help me understand the questions I got wrong in my quiz "${title}".`)}`}
              variant="secondary"
            >
              Ask the tutor
            </ButtonLink>
            <ButtonLink href={`/app/revision/quizzes/${quizId}`} variant="ghost">
              Back to quiz
            </ButtonLink>
          </div>
        </section>

        <ol className="flex flex-col gap-3">
          {result.results.map((r, i) => (
            <li
              key={r.question_id}
              className="rounded-md border border-border bg-surface p-5 shadow-card"
            >
              <div className="flex items-start gap-3">
                {r.is_correct ? (
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-words">
                    <span className="sr-only">{r.is_correct ? "Correct. " : "Incorrect. "}</span>
                    {i + 1}. {r.prompt}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {r.options.map((o, j) => {
                      const isCorrect = j === r.correct_option;
                      const isChosen = j === r.selected;
                      return (
                        <li
                          key={j}
                          className={cn(
                            "rounded-sm px-2.5 py-1.5",
                            isCorrect && "bg-success-soft font-medium text-success",
                            isChosen && !isCorrect && "bg-danger-soft text-danger",
                          )}
                        >
                          {LETTERS[j]}. {o}
                          {isCorrect ? " — correct answer" : ""}
                          {isChosen && !isCorrect ? " — your answer" : ""}
                          {isChosen && isCorrect ? " (your answer)" : ""}
                        </li>
                      );
                    })}
                  </ul>
                  {r.selected === null ? (
                    <p className="mt-2 text-sm text-warning">Not answered.</p>
                  ) : null}
                  {r.explanation ? (
                    <p className="mt-2 text-sm text-text-muted">{r.explanation}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <ol className="flex flex-col gap-4">
        {questions.map((q, i) => {
          const missing = showUnanswered && answers[q.id] === undefined;
          return (
            <li key={q.id}>
              <div
                id={`question-${q.id}`}
                role="radiogroup"
                aria-labelledby={`question-${q.id}-prompt`}
                tabIndex={-1}
                className={cn(
                  "rounded-md border bg-surface p-5 shadow-card focus:outline-none",
                  missing ? "border-warning" : "border-border",
                )}
                aria-describedby={missing ? `question-${q.id}-missing` : undefined}
              >
                <p
                  id={`question-${q.id}-prompt`}
                  className="font-medium break-words whitespace-pre-line"
                >
                  {i + 1}. {q.prompt}
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {q.options.map((o, j) => (
                    <label
                      key={j}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-border px-3 py-2 text-[0.9375rem] transition-colors hover:bg-surface-muted has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-brand"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={j}
                        checked={answers[q.id] === j}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: j }))}
                        className="size-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="break-words">
                        <span className="mr-1 font-medium text-text-muted">{LETTERS[j]}.</span>
                        {o}
                      </span>
                    </label>
                  ))}
                </div>
                {missing ? (
                  <p
                    id={`question-${q.id}-missing`}
                    className="mt-2 text-sm font-medium text-warning"
                  >
                    Not answered yet.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      {showUnanswered && unanswered.length ? (
        <FormMessage tone="error">
          {unanswered.length} question{unanswered.length === 1 ? " is" : "s are"} unanswered. Answer
          them, or submit anyway — unanswered questions count as incorrect.
        </FormMessage>
      ) : null}

      <div className="sticky bottom-20 flex flex-col gap-2 rounded-md border border-border bg-surface/95 p-3 shadow-raised backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
        <p className="text-sm text-text-muted" aria-live="polite">
          {questions.length - unanswered.length} of {questions.length} answered
        </p>
        <Button type="submit" loading={pending} loadingText="Marking…">
          {showUnanswered && unanswered.length ? "Submit anyway" : "Submit answers"}
        </Button>
      </div>
    </form>
  );
}
