-- Adicionar foreign key para relacionamento com profiles
-- Primeiro, verificar se a constraint já existe e removê-la se necessário
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_generation_history_created_by_fkey' 
        AND table_name = 'ai_generation_history'
    ) THEN
        ALTER TABLE public.ai_generation_history 
        DROP CONSTRAINT ai_generation_history_created_by_fkey;
    END IF;
END $$;

-- Adicionar foreign key corretamente
ALTER TABLE public.ai_generation_history
ADD CONSTRAINT ai_generation_history_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;