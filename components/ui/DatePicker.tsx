'use client'
// Seletor de data em formato brasileiro (DD/MM/AAAA) via três selects
// Recebe e retorna string no formato YYYY-MM-DD (compatível com o resto do sistema)

import { Select } from './index'

const MESES_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function diasNoMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate()
}

interface Props {
  value: string          // YYYY-MM-DD
  onChange: (v: string) => void
  disabled?: boolean
  style?: React.CSSProperties
}

export default function DatePicker({ value, onChange, disabled, style }: Props) {
  const [anoStr, mesStr, diaStr] = value ? value.split('-') : ['', '', '']
  const ano = parseInt(anoStr) || new Date().getFullYear()
  const mes = parseInt(mesStr) || new Date().getMonth() + 1
  const dia = parseInt(diaStr) || 1

  const maxDia = diasNoMes(mes, ano)
  const diaValido = Math.min(dia, maxDia)

  function emit(newDia: number, newMes: number, newAno: number) {
    const d = Math.min(newDia, diasNoMes(newMes, newAno))
    onChange(
      `${newAno}-${String(newMes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    )
  }

  const anoAtual = new Date().getFullYear()
  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - 2 + i)

  const selectStyle: React.CSSProperties = {
    padding: '6px 4px',
    fontSize: 12,
    ...style,
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {/* Dia */}
      <Select
        value={String(diaValido)}
        onChange={e => emit(parseInt(e.target.value), mes, ano)}
        disabled={disabled}
        style={{ ...selectStyle, width: 58 }}
      >
        {Array.from({ length: maxDia }, (_, i) => i + 1).map(d => (
          <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
        ))}
      </Select>

      {/* Mês */}
      <Select
        value={String(mes)}
        onChange={e => emit(diaValido, parseInt(e.target.value), ano)}
        disabled={disabled}
        style={{ ...selectStyle, flex: 1 }}
      >
        {MESES_PT.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </Select>

      {/* Ano */}
      <Select
        value={String(ano)}
        onChange={e => emit(diaValido, mes, parseInt(e.target.value))}
        disabled={disabled}
        style={{ ...selectStyle, width: 72 }}
      >
        {anos.map(a => <option key={a} value={a}>{a}</option>)}
      </Select>
    </div>
  )
}
