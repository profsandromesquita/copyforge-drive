-- Adicionar coluna selected_methodology_id na tabela copies
ALTER TABLE public.copies 
ADD COLUMN selected_methodology_id text;