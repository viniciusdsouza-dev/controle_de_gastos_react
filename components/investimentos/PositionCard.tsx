'use client'
import { useState } from 'react'
import { addAporte, addTransacao, deleteAporte, deletePosition, updatePosition, deleteTransacoesDoAporte, deleteTransacoesDaPosition } from '../../lib/db'
import { calcularSnapshot, fmtTaxa } from '../../lib/investimentos'
import { brl } from '../../lib/utils'
import { Label, Input, BtnPrimary, BtnGhost } from '../ui'
import DatePicker from '../ui/DatePicker'
import type { PositionComAportes } from '../../app/investimentos/page'
import { Pencil, Trash2, TrendingUp, Plus, ChevronDown, ChevronUp, BarChart2, X, Power } from 'lucide-react'

interface Props {
  item:      PositionComAportes
  uid:       string
  dataRef:   string
  onEdit:    () => void
  onProjetar: () => void
  onReload:  () => void
  encerrado?: boolean
}

export default function PositionCard({ item, uid, dataRef, onEdit, onProjetar, onReload, encerrado }: Props) {
  const { position, aportes } = item

  // Usa o mais recente entre dataRef e o último aporte
  // (evita que aportes lançados com data futura sejam ignorados)
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const effectiveDataRef = aportes.reduce(
    (max, a) => a.data > max ? a.data : max,
    dataRef
  )

  const snap = calcularSnapshot(position, aportes, effectiveDataRef)

  const [expanded,    setExpanded]    = useState(false)
  const [novoValor,   setNovoValor]   = useState('')
  const [novaData,    setNovaData]    = useState(dataRef)
  const [addingAporte, setAdding]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [toast,       setToast]       = useState<string | null>(null)

  const rendPct = snap.totalAportado > 0
    ? ((snap.rendimentoTotal / snap.totalAportado) * 100)
    : 0
  const positivo = snap.rendimentoTotal >= 0

  async function handleAddAporte(e: React.FormEvent) {
    e.preventDefault()
    if (!novoValor) return
    setSaving(true)
    const valorNum = parseFloat(novoValor)

    // Salva o aporte na aba Investimentos
    await addAporte(uid, position.id, { data: novaData, valor: valorNum })

    // Sincroniza com o Dashboard — cria transação correspondente
    await addTransacao(uid, {
      data:     novaData,
      tipo:     'Investido',
      subtipo:  position.subtipo,
      valor:    valorNum,
      categoria: position.categoria,
      descricao: position.nome || position.categoria,
    })

    showToast('Aporte registrado e sincronizado com o Dashboard.')
    setNovoValor('')
    setNovaData(dataRef)
    setSaving(false)
    onReload()
  }

  async function handleDeleteAporte(id: string) {
    const aporte = aportes.find(a => a.id === id)
    if (!aporte) return
    if (!confirm(
      `Excluir aporte de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(aporte.valor)} (${new Date(aporte.data + 'T12:00:00').toLocaleDateString('pt-BR')})?\n\nA transação correspondente no Dashboard também será excluída.`
    )) return
    setDeletingId(id)
    await deleteAporte(uid, position.id, id)
    const qtd = await deleteTransacoesDoAporte(uid, position.categoria, position.subtipo, aporte.data, aporte.valor)
    setDeletingId(null)
    showToast(qtd > 0 ? `Aporte excluído e removido do Dashboard.` : 'Aporte excluído. Nenhuma transação correspondente encontrada no Dashboard.')
    onReload()
  }

  async function handleEncerrar() {
    if (!confirm(position.ativo ? 'Marcar como encerrado?' : 'Reativar este investimento?')) return
    await updatePosition(uid, position.id, { ativo: !position.ativo })
    onReload()
  }

  async function handleDelete() {
    if (!confirm(
      `Excluir "${position.nome || position.categoria}" e todos os seus aportes?\n\nAs transações de investimento correspondentes no Dashboard também serão excluídas.\n\nEsta ação não pode ser desfeita.`
    )) return
    const [, qtd] = await Promise.all([
      deletePosition(uid, position.id),
      deleteTransacoesDaPosition(uid, position.categoria, position.subtipo),
    ])
    onReload()
  }

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{
        background: 'var(--surface2)',
        border: `1px solid ${encerrado ? 'var(--border)' : 'rgba(0,229,255,0.15)'}`,
        opacity: encerrado ? 0.65 : 1,
      }}>

      {/* ── Linha principal ── */}
      <div className="flex items-center gap-4 px-5 py-4">

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
              {position.nome || position.categoria}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: position.subtipo === 'Renda Fixa' ? 'rgba(0,229,255,0.1)' : 'rgba(255,215,64,0.1)',
                color:      position.subtipo === 'Renda Fixa' ? 'var(--cyan)' : '#ffd740',
                border:     `1px solid ${position.subtipo === 'Renda Fixa' ? 'rgba(0,229,255,0.2)' : 'rgba(255,215,64,0.2)'}`,
              }}>
              {position.categoria}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {fmtTaxa(position.taxaMensal)}/mês · {fmtTaxa(position.taxaAnual)}/ano
            </span>
          </div>
        </div>

        {/* Valores */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold font-mono" style={{ color: 'var(--text)' }}>{brl(snap.valorAtual)}</p>
          <p className="text-xs font-mono font-bold" style={{ color: positivo ? '#00e676' : '#ff1744' }}>
            {positivo ? '+' : ''}{brl(snap.rendimentoTotal)}
            <span className="ml-1" style={{ opacity: 0.7 }}>({positivo ? '+' : ''}{rendPct.toFixed(2)}%)</span>
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Aportado: {brl(snap.totalAportado)}
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <BtnGhost onClick={onProjetar} title="Projeção futura">
            <BarChart2 size={14} />
          </BtnGhost>
          <BtnGhost onClick={onEdit} title="Editar">
            <Pencil size={14} />
          </BtnGhost>
          <BtnGhost onClick={handleEncerrar} title={position.ativo ? 'Encerrar' : 'Reativar'}>
            <Power size={14} />
          </BtnGhost>
          <BtnGhost danger onClick={handleDelete} title="Excluir">
            <Trash2 size={14} />
          </BtnGhost>
          <BtnGhost onClick={() => setExpanded(!expanded)} title="Ver aportes">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </BtnGhost>
        </div>
      </div>

      {/* ── Painel expandido: aportes ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>

          {/* Lista de aportes */}
          {aportes.length > 0 && (
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--dim)' }}>
                Aportes
              </p>
              <div className="flex flex-col gap-1">
                {aportes.map(a => {
                  const snapAporte = calcularSnapshot(position, [a], effectiveDataRef)
                  const rend = snapAporte.valorAtual - a.valor
                  return (
                    <div key={a.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ background: 'var(--surface3)' }}>
                      <span className="text-xs font-mono" style={{ color: 'var(--dim)', width: 80, flexShrink: 0 }}>
                        {new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-xs font-mono font-bold flex-1" style={{ color: 'var(--text)' }}>
                        {brl(a.valor)}
                      </span>
                      <span className="text-xs font-mono" style={{ color: rend >= 0 ? '#00e676' : '#ff1744' }}>
                        {rend >= 0 ? '+' : ''}{brl(rend)} hoje
                      </span>
                      <span className="text-xs font-mono font-bold" style={{ color: 'var(--cyan)' }}>
                        = {brl(snapAporte.valorAtual)}
                      </span>
                      <BtnGhost danger onClick={() => handleDeleteAporte(a.id)}
                        disabled={deletingId === a.id}>
                        <X size={11} />
                      </BtnGhost>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Form novo aporte */}
          {!encerrado && (
            <form onSubmit={handleAddAporte}
              className="flex items-end gap-3 px-5 py-4"
              style={{ borderTop: aportes.length > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ flex: '0 0 auto' }}>
                <Label>Data do Aporte</Label>
                <DatePicker value={novaData} onChange={setNovaData} />
              </div>
              <div style={{ flex: 1 }}>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" min="0.01"
                  value={novoValor} onChange={e => setNovoValor(e.target.value)}
                  placeholder="0,00" required />
              </div>
              <BtnPrimary type="submit" disabled={saving} className="w-auto px-4 py-2" style={{ flexShrink: 0 }}>
                <Plus size={13} className="inline mr-1" />
                {saving ? '...' : 'Aportar'}
              </BtnPrimary>
            </form>
          )}
        </div>
      )}

      {/* Toast de notificação */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--surface)', border: '1px solid rgba(0,229,255,0.3)',
            borderRadius: 10, padding: '10px 20px', zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,.6)',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap',
            animation: 'fadeUp .2s ease',
          }}
        >
          <span style={{ color: 'var(--cyan)', fontSize: 14 }}>✓</span>
          {toast}
        </div>
      )}
    </div>
  )
}
