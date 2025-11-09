-- Etapa 2: Remover trigger do auth.users
-- O setup agora é feito pela Edge Function de forma assíncrona

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;