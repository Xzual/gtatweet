'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { Shield, Users, Search, Plus } from 'lucide-react'

export default function CrewsPage() {
    const { user } = useAuth()
    const [crews, setCrews] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchCrews()
    }, [])

    const fetchCrews = async () => {
        try {
            // Fetch crews with basic stats
            const { data, error } = await supabase
                .from('crews')
                .select(`
                    *,
                    owner:profiles!owner_id(username, display_name),
                    members:crew_members(count)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            if (data) setCrews(data)
        } catch (error) {
            console.error('Error fetching crews:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredCrews = crews.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tag.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex-1 border-r border-gray-200 dark:border-gray-800 min-h-screen bg-white dark:bg-black pb-20 md:pb-0">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-black">Çeteler (Crews)</h1>
                    <Link
                        href="/crews/create"
                        className="flex items-center gap-1 bg-accent text-white px-3 py-1.5 rounded-full text-sm font-bold hover:bg-accent/90 transition-colors"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Çete Kur</span>
                    </Link>
                </div>
            </header>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Çete ara (İsim veya Tag)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-full py-2.5 pl-10 pr-4 text-[15px] focus:ring-2 focus:ring-accent outline-none text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Crew List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Çeteler yükleniyor...</div>
                ) : filteredCrews.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Hiç çete bulunamadı.</p>
                        <p className="text-sm mt-1">Hemen bir çete kurup Los Santos'a hükmetmeye başla!</p>
                    </div>
                ) : (
                    filteredCrews.map((crew) => (
                        <Link
                            key={crew.id}
                            href={`/crews/${crew.tag}`}
                            className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                            <div className="flex gap-4">
                                <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-800 flex-shrink-0 border border-gray-200 dark:border-gray-700 overflow-hidden bg-cover bg-center" style={{ backgroundImage: crew.avatar_url ? `url(${crew.avatar_url})` : undefined }}>
                                    {!crew.avatar_url && (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Shield size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="font-bold text-lg truncate flex items-center gap-2">
                                                {crew.name}
                                                <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-mono">
                                                    [{crew.tag}]
                                                </span>
                                            </h2>
                                            <p className="text-sm text-gray-500 truncate mt-0.5">
                                                Lider: @{crew.owner?.username}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 dark:bg-gray-900 px-2.5 py-1 rounded-full">
                                            <Users size={14} />
                                            <span className="font-medium">{crew.members?.[0]?.count || 1}</span>
                                        </div>
                                    </div>
                                    {crew.description && (
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                                            {crew.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
