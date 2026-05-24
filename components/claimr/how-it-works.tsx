"use client";

import { Briefcase, Target, Bot, Zap } from "lucide-react";
import { motion } from "motion/react";

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
      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="text-center mb-20">
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

        <div className="space-y-32 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative flex gap-6 items-start min-h-[40vh]"
              >
                {/* Icon column */}
                <div className="flex-shrink-0 relative">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${step.color}20`,
                      color: step.color,
                      border: `1px solid ${step.color}40`,
                    }}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <div
                    className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Content column */}
                <div className="flex-1 pt-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-base md:text-lg text-[#a1a1aa] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-32 text-center">
          <p className="text-sm text-[#a1a1aa]">
            Built on <span className="text-white font-medium">Arc</span> · Powered by{" "}
            <span className="text-white font-medium">Circle Wallets</span> · Verified by{" "}
            <span className="text-white font-medium">Claude</span>
          </p>
        </div>
      </div>
    </section>
  );
}