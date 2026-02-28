'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/utils/supabase/client'

interface StoryViewerProps {
    users: any[]
    initialUserIndex: number
    onClose: () => void
}

export function StoryViewer({ users, initialUserIndex, onClose }: StoryViewerProps) {
    const { user: currentUser } = useAuth()
    const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex)
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [progress, setProgress] = useState(0)

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
                    handleNextStory()
                    return 0
                }
                return prev + step
            })
        }, interval)

        return () => clearInterval(timer)
    }, [currentStoryIndex, currentUserIndex, isPaused, activeStory])

    // Reset progress when changing story
    useEffect(() => {
        setProgress(0)
    }, [currentStoryIndex, currentUserIndex])

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
        try {
            await supabase.from('stories').delete().eq('id', activeStory.id)

            // Remove from local state visually for immediate feedback
            activeUser.stories.splice(currentStoryIndex, 1)

            if (activeUser.stories.length === 0) {
                // If user has no more stories, go to next user or close
                if (users.length === 1) {
                    onClose()
                } else if (currentUserIndex < users.length - 1) {
                    // Go next
                    setCurrentUserIndex(prev => prev + 1)
                    setCurrentStoryIndex(0)
                } else {
                    // Was last user, go to previous
                    setCurrentUserIndex(prev => prev - 1)
                    setCurrentStoryIndex(users[currentUserIndex - 1].stories.length - 1)
                }
            } else {
                // User still has stories, adjust index
                if (currentStoryIndex >= activeUser.stories.length) {
                    setCurrentStoryIndex(activeUser.stories.length - 1)
                }
            }
        } catch (error) {
            console.error('Error deleting story:', error)
            alert('Silinirken hata oluştu.')
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
                            {activeUser.avatar_url && <img src={activeUser.avatar_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-white font-bold text-sm drop-shadow-md">{activeUser.username}</span>
                        <span className="text-white/70 text-xs drop-shadow-md">
                            {formatDistanceToNow(new Date(activeStory.created_at), { locale: tr })}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
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
                                <div className="absolute bottom-16 inset-x-8 text-center text-white bg-black/60 p-4 rounded-2xl backdrop-blur-sm">
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
