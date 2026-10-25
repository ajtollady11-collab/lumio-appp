"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { deleteCollection, deleteQuiz } from "@/actions/revision";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { CollectionFormDialog, QuizFormDialog } from "./revision-forms";

type SubjectOption = { id: string; name: string };

export function CollectionActions({
  collection,
  subjects,
}: {
  collection: { id: string; name: string; subjectId: string | null };
  subjects: SubjectOption[];
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <CollectionFormDialog
        subjects={subjects}
        initial={collection}
        trigger={
          <Button variant="secondary" icon={<Pencil className="size-4" aria-hidden="true" />}>
            Edit
          </Button>
        }
      />
      <Button
        variant="secondary"
        className="text-danger"
        icon={<Trash2 className="size-4" aria-hidden="true" />}
        onClick={() => setConfirmOpen(true)}
      >
        Delete
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete “${collection.name}”?`}
        description="All of its cards and their review history will be deleted. This can't be undone."
        confirmLabel="Delete collection"
        action={deleteCollection}
        hiddenFields={{ id: collection.id }}
      />
    </>
  );
}

export function QuizActions({
  quiz,
  subjects,
}: {
  quiz: { id: string; title: string; description: string | null; subjectId: string | null };
  subjects: SubjectOption[];
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <QuizFormDialog
        subjects={subjects}
        initial={quiz}
        trigger={
          <Button variant="secondary" icon={<Pencil className="size-4" aria-hidden="true" />}>
            Edit
          </Button>
        }
      />
      <Button
        variant="secondary"
        className="text-danger"
        icon={<Trash2 className="size-4" aria-hidden="true" />}
        onClick={() => setConfirmOpen(true)}
      >
        Delete
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete “${quiz.title}”?`}
        description="Its questions will be deleted. Your past results are kept on your progress page. This can't be undone."
        confirmLabel="Delete quiz"
        action={deleteQuiz}
        hiddenFields={{ id: quiz.id }}
      />
    </>
  );
}
