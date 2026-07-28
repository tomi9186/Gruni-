"use client";

import { useState } from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Match } from "@/lib/types";
import {
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";

interface MatchesTableProps {
  matches: Match[];
  sortBy: "time" | "league" | "probability" | "odds";
  sortOrder: "asc" | "desc";
  onSort: (field: "time" | "league" | "probability" | "odds") => void;
}

const SortHeader = ({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: string;
  onSort: (field: any) => void;
}) => (
  <button
    onClick={() => onSort(field)}
    className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
  >
    {label}
    {currentSort === field && (
      <>
        {currentOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </>
    )}
  </button>
);

const getStatusBadge = (status: string, score?: { home: number; away: number } | null) => {
  if (status === "FT") {
    return (
      <Badge className="bg-gray-600">
        FT {score ? `${score.home}-${score.away}` : ""}
      </Badge>
    );
  }
  if (status === "LIVE") return <Badge className="bg-red-600 animate-pulse">LIVE</Badge>;
  return <Badge variant="outline">Scheduled</Badge>;
};

const getWinProbability = (match: Match): number => {
  if (!match?.predictions?.result) return 50;
  const prediction = match.predictions.result.toLowerCase();
  if (prediction.includes("1")) return match.probabilities?.home_win || 50;
  if (prediction.includes("2")) return match.probabilities?.away_win || 50;
  if (prediction.includes("x") || prediction.includes("draw")) return match.probabilities?.draw || 50;
  if (prediction.includes("over")) return match.probabilities?.over_25 || 50;
  return 50;
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

const translatePrediction = (prediction: string | undefined): string => {
  if (!prediction) return "N/A";
  const p = prediction.toLowerCase();
  switch (p) {
    case "home_win": return "1";
    case "away_win": return "2";
    case "draw": return "X";
    case "home_or_draw": return "1X";
    case "away_or_draw": return "X2";
    case "home_or_away": return "12";
    case "over2.5": return "Više od 2.5";
    default: return prediction.toUpperCase();
  }
};

export function MatchesTable({
  matches,
  sortBy,
  sortOrder,
  onSort,
}: MatchesTableProps) {
  return (
    <div className="overflow-y-auto rounded-lg border border-gray-200 bg-white relative max-h-[70vh]">
      <table className="w-full caption-bottom text-sm">
        <TableHeader className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm">
          <TableRow className="border-b border-gray-200 bg-gray-50">
            <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">
              <SortHeader
                label="Vrijeme & Status"
                field="time"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">
              <SortHeader
                label="Liga & Timovi"
                field="league"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">
              Predviđanje / Tip
            </TableHead>
            <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6 hidden md:table-cell">
              Sve Oklade
            </TableHead>
            <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">
              <SortHeader
                label="Vjerojatnost %"
                field="probability"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">
              <SortHeader
                label="Kvota (Koef.)"
                field="odds"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">Rezultat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, index) => {
            const kickoffTime = new Date(match.kickoff).toLocaleTimeString(
              "hr-HR",
              { hour: "2-digit", minute: "2-digit" }
            );
            const winProb = getWinProbability(match);
            const predictionCorrect = checkPredictionCorrect(match);

            return (
              <MatchRow
                key={match.match_id}
                match={match}
                kickoffTime={kickoffTime}
                winProb={winProb}
                predictionCorrect={predictionCorrect}
                isEven={index % 2 === 0}
              />
            );
          })}
        </TableBody>
      </table>

      {matches.length === 0 && (
        <div className="flex h-64 items-center justify-center text-gray-500">
          No matches found matching your filters.
        </div>
      )}
    </div>
  );
}

