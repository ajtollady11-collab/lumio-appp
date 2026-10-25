/**
 * A static, illustrative piece of student working with one step highlighted.
 * It demonstrates the idea Lumio is being built around — pinpointing the exact
 * step that went wrong — without claiming any feature works yet.
 *
 * The maths is real and checked: 3(x − 4) = 2x + 5 has the solution x = 17.
 * The student's working moves −12 across without changing its sign and reaches x = −7.
 */
const MINUS = "−";

const steps = [
  { id: "expand", text: `3x ${MINUS} 12 = 2x + 5`, isError: false },
  { id: "collect", text: `3x ${MINUS} 2x = 5 ${MINUS} 12`, isError: true },
  { id: "result", text: `x = ${MINUS}7`, isError: false },
] as const;

/** Keeps a mathematical expression on one line. */
function Expr({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>;
}

export function WorkedExample() {
  return (
    <figure
      aria-labelledby="worked-example-caption"
      className="rounded-lg border border-border bg-surface p-6 shadow-[0_1px_0_var(--border)] sm:p-8"
    >
      <p className="text-sm text-text-muted">A student&apos;s working</p>
      <p className="mt-1 font-display text-xl tracking-tight sm:text-2xl">
        Solve 3(x {MINUS} 4) = 2x + 5
      </p>

      <ol
        className="mt-6 space-y-3 font-display text-xl tracking-tight tabular-nums sm:text-[1.375rem]"
        aria-label="Working"
      >
        {steps.map((step) => (
          <li key={step.id} className="relative w-fit">
            {step.isError ? (
              <>
                <span
                  aria-hidden="true"
                  className="highlight-band absolute -inset-x-2 inset-y-0 rounded-sm bg-highlight"
                />
                <span className="relative">
                  {step.text}
                  <span className="sr-only"> (this step contains the mistake)</span>
                </span>
              </>
            ) : (
              step.text
            )}
          </li>
        ))}
      </ol>

      <figcaption
        id="worked-example-caption"
        className="mt-6 border-t border-border pt-4 text-[0.9375rem] leading-relaxed text-text-muted"
      >
        <span className="font-semibold text-text">The second line is where it went wrong.</span>{" "}
        Moving <Expr>{MINUS}12</Expr> to the other side makes it <Expr>+12</Expr>, so{" "}
        <Expr>3x {MINUS} 2x = 5 + 12</Expr> and <Expr>x = 17</Expr>.
      </figcaption>
    </figure>
  );
}
