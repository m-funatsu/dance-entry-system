import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'
import { getStatusLabel } from '@/lib/status-labels'

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

  console.log('[APPLICATIONS DEBUG] 各種申請情報取得完了')
  console.log('[APPLICATIONS DEBUG] 各種申請情報件数:', applicationsInfoList?.length || 0)
  console.log('[APPLICATIONS DEBUG] 各種申請情報エラー:', applicationsError)

  // エントリー情報を取得（全エントリーを基準とする）
  const { data: entriesList, error: entriesError } = await adminSupabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('[APPLICATIONS DEBUG] エントリー情報取得完了')
  console.log('[APPLICATIONS DEBUG] エントリー件数:', entriesList?.length || 0)
  console.log('[APPLICATIONS DEBUG] エントリーエラー:', entriesError)

  if (entriesError) {
    console.error('エントリー情報取得エラー:', entriesError)
    return <div>エントリー情報の取得に失敗しました</div>
  }

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


  // データをマッピング（選考通過のみ表示）
  const mappedApplicationsInfoList = entriesList?.filter(entry => entry.status === 'selected').map(entry => {
    const relatedUser = usersList?.find(user => user.id === entry.user_id)
    const relatedApplicationsInfo = applicationsInfoList?.find(app => app.entry_id === entry.id)
    const relatedFiles = filesList?.filter(file => file.entry_id === entry.id)
    
    console.log(`[APPLICATIONS DEBUG] エントリーID ${entry.id}:`, {
      hasUser: !!relatedUser,
      hasApplicationsInfo: !!relatedApplicationsInfo,
      fileCount: relatedFiles?.length || 0,
      status: entry.status
    })
    
    return {
      // applications_info のデータ、または空のデフォルト値
      id: relatedApplicationsInfo?.id || `dummy-${entry.id}`,
      entry_id: entry.id,
      // 関係者チケット情報
      related_ticket_count: relatedApplicationsInfo?.related_ticket_count || 0,
      related1_relationship: relatedApplicationsInfo?.related1_relationship || '',
      related1_name: relatedApplicationsInfo?.related1_name || '',
      related1_furigana: relatedApplicationsInfo?.related1_furigana || '',
      related2_relationship: relatedApplicationsInfo?.related2_relationship || '',
      related2_name: relatedApplicationsInfo?.related2_name || '',
      related2_furigana: relatedApplicationsInfo?.related2_furigana || '',
      related3_relationship: relatedApplicationsInfo?.related3_relationship || '',
      related3_name: relatedApplicationsInfo?.related3_name || '',
      related3_furigana: relatedApplicationsInfo?.related3_furigana || '',
      related4_relationship: relatedApplicationsInfo?.related4_relationship || '',
      related4_name: relatedApplicationsInfo?.related4_name || '',
      related4_furigana: relatedApplicationsInfo?.related4_furigana || '',
      related5_relationship: relatedApplicationsInfo?.related5_relationship || '',
      related5_name: relatedApplicationsInfo?.related5_name || '',
      related5_furigana: relatedApplicationsInfo?.related5_furigana || '',
      related_ticket_total_amount: relatedApplicationsInfo?.related_ticket_total_amount || 0,
      // 選手同伴情報
      companion1_name: relatedApplicationsInfo?.companion1_name || '',
      companion1_furigana: relatedApplicationsInfo?.companion1_furigana || '',
      companion1_purpose: relatedApplicationsInfo?.companion1_purpose || '',
      companion2_name: relatedApplicationsInfo?.companion2_name || '',
      companion2_furigana: relatedApplicationsInfo?.companion2_furigana || '',
      companion2_purpose: relatedApplicationsInfo?.companion2_purpose || '',
      companion3_name: relatedApplicationsInfo?.companion3_name || '',
      companion3_furigana: relatedApplicationsInfo?.companion3_furigana || '',
      companion3_purpose: relatedApplicationsInfo?.companion3_purpose || '',
      companion_total_amount: relatedApplicationsInfo?.companion_total_amount || 0,
      // メイク情報
      makeup_preferred_stylist: relatedApplicationsInfo?.makeup_preferred_stylist || '',
      makeup_name: relatedApplicationsInfo?.makeup_name || '',
      makeup_email: relatedApplicationsInfo?.makeup_email || '',
      makeup_phone: relatedApplicationsInfo?.makeup_phone || '',
      makeup_notes: relatedApplicationsInfo?.makeup_notes || '',
      makeup_preferred_stylist_final: relatedApplicationsInfo?.makeup_preferred_stylist_final || '',
      makeup_name_final: relatedApplicationsInfo?.makeup_name_final || '',
      makeup_email_final: relatedApplicationsInfo?.makeup_email_final || '',
      makeup_phone_final: relatedApplicationsInfo?.makeup_phone_final || '',
      makeup_notes_final: relatedApplicationsInfo?.makeup_notes_final || '',
      // 備考情報
      applications_notes: relatedApplicationsInfo?.applications_notes || '',
      // エントリー情報
      entries: {
        ...entry,
        users: relatedUser || { name: '不明なユーザー', email: '不明' }
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
              item.entries?.users?.name || '不明なユーザー', // システム利用者名を追加
              getStatusLabel(item.entries?.status), // ステータスを日本語ラベルに変更
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
              // 関係者チケット5
              item.related5_relationship || '',
              item.related5_name || '',
              item.related5_furigana || '',
              // 関係者チケット合計
              item.related_ticket_count || '0',
              item.related_ticket_total_amount || '0',
              // 選手同伴1
              item.companion1_name || '',
              item.companion1_furigana || '',
              item.companion1_purpose || '',
              // 選手同伴2
              item.companion2_name || '',
              item.companion2_furigana || '',
              item.companion2_purpose || '',
              // 選手同伴3
              item.companion3_name || '',
              item.companion3_furigana || '',
              item.companion3_purpose || '',
              // 選手同伴合計
              item.companion_total_amount || '0',
              // 備考
              item.applications_notes || '',
              // メイク(準決勝)
              item.makeup_preferred_stylist || '',
              item.makeup_name || '',
              item.makeup_email || '',
              item.makeup_phone || '',
              item.makeup_notes || '',
              // メイク(決勝)
              item.makeup_preferred_stylist_final || '',
              item.makeup_name_final || '',
              item.makeup_email_final || '',
              item.makeup_phone_final || '',
              item.makeup_notes_final || '',
            ])}
            headers={['ID', 'エントリーID', 'システム利用者名', '選考ステータス', '関係者1関係', '関係者1氏名', '関係者1フリガナ', '関係者2関係', '関係者2氏名', '関係者2フリガナ', '関係者3関係', '関係者3氏名', '関係者3フリガナ', '関係者4関係', '関係者4氏名', '関係者4フリガナ', '関係者5関係', '関係者5氏名', '関係者5フリガナ', '関係者チケット合計枚数', '関係者チケット合計金額', '同伴1氏名', '同伴1フリガナ', '同伴1目的', '同伴2氏名', '同伴2フリガナ', '同伴2目的', '同伴3氏名', '同伴3フリガナ', '同伴3目的', '同伴合計金額', '備考', 'メイク準決勝希望美容師', 'メイク準決勝申請者氏名', 'メイク準決勝メール', 'メイク準決勝電話', 'メイク準決勝備考', 'メイク決勝希望美容師', 'メイク決勝申請者氏名', 'メイク決勝メール', 'メイク決勝電話', 'メイク決勝備考']}
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
                    関係者チケット5
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    関係者チケット合計
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    選手同伴1
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    選手同伴2
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    選手同伴3
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    選手同伴合計
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    払込用紙添付
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    備考
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メイク(準決勝)
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メイク(準決勝)希望スタイル添付
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メイク(決勝)
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メイク(決勝)希望スタイル添付
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
                    
                    {/* 関係者チケット5 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>関係:</strong> {applicationsInfo.related5_relationship || '未入力'}</div>
                        <div><strong>氏名:</strong> {applicationsInfo.related5_name || '未入力'}</div>
                        <div><strong>フリガナ:</strong> {applicationsInfo.related5_furigana || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 関係者チケット合計 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>合計枚数:</strong> {applicationsInfo.related_ticket_count || '0'}枚</div>
                        <div><strong>合計金額:</strong> ¥{(applicationsInfo.related_ticket_total_amount || 0).toLocaleString()}</div>
                      </div>
                    </td>
                    
                    {/* 選手同伴1 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>同伴氏名:</strong> {applicationsInfo.companion1_name || '未入力'}</div>
                        <div><strong>フリガナ:</strong> {applicationsInfo.companion1_furigana || '未入力'}</div>
                        <div><strong>目的:</strong> {applicationsInfo.companion1_purpose || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 選手同伴2 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>同伴氏名:</strong> {applicationsInfo.companion2_name || '未入力'}</div>
                        <div><strong>フリガナ:</strong> {applicationsInfo.companion2_furigana || '未入力'}</div>
                        <div><strong>目的:</strong> {applicationsInfo.companion2_purpose || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 選手同伴3 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>同伴氏名:</strong> {applicationsInfo.companion3_name || '未入力'}</div>
                        <div><strong>フリガナ:</strong> {applicationsInfo.companion3_furigana || '未入力'}</div>
                        <div><strong>目的:</strong> {applicationsInfo.companion3_purpose || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 選手同伴合計 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>合計金額:</strong> ¥{(applicationsInfo.companion_total_amount || 0).toLocaleString()}</div>
                      </div>
                    </td>
                    
                    {/* 払込用紙添付 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(applicationsInfo.entry_files) && applicationsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.purpose === 'payment_slip'
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
                          file.purpose === 'payment_slip'
                        )) && (
                          <span className="text-xs text-gray-400">払込用紙なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 備考 */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        {applicationsInfo.applications_notes || '未入力'}
                      </div>
                    </td>
                    
                    {/* メイク(準決勝) */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>希望美容師:</strong> {applicationsInfo.makeup_preferred_stylist || '未入力'}</div>
                        <div><strong>申請者氏名:</strong> {applicationsInfo.makeup_name || '未入力'}</div>
                        <div><strong>メールアドレス:</strong> {applicationsInfo.makeup_email || '未入力'}</div>
                        <div><strong>電話番号:</strong> {applicationsInfo.makeup_phone || '未入力'}</div>
                        <div><strong>備考:</strong> {applicationsInfo.makeup_notes || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* メイク(準決勝)希望スタイル添付 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(applicationsInfo.entry_files) && applicationsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && 
                          (file.purpose === 'makeup_style1' || file.purpose === 'makeup_style2') // 準決勝用のみ（_finalなし）
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              📸 {file.purpose === 'makeup_style1' ? '希望スタイル①' : '希望スタイル②'}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(applicationsInfo.entry_files) || !applicationsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && 
                          (file.purpose === 'makeup_style1' || file.purpose === 'makeup_style2') // 準決勝用のみ
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* メイク(決勝) */}
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div><strong>希望美容師:</strong> {applicationsInfo.makeup_preferred_stylist_final || '未入力'}</div>
                        <div><strong>申請者氏名:</strong> {applicationsInfo.makeup_name_final || '未入力'}</div>
                        <div><strong>メールアドレス:</strong> {applicationsInfo.makeup_email_final || '未入力'}</div>
                        <div><strong>電話番号:</strong> {applicationsInfo.makeup_phone_final || '未入力'}</div>
                        <div><strong>備考:</strong> {applicationsInfo.makeup_notes_final || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* メイク(決勝)希望スタイル添付 */}
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(applicationsInfo.entry_files) && applicationsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && 
                          (file.purpose === 'makeup_style1_final' || file.purpose === 'makeup_style2_final') // 決勝用のみ
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              📸 {file.purpose === 'makeup_style1' ? '希望スタイル①' : '希望スタイル②'}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(applicationsInfo.entry_files) || !applicationsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && 
                          (file.purpose === 'makeup_style1_final' || file.purpose === 'makeup_style2_final') // 決勝用のみ
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