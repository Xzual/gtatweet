'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
    isAiMode: boolean
    toggleAiMode: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAiMode, setIsAiMode] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Recover AI mode from localStorage if it exists
        const savedAiMode = localStorage.getItem('ai_mode') === 'true'
        if (savedAiMode) setIsAiMode(true)

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)

            if (_event === 'SIGNED_OUT') {
                setIsAiMode(false)
                localStorage.removeItem('ai_mode')
                router.refresh()
            }

            if (_event === 'PASSWORD_RECOVERY') {
                router.push('/reset-password')
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const toggleAiMode = () => {
        const newMode = !isAiMode
        setIsAiMode(newMode)
        localStorage.setItem('ai_mode', String(newMode))
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut, isAiMode, toggleAiMode }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
