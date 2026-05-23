"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PlusCircle, Briefcase, Vault, BarChart3, Settings, BadgeCheck, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/claimr/logo";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/project" },
  { icon: PlusCircle, label: "Post a Job", href: "/project/post" },
  { icon: Briefcase, label: "Active Jobs", href: "/project/jobs" },
  { icon: Vault, label: "Escrow", href: "/project/escrow" },
  { icon: BarChart3, label: "Analytics", href: "/project/analytics" },
  { icon: Settings, label: "Settings", href: "/project/settings" },
];

export function ProjectSidebar() {
  const pathname = usePathname();
  const { user, logout, authenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const displayName =
    user?.email ||
    (user?.walletAddress
      ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
      : "Project");

  const avatarLetter = displayName.slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-xl font-bold text-foreground">Claimr</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#2D6EFF]/10 text-[#2D6EFF]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {mounted ? (
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2D6EFF] to-[#FF2D7A] flex items-center justify-center text-sm font-bold text-white shrink-0">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <BadgeCheck className="h-3.5 w-3.5 text-[#2D6EFF]" />
                <p className="text-xs text-[#2D6EFF]">
                  {authenticated ? "Verified Project" : "Sign in"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/50 p-4 h-[72px]" />
      )}
    </aside>
  );
}