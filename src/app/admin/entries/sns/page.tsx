import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'

export default async function SnsInfoListPage() {
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

  // 管理者クライアントでSNS情報を取得
  const adminSupabase = createAdminClient()
  
  console.log('[SNS DEBUG] === SNS情報一覧データ取得開始 ===')
  
  // SNS情報を取得
  const { data: snsInfoList, error: snsError } = await adminSupabase
    .from('sns_info')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('[SNS DEBUG] SNS情報取得完了')
  console.log('[SNS DEBUG] SNS情報件数:', snsInfoList?.length || 0)
  console.log('[SNS DEBUG] SNS情報エラー:', snsError)

  if (snsError) {
    console.error('SNS情報取得エラー:', snsError)
    return <div>SNS情報の取得に失敗しました</div>
  }

  // エントリー情報を取得
  const { data: entriesList, error: entriesError } = await adminSupabase
    .from('entries')
    .select('*')

  console.log('[SNS DEBUG] エントリー情報取得完了')
  console.log('[SNS DEBUG] エントリー件数:', entriesList?.length || 0)
  console.log('[SNS DEBUG] エントリーエラー:', entriesError)

  // ユーザー情報を取得
  const { data: usersList, error: usersError } = await adminSupabase
    .from('users')
    .select('*')

  console.log('[SNS DEBUG] ユーザー情報取得完了')
  console.log('[SNS DEBUG] ユーザー件数:', usersList?.length || 0)
  console.log('[SNS DEBUG] ユーザーエラー:', usersError)

  // ファイル情報を取得
  const { data: filesList, error: filesError } = await adminSupabase
    .from('entry_files')
    .select('*')

  console.log('[SNS DEBUG] ファイル情報取得完了')
  console.log('[SNS DEBUG] ファイル件数:', filesList?.length || 0)
  console.log('[SNS DEBUG] ファイルエラー:', filesError)

  // データをマッピング（全データを表示）
  const mappedSnsInfoList = snsInfoList?.map(snsInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === snsInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === snsInfo.entry_id)
    
    console.log(`[SNS DEBUG] エントリーID ${snsInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0
    })
    
    return {
      ...snsInfo,
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

  console.log('[SNS DEBUG] マッピング完了')
  console.log('[SNS DEBUG] マッピング後データ件数:', mappedSnsInfoList?.length || 0)

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
            data={mappedSnsInfoList.map(item => [
              item.id,
              item.entry_id,
              item.entries?.users?.name || '不明なユーザー',
              item.entries?.participant_names || 'エントリー名なし',
              item.practice_video_path ? 'あり' : 'なし',
              item.introduction_highlight_path ? 'あり' : 'なし',
              item.sns_notes || '',
              item.entries?.status || ''
            ])}
            headers={['ID', 'エントリーID', 'ユーザー名', 'エントリー名', '練習風景動画', '選手紹介動画', 'SNS備考', 'ステータス']}
            filename="sns_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">SNS情報一覧</h1>
        <p className="text-gray-600">エントリーのSNS情報をまとめて確認できます（{mappedSnsInfoList?.length || 0}件）</p>
      </div>

      {mappedSnsInfoList && mappedSnsInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto" style={{maxWidth: '100vw'}}>
            <table className="divide-y divide-gray-200" style={{minWidth: '1000px', width: 'max-content'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    エントリー名
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    動画情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SNS備考
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    練習風景動画
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    選手紹介動画
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SNS用画像
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SNS用資料PDF
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
                {mappedSnsInfoList.map((snsInfo) => (
                  <tr key={snsInfo.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {snsInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {snsInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">練習風景:</div>
                        <div className={snsInfo.practice_video_path ? 'text-green-600' : 'text-red-600'}>
                          {snsInfo.practice_video_path ? '✓ あり' : '✗ なし'}
                        </div>
                        <div className="text-gray-500 mt-1">選手紹介:</div>
                        <div className={snsInfo.introduction_highlight_path ? 'text-green-600' : 'text-red-600'}>
                          {snsInfo.introduction_highlight_path ? '✓ あり' : '✗ なし'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        {snsInfo.sns_notes ? 
                          `${snsInfo.sns_notes.slice(0, 100)}${snsInfo.sns_notes.length > 100 ? '...' : ''}` 
                          : '備考なし'}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(snsInfo.entry_files) && snsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'video' && file.purpose && file.purpose.includes('practice')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🎬 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(snsInfo.entry_files) || !snsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'video' && file.purpose && file.purpose.includes('practice')
                        )) && (
                          <span className="text-xs text-gray-400">練習風景動画なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(snsInfo.entry_files) && snsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'video' && file.purpose && file.purpose.includes('introduction')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🎬 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(snsInfo.entry_files) || !snsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'video' && file.purpose && file.purpose.includes('introduction')
                        )) && (
                          <span className="text-xs text-gray-400">選手紹介動画なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(snsInfo.entry_files) && snsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('sns')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              📸 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(snsInfo.entry_files) || !snsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('sns')
                        )) && (
                          <span className="text-xs text-gray-400">SNS用画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(snsInfo.entry_files) && snsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'pdf' && file.purpose && file.purpose.includes('sns')
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
                        {(!Array.isArray(snsInfo.entry_files) || !snsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'pdf' && file.purpose && file.purpose.includes('sns')
                        )) && (
                          <span className="text-xs text-gray-400">SNS用資料なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">作成: {snsInfo.created_at ? new Date(snsInfo.created_at).toLocaleDateString('ja-JP') : '不明'}</div>
                        <div className="text-gray-500">更新: {snsInfo.updated_at ? new Date(snsInfo.updated_at).toLocaleDateString('ja-JP') : '不明'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        snsInfo.entries?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        snsInfo.entries?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        snsInfo.entries?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {snsInfo.entries?.status === 'pending' && '審査待ち'}
                        {snsInfo.entries?.status === 'submitted' && '提出済み'}
                        {snsInfo.entries?.status === 'selected' && '選考通過'}
                        {snsInfo.entries?.status === 'rejected' && '不選考'}
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
          <div className="text-gray-500">SNS情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}