"use client";

import { useCallback, useRef, useState } from "react";
import { brand } from "@/lib/brand";

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
export type ChatError = { code: string; message: string; draft: string };

type Event =
  | { type: "delta"; text: string }
  | { type: "done"; conversationId: string }
  | { type: "error"; code: string; message: string };

/**
 * Sends a message to /api/tutor and streams the reply. On failure the student's
 * message is removed from the transcript and returned as `error.draft` so it can
 * be retried — nothing is silently discarded, and nothing half-finished is saved.
 */
export function useTutorChat({
  initialMessages,
  conversationId,
  subjectId,
  onSaved,
}: {
  initialMessages: ChatMessage[];
  conversationId: string | null;
  subjectId: string | null;
  onSaved: (conversationId: string, isNew: boolean) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const conversationRef = useRef(conversationId);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || pending) return false;
      setError(null);
      setPending(true);
      setStreaming("");
      const tempId = `pending-${Date.now()}`;
      setMessages((m) => [...m, { id: tempId, role: "user", content: message }]);

      const fail = (code: string, msg: string) => {
        setMessages((m) => m.filter((x) => x.id !== tempId));
        setError({ code, message: msg, draft: message });
      };

      const controller = new AbortController();
      abortRef.current = controller;
      let reply = "";
      try {
        const response = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            conversationId: conversationRef.current,
            subjectId: conversationRef.current ? null : subjectId,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => null)) as {
            code?: string;
            message?: string;
          } | null;
          fail(
            body?.code ?? "http_error",
            body?.message ?? "The tutor couldn't be reached. Try again.",
          );
          return false;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finished: Event | null = null;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newline: number;
          while ((newline = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (!line) continue;
            const event = JSON.parse(line) as Event;
            if (event.type === "delta") {
              reply += event.text;
              setStreaming(reply);
            } else {
              finished = event;
            }
          }
        }

        if (finished?.type === "done") {
          const isNew = !conversationRef.current;
          conversationRef.current = finished.conversationId;
          setMessages((m) => [
            ...m.map((x) => (x.id === tempId ? { ...x, id: `${tempId}-saved` } : x)),
            { id: `reply-${Date.now()}`, role: "assistant", content: reply },
          ]);
          onSaved(finished.conversationId, isNew);
          return true;
        }
        if (finished?.type === "error") {
          fail(finished.code, finished.message);
          return false;
        }
        fail("interrupted", "The reply was interrupted before it finished. Try again.");
        return false;
      } catch (err) {
        if (controller.signal.aborted) {
          fail(
            "cancelled",
            "You stopped this reply. Your message is back in the box if you want to send it again.",
          );
        } else {
          fail("network", `We couldn't reach ${brand.name}. Check your connection and try again.`);
        }
        void err;
        return false;
      } finally {
        abortRef.current = null;
        setStreaming(null);
        setPending(false);
      }
    },
    [onSaved, pending, subjectId],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { messages, streaming, pending, error, send, stop, clearError: () => setError(null) };
}
