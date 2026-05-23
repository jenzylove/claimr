"use client";

import { Search } from "lucide-react";

const filters = ["All", "KOL", "Writing", "Design", "Dev"];

interface Props {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
}

export function SearchFilters({
  searchQuery = "",
  onSearchChange,
  activeFilter = "All",
  onFilterChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search jobs, projects, categories..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-[#FF2D7A]/50 focus:outline-none focus:ring-1 focus:ring-[#FF2D7A]/50"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto sm:overflow-visible">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange?.(filter)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeFilter === filter
                ? "bg-[#FF2D7A] text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
