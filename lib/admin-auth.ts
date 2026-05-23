"use client";

// Client-side admin gate. Reads NEXT_PUBLIC_ADMIN_WALLETS from env (a
// comma-separated list of lowercased 0x addresses) and reports whether
// the currently signed-in wallet is allowed to see admin UI.
//
// This is UI gating only. The actual write-action API routes also check
// the user's email against the (non-public) ADMIN_EMAILS env var, so
// flipping localStorage or DOM doesn't grant real privileges.

import { useAuth } from "@/lib/auth";

function parseAllowed(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_WALLETS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.startsWith("0x") && s.length === 42);
}

export function useIsAdmin(): {
  ready: boolean;
  authenticated: boolean;
  isAdmin: boolean;
} {
  const { ready, authenticated, user } = useAuth();
  if (!ready) return { ready: false, authenticated: false, isAdmin: false };
  if (!authenticated || !user?.walletAddress) {
    return { ready: true, authenticated: false, isAdmin: false };
  }
  const allowed = parseAllowed();
  const addr = user.walletAddress.toLowerCase();
  return { ready: true, authenticated: true, isAdmin: allowed.includes(addr) };
}

// Compatibility shim for files written against the older admin batch
// which used a plain helper instead of the hook. Both APIs work; new
// code should prefer useIsAdmin().
export function isAdminWallet(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  const allowed = parseAllowed();
  return allowed.includes(walletAddress.toLowerCase());
}
