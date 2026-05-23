"use client";

// Post Job stepper.
//
// Replaces the old single-screen post page where the only feedback during
// the 2-PIN flow was the button label changing. Now:
//
//   Step 1   Details        title, description, category
//   Step 2   Criteria + pay  what verifies, how much, deadline
//   Step 3   Visibility      open vs invite-only
//   Step 4   Review + lock   summary, then a real progress stepper for
//                            "Approving USDC -> Posting to escrow -> Live"
//
// All chain calls are unchanged. Same useCircleWrite, same two PIN entries,
// same approve(USDC) -> postJob() sequence. Just visible now.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseUnits } from "viem";
import {
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Calendar,
  Target,
  Lock,
  Loader2,
  CheckCircle2,
  Eye,
  Globe,
  Users,
  AlertCircle,
} from "lucide-react";
import { CLAIMR_ESCROW_ADDRESS, USDC_ADDRESS } from "@/lib/contracts";
import { useAuth } from "@/lib/auth";
import { useCircleWrite } from "@/lib/useCircleWrite";
import { ErrorCallout } from "@/components/claimr/error-callout";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type FormStep = 1 | 2 | 3 | 4;
type LockPhase = "idle" | "approving" | "posting" | "success";

// Slots = how many creators can take the job. UI workaround for the
// contract's one-claimer-per-job model: we lock pay * slots USDC and
// call postJob() slots times in a single flow.
const MIN_SLOTS = 1;
const MAX_SLOTS = 10;

const CATEGORIES = ["KOL", "Writing", "Design", "Dev", "Video"] as const;

