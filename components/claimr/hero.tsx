"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard, Briefcase } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Hero() {
  const { authenticated, ready } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#FF2D7A]/20 rounded-full blur-[128px] animate-float" />
        <div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#2D6EFF]/20 rounded-full blur-[128px] animate-float"
          style={{ animationDelay: "-3s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#FF2D7A]/10 via-transparent to-[#2D6EFF]/10 rounded-full blur-[100px] animate-gradient" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm text-[#a1a1aa] bg-white/5 border border-white/10 rounded-full">
          <span className="w-2 h-2 bg-[#FF2D7A] rounded-full animate-pulse" />
          Powered by Arc Blockchain
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 text-balance">
          Get Paid.{" "}
          <span className="bg-gradient-to-r from-[#FF2D7A] to-[#2D6EFF] bg-clip-text text-transparent">
            No Trust Required.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-[#a1a1aa] max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
          The marketplace where creators and crypto projects settle deals with AI
          verification and instant USDC payments
        </p>

        {/* CTA Buttons - auth-aware. Returning users land here too and shouldn't
            get sent back through onboarding. */}
        {ready && authenticated ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/discover"
              className="group w-full sm:w-auto px-8 py-4 text-base font-medium text-white bg-[#FF2D7A] rounded-xl hover:bg-[#FF2D7A]/90 transition-all shadow-lg shadow-[#FF2D7A]/25 flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to creator dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/project"
              className="group w-full sm:w-auto px-8 py-4 text-base font-medium text-white bg-[#2D6EFF] rounded-xl hover:bg-[#2D6EFF]/90 transition-all shadow-lg shadow-[#2D6EFF]/25 flex items-center justify-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Go to project dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding?role=creator&mode=signup"
              className="group w-full sm:w-auto px-8 py-4 text-base font-medium text-white bg-[#FF2D7A] rounded-xl hover:bg-[#FF2D7A]/90 transition-all shadow-lg shadow-[#FF2D7A]/25 flex items-center justify-center gap-2"
            >
              {"I'm a Creator"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/onboarding?role=project&mode=signup"
              className="group w-full sm:w-auto px-8 py-4 text-base font-medium text-white bg-[#2D6EFF] rounded-xl hover:bg-[#2D6EFF]/90 transition-all shadow-lg shadow-[#2D6EFF]/25 flex items-center justify-center gap-2"
            >
              {"I'm a Project"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span>AI-verified payouts</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span>Built on Arc</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span>Instant USDC settlement</span>
          </div>
        </div>
      </div>
    </section>
  );
}
