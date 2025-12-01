import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListBullets, Sparkle, ChatCircle } from 'phosphor-react';
import { BlockSettings } from './BlockSettings';
import { CopyAITab } from './CopyAITab';
import { CopyChatTab } from './CopyChatTab';
import { ImageAITab } from './ImageAITab';
import { ContextSettingsDropdown } from './ContextSettingsDropdown';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EditorSidebarProps {
  showImageAI?: boolean;
  imageBlockId?: string;
  onCloseImageAI?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  activeTab?: 'ai' | 'chat';
  onTabChange?: (tab: 'ai' | 'chat') => void;
}

export const EditorSidebar = ({ 
  showImageAI, 
  imageBlockId, 
  onCloseImageAI, 
  isOpen = true, 
  onToggle,
  activeTab: controlledActiveTab,
  onTabChange
}: EditorSidebarProps) => {
  const { sessions, selectedBlockId, selectBlock, copyId } = useCopyEditor();
  const [isMobile, setIsMobile] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState<'ai' | 'chat'>('ai');
  const [contextSettings, setContextSettings] = useState({
    audienceSegmentId: '',
    offerId: '',
    methodologyId: ''
  });
  const [isContextLoaded, setIsContextLoaded] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ Carregar contexto inicial do banco (Single Source of Truth)
  useEffect(() => {
    const loadInitialContext = async () => {
      if (!copyId) {
        setIsContextLoaded(true);
        return;
      }
      
      const { data: copy } = await supabase
        .from('copies')
        .select('selected_audience_id, selected_offer_id, selected_methodology_id')
        .eq('id', copyId)
        .single();
      
      if (copy) {
        setContextSettings({
          audienceSegmentId: copy.selected_audience_id || '',
          offerId: copy.selected_offer_id || '',
          methodologyId: copy.selected_methodology_id || ''
        });
      }
      setIsContextLoaded(true);
    };
    
    loadInitialContext();
  }, [copyId]);

  const selectedBlock = sessions
    .flatMap(s => s.blocks)
    .find(b => b.id === selectedBlockId);

  // Use controlled tab if provided, otherwise use internal state
  const currentActiveTab = controlledActiveTab ?? internalActiveTab;
  const handleTabChange = (tab: 'ai' | 'chat') => {
    onTabChange?.(tab);
    setInternalActiveTab(tab);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col relative bg-background">
      <div className="flex-1 overflow-hidden">
        <Tabs value={currentActiveTab} onValueChange={(value) => handleTabChange(value as 'ai' | 'chat')} className="h-full flex flex-col">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <TabsList className="grid w-full grid-cols-2 border-2 border-border/60 flex-1" style={{ backgroundColor: 'rgb(245, 245, 245)' }}>
                <TabsTrigger value="ai" className="gap-2">
                  <Sparkle size={16} weight="fill" />
                  Copy IA
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-2">
                  <ChatCircle size={16} weight="fill" />
                  Chat
                </TabsTrigger>
              </TabsList>
              {isContextLoaded ? (
                <ContextSettingsDropdown 
                  key={`ctx-${contextSettings.methodologyId || 'empty'}`}
                  onContextChange={setContextSettings}
                  initialContext={contextSettings}
                />
              ) : (
                <div className="h-8 w-8 flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          </div>
          <TabsContent value="ai" className="flex-1 overflow-hidden mt-0">
            <div className="h-full p-4 overflow-y-auto">
              <CopyAITab contextSettings={contextSettings} />
            </div>
          </TabsContent>
          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
            <div className="h-full">
              <CopyChatTab isActive={currentActiveTab === 'chat'} contextSettings={contextSettings} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showImageAI && imageBlockId && (
        <div className="absolute inset-0 bg-background z-20">
          <div className="h-full p-4 overflow-y-auto">
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
    <>
      {/* Sidebar with slide animation */}
      {isOpen && (
        <aside className="w-[478px] border-l bg-background flex-shrink-0">
          {sidebarContent}
        </aside>
      )}
    </>
  );
};
