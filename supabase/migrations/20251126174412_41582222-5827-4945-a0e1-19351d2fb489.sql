-- ========================================
-- PARTE 1: Atualização dos Templates com Protocolo de Vínculo
-- ========================================

-- Atualizar template optimize_copy_otimizar
UPDATE ai_prompt_templates
SET current_prompt = '=== PROTOCOLO DE VÍNCULO ===
Ao otimizar, você NÃO pode descaracterizar a copy.
1. **Metodologia**: Mantenha a terminologia do "Mecanismo Único" (se fornecido no contexto). Não substitua por termos genéricos.
2. **Persona**: Se o contexto fornecer "Vocabulário/Gírias", garanta que a versão otimizada use esses termos.
3. **Objetivo**: Se o usuário pedir "mais agressivo", use os "Gatilhos Mentais" da psicografia.

' || current_prompt,
  updated_at = NOW()
WHERE prompt_key = 'optimize_copy_otimizar'
  AND is_active = true;

-- Atualizar template optimize_copy_variacao
UPDATE ai_prompt_templates
SET current_prompt = '=== PROTOCOLO DE VÍNCULO ===
Ao criar variações, mude o ângulo, mas mantenha a ALMA do projeto.
1. **Ângulos Válidos**: Use as "Dores" e "Desejos" do contexto como eixos de variação.
   - Variação A: Foco na "Dor Oculta"
   - Variação B: Foco no "Mecanismo Único"
2. **Proibido**: Nunca crie uma variação que contradiga a "Tese Central" da metodologia.

' || current_prompt,
  updated_at = NOW()
WHERE prompt_key = 'optimize_copy_variacao'
  AND is_active = true;