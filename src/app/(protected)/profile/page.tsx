'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), [])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'הסיסמאות אינן תואמות' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'הסיסמה חייבת להכיל לפחות 6 תווים' })
      return
    }

    setLoading(true)

    // Verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setMessage({ type: 'error', text: 'שגיאה בזיהוי המשתמש' })
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setMessage({ type: 'error', text: 'הסיסמה הנוכחית שגויה' })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setMessage({ type: 'error', text: 'שגיאה בעדכון הסיסמה' })
    } else {
      setMessage({ type: 'success', text: 'הסיסמה עודכנה בהצלחה' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto pt-8 space-y-6">
      <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>פרופיל</h2>

      <div
        className="rounded-xl p-6"
        style={{
          background: 'white',
          border: '1px solid var(--color-border-light)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          שינוי סיסמה
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              סיסמה נוכחית
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              סיסמה חדשה
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              אימות סיסמה חדשה
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg input-field"
            />
          </div>

          {message && (
            <p
              className="text-center text-sm py-2 rounded-lg"
              style={{
                color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                background: message.type === 'success' ? '#E8F5E9' : '#FEF2F2',
              }}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg font-medium btn-primary"
          >
            {loading ? '...מעדכן' : 'עדכן סיסמה'}
          </button>
        </form>
      </div>
    </div>
  )
}
