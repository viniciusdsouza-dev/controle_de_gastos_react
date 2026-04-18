export type TipoTransacao = 'Entrada' | 'Saída' | 'Investido'
export type Subtipo = 'Renda Fixa' | 'Renda Variável' | ''

export interface Transacao {
  id:        string
  data:      string   // YYYY-MM-DD
  tipo:      TipoTransacao
  subtipo:   Subtipo
  valor:     number
  categoria: string
  descricao: string
  criadoEm:  number
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
