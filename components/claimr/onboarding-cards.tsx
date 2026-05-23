"use client";

// Onboarding flow with explicit sign-in vs sign-up modes.
//
// URL params:
//   mode  signin | signup    default signup
//   role  creator | project  optional, default depends on mode
//
// Sign up flow:
//   1. Role pick (skipped if ?role= in URL)
//   2. Email + Circle wallet explainer
//   3. Verifying (Circle handles OTP + PIN)
//   4. Wallet ready (address + balance + fund button)
//   5. Profile (optional, skippable)
//
// Sign in flow:
//   1. Email
//   2. Verifying
//   3. Done, redirect to /dashboard or /project (per role param, default /dashboard)

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Briefcase,
  User,
  Copy,
  Check,
  ExternalLink,
  Twitter,
  Sparkles,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { useAuth } from "@/lib/auth";
import { USDC_ADDRESS, USDC_ABI } from "@/lib/contracts";
import { FundWalletModal } from "@/components/claimr/fund-wallet-modal";
import {
  readProjectProfile,
  readCreatorProfile,
  writeProjectProfile,
  writeCreatorProfile,
  normalizeXHandle,
} from "@/lib/profile-store";

type Role = "creator" | "project";
type Mode = "signin" | "signup";
type Step = "role" | "email" | "verifying" | "wallet" | "profile";

const SIGNUP_STEPS: Step[] = ["role", "email", "verifying", "wallet", "profile"];
const SIGNIN_STEPS: Step[] = ["email", "verifying"];

