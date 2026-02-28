'use client'

import { useNotifications } from '@/context/NotificationContext'
import { useAuth } from '@/context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { Heart, MessageCircle, Repeat2, UserPlus, Zap } from 'lucide-react'
import { useEffect } from 'react'

export default function NotificationsPage() {
    const { user } = useAuth()
    const { notifications, markAllAsRead, markAsRead } = useNotifications()

    useEffect(() => {
        // Build sırasında sunucu tarafında çalışmamasını sağlar
        if (user) {
            markAllAsRead()
        }
    }, [user, markAllAsRead])

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500">Bildirimleri görmek için giriş yapmalısınız.</p>
            </div>
        )
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart className="text-pink-600 fill-pink-600" size={24} />
            case 'reply': return <MessageCircle className="text-blue-500 fill-blue-500" size={24} />
            case 'retweet': return <Repeat2 className="text-green-500" size={24} />
            case 'follow': return <UserPlus className="text-blue-500 fill-blue-500" size={24} />
            case 'bounty': return <Zap className="text-yellow-500 fill-yellow-500" size={24} />
            default: return <Zap className="text-gray-500" size={24} />
        }
    }

    const getNotificationMessage = (type: string) => {
        switch (type) {
            case 'like': return 'bir gönderini beğendi.'
            case 'reply': return 'bir gönderine yanıt verdi.'
            case 'retweet': return 'bir gönderini retweetledi.'
            case 'follow': return 'seni takip etmeye başladı.'
            case 'bounty': return 'sana ödül gönderdi.'
            default: return 'sana bir bildirim gönderdi.'
        }
    }

    const getNotificationLink = (notification: any) => {
        if (notification.type === 'follow') {
            return `/user/${notification.actor?.username}`
        }
        if (notification.post_id) {
            // Tam bir sayfaya gitmesini isteyebiliriz ama şimdilik ana sayfaya veya user profiline
            // Eğer post detay sayfası varsa oraya yönlendir, yoksa profiline
            return `/` // Şimdilik anasayfa
        }
        return '#'
    }

    return (
        <div className="flex-1 w-[100vw] md:w-full min-h-screen pb-20 md:pb-0 overflow-x-hidden pt-10 px-4">
            <div className="max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Bildirimler
                    </h1>
                </div>

                <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-800/50 shadow-sm overflow-hidden">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>Henüz hiç bildirimin yok.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={getNotificationLink(notification)}
                                    // onClick={() => { if (!notification.is_read) markAsRead(notification.id) }} // Zaten markAllAsRead dedik
                                    className={`flex items-start gap-4 p-4 md:p-5 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="w-10 flex justify-center mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        {notification.actor && (
                                            <div className="flex items-center gap-2 mb-1">
                                                {/* İkon boyutunda küçük avatar */}
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center" style={{ backgroundImage: `url(${notification.actor.avatar_url || ''})` }} />
                                            </div>
                                        )}
                                        <p className="text-[15px] text-gray-900 dark:text-gray-100 mt-2">
                                            <span className="font-bold cursor-pointer hover:underline">
                                                {notification.actor?.display_name || notification.actor?.username}
                                            </span>{' '}
                                            {getNotificationMessage(notification.type)}
                                        </p>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: tr })}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
