import { createClient } from '@/lib/supabase/client'
import type { SemifinalsInfo, FinalsInfo } from '@/lib/types'

/**
 * 準決勝情報保存時に決勝情報を同期更新する関数
 */
export async function syncFinalsFromSemifinals(entryId: string, semifinalsData: Partial<SemifinalsInfo>) {
  console.log('[SYNC FINALS] === 準決勝→決勝同期処理開始 ===')
  console.log('[SYNC FINALS] エントリーID:', entryId)
  
  try {
    const supabase = createClient()
    
    // 決勝情報を取得
    const { data: finalsData, error: finalsError } = await supabase
      .from('finals_info')
      .select('*')
      .eq('entry_id', entryId)
      .maybeSingle()
    
    if (finalsError && finalsError.code !== 'PGRST116') {
      console.error('[SYNC FINALS] 決勝情報取得エラー:', finalsError)
      return
    }
    
    if (!finalsData) {
      console.log('[SYNC FINALS] 決勝情報が未作成のため同期スキップ')
      return
    }
    
    console.log('[SYNC FINALS] 決勝情報取得完了:', finalsData.id)
    
    // 各セクションの同期設定をチェック
    const updates: Partial<FinalsInfo> = {}
    let hasUpdates = false
    
    // 1. 楽曲情報の同期 (music_change: false = 準決勝から変更なし)
    if (finalsData.music_change === false) {
      console.log('[SYNC FINALS] 楽曲情報を同期')
      updates.work_title = semifinalsData.work_title || ''
      updates.work_title_kana = semifinalsData.work_title_kana || ''
      updates.work_character_story = semifinalsData.work_character_story || ''
      updates.copyright_permission = semifinalsData.copyright_permission || ''
      updates.music_title = semifinalsData.music_title || ''
      updates.artist = semifinalsData.artist || ''
      updates.cd_title = semifinalsData.cd_title || ''
      updates.record_number = semifinalsData.record_number || ''
      updates.jasrac_code = semifinalsData.jasrac_code || ''
      updates.music_type = semifinalsData.music_type || ''
      updates.music_data_path = semifinalsData.music_data_path || ''
      hasUpdates = true
    } else {
      console.log('[SYNC FINALS] 楽曲情報は同期対象外 (music_change !== false)')
    }
    
    // 2. 音響指示の同期 (sound_change_from_semifinals: false = 準決勝と同じ音響指示)
    if (finalsData.sound_change_from_semifinals === false) {
      console.log('[SYNC FINALS] 音響指示を同期')
      updates.sound_start_timing = semifinalsData.sound_start_timing || ''
      updates.chaser_song_designation = semifinalsData.chaser_song_designation || ''
      updates.chaser_song = semifinalsData.chaser_song || ''
      updates.fade_out_start_time = semifinalsData.fade_out_start_time || ''
      updates.fade_out_complete_time = semifinalsData.fade_out_complete_time || ''
      hasUpdates = true
    } else {
      console.log('[SYNC FINALS] 音響指示は同期対象外 (sound_change_from_semifinals !== false)')
    }
    
    // 3. 照明指示の同期 (lighting_change_from_semifinals: false = 準決勝と同じ照明指示)
    if (finalsData.lighting_change_from_semifinals === false) {
      console.log('[SYNC FINALS] 照明指示を同期')
      updates.dance_start_timing = semifinalsData.dance_start_timing || ''
      
      // シーン1-5の情報を同期
      for (let i = 1; i <= 5; i++) {
        const sceneKey = `scene${i}` as const
        ;(updates as Record<string, string>)[`${sceneKey}_time`] = (semifinalsData[`${sceneKey}_time` as keyof SemifinalsInfo] as string) || ''
        ;(updates as Record<string, string>)[`${sceneKey}_trigger`] = (semifinalsData[`${sceneKey}_trigger` as keyof SemifinalsInfo] as string) || ''
        ;(updates as Record<string, string>)[`${sceneKey}_color_type`] = (semifinalsData[`${sceneKey}_color_type` as keyof SemifinalsInfo] as string) || ''
        ;(updates as Record<string, string>)[`${sceneKey}_color_other`] = (semifinalsData[`${sceneKey}_color_other` as keyof SemifinalsInfo] as string) || ''
        ;(updates as Record<string, string>)[`${sceneKey}_image`] = (semifinalsData[`${sceneKey}_image` as keyof SemifinalsInfo] as string) || ''
        ;(updates as Record<string, string>)[`${sceneKey}_image_path`] = (semifinalsData[`${sceneKey}_image_path` as keyof SemifinalsInfo] as string) || ''
        ;(updates as Record<string, string>)[`${sceneKey}_notes`] = (semifinalsData[`${sceneKey}_notes` as keyof SemifinalsInfo] as string) || ''
      }
      
      // チェイサー/退場情報を同期
      updates.chaser_exit_time = semifinalsData.chaser_exit_time || ''
      updates.chaser_exit_trigger = semifinalsData.chaser_exit_trigger || ''
      updates.chaser_exit_color_type = semifinalsData.chaser_exit_color_type || ''
      updates.chaser_exit_color_other = semifinalsData.chaser_exit_color_other || ''
      updates.chaser_exit_image = semifinalsData.chaser_exit_image || ''
      updates.chaser_exit_image_path = semifinalsData.chaser_exit_image_path || ''
      updates.chaser_exit_notes = semifinalsData.chaser_exit_notes || ''
      hasUpdates = true
    } else {
      console.log('[SYNC FINALS] 照明指示は同期対象外 (lighting_change_from_semifinals !== false)')
    }
    
    // 4. 振付師情報の同期 (choreographer_change: false = 準決勝と同じ)
    if (finalsData.choreographer_change === false) {
      console.log('[SYNC FINALS] 振付師情報を同期')
      updates.choreographer_name = semifinalsData.choreographer_name || ''
      updates.choreographer_furigana = semifinalsData.choreographer_name_kana || ''
      updates.choreographer2_name = semifinalsData.choreographer2_name || ''
      updates.choreographer2_furigana = semifinalsData.choreographer2_furigana || ''
      hasUpdates = true
    } else {
      console.log('[SYNC FINALS] 振付師情報は同期対象外 (choreographer_change !== false)')
    }
    
    // 更新がある場合のみDBを更新
    if (hasUpdates) {
      console.log('[SYNC FINALS] 決勝情報を更新:', Object.keys(updates))
      
      const { error: updateError } = await supabase
        .from('finals_info')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('entry_id', entryId)
      
      if (updateError) {
        console.error('[SYNC FINALS] 決勝情報更新エラー:', updateError)
      } else {
        console.log('[SYNC FINALS] 決勝情報更新成功')
      }
    } else {
      console.log('[SYNC FINALS] 同期対象なし - 更新スキップ')
    }
    
    console.log('[SYNC FINALS] === 準決勝→決勝同期処理完了 ===')
    
  } catch (error) {
    console.error('[SYNC FINALS] 同期処理エラー:', error)
  }
}