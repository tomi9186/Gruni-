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
      oddsFilter: "all",
      minOdds: 1.0,
      maxOdds: 5.0,
      minProbability: 0,
    });
  };

  const handleHighValueBets = () => {
    onFilterChange({
      ...filters,
      oddsFilter: "2.00",
      minOdds: 2.0,
      minProbability: 70,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      {/* Search and Quick Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Search Team or League
          </label>
          <Input
            placeholder="e.g., Manchester, Premier League"
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="h-10"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Quick Odds Filter
          </label>
          <Select
            value={filters.oddsFilter}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                oddsFilter: value as FilterState["oddsFilter"],
              })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Odds</SelectItem>
              <SelectItem value="1.30">Odds &gt; 1.30</SelectItem>
              <SelectItem value="1.60-1.80">Odds 1.60 - 1.80</SelectItem>
              <SelectItem value="2.00">Odds &gt; 2.00</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Custom Min Odds
          </label>
          <Input
            type="number"
            min="1.0"
            max="5.0"
            step="0.05"
            value={filters.minOdds}
            onChange={(e) =>
              onFilterChange({ ...filters, minOdds: parseFloat(e.target.value) })
            }
            className="h-10"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Custom Max Odds
          </label>
          <Input
            type="number"
            min="1.0"
            max="5.0"
            step="0.05"
            value={filters.maxOdds}
            onChange={(e) =>
              onFilterChange({ ...filters, maxOdds: parseFloat(e.target.value) })
            }
            className="h-10"
          />
        </div>
      </div>

      {/* Probability Slider and Presets */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700">
            Min Probability: {filters.minProbability}%
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

        <Button
          onClick={handleHighValueBets}
          variant="outline"
          className="h-12 self-end font-medium"
        >
          High Value Bets
        </Button>

        <Button
          onClick={handleReset}
          variant="ghost"
          size="sm"
          className="h-12 self-end"
        >
          <X className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      </div>

      {/* Filter Summary */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
        <span className="font-medium text-gray-600">
          Showing <span className="text-blue-600">{matchCount}</span> of{" "}
          <span className="text-gray-900">{totalCount}</span> matches
        </span>
      </div>
    </div>
  );
}
