import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceCredits } from "@/hooks/useWorkspaceCredits";

export const WorkspaceCredits = () => {
  const { data: credits } = useWorkspaceCredits();

  if (!credits) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Saldo de Créditos</CardTitle>
        <CardDescription className="text-xs">
          Visualize o saldo atual do workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Saldo Atual</p>
            <p className="text-2xl font-bold text-green-600">
              {credits.balance.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Usado</p>
            <p className="text-2xl font-bold">{credits.total_used.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Adicionado</p>
            <p className="text-2xl font-bold">{credits.total_added.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
