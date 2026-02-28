'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { Plus } from 'lucide-react'
import { StoryViewer } from './StoryViewer'
import { CreateStoryModal } from './CreateStoryModal'

export function StoriesBar() {
    const { user } = useAuth()
    const [storiesByUser, setStoriesByUser] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Viewer states
    const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const fetchStories = async () => {
        try {
            // Get valid stories
            const { data, error } = await supabase
                .from('stories')
                .select(`
                    *,
                    profiles (
                        id,
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: true }) // Oldest valid inside user's array first

            if (error) throw error

            // Group by user
            const grouped = new Map<string, any>()

            data?.forEach(story => {
                const userId = story.user_id
                if (!grouped.has(userId)) {
                    grouped.set(userId, {
                        ...story.profiles,
                        stories: []
                    })
                }
                grouped.get(userId).stories.push(story)
            })

            // Sort: Current user first, then others by most recent story (last item in stories array)
            const sortedUsers = Array.from(grouped.values()).sort((a, b) => {
                if (user && a.id === user.id) return -1
                if (user && b.id === user.id) return 1
                const aLast = new Date(a.stories[a.stories.length - 1].created_at).getTime()
                const bLast = new Date(b.stories[b.stories.length - 1].stories).getTime()
                return bLast - aLast
            })

            setStoriesByUser(sortedUsers)
        } catch (error) {
            console.error('Error fetching stories:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStories()

        const channel = supabase
            .channel('stories_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
                fetchStories()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    if (isLoading) {
        return <div className="h-24 md:h-28 border-b border-gray-200 dark:border-gray-800 animate-pulse bg-gray-50/50 dark:bg-gray-900/50" />
    }

    const hasOwnStory = user && storiesByUser.some(u => u.id === user.id)

    return (
        <>
            <div className="border-b border-gray-200 dark:border-gray-800 p-3 md:p-4 overflow-x-auto custom-scrollbar flex gap-4 min-h-[100px] items-start">
                {user && (
                    <div className="flex flex-col items-center gap-1 min-w-[64px] relative cursor-pointer group" onClick={() => !hasOwnStory && setIsCreateModalOpen(true)}>
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full p-[2px] ${hasOwnStory ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : 'bg-gray-200 dark:bg-gray-800'}`}>
                            <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
                                <div
                                    className="w-full h-full rounded-full bg-cover bg-center"
                                    style={{ backgroundImage: user.user_metadata?.avatar_url ? `url(${user.user_metadata.avatar_url})` : undefined }}
                                    onClick={(e) => {
                                        if (hasOwnStory) {
                                            e.stopPropagation()
                                            const idx = storiesByUser.findIndex(u => u.id === user.id)
                                            setSelectedUserIndex(idx)
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        {!hasOwnStory && (
                            <div className="absolute bottom-5 right-0 bg-blue-500 rounded-full border-2 border-white dark:border-black p-0.5 text-white">
                                <Plus size={14} />
                            </div>
                        )}
                        <span className="text-[10px] md:text-xs text-gray-500 truncate w-full text-center">
                            {hasOwnStory ? 'Sen' : 'Ekle'}
                        </span>
                    </div>
                )}

                {storiesByUser.filter(u => !user || u.id !== user.id).map((userGroup, index) => (
                    <div
                        key={userGroup.id}
                        className="flex flex-col items-center gap-1 min-w-[64px] cursor-pointer group"
                        onClick={() => setSelectedUserIndex(user && hasOwnStory ? index + 1 : index)}
                    >
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                            <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
                                <div
                                    className="w-full h-full rounded-full bg-cover bg-center"
                                    style={{ backgroundImage: userGroup.avatar_url ? `url(${userGroup.avatar_url})` : undefined }}
                                />
                            </div>
                        </div>
                        <span className="text-[10px] md:text-xs text-gray-800 dark:text-gray-200 truncate w-16 text-center font-medium">
                            {userGroup.username}
                        </span>
                    </div>
                ))}
            </div>

            {selectedUserIndex !== null && (
                <StoryViewer
                    users={storiesByUser}
                    initialUserIndex={selectedUserIndex}
                    onClose={() => setSelectedUserIndex(null)}
                />
            )}

            {isCreateModalOpen && (
                <CreateStoryModal onClose={() => setIsCreateModalOpen(false)} />
            )}
        </>
    )
}
