"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  type CreatorProfile,
} from "@/lib/profile-store";

interface XStatus {
  linked: boolean;
  handle: string | null;
}

export function SettingsContent() {
  const { user, authenticated } = useAuth();
  const address = user?.walletAddress;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [xStatus, setXStatus] = useState<XStatus | null>(null);
  const [xLoading, setXLoading] = useState(true);
  const [xMessage, setXMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!address) return;
    setProfile(readCreatorProfile(address));
  }, [address]);

  const refreshXStatus = async (addr: string) => {
    setXLoading(true);
    try {
      const res = await fetch(`/api/x/status?wallet=${addr}`, { cache: "no-store" });
      const data = await res.json();
      setXStatus({ linked: !!data.linked, handle: data.handle ?? null });
    } catch {
      setXStatus({ linked: false, handle: null });
    } finally {
      setXLoading(false);
    }
  };

  useEffect(() => {
    if (!address) return;
    refreshXStatus(address);
  }, [address]);

  useEffect(() => {
    const flag = searchParams.get("x_linked");
    if (!flag) return;

    const messages: Record<string, { kind: "success" | "error"; text: string }> = {
      success: { kind: "success", text: `X account @${searchParams.get("handle") ?? ""} connected and verified.` },
      taken: { kind: "error", text: "That X account is already linked to a different wallet." },
      denied: { kind: "error", text: "X connection was cancelled." },
      expired: { kind: "error", text: "The connection session expired. Please try again." },
      error: { kind: "error", text: "Could not connect X account. Please try again." },
    };
    setXMessage(messages[flag] ?? null);

    if (flag === "success" && address) refreshXStatus(address);
    router.replace("/dashboard/settings");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, address]);

  const handleConnectX = () => {
    if (!address) return;
    window.location.href = `/api/x/start?wallet=${address}`;
  };

  const handleDisconnectX = async () => {
    if (!address) return;
    setDisconnecting(true);
    try {
      await fetch("/api/x/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });
      setXStatus({ linked: false, handle: null });
      setXMessage(null);
    } catch {
      setXMessage({ kind: "error", text: "Could not disconnect. Please try again." });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSave = () => {
    if (!address || !profile) return;
    setError(null);

    if (profile.payoutAddress && !/^0x[a-fA-F0-9]{40}$/.test(profile.payoutAddress)) {
      setError("Payout address must be a valid 0x address.");
      return;
    }

    const result = writeCreatorProfile(address, { ...profile });
    setProfile(result);
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
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Loading...";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and notification preferences
        </p>
      </div>

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
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              placeholder="How you'd like to be known"
              maxLength={40}
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

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Twitter className="h-5 w-5 text-[#2D6EFF]" />
          X Account
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Connect your X account to verify ownership. Submissions are checked
          against your verified handle to prevent spoofing.
        </p>

        {xLoading ? (
          <div className="h-14 rounded-lg bg-white/[0.03] animate-pulse" />
        ) : xStatus?.linked ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#22C55E]/20 bg-[#22C55E]/5 p-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22C55E]/15 shrink-0">
                <Check className="h-5 w-5 text-[#22C55E]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Connected as @{xStatus.handle}
                </p>
                <p className="text-xs text-muted-foreground">Verified ownership</p>
              </div>
            </div>
            <button
              onClick={handleDisconnectX}
              disabled={disconnecting}
              className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-muted-foreground hover:text-red-400 hover:border-red-400/30 transition-all disabled:opacity-60"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectX}
            className="flex items-center gap-2 rounded-lg bg-[#2D6EFF] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#2D6EFF]/90"
          >
            <Twitter className="h-4 w-4" />
            Connect X account
          </button>
        )}

        {xMessage && (
          <div
            className={`mt-4 rounded-lg border p-3 text-xs flex items-start gap-2 ${
              xMessage.kind === "success"
                ? "border-[#22C55E]/30 bg-[#22C55E]/5 text-[#22C55E]"
                : "border-red-500/30 bg-red-500/5 text-red-400"
            }`}
          >
            {xMessage.kind === "success" ? (
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <p>{xMessage.text}</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Wallet className="h-5 w-5 text-[#2D6EFF]" />
          Wallet
        </h2>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-4 flex-wrap">
          <div className="min-w-0">
            <p className="font-mono text-sm text-foreground break-all">{address}</p>
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
              onChange={(e) => setProfile({ ...profile, payoutAddress: e.target.value })}
              placeholder="0x..."
              className={`${inputStyle} font-mono text-xs`}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Notifications</h2>

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