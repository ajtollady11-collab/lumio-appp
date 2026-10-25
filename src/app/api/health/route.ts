import { connection } from "next/server";

import { getHealthReport } from "@/server/health";

export async function GET() {
  // Opt out of prerendering: the report must reflect the live deployment.
  await connection();

  return Response.json(getHealthReport(), {
    headers: { "Cache-Control": "no-store" },
  });
}
