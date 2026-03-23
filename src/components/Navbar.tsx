'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const showBack = pathname !== '/menu'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-sm"
      style={{ background: 'white', borderBottom: '1px solid var(--color-border-light)' }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="text-2xl leading-none cursor-pointer transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            →
          </button>
        )}
        <Image
          src="/logo2.png"
          alt="לוגו"
          width={36}
          height={36}
          className="rounded-full"
        />
        <h1 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
          נג&#39;את קוסמטיקס
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/profile')}
          className="text-sm px-3 py-1.5 rounded-lg btn-secondary"
          title="פרופיל"
        >
          👤
        </button>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded-lg btn-danger-outline"
        >
          יציאה
        </button>
      </div>
    </nav>
  )
}
