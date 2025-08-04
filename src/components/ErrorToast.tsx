'use client'

import React, { useEffect } from 'react'
import { AppError, ErrorSeverity } from '@/lib/types'

interface ErrorToastProps {
  error: AppError | null
  onClose: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  useEffect(() => {
    if (error && autoClose) {
      const timer = setTimeout(onClose, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [error, autoClose, autoCloseDelay, onClose])

  if (!error) return null

  const getSeverityStyles = () => {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case ErrorSeverity.MEDIUM:
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case ErrorSeverity.HIGH:
        return 'bg-red-50 border-red-200 text-red-800'
      case ErrorSeverity.CRITICAL:
        return 'bg-red-100 border-red-300 text-red-900'
      default:
        return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  const getSeverityIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case ErrorSeverity.MEDIUM:
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-slide-in">
      <div className={`p-4 border rounded-lg shadow-lg ${getSeverityStyles()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getSeverityIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              {error.message}
            </p>
            {error.details && (
              <p className="mt-1 text-sm opacity-90">
                {error.details}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="inline-flex text-current opacity-70 hover:opacity-100 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}