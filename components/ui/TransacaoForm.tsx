'use client'
import { useState } from 'react'
import { addTransacao } from '../../lib/db'
import { Panel, PanelHeader, PanelBody, Dot, Label, Input, Select, BtnPrimary } from './index'
import { ATIVOS } from '../../lib/utils'
import { Plus } from 'lucide-react'
import type { TipoTransacao, Subtipo } from '../../types'

interface Props {
  uid: string
  categorias: string[]
  defaultData: string
  filtroAno: string
  filtroMes: string
  onSaved: () => void
}

export default function TransacaoForm({ uid, categorias, defaultData, onSaved }: Props) {
  const [data, setData]           = useState(defaultData)
  const [tipo, setTipo]           = useState<TipoTransacao>('Entrada')
  const [subtipo, setSubtipo]     = useState<Subtipo>('')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor]         = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving]       = useState(false)

  // Update date when defaultData changes
  if (data !== defaultData && !saving) {/* noop */}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoria || !valor) return
    setSaving(true)
    await addTransacao(uid, {
      data, tipo, subtipo: tipo === 'Investido' ? subtipo : '',
      valor: parseFloat(valor), categoria, descricao,
    })
    setValor(''); setDescricao(''); setCategoria(''); setSubtipo('')
    setSaving(false)
    onSaved()
  }

  const isInvestido = tipo === 'Investido'

  return (
    <Panel>
      <PanelHeader><Dot color="cyan" />Nova Transação</PanelHeader>
      <PanelBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <Label>Data</Label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} required />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onChange={e => { setTipo(e.target.value as TipoTransacao); setSubtipo(''); setCategoria('') }}>
              <option value="Entrada">↓ Entrada</option>
              <option value="Saída">↑ Saída</option>
              <option value="Investido">◆ Investido</option>
            </Select>
          </div>

          {isInvestido && (
            <div className="rounded-lg p-3 flex flex-col gap-3"
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
                    <option value="">Selecione o ativo...</option>
                    {ATIVOS[subtipo]?.map(a => <option key={a} value={a}>{a}</option>)}
                  </Select>
                </div>
              )}
            </div>
          )}

          {!isInvestido && (
            <div>
              <Label>Categoria</Label>
              <Input
                type="text" value={categoria} onChange={e => setCategoria(e.target.value)}
                required placeholder="Ex: Alimentação" list="cat-list" />
              <datalist id="cat-list">{categorias.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          )}

          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" value={valor} onChange={e => setValor(e.target.value)}
              step="0.01" min="0.01" required placeholder="0,00" />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Detalhes..." />
          </div>
          <BtnPrimary type="submit" disabled={saving} className="mt-1">
            <Plus size={13} className="inline mr-1" />
            {saving ? 'Salvando...' : 'Adicionar'}
          </BtnPrimary>
        </form>
      </PanelBody>
    </Panel>
  )
}
