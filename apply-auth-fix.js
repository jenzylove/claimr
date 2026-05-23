/* eslint-disable no-console */
// apply-auth-fix.js
//
// Patches navbar + hero CTAs to use explicit mode= URL params so the
// onboarding flow knows whether the user is signing in or signing up.
//
//   Navbar "Sign in" button (when signed out)  -> /onboarding?mode=signin
//   Hero "I'm a Creator"                       -> /onboarding?role=creator&mode=signup
//   Hero "I'm a Project"                       -> /onboarding?role=project&mode=signup
//
// Idempotent. Self-deletes on success.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function editFile(relPath, edits, options = {}) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing file: ${relPath}`);
  }
  const original = fs.readFileSync(full, "utf8");
  const hadCRLF = original.includes("\r\n");
  let content = hadCRLF ? original.replace(/\r\n/g, "\n") : original;

  if (options.skipMarker && content.includes(options.skipMarker)) {
    console.log(`  - ${relPath} already patched, skipping`);
    return { changed: false };
  }

  for (const [i, { find, replace, name }] of edits.entries()) {
    if (replace !== "" && content.includes(replace) && !content.includes(find)) continue;
    if (!content.includes(find)) {
      throw new Error(
        `[${relPath}] edit #${i + 1} (${name}) - target not found.`
      );
    }
    content = content.replace(find, replace);
  }

  const finalContent = hadCRLF ? content.replace(/\n/g, "\r\n") : content;
  if (finalContent === original) return { changed: false };
  fs.writeFileSync(full, finalContent, "utf8");
  return { changed: true };
}

const patches = [
  {
    file: "components/claimr/navbar.tsx",
    skipMarker: "mode=signin",
    edits: [
      {
        name: "import useAuth",
        find: `import Link from "next/link";
import { Logo } from "@/components/claimr/logo";`,
        replace: `import Link from "next/link";
import { Logo } from "@/components/claimr/logo";
import { useAuth } from "@/lib/auth";`,
      },
      {
        name: "destructure auth state, derive launch target",
        find: `export function Navbar() {
  return (`,
        replace: `export function Navbar() {
  const { authenticated } = useAuth();
  const launchHref = authenticated ? "/dashboard/discover" : "/onboarding?mode=signin";
  return (`,
      },
      {
        name: "swap hardcoded /dashboard/discover for dynamic launchHref",
        find: `<Link href="/dashboard/discover" className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
          Launch App
        </Link>`,
        replace: `<Link href={launchHref} className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
          {authenticated ? "Launch App" : "Sign in"}
        </Link>`,
      },
    ],
  },

  {
    file: "components/claimr/hero.tsx",
    skipMarker: "mode=signup",
    edits: [
      {
        name: "creator CTA gets mode=signup",
        find: `<Link href="/onboarding?role=creator"`,
        replace: `<Link href="/onboarding?role=creator&mode=signup"`,
      },
      {
        name: "project CTA gets mode=signup",
        find: `<Link href="/onboarding?role=project"`,
        replace: `<Link href="/onboarding?role=project&mode=signup"`,
      },
    ],
  },
];

let totalChanged = 0;
let hadError = false;

console.log("");
console.log("Applying auth fix...");
console.log("");

for (const { file, edits, skipMarker } of patches) {
  try {
    const { changed } = editFile(file, edits, { skipMarker });
    if (changed) {
      totalChanged++;
      console.log(`  + ${file}`);
    }
  } catch (err) {
    hadError = true;
    console.error(`  ! ${file}`);
    console.error(`    ${err.message}`);
  }
}

console.log("");
if (hadError) {
  console.log(`Auth fix failed. ${totalChanged} file(s) changed before the error.`);
  process.exit(1);
}

console.log(`Auth fix patches applied. ${totalChanged} file(s) changed.`);
console.log("");
console.log("Drop-in files from this zip (already in place after extract):");
console.log("  app/providers.tsx                                  REBUILT");
console.log("  app/api/circle/onboard/route.ts                    REBUILT");
console.log("  components/claimr/onboarding-cards.tsx             REBUILT");
console.log("");

process.on("exit", (code) => {
  if (code === 0) {
    try {
      fs.unlinkSync(__filename);
    } catch (_) {}
  }
});
