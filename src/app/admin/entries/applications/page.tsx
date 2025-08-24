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
  
  console.log('[APPLICATIONS DEBUG] === 各種申請情報一覧データ取得開始 ===')
  
  // 各種申請情報を取得
  const { data: applicationsInfoList, error: applicationsError } = await adminSupabase
    .from('applications_info')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('[APPLICATIONS DEBUG] 各種申請情報取得完了')
  console.log('[APPLICATIONS DEBUG] 各種申請情報件数:', applicationsInfoList?.length || 0)
  console.log('[APPLICATIONS DEBUG] 各種申請情報エラー:', applicationsError)

  if (applicationsError) {
    console.error('各種申請情報取得エラー:', applicationsError)
    return <div>各種申請情報の取得に失敗しました</div>
  }

  // エントリー情報を取得
  const { data: entriesList, error: entriesError } = await adminSupabase
    .from('entries')
    .select('*')

  console.log('[APPLICATIONS DEBUG] エントリー情報取得完了')
  console.log('[APPLICATIONS DEBUG] エントリー件数:', entriesList?.length || 0)
  console.log('[APPLICATIONS DEBUG] エントリーエラー:', entriesError)

  // ユーザー情報を取得
  const { data: usersList, error: usersError } = await adminSupabase
    .from('users')
    .select('*')

  console.log('[APPLICATIONS DEBUG] ユーザー情報取得完了')
  console.log('[APPLICATIONS DEBUG] ユーザー件数:', usersList?.length || 0)
  console.log('[APPLICATIONS DEBUG] ユーザーエラー:', usersError)

  // ファイル情報を取得
  const { data: filesList, error: filesError } = await adminSupabase
    .from('entry_files')
    .select('*')

  console.log('[APPLICATIONS DEBUG] ファイル情報取得完了')
  console.log('[APPLICATIONS DEBUG] ファイル件数:', filesList?.length || 0)
  console.log('[APPLICATIONS DEBUG] ファイルエラー:', filesError)

  // データをマッピング（全データを表示）
  const mappedApplicationsInfoList = applicationsInfoList?.map(applicationsInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === applicationsInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === applicationsInfo.entry_id)
    
    console.log(`[APPLICATIONS DEBUG] エントリーID ${applicationsInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0
    })
    
    return {
      ...applicationsInfo,
      entries: relatedEntry ? {
        ...relatedEntry,
        users: relatedUser || { name: '不明なユーザー', email: '不明' }
      } : { 
        id: '', 
        participant_names: 'エントリー情報なし', 
        status: 'unknown',
        users: { name: '不明なユーザー', email: '不明' }
      },
      entry_files: relatedFiles || []
    }
  }) || []

  console.log('[APPLICATIONS DEBUG] マッピング完了')
  console.log('[APPLICATIONS DEBUG] マッピング後データ件数:', mappedApplicationsInfoList?.length || 0)

  // ファイルダウンロード用のパブリックURL生成
  const getFileUrl = (filePath: string) => {
    const { data } = adminSupabase.storage.from('files').getPublicUrl(filePath)
    return data.publicUrl
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <AdminLink href="/admin/entries">
          ← エントリー一覧に戻る
        </AdminLink>
        <div className="flex space-x-4">
          <DownloadButton
            data={mappedApplicationsInfoList.map(item => [
              item.id,
              item.entry_id,
              item.entries?.users?.name || '不明なユーザー',
              item.entries?.participant_names || 'エントリー名なし',
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
              item.entries?.status || ''
            ])}
            headers={['ID', 'エントリーID', 'ユーザー名', 'エントリー名', 'チケット枚数', 'チケット合計金額', '関係者1名前', '関係者1続柄', '同伴者合計金額', '同伴者1名前', '同伴者1目的', '準決勝メイク担当', '決勝メイク担当', 'メイク希望スタイリスト', 'ステータス']}
            filename="applications_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">各種申請一覧</h1>
        <p className="text-gray-600">エントリーの各種申請情報をまとめて確認できます（{mappedApplicationsInfoList?.length || 0}件）</p>
      </div>

      {mappedApplicationsInfoList && mappedApplicationsInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto" style={{maxWidth: '100vw'}}>
            <table className="divide-y divide-gray-200" style={{minWidth: '1400px', width: 'max-content'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    エントリー名
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    関係者チケット
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    同伴者情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メイク申請
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払い証明書
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メイク関連画像
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申請書類PDF
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    その他詳細
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedApplicationsInfoList.map((applicationsInfo) => (
                  <tr key={applicationsInfo.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {applicationsInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {applicationsInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">枚数: {applicationsInfo.related_ticket_count || 0}枚</div>
                        <div className="text-gray-500">合計: ¥{(applicationsInfo.related_ticket_total_amount || 0).toLocaleString()}</div>
                        <div className="text-gray-500 mt-1">
                          {applicationsInfo.related1_name && `${applicationsInfo.related1_name} (${applicationsInfo.related1_relationship})`}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">合計: ¥{(applicationsInfo.companion_total_amount || 0).toLocaleString()}</div>
                        <div className="text-gray-500 mt-1">
                          {applicationsInfo.companion1_name && `${applicationsInfo.companion1_name} (${applicationsInfo.companion1_purpose})`}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">準決勝:</div>
                        <div className={applicationsInfo.makeup_name ? 'text-green-600' : 'text-gray-400'}>
                          {applicationsInfo.makeup_name ? ` ${applicationsInfo.makeup_name}` : ' 申請なし'}
                        </div>
                        <div className="text-gray-500 mt-1">決勝:</div>
                        <div className={applicationsInfo.makeup_name_final ? 'text-green-600' : 'text-gray-400'}>
                          {applicationsInfo.makeup_name_final ? ` ${applicationsInfo.makeup_name_final}` : ' 申請なし'}
                        </div>
                        {applicationsInfo.makeup_preferred_stylist && (
                          <div className="text-gray-500">希望: {applicationsInfo.makeup_preferred_stylist}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(applicationsInfo.entry_files) && applicationsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.purpose && file.purpose.includes('payment')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              💰 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(applicationsInfo.entry_files) || !applicationsInfo.entry_files.some((file: { purpose?: string }) => 
                          file.purpose && file.purpose.includes('payment')
                        )) && (
                          <span className="text-xs text-gray-400">支払い証明書なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(applicationsInfo.entry_files) && applicationsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('makeup')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              💄 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(applicationsInfo.entry_files) || !applicationsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('makeup')
                        )) && (
                          <span className="text-xs text-gray-400">メイク関連画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(applicationsInfo.entry_files) && applicationsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'pdf' && file.purpose && file.purpose.includes('applications')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
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
                        {(!Array.isArray(applicationsInfo.entry_files) || !applicationsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'pdf' && file.purpose && file.purpose.includes('applications')
                        )) && (
                          <span className="text-xs text-gray-400">申請書類なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">作成: {applicationsInfo.created_at ? new Date(applicationsInfo.created_at).toLocaleDateString('ja-JP') : '不明'}</div>
                        <div className="text-gray-500">更新: {applicationsInfo.updated_at ? new Date(applicationsInfo.updated_at).toLocaleDateString('ja-JP') : '不明'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        applicationsInfo.entries?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        applicationsInfo.entries?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        applicationsInfo.entries?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {applicationsInfo.entries?.status === 'pending' && '審査待ち'}
                        {applicationsInfo.entries?.status === 'submitted' && '提出済み'}
                        {applicationsInfo.entries?.status === 'selected' && '選考通過'}
                        {applicationsInfo.entries?.status === 'rejected' && '不選考'}
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