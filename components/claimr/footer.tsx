"use client";

import Link from "next/link";
import { Logo } from "@/components/claimr/logo";

export function Footer() {
  return (
    <footer className="relative py-12 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-white font-semibold text-lg tracking-tight">Claimr</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-[#a1a1aa]">
            <a href="https://x.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter</a>
            <a href="https://github.com/jenzylove/claimr" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/docs#status" className="hover:text-white transition-colors">Status</Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-[#71717a]">
            © 2026 Claimr. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
