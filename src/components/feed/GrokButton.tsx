'use client'

import { useState } from 'react'
import { Brain, Sparkles } from 'lucide-react'

interface GrokButtonProps {
    postId: string
    content: string
    onAiCommentAdded: (comment: any) => void
}

export function GrokButton({ postId, content, onAiCommentAdded }: GrokButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isUsed, setIsUsed] = useState(false)

    const handleGrokCall = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isLoading || isUsed) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/grok', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, content })
            })

            const data = await response.json()

            if (data.error) {
                alert(data.error)
            } else if (data.comment) {
                onAiCommentAdded(data.comment)
                setIsUsed(true)
            }
        } catch (error) {
            console.error('Grok UI Error:', error)
            alert('Grok şu an bağlantı kuramıyor.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleGrokCall}
            disabled={isLoading || isUsed}
            className={`flex items-center gap-1 group transition-all duration-300 p-2 rounded-full active:scale-95 
                ${isUsed ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/10' :
                    'text-gray-500 hover:bg-purple-500/10 hover:text-purple-500'}`}
            title={isUsed ? "Grok zaten yanıtladı" : "Grok AI ile Yorumla"}
        >
            <div className={`relative ${isLoading ? 'animate-pulse' : ''}`}>
                {isLoading ? (
                    <Sparkles size={18} className="md:w-5 md:h-5 animate-spin text-purple-600" />
                ) : (
                    <Brain size={18} className="md:w-5 md:h-5" fill={isUsed ? "currentColor" : "none"} />
                )}
            </div>
            <span className="text-xs md:text-sm font-medium">
                {isLoading ? 'Grok Düşünüyor...' : isUsed ? 'Grok\'landı' : 'Grok'}
            </span>
        </button>
    )
}
