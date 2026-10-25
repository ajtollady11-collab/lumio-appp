import { ArrowLeft, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { CardEditor } from "@/components/revision/card-editor";
import { CollectionActions } from "@/components/revision/revision-actions";
import { ButtonLink } from "@/components/ui/button";
import { CardListSkeleton } from "@/components/ui/skeletons";
import { getCollection, getCollectionReviewStats } from "@/server/data/revision";
import { listSubjects } from "@/server/data/subjects";

export const metadata: Metadata = { title: "Flashcards" };

export default function CollectionPage(props: PageProps<"/app/revision/[collectionId]">) {
  return (
    <>
      <Link
        href="/app/revision"
        className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Revision
      </Link>
      <Suspense fallback={<CardListSkeleton label="Loading collection" />}>
        <CollectionContent params={props.params} />
      </Suspense>
    </>
  );
}

async function CollectionContent({
  params,
}: {
  params: PageProps<"/app/revision/[collectionId]">["params"];
}) {
  const { collectionId } = await params;
  if (!z.uuid().safeParse(collectionId).success) notFound();
  const data = await getCollection(collectionId);
  if (!data) notFound();
  const [stats, subjects] = await Promise.all([
    getCollectionReviewStats(collectionId),
    listSubjects(),
  ]);
  const { collection, cards } = data;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.015em] break-words">
            {collection.name}
          </h1>
          <p className="mt-1 text-[0.9375rem] text-text-muted">
            {collection.subject?.name ?? "No subject"} · {cards.length} card
            {cards.length === 1 ? "" : "s"}
            {stats.reviews > 0
              ? ` · reviewed ${stats.reviews} time${stats.reviews === 1 ? "" : "s"}, remembered ${stats.remembered}`
              : " · not reviewed yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cards.length ? (
            <ButtonLink
              href={`/app/revision/${collection.id}/review`}
              icon={<Play className="size-4" aria-hidden="true" />}
            >
              Start review
            </ButtonLink>
          ) : null}
          <CollectionActions
            collection={{
              id: collection.id,
              name: collection.name,
              subjectId: collection.subject_id,
            }}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          />
        </div>
      </header>
      <CardEditor collectionId={collection.id} cards={cards} />
    </div>
  );
}
