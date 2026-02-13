'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/utils/supabase/client'

export function DynamicTheme() {
    const { user } = useAuth()

    useEffect(() => {
        const applyColor = (color: string) => {
            document.documentElement.style.setProperty('--accent-color', color)
            // Also generate a lighter/transparent version for hover states
            document.documentElement.style.setProperty('--accent-color-hover', `${color}1a`) // 10% opacity hex
        }

        if (!user) {
            applyColor('#3b82f6')
            return
        }

        const fetchColor = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('accent_color')
                .eq('id', user.id)
                .single()

            if (data?.accent_color) {
                applyColor(data.accent_color)
            } else {
                applyColor('#3b82f6')
            }
        }

        fetchColor()

        // Listen for profile changes to update color instantly
        const channel = supabase
            .channel('profile_theme_updates')
            .on('postgres_changes' as any, {
                event: 'UPDATE',
                table: 'profiles',
                filter: `id=eq.${user.id}`
            }, (payload: any) => {
                if (payload.new.accent_color) {
                    applyColor(payload.new.accent_color)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    return null
}
