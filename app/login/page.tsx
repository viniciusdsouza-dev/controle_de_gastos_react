'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { Wallet, Mail, Lock, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [erro, setErro]       = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, senha)
      router.push('/dashboard')
    } catch {
      setErro('E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}>
      {/* Glows */}
      <div className="fixed w-96 h-96 rounded-full pointer-events-none -top-24 -left-24"
        style={{ background: 'rgba(0,229,255,.06)', filter: 'blur(80px)' }} />
      <div className="fixed w-80 h-80 rounded-full pointer-events-none -bottom-20 -right-20"
        style={{ background: 'rgba(224,64,251,.05)', filter: 'blur(80px)' }} />

      <div className="w-full max-w-sm relative z-10 fade-up">
        <div className="rounded-2xl p-8" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,.5)',
        }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg,rgba(0,229,255,.15),rgba(224,64,251,.1))', border: '1px solid rgba(0,229,255,.25)' }}>
              <Wallet size={26} style={{ color: 'var(--cyan)' }} />
            </div>
            <h1 className="text-xl font-bold"
              style={{ background: 'linear-gradient(90deg,var(--cyan),var(--pink))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Controle de Gastos
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--dim)' }}>Acesse sua conta para continuar</p>
          </div>

          {/* Error */}
          {erro && (
            <div className="flex items-center gap-2 rounded-md px-3 py-2 mb-4 text-sm"
              style={{ background: 'rgba(255,23,68,.1)', border: '1px solid rgba(255,23,68,.25)', color: 'var(--red)' }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: 'var(--dim)' }}>E-mail</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="seu@email.com"
                  className="w-full rounded-md pl-9 pr-3 py-2 text-sm outline-none transition-all focus:ring-1"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: 'var(--dim)' }}>Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full rounded-md pl-9 pr-3 py-2 text-sm outline-none transition-all"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-md text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ background: 'linear-gradient(135deg,var(--cyan),#0091ea)', color: '#000' }}>
              <LogIn size={14} />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <Link href="/cadastro"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-xs font-semibold transition-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--dim)' }}>
            Criar nova conta
          </Link>
        </div>
      </div>
    </div>
  )
}
