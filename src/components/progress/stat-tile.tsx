import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="size-4" aria-hidden="true" />
        <p className="text-[0.8125rem] font-medium">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-text tabular-nums">
        {value}
      </p>
      {detail ? <p className="mt-0.5 text-[0.8125rem] text-text-muted">{detail}</p> : null}
    </div>
  );
}
