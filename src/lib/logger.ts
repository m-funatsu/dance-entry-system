import { ErrorType } from '@/lib/types'

// ログレベルの定義
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// ログコンテキストの型定義
export interface LogContext {
  userId?: string
  entryId?: string
  action?: string
  metadata?: Record<string, unknown>
}

// ログエントリーの型定義
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    type?: ErrorType
  }
}

// ログ設定
export interface LoggerConfig {
  isDevelopment: boolean
  logLevel: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint?: string
}

// デフォルト設定
const defaultConfig: LoggerConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT
}

class Logger {
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // ログレベルの優先度を数値で取得
  private getLogLevelPriority(level: LogLevel): number {
    const priorities: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
      [LogLevel.FATAL]: 4
    }
    return priorities[level]
  }

  // ログを出力すべきかチェック
  private shouldLog(level: LogLevel): boolean {
    return this.getLogLevelPriority(level) >= this.getLogLevelPriority(this.config.logLevel)
  }

  // ログエントリーの作成
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.isDevelopment ? error.stack : undefined
      }
    }

    return entry
  }

  // コンソールへの出力
  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return

    const { level, message, context, error } = entry
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, context)
        break
      case LogLevel.INFO:
        console.info(prefix, message, context)
        break
      case LogLevel.WARN:
        console.warn(prefix, message, context)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, message, context, error)
        break
    }
  }
  
  // ローカルストレージへの保存（開発環境のみ）
  private saveToLocalStorage(entry: LogEntry): void {
    if (typeof window === 'undefined') return
    
    try {
      const storedLogs = localStorage.getItem('app_logs')
      const logs: LogEntry[] = storedLogs ? JSON.parse(storedLogs) : []
      
      // 最大500件まで保存
      logs.push(entry)
      if (logs.length > 500) {
        logs.splice(0, logs.length - 500)
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs))
    } catch {
      // ローカルストレージのエラーは無視
    }
  }

  // リモートサーバーへの送信
  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      })
    } catch {
      // リモートログ送信の失敗は無視（無限ループを防ぐため）
    }
  }

  // パブリックメソッド
  public debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
    this.logToConsole(entry)
    if (this.config.isDevelopment) {
      this.saveToLocalStorage(entry)
    }
  }

  public info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    const entry = this.createLogEntry(LogLevel.INFO, message, context)
    this.logToConsole(entry)
    this.saveToLocalStorage(entry)
    this.logToRemote(entry)
  }

  public warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return
    const entry = this.createLogEntry(LogLevel.WARN, message, context)
    this.logToConsole(entry)
    this.saveToLocalStorage(entry)
    this.logToRemote(entry)
  }

  public error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return
    const errorObj = error instanceof Error ? error : new Error(String(error))
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, errorObj)
    this.logToConsole(entry)
    this.saveToLocalStorage(entry)
    this.logToRemote(entry)
  }

  public fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.FATAL)) return
    const errorObj = error instanceof Error ? error : new Error(String(error))
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, errorObj)
    this.logToConsole(entry)
    this.saveToLocalStorage(entry)
    this.logToRemote(entry)
  }

  // 設定の動的変更
  public setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// シングルトンインスタンスのエクスポート
export const logger = new Logger()

// 開発環境でのみ使用するヘルパー関数
export const devLog = (message: string, ...args: unknown[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] ${message}`, ...args)
  }
}

// パフォーマンス計測用のヘルパー
export const logPerformance = (
  operation: string,
  callback: () => void | Promise<void>
): void | Promise<void> => {
  const start = performance.now()
  const result = callback()
  
  const logTime = () => {
    const duration = performance.now() - start
    logger.debug(`Performance: ${operation} took ${duration.toFixed(2)}ms`)
  }

  if (result instanceof Promise) {
    return result.finally(logTime)
  } else {
    logTime()
    return result
  }
}