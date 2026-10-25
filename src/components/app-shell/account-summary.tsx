import { LogOut } from "lucide-react";

import { logOut } from "@/actions/auth";
import { Skeleton } from "@/components/ui/states";

/** Signed-in identity and sign-out, shown at the foot of the navigation. */
export function AccountSummaryView({
  displayName,
  email,
}: {
  displayName: string;
  email: string | null;
}) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex items-center gap-3 rounded-sm px-2 py-1.5">
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{displayName}</p>
        {email ? <p className="truncate text-xs text-text-muted">{email}</p> : null}
      </div>
      <form action={logOut}>
        <button
          type="submit"
          className="grid size-9 place-items-center rounded-sm text-text-muted hover:bg-surface-muted hover:text-text"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

export function AccountSummarySkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5" aria-hidden="true">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
