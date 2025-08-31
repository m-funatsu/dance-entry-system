import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'
import { getStatusLabel, getStatusColor } from '@/lib/status-labels'


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

  // 基本情報を取得（ダンスジャンル用）
  const { data: basicInfoList, error: basicInfoError } = await adminSupabase
    .from('basic_info')
    .select('*')

  console.log('[PROGRAM DEBUG] 基本情報取得完了')
  console.log('[PROGRAM DEBUG] 基本情報件数:', basicInfoList?.length || 0)
  console.log('[PROGRAM DEBUG] 基本情報エラー:', basicInfoError)

  // データをマッピング（選考通過のみ表示）
  const mappedProgramInfoList = programInfoList?.map(programInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === programInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === programInfo.entry_id)
    const relatedBasicInfo = basicInfoList?.find(basicInfo => basicInfo.entry_id === programInfo.entry_id)
    
    console.log(`[PROGRAM DEBUG] エントリーID ${programInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0,
      status: relatedEntry?.status
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
      entry_files: relatedFiles || [],
      basic_info: relatedBasicInfo || null
    }
  })
  .filter(item => ['pending', 'submitted', 'selected'].includes(item.entries?.status || ''))
  // ダンスジャンルでソート
  .sort((a, b) => {
    const genreA = a.basic_info?.dance_style || 'ZZZ' // 未設定は最後に
    const genreB = b.basic_info?.dance_style || 'ZZZ'
    return genreA.localeCompare(genreB, 'ja')
  }) || []

  console.log('[PROGRAM DEBUG] マッピング完了')
  console.log('[PROGRAM DEBUG] マッピング後データ件数:', mappedProgramInfoList?.length || 0)
  console.log('[PROGRAM DEBUG] マッピング後データ:', JSON.stringify(mappedProgramInfoList, null, 2))

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
            data={mappedProgramInfoList.map(item => [
              item.entries?.users?.name || '不明なユーザー',
              item.basic_info?.dance_style || '未入力',
              item.song_count || '',
              item.affiliation || '',
              item.semifinal_story || '',
              item.final_story || '',
              item.player_photo_path ? '選手紹介画像あり' : 'なし',
              item.program_notes || '',
              getStatusLabel(item.entries?.status)
            ])}
            headers={['システム利用者名', 'ダンスジャンル', '楽曲数', '所属教室または所属', '準決勝 - 作品あらすじ', '決勝 - 作品あらすじ', '選手紹介画像', '備考欄', '選考ステータス']}
            filename="program_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">プログラム掲載用情報一覧</h1>
        <p className="text-gray-600">エントリーのプログラム掲載用情報をまとめて確認できます（{mappedProgramInfoList?.length || 0}件）</p>
        <p className="text-sm text-blue-600 mt-1">※ 未処理・提出済み・選考通過のエントリーを表示</p>
      </div>

      {mappedProgramInfoList && mappedProgramInfoList.length > 0 ? (
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
                    楽曲数
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    所属教室または所属
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    準決勝 - 作品あらすじ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    決勝 - 作品あらすじ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    選手紹介画像
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    備考欄
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    選考ステータス
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
                      <div className="text-xs font-medium text-gray-900">
                        {programInfo.basic_info?.dance_style || '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{programInfo.song_count || '未選択'}</div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        {programInfo.affiliation || '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3" style={{maxWidth: '200px'}}>
                      <div className="text-xs text-gray-900">
                        <div className="truncate">
                          {programInfo.semifinal_story ? 
                            `${programInfo.semifinal_story.slice(0, 50)}${programInfo.semifinal_story.length > 50 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3" style={{maxWidth: '200px'}}>
                      <div className="text-xs text-gray-900">
                        <div className="truncate">
                          {programInfo.song_count === '2曲' ? (
                            programInfo.final_story ? 
                              `${programInfo.final_story.slice(0, 50)}${programInfo.final_story.length > 50 ? '...' : ''}` 
                              : '未入力'
                          ) : (
                            <span className="text-gray-400">1曲のため不要</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {/* 選手紹介画像 */}
                        {programInfo.player_photo_path && (
                          <div>
                            <a
                              href={getFileUrl(programInfo.player_photo_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              📸 選手紹介画像
                            </a>
                          </div>
                        )}
                        
                        {/* 作品イメージ①～④ */}
                        {[1, 2, 3, 4].map((num) => {
                          const imagePath = programInfo[`semifinal_image${num}_path` as keyof typeof programInfo] as string
                          
                          return imagePath ? (
                            <div key={`image${num}`}>
                              <a
                                href={getFileUrl(imagePath)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                              >
                                📸 作品イメージ{num === 1 ? '①' : num === 2 ? '②' : num === 3 ? '③' : '④'}
                              </a>
                            </div>
                          ) : null
                        })}
                        
                        {/* ファイルなしの場合 */}
                        {(!programInfo.player_photo_path && 
                          !programInfo.semifinal_image1_path && 
                          !programInfo.semifinal_image2_path && 
                          !programInfo.semifinal_image3_path && 
                          !programInfo.semifinal_image4_path) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        {programInfo.program_notes || '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(programInfo.entries?.status)}`}>
                        {getStatusLabel(programInfo.entries?.status)}
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