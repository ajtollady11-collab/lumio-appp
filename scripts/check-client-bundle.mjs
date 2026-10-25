#!/usr/bin/env node
/**
 * Fails if anything that looks like a secret, or the name of a server-only
 * variable, appears in the browser bundle produced by `next build`.
 * Run after the build: `pnpm check:bundle`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const STATIC_DIR = join(process.cwd(), ".next", "static");

const FORBIDDEN = [
  { name: "Supabase service-role variable", pattern: /SUPABASE_SERVICE_ROLE/ },
  { name: "Supabase secret key", pattern: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: "Anthropic API key", pattern: /sk-ant-[A-Za-z0-9_-]{10,}/ },
  { name: "Anthropic key variable", pattern: /ANTHROPIC_API_KEY/ },
  { name: "Stripe secret key", pattern: /(sk|rk)_(live|test)_[A-Za-z0-9]{10,}/ },
  { name: "Stripe webhook secret", pattern: /whsec_[A-Za-z0-9]{10,}/ },
  { name: "Private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

if (!existsSync(STATIC_DIR)) {
  console.error("No .next/static directory found. Run `pnpm build` first.");
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(STATIC_DIR).filter((f) => /\.(js|css|html|json|map)$/.test(f));
const findings = [];

for (const file of files) {
  const content = readFileSync(file, "utf8");
  for (const { name, pattern } of FORBIDDEN) {
    if (pattern.test(content)) findings.push(`${name} in ${file}`);
  }
}

if (findings.length > 0) {
  console.error("Possible secrets found in the client bundle:\n" + findings.join("\n"));
  process.exit(1);
}

console.log(`Client bundle check passed (${files.length} files scanned).`);
