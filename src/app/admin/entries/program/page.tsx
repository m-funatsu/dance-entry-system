import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'


export default async function ProgramInfoListPage() {
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

  // 管理者クライアントでプログラム情報を取得
  const adminSupabase = createAdminClient()
  
  console.log('[PROGRAM DEBUG] === プログラム情報一覧データ取得開始 ===')
  
  // プログラム情報を取得
  const { data: programInfoList, error: programError } = await adminSupabase
    .from('program_info')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('[PROGRAM DEBUG] プログラム情報取得完了')
  console.log('[PROGRAM DEBUG] プログラム情報件数:', programInfoList?.length || 0)
  console.log('[PROGRAM DEBUG] プログラム情報エラー:', programError)

  if (programError) {
    console.error('プログラム情報取得エラー:', programError)
    return <div>プログラム情報の取得に失敗しました</div>
  }

  // エントリー情報を取得
  const { data: entriesList, error: entriesError } = await adminSupabase
    .from('entries')
    .select('*')

  console.log('[PROGRAM DEBUG] エントリー情報取得完了')
  console.log('[PROGRAM DEBUG] エントリー件数:', entriesList?.length || 0)
  console.log('[PROGRAM DEBUG] エントリーエラー:', entriesError)

  // ユーザー情報を取得
  const { data: usersList, error: usersError } = await adminSupabase
    .from('users')
    .select('*')

  console.log('[PROGRAM DEBUG] ユーザー情報取得完了')
  console.log('[PROGRAM DEBUG] ユーザー件数:', usersList?.length || 0)
  console.log('[PROGRAM DEBUG] ユーザーエラー:', usersError)

  // ファイル情報を取得
  const { data: filesList, error: filesError } = await adminSupabase
    .from('entry_files')
    .select('*')

  console.log('[PROGRAM DEBUG] ファイル情報取得完了')
  console.log('[PROGRAM DEBUG] ファイル件数:', filesList?.length || 0)
  console.log('[PROGRAM DEBUG] ファイルエラー:', filesError)

  // データをマッピング（全データを表示）
  const mappedProgramInfoList = programInfoList?.map(programInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === programInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === programInfo.entry_id)
    
    console.log(`[PROGRAM DEBUG] エントリーID ${programInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0
    })
    
    return {
      ...programInfo,
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

  console.log('[PROGRAM DEBUG] マッピング完了')
  console.log('[PROGRAM DEBUG] マッピング後データ件数:', mappedProgramInfoList?.length || 0)
  console.log('[PROGRAM DEBUG] マッピング後データ:', JSON.stringify(mappedProgramInfoList, null, 2))

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
            data={mappedProgramInfoList.map(item => [
              item.id,
              item.entry_id,
              item.song_count || '',
              item.semifinal_story || '',
              item.semifinal_highlight || '',
              item.final_story || '',
              item.final_highlight || '',
              item.entries?.status || ''
            ])}
            headers={['ID', 'エントリーID', '楽曲数', '準決勝ストーリー', '準決勝見所', '決勝ストーリー', '決勝見所', 'ステータス']}
            filename="program_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">プログラム掲載用情報一覧</h1>
        <p className="text-gray-600">エントリーのプログラム掲載用情報をまとめて確認できます（{mappedProgramInfoList?.length || 0}件）</p>
      </div>

      {mappedProgramInfoList && mappedProgramInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    エントリー名
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    楽曲数
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    準決勝情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    決勝情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    その他詳細
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ファイル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedProgramInfoList.map((programInfo) => (
                  <tr key={programInfo.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {programInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {programInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{programInfo.song_count || '未選択'}</div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">ストーリー:</div>
                        <div>
                          {programInfo.semifinal_story ? 
                            `${programInfo.semifinal_story.slice(0, 30)}${programInfo.semifinal_story.length > 30 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                        <div className="text-gray-500 mt-1">見所:</div>
                        <div>
                          {programInfo.semifinal_highlight ? 
                            `${programInfo.semifinal_highlight.slice(0, 30)}${programInfo.semifinal_highlight.length > 30 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        {programInfo.song_count === '2曲' ? (
                          <>
                            <div className="text-gray-500">ストーリー:</div>
                            <div>
                              {programInfo.final_story ? 
                                `${programInfo.final_story.slice(0, 30)}${programInfo.final_story.length > 30 ? '...' : ''}` 
                                : '未入力'}
                            </div>
                            <div className="text-gray-500 mt-1">見所:</div>
                            <div>
                              {programInfo.final_highlight ? 
                                `${programInfo.final_highlight.slice(0, 30)}${programInfo.final_highlight.length > 30 ? '...' : ''}` 
                                : '未入力'}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">1曲のため不要</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500 mt-1">作成日: {programInfo.created_at ? new Date(programInfo.created_at).toLocaleDateString('ja-JP') : '不明'}</div>
                        <div className="text-gray-500">更新日: {programInfo.updated_at ? new Date(programInfo.updated_at).toLocaleDateString('ja-JP') : '不明'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {(programInfo.entry_files as Array<{ id: string; file_name: string; file_path: string; file_type: string; purpose: string }>)?.filter((file: { purpose: string }) => 
                          file.purpose.includes('program') || 
                          file.purpose.includes('semifinal') || 
                          file.purpose.includes('final')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string }) => (
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
                        {!(programInfo.entry_files as Array<{ purpose: string }>)?.some((file: { purpose: string }) => 
                          file.purpose.includes('program') || 
                          file.purpose.includes('semifinal') || 
                          file.purpose.includes('final')
                        ) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        programInfo.entries?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        programInfo.entries?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        programInfo.entries?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {programInfo.entries?.status === 'pending' && '審査待ち'}
                        {programInfo.entries?.status === 'submitted' && '提出済み'}
                        {programInfo.entries?.status === 'selected' && '選考通過'}
                        {programInfo.entries?.status === 'rejected' && '不選考'}
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
          <div className="text-gray-500">プログラム掲載用情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}