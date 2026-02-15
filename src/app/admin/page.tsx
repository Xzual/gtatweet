"use client"

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editing, setEditing] = useState<{ id: string, content: string } | null>(null)
  const [query, setQuery] = useState('')
  // AI settings removed
  const [tab, setTab] = useState<'posts' | 'users' | 'ai'>('posts')

  useEffect(() => { fetchAll() }, [])

  // access control: only admin UID or admin email can use admin UI
  const isAdmin = !!(user && (user.id === 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5' || user.email === 'arda.yorulmazel9@gmail.com'))

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const p = await fetch('/api/admin/profiles')
      const pp = await p.json()
      setProfiles(pp.profiles || [])

      const r = await fetch('/api/admin/posts')
      const rr = await r.json()
      setPosts(rr.posts || [])

      // AI settings removed
    } catch (err) {
      console.error(err)
    } finally { setIsLoading(false) }
  }

  const removePost = async (id: string) => {
    if (!confirm('Bu gönderiyi silmek istediğine emin misin?')) return
    await fetch('/api/admin/posts', { method: 'DELETE', body: JSON.stringify({ postId: id }), headers: { 'Content-Type': 'application/json' } })
    fetchAll()
  }

  const saveEdit = async () => {
    if (!editing) return
    await fetch('/api/admin/posts', { method: 'PATCH', body: JSON.stringify({ postId: editing.id, content: editing.content }), headers: { 'Content-Type': 'application/json' } })
    setEditing(null)
    fetchAll()
  }

  // AI settings removed

  const filteredProfiles = useMemo(() => profiles.filter(p => (p.username || '').toLowerCase().includes(query.toLowerCase()) || (p.display_name || '').toLowerCase().includes(query.toLowerCase())), [profiles, query])
  const filteredPosts = useMemo(() => posts.filter(p => (p.content || '').toLowerCase().includes(query.toLowerCase())), [posts, query])

  if (!loading && !isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Erişim yasaklandı</h1>
        <p className="mt-3">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ara (kullanıcı adı veya gönderi)" className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800" />
          <Link href="/" className="text-sm text-blue-600">Siteye Dön</Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 font-semibold ${tab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Kullanıcılar
        </button>
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-2 font-semibold ${tab === 'posts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Gönderiler
        </button>
        <button
          onClick={() => setTab('ai')}
          className={`px-4 py-2 font-semibold ${tab === 'ai' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          🤖 AI Ayarları
        </button>
      </div>

      {/* Kullanıcılar Tab */}
      {tab === 'users' && (
        <div className="p-4 bg-white dark:bg-gray-900 border rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Kullanıcılar</h2>
          <div className="space-y-2">
            {filteredProfiles.length === 0 && <div className="text-sm text-gray-500">Hiç kullanıcı bulunamadı.</div>}
            {filteredProfiles.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 border rounded">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  {p.avatar_url ? <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500">{(p.username || 'U').charAt(0).toUpperCase()}</div>}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{p.display_name || p.username}</div>
                  <div className="text-xs text-gray-500">{p.username} • {p.id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gönderiler Tab */}
      {tab === 'posts' && (
        <div className="p-4 bg-white dark:bg-gray-900 border rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Gönderiler</h2>
          <div className="space-y-3">
            {filteredPosts.length === 0 && <div className="text-sm text-gray-500">Gönderi bulunamadı.</div>}
            {filteredPosts.map(post => (
              <div key={post.id} className="p-4 border rounded flex gap-4 items-start">
                <div className="flex-1">
                  <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
                  <div className="mt-2 text-sm leading-relaxed">{post.content}</div>
                  {post.image_url && (
                    <div className="mt-3">
                      <img src={post.image_url} alt="post media" className="max-h-60 w-full object-contain rounded" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => setEditing({ id: post.id, content: post.content })} className="px-3 py-1 bg-yellow-500 text-white rounded">Düzenle</button>
                  <button onClick={() => removePost(post.id)} className="px-3 py-1 bg-red-600 text-white rounded">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI settings removed from admin UI */}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white dark:bg-gray-900 p-4 rounded w-full max-w-2xl">
            <h3 className="font-semibold mb-2">Gönderi Düzenle</h3>
            <textarea className="w-full p-2 border rounded min-h-[120px]" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-1">İptal</button>
              <button onClick={saveEdit} className="px-3 py-1 bg-accent text-white rounded">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
