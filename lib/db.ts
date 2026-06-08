import { neon } from "@neondatabase/serverless";

// Single shared SQL client for serverless API routes. Uses the pooled
// Neon connection string from DATABASE_URL. The `neon()` helper is built
// for short-lived serverless invocations: no manual connect/disconnect.
//
// Usage:
//   const rows = await sql`SELECT * FROM users WHERE wallet_address = ${addr}`;
// Tagged-template params are automatically parameterized (safe from injection).

if (!process.env.DATABASE_URL) {
  // Fail loud at module load if the env var is missing, rather than getting
  // a confusing runtime error deep in a query.
  throw new Error(
    "DATABASE_URL is not set. Add the Neon pooled connection string to .env.local and Vercel env vars."
  );
}

export const sql = neon(process.env.DATABASE_URL);