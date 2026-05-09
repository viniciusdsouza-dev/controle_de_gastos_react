'use client'
import { useState } from 'react'
import { addTransacao } from '../../lib/db'
import { Panel, PanelHeader, PanelBody, Dot, Label, Input, Select, BtnPrimary } from './index'
import { ATIVOS, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '../../lib/utils'
import { Plus, RefreshCw } from 'lucide-react'
import type { TipoTransacao, Subtipo } from '../../types'

interface Props {
  uid: string
  categorias: string[]
  defaultData: string
  filtroAno: string
  filtroMes: string
  onSaved: () => void
}

function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function TransacaoForm({ uid, defaultData, onSaved }: Props) {
  const [data, setData]           = useState(defaultData)
  const [tipo, setTipo]           = useState<TipoTransacao>('Entrada')
  const [subtipo, setSubtipo]     = useState<Subtipo>('')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor]         = useState('')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving]       = useState(false)

  // Recorrência
  const [recorrente, setRecorrente]             = useState(false)
  const [mesesRecorrencia, setMesesRecorrencia] = useState('3')
  const [tipoRecorrencia, setTipoRecorrencia]   = useState<'fixo' | 'indefinido'>('fixo')

  const categoriasDisponiveis = tipo === 'Entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoria || !valor) return
    setSaving(true)

    const valorNum = parseFloat(valor)

    if (recorrente) {
      const grupoId = generateId()
      const meses   = tipoRecorrencia === 'fixo' ? parseInt(mesesRecorrencia) : 12
      const promises = []

      for (let i = 0; i < meses; i++) {
        const dataParcela = addMonthsToDate(data, i)
        promises.push(
          addTransacao(uid, {
            data: dataParcela,
            tipo,
            subtipo: tipo === 'Investido' ? subtipo : '',
            valor: valorNum,
            categoria,
            descricao,
            recorrente: true,
            mesesRecorrencia: tipoRecorrencia === 'fixo' ? parseInt(mesesRecorrencia) : 0,
            grupoId,
            parcelaNumero: i + 1,
          } as Parameters<typeof addTransacao>[1])
        )
      }
      await Promise.all(promises)
    } else {
      await addTransacao(uid, {
        data, tipo,
        subtipo: tipo === 'Investido' ? subtipo : '',
        valor: valorNum,
        categoria,
        descricao,
      })
    }

    setValor('')
    setDescricao('')
    setCategoria('')
    setSubtipo('')
    setRecorrente(false)
    setSaving(false)
    onSaved()
  }

  const isInvestido = tipo === 'Investido'
  const qtdMeses = tipoRecorrencia === 'fixo' ? mesesRecorrencia : '12'

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
              <Select value={categoria} onChange={e => setCategoria(e.target.value)} required>
                <option value="">Selecione a categoria...</option>
                {categoriasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
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

          {/* Recorrência */}
          <div className="rounded-lg p-3 flex flex-col gap-3"
            style={{
              background: recorrente ? 'rgba(0,229,255,0.05)' : 'var(--surface2)',
              border: `1px solid ${recorrente ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
              transition: 'all .2s'
            }}>
            <button
              type="button"
              onClick={() => setRecorrente(!recorrente)}
              className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all"
              style={{ color: recorrente ? 'var(--cyan)' : 'var(--muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <RefreshCw size={12} />
              {recorrente ? '✓ Recorrência ativada' : 'Ativar recorrência / parcelamento'}
            </button>

            {recorrente && (
              <div className="flex flex-col gap-2">
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipoRecorrencia} onChange={e => setTipoRecorrencia(e.target.value as 'fixo' | 'indefinido')}>
                    <option value="fixo">Parcelado (número fixo de meses)</option>
                    <option value="indefinido">Recorrente (próximos 12 meses)</option>
                  </Select>
                </div>
                {tipoRecorrencia === 'fixo' && (
                  <div>
                    <Label>Número de parcelas</Label>
                    <Select value={mesesRecorrencia} onChange={e => setMesesRecorrencia(e.target.value)}>
                      {[2,3,4,5,6,7,8,9,10,11,12,18,24,36,48,60].map(n => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </Select>
                  </div>
                )}
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {tipoRecorrencia === 'fixo'
                    ? `Serão criadas ${mesesRecorrencia} transações mensais. Cada uma pode ser editada individualmente.`
                    : 'Serão criadas 12 transações mensais a partir da data. Editáveis individualmente.'}
                </p>
              </div>
            )}
          </div>

          <BtnPrimary type="submit" disabled={saving} className="mt-1">
            <Plus size={13} className="inline mr-1" />
            {saving ? 'Salvando...' : recorrente ? `Adicionar (${qtdMeses} meses)` : 'Adicionar'}
          </BtnPrimary>
        </form>
      </PanelBody>
    </Panel>
  )
}
