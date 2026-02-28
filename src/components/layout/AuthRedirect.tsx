'use client'

import { useAuth } from "@/context/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export function AuthRedirect({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user) {
            // List of allowed public pages
            const publicPages = ['/login', '/register', '/forgot-password', '/reset-password']
            if (!publicPages.includes(pathname)) {
                router.push('/login')
            }
        }
    }, [user, loading, pathname, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return <>{children}</>
}
