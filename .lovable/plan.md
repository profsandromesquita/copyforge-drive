
## O que eu já investiguei (com evidência)

### 1) O problema NÃO é “UI não atualiza”
A UI está exibindo exatamente o que está salvo no banco para esse público/projeto.

Eu consultei os dados do projeto **“Comunidade SubHumano”** no workspace **“Sandro Mesquita”** e encontrei que o campo:

- `advanced_analysis.dominant_behavior` está salvo como **"O comportamento dominante é a  "**  
- tamanho: **30 caracteres** (muito abaixo do esperado)

Ao mesmo tempo, os outros campos estão longos (300–500 caracteres). Ou seja: **a geração está vindo “boa” em quase tudo, mas especificamente `dominant_behavior` vem vazio/incompleto** e é isso que você vê na tela.

### 2) Causa raiz real (backend)
A função `analyze-audience` hoje:
- aceita o retorno do modelo mesmo com campo incompleto (apenas dá `console.warn`)
- **depois debita créditos**
- e retorna `analysis` para o frontend salvar

Ou seja: quando o modelo devolve `dominant_behavior` incompleto (mesmo que raramente), **o sistema permite persistir o erro**.

O aumento de `max_tokens` para 12000 não resolve porque:
- o problema não é falta de tokens do output total (os outros campos vêm completos)
- o modelo simplesmente está retornando **um valor curto para 1 campo** dentro do JSON (tool call) e o código aceita.

## Objetivo do conserto definitivo
Garantir que, ao clicar em **Regenerar**, o sistema **nunca** salve (nem mostre) uma análise com `dominant_behavior` incompleto.

Para isso, precisamos de um mecanismo de **validação + correção automática** no backend.

---

## Plano de correção definitiva (mínimo impacto e focado só no fluxo “Regenerar/Gerar análise”)

### A) Corrigir definitivamente no backend (principal)
**Arquivo:** `supabase/functions/analyze-audience/index.ts`

#### A1) Tornar a validação “bloqueante”, não só log
- Transformar a validação atual em uma regra:
  - se `dominant_behavior` (e demais campos críticos) vier com tamanho < mínimo, a função **não pode** retornar sucesso “como se estivesse OK”.

Definir mínimo alinhado com a UI:
- `dominant_behavior`: **>= 150 chars**
- (podemos manter 150 para os demais campos críticos também, ou seguir uma tabela por campo)

#### A2) Implementar “auto-repair” (1–2 tentativas) para completar SOMENTE os campos incompletos
Quando detectar campos incompletos, executar automaticamente uma segunda chamada de IA para preencher apenas os campos faltantes.

Estratégia:
1. Primeira chamada: gera a análise completa (como hoje).
2. Valida.
3. Se houver incompletos (ex.: `dominant_behavior`):
   - fazer uma segunda chamada com um **tool schema que contém somente os campos incompletos** como `required`
   - instrução explícita: “gere novamente apenas esses campos; mínimo 150 caracteres; 2–4 frases; não deixe frases incompletas”.
4. Merge: sobrescrever no objeto final somente os campos reparados.
5. Validar novamente:
   - se OK: retorna sucesso
   - se ainda falhar: retorna erro controlado (422) e **não cobra créditos**

Modelos:
- manter a primeira chamada no modelo atual (para não mudar comportamento geral)
- usar um modelo mais robusto apenas na etapa de “repair” (ex.: `google/gemini-3-flash-preview`) para aumentar a taxa de sucesso do campo problemático, sem encarecer tudo.

#### A3) Debitar créditos SOMENTE se a análise final for válida
Hoje debita sempre. Vamos alterar para:
- somar tokens das tentativas (1ª + repair, se houver)
- debitar somente se o retorno final passou na validação

Se falhar (422):
- não debita
- retorna payload de erro amigável e rastreável:
  ```json
  {
    "error": "incomplete_analysis",
    "incomplete_fields": ["dominant_behavior"],
    "message": "A análise veio incompleta. Tente novamente."
  }
  ```

#### A4) Melhorar logs (para auditoria e rastreio do problema)
Adicionar logs que não dependem de “adivinhar”:
- `workspace_id`, `segment.id` (se existir), e lista de `incomplete_fields`
- tamanho de cada campo incompleto
- número de tentativas realizadas
- `finish_reason` quando disponível

Isso garante que, se ainda ocorrer, teremos prova objetiva no log do porquê e em que etapa falhou.

---

### B) Ajuste mínimo no frontend para lidar com o novo erro “422 incomplete_analysis”
**Arquivo:** `src/components/project-config/AdvancedAnalysisTab.tsx`

Hoje o frontend só trata bem:
- `insufficient_credits`
- `rate_limit`
- demais viram “Erro ao regenerar análise. Tente novamente.”

Vamos ajustar apenas o necessário:
- se o backend retornar `incomplete_analysis`, mostrar toast específico:
  - “A IA retornou uma análise incompleta (Comportamento Dominante). Clique em Regenerar novamente.”
- e **não** atualizar estado local nem salvar no banco (isso já acontece automaticamente se a função retornar status != 200; mas garantiremos mensagem clara para o usuário)

Observação: não vamos mexer no resto do fluxo (edição, salvar manual, fechar etc.).

---

## Como vou validar que ficou resolvido (checklist objetivo)

1) No projeto problemático (Sandro Mesquita → Comunidade SubHumano), clicar “Regenerar” 3–5 vezes.
2) Em todas as vezes:
   - `dominant_behavior` deve ter **>= 150 caracteres**
   - deve ser um texto completo (não terminar em “é a”, “é o”, etc.)
3) Confirmar que, se a IA falhar em alguma tentativa:
   - o usuário vê um toast “análise incompleta”
   - a análise anterior não é sobrescrita
   - créditos não são debitados no backend nessa tentativa falha
4) Conferir logs da função para:
   - presença de `attempt=1/2`, `incomplete_fields`
   - tokens contabilizados corretamente

---

## Riscos e como mitigaremos

- **Risco:** Repair loop infinito  
  **Mitigação:** limitar tentativas (máximo 2: geração + 1 repair; ou 3 no máximo).
- **Risco:** custo de tokens maior em casos raros  
  **Mitigação:** repair só roda quando necessário; e podemos usar repair com prompt bem curto + schema minimal.
- **Risco:** “mudança de comportamento” do texto final  
  **Mitigação:** não mudar o modelo principal; apenas usar modelo melhor no repair do campo faltante.

---

## Entregáveis (arquivos que serão alterados)
1) `supabase/functions/analyze-audience/index.ts`  
   - validação bloqueante  
   - auto-repair de campos incompletos  
   - débito condicionado a sucesso  
   - logs melhores  
2) `src/components/project-config/AdvancedAnalysisTab.tsx`  
   - tratamento de erro `incomplete_analysis` (toast específico)

Nada além desses pontos será alterado, para respeitar sua restrição de escopo.

