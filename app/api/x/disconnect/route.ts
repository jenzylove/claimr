import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Unlinks the X handle from a wallet (clears handle + user id, keeps the row).

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const wallet = (body?.wallet as string | undefined)?.toLowerCase();

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  try {
    await sql`
      UPDATE users
      SET x_handle = NULL, x_user_id = NULL, verified_at = NULL
      WHERE wallet_address = ${wallet}
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Disconnect failed." }, { status: 500 });
  }
}