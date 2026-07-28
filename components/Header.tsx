"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";

interface HeaderProps {
  isLocal: boolean;
  isLoading: boolean;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function Header({
  isLocal,
  isLoading,
}: HeaderProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image 
            src={`${basePath}/gruni-logo.png`} 
            alt="Gruni Logo" 
            width={90} 
            height={90}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Gruni!
            </h1>
            <p className="mt-2 text-sm font-semibold text-gray-700 flex items-center gap-1">
              <Zap className="h-4 w-4 text-blue-600" />
              Powered by Ivica&Damir
            </p>
          </div>
        </div>

        {isLoading && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
      </div>
    </div>
  );
}
