import { format, getDaysInMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Transacao, ResumoMes } from '../types'

// ── FORMATAÇÃO ────────────────────────────────────────────────────────────────

export function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtData(data: string): string {
  try { return format(parseISO(data), 'dd/MM/yyyy') } catch { return data }
}

export function mesLabel(mes: number): string {
  return format(new Date(2024, mes - 1, 1), 'MMM', { locale: ptBR })
}

export const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

// ── CÁLCULOS ─────────────────────────────────────────────────────────────────

export function filtrarTransacoes(
  transacoes: Transacao[],
  ano: string,
  mes: string,
  categoria: string
): Transacao[] {
  return transacoes.filter(t => {
    if (!t.data.startsWith(ano)) return false
    if (mes && parseInt(t.data.slice(5, 7)) !== parseInt(mes)) return false
    if (categoria && t.categoria !== categoria) return false
    return true
  })
}

export function calcularSaldoAcumulado(
  transacoes: Transacao[],
  ate: string,
  ajuste: number
): number {
  const adj = isNaN(Number(ajuste)) ? 0 : Number(ajuste)
  const filtradas = transacoes.filter(t => t.data <= ate)
  const toNum = (v: unknown) => isNaN(Number(v)) ? 0 : Number(v)
  const ent = filtradas.filter(t => t.tipo === 'Entrada').reduce((s, t) => s + toNum(t.valor), 0)
  const sai = filtradas.filter(t => t.tipo === 'Saída').reduce((s, t) => s + toNum(t.valor), 0)
  const inv = filtradas.filter(t => t.tipo === 'Investido').reduce((s, t) => s + toNum(t.valor), 0)
  return adj + ent - sai - inv
}

export function calcularEvolucao(transacoes: Transacao[], ano: string): ResumoMes[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    const prefix = `${ano}-${m}`
    const dm = transacoes.filter(t => t.data.startsWith(prefix))
    return {
      mes:        mesLabel(i + 1),
      entradas:   dm.filter(t => t.tipo === 'Entrada').reduce((s, t) => s + t.valor, 0),
      saidas:     dm.filter(t => t.tipo === 'Saída').reduce((s, t) => s + t.valor, 0),
      investidos: dm.filter(t => t.tipo === 'Investido').reduce((s, t) => s + t.valor, 0),
    }
  })
}

export function hoje(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function ultimoDiaDoMes(ano: string, mes: string): string {
  const d = getDaysInMonth(new Date(parseInt(ano), parseInt(mes) - 1))
  return `${ano}-${mes.padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export const ATIVOS = {
  'Renda Fixa':     ['CDB', 'Tesouro Direto', 'LCI / LCA', 'Poupança', 'Outro RF'],
  'Renda Variável': ['Ações', 'Fundos Imobiliários (FII)', 'ETF', 'BDR', 'Criptomoedas', 'Outro RV'],
}
