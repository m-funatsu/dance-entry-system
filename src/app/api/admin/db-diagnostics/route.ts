import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // 管理者クライアントでデータベース制約を確認
    const adminSupabase = createAdminClient()

    // 制約情報の直接取得は難しいため、既存データから推測する

    // 別の方法：実際のサンプルデータから制約を推測
    const { data: sampleEntries, error: sampleError } = await adminSupabase
      .from('entries')
      .select('applications_info_status, basic_info_status, preliminary_info_status, program_info_status, semifinals_info_status, finals_info_status, sns_info_status')
      .limit(10)

    console.log('サンプルエントリー:', sampleEntries, sampleError)

    // 各ステータスの値の分布を確認
    const statusValues: Record<string, Set<string>> = {
      applications_info_status: new Set(),
      basic_info_status: new Set(),
      preliminary_info_status: new Set(),
      program_info_status: new Set(),
      semifinals_info_status: new Set(),
      finals_info_status: new Set(),
      sns_info_status: new Set()
    }

    sampleEntries?.forEach(entry => {
      Object.keys(statusValues).forEach(key => {
        if (entry[key as keyof typeof entry] !== null && entry[key as keyof typeof entry] !== undefined) {
          statusValues[key].add(entry[key as keyof typeof entry] as string)
        }
      })
    })

    // applications_info_statusの制約を特別にテスト
    const testValues = ['申請なし', '申請あり', '入力中', '登録済み', '未登録']
    const testResults: Record<string, string> = {}

    for (const value of testValues) {
      try {
        // テスト用の最小限データを使用
        const testData = {
          user_id: user.id, // 実在するユーザーIDを使用
          participant_names: '診断テスト',
          basic_info_status: '未登録',
          preliminary_info_status: '未登録',
          program_info_status: '未登録',
          semifinals_info_status: '未登録',
          finals_info_status: '未登録',
          sns_info_status: '未登録',
          applications_info_status: value, // テスト値
          status: 'pending' as const
        }

        // 実際に挿入を試行
        const { data: insertedData, error: testError } = await adminSupabase
          .from('entries')
          .insert(testData)
          .select('id')

        if (testError) {
          testResults[value] = `制約エラー: ${testError.message}`
        } else if (insertedData && insertedData.length > 0) {
          testResults[value] = 'OK - 制約に適合'
          
          // テスト用データを即座に削除
          await adminSupabase
            .from('entries')
            .delete()
            .eq('id', insertedData[0].id)
        } else {
          testResults[value] = '不明なエラー'
        }
      } catch (error) {
        testResults[value] = `例外: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    return NextResponse.json({
      message: 'データベース診断結果',
      sample_data_status_values: Object.fromEntries(
        Object.entries(statusValues).map(([key, set]) => [key, Array.from(set)])
      ),
      applications_info_status_constraint_test: testResults,
      notes: [
        'サンプルデータから取得した実際のステータス値',
        'applications_info_statusのテスト結果',
        'テスト結果で「制約エラー」が出る値は制約に違反',
        'OK - 制約に適合」と表示される値が正しい制約値'
      ]
    })

  } catch (error) {
    console.error('Diagnostics error:', error)
    return NextResponse.json(
      { error: '診断処理中にエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}