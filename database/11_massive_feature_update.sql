-- Enable uuid-ossp extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bildirim Sistemi (Notifications)
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('like', 'retweet', 'reply', 'follow', 'mention', 'bounty', 'crew_invite');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Bildirimi alan
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Bildirimi tetikleyen (beğenen vb)
    type notification_type NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, -- İsteğe bağlı
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- İsteğe bağlı
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 2. Çete/Crew Sistemi (Gangs & Crews)
CREATE TABLE IF NOT EXISTS public.crews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL UNIQUE, -- Örn: GROVE, BALLAS
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    avatar_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.crew_members (
    crew_id UUID REFERENCES public.crews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (crew_id, user_id)
);

-- RLS for Crews
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Crews are viewable by everyone" ON public.crews;
CREATE POLICY "Crews are viewable by everyone" ON public.crews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create crews" ON public.crews;
CREATE POLICY "Users can create crews" ON public.crews FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Crew owners can update crews" ON public.crews;
CREATE POLICY "Crew owners can update crews" ON public.crews FOR UPDATE USING (auth.uid() = owner_id);

ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Crew members are viewable by everyone" ON public.crew_members;
CREATE POLICY "Crew members are viewable by everyone" ON public.crew_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can join crews" ON public.crew_members;
CREATE POLICY "Users can join crews" ON public.crew_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave crews" ON public.crew_members;
CREATE POLICY "Users can leave crews" ON public.crew_members FOR DELETE USING (auth.uid() = user_id);

-- 3. Bounty Sistemi (Ödül Avcılığı)
CREATE TABLE IF NOT EXISTS public.bounties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bounties are viewable by everyone" ON public.bounties;
CREATE POLICY "Bounties are viewable by everyone" ON public.bounties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can send bounties" ON public.bounties;
CREATE POLICY "Users can send bounties" ON public.bounties FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 4. Alıntılayarak Retweet (Quote Tweet)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS quote_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- 5. Süreli (Kendini Yok Eden) DM'ler (Self-Destructing Messages)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS expires_in_seconds INTEGER DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 6. Anketler (Polls)
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
    poll_option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (poll_option_id, user_id)
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Polls are viewable by everyone" ON public.polls;
CREATE POLICY "Polls are viewable by everyone" ON public.polls FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create polls" ON public.polls;
CREATE POLICY "Users can create polls" ON public.polls FOR INSERT WITH CHECK (true);

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Poll options are viewable by everyone" ON public.poll_options;
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create poll options" ON public.poll_options;
CREATE POLICY "Users can create poll options" ON public.poll_options FOR INSERT WITH CHECK (true);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Poll votes are viewable by everyone" ON public.poll_votes;
CREATE POLICY "Poll votes are viewable by everyone" ON public.poll_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can vote" ON public.poll_votes;
CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Hikayeler (Stories / Fleets)
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_url TEXT,
    content TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
CREATE POLICY "Stories are viewable by everyone" ON public.stories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create stories" ON public.stories;
CREATE POLICY "Users can create stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Gerekli tabloları Realtime'a ekleme (Bildirimlerin anlık düşmesi için)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
