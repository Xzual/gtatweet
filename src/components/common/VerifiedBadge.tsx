'use client'

import { BadgeCheck } from 'lucide-react'

export function VerifiedBadge({ className = "", size = 16 }: { className?: string, size?: number }) {
    return (
        <BadgeCheck
            size={size}
            className={`text-blue-500 fill-blue-500 text-white shrink-0 ${className}`}
            style={{
                // Adding a bit of custom styling to make it look more like Instagram/Twitter badge
                filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.1))'
            }}
        />
    )
}
