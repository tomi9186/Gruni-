"use client";

import { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { MatchesTable } from "@/components/MatchesTable";
import { useMatchData } from "@/hooks/useMatchData";
import { FilterState, Match } from "@/lib/types";

// Helper functions outside component
const getWinProbability = (match: Match): number => {
  if (!match?.predictions?.result) return 50;
  const prediction = match.predictions.result.toLowerCase();
  if (prediction.includes("1")) return match.probabilities?.home_win || 50;
  if (prediction.includes("2")) return match.probabilities?.away_win || 50;
  if (prediction.includes("x") || prediction.includes("draw")) return match.probabilities?.draw || 50;
  if (prediction.includes("over")) return match.probabilities?.over_25 || 50;
  return 50;
};

const getMainOdds = (match: Match): number => {
  const odds = match?.odds;
  if (!odds) return 1.5;
  const mainOdds = parseFloat(odds.home_win) || parseFloat(odds.draw) || parseFloat(odds.away_win) || 1.5;
  return mainOdds;
};

const getTimeInMinutes = (kickoffTime: string): number => {
  const date = new Date(kickoffTime);
  return date.getHours() * 60 + date.getMinutes();
};

const checkPredictionCorrect = (match: Match): boolean | null => {
  if (match.status !== "FT" || !match.predictions?.result) return null;
  
  const prediction = match.predictions.result.toLowerCase();
  const homeScore = match.score?.home ?? -1;
  const awayScore = match.score?.away ?? -1;
  
  if (homeScore === -1 || awayScore === -1) return null;
  
  if (prediction.includes("1")) {
    return homeScore > awayScore;
  }
  if (prediction.includes("2")) {
    return awayScore > homeScore;
  }
  if (prediction.includes("x") || prediction.includes("draw")) {
    return homeScore === awayScore;
  }
  if (prediction.includes("over2.5")) {
    return homeScore + awayScore > 2.5;
  }
  return null;
};

export default function Home() {
  const defaultDate = "2026-07-27";
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const { data, isLoading, error, isLocal } =
    useMatchData(defaultDate);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    minOdds: 1.0,
    maxOdds: 10.0,
    minProbability: 0,
    minTime: 0,
    maxTime: 1440,
    selectedLeagues: [],
  });

  const [sortBy, setSortBy] = useState<
    "time" | "league" | "probability" | "odds"
  >("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Get all unique leagues for the dropdown
  const allLeagues = useMemo(() => {
    const leagues = [...new Set(data.map(m => m.competition.name))];
    return leagues.sort();
  }, [data]);

  // Initialize selected leagues on first load
  useMemo(() => {
    if (allLeagues.length > 0 && filters.selectedLeagues.length === 0) {
      setFilters(prev => ({ ...prev, selectedLeagues: allLeagues }));
    }
  }, [allLeagues]);

  // Apply filters
  const filteredMatches = useMemo(() => {
    let filtered = [...data];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (match) =>
          match.home_team.name.toLowerCase().includes(query) ||
          match.away_team.name.toLowerCase().includes(query) ||
          match.competition.name.toLowerCase().includes(query)
      );
    }

    // Odds range filter
    filtered = filtered.filter((match) => {
      const odds = getMainOdds(match);
      return odds >= filters.minOdds && odds <= filters.maxOdds;
    });

    // Probability filter - use the highest probability from all outcomes
    filtered = filtered.filter((match) => {
      const probs = [
        match.probabilities?.home_win || 0,
        match.probabilities?.away_win || 0,
        match.probabilities?.draw || 0,
      ];
      const maxProb = Math.max(...probs);
      return maxProb >= filters.minProbability;
    });

    // Time filter
    filtered = filtered.filter((match) => {
      const timeInMinutes = getTimeInMinutes(match.kickoff);
      return timeInMinutes >= filters.minTime && timeInMinutes <= filters.maxTime;
    });

    // League filter
    if (filters.selectedLeagues.length > 0) {
      filtered = filtered.filter((match) =>
        filters.selectedLeagues.includes(match.competition.name)
      );
    }

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
          aVal = new Date(a.kickoff).getTime();
          bVal = new Date(b.kickoff).getTime();
          break;
        case "league":
          aVal = a.competition.name;
          bVal = b.competition.name;
          break;
        case "probability":
          aVal = getWinProbability(a);
          bVal = getWinProbability(b);
          break;
        case "odds":
          aVal = getMainOdds(a);
          bVal = getMainOdds(b);
          break;
        default:
          aVal = 0;
          bVal = 0;
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
          isLocal={isLocal}
          isLoading={isLoading}
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
          allLeagues={allLeagues}
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
