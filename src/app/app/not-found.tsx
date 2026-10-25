import { SearchX } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default function AppNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl py-10">
      <h1 className="sr-only">Not found</h1>
      <EmptyState
        icon={SearchX}
        title="We couldn't find that"
        description="It may have been deleted, or the link is wrong. Anything you can see is only ever your own data."
        action={<ButtonLink href="/app">Go to your overview</ButtonLink>}
      />
    </div>
  );
}
