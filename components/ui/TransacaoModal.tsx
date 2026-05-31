'use client'
import { useState } from 'react'
import { updateTransacao, updateGrupoTransacoes } from '../../lib/db'
import { Label, Input, Select, BtnPrimary, BtnGhost } from './index'
import DatePicker from './DatePicker'
import { ATIVOS, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '../../lib/utils'
import { X, RefreshCw, AlertCircle } from 'lucide-react'
import type { Transacao, TipoTransacao, Subtipo } from '../../types'

interface Props {
  transacao: Transacao
  uid: string
  categorias: string[]
  onClose: () => void
  onSaved: () => void
}

type EscopoEdicao = 'esta' | 'todas'

export default function TransacaoModal({ transacao, uid, onClose, onSaved }: Props) {
  const [data, setData]           = useState(transacao.data)
  const [tipo, setTipo]           = useState<TipoTransacao>(transacao.tipo)
  const [subtipo, setSubtipo]     = useState<Subtipo>((transacao.subtipo as Subtipo) || '')
  const [categoria, setCategoria] = useState(transacao.categoria)
  const [valor, setValor]         = useState(String(transacao.valor))
  const [descricao, setDescricao] = useState(transacao.descricao || '')
  const [saving, setSaving]       = useState(false)
  const [escopo, setEscopo]       = useState<EscopoEdicao>('esta')

  const isRecorrente = !!transacao.recorrente && !!transacao.grupoId
  const isInvestido  = tipo === 'Investido'

  const categoriasDisponiveis = tipo === 'Entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA
  const opcoesCategoria = categoriasDisponiveis.includes(categoria)
    ? categoriasDisponiveis
    : categoria ? [categoria, ...categoriasDisponiveis] : categoriasDisponiveis

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const campos = {
      tipo,
      subtipo: isInvestido ? subtipo : '',
      valor: parseFloat(valor),
      categoria,
      descricao,
    }

    if (isRecorrente && escopo === 'todas') {
      // Atualiza todas as parcelas do grupo (não altera data de cada uma)
      await updateGrupoTransacoes(uid, transacao.grupoId!, campos)
    } else {
      // Atualiza só esta parcela (inclui data)
      await updateTransacao(uid, transacao.id, { data, ...campos })
    }

    setSaving(false)
    onSaved()
  }

  const parcelaLabel = transacao.parcelaNumero && transacao.mesesRecorrencia
    ? `Parcela ${transacao.parcelaNumero}/${transacao.mesesRecorrencia || '∞'}`
    : 'Recorrente'

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal — scroll interno para nunca cortar o botão */}
      <div
        className="fixed z-50 w-full max-w-md rounded-xl overflow-hidden"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)',
          border: '1px solid rgba(0,229,255,.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,.7)',
        }}
      >
        {/* Header — fixo */}
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}
        >
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--dim)' }}>
            ✏️ Editar Transação
          </span>
          <div className="flex items-center gap-2">
            {isRecorrente && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.3)' }}
              >
                <RefreshCw size={10} />
                {parcelaLabel}
              </span>
            )}
            <BtnGhost onClick={onClose}><X size={15} /></BtnGhost>
          </div>
        </div>

        {/* Body — com scroll */}
        <form
          onSubmit={handleSubmit}
          style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', flex: 1 }}
        >
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Escopo de edição — só aparece para parcelados */}
            {isRecorrente && (
              <div className="col-span-1 sm:col-span-2">
                <Label>Aplicar alteração em</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {([
                    { v: 'esta',  label: 'Só esta parcela',    icon: '1' },
                    { v: 'todas', label: 'Todas as parcelas',  icon: '∞' },
                  ] as { v: EscopoEdicao; label: string; icon: string }[]).map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setEscopo(opt.v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 12px', borderRadius: 8,
                        border: `1px solid ${escopo === opt.v ? 'var(--cyan)' : 'var(--border)'}`,
                        background: escopo === opt.v ? 'rgba(0,229,255,0.08)' : 'var(--surface2)',
                        color: escopo === opt.v ? 'var(--cyan)' : 'var(--muted)',
                        fontSize: 11, fontWeight: escopo === opt.v ? 700 : 400,
                        cursor: 'pointer', transition: 'all .15s',
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700,
                        background: escopo === opt.v ? 'var(--cyan)' : 'var(--border)',
                        color: escopo === opt.v ? '#000' : 'var(--muted)',
                      }}>
                        {opt.icon}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {escopo === 'todas' && (
                  <div
                    className="flex items-start gap-2 mt-2 px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(255,193,7,0.07)', border: '1px solid rgba(255,193,7,0.25)', color: '#ffc107' }}
                  >
                    <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                    Valor, categoria e descrição serão atualizados em todas as parcelas do grupo. A data de cada parcela é mantida.
                  </div>
                )}
              </div>
            )}

            {/* Data — só editável quando escopo = 'esta' ou não é recorrente */}
            <div>
              <Label>Data</Label>
              <DatePicker
                value={data}
                onChange={setData}
                disabled={isRecorrente && escopo === 'todas'}
                style={{ opacity: isRecorrente && escopo === 'todas' ? 0.4 : 1 }}
              />
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
              <div
                className="col-span-1 sm:col-span-2 rounded-lg p-3 flex flex-col gap-3"
                style={{ background: 'var(--surface3)', border: '1px solid var(--border)' }}
              >
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
              <div className="col-span-1 sm:col-span-2">
                <Label>Categoria</Label>
                <Select value={categoria} onChange={e => setCategoria(e.target.value)} required>
                  <option value="">Selecione a categoria...</option>
                  {opcoesCategoria.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            )}

            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number" value={valor}
                onChange={e => setValor(e.target.value)}
                step="0.01" min="0.01" required
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                type="text" value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Opcional..."
              />
            </div>
          </div>

          {/* Footer — sempre visível */}
          <div
            className="flex items-center justify-end gap-3 px-5 py-4"
            style={{ borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)' }}
          >
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-semibold transition-all"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--dim)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <BtnPrimary type="submit" disabled={saving} className="w-auto px-5 py-2">
              {saving
                ? 'Salvando...'
                : escopo === 'todas' && isRecorrente
                  ? '✓ Salvar todas as parcelas'
                  : '✓ Salvar'}
            </BtnPrimary>
          </div>
        </form>
      </div>
    </>
  )
}
