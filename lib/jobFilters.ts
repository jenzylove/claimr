import type { Job } from "./useJobs";

// Category keyword heuristics. The smart contract has no category field on Job,
// so we match against the title + criteria. Keywords are intentionally generous
// because criteria text varies a lot per poster.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  KOL: [
    "kol",
    "tweet",
    "thread",
    "shill",
    "promo",
    "promotion",
    "promote",
    "marketing",
    "campaign",
    "ambassador",
    "shoutout",
    "raid",
  ],
  Writing: [
    "write",
    "writing",
    "article",
    "blog",
    "copywriting",
    "copy",
    "newsletter",
    "essay",
    "longform",
    "content",
    "documentation",
    "docs",
  ],
  Design: [
    "design",
    "logo",
    "ui",
    "ux",
    "graphic",
    "illustrat",
    "branding",
    "icon",
    "figma",
    "mockup",
    "banner",
    "poster",
    "thumbnail",
  ],
  Dev: [
    "dev",
    "develop",
    "code",
    "coding",
    "build",
    "smart contract",
    "solidity",
    "frontend",
    "backend",
    "fullstack",
    "integration",
    "api",
    "script",
    "bot",
    "react",
    "next.js",
    "node",
  ],
};

function matchesSearch(job: Job, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    job.title.toLowerCase().includes(q) ||
    job.criteria.toLowerCase().includes(q) ||
    job.project.toLowerCase().includes(q)
  );
}

function matchesCategory(job: Job, filter: string): boolean {
  if (!filter || filter === "All") return true;
  const keywords = CATEGORY_KEYWORDS[filter];
  if (!keywords) return true;
  const haystack = `${job.title} ${job.criteria}`.toLowerCase();
  return keywords.some((k) => haystack.includes(k));
}

export interface JobFilters {
  search?: string;
  category?: string;
}

/**
 * Filter open jobs (status === 0) by search query and category, then sort
 * newest first (highest contract id first). Returns a new array; does not
 * mutate the input.
 */
export function filterAndSortOpenJobs(
  jobs: Job[],
  filters: JobFilters = {}
): Job[] {
  return jobs
    .filter((j) => j.status === 0)
    .filter((j) => matchesSearch(j, filters.search ?? ""))
    .filter((j) => matchesCategory(j, filters.category ?? "All"))
    .sort((a, b) => b.id - a.id);
}

export function hasActiveFilters(filters: JobFilters): boolean {
  const hasSearch = Boolean(filters.search?.trim());
  const hasCategory = filters.category && filters.category !== "All";
  return Boolean(hasSearch || hasCategory);
}
