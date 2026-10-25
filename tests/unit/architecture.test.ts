/**
 * Architecture guardrails (spec §6.3). These encode rules that keep secrets and
 * privileged logic on the server, so a future change cannot quietly break them.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "src");

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
  });
}

const files = listSourceFiles(SRC).map((path) => ({
  path: relative(ROOT, path),
  source: readFileSync(path, "utf8"),
}));

const SERVER_IMPORT = /from\s+["'](@\/server(\/[^"']*)?|(\.\.?\/)+server\/[^"']*)["']/;

describe("server-only boundary", () => {
  it("finds source files to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('marks every module in src/server with import "server-only"', () => {
    const unmarked = files
      .filter((f) => f.path.startsWith("src/server/"))
      .filter((f) => !/^\s*import\s+["']server-only["'];?/m.test(f.source))
      .map((f) => f.path);
    expect(unmarked).toEqual([]);
  });

  it('never imports server modules from a "use client" file', () => {
    const offenders = files
      .filter((f) => /^\s*["']use client["']/m.test(f.source))
      .filter((f) => SERVER_IMPORT.test(f.source))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("never imports server modules from components or shared lib code", () => {
    const offenders = files
      .filter((f) => f.path.startsWith("src/components/") || f.path.startsWith("src/lib/"))
      .filter((f) => SERVER_IMPORT.test(f.source))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('marks every server action module with "use server" and import "server-only"', () => {
    const offenders = files
      .filter((f) => f.path.startsWith("src/actions/"))
      .filter(
        (f) =>
          !/^["']use server["'];?\s*\n\s*import\s+["']server-only["']/.test(f.source.trimStart()),
      )
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("never uses a Supabase service-role key or a browser Supabase client", () => {
    const offenders = files
      .filter((f) => /service_role|SERVICE_ROLE|createBrowserClient/.test(f.source))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("only reads non-public process.env values inside src/server or the env schema", () => {
    const allowed = (path: string) =>
      path.startsWith("src/server/") || path === "src/lib/env/schema.ts";
    const offenders = files
      .filter((f) => !allowed(f.path))
      .filter((f) => /process\.env\.(?!NEXT_PUBLIC_)[A-Z_]+/.test(f.source))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });
});
