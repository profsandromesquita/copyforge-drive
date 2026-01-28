

# Plano de Correção Definitiva: Botão "Regenerar" - Informações Avançadas

## Diagnóstico Detalhado

### Problemas Identificados

A investigação revelou **três problemas distintos** que podem contribuir para o conteúdo incompleto:

#### 1. Truncamento da Resposta da IA (Causa Raiz Principal)
Os dados no banco de dados mostram que o campo `dominant_behavior` do projeto "Comunidade SubHumano" contém apenas `"O comportamento dominante é a "` - uma frase incompleta/truncada.

Isso indica que a API de IA está cortando a resposta antes de completar todos os campos. A análise dos logs mostra:
- `output_tokens: 2796` - relativamente baixo para 16 campos densos
- O código define `max_tokens: 8000`, mas a IA pode estar parando antes por outras razões
- **Não há verificação de `finish_reason`** para detectar truncamento

#### 2. Uso de Prop Estática no handleRegenerate
No arquivo `AdvancedAnalysisTab.tsx`, a função `handleRegenerate` usa `segment` (prop original) ao invés de `localSegment`:

```typescript
// Linha 159 - PROBLEMA
segment,  // ← Usa prop original

// Linha 183-184 - PROBLEMA  
const updatedSegment: AudienceSegment = {
  ...segment,  // ← Usa prop original, não localSegment
```

Isso pode causar dessincronização entre o que é enviado para a API e o estado local.

#### 3. Falta de Validação da Resposta da IA
O código não valida se todos os campos obrigatórios foram retornados com conteúdo válido antes de salvar.

---

## Solução Proposta

### Arquivo 1: `supabase/functions/analyze-audience/index.ts`

#### Alteração 1.1: Aumentar max_tokens e adicionar verificação de truncamento

**Localização**: Linha 132

```typescript
// DE:
max_tokens: 8000,

// PARA:
max_tokens: 12000,  // Aumentar para garantir resposta completa
```

#### Alteração 1.2: Verificar finish_reason após resposta

**Localização**: Após linha 328 (após `const aiData = await aiResponse.json();`)

Adicionar verificação:
```typescript
const aiData = await aiResponse.json();

// Verificar se a resposta foi truncada
const finishReason = aiData.choices?.[0]?.finish_reason;
if (finishReason === 'length') {
  console.error('AVISO: Resposta da IA foi truncada por limite de tokens');
  // Ainda processa, mas registra o problema
}
```

#### Alteração 1.3: Adicionar validação de campos obrigatórios

**Localização**: Após linha 335 (após `const analysis = JSON.parse(...)`)

Adicionar validação:
```typescript
const analysis = JSON.parse(toolCall.function.arguments);

// Validar campos críticos
const requiredFields = [
  'psychographic_profile', 'consciousness_level', 'emotional_state',
  'hidden_pain', 'primary_fear', 'emotional_desire', 'problem_misperception',
  'internal_mechanism', 'limiting_belief', 'internal_narrative',
  'internal_contradiction', 'dominant_behavior', 'decision_trigger',
  'communication_style', 'psychological_resistances'
];

const incompleteFields = requiredFields.filter(field => {
  const value = analysis[field];
  return !value || typeof value !== 'string' || value.length < 50;
});

if (incompleteFields.length > 0) {
  console.warn('Campos incompletos detectados:', incompleteFields);
  // Opcionalmente, tentar nova geração ou retornar erro específico
}
```

#### Alteração 1.4: Adicionar logging detalhado do conteúdo

**Localização**: Após parsing do analysis

```typescript
// Log para debug de campos críticos
console.log('Campos gerados:', Object.keys(analysis));
console.log('Tamanho dominant_behavior:', analysis.dominant_behavior?.length || 0);
```

---

### Arquivo 2: `src/components/project-config/AdvancedAnalysisTab.tsx`

#### Alteração 2.1: Corrigir handleRegenerate para usar localSegment

**Localização**: Linhas 157-187 (função handleRegenerate)

```typescript
// Linha 159 - CORRIGIR
// DE:
segment,

// PARA:
segment: localSegment,

// Linhas 183-184 - CORRIGIR  
// DE:
const updatedSegment: AudienceSegment = {
  ...segment,

// PARA:
const updatedSegment: AudienceSegment = {
  ...localSegment,
```

#### Alteração 2.2: Corrigir handleGenerate para usar localSegment

**Localização**: Linhas 92-95 e 118-119 (função handleGenerate)

```typescript
// Linha 94 - CORRIGIR
// DE:
segment,

// PARA:
segment: localSegment,

// Linhas 118-119 - CORRIGIR
// DE:
const updatedSegment: AudienceSegment = {
  ...segment,

// PARA:
const updatedSegment: AudienceSegment = {
  ...localSegment,
```

#### Alteração 2.3: Adicionar atualização de editedAnalysis após regeneração

**Localização**: Após `setLocalSegment(updatedSegment)` na handleRegenerate

```typescript
// Atualizar estado local imediatamente para refletir na UI
setLocalSegment(updatedSegment);
// Também atualizar editedAnalysis para manter sincronizado
setEditedAnalysis(data.analysis);
```

---

## Resumo das Alterações

| Arquivo | Alteração | Propósito |
|---------|-----------|-----------|
| `analyze-audience/index.ts` | Aumentar max_tokens para 12000 | Evitar truncamento por limite de tokens |
| `analyze-audience/index.ts` | Verificar finish_reason | Detectar e logar truncamentos |
| `analyze-audience/index.ts` | Validar campos obrigatórios | Garantir integridade dos dados |
| `analyze-audience/index.ts` | Adicionar logging detalhado | Facilitar debug futuro |
| `AdvancedAnalysisTab.tsx` | Usar localSegment nas funções | Garantir consistência de dados |
| `AdvancedAnalysisTab.tsx` | Atualizar editedAnalysis | Sincronizar estado de edição |

---

## Resultado Esperado

Após a implementação:

1. A IA terá mais espaço (12000 tokens) para gerar respostas completas
2. Truncamentos serão detectados e logados para investigação
3. Campos incompletos serão identificados antes de salvar
4. O frontend usará sempre os dados mais atualizados
5. O conteúdo regenerado será exibido corretamente na UI

---

## Restrições Respeitadas

- Apenas arquivos diretamente relacionados ao fluxo de regeneração foram alterados
- Nenhuma funcionalidade externa foi modificada
- A lógica de edição, salvamento e fechamento permanece inalterada

