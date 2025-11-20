import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListBullets, Sparkle, ChatCircle } from 'phosphor-react';
import { BlockSettings } from './BlockSettings';
import { CopyAITab } from './CopyAITab';
import { CopyChatTab } from './CopyChatTab';
import { ImageAITab } from './ImageAITab';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useEffect, useState } from 'react';

interface EditorSidebarProps {
  showImageAI?: boolean;
  imageBlockId?: string;
  onCloseImageAI?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const EditorSidebar = ({ showImageAI, imageBlockId, onCloseImageAI, isOpen = true, onToggle }: EditorSidebarProps) => {
  const { sessions, selectedBlockId, selectBlock } = useCopyEditor();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'chat'>('ai');

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
    <div className="h-full flex flex-col relative bg-slate-950 text-slate-100">
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ai' | 'chat')} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 bg-slate-900 border-slate-800">
            <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">
              <Sparkle size={16} weight="fill" />
              Copy IA
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">
              <ChatCircle size={16} weight="fill" />
              Chat
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ai" className="flex-1 overflow-hidden mt-0">
            <div className="h-full p-4 overflow-y-auto">
              <CopyAITab />
            </div>
          </TabsContent>
          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
            <div className="h-full">
              <CopyChatTab isActive={activeTab === 'chat'} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showImageAI && imageBlockId && (
        <div className="absolute inset-0 bg-slate-950 z-20">
          <div className="h-full p-4 overflow-y-auto">
            <ImageAITab 
              block={sessions.flatMap(s => s.blocks).find(b => b.id === imageBlockId)!} 
              onClose={onCloseImageAI || (() => {})} 
            />
          </div>
        </div>
      )}

      {selectedBlock && !showImageAI && (
        <div className="absolute inset-0 bg-slate-950 z-10">
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
    <>
      {/* Sidebar with slide animation */}
      {isOpen && (
        <aside className="w-[416px] border-l border-slate-800 bg-slate-950 flex-shrink-0 shadow-xl">
          {sidebarContent}
        </aside>
      )}
    </>
  );
};
