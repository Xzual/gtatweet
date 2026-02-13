-- RLS Policy to allow Mercedes-AMG F1 (Manager) to update the AI Bot profile
-- BOT_ID: 00000000-0000-4000-a000-000000000000
-- MANAGER_ID: bc867c59-e8bc-4000-9c28-5ad02f51d1e5

CREATE POLICY "Bot Manager Update Profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = '00000000-0000-4000-a000-000000000000')
WITH CHECK (auth.uid() = 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5');

-- Also allow manager to upload to the avatars bucket for the bot ID if needed.
-- (This might require bucket-level policy adjustments if strict RLS is on avatars bucket)
