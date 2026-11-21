"use client";

import { useState, useMemo } from "react";
import { Match } from "@/lib/types";
import { generateBettingSlip } from "@/lib/betting";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Ticket,
} from "lucide-react";

interface SlipBuilderProps {
  matches: Match[];
}

export function SlipBuilder({ matches }: SlipBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetOdds, setTargetOdds] = useState(4.0);
  const [maxLegs, setMaxLegs] = useState(3);
  const [minProbability, setMinProbability] = useState(60);
  const [onlyValueBets, setOnlyValueBets] = useState(false);
  const [seedOffset, setSeedOffset] = useState(0);
  const [copied, setCopied] = useState(false);

  const slip = useMemo(
    () =>
      generateBettingSlip(matches, {
        targetOdds,
        maxLegs,
        minProbability,
        onlyValueBets,
        onlyUpcoming: true,
        seedOffset,
      }),
    [matches, targetOdds, maxLegs, minProbability, onlyValueBets, seedOffset]
  );

  const handleCopy = async () => {
    if (!slip) return;
    const lines = [
      `🎫 Gruni AI Listić (Kvota: ${slip.totalOdds.toFixed(2)} | Šansa: ${slip.combinedProbability.toFixed(1)}%)`,
      "--------------------------------",
      ...slip.items.map(
        (item, idx) =>
          `${idx + 1}. ${item.match.home_team.name} - ${item.match.away_team.name}\n   Tip: ${item.prediction.label} | Kvota: ${item.prediction.odd.toFixed(2)} | AI: ${item.prediction.probability}%`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  return (
    <div className="rounded-lg border border-indigo-200 bg-gradient-to-r from-white to-indigo-50/40 shadow-sm">
      <div
        className="flex flex-wrap items-center justify-between gap-2 p-4 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <Ticket className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              AI Generator Listića
              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px]">
                NOVO
              </Badge>
            </h2>
            <p className="text-xs text-gray-500">
              Automatski složi optimalan listić po ciljanoj kvoti i AI vjerojatnosti
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="gap-1 text-indigo-700">
          {isOpen ? (
            <>
              Zatvori <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Složi listić <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="border-t border-indigo-100 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Ciljana kvota: <span className="text-indigo-600">{targetOdds.toFixed(1)}</span>
              </label>
              <Slider
                value={[targetOdds]}
                onValueChange={(v) => setTargetOdds(Array.isArray(v) ? v[0] : (v as number))}
                min={1.5}
                max={20}
                step={0.5}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Maksimalno parova: <span className="text-indigo-600">{maxLegs}</span>
              </label>
              <Slider
                value={[maxLegs]}
                onValueChange={(v) => setMaxLegs(Array.isArray(v) ? v[0] : (v as number))}
                min={2}
                max={6}
                step={1}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Min. AI šansa po paru: <span className="text-indigo-600">{minProbability}%</span>
              </label>
              <Slider
                value={[minProbability]}
                onValueChange={(v) => setMinProbability(Array.isArray(v) ? v[0] : (v as number))}
                min={40}
                max={85}
                step={5}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyValueBets}
                  onChange={(e) => setOnlyValueBets(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Samo Value Betovi (+EV)
              </label>
              <Button
                size="sm"
                onClick={() => setSeedOffset((s) => s + 1)}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Novi prijedlog
              </Button>
            </div>
          </div>

          {!slip ? (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              Nema dovoljno utakmica koje zadovoljavaju zadane uvjete. Pokušaj smanjiti min. AI šansu ili isključiti +EV filter.
            </div>
          ) : (
            <div className="rounded-lg border border-indigo-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Ukupna kvota:{" "}
                    <span className="text-indigo-600">
                      {slip.totalOdds.toFixed(2)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Kombinirana šansa: {slip.combinedProbability.toFixed(1)}%
                  </Badge>
                  <Badge
                    className={
                      slip.avgValuePercent >= 0
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs"
                    }
                  >
                    Prosj. EV: {slip.avgValuePercent >= 0 ? "+" : ""}
                    {slip.avgValuePercent.toFixed(1)}%
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Kopirano!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Kopiraj listić
                    </>
                  )}
                </Button>
              </div>

              <div className="divide-y divide-gray-100">
                {slip.items.map((item, idx) => (
                  <div
                    key={item.match.match_id}
                    className="py-2.5 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {idx + 1}. {item.match.home_team.name} vs{" "}
                        {item.match.away_team.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.match.competition.name} •{" "}
                        {new Date(item.match.kickoff).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                        {item.prediction.label}
                      </Badge>
                      <Badge variant="outline" className="font-mono font-bold">
                        {item.prediction.odd.toFixed(2)}
                      </Badge>
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        {item.prediction.probability}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
