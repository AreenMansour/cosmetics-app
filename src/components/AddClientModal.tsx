'use client'

import { useState, useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; phone: string }) => void
  initial?: { name: string; phone: string } | null
}

export default function AddClientModal({ isOpen, onClose, onSave, initial }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setPhone(initial.phone)
    } else {
      setName('')
      setPhone('')
    }
  }, [initial, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, phone })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
          {initial ? 'עריכת לקוחה' : 'לקוחה חדשה'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>שם</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>טלפון</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg ltr input-field"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg font-medium btn-primary"
            >
              שמור
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg font-medium btn-secondary"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
