'use client'
import { useState } from 'react'
import { updateTransacao } from '../../lib/db'
import { Label, Input, Select, BtnPrimary, BtnGhost } from './index'
import { ATIVOS, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '../../lib/utils'
import { X, RefreshCw } from 'lucide-react'
import type { Transacao, TipoTransacao, Subtipo } from '../../types'

interface Props {
  transacao: Transacao
  uid: string
  categorias: string[]
  onClose: () => void
  onSaved: () => void
}

export default function TransacaoModal({ transacao, uid, onClose, onSaved }: Props) {
  const [data, setData]           = useState(transacao.data)
  const [tipo, setTipo]           = useState<TipoTransacao>(transacao.tipo)
  const [subtipo, setSubtipo]     = useState<Subtipo>((transacao.subtipo as Subtipo) || '')
  const [categoria, setCategoria] = useState(transacao.categoria)
  const [valor, setValor]         = useState(String(transacao.valor))
  const [descricao, setDescricao] = useState(transacao.descricao || '')
  const [saving, setSaving]       = useState(false)

  const categoriasDisponiveis = tipo === 'Entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA

  // Se a categoria atual não está na lista fixa (migração de dados antigos), adiciona ela
  const opcoesCategoria = categoriasDisponiveis.includes(categoria)
    ? categoriasDisponiveis
    : categoria ? [categoria, ...categoriasDisponiveis] : categoriasDisponiveis

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await updateTransacao(uid, transacao.id, {
      data, tipo,
      subtipo: tipo === 'Investido' ? subtipo : '',
      valor: parseFloat(valor),
      categoria, descricao,
    })
    setSaving(false)
    onSaved()
  }

  const isInvestido = tipo === 'Investido'

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-xl overflow-hidden fade-up"
        style={{ background: 'var(--surface)', border: '1px solid rgba(0,229,255,.2)', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>
            ✏️ Editar Transação
          </span>
          <div className="flex items-center gap-2">
            {transacao.recorrente && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.3)' }}>
                <RefreshCw size={10} />
                {transacao.parcelaNumero && transacao.mesesRecorrencia
                  ? `Parcela ${transacao.parcelaNumero}/${transacao.mesesRecorrencia || '∞'}`
                  : 'Recorrente'}
              </span>
            )}
            <BtnGhost onClick={onClose}><X size={15} /></BtnGhost>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <Label>Data</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} required />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onChange={e => {
                setTipo(e.target.value as TipoTransacao)
                setSubtipo('')
                setCategoria('')
              }}>
                <option value="Entrada">↓ Entrada</option>
                <option value="Saída">↑ Saída</option>
                <option value="Investido">◆ Investido</option>
              </Select>
            </div>

            {isInvestido && (
              <div className="col-span-2 rounded-lg p-3 flex flex-col gap-3"
                style={{ background: 'var(--surface3)', border: '1px solid var(--border)' }}>
                <div>
                  <Label>Modalidade</Label>
                  <Select value={subtipo} onChange={e => { setSubtipo(e.target.value as Subtipo); setCategoria('') }}>
                    <option value="">Selecione...</option>
                    <option value="Renda Fixa">Renda Fixa</option>
                    <option value="Renda Variável">Renda Variável</option>
                  </Select>
                </div>
                {subtipo && (
                  <div>
                    <Label>Ativo</Label>
                    <Select value={categoria} onChange={e => setCategoria(e.target.value)} required>
                      <option value="">Selecione...</option>
                      {ATIVOS[subtipo]?.map(a => <option key={a} value={a}>{a}</option>)}
                    </Select>
                  </div>
                )}
              </div>
            )}

            {!isInvestido && (
              <div className="col-span-2">
                <Label>Categoria</Label>
                <Select value={categoria} onChange={e => setCategoria(e.target.value)} required>
                  <option value="">Selecione a categoria...</option>
                  {opcoesCategoria.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            )}

            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" value={valor} onChange={e => setValor(e.target.value)}
                step="0.01" min="0.01" required />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Opcional..." />
            </div>
          </div>

          {transacao.recorrente && (
            <div className="mx-5 mb-4 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.2)', color: 'var(--muted)' }}>
              <RefreshCw size={10} className="inline mr-1" />
              Esta edição afeta apenas esta parcela. As demais permanecem inalteradas.
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-semibold transition-all"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--dim)' }}>
              Cancelar
            </button>
            <BtnPrimary type="submit" disabled={saving} className="w-auto px-5 py-2">
              {saving ? 'Salvando...' : '✓ Salvar'}
            </BtnPrimary>
          </div>
        </form>
      </div>
    </>
  )
}
