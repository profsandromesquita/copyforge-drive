import { useState, useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { TextT, TextHOne, TextHTwo, ListBullets, Hand, Article, Image, VideoCamera, SpeakerHigh, Question, Quotes, CaretDown, CaretUp } from 'phosphor-react';
import { BlockType } from '@/types/copy-editor';
import { Button } from '@/components/ui/button';

interface ToolbarBlockProps {
  type: BlockType;
  icon: React.ReactNode;
  label: string;
}

const ToolbarBlock = ({ type, icon, label }: ToolbarBlockProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbar-${type}`,
    data: { type, fromToolbar: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg border bg-card
        hover:border-primary hover:bg-accent cursor-grab active:cursor-grabbing
        transition-all min-w-fit shadow-sm hover:shadow-md
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
    >
      <div className="text-primary">{icon}</div>
      <span className="text-sm font-medium whitespace-nowrap">{label}</span>
    </div>
  );
};

export const BlockToolbar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const blocks: ToolbarBlockProps[] = [
    { type: 'text', icon: <TextT size={20} />, label: 'Texto' },
    { type: 'headline', icon: <TextHOne size={20} />, label: 'Headline' },
    { type: 'subheadline', icon: <TextHTwo size={20} />, label: 'Subheadline' },
    { type: 'list', icon: <ListBullets size={20} />, label: 'Lista' },
    { type: 'button', icon: <Hand size={20} />, label: 'Botão' },
    { type: 'form', icon: <Article size={20} />, label: 'Formulário' },
    { type: 'image', icon: <Image size={20} />, label: 'Imagem' },
    { type: 'video', icon: <VideoCamera size={20} />, label: 'Vídeo' },
    { type: 'audio', icon: <SpeakerHigh size={20} />, label: 'Áudio' },
    { type: 'faq', icon: <Question size={20} />, label: 'FAQ' },
    { type: 'testimonial', icon: <Quotes size={20} />, label: 'Depoimento' },
  ];

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        
        // Temporariamente expandir para medir a altura total
        const wasExpanded = isExpanded;
        if (!isExpanded) {
          container.style.maxHeight = 'none';
        }
        
        const scrollHeight = container.scrollHeight;
        const singleLineHeight = 60;
        
        // Restaurar estado anterior
        if (!wasExpanded) {
          container.style.maxHeight = `${singleLineHeight}px`;
        }
        
        // Verifica se há conteúdo que ultrapassa uma linha
        setHasOverflow(scrollHeight > singleLineHeight + 5);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    // Timeout para garantir que a medição aconteça após renderização
    const timeout = setTimeout(checkOverflow, 100);

    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timeout);
    };
  }, [blocks, isExpanded]);

  return (
    <div className="border-b bg-background sticky top-16 z-40">
      <div className="relative">
        <div 
          ref={containerRef}
          className={`flex flex-wrap gap-3 px-4 py-3 transition-all duration-300 ${
            isExpanded ? 'max-h-none' : 'max-h-[60px] overflow-hidden'
          }`}
        >
          {blocks.map((block) => (
            <ToolbarBlock key={block.type} {...block} />
          ))}
        </div>

        {hasOverflow && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm opacity-50 hover:opacity-100 transition-all"
            >
              {isExpanded ? (
                <CaretUp size={16} weight="bold" className="text-muted-foreground" />
              ) : (
                <CaretDown size={16} weight="bold" className="text-muted-foreground" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
