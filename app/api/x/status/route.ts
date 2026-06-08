import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Returns the verified X handle for a wallet, or null if not linked.
// Used by the settings page to show connected state.

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT x_handle, verified_at FROM users
      WHERE wallet_address = ${wallet} AND x_handle IS NOT NULL
    `;
    if (rows.length === 0) {
      return NextResponse.json({ linked: false, handle: null });
    }
    return NextResponse.json({
      linked: true,
      handle: rows[0].x_handle,
      verifiedAt: rows[0].verified_at,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }
}