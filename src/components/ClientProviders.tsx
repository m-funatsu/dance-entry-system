'use client'

import { ToastProvider } from '@/contexts/ToastContext'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}