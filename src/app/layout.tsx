import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'GateX-KSE | Keystone School of Engineering – Intelligent Visitor Management',
  description: 'Enterprise-grade campus visitor intelligence and security management system. Powered by AI-driven access control and real-time analytics.',
  keywords: ['visitor management', 'campus security', 'gate pass', 'QR access', 'Keystone Engineering'],
  authors: [{ name: 'Abhijeet Kangane' }],
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛡️</text></svg>',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans noise-overlay`}>
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(16,20,32,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
