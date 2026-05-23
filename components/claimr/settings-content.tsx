"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Wallet,
  AlertCircle,
  Check,
  Twitter,
  Mail,
  Bell,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  readCreatorProfile,
  writeCreatorProfile,
  normalizeXHandle,
  type CreatorProfile,
} from "@/lib/profile-store";

export function SettingsContent() {
  const { user, authenticated } = useAuth();
  const address = user?.walletAddress;

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setProfile(readCreatorProfile(address));
  }, [address]);

  const handleSave = () => {
    if (!address || !profile) return;
    setError(null);

    const normalizedX = profile.xHandle ? normalizeXHandle(profile.xHandle) : "";
    if (profile.xHandle && !normalizedX) {
      setError(
        "X handle is not valid. Use only letters, numbers, and underscores (max 15 chars)."
      );
      return;
    }

    if (profile.payoutAddress && !/^0x[a-fA-F0-9]{40}$/.test(profile.payoutAddress)) {
      setError("Payout address must be a valid 0x address.");
      return;
    }

    const saved = writeCreatorProfile(address, {
      ...profile,
      xHandle: normalizedX,
    });
    setProfile(saved);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleNotif = (key: keyof CreatorProfile["notifications"]) => {
    if (!profile) return;
    setProfile({
      ...profile,
      notifications: {
        ...profile.notifications,
        [key]: !profile.notifications[key],
      },
    });
  };

  if (!authenticated) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-foreground font-semibold">Sign in to manage settings</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-white/5 animate-pulse" />
        <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  const initials = (profile.displayName || "You").slice(0, 2).toUpperCase();
  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Loading...";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and notification preferences
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Profile</h2>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D7A] to-[#2D6EFF] text-2xl font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {profile.displayName || "Set your display name"}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {shortAddr}
              </p>
            </div>
          </div>

          <Field label="Display name">
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
              placeholder="How you'd like to be known"
              maxLength={40}
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
              onChange={(e) =>
                setProfile({ ...profile, xHandle: e.target.value })
              }
              placeholder="@yourhandle"
              className={inputStyle}
            />
          </Field>

          <Field label="Bio" hint="Optional, shown to projects considering you for work">
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              maxLength={300}
              placeholder="Tell projects what you're good at"
              className={`${inputStyle} resize-none`}
            />
          </Field>
        </div>
      </section>

      {/* Wallet */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Wallet className="h-5 w-5 text-[#2D6EFF]" />
          Wallet
        </h2>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-4 flex-wrap">
          <div className="min-w-0">
            <p className="font-mono text-sm text-foreground break-all">
              {address}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Arc Testnet, embedded wallet by Circle. Non-custodial, only you control the keys.
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

        <div className="mt-4">
          <Field
            label="Payout address"
            hint="Optional. If set, earnings route here instead of your Claimr wallet. Leave blank to receive directly to your Claimr wallet."
          >
            <input
              type="text"
              value={profile.payoutAddress}
              onChange={(e) =>
                setProfile({ ...profile, payoutAddress: e.target.value })
              }
              placeholder="0x..."
              className={`${inputStyle} font-mono text-xs`}
            />
          </Field>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          Notifications
        </h2>

        <div className="space-y-4">
          <NotifRow
            icon={<Mail className="h-5 w-5 text-muted-foreground" />}
            label="New jobs that match your interests"
            on={profile.notifications.newJobs}
            onClick={() => toggleNotif("newJobs")}
          />
          <NotifRow
            icon={<Bell className="h-5 w-5 text-muted-foreground" />}
            label="Payment received alerts"
            on={profile.notifications.payments}
            onClick={() => toggleNotif("payments")}
          />
          <NotifRow
            icon={<Clock className="h-5 w-5 text-muted-foreground" />}
            label="Deadline reminders"
            on={profile.notifications.deadlines}
            onClick={() => toggleNotif("deadlines")}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Notification delivery isn't wired up yet. Your preference is saved
          for when it ships.
        </p>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="rounded-lg bg-[#FF2D7A] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#FF2D7A]/90 flex items-center gap-2"
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
          Stored on this device. Cross-device sync is coming soon.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

const inputStyle =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FF2D7A]/50 focus:outline-none focus:ring-2 focus:ring-[#FF2D7A]/40 transition-all";

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
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {icon}
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NotifRow({
  icon,
  label,
  on,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <button
        onClick={onClick}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          on ? "bg-[#FF2D7A]" : "bg-white/10"
        }`}
        aria-pressed={on}
        aria-label={label}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
            on ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
