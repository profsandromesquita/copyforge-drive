import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Session } from '@/types/copy-editor';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sessions: Session[];
}

export const PreviewModal = ({ open, onOpenChange, title, sessions }: PreviewModalProps) => {
  const renderContent = (content: string | string[], type: string) => {
    if (Array.isArray(content)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {content.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    }

    switch (type) {
      case 'headline':
        return <h1 className="text-3xl font-bold">{content}</h1>;
      case 'subheadline':
        return <h2 className="text-2xl font-semibold">{content}</h2>;
      case 'button':
        return (
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
            {content}
          </button>
        );
      default:
        return <p className="text-base">{content}</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-8">
            {sessions.map((session) => (
              <div key={session.id} className="space-y-4">
                <h3 className="text-xl font-semibold text-primary border-b pb-2">
                  {session.title}
                </h3>
                <div className="space-y-4 pl-4">
                  {session.blocks.map((block) => (
                    <div key={block.id}>
                      {renderContent(block.content, block.type)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
