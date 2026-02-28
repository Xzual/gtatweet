-- 12. Story Interactions (Likes & Views)

-- Story Likes Table
CREATE TABLE IF NOT EXISTS public.story_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(story_id, user_id)
);

-- Story Views Table
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(story_id, user_id)
);

-- RLS for Story Likes
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Story likes are viewable by everyone" ON public.story_likes;
CREATE POLICY "Story likes are viewable by everyone" ON public.story_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can like stories" ON public.story_likes;
CREATE POLICY "Users can like stories" ON public.story_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike stories" ON public.story_likes;
CREATE POLICY "Users can unlike stories" ON public.story_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS for Story Views
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Story views are viewable by story owner" ON public.story_views;
CREATE POLICY "Story views are viewable by story owner" ON public.story_views FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can record views" ON public.story_views;
CREATE POLICY "Users can record views" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
