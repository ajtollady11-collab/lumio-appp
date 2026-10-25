"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-xl py-10">
      <ErrorState
        title="This page couldn't load"
        description={
          error.message && !error.digest
            ? error.message
            : "Something went wrong on our side. Your saved work is safe. Try again, or come back in a moment."
        }
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={reset}
            icon={<RotateCcw className="size-4" aria-hidden="true" />}
          >
            Try again
          </Button>
        }
      />
    </div>
  );
}
