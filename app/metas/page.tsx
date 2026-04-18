'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import Navbar from '../../components/layout/Navbar'
import { Panel, PanelHeader, PanelBody, Dot, Label, Input, Select, BtnPrimary, BadgeCat, BtnGhost, Spinner, EmptyState } from '../../components/ui'
import { getMetas, saveMeta, deleteMeta, getTransacoes } from '../../lib/db'
import { brl } from '../../lib/utils'
import type { Meta } from '../../types'
import { Target, Trash2 } from 'lucide-react'

export default function MetasPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [metas, setMetas]           = useState<Meta[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [fetching, setFetching]     = useState(true)
  const [categoria, setCategoria]   = useState('')
  const [limite, setLimite]         = useState('')
  const [mes, setMes]               = useState('')
  const [saving, setSaving]         = useState(false)

  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading, router])

  const load = useCallback(async () => {
    if (!user) return
    setFetching(true)
    const [m, t] = await Promise.all([getMetas(user.uid), getTransacoes(user.uid)])
    setMetas(m.sort((a, b) => b.mes.localeCompare(a.mes)))
    setCategorias([...new Set(t.map(tx => tx.categoria))].sort())
    setFetching(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !categoria || !limite || !mes) return
    setSaving(true)
    await saveMeta(user.uid, { categoria, limite: parseFloat(limite), mes })
    setCategoria(''); setLimite(''); setMes('')
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!user || !confirm('Excluir meta?')) return
    await deleteMeta(user.uid, id)
    load()
  }

  if (loading || fetching) return <Spinner />

  return (
    <div className="relative z-10">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--dim)' }}>Configurações</p>
          <h1 className="text-2xl font-bold">Metas de Gastos</h1>
        </div>

        <div className="grid grid-cols-[280px_1fr] gap-5">
          {/* Form */}
          <Panel>
            <PanelHeader><Dot color="cyan" />Nova Meta</PanelHeader>
            <PanelBody>
              <form onSubmit={handleSave} className="flex flex-col gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Input type="text" value={categoria} onChange={e => setCategoria(e.target.value)}
                    required placeholder="Ex: Alimentação" list="cat-metas" />
                  <datalist id="cat-metas">{categorias.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <Label>Limite Mensal (R$)</Label>
                  <Input type="number" value={limite} onChange={e => setLimite(e.target.value)}
                    step="0.01" min="1" required placeholder="500,00" />
                </div>
                <div>
                  <Label>Mês de referência</Label>
                  <Input type="month" value={mes} onChange={e => setMes(e.target.value)} required />
                </div>
                <BtnPrimary type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : '+ Salvar Meta'}
                </BtnPrimary>
              </form>
            </PanelBody>
          </Panel>

          {/* Table */}
          <Panel>
            <PanelHeader><Dot color="green" />Metas Cadastradas</PanelHeader>
            <div className="overflow-x-auto">
              {metas.length === 0
                ? <PanelBody><EmptyState icon={<Target />} text="Nenhuma meta cadastrada" /></PanelBody>
                : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Categoria','Mês','Limite',''].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-bold tracking-widest uppercase"
                            style={{ color: 'var(--dim)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metas.map(m => (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors"
                          style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-4 py-3"><BadgeCat>{m.categoria}</BadgeCat></td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--dim)' }}>{m.mes}</td>
                          <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--cyan)' }}>{brl(m.limite)}</td>
                          <td className="px-4 py-3">
                            <BtnGhost danger onClick={() => handleDelete(m.id)}>
                              <Trash2 size={13} />
                            </BtnGhost>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  )
}
