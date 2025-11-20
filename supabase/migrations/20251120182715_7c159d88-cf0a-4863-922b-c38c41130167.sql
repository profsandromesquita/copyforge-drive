-- Allow copies.selected_audience_id and selected_offer_id to store non-UUID identifiers
-- 1) Drop incorrect foreign key constraint tying selected_audience_id to projects.id
ALTER TABLE public.copies
  DROP CONSTRAINT IF EXISTS copies_selected_audience_id_fkey;

-- 2) Change both columns to text so they can safely store JSON-defined IDs like audience/offer keys
ALTER TABLE public.copies
  ALTER COLUMN selected_audience_id TYPE text USING selected_audience_id::text,
  ALTER COLUMN selected_offer_id   TYPE text USING selected_offer_id::text;