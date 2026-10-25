import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

const control =
  "w-full rounded-sm border border-border-strong/70 bg-surface px-3 text-[0.9375rem] text-text shadow-[inset_0_1px_1px_rgb(32_33_31/0.03)] transition-colors placeholder:text-text-muted/80 hover:border-border-strong focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-brand/35 aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted";

type FieldShellProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label, control, hint and error wired together for assistive technology. */
export function FieldShell({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {optional ? <span className="ml-1 font-normal text-text-muted">(optional)</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-[0.8125rem] text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-[0.8125rem] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

type CommonProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
};

export function TextField({
  id,
  label,
  hint,
  error,
  optional,
  className,
  ...props
}: CommonProps & Omit<ComponentProps<"input">, "id">) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <input
        id={id}
        name={props.name ?? id}
        className={cn(control, "h-11")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  error,
  optional,
  className,
  ...props
}: CommonProps & Omit<ComponentProps<"textarea">, "id">) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <textarea
        id={id}
        name={props.name ?? id}
        className={cn(control, "min-h-24 py-2.5 leading-relaxed")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  hint,
  error,
  optional,
  className,
  children,
  ...props
}: CommonProps & Omit<ComponentProps<"select">, "id">) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <select
        id={id}
        name={props.name ?? id}
        className={cn(
          control,
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%236B6C67%22><path d=%22M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z%22/></svg>')] h-11 appearance-none bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat pr-10",
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

/** A form-level message (success or error) announced to screen readers. */
export function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-sm px-3 py-2.5 text-sm",
        tone === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
      )}
    >
      {children}
    </p>
  );
}
