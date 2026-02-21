-- 1. Mevcut tüm kullanıcıların Xzual'ı (bc867c59-e8bc-4000-9c28-5ad02f51d1e5) takip etmesini sağla
INSERT INTO public.follows (follower_id, following_id)
SELECT id, 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5'
FROM public.profiles
WHERE id != 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5'
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- 2. Yeni kayıt olan kullanıcıların otomatik olarak Xzual'ı takip etmesi için trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_auto_follow_xzual()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.id, 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur (Profiles tablosuna veri eklendiğinde çalışır)
DROP TRIGGER IF EXISTS on_profile_created_auto_follow ON public.profiles;
CREATE TRIGGER on_profile_created_auto_follow
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_auto_follow_xzual();

-- 3. Xzual'ı takipten çıkmayı yasaklayan trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.prevent_unfollow_xzual()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.following_id = 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5' THEN
        RAISE EXCEPTION 'Bu hesabı takipten çıkamazsınız!';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Unfollow yasaklama trigger'ı (Follows tablosundan silme yapıldığında çalışır)
DROP TRIGGER IF EXISTS on_unfollow_xzual ON public.follows;
CREATE TRIGGER on_unfollow_xzual
    BEFORE DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.prevent_unfollow_xzual();
