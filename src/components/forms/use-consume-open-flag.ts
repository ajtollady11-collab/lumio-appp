"use client";

import { useEffect } from "react";

/**
 * Dialogs can be opened from a link such as `/app/planner?new=1`. Once a dialog
 * has opened that way, remove the flag from the address so a later refresh or
 * re-render (for example after saving) doesn't open it again.
 */
export function useConsumeOpenFlag(openedFromUrl: boolean) {
  useEffect(() => {
    if (!openedFromUrl) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("new")) return;
    url.searchParams.delete("new");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [openedFromUrl]);
}
