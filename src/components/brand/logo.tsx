import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";

/**
 * The Lumio mark: a point of light above a stem — an abstract "i", the letter at
 * the centre of the name, read as a lamp. Drawn on a rounded violet tile so it
 * works at favicon size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <circle cx="16" cy="10.25" r="3.25" fill="#fff" />
      <rect x="13.5" y="15.5" width="5" height="10.5" rx="2.5" fill="#fff" fillOpacity="0.92" />
    </svg>
  );
}

/** Mark + wordmark. The accessible name is the product name. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[1.1875rem] leading-none font-semibold tracking-[-0.02em] text-text">
        {brand.name}
      </span>
    </span>
  );
}
