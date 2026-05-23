"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Wallet, LogIn } from "lucide-react";
import { formatChainError, type ChainErrorAction } from "@/lib/errors";
import { FundWalletModal } from "@/components/claimr/fund-wallet-modal";

interface Props {
  error: unknown;
  // Optional retry callback. Only shown when the auto-detected action is "retry".
  onRetry?: () => void;
  // Force a specific action when the caller knows better than the auto-detector.
  forceAction?: ChainErrorAction;
  // Extra classes if the consumer needs to tweak margin/positioning.
  className?: string;
}

export function ErrorCallout({ error, onRetry, forceAction, className }: Props) {
  const [fundOpen, setFundOpen] = useState(false);

  if (!error) return null;

  const f = formatChainError(error);
  const action: ChainErrorAction = forceAction ?? f.action;

  return (
    <>
      <div
        className={`rounded-xl border border-red-500/30 bg-red-500/5 p-4 backdrop-blur-sm ${
          className ?? ""
        }`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-400">{f.title}</p>
            <p className="mt-1 text-sm text-foreground/80">{f.message}</p>

            {action !== "none" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {action === "fund" && (
                  <button
                    type="button"
                    onClick={() => setFundOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2D6EFF] px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-[#2D6EFF]/90"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Fund wallet
                  </button>
                )}

                {action === "refresh" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") window.location.reload();
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-white/10"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                )}

                {action === "retry" && onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-white/10"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Try again
                  </button>
                )}

                {action === "signin" && (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#FF2D7A] px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-[#FF2D7A]/90"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <FundWalletModal open={fundOpen} onClose={() => setFundOpen(false)} />
    </>
  );
}
