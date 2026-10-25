import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";

import { TutorLoader, TutorSkeleton } from "./_components/tutor-loader";

export const metadata: Metadata = { title: "AI Tutor" };

export default function TutorPage(props: PageProps<"/app/tutor">) {
  return (
    <Suspense fallback={<TutorSkeleton />}>
      <NewConversation searchParams={props.searchParams} />
    </Suspense>
  );
}

async function NewConversation({
  searchParams,
}: {
  searchParams: PageProps<"/app/tutor">["searchParams"];
}) {
  const params = await searchParams;
  const subject = z.uuid().safeParse(params.subject);
  const ask = typeof params.ask === "string" ? params.ask : undefined;
  return (
    <TutorLoader
      conversationId={null}
      subjectId={subject.success ? subject.data : null}
      ask={ask}
    />
  );
}
