"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { ArrowRight, Wallet, Loader2 } from "lucide-react";

export function OnboardingCards() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "creator";

  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  const [creatorEmail, setCreatorEmail] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectEmail, setProjectEmail] = useState("");

  const [isCreatingWallet, setIsCreatingWallet] = useState<"creator" | "project" | null>(null);
  const [userInitiatedConnect, setUserInitiatedConnect] = useState<"creator" | "project" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sdk, setSdk] = useState<any>(null);

  useEffect(() => {
    import("@circle-fin/w3s-pw-web-sdk").then((mod) => {
      const W3SSdk = mod.W3SSdk;
      const instance = new W3SSdk();
      instance.setAppSettings({
        appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID!,
      });
      setSdk(instance);
    });
  }, []);

  useEffect(() => {
    if (isConnected && userInitiatedConnect) {
      const dest = userInitiatedConnect === "project" ? "/project" : "/dashboard";
      router.push(dest);
    }
  }, [isConnected, userInitiatedConnect, router]);

  async function handleCircleSignup(asRole: "creator" | "project", email: string) {
    if (!email || !sdk) return;
    setError(null);
    setIsCreatingWallet(asRole);

    try {
      const userRes = await fetch("/api/circle/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.error || "User creation failed");

      const sessionRes = await fetch("/api/circle/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.userId }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error || "Session failed");

      sdk.setAuthentication({
        userToken: sessionData.userToken,
        encryptionKey: sessionData.encryptionKey,
      });

      sdk.execute(
        [
          {
            type: "INITIALIZE",
            accountType: "SCA",
            blockchains: ["ARC-TESTNET"],
          },
        ],
        (err: any, result: any) => {
          setIsCreatingWallet(null);
          if (err) {
            console.error("Circle SDK error:", err);
            setError(err.message || "Wallet setup failed");
            return;
          }
          console.log("Circle SDK result:", result);

          localStorage.setItem("claimr:circle:email", email);
          localStorage.setItem("claimr:circle:userId", userData.userId);
          const walletAddress = result?.data?.wallets?.[0]?.address;
          if (walletAddress) {
            localStorage.setItem("claimr:circle:wallet", walletAddress);
          }

          const dest = asRole === "project" ? "/project" : "/dashboard";
          router.push(dest);
        }
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsCreatingWallet(null);
    }
  }

  function handleWalletConnect(asRole: "creator" | "project") {
    setUserInitiatedConnect(asRole);
    const metaMaskConnector = connectors.find(
      (c) => c.name === "MetaMask" || c.id === "metaMask"
    );
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#FF2D7A]/20 rounded-full blur-[128px] animate-float" />
        <div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#2D6EFF]/20 rounded-full blur-[128px] animate-float"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="max-w-md mx-auto">
          {role === "creator" && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-[#FF2D7A]/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative glass-card rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-8">Start Earning on Claimr</h2>
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={creatorEmail}
                    onChange={(e) => setCreatorEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#FF2D7A]/50 focus:border-[#FF2D7A]/50 transition-all"
                    disabled={isCreatingWallet !== null}
                  />
                  <button
                    onClick={() => handleCircleSignup("creator", creatorEmail)}
                    disabled={!creatorEmail || !sdk || isCreatingWallet !== null}
                    className="group/btn w-full px-6 py-3.5 text-base font-medium text-white bg-[#FF2D7A] rounded-xl hover:bg-[#FF2D7A]/90 transition-all shadow-lg shadow-[#FF2D7A]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreatingWallet === "creator" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating wallet...
                      </>
                    ) : (
                      <>
                        Create Creator Account
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-sm text-[#a1a1aa]">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <button
                  onClick={() => handleWalletConnect("creator")}
                  className="w-full px-6 py-3.5 text-base font-medium text-white bg-transparent border border-white/20 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
                <p className="mt-6 text-xs text-[#a1a1aa] leading-relaxed">
                  Your Circle wallet is created automatically. Secured by PIN, fully self-custodial.
                </p>
              </div>
            </div>
          )}

          {role === "project" && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-[#2D6EFF]/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative glass-card rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-8">Post Your First Job</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Company name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#2D6EFF]/50 focus:border-[#2D6EFF]/50 transition-all"
                    disabled={isCreatingWallet !== null}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={projectEmail}
                    onChange={(e) => setProjectEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#2D6EFF]/50 focus:border-[#2D6EFF]/50 transition-all"
                    disabled={isCreatingWallet !== null}
                  />
                  <button
                    onClick={() => handleCircleSignup("project", projectEmail)}
                    disabled={!projectEmail || !sdk || isCreatingWallet !== null}
                    className="group/btn w-full px-6 py-3.5 text-base font-medium text-white bg-[#2D6EFF] rounded-xl hover:bg-[#2D6EFF]/90 transition-all shadow-lg shadow-[#2D6EFF]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreatingWallet === "project" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating wallet...
                      </>
                    ) : (
                      <>
                        Create Project Account
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-sm text-[#a1a1aa]">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <button
                  onClick={() => handleWalletConnect("project")}
                  className="w-full px-6 py-3.5 text-base font-medium text-white bg-transparent border border-white/20 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
                <p className="mt-6 text-xs text-[#a1a1aa] leading-relaxed">
                  Deposit USDC to escrow when you post your first job. Powered by Arc + Circle.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 text-sm text-red-400 bg-red-500/10 rounded-xl p-4 text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}