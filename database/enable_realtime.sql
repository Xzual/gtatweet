-- Enable Realtime for the posts table
-- This is required for clients to receive INSERT/UPDATE/DELETE events
-- Enable Realtime for the posts table
-- This is required for clients to receive INSERT/UPDATE/DELETE events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;
END
$$;
