'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, MapPin, Link as LinkIcon, Edit2, Camera, Mail, Music, Palette, Play, Pause, Volume2, Upload } from 'lucide-react'
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

    const formatCount = (count: number) => {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1).replace('.0', '') + 'M'
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1).replace('.0', '') + 'K'
        }
        return count.toString()
    }

    const [profileSongUrl, setProfileSongUrl] = useState(profile.profile_song_url || '')
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
    const [coverUrl, setCoverUrl] = useState(profile.cover_url)
    const [isUploading, setIsUploading] = useState(false)
    const [isCoverUploading, setIsCoverUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isMusicUploading, setIsMusicUploading] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(50)
    const audioRef = useRef<HTMLAudioElement>(null)
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)
    const musicInputRef = useRef<HTMLInputElement>(null)

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
        // Load saved volume level from profile
        if (profile.profile_volume_level) {
            setVolume(profile.profile_volume_level)
        }
        // Auto-play music when profile loads
        if (profile.profile_song_url && audioRef.current) {
            setTimeout(() => {
                audioRef.current?.play().catch(() => {
                    // Browser blocked autoplay, user must click play button
                    console.log('Autoplay blocked by browser')
                })
            }, 500)
        }
    }, [profile])

    // Play/pause profile music on load and when URL changes
    useEffect(() => {
        if (audioRef.current && profileSongUrl) {
            audioRef.current.src = profileSongUrl
            audioRef.current.volume = volume / 100
            if (isPlaying) {
                audioRef.current.play().catch(err => console.log('Auto-play prevented:', err))
            }
        }
    }, [profileSongUrl, volume, isPlaying])

    // Save volume level to database (with debounce)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (isOwner && volume !== (profile.profile_volume_level || 50)) {
                try {
                    await supabase
                        .from('profiles')
                        .update({ profile_volume_level: volume })
                        .eq('id', user?.id || profile.id)
                } catch (err) {
                    console.error('Error saving volume:', err)
                }
            }
        }, 1000) // Wait 1 sec after volume change before saving

        return () => clearTimeout(timer)
    }, [volume, isOwner, profile.profile_volume_level, user?.id, profile.id])

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

            // Special case for Xzual (Mercedes-AMG F1) as requested by the user
            if (profile.username === 'Xzual') {
                setFollowersCount(5200000) // This will be formatted in the UI
            } else {
                setFollowersCount(followers || 0)
            }
            setFollowingCount(following || 0)
        }
        fetchFollowData()
    }, [profile.id, profile.username])

    const handleSave = async () => {
        try {
            setIsSaving(true)

            const targetId = user?.id || profile.id

            const { data, error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName,
                    bio,
                    location,
                    website,
                    accent_color: accentColor,
                    profile_song_url: profileSongUrl,
                    profile_volume_level: volume
                })
                .eq('id', targetId)
                .select()
                .single()

            if (error) {
                console.error('Error updating profile:', error)
                alert('Profil kaydedilirken bir hata oluştu: ' + (error.message || error))
                return
            }

            setIsEditing(false)
            router.refresh()
        } catch (err) {
            console.error('Unexpected error while saving profile:', err)
            alert('Profil kaydedilirken beklenmeyen bir hata oluştu.')
        } finally {
            setIsSaving(false)
        }
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

    const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return

        const file = e.target.files[0]
        if (!file.type.startsWith('audio/')) {
            alert('Lütfen bir ses dosyası seçiniz.')
            return
        }

        setIsMusicUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', user?.id || profile.id)

            const response = await fetch('/api/upload-music', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            setProfileSongUrl(data.url)
        } catch (error) {
            console.error('Error uploading music:', error)
            alert('Müzik yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
        } finally {
            setIsMusicUploading(false)
        }
    }

    return (
        <div>
            {/* Audio player (hidden) */}
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

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
                                disabled={isSaving}
                            >
                                {isEditing ? (isSaving ? 'Kaydediliyor...' : 'Kaydet') : 'Profili Düzenle'}
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
                                        <Music size={14} /> Profil Müziği
                                    </label>
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => musicInputRef.current?.click()}
                                            disabled={isMusicUploading}
                                            className="w-full flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            <Upload size={16} />
                                            {isMusicUploading ? 'Yükleniyor...' : 'Müzik Dosyası Seç'}
                                        </button>
                                        <input
                                            type="file"
                                            ref={musicInputRef}
                                            className="hidden"
                                            accept="audio/*"
                                            onChange={handleMusicUpload}
                                        />
                                        {profileSongUrl && (
                                            <div className="space-y-2 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (audioRef.current) {
                                                                if (isPlaying) {
                                                                    audioRef.current.pause()
                                                                } else {
                                                                    audioRef.current.play()
                                                                }
                                                                setIsPlaying(!isPlaying)
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                                    >
                                                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                                    </button>
                                                    <div className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                                                        Müzik yüklendi
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Volume2 size={14} className="text-gray-500" />
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={volume}
                                                        onChange={(e) => setVolume(Number(e.target.value))}
                                                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                                                    />
                                                    <span className="text-xs text-gray-500 w-8 text-right">{volume}%</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                            {profileSongUrl && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Music size={14} />
                                        <span>Bu profilde müzik var 🎵</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                        <button
                                            onClick={() => {
                                                if (audioRef.current) {
                                                    if (isPlaying) {
                                                        audioRef.current.pause()
                                                    } else {
                                                        audioRef.current.play()
                                                    }
                                                    setIsPlaying(!isPlaying)
                                                }
                                            }}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
                                        >
                                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                        <div className="flex-1 flex items-center gap-2">
                                            <Volume2 size={14} className="text-gray-500 flex-shrink-0" />
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={volume}
                                                onChange={(e) => setVolume(Number(e.target.value))}
                                                className="flex-1 h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                                            />
                                            <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">{volume}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                            <span className="font-bold text-black dark:text-white">{formatCount(followingCount)}</span>
                            <span className="text-gray-500">Takip edilen</span>
                        </div>
                        <div className="flex gap-1 hover:underline cursor-pointer">
                            <span className="font-bold text-black dark:text-white">{formatCount(followersCount)}</span>
                            <span className="text-gray-500">Takipçi</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
