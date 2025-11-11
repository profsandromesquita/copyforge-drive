import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { UpgradeModal } from "@/components/workspace/UpgradeModal";
import { useState } from "react";

interface LimitExceededBannerProps {
  limitType: 'projects' | 'copies';
  current: number;
  limit: number;
}

export const LimitExceededBanner = ({ limitType, current, limit }: LimitExceededBannerProps) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const message = limitType === 'projects'
    ? `Você tem ${current} projeto${current > 1 ? 's' : ''} ativo${current > 1 ? 's' : ''}, mas seu plano permite apenas ${limit}. Não será possível criar novos projetos.`
    : `Você tem ${current} cop${current > 1 ? 'ies' : 'y'} ativa${current > 1 ? 's' : ''}, mas seu plano permite apenas ${limit}. Não será possível criar novas copies.`;

  return (
    <>
      <Alert variant="destructive" className="mb-4 border-destructive/50 bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm">{message}</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowUpgradeModal(true)}
            className="bg-background hover:bg-background/80 whitespace-nowrap"
          >
            Fazer Upgrade
          </Button>
        </AlertDescription>
      </Alert>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType={limitType}
      />
    </>
  );
};
