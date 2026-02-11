'use client'

import { useState, useRef, useEffect } from 'react'
import { Image, Send, Smile, Calendar, MapPin, AlignLeft } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'

export function CreatePost() {
    const { user } = useAuth()
    const [content, setContent] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    // Fetch fresh profile data to ensure avatar is up to date
    useEffect(() => {
        if (user) {
            supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data?.avatar_url) setAvatarUrl(data.avatar_url)
                })
        }
    }, [user])

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handlePost = async () => {
        if ((!content.trim() && !imageFile) || !user) return

        setIsPosting(true)
        try {
            let imageUrl = null

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${user.id}-${Math.random()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(filePath, imageFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(filePath)

                imageUrl = publicUrl
            }

            const { error } = await supabase.from('posts').insert({
                user_id: user.id,
                content,
                image_url: imageUrl
            })

            if (error) throw error

            // Reset state
            setContent('')
            setImageFile(null)
            setPreviewUrl(null)
        } catch (error) {
            console.error('Error posting:', error)
            alert('Gönderi paylaşılırken hata oluştu')
        } finally {
            setIsPosting(false)
        }
    }

    if (!user) return null

    return (
        <div className="border-b border-gray-200 dark:border-gray-800 p-3 md:p-4">
            <div className="flex gap-3 md:gap-4">
                <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 bg-cover bg-center overflow-hidden border border-gray-100 dark:border-gray-800"
                    style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined }}
                >
                    {!avatarUrl && (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200 dark:bg-gray-700">
                            <div className="w-full h-full bg-gray-300 dark:bg-gray-600" />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Neler oluyor?!"
                        className="w-full bg-transparent border-none focus:ring-0 text-lg md:text-xl resize-none min-h-[50px] placeholder-gray-500 text-gray-900 dark:text-white outline-none"
                        maxLength={280}
                    />

                    {previewUrl && (
                        <div className="relative mt-2 mb-4">
                            <img src={previewUrl} alt="Preview" className="rounded-2xl max-h-60 md:max-h-80 w-auto object-cover border border-gray-200 dark:border-gray-800 shadow-sm" />
                            <button
                                onClick={() => {
                                    setImageFile(null)
                                    setPreviewUrl(null)
                                    if (fileInputRef.current) fileInputRef.current.value = ''
                                }}
                                className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors backdrop-blur-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    )}

                    {content.length > 0 && (
                        <div className="border-b border-gray-100 dark:border-gray-900 pb-2 mb-2">
                            <span className={`text-[10px] md:text-xs font-medium ${content.length > 260 ? 'text-red-500' : 'text-blue-500'}`}>{280 - content.length} characters left</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-1 md:mt-2">
                        <div className="flex gap-0 text-blue-500">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-90"
                                title="Medya"
                            >
                                <Image size={20} className="md:w-[22px] md:h-[22px]" />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                            </button>
                        </div>
                        <button
                            onClick={handlePost}
                            disabled={isPosting || (!content.trim() && !imageFile)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-4 md:py-2 md:px-5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 text-sm md:text-base"
                        >
                            {isPosting ? 'Paylaşılıyor...' : 'Gönder'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
