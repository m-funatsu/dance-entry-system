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

  // 基本情報を取得（ダンスジャンル用）
  const { data: basicInfoList, error: basicInfoError } = await adminSupabase
    .from('basic_info')
    .select('*')

  console.log('[FINALS DEBUG] 基本情報取得完了')
  console.log('[FINALS DEBUG] 基本情報件数:', basicInfoList?.length || 0)
  console.log('[FINALS DEBUG] 基本情報エラー:', basicInfoError)

  // 署名付きURLを生成する関数
  const generateSignedUrl = async (path: string | null | undefined) => {
    if (!path) return null
    
    // すでにURLの場合はそのまま返す
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    
    try {
      const { data } = await adminSupabase.storage
        .from('files')
        .createSignedUrl(path, 3600) // 1時間有効
      return data?.signedUrl || null
    } catch (error) {
      console.error('Error generating signed URL:', error)
      return null
    }
  }

  // データをマッピング（選考通過のみ表示）
  const mappedFinalsInfoListRaw = await Promise.all(finalsInfoList?.map(async finalsInfo => {
    const relatedEntry = entriesList?.find(entry => entry.id === finalsInfo.entry_id)
    const relatedUser = usersList?.find(user => user.id === relatedEntry?.user_id)
    const relatedFiles = filesList?.filter(file => file.entry_id === finalsInfo.entry_id)
    const relatedBasicInfo = basicInfoList?.find(basicInfo => basicInfo.entry_id === finalsInfo.entry_id)
    
    // 関連ファイルの署名付きURLを生成
    const filesWithUrls = await Promise.all(relatedFiles?.map(async (file) => ({
      ...file,
      signed_url: await generateSignedUrl(file.file_path)
    })) || [])

    // finals_info内のファイルパスも署名付きURLに変換
    const finalsFileUrls = {
      music_data_path: await generateSignedUrl(finalsInfo.music_data_path),
      chaser_song: await generateSignedUrl(finalsInfo.chaser_song),
      scene1_image_path: await generateSignedUrl(finalsInfo.scene1_image_path),
      scene2_image_path: await generateSignedUrl(finalsInfo.scene2_image_path),
      scene3_image_path: await generateSignedUrl(finalsInfo.scene3_image_path),
      scene4_image_path: await generateSignedUrl(finalsInfo.scene4_image_path),
      scene5_image_path: await generateSignedUrl(finalsInfo.scene5_image_path),
      chaser_exit_image_path: await generateSignedUrl(finalsInfo.chaser_exit_image_path),
      choreographer_photo_path: await generateSignedUrl(finalsInfo.choreographer_photo_path)
    }
    
    console.log(`[FINALS DEBUG] エントリーID ${finalsInfo.entry_id}:`, {
      hasEntry: !!relatedEntry,
      hasUser: !!relatedUser,
      fileCount: relatedFiles?.length || 0,
      status: relatedEntry?.status
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
      entry_files: filesWithUrls,
      basic_info: relatedBasicInfo || null,
      file_urls: finalsFileUrls
    }
  }) || [])

  const mappedFinalsInfoList = mappedFinalsInfoListRaw
    .filter(item => item.entries?.status === 'selected')
    // ダンスジャンルでソート
    .sort((a, b) => {
      const genreA = a.basic_info?.dance_style || 'ZZZ' // 未設定は最後に
      const genreB = b.basic_info?.dance_style || 'ZZZ'
      return genreA.localeCompare(genreB, 'ja')
    }) || []

  console.log('[FINALS DEBUG] マッピング完了')
  console.log('[FINALS DEBUG] マッピング後データ件数:', mappedFinalsInfoList?.length || 0)

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

  const getChaserSongLabel = (code: string) => {
    switch (code) {
      case 'required': return '必要'
      case 'not_required': return '不要（無音）'
      case 'included': return '自作曲に組み込み'
      default: return code || '未入力'
    }
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
              // 基本項目
              item.entries?.users?.name || '不明なユーザー',
              item.basic_info?.dance_style || '未入力',
              // 作品情報
              item.music_change ? 'あり' : 'なし',
              item.work_title || '',
              item.work_title_kana || '',
              item.work_character_story || '',
              // 楽曲著作関連情報
              getMusicRightsLabel(item.copyright_permission || ''),
              item.music_title || '',
              item.cd_title || '',
              item.artist || '',
              item.record_number || '',
              item.jasrac_code || '',
              getMusicTypeLabel(item.music_type || ''),
              // 音響情報
              item.sound_change_from_semifinals ? 'あり' : 'なし',
              item.sound_start_timing || '',
              getChaserSongLabel(item.chaser_song_designation || ''),
              item.fade_out_start_time || '',
              item.fade_out_complete_time || '',
              // 照明情報
              item.lighting_change_from_semifinals ? 'あり' : 'なし',
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
              // 照明シーン4
              item.scene4_time || '',
              item.scene4_trigger || '',
              item.scene4_color_type || '',
              item.scene4_color_other || '',
              item.scene4_image || '',
              item.scene4_notes || '',
              // 照明シーン5
              item.scene5_time || '',
              item.scene5_trigger || '',
              item.scene5_color_type || '',
              item.scene5_color_other || '',
              item.scene5_image || '',
              item.scene5_notes || '',
              // チェイサー/退場
              item.chaser_exit_time || '',
              item.chaser_exit_trigger || '',
              item.chaser_exit_color_type || '',
              item.chaser_exit_color_other || '',
              item.chaser_exit_image || '',
              item.chaser_exit_notes || '',
              // 振付師情報
              item.choreographer_change ? 'あり' : 'なし',
              item.choreographer_name || '',
              item.choreographer_furigana || '',
              item.choreographer2_name || '',
              item.choreographer2_furigana || '',
              item.props_usage || '',
              item.props_details || '',
              // 振付変更情報
              item.choreography_change_timing || '',
              item.choreography_before_change || '',
              item.choreography_after_change || '',
              // 作品振付師出席情報
              item.choreographer_attendance || '',
              item.choreographer_photo_permission || ''
            ])}
            headers={[
              '1. システム利用者名',
              '2. ダンスジャンル',
              '3. 作品情報 - 楽曲情報の変更',
              '4. 作品情報 - 作品タイトル',
              '5. 作品情報 - 作品タイトル(ふりがな)',
              '6. 作品情報 - 作品キャラクター・ストーリー等',
              '7. 楽曲著作関連情報 - 楽曲著作権許諾',
              '8. 楽曲著作関連情報 - 使用楽曲タイトル',
              '9. 楽曲著作関連情報 - 収録CDタイトル',
              '10. 楽曲著作関連情報 - アーティスト',
              '11. 楽曲著作関連情報 - レコード番号',
              '12. 楽曲著作関連情報 - JASRAC作品コード',
              '13. 楽曲著作関連情報 - 楽曲種類',
              '14. 音響情報 - 準決勝との音響指示変更の有無',
              '15. 音響情報 - 音楽スタートのタイミング',
              '16. 音響情報 - チェイサー（退場）曲の指定',
              '17. 音響情報 - フェードアウト開始時',
              '18. 音響情報 - フェードアウト完了時間',
              '19. 照明情報 - 準決勝との照明指示変更の有無',
              '20. 照明情報 - 決勝-踊り出しタイミング',
              '21. 照明情報 - シーン1 時間',
              '22. 照明情報 - シーン1 きっかけ',
              '23. 照明情報 - シーン1 色・系統',
              '24. 照明情報 - シーン1 色・系統その他',
              '25. 照明情報 - シーン1 イメージ',
              '26. 照明情報 - シーン1 備考',
              '27. 照明情報 - シーン2 時間',
              '28. 照明情報 - シーン2 きっかけ',
              '29. 照明情報 - シーン2 色・系統',
              '30. 照明情報 - シーン2 色・系統その他',
              '31. 照明情報 - シーン2 イメージ',
              '32. 照明情報 - シーン2 備考',
              '33. 照明情報 - シーン3 時間',
              '34. 照明情報 - シーン3 きっかけ',
              '35. 照明情報 - シーン3 色・系統',
              '36. 照明情報 - シーン3 色・系統その他',
              '37. 照明情報 - シーン3 イメージ',
              '38. 照明情報 - シーン3 備考',
              '39. 照明情報 - シーン4 時間',
              '40. 照明情報 - シーン4 きっかけ',
              '41. 照明情報 - シーン4 色・系統',
              '42. 照明情報 - シーン4 色・系統その他',
              '43. 照明情報 - シーン4 イメージ',
              '44. 照明情報 - シーン4 備考',
              '45. 照明情報 - シーン5 時間',
              '46. 照明情報 - シーン5 きっかけ',
              '47. 照明情報 - シーン5 色・系統',
              '48. 照明情報 - シーン5 色・系統その他',
              '49. 照明情報 - シーン5 イメージ',
              '50. 照明情報 - シーン5 備考',
              '51. 照明情報 - チェイサー/退場 時間',
              '52. 照明情報 - チェイサー/退場 きっかけ',
              '53. 照明情報 - チェイサー/退場 色・系統',
              '54. 照明情報 - チェイサー/退場 色・系統その他',
              '55. 照明情報 - チェイサー/退場 イメージ',
              '56. 照明情報 - チェイサー/退場 備考',
              '57. 振付師・振付変更情報 - 振付師の変更',
              '58. 振付師・振付変更情報 - 振付師 氏名①',
              '59. 振付師・振付変更情報 - 振付師 氏名フリガナ①',
              '60. 振付師・振付変更情報 - 振付師 氏名②',
              '61. 振付師・振付変更情報 - 振付師 氏名フリガナ②',
              '62. 振付師・振付変更情報 - 小道具の有無',
              '63. 振付師・振付変更情報 - 利用する小道具',
              '64. 振付師・振付変更情報 - 振付変更部分（曲が始まってから何分何秒の部分か）',
              '65. 振付師・振付変更情報 - 変更前（準決勝振付）',
              '66. 振付師・振付変更情報 - 変更後（決勝振付）',
              '67. 振付師・振付変更情報 - 作品振付師出席予定',
              '68. 振付師・振付変更情報 - 作品振付師写真掲載'
            ]}
            filename="finals_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">決勝情報一覧</h1>
        <p className="text-gray-600">エントリーの決勝情報をまとめて確認できます（{mappedFinalsInfoList?.length || 0}件）</p>
        <p className="text-sm text-blue-600 mt-2">💡 横にスクロールして全ての項目をご確認ください</p>
      </div>

      {mappedFinalsInfoList && mappedFinalsInfoList.length > 0 ? (
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
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    8. 照明情報
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
                    21. 振付変更情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    22. 振付師情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    23. 小道具情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    24. 作品振付師出席情報
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">
                    25. 振付師写真
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedFinalsInfoList.map((finalsInfo) => (
                  <tr key={finalsInfo.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                      <div className="font-medium">{finalsInfo.entries?.users?.name || '不明なユーザー'}</div>
                      <div className="text-gray-500">{finalsInfo.entries?.participant_names || 'エントリー名なし'}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                      <div className="font-medium">{finalsInfo.basic_info?.dance_style || '未入力'}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '240px'}}>
                      <div className="space-y-1 text-xs">
                        <div><strong>準決勝からの変更:</strong> {finalsInfo.music_change ? 'あり' : 'なし'}</div>
                        <div><strong>タイトル:</strong> {finalsInfo.work_title || '未入力'}</div>
                        <div><strong>ふりがな:</strong> {finalsInfo.work_title_kana || '未入力'}</div>
                        <div><strong>ストーリー:</strong> {finalsInfo.work_character_story ? `${finalsInfo.work_character_story.slice(0, 30)}...` : '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '280px'}}>
                      <div className="space-y-1 text-xs">
                        <div><strong>楽曲著作権許諾:</strong> {getMusicRightsLabel(finalsInfo.copyright_permission || '')}</div>
                        <div><strong>使用楽曲タイトル:</strong> {finalsInfo.music_title || '未入力'}</div>
                        <div><strong>収録CDタイトル:</strong> {finalsInfo.cd_title || '未入力'}</div>
                        <div><strong>アーティスト:</strong> {finalsInfo.artist || '未入力'}</div>
                        <div><strong>レコード番号:</strong> {finalsInfo.record_number || '未入力'}</div>
                        <div><strong>JASRAC作品コード:</strong> {finalsInfo.jasrac_code || '未入力'}</div>
                        <div><strong>楽曲種類:</strong> {getMusicTypeLabel(finalsInfo.music_type || '')}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'finals_music_data_path'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => (
                          <div key={file.id}>
                            <a
                              href={file.signed_url || finalsInfo.file_urls?.music_data_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🎵 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {finalsInfo.file_urls?.music_data_path && (!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'finals_music_data_path'
                        )) && (
                          <div>
                            <a
                              href={finalsInfo.file_urls.music_data_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🎵 決勝楽曲データ
                            </a>
                          </div>
                        )}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'finals_music_data_path'
                        )) && !finalsInfo.file_urls?.music_data_path && (
                          <span className="text-xs text-gray-400">楽曲データなし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="space-y-1 text-xs">
                        <div><strong>準決勝からの変更:</strong> {finalsInfo.sound_change_from_semifinals ? 'あり' : 'なし'}</div>
                        <div><strong>音楽スタートのタイミング:</strong> {finalsInfo.sound_start_timing || '未入力'}</div>
                        <div><strong>チェイサー曲の指定:</strong> {getChaserSongLabel(finalsInfo.chaser_song_designation || '')}</div>
                        <div><strong>フェードアウト開始時間:</strong> {finalsInfo.fade_out_start_time || '未入力'}</div>
                        <div><strong>フェードアウト完了時間:</strong> {finalsInfo.fade_out_complete_time || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'finals_chaser_song'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => (
                          <div key={file.id}>
                            <a
                              href={file.signed_url || finalsInfo.file_urls?.chaser_song}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🔊 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {finalsInfo.file_urls?.chaser_song && (!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'finals_chaser_song'
                        )) && (
                          <div>
                            <a
                              href={finalsInfo.file_urls.chaser_song}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🔊 チェイサー曲
                            </a>
                          </div>
                        )}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose === 'finals_chaser_song'
                        )) && !finalsInfo.file_urls?.chaser_song && (
                          <span className="text-xs text-gray-400">チェイサー音源なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="space-y-1 text-xs">
                        <div><strong>準決勝からの変更:</strong> {finalsInfo.lighting_change_from_semifinals ? 'あり' : 'なし'}</div>
                        <div><strong>踊り出し:</strong> {finalsInfo.dance_start_timing || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="text-xs">
                        <div><strong>時間:</strong> {finalsInfo.scene1_time || '未入力'}</div>
                        <div><strong>きっかけ:</strong> {finalsInfo.scene1_trigger || '未入力'}</div>
                        <div><strong>色・系統:</strong> {finalsInfo.scene1_color_type || '未入力'}</div>
                        <div><strong>その他:</strong> {finalsInfo.scene1_color_other || '未入力'}</div>
                        <div><strong>イメージ:</strong> {finalsInfo.scene1_image || '未入力'}</div>
                        <div><strong>備考:</strong> {finalsInfo.scene1_notes || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene1_image_path'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => (
                          <div key={file.id}>
                            <a
                              href={file.signed_url || finalsInfo.file_urls?.scene1_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {finalsInfo.file_urls?.scene1_image_path && (!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene1_image_path'
                        )) && (
                          <div>
                            <a
                              href={finalsInfo.file_urls.scene1_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ シーン1画像
                            </a>
                          </div>
                        )}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene1_image_path'
                        )) && !finalsInfo.file_urls?.scene1_image_path && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="text-xs">
                        <div><strong>時間:</strong> {finalsInfo.scene2_time || '未入力'}</div>
                        <div><strong>きっかけ:</strong> {finalsInfo.scene2_trigger || '未入力'}</div>
                        <div><strong>色・系統:</strong> {finalsInfo.scene2_color_type || '未入力'}</div>
                        <div><strong>その他:</strong> {finalsInfo.scene2_color_other || '未入力'}</div>
                        <div><strong>イメージ:</strong> {finalsInfo.scene2_image || '未入力'}</div>
                        <div><strong>備考:</strong> {finalsInfo.scene2_notes || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene2_image_path'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => (
                          <div key={file.id}>
                            <a
                              href={file.signed_url || finalsInfo.file_urls?.scene2_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {finalsInfo.file_urls?.scene2_image_path && (!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene2_image_path'
                        )) && (
                          <div>
                            <a
                              href={finalsInfo.file_urls.scene2_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ シーン2画像
                            </a>
                          </div>
                        )}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene2_image_path'
                        )) && !finalsInfo.file_urls?.scene2_image_path && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="text-xs">
                        <div><strong>時間:</strong> {finalsInfo.scene3_time || '未入力'}</div>
                        <div><strong>きっかけ:</strong> {finalsInfo.scene3_trigger || '未入力'}</div>
                        <div><strong>色・系統:</strong> {finalsInfo.scene3_color_type || '未入力'}</div>
                        <div><strong>その他:</strong> {finalsInfo.scene3_color_other || '未入力'}</div>
                        <div><strong>イメージ:</strong> {finalsInfo.scene3_image || '未入力'}</div>
                        <div><strong>備考:</strong> {finalsInfo.scene3_notes || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene3_image_path'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => (
                          <div key={file.id}>
                            <a
                              href={file.signed_url || finalsInfo.file_urls?.scene3_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {finalsInfo.file_urls?.scene3_image_path && (!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene3_image_path'
                        )) && (
                          <div>
                            <a
                              href={finalsInfo.file_urls.scene3_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ シーン3画像
                            </a>
                          </div>
                        )}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene3_image_path'
                        )) && !finalsInfo.file_urls?.scene3_image_path && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="text-xs">
                        <div><strong>時間:</strong> {finalsInfo.scene4_time || '未入力'}</div>
                        <div><strong>きっかけ:</strong> {finalsInfo.scene4_trigger || '未入力'}</div>
                        <div><strong>色・系統:</strong> {finalsInfo.scene4_color_type || '未入力'}</div>
                        <div><strong>その他:</strong> {finalsInfo.scene4_color_other || '未入力'}</div>
                        <div><strong>イメージ:</strong> {finalsInfo.scene4_image || '未入力'}</div>
                        <div><strong>備考:</strong> {finalsInfo.scene4_notes || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene4_image_path'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => (
                          <div key={file.id}>
                            <a
                              href={file.signed_url || finalsInfo.file_urls?.scene4_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {finalsInfo.file_urls?.scene4_image_path && (!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene4_image_path'
                        )) && (
                          <div>
                            <a
                              href={finalsInfo.file_urls.scene4_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ シーン4画像
                            </a>
                          </div>
                        )}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene4_image_path'
                        )) && !finalsInfo.file_urls?.scene4_image_path && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="text-xs">
                        <div><strong>時間:</strong> {finalsInfo.scene5_time || '未入力'}</div>
                        <div><strong>きっかけ:</strong> {finalsInfo.scene5_trigger || '未入力'}</div>
                        <div><strong>色・系統:</strong> {finalsInfo.scene5_color_type || '未入力'}</div>
                        <div><strong>その他:</strong> {finalsInfo.scene5_color_other || '未入力'}</div>
                        <div><strong>イメージ:</strong> {finalsInfo.scene5_image || '未入力'}</div>
                        <div><strong>備考:</strong> {finalsInfo.scene5_notes || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene5_image_path'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => (
                          <div key={file.id}>
                            <a
                              href={file.signed_url || finalsInfo.file_urls?.scene5_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {finalsInfo.file_urls?.scene5_image_path && (!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene5_image_path'
                        )) && (
                          <div>
                            <a
                              href={finalsInfo.file_urls.scene5_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ シーン5画像
                            </a>
                          </div>
                        )}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_scene5_image_path'
                        )) && !finalsInfo.file_urls?.scene5_image_path && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="text-xs">
                        <div><strong>時間:</strong> {finalsInfo.chaser_exit_time || '未入力'}</div>
                        <div><strong>きっかけ:</strong> {finalsInfo.chaser_exit_trigger || '未入力'}</div>
                        <div><strong>色・系統:</strong> {finalsInfo.chaser_exit_color_type || '未入力'}</div>
                        <div><strong>その他:</strong> {finalsInfo.chaser_exit_color_other || '未入力'}</div>
                        <div><strong>イメージ:</strong> {finalsInfo.chaser_exit_image || '未入力'}</div>
                        <div><strong>備考:</strong> {finalsInfo.chaser_exit_notes || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_chaser_exit_image_path'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => (
                          <div key={file.id}>
                            <a
                              href={file.signed_url || finalsInfo.file_urls?.chaser_exit_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ {file.file_name}
                            </a>
                          </div>
                        ))}
                        {finalsInfo.file_urls?.chaser_exit_image_path && (!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_chaser_exit_image_path'
                        )) && (
                          <div>
                            <a
                              href={finalsInfo.file_urls.chaser_exit_image_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              🖼️ チェイサー画像
                            </a>
                          </div>
                        )}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_chaser_exit_image_path'
                        )) && !finalsInfo.file_urls?.chaser_exit_image_path && (
                          <span className="text-xs text-gray-400">画像なし</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="space-y-1 text-xs">
                        <div><strong>変更時期:</strong> {finalsInfo.choreography_change_timing || '未入力'}</div>
                        <div><strong>変更前（準決勝振付）:</strong> {finalsInfo.choreography_before_change || '未入力'}</div>
                        <div><strong>変更後（決勝振付）:</strong> {finalsInfo.choreography_after_change || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '200px'}}>
                      <div className="space-y-1 text-xs">
                        <div><strong>準決勝からの変更:</strong> {finalsInfo.choreographer_change ? 'あり' : 'なし'}</div>
                        <div><strong>①氏名:</strong> {finalsInfo.choreographer_name || '未入力'}</div>
                        <div><strong>①フリガナ:</strong> {finalsInfo.choreographer_furigana || '未入力'}</div>
                        <div><strong>②氏名:</strong> {finalsInfo.choreographer2_name || '未入力'}</div>
                        <div><strong>②フリガナ:</strong> {finalsInfo.choreographer2_furigana || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '150px'}}>
                      <div className="space-y-1 text-xs">
                        <div><strong>有無:</strong> {finalsInfo.props_usage || '未入力'}</div>
                        <div><strong>詳細:</strong> {finalsInfo.props_details || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900" style={{maxWidth: '150px'}}>
                      <div className="space-y-1 text-xs">
                        <div><strong>出席:</strong> {finalsInfo.choreographer_attendance || '未入力'}</div>
                        <div><strong>写真:</strong> {finalsInfo.choreographer_photo_permission || '未入力'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_choreographer_photo_path'
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string; signed_url?: string }) => (
                          <div key={file.id}>
                            <a
                              href={file.signed_url || finalsInfo.file_urls?.choreographer_photo_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              📷 {file.file_name}
                            </a>
                          </div>
                        ))}
                        {finalsInfo.file_urls?.choreographer_photo_path && (!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_choreographer_photo_path'
                        )) && (
                          <div>
                            <a
                              href={finalsInfo.file_urls.choreographer_photo_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              📷 振付師写真
                            </a>
                          </div>
                        )}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose === 'finals_choreographer_photo_path'
                        )) && !finalsInfo.file_urls?.choreographer_photo_path && (
                          <span className="text-xs text-gray-400">写真なし</span>
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
          <div className="text-gray-500">決勝情報が登録されていません</div>
        </div>
      )}
    </div>
  )
}