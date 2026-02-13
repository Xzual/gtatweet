# GTATweet 🏎️💨

GTATweet, GTA evreni temalı, modern ve etkileşimli bir sosyal medya platformudur. Next.js, Supabase ve AI teknolojileri kullanılarak geliştirilmiştir.

## 🚀 Özellikler

- **Modern Feed**: Gerçek zamanlı (Realtime) gönderi akışı ve etkileşimler.
- **Grok AI Bot**: Platforma entegre, kullanıcılarla etkileşime giren ve zekice yanıtlar veren AI asistanı.
- **Gelişmiş Etiketleme**: `@` işareti ile kullanıcıları gönderilerde ve yorumlarda etiketleme sistemi.
- **Profil Yönetimi**: Özelleştirilebilir profiller, biyo, kapak fotoğrafları ve gönderi geçmişi.
- **Premium UI**: Twitter/X estetiğinde, glassmorphism ve modern animasyonlarla zenginleştirilmiş arayüz.
- **Bot Yönetimi**: Yetkili kullanıcılar için AI Bot profilini doğrudan arayüzden düzenleme imkanı.

## 🛠️ Teknoloji Yığını

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine**: [Groq API](https://groq.com/) (Llama 3)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone [repository-url]
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. `.env.local` dosyasını yapılandırın:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   GROQ_API_KEY=your_groq_key
   ```

4. Veritabanı kurulumunu yapın:
   `database/` klasöründeki SQL dosyalarını sırasıyla Supabase SQL Editor'de çalıştırın.

5. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

## 📄 Lisans

Bu proje kişisel gelişim ve eğlence amacıyla geliştirilmiştir.
