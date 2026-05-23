import { Navbar } from "@/components/claimr/navbar";
import { Footer } from "@/components/claimr/footer";
import { CLAIMR_ESCROW_ADDRESS } from "@/lib/contracts";

export const metadata = {
  title: "Docs · Claimr",
  description:
    "How Claimr works: AI-verified, on-chain creator marketplace on Arc.",
};

const sections = [
  { id: "what-is-claimr", label: "What is Claimr" },
  { id: "for-creators", label: "For Creators" },
  { id: "for-projects", label: "For Projects" },
  { id: "ai-verification", label: "AI Verification" },
  { id: "on-arc", label: "On Arc" },
  { id: "status", label: "Status & Roadmap" },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-24 lg:flex lg:gap-16">
        {/* Sticky TOC on desktop */}
        <aside className="hidden lg:block lg:w-48 lg:shrink-0">
          <nav className="sticky top-32 space-y-2 text-sm">
            <p className="mb-3 text-xs uppercase tracking-wider text-[#71717a]">
              On this page
            </p>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-[#a1a1aa] transition-colors hover:text-white"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="max-w-3xl flex-1 space-y-16">
          <header>
            <p className="text-sm font-medium text-[#FF2D7A]">Documentation</p>
            <h1 className="mt-2 text-4xl font-bold text-white">
              How Claimr works
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[#a1a1aa]">
              Claimr is a creator marketplace where projects lock USDC in
              on-chain escrow, creators claim jobs and submit proof of work,
              and an AI verifier releases the payment when the work meets the
              brief.
            </p>
          </header>

          <section
            id="what-is-claimr"
            className="scroll-mt-32 space-y-4"
          >
            <h2 className="text-2xl font-semibold text-white">
              What is Claimr?
            </h2>
            <p className="leading-relaxed text-[#a1a1aa]">
              Most creator marketplaces sit between two strangers and ask them
              to trust the platform. Claimr removes the platform from the
              trust equation. When a project posts a job, the payment is
              locked in a smart contract. When a creator submits work, an AI
              verifier compares it against the criteria written into the
              contract at posting time, and if it matches, the funds release
              automatically. No platform-side approval, no payment delay, no
              chargebacks.
            </p>
            <p className="leading-relaxed text-[#a1a1aa]">
              It runs on Arc, Circle&apos;s L1 designed for programmable USDC.
              Gas is paid in USDC, transactions finalize in under a second,
              and everything is auditable on-chain.
            </p>
          </section>

          <section id="for-creators" className="scroll-mt-32 space-y-4">
            <h2 className="text-2xl font-semibold text-white">For Creators</h2>
            <ol className="list-inside list-decimal space-y-3 leading-relaxed text-[#a1a1aa]">
              <li>
                Sign up with your email. We create a Circle wallet on Arc
                Testnet for you and secure it with a PIN and recovery
                questions. You own the keys; Claimr never sees your PIN.
              </li>
              <li>
                Browse open jobs on the{" "}
                <a
                  href="/dashboard/discover"
                  className="text-[#FF2D7A] hover:underline"
                >
                  Discover
                </a>{" "}
                page. Filter by KOL, Writing, Design, or Dev.
              </li>
              <li>
                Click <span className="font-mono text-white">Claim Job</span>{" "}
                on one that fits. The contract reserves it for your wallet.
              </li>
              <li>
                Complete the work, then come back and submit the proof URL
                (typically a tweet).
              </li>
              <li>
                AI verification runs automatically. If your work matches the
                criteria, the USDC lands in your wallet. If not, the job
                rejects and the project keeps the escrow.
              </li>
            </ol>
          </section>

          <section id="for-projects" className="scroll-mt-32 space-y-4">
            <h2 className="text-2xl font-semibold text-white">For Projects</h2>
            <ol className="list-inside list-decimal space-y-3 leading-relaxed text-[#a1a1aa]">
              <li>
                Sign up with your project email and set up your Circle
                wallet on Arc Testnet.
              </li>
              <li>
                Click <span className="font-mono text-white">Post a Job</span>{" "}
                and define title, payout amount in USDC, deadline, and the
                criteria that determine &ldquo;done&rdquo;.
              </li>
              <li>
                Approve the USDC spend and lock it in the escrow contract.
              </li>
              <li>
                When a creator submits, AI verification runs against your
                locked criteria. You don&apos;t need to be online.
              </li>
              <li>
                If you want to dispute a verification, you can reject through
                the contract&apos;s reject flow.
              </li>
            </ol>
            <p className="leading-relaxed text-[#a1a1aa]">
              Tip: write criteria like a brief, not a wish. &ldquo;Tweet must
              mention $TICKER and include a swap link&rdquo; is verifiable.
              &ldquo;Tweet must be high-quality and engaging&rdquo; is not.
            </p>
          </section>

          <section id="ai-verification" className="scroll-mt-32 space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              AI Verification
            </h2>
            <p className="leading-relaxed text-[#a1a1aa]">
              The verifier is a server-side process that reads the job&apos;s
              criteria directly from the smart contract, never from the
              request body. That matters: it means no caller can submit their
              own lenient criteria to trick the verifier into releasing
              escrow. The criteria you set at posting time is the criteria
              that gets evaluated, period.
            </p>
            <p className="leading-relaxed text-[#a1a1aa]">
              When work is submitted, the verifier fetches the submitted
              tweet, hands the tweet text and the on-chain criteria to an AI
              model, and asks: does this fulfill the brief? The verifier
              responds with verifyWork or rejectWork on the contract. Tweet
              content is treated as untrusted user input, so prompt injection
              attempts inside the tweet body don&apos;t change the verdict.
            </p>
          </section>

          <section id="on-arc" className="scroll-mt-32 space-y-4">
            <h2 className="text-2xl font-semibold text-white">On Arc</h2>
            <p className="leading-relaxed text-[#a1a1aa]">
              Claimr currently runs on Arc Testnet only. Mainnet follows Arc
              mainnet.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DocsKv label="Network" value="Arc Testnet" />
              <DocsKv label="Chain ID" value="5042002" />
              <DocsKv
                label="RPC"
                value="https://arc-testnet.drpc.org"
                mono
              />
              <DocsKv
                label="Block Explorer"
                value="testnet.arcscan.app"
                link="https://testnet.arcscan.app"
              />
              <DocsKv
                label="Faucet"
                value="faucet.circle.com"
                link="https://faucet.circle.com"
              />
              <DocsKv
                label="Escrow Contract"
                value={`${CLAIMR_ESCROW_ADDRESS.slice(0, 10)}...${CLAIMR_ESCROW_ADDRESS.slice(-6)}`}
                mono
                link={`https://testnet.arcscan.app/address/${CLAIMR_ESCROW_ADDRESS}`}
              />
            </div>
          </section>

          <section id="status" className="scroll-mt-32 space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              Status &amp; Roadmap
            </h2>
            <p className="leading-relaxed text-[#a1a1aa]">
              Active development on Arc Testnet. Auth and wallets run on
              Circle&apos;s User-Controlled Wallets. Current focus: deeper
              job discovery (better filters, sort options), creator profile
              pages, transaction acceleration UX, and SCA wallets with gas
              sponsorship so new creators can claim without holding USDC
              for gas.
            </p>
            <p className="leading-relaxed text-[#a1a1aa]">
              Source:{" "}
              <a
                href="https://github.com/jenzylove/claimr"
                target="_blank"
                rel="noreferrer"
                className="text-[#FF2D7A] hover:underline"
              >
                github.com/jenzylove/claimr
              </a>
            </p>
          </section>
        </article>
      </div>
      <Footer />
    </main>
  );
}

function DocsKv({
  label,
  value,
  mono,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
}) {
  const inner = (
    <>
      <p className="text-xs uppercase tracking-wider text-[#71717a]">{label}</p>
      <p
        className={`mt-1 text-white ${
          mono ? "break-all font-mono text-sm" : ""
        }`}
      >
        {value}
      </p>
    </>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      {inner}
    </div>
  );
}
