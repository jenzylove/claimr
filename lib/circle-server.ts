import crypto from "crypto";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

if (!process.env.CIRCLE_API_KEY) {
  // Throw lazily at request time, not at import time, so other routes still build.
  console.warn("[CIRCLE] CIRCLE_API_KEY is not set. Circle routes will return 500.");
}

let _client: ReturnType<typeof initiateUserControlledWalletsClient> | null = null;

export function getCircleClient() {
  if (!process.env.CIRCLE_API_KEY) {
    throw new Error("CIRCLE_API_KEY is not configured");
  }
  if (!_client) {
    _client = initiateUserControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY,
    });
  }
  return _client;
}

// Deterministic Circle userId from an email. Same email always produces the
// same userId, so signup is idempotent at the application layer.
export function emailToUserId(email: string): string {
  const normalized = email.toLowerCase().trim();
  const hash = crypto
    .createHash("sha256")
    .update(`claimr:user:${normalized}`)
    .digest("hex");
  // Format like a UUID. Circle accepts any string but UUID-shaped looks tidy in dashboards.
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export const ARC_TESTNET_BLOCKCHAIN = "ARC-TESTNET" as const;

// Fetches the Arc Testnet wallet for a given userToken. Returns the wallet
// object (with `.address`) or null if none exists yet.
export async function getArcWallet(userToken: string) {
  const client = getCircleClient();
  const resp = await client.listWallets({ userToken });
  const wallets = resp.data?.wallets ?? [];
  // Filter for Arc Testnet specifically. A user may end up with wallets on
  // multiple chains if we ever expand; for now we only ever provision Arc.
  return (
    wallets.find((w: any) => w.blockchain === ARC_TESTNET_BLOCKCHAIN) ?? null
  );
}
