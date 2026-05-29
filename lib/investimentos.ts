// Lógica de cálculo de rendimento por juros compostos
import type { InvestimentoPosition, Aporte } from '../types'

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Meses entre duas datas (fracionado) */
export function mesesEntre(dataInicio: string, dataFim: string): number {
  const i = new Date(dataInicio + 'T12:00:00')
  const f = new Date(dataFim   + 'T12:00:00')
  return (f.getFullYear() - i.getFullYear()) * 12 + (f.getMonth() - i.getMonth())
    + (f.getDate() - i.getDate()) / 30
}

/** Taxa mensal a partir da taxa anual (equivalente) */
export function taxaAnualParaMensal(anual: number): number {
  return (Math.pow(1 + anual / 100, 1 / 12) - 1) * 100
}

/** Taxa anual a partir da taxa mensal */
export function taxaMensalParaAnual(mensal: number): number {
  return (Math.pow(1 + mensal / 100, 12) - 1) * 100
}

// ── CÁLCULO PRINCIPAL ─────────────────────────────────────────────────────────

export interface SnapshotInvestimento {
  totalAportado:   number   // soma de todos os aportes
  valorAtual:      number   // valor com rendimento até dataRef
  rendimentoTotal: number   // valorAtual - totalAportado
  rendimentoPct:   number   // % de rendimento sobre o aportado
}

/**
 * Calcula o valor atual de uma position com juros compostos,
 * considerando múltiplos aportes em datas distintas.
 *
 * Cada aporte rende de forma independente desde sua data até dataRef.
 */
export function calcularSnapshot(
  position: InvestimentoPosition,
  aportes: Aporte[],
  dataRef: string   // YYYY-MM-DD — "hoje" ou data futura para projeção
): SnapshotInvestimento {
  const taxaMensal = position.taxaMensal / 100  // ex: 0.0098

  let totalAportado = 0
  let valorAtual    = 0

  for (const a of aportes) {
    if (a.data > dataRef) continue   // aporte ainda não ocorreu
    const meses = Math.max(0, mesesEntre(a.data, dataRef))
    totalAportado += a.valor
    valorAtual    += a.valor * Math.pow(1 + taxaMensal, meses)
  }

  const rendimentoTotal = valorAtual - totalAportado
  const rendimentoPct   = totalAportado > 0 ? (rendimentoTotal / totalAportado) * 100 : 0

  return { totalAportado, valorAtual, rendimentoTotal, rendimentoPct }
}

/** Projeção mês a mês de uma position (para gráfico) */
export interface PontoProjecao {
  label:         string   // "Jun/25"
  valorAportado: number
  valorTotal:    number
  rendimento:    number
}

export function calcularProjecao(
  position: InvestimentoPosition,
  aportes: Aporte[],
  mesesFuturos: number,
  dataBase?: string
): PontoProjecao[] {
  const base = dataBase ? new Date(dataBase + 'T12:00:00') : new Date()
  const pontos: PontoProjecao[] = []

  for (let i = 0; i <= mesesFuturos; i++) {
    const d = new Date(base)
    d.setMonth(d.getMonth() + i)
    const dataRef = d.toISOString().slice(0, 10)
    const snap    = calcularSnapshot(position, aportes, dataRef)

    pontos.push({
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      valorAportado: snap.totalAportado,
      valorTotal:    snap.valorAtual,
      rendimento:    snap.rendimentoTotal,
    })
  }

  return pontos
}

/** Formata taxa: 0.9800 → "0,98%" */
export function fmtTaxa(v: number, decimais = 2): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais }) + '%'
}
