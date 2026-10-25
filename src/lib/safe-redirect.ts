/**
 * Returns `next` only if it is a same-site path (prevents open redirects such as
 * `?next=https://evil.example` or `//evil.example`); otherwise the fallback.
 */
export function safeNextPath(next: unknown, fallback = "/app"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(next)) return fallback;
  return next;
}
