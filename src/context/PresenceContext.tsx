'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from './AuthContext'

type PresenceUser = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    online_at: string
}

type PresenceContextType = {
    onlineUsers: PresenceUser[]
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: [] })

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
    const [profile, setProfile] = useState<any>(null)

    // Fetch user profile to share in presence state
    useEffect(() => {
        if (user) {
            supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
                .then(({ data }) => {
                    if (data) setProfile(data)
                })
        } else {
            setProfile(null)
        }
    }, [user])

    useEffect(() => {
        // Create the channel once
        const channel = supabase.channel('global_online_users', {
            config: {
                presence: {
                    key: user?.id || `anon-${Math.random().toString(36).substring(7)}`
                }
            }
        })

        const handleSync = () => {
            const state = channel.presenceState()
            const usersMap = new Map<string, PresenceUser>()

            // Add the AI Bot - always online
            usersMap.set('00000000-0000-4000-a000-000000000000', {
                id: '00000000-0000-4000-a000-000000000000',
                username: 'gtatweet_ai',
                display_name: 'GTATweet AI',
                avatar_url: null,
                online_at: new Date().toISOString()
            })

            Object.values(state).forEach((presences: any) => {
                presences.forEach((p: any) => {
                    const profileData = p.user_profile || p.fallback_profile
                    if (profileData && profileData.id && profileData.id !== '00000000-0000-4000-a000-000000000000') {
                        if (!usersMap.has(profileData.id)) {
                            usersMap.set(profileData.id, {
                                id: profileData.id,
                                username: profileData.username || 'user',
                                display_name: profileData.display_name || profileData.username || 'Anonim',
                                avatar_url: profileData.avatar_url,
                                online_at: p.online_at || new Date().toISOString()
                            })
                        }
                    }
                })
            })

            setOnlineUsers(Array.from(usersMap.values()))
        }

        channel
            .on('presence', { event: 'sync' }, handleSync)
            .on('presence', { event: 'join' }, handleSync)
            .on('presence', { event: 'leave' }, handleSync)
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track with what we have
                    const trackData: any = {
                        online_at: new Date().toISOString()
                    }

                    if (profile) {
                        trackData.user_profile = profile
                    } else if (user) {
                        // Fallback use metadata if profile not loaded yet
                        trackData.fallback_profile = {
                            id: user.id,
                            username: user.user_metadata?.username,
                            display_name: user.user_metadata?.display_name,
                            avatar_url: user.user_metadata?.avatar_url
                        }
                    }

                    await channel.track(trackData)
                }
            })

        return () => {
            channel.unsubscribe()
        }
    }, [user, profile]) // Re-track when profile loads

    return (
        <PresenceContext.Provider value={{ onlineUsers }}>
            {children}
        </PresenceContext.Provider>
    )
}

export const usePresence = () => useContext(PresenceContext)
