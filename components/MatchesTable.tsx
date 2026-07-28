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
import { ArrowUp, ArrowDown } from "lucide-react";

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

const getProbabilityColor = (probability: number) => {
  if (probability >= 70) return "bg-green-100 text-green-800";
  if (probability >= 50) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
};

const getStatusBadge = (status: string, matchResult?: string) => {
  if (status === "finished") {
    if (matchResult === "win")
      return <Badge className="bg-green-500">Win ✓</Badge>;
    if (matchResult === "loss")
      return <Badge className="bg-red-500">Loss ✗</Badge>;
    if (matchResult === "draw")
      return <Badge className="bg-gray-500">Draw</Badge>;
  }
  if (status === "live") return <Badge className="bg-red-600 animate-pulse">LIVE</Badge>;
  return <Badge variant="outline">Scheduled</Badge>;
};

export function MatchesTable({
  matches,
  sortBy,
  sortOrder,
  onSort,
}: MatchesTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 bg-gray-50">
            <TableHead className="px-6 py-3 text-left">
              <SortHeader
                label="Time & Status"
                field="time"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-6 py-3 text-left">
              <SortHeader
                label="League & Teams"
                field="league"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-6 py-3 text-left">
              Prediction / Tip
            </TableHead>
            <TableHead className="px-6 py-3 text-left">
              <SortHeader
                label="Probability %"
                field="probability"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-6 py-3 text-left">
              <SortHeader
                label="Odds (Koef.)"
                field="odds"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="px-6 py-3 text-left">Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, index) => (
            <TableRow
              key={match.id}
              className={`border-b border-gray-100 ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-blue-50`}
            >
              {/* Time & Status */}
              <TableCell className="px-6 py-4">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {match.kickOffTime}
                  </p>
                  <p className="text-sm text-gray-500">
                    {match.status === "finished" && match.score
                      ? `FT ${match.score}`
                      : match.status === "live"
                        ? "LIVE"
                        : "Scheduled"}
                  </p>
                </div>
              </TableCell>

              {/* League & Teams */}
              <TableCell className="px-6 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{match.league.badge || "🏆"}</span>
                    <span className="text-xs font-semibold text-gray-600">
                      {match.league.name}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">
                      {match.homeTeam.name}
                    </p>
                    <p className="text-gray-600">vs</p>
                    <p className="font-semibold text-gray-900">
                      {match.awayTeam.name}
                    </p>
                  </div>
                </div>
              </TableCell>

              {/* Prediction */}
              <TableCell className="px-6 py-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {match.prediction.outcome}
                </Badge>
              </TableCell>

              {/* Probability */}
              <TableCell className="px-6 py-4">
                <div className="space-y-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{
                        width: `${match.prediction.probability}%`,
                      }}
                    />
                  </div>
                  <Badge
                    className={`${getProbabilityColor(
                      match.prediction.probability
                    )}`}
                  >
                    {match.prediction.probability}%
                  </Badge>
                </div>
              </TableCell>

              {/* Odds */}
              <TableCell className="px-6 py-4">
                <Badge className="bg-amber-100 text-amber-900 text-base font-bold">
                  {match.odds.toFixed(2)}
                </Badge>
              </TableCell>

              {/* Result */}
              <TableCell className="px-6 py-4">
                {getStatusBadge(match.status, match.matchResult)}
              </TableCell>
            </TableRow>
          ))}
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
