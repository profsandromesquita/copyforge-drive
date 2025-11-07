import { Coins } from "phosphor-react";
import { useWorkspaceCredits } from "@/hooks/useWorkspaceCredits";
import { useCreditAlert } from "@/hooks/useCreditAlert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

export const CreditBadge = () => {
  const { data: credits, isLoading } = useWorkspaceCredits();
  const { isLowBalance, threshold } = useCreditAlert();

  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }

  if (!credits) return null;

  const balance = credits.balance;
  const statusColor = balance >= threshold ? "text-green-600" : balance > threshold / 2 ? "text-yellow-600" : "text-red-600";
  const bgColor = isLowBalance ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-muted";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor} ${statusColor} transition-all`}>
            {isLowBalance && <AlertTriangle size={16} className="animate-pulse" />}
            <Coins size={18} weight="fill" />
            <span className="font-semibold">{balance.toFixed(1)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} align="end" className="z-[9999]">
          <div className="space-y-1 text-sm">
            <p><strong>Saldo:</strong> {balance.toFixed(2)} créditos</p>
            <p><strong>Total usado:</strong> {credits.total_used.toFixed(2)}</p>
            <p><strong>Total adicionado:</strong> {credits.total_added.toFixed(2)}</p>
            <div className="border-t pt-1 mt-2 text-xs">
              <p><strong>Limite de alerta:</strong> {threshold.toFixed(0)} créditos</p>
              {isLowBalance && (
                <p className="text-red-600 dark:text-red-400 font-semibold mt-1">
                  ⚠️ Saldo abaixo do limite!
                </p>
              )}
            </div>
            <div className="border-t pt-1 mt-2 text-xs text-muted-foreground">
              <p>Créditos são debitados proporcionalmente</p>
              <p>baseados nos tokens usados (TPC)</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
