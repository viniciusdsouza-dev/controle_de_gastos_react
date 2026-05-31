export type TipoTransacao = 'Entrada' | 'Saída' | 'Investido'
export type Subtipo = 'Renda Fixa' | 'Renda Variável' | ''

export interface Transacao {
  id:              string
  data:            string   // YYYY-MM-DD
  tipo:            TipoTransacao
  subtipo:         Subtipo
  valor:           number
  categoria:       string
  descricao:       string
  criadoEm:        number
  // Recorrência
  recorrente?:     boolean
  mesesRecorrencia?: number  // quantidade de meses (0 = indefinido/sempre)
  grupoId?:        string    // ID do grupo de transações recorrentes
  parcelaNumero?:  number    // número da parcela (1, 2, 3...)
}

export interface Meta {
  id:        string
  categoria: string
  limite:    number
  mes:       string   // YYYY-MM
}

export interface Config {
  ajusteSaldo: number
  modoSaldo:   'hoje' | 'mes'
}

export interface ResumoMes {
  mes:        string
  entradas:   number
  saidas:     number
  investidos: number
}

// ── INVESTIMENTOS ─────────────────────────────────────────────────────────────

export interface InvestimentoPosition {
  id:           string
  nome:         string          // ex: "CDB Nubank"
  subtipo:      Subtipo         // 'Renda Fixa' | 'Renda Variável'
  categoria:    string          // CDB, Ações, etc.
  taxaAnual:    number          // % ao ano  (ex: 12.5)
  taxaMensal:   number          // % ao mês  (ex: 0.98) — calculado ou informado
  dataInicio:   string          // YYYY-MM-DD primeiro aporte
  criadoEm:     number
  ativo:        boolean         // false = encerrado
  observacao?:  string
}

export interface Aporte {
  id:         string
  positionId: string
  data:       string    // YYYY-MM-DD
  valor:      number    // valor aportado
  criadoEm:  number
}

// ── BANCOS ────────────────────────────────────────────────────────────────────

export interface Banco {
  id:        string
  nome:      string    // "Nubank", "Itaú", etc.
  slug:      string    // "nubank", "itau" — chave para o logo
  cor:       string    // cor primária do banco (hex)
  apelido?:  string    // apelido do usuário ex: "Conta corrente"
  criadoEm:  number
}
