// Exportação XLSX formatada usando SheetJS
// Roda apenas no browser (client-side)
import * as XLSX from 'xlsx'
import type { Transacao } from '../types'
import { brl, fmtData } from './utils'

const HEADER_BG   = '0F1923'
const HEADER_FG   = '00E5FF'
const BORDER_CLR  = '000000'
const WHITE        = 'FFFFFF'
const GREEN_FG    = '00E676'
const RED_FG      = 'FF1744'
const GOLD_FG     = 'FFD740'

function col(n: number) {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[n]
}
function ref(c: number, r: number) { return col(c) + r }

function border() {
  const s = { style: 'thin', color: { rgb: BORDER_CLR } }
  return { top: s, bottom: s, left: s, right: s }
}

function hdrStyle() {
  return {
    fill:      { patternType: 'solid', fgColor: { rgb: HEADER_BG } },
    font:      { bold: true, color: { rgb: HEADER_FG }, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    border(),
  }
}

function dataStyle(color = '111111', right = false) {
  return {
    fill:      { patternType: 'solid', fgColor: { rgb: WHITE } },
    font:      { color: { rgb: color }, sz: 10 },
    alignment: { horizontal: right ? 'right' : 'left', vertical: 'center' },
    border:    border(),
  }
}

function tipoColor(tipo: string) {
  if (tipo === 'Entrada')   return GREEN_FG
  if (tipo === 'Investido') return GOLD_FG
  return RED_FG
}

function cell(v: string | number, t: 's' | 'n', s: object, numFmt?: string) {
  return numFmt ? { v, t, s, z: numFmt } : { v, t, s }
}

export function exportarXlsx(
  transacoes: Transacao[],
  resumo: { entradas: number; saidas: number; investidos: number; saldo: number },
  filtroAno: string,
  filtroMes: string
) {
  const wb = XLSX.utils.book_new()

  // ── ABA 1: TRANSAÇÕES ────────────────────────────────────────────────────
  const ws: XLSX.WorkSheet = {}

  // Título
  const titulo = `Relatório de Transações — ${filtroMes ? filtroMes + '/' : ''}${filtroAno}`
  ws['A1'] = cell(titulo, 's', {
    fill:      { patternType: 'solid', fgColor: { rgb: HEADER_BG } },
    font:      { bold: true, color: { rgb: HEADER_FG }, sz: 13 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    border(),
  })

  // Cabeçalhos
  const headers = ['Data', 'Tipo', 'Subtipo', 'Categoria', 'Descrição', 'Valor (R$)', 'Parcela']
  headers.forEach((h, ci) => { ws[ref(ci, 2)] = cell(h, 's', hdrStyle()) })

  // Dados
  transacoes.forEach((t, ri) => {
    const row = ri + 3
    const cor = tipoColor(t.tipo)
    const parcela = t.recorrente && t.parcelaNumero && t.mesesRecorrencia
      ? `${t.parcelaNumero}/${t.mesesRecorrencia || '∞'}`
      : t.recorrente ? 'Recorrente' : '—'

    ws[ref(0, row)] = cell(fmtData(t.data),   's', dataStyle())
    ws[ref(1, row)] = cell(t.tipo,              's', dataStyle(cor))
    ws[ref(2, row)] = cell(t.subtipo || '—',   's', dataStyle())
    ws[ref(3, row)] = cell(t.categoria,         's', dataStyle())
    ws[ref(4, row)] = cell(t.descricao || '—', 's', dataStyle())
    ws[ref(5, row)] = cell(t.valor,             'n', dataStyle(cor, true), 'R$ #,##0.00')
    ws[ref(6, row)] = cell(parcela,             's', dataStyle())
  })

  const lastData = transacoes.length + 2

  // Totais
  const totais = [
    { label: 'Entradas',   valor: resumo.entradas,   cor: GREEN_FG },
    { label: 'Saídas',     valor: resumo.saidas,     cor: RED_FG },
    { label: 'Investido',  valor: resumo.investidos, cor: GOLD_FG },
    { label: 'Saldo',      valor: resumo.saldo,      cor: resumo.saldo >= 0 ? GREEN_FG : RED_FG },
  ]
  totais.forEach(({ label, valor, cor }, i) => {
    const row = lastData + 2 + i
    for (let c = 0; c < 5; c++) ws[ref(c, row)] = cell('', 's', hdrStyle())
    ws[ref(4, row)] = cell(label, 's', { ...hdrStyle(), font: { bold: true, color: { rgb: cor }, sz: 10 } })
    ws[ref(5, row)] = cell(valor, 'n', {
      fill:      { patternType: 'solid', fgColor: { rgb: HEADER_BG } },
      font:      { bold: true, color: { rgb: cor }, sz: 10 },
      alignment: { horizontal: 'right', vertical: 'center' },
      border:    border(),
    }, 'R$ #,##0.00')
    ws[ref(6, row)] = cell('', 's', hdrStyle())
  })

  const totalRows = lastData + 5
  ws['!ref']    = `A1:G${totalRows}`
  ws['!cols']   = [{ wch: 13 }, { wch: 11 }, { wch: 14 }, { wch: 24 }, { wch: 30 }, { wch: 16 }, { wch: 12 }]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]

  XLSX.utils.book_append_sheet(wb, ws, 'Transações')

  // ── ABA 2: POR CATEGORIA ─────────────────────────────────────────────────
  const catMap: Record<string, { tipo: string; subtipo: string; valor: number }> = {}
  transacoes.forEach(t => {
    const k = `${t.tipo}||${t.subtipo || ''}||${t.categoria}`
    if (!catMap[k]) catMap[k] = { tipo: t.tipo, subtipo: t.subtipo || '', valor: 0 }
    catMap[k].valor += t.valor
  })

  const ws2: XLSX.WorkSheet = {}
  ws2['A1'] = cell('Resumo por Categoria', 's', {
    fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } },
    font: { bold: true, color: { rgb: HEADER_FG }, sz: 13 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: border(),
  })
  ws2['B1'] = cell('', 's', { fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } }, border: border() })
  ws2['C1'] = cell('', 's', { fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } }, border: border() })

  ;['Tipo', 'Categoria', 'Total (R$)'].forEach((h, ci) => { ws2[ref(ci, 2)] = cell(h, 's', hdrStyle()) })

  const entries = Object.entries(catMap).sort(([a], [b]) => a.localeCompare(b))
  entries.forEach(([k, v], ri) => {
    const row = ri + 3
    const cor = tipoColor(v.tipo)
    ws2[ref(0, row)] = cell(v.tipo,             's', dataStyle(cor))
    ws2[ref(1, row)] = cell(k.split('||')[2],   's', dataStyle())
    ws2[ref(2, row)] = cell(v.valor,            'n', dataStyle(cor, true), 'R$ #,##0.00')
  })

  ws2['!ref']    = `A1:C${entries.length + 3}`
  ws2['!cols']   = [{ wch: 12 }, { wch: 28 }, { wch: 16 }]
  ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]

  XLSX.utils.book_append_sheet(wb, ws2, 'Por Categoria')

  // Download
  const nomeMes = filtroMes ? `_${filtroMes.padStart(2, '0')}` : ''
  XLSX.writeFile(wb, `gastos_${filtroAno}${nomeMes}.xlsx`)
}
