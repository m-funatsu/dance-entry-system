import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogViewer from '@/components/admin/LogViewer'

export const metadata = {
  title: 'システムログ - 管理画面',
  description: 'システムログの確認と管理',
}

export default async function AdminLogsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // 管理者権限チェック
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">システムログ</h1>
        <p className="mt-2 text-gray-600">
          システムのログを確認できます。エラーや警告の監視にご利用ください。
        </p>
      </div>

      <LogViewer />

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">ログレベルについて</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><span className="font-medium">デバッグ:</span> 開発時の詳細情報</li>
          <li><span className="font-medium">情報:</span> 通常の動作ログ</li>
          <li><span className="font-medium">警告:</span> 注意が必要な事象</li>
          <li><span className="font-medium">エラー:</span> エラーが発生した場合</li>
          <li><span className="font-medium">致命的:</span> システムの継続が困難なエラー</li>
        </ul>
      </div>
    </div>
  )
}