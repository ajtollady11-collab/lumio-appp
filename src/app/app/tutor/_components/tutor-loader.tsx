import { notFound } from "next/navigation";

import { LoadingBlock, Skeleton } from "@/components/ui/states";
import { TutorWorkspace, type ConversationSummary } from "@/components/tutor/tutor-workspace";
import { getConversation, listConversations } from "@/server/data/tutor";
import { listSubjects } from "@/server/data/subjects";
import { isTestProvider, isTutorConfigured } from "@/server/tutor/config";

export function TutorSkeleton() {
  return (
    <LoadingBlock label="Loading the tutor">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pt-6">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="ml-auto h-10 w-2/3" />
      </div>
    </LoadingBlock>
  );
}

/** Loads everything the tutor workspace needs on the server and hands it to the client. */
export async function TutorLoader({
  conversationId,
  subjectId,
  ask,
}: {
  conversationId: string | null;
  subjectId?: string | null;
  ask?: string;
}) {
  const [conversations, subjects, current] = await Promise.all([
    listConversations(),
    listSubjects(),
    conversationId ? getConversation(conversationId) : Promise.resolve(null),
  ]);
  if (conversationId && !current) notFound();

  const availability = isTestProvider()
    ? "test"
    : isTutorConfigured()
      ? "available"
      : "not_configured";
  const summaries: ConversationSummary[] = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updated_at,
    subjectName: c.subject?.name ?? null,
  }));
  const validSubject = subjectId && subjects.some((s) => s.id === subjectId) ? subjectId : null;

  return (
    <TutorWorkspace
      key={conversationId ?? "new"}
      conversationId={conversationId}
      title={current?.conversation.title ?? null}
      initialMessages={(current?.messages ?? []).map((m) => ({
        id: String(m.id),
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }))}
      conversations={summaries}
      subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      initialSubjectId={current?.conversation.subject?.id ?? validSubject}
      initialDraft={ask?.slice(0, 4000) ?? ""}
      availability={availability}
    />
  );
}
