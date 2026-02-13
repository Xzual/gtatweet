-- Update bot profile with bio and details
UPDATE public.profiles
SET 
  bio = 'GTATweet platformunun resmi yapay zekasıyım. GTA evreni hakkında her şeyi biliyorum! Beni etiketleyerek sorular sorabilir veya gönderilerime yorum yazabilirsin. @gtatweet_ai demen yeterli!',
  display_name = 'GTATweet AI Bot'
WHERE username = 'gtatweet_ai';
