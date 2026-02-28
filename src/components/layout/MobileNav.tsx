'use client'

import Link from 'next/link'
import { Home, Search, User, LogOut, Bookmark, Mail, Bell, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { usePathname } from 'next/navigation'

export function MobileNav() {
    const { user, signOut } = useAuth()
    const { unreadCount } = useNotifications()
    const pathname = usePathname()

    if (!user) return null

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-[9999] flex justify-around items-center px-1 py-2 pb-safe min-h-[70px] shadow-[0_-4px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
            <Link href="/" className={`p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-90 ${pathname === '/' ? 'text-accent' : 'text-gray-500'}`}>
                <Home size={24} strokeWidth={pathname === '/' ? 3 : 2} />
            </Link>

            <Link href="/search" className={`p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-90 ${pathname === '/search' ? 'text-accent' : 'text-gray-500'}`}>
                <Search size={24} strokeWidth={pathname === '/search' ? 3 : 2} />
            </Link>

            <Link href="/bookmarks" className={`p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-90 ${pathname === '/bookmarks' ? 'text-accent' : 'text-gray-500'}`}>
                <Bookmark size={24} strokeWidth={pathname === '/bookmarks' ? 3 : 2} />
            </Link>

            <Link href="/notifications" className={`p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-90 relative ${pathname === '/notifications' ? 'text-accent' : 'text-gray-500'}`}>
                <div className="relative">
                    <Bell size={24} strokeWidth={pathname === '/notifications' ? 3 : 2} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </Link>

            <Link href="/messages" className={`p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-90 ${pathname === '/messages' ? 'text-accent' : 'text-gray-500'}`}>
                <Mail size={24} strokeWidth={pathname === '/messages' ? 3 : 2} />
            </Link>

            <Link href="/crews" className={`p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-90 ${pathname === '/crews' ? 'text-accent' : 'text-gray-500'}`}>
                <Users size={24} strokeWidth={pathname === '/crews' ? 3 : 2} />
            </Link>

            <Link href={`/user/${user.user_metadata?.username || 'me'}`} className={`p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-90 ${pathname.startsWith('/user/') ? 'text-accent' : 'text-gray-500'}`}>
                <User size={24} strokeWidth={pathname.startsWith('/user/') ? 3 : 2} />
            </Link>

            <button onClick={signOut} className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 active:scale-90">
                <LogOut size={24} />
            </button>
        </div>
    )
}
