'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Appointment {
  id: string
  client_name: string
  treatment_type: string
  date: string
  time: string
}

function toLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function MenuPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [tomorrowAppts, setTomorrowAppts] = useState<Appointment[]>([])

  useEffect(() => {
    const fetchTomorrow = async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = toLocalDate(tomorrow)

      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', dateStr)
        .order('time')

      if (data) setTomorrowAppts(data)
    }
    fetchTomorrow()
  }, [supabase])

  return (
    <div className="pt-8 space-y-8">
      <div className="flex justify-center">
        <Image
          src="/logo1.png"
          alt="נג'את קוסמטיקס"
          width={180}
          height={180}
          className="object-contain"
        />
      </div>

      {/* {tomorrowAppts.length > 0 && (
         <div
         className="rounded-xl p-4"
         style={{
           background: "linear-gradient(135deg, #ffe7ea, #FDF2D0)",
           border: "1px solid var(--color-primary-light)",
         }}
       >
         <p
           className="font-semibold mb-2"
           style={{ color: "var(--color-primary)" }}
         >
           תזכורת: יש לך {tomorrowAppts.length} תורים מחר
         </p>
          <div className="space-y-1">
            {tomorrowAppts.map((appt) => (
              <p key={appt.id} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {appt.time?.slice(0, 5)} - {appt.client_name} ({appt.treatment_type})
              </p>
            ))}
          </div>
        </div>
      )} */}

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/clients')}
          className="rounded-2xl p-8 text-center cursor-pointer card-hover"
          style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}
        >
          <div className="text-4xl mb-3">👥</div>
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>לקוחות</div>
        </button>

        <button
          onClick={() => router.push('/diary')}
          className="rounded-2xl p-8 text-center cursor-pointer card-hover"
          style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}
        >
          <div className="text-4xl mb-3">📅</div>
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>יומן</div>
        </button>

        <button
          onClick={() => router.push('/profile')}
          className="rounded-2xl p-8 text-center cursor-pointer col-span-2 card-hover"
          style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}
        >
          <div className="text-4xl mb-3">👤</div>
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>פרופיל</div>
        </button>
      </div>
    </div>
  )
}
