"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useCallback, useState } from "react";

import { deleteConversation, renameConversation } from "@/actions/tutor";
import { useActionWithSuccess } from "@/components/forms/use-action-feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormMessage, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function ConversationMenu({
  conversationId,
  title,
}: {
  conversationId: string;
  title: string;
}) {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const onRenamed = useCallback(
    (state: { message?: string }) => {
      setRenaming(false);
      if (state.message) toast.success(state.message);
    },
    [toast],
  );
  const [state, formAction, pending] = useActionWithSuccess(renameConversation, onRenamed);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon" aria-label="Conversation options">
            <MoreHorizontal className="size-5" aria-hidden="true" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-44 rounded-sm border border-border bg-surface p-1 shadow-raised"
          >
            <DropdownMenu.Item
              onSelect={() => setRenaming(true)}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-[6px] px-2.5 text-sm outline-none data-highlighted:bg-surface-muted"
            >
              <Pencil className="size-4" aria-hidden="true" /> Rename
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setDeleting(true)}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-[6px] px-2.5 text-sm text-danger outline-none data-highlighted:bg-danger-soft"
            >
              <Trash2 className="size-4" aria-hidden="true" /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent title="Rename conversation">
          <form action={formAction} className="flex flex-col gap-4" noValidate>
            <input type="hidden" name="id" value={conversationId} />
            {state.status === "error" && state.message ? (
              <FormMessage tone="error">{state.message}</FormMessage>
            ) : null}
            <TextField
              id="conversation-title"
              name="title"
              label="Title"
              defaultValue={title}
              maxLength={120}
              error={errors.title}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending} loadingText="Saving…">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this conversation?"
        description="All of its messages will be deleted. This can't be undone."
        confirmLabel="Delete conversation"
        action={deleteConversation}
        hiddenFields={{ id: conversationId }}
      />
    </>
  );
}
