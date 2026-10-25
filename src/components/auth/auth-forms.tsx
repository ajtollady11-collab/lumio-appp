"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { logIn, requestPasswordReset, signUp, updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FieldShell, FormMessage, TextField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { idleState } from "@/lib/validation";

function PasswordField({
  id,
  label,
  error,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  error?: string;
  autoComplete: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          maxLength={72}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="h-11 w-full rounded-sm border border-border-strong/70 bg-surface pr-11 pl-3 text-[0.9375rem] hover:border-border-strong focus:border-primary focus:outline-2 focus:outline-brand/35 aria-invalid:border-danger"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-sm text-text-muted hover:text-text"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </FieldShell>
  );
}

function FormError({
  state,
}: {
  state: { status: string; message?: string; fieldErrors?: Record<string, string> };
}) {
  if (state.status !== "error" || !state.message) return null;
  return <FormMessage tone="error">{state.message}</FormMessage>;
}

export function LogInForm({ next, disabled }: { next: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(logIn, idleState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormError state={state} />
      <TextField
        id="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={errors.email}
        disabled={disabled}
      />
      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        error={errors.password}
      />
      <div className="-mt-1 flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Forgot your password?
        </Link>
      </div>
      <Button
        type="submit"
        size="lg"
        loading={pending}
        loadingText="Logging in…"
        disabled={disabled}
      >
        Log in
      </Button>
    </form>
  );
}

export function SignUpForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(signUp, idleState);
  const errors = state.fieldErrors ?? {};
  if (state.status === "success") {
    return <FormMessage tone="success">{state.message}</FormMessage>;
  }
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormError state={state} />
      <TextField
        id="displayName"
        label="First name"
        autoComplete="given-name"
        required
        maxLength={50}
        error={errors.displayName}
        disabled={disabled}
      />
      <TextField
        id="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={errors.email}
        disabled={disabled}
      />
      <PasswordField
        id="password"
        label="Password"
        autoComplete="new-password"
        error={errors.password}
        hint="At least 8 characters."
      />
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="ageConfirmed"
            required
            aria-invalid={errors.ageConfirmed ? true : undefined}
            aria-describedby={errors.ageConfirmed ? "age-error" : undefined}
            className={cn("mt-0.5 size-[1.125rem] shrink-0 accent-primary")}
          />
          <span>
            I&apos;m 13 or older and I agree to the{" "}
            <Link href="/terms" className="font-medium text-primary underline underline-offset-2">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">
              privacy notice
            </Link>
            .
          </span>
        </label>
        {errors.ageConfirmed ? (
          <p id="age-error" className="mt-1.5 text-[0.8125rem] font-medium text-danger">
            {errors.ageConfirmed}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        size="lg"
        loading={pending}
        loadingText="Creating your account…"
        disabled={disabled}
      >
        Create account
      </Button>
    </form>
  );
}

export function ForgotPasswordForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordReset, idleState);
  if (state.status === "success") return <FormMessage tone="success">{state.message}</FormMessage>;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormError state={state} />
      <TextField
        id="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
        disabled={disabled}
      />
      <Button type="submit" size="lg" loading={pending} loadingText="Sending…" disabled={disabled}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, idleState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormError state={state} />
      <PasswordField
        id="password"
        label="New password"
        autoComplete="new-password"
        error={errors.password}
        hint="At least 8 characters."
      />
      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      <Button type="submit" size="lg" loading={pending} loadingText="Saving…">
        Save new password
      </Button>
    </form>
  );
}
