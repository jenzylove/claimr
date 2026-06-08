import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Kicks off X OAuth 2.0 Authorization Code Flow with PKCE.
// Called as a normal navigation: /api/x/start?wallet=0x...
// We stash the PKCE verifier + state + wallet in a short-lived httpOnly
// cookie so the callback can complete the exchange and know which wallet
// to attach the verified handle to.

const X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const SCOPES = "tweet.read users.read";

// base64url encoding (no padding, URL-safe) as required by PKCE.
function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json(
      { error: "A valid wallet address is required to link an X account." },
      { status: 400 }
    );
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const callbackUrl = process.env.X_CALLBACK_URL;
  if (!clientId || !callbackUrl) {
    return NextResponse.json(
      { error: "X OAuth is not configured. Missing TWITTER_CLIENT_ID or X_CALLBACK_URL." },
      { status: 500 }
    );
  }

  // PKCE: random verifier, S256 challenge.
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );

  // CSRF state: random token. We bind the wallet into the signed cookie,
  // not the URL, so it can't be swapped mid-flow.
  const state = base64url(crypto.randomBytes(16));

  const authUrl = new URL(X_AUTHORIZE_URL);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const res = NextResponse.redirect(authUrl.toString());

  // Short-lived cookie holding everything the callback needs. httpOnly so
  // client JS can't touch it; 10 min lifetime is plenty for an OAuth round-trip.
  const payload = JSON.stringify({ state, codeVerifier, wallet: wallet.toLowerCase() });
  res.cookies.set("x_oauth", payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return res;
}