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

    // 簡単にマイグレーション状況を確認
    const { data: testQuery } = await adminSupabase
      .from('entries')
      .select('id, basic_info_status')
      .limit(1)

    let hasStatusFields = false
    if (testQuery && testQuery.length > 0 && 'basic_info_status' in testQuery[0]) {
      hasStatusFields = true
    }

    return NextResponse.json({ 
      success: true,
      hasStatusFields,
      message: hasStatusFields ? 'ステータスフィールドは既に存在します' : 'ステータスフィールドの追加が必要です',
      migration_sql: `
-- フィールド追加のみ（制約は後で追加）
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS preliminary_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS semifinals_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS finals_info_status text DEFAULT '入力中', 
ADD COLUMN IF NOT EXISTS program_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS sns_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS applications_info_status text DEFAULT '入力中';

-- 実行完了確認
SELECT 'ステータスフィールドの追加が完了しました' as result;
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