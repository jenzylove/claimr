"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  ShieldCheck,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { ADMIN_BASE_PATH } from "@/lib/admin-config";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: `${ADMIN_BASE_PATH}` },
  { icon: Briefcase, label: "Jobs", href: `${ADMIN_BASE_PATH}/jobs` },
  { icon: Plus, label: "Post platform job", href: `${ADMIN_BASE_PATH}/post`, highlight: true },
  { icon: ShieldCheck, label: "Verifier", href: `${ADMIN_BASE_PATH}/verifier` },
  { icon: Activity, label: "Activity", href: `${ADMIN_BASE_PATH}/activity` },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === ADMIN_BASE_PATH ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 hidden md:flex md:flex-col border-r border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="px-5 py-5 border-b border-white/5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Management
        </p>
        <p className="mt-1 text-lg font-bold text-foreground">Claimr ops</p>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ icon: Icon, label, href, highlight }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-foreground"
                      : highlight
                      ? "text-[#FF2D7A] hover:bg-[#FF2D7A]/10"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-3 border-t border-white/5">
        <Link
          href="/dashboard/discover"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Exit management
        </Link>
      </div>
    </aside>
  );
}
