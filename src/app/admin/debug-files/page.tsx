'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DebugData {
  columns?: Array<{
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }>
  columnsError?: unknown
  entries?: Array<Record<string, unknown>>
  entriesError?: unknown
  musicFiles?: Array<Record<string, unknown>>
  musicError?: unknown
  chaserFiles?: Array<Record<string, unknown>>
  chaserError?: unknown
  fileTypeStats?: Array<Record<string, unknown>>
  totalEntries?: number
  totalMusicFiles?: number
  totalChaserFiles?: number
}

export default function DebugFilesPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/debug/entry-files')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
            ← 管理ダッシュボードに戻る
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">Entry Files Debug</h1>

        {/* カラム情報 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Table Columns</h2>
          {data?.columnsError ? (
            <p className="text-red-600">Error: {JSON.stringify(data.columnsError)}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Column Name</th>
                    <th className="px-4 py-2 text-left">Data Type</th>
                    <th className="px-4 py-2 text-left">Nullable</th>
                    <th className="px-4 py-2 text-left">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.columns?.map((col) => (
                    <tr key={col.column_name}>
                      <td className="px-4 py-2">{col.column_name}</td>
                      <td className="px-4 py-2">{col.data_type}</td>
                      <td className="px-4 py-2">{col.is_nullable}</td>
                      <td className="px-4 py-2">{col.column_default || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 音楽ファイル */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Music Files ({data?.totalMusicFiles || 0})</h2>
          {data?.musicError ? (
            <p className="text-red-600">Error: {JSON.stringify(data.musicError)}</p>
          ) : (
            <div className="overflow-x-auto">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(data?.musicFiles || [], null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Chaser Song Files */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Chaser Song Files ({data?.totalChaserFiles || 0})</h2>
          {data?.chaserError ? (
            <p className="text-red-600">Error: {JSON.stringify(data.chaserError)}</p>
          ) : (
            <div className="overflow-x-auto">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(data?.chaserFiles || [], null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* File Type Statistics */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">File Type & Purpose Statistics</h2>
          <div className="overflow-x-auto">
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(data?.fileTypeStats || [], null, 2)}
            </pre>
          </div>
        </div>

        {/* 全エントリー */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Entries ({data?.totalEntries || 0})</h2>
          {data?.entriesError ? (
            <p className="text-red-600">Error: {JSON.stringify(data.entriesError)}</p>
          ) : (
            <div className="overflow-x-auto">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(data?.entries || [], null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}