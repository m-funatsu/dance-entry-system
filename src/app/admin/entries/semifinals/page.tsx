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
            data={mappedSemifinalsInfoList.map(item => [
              item.id,
              item.entry_id,
              item.entries?.users?.name || '不明なユーザー',
              item.entries?.participant_names || 'エントリー名なし',
              item.work_title || '',
              item.work_character_story || '',
              item.music_title || '',
              item.artist || '',
              item.music_type || '',
              item.jasrac_code || '',
              item.choreographer_name || '',
              item.choreographer_furigana || '',
              item.bank_name || '',
              item.branch_name || '',
              item.account_type || '',
              item.account_number || '',
              item.account_holder || '',
              item.sound_scene1_instruction || '',
              item.sound_scene1_time || '',
              item.sound_scene1_cue || '',
              item.sound_scene1_volume || '',
              item.sound_scene1_effect || '',
              item.sound_scene2_instruction || '',
              item.sound_scene2_time || '',
              item.sound_scene2_cue || '',
              item.sound_scene2_volume || '',
              item.sound_scene2_effect || '',
              item.sound_scene3_instruction || '',
              item.sound_scene3_time || '',
              item.sound_scene3_cue || '',
              item.sound_scene3_volume || '',
              item.sound_scene3_effect || '',
              item.sound_scene4_instruction || '',
              item.sound_scene4_time || '',
              item.sound_scene4_cue || '',
              item.sound_scene4_volume || '',
              item.sound_scene4_effect || '',
              item.sound_scene5_instruction || '',
              item.sound_scene5_time || '',
              item.sound_scene5_cue || '',
              item.sound_scene5_volume || '',
              item.sound_scene5_effect || '',
              item.lighting_scene1_instruction || '',
              item.lighting_scene1_time || '',
              item.lighting_scene1_cue || '',
              item.lighting_scene1_color || '',
              item.lighting_scene1_intensity || '',
              item.lighting_scene2_instruction || '',
              item.lighting_scene2_time || '',
              item.lighting_scene2_cue || '',
              item.lighting_scene2_color || '',
              item.lighting_scene2_intensity || '',
              item.lighting_scene3_instruction || '',
              item.lighting_scene3_time || '',
              item.lighting_scene3_cue || '',
              item.lighting_scene3_color || '',
              item.lighting_scene3_intensity || '',
              item.lighting_scene4_instruction || '',
              item.lighting_scene4_time || '',
              item.lighting_scene4_cue || '',
              item.lighting_scene4_color || '',
              item.lighting_scene4_intensity || '',
              item.lighting_scene5_instruction || '',
              item.lighting_scene5_time || '',
              item.lighting_scene5_cue || '',
              item.lighting_scene5_color || '',
              item.lighting_scene5_intensity || '',
              item.entries?.status || ''
            ])}
            headers={['ID', 'エントリーID', 'ユーザー名', 'エントリー名', '作品タイトル', '作品ストーリー', '楽曲タイトル', 'アーティスト', '楽曲種別', 'JASRAC作品コード', '振付師名', '振付師フリガナ', '銀行名', '支店名', '口座種別', '口座番号', '口座名義', '音響シーン1指示', '音響シーン1時間', '音響シーン1きっかけ', '音響シーン1音量', '音響シーン1効果', '音響シーン2指示', '音響シーン2時間', '音響シーン2きっかけ', '音響シーン2音量', '音響シーン2効果', '音響シーン3指示', '音響シーン3時間', '音響シーン3きっかけ', '音響シーン3音量', '音響シーン3効果', '音響シーン4指示', '音響シーン4時間', '音響シーン4きっかけ', '音響シーン4音量', '音響シーン4効果', '音響シーン5指示', '音響シーン5時間', '音響シーン5きっかけ', '音響シーン5音量', '音響シーン5効果', '照明シーン1指示', '照明シーン1時間', '照明シーン1きっかけ', '照明シーン1色', '照明シーン1強度', '照明シーン2指示', '照明シーン2時間', '照明シーン2きっかけ', '照明シーン2色', '照明シーン2強度', '照明シーン3指示', '照明シーン3時間', '照明シーン3きっかけ', '照明シーン3色', '照明シーン3強度', '照明シーン4指示', '照明シーン4時間', '照明シーン4きっかけ', '照明シーン4色', '照明シーン4強度', '照明シーン5指示', '照明シーン5時間', '照明シーン5きっかけ', '照明シーン5色', '照明シーン5強度', 'ステータス']}
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                    振付師情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    銀行情報
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    音響シーン1
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    音響シーン2
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    音響シーン3
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    音響シーン4
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    音響シーン5
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン1
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン2
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン3
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン4
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    照明シーン5
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
                        <div className="text-gray-500 mt-1">
                          {semifinalsInfo.work_character_story ? 
                            `${semifinalsInfo.work_character_story.slice(0, 50)}${semifinalsInfo.work_character_story.length > 50 ? '...' : ''}` 
                            : '未入力'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">{semifinalsInfo.music_title || '未入力'}</div>
                        <div className="text-gray-500">{semifinalsInfo.artist || ''}</div>
                        <div className="text-gray-500">
                          {semifinalsInfo.music_type || ''} | JASRAC: {semifinalsInfo.jasrac_code || '未入力'}
                        </div>
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
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.sound_scene1_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.sound_scene1_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.sound_scene1_cue || '未入力'}</div>
                        <div className="text-gray-500">音量: {semifinalsInfo.sound_scene1_volume || '未入力'}</div>
                        <div className="text-gray-500">効果: {semifinalsInfo.sound_scene1_effect || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.sound_scene2_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.sound_scene2_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.sound_scene2_cue || '未入力'}</div>
                        <div className="text-gray-500">音量: {semifinalsInfo.sound_scene2_volume || '未入力'}</div>
                        <div className="text-gray-500">効果: {semifinalsInfo.sound_scene2_effect || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.sound_scene3_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.sound_scene3_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.sound_scene3_cue || '未入力'}</div>
                        <div className="text-gray-500">音量: {semifinalsInfo.sound_scene3_volume || '未入力'}</div>
                        <div className="text-gray-500">効果: {semifinalsInfo.sound_scene3_effect || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.sound_scene4_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.sound_scene4_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.sound_scene4_cue || '未入力'}</div>
                        <div className="text-gray-500">音量: {semifinalsInfo.sound_scene4_volume || '未入力'}</div>
                        <div className="text-gray-500">効果: {semifinalsInfo.sound_scene4_effect || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.sound_scene5_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.sound_scene5_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.sound_scene5_cue || '未入力'}</div>
                        <div className="text-gray-500">音量: {semifinalsInfo.sound_scene5_volume || '未入力'}</div>
                        <div className="text-gray-500">効果: {semifinalsInfo.sound_scene5_effect || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.lighting_scene1_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.lighting_scene1_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.lighting_scene1_cue || '未入力'}</div>
                        <div className="text-gray-500">色: {semifinalsInfo.lighting_scene1_color || '未入力'}</div>
                        <div className="text-gray-500">強度: {semifinalsInfo.lighting_scene1_intensity || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.lighting_scene2_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.lighting_scene2_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.lighting_scene2_cue || '未入力'}</div>
                        <div className="text-gray-500">色: {semifinalsInfo.lighting_scene2_color || '未入力'}</div>
                        <div className="text-gray-500">強度: {semifinalsInfo.lighting_scene2_intensity || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.lighting_scene3_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.lighting_scene3_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.lighting_scene3_cue || '未入力'}</div>
                        <div className="text-gray-500">色: {semifinalsInfo.lighting_scene3_color || '未入力'}</div>
                        <div className="text-gray-500">強度: {semifinalsInfo.lighting_scene3_intensity || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.lighting_scene4_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.lighting_scene4_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.lighting_scene4_cue || '未入力'}</div>
                        <div className="text-gray-500">色: {semifinalsInfo.lighting_scene4_color || '未入力'}</div>
                        <div className="text-gray-500">強度: {semifinalsInfo.lighting_scene4_intensity || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="font-medium">指示: {semifinalsInfo.lighting_scene5_instruction || '未入力'}</div>
                        <div className="text-gray-500">時間: {semifinalsInfo.lighting_scene5_time || '未入力'}</div>
                        <div className="text-gray-500">きっかけ: {semifinalsInfo.lighting_scene5_cue || '未入力'}</div>
                        <div className="text-gray-500">色: {semifinalsInfo.lighting_scene5_color || '未入力'}</div>
                        <div className="text-gray-500">強度: {semifinalsInfo.lighting_scene5_intensity || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="text-gray-500">作成日: {semifinalsInfo.created_at ? new Date(semifinalsInfo.created_at).toLocaleDateString('ja-JP') : '不明'}</div>
                        <div className="text-gray-500">更新日: {semifinalsInfo.updated_at ? new Date(semifinalsInfo.updated_at).toLocaleDateString('ja-JP') : '不明'}</div>
                        <div className="text-gray-500">エントリーID: {semifinalsInfo.entry_id}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.purpose && file.purpose.includes('semifinals')
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
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { purpose?: string }) => file.purpose && file.purpose.includes('semifinals'))) && (
                          <span className="text-xs text-gray-400">ファイルなし</span>
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