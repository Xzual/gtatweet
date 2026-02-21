'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    const handleMagicLink = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (!email) {
            setError('Please enter your email address first.')
            return
        }
        setLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        })
        if (error) {
            setError(error.message)
        } else {
            alert('Magic link sent to your email!')
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GTATweet</h1>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight">Sign in to your account</h2>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="block w-full rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                                <Link href="/forgot-password" title="Reset your password" className="text-xs font-bold text-blue-500 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center rounded-xl bg-blue-600 py-3 px-4 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Sign in'}
                        </button>

                        <button
                            type="button"
                            onClick={handleMagicLink}
                            disabled={loading}
                            className="w-full flex justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                        >
                            Log in with Magic Link ✨
                        </button>
                    </div>

                    <div className="text-center pt-4">
                        <Link href="/register" className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
                            Don't have an account? <span className="text-blue-600 dark:text-blue-400">Sign up</span>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
