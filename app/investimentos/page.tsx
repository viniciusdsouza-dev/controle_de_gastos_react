'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import Navbar from '../../components/layout/Navbar'
import { Spinner } from '../../components/ui'
import { getPositions, getAportes } from '../../lib/db'
import type { InvestimentoPosition, Aporte } from '../../types'
import { calcularSnapshot } from '../../lib/investimentos'
import { brl } from '../../lib/utils'
import PositionCard from '../../components/investimentos/PositionCard'
import PositionModal from '../../components/investimentos/PositionModal'
import ProjecaoModal from '../../components/investimentos/ProjecaoModal'
import { Plus, TrendingUp, Wallet, BarChart3, RefreshCw } from 'lucide-react'

export interface PositionComAportes {
  position: InvestimentoPosition
  aportes:  Aporte[]
}

export default function InvestimentosPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [items, setItems]           = useState<PositionComAportes[]>([])
  const [fetching, setFetching]     = useState(true)
  const [novaPosition, setNova]     = useState(false)
  const [editando, setEditando]     = useState<InvestimentoPosition | null>(null)
  const [projetando, setProjetando] = useState<PositionComAportes | null>(null)

  useEffect(() => { if (!loading && !user) router.replace('/login') }, [user, loading, router])

  const load = useCallback(async () => {
    if (!user) return
    setFetching(true)
    const positions = await getPositions(user.uid)
    const withAportes = await Promise.all(
      positions.map(async p => ({
        position: p,
        aportes: await getAportes(user.uid, p.id),
      }))
    )
    setItems(withAportes)
    setFetching(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const hoje = new Date().toISOString().slice(0, 10)

  // dataRef: usa hoje ou o último aporte (o que for mais recente)
  // Isso garante que aportes futuros já registrados sejam contabilizados
  function dataRefParaPosition(aportes: import('../../types').Aporte[]): string {
    if (!aportes.length) return hoje
    const ultimo = aportes.reduce((max, a) => a.data > max ? a.data : max, hoje)
    return ultimo > hoje ? ultimo : hoje
  }

  // ── Totais gerais ──────────────────────────────────────────────────────────
  const totais = items.reduce((acc, { position, aportes }) => {
    const snap = calcularSnapshot(position, aportes, dataRefParaPosition(aportes))
    acc.aportado  += snap.totalAportado
    acc.atual     += snap.valorAtual
    acc.rendimento += snap.rendimentoTotal
    return acc
  }, { aportado: 0, atual: 0, rendimento: 0 })

  const ativas  = items.filter(i => i.position.ativo)
  const inativas = items.filter(i => !i.position.ativo)

  if (loading || fetching) return <Spinner />

  return (
    <div className="relative z-10">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--dim)' }}>Carteira</p>
            <h1 className="text-2xl font-bold">Investimentos</h1>
          </div>
          <button
            onClick={() => setNova(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{ background: 'var(--cyan)', color: '#000', cursor: 'pointer', border: 'none' }}
          >
            <Plus size={13} /> Novo Investimento
          </button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Investido',  value: brl(totais.aportado),   icon: <Wallet size={16} />,    color: 'var(--cyan)' },
            { label: 'Valor Atual',      value: brl(totais.atual),      icon: <BarChart3 size={16} />, color: '#00e676' },
            { label: 'Rendimento Total', value: brl(totais.rendimento), icon: <TrendingUp size={16} />,
              color: totais.rendimento >= 0 ? '#00e676' : '#ff1744',
              sub: totais.aportado > 0
                ? `${totais.rendimento >= 0 ? '+' : ''}${((totais.rendimento / totais.aportado) * 100).toFixed(2)}%`
                : null },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2" style={{ color: c.color }}>
                {c.icon}
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>{c.label}</span>
              </div>
              <p className="text-xl font-bold font-mono" style={{ color: c.color }}>{c.value}</p>
              {c.sub && <p className="text-xs font-mono" style={{ color: c.color }}>{c.sub}</p>}
            </div>
          ))}
        </div>

        {/* Lista de positions ativas */}
        {ativas.length === 0 && inativas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: 'var(--muted)' }}>
            <BarChart3 size={40} strokeWidth={1} />
            <p className="text-sm">Nenhum investimento registrado ainda.</p>
            <button onClick={() => setNova(true)}
              className="text-xs px-4 py-2 rounded-lg font-bold"
              style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.3)', cursor: 'pointer' }}>
              + Adicionar primeiro investimento
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ativas.map(item => (
              <PositionCard
                key={item.position.id}
                item={item}
                uid={user!.uid}
                dataRef={dataRefParaPosition(item.aportes)}
                onEdit={() => setEditando(item.position)}
                onProjetar={() => setProjetando(item)}
                onReload={load}
              />
            ))}
            {inativas.length > 0 && (
              <>
                <p className="text-xs font-bold tracking-widest uppercase mt-4 mb-1" style={{ color: 'var(--muted)' }}>
                  Encerrados
                </p>
                {inativas.map(item => (
                  <PositionCard
                    key={item.position.id}
                    item={item}
                    uid={user!.uid}
                    dataRef={dataRefParaPosition(item.aportes)}
                    onEdit={() => setEditando(item.position)}
                    onProjetar={() => setProjetando(item)}
                    onReload={load}
                    encerrado
                  />
                ))}
              </>
            )}
          </div>
        )}
      </main>

      {/* Modais */}
      {(novaPosition || editando) && (
        <PositionModal
          uid={user!.uid}
          position={editando ?? undefined}
          onClose={() => { setNova(false); setEditando(null) }}
          onSaved={() => { setNova(false); setEditando(null); load() }}
        />
      )}
      {projetando && (
        <ProjecaoModal
          item={projetando}
          onClose={() => setProjetando(null)}
        />
      )}
    </div>
  )
}
