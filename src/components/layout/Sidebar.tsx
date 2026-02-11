'use client'

import Link from 'next/link'
import { Home, Search, User, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Sidebar() {
    const { user, signOut } = useAuth()

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col items-center md:items-start p-4 bg-white dark:bg-black z-50">
            <div className="mb-8 p-2">
                <h1 className="text-2xl font-bold hidden md:block">GTATweet</h1>
                <span className="md:hidden text-2xl font-bold">G</span>
            </div>

            <nav className="flex-1 space-y-4 w-full">
                <NavLink href="/" icon={<Home size={28} />} label="Anasayfa" />
                <NavLink href="/search" icon={<Search size={28} />} label="Keşfet" />
                {user && <NavLink href={`/user/${user.user_metadata?.username || 'me'}`} icon={<User size={28} />} label="Profil" />}
            </nav>

            {user ? (
                <button
                    onClick={signOut}
                    className="flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 w-full transition-colors text-red-500"
                >
                    <LogOut size={28} />
                    <span className="hidden md:inline text-xl">Çıkış Yap</span>
                </button>
            ) : (
                <div className="space-y-2 w-full">
                    <Link href="/login" className="flex items-center justify-center p-3 rounded-full bg-blue-500 text-white font-bold w-full hover:bg-blue-600 transition-colors">
                        Giriş Yap
                    </Link>
                    <Link href="/register" className="flex items-center justify-center p-3 rounded-full border border-gray-300 dark:border-gray-700 font-bold w-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        Kayıt Ol
                    </Link>
                </div>
            )}

            <div className="mt-auto w-full pt-4">
                <ThemeToggle />
            </div>
        </aside>
    )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href} className="flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 w-full transition-colors">
            {icon}
            <span className="hidden md:inline text-xl">{label}</span>
        </Link>
    )
}
