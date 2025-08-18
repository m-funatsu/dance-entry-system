import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // 各ステータスフィールドを個別に追加
    const statusFields = [
      'preliminary_info_status',
      'semifinals_info_status', 
      'finals_info_status',
      'program_info_status',
      'sns_info_status',
      'applications_info_status'
    ]

    const results = []
    
    for (const fieldName of statusFields) {
      try {
        // フィールドが存在するかチェック
        const { data: columns } = await adminSupabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'entries')
          .eq('column_name', fieldName)
        
        if (!columns || columns.length === 0) {
          // フィールドが存在しない場合は追加
          // 注意: 直接SQLを実行するため、エラーが発生する可能性があります
          console.log(`${fieldName} フィールドを追加中...`)
          results.push(`${fieldName}: フィールド追加が必要（手動で実行してください）`)
        } else {
          results.push(`${fieldName}: 既に存在`)
        }
      } catch (error) {
        console.error(`${fieldName} チェックエラー:`, error)
        results.push(`${fieldName}: エラー - ${error}`)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'ステータスフィールドのチェックが完了しました',
      results,
      migration_sql: `
-- 以下のSQLを手動でSupabase SQLエディタで実行してください:

ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS preliminary_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS semifinals_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS finals_info_status text DEFAULT '入力中', 
ADD COLUMN IF NOT EXISTS program_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS sns_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS applications_info_status text DEFAULT '入力中';
      `
    })

  } catch (error) {
    console.error('マイグレーション API エラー:', error)
    return NextResponse.json(
      { 
        error: 'システムエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}