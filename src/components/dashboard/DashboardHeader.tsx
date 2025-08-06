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
    <>
      {/* ヘッダーの高さ分のスペーサーを追加してガタつきを防ぐ */}
      <div className={`transition-all duration-300 ease-in-out ${
        scrolled ? 'h-14' : 'h-24'
      }`} />
      
      <header className={`bg-white shadow fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled ? 'py-2' : 'py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children || (
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {showDefaultTitle && (
                  <>
                    <h1 className={`font-bold text-gray-900 transition-all duration-300 ease-in-out transform ${
                      scrolled ? 'text-xl scale-90' : 'text-2xl scale-100'
                    }`}>
                      WDF エントリーシステム
                    </h1>
                    {user?.email && (
                      <span className={`ml-4 text-gray-600 transition-all duration-300 ease-in-out opacity-100 ${
                        scrolled ? 'text-xs opacity-70' : 'text-sm opacity-100'
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
    </>
  )
}