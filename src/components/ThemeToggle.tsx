'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')

    useEffect(() => {
        // Check localStorage or default
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
        if (savedTheme) {
            setTheme(savedTheme)
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        } else {
            // Default to dark
            setTheme('dark')
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center gap-4 w-full"
        >
            {theme === 'dark' ? <Moon size={28} /> : <Sun size={28} />}
            <span className="hidden md:inline text-xl">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
        </button>
    )
}
