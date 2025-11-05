import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Session } from '@/types/copy-editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlockPreview } from './BlockPreview';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sessions: Session[];
}

export const PreviewModal = ({ open, onOpenChange, title, sessions }: PreviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[75vh] pr-4">
          <div className="space-y-6">
            {sessions.map((session) => (
              <div key={session.id} className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold text-primary">
                    {session.title}
                  </h3>
                </div>
                <div className="space-y-3">
                  {session.blocks.map((block) => (
                    <BlockPreview key={block.id} block={block} />
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
