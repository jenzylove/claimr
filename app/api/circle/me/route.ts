import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCircleClient, getArcWallet } from "@/lib/circle-server";

const COOKIE_NAME = "claimr_session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    let session: { userId?: string; email?: string };
    try {
      const decoded = Buffer.from(cookie.value, "base64").toString("utf8");
      session = JSON.parse(decoded);
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    if (!session.userId || !session.email) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Look up the current wallet for this user. The user token here is server-
    // internal only; we don't return it to the client.
    let walletAddress: string | null = null;
    try {
      const client = getCircleClient();
      const tokenResp = await client.createUserToken({ userId: session.userId });
      const userToken = tokenResp.data?.userToken;
      if (userToken) {
        const wallet = await getArcWallet(userToken);
        walletAddress = wallet?.address ?? null;
      }
    } catch (err) {
      // Cookie exists but Circle lookup failed. Return what we have rather than
      // forcing a logout; the session is still valid, just couldn't fetch wallet.
      console.error("[CIRCLE/me] wallet lookup failed", err);
    }

    return NextResponse.json({
      authenticated: true,
      email: session.email,
      walletAddress,
    });
  } catch (err) {
    console.error("[CIRCLE/me] FATAL", err);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
