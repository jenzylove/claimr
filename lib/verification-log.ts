// In-memory verification reasoning store.
//
// The contract's verifyWork() takes no reasoning parameter, and rejectWork()
// stores the reason but the getJob() view doesn't return it. So if we want
// reasoning visibility on the dashboard, it has to live off-chain.
//
// This is a simple Map keyed by jobId. It survives within a single Vercel
// Lambda instance and is lost on cold start. For active hackathon demo
// sessions, this is sufficient. For v1, swap the Map for a Vercel KV client
// (10-line change) — the public API of this module stays the same.

export interface VerificationEntry {
  jobId: number;
  verified: boolean;
  reasoning: string;
  txHash?: string;
  timestamp: number;
}

const store = new Map<number, VerificationEntry>();

/**
 * Persist the AI's reasoning for a verification decision.
 * Call this from the verify API route after the AI returns and after the
 * on-chain verifyWork/rejectWork transaction has been signed.
 */
export function storeReasoning(
  jobId: number,
  verified: boolean,
  reasoning: string,
  txHash?: string
): void {
  store.set(jobId, {
    jobId,
    verified,
    reasoning,
    txHash,
    timestamp: Date.now(),
  });
}

/**
 * Fetch the stored reasoning for a job. Returns null if no log exists
 * (e.g. job was never verified, or the Lambda cold-started since).
 */
export function getReasoning(jobId: number): VerificationEntry | null {
  return store.get(jobId) || null;
}

/**
 * List all stored reasoning, newest first. Useful for an "AI activity feed"
 * view in a later batch.
 */
export function getAllReasoning(): VerificationEntry[] {
  return Array.from(store.values()).sort((a, b) => b.timestamp - a.timestamp);
}