export function PostJobStepper() {
  const router = useRouter();
  const { authenticated } = useAuth();
  const { execute } = useCircleWrite();

  const [step, setStep] = useState<FormStep>(1);

  // Step 1 - Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("KOL");

  // Step 2 - Criteria + pay
  const [criteria, setCriteria] = useState("");
  const [pay, setPay] = useState("");
  const [duration, setDuration] = useState("7");
  const [slots, setSlots] = useState("1");

  // Step 3 - Visibility
  const [isPrivate, setIsPrivate] = useState(false);
  const [invitedCreator, setInvitedCreator] = useState("");

  // Step 4 - Lock phase
  const [lockPhase, setLockPhase] = useState<LockPhase>("idle");
  const [currentSlot, setCurrentSlot] = useState(0); // 1-indexed during posting
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derived: validated slot count and total escrow.
  const slotCount = (() => {
    const n = parseInt(slots, 10);
    if (!Number.isFinite(n)) return 1;
    return Math.min(MAX_SLOTS, Math.max(MIN_SLOTS, n));
  })();
  const payNumber = parseFloat(pay) || 0;
  const totalEscrow = payNumber * slotCount;

  // Step navigation
  const canAdvanceFrom1 = title.trim().length >= 3;
  const canAdvanceFrom2 =
    criteria.trim().length >= 3 &&
    !!pay &&
    payNumber > 0 &&
    !!duration &&
    slotCount >= MIN_SLOTS &&
    slotCount <= MAX_SLOTS;
  const canAdvanceFrom3 = !isPrivate || /^0x[a-fA-F0-9]{40}$/.test(invitedCreator);

  const handleLockAndPost = async () => {
    if (!authenticated) {
      setErrorMsg("Sign in first.");
      return;
    }

    setErrorMsg(null);
    const perJobWei = parseUnits(pay, 6);
    const totalWei = perJobWei * BigInt(slotCount);

    try {
      // 1. Approve total once - covers every postJob() that follows.
      setLockPhase("approving");
      setCurrentSlot(0);
      await execute({
        contractAddress: USDC_ADDRESS,
        abiFunctionSignature: "approve(address,uint256)",
        abiParameters: [CLAIMR_ESCROW_ADDRESS, totalWei.toString()],
      });

      // 2. Post N jobs sequentially. Each is its own on-chain job; UI
      //    just groups the flow into one stepper.
      setLockPhase("posting");
      for (let i = 1; i <= slotCount; i++) {
        setCurrentSlot(i);
        await execute({
          contractAddress: CLAIMR_ESCROW_ADDRESS,
          abiFunctionSignature:
            "postJob(string,string,uint256,uint256,bool,address)",
          abiParameters: [
            title,
            criteria,
            perJobWei.toString(),
            duration,
            isPrivate,
            invitedCreator || ZERO_ADDRESS,
          ],
        });
      }

      setLockPhase("success");
      setTimeout(() => router.push("/project"), 2500);
    } catch (err) {
      setErrorMsg(
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Transaction failed."
      );
      setLockPhase("idle");
      setCurrentSlot(0);
    }
  };

  return (
    <div className="space-y-6">
      <StepBar current={step} />

      {!authenticated && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 backdrop-blur-sm flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-300">
            You'll need to sign in before you can post the job.
          </p>
        </div>
      )}

      {errorMsg && (
        <ErrorCallout
          error={errorMsg}
          onRetry={() => setErrorMsg(null)}
          className="mb-2"
        />
      )}

      {step === 1 && (
        <Step1
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          category={category}
          setCategory={setCategory}
          canAdvance={canAdvanceFrom1}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2
          criteria={criteria}
          setCriteria={setCriteria}
          pay={pay}
          setPay={setPay}
          duration={duration}
          setDuration={setDuration}
          slots={slots}
          setSlots={setSlots}
          slotCount={slotCount}
          totalEscrow={totalEscrow}
          canAdvance={canAdvanceFrom2}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <Step3
          isPrivate={isPrivate}
          setIsPrivate={setIsPrivate}
          invitedCreator={invitedCreator}
          setInvitedCreator={setInvitedCreator}
          canAdvance={canAdvanceFrom3}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <Step4
          title={title}
          description={description}
          category={category}
          criteria={criteria}
          pay={pay}
          duration={duration}
          slotCount={slotCount}
          totalEscrow={totalEscrow}
          currentSlot={currentSlot}
          isPrivate={isPrivate}
          invitedCreator={invitedCreator}
          lockPhase={lockPhase}
          onBack={() => setStep(3)}
          onLock={handleLockAndPost}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Step bar
// ----------------------------------------------------------------------

function StepBar({ current }: { current: FormStep }) {
  const labels = ["Details", "Criteria + pay", "Visibility", "Review + lock"];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        {labels.map((label, i) => {
          const stepNum = (i + 1) as FormStep;
          const isActive = current === stepNum;
          const isDone = current > stepNum;
          return (
            <div key={label} className="flex flex-1 items-center gap-2 min-w-0">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all shrink-0 ${
                  isDone
                    ? "bg-green-500/20 text-green-400"
                    : isActive
                    ? "bg-[#2D6EFF] text-white"
                    : "bg-white/5 text-muted-foreground"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span
                className={`text-xs font-medium truncate hidden sm:inline ${
                  isActive
                    ? "text-foreground"
                    : isDone
                    ? "text-green-400"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {i < labels.length - 1 && (
                <div
                  className={`h-px flex-1 transition-colors ${
                    isDone ? "bg-green-500/40" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Step 1
// ----------------------------------------------------------------------

function Step1({
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  canAdvance,
  onNext,
}: {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: (typeof CATEGORIES)[number];
  setCategory: (v: (typeof CATEGORIES)[number]) => void;
  canAdvance: boolean;
  onNext: () => void;
}) {
  return (
    <FormCard
      icon={<Target className="h-5 w-5 text-[#2D6EFF]" />}
      title="Details"
      subtitle="What do you want creators to do?"
    >
      <Field label="Job title" hint="One short, scannable line.">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Tweet about our DEX launch"
          maxLength={80}
          className={inputStyle}
          autoFocus
        />
      </Field>

      <Field label="Description" hint="Optional. Give context creators need.">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Background, goals, tone, links to brand assets..."
          className={`${inputStyle} resize-none`}
        />
      </Field>

      <Field label="Category">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                category === cat
                  ? "bg-[#2D6EFF] text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Field>

      <StepNav canAdvance={canAdvance} onNext={onNext} />
    </FormCard>
  );
}

// ----------------------------------------------------------------------
// Step 2
// ----------------------------------------------------------------------

function Step2({
  criteria,
  setCriteria,
  pay,
  setPay,
  duration,
  setDuration,
  slots,
  setSlots,
  slotCount,
  totalEscrow,
  canAdvance,
  onBack,
  onNext,
}: {
  criteria: string;
  setCriteria: (v: string) => void;
  pay: string;
  setPay: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;
  slots: string;
  setSlots: (v: string) => void;
  slotCount: number;
  totalEscrow: number;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <FormCard
      icon={<DollarSign className="h-5 w-5 text-green-400" />}
      title="Criteria + pay"
      subtitle="What does verified work look like, and what does it pay?"
    >
      <Field
        label="Verification criteria"
        hint="Be specific. AI will use this to verify submissions automatically."
      >
        <input
          type="text"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          placeholder="e.g. 3 tweets, 50K impressions, mention @YourProject"
          className={inputStyle}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment per creator">
          <div className="relative">
            <input
              type="number"
              value={pay}
              onChange={(e) => setPay(e.target.value)}
              placeholder="200"
              min="1"
              step="0.01"
              className={`${inputStyle} pr-16`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-green-400">
              USDC
            </span>
          </div>
        </Field>

        <Field label="Duration">
          <div className="relative">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              max="30"
              className={`${inputStyle} pr-20`}
            />
            <Calendar className="absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              days
            </span>
          </div>
        </Field>
      </div>

      <Field
        label="How many creators can take this job?"
        hint="Each creator claims one slot independently. Pay locks per slot."
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSlots(String(Math.max(MIN_SLOTS, slotCount - 1)))}
            disabled={slotCount <= MIN_SLOTS}
            className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-white/5 text-foreground hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg leading-none"
          >
            -
          </button>
          <input
            type="number"
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
            min={MIN_SLOTS}
            max={MAX_SLOTS}
            className={`${inputStyle} text-center`}
          />
          <button
            type="button"
            onClick={() => setSlots(String(Math.min(MAX_SLOTS, slotCount + 1)))}
            disabled={slotCount >= MAX_SLOTS}
            className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-white/5 text-foreground hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg leading-none"
          >
            +
          </button>
        </div>
        {totalEscrow > 0 && slotCount > 1 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Total escrow:{" "}
            <span className="text-green-400 font-semibold">
              {totalEscrow} USDC
            </span>{" "}
            ({pay} USDC × {slotCount} creators)
          </p>
        )}
      </Field>

      <StepNav canAdvance={canAdvance} onNext={onNext} onBack={onBack} />
    </FormCard>
  );
}

// ----------------------------------------------------------------------
// Step 3
// ----------------------------------------------------------------------

function Step3({
  isPrivate,
  setIsPrivate,
  invitedCreator,
  setInvitedCreator,
  canAdvance,
  onBack,
  onNext,
}: {
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  invitedCreator: string;
  setInvitedCreator: (v: string) => void;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <FormCard
      icon={<Lock className="h-5 w-5 text-[#FF2D7A]" />}
      title="Visibility"
      subtitle="Who's allowed to claim this job?"
    >
      <div className="space-y-3">
        <VisibilityCard
          icon={<Globe className="h-5 w-5" />}
          title="Open"
          description="Any creator can claim. First valid submission wins."
          selected={!isPrivate}
          onClick={() => setIsPrivate(false)}
        />
        <VisibilityCard
          icon={<Users className="h-5 w-5" />}
          title="Invite-only"
          description="Only the wallet you invite can claim."
          selected={isPrivate}
          onClick={() => setIsPrivate(true)}
        />
      </div>

      {isPrivate && (
        <Field
          label="Invited creator wallet"
          hint="They'll be the only address that can claim this job."
        >
          <input
            type="text"
            value={invitedCreator}
            onChange={(e) => setInvitedCreator(e.target.value)}
            placeholder="0x..."
            className={`${inputStyle} font-mono text-xs`}
          />
        </Field>
      )}

      <StepNav
        canAdvance={canAdvance}
        onNext={onNext}
        onBack={onBack}
        nextLabel="Review"
      />
    </FormCard>
  );
}

function VisibilityCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        selected
          ? "border-[#FF2D7A] bg-[#FF2D7A]/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            selected ? "bg-[#FF2D7A]/20 text-[#FF2D7A]" : "bg-white/5 text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div
          className={`mt-1 h-4 w-4 rounded-full border-2 transition-all ${
            selected
              ? "border-[#FF2D7A] bg-[#FF2D7A]"
              : "border-white/20"
          }`}
        />
      </div>
    </button>
  );
}

// ----------------------------------------------------------------------
// Step 4 - Review + lock
// ----------------------------------------------------------------------

function Step4({
  title,
  description,
  category,
  criteria,
  pay,
  duration,
  slotCount,
  totalEscrow,
  currentSlot,
  isPrivate,
  invitedCreator,
  lockPhase,
  onBack,
  onLock,
}: {
  title: string;
  description: string;
  category: string;
  criteria: string;
  pay: string;
  duration: string;
  slotCount: number;
  totalEscrow: number;
  currentSlot: number;
  isPrivate: boolean;
  invitedCreator: string;
  lockPhase: LockPhase;
  onBack: () => void;
  onLock: () => void;
}) {
  const locking = lockPhase !== "idle";
  const multi = slotCount > 1;
  return (
    <FormCard
      icon={<Eye className="h-5 w-5 text-[#FF2D7A]" />}
      title="Review + lock"
      subtitle="Confirm details, then lock USDC in escrow."
    >
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <SummaryRow label="Title" value={title || "Untitled"} />
        {description && <SummaryRow label="Description" value={description} multiline />}
        <SummaryRow label="Category" value={category} />
        <SummaryRow label="Criteria" value={criteria} multiline />
        <SummaryRow label="Payment per creator" value={`${pay} USDC`} accent="green" />
        <SummaryRow
          label="Creators needed"
          value={`${slotCount} ${slotCount === 1 ? "slot" : "slots"}`}
        />
        {multi && (
          <SummaryRow
            label="Total escrow"
            value={`${totalEscrow} USDC (${pay} × ${slotCount})`}
            accent="green"
          />
        )}
        <SummaryRow label="Duration" value={`${duration} day${duration === "1" ? "" : "s"}`} />
        <SummaryRow label="Visibility" value={isPrivate ? "Invite-only" : "Open"} />
        {isPrivate && (
          <SummaryRow label="Invited wallet" value={invitedCreator} mono />
        )}
      </div>

      {multi && !locking && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-200/90 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            You'll be asked to confirm with your PIN {slotCount + 1} times:
            once to approve the total USDC, then once per job post.
          </p>
        </div>
      )}

      {/* Lock progress visual - shows only while locking or after success */}
      {locking && (
        <LockProgress
          phase={lockPhase}
          pay={pay}
          slotCount={slotCount}
          currentSlot={currentSlot}
          totalEscrow={totalEscrow}
        />
      )}

      {/* CTAs */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={locking}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4 inline mr-1" />
          Back
        </button>
        <button
          type="button"
          onClick={onLock}
          disabled={locking}
          className="flex items-center gap-2 rounded-xl bg-[#FF2D7A] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#FF2D7A]/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {lockPhase === "success" ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {multi ? `${slotCount} posted, redirecting...` : "Posted, redirecting..."}
            </>
          ) : lockPhase === "idle" ? (
            <>
              <Lock className="h-4 w-4" />
              Lock {totalEscrow || pay || "0"} USDC + post
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Working...
            </>
          )}
        </button>
      </div>
    </FormCard>
  );
}

function SummaryRow({
  label,
  value,
  multiline,
  mono,
  accent,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  mono?: boolean;
  accent?: "green";
}) {
  const valueClass = `text-sm ${accent === "green" ? "text-green-400 font-semibold" : "text-foreground"} ${
    mono ? "font-mono text-xs" : ""
  } ${multiline ? "whitespace-pre-wrap break-words" : "truncate"}`;
  return (
    <div className={`flex ${multiline ? "flex-col gap-1" : "items-center justify-between gap-3"}`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function LockProgress({
  phase,
  pay,
  slotCount,
  currentSlot,
  totalEscrow,
}: {
  phase: LockPhase;
  pay: string;
  slotCount: number;
  currentSlot: number;
  totalEscrow: number;
}) {
  const multi = slotCount > 1;
  const phases = [
    {
      key: "approving" as const,
      label: `Approving ${multi ? `${totalEscrow}` : pay} USDC allowance`,
      hint: "Letting the escrow contract spend your USDC.",
    },
    {
      key: "posting" as const,
      label: multi
        ? `Posting job ${currentSlot || 1} of ${slotCount}`
        : `Locking ${pay} USDC in escrow`,
      hint: multi
        ? `Each post locks ${pay} USDC and creates a separate job on chain.`
        : "Funds move into the escrow contract and the job goes live.",
    },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
        On-chain progress
      </p>
      <div className="space-y-3">
        {phases.map((p) => {
          const isActive = phase === p.key;
          const isDone =
            (phase === "posting" && p.key === "approving") ||
            phase === "success";
          return (
            <div key={p.key} className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
                  isDone
                    ? "bg-green-500/20 text-green-400"
                    : isActive
                    ? "bg-[#FF2D7A]/20 text-[#FF2D7A]"
                    : "bg-white/5 text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-foreground"
                      : isDone
                      ? "text-green-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {p.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.hint}</p>
              </div>
            </div>
          );
        })}

        {phase === "success" && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3 mt-3">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <p className="text-sm text-green-300">Job live on chain</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Layout primitives shared across steps
// ----------------------------------------------------------------------

function FormCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm space-y-5">
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function StepNav({
  canAdvance,
  onNext,
  onBack,
  nextLabel = "Continue",
}: {
  canAdvance: boolean;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 inline mr-1" />
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className="flex items-center gap-2 rounded-xl bg-[#2D6EFF] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#2D6EFF]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#2D6EFF]/50 focus:outline-none focus:ring-2 focus:ring-[#2D6EFF]/30 transition-all";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
