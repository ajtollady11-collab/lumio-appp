"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { deleteSubject } from "@/actions/subjects";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { SubjectFormDialog, type SubjectFormValues } from "./subject-form-dialog";

export function SubjectActions({ subject }: { subject: SubjectFormValues }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <SubjectFormDialog
        initial={subject}
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
        title={`Delete ${subject.name}?`}
        description="Its topics will be deleted. Study tasks, flashcard collections, quizzes and tutor conversations are kept but no longer linked to a subject. This can't be undone."
        confirmLabel="Delete subject"
        action={deleteSubject}
        hiddenFields={{ id: subject.id }}
      />
    </>
  );
}
