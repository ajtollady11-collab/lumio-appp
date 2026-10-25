import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { TutorLoader, TutorSkeleton } from "../_components/tutor-loader";

export const metadata: Metadata = { title: "AI Tutor" };

export default function ConversationPage(props: PageProps<"/app/tutor/[conversationId]">) {
  return (
    <Suspense fallback={<TutorSkeleton />}>
      <ExistingConversation params={props.params} />
    </Suspense>
  );
}

async function ExistingConversation({
  params,
}: {
  params: PageProps<"/app/tutor/[conversationId]">["params"];
}) {
  const { conversationId } = await params;
  const id = z.uuid().safeParse(conversationId);
  if (!id.success) notFound();
  return <TutorLoader conversationId={id.data} />;
}
