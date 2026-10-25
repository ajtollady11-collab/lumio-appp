import type { ReactNode } from "react";

/** Shared layout for the draft legal pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-8 sm:py-20">
      <p
        role="note"
        className="rounded-md border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-text"
      >
        <strong>Draft.</strong> This page is a working draft for early testing and has not yet been
        reviewed by a lawyer. It will be replaced before a public launch.
      </p>
      <h1 className="mt-8 text-3xl font-semibold tracking-[-0.025em]">{title}</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated {updated}</p>
      <div className="legal mt-8 flex flex-col gap-4 text-[0.9375rem] leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </div>
    </article>
  );
}
