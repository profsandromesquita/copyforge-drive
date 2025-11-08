import { AudienceSegment } from "@/types/project-config";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

interface AdvancedAnalysisViewProps {
  segment: AudienceSegment;
  isEditing: boolean;
  editedAnalysis: any;
  onFieldChange: (field: string, value: string) => void;
}

const analysisFields = [
  {
    key: 'consciousness_level',
    label: 'Nível de Consciência',
    description: 'Nível de Eugene Schwartz e implicações para a copy',
    minChars: 100,
  },
  {
    key: 'vocabulary',
    label: 'Vocabulário e Linguagem',
    description: 'Palavras/frases específicas, tom ideal, o que nunca dizer',
    minChars: 150,
  },
  {
    key: 'objections',
    label: 'Objeções Priorizadas',
    description: 'Top 5 objeções com estratégias de neutralização',
    minChars: 200,
  },
  {
    key: 'copy_angles',
    label: 'Ângulos de Entrada',
    description: '3-5 formas diferentes de fisgar esse público',
    minChars: 150,
  },
  {
    key: 'mental_triggers',
    label: 'Gatilhos Mentais',
    description: 'Top 3 que funcionam e gatilhos a evitar',
    minChars: 100,
  },
  {
    key: 'copy_structure',
    label: 'Estrutura de Copy',
    description: 'Framework recomendado e esqueleto sugerido',
    minChars: 100,
  },
  {
    key: 'timing_context',
    label: 'Timing e Contexto',
    description: 'Melhor momento para impactar e gatilhos de urgência',
    minChars: 80,
  },
  {
    key: 'anti_persona',
    label: 'Perfil Anti-Persona',
    description: 'Quem NÃO deveria comprar',
    minChars: 80,
  },
  {
    key: 'example_copy',
    label: 'Exemplo de Copy',
    description: 'Parágrafo exemplo aplicando os insights',
    minChars: 50,
  },
];

export function AdvancedAnalysisView({
  segment,
  isEditing,
  editedAnalysis,
  onFieldChange,
}: AdvancedAnalysisViewProps) {
  if (!segment.advanced_analysis) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Análise ainda não foi gerada
      </div>
    );
  }

  const analysis = isEditing ? editedAnalysis : segment.advanced_analysis;

  return (
    <div className="space-y-6">
      {analysisFields.map((field) => (
        <Card key={field.key} className="p-4">
          <div className="space-y-2">
            <div>
              <Label className="text-base font-semibold">{field.label}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {field.description}
              </p>
            </div>
            
            {isEditing ? (
              <Textarea
                value={analysis[field.key] || ''}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                className="min-h-[120px] resize-none font-mono text-sm"
                placeholder={`Digite ${field.label.toLowerCase()}...`}
              />
            ) : (
              <div className="bg-muted/30 rounded-md p-4 prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>
                  {analysis[field.key] || 'Não preenchido'}
                </ReactMarkdown>
              </div>
            )}
            
            {isEditing && (
              <p className="text-xs text-muted-foreground text-right">
                {(analysis[field.key] || '').length} / {field.minChars} caracteres mínimos
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}