import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { ReviewSession } from "@/components/revision/review-session";
import { ButtonLink } from "@/components/ui/button";
import { CardListSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/states";
import { getCollection } from "@/server/data/revision";

export const metadata: Metadata = { title: "Review flashcards" };

export default function ReviewPage(props: PageProps<"/app/revision/[collectionId]/review">) {
  return (
    <Suspense fallback={<CardListSkeleton label="Loading cards" rows={1} />}>
      <ReviewContent params={props.params} />
    </Suspense>
  );
}

async function ReviewContent({
  params,
}: {
  params: PageProps<"/app/revision/[collectionId]/review">["params"];
}) {
  const { collectionId } = await params;
  if (!z.uuid().safeParse(collectionId).success) notFound();
  const data = await getCollection(collectionId);
  if (!data) notFound();
  if (!data.cards.length) {
    return (
      <EmptyState
        title="This collection has no cards"
        description="Add some cards first, then come back to review them."
        action={<ButtonLink href={`/app/revision/${collectionId}`}>Add cards</ButtonLink>}
      />
    );
  }
  return (
    <ReviewSession
      collectionId={collectionId}
      collectionName={data.collection.name}
      cards={data.cards.map((c) => ({ id: c.id, front: c.front, back: c.back, topic: c.topic }))}
    />
  );
}
