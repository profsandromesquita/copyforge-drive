import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAICharacteristics, AICharacteristic } from "@/hooks/useAICharacteristics";
import { CharacteristicCard } from "./CharacteristicCard";
import { CharacteristicForm } from "./CharacteristicForm";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CharacteristicsListProps {
  category: 'objetivos' | 'estilos' | 'tamanhos' | 'preferencias';
}

const SortableItem = ({ 
  characteristic, 
  onEdit, 
  onDelete 
}: { 
  characteristic: AICharacteristic;
  onEdit: (c: AICharacteristic) => void;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: characteristic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <CharacteristicCard
        characteristic={characteristic}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
};

export const CharacteristicsList = ({ category }: CharacteristicsListProps) => {
  const { characteristics, isLoading, createCharacteristic, updateCharacteristic, deleteCharacteristic, reorderCharacteristics } = useAICharacteristics(category);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCharacteristic, setSelectedCharacteristic] = useState<AICharacteristic | null>(null);
  const [items, setItems] = useState<AICharacteristic[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sincronizar items com características do banco
  useEffect(() => {
    if (characteristics.length > 0) {
      setItems(characteristics);
    }
  }, [characteristics]);

  const handleEdit = (characteristic: AICharacteristic) => {
    setSelectedCharacteristic(characteristic);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCharacteristic.mutate(id);
  };

  const handleSave = (data: any) => {
    if (selectedCharacteristic) {
      updateCharacteristic.mutate(data);
    } else {
      createCharacteristic.mutate(data);
    }
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setSelectedCharacteristic(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Atualizar display_order no banco
      const updates = newItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));
      reorderCharacteristics.mutate(updates);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {characteristics.length} característica{characteristics.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={() => setIsFormOpen(true)} size="sm">
          <Plus size={16} className="mr-2" />
          Adicionar Nova
        </Button>
      </div>

      {characteristics.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Nenhuma característica cadastrada</p>
          <Button onClick={() => setIsFormOpen(true)} variant="link" className="mt-2">
            Adicionar a primeira característica
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((characteristic) => (
                <SortableItem
                  key={characteristic.id}
                  characteristic={characteristic}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CharacteristicForm
        open={isFormOpen}
        onClose={handleClose}
        onSave={handleSave}
        characteristic={selectedCharacteristic}
        category={category}
      />
    </div>
  );
};
