"use client";

import { Briefcase, Target, Bot, Zap } from "lucide-react";

const steps = [
  {
    icon: Briefcase,
    color: "#FF2D7A",
    number: "01",
    title: "Projects post a job",
    description:
      "Set the brief, the criteria, and the bounty. USDC locks instantly in a smart contract on Arc. No project funds the work, no creator can claim it.",
  },
  {
    icon: Target,
    color: "#2D6EFF",
    number: "02",
    title: "Creators claim",
    description:
      "Browse open jobs. Pick the one that fits. Claim it on-chain to lock it to your wallet. No one else can deliver against your claim.",
  },
  {
    icon: Bot,
    color: "#10B981",
    number: "03",
    title: "AI verifies the work",
    description:
      "Submit your tweet or post. The verifier reads the content with Claude, evaluates it against the brief, and signs the verdict on-chain. No human in the loop.",
  },
  {
    icon: Zap,
    color: "#F59E0B",
    number: "04",
    title: "USDC settles automatically",
    description:
      "Approved work releases USDC to the creator the same block. No invoices. No paid you next week. Just settlement.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 px-6 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm text-[#a1a1aa] bg-white/5 border border-white/10 rounded-full">
            How it works
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            From job to payout in{" "}
            <span className="bg-gradient-to-r from-[#FF2D7A] to-[#2D6EFF] bg-clip-text text-transparent">
              minutes
            </span>
            .
          </h2>
          <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto">
            Trustless settlement for crypto creators. No middlemen, no delays.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div
                  className="absolute -top-3 -left-3 text-xs font-bold px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: step.color }}
                >
                  {step.number}
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
                  style={{
                    backgroundColor: `${step.color}20`,
                    color: step.color,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[#a1a1aa]">
            Built on <span className="text-white font-medium">Arc</span> · Powered by{" "}
            <span className="text-white font-medium">Circle Wallets</span> ·
            Verified by <span className="text-white font-medium">Claude</span>
          </p>
        </div>
      </div>
    </section>
  );
}