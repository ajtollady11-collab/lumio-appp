#!/usr/bin/env node
// Prints sandbox API keys: HS256 JWTs signed with the stack's development secret,
// in the same shape as the Supabase CLI's local anon / service_role keys.
// Usage: node keys.mjs <anon|service_role>
import { createHmac } from "node:crypto";

export const SANDBOX_JWT_SECRET = "sandbox-only-jwt-secret-not-for-production-use-0001";

const b64url = (input) => Buffer.from(input).toString("base64url");

export function signKey(role) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({ iss: "lumio-sandbox", role, iat: 1761350400, exp: 2076710400 }),
  );
  const signature = createHmac("sha256", SANDBOX_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const role = process.argv[2] ?? "anon";
  if (!["anon", "service_role"].includes(role)) {
    console.error("role must be anon or service_role");
    process.exit(1);
  }
  process.stdout.write(signKey(role));
}
