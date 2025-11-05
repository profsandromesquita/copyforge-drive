import { Plus } from 'phosphor-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SessionBlock } from './SessionBlock';
import { Button } from '@/components/ui/button';
import { useCopyEditor } from '@/hooks/useCopyEditor';

interface SessionCanvasProps {
  onShowImageAI?: (blockId: string) => void;
}

export const SessionCanvas = ({ onShowImageAI }: SessionCanvasProps) => {
  const { sessions, addSession } = useCopyEditor();

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-[hsl(var(--canvas-background))]">
      {sessions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">
            Nenhuma sessão criada ainda. Comece adicionando uma sessão!
          </p>
          <Button onClick={addSession}>
            <Plus size={20} className="mr-2" />
            Adicionar Sessão
          </Button>
        </div>
      ) : (
        <>
          <SortableContext
            items={sessions.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sessions.map((session) => (
              <SessionBlock key={session.id} session={session} onShowImageAI={onShowImageAI} />
            ))}
          </SortableContext>

          <Button variant="outline" onClick={addSession} className="w-full">
            <Plus size={20} className="mr-2" />
            Adicionar Sessão
          </Button>
        </>
      )}
    </div>
  );
};
