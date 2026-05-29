'use client'
import { useState, useEffect } from 'react'
import { addPosition, updatePosition } from '../../lib/db'
import { Label, Select, BtnPrimary, BtnGhost, Input } from '../ui'
import { taxaAnualParaMensal, taxaMensalParaAnual, fmtTaxa } from '../../lib/investimentos'
import { ATIVOS } from '../../lib/utils'
import { X } from 'lucide-react'
import type { InvestimentoPosition, Subtipo } from '../../types'

interface Props {
  uid:       string
  position?: InvestimentoPosition
  onClose:   () => void
  onSaved:   () => void
}

type ModoTaxa = 'anual' | 'mensal'

export default function PositionModal({ uid, position, onClose, onSaved }: Props) {
  const editing = !!position

  const [nome,      setNome]      = useState(position?.nome      ?? '')
  const [subtipo,   setSubtipo]   = useState<Subtipo>(position?.subtipo   ?? 'Renda Fixa')
  const [categoria, setCategoria] = useState(position?.categoria ?? '')
  const [modoTaxa,  setModoTaxa]  = useState<ModoTaxa>('anual')
  const [taxaInput, setTaxaInput] = useState(
    position ? String(position.taxaAnual) : ''
  )
  const [observacao, setObs]      = useState(position?.observacao ?? '')
  const [saving,    setSaving]    = useState(false)

  // Taxa derivada para exibir preview
  const taxaNum = parseFloat(taxaInput.replace(',', '.')) || 0
  const taxaAnual   = modoTaxa === 'anual'  ? taxaNum : taxaMensalParaAnual(taxaNum)
  const taxaMensal  = modoTaxa === 'mensal' ? taxaNum : taxaAnualParaMensal(taxaNum)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoria || taxaNum <= 0) return
    setSaving(true)

    const payload = {
      nome:       nome || categoria,
      subtipo,
      categoria,
      taxaAnual:  parseFloat(taxaAnual.toFixed(6)),
      taxaMensal: parseFloat(taxaMensal.toFixed(6)),
      observacao,
      ativo: true,
      ...(editing ? {} : { dataInicio: new Date().toISOString().slice(0, 10) }),
    }

    if (editing) {
      await updatePosition(uid, position!.id, payload)
    } else {
      await addPosition(uid, payload as Omit<InvestimentoPosition, 'id' | 'criadoEm'>)
    }
    setSaving(false)
    onSaved()
  }

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="fixed z-50 w-full max-w-md rounded-xl overflow-hidden"
        style={{
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', border: '1px solid rgba(0,229,255,.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,.7)',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>
            {editing ? '✏️ Editar Investimento' : '+ Novo Investimento'}
          </span>
          <BtnGhost onClick={onClose}><X size={15} /></BtnGhost>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="p-5 flex flex-col gap-4">

            {/* Subtipo */}
            <div>
              <Label>Tipo</Label>
              <Select value={subtipo} onChange={e => { setSubtipo(e.target.value as Subtipo); setCategoria('') }}>
                <option value="Renda Fixa">Renda Fixa</option>
                <option value="Renda Variável">Renda Variável</option>
              </Select>
            </div>

            {/* Ativo */}
            <div>
              <Label>Ativo</Label>
              <Select value={categoria} onChange={e => setCategoria(e.target.value)} required>
                <option value="">Selecione...</option>
                {(ATIVOS as Record<string, string[]>)[subtipo]?.map((a: string) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>

            {/* Nome / apelido */}
            <div>
              <Label>Nome / Apelido <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></Label>
              <Input type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder={categoria || 'ex: CDB Nubank 120% CDI'} />
            </div>

            {/* Taxa */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label style={{ marginBottom: 0 }}>Taxa de Rendimento</Label>
                <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {(['anual', 'mensal'] as ModoTaxa[]).map(m => (
                    <button key={m} type="button" onClick={() => setModoTaxa(m)}
                      className="px-3 py-1 text-xs font-bold transition-all"
                      style={{
                        background: modoTaxa === m ? 'var(--cyan)' : 'var(--surface2)',
                        color:      modoTaxa === m ? '#000' : 'var(--dim)',
                        border: 'none', cursor: 'pointer',
                      }}>
                      {m === 'anual' ? 'Anual' : 'Mensal'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <Input
                  type="number" step="0.001" min="0.001"
                  value={taxaInput}
                  onChange={e => setTaxaInput(e.target.value)}
                  placeholder={modoTaxa === 'anual' ? 'ex: 12,5' : 'ex: 0,98'}
                  required
                  style={{ paddingRight: 36 }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--dim)' }}>%</span>
              </div>
              {taxaNum > 0 && (
                <div className="flex gap-4 mt-2">
                  <span className="text-xs" style={{ color: 'var(--dim)' }}>
                    Mensal: <strong style={{ color: 'var(--cyan)' }}>{fmtTaxa(taxaMensal)}</strong>
                  </span>
                  <span className="text-xs" style={{ color: 'var(--dim)' }}>
                    Anual: <strong style={{ color: 'var(--cyan)' }}>{fmtTaxa(taxaAnual)}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Observação */}
            <div>
              <Label>Observação <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></Label>
              <Input type="text" value={observacao} onChange={e => setObs(e.target.value)} placeholder="Notas sobre o investimento..." />
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-semibold"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--dim)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <BtnPrimary type="submit" disabled={saving} className="w-auto px-5 py-2">
              {saving ? 'Salvando...' : editing ? '✓ Salvar' : '+ Criar'}
            </BtnPrimary>
          </div>
        </form>
      </div>
    </>
  )
}
