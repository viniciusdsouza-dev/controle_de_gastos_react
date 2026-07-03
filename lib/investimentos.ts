// Motor de cálculo de rendimento com suporte a aportes e resgates parciais
import type { InvestimentoPosition, Aporte, Resgate } from '../types'

// ── HELPERS ───────────────────────────────────────────────────────────────────

export function mesesEntre(dataInicio: string, dataFim: string): number {
  const i = new Date(dataInicio + 'T12:00:00')
  const f = new Date(dataFim   + 'T12:00:00')
  return (f.getFullYear() - i.getFullYear()) * 12 + (f.getMonth() - i.getMonth())
    + (f.getDate() - i.getDate()) / 30
}

export function taxaAnualParaMensal(anual: number): number {
  return (Math.pow(1 + anual / 100, 1 / 12) - 1) * 100
}

export function taxaMensalParaAnual(mensal: number): number {
  return (Math.pow(1 + mensal / 100, 12) - 1) * 100
}

// ── SNAPSHOT (com resgates) ────────────────────────────────────────────────────

export interface SnapshotInvestimento {
  totalAportado:   number  // soma histórica de aportes
  totalResgatado:  number  // soma de tudo que já foi retirado
  valorAtual:      number  // saldo renderizado até dataRef (após resgates)
  rendimentoTotal: number  // lucro real = (saldo + resgatado) - aportado
  rendimentoPct:   number  // % de rendimento sobre o total aportado
}

type Evento =
  | { tipo: 'aporte';  data: string; valor: number }
  | { tipo: 'resgate'; data: string; valor: number }

/**
 * Simula a carteira cronologicamente:
 * - Aportes somam ao saldo corrente
 * - Resgates debitam do saldo (limitado ao saldo disponível)
 * - Entre eventos, o saldo rende pela taxa mensal da position
 */
export function calcularSnapshot(
  position: InvestimentoPosition,
  aportes: Aporte[],
  dataRef: string,
  resgates: Resgate[] = []
): SnapshotInvestimento {
  const taxaMensal = position.taxaMensal / 100

  const eventos: Evento[] = [
    ...aportes.filter(a => a.data <= dataRef)
      .map(a => ({ tipo: 'aporte'  as const, data: a.data, valor: a.valor })),
    ...resgates.filter(r => r.data <= dataRef)
      .map(r => ({ tipo: 'resgate' as const, data: r.data, valor: r.valor })),
  ].sort((a, b) => a.data.localeCompare(b.data) || (a.tipo === 'aporte' ? -1 : 1))

  if (eventos.length === 0)
    return { totalAportado: 0, totalResgatado: 0, valorAtual: 0, rendimentoTotal: 0, rendimentoPct: 0 }

  let saldo              = 0
  let totalAportado      = 0
  let totalResgatado     = 0
  let dataAnterior       = eventos[0].data

  for (const ev of eventos) {
    // Rende o saldo entre o evento anterior e este
    const meses = Math.max(0, mesesEntre(dataAnterior, ev.data))
    if (meses > 0) saldo *= Math.pow(1 + taxaMensal, meses)

    if (ev.tipo === 'aporte') {
      saldo         += ev.valor
      totalAportado += ev.valor
    } else {
      const sacado    = Math.min(ev.valor, saldo)
      saldo          -= sacado
      totalResgatado += sacado
    }

    dataAnterior = ev.data
  }

  // Rende o saldo final até dataRef
  const mesesFinal = Math.max(0, mesesEntre(dataAnterior, dataRef))
  if (mesesFinal > 0) saldo *= Math.pow(1 + taxaMensal, mesesFinal)

  const rendimentoTotal = (saldo + totalResgatado) - totalAportado
  const rendimentoPct   = totalAportado > 0 ? (rendimentoTotal / totalAportado) * 100 : 0

  return { totalAportado, totalResgatado, valorAtual: saldo, rendimentoTotal, rendimentoPct }
}

// ── PROJEÇÃO ──────────────────────────────────────────────────────────────────

export interface PontoProjecao {
  label:         string
  valorAportado: number
  valorTotal:    number
  rendimento:    number
}

export function calcularProjecao(
  position: InvestimentoPosition,
  aportes: Aporte[],
  mesesFuturos: number,
  dataBase?: string,
  resgates: Resgate[] = []
): PontoProjecao[] {
  const base = dataBase ? new Date(dataBase + 'T12:00:00') : new Date()
  const pontos: PontoProjecao[] = []

  for (let i = 0; i <= mesesFuturos; i++) {
    const d = new Date(base)
    d.setMonth(d.getMonth() + i)
    const dataRef = d.toISOString().slice(0, 10)
    const snap    = calcularSnapshot(position, aportes, dataRef, resgates)

    pontos.push({
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      valorAportado: snap.totalAportado - snap.totalResgatado,
      valorTotal:    snap.valorAtual,
      rendimento:    snap.rendimentoTotal,
    })
  }

  return pontos
}

export function fmtTaxa(v: number, decimais = 2): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais }) + '%'
}
