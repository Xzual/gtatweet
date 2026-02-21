'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setError(error.message)
        } else {
            alert('Password updated successfully!')
            router.push('/login')
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent italic">GTATweet</h1>
                    <h2 className="mt-6 text-2xl font-black tracking-tight uppercase">Update Password</h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Please enter your new password below.
                    </p>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleUpdatePassword}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">New Password</label>
                            <input
                                type="password"
                                required
                                className="block w-full rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-3.5 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                className="block w-full rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-3.5 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
