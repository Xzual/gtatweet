-- Supabase Realtime Kurulumu
-- Gerçek zamanlı güncellemelerin (bildirimler, yeni tweetler vb.) çalışması için bu kodu SQL Editor'da bir kez çalıştır.

-- Eğer yayın (publication) yoksa oluştur, varsa tablo ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Tabloları yayına ekle
ALTER PUBLICATION supabase_realtime ADD TABLE posts, profiles, follows, likes, comments;

-- Not: Eğer "relation ... already exists in publication" hatası alırsan korkma, bu zaten eklenmiş demektir.
