'use client'
import { useState, useMemo } from 'react'
import { calcularSnapshot, calcularProjecao, fmtTaxa } from '../../lib/investimentos'
import { brl } from '../../lib/utils'
import { X, TrendingUp, Calendar } from 'lucide-react'
import { Label, Select, BtnGhost } from '../ui'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { PositionComAportes } from '../../app/investimentos/page'

interface Props {
  item:    PositionComAportes
  onClose: () => void
}

const OPCOES_MESES = [3, 6, 12, 24, 36, 48, 60]

function ProjecaoTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,.5)',
    }}>
      <p className="text-xs font-bold mb-2" style={{ color: 'var(--dim)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-8 mb-1">
          <span className="text-xs" style={{ color: p.color }}>{p.name}</span>
          <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{brl(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ProjecaoModal({ item, onClose }: Props) {
  const { position, aportes } = item
  const hoje = new Date().toISOString().slice(0, 10)

  const [mesesFuturos, setMesesFuturos] = useState(12)

  const snapAtual = useMemo(
    () => calcularSnapshot(position, aportes, hoje),
    [position, aportes, hoje]
  )

  const projecao = useMemo(
    () => calcularProjecao(position, aportes, mesesFuturos, hoje),
    [position, aportes, mesesFuturos, hoje]
  )

  const snapFuturo = projecao[projecao.length - 1]
  const rendFuturo = snapFuturo ? snapFuturo.rendimento - snapAtual.rendimentoTotal : 0

  return (
    <>
      <div className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />

      <div className="fixed z-50 w-full rounded-xl overflow-hidden"
        style={{
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          maxWidth: 680, maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', border: '1px solid rgba(0,229,255,.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,.7)',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>Projeção de Rendimento</p>
            <p className="font-bold text-sm mt-0.5">{position.nome || position.categoria}</p>
          </div>
          <BtnGhost onClick={onClose}><X size={15} /></BtnGhost>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Cards resumo atual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 pb-0">
            {[
              { label: 'Total Aportado', value: brl(snapAtual.totalAportado), color: 'var(--dim)' },
              { label: 'Valor Atual',    value: brl(snapAtual.valorAtual),    color: 'var(--cyan)' },
              { label: 'Rendido até hoje', value: `${snapAtual.rendimentoTotal >= 0 ? '+' : ''}${brl(snapAtual.rendimentoTotal)}`, color: snapAtual.rendimentoTotal >= 0 ? '#00e676' : '#ff1744' },
            ].map(c => (
              <div key={c.label} className="rounded-lg p-3"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{c.label}</p>
                <p className="font-bold font-mono text-sm" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Taxa */}
          <div className="px-5 pt-3 pb-0">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Taxa: <strong style={{ color: 'var(--cyan)' }}>{fmtTaxa(position.taxaMensal)}/mês</strong>
              {' · '}
              <strong style={{ color: 'var(--cyan)' }}>{fmtTaxa(position.taxaAnual)}/ano</strong>
            </p>
          </div>

          {/* Seletor de período */}
          <div className="px-5 pt-4">
            <div className="flex items-center gap-3">
              <Calendar size={13} style={{ color: 'var(--dim)' }} />
              <Label style={{ margin: 0 }}>Projetar para:</Label>
              <div className="flex gap-1 flex-wrap">
                {OPCOES_MESES.map(m => (
                  <button key={m} type="button"
                    onClick={() => setMesesFuturos(m)}
                    className="px-3 py-1 rounded-md text-xs font-bold transition-all"
                    style={{
                      background: mesesFuturos === m ? 'var(--cyan)' : 'var(--surface3)',
                      color:      mesesFuturos === m ? '#000' : 'var(--dim)',
                      border:     `1px solid ${mesesFuturos === m ? 'var(--cyan)' : 'var(--border)'}`,
                      cursor: 'pointer',
                    }}>
                    {m < 12 ? `${m}m` : `${m / 12}a`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cards projeção */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 pt-4">
            {[
              {
                label: `Valor em ${mesesFuturos < 12 ? mesesFuturos + ' meses' : mesesFuturos / 12 + (mesesFuturos === 12 ? ' ano' : ' anos')}`,
                value: brl(snapFuturo?.valorTotal ?? 0),
                color: 'var(--cyan)',
              },
              {
                label: 'Rendimento futuro (projetado)',
                value: `+${brl(rendFuturo)}`,
                color: '#00e676',
              },
              {
                label: 'Rendimento total acumulado',
                value: `+${brl(snapFuturo?.rendimento ?? 0)}`,
                color: '#ffd740',
              },
            ].map(c => (
              <div key={c.label} className="rounded-lg p-3"
                style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{c.label}</p>
                <p className="font-bold font-mono text-sm" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          <div className="px-5 pt-4 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={projecao} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradAport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4a5170" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4a5170" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradRend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00e676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--dim)', fontSize: 9 }} axisLine={false} tickLine={false}
                  interval={Math.floor(projecao.length / 6)} />
                <YAxis tick={{ fill: 'var(--dim)', fontSize: 9 }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={v => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
                <Tooltip content={<ProjecaoTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: 'var(--dim)', paddingTop: 8 }} />
                <Area type="monotone" dataKey="valorAportado" name="Aportado"
                  stroke="#4a5170" fill="url(#gradAport)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="rendimento" name="Rendimento"
                  stroke="#00e676" fill="url(#gradRend)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="valorTotal" name="Total c/ rendimento"
                  stroke="#00e5ff" fill="url(#gradTotal)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela resumo por período */}
          <div className="px-5 pb-5">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--dim)' }}>
              Resumo por Período
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'var(--surface3)' }}>
                    {['Mês', 'Aportado', 'Rendimento', 'Total'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold tracking-widest uppercase"
                        style={{ color: 'var(--dim)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projecao
                    .filter((_, i) => {
                      if (mesesFuturos <= 12) return true
                      if (mesesFuturos <= 24) return i % 2 === 0
                      return i % 3 === 0
                    })
                    .map((p, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}
                        className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--dim)' }}>{p.label}</td>
                        <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--text)' }}>{brl(p.valorAportado)}</td>
                        <td className="px-4 py-2.5 text-xs font-mono font-bold" style={{ color: '#00e676' }}>
                          +{brl(p.rendimento)}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono font-bold" style={{ color: 'var(--cyan)' }}>
                          {brl(p.valorTotal)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
