'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { CreatePost } from '@/components/feed/CreatePost'
import { PostCard } from '@/components/feed/PostCard'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    // Initial fetch
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (data) setPosts(data)
    }

    fetchPosts()

    // Realtime subscription
    console.log('Setting up Realtime subscription for posts...')
    const channel = supabase
      .channel('realtime posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, (payload) => {
        console.log('New post received via Realtime:', payload)
        // Fetch new post with profile data
        const fetchNewPost = async () => {
          const { data, error } = await supabase
            .from('posts')
            .select(`
              *,
              profiles (
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (error) console.error('Error fetching new post details:', error)
          if (data) {
            console.log('New post added to feed:', data)
            setPosts((current) => [data, ...current])
          }
        }
        fetchNewPost()
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'posts'
      }, (payload) => {
        console.log('Post deleted via Realtime:', payload)
        setPosts((current) => current.filter(post => post.id !== payload.old.id))
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const { user } = useAuth()

  if (!user && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center mt-20">
        <h1 className="text-4xl font-bold mb-4">Welcome to GTATweet</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Join our small community to share your thoughts and see what others are saying.
        </p>
        <div className="flex gap-4">
          <Link href="/login" className="px-8 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-colors">
            Login
          </Link>
          <Link href="/register" className="px-8 py-3 border border-gray-300 dark:border-gray-700 rounded-full font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
            Register
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800 z-10">
        <h1 className="text-xl font-bold">Home</h1>
      </header>

      {user && <CreatePost />}

      <div className="flex flex-col">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {!user && posts.length > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-center rounded-lg m-4 border border-blue-100 dark:border-blue-800">
            <p className="font-medium">You are viewing as guest. <Link href="/login" className="text-blue-500 hover:underline">Sign in</Link> to post!</p>
          </div>
        )}
      </div>
    </div>
  )
}
