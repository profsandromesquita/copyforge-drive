-- Add policy to allow public read access to disable_signup setting
CREATE POLICY "Anyone can view signup status"
ON public.system_settings
FOR SELECT
TO public
USING (true);