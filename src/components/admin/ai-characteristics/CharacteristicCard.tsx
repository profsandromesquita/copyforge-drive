import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { AICharacteristic } from "@/hooks/useAICharacteristics";

interface CharacteristicCardProps {
  characteristic: AICharacteristic;
  onEdit: (characteristic: AICharacteristic) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: any;
}

export const CharacteristicCard = ({ characteristic, onEdit, onDelete, dragHandleProps }: CharacteristicCardProps) => {
  const handleDelete = () => {
    if (confirm('Tem certeza que deseja deletar esta característica?')) {
      onDelete(characteristic.id);
    }
  };

  return (
    <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div 
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...dragHandleProps}
      >
        <GripVertical size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{characteristic.label}</h4>
          <Badge variant="outline" className="text-xs">
            {characteristic.value}
          </Badge>
          {characteristic.is_active ? (
            <Badge variant="default" className="text-xs">Ativo</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Inativo</Badge>
          )}
        </div>
        {characteristic.description && (
          <p className="text-sm text-muted-foreground truncate">
            {characteristic.description}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(characteristic)}
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </Card>
  );
};
