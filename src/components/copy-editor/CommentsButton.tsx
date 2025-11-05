import { useState } from 'react';
import { ChatCircle, PencilSimple, Trash } from 'phosphor-react';
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
  onUpdateComment?: (commentId: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export const CommentsButton = ({ comments = [], onAddComment, onUpdateComment, onDeleteComment }: CommentsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const { user } = useAuth();

  const getUserDisplayName = () => {
    console.log('User metadata:', user?.user_metadata);
    console.log('User email:', user?.email);
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  };

  const isOwnComment = (commentAuthor: string) => {
    return commentAuthor === user?.email || commentAuthor === user?.user_metadata?.name;
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Digite um comentário');
      return;
    }
    
    onAddComment(newComment);
    setNewComment('');
    toast.success('Comentário adicionado');
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editingText.trim()) {
      toast.error('Digite um comentário');
      return;
    }
    
    if (onUpdateComment) {
      onUpdateComment(commentId, editingText);
      setEditingCommentId(null);
      setEditingText('');
      toast.success('Comentário atualizado');
    }
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
                <div key={comment.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {comment.author.includes('@') ? comment.author.split('@')[0] : comment.author}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                    </div>
                    {isOwnComment(comment.author) && (
                      <div className="flex gap-1">
                        {onUpdateComment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-muted"
                            onClick={() => handleStartEdit(comment)}
                          >
                            <PencilSimple size={14} />
                          </Button>
                        )}
                        {onDeleteComment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDeleteComment(comment.id)}
                          >
                            <Trash size={14} />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleSaveEdit(comment.id);
                          }
                          if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                  )}
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
