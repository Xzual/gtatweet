import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const userId = formData.get('userId') as string

        if (!file || !userId) {
            return NextResponse.json(
                { error: 'File and userId are required' },
                { status: 400 }
            )
        }

        if (!file.type.startsWith('audio/')) {
            return NextResponse.json(
                { error: 'Only audio files are allowed' },
                { status: 400 }
            )
        }

        // Limit file size to 20MB
        const MAX_SIZE = 20 * 1024 * 1024
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'File size must be less than 20MB' },
                { status: 400 }
            )
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `music_${userId}-${Math.random()}.${fileExt}`

        // Ensure bucket exists (safe idempotent operation)
        await supabase.storage.createBucket('profile-music', {
            public: true,
        }).catch(() => {
            // Bucket already exists, ignore error
        })

        const { error: uploadError, data } = await supabase.storage
            .from('profile-music')
            .upload(fileName, file, {
                contentType: file.type,
                upsert: false,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json(
                { error: 'Failed to upload file: ' + uploadError.message },
                { status: 500 }
            )
        }

        const { data: { publicUrl } } = supabase.storage
            .from('profile-music')
            .getPublicUrl(fileName)

        return NextResponse.json({ 
            success: true, 
            url: publicUrl,
            fileName: fileName
        })
    } catch (error) {
        console.error('Music upload error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
