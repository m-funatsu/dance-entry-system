'use client'

import React from 'react'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { User } from '@supabase/supabase-js'

interface DashboardHeaderProps {
  user: User | null
  children?: React.ReactNode
  showDefaultTitle?: boolean
}

export function DashboardHeader({ user, children, showDefaultTitle = false }: DashboardHeaderProps) {
  const { scrolled } = useScrollDirection()

  return (
    <header className={`bg-white shadow sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'py-2' : 'py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children || (
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {showDefaultTitle && (
                <>
                  <h1 className={`font-bold text-gray-900 transition-all duration-300 ${
                    scrolled ? 'text-xl' : 'text-2xl'
                  }`}>
                    WDF エントリーシステム
                  </h1>
                  {user?.email && (
                    <span className={`ml-4 text-gray-600 transition-all duration-300 ${
                      scrolled ? 'text-xs' : 'text-sm'
                    }`}>
                      {user.email}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}