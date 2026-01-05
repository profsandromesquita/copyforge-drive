/**
 * Database Types - Single Source of Truth
 * 
 * Este arquivo deriva tipos do schema Supabase gerado automaticamente,
 * garantindo que TypeScript sempre esteja sincronizado com o banco de dados.
 * 
 * USO:
 * - Use Tables<'tabela'> para tipos de linha completos
 * - Use TablesInsert<'tabela'> para inserções
 * - Use TablesUpdate<'tabela'> para atualizações parciais
 * - Use Enums<'enum_name'> para enumerações do banco
 */

import type { 
  Tables, 
  TablesInsert, 
  TablesUpdate, 
  Enums,
  Json
} from '@/integrations/supabase/types';

// ============================================================================
// RE-EXPORTS DOS HELPERS SUPABASE
// ============================================================================

export type { Tables, TablesInsert, TablesUpdate, Enums, Json };

// ============================================================================
// TIPOS BASE DAS TABELAS (derivados do schema)
// ============================================================================

// Core entities
export type ProfileRow = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

export type WorkspaceRow = Tables<'workspaces'>;
export type WorkspaceInsert = TablesInsert<'workspaces'>;
export type WorkspaceUpdate = TablesUpdate<'workspaces'>;

export type WorkspaceMemberRow = Tables<'workspace_members'>;
export type ProjectRow = Tables<'projects'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type ProjectUpdate = TablesUpdate<'projects'>;

export type CopyRow = Tables<'copies'>;
export type CopyInsert = TablesInsert<'copies'>;
export type CopyUpdate = TablesUpdate<'copies'>;

export type FolderRow = Tables<'folders'>;
export type FolderInsert = TablesInsert<'folders'>;
export type FolderUpdate = TablesUpdate<'folders'>;

// Credits & Transactions
export type WorkspaceCreditsRow = Tables<'workspace_credits'>;
export type CreditTransactionRow = Tables<'credit_transactions'>;

// Subscriptions & Plans
export type SubscriptionPlanRow = Tables<'subscription_plans'>;
export type WorkspaceSubscriptionRow = Tables<'workspace_subscriptions'>;
export type PlanOfferRow = Tables<'plan_offers'>;
export type WorkspaceInvoiceRow = Tables<'workspace_invoices'>;

// Secure VIEWs (dados públicos/seguros)
export interface PublicWorkspacePlanSummary {
  workspace_id: string;
  plan_name: string;
  plan_slug: string;
  projects_count: number;
  copies_count: number;
  current_max_projects: number | null;
  current_max_copies: number | null;
  current_copy_ai_enabled: boolean;
  credits_per_month: number;
}

// AI & Prompts
export type AIPromptTemplateRow = Tables<'ai_prompt_templates'>;
export type AICharacteristicRow = Tables<'ai_characteristics'>;
export type AIGenerationHistoryRow = Tables<'ai_generation_history'>;

// Chat
export type CopyChatMessageRow = Tables<'copy_chat_messages'>;

// ============================================================================
// ENUMS DO BANCO
// ============================================================================

export type WorkspaceRole = Enums<'workspace_role'>;
export type SystemRole = Enums<'system_role'>;
export type BillingCycleType = Enums<'billing_cycle_type'>;
export type SubscriptionStatus = Enums<'subscription_status'>;
export type InvoiceStatus = Enums<'invoice_status'>;

// ============================================================================
// TIPOS PARA CAMPOS JSONB (fortemente tipados)
// ============================================================================

/**
 * Estrutura de um bloco de copy
 */
export type BlockType = 'text' | 'headline' | 'subheadline' | 'list' | 'button' | 'form' | 'image' | 'video' | 'audio' | 'faq' | 'testimonial';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  description: string;
  text: string;
  rating: number;
  photo?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone';
  label: string;
  placeholder: string;
  required: boolean;
}

