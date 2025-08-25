import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'

export default async function FinalsInfoListPage() {
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

  // 管理者クライアントで決勝情報を取得
  const adminSupabase = createAdminClient()
  
  console.log('[FINALS DEBUG] === 決勝情報一覧データ取得開始 ===')
  
  // 決勝情報を取得
  const { data: finalsInfoList, error: finalsError } = await adminSupabase
    .from('finals_info')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('[FINALS DEBUG] 決勝情報取得完了')
  console.log('[FINALS DEBUG] 決勝情報件数:', finalsInfoList?.length || 0)
  console.log('[FINALS DEBUG] 決勝情報エラー:', finalsError)

  if (finalsError) {
    console.error('決勝情報取得エラー:', finalsError)
    return <div>決勝情報の取得に失敗しました</div>
  }

  // エントリー情報を取得
  const { data: entriesList, error: entriesError } = await adminSupabase
    .from('entries')
    .select('*')

  console.log('[FINALS DEBUG] エントリー情報取得完了')
  console.log('[FINALS DEBUG] エントリー件数:', entriesList?.length || 0)
  console.log('[FINALS DEBUG] エントリーエラー:', entriesError)

  // ユーザー情報を取得
  const { data: usersList, error: usersError } = await adminSupabase
    .from('users')
    .select('*')

  console.log('[FINALS DEBUG] ユーザー情報取得完了')
  console.log('[FINALS DEBUG] ユーザー件数:', usersList?.length || 0)
  console.log('[FINALS DEBUG] ユーザーエラー:', usersError)

  // ファイル情報を取得
  const { data: filesList, error: filesError } = await adminSupabase
    .from('entry_files')
    .select('*')

  console.log('[FINALS DEBUG] ファイル情報取得完了')
  console.log('[FINALS DEBUG] ファイル件数:', filesList?.length || 0)
  console.log('[FINALS DEBUG] ファイルエラー:', filesError)

  // データをマッピング（全データを表示）
  const mappedFinalsInfoList = finalsInfoList?.map(finalsInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === finalsInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === finalsInfo.entry_id)
    
    console.log(`[FINALS DEBUG] エントリーID ${finalsInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0
    })
    
    return {
      ...finalsInfo,
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

  console.log('[FINALS DEBUG] マッピング完了')
  console.log('[FINALS DEBUG] マッピング後データ件数:', mappedFinalsInfoList?.length || 0)

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
            data={mappedFinalsInfoList.map(item => [
              item.id,
              item.entry_id,
              item.entries?.users?.name || '不明なユーザー',
              item.entries?.participant_names || 'エントリー名なし',
              item.work_title || '',
              item.work_character_story || '',
              item.music_title || '',
              item.artist || '',
              item.props_usage || '',
              item.music_change ? 'あり' : 'なし',
              item.sound_change_from_semifinals ? 'あり' : 'なし',
              item.choreographer_name || '',
              item.choreographer_furigana || '',
              item.choreographer_change ? 'あり' : 'なし',
              item.choreographer_attendance || '',
              item.entries?.status || ''
            ])}
            headers={['ID', 'エントリーID', 'ユーザー名', 'エントリー名', '作品タイトル', '作品ストーリー', '楽曲タイトル', 'アーティスト', '小道具使用', '楽曲変更', '音響変更', '振付師名', '振付師フリガナ', '振付変更', '振付師出席', '選考ステータス']}
            filename="finals_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">決勝情報一覧</h1>
        <p className="text-gray-600">エントリーの決勝情報をまとめて確認できます（{mappedFinalsInfoList?.length || 0}件）</p>
      </div>

      {mappedFinalsInfoList && mappedFinalsInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto" style={{maxWidth: '100vw'}}>
            <table className="divide-y divide-gray-200" style={{minWidth: '1200px', width: 'max-content'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    エントリー名
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作品情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    楽曲情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    小道具使用
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    楽曲・音響変更
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    振付師情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    決勝用音源
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    決勝用動画
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    決勝用画像
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    決勝用資料PDF
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    小道具関連ファイル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    振付師関連ファイル
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
                {mappedFinalsInfoList.map((finalsInfo) => (
                  <tr key={finalsInfo.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {finalsInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {finalsInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{finalsInfo.work_title || '未入力'}</div>
                        <div className="text-gray-500 mt-1">
                          {finalsInfo.work_character_story ? 
                            `${finalsInfo.work_character_story.slice(0, 50)}${finalsInfo.work_character_story.length > 50 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{finalsInfo.music_title || '未入力'}</div>
                        <div className="text-gray-500">{finalsInfo.artist || ''}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{finalsInfo.props_usage || '未選択'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">楽曲変更: {finalsInfo.music_change ? 'あり' : 'なし'}</div>
                        <div className="text-gray-500">音響変更: {finalsInfo.sound_change_from_semifinals ? 'あり' : 'なし'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{finalsInfo.choreographer_name || '未入力'}</div>
                        <div className="text-gray-500">{finalsInfo.choreographer_furigana || ''}</div>
                        <div className="text-gray-500">変更: {finalsInfo.choreographer_change ? 'あり' : 'なし'}</div>
                        <div className="text-gray-500">出席: {finalsInfo.choreographer_attendance || '未選択'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('finals')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                              download
                            >
                              🎵 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('finals')
                        )) && (
                          <span className="text-xs text-gray-400">決勝用音源なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'video' && file.purpose && file.purpose.includes('finals')
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
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'video' && file.purpose && file.purpose.includes('finals')
                        )) && (
                          <span className="text-xs text-gray-400">決勝用動画なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('finals')
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
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('finals')
                        )) && (
                          <span className="text-xs text-gray-400">決勝用画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'pdf' && file.purpose && (file.purpose.includes('finals') && !file.purpose.includes('props') && !file.purpose.includes('choreographer'))
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
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'pdf' && file.purpose && (file.purpose.includes('finals') && !file.purpose.includes('props') && !file.purpose.includes('choreographer'))
                        )) && (
                          <span className="text-xs text-gray-400">決勝用資料なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.purpose && file.purpose.includes('props')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🎭 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { purpose?: string }) => 
                          file.purpose && file.purpose.includes('props')
                        )) && (
                          <span className="text-xs text-gray-400">小道具ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.purpose && file.purpose.includes('choreographer')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              💃 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { purpose?: string }) => 
                          file.purpose && file.purpose.includes('choreographer')
                        )) && (
                          <span className="text-xs text-gray-400">振付師ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">作成: {finalsInfo.created_at ? new Date(finalsInfo.created_at).toLocaleDateString('ja-JP') : '不明'}</div>
                        <div className="text-gray-500">更新: {finalsInfo.updated_at ? new Date(finalsInfo.updated_at).toLocaleDateString('ja-JP') : '不明'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        finalsInfo.entries?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        finalsInfo.entries?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        finalsInfo.entries?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {finalsInfo.entries?.status === 'pending' && '審査待ち'}
                        {finalsInfo.entries?.status === 'submitted' && '提出済み'}
                        {finalsInfo.entries?.status === 'selected' && '選考通過'}
                        {finalsInfo.entries?.status === 'rejected' && '不選考'}
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
          <div className="text-gray-500">決勝情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}