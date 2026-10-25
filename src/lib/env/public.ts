import { parsePublicEnv } from "./schema";

/**
 * Browser-safe environment values.
 * `NEXT_PUBLIC_*` variables must be referenced literally so Next.js can inline
 * them at build time; never add a secret to this object.
 */
export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
