/**
 * Single source for the product name and copy that names it.
 *
 * The name "Lumio" is pending trademark clearance (spec decision D21): another
 * education product already uses it. Keep every user-facing mention of the
 * name routed through this file so a rename is a one-line change.
 */
export const brand = {
  name: "Lumio",
  tagline: "Understand it. Remember it. Show it in the exam.",
} as const;
