'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TableDebug() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkTables() {
      const supabase = createClient()
      
      try {
        // settingsテーブルから期限設定を取得
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .in('key', [
            'basic_info_deadline',
            'music_info_deadline',
            'consent_form_deadline',
            'program_info_deadline',
            'semifinals_deadline',
            'finals_deadline',
            'sns_deadline',
            'optional_request_deadline'
          ])
        
        // optional_request_deadlineの設定を特別に取得
        const { data: optionalData, error: optionalError } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'optional_request_deadline')
          .single()
        
        setDebugInfo({
          settings_table: {
            data: settingsData,
            error: settingsError,
            exists: !settingsError || settingsError.code !== '42P01',
            count: settingsData?.length || 0
          },
          optional_request_deadline: {
            data: optionalData,
            error: optionalError,
            exists: !!optionalData
          }
        })
      } catch (err) {
        console.error('Table check error:', err)
        setDebugInfo({ error: String(err) })
      } finally {
        setLoading(false)
      }
    }
    
    checkTables()
  }, [])

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
      <h4 className="font-medium mb-2">テーブル確認デバッグ</h4>
      
      {loading ? (
        <p>確認中...</p>
      ) : (
        <pre className="text-xs overflow-auto whitespace-pre-wrap">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  )
}