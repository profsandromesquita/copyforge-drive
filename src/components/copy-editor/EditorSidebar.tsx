import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ListBullets } from 'phosphor-react';
import { StructureTree } from './StructureTree';
import { BlockSettings } from './BlockSettings';
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
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">
          {selectedBlock ? 'Configurações' : 'Estrutura'}
        </h2>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {selectedBlock ? (
          <BlockSettings
            block={selectedBlock}
            onBack={() => selectBlock(null)}
          />
        ) : (
          <StructureTree sessions={sessions} />
        )}
      </div>
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
