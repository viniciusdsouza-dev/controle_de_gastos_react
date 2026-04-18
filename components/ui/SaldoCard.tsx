'use client'
import { useState } from 'react'
import { brl } from '../../lib/utils'
import { Pencil, Clock, ArrowRight } from 'lucide-react'
import type { Config } from '../../types'

interface Props {
  saldo: number
  saldoMesAnterior: number
  config: Config
  ehMesAtual: boolean
  dataCorte: string
  filtroAno: string
  filtroMes: string
  onSaveConfig: (c: Partial<Config>) => Promise<void>
}

export default function SaldoCard({
  saldo, saldoMesAnterior, config, ehMesAtual, dataCorte, onSaveConfig
}: Props) {
  const [showAjuste, setShowAjuste] = useState(false)
  const [ajusteVal, setAjusteVal]   = useState('')
  const [saving, setSaving]         = useState(false)

  const positivo = saldo >= 0

  async function handleSaveAjuste(e: React.FormEvent) {
    e.preventDefault()
    if (!ajusteVal.trim()) return
    setSaving(true)
    await onSaveConfig({ ajusteSaldo: parseFloat(ajusteVal) })
    setAjusteVal('')
    setShowAjuste(false)
    setSaving(false)
  }

  async function toggleModo() {
    const next = config.modoSaldo === 'hoje' ? 'mes' : 'hoje'
    await onSaveConfig({ modoSaldo: next })
  }

  const accent = positivo ? 'var(--cyan)' : '#ff9800'

  return (
    <div className="relative rounded-xl p-5 overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, var(--cyan), transparent)` }} />

      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>
          Saldo
        </span>
        {ehMesAtual && (
          <button onClick={toggleModo}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: config.modoSaldo === 'hoje' ? 'rgba(0,229,255,.12)' : 'rgba(255,255,255,.05)',
              border: config.modoSaldo === 'hoje' ? '1px solid rgba(0,229,255,.35)' : '1px solid var(--border)',
              color: config.modoSaldo === 'hoje' ? 'var(--cyan)' : 'var(--muted)',
            }}>
            <Clock size={10} />
            {config.modoSaldo === 'hoje' ? 'Até hoje' : 'Mês completo'}
          </button>
        )}
      </div>

      {/* Value */}
      <div className="font-mono text-2xl font-bold leading-none mb-1" style={{ color: accent }}>
        {brl(saldo)}
      </div>

      {/* Corte info */}
      {config.modoSaldo === 'hoje' && ehMesAtual && (
        <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--muted)' }}>
          <Clock size={10} />
          Até {dataCorte.split('-').reverse().join('/')}
        </div>
      )}

      {/* Mês anterior */}
      <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--muted)' }}>
        <ArrowRight size={10} />
        Mês anterior:
        <span className="font-mono font-semibold" style={{ color: saldoMesAnterior >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {brl(saldoMesAnterior)}
        </span>
      </div>

      {/* Ajustar saldo button */}
      <button onClick={() => setShowAjuste(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all"
        style={{
          background: 'rgba(0,229,255,.08)',
          border: '1px solid rgba(0,229,255,.25)',
          color: 'var(--cyan)',
        }}>
        <Pencil size={11} />
        Ajustar Saldo
      </button>

      {/* Ajuste form */}
      {showAjuste && (
        <form onSubmit={handleSaveAjuste} className="mt-3 flex flex-col gap-2">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Use valor negativo para cheque especial. Ex: -500
          </p>
          <div className="flex gap-2">
            <input
              type="number" step="0.01" value={ajusteVal}
              onChange={e => setAjusteVal(e.target.value)}
              placeholder={String(config.ajusteSaldo || '0')}
              className="flex-1 rounded-md px-2 py-1.5 text-xs font-mono outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 rounded-md text-xs font-bold transition-all disabled:opacity-60"
              style={{ background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--cyan)' }}>
              {saving ? '...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