export function OnboardingCards() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, authenticated, user, signUp, connectWallet } = useAuth();

  const urlMode = params.get("mode") === "signin" ? "signin" : "signup";
  const urlRole =
    params.get("role") === "project"
      ? "project"
      : params.get("role") === "creator"
      ? "creator"
      : null;

  const [mode, setMode] = useState<Mode>(urlMode);
  const [role, setRole] = useState<Role | null>(urlRole);
  const [step, setStep] = useState<Step>(() => {
    // For authenticated users the redirect effect above takes over.
    // Initial step just needs to be valid - we won't actually render it.
    if (authenticated) return "email";
    if (mode === "signin") return "email";
    return urlRole ? "email" : "role";
  });
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // authenticated bounce: send any signed-in user straight to their
  // dashboard. Returning users (visiting /onboarding from a bookmark or
  // landing-page CTA) should not be forced through the signup flow again.
  useEffect(() => {
    if (!ready) return;
    if (authenticated) {
      router.replace(role === "project" ? "/project" : "/dashboard/discover");
    }
  }, [ready, authenticated, role, router]);

  // Verifying -> next step when wallet is ready.
  useEffect(() => {
    if (step !== "verifying") return;
    if (!authenticated) return;
    if (mode === "signin") {
      router.replace(role === "project" ? "/project" : "/dashboard/discover");
      return;
    }
    if (user?.walletAddress) setStep("wallet");
  }, [step, authenticated, user?.walletAddress, mode, role, router]);

  const visibleSteps = useMemo(() => {
    if (mode === "signin") return SIGNIN_STEPS;
    return urlRole
      ? SIGNUP_STEPS.filter((s) => s !== "role")
      : SIGNUP_STEPS;
  }, [mode, urlRole]);
  const currentIndex = visibleSteps.indexOf(step);

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    if (newMode === "signin") {
      setStep("email");
    } else {
      setStep(urlRole ? "email" : "role");
    }
  };

  const handleRolePick = (picked: Role) => {
    setRole(picked);
    setStep("email");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);
    setStep("verifying");
    try {
      await signUp(email.trim());
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed.");
      setStep("email");
    } finally {
      setSubmitting(false);
    }
  };

  // MetaMask / injected wallet alternative. Bypasses the email + PIN flow
  // entirely; the user signs in with their existing wallet. Goes straight
  // to the destination dashboard - no profile step, no Circle setup.
  const handleConnectWallet = async () => {
    // Pre-flight: is there even an injected wallet to connect to?
    if (typeof window === "undefined" || !(window as { ethereum?: unknown }).ethereum) {
      setError(
        "No browser wallet detected. Install MetaMask (or Rabby / Brave Wallet / Coinbase Wallet) and refresh, then try again."
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await connectWallet();
      // Auth state updates via wagmi; the redirect effect at the top of
      // the component picks it up and routes the user away.
    } catch (err: any) {
      // Translate wagmi/core's terse errors into something a user can act on.
      const raw = err?.message ?? "";
      let friendly = "Could not connect wallet.";
      if (/provider not found|no provider/i.test(raw)) {
        friendly =
          "No browser wallet detected. Install MetaMask or another browser wallet and refresh the page.";
      } else if (/user rejected|user denied|reject/i.test(raw)) {
        friendly = "Wallet connection was cancelled.";
      } else if (/already pending/i.test(raw)) {
        friendly =
          "A wallet connection request is already open. Check your MetaMask extension.";
      } else if (raw) {
        friendly = raw;
      }
      setError(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    router.replace(role === "project" ? "/project" : "/dashboard/discover");
  };

  return (
    <div className="mx-auto max-w-xl px-6 pt-24 pb-24">
      {/* Mode toggle - hidden during in-flight steps so it doesn't shift under the user */}
      {(step === "role" || step === "email") && (
        <ModeToggle mode={mode} onChange={handleModeSwitch} />
      )}

      {visibleSteps.length > 1 && (
        <div className="mt-6">
          <ProgressDots total={visibleSteps.length} current={currentIndex} />
        </div>
      )}

      <div className="mt-10">
        {step === "role" && mode === "signup" && (
          <RoleStep onPick={handleRolePick} />
        )}

        {step === "email" && (
          <EmailStep
            mode={mode}
            role={role}
            email={email}
            setEmail={setEmail}
            submitting={submitting}
            error={error}
            onSubmit={handleEmailSubmit}
            onConnectWallet={handleConnectWallet}
            onBack={
              mode === "signup" && !urlRole ? () => setStep("role") : undefined
            }
          />
        )}

        {step === "verifying" && <VerifyingStep mode={mode} email={email} />}

        {step === "wallet" && role && mode === "signup" && (
          <WalletStep
            role={role}
            walletAddress={user?.walletAddress ?? null}
            onContinue={() => setStep("profile")}
          />
        )}

        {step === "profile" && role && user?.walletAddress && (
          <ProfileStep
            role={role}
            walletAddress={user.walletAddress}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Mode toggle
// ----------------------------------------------------------------------

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-sm">
        <ToggleButton
          active={mode === "signup"}
          onClick={() => onChange("signup")}
        >
          Sign up
        </ToggleButton>
        <ToggleButton
          active={mode === "signin"}
          onClick={() => onChange("signin")}
        >
          Sign in
        </ToggleButton>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
        active
          ? "bg-[#FF2D7A] text-white"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ----------------------------------------------------------------------
// Progress dots
// ----------------------------------------------------------------------

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? "w-6 bg-[#FF2D7A]"
              : i === current
              ? "w-8 bg-[#FF2D7A]"
              : "w-6 bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------
// Role pick (signup only)
// ----------------------------------------------------------------------

function RoleStep({ onPick }: { onPick: (role: Role) => void }) {
  return (
    <div>
      <Heading
        eyebrow="Get started"
        title="How will you use Claimr?"
        subtitle="Pick one. You can use the other side from the same account later."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <RoleCard
          icon={User}
          title="I'm a creator"
          description="Claim work from open jobs, get paid in USDC."
          accent="#FF2D7A"
          onClick={() => onPick("creator")}
        />
        <RoleCard
          icon={Briefcase}
          title="I'm a project"
          description="Post jobs, lock funds, pay on verification."
          accent="#2D6EFF"
          onClick={() => onPick("project")}
        />
      </div>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  description,
  accent,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/[0.05]"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ background: `${accent}15`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      <span
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: accent }}
      >
        Continue
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

// ----------------------------------------------------------------------
// Email step
// ----------------------------------------------------------------------

function EmailStep({
  mode,
  role,
  email,
  setEmail,
  submitting,
  error,
  onSubmit,
  onConnectWallet,
  onBack,
}: {
  mode: Mode;
  role: Role | null;
  email: string;
  setEmail: (v: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onConnectWallet: () => void;
  onBack?: () => void;
}) {
  const isSignup = mode === "signup";

  // Detect injected wallet after mount (SSR-safe). If missing, swap the
  // Connect button for an Install link so users don't hit "Provider not
  // found" the moment they click.
  const [hasInjectedWallet, setHasInjectedWallet] = useState<boolean | null>(
    null
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasInjectedWallet(!!(window as { ethereum?: unknown }).ethereum);
  }, []);
  return (
    <div>
      <Heading
        eyebrow={
          isSignup
            ? role === "project"
              ? "Project signup"
              : role === "creator"
              ? "Creator signup"
              : "Get started"
            : "Welcome back"
        }
        title={
          isSignup
            ? role === "project"
              ? "Post jobs and pay on verification"
              : "Claim work and get paid in USDC"
            : "Sign in to your account"
        }
        subtitle={
          isSignup
            ? "Enter your email. We'll create a wallet for you."
            : "Enter the email you used to sign up. We'll send a code."
        }
      />

      {isSignup && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#2D6EFF]/20 bg-[#2D6EFF]/5 p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#2D6EFF] mt-0.5" />
          <div className="text-xs text-foreground/85 leading-relaxed">
            We create a non-custodial Circle wallet for you when you sign up. No
            MetaMask, no seed phrase, no browser extension. You sign transactions
            with a PIN.
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={submitting}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-[#FF2D7A]/50 focus:outline-none focus:ring-2 focus:ring-[#FF2D7A]/30 disabled:opacity-60 transition-all"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="break-words">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="flex items-center gap-2 rounded-xl bg-[#FF2D7A] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#FF2D7A]/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSignup ? "Create account" : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Wallet connect alternative. Skips the email + PIN flow entirely. */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {hasInjectedWallet === false ? (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-foreground transition-all hover:bg-white/10 hover:border-white/20"
        >
          <Wallet className="h-4 w-4 text-[#F6851B]" />
          Install MetaMask
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      ) : (
        <button
          type="button"
          onClick={onConnectWallet}
          disabled={submitting || hasInjectedWallet === null}
          className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-foreground transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Wallet className="h-4 w-4 text-[#F6851B]" />
          Connect MetaMask
        </button>
      )}

      <p className="mt-2 text-center text-xs text-muted-foreground">
        {hasInjectedWallet === false
          ? "MetaMask (or another browser wallet) is required for wallet sign-in."
          : "Use your existing wallet. No email, no PIN, one click to sign each transaction."}
      </p>
    </div>
  );
}

// ----------------------------------------------------------------------
// Verifying step
// ----------------------------------------------------------------------

function VerifyingStep({ mode, email }: { mode: Mode; email: string }) {
  const signupMessages = [
    "Sending you a verification code...",
    "Creating your Circle wallet...",
    "Provisioning your address on Arc...",
    "Almost there, finalising...",
  ];
  const signinMessages = [
    "Sending you a verification code...",
    "Loading your wallet...",
    "Signing you in...",
  ];
  const messages = mode === "signup" ? signupMessages : signinMessages;
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setIdx((n) => (n + 1) % messages.length), 2500);
    return () => clearInterval(i);
  }, [messages.length]);

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF2D7A]/10 ring-1 ring-[#FF2D7A]/30">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF2D7A]" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">
        {mode === "signup" ? "Setting things up" : "Signing you in"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Check {email || "your inbox"} for the verification code from Circle.
      </p>

      <div className="mt-8 mx-auto max-w-sm rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
        <p className="text-xs text-foreground/80 transition-opacity duration-300">
          {messages[idx]}
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Wallet ready step (signup only)
// ----------------------------------------------------------------------

function WalletStep({
  role,
  walletAddress,
  onContinue,
}: {
  role: Role;
  walletAddress: string | null;
  onContinue: () => void;
}) {
  const [fundOpen, setFundOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: usdcRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [walletAddress as `0x${string}`],
    query: {
      enabled: !!walletAddress,
      refetchInterval: 5000,
    },
  });
  const balance = usdcRaw
    ? Number(formatUnits(usdcRaw as bigint, 6)).toFixed(2)
    : "0.00";
  const isFunded = parseFloat(balance) > 0;

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!walletAddress) {
    return (
      <div className="text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Finalising your wallet...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
          <Sparkles className="h-6 w-6 text-green-400" />
        </div>
      </div>

      <Heading
        align="center"
        title="Wallet ready"
        subtitle={
          role === "project"
            ? "Fund it with USDC so you can lock escrow on your first job."
            : "You'll receive payouts here when your work is verified."
        }
        compact
      />

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Your address
          </span>
          <a
            href={`https://testnet.arcscan.app/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#2D6EFF] hover:underline"
          >
            View on Arcscan
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-mono text-sm text-foreground break-all min-w-0">
            {walletAddress}
          </p>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">USDC balance</span>
          </div>
          <span
            className={`font-mono text-sm font-semibold ${
              isFunded ? "text-green-400" : "text-foreground"
            }`}
          >
            {balance}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => setFundOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#FF2D7A] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#FF2D7A]/90"
        >
          {isFunded ? "Add more USDC" : "Fund your wallet"}
        </button>
        <button
          onClick={onContinue}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-foreground hover:bg-white/10 transition-colors"
        >
          {isFunded ? "Continue" : "Continue without funding"}
        </button>
        {!isFunded && (
          <p className="text-center text-xs text-muted-foreground">
            {role === "project"
              ? "You can fund later, but you'll need USDC to post jobs."
              : "You don't need funds to claim jobs. Payouts come automatically."}
          </p>
        )}
      </div>

      <FundWalletModal open={fundOpen} onClose={() => setFundOpen(false)} />
    </div>
  );
}

// ----------------------------------------------------------------------
// Profile step (signup only, optional)
// ----------------------------------------------------------------------

function ProfileStep({
  role,
  walletAddress,
  onFinish,
}: {
  role: Role;
  walletAddress: string;
  onFinish: () => void;
}) {
  const [name, setName] = useState(
    () =>
      (role === "project"
        ? readProjectProfile(walletAddress).name
        : readCreatorProfile(walletAddress).displayName) || ""
  );
  const [xHandle, setXHandle] = useState(
    () =>
      (role === "project"
        ? readProjectProfile(walletAddress).xHandle
        : readCreatorProfile(walletAddress).xHandle) || ""
  );
  const [bio, setBio] = useState(
    () =>
      (role === "project"
        ? readProjectProfile(walletAddress).description
        : readCreatorProfile(walletAddress).bio) || ""
  );

  const handleSaveAndContinue = () => {
    const normalizedX = normalizeXHandle(xHandle);
    if (role === "project") {
      writeProjectProfile(walletAddress, {
        name: name.trim(),
        xHandle: normalizedX,
        description: bio.trim(),
      });
    } else {
      writeCreatorProfile(walletAddress, {
        displayName: name.trim(),
        xHandle: normalizedX,
        bio: bio.trim(),
      });
    }
    onFinish();
  };

  return (
    <div>
      <Heading
        eyebrow="Almost done"
        title={role === "project" ? "Tell creators about your project" : "Tell projects about you"}
        subtitle="All fields are optional. You can edit anytime in Settings."
      />

      <div className="mt-6 space-y-4">
        <Field label={role === "project" ? "Project name" : "Display name"}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "project" ? "e.g. ArcSwap Protocol" : "e.g. Alex"}
            maxLength={60}
            className={inputStyle}
          />
        </Field>

        <Field
          label="X (Twitter)"
          icon={<Twitter className="h-3.5 w-3.5 text-muted-foreground" />}
          hint="OAuth connection coming soon. For now, enter your handle manually."
        >
          <input
            type="text"
            value={xHandle}
            onChange={(e) => setXHandle(e.target.value)}
            placeholder="@yourhandle"
            className={inputStyle}
          />
        </Field>

        <Field
          label={role === "project" ? "Short description" : "Bio"}
          hint="Shown to others on the platform."
        >
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder={
              role === "project"
                ? "What does your project do?"
                : "What kind of work do you do?"
            }
            className={`${inputStyle} resize-none`}
          />
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={onFinish}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={handleSaveAndContinue}
          className="flex items-center gap-2 rounded-xl bg-[#FF2D7A] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#FF2D7A]/90"
        >
          Save and continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Shared bits
// ----------------------------------------------------------------------

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FF2D7A]/50 focus:outline-none focus:ring-2 focus:ring-[#FF2D7A]/30 transition-all";

function Heading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  compact?: boolean;
}) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <div className={`${alignClass} ${compact ? "mt-4" : ""}`}>
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-wider text-[#FF2D7A]">
          {eyebrow}
        </p>
      )}
      <h1
        className={`${
          eyebrow ? "mt-2" : ""
        } text-2xl font-bold text-foreground`}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  icon,
  hint,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
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
