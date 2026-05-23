"use client";

import { useState } from "react";
import { SearchFilters } from "@/components/claimr/search-filters";
import { FeaturedJobs } from "@/components/claimr/featured-jobs";
import { LatestJobs } from "@/components/claimr/latest-jobs";

export function DiscoverFeed() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="space-y-8">
      <div data-tour-id="discover-search">
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>
      <div data-tour-id="discover-featured">
        <FeaturedJobs searchQuery={searchQuery} activeFilter={activeFilter} />
      </div>
      <div data-tour-id="discover-latest">
        <LatestJobs searchQuery={searchQuery} activeFilter={activeFilter} />
      </div>
    </div>
  );
}
