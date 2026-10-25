import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** An empty area that explains what belongs here and offers the next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-md border border-dashed border-border text-center",
        compact ? "px-5 py-7" : "px-6 py-12",
        className,
      )}
    >
      {Icon ? (
        <span className="mb-3 grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : null}
      <p className="text-[0.9375rem] font-semibold text-text">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-pretty text-text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div role="alert" className="rounded-md border border-danger/25 bg-danger-soft px-5 py-4">
      <p className="text-sm font-semibold text-danger">{title}</p>
      <p className="mt-1 text-sm text-text">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse-soft rounded-sm bg-surface-muted", className)}
    />
  );
}

/** Screen-reader-visible loading region with skeleton content for sighted users. */
export function LoadingBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
