import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { getAllReasoning } from "@/lib/verification-log";

// Returns the in-memory verification reasoning log, newest first.
// Gated by ADMIN_EMAILS env var.

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason ?? "Not authorized" },
      { status: 403 }
    );
  }

  const entries = getAllReasoning();
  return NextResponse.json({ entries });
}
