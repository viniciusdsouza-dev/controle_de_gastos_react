'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addTransacao, addPosition, getPositions, addAporte } from '../../lib/db'
import { Panel, PanelHeader, PanelBody, Dot, Label, Input, Select, BtnPrimary } from './index'
import DatePicker from './DatePicker'
import { ATIVOS, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '../../lib/utils'
import { taxaAnualParaMensal, taxaMensalParaAnual, fmtTaxa } from '../../lib/investimentos'
import { Plus, RefreshCw, TrendingUp } from 'lucide-react'
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

type ModoTaxa = 'anual' | 'mensal'

export default function TransacaoForm({ uid, defaultData, onSaved }: Props) {
  const router = useRouter()

  const [data, setData]           = useState(defaultData)
  useEffect(() => { setData(defaultData) }, [defaultData])

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

  // Taxa de rendimento (só para Investido)
  const [modoTaxa, setModoTaxa]   = useState<ModoTaxa>('anual')
  const [taxaInput, setTaxaInput] = useState('')
  const taxaNum    = parseFloat(taxaInput.replace(',', '.')) || 0
  const taxaAnual  = modoTaxa === 'anual'  ? taxaNum : taxaMensalParaAnual(taxaNum)
  const taxaMensal = modoTaxa === 'mensal' ? taxaNum : taxaAnualParaMensal(taxaNum)

  const isInvestido = tipo === 'Investido'
  const categoriasDisponiveis = tipo === 'Entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA
  const qtdMeses = tipoRecorrencia === 'fixo' ? mesesRecorrencia : '12'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoria || !valor) return
    setSaving(true)

    const valorNum = parseFloat(valor)

    // 1. Salva a transação normalmente
    if (recorrente) {
      const grupoId = generateId()
      const meses   = tipoRecorrencia === 'fixo' ? parseInt(mesesRecorrencia) : 12
      const promises = []
      for (let i = 0; i < meses; i++) {
        const dataParcela = addMonthsToDate(data, i)
        promises.push(
          addTransacao(uid, {
            data: dataParcela, tipo,
            subtipo: isInvestido ? subtipo : '',
            valor: valorNum, categoria, descricao,
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
        subtipo: isInvestido ? subtipo : '',
        valor: valorNum, categoria, descricao,
      })
    }

    // 2. Se for investimento com taxa informada → criar/atualizar position
    if (isInvestido && taxaNum > 0) {
      // Verifica se já existe position para esse ativo
      const positions = await getPositions(uid)
      const existente = positions.find(
        p => p.categoria === categoria && p.subtipo === subtipo && p.ativo
      )

      if (existente) {
        // Adiciona aporte na position existente
        await addAporte(uid, existente.id, { data, valor: valorNum })
      } else {
        // Cria nova position e já registra o aporte inicial
        const posId = await addPosition(uid, {
          nome:       descricao || categoria,
          subtipo:    subtipo as Subtipo,
          categoria,
          taxaAnual:  parseFloat(taxaAnual.toFixed(6)),
          taxaMensal: parseFloat(taxaMensal.toFixed(6)),
          dataInicio: data,
          ativo:      true,
          observacao: '',
        })
        await addAporte(uid, posId, { data, valor: valorNum })
      }
    }

    // 3. Reset form
    setValor('')
    setDescricao('')
    setCategoria('')
    setSubtipo('')
    setTaxaInput('')
    setRecorrente(false)
    setSaving(false)

    // 4. Redireciona para investimentos se for tipo Investido, senão recarrega dashboard
    if (isInvestido) {
      router.push('/investimentos')
    } else {
      onSaved()
    }
  }

  return (
    <Panel>
      <PanelHeader><Dot color="cyan" />Nova Transação</PanelHeader>
      <PanelBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          <div>
            <Label>Data</Label>
            <DatePicker value={data} onChange={setData} />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onChange={e => {
              setTipo(e.target.value as TipoTransacao)
              setSubtipo('')
              setCategoria('')
              setTaxaInput('')
            }}>
              <option value="Entrada">↓ Entrada</option>
              <option value="Saída">↑ Saída</option>
              <option value="Investido">◆ Investido</option>
            </Select>
          </div>

          {/* Bloco Investido */}
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

              {/* Taxa de rendimento */}
              {subtipo && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label style={{ marginBottom: 0 }}>
                      <TrendingUp size={10} className="inline mr-1" />
                      Taxa de rendimento
                      <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 9 }}> (opcional)</span>
                    </Label>
                    <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      {(['anual', 'mensal'] as ModoTaxa[]).map(m => (
                        <button key={m} type="button" onClick={() => setModoTaxa(m)}
                          className="px-2 py-0.5 text-xs font-bold transition-all"
                          style={{
                            background: modoTaxa === m ? 'var(--cyan)' : 'var(--surface2)',
                            color:      modoTaxa === m ? '#000' : 'var(--dim)',
                            border: 'none', cursor: 'pointer',
                          }}>
                          {m === 'anual' ? 'a.a.' : 'a.m.'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type="number" step="0.001" min="0"
                      value={taxaInput}
                      onChange={e => setTaxaInput(e.target.value)}
                      placeholder={modoTaxa === 'anual' ? 'ex: 12,5' : 'ex: 0,98'}
                      style={{ paddingRight: 28 }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: 'var(--dim)' }}>%</span>
                  </div>
                  {taxaNum > 0 && (
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs" style={{ color: 'var(--dim)' }}>
                        Mensal: <strong style={{ color: 'var(--cyan)' }}>{fmtTaxa(taxaMensal)}</strong>
                      </span>
                      <span className="text-xs" style={{ color: 'var(--dim)' }}>
                        Anual: <strong style={{ color: 'var(--cyan)' }}>{fmtTaxa(taxaAnual)}</strong>
                      </span>
                    </div>
                  )}
                  {taxaNum === 0 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      Informe a taxa para acompanhar o rendimento em Investimentos.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Categoria (Entrada/Saída) */}
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
            <Label>{isInvestido ? 'Nome / Apelido (opcional)' : 'Descrição (opcional)'}</Label>
            <Input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder={isInvestido ? 'ex: CDB Nubank 120% CDI' : 'Detalhes...'} />
          </div>

          {/* Recorrência — só para não-investido */}
          {!isInvestido && (
            <div className="rounded-lg p-3 flex flex-col gap-3"
              style={{
                background: recorrente ? 'rgba(0,229,255,0.05)' : 'var(--surface2)',
                border: `1px solid ${recorrente ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
                transition: 'all .2s',
              }}>
              <button type="button" onClick={() => setRecorrente(!recorrente)}
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
          )}

          <BtnPrimary type="submit" disabled={saving} className="mt-1">
            <Plus size={13} className="inline mr-1" />
            {saving
              ? 'Salvando...'
              : isInvestido
                ? 'Registrar e ver Investimentos →'
                : recorrente
                  ? `Adicionar (${qtdMeses} meses)`
                  : 'Adicionar'}
          </BtnPrimary>
        </form>
      </PanelBody>
    </Panel>
  )
}
