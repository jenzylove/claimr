"use client";

import { useState } from "react";
import { Clock, Users, Diamond, ChevronDown, ChevronUp, Flame } from "lucide-react";
import type { Job } from "@/lib/useJobs";
import { getJobCategory } from "@/lib/jobFilters";
import { isPlatformJob } from "@/lib/admin-jobs";

interface JobCardProps {
  job: Job;
  variant?: "featured" | "latest";
  // Accent color for the avatar tile (Latest cycles through a palette).
  accentColor?: string;
  // Number of open slots for this job group (Latest). Omit/1 for single jobs.
  slotCount?: number;
  onClaim: () => void;
  isClaiming: boolean;
}

function getDaysLeft(deadline: number): number {
  return Math.max(
    0,
    Math.ceil((deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
  );
}

export function JobCard({
  job,
  variant = "latest",
  accentColor = "#FF2D7A",
  slotCount = 1,
  onClaim,
  isClaiming,
}: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const daysLeft = getDaysLeft(job.deadline);
  const isUrgent = daysLeft > 0 && daysLeft <= 2;
  const isFeatured = variant === "featured";
  const platform = isPlatformJob(job.project);
  const category = getJobCategory(job);

  // Criteria preview: collapsed shows a clamped line, expanded shows full text.
  const hasLongCriteria = job.criteria.length > 80;

  const projectShort = `${job.project.slice(0, 6)}...${job.project.slice(-4)}`;
  const avatarLetters = job.project.slice(2, 4).toUpperCase();

  const Tag = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <span
      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-semibold ${className}`}
    >
      {children}
    </span>
  );

  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold"
        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
      >
        {avatarLetters}
      </div>

      <div className="flex-1 min-w-0">
        {/* Top row: project + amount */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground font-mono truncate">
            {projectShort}
          </p>
          <span className="shrink-0 text-base font-bold text-green-400">
            {job.amount} USDC
          </span>
        </div>

        {/* Title + tags */}
        <h3 className="mt-1 font-semibold text-foreground flex items-center gap-2 flex-wrap">
          {job.title}
          {platform && (
            <Tag className="bg-gradient-to-r from-[#FF2D7A]/15 to-[#2D6EFF]/15 text-[#FF2D7A] border border-[#FF2D7A]/30">
              Platform
            </Tag>
          )}
          {category && (
            <Tag className="bg-white/10 text-white/80 border border-white/20">
              {category}
            </Tag>
          )}
          {slotCount > 1 && (
            <Tag className="bg-white/10 text-white/80 border border-white/20 inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {slotCount} slots open
            </Tag>
          )}
        </h3>

        {/* Meta row: deadline + urgency */}
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
          </span>
          {isUrgent && (
            <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
              <Flame className="h-3.5 w-3.5" />
              Ending soon
            </span>
          )}
        </div>

        {/* Criteria: clamped when collapsed, full when expanded */}
        <div className="mt-3">
          <p
            className={`text-sm text-muted-foreground ${
              expanded ? "" : "line-clamp-1"
            }`}
          >
            <span className="text-foreground/70 font-medium">Criteria: </span>
            {job.criteria}
          </p>

          {hasLongCriteria && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#2D6EFF] hover:text-[#2D6EFF]/80 transition-colors"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Show more <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Action row */}
        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={onClaim}
            disabled={isClaiming}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              isFeatured
                ? "bg-[#FF2D7A] hover:bg-[#FF2D7A]/90"
                : "bg-[#FF2D7A] hover:bg-[#FF2D7A]/90"
            }`}
          >
            {isClaiming ? "Claiming..." : "Claim Job"}
          </button>
        </div>
      </div>
    </div>
  );
}