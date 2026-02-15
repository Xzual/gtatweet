import React, { useEffect, useState } from 'react'
import { VerifiedBadge } from '../common/VerifiedBadge'

export default function ViewsModal({ postId, open, onClose }: { postId: string, open: boolean, onClose: () => void }) {
  const [viewers, setViewers] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/posts/views?postId=${postId}&full=1`)
      .then(r => r.json())
      .then(data => {
        setCount(data.count || 0)
        setViewers(data.viewers || [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [open, postId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 p-4 rounded w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Görüntüleyenler · {count}</h3>
          <button onClick={onClose} className="text-sm px-2 py-1">Kapat</button>
        </div>
        <div className="space-y-3 max-h-80 overflow-auto pr-2">
          {loading && <div className="text-sm text-gray-500">Yükleniyor...</div>}
          {!loading && viewers.length === 0 && <div className="text-sm text-gray-500">Henüz kimse görmedi.</div>}
          {viewers.map((v: any) => (
            <div key={v.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center" style={{ backgroundImage: v.avatar_url ? `url(${v.avatar_url})` : undefined }} />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {v.display_name || v.username}
                  <VerifiedBadge size={12} />
                </div>
                <div className="text-xs text-gray-500">@{v.username}</div>
              </div>
              <div className="text-xs text-gray-500">{v.seen_at ? new Date(v.seen_at).toLocaleString() : ''}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
