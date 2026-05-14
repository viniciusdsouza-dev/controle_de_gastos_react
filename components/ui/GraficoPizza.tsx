'use client'
import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Panel, PanelHeader, PanelBody, Dot, EmptyState } from './index'
import { brl } from '../../lib/utils'
import type { ResumoMes } from '../../types'
import { PieChart as PieIcon } from 'lucide-react'

const PALETTE = [
  '#00e5ff', '#e040fb', '#00e676', '#ff1744', '#ffd740',
  '#448aff', '#ff6d00', '#f48fb1', '#80cbc4', '#ce93d8',
]

// ── GRÁFICO DE PIZZA ──────────────────────────────────────────────────────────
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

              {/* Donut — sem Tooltip do recharts, info fica no centro */}
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
                        isAnimationActive={false}
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
                      {/* SEM <Tooltip> aqui — evita sobreposição */}
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Info no centro do donut */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    {activeIndex !== null ? (
                      <>
                        <span style={{
                          color: entries[activeIndex].color,
                          fontSize: 8, fontWeight: 700, letterSpacing: 1,
                          textTransform: 'uppercase', textAlign: 'center',
                          lineHeight: 1.3, maxWidth: 72, marginBottom: 4,
                        }}>
                          {entries[activeIndex].name}
                        </span>
                        <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                          {brl(entries[activeIndex].value)}
                        </span>
                        <span style={{ color: entries[activeIndex].color, fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                          {((entries[activeIndex].value / total) * 100).toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>
                          total
                        </span>
                        <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                          {brl(total)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {entries.map((e, i) => {
                  const pct = total > 0 ? (e.value / total) * 100 : 0
                  const isActive = activeIndex === null || activeIndex === i
                  return (
                    <div
                      key={e.name}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                        opacity: isActive ? 1 : 0.3,
                        background: activeIndex === i ? `${e.color}0d` : 'transparent',
                        transition: 'opacity .15s, background .15s',
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text)', fontSize: 11, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {e.name}
                      </span>
                      <span style={{ color: e.color, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0, width: 40, textAlign: 'right' }}>
                        {pct.toFixed(1)}%
                      </span>
                      <span style={{ color: 'var(--dim)', fontSize: 10, fontFamily: 'monospace', flexShrink: 0, width: 80, textAlign: 'right' }}>
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

// ── GRÁFICO DE BARRAS ─────────────────────────────────────────────────────────
const LEGEND_ITEMS = [
  { key: 'entradas',   label: 'Entradas',  color: '#00e676' },
  { key: 'saidas',     label: 'Saídas',    color: '#ff1744' },
  { key: 'investidos', label: 'Investido', color: '#ffd740' },
]

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,.5)',
      minWidth: 140,
    }}>
      <p style={{ color: 'var(--dim)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ color: p.color, fontSize: 10 }}>{p.name}</span>
          <span style={{ color: 'var(--text)', fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}>{brl(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function GraficoBarras({ data }: { data: ResumoMes[] }) {
  return (
    <Panel>
      <PanelHeader><Dot color="cyan" />Evolução Mensal</PanelHeader>
      <PanelBody>
        {/* Legenda manual no topo */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, paddingLeft: 4 }}>
          {LEGEND_ITEMS.map(l => (
            <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--dim)', fontSize: 10 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Gráfico — altura fixa e margens ajustadas */}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            barSize={6}
            barCategoryGap="30%"
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: 'var(--dim)', fontSize: 9 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--dim)', fontSize: 9 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
              width={40}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
            {LEGEND_ITEMS.map(l => (
              <Bar key={l.key} dataKey={l.key} name={l.label} fill={l.color}
                radius={[3, 3, 0, 0]} fillOpacity={0.85} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </PanelBody>
    </Panel>
  )
}

export default GraficoPizza
