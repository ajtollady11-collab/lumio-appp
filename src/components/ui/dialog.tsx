"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Button } from "./button";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

/** Centred modal with a required title (and optional description) for screen readers. */
export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-[rgb(32_33_31/0.32)] data-[state=open]:animate-fade-in" />
      <RadixDialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-raised focus:outline-none data-[state=open]:animate-fade-in",
          className,
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <RadixDialog.Title className="text-lg font-semibold text-text">
              {title}
            </RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="mt-1 text-sm text-text-muted">
                {description}
              </RadixDialog.Description>
            ) : (
              <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <Button variant="ghost" size="icon" aria-label="Close" className="-mt-2 -mr-2 size-9">
              <X className="size-4" aria-hidden="true" />
            </Button>
          </RadixDialog.Close>
        </div>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

/** Side sheet used for the mobile navigation menu. */
export function SheetContent({ title, children }: { title: string; children: ReactNode }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-[rgb(32_33_31/0.32)] data-[state=open]:animate-fade-in" />
      <RadixDialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,88vw)] flex-col border-l border-border bg-surface shadow-raised focus:outline-none data-[state=open]:animate-fade-in">
        <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
        <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
