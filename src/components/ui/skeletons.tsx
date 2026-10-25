import { LoadingBlock, Skeleton } from "./states";

export function CardListSkeleton({
  label = "Loading",
  rows = 3,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <LoadingBlock label={label}>
      <div className="flex flex-col gap-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="rounded-md border border-border bg-surface p-5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-3 h-3 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </LoadingBlock>
  );
}

export function GridSkeleton({ label = "Loading", items = 4 }: { label?: string; items?: number }) {
  return (
    <LoadingBlock label={label}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: items }, (_, i) => (
          <div key={i} className="h-36 rounded-md border border-border bg-surface p-5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-3 h-3 w-1/3" />
            <Skeleton className="mt-8 h-2 w-full" />
          </div>
        ))}
      </div>
    </LoadingBlock>
  );
}
