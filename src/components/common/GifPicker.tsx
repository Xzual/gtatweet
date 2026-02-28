'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'

// Dummy GIFs for demonstration since we don't have a real API key provided.
// In a real app, this would fetch from Giphy/Tenor API.
const DUMMY_GIFS = [
    'https://media.giphy.com/media/WbDhQjgBrpUuk/giphy.gif',
    'https://media.giphy.com/media/popS2teb3iKUE/giphy.gif',
    'https://media.giphy.com/media/VbYj3EzX2T5f5W8d6O/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDU1NjFqYnh1NWY1eHd5eWJ5eTV4MmVvdG01YnR3bzM1ZHg4ZnNsayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/0Wzkc9iirQ4ZI7JoaD/giphy.gif',
    'https://media.giphy.com/media/3oFzmbgb4NNsjKjBhm/giphy.gif',
    'https://media.giphy.com/media/6uMqzcbWRhoT6/giphy.gif',
    'https://media.giphy.com/media/JshL4uZk1tZt5W0TWV/giphy.gif',
    'https://media.giphy.com/media/z1bE45A1GsyT6/giphy.gif',
    'https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif'
]

interface GifPickerProps {
    onSelect: (gifUrl: string) => void
    onClose: () => void
}

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
    const [query, setQuery] = useState('')

    // Simple filter for the dummy list (normally this hits an API)
    const gifs = DUMMY_GIFS

    return (
        <div className="absolute z-50 mt-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-72 md:w-80 overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm z-10">
                <span className="font-bold text-sm">GIF Seç</span>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="p-3 pb-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="GIF Ara (Demo)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-accent outline-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 custom-scrollbar">
                {gifs.map((url, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(url)}
                        className="rounded-xl overflow-hidden aspect-video bg-gray-100 dark:bg-gray-800 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        <img src={url} alt="GIF" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    )
}
