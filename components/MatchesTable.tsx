"use client";

import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";
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
import { Match, Predictions } from "@/lib/types";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";

interface MatchesTableProps {
  matches: Match[];
  sortBy: "time" | "league" | "probability" | "odds";
  sortOrder: "asc" | "desc";
  onSort: (field: "time" | "league" | "probability" | "odds") => void;
  getMainPrediction: (match: Match) => { prediction: string; probability: number; odd: number };
  checkPredictionCorrect: (match: Match) => boolean | null;
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
  switch (status) {
    case "FT":
      return (
        <Badge className="bg-gray-600 text-white">
          FT {score ? `${score.home}-${score.away}` : ""}
        </Badge>
      );
    case "LIVE":
      return <Badge className="bg-red-600 text-white animate-pulse">LIVE</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-800">NS</Badge>;
  }
};

const FormBadge = ({ result }: { result: string }) => {
  const baseClasses = "w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white";
  if (result === "W") {
    return (
      <div className={`${baseClasses} bg-green-500`} title="Pobjeda">P</div>
    );
  }
  if (result === "D") {
    return <div className={`${baseClasses} bg-gray-400`} title="Neriješeno">N</div>;
  }
  return <div className={`${baseClasses} bg-red-500`} title="Izgubljeno">I</div>;
};

const translatePrediction = (prediction: string | undefined): string => {
  if (!prediction) return "N/A";
  switch (prediction) {
    case "home_win": return "1";
    case "away_win": return "2";
    case "draw": return "X";
    case "home_or_draw": return "1X";
    case "away_or_draw": return "X2";
    case "home_or_away": return "12";
    case "btts": return "Oba daju gol";
    case "over_15": return "Više od 1.5";
    case "over_25": return "Više od 2.5";
    case "over_35": return "Više od 3.5";
    case "fh_over_05": return "1. pol 0.5+";
    case "fh_over_15": return "1. pol 1.5+";
    default: return prediction.toUpperCase();
  }
};

export function MatchesTable({
  matches,
  sortBy,
  sortOrder,
  onSort,
  getMainPrediction,
  checkPredictionCorrect,
}: MatchesTableProps) {
  return (
    <>
      {/* Mobile Sort Controls */}
      <div className="md:hidden mb-4 flex items-center gap-2">
        <ShadSelect value={sortBy} onValueChange={(value) => onSort(value as any)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sortiraj po..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time">Vrijeme početka</SelectItem>
            <SelectItem value="probability">Vjerojatnost</SelectItem>
            <SelectItem value="odds">Kvota</SelectItem>
            <SelectItem value="league">Liga</SelectItem>
          </SelectContent>
        </ShadSelect>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onSort(sortBy)}
        >
          {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-y-auto rounded-lg border border-gray-200 bg-white relative max-h-[70vh]">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm">
            <TableRow className="border-b border-gray-200 bg-gray-50">
              <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">
                <SortHeader label="Vrijeme & Status" field="time" currentSort={sortBy} currentOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">
                <SortHeader label="Liga & Timovi" field="league" currentSort={sortBy} currentOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">Predviđanje / Tip</TableHead>
              <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">
                <SortHeader label="Vjerojatnost %" field="probability" currentSort={sortBy} currentOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="px-2 py-3 text-left sm:px-4 md:px-6">
                <SortHeader label="Kvota (Koef.)" field="odds" currentSort={sortBy} currentOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="px-1 py-3 text-center sm:px-2">
                <span className="sr-only">Proširi</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match, index) => (
              <MatchRow // kickoffTime is now calculated inside MatchRow
                key={match.match_id}
                match={match}
                mainPrediction={getMainPrediction(match)}
                predictionResult={checkPredictionCorrect(match)}
                isEven={index % 2 === 0}
              />
            ))}
          </TableBody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {matches.map((match) => (
          <MatchCard
            key={match.match_id}
            match={match}
            mainPrediction={getMainPrediction(match)}
            predictionResult={checkPredictionCorrect(match)}
          />
        ))}
      </div>

      {matches.length === 0 && (
        <div className="flex h-48 items-center justify-center text-gray-500 bg-white rounded-lg border">
          Nema utakmica koje odgovaraju filterima.
        </div>
      )}
    </>
  );
}

