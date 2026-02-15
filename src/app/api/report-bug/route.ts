import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

type Body = {
  priority: string
  description: string
  location?: string
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json()

    // Read SMTP config from env
    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const to = process.env.REPORT_TARGET_EMAIL || 'arda.yorulmazel9@gmail.com'

    if (!host || !user || !pass) {
      return NextResponse.json({ error: 'SMTP config missing on server' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    })

    const now = new Date().toISOString()
    const subject = `[GTATweet Hata] ${body.priority.toUpperCase()} • ${body.location || 'Genel'}`

    // helper to escape HTML
    const escapeHtml = (str: string | undefined) => {
      if (!str) return ''
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    // Build a professional HTML body with metadata and plain-text fallback
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#f7f7f9;padding:20px">
        <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e6e6e9">
          <div style="padding:18px 22px;border-bottom:1px solid #eef0f3;background:linear-gradient(90deg,#0ea5e9 0,#6366f1 100%);color:white">
            <h2 style="margin:0;font-size:18px">GTATweet — Yeni Hata Bildirimi</h2>
            <div style="margin-top:6px;font-size:13px;opacity:0.95">Tarih: ${now}</div>
          </div>
          <div style="padding:18px 22px;color:#111">
            <p style="margin:0 0 8px">Yeni bir hata bildirimi gönderildi. Aşağıda detaylar yer almaktadır.</p>

            <table style="width:100%;border-collapse:collapse;margin-top:10px">
              <tr><td style="padding:6px 0;font-weight:600;width:140px">Öncelik</td><td style="padding:6px 0">${escapeHtml(body.priority)}</td></tr>
              <tr><td style="padding:6px 0;font-weight:600">Sayfa / Yer</td><td style="padding:6px 0">${escapeHtml(body.location || 'Belirtilmemiş')}</td></tr>
              <tr><td style="padding:6px 0;font-weight:600">Gönderen</td><td style="padding:6px 0">Gösterilmiyor (anonim)</td></tr>
            </table>

            <h3 style="margin-top:14px;font-size:15px">Açıklama</h3>
            <div style="white-space:pre-wrap;background:#f3f4f6;padding:12px;border-radius:6px;border:1px solid #e5e7eb;color:#111">${escapeHtml(body.description || '—')}</div>

            <div style="margin-top:16px;font-size:13px;color:#6b7280">Uygulama: GTATweet (localhost)
            <br/>API Endpoint: /api/report-bug
            </div>

            <div style="margin-top:18px;border-top:1px dashed #e6e9ef;padding-top:12px;font-size:12px;color:#6b7280">Bu e-posta otomatik üretilmiştir. Hızlı yanıt gerekiyorsa admin tarafında kontrol edin.</div>
          </div>
        </div>
      </div>
    `

    const text = `GTATweet Hata Bildirimi\n\nTarih: ${now}\nÖncelik: ${body.priority}\nSayfa/Yer: ${body.location || 'Belirtilmemiş'}\n\nAçıklama:\n${body.description || '—'}\n\n(Bu mesaj otomatik olarak oluşturuldu)`

    const info = await transporter.sendMail({
      from: user,
      to,
      subject,
      text,
      html,
      replyTo: user
    })

    // Return transporter info for debugging (remove in production)
    return NextResponse.json({ ok: true, info: { accepted: info.accepted, rejected: info.rejected, messageId: info.messageId, response: info.response } })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}
