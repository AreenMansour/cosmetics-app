'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AddClientModal from '@/components/AddClientModal'

interface Client {
  id: string
  name: string
  phone: string
  payment_amount: string
  payment_note: string
  payment_done: boolean
}
//ee
export default function ClientsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [paymentModal, setPaymentModal] = useState<Client | null>(null)
  const [paymentDoneConfirm, setPaymentDoneConfirm] = useState<Client | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    if (data) setClients(data)
  }, [supabase])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filtered = clients.filter(c =>
    c.name.includes(search)
  )

  const handleSave = async (data: { name: string; phone: string }) => {
    if (editingClient) {
      await supabase
        .from('clients')
        .update({ name: data.name, phone: data.phone })
        .eq('id', editingClient.id)
    } else {
      await supabase
        .from('clients')
        .insert({ name: data.name, phone: data.phone })
    }
    setModalOpen(false)
    setEditingClient(null)
    fetchClients()
    setPayAmount('')
    setPayNote('')
  }

  const handleDelete = async (client: Client) => {
    if (!confirm(`למחוק את ${client.name}?`)) return
    await supabase.from('clients').delete().eq('id', client.id)
    fetchClients()
  }

  const confirmPaymentDone = async () => {
    if (!paymentDoneConfirm) return
    await supabase
      .from('clients')
      .update({ payment_done: true })
      .eq('id', paymentDoneConfirm.id)
    setPaymentDoneConfirm(null)
    fetchClients()
  }

  const openPaymentModal = (client: Client) => {
    if (client.payment_done){
      setPayAmount('')
      setPayNote('')
    } else {
      setPayAmount(client.payment_amount)
      setPayNote(client.payment_note)
    }
    setPaymentModal(client)

  }

  const handlePaymentSave = async () => {
    if (!paymentModal) return
    await supabase
      .from('clients')
      .update({
        payment_amount: payAmount,
        payment_note: payNote,
        payment_done: payAmount === '',
      })
      .eq('id', paymentModal.id)
    setPaymentModal(null)
    fetchClients()

  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="חיפוש לקוחה..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-base input-field"
        />
      </div>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-base font-semibold mb-3"
          style={{ color: "var(--color-text-secondary)" }}
        >
           ({filtered.length}) לקוחות
        </h3>
      </div>

      <div className="space-y-2">
        {filtered.map((client) => (
          <div
            key={client.id}
            className="rounded-xl p-4 transition-all duration-200 hover:shadow-md"
            style={{
              background: 'white',
              border: '1px solid var(--color-border-light)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <button
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="text-base font-semibold cursor-pointer bg-transparent border-none p-0 link-hover"
                  style={{ color: 'var(--color-text)' }}
                >
                  {client.name}
                </button>
                <p className="text-sm ltr mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {client.phone}
                </p>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => openPaymentModal(client)}
                  className="text-sm px-2 py-1 rounded-lg btn-ghost"
                  title="הערת תשלום"
                >
                  💰
                </button>
                <button
                  onClick={() => { setEditingClient(client); setModalOpen(true) }}
                  className="text-sm px-2 py-1 rounded-lg btn-ghost"
                  title="עריכה"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="text-sm px-2 py-1 rounded-lg btn-ghost"
                  title="מחיקה"
                >
                  🗑️
                </button>
              </div>
            </div>

            {!client.payment_done && client.payment_amount > '' && (
              <div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: '#FEF2F2' }}>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                    חוב: {client.payment_amount} ש״ח
                  </span>
                  {client.payment_note && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {client.payment_note}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setPaymentDoneConfirm(client)}
                  className="text-xs px-2 py-1 rounded-md text-white cursor-pointer transition-colors duration-200"
                  style={{ background: 'var(--color-success)' }}
                >
                  שולם ✓
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            {search ? 'לא נמצאו תוצאות' : 'אין לקוחות עדיין'}
          </p>
        )}
      </div>

      <button
        className="fab"
        onClick={() => { setEditingClient(null); setModalOpen(true) }}
      >
        +
      </button>

      <AddClientModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingClient(null) }}
        onSave={handleSave}
        initial={editingClient ? { name: editingClient.name, phone: editingClient.phone } : null}
      />

      {/* Confirm payment marked as done */}
      {paymentDoneConfirm && (
        <div className="modal-overlay" onClick={() => setPaymentDoneConfirm(null)}>
          <div
            className="modal-content text-center max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3" aria-hidden>
              💰
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              האם שולם?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              {paymentDoneConfirm.name} - חוב: {paymentDoneConfirm.payment_amount} ש״ח
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmPaymentDone}
                className="flex-1 py-2.5 rounded-lg font-medium text-white cursor-pointer transition-opacity duration-200 hover:opacity-90"
                style={{ background: 'var(--color-success)' }}
              >
                כן, שולם
              </button>
              <button
                type="button"
                onClick={() => setPaymentDoneConfirm(null)}
                className="flex-1 py-2.5 rounded-lg font-medium btn-secondary bg-white"
              >
                לא
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Note Modal */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
              הערת תשלום - {paymentModal.name}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>סכום חוב (ש״ח)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={payAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^\d*\.?\d*$/.test(value)) {
                      setPayAmount(value)
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg ltr input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>הערה</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg input-field"
                  placeholder="הערה על החוב..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handlePaymentSave}
                  className="flex-1 py-2 rounded-lg font-medium btn-primary"
                >
                  שמור
                </button>
                <button
                  onClick={() => setPaymentModal(null)}
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
