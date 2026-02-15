import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const postId = url.searchParams.get('postId')
    const full = url.searchParams.get('full') === '1'
    const limit = parseInt(url.searchParams.get('limit') || '5')

    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    const { data: viewsData, error: viewsError } = await supabase
      .from('post_views')
      .select('user_id, seen_at')
      .eq('post_id', postId)
      .order('seen_at', { ascending: false })

    if (viewsError) {
      console.error('Error fetching views:', viewsError)
      return NextResponse.json({ error: 'Could not fetch views' }, { status: 500 })
    }

    const count = (viewsData || []).length

    if (!full) {
      const preview = (viewsData || []).slice(0, limit).map(v => v.user_id)
      if (preview.length === 0) return NextResponse.json({ count, preview: [] })

      const { data: profiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', preview)
      return NextResponse.json({ count, preview: profiles || [] })
    }

    // full list: include seen_at timestamp per viewer
    const userIds = (viewsData || []).map((v: any) => v.user_id)
    const { data: profiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds)

    const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const viewers = (viewsData || []).map((v: any) => ({ ...(profilesMap.get(v.user_id) || { id: v.user_id }), seen_at: v.seen_at }))

    return NextResponse.json({ count, viewers })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { postId, userId } = body
    if (!postId || !userId) return NextResponse.json({ error: 'postId and userId required' }, { status: 400 })

    const { error } = await supabase
      .from('post_views')
      .insert({ post_id: postId, user_id: userId })

    if (error) {
      // if unique constraint, ignore
      if ((error as any).code && (error as any).code === '23505') {
        return NextResponse.json({ ok: true })
      }
      console.error('Error inserting view:', error)
      return NextResponse.json({ error: 'Could not record view' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
