import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListBullets } from 'phosphor-react';
import { StructureTree } from './StructureTree';
import { BlockSettings } from './BlockSettings';
import { CopyAITab } from './CopyAITab';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useEffect, useState } from 'react';

export const EditorSidebar = () => {
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
      <Tabs defaultValue="estrutura" className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="estrutura">Estrutura</TabsTrigger>
            <TabsTrigger value="copy-ia">Copy IA</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="estrutura" className="h-full p-4 overflow-y-auto mt-0">
            <StructureTree sessions={sessions} />
          </TabsContent>

          <TabsContent value="copy-ia" className="h-full p-4 overflow-y-auto mt-0">
            <CopyAITab />
          </TabsContent>
        </div>
      </Tabs>

      {selectedBlock && (
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
        <SheetContent side="right" className="w-full sm:max-w-md">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-80 border-l bg-background">
      {sidebarContent}
    </aside>
  );
};
