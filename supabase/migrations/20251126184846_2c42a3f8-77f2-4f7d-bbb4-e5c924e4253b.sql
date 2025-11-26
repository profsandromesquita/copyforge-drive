-- Adicionar coluna ai_instruction para armazenar instruções detalhadas da IA
ALTER TABLE ai_characteristics
ADD COLUMN ai_instruction TEXT;

COMMENT ON COLUMN ai_characteristics.ai_instruction IS 'Instruções detalhadas para a IA usar no prompt. Campo separado para manter description curto para UI.';

-- Migrar textos longos hardcoded para ai_instruction
-- OBJETIVOS
UPDATE ai_characteristics SET ai_instruction = 'Estruture a copy com foco total na conversão imediata.
Priorize clareza, urgência e prova.
A mensagem deve levar o leitor a tomar uma decisão agora, reforçando benefícios, diferenciais, promessa e garantia.
A chamada para ação deve ser explícita, forte e repetida ao longo da copy.' WHERE value = 'venda_direta';

UPDATE ai_characteristics SET ai_instruction = 'Foque em despertar interesse suficiente para que a pessoa deixe seus dados.
Priorize valor percebido, curiosidade e baixa fricção.
Destaque o que o lead recebe (materiais, aula, diagnóstico, bônus etc.) e por que vale a pena se cadastrar agora.' WHERE value = 'geracao_de_leads';

UPDATE ai_characteristics SET ai_instruction = 'A copy deve ser leve, compartilhável, memorável ou provocativa.
Priorize entretenimento, identificação e emoção.
Mantenha uma linguagem que incentive curtidas, comentários, compartilhamentos ou discussões.' WHERE value = 'engajamento_viralizacao';

UPDATE ai_characteristics SET ai_instruction = 'Estruture a mensagem para ensinar algo valioso ao leitor.
Priorize clareza, exemplos práticos e linguagem didática.
A copy deve entregar valor real, reforçar autoridade e preparar terreno para futuras ações (mesmo que a CTA seja leve).' WHERE value = 'educacao_conhecimento';

UPDATE ai_characteristics SET ai_instruction = 'A copy deve fortalecer relacionamento, confiança e conexão emocional.
Priorize reconhecimento, personalização, valorização do cliente e construção de proximidade.
A CTA é opcional, mas quando existir, deve ser suave e alinhada ao relacionamento.' WHERE value = 'retencao_fidelizacao';

UPDATE ai_characteristics SET ai_instruction = 'A copy deve apresentar algo complementar ao que a pessoa já possui.
Mostre como a nova oferta potencializa, melhora ou completa o que ela já adquiriu.
Priorize clareza, lógica e aumento de valor percebido.' WHERE value = 'upsell_cross_sell';

UPDATE ai_characteristics SET ai_instruction = 'Construa a copy de forma acolhedora, amigável e convidativa.
Relembre o valor, desperte interesse novamente e minimize barreiras para retorno.
Mostre o que mudou, o que melhorou e por que agora é o melhor momento para voltar.' WHERE value = 'reativacao';

-- ESTILOS
UPDATE ai_characteristics SET ai_instruction = 'Utilize narrativa envolvente, com personagens, contexto, conflito e transformação.
Crie uma história que conduza naturalmente ao ponto central da copy.' WHERE value = 'storytelling';

UPDATE ai_characteristics SET ai_instruction = 'Use afirmações fortes, opiniões incomuns e quebras de padrão.
Gere choque, debate ou reflexão, sempre mantendo coerência com a marca.' WHERE value = 'controverso_disruptivo';

UPDATE ai_characteristics SET ai_instruction = 'Utilize linguagem elegante, sensorial e sofisticada.
Foque em exclusividade, status, elevação de vida e desejo por algo superior.' WHERE value = 'aspiracional_luxo';

UPDATE ai_characteristics SET ai_instruction = 'Enfatize riscos, prazos, consequências e necessidade de ação imediata.
Crie senso de urgência claro e forte.' WHERE value = 'urgente_alarmista';

UPDATE ai_characteristics SET ai_instruction = 'Utilize lógica, fatos, números, evidências e explicações racionais.
O tom deve transmitir credibilidade e objetividade.' WHERE value = 'cientifico_baseado_em_dados';

UPDATE ai_characteristics SET ai_instruction = 'Escreva como se estivesse conversando com uma pessoa específica.
Frases simples, curtas, próximas e naturais.
Tom leve, humano e acolhedor.' WHERE value = 'conversacional_amigavel';

UPDATE ai_characteristics SET ai_instruction = 'Utilize elementos introspectivos, energéticos, simbólicos ou metafóricos.
Conduza o leitor a uma sensação de propósito, conexão ou transcendência.' WHERE value = 'mistico_espiritual';

-- FOCO EMOCIONAL
UPDATE ai_characteristics SET ai_instruction = 'Amplifique o problema, frustração ou sofrimento atual do público.
Mostre as consequências reais do problema e crie identificação profunda com a dor.
O foco é tornar a dor consciente e urgente.' WHERE value = 'dor';

UPDATE ai_characteristics SET ai_instruction = 'Mostre o resultado ideal, a transformação possível e o cenário pós-conquista.
Amplie a visão do futuro positivo e gere aspiração pelo que é possível alcançar.' WHERE value = 'desejo';

UPDATE ai_characteristics SET ai_instruction = 'Equilibre a apresentação do problema com a solução.
Mostre o "antes" frustrante e o "depois" transformador, criando contraste forte entre os dois cenários.' WHERE value = 'dor_desejo_balanceado';

UPDATE ai_characteristics SET ai_instruction = 'Use lógica, razão, dados e fundamentos para justificar a escolha.
Priorize credibilidade, evidências, fatos e argumentos sólidos.
Minimize emoção e maximize racionalidade.' WHERE value = 'racional_logico';

UPDATE ai_characteristics SET ai_instruction = 'Conduza o leitor a uma descoberta ou insight relevante.
Mostre algo que ele não sabia ou não percebia antes, gerando um "momento aha" estratégico.' WHERE value = 'revelacao_insight';