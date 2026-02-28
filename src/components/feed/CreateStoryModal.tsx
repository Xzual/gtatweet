'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { X, Image as ImageIcon, Type, Camera } from 'lucide-react'

export function CreateStoryModal({ onClose }: { onClose: () => void }) {
    const { user } = useAuth()
    const [mode, setMode] = useState<'select' | 'text' | 'image' | 'uploading'>('select')
    const [content, setContent] = useState('')
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [mediaUrl, setMediaUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setMediaFile(file)
            setMediaUrl(URL.createObjectURL(file))
            setMode('image')
        }
    }

    const handlePostStory = async () => {
        if (!user || (!content.trim() && !mediaFile)) return

        setMode('uploading')
        try {
            let uploadedMediaUrl = null

            if (mediaFile) {
                const fileExt = mediaFile.name.split('.').pop()
                const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('post-images') // Reusing same bucket for simplicity
                    .upload(`stories/${fileName}`, mediaFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(`stories/${fileName}`)

                uploadedMediaUrl = publicUrl
            }

            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

            const { error } = await supabase.from('stories').insert({
                user_id: user.id,
                content: content.trim() || null,
                media_url: uploadedMediaUrl,
                expires_at: expiresAt
            })

            if (error) throw error

            onClose()
        } catch (error) {
            console.error('Error posting story:', error)
            alert('Hikaye paylaşılamadı.')
            setMode(mediaFile ? 'image' : 'text')
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-0">
            <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors">
                <X size={24} />
            </button>

            <div className="w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-3xl overflow-hidden relative flex flex-col justify-center items-center">

                {mode === 'select' && (
                    <div className="flex gap-6">
                        <button
                            onClick={() => setMode('text')}
                            className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border-2 border-white/20">
                                <Type size={32} />
                            </div>
                            <span className="font-medium">Metin</span>
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border-2 border-white/20">
                                <ImageIcon size={32} />
                            </div>
                            <span className="font-medium">Medya</span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                            />
                        </button>
                    </div>
                )}

                {mode === 'text' && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 via-pink-600 to-red-500 p-8 flex flex-col justify-center">
                        <textarea
                            autoFocus
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Hikayeni yaz..."
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/50 text-3xl font-bold text-center resize-none outline-none"
                            maxLength={100}
                        />
                    </div>
                )}

                {mode === 'image' && mediaUrl && (
                    <div className="absolute inset-0 bg-black">
                        <img src={mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 p-4 bg-black/40">
                            <input
                                autoFocus
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Açıklama ekle..."
                                className="w-full bg-transparent border-none text-white placeholder-white/70 text-center font-medium focus:ring-0 outline-none"
                                maxLength={100}
                            />
                        </div>
                    </div>
                )}

                {mode === 'uploading' && (
                    <div className="flex flex-col items-center gap-4 text-white">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="font-medium">Gönderiliyor...</span>
                    </div>
                )}

                {(mode === 'text' || mode === 'image') && (
                    <button
                        onClick={handlePostStory}
                        disabled={!content.trim() && !mediaFile}
                        className="absolute bottom-8 px-8 py-3 bg-white text-black font-bold rounded-full disabled:opacity-50 hover:scale-105 transition-transform"
                    >
                        Paylaş
                    </button>
                )}
            </div>
        </div>
    )
}
