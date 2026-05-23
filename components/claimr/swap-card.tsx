"use client";

import { useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { useReadContract } from "wagmi";
import {
  ArrowDownUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  USDC_ADDRESS,
  EURC_ADDRESS,
  USDC_ABI,
  STARLIGHT_POOL_ADDRESS,
} from "@/lib/contracts";
import { useAuth } from "@/lib/auth";
import { useCircleWrite } from "@/lib/useCircleWrite";

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

export function SwapCard() {
  const { authenticated, user } = useAuth();
  const address = (user?.walletAddress ?? ZERO_ADDRESS) as `0x${string}`;

  const [fromToken, setFromToken] = useState<"USDC" | "EURC">("USDC");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<
    "idle" | "approving" | "swapping" | "done"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [received, setReceived] = useState<number | null>(null);

  const toToken = fromToken === "USDC" ? "EURC" : "USDC";
  const tokenInAddress = fromToken === "USDC" ? USDC_ADDRESS : EURC_ADDRESS;
  const tokenOutAddress = fromToken === "USDC" ? EURC_ADDRESS : USDC_ADDRESS;

  // Read the pool's reserves of both tokens. Both balances refetch every
  // 10s so the live quote stays roughly current.
  const { data: poolUsdcRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [STARLIGHT_POOL_ADDRESS as `0x${string}`],
    query: { refetchInterval: 10000 },
  });
  const { data: poolEurcRaw } = useReadContract({
    address: EURC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [STARLIGHT_POOL_ADDRESS as `0x${string}`],
    query: { refetchInterval: 10000 },
  });

  // Read user's destination-token balance for the post-swap delta.
  const { data: tokenOutRaw, refetch: refetchOut } = useReadContract({
    address: tokenOutAddress,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: address !== ZERO_ADDRESS },
  });

  const poolUsdc = poolUsdcRaw
    ? Number(formatUnits(poolUsdcRaw as bigint, 6))
    : 0;
  const poolEurc = poolEurcRaw
    ? Number(formatUnits(poolEurcRaw as bigint, 6))
    : 0;
  const reserveIn = fromToken === "USDC" ? poolUsdc : poolEurc;
  const reserveOut = fromToken === "USDC" ? poolEurc : poolUsdc;

  const inputAmount = Number(amount) || 0;

  // Constant-product (x*y=k) quote, the standard AMM pricing curve.
  // amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
  // No fee assumed since the pool's actual fee structure is unknown;
  // the real swap may return slightly less.
  const expectedOut =
    inputAmount > 0 && reserveIn > 0
      ? (inputAmount * reserveOut) / (reserveIn + inputAmount)
      : 0;

  // Rate quality (relative to a 1:1 peg, since USDC and EURC are both
  // ~1 USD stables). Anything below 0.5 is a serious haircut.
  const rateRatio = inputAmount > 0 ? expectedOut / inputAmount : 1;
  const rateQuality: "none" | "excellent" | "fair" | "poor" =
    inputAmount <= 0
      ? "none"
      : rateRatio >= 0.9
      ? "excellent"
      : rateRatio >= 0.5
      ? "fair"
      : "poor";

  const { execute } = useCircleWrite();

  const handleSwap = async () => {
    if (!authenticated || !amount || inputAmount <= 0) return;
    setErrorMsg(null);
    setReceived(null);

    const amountWei = parseUnits(amount, 6);
    const balanceBefore = tokenOutRaw
      ? (tokenOutRaw as bigint)
      : BigInt(0);

    try {
      setStep("approving");
      await execute({
        contractAddress: tokenInAddress,
        abiFunctionSignature: "approve(address,uint256)",
        abiParameters: [STARLIGHT_POOL_ADDRESS, amountWei.toString()],
      });

      setStep("swapping");
      await execute({
        contractAddress: STARLIGHT_POOL_ADDRESS,
        abiFunctionSignature: "swap(address,uint256)",
        abiParameters: [tokenInAddress, amountWei.toString()],
      });

      // Brief delay so the indexer catches up, then refetch destination
      // balance and compute the actual delta.
      await new Promise((r) => setTimeout(r, 1500));
      const fresh = await refetchOut();
      const balanceAfter =
        (fresh.data as bigint | undefined) ?? balanceBefore;
      const delta = Number(formatUnits(balanceAfter - balanceBefore, 6));
      setReceived(delta);

      setStep("done");
      setAmount("");
      setTimeout(() => {
        setStep("idle");
        setReceived(null);
      }, 10000);
    } catch (err: unknown) {
      setErrorMsg(
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Swap failed"
      );
      setStep("idle");
    }
  };

  const buttonLabel = () => {
    if (step === "approving") return "Approving...";
    if (step === "swapping") return "Swapping...";
    if (step === "done") return "Swap complete ✓";
    return `Swap ${fromToken} → ${toToken}`;
  };

  const isLoading = step === "approving" || step === "swapping";

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <ArrowDownUp className="w-5 h-5 text-[#2D6EFF]" />
        <h3 className="text-lg font-semibold text-foreground">
          Convert {fromToken} ↔ {toToken}
        </h3>
      </div>

      {/* From */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-3">
        <p className="text-xs text-muted-foreground mb-2">From</p>
        <div className="flex items-center justify-between gap-4">
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value as "USDC" | "EURC")}
            disabled={isLoading}
            className="bg-white/10 text-foreground rounded-lg px-3 py-2 text-sm font-medium border border-white/10 outline-none"
          >
            <option value="USDC">USDC</option>
            <option value="EURC">EURC</option>
          </select>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            className="bg-transparent text-right text-2xl font-bold text-foreground outline-none w-full disabled:opacity-60"
          />
        </div>
      </div>

      {/* Switch */}
      <div className="flex justify-center my-2">
        <button
          onClick={() => setFromToken(toToken)}
          disabled={isLoading}
          className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-60"
        >
          <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* To with live quote */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-3">
        <p className="text-xs text-muted-foreground mb-2">
          To (estimated, live)
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="bg-white/10 text-foreground rounded-lg px-3 py-2 text-sm font-medium border border-white/10">
            {toToken}
          </span>
          <span className="text-right text-2xl font-bold text-foreground tabular-nums">
            {inputAmount > 0 ? expectedOut.toFixed(4) : "0.00"}
          </span>
        </div>
        {/* Rate quality badge */}
        {rateQuality !== "none" && (
          <div className="mt-3 flex items-center gap-2">
            {rateQuality === "excellent" && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">
                  Good rate ({(rateRatio * 100).toFixed(1)}% efficiency)
                </span>
              </>
            )}
            {rateQuality === "fair" && (
              <>
                <Info className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">
                  {((1 - rateRatio) * 100).toFixed(1)}% slippage from 1:1
                </span>
              </>
            )}
            {rateQuality === "poor" && (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs text-red-400 font-medium">
                  Poor rate. Pool would take {((1 - rateRatio) * 100).toFixed(1)}% of
                  your value.
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pool reserves info */}
      {(poolUsdc > 0 || poolEurc > 0) && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-white/[0.02] text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="uppercase tracking-wider">Pool reserves:</span>
          <span className="font-mono">
            {poolUsdc.toFixed(2)} <span className="text-blue-400">USDC</span>
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-mono">
            {poolEurc.toFixed(2)} <span className="text-pink-400">EURC</span>
          </span>
        </div>
      )}

      {/* Poor-rate banner */}
      {rateQuality === "poor" && !isLoading && step !== "done" && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-red-300">
              The pool has very low {toToken} liquidity right now.
            </p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Try a smaller amount (e.g. {(reserveOut * 0.01).toFixed(2)}{" "}
              {fromToken}), or wait for the pool to rebalance. Testnet
              pools are often unbalanced and there's no slippage
              protection available.
            </p>
          </div>
        </div>
      )}

      {/* Always-on disclaimer */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          Exchange rate is determined at swap time by the Arc testnet
          liquidity pool, not by Claimr. Quote shown above uses the
          standard x*y=k formula on current reserves; the actual amount
          can differ if reserves change.
        </p>
      </div>

      {/* Actual received feedback */}
      {step === "done" && received !== null && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
          You received{" "}
          <span className="font-mono font-semibold">
            {received.toFixed(4)} {toToken}
          </span>
          .
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={isLoading || !amount || step === "done" || !authenticated}
        className="w-full rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#2D6EFF] py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLabel()}
      </button>

      {step === "approving" && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Step 1 of 2 — Approve {fromToken} spend with your PIN
        </p>
      )}
      {step === "swapping" && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Step 2 of 2 — Confirm swap with your PIN
        </p>
      )}
    </div>
  );
}
