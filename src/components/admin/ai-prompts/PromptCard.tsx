import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilSimple, ClockCounterClockwise, ArrowCounterClockwise } from "phosphor-react";
import { AIPromptTemplate } from "@/types/ai-prompts";

interface PromptCardProps {
  prompt: AIPromptTemplate;
  onEdit: (prompt: AIPromptTemplate) => void;
  onHistory: (prompt: AIPromptTemplate) => void;
  onRestore: (id: string) => void;
}

export const PromptCard = ({ prompt, onEdit, onHistory, onRestore }: PromptCardProps) => {
  const isModified = prompt.current_prompt !== prompt.default_prompt;
  
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <CardTitle className="text-lg break-words leading-tight">{prompt.name}</CardTitle>
              {isModified && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex-shrink-0">
                  Modificado
                </Badge>
              )}
              {!isModified && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 flex-shrink-0">
                  Padrão
                </Badge>
              )}
            </div>
            <CardDescription className="break-words">{prompt.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground break-words">
            <strong>Propósito:</strong> {prompt.purpose}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit(prompt)}
            className="gap-2"
          >
            <PencilSimple size={16} />
            Editar
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onHistory(prompt)}
            className="gap-2"
          >
            <ClockCounterClockwise size={16} />
            Histórico
          </Button>
          {isModified && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onRestore(prompt.id)}
              className="gap-2 text-amber-600 hover:text-amber-700"
            >
              <ArrowCounterClockwise size={16} />
              Restaurar Padrão
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
