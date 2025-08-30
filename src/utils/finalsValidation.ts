import type { FinalsInfo } from '@/lib/types'

export const validateFinalsSection = (sectionId: string, data: Partial<FinalsInfo>): string[] => {
  const errors: string[] = []

  switch (sectionId) {
    case 'music':
      // 楽曲情報の必須項目チェック（条件に関係なく常時必須）
      if (!data.music_change && data.music_change !== false) {
        errors.push('楽曲情報の変更を選択してください')
      }
      // すべての楽曲情報項目が常時必須
      if (!data.work_title) errors.push('作品タイトル')
      if (!data.work_title_kana) errors.push('作品タイトル(ふりがな)')
      if (!data.work_character_story) errors.push('作品キャラクター・ストーリー等')
      if (!data.copyright_permission) errors.push('楽曲著作権許諾')
      if (!data.music_title) errors.push('使用楽曲タイトル')
      if (!data.cd_title) errors.push('収録CDタイトル')
      if (!data.artist) errors.push('アーティスト')
      if (!data.record_number) errors.push('レコード番号')
      // JASRAC作品コードは必須ではない
      if (!data.music_type) errors.push('楽曲種類')
      if (!data.music_data_path) errors.push('楽曲データ')
      break

    case 'sound':
      // 音響指示情報の必須項目チェック（条件に関係なく常時必須）
      if (!data.sound_change_from_semifinals && data.sound_change_from_semifinals !== false) {
        errors.push('準決勝との音響指示を選択してください')
      }
      // すべての音響指示項目が常時必須
      if (!data.sound_start_timing) errors.push('音楽スタートのタイミング')
      if (!data.chaser_song_designation) errors.push('チェイサー（退場）曲の指定')
      if (data.chaser_song_designation === '必要' && !data.chaser_song) {
        errors.push('チェイサー（退場）曲音源')
      }
      if (!data.fade_out_start_time) errors.push('フェードアウト開始時間')
      if (!data.fade_out_complete_time) errors.push('フェードアウト完了時間')
      break

    case 'lighting':
      // 照明指示情報の必須項目チェック（条件に関係なく常時必須）
      if (!data.lighting_change_from_semifinals && data.lighting_change_from_semifinals !== false) {
        errors.push('準決勝との照明指示変更の有無を選択してください')
      }
      // すべての照明指示項目が常時必須
      if (!data.dance_start_timing) errors.push('決勝 - 踊り出しタイミング')
      // シーン1は必須
      if (!data.scene1_time) errors.push('シーン1 - 時間')
      if (!data.scene1_trigger) errors.push('シーン1 - きっかけ')
      if (!data.scene1_color_type) errors.push('シーン1 - 色・系統')
      if (!data.scene1_color_other) errors.push('シーン1 - 色・系統その他')
      if (!data.scene1_image) errors.push('シーン1 - イメージ')
      if (!data.scene1_image_path) errors.push('シーン1 - イメージ画像')
      // チェイサー/退場も必須
      if (!data.chaser_exit_time) errors.push('チェイサー/退場 - 時間')
      if (!data.chaser_exit_trigger) errors.push('チェイサー/退場 - きっかけ')
      if (!data.chaser_exit_color_type) errors.push('チェイサー/退場 - 色・系統')
      if (!data.chaser_exit_color_other) errors.push('チェイサー/退場 - 色・系統その他')
      if (!data.chaser_exit_image) errors.push('チェイサー/退場 - イメージ')
      if (!data.chaser_exit_image_path) errors.push('チェイサー/退場 - イメージ画像')
      break

    case 'choreographer':
      // 振付変更情報・作品振付師出席情報の必須項目チェック（条件に関係なく常時必須）
      if (!data.choreographer_change && data.choreographer_change !== false) {
        errors.push('振付師の変更を選択してください')
      }
      // 振付師名は常時必須
      if (!data.choreographer_name) errors.push('振付師 氏名①')
      if (!data.choreographer_furigana) errors.push('振付師 氏名フリガナ①')
      // 振付師2は任意項目のため必須チェックしない
      
      // 小道具の有無は必須
      if (!data.props_usage) errors.push('小道具の有無')
      // 小道具ありの場合は詳細が必須
      if (data.props_usage === 'あり' && !data.props_details) {
        errors.push('利用する小道具')
      }
      if (!data.choreographer_photo_permission) errors.push('作品振付師写真掲載')
      if (!data.choreographer_photo_path) errors.push('作品振付師写真')
      break
  }

  return errors
}

export const validateAllFinalsSection = (data: Partial<FinalsInfo>) => {
  const allErrors: Record<string, string[]> = {}
  const sectionIds = ['music', 'sound', 'lighting', 'choreographer']
  
  sectionIds.forEach(sectionId => {
    const errors = validateFinalsSection(sectionId, data)
    if (errors.length > 0) {
      allErrors[sectionId] = errors
    }
  })
  
  return allErrors
}

export const isFinalsAllRequiredFieldsValid = (data: Partial<FinalsInfo>) => {
  const allErrors = validateAllFinalsSection(data)
  return Object.keys(allErrors).length === 0
}

export const finalsSections = [
  { id: 'music', label: '楽曲情報' },
  { id: 'sound', label: '音響指示情報' },
  { id: 'lighting', label: '照明指示情報' },
  { id: 'choreographer', label: '振付変更情報・作品振付師出席情報' }
]

export const finalsColorTypes = [
  '暖色系',
  '寒色系',
  'その他'
]