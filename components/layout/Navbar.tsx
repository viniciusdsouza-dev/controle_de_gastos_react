'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useHideValues } from '../../lib/hide-values-context'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../lib/auth-context'
import { LayoutDashboard, Target, BarChart2, TrendingUp, Wallet, CreditCard, LogOut, Menu, X, Eye, EyeOff } from 'lucide-react'

const links = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/metas',         label: 'Metas',          icon: Target },
  { href: '/relatorio',     label: 'Relatório',      icon: BarChart2 },
  { href: '/investimentos', label: 'Investimentos',  icon: TrendingUp },
  { href: '/bancos',        label: 'Bancos',          icon: CreditCard },
]

export default function Navbar() {
  const path   = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const { hidden, toggle } = useHideValues()

  async function handleLogout() {
    await signOut(auth)
    router.push('/login')
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b" style={{
        background: 'rgba(10,12,20,0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: 'var(--border)',
      }}>
        <div className="max-w-screen-xl mx-auto px-4 h-12 flex items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm"
            style={{ background: 'linear-gradient(90deg,var(--cyan),var(--pink))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            <Wallet size={18} style={{ color: 'var(--cyan)', WebkitTextFillColor: 'initial' }} />
            <span className="hidden sm:inline">Controle de Gastos</span>
            <span className="sm:hidden">Gastos</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  color:      path === href ? 'var(--text)' : 'var(--dim)',
                  background: path === href ? 'var(--surface2)' : 'transparent',
                }}>
                <Icon size={13} />{label}
              </Link>
            ))}
            <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
            <span className="text-xs px-2 hidden lg:inline" style={{ color: 'var(--dim)' }}>
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
            <button onClick={toggle}
              className="p-1.5 rounded-md transition-all"
              style={{ color: hidden ? 'var(--cyan)' : 'var(--muted)', background: hidden ? 'rgba(0,229,255,0.08)' : 'transparent' }}
              title={hidden ? 'Mostrar valores' : 'Ocultar valores'}>
              {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          <button onClick={handleLogout}
              className="p-1.5 rounded-md transition-all hover:bg-red-500/10"
              style={{ color: 'var(--muted)' }} title="Sair">
              <LogOut size={14} />
            </button>
          </div>

          {/* Mobile: ícone ativo + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Indicador da página atual */}
            <span className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>
              {links.find(l => l.href === path)?.label ?? ''}
            </span>
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-lg"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)} />

          {/* Menu panel */}
          <div className="fixed top-12 right-0 z-50 w-64 md:hidden"
            style={{
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              borderBottomLeftRadius: 16,
            }}>
            <div className="p-3 flex flex-col gap-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color:      path === href ? 'var(--cyan)' : 'var(--text)',
                    background: path === href ? 'rgba(0,229,255,0.08)' : 'transparent',
                    border:     path === href ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
                  }}>
                  <Icon size={16} />{label}
                </Link>
              ))}

              {/* Divider */}
              <div className="my-1" style={{ borderTop: '1px solid var(--border)' }} />

              {/* Ocultar valores */}
              <button onClick={toggle}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all"
                style={{
                  color:      hidden ? 'var(--cyan)' : 'var(--dim)',
                  background: hidden ? 'rgba(0,229,255,0.08)' : 'transparent',
                  border:     hidden ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                }}>
                {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                {hidden ? 'Mostrar valores' : 'Ocultar valores'}
              </button>

              {/* User + logout */}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {user?.displayName || user?.email?.split('@')[0]}
                </span>
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ color: '#ff1744', background: 'rgba(255,23,68,0.08)', border: 'none', cursor: 'pointer' }}>
                  <LogOut size={12} /> Sair
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
