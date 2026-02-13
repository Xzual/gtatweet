'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, MapPin, Link as LinkIcon, Edit2, Camera, Mail, Music, Palette } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/utils/supabase/client'
import { FollowButton } from '@/components/common/FollowButton'
import { VerifiedBadge } from '@/components/common/VerifiedBadge'

interface ProfileHeaderProps {
    profile: any
    isOwner: boolean
}

export function ProfileHeader({ profile, isOwner }: ProfileHeaderProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [displayName, setDisplayName] = useState(profile.display_name)
    const [bio, setBio] = useState(profile.bio || '')
    const [location, setLocation] = useState(profile.location || '')
    const [website, setWebsite] = useState(profile.website || '')
    const [accentColor, setAccentColor] = useState(profile.accent_color || '#3b82f6')
    const [profileSongUrl, setProfileSongUrl] = useState(profile.profile_song_url || '')
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
    const [coverUrl, setCoverUrl] = useState(profile.cover_url)
    const [isUploading, setIsUploading] = useState(false)
    const [isCoverUploading, setIsCoverUploading] = useState(false)
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    // Follow state (counts)
    const [followersCount, setFollowersCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)

    useEffect(() => {
        setDisplayName(profile.display_name)
        setBio(profile.bio || '')
        setLocation(profile.location || '')
        setWebsite(profile.website || '')
        setAccentColor(profile.accent_color || '#3b82f6')
        setProfileSongUrl(profile.profile_song_url || '')
        setAvatarUrl(profile.avatar_url)
        setCoverUrl(profile.cover_url)
    }, [profile])

    useEffect(() => {
        const fetchFollowData = async () => {
            // Get counts
            const { count: followers } = await supabase
                .from('follows')
                .select('follower_id', { count: 'exact', head: true })
                .eq('following_id', profile.id)

            const { count: following } = await supabase
                .from('follows')
                .select('following_id', { count: 'exact', head: true })
                .eq('follower_id', profile.id)

            setFollowersCount(followers || 0)
            setFollowingCount(following || 0)
        }
        fetchFollowData()
    }, [profile.id])

    const handleSave = async () => {
        const { error } = await supabase
            .from('profiles')
            .update({
                display_name: displayName,
                bio,
                location,
                website,
                accent_color: accentColor,
                profile_song_url: profileSongUrl
            })
            .eq('id', profile.id)

        if (!error) setIsEditing(false)
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${user?.id}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        setIsUploading(true)

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile.id)

            if (updateError) throw updateError

            setAvatarUrl(publicUrl)
        } catch (error) {
            console.error('Error uploading avatar:', error)
            alert('Profil fotoğrafı yüklenirken hata oluştu.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `cover_${user?.id}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        setIsCoverUploading(true)

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars') // Reusing avatars bucket or user can create 'covers'
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ cover_url: publicUrl })
                .eq('id', profile.id)

            if (updateError) {
                console.error("Column might not exist", updateError)
                throw updateError
            }

            setCoverUrl(publicUrl)
        } catch (error) {
            console.error('Error uploading cover:', error)
            alert('Kapak fotoğrafı yüklenirken hata oluştu. Veritabanında cover_url sütunu olduğundan emin olun.')
        } finally {
            setIsCoverUploading(false)
        }
    }

    return (
        <div>
            {/* Cover Image */}
            <div
                className="h-48 bg-gray-200 dark:bg-gray-800 w-full relative bg-cover bg-center group/cover"
                style={{ backgroundImage: coverUrl ? `url(${coverUrl})` : undefined }}
            >
                {isOwner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            className="p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                            disabled={isCoverUploading}
                        >
                            <Camera size={24} />
                        </button>
                        <input
                            type="file"
                            ref={coverInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleCoverUpload}
                        />
                    </div>
                )}
            </div>

            <div className="px-4 pb-4">
                <div className="flex justify-between items-start">
                    {/* Avatar */}
                    <div className="-mt-16 relative group">
                        <div
                            className="w-32 h-32 rounded-full border-4 border-white dark:border-black bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                            style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined }}
                        />

                        {isOwner && (
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <Camera className="text-white" />
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={isUploading}
                                />
                            </button>
                        )}
                    </div>

                    {/* Edit Profile or Follow Button */}
                    <div className="mt-4">
                        {isOwner ? (
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {isEditing ? 'Kaydet' : 'Profili Düzenle'}
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/messages?user=${profile.id}`)}
                                    className="p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Mesaj Gönder"
                                >
                                    <Mail size={20} />
                                </button>
                                <FollowButton
                                    targetId={profile.id}
                                    variant="profile"
                                    onToggle={(isNowFollowing) => {
                                        setFollowersCount(prev => isNowFollowing ? prev + 1 : prev - 1)
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    {isEditing ? (
                        <div className="space-y-4 max-w-md">
                            <div className="flex items-center gap-2">
                                <input
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="flex-1 text-xl font-bold bg-transparent border-b border-gray-300 focus:border-accent focus:outline-none"
                                    placeholder="İsim"
                                />
                                <VerifiedBadge size={18} />
                                {profile.username === 'gtatweet_ai' && (
                                    <span className="bg-gradient-to-r from-accent to-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm shadow-accent/50">
                                        AI BOT
                                    </span>
                                )}
                            </div>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full bg-transparent border-b border-gray-300 focus:border-accent focus:outline-none resize-none"
                                placeholder="Biyografi"
                                rows={3}
                            />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Konum"
                                className="w-full bg-transparent border-b border-gray-300 focus:border-accent focus:outline-none"
                            />
                            <input
                                type="text"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="Web sitesi"
                                className="w-full bg-transparent border-b border-gray-300 focus:border-accent focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <Palette size={14} /> Tema Rengi
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#000000'].map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setAccentColor(color)}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${accentColor === color ? 'border-accent scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={accentColor}
                                            onChange={(e) => setAccentColor(e.target.value)}
                                            className="w-8 h-8 rounded-full overflow-hidden border-none p-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <Music size={14} /> Profil Müziği (URL)
                                    </label>
                                    <input
                                        type="text"
                                        value={profileSongUrl}
                                        onChange={(e) => setProfileSongUrl(e.target.value)}
                                        placeholder="MP3/SoundCloud linki"
                                        className="w-full bg-gray-100 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold flex items-center gap-1">
                                    {displayName || profile.username}
                                    <VerifiedBadge size={18} />
                                </h1>
                                {profile.username === 'gtatweet_ai' && (
                                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm shadow-blue-500/50">
                                        AI BOT
                                    </span>
                                )}
                            </div>
                            <div className="text-gray-500">@{profile.username}</div>
                            <p className="mt-4 whitespace-pre-wrap">{bio}</p>
                        </>
                    )}

                    <div className="flex gap-4 mt-4 text-gray-500 text-sm">
                        <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>Katılma tarihi: {new Date(profile.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-4">
                        <div className="flex gap-1 hover:underline cursor-pointer">
                            <span className="font-bold text-black dark:text-white">{followingCount}</span>
                            <span className="text-gray-500">Takip edilen</span>
                        </div>
                        <div className="flex gap-1 hover:underline cursor-pointer">
                            <span className="font-bold text-black dark:text-white">{followersCount}</span>
                            <span className="text-gray-500">Takipçi</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
