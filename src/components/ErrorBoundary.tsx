'use client'

import React, { Component, ReactNode } from 'react'
import { ErrorType, ErrorSeverity, AppError } from '@/lib/types'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: AppError) => void
}

interface State {
  hasError: boolean
  error: AppError | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    const appError: AppError = {
      type: ErrorType.APPLICATION,
      severity: ErrorSeverity.HIGH,
      message: 'アプリケーションエラーが発生しました',
      details: error.message,
      timestamp: new Date(),
      stack: error.stack
    }

    return {
      hasError: true,
      error: appError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError: AppError = {
      type: ErrorType.APPLICATION,
      severity: ErrorSeverity.HIGH,
      message: 'アプリケーションエラーが発生しました',
      details: error.message,
      timestamp: new Date(),
      stack: error.stack,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    }

    // 開発環境でのログ
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.groupEnd()
    }

    // 親コンポーネントへのエラー通知
    if (this.props.onError) {
      this.props.onError(appError)
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // カスタムフォールバック
      if (this.props.fallback) {
        return this.props.fallback
      }

      // デフォルトフォールバック
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
              エラーが発生しました
            </h1>
            <p className="mt-2 text-sm text-center text-gray-600">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error.details && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <p className="text-xs text-gray-700 font-mono">
                  {this.state.error.details}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}