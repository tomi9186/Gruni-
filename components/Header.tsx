"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";

interface HeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  isLocal: boolean;
  isLoading: boolean;
  onFetchApi: () => void;
}

export function Header({
  selectedDate,
  onDateChange,
  isLocal,
  isLoading,
  onFetchApi,
}: HeaderProps) {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            BetMiner Match Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Track football matches, predictions, and betting odds
          </p>
        </div>

        <Badge
          className={`w-fit text-sm font-medium ${
            isLocal
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {isLocal ? "📁 Local Cache (/data/)" : "🌐 Live Data"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Select Date
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-10"
          />
        </div>

        <Button
          onClick={onFetchApi}
          disabled={isLoading}
          className="mt-6 h-10 gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Manual Fetch API
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
