-- Advanced Social Features Schema Updates

-- Bookmarks (Yer İşaretleri) Tablosu
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- DM Konuşmaları (Conversations) Tablosu
-- user1_id her zaman user2_id'den küçük olmalı (benzersizlik için)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_users UNIQUE(user1_id, user2_id)
);

-- Mesajlar (Messages) Tablosu
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Anket Oyları (Poll Votes) Tablosu
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- Mevcut tablolara yeni kolonlar ekleme
ALTER TABLE posts ADD COLUMN IF NOT EXISTS poll_data JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#3b82f6';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_song_url TEXT;
-- Add commonly-used profile columns used by the app UI
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Realtime'ı aktif etme
-- Not: Bu komutlar sadece veritabanı sahibi (super-user) tarafından çalıştırılabilirse web arayüzünden yapılması gerekebilir.
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages, conversations, poll_votes;

-- RLS Politikaları --

-- Bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kullanıcılar kendi yer işaretlerini görebilir" ON bookmarks;
CREATE POLICY "Kullanıcılar kendi yer işaretlerini görebilir" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Kullanıcılar yer işareti ekleyebilir" ON bookmarks;
CREATE POLICY "Kullanıcılar yer işareti ekleyebilir" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Kullanıcılar yer işareti silebilir" ON bookmarks;
CREATE POLICY "Kullanıcılar yer işareti silebilir" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kullanıcılar dahil oldukları konuşmaları görebilir" ON conversations;
CREATE POLICY "Kullanıcılar dahil oldukları konuşmaları görebilir" ON conversations FOR SELECT USING (auth.uid() IN (user1_id, user2_id));
DROP POLICY IF EXISTS "Kullanıcılar konuşma başlatabilir" ON conversations;
CREATE POLICY "Kullanıcılar konuşma başlatabilir" ON conversations FOR INSERT WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kullanıcılar dahil oldukları konuşmadaki mesajları görebilir" ON messages;
CREATE POLICY "Kullanıcılar dahil oldukları konuşmadaki mesajları görebilir" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND auth.uid() IN (user1_id, user2_id))
);
DROP POLICY IF EXISTS "Kullanıcılar mesaj gönderebilir" ON messages;
CREATE POLICY "Kullanıcılar mesaj gönderebilir" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Poll Votes
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Herkes oyları görebilir" ON poll_votes;
CREATE POLICY "Herkes oyları görebilir" ON poll_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Kullanıcılar oy verebilir" ON poll_votes;
CREATE POLICY "Kullanıcılar oy verebilir" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
