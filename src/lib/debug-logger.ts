// デバッグログの永続化ユーティリティ
export class DebugLogger {
  private static instance: DebugLogger
  private logs: Array<{ timestamp: string; category: string; message: string; data?: unknown }> = []
  private maxLogs = 100

  private constructor() {
    // ページ読み込み時に既存のログを復元
    this.loadLogs()
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger()
    }
    return DebugLogger.instance
  }

  log(category: string, message: string, data?: unknown) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data
    }
    
    // コンソールにも出力
    console.log(`[${category}] ${message}`, data || '')
    
    // ログリストに追加
    this.logs.push(logEntry)
    
    // 最大数を超えたら古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
    
    // localStorageに保存
    this.saveLogs()
  }

  private saveLogs() {
    try {
      localStorage.setItem('debug_logs', JSON.stringify(this.logs))
    } catch (error) {
      console.warn('Failed to save debug logs to localStorage:', error)
    }
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem('debug_logs')
      if (stored) {
        this.logs = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load debug logs from localStorage:', error)
      this.logs = []
    }
  }

  getLogs(category?: string): Array<{ timestamp: string; category: string; message: string; data?: unknown }> {
    return category 
      ? this.logs.filter(log => log.category === category)
      : this.logs
  }

  clearLogs() {
    this.logs = []
    localStorage.removeItem('debug_logs')
  }

  // ブラウザコンソールでログを確認するためのヘルパー
  showLogs(category?: string) {
    const logsToShow = this.getLogs(category)
    console.group(`=== Debug Logs ${category ? `(${category})` : ''} ===`)
    logsToShow.forEach(log => {
      console.log(`[${log.timestamp}] [${log.category}] ${log.message}`, log.data || '')
    })
    console.groupEnd()
  }
}

// グローバルからアクセス可能にする
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).debugLogger = DebugLogger.getInstance()
}