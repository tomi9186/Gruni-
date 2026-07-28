"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Loader2, BeerIcon } from "lucide-react";

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
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image 
            src={`${basePath}/logo.webp`} 
            alt="Gruni Logo" 
            width={130} 
            height={130}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Gruni!
            </h1>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 px-2 py-1 shadow-md">
              <BeerIcon className="h-4 w-4 text-yellow-900/80" />
              <span className="text-xs font-bold text-yellow-900">
                Powered by Ivica&Damir
              </span>
            </div>
          </div>
        </div>

        {isLoading && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
      </div>
    </div>
  );
}
