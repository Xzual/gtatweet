import React, { useEffect, useState } from 'react'
import ViewsModal from './ViewsModal'
import { Eye } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function SeenIndicator({ postId }: { postId: string }) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [preview, setPreview] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const fetchPreview = async () => {
    try {
      const res = await fetch(`/api/posts/views?postId=${postId}&limit=3`)
      const data = await res.json()
      setCount(data.count || 0)
      setPreview(data.preview || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchPreview() }, [postId])

  useEffect(() => {
    const handler = (e: any) => {
      try {
        if (e?.detail?.postId === postId) fetchPreview()
      } catch (err) { }
    }
    window.addEventListener('postViewRecorded', handler as EventListener)
    return () => window.removeEventListener('postViewRecorded', handler as EventListener)
  }, [postId])

  const openModal = async () => {
    // record view for current user when opening
    if (user?.id) {
      try {
        await fetch('/api/posts/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, userId: user.id }) })
      } catch (err) {
        console.error('record view error', err)
      }
    }
    setOpen(true)
    // refresh preview after recording
    setTimeout(fetchPreview, 400)
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={(e) => { e.stopPropagation(); openModal() }} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors" title="Görüldü">
        <Eye size={16} />
        <span className="text-xs md:text-sm">{count > 0 ? count : ''}</span>
      </button>
      <div className="flex -space-x-2">
        {preview.map(p => (
          <div key={p.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200" style={{ backgroundImage: p.avatar_url ? `url(${p.avatar_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ))}
      </div>
      <ViewsModal postId={postId} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
