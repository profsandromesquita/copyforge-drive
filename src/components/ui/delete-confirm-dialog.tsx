import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType?: string;
  itemCount?: number; // Suporte a bulk delete
  warningMessage?: string; // Mensagem de alerta adicional (ex: cascade delete)
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  itemName,
  itemType = "item",
  itemCount,
  warningMessage,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) => {
  const isBulkDelete = itemCount && itemCount > 1;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              {isBulkDelete ? (
                <>Deseja realmente excluir <strong>{itemCount} itens</strong>? Essa ação não pode ser desfeita.</>
              ) : (
                <>Deseja realmente excluir {itemType === "item" ? "o item" : `${itemType === "copy" ? "a copy" : itemType === "pasta" ? "a pasta" : itemType === "modelo" ? "o modelo" : `o ${itemType}`}`} "{itemName}"? Essa ação não pode ser desfeita.</>
              )}
            </span>
            {warningMessage && (
              <p className="mt-2 text-amber-600 dark:text-amber-400 text-sm font-medium flex items-start gap-1.5">
                <span>⚠️</span>
                <span>{warningMessage}</span>
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
