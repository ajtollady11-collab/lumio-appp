import "server-only";

import type { ServerSupabase } from "@/server/supabase";

import { boundHistory, buildSystemPrompt, type ChatMessage, type TutorContext } from "./prompt";
import { classifyProviderError, type TutorProvider } from "./provider";

/** Events streamed to the browser as newline-delimited JSON. */
export type TutorEvent =
  | { type: "delta"; text: string }
  | { type: "done"; conversationId: string }
  | { type: "error"; code: string; message: string };

export const TUTOR_ERROR_MESSAGES: Record<string, string> = {
  ai_auth_failed:
    "The AI tutor isn't set up correctly. Your message wasn't sent — please try again later.",
  ai_busy: "The AI tutor is busy right now. Wait a moment and try again.",
  ai_timeout: "The AI tutor took too long to reply. Try again, or ask a shorter question.",
  ai_unavailable: "The AI tutor is temporarily unavailable. Try again in a moment.",
  ai_error: "Something went wrong while generating a reply. Try again.",
  save_failed:
    "We got a reply but couldn't save it, so it hasn't been added to your history. Try again.",
  empty_reply: "The tutor didn't return an answer. Try rephrasing your question.",
};

export const TUTOR_TIMEOUT_MS = 90_000;

/**
 * Streams one tutor reply and saves the exchange only if it completes.
 * The request must already be reserved (rate-limited) by the caller.
 */
export function streamTutorReply({
  supabase,
  provider,
  requestId,
  context,
  history,
  message,
  conversationId,
  subjectId,
  signal,
}: {
  supabase: ServerSupabase;
  provider: TutorProvider;
  requestId: string;
  context: TutorContext;
  history: ChatMessage[];
  message: string;
  conversationId: string | null;
  subjectId: string | null;
  signal: AbortSignal;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController<Uint8Array>, event: TutorEvent) =>
    controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

  return new ReadableStream({
    async start(controller) {
      const timeout = AbortSignal.timeout(TUTOR_TIMEOUT_MS);
      const combined = AbortSignal.any([signal, timeout]);
      let reply = "";
      try {
        const stream = provider.stream({
          system: buildSystemPrompt(context),
          messages: [...boundHistory(history), { role: "user", content: message }],
          signal: combined,
        });
        for await (const chunk of stream.text) {
          reply += chunk;
          send(controller, { type: "delta", text: chunk });
        }
        const usage = await stream.usage();
        if (!reply.trim()) {
          await supabase.rpc("fail_tutor_request", {
            p_request_id: requestId,
            p_error_code: "empty_reply",
          });
          send(controller, {
            type: "error",
            code: "empty_reply",
            message: TUTOR_ERROR_MESSAGES.empty_reply!,
          });
          return;
        }

        const saved = await supabase.rpc("complete_tutor_request", {
          p_request_id: requestId,
          p_user_content: message,
          p_assistant_content: reply.slice(0, 20_000),
          p_model: usage.model,
          p_input_tokens: usage.inputTokens,
          p_output_tokens: usage.outputTokens,
          ...(conversationId ? { p_conversation_id: conversationId } : {}),
          ...(subjectId && !conversationId ? { p_subject_id: subjectId } : {}),
        });
        if (saved.error || !saved.data) {
          console.error("[tutor] save failed", saved.error?.code);
          await supabase.rpc("fail_tutor_request", {
            p_request_id: requestId,
            p_error_code: "save_failed",
          });
          send(controller, {
            type: "error",
            code: "save_failed",
            message: TUTOR_ERROR_MESSAGES.save_failed!,
          });
          return;
        }
        send(controller, { type: "done", conversationId: saved.data });
      } catch (error) {
        const classified = classifyProviderError(error);
        const code = timeout.aborted ? "ai_timeout" : classified.code;
        console.error("[tutor] provider failure", code);
        await supabase.rpc("fail_tutor_request", { p_request_id: requestId, p_error_code: code });
        if (!signal.aborted) {
          send(controller, {
            type: "error",
            code,
            message: TUTOR_ERROR_MESSAGES[code] ?? TUTOR_ERROR_MESSAGES.ai_error!,
          });
        }
      } finally {
        controller.close();
      }
    },
  });
}
