import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-md border border-border bg-surface p-5 shadow-card sm:p-6", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  as: Heading = "h2",
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
  id?: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Heading id={id} className="text-[0.9375rem] font-semibold text-text">
          {title}
        </Heading>
        {description ? <p className="mt-0.5 text-sm text-text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
