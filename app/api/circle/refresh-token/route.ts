import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCircleClient } from "@/lib/circle-server";

const COOKIE_NAME = "claimr_session";

// Returns a fresh 60-minute session token + encryption key for the currently
// authenticated user. Round 3a doesn't use this for writes yet, but the route
// exists for 3b (where every signing operation needs fresh tokens) and for
// any client-side flow that re-authenticates the SDK.
export async function POST() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let session: { userId?: string };
    try {
      const decoded = Buffer.from(cookie.value, "base64").toString("utf8");
      session = JSON.parse(decoded);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    if (!session.userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const client = getCircleClient();
    const tokenResp = await client.createUserToken({ userId: session.userId });
    const userToken = tokenResp.data?.userToken;
    const encryptionKey = tokenResp.data?.encryptionKey;
    if (!userToken || !encryptionKey) {
      return NextResponse.json(
        { error: "Could not refresh token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ userToken, encryptionKey });
  } catch (err) {
    console.error("[CIRCLE/refresh-token] FATAL", err);
    return NextResponse.json(
      { error: "Internal token refresh error" },
      { status: 500 }
    );
  }
}
