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

  // 基本情報を取得（ダンスジャンル用）
  const { data: basicInfoList, error: basicInfoError } = await adminSupabase
    .from('basic_info')
    .select('*')

  console.log('[SEMIFINALS DEBUG] 基本情報取得完了')
  console.log('[SEMIFINALS DEBUG] 基本情報件数:', basicInfoList?.length || 0)
  console.log('[SEMIFINALS DEBUG] 基本情報エラー:', basicInfoError)

  // データをマッピング（選考通過のみ表示）
  const mappedSemifinalsInfoList = semifinalsInfoList?.map(semifinalsInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === semifinalsInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === semifinalsInfo.entry_id)
    const relatedBasicInfo = basicInfoList?.find(basicInfo => basicInfo.entry_id === semifinalsInfo.entry_id)
    
    console.log(`[SEMIFINALS DEBUG] エントリーID ${semifinalsInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0,
      status: relatedEntry?.status
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
      entry_files: relatedFiles || [],
      basic_info: relatedBasicInfo || null
    }
  }).filter(item => item.entries?.status === 'selected') || []

  console.log('[SEMIFINALS DEBUG] マッピング完了')
  console.log('[SEMIFINALS DEBUG] マッピング後データ件数:', mappedSemifinalsInfoList?.length || 0)
  console.log('[SEMIFINALS DEBUG] マッピング後データ:', JSON.stringify(mappedSemifinalsInfoList, null, 2))

  // コード値を名称に変換する関数
  const getMusicRightsLabel = (code: string) => {
    switch (code) {
      case 'commercial': return 'A.市販の楽曲を使用する'
      case 'licensed': return 'B.自身で著作権に対し許諾を取った楽曲を使用する'
      case 'original': return 'C.独自に製作されたオリジナル楽曲を使用する'
      default: return code || '未入力'
    }
  }

  const getMusicTypeLabel = (code: string) => {
    switch (code) {
      case 'cd': return 'CD楽曲'
      case 'download': return 'データダウンロード楽曲'
      case 'other': return 'その他（オリジナル曲）'
      default: return code || '未入力'
    }
  }

  const getChaserDesignationLabel = (code: string) => {
    switch (code) {
      case 'required': return '必要'
      case 'not_required': return '不要'
      case 'included': return '自作曲に組み込み'
      default: return code || '未入力'
    }
  }

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
              item.entries?.users?.name || '不明なユーザー',
              item.basic_info?.dance_style || '未入力',
              // 作品情報
              item.music_change_from_preliminary ? 'あり' : 'なし',
              item.work_title || '未入力',
              item.work_title_kana || '未入力',
              item.work_character_story || '未入力',
              // 楽曲著作関連情報
              getMusicRightsLabel(item.copyright_permission || ''),
              item.music_title || '未入力',
              item.cd_title || '未入力',
              item.artist || '未入力',
              item.record_number || '未入力',
              item.jasrac_code || '未入力',
              getMusicTypeLabel(item.music_type || ''),
              // 楽曲データ添付
              item.entry_files?.filter((file: { file_type: string; purpose?: string; file_name: string }) => (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('music_data')).map((file: { file_name: string }) => file.file_name).join(', ') || 'なし',
              // 音響情報
              item.sound_start_timing || '未入力',
              getChaserDesignationLabel(item.chaser_song_designation || ''),
              item.fade_out_start_time || '未入力',
              item.fade_out_complete_time || '未入力',
              // チェイサー（退場）曲音源
              item.entry_files?.filter((file: { file_type: string; purpose?: string; file_name: string }) => file.file_type === 'audio' && file.purpose === 'chaser_song').map((file: { file_name: string }) => file.file_name).join(', ') || 'なし',
              // 踊り出し
              item.dance_start_timing || '未入力',
              // 照明シーン1
              `時間:${item.scene1_time || '未入力'} きっかけ:${item.scene1_trigger || '未入力'} 色:${item.scene1_color_type || '未入力'} イメージ:${item.scene1_image || '未入力'} 備考:${item.scene1_notes || '未入力'}`,
              // 照明シーン1イメージ画像
              item.entry_files?.filter((file: { file_type: string; purpose?: string; file_name: string }) => file.file_type === 'photo' && file.purpose && file.purpose.includes('scene1_image')).map((file: { file_name: string }) => file.file_name).join(', ') || 'なし',
              // 照明シーン2
              `時間:${item.scene2_time || '未入力'} きっかけ:${item.scene2_trigger || '未入力'} 色:${item.scene2_color_type || '未入力'} イメージ:${item.scene2_image || '未入力'} 備考:${item.scene2_notes || '未入力'}`,
              // 照明シーン2イメージ画像
              item.entry_files?.filter((file: { file_type: string; purpose?: string; file_name: string }) => file.file_type === 'photo' && file.purpose && file.purpose.includes('scene2_image')).map((file: { file_name: string }) => file.file_name).join(', ') || 'なし',
              // 照明シーン3
              `時間:${item.scene3_time || '未入力'} きっかけ:${item.scene3_trigger || '未入力'} 色:${item.scene3_color_type || '未入力'} イメージ:${item.scene3_image || '未入力'} 備考:${item.scene3_notes || '未入力'}`,
              // 照明シーン3イメージ画像
              item.entry_files?.filter((file: { file_type: string; purpose?: string; file_name: string }) => file.file_type === 'photo' && file.purpose && file.purpose.includes('scene3_image')).map((file: { file_name: string }) => file.file_name).join(', ') || 'なし',
              // 照明シーン4
              `時間:${item.scene4_time || '未入力'} きっかけ:${item.scene4_trigger || '未入力'} 色:${item.scene4_color_type || '未入力'} イメージ:${item.scene4_image || '未入力'} 備考:${item.scene4_notes || '未入力'}`,
              // 照明シーン4イメージ画像
              item.entry_files?.filter((file: { file_type: string; purpose?: string; file_name: string }) => file.file_type === 'photo' && file.purpose && file.purpose.includes('scene4_image')).map((file: { file_name: string }) => file.file_name).join(', ') || 'なし',
              // 照明シーン5
              `時間:${item.scene5_time || '未入力'} きっかけ:${item.scene5_trigger || '未入力'} 色:${item.scene5_color_type || '未入力'} イメージ:${item.scene5_image || '未入力'} 備考:${item.scene5_notes || '未入力'}`,
              // 照明シーン5イメージ画像
              item.entry_files?.filter((file: { file_type: string; purpose?: string; file_name: string }) => file.file_type === 'photo' && file.purpose && file.purpose.includes('scene5_image')).map((file: { file_name: string }) => file.file_name).join(', ') || 'なし',
              // 照明シーン チェイサー
              `時間:${item.chaser_exit_time || '未入力'} きっかけ:${item.chaser_exit_trigger || '未入力'} 色:${item.chaser_exit_color_type || '未入力'} その他:${item.chaser_exit_color_other || '未入力'} イメージ:${item.chaser_exit_image || '未入力'} 備考:${item.chaser_exit_notes || '未入力'}`,
              // 照明シーン チェイサーイメージ画像
              item.entry_files?.filter((file: { file_type: string; purpose?: string; file_name: string }) => file.file_type === 'photo' && file.purpose && file.purpose.includes('chaser_exit_image')).map((file: { file_name: string }) => file.file_name).join(', ') || 'なし',
              // 振付師情報
              `①${item.choreographer_name || '未入力'} (${item.choreographer_furigana || '未入力'}) ②${item.choreographer2_name || '未入力'} (${item.choreographer2_furigana || '未入力'})`,
              // 小道具情報
              `有無:${item.props_usage || '未入力'} 詳細:${item.props_details || '未入力'}`,
              // 振込確認
              item.entry_files?.filter((file: { file_type: string; purpose?: string; file_name: string }) => 
                file.purpose === 'semifinals_payment_slip'
              ).map((file: { file_name: string }) => file.file_name).join(', ') || 'なし',
              // 賞金振込先情報
              `${item.bank_name || '未入力'} ${item.branch_name || '未入力'} ${item.account_type || '未入力'} ${item.account_number || '未入力'} ${item.account_holder || '未入力'}`,
              // 選考ステータス
              item.entries?.status === 'pending' ? '審査待ち' :
              item.entries?.status === 'submitted' ? '提出済み' :
              item.entries?.status === 'selected' ? '選考通過' :
              item.entries?.status === 'rejected' ? '不選考' : '不明'
            ])}
            headers={[
              '1. システム利用者名',
              '2. ダンスジャンル',
              '3. 作品情報 - 予選との楽曲変更',
              '3. 作品情報 - 作品タイトル',
              '3. 作品情報 - 作品タイトル(ふりがな)',
              '3. 作品情報 - 作品キャラクター・ストーリー等',
              '4. 楽曲著作関連情報 - 楽曲著作権許諾',
              '4. 楽曲著作関連情報 - 使用楽曲タイトル',
              '4. 楽曲著作関連情報 - 収録CDタイトル',
              '4. 楽曲著作関連情報 - アーティスト',
              '4. 楽曲著作関連情報 - レコード番号',
              '4. 楽曲著作関連情報 - JASRAC作品コード',
              '4. 楽曲著作関連情報 - 楽曲種類',
              '5. 楽曲データ添付',
              '6. 音響情報 - 音楽スタートのタイミング',
              '6. 音響情報 - チェイサー曲の指定',
              '6. 音響情報 - フェードアウト開始時間',
              '6. 音響情報 - フェードアウト完了時間',
              '7. チェイサー（退場）曲音源',
              '8. 踊り出し - 準決勝 踊り出しタイミング',
              '9. 照明シーン1',
              '10. 照明シーン1イメージ画像',
              '11. 照明シーン2',
              '12. 照明シーン2イメージ画像',
              '13. 照明シーン3',
              '14. 照明シーン3イメージ画像',
              '15. 照明シーン4',
              '16. 照明シーン4イメージ画像',
              '17. 照明シーン5',
              '18. 照明シーン5イメージ画像',
              '19. 照明シーン チェイサー',
              '20. 照明シーン チェイサーイメージ画像',
              '21. 振付師情報',
              '22. 小道具情報',
              '23. 振込確認',
              '24. 賞金振込先情報',
              '25. 選考ステータス'
            ]}
            filename="semifinals_info_25columns"
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
            <table className="divide-y divide-gray-200" style={{minWidth: '4200px', width: 'max-content'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    1. システム利用者名
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    2. ダンスジャンル
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-60">
                    3. 作品情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-72">
                    4. 楽曲著作関連情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    5. 楽曲データ添付
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    6. 音響情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    7. チェイサー（退場）曲音源
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    8. 踊り出し
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    9. 照明シーン1
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    10. 照明シーン1イメージ画像
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    11. 照明シーン2
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    12. 照明シーン2イメージ画像
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    13. 照明シーン3
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    14. 照明シーン3イメージ画像
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    15. 照明シーン4
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    16. 照明シーン4イメージ画像
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    17. 照明シーン5
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    18. 照明シーン5イメージ画像
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    19. 照明シーン チェイサー
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    20. 照明シーン チェイサーイメージ画像
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    21. 振付師情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-36">
                    22. 小道具情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    23. 振込確認
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    24. 賞金振込先情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    25. 選考ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedSemifinalsInfoList.map((semifinalsInfo) => (
                  <tr key={semifinalsInfo.id} className="hover:bg-gray-50">
                    {/* 1. システム利用者名 */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {semifinalsInfo.entries?.users?.name || '不明なユーザー'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {semifinalsInfo.entries?.participant_names || 'エントリー名なし'}
                      </div>
                    </td>
                    
                    {/* 2. ダンスジャンル */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {semifinalsInfo.basic_info?.dance_style || '未入力'}
                      </div>
                    </td>
                    
                    {/* 2. 作品情報 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>予選との楽曲変更:</strong> {semifinalsInfo.music_change_from_preliminary ? 'あり' : 'なし'}</div>
                        <div className="mb-1"><strong>作品タイトル:</strong> {semifinalsInfo.work_title || '未入力'}</div>
                        <div className="mb-1"><strong>タイトル(ふりがな):</strong> {semifinalsInfo.work_title_kana || '未入力'}</div>
                        <div className="mb-1">
                          <strong>キャラクター・ストーリー:</strong><br/>
                          <span className="text-gray-500">
                            {semifinalsInfo.work_character_story ? 
                              `${semifinalsInfo.work_character_story.slice(0, 80)}${semifinalsInfo.work_character_story.length > 80 ? '...' : ''}` 
                              : '未入力'}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* 3. 楽曲著作関連情報 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>楽曲著作権許諾:</strong> {getMusicRightsLabel(semifinalsInfo.copyright_permission || '')}</div>
                        <div className="mb-1"><strong>使用楽曲タイトル:</strong> {semifinalsInfo.music_title || '未入力'}</div>
                        <div className="mb-1"><strong>収録CDタイトル:</strong> {semifinalsInfo.cd_title || '未入力'}</div>
                        <div className="mb-1"><strong>アーティスト:</strong> {semifinalsInfo.artist || '未入力'}</div>
                        <div className="mb-1"><strong>レコード番号:</strong> {semifinalsInfo.record_number || '未入力'}</div>
                        <div className="mb-1"><strong>JASRAC作品コード:</strong> {semifinalsInfo.jasrac_code || '未入力'}</div>
                        <div><strong>楽曲種類:</strong> {getMusicTypeLabel(semifinalsInfo.music_type || '')}</div>
                      </div>
                    </td>
                    
                    {/* 4. 楽曲データ添付 */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('music_data')
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
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('music_data')
                        )) && (
                          <span className="text-xs text-gray-400">楽曲データなし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 5. 音響情報 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>音楽スタートのタイミング:</strong> {semifinalsInfo.sound_start_timing || '未入力'}</div>
                        <div className="mb-1"><strong>チェイサー曲の指定:</strong> {getChaserDesignationLabel(semifinalsInfo.chaser_song_designation || '')}</div>
                        <div className="mb-1"><strong>フェードアウト開始時間:</strong> {semifinalsInfo.fade_out_start_time || '未入力'}</div>
                        <div><strong>フェードアウト完了時間:</strong> {semifinalsInfo.fade_out_complete_time || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 6. チェイサー（退場）曲音源 */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'audio' && file.purpose === 'chaser_song'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                              download
                            >
                              🔊 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'audio' && file.purpose === 'chaser_song'
                        )) && (
                          <span className="text-xs text-gray-400">チェイサー音源なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 7. 踊り出し */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <strong>準決勝 踊り出しタイミング:</strong><br/>
                        {semifinalsInfo.dance_start_timing || '未入力'}
                      </div>
                    </td>
                    
                    {/* 8. 照明シーン1 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>時間:</strong> {semifinalsInfo.scene1_time || '未入力'}</div>
                        <div className="mb-1"><strong>きっかけ:</strong> {semifinalsInfo.scene1_trigger || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統:</strong> {semifinalsInfo.scene1_color_type || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統その他:</strong> {semifinalsInfo.scene1_color_other || '未入力'}</div>
                        <div className="mb-1"><strong>イメージ:</strong> {semifinalsInfo.scene1_image || '未入力'}</div>
                        <div><strong>備考:</strong> {semifinalsInfo.scene1_notes || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 9. 照明シーン1イメージ画像 */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene1_image')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene1_image')
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 10. 照明シーン2 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>時間:</strong> {semifinalsInfo.scene2_time || '未入力'}</div>
                        <div className="mb-1"><strong>きっかけ:</strong> {semifinalsInfo.scene2_trigger || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統:</strong> {semifinalsInfo.scene2_color_type || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統その他:</strong> {semifinalsInfo.scene2_color_other || '未入力'}</div>
                        <div className="mb-1"><strong>イメージ:</strong> {semifinalsInfo.scene2_image || '未入力'}</div>
                        <div><strong>備考:</strong> {semifinalsInfo.scene2_notes || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 11. 照明シーン2イメージ画像 */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene2_image')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene2_image')
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 12. 照明シーン3 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>時間:</strong> {semifinalsInfo.scene3_time || '未入力'}</div>
                        <div className="mb-1"><strong>きっかけ:</strong> {semifinalsInfo.scene3_trigger || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統:</strong> {semifinalsInfo.scene3_color_type || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統その他:</strong> {semifinalsInfo.scene3_color_other || '未入力'}</div>
                        <div className="mb-1"><strong>イメージ:</strong> {semifinalsInfo.scene3_image || '未入力'}</div>
                        <div><strong>備考:</strong> {semifinalsInfo.scene3_notes || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 13. 照明シーン3イメージ画像 */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene3_image')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene3_image')
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 14. 照明シーン4 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>時間:</strong> {semifinalsInfo.scene4_time || '未入力'}</div>
                        <div className="mb-1"><strong>きっかけ:</strong> {semifinalsInfo.scene4_trigger || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統:</strong> {semifinalsInfo.scene4_color_type || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統その他:</strong> {semifinalsInfo.scene4_color_other || '未入力'}</div>
                        <div className="mb-1"><strong>イメージ:</strong> {semifinalsInfo.scene4_image || '未入力'}</div>
                        <div><strong>備考:</strong> {semifinalsInfo.scene4_notes || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 15. 照明シーン4イメージ画像 */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene4_image')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene4_image')
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 16. 照明シーン5 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>時間:</strong> {semifinalsInfo.scene5_time || '未入力'}</div>
                        <div className="mb-1"><strong>きっかけ:</strong> {semifinalsInfo.scene5_trigger || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統:</strong> {semifinalsInfo.scene5_color_type || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統その他:</strong> {semifinalsInfo.scene5_color_other || '未入力'}</div>
                        <div className="mb-1"><strong>イメージ:</strong> {semifinalsInfo.scene5_image || '未入力'}</div>
                        <div><strong>備考:</strong> {semifinalsInfo.scene5_notes || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 17. 照明シーン5イメージ画像 */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene5_image')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene5_image')
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 18. 照明シーン チェイサー */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>時間:</strong> {semifinalsInfo.chaser_exit_time || '未入力'}</div>
                        <div className="mb-1"><strong>きっかけ:</strong> {semifinalsInfo.chaser_exit_trigger || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統:</strong> {semifinalsInfo.chaser_exit_color_type || '未入力'}</div>
                        <div className="mb-1"><strong>色・系統その他:</strong> {semifinalsInfo.chaser_exit_color_other || '未入力'}</div>
                        <div className="mb-1"><strong>イメージ:</strong> {semifinalsInfo.chaser_exit_image || '未入力'}</div>
                        <div><strong>備考:</strong> {semifinalsInfo.chaser_exit_notes || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 19. 照明シーン チェイサーイメージ画像 */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('chaser_exit_image')
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
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('chaser_exit_image')
                        )) && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 20. 振付師情報 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>振付師氏名①:</strong> {semifinalsInfo.choreographer_name || '未入力'}</div>
                        <div className="mb-1"><strong>振付師氏名フリガナ①:</strong> {semifinalsInfo.choreographer_furigana || '未入力'}</div>
                        <div className="mb-1"><strong>振付師氏名②:</strong> {semifinalsInfo.choreographer2_name || '未入力'}</div>
                        <div><strong>振付師氏名フリガナ②:</strong> {semifinalsInfo.choreographer2_furigana || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 21. 小道具情報 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>小道具の有無:</strong> {semifinalsInfo.props_usage || '未入力'}</div>
                        <div><strong>利用する小道具:</strong><br/>{semifinalsInfo.props_details || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 22. 振込確認 */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(semifinalsInfo.entry_files) && semifinalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.purpose === 'semifinals_payment_slip'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              {file.file_type === 'pdf' ? '📄' : '🖼️'} {file.file_name}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(semifinalsInfo.entry_files) || !semifinalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.purpose === 'semifinals_payment_slip'
                        )) && (
                          <span className="text-xs text-gray-400">振込確認書なし</span>
                        )}
                      </div>
                    </td>
                    
                    {/* 23. 賞金振込先情報 */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        <div className="mb-1"><strong>銀行名:</strong> {semifinalsInfo.bank_name || '未入力'}</div>
                        <div className="mb-1"><strong>支店名:</strong> {semifinalsInfo.branch_name || '未入力'}</div>
                        <div className="mb-1"><strong>口座種類:</strong> {semifinalsInfo.account_type || '未入力'}</div>
                        <div className="mb-1"><strong>口座番号:</strong> {semifinalsInfo.account_number || '未入力'}</div>
                        <div><strong>口座名義:</strong> {semifinalsInfo.account_holder || '未入力'}</div>
                      </div>
                    </td>
                    
                    {/* 24. 選考ステータス */}
                    <td className="px-3 py-3 whitespace-nowrap">
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