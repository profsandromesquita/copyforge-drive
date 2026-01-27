
# Plano de Correção: Botão "Regenerar" em Informações Avançadas

## Contexto do Problema

Na página "/my-project", na aba "Informações Avançadas", o botão "Regenerar" não está atualizando o conteúdo exibido após a regeneração. A análise é gerada corretamente no backend e salva no banco de dados, mas a interface não reflete os novos dados.

## Causa Raiz

O componente `AdvancedAnalysisTab` sofre de um problema de **sincronização de estado**:

1. A prop `segment` passada para o componente é **estática** - definida uma vez quando o formulário é aberto
2. Após a regeneração, o componente chama `onUpdate()` e `refreshProjects()`, mas continua renderizando com base na prop `segment` original
3. O `AdvancedAnalysisView` (linha 289) recebe `segment` diretamente, não os dados atualizados

```text
┌─────────────────────────────────────────────────────────────────┐
│ FLUXO ATUAL (COM BUG)                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. handleRegenerate() → Chama API → Recebe nova análise ✓     │
│  2. Salva no banco de dados ✓                                   │
│  3. onUpdate(updatedSegments) → Atualiza pai ✓                 │
│  4. refreshProjects() → Recarrega dados ✓                      │
│  5. AdvancedAnalysisView recebe segment (ANTIGO) ✗            │
│     ↓                                                           │
│  UI NÃO ATUALIZA - mostra dados antigos                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Solução Proposta

Introduzir um **estado local** `localSegment` no `AdvancedAnalysisTab` que é atualizado imediatamente após a regeneração bem-sucedida, e usar esse estado para renderização.

```text
┌─────────────────────────────────────────────────────────────────┐
│ FLUXO CORRIGIDO                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. handleRegenerate() → Chama API → Recebe nova análise ✓     │
│  2. Salva no banco de dados ✓                                   │
│  3. setLocalSegment(updatedSegment) → Atualiza estado local ✓ │
│  4. onUpdate(updatedSegments) → Atualiza pai ✓                 │
│  5. AdvancedAnalysisView recebe localSegment (NOVO) ✓         │
│     ↓                                                           │
│  UI ATUALIZA IMEDIATAMENTE                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementação Técnica

### Arquivo: `src/components/project-config/AdvancedAnalysisTab.tsx`

#### 1. Adicionar Estado Local para Segment

**Localização**: Após linha 29 (onde `isGenerating` é declarado)

```typescript
// Estado local que pode ser atualizado após regeneração
const [localSegment, setLocalSegment] = useState<AudienceSegment>(segment);
```

#### 2. Sincronizar Estado Local com Prop

**Localização**: Após linha 29, adicionar useEffect

```typescript
// Sincronizar quando prop segment mudar externamente
useEffect(() => {
  setLocalSegment(segment);
  setEditedAnalysis(segment.advanced_analysis || null);
}, [segment.id, segment.advanced_analysis]);
```

#### 3. Atualizar handleGenerate

**Localização**: Linha 71-132, modificar para atualizar `localSegment`

Após a linha `onUpdate(updatedSegments);` (linha 120), adicionar:
```typescript
// Atualizar estado local imediatamente para refletir na UI
setLocalSegment(updatedSegment);
```

#### 4. Atualizar handleRegenerate

**Localização**: Linha 134-195, modificar para atualizar `localSegment`

Após a linha `onUpdate(updatedSegments);` (linha 183), adicionar:
```typescript
// Atualizar estado local imediatamente para refletir na UI
setLocalSegment(updatedSegment);
```

#### 5. Atualizar handleSave

**Localização**: Linha 36-64, modificar para usar e atualizar `localSegment`

Alterar para atualizar o `localSegment` após salvar edições manuais.

#### 6. Atualizar Renderização

**Localização**: Linha 205 e 234

Alterar verificação de análise existente de:
```typescript
if (!segment.advanced_analysis) {
```

Para:
```typescript
if (!localSegment.advanced_analysis) {
```

**Localização**: Linha 234-238

Alterar exibição de data de:
```typescript
{segment.analysis_generated_at && (
```

Para:
```typescript
{localSegment.analysis_generated_at && (
```

**Localização**: Linha 289-294

Alterar passagem de props para `AdvancedAnalysisView` de:
```typescript
<AdvancedAnalysisView
  segment={segment}
  // ...
/>
```

Para:
```typescript
<AdvancedAnalysisView
  segment={localSegment}
  // ...
/>
```

---

## Resumo das Alterações

| Linha | Alteração |
|-------|-----------|
| ~30 | Adicionar estado `localSegment` |
| ~31-34 | Adicionar `useEffect` para sincronização |
| ~120 | Adicionar `setLocalSegment(updatedSegment)` em `handleGenerate` |
| ~183 | Adicionar `setLocalSegment(updatedSegment)` em `handleRegenerate` |
| ~54 | Atualizar `localSegment` em `handleSave` |
| ~205 | Trocar `segment` por `localSegment` na verificação |
| ~234-238 | Trocar `segment` por `localSegment` na exibição de data |
| ~289 | Trocar `segment` por `localSegment` no `AdvancedAnalysisView` |

## Arquivos Modificados

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/components/project-config/AdvancedAnalysisTab.tsx` | Modificação de lógica de estado |

## Resultado Esperado

Após a implementação:
1. Clicar em "Regenerar" chamará a API e gerará nova análise
2. A UI será atualizada **imediatamente** com o novo conteúdo
3. A data "Gerada em:" será atualizada para refletir o novo timestamp
4. Não será necessário recarregar a página ou navegar entre abas
5. Funcionalidades existentes (Editar, Salvar, Concluir e Fechar) continuarão funcionando normalmente
