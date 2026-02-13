'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState, useRef } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSearchParams } from 'next/navigation'
import { Send, ChevronLeft, MoreVertical, Search, User, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

function MessagesContent() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const targetUserId = searchParams.get('user')

    const [conversations, setConversations] = useState<any[]>([])
    const [selectedConversation, setSelectedConversation] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

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
        }
    }, [user, targetUserId])

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

        if (data) setMessages(data)
    }

    const handleStartConversation = async (otherUserId: string) => {
        if (!user) return
        const ids = [user.id, otherUserId].sort()

        let { data: existing } = await supabase
            .from('conversations')
            .select('*, user1:user1_id(id, username, display_name, avatar_url), user2:user2_id(id, username, display_name, avatar_url)')
            .eq('user1_id', ids[0])
            .eq('user2_id', ids[1])
            .single()

        if (!existing) {
            const { data: created } = await supabase
                .from('conversations')
                .insert({ user1_id: ids[0], user2_id: ids[1] })
                .select('*, user1:user1_id(id, username, display_name, avatar_url), user2:user2_id(id, username, display_name, avatar_url)')
                .single()
            existing = created
        }

        if (existing) {
            setSelectedConversation(existing)
            fetchMessages(existing.id)
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
                content: messageContent
            })

        if (!error) {
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
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full">
                        <MoreVertical size={20} />
                    </button>
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
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-accent text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'}`}>
                                            <p className="text-[15px]">{msg.content}</p>
                                            <div className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black flex gap-2 items-center">
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Yeni bir mesaj başlat"
                                className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-accent text-sm outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-2 bg-accent text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-all active:scale-90 flex-shrink-0"
                            >
                                <Send size={20} />
                            </button>
                        </form>
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
