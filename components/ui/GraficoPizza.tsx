'use client'
import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { Panel, PanelHeader, PanelBody, Dot, EmptyState } from './index'
import { brl } from '../../lib/utils'
import type { ResumoMes } from '../../types'
import { PieChart as PieIcon } from 'lucide-react'

const PALETTE = [
  '#00e5ff', '#e040fb', '#00e676', '#ff1744', '#ffd740',
  '#448aff', '#ff6d00', '#f48fb1', '#80cbc4', '#ce93d8',
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null
  const { name, value, payload: { color } } = payload[0]
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${color}66`,
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,.5)',
    }}>
      <p style={{ color: 'var(--muted)', fontSize: 10, marginBottom: 2 }}>{name}</p>
      <p style={{ color, fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{brl(value)}</p>
    </div>
  )
}

export function GraficoPizza({ data }: { data: Record<string, number> }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const entries = Object.entries(data)
    .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))
    .sort((a, b) => b.value - a.value)

  const total = entries.reduce((s, e) => s + e.value, 0)

  return (
    <Panel>
      <PanelHeader><Dot color="pink" />Por Categoria</PanelHeader>
      <PanelBody>
        {entries.length === 0
          ? <div className="flex items-center justify-center min-h-[200px]">
              <EmptyState icon={<PieIcon />} text="Sem saídas no período" />
            </div>
          : (
            <div className="flex flex-col gap-4">

              {/* Donut centralizado */}
              <div className="flex justify-center">
                <div style={{ position: 'relative', width: 160, height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={entries}
                        cx="50%" cy="50%"
                        innerRadius={48} outerRadius={72}
                        dataKey="value"
                        paddingAngle={2}
                        onMouseEnter={(_, i) => setActiveIndex(i)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        {entries.map((e, i) => (
                          <Cell
                            key={i}
                            fill={e.color + (activeIndex === null || activeIndex === i ? '33' : '12')}
                            stroke={e.color}
                            strokeWidth={activeIndex === i ? 2.5 : 1.5}
                            strokeOpacity={activeIndex === null || activeIndex === i ? 1 : 0.3}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centro do donut */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    {activeIndex !== null ? (
                      <>
                        <span style={{ color: entries[activeIndex].color, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2, maxWidth: 70, marginBottom: 3 }}>
                          {entries[activeIndex].name}
                        </span>
                        <span style={{ color: 'var(--text)', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                          {brl(entries[activeIndex].value)}
                        </span>
                        <span style={{ color: entries[activeIndex].color, fontSize: 10, fontWeight: 700, marginTop: 1 }}>
                          {((entries[activeIndex].value / total) * 100).toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>total</span>
                        <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{brl(total)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Legenda em lista limpa */}
              <div className="flex flex-col" style={{ gap: 2 }}>
                {entries.map((e, i) => {
                  const pct = total > 0 ? (e.value / total) * 100 : 0
                  const isActive = activeIndex === null || activeIndex === i
                  return (
                    <div
                      key={e.name}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        opacity: isActive ? 1 : 0.3,
                        background: activeIndex === i ? `${e.color}0d` : 'transparent',
                        transition: 'all .15s',
                      }}
                    >
                      {/* Cor */}
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: e.color, flexShrink: 0,
                      }} />

                      {/* Nome */}
                      <span style={{ color: 'var(--text)', fontSize: 11, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {e.name}
                      </span>

                      {/* % */}
                      <span style={{ color: e.color, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>
                        {pct.toFixed(1)}%
                      </span>

                      {/* Valor */}
                      <span style={{ color: 'var(--dim)', fontSize: 10, fontFamily: 'monospace', flexShrink: 0, width: 76, textAlign: 'right' }}>
                        {brl(e.value)}
                      </span>
                    </div>
                  )
                })}
              </div>

            </div>
          )}
      </PanelBody>
    </Panel>
  )
}

// ── GRÁFICO DE BARRAS (sem alteração) ─────────────────────────────────────────
export function GraficoBarras({ data }: { data: ResumoMes[] }) {
  return (
    <Panel>
      <PanelHeader><Dot color="cyan" />Evolução Mensal</PanelHeader>
      <PanelBody className="min-h-[200px] flex items-center">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={5} barGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: 'var(--dim)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--dim)', fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
            <Tooltip
              formatter={(v: number, name: string) => [brl(v), name]}
              contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 11 }}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: 'var(--dim)' }} />
            <Bar dataKey="entradas"   name="Entradas"  fill="#00e676" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
            <Bar dataKey="saidas"     name="Saídas"    fill="#ff1744" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
            <Bar dataKey="investidos" name="Investido" fill="#ffd740" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </PanelBody>
    </Panel>
  )
}

export default GraficoPizza
