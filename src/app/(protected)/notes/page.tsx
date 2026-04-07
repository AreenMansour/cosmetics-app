'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Note {
  id: string
  title: string
  content: string
  created_at?: string
}

export default function NotesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [notes, setNotes] = useState<Note[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setTitle('')
    setContent('')
    setEditingNote(null)
  }

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch notes error:', error)
      return
    }

    setNotes(data || [])
  }, [supabase])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      alert('נא למלא כותרת או תוכן')
      return
    }

    setLoading(true)

    const payload = {
      title: title.trim(),
      content: content.trim(),
    }

    const { error } = editingNote
      ? await supabase.from('notes').update(payload).eq('id', editingNote.id)
      : await supabase.from('notes').insert(payload)

    if (error) {
      console.error('Save note error:', error)
      setLoading(false)
      return
    }

    resetForm()
    setModalOpen(false)
    setLoading(false)
    fetchNotes()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את ההערה?')) return

    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) {
      console.error('Delete note error:', error)
      return
    }

    fetchNotes()
  }

  const openNew = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (note: Note) => {
    setEditingNote(note)
    setTitle(note.title || '')
    setContent(note.content || '')
    setModalOpen(true)
  }

  const formatDate = (value?: string) => {
    if (!value) return ''
    const d = new Date(value)
    return d.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
            הערות
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            יצירת הערות חופשיות לניהול אישי
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-lg font-medium btn-primary"
        >
          + הערה חדשה
        </button>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-xl p-4"
            style={{
              background: 'white',
              border: '1px solid var(--color-border-light)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base font-semibold mb-1 break-words"
                  style={{ color: 'var(--color-text)' }}
                >
                  {note.title || 'ללא כותרת'}
                </h3>
                <p className="text-sm whitespace-pre-line break-words" style={{ color: 'var(--color-text-muted)' }}>
                  {note.content || '-'}
                </p>
                {note.created_at && (
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatDate(note.created_at)}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openEdit(note)}
                  className="text-sm px-3 py-1 rounded-lg btn-ghost"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-sm px-3 py-1 rounded-lg btn-ghost"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
            אין הערות עדיין
          </p>
        )}
      </div>

      <button className="fab" onClick={openNew}>
        +
      </button>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => { setModalOpen(false); resetForm() }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
              {editingNote ? 'עריכת הערה' : 'הוספת הערה'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  כותרת
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg input-field"
                  placeholder="למשל: קניות לשבוע"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  תוכן
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg input-field min-h-[140px]"
                  placeholder="מה תרצי לזכור?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg font-medium btn-primary disabled:opacity-60"
                >
                  {loading ? 'שומרת...' : 'שמור'}
                </button>
                <button
                  onClick={() => { setModalOpen(false); resetForm() }}
                  className="flex-1 py-2 rounded-lg font-medium btn-secondary"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
