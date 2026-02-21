import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/adminClient'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${new URL(request.url).origin}/register`,
        })

        if (error) {
            console.error('Invite error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Invitation sent successfully', data })
    } catch (err: any) {
        console.error('Invite route error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
