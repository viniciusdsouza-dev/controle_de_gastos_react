'use client'
import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'

// ── PANEL ─────────────────────────────────────────────────────────────────────
interface PanelProps { children: ReactNode; className?: string }

export function Panel({ children, className }: PanelProps) {
  return (
    <div className={clsx('rounded-xl overflow-hidden', className)}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

export function PanelHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b"
      style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
        style={{ color: 'var(--dim)' }}>
        {children}
      </div>
      {action}
    </div>
  )
}

export function PanelBody({ children, className }: PanelProps) {
  return <div className={clsx('p-5', className)}>{children}</div>
}

// ── DOT ───────────────────────────────────────────────────────────────────────
const dotColors: Record<string, string> = {
  cyan:  'var(--cyan)',
  pink:  'var(--pink)',
  green: 'var(--green)',
  red:   'var(--red)',
  gold:  'var(--gold)',
}

export function Dot({ color }: { color: keyof typeof dotColors }) {
  const c = dotColors[color] || dotColors.cyan
  return (
    <span className="inline-block w-2 h-2 rounded-full"
      style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
  )
}

// ── SUMMARY CARD ──────────────────────────────────────────────────────────────
interface CardProps {
  label: string
  value: string
  accent: string
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

export function SummaryCard({ label, value, accent, icon, children, className }: CardProps) {
  return (
    <div className={clsx('relative rounded-xl p-5 overflow-hidden transition-all hover:-translate-y-0.5', className)}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'none' }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--dim)' }}>
        {label}
      </div>
      <div className="font-mono text-2xl font-bold leading-none" style={{ color: accent }}>
        {value}
      </div>
      {children}
      {icon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl opacity-10">
          {icon}
        </div>
      )}
    </div>
  )
}

// ── INPUT / SELECT ────────────────────────────────────────────────────────────
const inputClass = [
  'w-full rounded-md px-3 py-2 text-sm font-mono transition-all outline-none',
  'focus:ring-1',
].join(' ')

const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(inputClass, props.className)}
      style={{ ...inputStyle, ...props.style }}
    />
  )
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(inputClass, props.className)}
      style={{ ...inputStyle, ...props.style }}>
      {children}
    </select>
  )
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={clsx('block text-xs font-bold tracking-widest uppercase mb-1.5', className)}
      style={{ color: 'var(--dim)' }}>
      {children}
    </label>
  )
}

// ── BUTTONS ───────────────────────────────────────────────────────────────────
export function BtnPrimary({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx('w-full py-2.5 px-4 rounded-md text-xs font-bold tracking-widest uppercase transition-all hover:opacity-90 hover:-translate-y-px', className)}
      style={{ background: 'linear-gradient(135deg, var(--cyan), #0091ea)', color: '#000' }}>
      {children}
    </button>
  )
}

export function BtnOutline({ children, className, color = 'cyan', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { color?: string }) {
  const c = dotColors[color] || dotColors.cyan
  return (
    <button
      {...props}
      className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all', className)}
      style={{ background: 'transparent', border: `1px solid ${c}44`, color: c }}>
      {children}
    </button>
  )
}

export function BtnGhost({ children, className, danger, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      {...props}
      className={clsx('p-1.5 rounded transition-all', className,
        danger ? 'hover:bg-red-500/10 hover:text-red-400' : 'hover:bg-white/5')}
      style={{ background: 'transparent', border: 'none', color: 'var(--muted)' }}>
      {children}
    </button>
  )
}

// ── BADGES ────────────────────────────────────────────────────────────────────
export function Badge({ tipo, subtipo }: { tipo: string; subtipo?: string }) {
  const styles: Record<string, { bg: string; color: string; border: string; label: string }> = {
    'Entrada':   { bg: 'rgba(0,230,118,.1)',  color: 'var(--green)', border: 'rgba(0,230,118,.2)',  label: '↓ Entrada'   },
    'Saída':     { bg: 'rgba(255,23,68,.1)',   color: 'var(--red)',   border: 'rgba(255,23,68,.2)',   label: '↑ Saída'     },
    'Investido': { bg: 'rgba(255,215,64,.1)',  color: 'var(--gold)',  border: 'rgba(255,215,64,.2)',  label: '◆ Investido' },
  }
  const s = styles[tipo] || styles['Saída']
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="px-2 py-0.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
        {s.label}
      </span>
      {subtipo && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(255,255,255,.05)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
          {subtipo}
        </span>
      )}
    </span>
  )
}

export function BadgeCat({ children }: { children: ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(255,255,255,.05)', color: 'var(--dim)', border: '1px solid var(--border)' }}>
      {children}
    </span>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: 'var(--muted)' }}>
      <div className="text-3xl opacity-30">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--cyan)', borderTopColor: 'transparent' }} />
    </div>
  )
}
