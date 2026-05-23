// Server-side admin gate. Reads ADMIN_EMAILS from env (a comma-separated
// list of lowercased emails) and checks against the email in the session
// cookie. Use from any API route that performs admin writes.

import { cookies } from "next/headers";

const COOKIE_NAME = "claimr_session";

interface SessionData {
  userId?: string;
  email?: string;
}

function parseSession(value: string | undefined): SessionData | null {
  if (!value) return null;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    return JSON.parse(decoded) as SessionData;
  } catch {
    return null;
  }
}

function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export interface AdminCheckResult {
  ok: boolean;
  email?: string;
  reason?: string;
}

/**
 * Check whether the current request is from a signed-in admin.
 * Use from server-side API routes:
 *
 *   const check = await requireAdmin();
 *   if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 });
 */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const cookieStore = await cookies();
  const session = parseSession(cookieStore.get(COOKIE_NAME)?.value);
  if (!session?.email) return { ok: false, reason: "Not signed in" };

  const admins = parseAdminEmails();
  if (admins.length === 0) {
    return {
      ok: false,
      reason: "ADMIN_EMAILS env var is not configured",
    };
  }

  const userEmail = session.email.toLowerCase();
  if (!admins.includes(userEmail)) {
    return { ok: false, reason: "Not authorized" };
  }
  return { ok: true, email: userEmail };
}
