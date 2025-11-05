import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ListBullets } from 'phosphor-react';
import { X } from 'lucide-react';
import { BlockSettings } from './BlockSettings';
import { CopyAITab } from './CopyAITab';
import { ImageAITab } from './ImageAITab';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useEffect, useState } from 'react';

interface EditorSidebarProps {
  showImageAI?: boolean;
  imageBlockId?: string;
  onCloseImageAI?: () => void;
}

export const EditorSidebar = ({ showImageAI, imageBlockId, onCloseImageAI }: EditorSidebarProps) => {
  const { sessions, selectedBlockId, selectBlock } = useCopyEditor();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedBlock = sessions
    .flatMap(s => s.blocks)
    .find(b => b.id === selectedBlockId);

  const sidebarContent = (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4 overflow-y-auto">
          <CopyAITab />
        </div>
      </div>

      {showImageAI && imageBlockId && (
        <div className="absolute inset-0 bg-background z-20">
          <div className="h-full p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onCloseImageAI}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ImageAITab 
              block={sessions.flatMap(s => s.blocks).find(b => b.id === imageBlockId)!} 
              onClose={onCloseImageAI || (() => {})} 
            />
          </div>
        </div>
      )}

      {selectedBlock && !showImageAI && (
        <div className="absolute inset-0 bg-background z-10">
          <div className="h-full p-4 overflow-y-auto">
            <BlockSettings
              block={selectedBlock}
              onBack={() => selectBlock(null)}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
          >
            <ListBullets size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-[416px] border-l bg-background">
      {sidebarContent}
    </aside>
  );
};
