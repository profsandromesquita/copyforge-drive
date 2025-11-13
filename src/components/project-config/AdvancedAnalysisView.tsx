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

const analysisFieldGroups = [
  {
    title: 'Base Psicológica',
    fields: [
      {
        key: 'psychographic_profile',
        label: 'Perfil Psicográfico',
        description: 'Valores centrais, estilo de vida, personalidade, identidade social e autoimagem',
        minChars: 200,
      },
      {
        key: 'consciousness_level',
        label: 'Nível de Consciência',
        description: 'Estágio de consciência do problema/solução (Eugene Schwartz) e barreiras mentais',
        minChars: 150,
      },
    ],
  },
  {
    title: 'Dimensão Emocional',
    fields: [
      {
        key: 'emotional_state',
        label: 'Estado Emocional',
        description: 'Emoções dominantes, intensidade, gatilhos e padrões de oscilação emocional',
        minChars: 150,
      },
      {
        key: 'hidden_pain',
        label: 'Dor Oculta',
        description: 'A dor real não verbalizada, sofrimento subjacente, o que mantém acordado',
        minChars: 200,
      },
      {
        key: 'primary_fear',
        label: 'Medo Primário',
        description: 'Medo fundamental que dirige comportamentos e consequências temidas',
        minChars: 150,
      },
      {
        key: 'emotional_desire',
        label: 'Desejo Emocional',
        description: 'Estado emocional desejado, como quer se sentir e ser visto',
        minChars: 150,
      },
    ],
  },
  {
    title: 'Dimensão Cognitiva',
    fields: [
      {
        key: 'problem_misperception',
        label: 'Percepção Errada do Problema',
        description: 'Diagnóstico equivocado, onde coloca a culpa, gap entre percebido e real',
        minChars: 150,
      },
      {
        key: 'internal_mechanism',
        label: 'Mecanismo Interno do Problema',
        description: 'Loop comportamental/mental que perpetua o problema (ciclo vicioso)',
        minChars: 200,
      },
      {
        key: 'limiting_belief',
        label: 'Crença Limitante',
        description: 'Crença central que sabota progresso, origem e manifestações',
        minChars: 150,
      },
      {
        key: 'internal_narrative',
        label: 'Narrativa Interna',
        description: 'História que conta para si mesmo, papel que se atribui no problema',
        minChars: 150,
      },
      {
        key: 'internal_contradiction',
        label: 'Contradição Interna',
        description: 'Conflitos entre desejos e ações, valores conflitantes, ambivalência',
        minChars: 150,
      },
    ],
  },
  {
    title: 'Dimensão Comportamental',
    fields: [
      {
        key: 'dominant_behavior',
        label: 'Comportamento Dominante',
        description: 'Padrão de ação mais frequente, situações gatilho, função que serve',
        minChars: 150,
      },
      {
        key: 'decision_trigger',
        label: 'Gatilho de Decisão',
        description: 'O que faz finalmente tomar ação, eventos que aceleram decisão',
        minChars: 150,
      },
      {
        key: 'communication_style',
        label: 'Estilo de Comunicação',
        description: 'Vocabulário, tom natural, expressões, gírias e metáforas usadas',
        minChars: 150,
      },
      {
        key: 'psychological_resistances',
        label: 'Resistências Psicológicas',
        description: 'Barreiras emocionais, auto-sabotagem, objeções internas',
        minChars: 150,
      },
    ],
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
    <div className="space-y-8">
      {analysisFieldGroups.map((group) => (
        <div key={group.title} className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">
            {group.title}
          </h3>
          <div className="space-y-4">
            {group.fields.map((field) => (
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
        </div>
      ))}
    </div>
  );
}