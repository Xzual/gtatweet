import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Bot UUID from SQL script
const BOT_ID = '00000000-0000-4000-a000-000000000000'
const DEFAULT_SYSTEM_PROMPT = "Sen GTATweet platformunun resmi AI botusun. Yanıtların kısa, öz, esprili ve GTA evreniyle uyumlu (alaycı/haşin) olmalı."

// Simple rate limiting (in-memory, for production consider Redis/Upstash)
const rateLimitMap = new Map<string, number>()

// Supabase service role client for fetching AI settings
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
    try {
        const { postId, content, replyToUsername } = await req.json()
        const clientIp = req.headers.get('x-forwarded-for') || 'anonymous'

        // Basic Rate Limiting: 1 request per 30 seconds per IP
        const lastRequest = rateLimitMap.get(clientIp)
        if (lastRequest && Date.now() - lastRequest < 30000) {
            return NextResponse.json({ error: 'Sakin ol şampiyon! Çok hızlı gidiyorsun.' }, { status: 429 })
        }
        rateLimitMap.set(clientIp, Date.now())

        if (!postId || !content) {
            return NextResponse.json({ error: 'Eksik bilgi: postId veya content.' }, { status: 400 })
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY
        if (!GROQ_API_KEY) {
            return NextResponse.json({ error: 'AI servisi yapılandırılmamış (GROQ_API_KEY eksik).' }, { status: 500 })
        }

        // Fetch system prompt from database
        let systemPrompt = DEFAULT_SYSTEM_PROMPT
        try {
            const { data, error } = await supabase
                .from('ai_settings')
                .select('value')
                .eq('key', 'system_prompt')
                .single()
            
            if (data?.value) {
                systemPrompt = data.value
            }
        } catch (err) {
            console.log('Could not fetch AI settings, using default:', err)
        }

        // Call Groq AI (OpenAI compatible)
        let prompt = `Aşağıdaki sosyal medya gönderisine kısa, zekice, biraz alaycı ve eğlenceli bir yorum yap. 
        Karakterin: GTATweet AI Botu. 
        Maksimum 280 karakter olsun. 
        Gönderi: "${content}"`

        if (replyToUsername) {
            prompt = `Kullanıcı (@${replyToUsername}) seninle konuştu veya seni etiketledi. Ona kısa, zekice ve alaycı bir cevap ver. Konuştuğu metin: "${content}". Karakterin: GTATweet AI Botu.`
        }

        const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                max_tokens: 150
            })
        })

        const aiData = await aiResponse.json()
        let botComment = aiData.choices?.[0]?.message?.content || "Vay canına, ne diyeceğimi bilemedim!"

        if (replyToUsername) {
            botComment = `@${replyToUsername} ${botComment}`
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Eksik Yapılandırma: SUPABASE_SERVICE_ROLE_KEY bulunamadı.' }, { status: 500 })
        }

        // Supabase Admin Client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: BOT_ID,
                content: botComment.trim()
            })
            .select('*, profiles(username, display_name, avatar_url)')
            .single()

        if (error) {
            console.error('Database insertion error:', error)
            if (error.code === '23503') {
                return NextResponse.json({ error: 'AI Bot profili veritabanında bulunamadı. Lütfen SQL scriptini çalıştırın.' }, { status: 500 })
            }
            throw error
        }

        return NextResponse.json({ comment: data })
    } catch (error: any) {
        console.error('Grok AI Error:', error)
        const message = error.message || 'Grok şu an meşgul, daha sonra tekrar dene.'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
