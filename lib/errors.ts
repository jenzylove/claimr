// Maps low-level Circle / chain errors into messages humans can act on,
// plus an action type that tells the UI which CTA to surface.
//
// Used by <ErrorCallout /> so every error surface in the app is consistent.

export type ChainErrorAction =
  | "fund"      // open Fund Wallet modal
  | "refresh"   // user should wait + reload
  | "retry"     // user can retry the same action
  | "signin"    // session expired
  | "none";     // information only, no CTA

export interface FormattedChainError {
  title: string;
  message: string;
  action: ChainErrorAction;
  raw?: string;
}

export function formatChainError(err: unknown): FormattedChainError {
  const raw = extractMessage(err);
  const lower = raw.toLowerCase();

  // Circle: insufficient token balance (155258 + common variants)
  if (
    lower.includes("155258") ||
    lower.includes("insufficient asset") ||
    lower.includes("insufficient balance") ||
    lower.includes("insufficient funds") ||
    lower.includes("transfer amount exceeds balance")
  ) {
    return {
      title: "Not enough USDC",
      message:
        "Your wallet does not have enough USDC to cover this transaction. Fund it and try again.",
      action: "fund",
      raw,
    };
  }

  // Circle: indexing latency / rent exempt (155257)
  if (
    lower.includes("155257") ||
    lower.includes("rent exempt") ||
    lower.includes("indexing")
  ) {
    return {
      title: "Chain is catching up",
      message:
        "The network is still indexing your last transaction. Wait about 30 seconds and try again.",
      action: "refresh",
      raw,
    };
  }

  // User cancelled the PIN challenge in the Circle SDK iframe
  if (
    lower.includes("cancelled") ||
    lower.includes("canceled") ||
    lower.includes("user_denied") ||
    lower.includes("user denied") ||
    /\bdenied\b/.test(lower)
  ) {
    return {
      title: "Cancelled",
      message: "You cancelled the transaction before it could finish.",
      action: "retry",
      raw,
    };
  }

  // Polling timeout
  if (lower.includes("polling timed out") || lower.includes("timed out") || lower.includes("timeout")) {
    return {
      title: "Taking longer than expected",
      message:
        "The transaction is still in flight on chain. Check your transactions tab in a minute.",
      action: "refresh",
      raw,
    };
  }

  // Auth surface
  if (
    lower.includes("unauthorized") ||
    lower.includes("not authenticated") ||
    lower.includes("session expired") ||
    lower.includes("401")
  ) {
    return {
      title: "Sign in first",
      message: "Your session expired. Sign back in to continue.",
      action: "signin",
      raw,
    };
  }

  // Rate limit
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("429")
  ) {
    return {
      title: "Slow down",
      message: "Too many requests in a short window. Wait a moment and try again.",
      action: "retry",
      raw,
    };
  }

  // AI verifier
  if (
    lower.includes("verifier") ||
    lower.includes("ai verification") ||
    lower.includes("verification failed")
  ) {
    return {
      title: "Verifier is busy",
      message:
        "The AI verifier did not respond in time. It will retry automatically in the background.",
      action: "refresh",
      raw,
    };
  }

  // Network
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("econn") ||
    lower.includes("enotfound")
  ) {
    return {
      title: "Network problem",
      message: "Could not reach the server. Check your connection and try again.",
      action: "retry",
      raw,
    };
  }

  // Fallback: surface the raw message but with a friendlier wrapper
  return {
    title: "Something went wrong",
    message: raw || "An unknown error occurred. Try again, or contact support if it persists.",
    action: "retry",
    raw,
  };
}

function extractMessage(err: unknown): string {
  if (err === null || err === undefined) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const anyErr = err as Record<string, any>;
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.error === "string") return anyErr.error;
    if (anyErr.error && typeof anyErr.error.message === "string") return anyErr.error.message;
    if (typeof anyErr.reason === "string") return anyErr.reason;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}
