'use client'
import { useState } from 'react'
import {
  addAporte, addTransacao,
  deleteAporte, deletePosition, updatePosition,
  deleteTransacoesDoAporte, deleteTransacoesDaPosition,
  addResgate, deleteResgate,
} from '../../lib/db'
import { calcularSnapshot, fmtTaxa } from '../../lib/investimentos'
import { brl } from '../../lib/utils'
import { Label, Input, BtnPrimary, BtnGhost } from '../ui'
import DatePicker from '../ui/DatePicker'
import { getBancoPorSlug } from '../../lib/bancos'
import type { PositionComAportes } from '../../app/investimentos/page'
import type { Resgate } from '../../types'
import {
  Pencil, Trash2, TrendingUp, Plus, ChevronDown, ChevronUp,
  BarChart2, X, Power, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react'

interface Props {
  item:       PositionComAportes
  uid:        string
  dataRef:    string
  onEdit:     () => void
  onProjetar: () => void
  onReload:   () => void
  encerrado?: boolean
}

function detectarBancoSlug(nome: string): string | null {
  const n = nome.toLowerCase()
  if (n.includes('nubank') || n.includes('nu ')) return 'nubank'
  if (n.includes('itaú') || n.includes('itau')) return 'itau'
  if (n.includes('bradesco')) return 'bradesco'
  if (n.includes('banco do brasil') || n.includes(' bb ')) return 'bb'
  if (n.includes('inter')) return 'inter'
  if (n.includes('caixa')) return 'caixa'
  if (n.includes('santander')) return 'santander'
  if (n.includes('c6')) return 'c6'
  if (n.includes('picpay')) return 'picpay'
  if (n.includes('neon')) return 'neon'
  if (n.includes('will')) return 'will'
  if (n.includes('xp')) return 'xp'
  if (n.includes('rico')) return 'rico'
  return null
}

type Tab = 'aportes' | 'resgates'

export default function PositionCard({ item, uid, dataRef, onEdit, onProjetar, onReload, encerrado }: Props) {
  const { position, aportes, resgates } = item

  const bancoSlug = detectarBancoSlug(position.nome || position.categoria)
  const bancoCat  = bancoSlug ? getBancoPorSlug(bancoSlug) : null

  const effectiveDataRef = [...aportes, ...resgates].reduce(
    (max, e) => e.data > max ? e.data : max,
    dataRef
  )

  const snap     = calcularSnapshot(position, aportes, effectiveDataRef, resgates)
  const positivo = snap.rendimentoTotal >= 0

  // States
  const [expanded,    setExpanded]   = useState(false)
  const [activeTab,   setActiveTab]  = useState<Tab>('aportes')
  const [toast,       setToast]      = useState<string | null>(null)
  const [deletingId,  setDeletingId] = useState<string | null>(null)
  const [saving,      setSaving]     = useState(false)

  // Aporte form
  const [novoAporteValor, setNovoAporteValor] = useState('')
  const [novoAporteData,  setNovoAporteData]  = useState(dataRef)

  // Resgate form
  const [novoResgateValor, setNovoResgateValor] = useState('')
  const [novoResgateData,  setNovoResgateData]  = useState(dataRef)
  const [novoResgateDesc,  setNovoResgateDesc]  = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  // ── Adicionar aporte ──────────────────────────────────────────────────────
  async function handleAddAporte(e: React.FormEvent) {
    e.preventDefault()
    if (!novoAporteValor) return
    setSaving(true)
    const valorNum = parseFloat(novoAporteValor)

    await addAporte(uid, position.id, { data: novoAporteData, valor: valorNum })
    await addTransacao(uid, {
      data: novoAporteData, tipo: 'Investido',
      subtipo: position.subtipo, valor: valorNum,
      categoria: position.categoria, descricao: position.nome || position.categoria,
    })

    setNovoAporteValor('')
    setNovoAporteData(dataRef)
    setSaving(false)
    showToast('Aporte registrado e sincronizado com o Dashboard.')
    onReload()
  }

  // ── Excluir aporte ────────────────────────────────────────────────────────
  async function handleDeleteAporte(id: string) {
    const aporte = aportes.find(a => a.id === id)
    if (!aporte) return
    if (!confirm(`Excluir aporte de ${brl(aporte.valor)}?\n\nA transação correspondente no Dashboard também será excluída.`)) return
    setDeletingId(id)
    await deleteAporte(uid, position.id, id)
    const qtd = await deleteTransacoesDoAporte(uid, position.categoria, position.subtipo, aporte.data, aporte.valor)
    setDeletingId(null)
    showToast(qtd > 0 ? 'Aporte excluído e removido do Dashboard.' : 'Aporte excluído.')
    onReload()
  }

  // ── Adicionar resgate ─────────────────────────────────────────────────────
  async function handleAddResgate(e: React.FormEvent) {
    e.preventDefault()
    if (!novoResgateValor) return
    const valorNum = parseFloat(novoResgateValor)

    // Avisa se o valor excede o saldo disponível
    if (valorNum > snap.valorAtual) {
      if (!confirm(
        `O valor de resgate (${brl(valorNum)}) é maior que o saldo atual (${brl(snap.valorAtual)}).\n\nO sistema vai registrar ${brl(snap.valorAtual)} (saldo disponível). Continuar?`
      )) return
    }

    setSaving(true)
    await addResgate(uid, position.id, {
      data:      novoResgateData,
      valor:     valorNum,
      descricao: novoResgateDesc.trim() || undefined,
    } as Omit<Resgate, 'id' | 'criadoEm' | 'positionId'>)

    setNovoResgateValor('')
    setNovoResgateData(dataRef)
    setNovoResgateDesc('')
    setSaving(false)
    showToast('Resgate registrado. Saldo atualizado.')
    onReload()
  }

  // ── Excluir resgate ───────────────────────────────────────────────────────
  async function handleDeleteResgate(id: string) {
    if (!confirm('Excluir este resgate? O saldo voltará a ser calculado sem ele.')) return
    setDeletingId(id)
    await deleteResgate(uid, position.id, id)
    setDeletingId(null)
    showToast('Resgate excluído.')
    onReload()
  }

  // ── Excluir position ──────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm(
      `Excluir "${position.nome || position.categoria}" e todos os aportes/resgates?\n\nAs transações no Dashboard também serão excluídas.\n\nEsta ação não pode ser desfeita.`
    )) return
    await Promise.all([
      deletePosition(uid, position.id),
      deleteTransacoesDaPosition(uid, position.categoria, position.subtipo),
    ])
    onReload()
  }

  async function handleEncerrar() {
    if (!confirm(position.ativo ? 'Marcar como encerrado?' : 'Reativar este investimento?')) return
    await updatePosition(uid, position.id, { ativo: !position.ativo })
    onReload()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const rendPct = snap.totalAportado > 0
    ? ((snap.rendimentoTotal / snap.totalAportado) * 100)
    : 0

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{
        background: 'var(--surface2)',
        border: `1px solid ${encerrado ? 'var(--border)' : 'rgba(0,229,255,0.15)'}`,
        opacity: encerrado ? 0.65 : 1,
      }}>

      {/* ── Linha principal ── */}
      <div className="flex flex-wrap items-start gap-3 px-4 py-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {bancoCat && (
              <span style={{ width: 24, height: 24, flexShrink: 0, display: 'inline-flex' }}
                dangerouslySetInnerHTML={{ __html: bancoCat.svg.replace('viewBox="0 0 40 40"', 'viewBox="0 0 40 40" width="24" height="24"') }} />
            )}
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
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {fmtTaxa(position.taxaMensal)}/mês · {fmtTaxa(position.taxaAnual)}/ano
            </span>
            {snap.totalResgatado > 0 && (
              <span className="text-xs flex items-center gap-1"
                style={{ color: '#ff9800' }}>
                <ArrowUpRight size={10} />
                Resgatado: {brl(snap.totalResgatado)}
              </span>
            )}
          </div>
        </div>

        {/* Valores */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold font-mono" style={{ color: 'var(--text)' }}>{brl(snap.valorAtual)}</p>
          <p className="text-xs font-mono font-bold" style={{ color: positivo ? '#00e676' : '#ff1744' }}>
            {positivo ? '+' : ''}{brl(snap.rendimentoTotal)}
            <span className="ml-1" style={{ opacity: 0.7 }}>({positivo ? '+' : ''}{rendPct.toFixed(2)}%)</span>
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Aportado: {brl(snap.totalAportado)}</p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <BtnGhost onClick={onProjetar} title="Projeção"><BarChart2 size={14} /></BtnGhost>
          <BtnGhost onClick={onEdit} title="Editar"><Pencil size={14} /></BtnGhost>
          <BtnGhost onClick={handleEncerrar} title={position.ativo ? 'Encerrar' : 'Reativar'}><Power size={14} /></BtnGhost>
          <BtnGhost danger onClick={handleDelete} title="Excluir"><Trash2 size={14} /></BtnGhost>
          <BtnGhost onClick={() => setExpanded(!expanded)} title="Expandir">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </BtnGhost>
        </div>
      </div>

      {/* ── Painel expandido ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {([
              { id: 'aportes',  label: 'Aportes',  icon: <ArrowDownLeft size={12} />,  count: aportes.length },
              { id: 'resgates', label: 'Resgates', icon: <ArrowUpRight size={12} />, count: resgates.length },
            ] as { id: Tab; label: string; icon: React.ReactNode; count: number }[]).map(tab => (
              <button key={tab.id} type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all"
                style={{
                  color:          activeTab === tab.id ? (tab.id === 'resgates' ? '#ff9800' : 'var(--cyan)') : 'var(--muted)',
                  borderBottom:   activeTab === tab.id ? `2px solid ${tab.id === 'resgates' ? '#ff9800' : 'var(--cyan)'}` : '2px solid transparent',
                  background:     'none',  cursor: 'pointer',
                  paddingBottom:  activeTab === tab.id ? 8 : 10,
                }}>
                {tab.icon} {tab.label}
                {tab.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs"
                    style={{ background: 'var(--surface3)', color: 'var(--dim)', fontSize: 9 }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── ABA APORTES ── */}
          {activeTab === 'aportes' && (
            <>
              {aportes.length > 0 && (
                <div className="px-4 pt-3 pb-2">
                  <div className="flex flex-col gap-1">
                    {aportes.map(a => {
                      const snapA = calcularSnapshot(position, [a], effectiveDataRef, [])
                      const rend  = snapA.valorAtual - a.valor
                      return (
                        <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                          style={{ background: 'var(--surface3)' }}>
                          <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--dim)', width: 80 }}>
                            {new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-xs font-mono font-bold flex-1" style={{ color: 'var(--text)' }}>
                            {brl(a.valor)}
                          </span>
                          <span className="text-xs font-mono flex-shrink-0" style={{ color: rend >= 0 ? '#00e676' : '#ff1744' }}>
                            {rend >= 0 ? '+' : ''}{brl(rend)}
                          </span>
                          <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: 'var(--cyan)' }}>
                            = {brl(snapA.valorAtual)}
                          </span>
                          <BtnGhost danger onClick={() => handleDeleteAporte(a.id)} disabled={deletingId === a.id}>
                            <X size={11} />
                          </BtnGhost>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {!encerrado && (
                <form onSubmit={handleAddAporte}
                  className="flex flex-wrap items-end gap-3 px-4 py-4"
                  style={{ borderTop: aportes.length > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flex: '0 0 auto' }}>
                    <Label>Data</Label>
                    <DatePicker value={novoAporteData} onChange={setNovoAporteData} />
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" min="0.01"
                      value={novoAporteValor} onChange={e => setNovoAporteValor(e.target.value)}
                      placeholder="0,00" required />
                  </div>
                  <BtnPrimary type="submit" disabled={saving} className="w-auto px-4 py-2" style={{ flexShrink: 0 }}>
                    <Plus size={13} className="inline mr-1" />
                    {saving ? '...' : 'Aportar'}
                  </BtnPrimary>
                </form>
              )}
            </>
          )}

          {/* ── ABA RESGATES ── */}
          {activeTab === 'resgates' && (
            <>
              {/* Saldo disponível para resgate */}
              <div className="mx-4 mt-3 px-3 py-2 rounded-lg flex items-center justify-between"
                style={{ background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.25)' }}>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Saldo disponível para resgate</span>
                <span className="font-mono font-bold text-sm" style={{ color: '#ff9800' }}>{brl(snap.valorAtual)}</span>
              </div>

              {resgates.length > 0 && (
                <div className="px-4 pt-3 pb-2">
                  <div className="flex flex-col gap-1">
                    {resgates.map(r => (
                      <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{ background: 'var(--surface3)' }}>
                        <ArrowUpRight size={12} style={{ color: '#ff9800', flexShrink: 0 }} />
                        <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--dim)', width: 80 }}>
                          {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs font-mono font-bold flex-1" style={{ color: '#ff9800' }}>
                          {brl(r.valor)}
                        </span>
                        {r.descricao && (
                          <span className="text-xs flex-1 truncate" style={{ color: 'var(--muted)' }}>{r.descricao}</span>
                        )}
                        <BtnGhost danger onClick={() => handleDeleteResgate(r.id)} disabled={deletingId === r.id}>
                          <X size={11} />
                        </BtnGhost>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resgates.length === 0 && (
                <div className="px-4 pt-3 pb-2 text-xs text-center" style={{ color: 'var(--muted)' }}>
                  Nenhum resgate registrado ainda.
                </div>
              )}

              {!encerrado && (
                <form onSubmit={handleAddResgate}
                  className="flex flex-wrap items-end gap-3 px-4 py-4"
                  style={{ borderTop: '1px solid var(--border)' }}>
                  <div style={{ flex: '0 0 auto' }}>
                    <Label>Data do Resgate</Label>
                    <DatePicker value={novoResgateData} onChange={setNovoResgateData} />
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <Label>Valor Resgatado (R$)</Label>
                    <Input type="number" step="0.01" min="0.01"
                      value={novoResgateValor} onChange={e => setNovoResgateValor(e.target.value)}
                      placeholder="0,00" required />
                  </div>
                  <div style={{ flex: 2, minWidth: 120 }}>
                    <Label>Descrição <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></Label>
                    <Input type="text" value={novoResgateDesc} onChange={e => setNovoResgateDesc(e.target.value)}
                      placeholder="Ex: Resgate parcial, Emergência..." />
                  </div>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: saving ? 'var(--surface3)' : 'rgba(255,152,0,0.15)',
                      color: '#ff9800', border: '1px solid rgba(255,152,0,0.4)',
                      cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0,
                    }}>
                    <ArrowUpRight size={13} />
                    {saving ? '...' : 'Registrar Resgate'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: '1px solid rgba(0,229,255,0.3)',
          borderRadius: 10, padding: '10px 20px', zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,.6)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: 'var(--cyan)', fontSize: 14 }}>✓</span>
          {toast}
        </div>
      )}
    </div>
  )
}
