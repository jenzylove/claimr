import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCircleClient } from "@/lib/circle-server";

const COOKIE_NAME = "claimr_session";

function decodeSession(value: string): { userId?: string } | null {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

// Terminal states (no more polling needed). Per Circle's docs.
const TERMINAL_STATES = new Set([
  "COMPLETE",
  "CONFIRMED",
  "FAILED",
  "CANCELLED",
  "DENIED",
]);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const session = decodeSession(cookie.value);
    if (!session?.userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const client = getCircleClient();
    const tokenResp = await client.createUserToken({ userId: session.userId });
    const userToken = tokenResp.data?.userToken;
    if (!userToken) {
      return NextResponse.json(
        { error: "Could not issue session token" },
        { status: 500 }
      );
    }

    const txResp = await client.getTransaction({ userToken, id } as any);
    const tx: any = txResp.data?.transaction;
    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      state: tx.state ?? null,
      txHash: tx.txHash ?? null,
      errorReason: tx.errorReason ?? null,
      isTerminal: TERMINAL_STATES.has(tx.state),
    });
  } catch (err: any) {
    console.error("[CIRCLE/tx/status] FATAL", err);
    const upstream = err?.response?.data?.message;
    return NextResponse.json(
      { error: upstream ?? "Could not fetch transaction status" },
      { status: 500 }
    );
  }
}