function MatchRow({ match, mainPrediction, predictionResult, isEven }: { 
  match: Match, 
  mainPrediction: { prediction: string; probability: number; odd: number },
  predictionResult: boolean | null,
  isEven: boolean 
}) {
  const [expanded, setExpanded] = useState(false);
  const kickoffTime = new Date(match.kickoff).toLocaleTimeString(
    "hr-HR",
    { hour: "2-digit", minute: "2-digit" }
  );

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
        className={`border-b border-gray-100 hover:bg-blue-50/50 ${
          predictionResult === true ? 'bg-green-50/50' : 
          predictionResult === false ? 'bg-red-50/50' : 
          isEven ? "bg-white" : "bg-gray-50"}`}
      >
        {/* Time & Status */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="font-semibold text-gray-900 text-center">{kickoffTime}</p>
            <div className="flex justify-center">
              <div className="flex justify-center">
                {getStatusBadge(match.status, match.score)}
              </div>
            </div>
          </div>
        </TableCell>

        {/* League & Teams */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <div className="space-y-1">
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
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-medium text-gray-500">Forma:</span>
                {match.form.home.split('').map((r, i) => <FormBadge key={`h-${i}`} result={r} />)}
                <span className="mx-1 text-gray-300">|</span>
                {match.form.away.split('').map((r, i) => <FormBadge key={`a-${i}`} result={r} />)}
              </div>
            </div>
          </div>
        </TableCell>

        {/* Prediction */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <div className="space-y-1">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-sm">
              {translatePrediction(mainPrediction.prediction)}
            </Badge>
          </div>
        </TableCell>

        {/* Probability */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <div className="space-y-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full ${mainPrediction.probability >= 70
                    ? "bg-green-500"
                    : mainPrediction.probability >= 50
                      ? "bg-yellow-500"
                      : "bg-orange-500"
                  }`}
                style={{ width: `${mainPrediction.probability}%` }}
              />
            </div>
            <Badge
              className={`${mainPrediction.probability >= 70
                  ? "bg-green-100 text-green-800"
                  : mainPrediction.probability >= 50
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-orange-100 text-orange-800"
                }`}
            >
              {mainPrediction.probability}%
            </Badge>
          </div>
        </TableCell>

        {/* Odds */}
        <TableCell className="px-2 py-2 sm:py-4 sm:px-4 md:px-6">
          <Badge className="bg-amber-100 text-amber-900 text-base font-bold">
            {mainPrediction.odd.toFixed(2)}
          </Badge>
        </TableCell>

        {/* All Bets Button */}
        <TableCell className="px-1 py-2 text-center sm:px-2">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 bg-gray-100 hover:bg-gray-200" onClick={() => setExpanded(!expanded)}>
            <ChevronDown className={`h-5 w-5 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
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

function MatchCard({ match, mainPrediction, predictionResult }: {
  match: Match,
  mainPrediction: { prediction: string; probability: number; odd: number },
  predictionResult: boolean | null
}) {
  const [expanded, setExpanded] = useState(false);
  const kickoffTime = new Date(match.kickoff).toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });

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
    <div className={`rounded-lg border bg-white p-3 shadow-sm ${
      predictionResult === true ? 'border-green-300 bg-green-100/50' : 
      predictionResult === false ? 'border-red-300 bg-red-100/50' : 
      'border-gray-200'
    }`}>
      {/* Card Header */}
      <div className="flex justify-between items-center text-xs mb-2">
        <div className="font-semibold text-gray-700">
          <p>{match.competition.name}</p>
          <p className="text-gray-500 font-normal">{match.competition.country}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-800">{kickoffTime}</p>
          {getStatusBadge(match.status, match.score)}
        </div>
      </div>

      {/* Teams and Form */}
      <div className="text-sm font-semibold text-center my-2">
        {match.home_team.name}
        <span className="font-normal text-gray-500 text-xs mx-2">vs</span>
        {match.away_team.name}
      </div>
      <div className="flex justify-center items-center gap-1 text-xs mb-3">
        {match.form.home.split('').map((r, i) => <FormBadge key={`h-${i}`} result={r} />)}
        <span className="mx-2 text-gray-300">|</span>
        {match.form.away.split('').map((r, i) => <FormBadge key={`a-${i}`} result={r} />)}
      </div>

      {/* Main Prediction Info */}
      <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-gray-100 py-2">
        <div>
          <p className="text-xs text-gray-500">Tip</p>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-bold">
            {translatePrediction(mainPrediction.prediction)}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-gray-500">Vjer.</p>
          <Badge
            className={`font-bold ${mainPrediction.probability >= 70
                ? "bg-green-100 text-green-800"
                : mainPrediction.probability >= 50
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-orange-100 text-orange-800"
              }`}
          >
            {mainPrediction.probability}%
          </Badge>
        </div>
        <div>
          <p className="text-xs text-gray-500">Kvota</p>
          <Badge className="bg-amber-100 text-amber-900 font-bold">
            {mainPrediction.odd.toFixed(2)}
          </Badge>
        </div>
      </div>

      {/* Expand Button */}
      <div className="text-center mt-2">
        <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-gray-700" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Sakrij sve oklade' : 'Prikaži sve oklade'}
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-3 pt-3 border-t">
          <h4 className="font-semibold mb-2 text-sm text-gray-800">Sve dostupne oklade:</h4>
          <div className="grid grid-cols-2 gap-3">
            {allBets.map(bet => (
              <div key={bet.label} className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="font-bold text-sm text-gray-700">{bet.label}</p>
                <div className="flex justify-center items-center gap-2 mt-1">
                  {bet.prob !== null && <Badge variant="secondary" className="text-xs">{bet.prob}%</Badge>}
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-xs">{parseFloat(bet.odd!).toFixed(2)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
