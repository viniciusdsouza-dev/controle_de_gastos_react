'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import Navbar from '../../components/layout/Navbar'
import { Panel, PanelHeader, PanelBody, Dot, Label, Select, Badge, BadgeCat, BtnOutline, SummaryCard, Spinner, EmptyState } from '../../components/ui'
import { getTransacoes, getConfig } from '../../lib/db'
import { filtrarTransacoes, calcularSaldoAcumulado, ultimoDiaDoMes, brl, fmtData, MESES } from '../../lib/utils'
import { exportarXlsx } from '../../lib/exportXlsx'
import type { Transacao } from '../../types'
import { Download, Inbox, ArrowUp, ArrowDown, BarChart2, RefreshCw } from 'lucide-react'

export default function RelatorioPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [ajuste, setAjuste]         = useState(0)
  const [fetching, setFetching]     = useState(true)
  const [exporting, setExporting]   = useState(false)

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

  const filtradas  = useMemo(() => filtrarTransacoes(transacoes, ano, mes, ''), [transacoes, ano, mes])
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

  async function handleExport() {
    setExporting(true)
    await exportarXlsx(filtradas, { entradas, saidas, investidos, saldo }, ano, mes)
    setExporting(false)
  }

  if (loading || fetching) return <Spinner />

  return (
    <div className="relative z-10">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--dim)' }}>Análise</p>
            <h1 className="text-2xl font-bold">Relatório Detalhado</h1>
          </div>
          <BtnOutline onClick={handleExport} color="cyan" disabled={exporting}>
            <Download size={12} /> {exporting ? 'Gerando...' : 'Exportar XLSX'}
          </BtnOutline>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <SummaryCard label="Entradas"  value={brl(entradas)}   accent="var(--green)" icon={<ArrowUp />} />
          <SummaryCard label="Saídas"    value={brl(saidas)}     accent="var(--red)"   icon={<ArrowDown />} />
          <SummaryCard label="Investido" value={brl(investidos)} accent="var(--gold)"  icon={<BarChart2 />} />
          <SummaryCard label="Saldo"     value={brl(saldo)}      accent={saldo >= 0 ? 'var(--cyan)' : '#ff9800'} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Por categoria */}
          <Panel>
            <PanelHeader><Dot color="pink" />Por Categoria</PanelHeader>
            <div className="overflow-x-auto">
              {resumoCat.length === 0
                ? <PanelBody><EmptyState icon={<Inbox />} text="Sem transações" /></PanelBody>
                : (
                  <>
                    {/* Desktop */}
                    <table className="w-full border-collapse hidden sm:table">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Tipo','Categoria','Total'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resumoCat.map((r, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--border)' }}>
                            <td className="px-4 py-3"><Badge tipo={r.tipo} /></td>
                            <td className="px-4 py-3"><BadgeCat>{r.categoria}</BadgeCat></td>
                            <td className="px-4 py-3 font-mono font-bold"
                              style={{ color: r.tipo === 'Entrada' ? 'var(--green)' : r.tipo === 'Investido' ? 'var(--gold)' : 'var(--red)' }}>
                              {brl(r.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Mobile: cards */}
                    <div className="sm:hidden flex flex-col gap-2 p-3">
                      {resumoCat.map((r, i) => {
                        const cor = r.tipo === 'Entrada' ? 'var(--green)' : r.tipo === 'Investido' ? 'var(--gold)' : 'var(--red)'
                        return (
                          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                            <Badge tipo={r.tipo} />
                            <span className="flex-1 text-xs truncate" style={{ color: 'var(--text)' }}>{r.categoria}</span>
                            <span className="font-mono font-bold text-sm flex-shrink-0" style={{ color: cor }}>{brl(r.valor)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
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
                  <>
                    {/* Desktop */}
                    <table className="w-full border-collapse hidden sm:table">
                      <thead className="sticky top-0" style={{ background: 'var(--surface)' }}>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Data','Tipo','Categoria','Valor'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtradas.map(t => {
                          const cor = t.tipo === 'Entrada' ? 'var(--green)' : t.tipo === 'Investido' ? 'var(--gold)' : 'var(--red)'
                          return (
                            <tr key={t.id} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--border)' }}>
                              <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--dim)' }}>{fmtData(t.data)}</td>
                              <td className="px-4 py-3"><Badge tipo={t.tipo} /></td>
                              <td className="px-4 py-3"><BadgeCat>{t.categoria}</BadgeCat></td>
                              <td className="px-4 py-3 font-mono font-bold" style={{ color: cor }}>{brl(t.valor)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {/* Mobile: lista compacta */}
                    <div className="sm:hidden flex flex-col">
                      {filtradas.map(t => {
                        const cor = t.tipo === 'Entrada' ? 'var(--green)' : t.tipo === 'Investido' ? 'var(--gold)' : 'var(--red)'
                        return (
                          <div key={t.id} className="flex items-center gap-3 px-4 py-3"
                            style={{ borderBottom: '1px solid var(--border)' }}>
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cor }} />
                            <div className="flex-1 min-w-0">
                              <Badge tipo={t.tipo} />
                              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{t.categoria}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-mono font-bold text-sm" style={{ color: cor }}>{brl(t.valor)}</p>
                              <p className="text-xs" style={{ color: 'var(--muted)' }}>{fmtData(t.data)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  )
}
