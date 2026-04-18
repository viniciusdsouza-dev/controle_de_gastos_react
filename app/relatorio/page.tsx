'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import Navbar from '../../components/layout/Navbar'
import { Panel, PanelHeader, PanelBody, Dot, Label, Select, Badge, BadgeCat, BtnOutline, SummaryCard, Spinner, EmptyState } from '../../components/ui'
import { getTransacoes, getConfig } from '../../lib/db'
import { filtrarTransacoes, calcularSaldoAcumulado, ultimoDiaDoMes, brl, fmtData, MESES } from '../../lib/utils'
import type { Transacao } from '../../types'
import { Download, Inbox, TrendingDown, TrendingUp, BarChart2 } from 'lucide-react'

export default function RelatorioPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [ajuste, setAjuste]         = useState(0)
  const [fetching, setFetching]     = useState(true)

  const now = new Date()
  const [ano, setAno] = useState(String(now.getFullYear()))
  const [mes, setMes] = useState(String(now.getMonth() + 1))

  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading, router])

  const load = useCallback(async () => {
    if (!user) return
    setFetching(true)
    const [t, c] = await Promise.all([getTransacoes(user.uid), getConfig(user.uid)])
    setTransacoes(t)
    setAjuste(c.ajusteSaldo)
    setFetching(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const filtradas = useMemo(() => filtrarTransacoes(transacoes, ano, mes, ''), [transacoes, ano, mes])

  const entradas   = useMemo(() => filtradas.filter(t => t.tipo === 'Entrada').reduce((s, t) => s + t.valor, 0), [filtradas])
  const saidas     = useMemo(() => filtradas.filter(t => t.tipo === 'Saída').reduce((s, t) => s + t.valor, 0), [filtradas])
  const investidos = useMemo(() => filtradas.filter(t => t.tipo === 'Investido').reduce((s, t) => s + t.valor, 0), [filtradas])
  const saldo      = useMemo(() => calcularSaldoAcumulado(transacoes, ultimoDiaDoMes(ano, mes.padStart(2,'0')), ajuste), [transacoes, ano, mes, ajuste])

  const resumoCat = useMemo(() => {
    const m: Record<string, { tipo: string; subtipo: string; valor: number }> = {}
    filtradas.forEach(t => {
      const k = `${t.tipo}||${t.subtipo||''}||${t.categoria}`
      if (!m[k]) m[k] = { tipo: t.tipo, subtipo: t.subtipo || '', valor: 0 }
      m[k].valor += t.valor
    })
    return Object.entries(m).map(([k, v]) => ({ ...v, categoria: k.split('||')[2] }))
      .sort((a, b) => a.tipo.localeCompare(b.tipo))
  }, [filtradas])

  const anos = useMemo(() => {
    const s = new Set(transacoes.map(t => t.data.slice(0, 4)))
    return [...s].sort()
  }, [transacoes])

  function exportCSV() {
    const rows = [['data','tipo','subtipo','valor','categoria','descricao']]
    filtradas.forEach(t => rows.push([t.data, t.tipo, t.subtipo, String(t.valor), t.categoria, t.descricao]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `gastos_${ano}_${mes}.csv`
    a.click()
  }

  if (loading || fetching) return <Spinner />

  return (
    <div className="relative z-10">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--dim)' }}>Análise</p>
            <h1 className="text-2xl font-bold">Relatório Detalhado</h1>
          </div>
          <BtnOutline onClick={exportCSV} color="cyan"><Download size={12} /> Exportar CSV</BtnOutline>
        </div>

        {/* Filtros */}
        <Panel className="mb-5">
          <PanelBody className="flex gap-4 flex-wrap">
            <div>
              <Label>Ano</Label>
              <Select value={ano} onChange={e => setAno(e.target.value)} style={{ width: 100 }}>
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
            <div>
              <Label>Mês</Label>
              <Select value={mes} onChange={e => setMes(e.target.value)} style={{ width: 140 }}>
                <option value="">Todos</option>
                {MESES.map((m, i) => <option key={i} value={String(i+1)}>{m}</option>)}
              </Select>
            </div>
          </PanelBody>
        </Panel>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <SummaryCard label="Entradas"  value={brl(entradas)}   accent="var(--green)" icon={<TrendingDown />} />
          <SummaryCard label="Saídas"    value={brl(saidas)}     accent="var(--red)"   icon={<TrendingUp />} />
          <SummaryCard label="Investido" value={brl(investidos)} accent="var(--gold)"  icon={<BarChart2 />} />
          <SummaryCard label="Saldo"     value={brl(saldo)}      accent={saldo >= 0 ? 'var(--cyan)' : '#ff9800'} />
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Por categoria */}
          <Panel>
            <PanelHeader><Dot color="pink" />Por Categoria</PanelHeader>
            <div className="overflow-x-auto">
              {resumoCat.length === 0
                ? <PanelBody><EmptyState icon={<Inbox />} text="Sem transações" /></PanelBody>
                : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Tipo','Subtipo','Categoria','Total'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resumoCat.map((r, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-4 py-3"><Badge tipo={r.tipo} /></td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{r.subtipo || '—'}</td>
                          <td className="px-4 py-3"><BadgeCat>{r.categoria}</BadgeCat></td>
                          <td className="px-4 py-3 font-mono font-bold"
                            style={{ color: r.tipo === 'Entrada' ? 'var(--green)' : r.tipo === 'Investido' ? 'var(--gold)' : 'var(--red)' }}>
                            {brl(r.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </Panel>

          {/* Todas transações */}
          <Panel>
            <PanelHeader><Dot color="cyan" />Transações</PanelHeader>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              {filtradas.length === 0
                ? <PanelBody><EmptyState icon={<Inbox />} text="Sem transações no período" /></PanelBody>
                : (
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0" style={{ background: 'var(--surface)' }}>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Data','Tipo','Categoria','Valor'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map(t => (
                        <tr key={t.id} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--dim)' }}>{fmtData(t.data)}</td>
                          <td className="px-4 py-3"><Badge tipo={t.tipo} /></td>
                          <td className="px-4 py-3"><BadgeCat>{t.categoria}</BadgeCat></td>
                          <td className="px-4 py-3 font-mono font-bold"
                            style={{ color: t.tipo === 'Entrada' ? 'var(--green)' : t.tipo === 'Investido' ? 'var(--gold)' : 'var(--red)' }}>
                            {brl(t.valor)}
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
