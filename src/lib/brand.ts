/**
 * Single source for the product name and the copy that names it.
 *
 * The name "Lumio" is pending a trademark check (spec decision D21): another
 * education product already uses it. Keep every user-facing mention of the name
 * routed through this file so a rename is a one-line change.
 */
export const brand = {
  name: "Lumio",
  tagline: "Learn better. Remember more.",
  description:
    "Your personal AI learning companion. Understand difficult topics, build better study habits and make real progress towards your goals.",
} as const;
