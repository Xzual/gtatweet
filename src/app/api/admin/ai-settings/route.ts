import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const ADMIN_UID = 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5'

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabase
            .from('ai_settings')
            .select('*')

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching AI settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        // Check admin via Authorization header user_id
        const userId = req.headers.get('x-user-id')
        if (userId !== ADMIN_UID) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { key, value } = await req.json()

        if (!key || !value) {
            return NextResponse.json({ error: 'key and value are required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('ai_settings')
            .upsert(
                {
                    key,
                    value,
                    updated_by: userId,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'key' }
            )
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error updating AI settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
