import * as React from 'react'

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{children}</label>
}
