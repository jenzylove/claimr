import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCircleClient,
  emailToUserId,
  getArcWallet,
} from "@/lib/circle-server";

const COOKIE_NAME = "claimr_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function isValidEmail(s: unknown): s is string {
  if (typeof s !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email;
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const userId = emailToUserId(email);
    const client = getCircleClient();

    // Issue a fresh user token so we can look up the wallet we just created.
    const tokenResp = await client.createUserToken({ userId });
    const userToken = tokenResp.data?.userToken;
    if (!userToken) {
      return NextResponse.json(
        { error: "Could not issue session token" },
        { status: 500 }
      );
    }

    const wallet = await getArcWallet(userToken);
    if (!wallet) {
      // PIN challenge completed but the wallet isn't visible yet. This is rare,
      // but possible if Circle's side hasn't propagated. Client can retry.
      return NextResponse.json(
        { error: "Wallet not yet provisioned, retry shortly" },
        { status: 503 }
      );
    }

    // Persist the session. Plain httpOnly cookie containing userId + email,
    // base64-encoded so special characters in JSON don't trip cookie parsers.
    // Signed cookies are a planned upgrade (would need SESSION_SECRET env var).
    const sessionValue = Buffer.from(
      JSON.stringify({ userId, email })
    ).toString("base64");
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    });

    return NextResponse.json({
      email,
      walletAddress: wallet.address,
    });
  } catch (err) {
    console.error("[CIRCLE/finalize] FATAL", err);
    return NextResponse.json(
      { error: "Internal finalize error" },
      { status: 500 }
    );
  }
}
