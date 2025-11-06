-- Add address and CPF fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN cpf text,
ADD COLUMN cep text,
ADD COLUMN street text,
ADD COLUMN number text,
ADD COLUMN complement text,
ADD COLUMN neighborhood text,
ADD COLUMN city text,
ADD COLUMN state text;