import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'


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
  
  console.log('[BASIC INFO DEBUG] === 基本情報一覧データ取得開始 ===')
  
  // 基本情報とエントリー情報を取得
  const { data: basicInfoList, error: basicError } = await adminSupabase
    .from('basic_info')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('[BASIC INFO DEBUG] 基本情報取得完了')
  console.log('[BASIC INFO DEBUG] 基本情報件数:', basicInfoList?.length || 0)
  console.log('[BASIC INFO DEBUG] 基本情報エラー:', basicError)

  if (basicError) {
    console.error('基本情報取得エラー:', basicError)
    return <div>基本情報の取得に失敗しました</div>
  }

  // エントリー情報を取得
  const { data: entriesList, error: entriesError } = await adminSupabase
    .from('entries')
    .select('*')

  console.log('[BASIC INFO DEBUG] エントリー情報取得完了')
  console.log('[BASIC INFO DEBUG] エントリー件数:', entriesList?.length || 0)
  console.log('[BASIC INFO DEBUG] エントリーエラー:', entriesError)

  // ユーザー情報を取得
  const { data: usersList, error: usersError } = await adminSupabase
    .from('users')
    .select('*')

  console.log('[BASIC INFO DEBUG] ユーザー情報取得完了')
  console.log('[BASIC INFO DEBUG] ユーザー件数:', usersList?.length || 0)
  console.log('[BASIC INFO DEBUG] ユーザーエラー:', usersError)

  // ファイル情報を取得
  const { data: filesList, error: filesError } = await adminSupabase
    .from('entry_files')
    .select('*')

  console.log('[BASIC INFO DEBUG] ファイル情報取得完了')
  console.log('[BASIC INFO DEBUG] ファイル件数:', filesList?.length || 0)
  console.log('[BASIC INFO DEBUG] ファイルエラー:', filesError)

  // データをマッピング（全データを表示）
  const mappedBasicInfoList = basicInfoList?.map(basicInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === basicInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === basicInfo.entry_id)
    
    console.log(`[BASIC INFO DEBUG] エントリーID ${basicInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0
    })
    
    return {
      ...basicInfo,
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

  console.log('[BASIC INFO DEBUG] マッピング完了')
  console.log('[BASIC INFO DEBUG] マッピング後データ件数:', mappedBasicInfoList?.length || 0)
  console.log('[BASIC INFO DEBUG] マッピング後データ:', JSON.stringify(mappedBasicInfoList, null, 2))

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
            data={mappedBasicInfoList.map(item => [
              item.id,
              item.entry_id,
              item.dance_style || '',
              item.category_division || '',
              item.representative_name || '',
              item.representative_furigana || '',
              item.representative_romaji || '',
              item.representative_email || '',
              item.representative_birthdate || '',
              item.partner_name || '',
              item.partner_furigana || '',
              item.partner_romaji || '',
              item.partner_birthdate || '',
              item.phone_number || '',
              item.real_name || '',
              item.real_name_kana || '',
              item.partner_real_name || '',
              item.partner_real_name_kana || '',
              item.emergency_contact_name_1 || '',
              item.emergency_contact_phone_1 || '',
              item.emergency_contact_name_2 || '',
              item.emergency_contact_phone_2 || '',
              item.guardian_name || '',
              item.guardian_phone || '',
              item.guardian_email || '',
              item.partner_guardian_name || '',
              item.partner_guardian_phone || '',
              item.partner_guardian_email || '',
              item.agreement_checked ? 'Yes' : 'No',
              item.privacy_policy_checked ? 'Yes' : 'No',
              item.media_consent_checked ? 'Yes' : 'No',
              item.entries?.status || ''
            ])}
            headers={['ID', 'エントリーID', 'ダンスジャンル', 'アマプロ区分', 'エントリー名', 'エントリー名フリガナ', 'エントリー名ローマ字', '代表者メール', '生年月日', 'パートナーエントリー名', 'パートナーエントリー名フリガナ', 'パートナーエントリー名ローマ字', 'パートナー生年月日', '代表者電話番号', '代表者本名', '代表者本名カナ', 'パートナー本名', 'パートナー本名カナ', '緊急連絡先1名前', '緊急連絡先1電話', '緊急連絡先2名前', '緊急連絡先2電話', '保護者名', '保護者電話', '保護者メール', 'パートナー保護者名', 'パートナー保護者電話', 'パートナー保護者メール', '参加資格', 'プライバシーポリシー', '写真・映像使用許諾', '選考ステータス']}
            filename="basic_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">基本情報一覧</h1>
        <p className="text-gray-600">エントリーの基本情報をまとめて確認できます（{mappedBasicInfoList?.length || 0}件）</p>
      </div>

      {mappedBasicInfoList && mappedBasicInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    システム利用者名
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ダンスジャンル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アマプロ区分
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    代表者情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    パートナー情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    連絡先
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    緊急連絡先1
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    緊急連絡先2
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    保護者情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    パートナー保護者
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    同意状況
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    振込確認用紙
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedBasicInfoList.map((basicInfo) => (
                  <tr key={basicInfo.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {basicInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{basicInfo.dance_style || '未入力'}</div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{basicInfo.category_division || '未入力'}</div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{basicInfo.representative_name || '未入力'}</div>
                        <div className="text-gray-500">{basicInfo.representative_furigana || ''}</div>
                        <div className="text-gray-500">生年月日: {basicInfo.representative_birthdate || '未入力'}</div>
                        <div className="text-gray-500">ローマ字: {basicInfo.representative_romaji || '未入力'}</div>
                        <div className="text-gray-500">本名: {basicInfo.real_name || '未入力'}</div>
                        <div className="text-gray-500">本名カナ: {basicInfo.real_name_kana || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{basicInfo.partner_name || '未入力'}</div>
                        <div className="text-gray-500">{basicInfo.partner_furigana || ''}</div>
                        <div className="text-gray-500">生年月日: {basicInfo.partner_birthdate || '未入力'}</div>
                        <div className="text-gray-500">ローマ字: {basicInfo.partner_romaji || '未入力'}</div>
                        <div className="text-gray-500">本名: {basicInfo.partner_real_name || '未入力'}</div>
                        <div className="text-gray-500">本名カナ: {basicInfo.partner_real_name_kana || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">電話: {basicInfo.phone_number || '未入力'}</div>
                        <div className="text-gray-500">メール: {basicInfo.representative_email || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{basicInfo.emergency_contact_name_1 || '未入力'}</div>
                        <div className="text-gray-500">{basicInfo.emergency_contact_phone_1 || ''}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{basicInfo.emergency_contact_name_2 || '未入力'}</div>
                        <div className="text-gray-500">{basicInfo.emergency_contact_phone_2 || ''}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{basicInfo.guardian_name || '未入力'}</div>
                        <div className="text-gray-500">{basicInfo.guardian_phone || ''}</div>
                        <div className="text-gray-500">{basicInfo.guardian_email || ''}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{basicInfo.partner_guardian_name || '未入力'}</div>
                        <div className="text-gray-500">{basicInfo.partner_guardian_phone || ''}</div>
                        <div className="text-gray-500">{basicInfo.partner_guardian_email || ''}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className={basicInfo.agreement_checked ? 'text-green-600' : 'text-red-600'}>
                          参加資格: {basicInfo.agreement_checked ? '✓' : '✗'}
                        </div>
                        <div className={basicInfo.privacy_policy_checked ? 'text-green-600' : 'text-red-600'}>
                          プライバシーポリシー: {basicInfo.privacy_policy_checked ? '✓' : '✗'}
                        </div>
                        <div className={basicInfo.media_consent_checked ? 'text-green-600' : 'text-red-600'}>
                          写真・映像使用許諾: {basicInfo.media_consent_checked ? '✓' : '✗'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(basicInfo.entry_files) && basicInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.purpose === 'bank_slip'
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
                        {(!Array.isArray(basicInfo.entry_files) || !basicInfo.entry_files.some((file: { purpose?: string }) => file.purpose === 'bank_slip')) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
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