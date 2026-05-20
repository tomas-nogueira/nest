import * as React from 'react'
import { cn } from '../../lib/utils'

export function SocialButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('w-full flex items-center gap-3 rounded-2xl border border-white/30 bg-white/100 px-4 py-3 text-sm text-slate-700', className)}
    >
      {children}
    </button>
  )
}
