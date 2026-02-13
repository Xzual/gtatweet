'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Trash2, Heart, MessageCircle, Repeat2, Share } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/utils/supabase/client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { GrokButton } from './GrokButton'
import { UserSelector } from './UserSelector'
import { fetchMentionSuggestions, MentionUser } from '@/utils/mentions'

interface PostProps {
    post: {
        id: string
        content: string
        created_at: string
        user_id: string
        profiles: {
            username: string
            display_name: string
            avatar_url: string | null
        }
    }
}

export function PostCard({ post }: PostProps) {
    const { user } = useAuth()
    const isOwner = user?.id === post.user_id
    const [liked, setLiked] = useState(false)
    const [likesCount, setLikesCount] = useState(0)
    const [showComments, setShowComments] = useState(false)
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [commentCount, setCommentCount] = useState(0)

    // Mentions state for comments
    const [showMentions, setShowMentions] = useState(false)
    const [mentionQuery, setMentionQuery] = useState('')
    const [suggestedUsers, setSuggestedUsers] = useState<MentionUser[]>([])
    const [mentionIndex, setMentionIndex] = useState(0)
    const commentInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (showMentions) {
            fetchMentionSuggestions(mentionQuery).then(users => {
                setSuggestedUsers(users)
                setMentionIndex(0)
            })
        }
    }, [showMentions, mentionQuery])

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setNewComment(value)

        const cursorPosition = e.target.selectionStart || 0
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

    const handleCommentKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && suggestedUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionIndex(prev => (prev + 1) % suggestedUsers.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionIndex(prev => (prev - 1 + suggestedUsers.length) % suggestedUsers.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                selectMention(suggestedUsers[mentionIndex])
            } else if (e.key === 'Escape') {
                setShowMentions(false)
            }
        } else if (e.key === 'Enter') {
            handleSendComment()
        }
    }

    const selectMention = (selectedUser: MentionUser) => {
        const cursorPosition = commentInputRef.current?.selectionStart || 0
        const textBeforeCursor = newComment.substring(0, cursorPosition)
        const textAfterCursor = newComment.substring(cursorPosition)

        const words = textBeforeCursor.split(/\s/)
        words[words.length - 1] = `@${selectedUser.username} `

        const newValue = words.join(' ') + textAfterCursor
        setNewComment(newValue)
        setShowMentions(false)
        commentInputRef.current?.focus()
    }

    useEffect(() => {
        const fetchData = async () => {
            // Check if user liked the post
            if (user) {
                const { data: likeData } = await supabase
                    .from('likes')
                    .select('id')
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)
                    .single()
                setLiked(!!likeData)
            }

            // Get total likes count
            const { count: totalLikes } = await supabase
                .from('likes')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', post.id)
            setLikesCount(totalLikes || 0)

            // Get total comments count
            const { count: totalComments } = await supabase
                .from('comments')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', post.id)
            setCommentCount(totalComments || 0)
        }

        fetchData()

        // Realtime likes
        const likesChannel = supabase
            .channel(`post_likes_${post.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'likes',
                filter: `post_id=eq.${post.id}`
            }, () => {
                // Refresh count and user status on any like change
                fetchData()
            })
            .subscribe()

        // Realtime comments
        const commentsChannel = supabase
            .channel(`post_comments_${post.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `post_id=eq.${post.id}`
            }, (payload) => {
                // Update total count
                supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id)
                    .then(({ count }) => setCommentCount(count || 0))

                // If comments panel is open, update comments list
                if (showComments) {
                    if (payload.eventType === 'INSERT') {
                        // Fetch the full comment with profile
                        supabase.from('comments').select('*, profiles(username, display_name, avatar_url)').eq('id', payload.new.id).single()
                            .then(({ data }) => {
                                if (data) setComments(prev => [...prev, data])
                            })
                    } else if (payload.eventType === 'DELETE') {
                        setComments(prev => prev.filter(c => c.id !== payload.old.id))
                    }
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(likesChannel)
            supabase.removeChannel(commentsChannel)
        }
    }, [post.id, user, showComments])

    const handleDelete = async () => {
        if (!confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) return

        const { error } = await supabase.from('posts').delete().eq('id', post.id)
        if (error) {
            alert('Silme işlemi başarısız oldu')
        }
    }

    const handleLike = async () => {
        if (!user) return

        const isLiking = !liked
        setLiked(isLiking)
        setLikesCount(prev => isLiking ? prev + 1 : prev - 1)

        try {
            if (isLiking) {
                await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
            } else {
                await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id })
            }
        } catch (error) {
            console.error(error)
            setLiked(!isLiking)
            setLikesCount(prev => !isLiking ? prev + 1 : prev - 1)
        }
    }

    const toggleComments = async () => {
        const nextState = !showComments
        if (nextState && comments.length === 0) {
            try {
                // Fetch comments when opening
                const { data, error } = await supabase
                    .from('comments')
                    .select('*, profiles(username, display_name, avatar_url)')
                    .eq('post_id', post.id)
                    .order('created_at', { ascending: true })

                if (error) {
                    console.error('Yorumlar yüklenirken hata oluştu:', error)
                } else if (data) {
                    setComments(data)
                }
            } catch (err) {
                console.error('Yorum toggle hatası:', err)
            }
        }
        setShowComments(nextState)
    }

    const handleSendComment = async () => {
        if (!newComment.trim() || !user) return

        const commentText = newComment // Store content before clearing
        setNewComment('') // Clear input immediately for better UX

        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: post.id,
                    user_id: user.id,
                    content: commentText
                })
                .select('*, profiles(username, display_name, avatar_url)')
                .single()

            if (error) throw error

            setComments(prev => [...prev, data])
            setCommentCount(prev => prev + 1)

            // Check for @gtatweet mention to trigger auto-reply
            if (commentText.toLowerCase().includes('@gtatweet')) {
                try {
                    const response = await fetch('/api/grok', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            postId: post.id,
                            content: commentText,
                            replyToUsername: user.user_metadata?.username
                        })
                    })
                    const aiData = await response.json()
                    if (aiData.comment) {
                        setComments(prev => [...prev, aiData.comment])
                        setCommentCount(prev => prev + 1)
                    }
                } catch (err) {
                    console.error('Auto-Grok Comment Error:', err)
                }
            }

        } catch (error) {
            console.error('Error sending comment:', error)
            alert('Yorum gönderilemedi')
            setNewComment(commentText) // Restore comment if error
        }
    }

    const handleShare = () => {
        const url = `${window.location.origin}/post/${post.id}` // Hypothetical URL, effectively just copies generic link for now
        navigator.clipboard.writeText(url).then(() => {
            alert('Link kopyalandı!')
        })
    }

    return (
        <article className="border-b border-gray-200 dark:border-gray-800 p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer">
            <div className="flex gap-3 md:gap-4">
                <Link href={`/user/${post.profiles.username}`} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center hover:opacity-80 transition-opacity border border-gray-100 dark:border-gray-800" style={{ backgroundImage: post.profiles.avatar_url ? `url(${post.profiles.avatar_url})` : undefined }} />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-1.5 items-center flex-wrap min-w-0">
                            <Link href={`/user/${post.profiles.username}`} className="font-bold hover:underline truncate max-w-[120px] md:max-w-none text-[15px] md:text-base" onClick={(e) => e.stopPropagation()}>
                                {post.profiles.display_name || post.profiles.username}
                            </Link>
                            {post.profiles.username === 'gtatweet_ai' && (
                                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                                    AI
                                </span>
                            )}
                            <Link href={`/user/${post.profiles.username}`} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 truncate max-w-[80px] md:max-w-none text-sm" onClick={(e) => e.stopPropagation()}>
                                @{post.profiles.username}
                            </Link>
                            <span className="text-gray-500 text-xs">·</span>
                            <span className="text-gray-500 text-xs md:text-sm hover:underline whitespace-nowrap">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                            </span>
                        </div>
                        {isOwner && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete()
                                }}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Sil"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                    <p className="mt-1 md:mt-2 text-[15px] md:text-[16px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-normal">
                        {post.content}
                    </p>
                    {(post as any).image_url && (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                            <div className="max-w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-sm">
                                <img
                                    src={(post as any).image_url}
                                    alt="Post media"
                                    className="max-h-[400px] md:max-h-[500px] w-full h-auto object-contain mx-auto"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-3 md:mt-4 text-gray-500 max-w-md -ml-2">
                        <button
                            onClick={() => toggleComments()}
                            className="flex items-center gap-1 group transition-colors p-2 rounded-full hover:bg-blue-500/10 hover:text-blue-500 active:scale-95"
                            title="Yorum Yap"
                        >
                            <MessageCircle size={18} className="md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm">{commentCount > 0 ? commentCount : ''}</span>
                        </button>
                        <button className="flex items-center gap-1 group transition-colors p-2 rounded-full hover:bg-green-500/10 hover:text-green-500 active:scale-95" title="Retweet">
                            <Repeat2 size={18} className="md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm"></span>
                        </button>
                        <button onClick={handleLike} className={`flex items-center gap-1 group transition-colors p-2 rounded-full hover:bg-pink-600/10 active:scale-95 ${liked ? 'text-pink-600' : 'hover:text-pink-600'}`} title="Beğen">
                            <Heart size={18} className="md:w-5 md:h-5" fill={liked ? "currentColor" : "none"} />
                            <span className="text-xs md:text-sm">{likesCount > 0 ? likesCount : ''}</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1 group transition-colors p-2 rounded-full hover:bg-blue-500/10 hover:text-blue-500 active:scale-95"
                            title="Paylaş / Linki Kopyala"
                        >
                            <Share size={18} className="md:w-5 md:h-5" />
                        </button>
                        <GrokButton
                            postId={post.id}
                            content={post.content}
                            onAiCommentAdded={(aiComment) => {
                                setComments(prev => [...prev, aiComment])
                                setCommentCount(prev => prev + 1)
                                if (!showComments) setShowComments(true)
                            }}
                        />
                    </div>

                    {showComments && (
                        <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4" onClick={(e) => e.stopPropagation()}>
                            {/* Cancel click propagation so clicking comment doesn't trigger card navigation */}
                            <div className="space-y-4 mb-4 min-h-[20px]">
                                {comments.length === 0 ? (
                                    <p className="text-gray-500 text-sm italic text-center py-2">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: comment.profiles.avatar_url ? `url(${comment.profiles.avatar_url})` : undefined }} />
                                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl rounded-tl-none flex-1 relative">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm">{comment.profiles.display_name}</span>
                                                        {comment.profiles.username === 'gtatweet_ai' && (
                                                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[8px] px-1 py-0.5 rounded-full font-black uppercase tracking-wider">
                                                                AI
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.created_at), { locale: tr })}</span>
                                                    </div>
                                                    {user?.id === comment.user_id && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Yorumu silmek istediğinize emin misiniz?')) return

                                                                const { error } = await supabase.from('comments').delete().eq('id', comment.id)
                                                                if (error) {
                                                                    alert('Yorum silinemedi')
                                                                } else {
                                                                    setComments(prev => prev.filter(c => c.id !== comment.id))
                                                                    setCommentCount(prev => prev - 1)
                                                                }
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Yorumu sil"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm mt-1 text-gray-800 dark:text-gray-200">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {user && (
                                <div className="flex gap-2 relative">
                                    <input
                                        ref={commentInputRef}
                                        value={newComment}
                                        onChange={handleCommentChange}
                                        placeholder="Yanıtını gönder"
                                        className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={handleCommentKeyDown}
                                    />
                                    {showMentions && (
                                        <div className="absolute bottom-full left-0 mb-2 w-full">
                                            <UserSelector
                                                users={suggestedUsers}
                                                onSelect={selectMention}
                                                onClose={() => setShowMentions(false)}
                                                selectedIndex={mentionIndex}
                                                setSelectedIndex={setMentionIndex}
                                            />
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSendComment}
                                        disabled={!newComment.trim()}
                                        className="text-blue-500 disabled:opacity-50 font-bold text-sm"
                                    >
                                        Gönder
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    )
}
