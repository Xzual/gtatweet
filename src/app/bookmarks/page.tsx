'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { PostCard } from '@/components/feed/PostCard'
import { Bookmark } from 'lucide-react'
import Link from 'next/link'

export default function BookmarksPage() {
    const { user } = useAuth()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        const fetchBookmarks = async () => {
            setLoading(true)
            // Fetch bookmarked post IDs first
            const { data: bookmarks } = await supabase
                .from('bookmarks')
                .select('post_id')
                .eq('user_id', user.id)

            if (bookmarks && bookmarks.length > 0) {
                const postIds = bookmarks.map(b => b.post_id)
                // Fetch full post data
                const { data: postsData } = await supabase
                    .from('posts')
                    .select('*, profiles(*)')
                    .in('id', postIds)
                    .order('created_at', { ascending: false })

                if (postsData) setPosts(postsData)
            } else {
                setPosts([])
            }
            setLoading(false)
        }

        fetchBookmarks()
    }, [user])

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <Bookmark size={64} className="text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Yer işaretlerini görmek için giriş yapmalısın</h1>
                <Link href="/login" className="bg-accent text-white px-6 py-2 rounded-full font-bold hover:opacity-90 transition-colors">
                    Giriş Yap
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto min-h-screen border-x border-gray-100 dark:border-gray-800">
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 border-b border-gray-100 dark:border-gray-800">
                <h1 className="text-xl font-bold">Yer İşaretleri</h1>
                <p className="text-sm text-gray-500">@{user.user_metadata?.username}</p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bookmark size={32} className="text-accent" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Henüz hiçbir şeyi kaydetmedin</h2>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            Daha sonra kolayca bulmak istediğin tweetleri yer işaretlerine ekle.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
