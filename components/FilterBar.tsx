"use client";
import { useState } from "react";

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
import { X, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  matchCount: number;
  totalCount: number;
  allLeagues: string[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function FilterBar({
  filters,
  onFilterChange,
  matchCount,
  totalCount,
  allLeagues,
  selectedDate,
  onDateChange,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    onFilterChange({
      search: "",
      minOdds: 1.0,
      maxOdds: 10.0,
      minProbability: 0,
      minTime: 0,
      maxTime: 1440,
      selectedLeagues: allLeagues,
    });
  };

  const formatTime = (minutes: number | undefined): string => {
    if (minutes === undefined || isNaN(minutes)) return "00:00";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const getMatchCountText = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} utakmica`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${count} utakmice`;
    return `${count} utakmica`;
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate + 'T12:00:00Z'); // Use noon to avoid timezone issues
    const modifier = direction === 'prev' ? -1 : 1;
    currentDate.setDate(currentDate.getDate() + modifier);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    onDateChange(`${year}-${month}-${day}`);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <label htmlFor="search-input" className="sr-only">Pretraži</label>
          <Input
            id="search-input"
            placeholder="Pretraži tim ili ligu..."
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="h-10 max-w-sm text-gray-900 focus-visible:ring-transparent focus-visible:ring-offset-0"
          />
        </div>
        <Button onClick={() => setIsExpanded(!isExpanded)} variant="outline" size="icon" className="h-10 w-10">
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-4 pt-4">
          {/* Odds Range */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Raspon Kvota: {filters.minOdds.toFixed(2)} - {filters.maxOdds.toFixed(2)}
            </label>
            <div>
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
            </div>
          </div>

          {/* Probability Slider */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Min Vjerojatnost Pobjede: {filters.minProbability}%
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

          {/* Time Range Filter */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Vrijeme početka: {formatTime(filters.minTime)} - {formatTime(filters.maxTime)}
            </label>
            <div>
              <Slider
                value={[filters.minTime, filters.maxTime]}
                onValueChange={(value) =>
                  onFilterChange({ ...filters, minTime: value[0], maxTime: value[1] })
                }
                min={0}
                max={1440}
                step={15}
                className="w-full"
              />
            </div>
          </div>

          {/* League Filter and Reset Button */}
          <div className="flex w-full gap-3 items-end">
            <div className="flex-grow">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Liga
              </label>
              <Select
                value={filters.selectedLeagues.length === allLeagues.length ? "all" : filters.selectedLeagues.length === 1 ? filters.selectedLeagues[0] : "custom"}
                onValueChange={(value) => {
                  if (value === "all") {
                    onFilterChange({ ...filters, selectedLeagues: allLeagues });
                  } else if (value !== "custom") {
                    onFilterChange({ ...filters, selectedLeagues: [value] });
                  }
                }}
              >
                <SelectTrigger className="h-10 text-gray-900">
                  <SelectValue placeholder="Odaberite ligu..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all" className="font-semibold">
                    Sva natjecanja ({allLeagues.length})
                  </SelectItem>
                  {allLeagues.map((league) => (
                    <SelectItem key={league} value={league}>
                      {league}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleReset}
              variant="ghost"
              className="h-10"
            >
              <X className="mr-2 h-4 w-4" />
              Resetiraj
            </Button>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleDateChange('prev')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            <p className="text-xs text-gray-500">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('hr-HR', { weekday: 'long' })}</p>
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleDateChange('next')}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-gray-600">
            <span className="text-indigo-600 font-semibold">{getMatchCountText(matchCount)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
