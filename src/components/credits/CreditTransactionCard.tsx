import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface CreditTransactionCardProps {
  debited: number;
  tokens: number;
  tpc: number;
  timestamp: string;
}

export const CreditTransactionCard = ({ debited, tokens, tpc, timestamp }: CreditTransactionCardProps) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Última Transação</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-2 text-xs">
                    <p><strong>Como funciona o cálculo:</strong></p>
                    <p className="font-mono bg-muted/50 p-2 rounded">
                      Créditos = Tokens ÷ TPC
                    </p>
                    <p className="text-muted-foreground">
                      TPC (Tokens Per Credit) é o número de tokens que você pode usar por crédito.
                      O cálculo é proporcional e preciso até 4 casas decimais.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{debited.toFixed(4)}</span>
              <span className="text-sm text-muted-foreground">créditos debitados</span>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>📊 {tokens.toLocaleString()} tokens usados</p>
              <p>⚙️ TPC: {tpc.toLocaleString()} tokens/crédito</p>
              <p className="font-mono bg-muted/30 px-2 py-1 rounded mt-1">
                {tokens.toLocaleString()} ÷ {tpc.toLocaleString()} = {debited.toFixed(4)}
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground pt-2 border-t">
              {new Date(timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
