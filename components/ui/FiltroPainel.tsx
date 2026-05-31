'use client'
import { Panel, PanelHeader, PanelBody, Dot, Label, Select } from './index'
import { MESES, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '../../lib/utils'

interface Props {
  ano: string; setAno: (v: string) => void
  mes: string; setMes: (v: string) => void
  categoria: string; setCategoria: (v: string) => void
  anos: string[]
  categorias: string[]
}

const TODAS_CATEGORIAS_FIXAS = [...new Set([...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA])].sort()

export default function FiltroPainel({ ano, setAno, mes, setMes, categoria, setCategoria, anos, categorias }: Props) {
  // Mescla categorias fixas com as existentes (dados antigos podem ter categorias customizadas)
  const todasCategorias = [...new Set([...TODAS_CATEGORIAS_FIXAS, ...categorias])].sort()

  return (
    <Panel>
      <PanelHeader><Dot color="pink" />Filtros</PanelHeader>
      <PanelBody className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <div>
          <Label>Ano</Label>
          <Select value={ano} onChange={e => setAno(e.target.value)}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
        <div>
          <Label>Mês</Label>
          <Select value={mes} onChange={e => setMes(e.target.value)}>
            <option value="">Todos</option>
            {MESES.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </Select>
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {todasCategorias.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </PanelBody>
    </Panel>
  )
}
