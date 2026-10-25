"use client";

import { ArrowRight, Check, Plus, X } from "lucide-react";
import { useActionState, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  completeOnboarding,
  saveEducationStep,
  saveGoalsStep,
  savePreferenceStep,
  saveSubjectsStep,
  startOnboarding,
} from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { FormMessage, TextField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { EDUCATION_LEVELS, GOALS, LEARNING_PREFERENCES, SUGGESTED_SUBJECTS } from "@/lib/options";
import { idleState } from "@/lib/validation";

const optionCard =
  "flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong/50 has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand";

function Indicator({ type }: { type: "radio" | "checkbox" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-0.5 grid size-5 shrink-0 place-items-center border border-border-strong bg-surface text-white transition-colors group-has-checked:border-primary group-has-checked:bg-primary",
        type === "radio" ? "rounded-full" : "rounded-[6px]",
      )}
    >
      {type === "radio" ? (
        <span className="size-2 rounded-full bg-white opacity-0 group-has-checked:opacity-100" />
      ) : (
        <Check className="size-3.5 opacity-0 group-has-checked:opacity-100" strokeWidth={3} />
      )}
    </span>
  );
}

function Actions({
  pending,
  label = "Continue",
  children,
}: {
  pending: boolean;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
      {children}
      <Button
        type="submit"
        size="lg"
        loading={pending}
        loadingText="Saving…"
        icon={<ArrowRight className="size-4" aria-hidden="true" />}
      >
        {label}
      </Button>
    </div>
  );
}

