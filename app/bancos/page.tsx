'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import Navbar from '../../components/layout/Navbar'
import { Spinner, BtnPrimary, BtnGhost, Label, Select, Input } from '../../components/ui'
import { getBancos, addBanco, deleteBanco } from '../../lib/db'
import { BANCOS_CATALOGO, BancoLogoSvg } from '../../lib/bancos'
import type { Banco } from '../../types'
import { Plus, Trash2, CreditCard } from 'lucide-react'

export default function BancosPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bancos, setBancos]     = useState<Banco[]>([])
  const [fetching, setFetching] = useState(true)
  const [slug, setSlug]         = useState('nubank')
  const [apelido, setApelido]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDel]    = useState<string | null>(null)

  useEffect(() => { if (!loading && !user) router.replace('/login') }, [user, loading, router])

  const load = useCallback(async () => {
    if (!user) return
    setFetching(true)
    setBancos(await getBancos(user.uid))
    setFetching(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const bancoCat = BANCOS_CATALOGO.find(b => b.slug === slug)!

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await addBanco(user!.uid, {
      slug,
      nome:    bancoCat.nome,
      cor:     bancoCat.cor,
      apelido: apelido.trim() || undefined,
    })
    setApelido('')
    setSaving(false)
    load()
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover ${nome}?`)) return
    setDel(id)
    await deleteBanco(user!.uid, id)
    setDel(null)
    load()
  }

  if (loading || fetching) return <Spinner />

  return (
    <div className="relative z-10">
      <Navbar />
      <main className="max-w-screen-md mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--dim)' }}>Configurações</p>
          <h1 className="text-2xl font-bold">Meus Bancos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Cadastre seus bancos para visualizar os logos no dashboard e em investimentos.
          </p>
        </div>

        {/* Form adicionar */}
        <div className="rounded-xl p-5 mb-6"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--dim)' }}>
            Adicionar banco
          </p>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div>
              <Label>Banco</Label>
              <div className="flex gap-3 items-center">
                <BancoLogoSvg slug={slug} size={40} />
                <Select value={slug} onChange={e => setSlug(e.target.value)} style={{ flex: 1 }}>
                  {BANCOS_CATALOGO.filter(b => b.slug !== 'outro').map(b => (
                    <option key={b.slug} value={b.slug}>{b.nome}</option>
                  ))}
                  <option value="outro">Outro</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Apelido <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></Label>
              <Input type="text" value={apelido} onChange={e => setApelido(e.target.value)}
                placeholder={`ex: ${bancoCat.nome} Corrente, ${bancoCat.nome} Poupança...`} />
            </div>

            {/* Preview do card */}
            <div className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: 'var(--surface3)', border: `1px solid ${bancoCat.cor}33` }}>
              <BancoLogoSvg slug={slug} size={36} />
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {apelido || bancoCat.nome}
                </p>
                {apelido && <p className="text-xs" style={{ color: 'var(--muted)' }}>{bancoCat.nome}</p>}
              </div>
              <div className="ml-auto w-3 h-3 rounded-full" style={{ background: bancoCat.cor }} />
            </div>

            <BtnPrimary type="submit" disabled={saving} className="w-full">
              <Plus size={13} className="inline mr-1" />
              {saving ? 'Adicionando...' : 'Adicionar banco'}
            </BtnPrimary>
          </form>
        </div>

        {/* Lista */}
        {bancos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3"
            style={{ color: 'var(--muted)' }}>
            <CreditCard size={36} strokeWidth={1} />
            <p className="text-sm">Nenhum banco cadastrado ainda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bancos.map(b => (
              <div key={b.id}
                className="flex items-center gap-3 p-4 rounded-xl transition-all"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <BancoLogoSvg slug={b.slug} size={40} />
                <div style={{ flex: 1 }}>
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {b.apelido || b.nome}
                  </p>
                  {b.apelido && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{b.nome}</p>
                  )}
                </div>
                <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ background: b.cor }} />
                <BtnGhost danger onClick={() => handleDelete(b.id, b.apelido || b.nome)}
                  disabled={deletingId === b.id}>
                  <Trash2 size={14} />
                </BtnGhost>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
