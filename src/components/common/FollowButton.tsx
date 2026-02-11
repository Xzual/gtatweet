'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'

interface FollowButtonProps {
    targetId: string
    variant?: 'sidebar' | 'profile'
    onToggle?: (isFollowing: boolean) => void
}

export function FollowButton({ targetId, variant = 'sidebar', onToggle }: FollowButtonProps) {
    const { user } = useAuth()
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || !targetId) return

        const checkFollow = async () => {
            const { data } = await supabase
                .from('follows')
                .select('*')
                .eq('follower_id', user.id)
                .eq('following_id', targetId)
                .single()
            setIsFollowing(!!data)
            setLoading(false)
        }

        checkFollow()

        // Subscribe to changes for this specific follow relationship
        const channel = supabase
            .channel(`follow_sync_${targetId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'follows',
                    filter: `follower_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.new && (payload.new as any).following_id === targetId) {
                        setIsFollowing(true)
                        if (onToggle) onToggle(true)
                    } else if (payload.old && (payload.old as any).following_id === targetId) {
                        setIsFollowing(false)
                        if (onToggle) onToggle(false)
                    } else if (payload.eventType === 'DELETE') {
                        // For delete, we might not have the full old record depending on RLS/Replica Identity
                        // but we can refetch to be sure
                        checkFollow()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, targetId, onToggle])

    const handleFollow = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!user || loading) return

        const newIsFollowing = !isFollowing
        // Optimistic update
        setIsFollowing(newIsFollowing)

        try {
            if (newIsFollowing) {
                const { error } = await supabase.from('follows').insert({
                    follower_id: user.id,
                    following_id: targetId
                })
                if (error) throw error
            } else {
                const { error } = await supabase.from('follows').delete().match({
                    follower_id: user.id,
                    following_id: targetId
                })
                if (error) throw error
            }
            if (onToggle) onToggle(newIsFollowing)
        } catch (error: any) {
            console.error('Error toggling follow:', error)
            alert(`İşlem başarısız: ${error.message || 'Bilinmeyen bir hata oluştu'}. Lütfen fix_follows.sql dosyasındaki kodu çalıştırdığınızdan emin olun.`)
            // Revert on error
            setIsFollowing(!newIsFollowing)
        }
    }

    if (!user || user.id === targetId) return null

    const baseStyles = "rounded-full font-bold transition-all duration-200 active:scale-95"
    const styles = variant === 'profile'
        ? `${baseStyles} px-6 py-2 ${isFollowing
            ? 'border border-gray-300 dark:border-gray-600 hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
            : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
        }`
        : `${baseStyles} px-4 py-1 text-sm ${isFollowing
            ? 'border border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 hover:border-red-500'
            : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
        }`

    return (
        <button
            onClick={handleFollow}
            className={styles}
            disabled={loading}
        >
            {isFollowing ? 'Takiptesin' : 'Takip Et'}
        </button>
    )
}
