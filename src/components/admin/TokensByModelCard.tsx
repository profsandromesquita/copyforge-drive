import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getModelDisplayName, getModelIcon } from "@/lib/model-display-names";
import { ArrowRight, ArrowLeft } from "phosphor-react";
import { formatCredits } from "@/lib/utils";

interface ModelTokenStats {
  model_used: string;
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_credits_debited: number;
  transaction_count: number;
}

interface TokensByModelCardProps {
  modelStats: ModelTokenStats[];
  loading: boolean;
}

export const TokensByModelCard = ({ modelStats, loading }: TokensByModelCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tokens Usados por Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!modelStats || modelStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tokens Usados por Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Nenhuma geração de IA registrada ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular totais
  const totals = modelStats.reduce(
    (acc, stat) => ({
      total_tokens: acc.total_tokens + stat.total_tokens,
      total_input_tokens: acc.total_input_tokens + stat.total_input_tokens,
      total_output_tokens: acc.total_output_tokens + stat.total_output_tokens,
      total_credits_debited: acc.total_credits_debited + stat.total_credits_debited,
      transaction_count: acc.transaction_count + stat.transaction_count,
    }),
    {
      total_tokens: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_credits_debited: 0,
      transaction_count: 0,
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tokens Usados por Modelo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Modelo</th>
                <th className="text-right py-3 px-2 font-medium">Gerações</th>
                <th className="text-right py-3 px-2 font-medium">Tokens Totais</th>
                <th className="text-right py-3 px-2 font-medium">
                  <div className="flex items-center justify-end gap-1">
                    <ArrowRight size={14} className="text-blue-600" />
                    <span>Input</span>
                  </div>
                </th>
                <th className="text-right py-3 px-2 font-medium">
                  <div className="flex items-center justify-end gap-1">
                    <ArrowLeft size={14} className="text-green-600" />
                    <span>Output</span>
                  </div>
                </th>
                <th className="text-right py-3 px-2 font-medium">Créditos</th>
              </tr>
            </thead>
            <tbody>
              {modelStats.map((stat) => (
                <tr key={stat.model_used} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span>{getModelIcon(stat.model_used)}</span>
                      <span className="font-medium">{getModelDisplayName(stat.model_used)}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-muted-foreground">
                    {stat.transaction_count.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-2 font-mono font-semibold">
                    {stat.total_tokens.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-blue-600">
                    {stat.total_input_tokens.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-2 font-mono text-green-600">
                    {stat.total_output_tokens.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-2 font-mono font-semibold">
                    {formatCredits(stat.total_credits_debited)}
                  </td>
                </tr>
              ))}
              {/* Linha de totalizadores */}
              <tr className="border-t-2 font-bold bg-muted/30">
                <td className="py-3 px-2">TOTAL</td>
                <td className="text-right py-3 px-2">{totals.transaction_count.toLocaleString()}</td>
                <td className="text-right py-3 px-2 font-mono">
                  {totals.total_tokens.toLocaleString()}
                </td>
                <td className="text-right py-3 px-2 font-mono text-blue-600">
                  {totals.total_input_tokens.toLocaleString()}
                </td>
                <td className="text-right py-3 px-2 font-mono text-green-600">
                  {totals.total_output_tokens.toLocaleString()}
                </td>
                <td className="text-right py-3 px-2 font-mono">
                  {formatCredits(totals.total_credits_debited)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
