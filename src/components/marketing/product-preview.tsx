import {
  CalendarDays,
  Check,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { brand } from "@/lib/brand";

/**
 * DEMO DATA — illustration only.
 * Everything below is invented example content used to show the layout of the app on
 * the marketing page. It is not a real student, real progress or real usage, and it is
 * rendered as a static picture (no controls) with a visible "Example" caption.
 */
const DEMO_PREVIEW = {
  student: "Sam",
  focus: "Practise solving quadratic equations",
  tasks: [
    { title: "Quadratics: factorising", subject: "Maths", done: true },
    { title: "Cell structure flashcards", subject: "Biology", done: false },
    { title: "Read Act 3 summary", subject: "English", done: false },
  ],
  tutorQuestion: "Why do we flip the inequality sign when dividing by a negative?",
  tutorReply:
    "Good question. Multiplying or dividing by a negative reverses the order of numbers — 2 < 3, but −2 > −3 — so the sign flips to keep the statement true.",
} as const;

export function ProductPreview() {
  const d = DEMO_PREVIEW;
  return (
    <figure className="relative">
      <div
        role="img"
        aria-label={`Illustration of the ${brand.name} dashboard and tutor, using example content`}
        className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_30px_80px_-40px_rgb(32_33_31/0.35),0_2px_8px_rgb(32_33_31/0.04)]"
      >
        <div aria-hidden="true" className="flex select-none">
          {/* Sidebar */}
          <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-border bg-bg/60 p-3 sm:flex">
            <div className="mb-3 flex items-center gap-2 px-1.5">
              <LogoMark className="size-6" />
              <span className="text-sm font-semibold">{brand.name}</span>
            </div>
            {[
              { icon: LayoutDashboard, label: "Dashboard", active: true },
              { icon: MessageCircle, label: "AI Tutor" },
              { icon: CalendarDays, label: "Planner" },
              { icon: Layers, label: "Revision" },
            ].map((item) => (
              <div
                key={item.label}
                className={
                  item.active
                    ? "flex items-center gap-2 rounded-sm bg-primary-soft px-2 py-1.5 text-xs font-medium text-primary"
                    : "flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-text-muted"
                }
              >
                <item.icon className="size-3.5" />
                {item.label}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <p className="text-base font-semibold">Good afternoon, {d.student}</p>
            <div className="mt-3 flex items-center gap-3 rounded-md border border-border p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-primary-soft text-primary">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.625rem] font-semibold tracking-wide text-primary uppercase">
                  Today&apos;s focus
                </p>
                <p className="truncate text-xs font-medium">{d.focus}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs font-semibold">Today&apos;s tasks</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {d.tasks.map((t) => (
                    <li key={t.title} className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          t.done
                            ? "grid size-4 shrink-0 place-items-center rounded-full bg-success text-white"
                            : "size-4 shrink-0 rounded-full border border-border-strong/60"
                        }
                      >
                        {t.done ? <Check className="size-2.5" strokeWidth={3} /> : null}
                      </span>
                      <span
                        className={t.done ? "truncate text-text-muted line-through" : "truncate"}
                      >
                        {t.title}
                      </span>
                      <span className="ml-auto shrink-0 text-[0.625rem] text-text-muted">
                        {t.subject}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                <p className="text-xs font-semibold">AI Tutor</p>
                <p className="ml-auto max-w-[90%] rounded-md rounded-br-sm bg-primary-soft px-2.5 py-1.5 text-[0.6875rem]">
                  {d.tutorQuestion}
                </p>
                <div className="flex gap-1.5">
                  <LogoMark className="size-4" />
                  <p className="text-[0.6875rem] leading-relaxed text-text">{d.tutorReply}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-text-muted">
        Example content, for illustration.
      </figcaption>
    </figure>
  );
}
