'use client'
import { useEffect, useState } from 'react'
import { getBancos } from '../../lib/db'
import { BancoLogoSvg } from '../../lib/bancos'
import { Panel, PanelHeader, PanelBody, Dot } from './index'
import type { Banco } from '../../types'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function MeusBancosWidget({ uid }: { uid: string }) {
  const [bancos, setBancos] = useState<Banco[]>([])

  useEffect(() => {
    getBancos(uid).then(setBancos)
  }, [uid])

  return (
    <Panel>
      <PanelHeader>
        <span className="flex items-center gap-2"><Dot color="gold" />Meus Bancos</span>
        <Link href="/bancos"
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all"
          style={{ color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.05)' }}>
          <Plus size={10} /> Gerenciar
        </Link>
      </PanelHeader>
      <PanelBody>
        {bancos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Nenhum banco cadastrado.</p>
            <Link href="/bancos" className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>
              + Adicionar banco
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {bancos.map(b => (
              <div key={b.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                style={{
                  background: `${b.cor}12`,
                  border: `1px solid ${b.cor}33`,
                }}>
                <BancoLogoSvg slug={b.slug} size={28} />
                <div>
                  <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text)' }}>
                    {b.apelido || b.nome}
                  </p>
                  {b.apelido && (
                    <p className="text-xs leading-tight" style={{ color: 'var(--muted)', fontSize: 9 }}>
                      {b.nome}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelBody>
    </Panel>
  )
}
