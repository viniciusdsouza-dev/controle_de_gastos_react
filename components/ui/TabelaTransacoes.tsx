'use client'
import { useState } from 'react'
import { deleteTransacao } from '../../lib/db'
import { Panel, PanelHeader, PanelBody, Dot, Badge, BadgeCat, BtnGhost, BtnOutline, EmptyState } from './index'
import { brl, fmtData } from '../../lib/utils'
import { exportarXlsx } from '../../lib/exportXlsx'
import type { Transacao } from '../../types'
import { Inbox, Download, Pencil, Trash2, RefreshCw } from 'lucide-react'

interface Props {
  transacoes: Transacao[]
  filtroAno: string
  filtroMes: string
  uid: string
  onDelete: () => void
  onEdit: (t: Transacao) => void
}

export default function TabelaTransacoes({ transacoes, filtroAno, filtroMes, uid, onDelete, onEdit }: Props) {
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta transação?')) return
    setDeleting(id)
    await deleteTransacao(uid, id)
    setDeleting(null)
    onDelete()
  }

  async function handleExport() {
    setExporting(true)
    const entradas   = transacoes.filter(t => t.tipo === 'Entrada').reduce((s, t) => s + t.valor, 0)
    const saidas     = transacoes.filter(t => t.tipo === 'Saída').reduce((s, t) => s + t.valor, 0)
    const investidos = transacoes.filter(t => t.tipo === 'Investido').reduce((s, t) => s + t.valor, 0)
    await exportarXlsx(transacoes, { entradas, saidas, investidos, saldo: entradas - saidas - investidos }, filtroAno, filtroMes)
    setExporting(false)
  }

  const valColor = (tipo: string) =>
    tipo === 'Entrada' ? 'var(--green)' : tipo === 'Investido' ? 'var(--gold)' : 'var(--red)'

  return (
    <Panel>
      <PanelHeader>
        <span className="flex items-center gap-2"><Dot color="green" />Transações</span>
        <BtnOutline onClick={handleExport} color="cyan" disabled={exporting}>
          <Download size={12} /> {exporting ? 'Gerando...' : 'Exportar XLSX'}
        </BtnOutline>
      </PanelHeader>
      <div className="overflow-x-auto -mx-0">
        {transacoes.length === 0
          ? <PanelBody><EmptyState icon={<Inbox />} text="Nenhuma transação encontrada" /></PanelBody>
          : (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', ''].map((h, hi) => (
                    <th key={h} className={`px-3 py-2.5 text-left text-xs font-bold tracking-widest uppercase whitespace-nowrap${hi === 3 ? " hidden md:table-cell" : ""}`}
                      style={{ color: 'var(--dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transacoes.map(t => (
                  <tr key={t.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--dim)' }}>
                      {fmtData(t.data)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge tipo={t.tipo} subtipo={t.subtipo || undefined} />
                        {t.recorrente && (
                          <span title={t.parcelaNumero ? `Parcela ${t.parcelaNumero}/${t.mesesRecorrencia || '∞'}` : 'Recorrente'}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
                            style={{ background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.25)' }}>
                            <RefreshCw size={9} />
                            {t.parcelaNumero && t.mesesRecorrencia ? `${t.parcelaNumero}/${t.mesesRecorrencia}` : '∞'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <BadgeCat>{t.categoria}</BadgeCat>
                    </td>
                    <td className="px-3 py-3 text-sm hidden md:table-cell" style={{ color: 'var(--dim)' }}>
                      {t.descricao || '—'}
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-right whitespace-nowrap"
                      style={{ color: valColor(t.tipo) }}>
                      {brl(t.valor)}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
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
