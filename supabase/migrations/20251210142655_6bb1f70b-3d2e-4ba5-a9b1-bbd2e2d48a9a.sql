-- Criar tabela copy_likes para sistema de curtidas
CREATE TABLE public.copy_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_id UUID NOT NULL REFERENCES public.copies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Índice único para prevenir likes duplicados
  UNIQUE(copy_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_copy_likes_copy_id ON public.copy_likes(copy_id);
CREATE INDEX idx_copy_likes_user_id ON public.copy_likes(user_id);

-- Adicionar coluna likes_count na tabela copies (desnormalização para performance)
ALTER TABLE public.copies ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Criar índice para ordenação por likes
CREATE INDEX IF NOT EXISTS idx_copies_likes_count ON public.copies(likes_count DESC);

-- Habilitar RLS
ALTER TABLE public.copy_likes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can view likes" ON public.copy_likes
FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.copy_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.copy_likes
FOR DELETE USING (auth.uid() = user_id);

-- Trigger para manter likes_count sincronizado
CREATE OR REPLACE FUNCTION public.update_copy_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.copies SET likes_count = likes_count + 1 WHERE id = NEW.copy_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.copies SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.copy_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_copy_likes_count
AFTER INSERT OR DELETE ON public.copy_likes
FOR EACH ROW EXECUTE FUNCTION public.update_copy_likes_count();