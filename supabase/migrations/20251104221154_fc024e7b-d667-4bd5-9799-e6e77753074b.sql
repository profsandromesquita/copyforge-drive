-- Add public sharing fields to copies table
ALTER TABLE copies 
  ADD COLUMN is_public BOOLEAN DEFAULT false,
  ADD COLUMN public_password TEXT,
  ADD COLUMN show_in_discover BOOLEAN DEFAULT false,
  ADD COLUMN copy_count INTEGER DEFAULT 0;

-- Create index for better performance on Discover page
CREATE INDEX idx_copies_discover ON copies(show_in_discover, is_public) WHERE show_in_discover = true;

-- Create RLS policy to allow public read access to public copies
CREATE POLICY "Public copies are viewable by anyone"
  ON copies FOR SELECT
  USING (is_public = true);