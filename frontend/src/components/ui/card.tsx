import * as React from 'react'
import { cn } from '../../lib/utils'

type CardProps = {
  className?: string
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={cn('w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-200 p-8', className)}>
      {children}
    </div>
  )
}

type SectionProps = {
  children?: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<SectionProps> = ({ children, className }) => {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export const CardContent: React.FC<SectionProps> = ({ children, className }) => {
  return <div className={cn('py-4', className)}>{children}</div>
}

export const CardFooter: React.FC<SectionProps> = ({ children, className }) => {
  return <div className={cn('mt-4', className)}>{children}</div>
}
