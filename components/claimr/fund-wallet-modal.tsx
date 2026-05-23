"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

// Three-step funding flow. Modal-based to focus the moment — funding is
// where users get confused most, so we want a clear stop-and-pay-attention
// experience, not an inline panel that competes with the rest of the page.

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FundWalletModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Lock body scroll while open and close on Escape.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const address = user?.walletAddress;
  if (!open || !address) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fund-modal-title"
    >
      <div
        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h2 id="fund-modal-title" className="text-lg font-semibold text-foreground">
              Fund your wallet
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send testnet USDC to start using Claimr
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/5 transition-colors -mr-1 -mt-1"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Step 1: address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-semibold text-foreground shrink-0">
                1
              </span>
              <p className="text-sm font-medium text-foreground">Copy your wallet address</p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="flex-1 font-mono text-xs text-foreground break-all">
                {address}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-xs font-medium text-foreground hover:bg-white/20 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 pl-8">
              Send USDC only to this address. Don't send to any other address — funds will be lost.
            </p>
          </div>

          {/* Step 2: faucet */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-semibold text-foreground shrink-0">
                2
              </span>
              <p className="text-sm font-medium text-foreground">Get testnet USDC from the faucet</p>
            </div>
            <a
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 p-4 rounded-lg bg-[#FF2D7A] hover:bg-[#FF2D7A]/90 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-white">Open Circle Faucet</span>
                <span className="text-xs text-white/80">
                  Select Arc Testnet, paste your address, claim
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-white shrink-0" />
            </a>
          </div>

          {/* Step 3: wait */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-semibold text-foreground shrink-0">
                3
              </span>
              <p className="text-sm font-medium text-foreground">Wait, then refresh</p>
            </div>
            <p className="text-xs text-muted-foreground pl-8 leading-relaxed">
              Circle's indexer takes 30 to 60 seconds to pick up new balances. If the balance
              doesn't update right away, give it a moment and refresh the page.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <p className="text-xs text-muted-foreground">
            Arc Testnet only · Funds are not real money · Mainnet support coming v1
          </p>
        </div>
      </div>
    </div>
  );
}
