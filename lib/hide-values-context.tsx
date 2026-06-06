'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

interface HideValuesCtx {
  hidden: boolean
  toggle: () => void
}

const Ctx = createContext<HideValuesCtx>({ hidden: false, toggle: () => {} })

export function HideValuesProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  return (
    <Ctx.Provider value={{ hidden, toggle: () => setHidden(v => !v) }}>
      {children}
    </Ctx.Provider>
  )
}

export function useHideValues() { return useContext(Ctx) }

/** Retorna '••••••' se oculto, senão o valor original */
export function maskValue(value: string, hidden: boolean): string {
  return hidden ? '••••••' : value
}
