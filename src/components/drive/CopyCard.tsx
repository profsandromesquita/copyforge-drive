import { DotsThree, Trash, Pencil, ArrowsDownUp, Copy as CopyIcon, Check } from "phosphor-react";
import { useState, memo, useRef, useCallback, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import copyDriveLogo from '@/assets/copydrive-logo.png';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDrive } from "@/hooks/useDrive";
import MoveModal from "./MoveModal";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { RenameDialog } from "@/components/ui/rename-dialog";
import { getCopyTypeLabel } from "@/lib/copy-types";
import { cn } from "@/lib/utils";
import { sanitizePreviewText } from "@/lib/html-sanitizer";
import { extractPreviewFromSessions } from "@/lib/preview-extractor";
import { supabase } from "@/integrations/supabase/client";

interface CopyCardProps {
  id: string;
  title: string;
  subtitle?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  status?: 'draft' | 'published';
  folderId?: string | null;
  // Campos projetados da VIEW drive_cards (substituem sessions)
  previewImageUrl?: string | null;
  previewText?: string | null;
  copyType?: string;
  // Flag para indicar thumbnail em geração
  hasPendingThumbnail?: boolean;
  onClick?: () => void;
  // Props de seleção
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const LONG_PRESS_DURATION = 500; // ms
const MOVE_THRESHOLD = 10; // px

const CopyCard = memo(({ 
  id, 
  title, 
  subtitle, 
  creatorName, 
  creatorAvatar, 
  status, 
  folderId, 
  previewImageUrl,
  previewText,
  copyType, 
  hasPendingThumbnail = false,
  onClick,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: CopyCardProps) => {
  const { deleteCopy, renameCopy, moveCopy, duplicateCopy } = useDrive();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  
  // Fallback: texto extraído dinamicamente se previewText for null
  const [fallbackPreviewText, setFallbackPreviewText] = useState<string | null>(null);
  const fetchedFallbackRef = useRef(false);

  // Carregar fallback apenas quando necessário (lazy loading)
  useEffect(() => {
    // Só buscar se não tiver imagem, não tiver texto, não estiver pendente, e ainda não buscou
    if (
      !previewImageUrl && 
      !previewText && 
      !hasPendingThumbnail && 
      !fetchedFallbackRef.current
    ) {
      fetchedFallbackRef.current = true;
      
      // Buscar sessions da copy para extrair preview
      supabase
        .from('copies')
        .select('sessions')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (!error && data?.sessions) {
            const extracted = extractPreviewFromSessions(data.sessions as any);
            if (extracted) {
              setFallbackPreviewText(extracted);
            }
          }
        });
    }
  }, [id, previewImageUrl, previewText, hasPendingThumbnail]);

  // Texto efetivo para preview (DB ou fallback)
  const effectivePreviewText = previewText || fallbackPreviewText;

  // Long press refs
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null);

