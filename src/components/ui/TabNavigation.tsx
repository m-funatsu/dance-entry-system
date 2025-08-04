'use client'

import React, { memo, useCallback } from 'react'
import { TabNavigationProps } from '@/lib/types'

export const TabNavigation = memo<TabNavigationProps>(({ tabs, activeTab, onTabChange }) => {
  const handleTabClick = useCallback((tabId: string) => {
    onTabChange(tabId)
  }, [onTabChange])
  
  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center">
              {tab.label}
              {tab.hasErrors && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  !
                </span>
              )}
              {tab.isComplete && !tab.hasErrors && (
                <svg className="ml-2 w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
})

TabNavigation.displayName = 'TabNavigation'