"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Briefcase,
  DollarSign,
  Wallet,
  Settings,
  LogOut,
  LogIn,
  Lock,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Logo } from "@/components/claimr/logo";

interface MenuItem {
  icon: typeof Compass;
  label: string;
  href: string;
  requiresAuth: boolean;
}

const menuItems: MenuItem[] = [
  { icon: Compass, label: "Discover", href: "/dashboard/discover", requiresAuth: false },
  { icon: Briefcase, label: "My Jobs", href: "/dashboard/my-jobs", requiresAuth: true },
  { icon: DollarSign, label: "Earnings", href: "/dashboard/earnings", requiresAuth: true },
  { icon: Wallet, label: "Wallet", href: "/dashboard/wallet", requiresAuth: true },
  { icon: Settings, label: "Settings", href: "/dashboard/settings", requiresAuth: true },
];

function UserProfileOrGuestCta({ onNavigate }: { onNavigate?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { user, logout, authenticated } = useAuth();
  const router = useRouter();

  if (!mounted) {
    return <div data-tour-id="sidebar-cta" className="border-t border-border/50 p-4 h-[72px]" />;
  }

  if (!authenticated) {
    return (
      <div data-tour-id="sidebar-cta" className="border-t border-border/50 p-4">
        <p className="text-xs text-muted-foreground mb-2">
          You're browsing as a guest
        </p>
        <Link
          href="/onboarding?mode=signin"
          onClick={onNavigate}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FF2D7A] to-[#2D6EFF] px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign in to claim jobs
        </Link>
      </div>
    );
  }

  const displayName =
    user?.email ||
    (user?.walletAddress
      ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
      : "Creator");

  const avatarLetter = displayName.slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    await logout();
    if (onNavigate) onNavigate();
    router.push("/");
  };

  return (
    <div data-tour-id="sidebar-cta" className="border-t border-border/50 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF2D7A] to-[#2D6EFF] flex items-center justify-center text-sm font-bold text-white shrink-0">
          {avatarLetter}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground">Signed in</p>
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
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { authenticated } = useAuth();

  return (
    <>
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
          <Logo size={32} />
          <span className="text-xl font-bold text-foreground">Claimr</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const gated = item.requiresAuth && !authenticated;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#FF2D7A]/10 text-[#FF2D7A]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={gated ? "Sign in required" : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {gated && (
                    <Lock className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <UserProfileOrGuestCta onNavigate={onNavigate} />
    </>
  );
}

export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close menu when navigating (Link clicked)
  const closeMobile = () => setMobileOpen(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Header - only visible on mobile */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 border-b border-border/50 bg-background/90 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-base font-bold text-foreground">Claimr</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 flex flex-col border-r border-border/50 bg-background transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={closeMobile}
          className="absolute top-3 right-3 p-2 rounded-lg text-foreground hover:bg-muted z-10"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={closeMobile} />
      </aside>

      {/* Desktop Sidebar - only visible on desktop */}
      <aside
        data-tour-id="dashboard-sidebar"
        className="fixed left-0 top-0 h-screen w-64 hidden md:flex md:flex-col border-r border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <SidebarContent />
      </aside>
    </>
  );
}