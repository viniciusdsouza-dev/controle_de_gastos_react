'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../lib/auth-context'
import { LayoutDashboard, Target, BarChart2, Wallet, LogOut } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/metas',     label: 'Metas',     icon: Target },
  { href: '/relatorio', label: 'Relatório',  icon: BarChart2 },
]

export default function Navbar() {
  const path   = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  async function handleLogout() {
    await signOut(auth)
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-50 border-b" style={{
      background: 'rgba(10,12,20,0.92)',
      backdropFilter: 'blur(20px)',
      borderColor: 'var(--border)',
    }}>
      <div className="max-w-screen-xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm"
          style={{ background: 'linear-gradient(90deg,var(--cyan),var(--pink))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <Wallet size={18} style={{ color: 'var(--cyan)', WebkitTextFillColor: 'initial' }} />
          Controle de Gastos
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                color: path === href ? 'var(--text)' : 'var(--dim)',
                background: path === href ? 'var(--surface2)' : 'transparent',
              }}>
              <Icon size={13} />
              {label}
            </Link>
          ))}

          {/* Divider */}
          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

          {/* User */}
          <span className="text-xs px-2" style={{ color: 'var(--dim)' }}>
            {user?.displayName || user?.email?.split('@')[0]}
          </span>

          {/* Logout */}
          <button onClick={handleLogout}
            className="p-1.5 rounded-md transition-all hover:bg-red-500/10"
            style={{ color: 'var(--muted)' }}
            title="Sair">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
