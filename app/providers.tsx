"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider,
  useAccount,
  useConnect,
  useDisconnect,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { config } from "@/lib/wagmi";
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from "@/lib/auth";
import { executeChallenge } from "@/lib/circle-client";
import { TourProvider } from "@/lib/tour-state";

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [circleUser, setCircleUser] = useState<AuthUser | null>(null);

  // Wallet (MetaMask / injected) connection state from wagmi.
  const { address: walletAddress, isConnected: isWalletConnected } =
    useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();

  // On mount, check for an existing Circle session via httpOnly cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/circle/me", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.email) {
            setCircleUser({
              email: data.email,
              walletAddress: data.walletAddress ?? null,
              provider: "circle",
            });
          }
        }
      } catch {
        // Network error or no session: stay unauthenticated.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(async (email: string) => {
    // 1. Backend creates the Circle user (idempotent), issues a session
    //    token, opens a PIN+wallet challenge if needed.
    const onboard = await fetch("/api/circle/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!onboard.ok) {
      const err = await onboard.json().catch(() => ({}));
      const apiError =
        err?.error ??
        `Onboarding failed (HTTP ${onboard.status}). Check that CIRCLE_API_KEY is set in Vercel env vars.`;
      throw new Error(apiError);
    }
    const { userToken, encryptionKey, challengeId, alreadyInitialized } =
      await onboard.json();

    if (challengeId && !alreadyInitialized) {
      try {
        await executeChallenge(challengeId, { userToken, encryptionKey });
      } catch (err) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "PIN entry cancelled.";
        throw new Error(msg);
      }
    }

    const finalize = await fetch("/api/circle/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!finalize.ok) {
      const err = await finalize.json().catch(() => ({}));
      throw new Error(
        err?.error ?? `Finalize failed (HTTP ${finalize.status}).`
      );
    }
    const data = await finalize.json();
    setCircleUser({
      email: data.email,
      walletAddress: data.walletAddress ?? null,
      provider: "circle",
    });
  }, []);

  // Connect MetaMask (or any injected wallet). No PIN, no Circle SDK. The
  // injected connector pops the wallet's own UI for approval. After that
  // the user is "signed in" client-side; useAccount tracks the address.
  const connectWallet = useCallback(async () => {
    try {
      await connectAsync({ connector: injected() });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Wallet connect cancelled.";
      throw new Error(msg);
    }
  }, [connectAsync]);

  const logout = useCallback(async () => {
    // Disconnect either or both, whichever is active.
    if (circleUser) {
      await fetch("/api/circle/logout", { method: "POST" }).catch(() => {});
      setCircleUser(null);
    }
    if (isWalletConnected) {
      await disconnectAsync().catch(() => {});
    }
  }, [circleUser, isWalletConnected, disconnectAsync]);

  // Merge the two possible auth sources. Circle takes precedence if both
  // happen to be active in the same session.
  const user: AuthUser | null = useMemo(() => {
    if (circleUser) return circleUser;
    if (isWalletConnected && walletAddress) {
      return {
        email: null,
        walletAddress,
        provider: "wallet",
      };
    }
    return null;
  }, [circleUser, isWalletConnected, walletAddress]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      authenticated: !!user,
      user,
      signUp,
      connectWallet,
      logout,
    }),
    [ready, user, signUp, connectWallet, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  // WagmiProvider must wrap AuthProvider so that AuthProvider can use
  // useAccount, useConnect, useDisconnect hooks.
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <AuthProvider>
          <TourProvider>{children}</TourProvider>
        </AuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
