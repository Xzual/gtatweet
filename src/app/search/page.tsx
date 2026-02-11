'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search as SearchIcon } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'
import { PostCard } from '@/components/feed/PostCard'

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'posts' | 'people'>('posts')
    const [posts, setPosts] = useState<any[]>([])
    const [people, setPeople] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                handleSearch()
            } else {
                setPosts([])
                setPeople([])
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [query])

    const handleSearch = async () => {
        setLoading(true)

        // Search Posts
        const { data: postsData } = await supabase
            .from('posts')
            .select(`
        *,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `)
            .ilike('content', `%${query}%`)
            .order('created_at', { ascending: false })
            .limit(20)

        if (postsData) setPosts(postsData)

        // Search People
        const { data: peopleData } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
            .limit(20)

        if (peopleData) setPeople(peopleData)

        setLoading(false)
    }

    return (
        <div>
            <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md p-2 border-b border-gray-200 dark:border-gray-800 z-10">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <SearchIcon size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="GTATweet'te Ara"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="flex mt-2">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 py-3 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors relative ${activeTab === 'posts' ? 'text-black dark:text-white' : 'text-gray-500'}`}
                    >
                        Gönderiler
                        {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('people')}
                        className={`flex-1 py-3 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors relative ${activeTab === 'people' ? 'text-black dark:text-white' : 'text-gray-500'}`}
                    >
                        Kişiler
                        {activeTab === 'people' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-full" />}
                    </button>
                </div>
            </div>

            <div className="min-h-screen">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Aranıyor...</div>
                ) : (
                    <>
                        {activeTab === 'posts' && (
                            <div>
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                                {posts.length === 0 && query && (
                                    <div className="p-8 text-center text-gray-500">"{query}" için sonuç bulunamadı</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'people' && (
                            <div>
                                {people.map(person => (
                                    <Link href={`/user/${person.username}`} key={person.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-200 dark:border-gray-800">
                                        <div
                                            className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                                            style={{ backgroundImage: person.avatar_url ? `url(${person.avatar_url})` : undefined }}
                                        />
                                        <div>
                                            <div className="font-bold hover:underline">{person.display_name}</div>
                                            <div className="text-gray-500">@{person.username}</div>
                                            {person.bio && <div className="text-gray-500 text-sm line-clamp-1">{person.bio}</div>}
                                        </div>
                                    </Link>
                                ))}
                                {people.length === 0 && query && (
                                    <div className="p-8 text-center text-gray-500">"{query}" için kişi bulunamadı</div>
                                )}
                            </div>
                        )}
                        {!query && (
                            <div className="p-8 text-center text-gray-500">
                                Arama yapmak için bir şeyler yazın
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
