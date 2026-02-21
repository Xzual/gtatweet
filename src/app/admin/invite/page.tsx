'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Send, UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminInvitePage() {
    const { user } = useAuth()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const MANAGER_ID = 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5' // Xzual

    if (!user || user.id !== MANAGER_ID) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800 max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Access Denied</h2>
                    <p className="text-gray-500">Only authorized managers can access this page.</p>
                </div>
            </div>
        )
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            const response = await fetch('/api/admin/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation')
            }

            setMessage(`Successfully sent invitation to ${email}!`)
            setEmail('')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors mb-4 font-bold text-sm">
                    <ArrowLeft size={16} /> Dashboard'a Dön
                </Link>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent italic flex items-center gap-3">
                    <UserPlus size={32} /> Kullanıcı Davet Et
                </h1>
                <p className="text-gray-500 mt-2 font-medium">Yeni üyeleri GTATweet ekosistemine davet et.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl shadow-blue-500/5">
                <form onSubmit={handleInvite} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email Adresi</label>
                        <input
                            type="email"
                            required
                            className="block w-full rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/50 py-3.5 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            placeholder="davetli@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm p-4 rounded-xl border border-green-100 dark:border-green-900/30 font-bold">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Gönderiliyor...' : (
                            <>
                                <Send size={18} /> Davetiye Gönder
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                <p className="font-bold uppercase mb-1">Bilgi:</p>
                Davet edilen kullanıcılara gönderilen link onları kayıt sayfasına yönlendirecektir. Kayıt işlemini tamamladıklarında otomatik olarak onaylanmış olacaklar.
            </div>
        </div>
    )
}
