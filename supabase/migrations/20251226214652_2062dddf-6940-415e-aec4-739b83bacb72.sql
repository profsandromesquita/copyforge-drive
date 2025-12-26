-- 1. Add views_count column to copies table (if not exists)
ALTER TABLE copies ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. Create atomic increment function for views
CREATE OR REPLACE FUNCTION increment_copy_views(p_copy_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE copies 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_copy_id;
END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_copy_views TO authenticated;

-- 4. Recreate discover_cards view to include views_count
DROP VIEW IF EXISTS discover_cards;

CREATE VIEW discover_cards AS
SELECT 
  c.id,
  c.title,
  c.copy_type,
  c.copy_count,
  c.likes_count,
  c.views_count,
  c.created_by,
  c.created_at,
  c.preview_image_url,
  c.preview_text,
  p.name as creator_name,
  p.avatar_url as creator_avatar_url
FROM copies c
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.show_in_discover = true;