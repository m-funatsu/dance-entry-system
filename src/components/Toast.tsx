'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // アニメーション完了後にクローズ
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const baseClasses = "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 max-w-sm"
  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white", 
    info: "bg-blue-500 text-white"
  }

  return (
    <div 
      className={`${baseClasses} ${typeClasses[type]} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2">
            {type === 'success' && '✓'}
            {type === 'error' && '✗'}
            {type === 'info' && 'ℹ'}
          </span>
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-4 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  )
}