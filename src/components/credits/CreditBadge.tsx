import { Coins } from "phosphor-react";
import { useWorkspaceCredits } from "@/hooks/useWorkspaceCredits";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCredits } from "@/lib/utils";

export const CreditBadge = () => {
  const { data: credits, isLoading } = useWorkspaceCredits();

  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }

  if (!credits) return null;

  const balance = credits.balance;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "group relative flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-200",
            "bg-background border border-border/50 hover:border-border hover:shadow-sm"
          )}>
            <div className="flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground group-hover:text-foreground transition-colors">
              <Coins size={16} weight="fill" />
            </div>
            <span className="text-sm font-medium tabular-nums text-foreground transition-colors">
              {formatCredits(balance)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={12} align="end" className="min-w-[240px]">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Saldo atual</span>
                <span className="text-sm font-semibold">{formatCredits(balance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total usado</span>
                <span className="text-sm">{formatCredits(credits.total_used)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total adicionado</span>
                <span className="text-sm">{formatCredits(credits.total_added)}</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground leading-relaxed">
              Créditos debitados proporcionalmente baseados nos tokens usados (TPC)
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
