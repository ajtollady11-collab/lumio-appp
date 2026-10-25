import { tutorRequestSchema } from "@/lib/validation";
import { getSessionUser } from "@/server/auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/server/supabase";
import { getTutorProvider } from "@/server/tutor/config";
import { streamTutorReply } from "@/server/tutor/service";

export const maxDuration = 120;

const MAX_BODY_BYTES = 16_384;

function jsonError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/tutor — sends one message to the AI tutor and streams the reply as
 * newline-delimited JSON events. Everything is checked server-side: session,
 * input, ownership of the conversation and subject, rate limits and provider
 * configuration. The API key never leaves the server.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return jsonError(
      503,
      "auth_not_configured",
      "Accounts aren't configured, so the tutor can't be used yet.",
    );
  }
  const user = await getSessionUser();
  if (!user)
    return jsonError(
      401,
      "unauthenticated",
      "Your session has ended. Log in again to keep chatting.",
    );

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES)
    return jsonError(413, "too_large", "That message is too long to send.");

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES)
      return jsonError(413, "too_large", "That message is too long to send.");
    body = JSON.parse(raw);
  } catch {
    return jsonError(400, "invalid_request", "That request couldn't be read.");
  }
  const parsed = tutorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "invalid_message",
      parsed.error.issues[0]?.message ?? "Check your message and try again.",
    );
  }

  const availability = getTutorProvider();
  if (!availability.available) {
    return jsonError(
      503,
      "ai_not_configured",
      "The AI tutor hasn't been configured yet (no AI provider key is set), so no reply can be generated.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { message, conversationId = null, subjectId = null } = parsed.data;

  // Ownership checks (row-level security returns nothing for other students' rows).
  let history: { role: "user" | "assistant"; content: string }[] = [];
  let focusSubjectId = subjectId;
  if (conversationId) {
    const conversation = await supabase
      .from("conversations")
      .select("id, subject_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conversation.data)
      return jsonError(404, "conversation_not_found", "That conversation doesn't exist.");
    focusSubjectId = conversation.data.subject_id;
    const recent = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("id", { ascending: false })
      .limit(20);
    history = (recent.data ?? []).reverse() as typeof history;
  }

  const [profile, subjects] = await Promise.all([
    supabase
      .from("profiles")
      .select("education_level, education_level_other, goals, learning_preference")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("subjects")
      .select("id, name, level, qualification, exam_board")
      .order("name")
      .limit(12),
  ]);
  const subjectRows = subjects.data ?? [];
  const focus = focusSubjectId ? subjectRows.find((s) => s.id === focusSubjectId) : undefined;
  if (subjectId && !focus)
    return jsonError(404, "subject_not_found", "That subject doesn't exist.");

  const reserved = await supabase.rpc("reserve_tutor_request");
  if (reserved.error || !reserved.data) {
    if (reserved.error?.message.includes("rate_limited_short")) {
      return jsonError(
        429,
        "rate_limited",
        "You're sending messages quickly. Wait a few minutes, then try again.",
      );
    }
    if (reserved.error?.message.includes("rate_limited_daily")) {
      return jsonError(
        429,
        "rate_limited_daily",
        "You've reached today's tutor limit. It resets within 24 hours.",
      );
    }
    return jsonError(500, "server_error", "We couldn't start this request. Try again.");
  }

  const toSubject = (s: (typeof subjectRows)[number]) => ({
    name: s.name,
    level: s.level,
    qualification: s.qualification,
    examBoard: s.exam_board,
  });

  const stream = streamTutorReply({
    supabase,
    provider: availability.provider,
    requestId: reserved.data,
    message,
    conversationId,
    subjectId: focus ? focus.id : null,
    history,
    signal: request.signal,
    context: {
      educationLevel: profile.data?.education_level ?? null,
      educationLevelOther: profile.data?.education_level_other ?? null,
      goals: profile.data?.goals ?? [],
      learningPreference: profile.data?.learning_preference ?? null,
      subjects: subjectRows.map(toSubject),
      focusSubject: focus ? toSubject(focus) : null,
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Reject other methods explicitly.
export function GET() {
  return jsonError(405, "method_not_allowed", "Use POST.");
}