function MatchRow({ match, kickoffTime, winProb, predictionCorrect, isEven }: { match: Match, kickoffTime: string, winProb: number, predictionCorrect: boolean | null, isEven: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const mainOdds = parseFloat(match.odds?.home_win || "0") || parseFloat(match.odds?.draw || "0") || parseFloat(match.odds?.away_win || "0") || 1.5;

  const allBets = [
    { label: "1", prob: match.probabilities?.home_win, odd: match.odds?.home_win },
    { label: "X", prob: match.probabilities?.draw, odd: match.odds?.draw },
    { label: "2", prob: match.probabilities?.away_win, odd: match.odds?.away_win },
    { label: "Oba daju gol", prob: match.probabilities?.btts, odd: match.odds?.btts_yes },
    { label: "Više od 1.5", prob: match.probabilities?.over_15, odd: match.odds?.over_15 },
    { label: "Više od 2.5", prob: match.probabilities?.over_25, odd: match.odds?.over_25 },
    { label: "Više od 3.5", prob: match.probabilities?.over_35, odd: match.odds?.over_35 },
    { label: "1. pol 0.5+", prob: match.probabilities?.fh_over_05, odd: match.odds?.fh_over_05 },
    { label: "1. pol 1.5+", prob: match.probabilities?.fh_over_15, odd: match.odds?.fh_over_15 },
    { label: "1X", prob: null, odd: match.odds?.dc_1x },
    { label: "X2", prob: null, odd: match.odds?.dc_x2 },
    { label: "12", prob: null, odd: match.odds?.dc_12 },
  ].filter(bet => bet.odd && parseFloat(bet.odd) > 0);

  return (
    <>
      <TableRow
        className={`border-b border-gray-100 ${
          isEven ? "bg-white" : "bg-gray-50"
        } hover:bg-blue-50/50`}
      >
        {/* Time & Status */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <div className="space-y-2">
            <div className="flex justify-center">
              {predictionCorrect === true && (
                <CheckCircle2 className="h-6 w-6 text-green-600" title="Točno predviđanje" />
              )}
              {predictionCorrect === false && (
                <XCircle className="h-6 w-6 text-red-600" title="Netočno predviđanje" />
              )}
              {predictionCorrect === null && <div className="h-6 w-6" />}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <p className="font-semibold text-gray-900 text-center">{kickoffTime}</p>
              <div className="flex justify-center">
                {getStatusBadge(match.status, match.score)}
              </div>
            </div>
          </div>
        </TableCell>

        {/* League & Teams */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <div className="space-y-2">
            <div>
              <span className="text-xs font-bold text-gray-600 uppercase">
                {match.competition.name}
              </span>
              <p className="text-xs text-gray-500">{match.competition.country}</p>
            </div>
            <div className="text-sm sm:text-base">
              <p className="font-semibold text-gray-900 text-sm">
                {match.home_team.name}
                <span className="font-normal text-gray-500 text-xs mx-1">vs</span>
                {match.away_team.name}
              </p>
            </div>
          </div>
        </TableCell>

        {/* Prediction */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <div className="space-y-1">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-sm">
              {translatePrediction(match.predictions?.result)}
            </Badge>
          </div>
        </TableCell>

        {/* All Bets Button */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6 hidden md:table-cell">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            Sve oklade
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        </TableCell>

        {/* Probability */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <div className="space-y-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full ${winProb >= 70
                    ? "bg-green-500"
                    : winProb >= 50
                      ? "bg-yellow-500"
                      : "bg-orange-500"
                  }`}
                style={{ width: `${winProb}%` }}
              />
            </div>
            <Badge
              className={`${winProb >= 70
                  ? "bg-green-100 text-green-800"
                  : winProb >= 50
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-orange-100 text-orange-800"
                }`}
            >
              {winProb}%
            </Badge>
          </div>
        </TableCell>

        {/* Odds */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <Badge className="bg-amber-100 text-amber-900 text-base font-bold">
            {mainOdds.toFixed(2)}
          </Badge>
        </TableCell>

        {/* Result */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          {match.status === "FT" ? (
            <Badge className="bg-gray-600">
              FT {match.score.home}-{match.score.away}
            </Badge>
          ) : match.status === "LIVE" ? (
            <Badge className="bg-red-600 animate-pulse">LIVE</Badge>
          ) : (
            <Badge variant="outline">NS</Badge>
          )}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-gray-100">
          <TableCell colSpan={7} className="p-4">
            <h4 className="font-semibold mb-2 text-gray-800">Sve dostupne oklade:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allBets.map(bet => (
                <div key={bet.label} className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <p className="font-bold text-gray-700">{bet.label}</p>
                  <div className="flex justify-center items-center gap-4 mt-1">
                    {bet.prob !== null && (
                      <Badge variant="secondary">{bet.prob}%</Badge>
                    )}
                    <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">{parseFloat(bet.odd!).toFixed(2)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
