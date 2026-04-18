'use client'
import { useState } from 'react'
import { deleteTransacao } from '../../lib/db'
import { Panel, PanelHeader, PanelBody, PanelBody as _, Dot, Badge, BadgeCat, BtnGhost, BtnOutline, EmptyState } from './index'
import { brl, fmtData } from '../../lib/utils'
import type { Transacao } from '../../types'
import { Inbox, Download, Pencil, Trash2 } from 'lucide-react'

interface Props {
  transacoes: Transacao[]
  filtroAno: string
  filtroMes: string
  uid: string
  onDelete: () => void
  onEdit: (t: Transacao) => void
}

export default function TabelaTransacoes({ transacoes, filtroAno, filtroMes, uid, onDelete, onEdit }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta transação?')) return
    setDeleting(id)
    await deleteTransacao(uid, id)
    setDeleting(null)
    onDelete()
  }

  function exportCSV() {
    const rows = [['data','tipo','subtipo','valor','categoria','descricao']]
    transacoes.forEach(t => rows.push([t.data, t.tipo, t.subtipo, String(t.valor), t.categoria, t.descricao]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `gastos_${filtroAno}_${filtroMes || 'todos'}.csv`
    a.click()
  }

  const valColor = (tipo: string) =>
    tipo === 'Entrada' ? 'var(--green)' : tipo === 'Investido' ? 'var(--gold)' : 'var(--red)'

  return (
    <Panel>
      <PanelHeader>
        <span className="flex items-center gap-2"><Dot color="green" />Transações</span>
        <BtnOutline onClick={exportCSV} color="cyan">
          <Download size={12} /> CSV
        </BtnOutline>
      </PanelHeader>
      <div className="overflow-x-auto">
        {transacoes.length === 0
          ? <PanelBody><EmptyState icon={<Inbox />} text="Nenhuma transação encontrada" /></PanelBody>
          : (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data','Tipo','Categoria','Descrição','Valor',''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-bold tracking-widest uppercase whitespace-nowrap"
                      style={{ color: 'var(--dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transacoes.map(t => (
                  <tr key={t.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--dim)' }}>
                      {fmtData(t.data)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tipo={t.tipo} subtipo={t.subtipo || undefined} />
                    </td>
                    <td className="px-4 py-3">
                      <BadgeCat>{t.categoria}</BadgeCat>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--dim)' }}>
                      {t.descricao || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-right whitespace-nowrap"
                      style={{ color: valColor(t.tipo) }}>
                      {brl(t.valor)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <BtnGhost onClick={() => onEdit(t)} title="Editar">
                        <Pencil size={13} />
                      </BtnGhost>
                      <BtnGhost danger onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id} title="Excluir">
                        <Trash2 size={13} />
                      </BtnGhost>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </Panel>
  )
}
