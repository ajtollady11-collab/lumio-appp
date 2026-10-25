"use client";

import { useCallback, type ReactNode } from "react";

import { useActionWithSuccess } from "@/components/forms/use-action-feedback";
import type { ActionState } from "@/lib/validation";

import { Button } from "./button";
import { Dialog, DialogContent } from "./dialog";
import { FormMessage } from "./field";
import { useToast } from "./toast";

/** Confirmation for destructive actions; submits a server action with hidden fields. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  action,
  hiddenFields,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  hiddenFields: Record<string, string>;
  children?: ReactNode;
}) {
  const toast = useToast();
  const onSuccess = useCallback(
    (state: ActionState) => {
      onOpenChange(false);
      if (state.message) toast.success(state.message);
    },
    [onOpenChange, toast],
  );
  const [state, formAction, pending] = useActionWithSuccess(action, onSuccess);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description}>
        <form action={formAction} className="flex flex-col gap-4">
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          {children}
          {state.status === "error" && state.message ? (
            <FormMessage tone="error">{state.message}</FormMessage>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={pending} loadingText="Deleting…">
              {confirmLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
