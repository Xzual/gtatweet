'use client'

import { Search, UserPlus, UserMinus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { FollowButton } from '@/components/common/FollowButton'

export function RightSidebar() {
    const { user } = useAuth()
    const [trends, setTrends] = useState<any[]>([])
    const [suggestions, setSuggestions] = useState<any[]>([])

    useEffect(() => {
        const fetchTrends = async () => {
            const { data } = await supabase.from('posts').select('*, profiles(*)').limit(3)
            if (data) setTrends(data)
        }
        fetchTrends()
    }, [])

    useEffect(() => {
        const fetchSuggestions = async () => {
            // Fetch profiles with post counts
            // Since Supabase doesn't easily order by related count in client, we fetch all and sort
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*, posts(count)')

            if (profiles) {
                const processed = profiles
                    .filter(p => p.id !== user?.id)
                    .map(p => ({
                        ...p,
                        post_count: p.posts?.[0]?.count || 0
                    }))
                    .sort((a, b) => b.post_count - a.post_count)
                    .slice(0, 5)

                setSuggestions(processed)
            }
        }
        fetchSuggestions()
    }, [user])

    return (
        <aside className="hidden lg:flex flex-col w-80 p-4 border-l border-gray-200 dark:border-gray-800 h-screen sticky top-0 bg-white dark:bg-black">
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="GTATweet'te Ara"
                    className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <h2 className="text-xl font-bold mb-4">Gündemdekiler</h2>
                <div className="space-y-4">
                    {trends.map((t, i) => (
                        <Link key={i} href={`/user/${t.profiles.username}`} className="block hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded cursor-pointer transition-colors">
                            <div className="text-xs text-gray-500">Türkiye konumunda gündem</div>
                            <div className="font-bold">{t.content.substring(0, 20)}{t.content.length > 20 ? '...' : ''}</div>
                            <div className="text-xs text-gray-500">@{t.profiles.username}</div>
                        </Link>
                    ))}
                    <Trend topic="Yazılım" count="12.5B Tweet" />
                    <Trend topic="Next.js" count="5.2B Tweet" />
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mt-4">
                <h2 className="text-xl font-bold mb-4">Kimi takip etmeli</h2>
                <div className="space-y-4">
                    {suggestions.map((profile) => (
                        <div key={profile.id} className="flex items-center gap-2 group">
                            <Link href={`/user/${profile.username}`} className="flex items-center gap-2 flex-1 min-w-0">
                                <div
                                    className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 bg-cover bg-center"
                                    style={{ backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined }}
                                />
                                <div className="min-w-0">
                                    <div className="font-bold truncate hover:underline">{profile.display_name}</div>
                                    <div className="text-gray-500 text-sm truncate">@{profile.username}</div>
                                </div>
                            </Link>
                            <FollowButton targetId={profile.id} />
                        </div>
                    ))}
                    {suggestions.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-2">Önerilecek kimse yok.</div>
                    )}
                </div>
            </div>
        </aside>
    )
}

// Redundant local FollowButton removed, now using shared component

function Trend({ topic, count }: { topic: string; count: string }) {
    return (
        <div className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded cursor-pointer transition-colors">
            <div className="text-xs text-gray-500">Gündem</div>
            <div className="font-bold">{topic}</div>
            <div className="text-xs text-gray-500">{count}</div>
        </div>
    )
}
