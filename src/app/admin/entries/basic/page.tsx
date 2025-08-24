import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'

interface BasicInfoWithEntries {
  id: string
  entries: {
    id: string
    participant_names: string
    status: string
    users: {
      name: string
      email: string
    }
  }
  entry_files: Array<{
    id: string
    file_type: string
    file_name: string
    file_path: string
    purpose: string
  }>
  dance_style?: string
  category_division?: string
  representative_name?: string
  representative_furigana?: string
  representative_email?: string
  partner_name?: string
  partner_furigana?: string
  emergency_contact_name_1?: string
  emergency_contact_phone_1?: string
}

export default async function BasicInfoListPage() {
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

  // 管理者クライアントで基本情報を取得
  const adminSupabase = createAdminClient()
  
  const { data: basicInfoList, error } = await adminSupabase
    .from('basic_info')
    .select(`
      *,
      entries!inner (
        id,
        participant_names,
        status,
        user_id,
        users (
          name,
          email
        )
      ),
      entry_files (
        id,
        file_type,
        file_name,
        file_path,
        purpose
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('基本情報取得エラー:', error)
  }

  // ファイルダウンロード用のパブリックURL生成
  const getFileUrl = (filePath: string) => {
    const { data } = adminSupabase.storage.from('files').getPublicUrl(filePath)
    return data.publicUrl
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">基本情報一覧</h1>
          <p className="text-gray-600">エントリーの基本情報をまとめて確認できます</p>
        </div>
        <AdminLink href="/admin/entries">
          エントリー一覧に戻る
        </AdminLink>
      </div>

      {basicInfoList && basicInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    エントリー名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ダンスジャンル
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリー
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    代表者情報
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    パートナー情報
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    緊急連絡先
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ファイル
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(basicInfoList as BasicInfoWithEntries[]).map((basicInfo) => (
                  <tr key={basicInfo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {basicInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {basicInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{basicInfo.dance_style || '未入力'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{basicInfo.category_division || '未入力'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{basicInfo.representative_name || '未入力'}</div>
                        <div className="text-gray-500">{basicInfo.representative_furigana || ''}</div>
                        <div className="text-gray-500">{basicInfo.representative_email || ''}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{basicInfo.partner_name || '未入力'}</div>
                        <div className="text-gray-500">{basicInfo.partner_furigana || ''}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div>{basicInfo.emergency_contact_name_1 || '未入力'}</div>
                        <div className="text-gray-500">{basicInfo.emergency_contact_phone_1 || ''}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {basicInfo.entry_files?.filter(file => 
                          file.purpose === 'bank_slip'
                        ).map((file) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              📄 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {!basicInfo.entry_files?.some(file => file.purpose === 'bank_slip') && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        basicInfo.entries?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        basicInfo.entries?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        basicInfo.entries?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {basicInfo.entries?.status === 'pending' && '審査待ち'}
                        {basicInfo.entries?.status === 'submitted' && '提出済み'}
                        {basicInfo.entries?.status === 'selected' && '選考通過'}
                        {basicInfo.entries?.status === 'rejected' && '不選考'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500">基本情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}