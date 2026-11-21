"use client";

import { useState, useEffect, useMemo } from "react";
import { Match } from "@/lib/types";
import { calculateBacktestStats } from "@/lib/betting";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ChevronDown, ChevronUp, TrendingUp, Trophy, Target } from "lucide-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface StatsPanelProps {
  currentMatches: Match[];
  selectedDate: string;
}

export function StatsPanel({ currentMatches, selectedDate }: StatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [historyMatches, setHistoryMatches] = useState<Match[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"day" | "history">("day");

  const dayStats = useMemo(
    () => calculateBacktestStats(currentMatches),
    [currentMatches]
  );

  const historyStats = useMemo(
    () => calculateBacktestStats(historyMatches),
    [historyMatches]
  );

  useEffect(() => {
    if (!isOpen || activeTab !== "history" || historyLoaded) return;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const manifestRes = await fetch(`${basePath}/data/manifest.json`);
        let dates: string[] = [];
        if (manifestRes.ok) {
          const manifest = await manifestRes.json();
          dates = Array.isArray(manifest.available_dates)
            ? manifest.available_dates
            : [];
        }

        // Take last 14 available dates (excluding today if empty)
        const recentDates = dates.slice(-14);
        const results = await Promise.all(
          recentDates.map(async (d) => {
            try {
              const res = await fetch(`${basePath}/data/matches_${d}.json`);
              if (!res.ok) return [];
              const json = await res.json();
              return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
            } catch {
              return [];
            }
          })
        );

        setHistoryMatches(results.flat());
        setHistoryLoaded(true);
      } catch {
        // Ignore manifest errors gracefully
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [isOpen, activeTab, historyLoaded]);

  const stats = activeTab === "day" ? dayStats : historyStats;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div
        className="flex flex-wrap items-center justify-between gap-2 p-4 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              AI Statistika & ROI (Backtest)
            </h2>
            <p className="text-xs text-gray-500">
              {dayStats.totalFinished > 0
                ? `${selectedDate}: ${dayStats.hits}/${dayStats.totalFinished} (${dayStats.hitRate.toFixed(1)}%) • ROI: ${dayStats.roiPercent >= 0 ? "+" : ""}${dayStats.roiPercent.toFixed(1)}%`
                : "Pregled uspješnosti AI prognoza i povrata (ROI)"}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="gap-1 text-gray-600">
          {isOpen ? (
            <>
              Sakrij <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Prikaži statistiku <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeTab === "day" ? "default" : "outline"}
              onClick={() => setActiveTab("day")}
            >
              Odabrani dan ({selectedDate})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "history" ? "default" : "outline"}
              onClick={() => setActiveTab("history")}
            >
              Zadnjih 14 dana
            </Button>
          </div>

          {activeTab === "history" && isLoadingHistory ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Učitavanje povijesnih rezultata...
            </div>
          ) : stats.totalFinished === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Nema završenih (FT) utakmica s prognozama za ovaj period.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Target className="h-3.5 w-3.5 text-blue-600" />
                    Točnost AI-a
                  </div>
                  <div className="mt-1 text-xl font-bold text-gray-900">
                    {stats.hitRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.hits} / {stats.totalFinished} pogođenih
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    Simulirani ROI
                  </div>
                  <div
                    className={`mt-1 text-xl font-bold ${
                      stats.roiPercent >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {stats.roiPercent >= 0 ? "+" : ""}
                    {stats.roiPercent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Profit: {stats.netProfit >= 0 ? "+" : ""}
                    {stats.netProfit.toFixed(1)}€ (ulog 10€/par)
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Trophy className="h-3.5 w-3.5 text-amber-600" />
                    Value Betovi (+EV)
                  </div>
                  <div
                    className={`mt-1 text-xl font-bold ${
                      stats.valueRoiPercent >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {stats.valueTotal > 0
                      ? `${stats.valueRoiPercent >= 0 ? "+" : ""}${stats.valueRoiPercent.toFixed(1)}%`
                      : "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.valueHits}/{stats.valueTotal} pogođenih +EV parova
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                  <div className="text-xs text-gray-500">Najbolji tip</div>
                  {stats.byMarket[0] ? (
                    <>
                      <div className="mt-1 text-sm font-bold text-gray-900 truncate">
                        {stats.byMarket[0].label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stats.byMarket[0].hitRate.toFixed(1)}% ({stats.byMarket[0].hits}/
                        {stats.byMarket[0].total})
                      </div>
                    </>
                  ) : (
                    <div className="mt-1 text-sm text-gray-400">N/A</div>
                  )}
                </div>
              </div>

              {stats.topLeagues.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-gray-600 mb-2">
                    Najprofitabilnije lige (min. 3 utakmice):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stats.topLeagues.map((l) => (
                      <Badge
                        key={l.league}
                        variant="outline"
                        className="bg-white text-xs font-normal py-1 px-2.5"
                      >
                        <span className="font-semibold mr-1">{l.league}:</span>
                        {l.hitRate.toFixed(0)}% ({l.hits}/{l.total}) •{" "}
                        <span
                          className={
                            l.roiPercent >= 0
                              ? "text-emerald-600 font-semibold ml-1"
                              : "text-red-600 font-semibold ml-1"
                          }
                        >
                          {l.roiPercent >= 0 ? "+" : ""}
                          {l.roiPercent.toFixed(0)}% ROI
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
