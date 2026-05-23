"use client"

import { Wallet } from "lucide-react"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { useAuth } from "@/lib/auth"
import { USDC_ADDRESS, EURC_ADDRESS, USDC_ABI } from "@/lib/contracts"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const

export function WalletBalances() {
  // r3a removed wagmi connectors, so useAccount() always returns undefined.
  // The real Circle wallet address lives on the auth user.
  const { user } = useAuth()
  const address = (user?.walletAddress ?? ZERO_ADDRESS) as `0x${string}`
  const hasWallet = address !== ZERO_ADDRESS

  const { data: usdcRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: hasWallet },
  })

  const { data: eurcRaw } = useReadContract({
    address: EURC_ADDRESS,
    abi: USDC_ABI, // same ERC-20 interface
    functionName: "balanceOf",
    args: [address],
    query: { enabled: hasWallet },
  })

  const usdcBalance = usdcRaw ? Number(formatUnits(usdcRaw as bigint, 6)).toFixed(2) : "0.00"
  const eurcBalance = eurcRaw ? Number(formatUnits(eurcRaw as bigint, 6)).toFixed(2) : "0.00"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* USDC Balance Card */}
      <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#2D6EFF]/20 rounded-full blur-3xl group-hover:bg-[#2D6EFF]/30 transition-all duration-500" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#2D6EFF]/20 flex items-center justify-center">
              <span className="text-lg font-bold text-[#2D6EFF]">$</span>
            </div>
            <span className="text-muted-foreground text-sm">USDC Balance</span>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{usdcBalance} USDC</p>
          <p className="text-sm text-muted-foreground mb-4">≈ ${usdcBalance} USD</p>
          <button className="px-4 py-2 rounded-lg border border-[#2D6EFF] text-[#2D6EFF] text-sm font-medium hover:bg-[#2D6EFF]/10 transition-colors">
            Withdraw
          </button>
        </div>
      </div>

      {/* EURC Balance Card */}
      <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FF2D7A]/20 rounded-full blur-3xl group-hover:bg-[#FF2D7A]/30 transition-all duration-500" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FF2D7A]/20 flex items-center justify-center">
              <span className="text-lg font-bold text-[#FF2D7A]">€</span>
            </div>
            <span className="text-muted-foreground text-sm">EURC Balance</span>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{eurcBalance} EURC</p>
          <p className="text-sm text-muted-foreground mb-4">≈ ${(Number(eurcBalance) * 1.08).toFixed(2)} USD</p>
          <button className="px-4 py-2 rounded-lg border border-[#FF2D7A] text-[#FF2D7A] text-sm font-medium hover:bg-[#FF2D7A]/10 transition-colors">
            Withdraw
          </button>
        </div>
      </div>
    </div>
  )
}

export function WalletHeader() {
  const { user } = useAuth()
  const address = user?.walletAddress
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <Wallet className="w-6 h-6 text-[#FF2D7A]" />
        <h1 className="text-2xl font-bold text-foreground">Your Wallet</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Embedded wallet powered by Circle.
        {shortAddr && (
          <>
            {" "}
            <span className="font-mono text-foreground/80">{shortAddr}</span>
          </>
        )}
      </p>
    </div>
  )
}
