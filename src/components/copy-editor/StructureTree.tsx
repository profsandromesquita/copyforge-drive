import { Trash, TextT, TextHOne, TextHTwo, ListBullets, Hand } from 'phosphor-react';
import { Session } from '@/types/copy-editor';
import { Button } from '@/components/ui/button';
import { useCopyEditor } from '@/hooks/useCopyEditor';

const blockIcons = {
  text: <TextT size={16} />,
  headline: <TextHOne size={16} />,
  subheadline: <TextHTwo size={16} />,
  list: <ListBullets size={16} />,
  button: <Hand size={16} />,
};

interface StructureTreeProps {
  sessions: Session[];
}

export const StructureTree = ({ sessions }: StructureTreeProps) => {
  const { removeSession, removeBlock, selectBlock } = useCopyEditor();

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded hover:bg-accent group">
            <span className="font-medium text-sm">{session.title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => removeSession(session.id)}
            >
              <Trash size={14} />
            </Button>
          </div>

          <div className="ml-4 space-y-1">
            {session.blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer group"
                onClick={() => selectBlock(block.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-primary">{blockIcons[block.type]}</span>
                  <span className="text-sm capitalize">{block.type}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBlock(block.id);
                  }}
                >
                  <Trash size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
