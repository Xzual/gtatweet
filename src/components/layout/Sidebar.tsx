'use client'

import Link from 'next/link'
import { Home, Search, User, LogOut, Bookmark, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useState } from 'react'
import { BugReportModal } from './BugReportModal'
import { usePathname } from 'next/navigation'

export function Sidebar() {
    const { user, signOut, isAiMode, toggleAiMode } = useAuth()
    const [bugOpen, setBugOpen] = useState(false)

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col items-center md:items-start p-4 bg-white dark:bg-black z-50">
            <div className="mb-8 p-2">
                <h1 className="text-2xl font-bold hidden md:block">GTATweet</h1>
                <span className="md:hidden text-2xl font-bold">G</span>
            </div>

            <nav className="flex-1 space-y-4 w-full">
                <NavLink href="/" icon={<Home size={28} />} label="Anasayfa" />
                <NavLink href="/search" icon={<Search size={28} />} label="Keşfet" />
                {user && <NavLink href="/messages" icon={<Mail size={28} />} label="Mesajlar" />}
                {user && <NavLink href="/bookmarks" icon={<Bookmark size={28} />} label="Yer İşaretleri" />}
                {user && <NavLink href={`/user/${user.user_metadata?.username || 'me'}`} icon={<User size={28} />} label="Profil" />}
            </nav>

            {user ? (
                <>
                    <button
                        onClick={signOut}
                        className="flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 w-full transition-colors text-red-500"
                    >
                        <LogOut size={28} />
                        <span className="hidden md:inline text-xl">Çıkış Yap</span>
                    </button>
                    {user?.id === 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5' || user?.email === 'arda.yorulmazel9@gmail.com' ? (
                        <div className="mt-4 w-full space-y-2">
                            <button onClick={toggleAiMode} className={`w-full flex items-center justify-center gap-2 ${isAiMode ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-gray-800 text-white'} font-bold py-3 rounded-full`}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                                <span className="hidden lg:inline">{isAiMode ? 'AI Modu Aktif' : 'AI Erişimi'}</span>
                            </button>

                            <Link href="/admin" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold py-3 rounded-full hover:opacity-95">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 2v4M6.8 5.2l2.8 2.8M3 12h4M6.8 18.8l2.8-2.8M12 20v-4M17.2 18.8l-2.8-2.8M21 12h-4M17.2 5.2l-2.8 2.8" /></svg>
                                <span className="hidden lg:inline">Admin</span>
                            </Link>
                        </div>
                    ) : null}
                    <div className="mt-4 w-full">
                        <button onClick={() => setBugOpen(true)} className="w-full flex items-center justify-center gap-2 bg-white/0 border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 2v4M6.8 5.2l2.8 2.8M3 12h4M6.8 18.8l2.8-2.8M12 20v-4M17.2 18.8l-2.8-2.8M21 12h-4M17.2 5.2l-2.8 2.8" /></svg>
                            <span className="hidden lg:inline">Hata Bildir</span>
                        </button>
                    </div>
                    <BugReportModal open={bugOpen} onClose={() => setBugOpen(false)} />
                </>
            ) : (
                <div className="space-y-2 w-full">
                    <Link href="/login" className="flex items-center justify-center p-3 rounded-full bg-accent text-white font-bold w-full hover:opacity-90 transition-colors">
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

const NavLink = ({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) => {
    const pathname = usePathname()
    const isActive = pathname === href
    return (
        <Link
            href={href}
            className={`flex items-center gap-4 p-3 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-900 group active:scale-95 ${isActive ? 'font-bold text-accent' : 'text-gray-700 dark:text-gray-300'}`}
        >
            <div className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                {icon}
            </div>
            <span className="text-xl hidden lg:block">{label}</span>
        </Link>
    )
}
