'use client'

import { useState, useEffect, useCallback } from 'react'
import { LogLevel, LogEntry } from '@/lib/logger'

interface LogViewerProps {
  maxEntries?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function LogViewer({ 
  maxEntries = 100, 
  autoRefresh = true,
  refreshInterval = 5000 
}: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // ローカルストレージからログを取得
  const fetchLogs = useCallback(() => {
    const storedLogs = localStorage.getItem('app_logs')
    if (storedLogs) {
      const parsedLogs: LogEntry[] = JSON.parse(storedLogs)
      setLogs(parsedLogs.slice(-maxEntries))
    }
  }, [maxEntries])

  useEffect(() => {
    fetchLogs()

    if (autoRefresh) {
      const interval = setInterval(fetchLogs, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, maxEntries, fetchLogs])

  // フィルタリングされたログ
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filter === 'all' || log.level === filter
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.context?.action?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesLevel && matchesSearch
  })

  // ログレベルごとの色
  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return 'text-gray-600'
      case LogLevel.INFO:
        return 'text-blue-600'
      case LogLevel.WARN:
        return 'text-yellow-600'
      case LogLevel.ERROR:
        return 'text-red-600'
      case LogLevel.FATAL:
        return 'text-red-800 font-bold'
      default:
        return 'text-gray-600'
    }
  }

  // ログのエクスポート
  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `logs_${new Date().toISOString().replace(/:/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // ログのクリア
  const clearLogs = () => {
    if (window.confirm('すべてのログを削除してもよろしいですか？')) {
      localStorage.removeItem('app_logs')
      setLogs([])
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-4">システムログ</h3>
        
        {/* コントロール */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* レベルフィルター */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogLevel | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">すべて</option>
            <option value={LogLevel.DEBUG}>デバッグ</option>
            <option value={LogLevel.INFO}>情報</option>
            <option value={LogLevel.WARN}>警告</option>
            <option value={LogLevel.ERROR}>エラー</option>
            <option value={LogLevel.FATAL}>致命的</option>
          </select>

          {/* 検索 */}
          <input
            type="text"
            placeholder="検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* アクション */}
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            エクスポート
          </button>
          
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            クリア
          </button>
        </div>
      </div>

      {/* ログリスト */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                時刻
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                レベル
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                メッセージ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                詳細
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.map((log, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {new Date(log.timestamp).toLocaleString('ja-JP')}
                </td>
                <td className={`px-4 py-2 whitespace-nowrap text-sm ${getLevelColor(log.level)}`}>
                  {log.level.toUpperCase()}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {log.message}
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {log.context?.action && (
                    <span className="block">アクション: {log.context.action}</span>
                  )}
                  {log.error && (
                    <details className="cursor-pointer">
                      <summary>エラー詳細</summary>
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ログがありません
          </div>
        )}
      </div>
    </div>
  )
}