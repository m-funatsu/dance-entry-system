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
              '1. システム利用者名',
              '2. 作品情報 - 楽曲情報の変更',
              '2. 作品情報 - 作品タイトル', 
              '2. 作品情報 - 作品タイトル(ふりがな)', 
              '2. 作品情報 - 作品キャラクター・ストーリー等',
              '3. 楽曲著作関連情報 - 楽曲著作権許諾', 
              '3. 楽曲著作関連情報 - 使用楽曲タイトル', 
              '3. 楽曲著作関連情報 - 収録CDタイトル', 
              '3. 楽曲著作関連情報 - アーティスト', 
              '3. 楽曲著作関連情報 - レコード番号', 
              '3. 楽曲著作関連情報 - JASRAC作品コード', 
              '3. 楽曲著作関連情報 - 楽曲種類',
              '4. 楽曲データ添付',
              '5. 音響情報 - 準決勝との音響指示変更の有無', 
              '5. 音響情報 - 音楽スタートのタイミング', 
              '5. 音響情報 - チェイサー（退場）曲の指定', 
              '5. 音響情報 - フェードアウト開始時間', 
              '5. 音響情報 - フェードアウト完了時間',
              '6. 音響データ添付 - チェイサー（退場）曲音源',
              '7. 照明情報 - 準決勝との照明指示変更の有無', 
              '7. 照明情報 - 決勝-踊り出しタイミング',
              '8. 照明シーン1',
              '9. 照明シーン1イメージ画像',
              '10. 照明シーン2',
              '11. 照明シーン2イメージ画像',
              '12. 照明シーン3',
              '13. 照明シーン3イメージ画像',
              '14. 照明シーン4',
              '15. 照明シーン4イメージ画像',
              '16. 照明シーン5',
              '17. 照明シーン5イメージ画像',
              '18. 照明シーン チェイサー',
              '18-2. 照明シーン チェイサーイメージ画像',
              '19. 振付変更情報',
              '20. 振付師情報', 
              '21. 小道具情報',
              '22. 作品振付師出席情報',
              '23. 振付師写真'
            ]}
            filename="finals_info"
          />
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">決勝情報一覧</h1>
        <p className="text-gray-600">エントリーの決勝情報をCSVでダウンロードできます（{mappedFinalsInfoList?.length || 0}件）</p>
      </div>

      {!mappedFinalsInfoList || mappedFinalsInfoList.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">決勝情報が登録されていません</div>
        </div>
      ) : null}
    </div>
  )
}