"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface HeaderProps {
  isLocal: boolean;
  isLoading: boolean;
}

export function Header({
  isLocal,
  isLoading,
}: HeaderProps) {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analitika Utakmica i Predviđanja
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Pratite fudbalske utakmice, predviđanja i kvote
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
          <Badge
            className={`text-sm font-medium ${
              isLocal
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {isLocal ? "📁 Lokalni Podaci" : "🌐 Live Podaci"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
