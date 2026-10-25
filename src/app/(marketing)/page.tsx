import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarCheck,
  ChartNoAxesColumn,
  Layers,
  ListChecks,
  MessageCircle,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";

import { ProductPreview } from "@/components/marketing/product-preview";
import { ButtonLink } from "@/components/ui/button";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} — ${brand.tagline}` },
  description: brand.description,
  alternates: { canonical: "/" },
};

const BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Brain,
    title: "Understand, don't just memorise",
    body: "Ask the AI tutor about anything you're studying. It explains step by step and checks you've got it.",
  },
  {
    icon: Target,
    title: "Know what to do next",
    body: "Your dashboard pulls together today's tasks and a single suggested focus, so you can just start.",
  },
  {
    icon: Layers,
    title: "Remember more",
    body: "Turn what you learn into flashcards and quizzes, then come back to them until they stick.",
  },
];

const STEPS = [
  {
    title: `Tell ${brand.name} what you're studying`,
    body: "Add your stage, your subjects and what you want to achieve. It takes about a minute.",
  },
  {
    title: "Plan and learn",
    body: "Schedule short study sessions, and ask the tutor whenever you get stuck.",
  },
  {
    title: "Revise and track",
    body: "Review flashcards, take quizzes and see your progress built from what you've actually done.",
  },
];

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MessageCircle,
    title: "AI tutor",
    body: "Patient explanations, worked examples and practice questions, with maths written clearly.",
  },
  {
    icon: BookOpen,
    title: "Subjects and topics",
    body: "Organise everything you're learning, with your course, exam board and exam date.",
  },
  {
    icon: CalendarCheck,
    title: "Study planner",
    body: "Plan sessions by day and time, then tick them off. Overdue work is flagged, never lost.",
  },
  {
    icon: Layers,
    title: "Flashcards",
    body: "Write your own cards and run quick review sessions that record what you remembered.",
  },
  {
    icon: ListChecks,
    title: "Quizzes",
    body: "Build multiple-choice quizzes with explanations, take them, and get an instant score.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Progress",
    body: "Totals and recent activity counted from your own records. Nothing estimated or made up.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[36rem] max-w-5xl rounded-full bg-[radial-gradient(closest-side,rgb(117_100_232/0.14),transparent)]"
        />
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-16 text-center sm:px-8 sm:pt-24 sm:pb-20">
          <p className="mx-auto inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted shadow-card">
            Your personal AI learning companion
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-[2.625rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
            {brand.tagline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-text-muted">
            Understand difficult topics, build better study habits and make real progress towards
            your goals — all in one calm place.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink
              href="/signup"
              size="lg"
              icon={<ArrowRight className="size-4" aria-hidden="true" />}
            >
              Start learning
            </ButtonLink>
            <ButtonLink href="#product" size="lg" variant="secondary">
              Explore {brand.name}
            </ButtonLink>
          </div>
        </div>
        <div
          id="product"
          className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 pb-20 sm:px-8 sm:pb-28"
        >
          <h2 className="sr-only">A look at the product</h2>
          <ProductPreview />
        </div>
      </section>

      {/* Benefits */}
      <section aria-labelledby="benefits-heading" className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
          <h2
            id="benefits-heading"
            className="max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl"
          >
            Study with a plan, and with help when you need it.
          </h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <li key={b.title}>
                <span className="grid size-10 place-items-center rounded-md bg-primary-soft text-primary">
                  <b.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-text-muted">{b.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="scroll-mt-16 border-t border-border"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2
            id="how-heading"
            className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl"
          >
            Three steps to a better routine.
          </h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="rounded-lg border border-border bg-surface p-6 shadow-card"
              >
                <span className="grid size-8 place-items-center rounded-full bg-text text-sm font-semibold text-white tabular-nums">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="scroll-mt-16 border-t border-border bg-surface"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
          <p className="text-sm font-semibold text-primary">Features</p>
          <h2
            id="features-heading"
            className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl"
          >
            Everything you need to learn and revise.
          </h2>
          <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <f.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-text-muted">
                    {f.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section aria-labelledby="cta-heading" className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
          <div className="relative overflow-hidden rounded-xl bg-text px-6 py-14 text-center text-white sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(117_100_232/0.45),transparent)]"
            />
            <h2
              id="cta-heading"
              className="relative text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl"
            >
              Start learning with {brand.name}
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-[0.9375rem] text-white/75">
              Create an account, add your subjects and ask your first question in a couple of
              minutes.
            </p>
            <div className="relative mt-8 flex justify-center">
              <ButtonLink
                href="/signup"
                size="lg"
                className="bg-white text-text hover:bg-white/90"
                variant="secondary"
              >
                Get started
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
