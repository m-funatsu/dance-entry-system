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
        // section_deadlinesテーブルから全データを取得
        const { data: sectionData, error: sectionError } = await supabase
          .from('section_deadlines')
          .select('*')
        
        // admin_settingsテーブルから全データを取得（存在する場合）
        const { data: adminData, error: adminError } = await supabase
          .from('admin_settings')
          .select('*')
        
        // 特定のoptional_requestレコードを取得
        const { data: optionalData, error: optionalError } = await supabase
          .from('section_deadlines')
          .select('*')
          .eq('section_name', 'optional_request')
          .single()
        
        setDebugInfo({
          section_deadlines: {
            data: sectionData,
            error: sectionError,
            count: sectionData?.length || 0
          },
          admin_settings: {
            data: adminData,
            error: adminError,
            count: adminData?.length || 0
          },
          optional_request: {
            data: optionalData,
            error: optionalError
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