'use client'

import Link from 'next/link'
import { Home, Search, User, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePathname } from 'next/navigation'

export function MobileNav() {
    const { user, signOut } = useAuth()
    const pathname = usePathname()

    if (!user) return null

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-50 flex justify-around items-center p-4 pb-6">
            <Link href="/" className={`p-2 rounded-full transition-colors ${pathname === '/' ? 'text-black dark:text-white' : 'text-gray-500'}`}>
                <Home size={28} strokeWidth={pathname === '/' ? 3 : 2} />
            </Link>

            <Link href="/search" className={`p-2 rounded-full transition-colors ${pathname === '/search' ? 'text-black dark:text-white' : 'text-gray-500'}`}>
                <Search size={28} strokeWidth={pathname === '/search' ? 3 : 2} />
            </Link>

            <Link href={`/user/${user.user_metadata?.username || 'me'}`} className={`p-2 rounded-full transition-colors ${pathname.startsWith('/user/') ? 'text-black dark:text-white' : 'text-gray-500'}`}>
                <User size={28} strokeWidth={pathname.startsWith('/user/') ? 3 : 2} />
            </Link>

            <button onClick={signOut} className="p-2 rounded-full text-red-500">
                <LogOut size={28} />
            </button>
        </div>
    )
}
