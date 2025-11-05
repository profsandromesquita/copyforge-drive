import { useState } from 'react';
import { ChatCircle } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Comment } from '@/types/copy-editor';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CommentsButtonProps {
  comments?: Comment[];
  onAddComment: (text: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export const CommentsButton = ({ comments = [], onAddComment, onDeleteComment }: CommentsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Digite um comentário');
      return;
    }
    
    onAddComment(newComment);
    setNewComment('');
    toast.success('Comentário adicionado');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'agora';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'ontem';
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
        >
          <ChatCircle size={18} weight={comments.length > 0 ? 'fill' : 'regular'} />
          {comments.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {comments.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-background z-50" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Comentários</h4>
            <span className="text-xs text-muted-foreground">{comments.length}</span>
          </div>

          {comments.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{comment.author}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                    </div>
                    {onDeleteComment && comment.author === user?.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => onDeleteComment(comment.id)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-3 border-t">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAddComment();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Cmd/Ctrl + Enter para enviar</span>
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                Comentar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
