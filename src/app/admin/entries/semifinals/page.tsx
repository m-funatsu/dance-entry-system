import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DownloadButton from '@/components/admin/DownloadButton'


export default async function SemifinalsInfoListPage() {
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

  // 管理者クライアントで準決勝情報を取得
  const adminSupabase = createAdminClient()
  
  console.log('[SEMIFINALS DEBUG] === 準決勝情報一覧データ取得開始 ===')
  
  // 準決勝情報を取得
  const { data: semifinalsInfoList, error: semifinalsError } = await adminSupabase
    .from('semifinals_info')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('[SEMIFINALS DEBUG] 準決勝情報取得完了')
  console.log('[SEMIFINALS DEBUG] 準決勝情報件数:', semifinalsInfoList?.length || 0)
  console.log('[SEMIFINALS DEBUG] 準決勝情報エラー:', semifinalsError)

  if (semifinalsError) {
    console.error('準決勝情報取得エラー:', semifinalsError)
    return <div>準決勝情報の取得に失敗しました</div>
  }

  // エントリー情報を取得
  const { data: entriesList, error: entriesError } = await adminSupabase
    .from('entries')
    .select('*')

  console.log('[SEMIFINALS DEBUG] エントリー情報取得完了')
  console.log('[SEMIFINALS DEBUG] エントリー件数:', entriesList?.length || 0)
  console.log('[SEMIFINALS DEBUG] エントリーエラー:', entriesError)

  // ユーザー情報を取得
  const { data: usersList, error: usersError } = await adminSupabase
    .from('users')
    .select('*')

  console.log('[SEMIFINALS DEBUG] ユーザー情報取得完了')
  console.log('[SEMIFINALS DEBUG] ユーザー件数:', usersList?.length || 0)
  console.log('[SEMIFINALS DEBUG] ユーザーエラー:', usersError)

  // ファイル情報を取得
  const { data: filesList, error: filesError } = await adminSupabase
    .from('entry_files')
    .select('*')

  console.log('[SEMIFINALS DEBUG] ファイル情報取得完了')
  console.log('[SEMIFINALS DEBUG] ファイル件数:', filesList?.length || 0)
  console.log('[SEMIFINALS DEBUG] ファイルエラー:', filesError)

  // データをマッピング（全データを表示）
  const mappedSemifinalsInfoList = semifinalsInfoList?.map(semifinalsInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === semifinalsInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === semifinalsInfo.entry_id)
    
    console.log(`[SEMIFINALS DEBUG] エントリーID ${semifinalsInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0
    })
    
    return {
      ...semifinalsInfo,
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

  console.log('[SEMIFINALS DEBUG] マッピング完了')
  console.log('[SEMIFINALS DEBUG] マッピング後データ件数:', mappedSemifinalsInfoList?.length || 0)
  console.log('[SEMIFINALS DEBUG] マッピング後データ:', JSON.stringify(mappedSemifinalsInfoList, null, 2))

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
            data={mappedSemifinalsInfoList.map(item => [
              item.id,
              item.entry_id,
              item.entries?.status || '',
              // 作品情報
              item.music_change_from_preliminary ? 'Yes' : 'No',
              item.work_title || '',
              item.work_title_kana || '',
              item.work_character_story || '',
              // 楽曲著作権関連情報
              item.copyright_permission || '',
              item.music_title || '',
              item.cd_title || '',
              item.record_number || '',
              item.jasrac_code || '',
              item.music_type || '',
              item.artist || '',
              // 音響情報
              item.music_usage_method || '',
              item.chaser_song_designation || '',
              item.fade_out_start_time || '',
              item.fade_out_complete_time || '',
              item.dance_start_timing || '',
              // 照明シーン1
              item.scene1_time || '',
              item.scene1_trigger || '',
              item.scene1_color_type || '',
              item.scene1_color_other || '',
              item.scene1_image || '',
              item.scene1_notes || '',
              // 照明シーン2
              item.scene2_time || '',
              item.scene2_trigger || '',
              item.scene2_color_type || '',
              item.scene2_color_other || '',
              item.scene2_image || '',
              item.scene2_notes || '',
              // 照明シーン3
              item.scene3_time || '',
              item.scene3_trigger || '',
              item.scene3_color_type || '',
              item.scene3_color_other || '',
              item.scene3_image || '',
              item.scene3_notes || '',
              // 振付師情報
              item.choreographer_name || '',
              item.choreographer_furigana || '',
              // 小道具情報
              item.props_usage || '',
              item.props_details || '',
              // 賞金振込先情報
              item.bank_name || '',
              item.branch_name || '',
              item.account_type || '',
              item.account_number || '',
              item.account_holder || ''
            ])}
            headers={[
              'ID', 
              'エントリーID', 
              '選考ステータス',
              // 作品情報
              '予選との楽曲情報の変更',
              '作品タイトル',
              '作品タイトル(ふりがな)',
              '作品キャラクター・ストーリー等',
              // 楽曲著作権関連情報
              '楽曲著作権許諾',
              '使用楽曲タイトル',
              '収録CDタイトル', 
              'レコード番号',
              'JASRAC作品コード',
              '楽曲種類',
              'アーティスト',
              // 音響情報
              '音楽使用方法',
              'チェイサー（退場）曲の指定',
              'フェードアウト開始時間',
              'フェードアウト完了時間',
              '踊り出しタイミング',
              // 照明シーン1
              '照明シーン1時間',
              '照明シーン1きっかけ',
              '照明シーン1色・系統',
              '照明シーン1色・系統その他',
              '照明シーン1イメージ',
              '照明シーン1備考',
              // 照明シーン2
              '照明シーン2時間',
              '照明シーン2きっかけ',
              '照明シーン2色・系統',
              '照明シーン2色・系統その他',
              '照明シーン2イメージ',
              '照明シーン2備考',
              // 照明シーン3
              '照明シーン3時間',
              '照明シーン3きっかけ',
              '照明シーン3色・系統',
              '照明シーン3色・系統その他',
              '照明シーン3イメージ',
              '照明シーン3備考',
              // 振付師情報
              '振付師名',
              '振付師フリガナ',
              // 小道具情報
              '使用する小道具',
              '小道具詳細',
              // 賞金振込先情報
              '銀行名',
              '支店名',
              '口座種類',
              '口座番号',
              '口座名義'
            ]}
            filename="semifinals_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">準決勝情報一覧</h1>
        <p className="text-gray-600">エントリーの準決勝情報をまとめて確認できます（{mappedSemifinalsInfoList?.length || 0}件）</p>
      </div>

      {mappedSemifinalsInfoList && mappedSemifinalsInfoList.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto" style={{maxWidth: '100vw'}}>
            <table className="divide-y divide-gray-200" style={{minWidth: '1500px', width: 'max-content'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    システム利用者名
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作品情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    楽曲情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    振付師情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    銀行情報
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    音響全般
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    音響シーン1
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    音響シーン2
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    音響シーン3
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    音響シーン4
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    照明全般
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    照明シーン1
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    照明シーン2
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    照明シーン3
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    照明シーン4
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    音源ファイル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    動画ファイル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    画像ファイル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDFファイル
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
                {mappedSemifinalsInfoList.map((semifinalsInfo) => (
                  <tr key={semifinalsInfo.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {semifinalsInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {semifinalsInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{semifinalsInfo.work_title || '未入力'}</div>
                        <div className="text-gray-500">ふりがな: {semifinalsInfo.work_title_kana || '未入力'}</div>
                        <div className="text-gray-500">楽曲: {semifinalsInfo.music_title || '未入力'}</div>
                        <div className="text-gray-500 mt-1">
                          {semifinalsInfo.work_character_story ? 
                            `${semifinalsInfo.work_character_story.slice(0, 50)}${semifinalsInfo.work_character_story.length > 50 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">アーティスト: {semifinalsInfo.artist || '未入力'}</div>
                        <div className="text-gray-500">楽曲種類: {semifinalsInfo.music_type || '未入力'}</div>
                        <div className="text-gray-500">JASRAC: {semifinalsInfo.jasrac_code || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{semifinalsInfo.choreographer_name || '未入力'}</div>
                        <div className="text-gray-500">{semifinalsInfo.choreographer_furigana || ''}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">
                          {semifinalsInfo.bank_name ? 
                            `${semifinalsInfo.bank_name} ${semifinalsInfo.branch_name || ''}`
                            : '未入力'}
                        </div>
                        {semifinalsInfo.account_type && (
                          <div className="text-gray-500">{semifinalsInfo.account_type}</div>
                        )}
                        {semifinalsInfo.account_number && (
                          <div className="text-gray-500">口座番号: {semifinalsInfo.account_number}</div>
                        )}
                        {semifinalsInfo.account_holder && (
                          <div className="text-gray-500">名義: {semifinalsInfo.account_holder}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>{semifinalsInfo.sound_instruction || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>指示: {semifinalsInfo.sound_scene1_instruction || '未入力'}</div>
                        <div>時間: {semifinalsInfo.sound_scene1_time || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>指示: {semifinalsInfo.sound_scene2_instruction || '未入力'}</div>
                        <div>時間: {semifinalsInfo.sound_scene2_time || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>指示: {semifinalsInfo.sound_scene3_instruction || '未入力'}</div>
                        <div>時間: {semifinalsInfo.sound_scene3_time || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>指示: {semifinalsInfo.sound_scene4_instruction || '未入力'}</div>
                        <div>時間: {semifinalsInfo.sound_scene4_time || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>{semifinalsInfo.lighting_instruction || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>指示: {semifinalsInfo.lighting_scene1_instruction || '未入力'}</div>
                        <div>時間: {semifinalsInfo.lighting_scene1_time || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>指示: {semifinalsInfo.lighting_scene2_instruction || '未入力'}</div>
                        <div>時間: {semifinalsInfo.lighting_scene2_time || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>指示: {semifinalsInfo.lighting_scene3_instruction || '未入力'}</div>
                        <div>時間: {semifinalsInfo.lighting_scene3_time || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="text-xs text-gray-900">
                        <div>指示: {semifinalsInfo.lighting_scene4_instruction || '未入力'}</div>
                        <div>時間: {semifinalsInfo.lighting_scene4_time || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('semifinals')
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
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('semifinals')
                        )) && (
                          <span className="text-xs text-gray-400">音源なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'video' && file.purpose && file.purpose.includes('semifinals')
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
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'video' && file.purpose && file.purpose.includes('semifinals')
                        )) && (
                          <span className="text-xs text-gray-400">動画なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('semifinals')
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
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('semifinals')
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'pdf' && file.purpose && file.purpose.includes('semifinals')
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
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'pdf' && file.purpose && file.purpose.includes('semifinals')
                        )) && (
                          <span className="text-xs text-gray-400">PDFなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        {semifinalsInfo.special_notes ? 
                          `${semifinalsInfo.special_notes.slice(0, 100)}${semifinalsInfo.special_notes.length > 100 ? '...' : ''}` 
                          : '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">作成: {semifinalsInfo.created_at ? new Date(semifinalsInfo.created_at).toLocaleDateString('ja-JP') : '不明'}</div>
                        <div className="text-gray-500">更新: {semifinalsInfo.updated_at ? new Date(semifinalsInfo.updated_at).toLocaleDateString('ja-JP') : '不明'}</div>
                        {semifinalsInfo.additional_info && (
                          <div className="text-gray-500 mt-1">追加: {semifinalsInfo.additional_info.slice(0, 30)}...</div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        semifinalsInfo.entries?.status === 'selected' ? 'bg-green-100 text-green-800' :
                        semifinalsInfo.entries?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        semifinalsInfo.entries?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {semifinalsInfo.entries?.status === 'pending' && '審査待ち'}
                        {semifinalsInfo.entries?.status === 'submitted' && '提出済み'}
                        {semifinalsInfo.entries?.status === 'selected' && '選考通過'}
                        {semifinalsInfo.entries?.status === 'rejected' && '不選考'}
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
          <div className="text-gray-500">準決勝情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}