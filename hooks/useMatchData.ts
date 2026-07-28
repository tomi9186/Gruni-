"use client";

import { useState, useEffect } from "react";
import { Match } from "@/lib/types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function useMatchData(date: string) {
  const [data, setData] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocal, setIsLocal] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const path = `${basePath}/data/matches_${date}.json`;
      try {
        const response = await fetch(path);
        if (!response.ok) throw new Error("Failed to load local data");
        const json = await response.json();
        setData(json.data || json);
        setIsLocal(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [date]);

  return {
    data,
    isLoading,
    error,
    isLocal,
  };
}
