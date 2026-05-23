"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Wallet, ExternalLink, Check, AlertCircle, Globe, Twitter } from "lucide-react";
import {
  readProjectProfile,
  writeProjectProfile,
  normalizeXHandle,
  type ProjectProfile,
} from "@/lib/profile-store";

export default function ProjectSettingsPage() {
  const { user, authenticated } = useAuth();
  const address = user?.walletAddress;

  const [profile, setProfile] = useState<ProjectProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile when wallet is known
  useEffect(() => {
    if (!address) return;
    setProfile(readProjectProfile(address));
  }, [address]);

  const handleSave = () => {
    if (!address || !profile) return;
    setError(null);

    const normalizedX = profile.xHandle ? normalizeXHandle(profile.xHandle) : "";
    if (profile.xHandle && !normalizedX) {
      setError("X handle is not valid. Use only letters, numbers, and underscores (max 15 chars).");
      return;
    }

    if (profile.website && !/^https?:\/\//i.test(profile.website)) {
      setError("Website must start with http:// or https://");
      return;
    }

    const saved = writeProjectProfile(address, {
      ...profile,
      xHandle: normalizedX,
    });
    setProfile(saved);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!authenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-foreground font-semibold">Sign in to manage settings</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-40 rounded bg-white/5 animate-pulse" />
        <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Loading...";

  const initials = (profile.name || "Project").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Profile, links, and account info for your project
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        <h2 className="mb-5 font-semibold text-foreground">Public profile</h2>

        <div className="mb-5 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2D6EFF] to-[#FF2D7A] p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-background text-lg font-bold text-foreground">
              {initials}
            </div>
          </div>
          <div>
            <p className="text-sm text-foreground font-medium">
              {profile.name || "Untitled project"}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{shortAddr}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Project name">
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="e.g. ArcSwap Protocol"
              maxLength={60}
              className={inputStyle}
            />
          </Field>

          <Field label="Tagline" hint="One short sentence shown to creators">
            <input
              type="text"
              value={profile.tagline}
              onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
              placeholder="e.g. The fastest DEX on Arc"
              maxLength={80}
              className={inputStyle}
            />
          </Field>

          <Field
            label="Website"
            icon={<Globe className="h-4 w-4 text-muted-foreground" />}
          >
            <input
              type="url"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              placeholder="https://yourproject.com"
              className={inputStyle}
            />
          </Field>

          <Field
            label="X (Twitter)"
            icon={<Twitter className="h-4 w-4 text-muted-foreground" />}
            hint="OAuth connection coming soon. For now, enter your handle manually."
          >
            <input
              type="text"
              value={profile.xHandle}
              onChange={(e) => setProfile({ ...profile, xHandle: e.target.value })}
              placeholder="@yourhandle"
              className={inputStyle}
            />
          </Field>

          <Field label="Description" hint="Optional. Tell creators what your project is about.">
            <textarea
              value={profile.description}
              onChange={(e) =>
                setProfile({ ...profile, description: e.target.value })
              }
              rows={3}
              maxLength={500}
              placeholder="What does your project do? Who is it for?"
              className={`${inputStyle} resize-none`}
            />
          </Field>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="rounded-lg bg-[#2D6EFF] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#2D6EFF]/90 flex items-center gap-2"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                "Save changes"
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              Stored on this device. Syncing across devices is coming soon.
            </p>
          </div>
        </div>
      </section>

      {/* Wallet */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <Wallet className="h-5 w-5 text-[#2D6EFF]" />
          Wallet
        </h2>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 flex-wrap">
          <div className="min-w-0">
            <p className="font-mono text-sm text-foreground break-all">
              {address}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Arc Testnet, embedded wallet by Circle
            </p>
          </div>
          {address && (
            <a
              href={`https://testnet.arcscan.app/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-[#2D6EFF] hover:text-[#2D6EFF]/80 transition-colors shrink-0"
            >
              View on Arcscan
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2D6EFF]/40 focus:border-[#2D6EFF]/50 transition-all";

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
        {icon}
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
