'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState, useRef } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, ChevronLeft, MoreVertical, Search, User, Mail, Timer, Mic, Square, Plus, X } from 'lucide-react'
import { formatDistanceToNow, differenceInSeconds } from 'date-fns'
import { tr } from 'date-fns/locale'

function MessagesContent() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const targetUserId = searchParams.get('user')
    const router = useRouter()

    const [conversations, setConversations] = useState<any[]>([])
    const [selectedConversation, setSelectedConversation] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // New Message Search State
    const [showNewMessageModal, setShowNewMessageModal] = useState(false)
    const [userSearch, setUserSearch] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])

    // Search users for new message
    useEffect(() => {
        if (!userSearch.trim()) {
            setSearchResults([])
            return
        }
        const search = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .ilike('username', `%${userSearch}%`)
                .neq('id', user?.id)
                .limit(5)
            if (data) setSearchResults(data)
        }
        const debounce = setTimeout(search, 300)
        return () => clearTimeout(debounce)
    }, [userSearch, user?.id])

    // Timer state
    const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null)
    const timerOptions = [null, 60, 3600, 86400] // Off, 1m, 1h, 24h
    const [timerIndex, setTimerIndex] = useState(0)

    // Voice recording state
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (!user) return
        fetchConversations()

        // Subscribe to new messages
        const channel = supabase
            .channel('messages_channel')
            .on('postgres_changes' as any, { event: 'INSERT', table: 'messages' }, (payload: any) => {
                if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
                    setMessages(prev => [...prev, payload.new])
                }
                // Refresh conversation list to show last message/update order
                fetchConversations()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, selectedConversation])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Handle target user from URL
    useEffect(() => {
        if (user && targetUserId) {
            handleStartConversation(targetUserId)
            // Optional: remove user param from URL
            router.replace('/messages')
        }
    }, [user, targetUserId, router])

    const fetchConversations = async () => {
        if (!user) return
        const { data, error } = await supabase
            .from('conversations')
            .select('*, user1:user1_id(id, username, display_name, avatar_url), user2:user2_id(id, username, display_name, avatar_url)')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .order('last_message_at', { ascending: false })

        if (data) setConversations(data)
        setLoading(false)
    }

    const fetchMessages = async (convId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true })

        if (data) {
            setMessages(data)

            // Mark unviewed expiring messages as viewed
            const unviewedIds = data
                .filter(m => m.sender_id !== user?.id && m.expires_in_seconds && !m.viewed_at)
                .map(m => m.id)

            if (unviewedIds.length > 0) {
                const now = new Date().toISOString()
                await supabase.from('messages').update({ viewed_at: now }).in('id', unviewedIds)
                setMessages(prev => prev.map(m => unviewedIds.includes(m.id) ? { ...m, viewed_at: now } : m))
            }
        }
    }

    const handleStartConversation = async (otherUserId: string) => {
        if (!user) return
        const ids = [user.id, otherUserId].sort()

        let { data: existing, error: existingError } = await supabase
            .from('conversations')
            .select('*, user1:user1_id(id, username, display_name, avatar_url), user2:user2_id(id, username, display_name, avatar_url)')
            .eq('user1_id', ids[0])
            .eq('user2_id', ids[1])
            .maybeSingle()

        if (existingError) {
            console.error('Error fetching conversation:', existingError)
            alert('Sohbet alınırken hata oluştu: ' + existingError.message)
            return
        }

        if (!existing) {
            const { data: created, error } = await supabase
                .from('conversations')
                .insert({ user1_id: ids[0], user2_id: ids[1] })
                .select('*, user1:user1_id(id, username, display_name, avatar_url), user2:user2_id(id, username, display_name, avatar_url)')
                .single()
            if (error) {
                console.error('Error creating conversation:', error)
                alert('Sohbet oluşturulamadı: ' + error.message)
                return
            }
            existing = created
        }

        if (existing) {
            setSelectedConversation(existing)
            await fetchMessages(existing.id)
            fetchConversations() // update the left sidebar list immediately
        }
    }

    const sendAudioMessage = async (audioBlob: Blob) => {
        if (!user || !selectedConversation) return

        try {
            const fileExt = 'webm'
            const fileName = `voice_${user.id}_${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(`voice/${fileName}`, audioBlob)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('post-images')
                .getPublicUrl(`voice/${fileName}`)

            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: user.id,
                    content: `[AUDIO:${publicUrl}]`,
                    expires_in_seconds: expiresInSeconds
                })

            if (error) throw error

            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', selectedConversation.id)
        } catch (error: any) {
            console.error('Error sending audio message:', error)
            alert('Sesli mesaj gönderilemedi: ' + error.message)
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                sendAudioMessage(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (err) {
            console.error('Mic access denied:', err)
            alert('Mikrofon erişimi reddedildi.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !newMessage.trim() || !selectedConversation) return

        const messageContent = newMessage.trim()
        setNewMessage('')

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: selectedConversation.id,
                sender_id: user.id,
                content: messageContent,
                expires_in_seconds: expiresInSeconds
            })

        if (error) {
            console.error('Error sending message:', error)
            alert('Mesaj gönderilemedi: ' + error.message)
        } else {
            // Update last_message_at
            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', selectedConversation.id)
        }
    }

    if (!user) return null

    const getOtherUser = (conv: any) => {
        return conv.user1_id === user.id ? conv.user2 : conv.user1
    }

    return (
        <div className="flex h-screen max-w-6xl mx-auto border-x border-gray-100 dark:border-gray-800 bg-white dark:bg-black overflow-hidden mt-[-1px]">
            {/* Conversation List */}
            <div className={`w-full md:w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10">
                    <h1 className="text-xl font-bold">Mesajlar</h1>
                    <div className="flex gap-2">
                        <button onClick={() => setShowNewMessageModal(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 text-accent rounded-full transition-colors" title="Yeni Mesaj">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            placeholder="Mesajlarda ara"
                            className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-accent"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-900">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <h2 className="text-xl font-bold mb-2">Hoş geldin!</h2>
                            <p className="text-gray-500 text-sm">Sohbet başlatmak için profillerdeki mesaj butonunu kullan.</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const other = getOtherUser(conv)
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        setSelectedConversation(conv)
                                        fetchMessages(conv.id)
                                    }}
                                    className={`w-full p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left ${selectedConversation?.id === conv.id ? 'bg-accent/5 dark:bg-accent/10 border-r-4 border-accent' : ''}`}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center flex-shrink-0"
                                        style={{ backgroundImage: other?.avatar_url ? `url(${other.avatar_url})` : undefined }}
                                    >
                                        {!other?.avatar_url && <User className="m-auto text-gray-400 h-full w-1/2" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold truncate">{other?.display_name || other?.username}</span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                {formatDistanceToNow(new Date(conv.last_message_at), { locale: tr, addSuffix: false })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate mt-0.5 font-medium">@{other?.username}</p>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-black h-full ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white/80 dark:bg-black/80 backdrop-blur-md">
                            <button onClick={() => setSelectedConversation(null)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full">
                                <ChevronLeft size={24} />
                            </button>
                            <div
                                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                                style={{ backgroundImage: getOtherUser(selectedConversation)?.avatar_url ? `url(${getOtherUser(selectedConversation).avatar_url})` : undefined }}
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold truncate">{getOtherUser(selectedConversation)?.display_name || getOtherUser(selectedConversation)?.username}</h3>
                                <p className="text-xs text-gray-500">@{getOtherUser(selectedConversation)?.username}</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, i) => {
                                const isMe = msg.sender_id === user.id

                                // Check expiration
                                if (msg.expires_in_seconds && msg.viewed_at) {
                                    const diff = differenceInSeconds(new Date(), new Date(msg.viewed_at))
                                    if (diff > msg.expires_in_seconds) {
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 italic text-gray-500 text-sm">
                                                    Bu mesajın süresi doldu.
                                                </div>
                                            </div>
                                        )
                                    }
                                }

                                const isAudio = msg.content.startsWith('[AUDIO:') && msg.content.endsWith(']')
                                const content = isAudio ? msg.content.slice(7, -1) : msg.content

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-accent text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'}`}>
                                            {isAudio ? (
                                                <audio controls src={content} className="h-8 max-w-[200px]" />
                                            ) : (
                                                <p className="text-[15px]">{content}</p>
                                            )}
                                            <div className={`text-[10px] mt-1 flex justify-between items-center ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {msg.expires_in_seconds && (
                                                    <span className="flex items-center gap-1 bg-black/20 px-1.5 rounded-full" title={`${msg.expires_in_seconds}s timer`}>
                                                        <Timer size={10} />
                                                        {msg.expires_in_seconds >= 3600 ? `${msg.expires_in_seconds / 3600}h` : `${msg.expires_in_seconds / 60}m`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black">
                            <form onSubmit={sendMessage} className="flex gap-2 items-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextIndex = (timerIndex + 1) % timerOptions.length
                                        setTimerIndex(nextIndex)
                                        setExpiresInSeconds(timerOptions[nextIndex])
                                    }}
                                    className={`p-2 rounded-full transition-colors ${expiresInSeconds ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                    title={`Kaybolan Mesaj Zamanlayıcısı: ${expiresInSeconds ? (expiresInSeconds >= 3600 ? `${expiresInSeconds / 3600} saat` : `${expiresInSeconds / 60} dakika`) : 'Kapalı'}`}
                                >
                                    <Timer size={20} />
                                    {expiresInSeconds && <span className="absolute text-[8px] font-bold bottom-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">{expiresInSeconds >= 3600 ? `${expiresInSeconds / 3600}h` : `${expiresInSeconds / 60}m`}</span>}
                                </button>

                                {isRecording ? (
                                    <div className="flex-1 flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2">
                                        <div className="flex items-center gap-2 text-red-500 animate-pulse">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <span className="text-sm font-medium font-mono">
                                                {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                        <span className="text-sm text-red-500 font-medium">Kaydediliyor...</span>
                                    </div>
                                ) : (
                                    <input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Yeni bir mesaj başlat"
                                        className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-accent text-sm outline-none"
                                    />
                                )}

                                {newMessage.trim() ? (
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-2 bg-accent text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-all active:scale-90 flex-shrink-0"
                                    >
                                        <Send size={20} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onPointerDown={startRecording}
                                        onPointerUp={stopRecording}
                                        onPointerLeave={stopRecording}
                                        className={`p-2 rounded-full transition-all active:scale-90 flex-shrink-0 ${isRecording ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                                        title="Basılı tutarak ses kaydet"
                                    >
                                        {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
                                    </button>
                                )}
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
                        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                            <Mail size={40} className="text-accent" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Bir mesaj seç</h2>
                        <p className="text-gray-500 max-w-sm">
                            Mevcut konuşmalarından birini seç veya yeni bir sohbete başlamak için profil sayfalarına git.
                        </p>
                    </div>
                )}
            </div>
            {/* New Message Modal */}
            {showNewMessageModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-4 shadow-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Yeni Mesaj</h2>
                            <button onClick={() => setShowNewMessageModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <input
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Kullanıcı ara (@kullaniciadi)..."
                            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-accent mb-4 outline-none"
                            autoFocus
                        />
                        <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                            {userSearch.trim() && searchResults.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">Kullanıcı bulunamadı</div>
                            ) : searchResults.map(res => (
                                <button
                                    key={res.id}
                                    onClick={() => {
                                        setShowNewMessageModal(false)
                                        handleStartConversation(res.id)
                                        setUserSearch('')
                                    }}
                                    className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div
                                        className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                                        style={{ backgroundImage: res.avatar_url ? `url(${res.avatar_url})` : undefined }}
                                    />
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="font-bold truncate">{res.display_name || res.username}</div>
                                        <div className="text-sm text-gray-500 truncate">@{res.username}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Yükleniyor...</div>}>
            <MessagesContent />
        </Suspense>
    )
}
