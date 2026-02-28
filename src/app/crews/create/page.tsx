'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { Image as ImageIcon, ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'

export default function CreateCrewPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState('')
    const [tag, setTag] = useState('')
    const [description, setDescription] = useState('')
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        // Validation
        const cleanTag = tag.trim().toUpperCase()
        if (cleanTag.length < 3 || cleanTag.length > 5) {
            alert('Tag 3 ile 5 karakter arasında olmalıdır.')
            return
        }
        if (!/^[A-Z0-9]+$/.test(cleanTag)) {
            alert('Tag sadece harf ve rakam içerebilir (Örn: GROVE).')
            return
        }

        setIsLoading(true)
        try {
            // Check if tag exists
            const { data: existingTag } = await supabase
                .from('crews')
                .select('id')
                .eq('tag', cleanTag)
                .single()

            if (existingTag) {
                alert('Bu çete tagı zaten kullanılıyor.')
                setIsLoading(false)
                return
            }

            let avatarUrl = null

            // Upload AVATAR
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()
                const fileName = `crew_${cleanTag}_${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName)

                avatarUrl = publicUrl
            }

            // Create Crew
            const { data: crewData, error: crewError } = await supabase
                .from('crews')
                .insert({
                    name: name.trim(),
                    tag: cleanTag,
                    description: description.trim(),
                    owner_id: user.id,
                    avatar_url: avatarUrl
                })
                .select()
                .single()

            if (crewError) throw crewError

            // Add owner as member (Boss role)
            const { error: memberError } = await supabase
                .from('crew_members')
                .insert({
                    crew_id: crewData.id,
                    user_id: user.id,
                    role: 'boss'
                })

            if (memberError) throw memberError

            // Redirect to new crew page
            router.push(`/crews/${cleanTag}`)

        } catch (error) {
            console.error('Error creating crew:', error)
            alert('Çete oluşturulurken bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex-1 border-r border-gray-200 dark:border-gray-800 min-h-screen bg-white dark:bg-black pb-20 md:pb-0">
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4">
                <Link href="/crews" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-black">Yeni Çete Kur</h1>
            </header>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="relative group cursor-pointer">
                        <div
                            className="w-32 h-32 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden bg-cover bg-center"
                            style={{ backgroundImage: avatarPreview ? `url(${avatarPreview})` : undefined }}
                        >
                            {!avatarPreview && <Shield size={48} className="text-gray-400" />}
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon className="text-white mb-1" size={24} />
                                <span className="text-white text-xs font-medium">Logo Yükle</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            id="avatar-upload"
                        />
                        <label htmlFor="avatar-upload" className="absolute inset-0 cursor-pointer"></label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Çete Adı *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-900 border-none focus:ring-2 focus:ring-accent outline-none font-medium"
                            placeholder="Örn: Grove Street Families"
                            maxLength={50}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Çete Tagı (Kısa Kod) *
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono font-bold">[</span>
                            <input
                                type="text"
                                required
                                value={tag}
                                onChange={(e) => setTag(e.target.value.toUpperCase())}
                                className="w-full px-8 py-3 rounded-xl bg-gray-100 dark:bg-gray-900 border-none focus:ring-2 focus:ring-accent outline-none font-mono font-bold text-lg uppercase"
                                placeholder="GROVE"
                                minLength={3}
                                maxLength={5}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono font-bold">]</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">3-5 karakter arası, sadece harf ve rakam (Örn: GROVE, BALL1, VAGOS).</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Açıklama / Kurallar
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-900 border-none focus:ring-2 focus:ring-accent outline-none resize-none h-32"
                            placeholder="Çetenin amacı ne? Kimleri arıyorsunuz?"
                            maxLength={500}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading || !name.trim() || !tag.trim()}
                        className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Kuruluyor...' : 'Çeteyi Kur'}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-3">
                        Çeteyi kurarak otomatik olarak "Boss" (Lider) rolünü alacaksın.
                    </p>
                </div>
            </form>
        </div>
    )
}
