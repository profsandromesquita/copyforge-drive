-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view likes" ON public.copy_likes;

-- Create a new restricted SELECT policy - users can only see their own likes
CREATE POLICY "Users can view own likes" 
ON public.copy_likes 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);