// Exportação XLSX formatada usando a biblioteca xlsx (SheetJS)
// Cabeçalho nas cores do site (dark + cyan), linhas brancas com borda preta
import type { Transacao } from '../types'
import { brl, fmtData } from './utils'

// Cor primária do site (surface escuro + cyan accent)
const HEADER_BG  = '0F1923'  // var(--surface) aproximado
const HEADER_FG  = '00E5FF'  // var(--cyan)
const BORDER_COLOR = '000000'
const WHITE        = 'FFFFFF'
const GREEN_FG     = '00E676'
const RED_FG       = 'FF1744'
const GOLD_FG      = 'FFD740'

type WorksheetCell = {
  v: string | number
  t: 's' | 'n'
  s?: Record<string, unknown>
}

type Worksheet = {
  [key: string]: WorksheetCell | { v: number; t: 'n' } | unknown
  '!ref'?: string
  '!cols'?: { wch: number }[]
  '!merges'?: unknown[]
}

function cellRef(col: number, row: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return letters[col] + row
}

function border() {
  return {
    top:    { style: 'thin', color: { rgb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
    left:   { style: 'thin', color: { rgb: BORDER_COLOR } },
    right:  { style: 'thin', color: { rgb: BORDER_COLOR } },
  }
}

function headerStyle() {
  return {
    fill:      { patternType: 'solid', fgColor: { rgb: HEADER_BG } },
    font:      { bold: true, color: { rgb: HEADER_FG }, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    border(),
  }
}

function dataStyle(color?: string) {
  return {
    fill:      { patternType: 'solid', fgColor: { rgb: WHITE } },
    font:      { color: { rgb: color || '111111' }, sz: 10 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border:    border(),
  }
}

function dataStyleRight(color?: string) {
  return {
    ...dataStyle(color),
    alignment: { horizontal: 'right', vertical: 'center' },
  }
}

function tipoColor(tipo: string): string {
  if (tipo === 'Entrada')   return GREEN_FG
  if (tipo === 'Investido') return GOLD_FG
  return RED_FG
}

export async function exportarXlsx(
  transacoes: Transacao[],
  resumo: { entradas: number; saidas: number; investidos: number; saldo: number },
  filtroAno: string,
  filtroMes: string
) {
  // Import dinâmico para não quebrar SSR
  const XLSX = await import('xlsx')

  const wb = XLSX.utils.book_new()

  // ── ABA 1: TRANSAÇÕES ──────────────────────────────────────────────────────
  const headers = ['Data', 'Tipo', 'Subtipo', 'Categoria', 'Descrição', 'Valor (R$)', 'Parcela']
  const ws: Worksheet = {}

  // Título mesclado
  const titulo = `Relatório de Transações — ${filtroMes ? filtroMes + '/' : ''}${filtroAno}`
  ws['A1'] = {
    v: titulo,
    t: 's',
    s: {
      fill:      { patternType: 'solid', fgColor: { rgb: HEADER_BG } },
      font:      { bold: true, color: { rgb: HEADER_FG }, sz: 13 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    border(),
    }
  }

  // Cabeçalhos na linha 2
  headers.forEach((h, ci) => {
    ws[cellRef(ci, 2)] = { v: h, t: 's', s: headerStyle() }
  })

  // Dados a partir da linha 3
  transacoes.forEach((t, ri) => {
    const row = ri + 3
    const cor = tipoColor(t.tipo)
    const parcelaLabel = t.recorrente && t.parcelaNumero && t.mesesRecorrencia
      ? `${t.parcelaNumero}/${t.mesesRecorrencia || '∞'}`
      : t.recorrente ? 'Recorrente' : '—'

    ws[cellRef(0, row)] = { v: fmtData(t.data),       t: 's', s: dataStyle() }
    ws[cellRef(1, row)] = { v: t.tipo,                 t: 's', s: dataStyle(cor) }
    ws[cellRef(2, row)] = { v: t.subtipo || '—',       t: 's', s: dataStyle() }
    ws[cellRef(3, row)] = { v: t.categoria,            t: 's', s: dataStyle() }
    ws[cellRef(4, row)] = { v: t.descricao || '—',     t: 's', s: dataStyle() }
    ws[cellRef(5, row)] = { v: t.valor,                t: 'n', s: { ...dataStyleRight(cor), numFmt: 'R$ #,##0.00' } }
    ws[cellRef(6, row)] = { v: parcelaLabel,            t: 's', s: dataStyle() }
  })

  const lastRow = transacoes.length + 3

  // Linha de totais
  const totalRow = lastRow
  ws[cellRef(0, totalRow)] = { v: 'TOTAL',       t: 's', s: headerStyle() }
  ws[cellRef(1, totalRow)] = { v: '',            t: 's', s: headerStyle() }
  ws[cellRef(2, totalRow)] = { v: '',            t: 's', s: headerStyle() }
  ws[cellRef(3, totalRow)] = { v: '',            t: 's', s: headerStyle() }
  ws[cellRef(4, totalRow)] = { v: 'Entradas',   t: 's', s: { ...headerStyle(), font: { bold: true, color: { rgb: GREEN_FG }, sz: 10 } } }
  ws[cellRef(5, totalRow)] = {
    v: resumo.entradas,
    t: 'n',
    s: { ...dataStyleRight(GREEN_FG), numFmt: 'R$ #,##0.00', font: { bold: true, color: { rgb: GREEN_FG }, sz: 10 }, fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } } }
  }

  const totalRow2 = lastRow + 1
  ws[cellRef(0, totalRow2)] = { v: '',         t: 's', s: headerStyle() }
  ws[cellRef(1, totalRow2)] = { v: '',         t: 's', s: headerStyle() }
  ws[cellRef(2, totalRow2)] = { v: '',         t: 's', s: headerStyle() }
  ws[cellRef(3, totalRow2)] = { v: '',         t: 's', s: headerStyle() }
  ws[cellRef(4, totalRow2)] = { v: 'Saídas',  t: 's', s: { ...headerStyle(), font: { bold: true, color: { rgb: RED_FG }, sz: 10 } } }
  ws[cellRef(5, totalRow2)] = {
    v: resumo.saidas,
    t: 'n',
    s: { ...dataStyleRight(RED_FG), numFmt: 'R$ #,##0.00', font: { bold: true, color: { rgb: RED_FG }, sz: 10 }, fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } } }
  }

  const totalRow3 = lastRow + 2
  ws[cellRef(0, totalRow3)] = { v: '',            t: 's', s: headerStyle() }
  ws[cellRef(1, totalRow3)] = { v: '',            t: 's', s: headerStyle() }
  ws[cellRef(2, totalRow3)] = { v: '',            t: 's', s: headerStyle() }
  ws[cellRef(3, totalRow3)] = { v: '',            t: 's', s: headerStyle() }
  ws[cellRef(4, totalRow3)] = { v: 'Investido',  t: 's', s: { ...headerStyle(), font: { bold: true, color: { rgb: GOLD_FG }, sz: 10 } } }
  ws[cellRef(5, totalRow3)] = {
    v: resumo.investidos,
    t: 'n',
    s: { ...dataStyleRight(GOLD_FG), numFmt: 'R$ #,##0.00', font: { bold: true, color: { rgb: GOLD_FG }, sz: 10 }, fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } } }
  }

  const totalRow4 = lastRow + 3
  const saldoColor = resumo.saldo >= 0 ? GREEN_FG : RED_FG
  ws[cellRef(0, totalRow4)] = { v: '',      t: 's', s: headerStyle() }
  ws[cellRef(1, totalRow4)] = { v: '',      t: 's', s: headerStyle() }
  ws[cellRef(2, totalRow4)] = { v: '',      t: 's', s: headerStyle() }
  ws[cellRef(3, totalRow4)] = { v: '',      t: 's', s: headerStyle() }
  ws[cellRef(4, totalRow4)] = { v: 'Saldo', t: 's', s: { ...headerStyle(), font: { bold: true, color: { rgb: HEADER_FG }, sz: 10 } } }
  ws[cellRef(5, totalRow4)] = {
    v: resumo.saldo,
    t: 'n',
    s: { ...dataStyleRight(saldoColor), numFmt: 'R$ #,##0.00', font: { bold: true, color: { rgb: saldoColor }, sz: 10 }, fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } } }
  }

  ws['!ref'] = `A1:G${totalRow4}`
  ws['!cols'] = [
    { wch: 13 }, // Data
    { wch: 11 }, // Tipo
    { wch: 14 }, // Subtipo
    { wch: 24 }, // Categoria
    { wch: 30 }, // Descrição
    { wch: 16 }, // Valor
    { wch: 12 }, // Parcela
  ]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]

  XLSX.utils.book_append_sheet(wb, ws as Parameters<typeof XLSX.utils.book_append_sheet>[1], 'Transações')

  // ── ABA 2: RESUMO POR CATEGORIA ──────────────────────────────────────────
  const catMap: Record<string, { tipo: string; valor: number }> = {}
  transacoes.forEach(t => {
    const k = `${t.tipo}|${t.categoria}`
    if (!catMap[k]) catMap[k] = { tipo: t.tipo, valor: 0 }
    catMap[k].valor += t.valor
  })

  const wsRes: Worksheet = {}
  wsRes['A1'] = { v: 'Resumo por Categoria', t: 's', s: { fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } }, font: { bold: true, color: { rgb: HEADER_FG }, sz: 13 }, alignment: { horizontal: 'center', vertical: 'center' }, border: border() } }
  wsRes['B1'] = { v: '', t: 's', s: { fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } }, border: border() } }
  wsRes['C1'] = { v: '', t: 's', s: { fill: { patternType: 'solid', fgColor: { rgb: HEADER_BG } }, border: border() } }

  const resHeaders = ['Tipo', 'Categoria', 'Total (R$)']
  resHeaders.forEach((h, ci) => { wsRes[cellRef(ci, 2)] = { v: h, t: 's', s: headerStyle() } })

  Object.entries(catMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([k, v], ri) => {
      const row = ri + 3
      const cor = tipoColor(v.tipo)
      wsRes[cellRef(0, row)] = { v: v.tipo,         t: 's', s: dataStyle(cor) }
      wsRes[cellRef(1, row)] = { v: k.split('|')[1], t: 's', s: dataStyle() }
      wsRes[cellRef(2, row)] = { v: v.valor,         t: 'n', s: { ...dataStyleRight(cor), numFmt: 'R$ #,##0.00' } }
    })

  const resLastRow = Object.keys(catMap).length + 3
  wsRes['!ref'] = `A1:C${resLastRow}`
  wsRes['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 16 }]
  wsRes['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]

  XLSX.utils.book_append_sheet(wb, wsRes as Parameters<typeof XLSX.utils.book_append_sheet>[1], 'Por Categoria')

  // Download
  const nomeMes = filtroMes ? `_${filtroMes.padStart(2, '0')}` : ''
  XLSX.writeFile(wb, `gastos_${filtroAno}${nomeMes}.xlsx`)
}
