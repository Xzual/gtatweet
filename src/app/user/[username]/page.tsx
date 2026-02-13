'use client'

import { supabase } from '@/utils/supabase/client'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { PostCard } from '@/components/feed/PostCard'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

type TabType = 'tweets' | 'replies' | 'media' | 'likes'

export default function UserProfilePage() {
    const { user } = useAuth()
    const params = useParams()
    const username = params.username as string
    const [profile, setProfile] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<TabType>('tweets')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true)
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single()

            if (error || !profileData) {
                setLoading(false)
                return
            }

            setProfile(profileData)
            setLoading(false)
        }
        if (username) fetchProfile()
    }, [username])


    useEffect(() => {
        const fetchPosts = async () => {
            if (!profile) return

            let query = supabase.from('posts').select(`
                *,
                profiles (
                  username,
                  display_name,
                  avatar_url
                ),
                likes(count),
                comments(count)
              `)

            if (activeTab === 'tweets') {
                const { data } = await supabase.from('posts').select(`
                    *,
                    profiles (username, display_name, avatar_url),
                    likes(count),
                    comments(count)
                `)
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false })
                if (data) setPosts(data)
            } else if (activeTab === 'replies') {
                // Fetch posts that the user has commented on
                const { data: commentData } = await supabase
                    .from('comments')
                    .select(`
                        post:posts (
                            *,
                            profiles (username, display_name, avatar_url),
                            likes(count),
                            comments(count)
                        )
                    `)
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false })

                if (commentData) {
                    // Extract unique posts from comments
                    const uniquePosts = Array.from(new Set(commentData.map(c => (c.post as any).id)))
                        .map(id => commentData.find(c => (c.post as any).id === id)?.post)
                        .filter(Boolean)
                    setPosts(uniquePosts as any[])
                }
            } else if (activeTab === 'media') {
                const { data } = await supabase.from('posts').select(`
                    *,
                    profiles (username, display_name, avatar_url),
                    likes(count),
                    comments(count)
                `)
                    .eq('user_id', profile.id)
                    .neq('image_url', null)
                    .order('created_at', { ascending: false })
                if (data) setPosts(data)
            }
        }

        if (profile) {
            fetchPosts()
            // ... (rest of the effect)

            // Realtime subscription for this user's posts
            const channel = supabase
                .channel(`profile_posts_${profile.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'posts',
                    filter: `user_id=eq.${profile.id}`
                }, (payload) => {
                    // Fetch full post with profile data
                    supabase.from('posts').select(`
                        *,
                        profiles (
                          username,
                          display_name,
                          avatar_url
                        )
                    `).eq('id', payload.new.id).single()
                        .then(({ data }) => {
                            if (data) setPosts(current => [data, ...current])
                        })
                })
                .on('postgres_changes', {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'posts'
                }, (payload) => {
                    setPosts(current => current.filter(post => post.id !== payload.old.id))
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [profile, activeTab])

    if (loading) return <div className="p-4 flex justify-center text-gray-500">Yükleniyor...</div>
    if (!profile) return <div className="p-4 text-center">Kullanıcı bulunamadı</div>

    const BOT_ID = '00000000-0000-4000-a000-000000000000'
    const MANAGER_ID = 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5'

    const isOwner = user?.id === profile?.id || (user?.id === MANAGER_ID && profile?.id === BOT_ID)

    return (
        <div>
            <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md p-2 border-b border-gray-200 dark:border-gray-800 z-10 flex items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold">{profile.display_name}</h1>
                    <div className="text-xs text-gray-500">{posts.length} Gönderi</div>
                </div>
            </div>

            <ProfileHeader profile={profile} isOwner={isOwner} />

            <div className="flex border-b border-gray-200 dark:border-gray-800">
                <TabButton label="Gönderiler" active={activeTab === 'tweets'} onClick={() => setActiveTab('tweets')} />
                <TabButton label="Yanıtlar" active={activeTab === 'replies'} onClick={() => setActiveTab('replies')} />
                <TabButton label="Medya" active={activeTab === 'media'} onClick={() => setActiveTab('media')} />
                <TabButton label="Beğeniler" active={activeTab === 'likes'} onClick={() => setActiveTab('likes')} />
            </div>

            <div>
                {activeTab === 'likes' ? (
                    <div className="p-8 text-center text-gray-500">Beğenilen gönderiler yakında burada görünecek.</div>
                ) : (
                    <>
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                        {posts.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                {activeTab === 'replies' ? 'Henüz hiçbir gönderiye yanıt verilmemiş.' : 'Henüz gönderi yok.'}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-4 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors relative ${active ? 'text-black dark:text-white' : 'text-gray-500'}`}
        >
            {label}
            {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-accent rounded-full" />}
        </button>
    )
}
