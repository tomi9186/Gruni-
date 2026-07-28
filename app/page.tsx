"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { MatchesTable } from "@/components/MatchesTable";
import { useMatchData } from "@/hooks/useMatchData";
import { FilterState, Match } from "@/lib/types";

export default function Home() {
  const defaultDate = "2026-07-27";
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    oddsFilter: "all",
    minOdds: 1.0,
    maxOdds: 5.0,
    minProbability: 0,
  });
  const [sortBy, setSortBy] = useState<
    "time" | "league" | "probability" | "odds"
  >("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data, isLoading, error, isLocal, fetchFromApi } =
    useMatchData(selectedDate);

  // Apply filters
  const filteredMatches = useMemo(() => {
    let filtered = [...data];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (match) =>
          match.homeTeam.name.toLowerCase().includes(query) ||
          match.awayTeam.name.toLowerCase().includes(query) ||
          match.league.name.toLowerCase().includes(query)
      );
    }

    // Odds filters
    if (filters.oddsFilter === "1.30") {
      filtered = filtered.filter((match) => match.odds > 1.3);
    } else if (filters.oddsFilter === "1.60-1.80") {
      filtered = filtered.filter(
        (match) => match.odds >= 1.6 && match.odds <= 1.8
      );
    } else if (filters.oddsFilter === "2.00") {
      filtered = filtered.filter((match) => match.odds > 2.0);
    }

    // Custom odds range
    filtered = filtered.filter(
      (match) => match.odds >= filters.minOdds && match.odds <= filters.maxOdds
    );

    // Probability filter
    filtered = filtered.filter(
      (match) => match.prediction.probability >= filters.minProbability
    );

    return filtered;
  }, [data, filters]);

  // Apply sorting
  const sortedMatches = useMemo(() => {
    const sorted = [...filteredMatches];
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case "time":
          aVal = a.kickOffTime;
          bVal = b.kickOffTime;
          break;
        case "league":
          aVal = a.league.name;
          bVal = b.league.name;
          break;
        case "probability":
          aVal = a.prediction.probability;
          bVal = b.prediction.probability;
          break;
        case "odds":
          aVal = a.odds;
          bVal = b.odds;
          break;
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [filteredMatches, sortBy, sortOrder]);

  const handleSort = (field: "time" | "league" | "probability" | "odds") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isLocal={isLocal}
          isLoading={isLoading}
          onFetchApi={fetchFromApi}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Error loading data:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          matchCount={sortedMatches.length}
          totalCount={data.length}
        />

        <MatchesTable
          matches={sortedMatches}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>
    </main>
  );
}
