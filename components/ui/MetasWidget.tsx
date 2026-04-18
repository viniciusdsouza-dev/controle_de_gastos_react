'use client'
import { Panel, PanelHeader, PanelBody, Dot } from './index'
import { brl } from '../../lib/utils'
import type { Meta } from '../../types'

interface Props {
  metas: Meta[]
  gastosCat: Record<string, number>
}

export default function MetasWidget({ metas, gastosCat }: Props) {
  return (
    <Panel>
      <PanelHeader><Dot color="green" />Metas do Mês</PanelHeader>
      <PanelBody className="flex flex-col gap-3">
        {metas.map(meta => {
          const gasto = gastosCat[meta.categoria] || 0
          const pct   = meta.limite > 0 ? Math.min(Math.round((gasto / meta.limite) * 100), 100) : 0
          const ok    = gasto <= meta.limite
          return (
            <div key={meta.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{meta.categoria}</span>
                <span className="font-mono" style={{ color: ok ? 'var(--green)' : 'var(--red)', fontSize: '0.7rem' }}>
                  {brl(gasto)} / {brl(meta.limite)}
                </span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)', height: 5 }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: ok
                      ? 'linear-gradient(90deg,var(--green),#00bfa5)'
                      : 'linear-gradient(90deg,var(--red),#ff6d00)',
                  }} />
              </div>
              <div className="text-right text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{pct}%</div>
            </div>
          )
        })}
      </PanelBody>
    </Panel>
  )
}
