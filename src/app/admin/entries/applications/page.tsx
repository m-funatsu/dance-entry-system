import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'

export default async function ApplicationsInfoListPage() {
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

  // 管理者クライアントで各種申請情報を取得
  const adminSupabase = createAdminClient()
  
  const { data: applicationsInfoList, error } = await adminSupabase
    .from('applications_info')
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
    console.error('各種申請情報取得エラー:', error)
  }

  // ファイルダウンロード用のパブリックURL生成
  const getFileUrl = (filePath: string) => {
    const { data } = adminSupabase.storage.from('files').getPublicUrl(filePath)
    return data.publicUrl
  }

  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType === 'video' || fileName.includes('.mp4') || fileName.includes('.mov')) {
      return '🎬'
    } else if (fileType === 'music' || fileType === 'audio') {
      return '🎵'
    } else if (fileType === 'photo') {
      return '📸'
    } else if (fileType === 'pdf') {
      return '📄'
    }
    return '📎'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <AdminLink href="/admin/entries">
          ← エントリー一覧に戻る
        </AdminLink>
        <div className="flex space-x-4">
          <DownloadButton
            data={(applicationsInfoList || []).map(item => [
              item.id,
              item.entry_id,
              ((item.entries as Record<string, unknown> & { users?: { name?: string } })?.users?.name || '不明なユーザー'),
              ((item.entries as Record<string, unknown> & { participant_names?: string })?.participant_names || 'エントリー名なし'),
              item.related_ticket_count?.toString() || '0',
              item.related_ticket_total_amount?.toString() || '0',
              item.related1_name || '',
              item.related1_relationship || '',
              item.companion_total_amount?.toString() || '0',
              item.companion1_name || '',
              item.companion1_purpose || '',
              item.makeup_name || '',
              item.makeup_name_final || '',
              item.makeup_preferred_stylist || '',
              ((item.entries as Record<string, unknown> & { status?: string })?.status || '')
            ])}
            headers={['ID', 'エントリーID', 'ユーザー名', 'エントリー名', 'チケット枚数', 'チケット合計金額', '関係者1名前', '関係者1続柄', '同伴者合計金額', '同伴者1名前', '同伴者1目的', '準決勝メイク担当', '決勝メイク担当', 'メイク希望スタイリスト', 'ステータス']}
            filename="applications_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">各種申請一覧</h1>
        <p className="text-gray-600">エントリーの各種申請情報をまとめて確認できます（{applicationsInfoList?.length || 0}件）</p>
      </div>

      {applicationsInfoList && applicationsInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    エントリー名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    関係者チケット
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    同伴者情報
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メイク申請
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
                {applicationsInfoList.map((applicationsInfo) => (
                  <tr key={applicationsInfo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(applicationsInfo.entries as Record<string, unknown> & { users?: { name?: string } })?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(applicationsInfo.entries as Record<string, unknown> & { participant_names?: string })?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="text-xs">
                          枚数: {applicationsInfo.related_ticket_count || 0}枚
                        </div>
                        <div className="text-xs text-gray-500">
                          合計: ¥{(applicationsInfo.related_ticket_total_amount || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {applicationsInfo.related1_name && `${applicationsInfo.related1_name} (${applicationsInfo.related1_relationship})`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="text-xs text-gray-500">
                          合計: ¥{(applicationsInfo.companion_total_amount || 0).toLocaleString()}
                        </div>
                        <div className="text-xs mt-1">
                          {applicationsInfo.companion1_name && `${applicationsInfo.companion1_name} (${applicationsInfo.companion1_purpose})`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="text-xs">
                          <span className="font-medium">準決勝:</span>
                          <span className={applicationsInfo.makeup_name ? 'text-green-600' : 'text-gray-400'}>
                            {applicationsInfo.makeup_name ? ` ${applicationsInfo.makeup_name}` : ' 申請なし'}
                          </span>
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-medium">決勝:</span>
                          <span className={applicationsInfo.makeup_name_final ? 'text-green-600' : 'text-gray-400'}>
                            {applicationsInfo.makeup_name_final ? ` ${applicationsInfo.makeup_name_final}` : ' 申請なし'}
                          </span>
                        </div>
                        {applicationsInfo.makeup_preferred_stylist && (
                          <div className="text-xs text-gray-500">
                            希望: {applicationsInfo.makeup_preferred_stylist}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {((applicationsInfo.entry_files || []) as Array<{ id: string; file_name: string; file_path: string; file_type: string; purpose?: string }>)?.filter(file => 
                          file.purpose?.includes('payment') || file.purpose?.includes('makeup')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              {getFileIcon(file.file_type, file.file_name)} {file.file_name}
                            </a>
                          </div>
                        ))}
                        {!((applicationsInfo.entry_files || []) as Array<{ id: string; file_name: string; file_path: string; file_type: string; purpose?: string }>)?.some(file => 
                          file.purpose?.includes('payment') || file.purpose?.includes('makeup')
                        ) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (() => {
                          const entries = applicationsInfo.entries as Record<string, unknown> & { status?: string }
                          const status = entries?.status
                          return status === 'selected' ? 'bg-green-100 text-green-800' :
                                 status === 'rejected' ? 'bg-red-100 text-red-800' :
                                 status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                 'bg-yellow-100 text-yellow-800'
                        })()
                      }`}>
                        {(() => {
                          const entries = applicationsInfo.entries as Record<string, unknown> & { status?: string }
                          const status = entries?.status
                          return status === 'pending' ? '審査待ち' :
                                 status === 'submitted' ? '提出済み' :
                                 status === 'selected' ? '選考通過' :
                                 status === 'rejected' ? '不選考' :
                                 '不明'
                        })()}
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
          <div className="text-gray-500">各種申請情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}