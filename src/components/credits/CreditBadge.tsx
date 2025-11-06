import { Coins } from "phosphor-react";
import { useWorkspaceCredits } from "@/hooks/useWorkspaceCredits";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export const CreditBadge = () => {
  const { data: credits, isLoading } = useWorkspaceCredits();

  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }

  if (!credits) return null;

  const balance = credits.balance;
  const statusColor = balance > 10 ? "text-green-600" : balance > 5 ? "text-yellow-600" : "text-red-600";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted ${statusColor}`}>
            <Coins size={18} weight="fill" />
            <span className="font-semibold">{balance.toFixed(1)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            <p><strong>Saldo:</strong> {balance.toFixed(2)} créditos</p>
            <p><strong>Total usado:</strong> {credits.total_used.toFixed(2)}</p>
            <p><strong>Total adicionado:</strong> {credits.total_added.toFixed(2)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
