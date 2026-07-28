"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/lib/types";
import { ArrowUp, ArrowDown, CheckCircle2, XCircle } from "lucide-react";

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

export function MatchesTable({
  matches,
  sortBy,
  sortOrder,
  onSort,
}: MatchesTableProps) {
  return (
    <div className="overflow-auto rounded-lg border border-gray-200 bg-white relative max-h-[70vh]">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-gray-50">
          <TableRow className="border-b border-gray-200 bg-gray-50">
            <TableHead className="px-6 py-3 text-left">
              <SortHeader
                label="Vrijeme & Status"
                field="time"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-6 py-3 text-left">
              <SortHeader
                label="Liga & Timovi"
                field="league"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-6 py-3 text-left">
              Predviđanje / Tip
            </TableHead>
            <TableHead className="px-6 py-3 text-left">
              <SortHeader
                label="Vjerojatnost %"
                field="probability"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-6 py-3 text-left">
              <SortHeader
                label="Kvota (Koef.)"
                field="odds"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-6 py-3 text-left">Rezultat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, index) => {
            const kickoffTime = new Date(match.kickoff).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const winProb = getWinProbability(match);
            const mainOdds = parseFloat(match.odds?.home_win || "0") || parseFloat(match.odds?.draw || "0") || parseFloat(match.odds?.away_win || "0") || 1.5;
            const predictionCorrect = checkPredictionCorrect(match);

            return (
              <TableRow
                key={match.match_id}
                className={`border-b border-gray-100 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50`}
              >
                {/* Time & Status */}
                <TableCell className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      {predictionCorrect === true && (
                        <CheckCircle2 className="h-6 w-6 text-green-600" title="Točno predviđanje" />
                      )}
                      {predictionCorrect === false && (
                        <XCircle className="h-6 w-6 text-red-600" title="Netočno predviđanje" />
                      )}
                      {predictionCorrect === null && (
                        <div className="h-6 w-6" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-center">{kickoffTime}</p>
                    <div className="flex justify-center">
                      {getStatusBadge(match.status, match.score)}
                    </div>
                  </div>
                </TableCell>

                {/* League & Teams */}
                <TableCell className="px-6 py-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-bold text-gray-600 uppercase">
                        {match.competition.name}
                      </span>
                      <p className="text-xs text-gray-500">{match.competition.country}</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">
                        {match.home_team.name}
                      </p>
                      <p className="text-xs text-gray-500">vs</p>
                      <p className="font-semibold text-gray-900">
                        {match.away_team.name}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Prediction */}
                <TableCell className="px-6 py-4">
                  <div className="space-y-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                      {match.predictions?.result?.toUpperCase() || "N/A"}
                    </Badge>
                    <p className="text-xs text-gray-600">
                      Score: {match.predictions?.correct_score || "—"}
                    </p>
                  </div>
                </TableCell>

                {/* Probability */}
                <TableCell className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full ${
                          winProb >= 70
                            ? "bg-green-500"
                            : winProb >= 50
                              ? "bg-yellow-500"
                              : "bg-orange-500"
                        }`}
                        style={{ width: `${winProb}%` }}
                      />
                    </div>
                    <Badge
                      className={`${
                        winProb >= 70
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
                <TableCell className="px-6 py-4">
                  <Badge className="bg-amber-100 text-amber-900 text-base font-bold">
                    {mainOdds.toFixed(2)}
                  </Badge>
                </TableCell>

                {/* Result */}
                <TableCell className="px-6 py-4">
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
            );
          })}
        </TableBody>
      </Table>

      {matches.length === 0 && (
        <div className="flex h-64 items-center justify-center text-gray-500">
          No matches found matching your filters.
        </div>
      )}
    </div>
  );
}
