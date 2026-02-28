'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { Shield, ArrowLeft, Users, UserPlus, LogOut, Settings } from 'lucide-react'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'

export default function CrewProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const tag = typeof params.tag === 'string' ? params.tag.toUpperCase() : ''

    const [crew, setCrew] = useState<any>(null)
    const [members, setMembers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isJoining, setIsJoining] = useState(false)

    useEffect(() => {
        if (tag) {
            fetchCrewData()
        }
    }, [tag])

    const fetchCrewData = async () => {
        try {
            // Fetch crew info
            const { data: crewData, error: crewError } = await supabase
                .from('crews')
                .select('*, owner:profiles!owner_id(*)')
                .eq('tag', tag)
                .single()

            if (crewError) throw crewError
            if (crewData) setCrew(crewData)

            // Fetch members
            if (crewData) {
                const { data: memberData, error: memberError } = await supabase
                    .from('crew_members')
                    .select('*, profiles(*)')
                    .eq('crew_id', crewData.id)
                    .order('joined_at', { ascending: true })

                if (memberError) throw memberError
                if (memberData) setMembers(memberData)
            }
        } catch (error) {
            console.error('Error fetching crew:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleJoinCrew = async () => {
        if (!user || !crew) return
        setIsJoining(true)

        try {
            // Check if user is already in a crew
            const { data: existingMembership } = await supabase
                .from('crew_members')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (existingMembership) {
                alert('Zaten bir çeteye üyesiniz. Yeni bir çeteye katılmak için önce mevcut çetenizden ayrılmalısınız.')
                setIsJoining(false)
                return
            }

            // Join crew
            const { error } = await supabase
                .from('crew_members')
                .insert({
                    crew_id: crew.id,
                    user_id: user.id,
                    role: 'member'
                })

            if (error) throw error

            // Send notification to owner
            await supabase.from('notifications').insert({
                user_id: crew.owner_id,
                actor_id: user.id,
                type: 'crew_invite',
                post_id: null
            })

            fetchCrewData() // Refresh
        } catch (error) {
            console.error('Error joining crew:', error)
            alert('Katılma işlemi başarısız oldu.')
        } finally {
            setIsJoining(false)
        }
    }

    const handleLeaveCrew = async () => {
        if (!user || !crew) return
        if (crew.owner_id === user.id) {
            alert('Lider çeteyi terk edemez. Çeteyi dağıtmak istiyorsanız ayarlara gidin.')
            return
        }

        if (!confirm('Bu çeteden ayrılmak istediğinize emin misiniz?')) return

        try {
            const { error } = await supabase
                .from('crew_members')
                .delete()
                .match({ crew_id: crew.id, user_id: user.id })

            if (error) throw error
            fetchCrewData() // Refresh
        } catch (error) {
            console.error('Error leaving crew:', error)
            alert('Ayrılma işlemi başarısız oldu.')
        }
    }

    if (isLoading) {
        return <div className="flex-1 flex justify-center items-center min-h-screen bg-white dark:bg-black"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></span></div>
    }

    if (!crew) {
        return (
            <div className="flex-1 border-r border-gray-200 dark:border-gray-800 min-h-screen bg-white dark:bg-black p-8 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h1 className="text-2xl font-black mb-2">Çete Bulunamadı</h1>
                <p className="text-gray-500 mb-6">Böyle bir çete tagı bulunmuyor.</p>
                <Link href="/crews" className="bg-accent text-white px-6 py-2 rounded-full font-bold hover:opacity-90 transition-colors">
                    Çetelere Dön
                </Link>
            </div>
        )
    }

    const isMember = user ? members.some(m => m.user_id === user.id) : false
    const isOwner = user?.id === crew.owner_id

    return (
        <div className="flex-1 border-r border-gray-200 dark:border-gray-800 min-h-screen bg-white dark:bg-black pb-20 md:pb-0">
            {/* Header / Banner */}
            <div className="relative">
                <div
                    className="h-32 md:h-48 w-full bg-gray-200 dark:bg-gray-800 bg-cover bg-center"
                    style={{ backgroundImage: crew.banner_url ? `url(${crew.banner_url})` : undefined }}
                >
                    {!crew.banner_url && <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-600"></div>}
                </div>

                <Link href="/crews" className="absolute top-4 left-4 p-2 bg-black/50 text-white hover:bg-black/70 rounded-full backdrop-blur-sm transition-colors">
                    <ArrowLeft size={20} />
                </Link>
            </div>

            {/* Profile Info */}
            <div className="px-4 pb-4">
                <div className="flex justify-between items-start">
                    <div className="relative -mt-16 md:-mt-20 mb-3">
                        <div
                            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white dark:bg-black p-1 border-4 border-white dark:border-black flex items-center justify-center bg-cover bg-center"
                            style={{ backgroundImage: crew.avatar_url ? `url(${crew.avatar_url})` : undefined }}
                        >
                            {!crew.avatar_url && <Shield size={48} className="text-gray-400" />}
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        {user && !isMember && (
                            <button
                                onClick={handleJoinCrew}
                                disabled={isJoining}
                                className="bg-accent text-white px-5 py-2 rounded-full font-bold hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                <UserPlus size={18} />
                                <span>{isJoining ? 'Katılınıyor...' : 'Katıl'}</span>
                            </button>
                        )}
                        {user && isMember && !isOwner && (
                            <button
                                onClick={handleLeaveCrew}
                                className="border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-5 py-2 rounded-full font-bold transition-colors flex items-center gap-1"
                            >
                                <LogOut size={18} />
                                <span>Ayrıl</span>
                            </button>
                        )}
                        {isOwner && (
                            <button className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 px-5 py-2 rounded-full font-bold transition-colors flex items-center gap-1">
                                <Settings size={18} />
                                <span>Ayarlar</span>
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
                        {crew.name}
                        <span className="text-sm bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-mono">
                            [{crew.tag}]
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Kuruluş: {new Date(crew.created_at).toLocaleDateString()}
                    </p>
                    {crew.description && (
                        <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {crew.description}
                        </p>
                    )}

                    <div className="flex gap-6 mt-4">
                        <div className="flex items-center gap-1">
                            <span className="font-bold">{members.length}</span>
                            <span className="text-gray-500 text-sm block">Üye</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold">0</span> {/* Placeholder for crew points/reputation */}
                            <span className="text-gray-500 text-sm block">Saygınlık</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members List */}
            <div className="mt-2 border-t border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-black p-4 pb-2">Çete Üyeleri</h2>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {members.map(member => (
                        <Link
                            key={member.id}
                            href={`/user/${member.profiles.username}`}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 bg-cover bg-center" style={{ backgroundImage: member.profiles.avatar_url ? `url(${member.profiles.avatar_url})` : undefined }} />
                                <div>
                                    <div className="flex items-center gap-1 font-bold text-[15px]">
                                        {member.profiles.display_name}
                                        <VerifiedBadge size={14} />
                                        {member.role === 'boss' && (
                                            <span className="ml-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-[10px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                                                Boss
                                            </span>
                                        )}
                                        {member.role === 'co_boss' && (
                                            <span className="ml-1 bg-blue-500/20 text-blue-600 dark:text-blue-500 text-[10px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                                                Co-Boss
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-gray-500 text-sm">@{member.profiles.username}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
