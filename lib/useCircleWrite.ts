"use client";

import { useCallback, useRef, useState } from "react";
import { parseAbiItem } from "viem";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { executeChallenge } from "@/lib/circle-client";
import { useAuth } from "@/lib/auth";

// State machine for one write transaction.
//   idle         nothing in flight
//   creating     POST /tx/contract-execution in flight (Circle) OR preparing tx (wallet)
//   awaitingPin  SDK iframe open, waiting for PIN (Circle) OR wallet popup (wallet)
//   confirming   on-chain, polling /tx/status or waiting receipt
//   success      terminal: COMPLETE/CONFIRMED, txHash available
//   error        terminal: FAILED/CANCELLED/DENIED, or any earlier failure
export type CircleWriteStatus =
  | "idle"
  | "creating"
  | "awaitingPin"
  | "confirming"
  | "success"
  | "error";

export interface CircleWriteParams {
  contractAddress: `0x${string}` | string;
  abiFunctionSignature: string;
  abiParameters: Array<string | number | boolean>;
}

interface CircleWriteResult {
  txHash: string | null;
  state: string | null;
}

export interface UseCircleWriteReturn {
  execute: (params: CircleWriteParams) => Promise<CircleWriteResult>;
  reset: () => void;
  status: CircleWriteStatus;
  txHash: string | null;
  error: string | null;
  // Wagmi-shaped compat flags, so existing UI conditionals migrate cleanly.
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Coerce string args into the right viem-compatible types based on the
// function signature's argument types. wagmi/viem are strict about
// bigint vs string for uint256.
function coerceArgs(
  abiInputs: readonly { type: string }[],
  rawArgs: Array<string | number | boolean>
): unknown[] {
  return abiInputs.map((input, i) => {
    const raw = rawArgs[i];
    if (input.type.startsWith("uint") || input.type.startsWith("int")) {
      // Numeric: pass as bigint.
      return BigInt(String(raw));
    }
    if (input.type === "bool") {
      if (typeof raw === "boolean") return raw;
      return String(raw).toLowerCase() === "true";
    }
    // address, string, bytes - pass through as-is.
    return raw;
  });
}

export function useCircleWrite(): UseCircleWriteReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<CircleWriteStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const pollStatus = useCallback(
    async (transactionId: string): Promise<CircleWriteResult> => {
      const start = Date.now();
      while (Date.now() - start < POLL_TIMEOUT_MS) {
        const res = await fetch(
          `/api/circle/tx/status?id=${encodeURIComponent(transactionId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          throw new Error("Could not check transaction status");
        }
        const data = await res.json();
        if (data.txHash) setTxHash(data.txHash);

        if (data.isTerminal) {
          if (data.state === "COMPLETE" || data.state === "CONFIRMED") {
            return { txHash: data.txHash ?? null, state: data.state };
          }
          throw new Error(
            data.errorReason ?? `Transaction ${data.state?.toLowerCase()}`
          );
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      throw new Error("Transaction polling timed out");
    },
    []
  );

  const executeWallet = useCallback(
    async (params: CircleWriteParams): Promise<CircleWriteResult> => {
      // Build a single-item ABI from the human signature so wagmi/viem
      // can encode the call.
      const abiItem = parseAbiItem(`function ${params.abiFunctionSignature}`);
      if (abiItem.type !== "function") {
        throw new Error("Expected a function signature");
      }
      const args = coerceArgs(abiItem.inputs, params.abiParameters);

      setStatus("awaitingPin"); // for wallet users this is "waiting on MetaMask popup"
      const hash = await writeContractAsync({
        address: params.contractAddress as `0x${string}`,
        abi: [abiItem],
        functionName: abiItem.name,
        args,
      });
      setTxHash(hash);

      // Wait for chain confirmation.
      setStatus("confirming");
      if (!publicClient) {
        // No public client available - treat send as success.
        setStatus("success");
        return { txHash: hash, state: "SENT" };
      }
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus("success");
      return { txHash: hash, state: "CONFIRMED" };
    },
    [writeContractAsync, publicClient]
  );

  const executeCircle = useCallback(
    async (params: CircleWriteParams): Promise<CircleWriteResult> => {
      // 1. Create the contract-execution challenge server-side.
      setStatus("creating");
      const createRes = await fetch("/api/circle/tx/contract-execution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err?.error ?? "Could not create transaction");
      }
      const { challengeId, transactionId, userToken, encryptionKey } =
        await createRes.json();
      if (!challengeId || !userToken || !encryptionKey) {
        throw new Error("Incomplete challenge response from server");
      }

      // 2. Open the SDK iframe for PIN entry.
      setStatus("awaitingPin");
      await executeChallenge(challengeId, { userToken, encryptionKey });

      // 3. Poll for terminal state on-chain.
      setStatus("confirming");
      if (!transactionId) {
        setStatus("success");
        return { txHash: null, state: null };
      }
      const result = await pollStatus(transactionId);
      setStatus("success");
      return result;
    },
    [pollStatus]
  );

  const execute = useCallback(
    async (params: CircleWriteParams): Promise<CircleWriteResult> => {
      if (inFlight.current) {
        throw new Error("A transaction is already in progress");
      }
      inFlight.current = true;
      setError(null);
      setTxHash(null);

      try {
        if (user?.provider === "wallet") {
          return await executeWallet(params);
        }
        return await executeCircle(params);
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Transaction failed";
        setError(message);
        setStatus("error");
        throw err;
      } finally {
        inFlight.current = false;
      }
    },
    [user?.provider, executeWallet, executeCircle]
  );

  return {
    execute,
    reset,
    status,
    txHash,
    error,
    isPending: status === "creating" || status === "awaitingPin",
    isConfirming: status === "confirming",
    isSuccess: status === "success",
    isError: status === "error",
  };
}
