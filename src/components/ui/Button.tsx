'use client'

import React, { memo, useMemo } from 'react'
import type { ButtonProps } from '@/lib/types'

export const Button = memo<ButtonProps>(({
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
  fullWidth = false
}) => {
  const combinedClassName = useMemo(() => {
    const baseClass = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      cancel: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
    }
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
    
    const widthClass = fullWidth ? 'w-full' : ''
    
    return `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`
  }, [variant, size, fullWidth, className])
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={combinedClassName}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {loading ? '処理中...' : children}
    </button>
  )
})

Button.displayName = 'Button'

// 一時保存ボタン用のプリセット
export const TemporarySaveButton = memo<Omit<ButtonProps, 'variant' | 'children'>>((props) => (
  <Button variant="secondary" {...props}>
    一時保存
  </Button>
))
TemporarySaveButton.displayName = 'TemporarySaveButton'

// 保存ボタン用のプリセット
export const SaveButton = memo<Omit<ButtonProps, 'variant' | 'children'>>((props) => (
  <Button variant="primary" {...props}>
    保存
  </Button>
))
SaveButton.displayName = 'SaveButton'

// キャンセルボタン用のプリセット
export const CancelButton = memo<Omit<ButtonProps, 'variant' | 'children'>>((props) => (
  <Button variant="cancel" {...props}>
    キャンセル
  </Button>
))
CancelButton.displayName = 'CancelButton'