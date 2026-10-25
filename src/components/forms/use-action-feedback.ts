"use client";

import { useActionState, useEffect, useRef } from "react";

import { idleState, type ActionState } from "@/lib/validation";

/**
 * `useActionState` plus a callback when an action succeeds (e.g. close a dialog,
 * reset a form). Each new success triggers the callback once.
 */
export function useActionWithSuccess(
  action: (state: ActionState, formData: FormData) => Promise<ActionState>,
  onSuccess?: (state: ActionState) => void,
) {
  const [state, formAction, pending] = useActionState(action, idleState);
  const lastHandled = useRef<ActionState | null>(null);
  useEffect(() => {
    if (state.status === "success" && lastHandled.current !== state) {
      lastHandled.current = state;
      onSuccess?.(state);
    }
  }, [state, onSuccess]);
  return [state, formAction, pending] as const;
}
