'use client'

import { useState } from 'react'

export function BugReportModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [priority, setPriority] = useState<'acil'|'orta'|'pek-degil'>('orta')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const priorityColor = priority === 'acil' ? 'bg-red-500/20 border-red-500' : priority === 'orta' ? 'bg-yellow-500/10 border-yellow-400' : 'bg-green-500/10 border-green-500'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/report-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority, description, location })
      })
      if (!res.ok) throw new Error(await res.text())
      setSuccess('Bildirim gönderildi — teşekkürler!')
      setDescription('')
      setLocation('')
      setPriority('orta')
    } catch (err: any) {
      setError(err.message || 'Gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-70 w-full max-w-xl p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Site Hata Bildir</h3>
          <button type="button" onClick={onClose} className="text-sm text-gray-500">Kapat</button>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Öncelik</label>
        <div className={`mt-2 mb-4 p-2 rounded border ${priorityColor}`}>
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full bg-transparent">
            <option value="acil">Acil</option>
            <option value="orta">Orta</option>
            <option value="pek-degil">Pek de önemli değil</option>
          </select>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hata Açıklaması</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hatanın ne olduğunu mümkün olduğunca açık yazın..." className="mt-2 mb-4 w-full min-h-[100px] p-3 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hatanın Yeri / URL / Sayfa</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Örn: /user/xyz veya Sayfa başlığı" className="mt-2 mb-4 w-full p-3 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />

        {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
        {success && <div className="text-sm text-green-500 mb-2">{success}</div>}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-800">İptal</button>
          <button type="submit" disabled={sending || !description.trim()} className="px-4 py-2 rounded bg-accent text-white disabled:opacity-50">
            {sending ? 'Gönderiliyor...' : 'Gönder'}
          </button>
        </div>
      </form>
    </div>
  )
}
