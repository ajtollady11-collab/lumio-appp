"use client";

import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { recordCardReview } from "@/actions/revision";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/cn";

type Card = { id: string; front: string; back: string; topic: string | null };
type Outcome = "remembered" | "forgot";

/**
 * One card at a time: reveal the answer, then say whether you remembered it.
 * Each answer is saved as it is given. This is a simple self-check, not a
 * spaced-repetition schedule.
 */
export function ReviewSession({
  collectionId,
  collectionName,
  cards,
}: {
  collectionId: string;
  collectionName: string;
  cards: Card[];
}) {
  const [order, setOrder] = useState(() => cards.map((c) => c.id));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const finished = index >= order.length;
  const card = finished ? null : byId.get(order[index]!)!;
  const answered = Object.keys(outcomes).filter((id) => order.includes(id)).length;
  const remembered = order.filter((id) => outcomes[id] === "remembered").length;

  const rate = (outcome: Outcome) => {
    if (!card) return;
    setError(null);
    startSaving(async () => {
      const result = await recordCardReview(card.id, outcome === "remembered");
      if (result.status === "error") {
        setError(result.message ?? "We couldn't save that answer. Try again.");
        return;
      }
      setOutcomes((o) => ({ ...o, [card.id]: outcome }));
      setRevealed(false);
      setIndex((i) => i + 1);
    });
  };

  const restart = (onlyForgotten: boolean) => {
    const next = onlyForgotten
      ? order.filter((id) => outcomes[id] === "forgot")
      : cards.map((c) => c.id);
    setOrder(next);
    setOutcomes({});
    setIndex(0);
    setRevealed(false);
  };

  if (finished) {
    const forgotten = order.filter((id) => outcomes[id] === "forgot").length;
    const skipped = order.length - answered;
    return (
      <div className="mx-auto w-full max-w-xl animate-fade-in rounded-lg border border-border bg-surface p-6 text-center shadow-card sm:p-8">
        <p className="text-sm font-medium text-text-muted">Review complete</p>
        <h2 className="mt-1 text-2xl font-semibold">
          You remembered {remembered} of {answered}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {answered === 0
            ? "You skipped every card, so nothing was recorded."
            : forgotten === 0
              ? "Every card you answered. Come back another day to check it has stuck."
              : `Going over the ${forgotten} you missed again now helps them stick.`}
          {skipped > 0 ? ` ${skipped} skipped.` : ""}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {forgotten > 0 ? (
            <Button
              onClick={() => restart(true)}
              icon={<RotateCcw className="size-4" aria-hidden="true" />}
            >
              Review the {forgotten} I missed
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => restart(false)}>
            Review all again
          </Button>
          <ButtonLink href={`/app/revision/${collectionId}`} variant="ghost">
            Back to collection
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/app/revision/${collectionId}`}
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-text-muted hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {collectionName}
        </Link>
        <p className="text-sm text-text-muted tabular-nums" aria-live="polite">
          Card {index + 1} of {order.length}
        </p>
      </div>
      <ProgressBar value={answered} max={order.length} label="Cards reviewed in this session" />

      <section
        aria-label={`Card ${index + 1}`}
        className="flex min-h-[18rem] flex-col rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        {card!.topic ? <p className="text-xs font-medium text-text-muted">{card!.topic}</p> : null}
        <p className="mt-2 text-lg font-medium break-words whitespace-pre-line">{card!.front}</p>
        <div
          className={cn("mt-6 border-t border-dashed border-border pt-6", !revealed && "hidden")}
          aria-hidden={!revealed}
        >
          <p className="text-xs font-medium text-text-muted">Answer</p>
          <p className="mt-1 text-[0.9375rem] break-words whitespace-pre-line">{card!.back}</p>
        </div>
      </section>

      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      {revealed ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => rate("forgot")}
            disabled={saving}
            icon={<X className="size-4" aria-hidden="true" />}
          >
            Didn&apos;t remember
          </Button>
          <Button
            size="lg"
            onClick={() => rate("remembered")}
            loading={saving}
            icon={<Check className="size-4" aria-hidden="true" />}
          >
            Remembered
          </Button>
        </div>
      ) : (
        <Button size="lg" onClick={() => setRevealed(true)} autoFocus>
          Show answer
        </Button>
      )}

      <div className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={index === 0 || saving}
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setRevealed(false);
          }}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={saving}
          onClick={() => {
            setIndex((i) => i + 1);
            setRevealed(false);
          }}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