export function WelcomeStep() {
  // The browser's time zone makes "today" in the planner match the student's day.
  const start = (formData: FormData) => {
    try {
      formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
    } catch {
      // Keep the default (Europe/London).
    }
    return startOnboarding(formData);
  };
  return (
    <form action={start}>
      <ul className="mt-6 flex flex-col gap-3 text-[0.9375rem]">
        {[
          "Your stage of education, so explanations are pitched right",
          "The subjects you're studying",
          "What you'd like to achieve",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-text-muted">
        It takes about a minute, and you can change any answer later in Settings.
      </p>
      <SubmitWelcome />
    </form>
  );
}

function SubmitWelcome() {
  const { pending } = useFormStatus();
  return (
    <div className="mt-8 flex justify-end">
      <Button
        type="submit"
        size="lg"
        loading={pending}
        loadingText="Starting…"
        icon={<ArrowRight className="size-4" aria-hidden="true" />}
      >
        Get started
      </Button>
    </div>
  );
}

export function EducationStep({ level, other }: { level: string | null; other: string | null }) {
  const [state, action, pending] = useActionState(saveEducationStep, idleState);
  const [selected, setSelected] = useState(level ?? "");
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate>
      <fieldset aria-describedby={errors.educationLevel ? "education-error" : undefined}>
        <legend className="sr-only">Your current stage of education</legend>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {EDUCATION_LEVELS.map((o) => (
            <label key={o.value} className={cn(optionCard, "group")}>
              <input
                type="radio"
                name="educationLevel"
                value={o.value}
                checked={selected === o.value}
                onChange={() => setSelected(o.value)}
                className="sr-only"
              />
              <Indicator type="radio" />
              <span className="font-medium">{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {errors.educationLevel ? (
        <p id="education-error" className="mt-2 text-[0.8125rem] font-medium text-danger">
          {errors.educationLevel}
        </p>
      ) : null}
      {selected === "other" ? (
        <TextField
          id="educationLevelOther"
          label="What are you studying at the moment?"
          defaultValue={other ?? ""}
          maxLength={60}
          error={errors.educationLevelOther}
          className="mt-5"
          autoFocus
        />
      ) : null}
      {state.status === "error" && state.message && !Object.keys(errors).length ? (
        <div className="mt-5">
          <FormMessage tone="error">{state.message}</FormMessage>
        </div>
      ) : null}
      <Actions pending={pending} />
    </form>
  );
}

export function SubjectsStep({ existing }: { existing: string[] }) {
  const [state, action, pending] = useActionState(saveSubjectsStep, idleState);
  const [chosen, setChosen] = useState<string[]>(existing);
  const [custom, setCustom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const has = (name: string) => chosen.some((c) => c.toLowerCase() === name.toLowerCase());
  const toggle = (name: string) =>
    setChosen((list) =>
      has(name) ? list.filter((c) => c.toLowerCase() !== name.toLowerCase()) : [...list, name],
    );
  const addCustom = () => {
    const name = custom.trim().slice(0, 80);
    if (name && !has(name)) setChosen((list) => [...list, name]);
    setCustom("");
    inputRef.current?.focus();
  };
  const extras = chosen.filter(
    (c) => !SUGGESTED_SUBJECTS.some((s) => s.toLowerCase() === c.toLowerCase()),
  );
  const error = state.fieldErrors?.subjects;
  const locked = new Set(existing.map((e) => e.toLowerCase()));

  return (
    <form action={action} noValidate>
      {chosen.map((c) => (
        <input key={c} type="hidden" name="subjects" value={c} />
      ))}
      <fieldset className="mt-6">
        <legend className="text-sm font-medium">Popular subjects</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_SUBJECTS.map((s) => {
            const on = has(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                disabled={locked.has(s.toLowerCase())}
                onClick={() => toggle(s)}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors disabled:cursor-default",
                  on
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-surface hover:border-border-strong/50",
                )}
              >
                {on ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Plus className="size-4 text-text-muted" aria-hidden="true" />
                )}
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="custom-subject" className="text-sm font-medium">
          Add another subject
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="custom-subject"
            ref={inputRef}
            value={custom}
            maxLength={80}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="e.g. Geography"
            className="h-11 w-full min-w-0 rounded-sm border border-border-strong/70 bg-surface px-3 text-[0.9375rem] placeholder:text-text-muted/80 focus:border-primary focus:outline-2 focus:outline-brand/35"
          />
          <Button
            type="button"
            variant="secondary"
            className="h-11"
            onClick={addCustom}
            disabled={!custom.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      {extras.length ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Other subjects you added">
          {extras.map((c) => (
            <li
              key={c}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-primary bg-primary-soft pr-1 pl-3.5 text-sm font-medium text-primary"
            >
              {c}
              {locked.has(c.toLowerCase()) ? (
                <Check className="mr-2 size-4" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(c)}
                  className="grid size-7 place-items-center rounded-full hover:bg-white/70"
                  aria-label={`Remove ${c}`}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-5 text-sm text-text-muted" aria-live="polite">
        {chosen.length ? `${chosen.length} selected` : "Choose at least one subject."}
        {existing.length ? " Subjects you've already saved stay in My Learning." : ""}
      </p>
      {error ? (
        <div className="mt-3">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      ) : state.status === "error" && state.message ? (
        <div className="mt-3">
          <FormMessage tone="error">{state.message}</FormMessage>
        </div>
      ) : null}
      <Actions pending={pending} />
    </form>
  );
}

export function GoalsStep({ goals }: { goals: string[] }) {
  const [state, action, pending] = useActionState(saveGoalsStep, idleState);
  const error = state.fieldErrors?.goals;
  return (
    <form action={action} noValidate>
      <fieldset aria-describedby={error ? "goals-error" : undefined}>
        <legend className="sr-only">Your goals (choose any)</legend>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {GOALS.map((g) => (
            <label key={g.value} className={cn(optionCard, "group")}>
              <input
                type="checkbox"
                name="goals"
                value={g.value}
                defaultChecked={goals.includes(g.value)}
                className="sr-only"
              />
              <Indicator type="checkbox" />
              <span className="font-medium">{g.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p id="goals-error" role="alert" className="mt-3 text-[0.8125rem] font-medium text-danger">
          {error}
        </p>
      ) : state.status === "error" && state.message ? (
        <div className="mt-3">
          <FormMessage tone="error">{state.message}</FormMessage>
        </div>
      ) : null}
      <Actions pending={pending} />
    </form>
  );
}

export function PreferenceStep({ preference }: { preference: string | null }) {
  const [state, action, pending] = useActionState(savePreferenceStep, idleState);
  const error = state.fieldErrors?.learningPreference;
  return (
    <form action={action} noValidate>
      <fieldset aria-describedby={error ? "preference-error" : undefined}>
        <legend className="sr-only">How you like things explained</legend>
        <div className="mt-6 flex flex-col gap-3">
          {LEARNING_PREFERENCES.map((p) => (
            <label key={p.value} className={cn(optionCard, "group")}>
              <input
                type="radio"
                name="learningPreference"
                value={p.value}
                defaultChecked={preference === p.value}
                className="sr-only"
              />
              <Indicator type="radio" />
              <span>
                <span className="block font-medium">{p.label}</span>
                <span className="block text-sm text-text-muted">{p.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p
          id="preference-error"
          role="alert"
          className="mt-3 text-[0.8125rem] font-medium text-danger"
        >
          {error}
        </p>
      ) : state.status === "error" && state.message ? (
        <div className="mt-3">
          <FormMessage tone="error">{state.message}</FormMessage>
        </div>
      ) : null}
      <Actions pending={pending}>
        <Button
          type="submit"
          name="intent"
          value="skip"
          variant="ghost"
          size="lg"
          disabled={pending}
        >
          Skip for now
        </Button>
      </Actions>
    </form>
  );
}

export function SummaryStep() {
  const [state, action, pending] = useActionState(completeOnboarding, idleState);
  return (
    <form action={action}>
      {state.status === "error" && state.message ? (
        <div className="mt-6">
          <FormMessage tone="error">{state.message}</FormMessage>
        </div>
      ) : null}
      <Actions pending={pending} label="Open my dashboard" />
    </form>
  );
}
