// Platform-job detection helper.
//
// A "platform job" is any job whose project (poster) wallet matches one
// of the admin wallets in NEXT_PUBLIC_ADMIN_WALLETS. There's no on-chain
// tag for this - we just compare addresses client-side and add a badge
// in the UI.
//
// Source of truth is the same env var used by the admin UI gate, so
// adding/removing admin wallets there automatically updates which jobs
// are flagged as platform.

function getAdminWallets(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_WALLETS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.startsWith("0x") && s.length === 42);
}

export function isPlatformJob(
  projectAddress: string | undefined | null
): boolean {
  if (!projectAddress) return false;
  return getAdminWallets().includes(projectAddress.toLowerCase());
}
