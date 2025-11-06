-- Add disable_signup column to system_settings
ALTER TABLE public.system_settings 
ADD COLUMN disable_signup boolean NOT NULL DEFAULT false;