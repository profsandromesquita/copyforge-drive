import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ClockDriftBannerProps {
  driftMinutes: number;
  direction: 'ahead' | 'behind';
  onRecheck: () => void;
  isRechecking: boolean;
}

export function ClockDriftBanner({ 
  driftMinutes, 
  direction, 
  onRecheck,
  isRechecking 
}: ClockDriftBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const directionText = direction === 'ahead' ? 'adiantado' : 'atrasado';
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <strong>Relógio do dispositivo incorreto</strong>
            <span className="hidden sm:inline"> — </span>
            <span className="block sm:inline">
              Seu dispositivo está {driftMinutes} minutos {directionText}. 
              Isso pode impedir o login. Ajuste a data/hora do sistema.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRecheck}
            disabled={isRechecking}
            className="bg-amber-100 border-amber-600 hover:bg-amber-200 text-amber-900"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRechecking && "animate-spin")} />
            Verificar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-amber-900 hover:bg-amber-400/50 px-2"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
