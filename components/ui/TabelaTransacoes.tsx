'use client'
import { useState } from 'react'
import { deleteTransacao } from '../../lib/db'
import { Panel, PanelHeader, PanelBody, Dot, Badge, BadgeCat, BtnGhost, BtnOutline, EmptyState } from './index'
import { brl, fmtData } from '../../lib/utils'
import { exportarXlsx } from '../../lib/exportXlsx'
import type { Transacao } from '../../types'
import { Inbox, Download, Pencil, Trash2, RefreshCw, X } from 'lucide-react'

interface Props {
  transacoes: Transacao[]
  filtroAno: string
  filtroMes: string
  uid: string
  onDelete: () => void
  onEdit: (t: Transacao) => void
}

// ── DRAWER MOBILE: detalhe da transação ────────────────────────────────────────
function TransacaoDrawer({ t, onClose, onEdit, onDelete }: {
  t: Transacao
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const valColor = t.tipo === 'Entrada' ? 'var(--green)' : t.tipo === 'Investido' ? 'var(--gold)' : 'var(--red)'
  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 -8px 40px rgba(0,0,0,.6)' }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Badge tipo={t.tipo} subtipo={t.subtipo || undefined} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {/* Valor em destaque */}
          <div className="text-center py-3">
            <p className="text-3xl font-bold font-mono" style={{ color: valColor }}>{brl(t.valor)}</p>
            {t.recorrente && t.parcelaNumero && (
              <p className="text-xs mt-1" style={{ color: 'var(--cyan)' }}>
                Parcela {t.parcelaNumero}/{t.mesesRecorrencia || '∞'}
              </p>
            )}
          </div>

          {/* Detalhes em grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Data',      value: fmtData(t.data) },
              { label: 'Tipo',      value: t.tipo },
              { label: 'Categoria', value: t.categoria },
              { label: 'Descrição', value: t.descricao || '—' },
              ...(t.subtipo ? [{ label: 'Subtipo', value: t.subtipo }] : []),
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3" style={{ background: 'var(--surface2)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{item.label}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 px-5 pb-6 pt-2">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)', cursor: 'pointer' }}>
            <Pencil size={14} /> Editar
          </button>
          <button onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(255,23,68,0.1)', color: '#ff1744', border: '1px solid rgba(255,23,68,0.2)', cursor: 'pointer' }}>
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      </div>
    </>
  )
}

export default function TabelaTransacoes({ transacoes, filtroAno, filtroMes, uid, onDelete, onEdit }: Props) {
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [detalhe,   setDetalhe]   = useState<Transacao | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta transação?')) return
    setDeleting(id)
    await deleteTransacao(uid, id)
    setDeleting(null)
    setDetalhe(null)
    onDelete()
  }

  async function handleExport() {
    setExporting(true)
    const entradas   = transacoes.filter(t => t.tipo === 'Entrada').reduce((s, t) => s + t.valor, 0)
    const saidas     = transacoes.filter(t => t.tipo === 'Saída').reduce((s, t)  => s + t.valor, 0)
    const investidos = transacoes.filter(t => t.tipo === 'Investido').reduce((s, t) => s + t.valor, 0)
    await exportarXlsx(transacoes, { entradas, saidas, investidos, saldo: entradas - saidas - investidos }, filtroAno, filtroMes)
    setExporting(false)
  }

  const valColor = (tipo: string) =>
    tipo === 'Entrada' ? 'var(--green)' : tipo === 'Investido' ? 'var(--gold)' : 'var(--red)'

  return (
    <>
      <Panel>
        <PanelHeader>
          <span className="flex items-center gap-2"><Dot color="green" />Transações</span>
          <BtnOutline onClick={handleExport} color="cyan" disabled={exporting}>
            <Download size={12} /> {exporting ? 'Gerando...' : 'Exportar XLSX'}
          </BtnOutline>
        </PanelHeader>

        <div className="overflow-x-auto">
          {transacoes.length === 0
            ? <PanelBody><EmptyState icon={<Inbox />} text="Nenhuma transação encontrada" /></PanelBody>
            : (
              <>
                {/* ── DESKTOP: tabela completa ── */}
                <table className="w-full border-collapse hidden md:table">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', ''].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-bold tracking-widest uppercase whitespace-nowrap"
                          style={{ color: 'var(--dim)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transacoes.map(t => (
                      <tr key={t.id} className="transition-colors hover:bg-white/[0.02]"
                        style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--dim)' }}>{fmtData(t.data)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <Badge tipo={t.tipo} subtipo={t.subtipo || undefined} />
                            {t.recorrente && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
                                style={{ background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.25)' }}>
                                <RefreshCw size={9} />
                                {t.parcelaNumero && t.mesesRecorrencia ? `${t.parcelaNumero}/${t.mesesRecorrencia}` : '∞'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3"><BadgeCat>{t.categoria}</BadgeCat></td>
                        <td className="px-3 py-3 text-sm" style={{ color: 'var(--dim)' }}>{t.descricao || '—'}</td>
                        <td className="px-3 py-3 font-mono font-bold text-right whitespace-nowrap" style={{ color: valColor(t.tipo) }}>
                          {brl(t.valor)}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <BtnGhost onClick={() => onEdit(t)}><Pencil size={13} /></BtnGhost>
                          <BtnGhost danger onClick={() => handleDelete(t.id)} disabled={deleting === t.id}><Trash2 size={13} /></BtnGhost>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* ── MOBILE: lista de cards clicáveis ── */}
                <div className="md:hidden flex flex-col">
                  {transacoes.map(t => (
                    <button key={t.id}
                      onClick={() => setDetalhe(t)}
                      className="flex items-center gap-3 px-4 py-3.5 w-full text-left transition-colors active:bg-white/[0.04]"
                      style={{ borderBottom: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>
                      {/* Dot colorido */}
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: valColor(t.tipo) }} />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge tipo={t.tipo} />
                          {t.recorrente && <RefreshCw size={9} style={{ color: 'var(--cyan)', flexShrink: 0 }} />}
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                          {t.categoria}
                          {t.descricao ? ` · ${t.descricao}` : ''}
                        </p>
                      </div>
                      {/* Valor + data */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold text-sm" style={{ color: valColor(t.tipo) }}>
                          {brl(t.valor)}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{fmtData(t.data)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
        </div>
      </Panel>

      {/* Drawer de detalhe mobile */}
      {detalhe && (
        <TransacaoDrawer
          t={detalhe}
          onClose={() => setDetalhe(null)}
          onEdit={() => { onEdit(detalhe); setDetalhe(null) }}
          onDelete={() => handleDelete(detalhe.id)}
        />
      )}
    </>
  )
}
