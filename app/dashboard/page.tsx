'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import Navbar from '../../components/layout/Navbar'
import TransacaoForm from '../../components/ui/TransacaoForm'
import TransacaoModal from '../../components/ui/TransacaoModal'
import FiltroPainel from '../../components/ui/FiltroPainel'
import SaldoCard from '../../components/ui/SaldoCard'
import GraficoPizza from '../../components/ui/GraficoPizza'
import GraficoBarras from '../../components/ui/GraficoBarras'
import TabelaTransacoes from '../../components/ui/TabelaTransacoes'
import MetasWidget from '../../components/ui/MetasWidget'
import { SummaryCard, Spinner, Dot } from '../../components/ui'
import { getTransacoes, getMetas, getConfig, saveConfig } from '../../lib/db'
import {
  filtrarTransacoes, calcularSaldoAcumulado, calcularEvolucao,
  ultimoDiaDoMes, hoje, brl, MESES,
} from '../../lib/utils'
import type { Transacao, Meta, Config } from '../../types'
import { TrendingDown, TrendingUp, BarChart2 } from 'lucide-react'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Data
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [metas, setMetas]           = useState<Meta[]>([])
  const [config, setConfig]         = useState<Config>({ ajusteSaldo: 0, modoSaldo: 'mes' })
  const [fetching, setFetching]     = useState(true)

  // Filters
  const now = new Date()
  const [ano, setAno]           = useState(String(now.getFullYear()))
  const [mes, setMes]           = useState(String(now.getMonth() + 1))
  const [categoria, setCategoria] = useState('')

  // Edit modal
  const [editando, setEditando] = useState<Transacao | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  const load = useCallback(async () => {
    if (!user) return
    setFetching(true)
    const [t, m, c] = await Promise.all([
      getTransacoes(user.uid),
      getMetas(user.uid),
      getConfig(user.uid),
    ])
    setTransacoes(t)
    setMetas(m)
    setConfig(c)
    setFetching(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Filtered transactions
  const gastosFiltrados = useMemo(
    () => filtrarTransacoes(transacoes, ano, mes, categoria),
    [transacoes, ano, mes, categoria]
  )

  // Summary
  const entradas   = useMemo(() => gastosFiltrados.filter(t => t.tipo === 'Entrada').reduce((s, t) => s + t.valor, 0), [gastosFiltrados])
  const saidas     = useMemo(() => gastosFiltrados.filter(t => t.tipo === 'Saída').reduce((s, t) => s + t.valor, 0), [gastosFiltrados])
  const investidos = useMemo(() => gastosFiltrados.filter(t => t.tipo === 'Investido').reduce((s, t) => s + t.valor, 0), [gastosFiltrados])

  // Saldo acumulado
  const ehMesAtual = mes === String(now.getMonth() + 1) && ano === String(now.getFullYear())
  const dataCorte  = config.modoSaldo === 'hoje' && ehMesAtual
    ? hoje()
    : ultimoDiaDoMes(ano, mes.padStart(2, '0'))

  const saldo = useMemo(
    () => calcularSaldoAcumulado(transacoes, dataCorte, config.ajusteSaldo),
    [transacoes, dataCorte, config.ajusteSaldo]
  )

  // Saldo mês anterior
  const saldoMesAnterior = useMemo(() => {
    let ma = parseInt(mes) - 1, aa = parseInt(ano)
    if (ma === 0) { ma = 12; aa-- }
    const corte = ultimoDiaDoMes(String(aa), String(ma).padStart(2, '0'))
    return calcularSaldoAcumulado(transacoes, corte, config.ajusteSaldo)
  }, [transacoes, mes, ano, config.ajusteSaldo])

  // Chart data
  const evolucao   = useMemo(() => calcularEvolucao(transacoes, ano), [transacoes, ano])
  const gastosCat  = useMemo(() => {
    const m: Record<string, number> = {}
    gastosFiltrados.filter(t => t.tipo === 'Saída').forEach(t => { m[t.categoria] = (m[t.categoria] || 0) + t.valor })
    return m
  }, [gastosFiltrados])

  // Metas status
  const mesChave   = `${ano}-${mes.padStart(2, '0')}`
  const metasMes   = metas.filter(m => m.mes === mesChave)

  // Categories list
  const categorias = useMemo(() => Array.from(new Set(transacoes.map(t => t.categoria))).sort(), [transacoes])
  const anos       = useMemo(() => {
    const s = new Set(transacoes.map(t => t.data.slice(0, 4)))
    const arr = Array.from(s).sort()
    if (!arr.includes(String(now.getFullYear()))) arr.push(String(now.getFullYear()))
    return arr
  }, [transacoes, now])

  // Default date for form
  const defaultData = useMemo(() => {
    const d = new Date()
    if (mes && parseInt(mes) !== (now.getMonth() + 1)) {
      return `${ano}-${mes.padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    return hoje()
  }, [mes, ano, now])

  async function handleSaveConfig(c: Partial<Config>) {
    if (!user) return
    const next = { ...config, ...c }
    setConfig(next)
    await saveConfig(user.uid, c)
  }

  if (loading) return <Spinner />
  if (!user) return null   // redirect em andamento, não mostra spinner
  if (fetching) return <Spinner />

  return (
    <div className="relative z-10">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 py-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Entradas" value={brl(entradas)} accent="var(--green)"
            icon={<TrendingDown />} />
          <SummaryCard label="Saídas" value={brl(saidas)} accent="var(--red)"
            icon={<TrendingUp />} />
          <SummaryCard label="Investido" value={brl(investidos)} accent="var(--gold)"
            icon={<BarChart2 />} />
          <SaldoCard
            saldo={saldo}
            saldoMesAnterior={saldoMesAnterior}
            config={config}
            ehMesAtual={ehMesAtual}
            dataCorte={dataCorte}
            filtroAno={ano}
            filtroMes={mes}
            onSaveConfig={handleSaveConfig}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-[280px_1fr] gap-5">

          {/* Left */}
          <div className="flex flex-col gap-4">
            <TransacaoForm
              uid={user!.uid}
              categorias={categorias}
              defaultData={defaultData}
              filtroAno={ano}
              filtroMes={mes}
              onSaved={load}
            />
            <FiltroPainel
              ano={ano} setAno={setAno}
              mes={mes} setMes={setMes}
              categoria={categoria} setCategoria={setCategoria}
              anos={anos} categorias={categorias}
            />
            {metasMes.length > 0 && (
              <MetasWidget metas={metasMes} gastosCat={gastosCat} />
            )}
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <GraficoPizza data={gastosCat} />
              <GraficoBarras data={evolucao} />
            </div>
            <TabelaTransacoes
              transacoes={gastosFiltrados}
              filtroAno={ano}
              filtroMes={mes}
              onDelete={load}
              onEdit={t => setEditando(t)}
              uid={user!.uid}
            />
          </div>
        </div>
      </main>

      {editando && (
        <TransacaoModal
          transacao={editando}
          uid={user!.uid}
          categorias={categorias}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); load() }}
        />
      )}
    </div>
  )
}
