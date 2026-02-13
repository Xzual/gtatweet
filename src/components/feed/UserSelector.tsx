'use client'

import { useState, useEffect, useRef } from 'react'
import { MentionUser } from '@/utils/mentions'

interface UserSelectorProps {
    users: MentionUser[]
    onSelect: (user: MentionUser) => void
    onClose: () => void
    selectedIndex: number
    setSelectedIndex: (index: number) => void
    position?: 'top' | 'bottom'
}

export function UserSelector({ users, onSelect, onClose, selectedIndex, setSelectedIndex, position = 'top' }: UserSelectorProps) {
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(event.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    if (users.length === 0) return null

    const positionStyle = position === 'top'
        ? { bottom: '100%', marginBottom: '8px' }
        : { top: '100%', marginTop: '8px' }

    return (
        <div
            ref={listRef}
            className="absolute z-[100] bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden min-w-[200px] max-h-[300px] overflow-y-auto"
            style={{
                left: '0',
                ...positionStyle
            }}
        >
            <div className="p-2 border-b border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/50">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kullanıcı Etiketle</span>
            </div>
            {users.map((user, index) => (
                <div
                    key={user.id}
                    onClick={() => onSelect(user)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                        }`}
                >
                    <div
                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                        style={{ backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : undefined }}
                    />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="font-bold text-sm truncate">{user.display_name || user.username}</span>
                            {user.username === 'gtatweet_ai' && (
                                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[8px] px-1 py-0.5 rounded-full font-black uppercase flex-shrink-0">
                                    AI
                                </span>
                            )}
                        </div>
                        <span className="text-gray-500 text-xs truncate">@{user.username}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
