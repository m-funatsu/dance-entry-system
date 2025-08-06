'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DeadlineNotice } from '@/components/ui'

export default function ApplicationsFormDebug() {
  const [deadline, setDeadline] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    async function fetchDeadline() {
      const supabase = createClient()
      
      try {
        // 全ての期限設定を取得してデバッグ
        const { data: allDeadlines, error: allError } = await supabase
          .from('section_deadlines')
          .select('*')
        
        console.log('All deadlines:', allDeadlines)
        console.log('All deadlines error:', allError)
        
        // optional_requestの期限を取得
        const { data, error } = await supabase
          .from('section_deadlines')
          .select('deadline')
          .eq('section_name', 'optional_request')
          .single()
        
        console.log('Deadline query result:', { data, error })
        
        setDebugInfo({
          allDeadlines,
          allError,
          specificDeadline: data,
          specificError: error
        })
        
        if (data?.deadline) {
          const date = new Date(data.deadline)
          const formatted = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          setDeadline(formatted)
        }
      } catch (err) {
        console.error('Error:', err)
        setDebugInfo({ error: err })
      } finally {
        setLoading(false)
      }
    }
    
    fetchDeadline()
  }, [])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">各種申請（デバッグ版）</h3>
      
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <>
          {deadline ? (
            <DeadlineNotice deadline={deadline} />
          ) : (
            <DeadlineNotice deadline="期限が設定されていません" />
          )}
          
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-medium mb-2">デバッグ情報:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}