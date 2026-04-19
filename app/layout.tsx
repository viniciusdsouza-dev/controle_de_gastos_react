import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../lib/auth-context'

export const metadata: Metadata = {
  title: 'Controle de Gastos',
  description: 'Controle suas finanças pessoais',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
