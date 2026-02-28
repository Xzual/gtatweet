'use client'

import { Search, UserPlus, UserMinus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { FollowButton } from '@/components/common/FollowButton'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'

import { usePresence } from '@/context/PresenceContext'

export function RightSidebar() {
    const { user } = useAuth()
    const { onlineUsers } = usePresence()
    const [trendingTags, setTrendingTags] = useState<{ tag: string, count: number }[]>([])
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [isSearchFocused, setIsSearchFocused] = useState(false)

    useEffect(() => {
        const fetchTrends = async () => {
            const { data: recentPosts } = await supabase
                .from('posts')
                .select('content')
                .order('created_at', { ascending: false })
                .limit(100)

            if (recentPosts) {
                const hashtagCounts: Record<string, number> = {}
                recentPosts.forEach(post => {
                    // Match hashtags including Turkish characters
                    const matches = post.content.match(/#[\wığüşöçIĞÜŞÖÇ]+/g)
                    if (matches) {
                        matches.forEach((tag: string) => {
                            const cleanTag = tag.toLowerCase()
                            hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1
                        })
                    }
                })

                const sortedTrends = Object.entries(hashtagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([tag, count]) => ({ tag, count }))

                setTrendingTags(sortedTrends)
            }
        }

        fetchTrends()

        // Realtime subscription for trends
        const channel = supabase
            .channel('trends-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'posts'
            }, () => {
                fetchTrends()
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'posts'
            }, () => {
                fetchTrends()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    useEffect(() => {
        const fetchSuggestions = async () => {
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
                // Showing all users as requested

                setSuggestions(processed)
            }
        }
        fetchSuggestions()
    }, [user])

    return (
        <aside className="hidden lg:flex flex-col w-80 min-w-[320px] p-4 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-black no-scrollbar">
            {/* Sticky Search Bar with Glassmorphism */}
            <div className="sticky top-0 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-md pb-3 -mx-4 px-4 pt-1">
                <div className={`relative flex items-center transition-all duration-200 border-2 ${isSearchFocused ? 'border-blue-500 bg-white dark:bg-black' : 'border-transparent bg-gray-100 dark:bg-gray-900'} rounded-full py-2 px-4 shadow-sm`}>
                    <div className={`mr-3 transition-colors ${isSearchFocused ? 'text-blue-500' : 'text-gray-500'}`}>
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="GTATweet'te Ara"
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className="w-full bg-transparent border-none focus:ring-0 text-[15px] placeholder:text-gray-500 dark:text-white py-1"
                    />
                </div>
            </div>

            {/* Online Users Section */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <h2 className="text-xl font-black">Kimler Online</h2>
                    <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        {onlineUsers.length} Aktif
                    </span>
                </div>
                <div className="flex flex-col">
                    {onlineUsers.map((onlineUser) => (
                        <Link
                            key={onlineUser.id}
                            href={`/user/${onlineUser.username}`}
                            className="px-4 py-2 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 group border-b border-gray-100/30 dark:border-gray-800/30 last:border-0"
                        >
                            <div className="relative flex-shrink-0">
                                <div
                                    className="w-8 h-8 rounded-full bg-gray-300 bg-cover bg-center border border-gray-200 dark:border-gray-800 shadow-sm"
                                    style={{ backgroundImage: onlineUser.avatar_url ? `url(${onlineUser.avatar_url})` : undefined }}
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <div className="font-bold text-[14px] truncate group-hover:underline">
                                        {onlineUser.display_name}
                                    </div>
                                    <VerifiedBadge size={14} />
                                    {onlineUser.username === 'gtatweet_ai' && (
                                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase flex-shrink-0 shadow-sm">
                                            AI
                                        </span>
                                    )}
                                </div>
                                <div className="text-gray-500 text-xs truncate">@{onlineUser.username}</div>
                            </div>
                        </Link>
                    ))}
                    {onlineUsers.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-6 italic px-4">Şu an kimse online değil.</div>
                    )}
                </div>
            </div>

            {/* Trends Section */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <h2 className="text-xl font-black px-4 pt-4 pb-2">Los Santos Gündemi</h2>
                <div className="flex flex-col">
                    {trendingTags.length === 0 ? (
                        <div className="text-[14px] text-gray-500 px-4 py-4 italic">Şu an gündemde bir şey yok.</div>
                    ) : (
                        trendingTags.map((t, i) => (
                            <div
                                key={i}
                                className="px-4 py-3 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors group cursor-pointer border-b border-gray-100/50 dark:border-gray-800/50 last:border-0"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-[13px] text-gray-500">{i + 1}. sırada gündem</div>
                                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                        <span className="text-lg font-bold leading-none">···</span>
                                    </div>
                                </div>
                                <div className="font-bold text-[15px] mt-0.5 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {t.tag}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="text-[13px] text-gray-500">{t.count} gönderi</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Suggestions Section */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <h2 className="text-xl font-black px-4 pt-4 pb-2">Kimi takip etmeli</h2>
                <div className="flex flex-col">
                    {suggestions.map((profile) => (
                        <div key={profile.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors cursor-pointer group border-b border-gray-100/50 dark:border-gray-800/50 last:border-0">
                            <Link href={`/user/${profile.username}`} className="flex-shrink-0">
                                <div
                                    className="w-10 h-10 rounded-full bg-gray-300 bg-cover bg-center border border-gray-200 dark:border-gray-800 shadow-sm"
                                    style={{ backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined }}
                                />
                            </Link>
                            <Link href={`/user/${profile.username}`} className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 min-w-0">
                                    <div className="font-bold text-[15px] truncate group-hover:underline">{profile.display_name}</div>
                                    <VerifiedBadge size={14} />
                                    {profile.username === 'gtatweet_ai' && (
                                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase flex-shrink-0 shadow-sm">
                                            AI
                                        </span>
                                    )}
                                </div>
                                <div className="text-gray-500 text-sm truncate">@{profile.username}</div>
                            </Link>
                            <FollowButton targetId={profile.id} />
                        </div>
                    ))}
                    {suggestions.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-6 italic px-4">Önerilecek kimse yok.</div>
                    )}
                    <button className="px-4 py-4 text-blue-500 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors text-left text-[15px] font-medium">
                        Daha fazla göster
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-6 text-[13px] text-gray-500 flex flex-wrap gap-x-3 gap-y-1 opacity-70 hover:opacity-100 transition-opacity">
                <span className="hover:underline cursor-pointer">Hizmet Şartları</span>
                <span className="hover:underline cursor-pointer">Gizlilik Politikası</span>
                <span className="hover:underline cursor-pointer">Çerez Politikası</span>
                <span className="hover:underline cursor-pointer">Reklam Bilgisi</span>
                <span>© 2024 GTATweet Corp.</span>
            </div>
        </aside>
    )
}
