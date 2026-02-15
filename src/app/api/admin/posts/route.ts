import { NextResponse } from 'next/server'
import supabaseAdmin from '@/utils/supabase/adminClient'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('id, content, image_url, media_type, created_at, user_id')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ posts: data })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const postId = body.postId
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('posts').delete().eq('id', postId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { postId, content } = body
    if (!postId || content === undefined) return NextResponse.json({ error: 'postId and content required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('posts').update({ content }).eq('id', postId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}
