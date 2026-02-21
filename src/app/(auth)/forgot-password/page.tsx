'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
            setError(error.message)
        } else {
            setMessage('Password reset link sent! Please check your email.')
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent italic">GTATweet</h1>
                    <h2 className="mt-6 text-2xl font-black tracking-tight uppercase">Reset Password</h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleReset}>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="block w-full rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-3.5 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-sm"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl border border-red-100 dark:border-red-900/30 font-medium">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm p-4 rounded-xl border border-green-100 dark:border-green-900/30 font-medium text-center">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Sending link...' : 'Send Reset Link'}
                    </button>

                    <div className="text-center pt-4">
                        <Link href="/login" className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors inline-flex items-center gap-2">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
