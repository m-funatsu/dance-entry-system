'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ErrorType, ErrorSeverity, AppError, ErrorHandlerOptions } from '@/lib/types'
import { logger } from '@/lib/logger'

// エラーメッセージのマッピング
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'ネットワークエラーが発生しました',
  [ErrorType.API]: 'APIエラーが発生しました',
  [ErrorType.AUTH]: '認証エラーが発生しました',
  [ErrorType.UNAUTHORIZED]: 'アクセス権限がありません',
  [ErrorType.VALIDATION]: '入力内容に誤りがあります',
  [ErrorType.FORM_VALIDATION]: 'フォームの入力内容を確認してください',
  [ErrorType.FILE_UPLOAD]: 'ファイルのアップロードに失敗しました',
  [ErrorType.FILE_SIZE]: 'ファイルサイズが大きすぎます',
  [ErrorType.FILE_TYPE]: '許可されていないファイル形式です',
  [ErrorType.DATABASE]: 'データベースエラーが発生しました',
  [ErrorType.SUPABASE]: 'Supabaseエラーが発生しました',
  [ErrorType.APPLICATION]: 'アプリケーションエラーが発生しました',
  [ErrorType.UNKNOWN]: '予期しないエラーが発生しました'
}

interface UseErrorHandlerReturn {
  error: AppError | null
  errors: AppError[]
  handleError: (error: unknown, options?: ErrorHandlerOptions) => void
  clearError: () => void
  clearErrors: () => void
  hasError: boolean
}

// エラータイプを判定
const determineErrorType = (error: unknown): ErrorType => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      // ネットワークエラー
      if (message.includes('network') || message.includes('fetch')) {
        return ErrorType.NETWORK
      }
      
      // 認証エラー
      if (message.includes('auth') || message.includes('unauthorized')) {
        return ErrorType.AUTH
      }
      
      // ファイルエラー
      if (message.includes('file') || message.includes('upload')) {
        if (message.includes('size')) return ErrorType.FILE_SIZE
        if (message.includes('type') || message.includes('format')) return ErrorType.FILE_TYPE
        return ErrorType.FILE_UPLOAD
      }
      
      // データベースエラー
      if (message.includes('database') || message.includes('supabase')) {
        return ErrorType.SUPABASE
      }
      
      // バリデーションエラー
      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorType.VALIDATION
      }
    }
    
    return ErrorType.UNKNOWN
}

// エラー重要度を判定
const determineErrorSeverity = (type: ErrorType): ErrorSeverity => {
    switch (type) {
      case ErrorType.AUTH:
      case ErrorType.UNAUTHORIZED:
      case ErrorType.DATABASE:
      case ErrorType.SUPABASE:
        return ErrorSeverity.HIGH
      case ErrorType.NETWORK:
      case ErrorType.API:
      case ErrorType.FILE_UPLOAD:
        return ErrorSeverity.MEDIUM
      case ErrorType.VALIDATION:
      case ErrorType.FORM_VALIDATION:
      case ErrorType.FILE_SIZE:
      case ErrorType.FILE_TYPE:
        return ErrorSeverity.LOW
      default:
        return ErrorSeverity.MEDIUM
    }
}

// AppError オブジェクトを作成
const createAppError = (error: unknown, context?: Record<string, unknown>): AppError => {
    const type = determineErrorType(error)
    const severity = determineErrorSeverity(type)
    
    const message = ERROR_MESSAGES[type]
    let details: string | undefined
    let stack: string | undefined
    let code: string | undefined
    
    if (error instanceof Error) {
      details = error.message
      stack = error.stack
      // Supabaseエラーの場合
      if ('code' in error && typeof error.code === 'string') {
        code = error.code
      }
    } else if (typeof error === 'string') {
      details = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      details = String(error.message)
    }
    
    return {
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      context,
      stack,
      code
    }
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null)
  const [errors, setErrors] = useState<AppError[]>([])
  const errorQueueRef = useRef<AppError[]>([])

  // エラーハンドリング
  const handleError = useCallback((error: unknown, options: ErrorHandlerOptions = {}) => {
    const {
      showToast = true,
      logToServer = process.env.NODE_ENV === 'production',
      fallbackMessage
    } = options
    
    const appError = createAppError(error)
    
    // カスタムメッセージがある場合は上書き
    if (fallbackMessage) {
      appError.message = fallbackMessage
    }
    
    // ログ出力
    const logContext = {
      action: options.context?.action,
      metadata: {
        type: appError.type,
        severity: appError.severity,
        details: appError.details,
        code: appError.code,
        ...options.context
      }
    }
    
    // 重要度によってログレベルを変更
    switch (appError.severity) {
      case ErrorSeverity.HIGH:
        logger.error(appError.message, error, logContext)
        break
      case ErrorSeverity.MEDIUM:
        logger.warn(appError.message, logContext)
        break
      case ErrorSeverity.LOW:
        logger.info(appError.message, logContext)
        break
    }
    
    // エラーキューに追加（バッチ送信用）
    if (logToServer) {
      errorQueueRef.current.push(appError)
    }
    
    // エラーを状態に設定
    setError(appError)
    setErrors(prev => [...prev, appError])
    
    // 一定時間後に最新エラーをクリア（トースト表示用）
    if (showToast) {
      setTimeout(() => {
        setError(null)
      }, 5000)
    }
  }, [])

  // エラーのクリア
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
    errorQueueRef.current = []
  }, [])

  // エラーログのバッチ送信（将来的に実装）
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && errorQueueRef.current.length > 0) {
      const sendErrors = async () => {
        // const errorsToSend = [...errorQueueRef.current]
        errorQueueRef.current = []
        
        // TODO: エラーログAPIに送信
        // await sendErrorsToServer(errorsToSend)
      }
      
      const interval = setInterval(sendErrors, 60000) // 1分ごと
      return () => clearInterval(interval)
    }
  }, [])

  return {
    error,
    errors,
    handleError,
    clearError,
    clearErrors,
    hasError: error !== null
  }
}