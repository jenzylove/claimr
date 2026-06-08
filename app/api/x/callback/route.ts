import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Completes X OAuth 2.0. X redirects here with ?code & ?state.
// We: verify state against the cookie, exchange the code for an access
// token (confidential client = HTTP Basic auth), fetch the user's handle,
// then upsert wallet -> handle into Neon. Finally redirect back to settings.

const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_ME_URL = "https://api.x.com/2/users/me";

// Where to send the user after linking (success or failure flag in query).
function settingsRedirect(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/dashboard/settings", req.nextUrl.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = NextResponse.redirect(url.toString());
  // Clear the transient OAuth cookie regardless of outcome.
  res.cookies.set("x_oauth", "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const returnedState = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");

  // User denied or X errored on the authorize screen.
  if (oauthError) {
    return settingsRedirect(req, { x_linked: "denied" });
  }

  if (!code || !returnedState) {
    return settingsRedirect(req, { x_linked: "error" });
  }

  // Recover the stashed PKCE verifier + state + wallet from the cookie.
  const cookie = req.cookies.get("x_oauth")?.value;
  if (!cookie) {
    return settingsRedirect(req, { x_linked: "expired" });
  }

  let stashed: { state: string; codeVerifier: string; wallet: string };
  try {
    stashed = JSON.parse(cookie);
  } catch {
    return settingsRedirect(req, { x_linked: "error" });
  }

  // CSRF check: the state X returned must match what we issued.
  if (returnedState !== stashed.state) {
    return settingsRedirect(req, { x_linked: "error" });
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const callbackUrl = process.env.X_CALLBACK_URL;
  if (!clientId || !clientSecret || !callbackUrl) {
    return settingsRedirect(req, { x_linked: "error" });
  }

  try {
    // Step 1: exchange the authorization code for an access token.
    // Confidential client => HTTP Basic auth header with client_id:client_secret.
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(X_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
        code_verifier: stashed.codeVerifier,
      }).toString(),
    });

    if (!tokenRes.ok) {
      return settingsRedirect(req, { x_linked: "error" });
    }
    const token = await tokenRes.json();
    const accessToken = token.access_token as string;

    // Step 2: fetch the authenticated user's identity.
    const meRes = await fetch(X_ME_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!meRes.ok) {
      return settingsRedirect(req, { x_linked: "error" });
    }
    const me = await meRes.json();
    const handle = me?.data?.username as string | undefined;
    const xUserId = me?.data?.id as string | undefined;

    if (!handle || !xUserId) {
      return settingsRedirect(req, { x_linked: "error" });
    }

    // Step 3: enforce one X account per wallet AND one wallet per X account.
    // If this X handle is already linked to a DIFFERENT wallet, reject.
    const existing = await sql`
      SELECT wallet_address FROM users
      WHERE x_user_id = ${xUserId} AND wallet_address <> ${stashed.wallet}
    `;
    if (existing.length > 0) {
      return settingsRedirect(req, { x_linked: "taken" });
    }

    // Step 4: upsert the mapping. Stores handle + permanent user id.
    await sql`
      INSERT INTO users (wallet_address, x_handle, x_user_id, verified_at)
      VALUES (${stashed.wallet}, ${handle}, ${xUserId}, now())
      ON CONFLICT (wallet_address)
      DO UPDATE SET
        x_handle = EXCLUDED.x_handle,
        x_user_id = EXCLUDED.x_user_id,
        verified_at = now()
    `;

    return settingsRedirect(req, { x_linked: "success", handle });
  } catch {
    return settingsRedirect(req, { x_linked: "error" });
  }
}