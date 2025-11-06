-- Add foreign key constraint from workspace_members to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'workspace_members_user_id_fkey'
  ) THEN
    ALTER TABLE workspace_members 
    ADD CONSTRAINT workspace_members_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;