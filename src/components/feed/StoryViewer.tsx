'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Trash2, Heart, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/utils/supabase/client'

interface StoryViewerProps {
    users: any[]
    initialUserIndex: number
    onClose: () => void
    onRefresh?: () => void
}

export function StoryViewer({ users, initialUserIndex, onClose, onRefresh }: StoryViewerProps) {
    const { user: currentUser } = useAuth()
    const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex)
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [progress, setProgress] = useState(0)
    const [likesCount, setLikesCount] = useState(0)
    const [viewsCount, setViewsCount] = useState(0)
    const [hasLiked, setHasLiked] = useState(false)

    const activeUser = users[currentUserIndex]
    const activeStory = activeUser?.stories[currentStoryIndex]

    // Auto-advance logic
    useEffect(() => {
        if (isPaused || !activeStory) return

        const duration = 5000 // 5 seconds per story
        const interval = 50
        const step = (interval / duration) * 100

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev + step >= 100) {
                    return 100 // Mark as complete
                }
                return prev + step
            })
        }, interval)

        return () => clearInterval(timer)
    }, [currentStoryIndex, currentUserIndex, isPaused, activeStory])

    // Watch for progress completion to trigger next story
    useEffect(() => {
        if (progress >= 100) {
            handleNextStory()
        }
    }, [progress])

    // Reset progress when changing story
    useEffect(() => {
        setProgress(0)
        if (activeStory) {
            fetchInteractions()
            recordView()
        }
    }, [currentStoryIndex, currentUserIndex])

    const fetchInteractions = async () => {
        if (!activeStory) return

        // Fetch likes
        const { count: likes, error: likesError } = await supabase
            .from('story_likes')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', activeStory.id)

        // Check if current user liked
        if (currentUser) {
            const { data: myLike } = await supabase
                .from('story_likes')
                .select('id')
                .eq('story_id', activeStory.id)
                .eq('user_id', currentUser.id)
                .maybeSingle()
            setHasLiked(!!myLike)
        }

        // Fetch views (exact count)
        const { count: views } = await supabase
            .from('story_views')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', activeStory.id)

        if (!likesError) setLikesCount(likes || 0)
        setViewsCount(views || 0)
    }

    const recordView = async () => {
        if (!currentUser || !activeStory || currentUser.id === activeStory.user_id) return

        await supabase
            .from('story_views')
            .insert({
                story_id: activeStory.id,
                user_id: currentUser.id
            })
        // Ignore error if already viewed (unique constraint)
    }

    const handleLike = async () => {
        if (!currentUser || !activeStory) return

        try {
            if (hasLiked) {
                await supabase
                    .from('story_likes')
                    .delete()
                    .eq('story_id', activeStory.id)
                    .eq('user_id', currentUser.id)
                setHasLiked(false)
                setLikesCount(prev => Math.max(0, prev - 1))
            } else {
                await supabase
                    .from('story_likes')
                    .insert({
                        story_id: activeStory.id,
                        user_id: currentUser.id
                    })
                setHasLiked(true)
                setLikesCount(prev => prev + 1)
            }
        } catch (error) {
            console.error('Error toggling story like:', error)
        }
    }

    const handleNextStory = () => {
        if (currentStoryIndex < activeUser.stories.length - 1) {
            // Next story for same user
            setCurrentStoryIndex(prev => prev + 1)
        } else if (currentUserIndex < users.length - 1) {
            // Next user's first story
            setCurrentUserIndex(prev => prev + 1)
            setCurrentStoryIndex(0)
        } else {
            // End of all stories
            onClose()
        }
    }

    const handlePrevStory = () => {
        if (currentStoryIndex > 0) {
            // Prev story for same user
            setCurrentStoryIndex(prev => prev - 1)
        } else if (currentUserIndex > 0) {
            // Prev user's last story
            setCurrentUserIndex(prev => prev - 1)
            setCurrentStoryIndex(users[currentUserIndex - 1].stories.length - 1)
        } else {
            // Already at beginning
            setProgress(0)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Hikayeyi silmek istediğinize emin misiniz?')) return

        setIsPaused(true)
        console.log('Attempting to delete story:', activeStory.id, 'by user:', currentUser?.id)
        try {
            const { error } = await supabase.from('stories').delete().eq('id', activeStory.id)

            if (error) throw error

            // Remove from local state visually for immediate feedback
            activeUser.stories.splice(currentStoryIndex, 1)

            if (activeUser.stories.length === 0) {
                onClose()
            } else {
                // User still has stories, adjust index
                if (currentStoryIndex >= activeUser.stories.length) {
                    setCurrentStoryIndex(activeUser.stories.length - 1)
                }
            }

            if (onRefresh) onRefresh()
            alert('Hikaye başarıyla silindi.')
        } catch (error: any) {
            console.error('Error deleting story:', error)
            alert('Silinirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
        } finally {
            setIsPaused(false)
        }
    }

    if (!activeStory) return null

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
            {/* Context/Background */}
            <div
                className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30"
                style={{ backgroundImage: activeStory.media_url ? `url(${activeStory.media_url})` : undefined }}
            />

            <div className="w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl overflow-hidden relative bg-gray-900 shadow-2xl">

                {/* Progress Bars */}
                <div className="absolute top-0 inset-x-0 p-4 pb-0 z-20 flex gap-1">
                    {activeUser.stories.map((s: any, idx: number) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-75"
                                style={{
                                    width: idx < currentStoryIndex ? '100%' :
                                        idx === currentStoryIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header Info */}
                <div className="absolute top-6 inset-x-0 p-4 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                            <img
                                src={activeUser.avatar_url || `https://ui-avatars.com/api/?name=${activeUser.username}&background=random`}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="text-white font-bold text-sm drop-shadow-md">{activeUser.username}</span>
                        <span className="text-white/70 text-xs drop-shadow-md">
                            {formatDistanceToNow(new Date(activeStory.created_at), { locale: tr })}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Likes Count */}
                        <div className="flex items-center gap-1 text-white/90 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                            <Heart size={14} className={hasLiked ? "fill-red-500 text-red-500" : ""} />
                            <span className="text-xs font-bold">{likesCount}</span>
                        </div>

                        {/* Views Count (Story Owner Only) */}
                        {currentUser?.id === activeStory.user_id && (
                            <div className="flex items-center gap-1 text-white/90 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                                <Eye size={14} />
                                <span className="text-xs font-bold">{viewsCount}</span>
                            </div>
                        )}

                        {currentUser?.id === activeStory.user_id && (
                            <button
                                onClick={handleDelete}
                                className="text-white/70 hover:text-white p-2"
                                title="Sil"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="text-white/70 hover:text-white p-2">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div
                    className="absolute inset-0 z-10 flex flex-col justify-center items-center"
                    onPointerDown={() => setIsPaused(true)}
                    onPointerUp={() => setIsPaused(false)}
                    onPointerLeave={() => setIsPaused(false)}
                >
                    {activeStory.media_url ? (
                        <div className="w-full h-full bg-black flex flex-col items-center justify-center">
                            <img src={activeStory.media_url} alt="Story" className="w-full h-full object-contain" />
                            {activeStory.content && (
                                <div className="absolute bottom-24 inset-x-8 text-center text-white bg-black/60 p-4 rounded-2xl backdrop-blur-sm">
                                    <p className="text-lg font-medium">{activeStory.content}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-purple-600 via-pink-600 to-red-500 p-8 flex flex-col justify-center items-center">
                            <p className="text-white text-3xl font-bold text-center break-words w-full">
                                {activeStory.content}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="absolute bottom-6 inset-x-0 px-6 z-30 flex justify-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleLike()
                        }}
                        className={`p-4 rounded-full backdrop-blur-md border border-white/20 transition-all ${hasLiked ? 'bg-red-500/20 text-red-500 border-red-500/50 scale-110' : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        <Heart size={28} className={hasLiked ? "fill-current" : ""} />
                    </button>
                </div>

                {/* Touch Navigation Overlay */}
                <div className="absolute inset-0 z-20 flex">
                    <div className="w-1/3 h-full" onClick={handlePrevStory} />
                    <div className="w-2/3 h-full" onClick={handleNextStory} />
                </div>
            </div>

            {/* Desktop Navigation Hints */}
            <div className="hidden sm:flex absolute inset-y-0 left-4 items-center z-10 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                    <ChevronLeft size={24} />
                </div>
            </div>
            <div className="hidden sm:flex absolute inset-y-0 right-4 items-center z-10 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                    <ChevronRight size={24} />
                </div>
            </div>
        </div>
    )
}
