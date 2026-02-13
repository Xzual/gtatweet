-- GTATweet AI Bot Profilini Oluşturma (Gelişmiş Versiyon)
-- Bu scripti Supabase SQL Editor'da çalıştırın.

-- Bot için sabit bir UUID
-- ID: 00000000-0000-4000-a000-000000000000

-- 1. Önce auth.users tablosuna hayali bir kullanıcı ekleyelim (Foreign Key hatasını önlemek için)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change_confirm_status)
VALUES (
    '00000000-0000-4000-a000-000000000000', 
    'ai_bot@gtatweet.local', 
    '', 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"username":"gtatweet_ai","display_name":"GTATweet AI"}', 
    now(), 
    now(), 
    'authenticated', 
    '', 
    '', 
    '', 
    0
)
ON CONFLICT (id) DO NOTHING;

-- 2. Sonra profiller tablosuna ekleyelim
INSERT INTO public.profiles (id, username, display_name, avatar_url)
VALUES (
    '00000000-0000-4000-a000-000000000000', 
    'gtatweet_ai', 
    'GTATweet AI', 
    'https://yiwiwdwmuofcswqpajau.supabase.co/storage/v1/object/public/avatars/bot-avatar.png'
)
ON CONFLICT (id) DO NOTHING;
