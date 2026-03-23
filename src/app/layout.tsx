import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: "נג'את קוסמטיקס",
  description: 'ניהול לקוחות וטיפולים',
  icons: { icon: '/logo2.png' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