export interface BlockConfig {
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontWeight?: string;
  listStyle?: 'bullets' | 'numbers' | 'check' | 'arrow' | 'star' | 'heart';
  showListIcons?: boolean;
  listIconColor?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  link?: string;
  buttonSubtitle?: string;
  buttonRounded?: boolean;
  buttonIcon?: 'none' | 'check' | 'arrow-right' | 'star' | 'heart' | 'download' | 'play' | 'shopping-cart' | 'plus';
  formTitle?: string;
  formButtonText?: string;
  formButtonColor?: string;
  formFields?: FormField[];
  imageUrl?: string;
  imageDescription?: string;
  aspectRatio?: string;
  imageSize?: 'sm' | 'md' | 'lg';
  roundedBorders?: boolean;
  videoUrl?: string;
  videoTitle?: string;
  videoSize?: 'sm' | 'md' | 'lg';
  audioUrl?: string;
  audioTitle?: string;
  audioArtist?: string;
  showControls?: boolean;
  showWaveform?: boolean;
  faqTitle?: string;
  showNumbering?: boolean;
  expandedByDefault?: boolean;
  faqItems?: FAQItem[];
  testimonialTitle?: string;
  showPhotos?: boolean;
  showRatings?: boolean;
  testimonialItems?: TestimonialItem[];
  isNewFromChat?: boolean;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string | string[];
  config: BlockConfig;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  blocks: Block[];
  comments?: Comment[];
  // Variation grouping fields
  variationId?: string;           // ID da variação (sessions com mesmo ID = mesma variação)
  variationName?: string;         // Nome da variação (apenas na primeira session do grupo)
  isVariationCollapsed?: boolean; // Estado de colapso (apenas na primeira session do grupo)
}

/**
 * Variação agrupada (derivada de sessions para UI)
 */
export interface Variation {
  id: string;
  name: string;
  sessions: Session[];
  isCollapsed: boolean;
}

/**
 * Estrutura de metodologia do projeto
 */
export interface MethodologyJson {
  id: string;
  name: string;
  tese_central: string;
  mecanismo_primario: string;
  por_que_funciona: string;
  erro_invisivel: string;
  diferenciacao: string;
  principios_fundamentos: string;
  etapas_metodo: string;
  transformacao_real: string;
  prova_funcionamento: string;
}

/**
 * Gatilhos mentais com ranking
 */
export interface MentalTriggersJson {
  escassez: { rank: number; justificativa: string };
  autoridade: { rank: number; justificativa: string };
  prova_social: { rank: number; justificativa: string };
  reciprocidade: { rank: number; justificativa: string };
  consistencia: { rank: number; justificativa: string };
  afinidade: { rank: number; justificativa: string };
  antecipacao: { rank: number; justificativa: string };
  exclusividade: { rank: number; justificativa: string };
}

/**
 * Análise avançada de audiência (16 dimensões psicológicas)
 */
export interface AdvancedAnalysisJson {
  psychographic_profile: string;
  consciousness_level: string;
  emotional_state: string;
  hidden_pain: string;
  primary_fear: string;
  emotional_desire: string;
  problem_misperception: string;
  internal_mechanism: string;
  limiting_belief: string;
  internal_narrative: string;
  internal_contradiction: string;
  dominant_behavior: string;
  decision_trigger: string;
  communication_style: string;
  psychological_resistances: string;
  mental_triggers?: MentalTriggersJson;
}

/**
 * Segmento de audiência completo
 */
export interface AudienceSegmentJson {
  id: string;
  who_is: string;
  biggest_desire: string;
  biggest_pain: string;
  failed_attempts: string;
  beliefs: string;
  behavior: string;
  journey: string;
  is_completed?: boolean;
  advanced_analysis?: AdvancedAnalysisJson;
  analysis_generated_at?: string;
}

/**
 * Oferta do projeto
 */
export type OfferType = 'subscription' | 'course' | 'ebook' | 'event' | 'physical' | 'other' | 'software' | 'consulting' | 'mentoring' | 'ai';

export interface OfferJson {
  id: string;
  name: string;
  type: OfferType;
  short_description: string;
  main_benefit: string;
  unique_mechanism: string;
  differentials: string[];
  proof: string;
  guarantee: string;
  cta: string;
}

/**
 * Paleta de cores do projeto
 */
