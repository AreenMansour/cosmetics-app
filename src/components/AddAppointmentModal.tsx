'use client'

import { useState, useEffect } from 'react'

interface AppointmentData {
  client_name: string
  treatment_type: string
  date: string
  time: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: AppointmentData) => void
  initial?: AppointmentData | null
  clientNames: string[]
  defaultDate?: string | null
}

export default function AddAppointmentModal({ isOpen, onClose, onSave, initial, clientNames, defaultDate }: Props) {
  const now = new Date()
  const today = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`
  const [clientName, setClientName] = useState('')
  const [treatmentType, setTreatmentType] = useState('')
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('10:00')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (initial) {
      setClientName(initial.client_name)
      setTreatmentType(initial.treatment_type)
      setDate(initial.date)
      setTime(initial.time)
    } else {
      setClientName('')
      setTreatmentType('')
      setDate(defaultDate || today)
      setTime('10:00')
    }
  }, [initial, isOpen, today, defaultDate])

  if (!isOpen) return null

  const handleNameChange = (value: string) => {
    setClientName(value)
    if (value.length > 0) {
      const filtered = clientNames.filter(n => n.includes(value))
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ client_name: clientName, treatment_type: treatmentType, date, time })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
          {initial ? 'עריכת תור' : 'תור חדש'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>שם לקוחה</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => clientName.length > 0 && suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              required
              className="w-full px-3 py-2 rounded-lg input-field"
            />
            {showSuggestions && (
              <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-lg border shadow-lg z-10 max-h-32 overflow-y-auto"
                style={{ borderColor: 'var(--color-border)' }}>
                {suggestions.map((name) => (
                  <button key={name} type="button"
                    className="w-full text-right px-3 py-2 text-sm cursor-pointer suggestion-item"
                    style={{ color: 'var(--color-text)' }}
                    onClick={() => { setClientName(name); setShowSuggestions(false) }}
                  >{name}</button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>סוג טיפול</label>
            <input type="text" value={treatmentType} onChange={(e) => setTreatmentType(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>תאריך</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>שעה</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg ltr input-field" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="flex-1 py-2 rounded-lg font-medium btn-primary"
            >שמור</button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg font-medium btn-secondary"
            >ביטול</button>
          </div>
        </form>
      </div>
    </div>
  )
}
