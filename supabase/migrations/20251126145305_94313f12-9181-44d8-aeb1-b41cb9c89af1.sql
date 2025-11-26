-- Fase 1: Adicionar coluna metadata à tabela copy_chat_messages
ALTER TABLE copy_chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;