"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { MatchesTable, SortField } from "@/components/MatchesTable";
import { StatsPanel } from "@/components/StatsPanel";
import { SlipBuilder } from "@/components/SlipBuilder";
import { useMatchData } from "@/hooks/useMatchData";
import { FilterState } from "@/lib/types";
import { getMainPrediction, checkPredictionCorrect } from "@/lib/betting";

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatDate(new Date())
  );
  const [lastGoodDate, setLastGoodDate] = useState<string>(selectedDate);
  const { data, isLoading, error, isLocal } = useMatchData(selectedDate);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    minOdds: 1.0,
    maxOdds: 10.0,
    minProbability: 0,
    minValue: -100,
    onlyValueBets: false,
    minTime: 0,
    maxTime: 1440,
    selectedLeagues: [],
  });

  const [sortBy, setSortBy] = useState<SortField>("Vrijeme početka");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Get all unique leagues for the dropdown
  const allLeagues = useMemo(() => {
    const leagues = [...new Set(data.map((m) => m.competition.name))];
    return leagues.sort();
  }, [data]);

  // Initialize selected leagues on first load
  useEffect(() => {
    if (allLeagues.length > 0 && filters.selectedLeagues.length === 0) {
      setFilters((prev) => ({ ...prev, selectedLeagues: allLeagues }));
    }
  }, [allLeagues, filters.selectedLeagues.length]);

  // Revert to the last good date if the new date fails to load
  useEffect(() => {
    if (error) {
      setSelectedDate(lastGoodDate);
    } else if (!isLoading && data.length > 0) {
      setLastGoodDate(selectedDate);
    }
  }, [error, isLoading, data, lastGoodDate, selectedDate]);

  const getTimeInMinutes = useCallback((kickoffTime: string): number => {
    const date = new Date(kickoffTime);
    return date.getHours() * 60 + date.getMinutes();
  }, []);

  // Apply filters
  const filteredMatches = useMemo(() => {
    let filtered = [...data].filter(
      (match) =>
        match.probabilities !== null &&
        match.odds !== null &&
        (!match.predictions?.result || match.predictions.result !== "N/A")
    );

    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (match) =>
          match.home_team.name.toLowerCase().includes(query) ||
          match.away_team.name.toLowerCase().includes(query) ||
          match.competition.name.toLowerCase().includes(query)
      );
    }

    filtered = filtered.filter((match) => {
      const pred = getMainPrediction(match);
      if (pred.prediction === "N/A") return false;
      if (pred.odd < filters.minOdds || pred.odd > filters.maxOdds) return false;
      if (pred.probability < filters.minProbability) return false;
      if (filters.onlyValueBets && pred.valuePercent <= 0) return false;
      if (filters.minValue > -100 && pred.valuePercent < filters.minValue)
        return false;
      return true;
    });

    filtered = filtered.filter((match) => {
      const timeInMinutes = getTimeInMinutes(match.kickoff);
      return (
        timeInMinutes >= filters.minTime && timeInMinutes <= filters.maxTime
      );
    });

    if (filters.selectedLeagues.length > 0) {
      filtered = filtered.filter((match) =>
        filters.selectedLeagues.includes(match.competition.name)
      );
    }

    return filtered;
  }, [data, filters, getTimeInMinutes]);

  // Apply sorting
  const sortedMatches = useMemo(() => {
    const sorted = [...filteredMatches];
    sorted.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortBy) {
        case "Vrijeme početka":
          aVal = new Date(a.kickoff).getTime();
          bVal = new Date(b.kickoff).getTime();
          break;
        case "Liga":
          aVal = a.competition.name;
          bVal = b.competition.name;
          break;
        case "Vjerojatnost":
          aVal = getMainPrediction(a).probability;
          bVal = getMainPrediction(b).probability;
          break;
        case "Kvota":
          aVal = getMainPrediction(a).odd;
          bVal = getMainPrediction(b).odd;
          break;
        case "Value":
          aVal = getMainPrediction(a).valuePercent;
          bVal = getMainPrediction(b).valuePercent;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [filteredMatches, sortBy, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "Vjerojatnost" || field === "Value" ? "desc" : "asc");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-2 sm:p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header isLocal={isLocal} isLoading={isLoading} />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Error loading data:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SlipBuilder matches={filteredMatches} />
          <StatsPanel currentMatches={data} selectedDate={selectedDate} />
        </div>

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
