// Profile store, Phase A.
//
// Stores per-wallet profile data in localStorage. Each wallet address has
// two distinct profiles, one as a project owner and one as a creator,
// because the same wallet can play both roles.
//
// Keys:
//   claimr:profile:project:<lowercased-address>   project owner profile
//   claimr:profile:creator:<lowercased-address>   creator profile
//
// Schema versions are tracked in case we need to migrate later. Phase B
// will migrate this to Vercel KV behind /api/profile/* routes. The shape
// of the data here is intentionally close to what those routes will
// accept, so the swap is a one-line change in each consumer.

const SCHEMA_VERSION = 1;

export interface ProjectProfile {
  schemaVersion: number;
  name: string;          // "ArcSwap Protocol"
  tagline: string;       // short pitch, < 80 chars
  website: string;       // https://...
  xHandle: string;       // @username, validated
  description: string;   // longer optional bio
  updatedAt: number;     // Date.now()
}

export interface CreatorProfile {
  schemaVersion: number;
  displayName: string;   // "jenzy.eth" or human name
  xHandle: string;       // @username
  bio: string;
  payoutAddress: string; // optional override, blank = use Circle wallet
  notifications: {
    newJobs: boolean;
    payments: boolean;
    deadlines: boolean;
  };
  updatedAt: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function key(role: "project" | "creator", address: string): string {
  return `claimr:profile:${role}:${address.toLowerCase()}`;
}

export function defaultProjectProfile(): ProjectProfile {
  return {
    schemaVersion: SCHEMA_VERSION,
    name: "",
    tagline: "",
    website: "",
    xHandle: "",
    description: "",
    updatedAt: 0,
  };
}

export function defaultCreatorProfile(): CreatorProfile {
  return {
    schemaVersion: SCHEMA_VERSION,
    displayName: "",
    xHandle: "",
    bio: "",
    payoutAddress: "",
    notifications: {
      newJobs: true,
      payments: true,
      deadlines: true,
    },
    updatedAt: 0,
  };
}

export function readProjectProfile(address: string | undefined): ProjectProfile {
  if (!address || !isBrowser()) return defaultProjectProfile();
  try {
    const raw = localStorage.getItem(key("project", address));
    if (!raw) return defaultProjectProfile();
    const parsed = JSON.parse(raw) as Partial<ProjectProfile>;
    return { ...defaultProjectProfile(), ...parsed };
  } catch {
    return defaultProjectProfile();
  }
}

export function writeProjectProfile(
  address: string,
  data: Partial<ProjectProfile>
): ProjectProfile {
  const merged: ProjectProfile = {
    ...defaultProjectProfile(),
    ...readProjectProfile(address),
    ...data,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: Date.now(),
  };
  if (isBrowser()) {
    localStorage.setItem(key("project", address), JSON.stringify(merged));
  }
  return merged;
}

export function readCreatorProfile(address: string | undefined): CreatorProfile {
  if (!address || !isBrowser()) return defaultCreatorProfile();
  try {
    const raw = localStorage.getItem(key("creator", address));
    if (!raw) return defaultCreatorProfile();
    const parsed = JSON.parse(raw) as Partial<CreatorProfile>;
    return { ...defaultCreatorProfile(), ...parsed };
  } catch {
    return defaultCreatorProfile();
  }
}

export function writeCreatorProfile(
  address: string,
  data: Partial<CreatorProfile>
): CreatorProfile {
  const merged: CreatorProfile = {
    ...defaultCreatorProfile(),
    ...readCreatorProfile(address),
    ...data,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: Date.now(),
  };
  if (isBrowser()) {
    localStorage.setItem(key("creator", address), JSON.stringify(merged));
  }
  return merged;
}

/**
 * Normalize an X handle. Strips leading @ if present, trims whitespace,
 * validates format. Returns the normalized handle with @ prefix, or empty
 * string if invalid or empty.
 */
export function normalizeXHandle(raw: string): string {
  const trimmed = raw.trim().replace(/^@+/, "");
  if (!trimmed) return "";
  if (!/^[A-Za-z0-9_]{1,15}$/.test(trimmed)) return "";
  return `@${trimmed}`;
}
