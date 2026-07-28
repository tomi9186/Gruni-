"use client";

import { useState, useEffect } from "react";
import { Match, MatchDataState } from "@/lib/types";

export function useMatchData(date: string) {
  const [state, setState] = useState<MatchDataState>({
    data: [],
    isLoading: false,
    error: null,
    isLocal: false,
  });

  const loadLocalData = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch(`/data/matches_${date}.json`);
      if (!response.ok) throw new Error("Failed to load local data");
      const data = await response.json();
      setState({
        data,
        isLoading: false,
        error: null,
        isLocal: true,
      });
    } catch (err) {
      setState({
        data: [],
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load data",
        isLocal: false,
      });
    }
  };

  const fetchFromApi = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      // Simulated API call - replace with actual API endpoint
      const response = await fetch(
        `https://api.betminer.com/matches?date=${date}`
      );
      if (!response.ok) throw new Error("Failed to fetch from API");
      const data = await response.json();
      setState({
        data,
        isLoading: false,
        error: null,
        isLocal: false,
      });
    } catch (err) {
      // Fallback to local data if API fails
      await loadLocalData();
    }
  };

  useEffect(() => {
    loadLocalData();
  }, [date]);

  return {
    ...state,
    fetchFromApi,
  };
}
