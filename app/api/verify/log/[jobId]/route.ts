import { NextRequest, NextResponse } from "next/server";
import { getReasoning } from "@/lib/verification-log";

// GET /api/verify/log/[jobId]
//
// Returns the AI's verification reasoning for a given job, or 404 if no
// log exists. Called by VerifierCard on the project dashboard to display
// reasoning alongside the verdict.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId: jobIdStr } = await params;
  const jobId = parseInt(jobIdStr, 10);

  if (Number.isNaN(jobId) || jobId < 0) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const entry = getReasoning(jobId);

  if (!entry) {
    // 404 is a valid response — the frontend treats absence as "no reasoning
    // available yet" rather than an error condition.
    return NextResponse.json({ error: "No verification log found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}
