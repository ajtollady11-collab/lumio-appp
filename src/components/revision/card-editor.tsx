"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import { createCard, deleteCard, updateCard } from "@/actions/revision";
import { useActionWithSuccess } from "@/components/forms/use-action-feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

type Card = { id: string; front: string; back: string; topic: string | null };

function CardForm({
  collectionId,
  card,
  onDone,
}: {
  collectionId: string;
  card?: Card;
  onDone?: () => void;
}) {
  const toast = useToast();
  const [formKey, setFormKey] = useState(0);
  const onSuccess = useCallback(
    (state: { message?: string }) => {
      if (state.message) toast.success(state.message);
      setFormKey((k) => k + 1);
      onDone?.();
    },
    [onDone, toast],
  );
  const [state, formAction, pending] = useActionWithSuccess(
    card ? updateCard : createCard,
    onSuccess,
  );
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const prefix = card ? `card-${card.id}` : "new-card";

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="collectionId" value={collectionId} />
      {card ? <input type="hidden" name="id" value={card.id} /> : null}
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <TextAreaField
          id={`${prefix}-front`}
          name="front"
          label="Front (question or prompt)"
          rows={3}
          maxLength={1000}
          defaultValue={card?.front}
          required
          error={errors.front}
        />
        <TextAreaField
          id={`${prefix}-back`}
          name="back"
          label="Back (answer)"
          rows={3}
          maxLength={2000}
          defaultValue={card?.back}
          required
          error={errors.back}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <TextField
          id={`${prefix}-topic`}
          name="topic"
          label="Topic"
          optional
          maxLength={80}
          defaultValue={card?.topic ?? ""}
          error={errors.topic}
          className="flex-1"
        />
        <div className="flex gap-2">
          {onDone && card ? (
            <Button variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          ) : null}
          <Button
            type="submit"
            loading={pending}
            loadingText="Saving…"
            icon={card ? undefined : <Plus className="size-4" aria-hidden="true" />}
          >
            {card ? "Save card" : "Add card"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function CardEditor({ collectionId, cards }: { collectionId: string; cards: Card[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Card | null>(null);
  const stopEditing = useCallback(() => setEditingId(null), []);

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="add-card-heading"
        className="rounded-md border border-border bg-surface p-5 shadow-card"
      >
        <h2 id="add-card-heading" className="mb-3 text-[0.9375rem] font-semibold">
          Add a card
        </h2>
        <CardForm collectionId={collectionId} />
      </section>

      <section aria-labelledby="cards-heading">
        <h2 id="cards-heading" className="mb-3 text-[0.9375rem] font-semibold">
          Cards <span className="font-normal text-text-muted">({cards.length})</span>
        </h2>
        {cards.length ? (
          <ol className="flex flex-col gap-3">
            {cards.map((card, index) => (
              <li
                key={card.id}
                className="rounded-md border border-border bg-surface p-4 shadow-card"
              >
                {editingId === card.id ? (
                  <CardForm collectionId={collectionId} card={card} onDone={stopEditing} />
                ) : (
                  <div className="flex gap-3">
                    <span className="mt-0.5 w-6 shrink-0 text-sm text-text-muted tabular-nums">
                      {index + 1}
                    </span>
                    <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-text-muted">Front</p>
                        <p className="mt-0.5 text-[0.9375rem] break-words whitespace-pre-line">
                          {card.front}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-muted">Back</p>
                        <p className="mt-0.5 text-[0.9375rem] break-words whitespace-pre-line">
                          {card.back}
                        </p>
                      </div>
                      {card.topic ? (
                        <p className="text-xs text-text-muted md:col-span-2">Topic: {card.topic}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        aria-label={`Edit card ${index + 1}`}
                        onClick={() => setEditingId(card.id)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-text-muted hover:text-danger"
                        aria-label={`Delete card ${index + 1}`}
                        onClick={() => setDeleting(card)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-md border border-dashed border-border px-5 py-8 text-center text-sm text-text-muted">
            No cards yet. Add your first card above — a question on the front, the answer on the
            back.
          </p>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this card?"
        description="The card and its review history will be removed. This can't be undone."
        confirmLabel="Delete card"
        action={deleteCard}
        hiddenFields={{ id: deleting?.id ?? "" }}
      />
    </div>
  );
}
