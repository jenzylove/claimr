"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { FundWalletModal } from "./fund-wallet-modal";

// Prominent address card that lives at the top of the wallet page.
// Solves the funding-confusion problem: users now see exactly which
// address belongs to their Claimr account, can copy it in one click,
// and have a clear path to fund it without leaving the page.

export function WalletAddressCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);

  const address = user?.walletAddress;
  if (!address) return null;

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
    <>
      <div className="glass-card rounded-xl p-6 border border-white/10">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0 max-w-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Your Claimr wallet
            </p>
            <p className="font-mono text-base text-foreground break-all mb-3">
              {address}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This is the wallet your Claimr account controls on Arc Testnet. Only send funds to
              this exact address — funds sent elsewhere can't be recovered.
            </p>
          </div>
          {/* mobile-polish: full-width buttons on phones */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-foreground hover:bg-white/5 transition-colors w-full sm:w-auto"
              aria-label="Copy wallet address"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <a
              href={`https://testnet.arcscan.app/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-foreground hover:bg-white/5 transition-colors w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" />
              Arcscan
            </a>
            <button
              onClick={() => setFundOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#FF2D7A] text-sm font-medium text-white hover:bg-[#FF2D7A]/90 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Fund wallet
            </button>
          </div>
        </div>
      </div>
      <FundWalletModal open={fundOpen} onClose={() => setFundOpen(false)} />
    </>
  );
}
