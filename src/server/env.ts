import "server-only";

import { parseServerEnv, type ServerEnv } from "@/lib/env/schema";

let cached: ServerEnv | undefined;

/**
 * Server-side environment, validated on first use.
 * Importing this file from client code fails the build (`server-only`).
 */
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