  // DESATIVAR DRAG QUANDO EM SELECTION MODE
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    disabled: selectionMode,
    data: {
      type: 'copy',
      folderId: folderId,
    }
  });

  const handleRename = async (newName: string) => {
    setIsRenaming(true);
    await renameCopy(id, newName);
    setIsRenaming(false);
    setRenameDialogOpen(false);
  };

  const confirmDelete = async () => {
    await deleteCopy(id);
    setDeleteDialogOpen(false);
  };

  const handleMove = async (targetFolderId: string | null) => {
    await moveCopy(id, targetFolderId);
  };

  // Long press handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (selectionMode) return;
    
    longPressStartPos.current = { x: e.clientX, y: e.clientY };
    
    longPressTimer.current = setTimeout(() => {
      // Feedback tátil
      if (navigator.vibrate) navigator.vibrate(50);
      window.dispatchEvent(new CustomEvent('activate-selection-mode'));
      onToggleSelect?.(id);
      longPressStartPos.current = null;
    }, LONG_PRESS_DURATION);
  }, [selectionMode, id, onToggleSelect]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Cancelar se mover o dedo (scroll)
    if (longPressStartPos.current && longPressTimer.current) {
      const dx = Math.abs(e.clientX - longPressStartPos.current.x);
      const dy = Math.abs(e.clientY - longPressStartPos.current.y);
      
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        longPressStartPos.current = null;
      }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressStartPos.current = null;
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(30);
      onToggleSelect?.(id);
      return;
    }
    
    if (!isDragging && onClick) {
      onClick();
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        {...(selectionMode ? {} : { ...attributes, ...listeners })}
        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        className={cn(
          "group h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden",
          selectionMode && "cursor-pointer",
          !selectionMode && (isDragging ? 'cursor-grabbing opacity-50' : 'cursor-grab'),
          isSelected && "ring-2 ring-primary ring-offset-2 bg-primary/5",
          selectionMode && !isSelected && "hover:ring-2 hover:ring-primary/30"
        )}
      >
        {/* Visual Preview Section - No topo, dominante */}
        <div className="relative h-36 md:h-48 bg-gradient-to-br from-background via-muted/10 to-muted/30 overflow-hidden border-b">
          {/* Checkbox de Seleção */}
          <div 
            className={cn(
              "absolute top-2 left-2 z-20 transition-opacity duration-200",
              selectionMode 
                ? "opacity-100" 
                : "opacity-0 group-hover:opacity-50 hover:!opacity-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!selectionMode) {
                if (navigator.vibrate) navigator.vibrate(50);
                window.dispatchEvent(new CustomEvent('activate-selection-mode'));
              }
              onToggleSelect?.(id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110",
              isSelected 
                ? "bg-primary border-primary text-primary-foreground" 
                : "bg-background/80 border-muted-foreground/40 hover:border-primary/60"
            )}>
              {isSelected && <Check size={12} weight="bold" />}
            </div>
          </div>

          {previewImageUrl ? (
            // Thumbnail de imagem (projetado da VIEW)
            <>
              <img 
                src={previewImageUrl} 
                alt={title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
            </>
          ) : hasPendingThumbnail ? (
            // Gerando thumbnail - mostrar placeholder animado
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Gerando preview...</span>
            </div>
          ) : effectivePreviewText ? (
            // Preview de texto (projetado da VIEW ou fallback extraído)
            <>
              <div className="absolute inset-0 p-4 md:p-6 scale-90 opacity-70 origin-top-left">
                <p className="text-sm text-muted-foreground/80 line-clamp-4">
                  {sanitizePreviewText(effectivePreviewText)}
                </p>
              </div>
              {/* Bottom Fade Overlay */}
              <div className="absolute bottom-0 inset-x-0 h-12 md:h-16 bg-gradient-to-t from-background/90 via-background/50 to-transparent pointer-events-none" />
            </>
          ) : (
            // Fallback: Logo CopyDrive
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={copyDriveLogo} 
                alt="CopyDrive"
                className="w-24 h-24 object-contain opacity-30"
              />
            </div>
          )}
          
          {/* Menu de ações e Status Badge - Overlay no canto superior direito */}
          {!selectionMode && (
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger 
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="bg-background/80 backdrop-blur-sm p-1.5 rounded-md hover:bg-background transition-colors"
                >
                  <DotsThree size={16} weight="bold" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameDialogOpen(true);
                    }}
                  >
                    <Pencil size={16} className="mr-2" />
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateCopy(id);
                    }}
                  >
                    <CopyIcon size={16} className="mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveModalOpen(true);
                    }}
                  >
                    <ArrowsDownUp size={16} className="mr-2" />
                    Mover
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash size={16} className="mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {status && (
                <Badge 
                  variant={status === 'published' ? 'default' : 'muted'}
                  className="text-[10px] px-1.5 py-0 h-5 font-medium"
                >
                  {status === 'published' ? 'Publicado' : 'Rascunho'}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Content Section - Título e info abaixo do preview */}
        <CardContent className="flex-1 p-3 md:p-6">
          <div className="space-y-2">
            {/* Title */}
            <div>
              <h2 className="text-lg md:text-xl font-bold truncate">{title}</h2>
              {copyType && (
                <p className="text-xs text-muted-foreground/60 mt-1 truncate">
                  {getCopyTypeLabel(copyType)}
                </p>
              )}
            </div>

            {/* Creator info */}
            {creatorName && (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={creatorAvatar || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {creatorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {creatorName}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer - Sempre visível (quando não em selection mode) */}
        {!selectionMode && (
          <CardFooter className="p-3 md:p-4 pt-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <Pencil size={16} className="mr-2" />
              Editar
            </Button>
          </CardFooter>
        )}
      </Card>

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={title}
        onRename={handleRename}
        isRenaming={isRenaming}
        title="Renomear Copy"
      />

      <MoveModal
        open={moveModalOpen}
        onOpenChange={setMoveModalOpen}
        itemId={id}
        itemType="copy"
        currentFolderId={folderId || null}
        onMove={handleMove}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={title}
        itemType="copy"
        onConfirm={confirmDelete}
      />
    </>
  );
});

export default CopyCard;
