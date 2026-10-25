"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import { createTopic, deleteTopic, updateTopic } from "@/actions/subjects";
import { useActionWithSuccess } from "@/components/forms/use-action-feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

type Topic = { id: string; name: string; description: string | null };

function TopicForm({
  subjectId,
  topic,
  onDone,
}: {
  subjectId: string;
  topic?: Topic;
  onDone: () => void;
}) {
  const toast = useToast();
  const [formKey, setFormKey] = useState(0);
  const onSuccess = useCallback(
    (state: { message?: string }) => {
      if (state.message) toast.success(state.message);
      setFormKey((k) => k + 1);
      onDone();
    },
    [onDone, toast],
  );
  const [state, formAction, pending] = useActionWithSuccess(
    topic ? updateTopic : createTopic,
    onSuccess,
  );
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const idPrefix = topic ? `topic-${topic.id}` : "new-topic";

  return (
    <form
      key={formKey}
      action={formAction}
      className="flex flex-col gap-3 rounded-sm bg-surface-muted p-4"
      noValidate
    >
      <input type="hidden" name="subjectId" value={subjectId} />
      {topic ? <input type="hidden" name="id" value={topic.id} /> : null}
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
      <TextField
        id={`${idPrefix}-name`}
        name="name"
        label="Topic name"
        placeholder="e.g. Quadratic equations"
        defaultValue={topic?.name}
        maxLength={120}
        required
        error={errors.name}
      />
      <TextAreaField
        id={`${idPrefix}-description`}
        name="description"
        label="Notes"
        optional
        rows={2}
        maxLength={1000}
        defaultValue={topic?.description ?? ""}
        error={errors.description}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={pending} loadingText="Saving…">
          {topic ? "Save topic" : "Add topic"}
        </Button>
      </div>
    </form>
  );
}

export function TopicsPanel({ subjectId, topics }: { subjectId: string; topics: Topic[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Topic | null>(null);
  const stopAdding = useCallback(() => setAdding(false), []);
  const stopEditing = useCallback(() => setEditingId(null), []);

  return (
    <div className="flex flex-col gap-3">
      {topics.length ? (
        <ul className="divide-y divide-border">
          {topics.map((topic) =>
            editingId === topic.id ? (
              <li key={topic.id} className="py-3">
                <TopicForm subjectId={subjectId} topic={topic} onDone={stopEditing} />
              </li>
            ) : (
              <li key={topic.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-medium break-words">{topic.name}</p>
                  {topic.description ? (
                    <p className="mt-0.5 text-sm whitespace-pre-line text-text-muted">
                      {topic.description}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  aria-label={`Edit ${topic.name}`}
                  onClick={() => setEditingId(topic.id)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-text-muted hover:text-danger"
                  aria-label={`Delete ${topic.name}`}
                  onClick={() => setDeleting(topic)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ),
          )}
        </ul>
      ) : !adding ? (
        <p className="text-sm text-text-muted">
          No topics yet. Break the subject into the units or chapters you&apos;re studying.
        </p>
      ) : null}

      {adding ? (
        <TopicForm subjectId={subjectId} onDone={stopAdding} />
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="w-fit"
          icon={<Plus className="size-4" aria-hidden="true" />}
          onClick={() => setAdding(true)}
        >
          Add topic
        </Button>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this topic?"
        description={deleting ? `“${deleting.name}” will be removed. This can't be undone.` : ""}
        confirmLabel="Delete topic"
        action={deleteTopic}
        hiddenFields={{ id: deleting?.id ?? "" }}
      />
    </div>
  );
}