export interface ColorPaletteJson {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

/**
 * System instruction estruturada
 */
export interface SystemInstructionJson {
  basePrompt?: string;
  projectContext?: string;
  audienceContext?: string;
  offerContext?: string;
  methodologyContext?: string;
  characteristics?: string;
  fullInstruction?: string;
}

// ============================================================================
// TIPOS COMPOSTOS (base + JSONB tipado)
// ============================================================================

/**
 * Copy com campos JSONB tipados
 */
export interface TypedCopy extends Omit<CopyRow, 'sessions' | 'system_instruction'> {
  sessions: Session[];
  system_instruction: SystemInstructionJson | null;
}

/**
 * Project com campos JSONB tipados
 */
export interface TypedProject extends Omit<ProjectRow, 'methodology' | 'audience_segments' | 'offers' | 'color_palette'> {
  methodology: MethodologyJson | MethodologyJson[] | null;
  audience_segments: AudienceSegmentJson[] | null;
  offers: OfferJson[] | null;
  color_palette: ColorPaletteJson | null;
}

/**
 * AI Generation History com campos tipados
 */
export interface TypedAIGenerationHistory extends Omit<AIGenerationHistoryRow, 'sessions' | 'system_instruction' | 'project_identity' | 'audience_segment' | 'offer'> {
  sessions: Session[];
  system_instruction: SystemInstructionJson | null;
  project_identity: Partial<TypedProject> | null;
  audience_segment: AudienceSegmentJson | null;
  offer: OfferJson | null;
}

// ============================================================================
// TIPOS DE UTILIDADE
// ============================================================================

/**
 * Helper para extrair tipo de join com profiles
 */
export interface WithCreator {
  creator: Pick<ProfileRow, 'name' | 'email' | 'avatar_url'> | null;
}

/**
 * Helper para extrair tipo de join com projects
 */
export interface WithProject {
  project: Pick<ProjectRow, 'name'> | null;
}

/**
 * Copy com joins comuns
 */
export type CopyWithRelations = TypedCopy & WithCreator & WithProject;

/**
 * Folder com creator
 */
export type FolderWithCreator = FolderRow & WithCreator;

// ============================================================================
// WEBHOOK & PAYMENT TYPES
// ============================================================================

/**
 * Ticto Webhook Payload Structure
 * Based on actual webhook data from Ticto payment gateway
 */
export interface TictoWebhookPayload {
  event?: string;
  order?: {
    id?: string;
    paid_amount?: string;
    currency?: string;
    status?: string;
    payment_method?: string;
    created_at?: string;
  };
  item?: {
    offer_id?: string;
    offer_name?: string;
    product_id?: string;
    product_name?: string;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
    cpf?: string;
    cnpj?: string;
  };
  subscription?: {
    id?: string;
    status?: string;
    plan_id?: string;
  };
  query_params?: {
    workspace_id?: string;
    [key: string]: string | undefined;
  };
  url_params?: {
    workspace_id?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Payment Gateway Configuration
 */
export interface PaymentGatewayConfig {
  validation_token?: string;
  webhook_url?: string;
  api_key?: string;
  sandbox_mode?: boolean;
  [key: string]: string | boolean | undefined;
}

/**
 * Webhook Headers
 */
export interface WebhookHeaders {
  'content-type'?: string;
  'x-webhook-signature'?: string;
  'user-agent'?: string;
  [key: string]: string | undefined;
}

/**
 * AI Generation Tokens Info (for streaming responses)
 */
export interface AITokensInfo {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  model?: string;
}

/**
 * History Item for AI Generation History (UI-friendly interface)
 */
export interface AIGenerationHistoryItem {
  id: string;
  generation_type: string;
  generation_category: string | null;
  created_at: string;
  prompt: string;
  model_used: string | null;
  sessions: Session[];
  original_content: Session[] | null;
  copy_type: string | null;
  was_auto_routed: boolean | null;
  parameters: {
    objectives?: string[];
    styles?: string[];
    size?: string;
    [key: string]: unknown;
  } | null;
}

// ============================================================================
// SECURE VIEW TYPES (PII Protection)
// ============================================================================

/**
 * BasicProfile - VIEW segura para dados públicos de perfil (sem PII)
 * Use esta interface para listar membros de workspace e exibir avatares.
 * NÃO inclui: CPF, telefone, endereço
 */
export interface BasicProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}
