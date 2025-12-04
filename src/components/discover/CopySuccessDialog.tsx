import { CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CopySuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copyTitle: string;
  onEditNow: () => void;
  onContinueExploring: () => void;
}

export const CopySuccessDialog = ({
  open,
  onOpenChange,
  copyTitle,
  onEditNow,
  onContinueExploring,
}: CopySuccessDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-xl mb-2">
            Cópia criada com sucesso!
          </DialogTitle>
          <DialogDescription>
            "{copyTitle}" foi salva no seu Drive.
          </DialogDescription>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onContinueExploring} 
            className="flex-1"
          >
            Continuar explorando
          </Button>
          <Button 
            onClick={onEditNow} 
            className="flex-1"
          >
            Editar agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
