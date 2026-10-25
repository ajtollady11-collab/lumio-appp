"use client";

import { useCallback, useState } from "react";

import { deleteAccount, savePreferences, saveProfile } from "@/actions/profile";
import { useActionWithSuccess } from "@/components/forms/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormMessage, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { EDUCATION_LEVELS, GOALS, LEARNING_PREFERENCES } from "@/lib/options";
import type { ActionState } from "@/lib/validation";

function useSavedToast() {
  const toast = useToast();
  return useCallback(
    (state: ActionState) => state.message && toast.success(state.message),
    [toast],
  );
}

export function ProfileForm({
  displayName,
  educationLevel,
  educationLevelOther,
}: {
  displayName: string;
  educationLevel: string | null;
  educationLevelOther: string | null;
}) {
  const [level, setLevel] = useState(educationLevel ?? "");
  const [state, formAction, pending] = useActionWithSuccess(saveProfile, useSavedToast());
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4" noValidate>
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
      <TextField
        id="settings-name"
        name="displayName"
        label="First name"
        hint="Used in your greeting. Not shared with the AI tutor."
        autoComplete="given-name"
        maxLength={50}
        defaultValue={displayName}
        required
        error={errors.displayName}
      />
      <SelectField
        id="settings-level"
        name="educationLevel"
        label="Stage of education"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        error={errors.educationLevel}
      >
        <option value="">Prefer not to say</option>
        {EDUCATION_LEVELS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </SelectField>
      {level === "other" ? (
        <TextField
          id="settings-level-other"
          name="educationLevelOther"
          label="Describe your stage"
          maxLength={60}
          defaultValue={educationLevelOther ?? ""}
          error={errors.educationLevelOther}
        />
      ) : null}
      <Button type="submit" className="w-fit" loading={pending} loadingText="Saving…">
        Save profile
      </Button>
    </form>
  );
}

export function PreferencesForm({
  goals,
  learningPreference,
}: {
  goals: string[];
  learningPreference: string | null;
}) {
  const [state, formAction, pending] = useActionWithSuccess(savePreferences, useSavedToast());
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
      <fieldset aria-describedby={errors.goals ? "settings-goals-error" : undefined}>
        <legend className="text-sm font-medium">Your goals</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {GOALS.map((g) => (
            <label
              key={g.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-brand"
            >
              <input
                type="checkbox"
                name="goals"
                value={g.value}
                defaultChecked={goals.includes(g.value)}
                className="size-4 accent-[var(--primary)]"
              />
              {g.label}
            </label>
          ))}
        </div>
        {errors.goals ? (
          <p id="settings-goals-error" className="mt-1.5 text-[0.8125rem] font-medium text-danger">
            {errors.goals}
          </p>
        ) : null}
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">How the tutor explains things</legend>
        <p className="mt-0.5 text-[0.8125rem] text-text-muted">
          A preference the tutor takes into account — not a fixed learning style.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-brand">
            <input
              type="radio"
              name="learningPreference"
              value=""
              defaultChecked={!learningPreference}
              className="size-4 accent-[var(--primary)]"
            />
            No preference
          </label>
          {LEARNING_PREFERENCES.map((p) => (
            <label
              key={p.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-brand"
            >
              <input
                type="radio"
                name="learningPreference"
                value={p.value}
                defaultChecked={learningPreference === p.value}
                className="size-4 accent-[var(--primary)]"
              />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" className="w-fit" loading={pending} loadingText="Saving…">
        Save preferences
      </Button>
    </form>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionWithSuccess(deleteAccount);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-fit text-danger">
          Delete my account
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Delete your account permanently?"
        description="This deletes your profile, subjects, topics, study tasks, flashcards, quizzes and results, and all tutor conversations straight away. It can't be undone."
      >
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          {state.status === "error" && state.message ? (
            <FormMessage tone="error">{state.message}</FormMessage>
          ) : null}
          <TextField
            id="delete-confirmation"
            name="confirmation"
            label="Type DELETE to confirm"
            autoComplete="off"
            autoCapitalize="characters"
            error={errors.confirmation}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Keep my account
            </Button>
            <Button type="submit" variant="danger" loading={pending} loadingText="Deleting…">
              Delete permanently
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
