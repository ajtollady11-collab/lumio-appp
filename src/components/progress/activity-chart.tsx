import { friendlyDate } from "@/lib/dates";

export type ActivityDay = {
  day: string;
  tasks: number;
  cards: number;
  quizzes: number;
  tutor: number;
};

const SERIES = [
  { key: "tasks", label: "Tasks completed", color: "var(--success)" },
  { key: "cards", label: "Cards reviewed", color: "var(--brand)" },
  { key: "quizzes", label: "Quizzes taken", color: "#c4882b" },
  { key: "tutor", label: "Tutor questions", color: "#8e8c85" },
] as const;

/**
 * Stacked daily activity for the last 14 days, from stored records only.
 * Colour is never the only cue: a legend names each series and an accessible
 * table with the same numbers is available.
 */
export function ActivityChart({ days, today }: { days: ActivityDay[]; today: string }) {
  const totals = days.map((d) => d.tasks + d.cards + d.quizzes + d.tutor);
  const max = Math.max(1, ...totals);

  return (
    <figure aria-labelledby="activity-caption">
      <div className="flex h-40 items-end gap-1 sm:gap-1.5" aria-hidden="true">
        {days.map((d, i) => (
          <div
            key={d.day}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
            title={`${friendlyDate(d.day, today)}: ${totals[i]} activities`}
          >
            <div
              className="flex w-full flex-col-reverse overflow-hidden rounded-t-[4px]"
              style={{ height: `${(totals[i]! / max) * 100}%` }}
            >
              {SERIES.map((s) =>
                d[s.key] > 0 ? (
                  <div
                    key={s.key}
                    style={{ height: `${(d[s.key] / totals[i]!) * 100}%`, background: s.color }}
                  />
                ) : null,
              )}
            </div>
            {totals[i] === 0 ? <div className="h-0.5 w-full rounded-full bg-border" /> : null}
          </div>
        ))}
      </div>
      <div
        className="mt-2 flex justify-between text-[0.6875rem] text-text-muted"
        aria-hidden="true"
      >
        <span>{friendlyDate(days[0]!.day, today)}</span>
        <span>Today</span>
      </div>
      <figcaption
        id="activity-caption"
        className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-muted"
      >
        <span className="sr-only">Daily activity over the last 14 days.</span>
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-[3px]"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            {s.label}
          </span>
        ))}
      </figcaption>
      <details className="mt-3 text-sm">
        <summary className="w-fit cursor-pointer rounded-sm text-primary">View as a table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-[0.8125rem]">
            <thead className="text-text-muted">
              <tr>
                <th scope="col" className="py-1 pr-3 font-medium">
                  Day
                </th>
                {SERIES.map((s) => (
                  <th key={s.key} scope="col" className="py-1 pr-3 font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.day} className="border-t border-border">
                  <th scope="row" className="py-1 pr-3 font-normal">
                    {friendlyDate(d.day, today)}
                  </th>
                  {SERIES.map((s) => (
                    <td key={s.key} className="py-1 pr-3 tabular-nums">
                      {d[s.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
