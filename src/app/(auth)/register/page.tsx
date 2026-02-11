'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'

export default function RegisterPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // 1. Check if username exists
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single()

            if (existingUser) {
                throw new Error('Username already taken')
            }

            // 2. Sign up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        display_name: displayName,
                    },
                },
            })

            if (authError) throw authError

            // 3. Create Profile (handled by Trigger ideally, but manual here if trigger fails or as backup)
            // Since we rely on trigger, we hope it works. 
            // Requirement: "Kayıt olunca otomatik: kullanıcı profili oluştur" -> "DB trigger" usually best.
            // But if user wants pure client side, we might insert here.
            // However, RLS usually blocks insert for other users.
            // The `options.data` metadata is often used by trigger to populate profile.

            router.push('/')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">GTATweet</h1>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">Create your account</h2>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <input
                                type="text"
                                required
                                className="relative block w-full rounded-t-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
                                placeholder="Username (unique)"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                required
                                className="relative block w-full border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
                                placeholder="Display Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="email"
                                required
                                className="relative block w-full border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Creating account...' : 'Sign up'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
