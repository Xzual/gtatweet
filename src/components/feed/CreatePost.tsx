'use client'

import { useState, useRef, useEffect } from 'react'
import { Image, Send, Smile, Calendar, MapPin, AlignLeft } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { UserSelector } from './UserSelector'
import { GrokButton } from './GrokButton'
import { fetchMentionSuggestions, MentionUser } from '@/utils/mentions'

export function CreatePost() {
    const { user } = useAuth()
    const [content, setContent] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [showPollCreator, setShowPollCreator] = useState(false)
    const [pollOptions, setPollOptions] = useState(['', ''])

    // Mentions state
    const [showMentions, setShowMentions] = useState(false)
    const [mentionQuery, setMentionQuery] = useState('')
    const [suggestedUsers, setSuggestedUsers] = useState<MentionUser[]>([])
    const [mentionIndex, setMentionIndex] = useState(0)

    // Fetch fresh profile data to ensure avatar is up to date
    useEffect(() => {
        if (user) {
            supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data?.avatar_url) setAvatarUrl(data.avatar_url)
                })
        }
    }, [user])

    // Mention suggestion fetching
    useEffect(() => {
        if (showMentions) {
            fetchMentionSuggestions(mentionQuery).then(users => {
                // Ensure bot is suggested if query is empty or matches part of its name
                if (!mentionQuery || 'gtatweet_ai'.includes(mentionQuery)) {
                    const botAdded = users.find(u => u.username === 'gtatweet_ai')
                    if (!botAdded) {
                        // Normally you'd fetch it, but for speed we can fallback to standard fetch
                    }
                }
                setSuggestedUsers(users)
                setMentionIndex(0)
            })
        }
    }, [showMentions, mentionQuery])

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setContent(value)

        const cursorPosition = e.target.selectionStart
        const textBeforeCursor = value.substring(0, cursorPosition)
        const words = textBeforeCursor.split(/\s/)
        const lastWord = words[words.length - 1]

        if (lastWord.startsWith('@')) {
            setShowMentions(true)
            setMentionQuery(lastWord.substring(1))
        } else {
            setShowMentions(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && suggestedUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionIndex(prev => (prev + 1) % suggestedUsers.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionIndex(prev => (prev - 1 + suggestedUsers.length) % suggestedUsers.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                selectUser(suggestedUsers[mentionIndex])
            } else if (e.key === 'Escape') {
                setShowMentions(false)
            }
        }
    }

    const selectUser = (selectedUser: MentionUser) => {
        const cursorPosition = textAreaRef.current?.selectionStart || 0
        const textBeforeCursor = content.substring(0, cursorPosition)
        const textAfterCursor = content.substring(cursorPosition)

        const words = textBeforeCursor.split(/\s/)
        words[words.length - 1] = `@${selectedUser.username} `

        const newContent = words.join(' ') + textAfterCursor
        setContent(newContent)
        setShowMentions(false)
        textAreaRef.current?.focus()
    }

    const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handlePost = async () => {
        if ((!content.trim() && !imageFile) || !user) return

        setIsPosting(true)
        try {
            let imageUrl = null

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${user.id}-${Math.random()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(filePath, imageFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(filePath)

                imageUrl = publicUrl
            }

            const pollData = showPollCreator && pollOptions.filter(opt => opt.trim()).length >= 2 ? {
                options: pollOptions.filter(opt => opt.trim()).map(opt => ({ text: opt, votes: 0 })),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            } : null

            const mediaType = imageFile?.type.startsWith('video') ? 'video' : 'image'

            const { data: newPost, error } = await supabase.from('posts').insert({
                user_id: user.id,
                content,
                image_url: imageUrl,
                poll_data: pollData,
                media_type: mediaType
            }).select().single()

            if (error) throw error

            // Check for @gtatweet mention to trigger auto-reply
            if (content.toLowerCase().includes('@gtatweet')) {
                // Call Grok API in background
                fetch('/api/grok', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        postId: newPost.id,
                        content,
                        replyToUsername: user.user_metadata?.username
                    })
                }).catch(err => console.error('Auto-Grok Error:', err))
            }

            // Reset state
            setContent('')
            setImageFile(null)
            setPreviewUrl(null)
            setShowPollCreator(false)
            setPollOptions(['', ''])
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (error) {
            console.error('Error posting:', error)
            alert('Gönderi paylaşılırken bir hata oluştu.')
        } finally {
            setIsPosting(false)
        }
    }

    if (!user) return null

    return (
        <div className="border-b border-gray-200 dark:border-gray-800 p-3 md:p-4">
            <div className="flex gap-3 md:gap-4">
                <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 bg-cover bg-center overflow-hidden border border-gray-100 dark:border-gray-800"
                    style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined }}
                >
                    {!avatarUrl && (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200 dark:bg-gray-700">
                            <div className="w-full h-full bg-gray-300 dark:bg-gray-600" />
                        </div>
                    )}
                </div>
                <div className="flex-1 relative">
                    <textarea
                        ref={textAreaRef}
                        value={content}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Neler oluyor?!"
                        className="w-full bg-transparent border-none focus:ring-0 text-lg md:text-xl resize-none min-h-[50px] placeholder-gray-500 text-gray-900 dark:text-white outline-none"
                        maxLength={280}
                    />

                    {showMentions && (
                        <UserSelector
                            users={suggestedUsers}
                            onSelect={selectUser}
                            onClose={() => setShowMentions(false)}
                            selectedIndex={mentionIndex}
                            setSelectedIndex={setMentionIndex}
                            position="bottom"
                        />
                    )}

                    {previewUrl && (
                        <div className="relative mt-2 mb-4 group/preview">
                            {imageFile?.type.startsWith('video') ? (
                                <video src={previewUrl} controls className="rounded-2xl max-h-60 md:max-h-80 w-auto border border-gray-200 dark:border-gray-800 shadow-sm" />
                            ) : (
                                <img src={previewUrl} alt="Preview" className="rounded-2xl max-h-60 md:max-h-80 w-auto object-cover border border-gray-200 dark:border-gray-800 shadow-sm" />
                            )}
                            <button
                                onClick={() => {
                                    setImageFile(null)
                                    setPreviewUrl(null)
                                    if (fileInputRef.current) fileInputRef.current.value = ''
                                }}
                                className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors backdrop-blur-sm opacity-0 group-hover/preview:opacity-100 transition-opacity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    )}

                    {showPollCreator && (
                        <div className="mt-2 mb-4 p-3 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 relative">
                            <button
                                onClick={() => setShowPollCreator(false)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <div className="space-y-2 pr-6">
                                {pollOptions.map((option, index) => (
                                    <div key={index} className="relative group">
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...pollOptions]
                                                newOptions[index] = e.target.value
                                                setPollOptions(newOptions)
                                            }}
                                            placeholder={`Seçenek ${index + 1}`}
                                            className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm focus:border-accent outline-none"
                                            maxLength={25}
                                        />
                                        {pollOptions.length > 2 && (
                                            <button
                                                onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {pollOptions.length < 4 && (
                                    <button
                                        onClick={() => setPollOptions([...pollOptions, ''])}
                                        className="text-accent text-sm font-medium hover:underline flex items-center gap-1 mt-1 pl-1"
                                    >
                                        + Seçenek ekle
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {content.length > 0 && (
                        <div className="border-b border-gray-100 dark:border-gray-900 pb-2 mb-2">
                            <span className={`text-[10px] md:text-xs font-medium ${content.length > 260 ? 'text-red-500' : 'text-accent'}`}>{280 - content.length} characters left</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-1 md:mt-2">
                        <div className="flex gap-0 text-accent">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-2 rounded-full transition-colors ${previewUrl ? 'bg-accent/10 text-accent' : 'hover:bg-accent/10 text-accent'}`}
                                title="Fotoğraf/Video Ekle"
                            >
                                <Image size={20} />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,video/*"
                                    onChange={handleMediaSelect}
                                />
                            </button>
                            <button
                                onClick={() => {
                                    setShowPollCreator(!showPollCreator)
                                    if (!showPollCreator && previewUrl) {
                                        setPreviewUrl(null)
                                        setImageFile(null)
                                    }
                                }}
                                className={`p-2 rounded-full transition-colors ${showPollCreator ? 'bg-accent/10 text-accent' : 'hover:bg-accent/10 text-accent'}`}
                                title="Anket"
                            >
                                <AlignLeft size={20} />
                            </button>
                        </div>
                        <button
                            onClick={handlePost}
                            disabled={isPosting || (!content.trim() && !imageFile && !showPollCreator)}
                            className="bg-accent text-white px-6 py-2 rounded-full font-bold hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-accent/20"
                        >
                            {isPosting ? '...' : 'Gönder'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
