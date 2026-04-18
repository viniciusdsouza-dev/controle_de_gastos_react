'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Panel, PanelHeader, PanelBody, Dot, EmptyState } from './index'
import { brl } from '../../lib/utils'
import type { ResumoMes } from '../../types'
import { PieChart as PieIcon, BarChart2 } from 'lucide-react'

const PALETTE = ['#00e5ff','#e040fb','#00e676','#ff1744','#ffd740','#448aff','#f48fb1','#a5d6a7','#80cbc4','#ce93d8']

// ── PIZZA ─────────────────────────────────────────────────────────────────────
export function GraficoPizza({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).map(([name, value]) => ({ name, value }))

  return (
    <Panel>
      <PanelHeader><Dot color="pink" />Por Categoria</PanelHeader>
      <PanelBody className="flex items-center justify-center min-h-[200px]">
        {entries.length === 0
          ? <EmptyState icon={<PieIcon />} text="Sem saídas no período" />
          : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={entries} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={2}>
                  {entries.map((_, i) => (
                    <Cell key={i}
                      fill={PALETTE[i % PALETTE.length] + '33'}
                      stroke={PALETTE[i % PALETTE.length]}
                      strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => brl(v)}
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 11 }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: 'var(--dim)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
      </PanelBody>
    </Panel>
  )
}

// ── BARRAS ────────────────────────────────────────────────────────────────────
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
              tickFormatter={v => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip
              formatter={(v: number, name: string) => [brl(v), name]}
              contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 11 }}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: 'var(--dim)' }} />
            <Bar dataKey="entradas"   name="Entradas"  fill="#00e676" radius={[3,3,0,0]} fillOpacity={0.8} />
            <Bar dataKey="saidas"     name="Saídas"    fill="#ff1744" radius={[3,3,0,0]} fillOpacity={0.8} />
            <Bar dataKey="investidos" name="Investido" fill="#ffd740" radius={[3,3,0,0]} fillOpacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </PanelBody>
    </Panel>
  )
}

export default GraficoPizza
