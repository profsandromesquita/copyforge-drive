-- =============================================
-- FASE 2: INTEGRIDADE ESTRUTURAL (Schema Hardening)
-- Aplicação de Foreign Keys + Índices de Performance
-- =============================================

-- =============================================
-- PARTE 1: FOREIGN KEYS - TABELAS CORE
-- =============================================

-- copies (4 FKs)
ALTER TABLE copies 
  ADD CONSTRAINT fk_copies_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_copies_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_copies_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_copies_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;

-- projects (2 FKs)
ALTER TABLE projects 
  ADD CONSTRAINT fk_projects_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_projects_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- folders (4 FKs)
ALTER TABLE folders 
  ADD CONSTRAINT fk_folders_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_folders_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_folders_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_folders_parent FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE;

-- workspace_members (2 FKs)
ALTER TABLE workspace_members 
  ADD CONSTRAINT fk_members_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- workspaces (1 FK)
ALTER TABLE workspaces 
  ADD CONSTRAINT fk_workspaces_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- =============================================
-- PARTE 2: FOREIGN KEYS - TABELAS FINANCEIRAS
-- =============================================

-- workspace_subscriptions (3 FKs)
ALTER TABLE workspace_subscriptions 
  ADD CONSTRAINT fk_subscriptions_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_subscriptions_offer FOREIGN KEY (plan_offer_id) REFERENCES plan_offers(id) ON DELETE SET NULL;

-- workspace_credits (1 FK)
ALTER TABLE workspace_credits 
  ADD CONSTRAINT fk_credits_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- credit_transactions (2 FKs)
ALTER TABLE credit_transactions 
  ADD CONSTRAINT fk_transactions_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- workspace_invoices (2 FKs)
ALTER TABLE workspace_invoices 
  ADD CONSTRAINT fk_invoices_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES workspace_subscriptions(id) ON DELETE SET NULL;

-- =============================================
-- PARTE 3: FOREIGN KEYS - HISTÓRICO E CHAT
-- =============================================

-- ai_generation_history (3 FKs)
ALTER TABLE ai_generation_history 
  ADD CONSTRAINT fk_gen_history_copy FOREIGN KEY (copy_id) REFERENCES copies(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_gen_history_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_gen_history_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- copy_chat_messages (3 FKs)
ALTER TABLE copy_chat_messages 
  ADD CONSTRAINT fk_chat_messages_copy FOREIGN KEY (copy_id) REFERENCES copies(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_chat_messages_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- =============================================
-- PARTE 4: FOREIGN KEYS - TABELAS AUXILIARES
-- =============================================

-- plan_offers (2 FKs)
ALTER TABLE plan_offers 
  ADD CONSTRAINT fk_offers_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_offers_gateway FOREIGN KEY (payment_gateway_id) REFERENCES payment_gateways(id) ON DELETE RESTRICT;

-- payment_gateways (1 FK)
ALTER TABLE payment_gateways 
  ADD CONSTRAINT fk_gateways_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE RESTRICT;

-- workspace_invitations (2 FKs)
ALTER TABLE workspace_invitations 
  ADD CONSTRAINT fk_invitations_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_invitations_inviter FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- user_roles (1 FK)
ALTER TABLE user_roles 
  ADD CONSTRAINT fk_roles_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- user_prompt_customizations (2 FKs)
ALTER TABLE user_prompt_customizations 
  ADD CONSTRAINT fk_prompt_custom_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_prompt_custom_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- credit_rollover_history (2 FKs)
ALTER TABLE credit_rollover_history 
  ADD CONSTRAINT fk_rollover_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_rollover_subscription FOREIGN KEY (subscription_id) REFERENCES workspace_subscriptions(id) ON DELETE CASCADE;

-- credit_config (1 FK)
ALTER TABLE credit_config 
  ADD CONSTRAINT fk_credit_config_updater FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- credit_config_history (1 FK)
ALTER TABLE credit_config_history 
  ADD CONSTRAINT fk_config_history_changer FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- model_routing_config (1 FK)
ALTER TABLE model_routing_config 
  ADD CONSTRAINT fk_routing_config_updater FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- model_routing_history (1 FK)
ALTER TABLE model_routing_history 
  ADD CONSTRAINT fk_routing_history_changer FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- ai_prompt_history (1 FK)
ALTER TABLE ai_prompt_history 
  ADD CONSTRAINT fk_prompt_history_template FOREIGN KEY (template_id) REFERENCES ai_prompt_templates(id) ON DELETE CASCADE;

-- =============================================
-- PARTE 5: ÍNDICES DE PERFORMANCE
-- =============================================

-- Índices em colunas de FK (usadas em JOINs e RLS)
CREATE INDEX IF NOT EXISTS idx_copies_workspace_id ON copies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_copies_project_id ON copies(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_copies_created_by ON copies(created_by);
CREATE INDEX IF NOT EXISTS idx_copies_folder_id ON copies(folder_id) WHERE folder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

CREATE INDEX IF NOT EXISTS idx_folders_workspace_id ON folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_folders_project_id ON folders(project_id) WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_gen_history_workspace_id ON ai_generation_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_history_copy_id ON ai_generation_history(copy_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_history_created_by ON ai_generation_history(created_by);

CREATE INDEX IF NOT EXISTS idx_chat_messages_copy_id ON copy_chat_messages(copy_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_workspace_id ON copy_chat_messages(workspace_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_workspace_id ON credit_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_subscriptions_workspace_id ON workspace_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_subscriptions_plan_id ON workspace_subscriptions(plan_id);

CREATE INDEX IF NOT EXISTS idx_workspace_credits_workspace_id ON workspace_credits(workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_invoices_workspace_id ON workspace_invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invoices_subscription_id ON workspace_invoices(subscription_id) WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace_id ON workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_plan_offers_plan_id ON plan_offers(plan_id);

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_copies_workspace_created ON copies(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copies_workspace_status ON copies(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_copies_workspace_type ON copies(workspace_id, copy_type);

CREATE INDEX IF NOT EXISTS idx_ai_gen_history_workspace_created ON ai_generation_history(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_copy_created ON copy_chat_messages(copy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_workspace_created ON credit_transactions(workspace_id, created_at DESC);