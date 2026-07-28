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
  availableDates: string[];
  onDateChange: (date: string) => void;
}

export function FilterBar({
  filters,
  onFilterChange,
  matchCount,
  totalCount,
  allLeagues,
  selectedDate,
  availableDates,
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

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (direction === 'prev' && currentIndex > 0) {
      onDateChange(availableDates[currentIndex - 1]);
    }
    if (direction === 'next' && currentIndex < availableDates.length - 1) {
      onDateChange(availableDates[currentIndex + 1]);
    }
  };

  const canGoPrev = availableDates.indexOf(selectedDate) > 0;
  const canGoNext = availableDates.indexOf(selectedDate) < availableDates.length - 1;
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
            className="h-10 max-w-sm"
          />
        </div>
        <Button onClick={() => setIsExpanded(!isExpanded)} variant="outline">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {isExpanded ? "Sakrij Filtere" : "Prikaži Filtere"}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6 border-t border-gray-200 pt-6">
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
            <div className="space-y-2">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Od (HH:mm)
                  </label>
                  <Input
                    type="text"
                    placeholder="00:00"
                    value={formatTime(filters.minTime)}
                    onChange={(e) => {
                      const parts = e.target.value.split(":").map(Number);
                      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                        const minutes = parts[0] * 60 + parts[1];
                        if (minutes >= 0 && minutes <= 1440) {
                          onFilterChange({
                            ...filters,
                            minTime: minutes,
                          });
                        }
                      }
                    }}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Do (HH:mm)
                  </label>
                  <Input
                    type="text"
                    placeholder="24:00"
                    value={formatTime(filters.maxTime)}
                    onChange={(e) => {
                      const parts = e.target.value.split(":").map(Number);
                      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                        const minutes = parts[0] * 60 + parts[1];
                        if (minutes >= 0 && minutes <= 1440) {
                          onFilterChange({
                            ...filters,
                            maxTime: minutes,
                          });
                        }
                      }
                    }}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* League Filter and Reset Button */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
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
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Odaberite ligu..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">
                    Sve lige ({allLeagues.length})
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
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleDateChange('prev')} disabled={!canGoPrev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            <p className="text-xs text-gray-500">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('hr-HR', { weekday: 'long' })}</p>
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleDateChange('next')} disabled={!canGoNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-gray-600">
            Prikazano <span className="text-indigo-600 font-semibold">{matchCount}</span> od{" "}
            <span className="text-gray-900 font-semibold">{totalCount}</span> utakmica
          </span>
        </div>
      </div>
    </div>
  );
}
