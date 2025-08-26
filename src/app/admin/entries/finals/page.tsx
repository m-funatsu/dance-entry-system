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
              // 基本項目
              item.entries?.users?.name || '不明なユーザー',
              // 作品情報
              item.music_change ? 'あり' : 'なし',
              item.work_title || '',
              item.work_title_kana || '',
              item.work_character_story || '',
              // 楽曲著作関連情報
              item.copyright_permission || '',
              item.music_title || '',
              item.cd_title || '',
              item.artist || '',
              item.record_number || '',
              item.jasrac_code || '',
              item.music_type || '',
              // 音響情報
              item.sound_change_from_semifinals ? 'あり' : 'なし',
              item.sound_start_timing || '',
              item.chaser_song_designation || '',
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
              // チェイサー
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
              // 作品振付師出席情報
              item.choreographer_attendance || '',
              item.choreographer_photo_permission || '',
              // 振付変更情報
              item.choreography_change_timing || '',
              item.choreography_before_change || '',
              item.choreography_after_change || ''
            ])}
            headers={[
              // 基本項目
              'システム利用者名',
              // 作品情報
              '楽曲情報の変更', '作品タイトル', '作品タイトル(ふりがな)', '作品キャラクター・ストーリー等',
              // 楽曲著作関連情報
              '楽曲著作権許諾', '使用楽曲タイトル', '収録CDタイトル', 'アーティスト', 'レコード番号', 'JASRAC作品コード', '楽曲種類',
              // 音響情報
              '準決勝との音響指示変更の有無', '音楽スタートのタイミング', 'チェイサー（退場）曲の指定', 'フェードアウト開始時間', 'フェードアウト完了時間',
              // 照明情報
              '準決勝との照明指示変更の有無', '決勝-踊り出しタイミング',
              // 照明シーン1
              'シーン1-時間', 'シーン1-きっかけ', 'シーン1-色・系統', 'シーン1-色・系統その他', 'シーン1-イメージ', 'シーン1-備考',
              // 照明シーン2
              'シーン2-時間', 'シーン2-きっかけ', 'シーン2-色・系統', 'シーン2-色・系統その他', 'シーン2-イメージ', 'シーン2-備考',
              // 照明シーン3
              'シーン3-時間', 'シーン3-きっかけ', 'シーン3-色・系統', 'シーン3-色・系統その他', 'シーン3-イメージ', 'シーン3-備考',
              // 照明シーン4
              'シーン4-時間', 'シーン4-きっかけ', 'シーン4-色・系統', 'シーン4-色・系統その他', 'シーン4-イメージ', 'シーン4-備考',
              // 照明シーン5
              'シーン5-時間', 'シーン5-きっかけ', 'シーン5-色・系統', 'シーン5-色・系統その他', 'シーン5-イメージ', 'シーン5-備考',
              // チェイサー
              'チェイサー-時間', 'チェイサー-きっかけ', 'チェイサー-色・系統', 'チェイサー-色・系統その他', 'チェイサー-イメージ', 'チェイサー-備考',
              // 振付師情報
              '振付師の変更', '振付師 氏名①', '振付師 氏名フリガナ①', '振付師 氏名②', '振付師 氏名フリガナ②', '小道具の有無', '利用する小道具',
              // 作品振付師出席情報
              '作品振付師出席予定', '作品振付師写真掲載',
              // 振付変更情報
              '振付変更部分', '変更前（準決勝振付）', '変更後（決勝振付）'
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
            <table className="divide-y divide-gray-200" style={{minWidth: '5000px', width: 'max-content'}}>
              <thead className="bg-gray-50">
                <tr>
                  {/* 基本項目 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    システム利用者名
                  </th>
                  {/* 作品情報 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    楽曲情報の変更
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    作品タイトル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    作品タイトル(ふりがな)
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    作品キャラクター・ストーリー等
                  </th>
                  {/* 楽曲著作関連情報 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    楽曲著作権許諾
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    使用楽曲タイトル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    収録CDタイトル
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    アーティスト
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    レコード番号
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    JASRAC作品コード
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    楽曲種類
                  </th>
                  {/* 楽曲データ添付 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                    楽曲データファイル
                  </th>
                  {/* 音響情報 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                    音響指示変更の有無
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                    音楽スタートのタイミング
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                    チェイサー曲の指定
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                    フェードアウト開始時間
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                    フェードアウト完了時間
                  </th>
                  {/* 音響データ添付 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50">
                    チェイサー曲音源ファイル
                  </th>
                  {/* 照明情報 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                    照明指示変更の有無
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                    踊り出しタイミング
                  </th>
                  {/* 照明シーン1 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">
                    シーン1-時間
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">
                    シーン1-きっかけ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">
                    シーン1-色・系統
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">
                    シーン1-色・その他
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">
                    シーン1-イメージ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">
                    シーン1-備考
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-100">
                    シーン1-イメージ画像
                  </th>
                  {/* 照明シーン2 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-pink-50">
                    シーン2-時間
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-pink-50">
                    シーン2-きっかけ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-pink-50">
                    シーン2-色・系統
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-pink-50">
                    シーン2-色・その他
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-pink-50">
                    シーン2-イメージ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-pink-50">
                    シーン2-備考
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-pink-100">
                    シーン2-イメージ画像
                  </th>
                  {/* 照明シーン3 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-teal-50">
                    シーン3-時間
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-teal-50">
                    シーン3-きっかけ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-teal-50">
                    シーン3-色・系統
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-teal-50">
                    シーン3-色・その他
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-teal-50">
                    シーン3-イメージ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-teal-50">
                    シーン3-備考
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-teal-100">
                    シーン3-イメージ画像
                  </th>
                  {/* 照明シーン4 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    シーン4-時間
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    シーン4-きっかけ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    シーン4-色・系統
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    シーン4-色・その他
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    シーン4-イメージ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    シーン4-備考
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                    シーン4-イメージ画像
                  </th>
                  {/* 照明シーン5 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-cyan-50">
                    シーン5-時間
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-cyan-50">
                    シーン5-きっかけ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-cyan-50">
                    シーン5-色・系統
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-cyan-50">
                    シーン5-色・その他
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-cyan-50">
                    シーン5-イメージ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-cyan-50">
                    シーン5-備考
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-cyan-100">
                    シーン5-イメージ画像
                  </th>
                  {/* チェイサー */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    チェイサー-時間
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    チェイサー-きっかけ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    チェイサー-色・系統
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    チェイサー-色・その他
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    チェイサー-イメージ
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    チェイサー-備考
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-100">
                    チェイサー-イメージ画像
                  </th>
                  {/* 振付師情報 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-lime-50">
                    振付師の変更
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-lime-50">
                    振付師 氏名①
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-lime-50">
                    振付師 氏名フリガナ①
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-lime-50">
                    振付師 氏名②
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-lime-50">
                    振付師 氏名フリガナ②
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-lime-50">
                    小道具の有無
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-lime-50">
                    利用する小道具
                  </th>
                  {/* 作品振付師出席情報 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-emerald-50">
                    作品振付師出席予定
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-emerald-50">
                    作品振付師写真掲載
                  </th>
                  {/* 振付師写真 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-emerald-100">
                    作品振付師写真ファイル
                  </th>
                  {/* 振付変更情報 */}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-rose-50">
                    振付変更部分
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-rose-50">
                    変更前（準決勝振付）
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-rose-50">
                    変更後（決勝振付）
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedFinalsInfoList.map((finalsInfo) => (
                  <tr key={finalsInfo.id} className="hover:bg-gray-50">
                    {/* 基本項目 */}
                    <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900">
                      <div className="font-medium">{finalsInfo.entries?.users?.name || '不明なユーザー'}</div>
                      <div className="text-gray-500">{finalsInfo.entries?.participant_names || 'エントリー名なし'}</div>
                    </td>
                    {/* 作品情報 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-blue-25">
                      {finalsInfo.music_change ? 'あり' : 'なし'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-blue-25">
                      {finalsInfo.work_title || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-blue-25">
                      {finalsInfo.work_title_kana || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-blue-25" style={{maxWidth: '200px'}}>
                      <div className="truncate" title={finalsInfo.work_character_story || '未入力'}>
                        {finalsInfo.work_character_story ? 
                          `${finalsInfo.work_character_story.slice(0, 30)}${finalsInfo.work_character_story.length > 30 ? '...' : ''}` 
                          : '未入力'}
                      </div>
                    </td>
                    {/* 楽曲著作関連情報 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-green-25">
                      {finalsInfo.copyright_permission || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-green-25">
                      {finalsInfo.music_title || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-green-25">
                      {finalsInfo.cd_title || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-green-25">
                      {finalsInfo.artist || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-green-25">
                      {finalsInfo.record_number || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-green-25">
                      {finalsInfo.jasrac_code || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-green-25">
                      {finalsInfo.music_type || '未入力'}
                    </td>
                    {/* 楽曲データ添付 */}
                    <td className="px-2 py-3 text-xs bg-yellow-25">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('finals')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-500 underline block"
                              download
                            >
                              🎵 {file.file_name.slice(0, 15)}{file.file_name.length > 15 ? '...' : ''}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('finals')
                        )) && (
                          <span className="text-gray-400">なし</span>
                        )}
                      </div>
                    </td>
                    {/* 音響情報 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-orange-25">
                      {finalsInfo.sound_change_from_semifinals ? 'あり' : 'なし'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-orange-25">
                      {finalsInfo.sound_start_timing || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-orange-25">
                      {finalsInfo.chaser_song_designation || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-orange-25">
                      {finalsInfo.fade_out_start_time || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-orange-25">
                      {finalsInfo.fade_out_complete_time || '未入力'}
                    </td>
                    {/* 音響データ添付 */}
                    <td className="px-2 py-3 text-xs bg-red-25">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('chaser')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-500 underline block"
                              download
                            >
                              🎵 {file.file_name.slice(0, 15)}{file.file_name.length > 15 ? '...' : ''}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          (file.file_type === 'music' || file.file_type === 'audio') && file.purpose && file.purpose.includes('chaser')
                        )) && (
                          <span className="text-gray-400">なし</span>
                        )}
                      </div>
                    </td>
                    {/* 照明情報 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-purple-25">
                      {finalsInfo.lighting_change_from_semifinals ? 'あり' : 'なし'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-purple-25">
                      {finalsInfo.dance_start_timing || '未入力'}
                    </td>
                    {/* 照明シーン1 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-indigo-25">{finalsInfo.scene1_time || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-indigo-25">{finalsInfo.scene1_trigger || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-indigo-25">{finalsInfo.scene1_color_type || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-indigo-25">{finalsInfo.scene1_color_other || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-indigo-25">{finalsInfo.scene1_image || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-indigo-25">
                      <div className="truncate" title={finalsInfo.scene1_notes || '未入力'}>
                        {finalsInfo.scene1_notes ? `${finalsInfo.scene1_notes.slice(0, 20)}${finalsInfo.scene1_notes.length > 20 ? '...' : ''}` : '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs bg-indigo-50">
                      {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { file_type: string; purpose?: string }) => 
                        file.file_type === 'photo' && file.purpose && file.purpose.includes('scene1')
                      ).length > 0 ? (
                        finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene1')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <a key={file.id} href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">📸</a>
                        ))[0]
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    {/* 照明シーン2 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-pink-25">{finalsInfo.scene2_time || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-pink-25">{finalsInfo.scene2_trigger || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-pink-25">{finalsInfo.scene2_color_type || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-pink-25">{finalsInfo.scene2_color_other || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-pink-25">{finalsInfo.scene2_image || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-pink-25">
                      <div className="truncate" title={finalsInfo.scene2_notes || '未入力'}>
                        {finalsInfo.scene2_notes ? `${finalsInfo.scene2_notes.slice(0, 20)}${finalsInfo.scene2_notes.length > 20 ? '...' : ''}` : '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs bg-pink-50">
                      {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { file_type: string; purpose?: string }) => 
                        file.file_type === 'photo' && file.purpose && file.purpose.includes('scene2')
                      ).length > 0 ? (
                        finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene2')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <a key={file.id} href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">📸</a>
                        ))[0]
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    {/* 照明シーン3 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-teal-25">{finalsInfo.scene3_time || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-teal-25">{finalsInfo.scene3_trigger || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-teal-25">{finalsInfo.scene3_color_type || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-teal-25">{finalsInfo.scene3_color_other || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-teal-25">{finalsInfo.scene3_image || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-teal-25">
                      <div className="truncate" title={finalsInfo.scene3_notes || '未入力'}>
                        {finalsInfo.scene3_notes ? `${finalsInfo.scene3_notes.slice(0, 20)}${finalsInfo.scene3_notes.length > 20 ? '...' : ''}` : '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs bg-teal-50">
                      {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { file_type: string; purpose?: string }) => 
                        file.file_type === 'photo' && file.purpose && file.purpose.includes('scene3')
                      ).length > 0 ? (
                        finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene3')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <a key={file.id} href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">📸</a>
                        ))[0]
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    {/* 照明シーン4 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-gray-25">{finalsInfo.scene4_time || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-gray-25">{finalsInfo.scene4_trigger || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-gray-25">{finalsInfo.scene4_color_type || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-gray-25">{finalsInfo.scene4_color_other || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-gray-25">{finalsInfo.scene4_image || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-gray-25">
                      <div className="truncate" title={finalsInfo.scene4_notes || '未入力'}>
                        {finalsInfo.scene4_notes ? `${finalsInfo.scene4_notes.slice(0, 20)}${finalsInfo.scene4_notes.length > 20 ? '...' : ''}` : '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs bg-gray-50">
                      {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { file_type: string; purpose?: string }) => 
                        file.file_type === 'photo' && file.purpose && file.purpose.includes('scene4')
                      ).length > 0 ? (
                        finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene4')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <a key={file.id} href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">📸</a>
                        ))[0]
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    {/* 照明シーン5 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-cyan-25">{finalsInfo.scene5_time || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-cyan-25">{finalsInfo.scene5_trigger || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-cyan-25">{finalsInfo.scene5_color_type || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-cyan-25">{finalsInfo.scene5_color_other || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-cyan-25">{finalsInfo.scene5_image || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-cyan-25">
                      <div className="truncate" title={finalsInfo.scene5_notes || '未入力'}>
                        {finalsInfo.scene5_notes ? `${finalsInfo.scene5_notes.slice(0, 20)}${finalsInfo.scene5_notes.length > 20 ? '...' : ''}` : '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs bg-cyan-50">
                      {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { file_type: string; purpose?: string }) => 
                        file.file_type === 'photo' && file.purpose && file.purpose.includes('scene5')
                      ).length > 0 ? (
                        finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('scene5')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <a key={file.id} href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">📸</a>
                        ))[0]
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    {/* チェイサー */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-amber-25">{finalsInfo.chaser_exit_time || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-amber-25">{finalsInfo.chaser_exit_trigger || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-amber-25">{finalsInfo.chaser_exit_color_type || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-amber-25">{finalsInfo.chaser_exit_color_other || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-amber-25">{finalsInfo.chaser_exit_image || '未入力'}</td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-amber-25">
                      <div className="truncate" title={finalsInfo.chaser_exit_notes || '未入力'}>
                        {finalsInfo.chaser_exit_notes ? `${finalsInfo.chaser_exit_notes.slice(0, 20)}${finalsInfo.chaser_exit_notes.length > 20 ? '...' : ''}` : '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs bg-amber-50">
                      {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { file_type: string; purpose?: string }) => 
                        file.file_type === 'photo' && file.purpose && file.purpose.includes('chaser')
                      ).length > 0 ? (
                        finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('chaser')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <a key={file.id} href={getFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">📸</a>
                        ))[0]
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    {/* 振付師情報 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-lime-25">
                      {finalsInfo.choreographer_change ? 'あり' : 'なし'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-lime-25">
                      {finalsInfo.choreographer_name || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-lime-25">
                      {finalsInfo.choreographer_furigana || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-lime-25">
                      {finalsInfo.choreographer2_name || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-lime-25">
                      {finalsInfo.choreographer2_furigana || '未入力'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-lime-25">
                      {finalsInfo.props_usage || '未選択'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-lime-25">
                      <div className="truncate" title={finalsInfo.props_details || '未入力'}>
                        {finalsInfo.props_details ? `${finalsInfo.props_details.slice(0, 20)}${finalsInfo.props_details.length > 20 ? '...' : ''}` : '未入力'}
                      </div>
                    </td>
                    {/* 作品振付師出席情報 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-emerald-25">
                      {finalsInfo.choreographer_attendance || '未選択'}
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-emerald-25">
                      {finalsInfo.choreographer_photo_permission || '未選択'}
                    </td>
                    {/* 振付師写真 */}
                    <td className="px-2 py-3 text-xs bg-emerald-50">
                      <div className="space-y-1">
                        {Array.isArray(finalsInfo.entry_files) && finalsInfo.entry_files.filter((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('choreographer')
                        ).map((file: { id: string; file_name: string; file_path: string; file_type: string; purpose?: string }) => (
                          <div key={file.id}>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-500 underline block"
                            >
                              📸 {file.file_name.slice(0, 10)}{file.file_name.length > 10 ? '...' : ''}
                            </a>
                          </div>
                        ))}
                        {(!Array.isArray(finalsInfo.entry_files) || !finalsInfo.entry_files.some((file: { file_type?: string; purpose?: string }) => 
                          file.file_type === 'photo' && file.purpose && file.purpose.includes('choreographer')
                        )) && (
                          <span className="text-gray-400">なし</span>
                        )}
                      </div>
                    </td>
                    {/* 振付変更情報 */}
                    <td className="px-2 py-3 text-xs text-gray-900 bg-rose-25">
                      <div className="truncate" title={finalsInfo.choreography_change_timing || '未入力'}>
                        {finalsInfo.choreography_change_timing ? `${finalsInfo.choreography_change_timing.slice(0, 20)}${finalsInfo.choreography_change_timing.length > 20 ? '...' : ''}` : '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-rose-25">
                      <div className="truncate" title={finalsInfo.choreography_before_change || '未入力'}>
                        {finalsInfo.choreography_before_change ? `${finalsInfo.choreography_before_change.slice(0, 20)}${finalsInfo.choreography_before_change.length > 20 ? '...' : ''}` : '未入力'}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 bg-rose-25">
                      <div className="truncate" title={finalsInfo.choreography_after_change || '未入力'}>
                        {finalsInfo.choreography_after_change ? `${finalsInfo.choreography_after_change.slice(0, 20)}${finalsInfo.choreography_after_change.length > 20 ? '...' : ''}` : '未入力'}
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