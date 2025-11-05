import { useDraggable } from '@dnd-kit/core';
import { TextT, TextHOne, TextHTwo, ListBullets, Hand, Article, Image, VideoCamera } from 'phosphor-react';
import { BlockType } from '@/types/copy-editor';

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
  const blocks: ToolbarBlockProps[] = [
    { type: 'text', icon: <TextT size={20} />, label: 'Texto' },
    { type: 'headline', icon: <TextHOne size={20} />, label: 'Headline' },
    { type: 'subheadline', icon: <TextHTwo size={20} />, label: 'Subheadline' },
    { type: 'list', icon: <ListBullets size={20} />, label: 'Lista' },
    { type: 'button', icon: <Hand size={20} />, label: 'Botão' },
    { type: 'form', icon: <Article size={20} />, label: 'Formulário' },
    { type: 'image', icon: <Image size={20} />, label: 'Imagem' },
    { type: 'video', icon: <VideoCamera size={20} />, label: 'Vídeo' },
  ];

  return (
    <div className="border-b bg-background sticky top-16 z-40">
      <div className="flex gap-3 px-4 py-3 overflow-x-auto">
        {blocks.map((block) => (
          <ToolbarBlock key={block.type} {...block} />
        ))}
      </div>
    </div>
  );
};
