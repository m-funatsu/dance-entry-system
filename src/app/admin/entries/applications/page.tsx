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
              item.entries?.status || '',
              // 関係者チケット1
              item.related1_relationship || '',
              item.related1_name || '',
              item.related1_furigana || '',
              // 関係者チケット2
              item.related2_relationship || '',
              item.related2_name || '',
              item.related2_furigana || '',
              // 関係者チケット3
              item.related3_relationship || '',
              item.related3_name || '',
              item.related3_furigana || '',
              // 関係者チケット4
              item.related4_relationship || '',
              item.related4_name || '',
              item.related4_furigana || '',
              // 観覧席希望
              item.premium_seats || '0',
              item.ss_seats || '0',
              item.s_seats || '0',
              item.a_seats || '0',
              item.b_seats || '0',
              ((parseInt(item.premium_seats || '0') + parseInt(item.ss_seats || '0') + parseInt(item.s_seats || '0') + parseInt(item.a_seats || '0') + parseInt(item.b_seats || '0'))).toString(),
              // 関係者チケット5
              item.related5_relationship || '',
              item.related5_name || ''
            ])}
            headers={['ID', 'エントリーID', '提出ステータス', '関係者1関係', '関係者1氏名', '関係者1フリガナ', '関係者2関係', '関係者2氏名', '関係者2フリガナ', '関係者3関係', '関係者3氏名', '関係者3フリガナ', '関係者4関係', '関係者4氏名', '関係者4フリガナ', 'プレミアム席', 'SS席', 'S席', 'A席', 'B席', '合計希望枚数', '関係者5関係', '関係者5氏名']}
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
                    システム利用者名
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    関係者チケット1
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    関係者チケット2
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    関係者チケット3
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    関係者チケット4
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    観覧席希望
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    関係者チケット5
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    希望スタイル画像
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedApplicationsInfoList.map((applicationsInfo) => (
                  <tr key={applicationsInfo.id} className="hover:bg-gray-50">
                    {/* システム利用者名 */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {applicationsInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {applicationsInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    
                    {/* 関係者チケット1 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>関係:</strong> {applicationsInfo.related1_relationship || '未入力'}</div>
                        <div><strong>氏名:</strong> {applicationsInfo.related1_name || '未入力'}</div>
                        <div><strong>フリガナ:</strong> {applicationsInfo.related1_furigana || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 関係者チケット2 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>関係:</strong> {applicationsInfo.related2_relationship || '未入力'}</div>
                        <div><strong>氏名:</strong> {applicationsInfo.related2_name || '未入力'}</div>
                        <div><strong>フリガナ:</strong> {applicationsInfo.related2_furigana || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 関係者チケット3 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>関係:</strong> {applicationsInfo.related3_relationship || '未入力'}</div>
                        <div><strong>氏名:</strong> {applicationsInfo.related3_name || '未入力'}</div>
                        <div><strong>フリガナ:</strong> {applicationsInfo.related3_furigana || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 関係者チケット4 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>関係:</strong> {applicationsInfo.related4_relationship || '未入力'}</div>
                        <div><strong>氏名:</strong> {applicationsInfo.related4_name || '未入力'}</div>
                        <div><strong>フリガナ:</strong> {applicationsInfo.related4_furigana || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 観覧席希望 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>プレミアム席:</strong> {applicationsInfo.premium_seats || '0'}枚</div>
                        <div><strong>SS席:</strong> {applicationsInfo.ss_seats || '0'}枚</div>
                        <div><strong>S席:</strong> {applicationsInfo.s_seats || '0'}枚</div>
                        <div><strong>A席:</strong> {applicationsInfo.a_seats || '0'}枚</div>
                        <div><strong>B席:</strong> {applicationsInfo.b_seats || '0'}枚</div>
                        <div className="mt-1 font-medium"><strong>合計:</strong> {(parseInt(applicationsInfo.premium_seats || '0') + parseInt(applicationsInfo.ss_seats || '0') + parseInt(applicationsInfo.s_seats || '0') + parseInt(applicationsInfo.a_seats || '0') + parseInt(applicationsInfo.b_seats || '0'))}枚</div>
                      </div>
                    </td>
                    
                    {/* 関係者チケット5 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>関係:</strong> {applicationsInfo.related5_relationship || '未入力'}</div>
                        <div><strong>氏名:</strong> {applicationsInfo.related5_name || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 希望スタイル画像 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(applicationsInfo.entry_files) && applicationsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && (file.purpose.includes('style1') || file.purpose.includes('style2'))
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              📸 {file.purpose?.includes('style1') ? '希望スタイル①' : '希望スタイル②'}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(applicationsInfo.entry_files) || !applicationsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && (file.purpose.includes('style1') || file.purpose.includes('style2'))
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
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