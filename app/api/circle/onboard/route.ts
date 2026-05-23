import { NextRequest, NextResponse } from "next/server";
import {
  getCircleClient,
  emailToUserId,
  newIdempotencyKey,
  ARC_TESTNET_BLOCKCHAIN,
} from "@/lib/circle-server";

// Minimal email shape check. We do not verify deliverability here.
function isValidEmail(s: unknown): s is string {
  if (typeof s !== "string") return false;
  const trimmed = s.trim();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email;
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Surface env-config issues clearly. Without the key, every signup fails
    // with an opaque 500. This makes the failure mode visible.
    if (!process.env.CIRCLE_API_KEY) {
      return NextResponse.json(
        {
          error:
            "CIRCLE_API_KEY is not set in Vercel env vars. Auth cannot proceed until it is configured.",
        },
        { status: 500 }
      );
    }

    const userId = emailToUserId(email);
    const client = getCircleClient();

    // 1. Create the Circle user. Idempotent at the application layer because
    //    userId is derived from email. Circle returns userAlreadyExisted (155101)
    //    if the user is already created, which we treat as success.
    try {
      await client.createUser({ userId });
    } catch (err: any) {
      const code = err?.response?.data?.code ?? err?.code;
      // 155101 = userAlreadyExisted (per Circle ErrorCode enum)
      if (code !== 155101) {
        console.error("[CIRCLE/onboard] createUser failed", err);
        return NextResponse.json(
          {
            error: `Could not create Circle user: ${
              err?.response?.data?.message ?? err?.message ?? "unknown"
            }`,
          },
          { status: 500 }
        );
      }
    }

    // 2. Issue a short-lived session token (60 min). Returns userToken +
    //    encryptionKey, both needed by the client SDK to execute challenges.
    const tokenResp = await client.createUserToken({ userId });
    const userToken = tokenResp.data?.userToken;
    const encryptionKey = tokenResp.data?.encryptionKey;
    if (!userToken || !encryptionKey) {
      return NextResponse.json(
        { error: "Could not issue session token" },
        { status: 500 }
      );
    }

    // 3. Open a PIN-setup-and-wallet-init challenge for Arc Testnet. The SDK
    //    will resolve this via the iframe PIN flow on the client. For users
    //    who already have a PIN and wallet, Circle returns an error code we
    //    treat as "already initialized" and skip the client-side challenge.
    let challengeId: string | null = null;
    let alreadyInitialized = false;
    try {
      const challengeResp = await client.createUserPinWithWallets({
        userToken,
        accountType: "EOA",
        blockchains: [ARC_TESTNET_BLOCKCHAIN],
        idempotencyKey: newIdempotencyKey(),
      } as any);
      challengeId = challengeResp.data?.challengeId ?? null;
      if (!challengeId) alreadyInitialized = true;
    } catch (err: any) {
      // Common case: user already has PIN + wallet, Circle rejects the call.
      // Treat as already-initialized so the client can skip the PIN sheet
      // and go straight to finalize (which looks up the existing wallet).
      const code = err?.response?.data?.code ?? err?.code;
      const msg = String(
        err?.response?.data?.message ?? err?.message ?? ""
      ).toLowerCase();
      // Numeric codes 155206 / 155207 / 155709 cover the documented cases,
      // and a message-text fallback catches any variant Circle adds later.
      // Patterns: "already initialized", "already been initialized",
      // "already set", "already exists", "wallet already".
      const isAlreadyInit =
        code === 155206 ||
        code === 155207 ||
        code === 155709 ||
        /already (been )?init/.test(msg) ||
        /already (been )?set/.test(msg) ||
        /already exist/.test(msg) ||
        /wallet already/.test(msg);
      if (isAlreadyInit) {
        alreadyInitialized = true;
      } else {
        console.error("[CIRCLE/onboard] createUserPinWithWallets failed", err);
        return NextResponse.json(
          {
            error: `Could not start PIN challenge: ${
              err?.response?.data?.message ?? err?.message ?? "unknown"
            }`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      userToken,
      encryptionKey,
      challengeId,
      alreadyInitialized,
    });
  } catch (err: any) {
    console.error("[CIRCLE/onboard] FATAL", err);
    return NextResponse.json(
      {
        error: `Internal onboarding error: ${
          err?.message ?? "unknown error, check Vercel function logs"
        }`,
      },
      { status: 500 }
    );
  }
}
