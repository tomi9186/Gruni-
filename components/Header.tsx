"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";

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
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            ⚡ Gruni
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Analiza utakmica, predviđanja i kvote u realnom vremenu
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
          <Badge
            className="text-sm font-medium bg-indigo-100 text-indigo-800 flex items-center gap-1"
          >
            <Zap className="h-3 w-3" />
            Powered by Ivica&Damir
          </Badge>
        </div>
      </div>
    </div>
  );
}
