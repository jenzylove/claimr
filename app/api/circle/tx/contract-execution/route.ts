import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCircleClient,
  getArcWallet,
  newIdempotencyKey,
} from "@/lib/circle-server";

const COOKIE_NAME = "claimr_session";

function decodeSession(value: string): { userId?: string } | null {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function isHex40(s: unknown): s is string {
  return typeof s === "string" && /^0x[0-9a-fA-F]{40}$/.test(s);
}

function isValidSignature(s: unknown): s is string {
  return typeof s === "string" && /^[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)$/.test(s);
}

export async function POST(req: NextRequest) {
  let diagContext: any = {};
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
    diagContext.userId = session.userId;

    const body = await req.json().catch(() => ({}));
    const contractAddress = body?.contractAddress;
    const abiFunctionSignature = body?.abiFunctionSignature;
    const abiParameters = body?.abiParameters;

    diagContext.contractAddress = contractAddress;
    diagContext.abiFunctionSignature = abiFunctionSignature;
    diagContext.abiParameters = abiParameters;

    if (!isHex40(contractAddress)) {
      return NextResponse.json({ error: "Invalid contractAddress" }, { status: 400 });
    }
    if (!isValidSignature(abiFunctionSignature)) {
      return NextResponse.json({ error: "Invalid abiFunctionSignature" }, { status: 400 });
    }
    if (!Array.isArray(abiParameters)) {
      return NextResponse.json({ error: "abiParameters must be an array" }, { status: 400 });
    }

    const client = getCircleClient();

    const tokenResp = await client.createUserToken({ userId: session.userId });
    const userToken = tokenResp.data?.userToken;
    const encryptionKey = tokenResp.data?.encryptionKey;
    if (!userToken || !encryptionKey) {
      return NextResponse.json({ error: "Could not issue session token" }, { status: 500 });
    }

    // List ALL wallets for this user, not just the first Arc wallet. This
    // surfaces multi-wallet situations where getArcWallet might be picking
    // a different one than the user funded.
    const allWalletsResp = await client.listWallets({ userToken });
    const allWallets = allWalletsResp.data?.wallets ?? [];
    diagContext.allWallets = allWallets.map((w: any) => ({
      id: w.id,
      address: w.address,
      blockchain: w.blockchain,
      accountType: w.accountType,
      state: w.state,
    }));
    console.log("[CIRCLE/tx/contract-execution] all user wallets:", JSON.stringify(diagContext.allWallets));

    const wallet = await getArcWallet(userToken);
    if (!wallet?.id) {
      return NextResponse.json({ error: "No Arc wallet found for user" }, { status: 400 });
    }
    diagContext.selectedWallet = {
      id: wallet.id,
      address: (wallet as any).address,
      blockchain: (wallet as any).blockchain,
      accountType: (wallet as any).accountType,
      state: (wallet as any).state,
    };
    console.log("[CIRCLE/tx/contract-execution] selected wallet:", JSON.stringify(diagContext.selectedWallet));

    // Also pull the wallet's token balance from Circle's POV. If this disagrees
    // with Arcscan, we have a wallet-mismatch bug.
    try {
      const balResp = await client.getWalletTokenBalance({ userToken, walletId: wallet.id });
      diagContext.circleBalances = (balResp.data?.tokenBalances ?? []).map((tb: any) => ({
        token: tb.token?.symbol ?? tb.token?.tokenAddress,
        amount: tb.amount,
      }));
      console.log("[CIRCLE/tx/contract-execution] balances per circle:", JSON.stringify(diagContext.circleBalances));
    } catch (balErr: any) {
      console.warn("[CIRCLE/tx/contract-execution] balance fetch failed:", balErr?.message);
    }

    const execResp = await client.createUserTransactionContractExecutionChallenge({
      userToken,
      walletId: wallet.id,
      contractAddress,
      abiFunctionSignature,
      abiParameters,
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      idempotencyKey: newIdempotencyKey(),
    } as any);

    const challengeId = execResp.data?.challengeId;
    const transactionId = (execResp.data as any)?.id ?? null;
    if (!challengeId) {
      console.error(
        "[CIRCLE/tx/contract-execution] no challengeId returned",
        execResp.data
      );
      return NextResponse.json({ error: "Could not create transaction challenge" }, { status: 500 });
    }

    return NextResponse.json({ challengeId, transactionId, userToken, encryptionKey });
  } catch (err: any) {
    // Capture every diagnostic field Circle exposes. The default Error.toString()
    // drops most of this, which is why earlier failures looked opaque.
    const diag = {
      circleCode: err?.code,
      circleMessage: err?.message,
      httpStatus: err?.status,
      httpUrl: err?.url,
      httpMethod: err?.method,
      upstream: err?.response?.data,
      stack: err?.stack?.split("\n").slice(0, 3),
      ctx: diagContext,
    };
    console.error("[CIRCLE/tx/contract-execution] FATAL", JSON.stringify(diag, null, 2));
    const upstream = err?.response?.data?.message ?? err?.message;
    return NextResponse.json(
      { error: upstream ?? "Could not create transaction" },
      { status: 500 }
    );
  }
}
