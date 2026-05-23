"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  // Container variant.
  //   "panel"  - rounded-xl border + bg-white/[0.03] (project pages)
  //   "card"   - glass-card surface (dashboard panels)
  //   "inline" - no background/border, for use inside an already-carded parent
  variant?: "card" | "panel" | "inline";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "panel",
  className,
}: Props) {
  const containerClass =
    variant === "card"
      ? "glass-card rounded-xl p-10 text-center"
      : variant === "inline"
      ? "py-8 text-center"
      : "rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur-sm";

  return (
    <div className={`${containerClass} ${className ?? ""}`}>
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          <EmptyStateButton {...action} />
        </div>
      )}
    </div>
  );
}

function EmptyStateButton({ label, href, onClick, variant = "primary" }: EmptyStateAction) {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all";
  const styles =
    variant === "primary"
      ? `${base} bg-[#2D6EFF] text-white hover:bg-[#2D6EFF]/90 shadow-lg shadow-[#2D6EFF]/20`
      : `${base} border border-white/10 bg-white/5 text-foreground hover:bg-white/10`;

  if (href) {
    return (
      <Link href={href} className={styles}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={styles}>
      {label}
    </button>
  );
}
