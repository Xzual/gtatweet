'use client'

import Link from 'next/link'
import { Home, Search, User, LogOut, Bookmark, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { usePathname } from 'next/navigation'

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
                    <div className="mt-4 w-full">
                        <button className="w-full bg-accent hover:opacity-90 text-white font-bold py-3 px-4 rounded-full transition-all duration-200 shadow-lg shadow-accent/20 active:scale-95 text-lg hidden lg:block">
                            Gönder
                        </button>
                        <button className="w-fit mx-auto bg-accent hover:opacity-90 text-white font-bold p-3 rounded-full transition-all duration-200 shadow-lg shadow-accent/20 active:scale-95 lg:hidden flex items-center justify-center">
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 fill-current"><g><path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H14.5V11zM11.5 13h1.5v2h-1.5v-2z"></path></g></svg>
                        </button>
                    </div>
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
