import { NextResponse } from 'next/server'
import supabaseAdmin from '@/utils/supabase/adminClient'
import nodemailer from 'nodemailer'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, display_name, avatar_url, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profiles: data })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const profileId = body.profileId
    if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', profileId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // expected: { action: 'warn', email, subject, message }
    if (body.action === 'warn') {
      const host = process.env.SMTP_HOST
      const port = parseInt(process.env.SMTP_PORT || '587', 10)
      const user = process.env.SMTP_USER
      const pass = process.env.SMTP_PASS
      const to = body.email
      if (!host || !user || !pass) return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 })
      if (!to) return NextResponse.json({ error: 'email required' }, { status: 400 })

      const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
      const subject = body.subject || 'GTATweet Hesabınız Hakkında'
      const text = body.message || ''
      await transporter.sendMail({ from: user, to, subject, text })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}
