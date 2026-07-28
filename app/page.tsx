"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { MatchesTable } from "@/components/MatchesTable";
import { useMatchData } from "@/hooks/useMatchData";
import { FilterState, Match } from "@/lib/types";

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDate(new Date()));
  const [lastGoodDate, setLastGoodDate] = useState<string>(selectedDate);
  const { data, isLoading, error, isLocal } =
    useMatchData(selectedDate);

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

  // Revert to the last good date if the new date fails to load
  useEffect(() => {
    if (error) {
      // If there's an error fetching the new date, revert to the last good one.
      setSelectedDate(lastGoodDate);
    } else if (!isLoading && data.length > 0) {
      // If data loads successfully, the current date is good.
      setLastGoodDate(selectedDate);
    }
  }, [error, isLoading, data, lastGoodDate, selectedDate]);

  // Memoized helper functions for performance
  const { getMainPrediction, getWinProbability, getMainOdds } = useMemo(() => {
    const getMainPrediction = (match: Match) => {
      const { probabilities, odds } = match;
      if (!probabilities || !odds) return { prediction: "N/A", probability: 0, odd: 0 };

      const betOptions = [
        { key: "home_win", prob: probabilities.home_win, odd: odds.home_win },
        { key: "away_win", prob: probabilities.away_win, odd: odds.away_win },
        { key: "draw", prob: probabilities.draw, odd: odds.draw },
        { key: "btts", prob: probabilities.btts, odd: odds.btts_yes },
        { key: "over_25", prob: probabilities.over_25, odd: odds.over_25 },
        { key: "over_15", prob: probabilities.over_15, odd: odds.over_15 },
        { key: "over_35", prob: probabilities.over_35, odd: odds.over_35 },
        { key: "fh_over_05", prob: probabilities.fh_over_05, odd: odds.fh_over_05 },
        { key: "fh_over_15", prob: probabilities.fh_over_15, odd: odds.fh_over_15 },
      ];

      const sortedOptions = betOptions
        .filter(option => option.prob && option.odd && parseFloat(option.odd) > 0)
        .sort((a, b) => b.prob! - a.prob!);

      const bestBet = sortedOptions.find(option => parseFloat(option.odd!) > 1.20) || sortedOptions[0];

      if (!bestBet) return { prediction: "N/A", probability: 0, odd: 0 };

      return {
        prediction: bestBet.key,
        probability: Math.min(bestBet.prob!, 96),
        odd: parseFloat(bestBet.odd!),
      };
    };

    const getWinProbability = (match: Match): number => {
      return getMainPrediction(match).probability;
    };

    const getMainOdds = (match: Match): number => {
      return getMainPrediction(match).odd;
    };

    return { getMainPrediction, getWinProbability, getMainOdds };
  }, []);

  const checkPredictionCorrect = useCallback((match: Match): boolean | null => {
    if (match.status !== "FT") return null;
    
    const { prediction } = getMainPrediction(match);
    const { home, away, ht_home, ht_away } = match.score;

    if (home === null || away === null) return null;

    const totalScore = home + away;
    const fhTotalScore = (ht_home ?? 0) + (ht_away ?? 0);

    switch (prediction) {
      case "home_win": return home > away;
      case "away_win": return away > home;
      case "draw": return home === away;
      case "btts": return home > 0 && away > 0;
      case "over_15": return totalScore > 1.5;
      case "over_25": return totalScore > 2.5;
      case "over_35": return totalScore > 3.5;
      case "fh_over_05": return fhTotalScore > 0.5;
      case "fh_over_15": return fhTotalScore > 1.5;
      // Note: Double chance (1X, X2, 12) are not included in getMainPrediction logic
      // but could be added here if needed.
      // case "home_or_draw": return home >= away;
      // case "away_or_draw": return away >= home;
      // case "home_or_away": return home !== away;
      default: return null;
    }
  }, [getMainPrediction]);

  const getTimeInMinutes = useCallback((kickoffTime: string): number => {
    const date = new Date(kickoffTime);
    return date.getHours() * 60 + date.getMinutes();
  }, []);

  // Apply filters
  const filteredMatches = useMemo(() => {
    // Filter out matches with no prediction
    let filtered = [...data].filter(
      (match) =>
        match.predictions?.result && match.predictions.result !== "N/A"
    );

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

    // Probability filter - use the probability of the predicted outcome
    filtered = filtered.filter((match) => {
      const winProb = getWinProbability(match);
      return winProb >= filters.minProbability;
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
  }, [data, filters, getMainOdds, getWinProbability, getTimeInMinutes]);

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
  }, [filteredMatches, sortBy, sortOrder, getWinProbability, getMainOdds]);

  const handleSort = (field: "time" | "league" | "probability" | "odds") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-2 sm:p-4 md:p-6">
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
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        <MatchesTable
          matches={sortedMatches}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          getMainPrediction={getMainPrediction}
          checkPredictionCorrect={checkPredictionCorrect}
        />
      </div>
    </main>
  );
}
