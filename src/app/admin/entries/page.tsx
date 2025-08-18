import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EntriesWithFilters from './EntriesWithFilters'

export default async function AdminEntriesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userProfile || userProfile.role !== 'admin') {
    redirect('/dashboard')
  }

  // 管理者クライアントで全データを取得
  const adminSupabase = createAdminClient()
  
  try {
    console.log('管理者クライアント作成完了')
    console.log('環境変数確認:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    
    // まず簡単なクエリでテスト
    console.log('簡単なテストクエリ開始...')
    const testResult = await adminSupabase.from('entries').select('id').limit(1)
    console.log('テストクエリ結果:', testResult)
    
    if (testResult.error) {
      throw new Error(`テストクエリエラー: ${testResult.error.message}`)
    }
    
    console.log('データベースクエリ開始...')
    const [entriesResult, allUsersResult] = await Promise.all([
      adminSupabase.from('entries').select(`
        id,
        user_id,
        participant_names,
        phone_number,
        status,
        basic_info_status,
        created_at,
        updated_at,
        entry_files(id, file_type),
        selections(id, status, score, created_at),
        basic_info!left(id, dance_style, category_division),
        preliminary_info!left(id),
        program_info!left(id),
        semifinals_info!left(id),
        finals_info!left(id),
        applications_info!left(id),
        sns_info!left(id)
      `).order('created_at', { ascending: false }),
      adminSupabase.from('users').select('*')
    ])
    console.log('データベースクエリ完了')

    const { data: entries, error: entriesError } = entriesResult
    const { data: allUsers, error: usersError } = allUsersResult

    // エラーチェック
    if (entriesError) {
      console.error('エントリー取得エラー:', entriesError)
      throw new Error(`エントリー取得エラー: ${entriesError.message}`)
    }
    
    if (usersError) {
      console.error('ユーザー取得エラー:', usersError)
      throw new Error(`ユーザー取得エラー: ${usersError.message}`)
    }

    // デバッグ: 取得したデータを確認
    console.log('=== エントリーデータ取得結果 ===')
    console.log('エントリー数:', entries?.length || 0)
    console.log('全ユーザー数:', allUsers?.length || 0)
    if (entries && entries.length > 0) {
      console.log('最初のエントリーの構造:')
      console.log('- ID:', entries[0].id)
      console.log('- user_id:', entries[0].user_id)
      console.log('- participant_names:', entries[0].participant_names)
      console.log('- basic_info:', JSON.stringify(entries[0].basic_info))
    }
    console.log('================================')

    // 手動でユーザーデータをマッピング（安全な処理）
    const entriesWithUsers = entries?.map(entry => {
      const user = allUsers?.find(u => u.id === entry.user_id)
      
      // 基本情報からdance_styleを取得
      let dance_style = '未分類'
      if (entry.basic_info) {
        if (Array.isArray(entry.basic_info) && entry.basic_info.length > 0) {
          const basicInfo = entry.basic_info[0] as { dance_style?: string }
          dance_style = basicInfo?.dance_style || '未分類'
        } else if (!Array.isArray(entry.basic_info)) {
          const basicInfo = entry.basic_info as { dance_style?: string }
          dance_style = basicInfo.dance_style || '未分類'
        }
      }
      
      return {
        ...entry,
        dance_style, // 基本情報から取得したdance_styleを追加
        users: user ? { 
          name: user.name || '不明なユーザー', 
          email: user.email || 'メールアドレス不明' 
        } : { 
          name: '不明なユーザー', 
          email: 'メールアドレス不明' 
        }
      }
    }) || []

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-900">
                  ← 管理ダッシュボードに戻る
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  エントリー一覧
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {userProfile.name}さん（管理者）
                </span>
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    ログアウト
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <EntriesWithFilters entries={entriesWithUsers} />
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('データ取得で予期しないエラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available'
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">データの取得に失敗しました。</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
            <h3 className="text-sm font-semibold text-red-800 mb-2">エラー詳細:</h3>
            <p className="text-sm text-red-700 mb-2">{errorMessage}</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-red-600">
                <summary className="cursor-pointer">スタックトレース</summary>
                <pre className="mt-2 whitespace-pre-wrap">{errorStack}</pre>
              </details>
            )}
          </div>
          <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-900">
            ← 管理ダッシュボードに戻る
          </Link>
        </div>
      </div>
    )
  }
}