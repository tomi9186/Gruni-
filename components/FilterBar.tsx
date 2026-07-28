"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FilterState } from "@/lib/types";
import { X } from "lucide-react";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  matchCount: number;
  totalCount: number;
}

export function FilterBar({
  filters,
  onFilterChange,
  matchCount,
  totalCount,
}: FilterBarProps) {
  const handleReset = () => {
    onFilterChange({
      search: "",
      minOdds: 1.0,
      maxOdds: 10.0,
      minProbability: 0,
    });
  };

  const handleHighValueBets = () => {
    onFilterChange({
      ...filters,
      minOdds: 2.0,
      minProbability: 70,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      {/* Search */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Pretraga Tima ili Lige
        </label>
        <Input
          placeholder="npr. Bayern, Manchester, Premier League"
          value={filters.search}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          className="h-10"
        />
      </div>

      {/* Odds Range */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Raspon Kvota: {filters.minOdds.toFixed(2)} - {filters.maxOdds.toFixed(2)}
        </label>
        <div className="space-y-2">
          <Slider
            value={[filters.minOdds, filters.maxOdds]}
            onValueChange={(value) =>
              onFilterChange({ ...filters, minOdds: value[0], maxOdds: value[1] })
            }
            min={1.0}
            max={10.0}
            step={0.1}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Min (Minimalna)
              </label>
              <Input
                type="number"
                min="1.0"
                max="10.0"
                step="0.1"
                value={filters.minOdds}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    minOdds: Math.min(parseFloat(e.target.value), filters.maxOdds),
                  })
                }
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Max (Maksimalna)
              </label>
              <Input
                type="number"
                min="1.0"
                max="10.0"
                step="0.1"
                value={filters.maxOdds}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    maxOdds: Math.max(parseFloat(e.target.value), filters.minOdds),
                  })
                }
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Probability Slider */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-700">
          Min Verovatnoća Dobitka: {filters.minProbability}%
        </label>
        <Slider
          value={[filters.minProbability]}
          onValueChange={(value) =>
            onFilterChange({ ...filters, minProbability: value[0] })
          }
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleHighValueBets}
          variant="outline"
          className="flex-1"
        >
          High Value Bets (2.0+)
        </Button>

        <Button
          onClick={handleReset}
          variant="ghost"
          className="flex-1"
        >
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Filter Summary */}
      <div className="border-t border-gray-100 pt-3">
        <span className="text-sm font-medium text-gray-600">
          Showing <span className="text-indigo-600 font-semibold">{matchCount}</span> of{" "}
          <span className="text-gray-900 font-semibold">{totalCount}</span> matches
        </span>
      </div>
    </div>
  );
}
