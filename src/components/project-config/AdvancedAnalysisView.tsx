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
    description: 'Estágio de consciência do problema/solução (Eugene Schwartz) e barreiras mentais',
    minChars: 150,
  },
  {
    key: 'psychographic_profile',
    label: 'Perfil Psicográfico',
    description: 'Valores centrais, estilo de vida, personalidade, identidade social e autoimagem',
    minChars: 200,
  },
  {
    key: 'pains_frustrations',
    label: 'Dores e Frustrações',
    description: 'Mapeamento completo das dores, frustrações diárias e impactos emocionais',
    minChars: 200,
  },
  {
    key: 'desires_aspirations',
    label: 'Desejos e Aspirações',
    description: 'Objetivos de longo prazo, versão ideal de si mesmo e mudanças desejadas',
    minChars: 150,
  },
  {
    key: 'behaviors_habits',
    label: 'Comportamentos e Hábitos',
    description: 'Rotina diária, hábitos de consumo de conteúdo, rituais e padrões de decisão',
    minChars: 180,
  },
  {
    key: 'language_communication',
    label: 'Linguagem e Comunicação',
    description: 'Vocabulário específico, tom natural, expressões, gírias e metáforas usadas',
    minChars: 150,
  },
  {
    key: 'influences_references',
    label: 'Influências e Referências',
    description: 'Autoridades que segue, criadores de conteúdo, marcas e comunidades relevantes',
    minChars: 120,
  },
  {
    key: 'internal_barriers',
    label: 'Barreiras e Bloqueios Internos',
    description: 'Crenças limitantes, medos, auto-sabotagem e resistências emocionais',
    minChars: 150,
  },
  {
    key: 'anti_persona',
    label: 'Anti-Persona',
    description: 'Perfil de quem definitivamente NÃO é esse público e características opostas',
    minChars: 100,
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