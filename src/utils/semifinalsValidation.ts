import type { SemifinalsInfo } from '@/lib/types'

export const validateSemifinalsSection = (sectionId: string, data: Partial<SemifinalsInfo>, options?: { hasPaymentSlip?: boolean }): string[] => {
  const errors: string[] = []

  switch (sectionId) {
    case 'music':
      if (data.music_change_from_preliminary === undefined) {
        errors.push('「予選との楽曲情報の変更」を選択してください')
      }
      if (!data.work_title) errors.push('作品タイトル')
      if (!data.work_character_story) errors.push('作品キャラクター・ストーリー等')
      if (!data.copyright_permission) errors.push('楽曲著作権許諾')
      if (!data.music_title) errors.push('使用楽曲タイトル')
      // 収録CDタイトル、アーティスト、レコード番号を常時必須に変更
      if (!data.cd_title) errors.push('収録CDタイトル')
      if (!data.artist) errors.push('アーティスト')
      if (!data.record_number) errors.push('レコード番号')
      // JASRAC作品コードは必須ではない
      if (!data.music_type) errors.push('楽曲種類')
      if (!data.music_data_path) errors.push('楽曲データ')
      break

    case 'sound':
      if (!data.sound_start_timing) errors.push('音楽スタートのタイミング')
      if (!data.chaser_song_designation) errors.push('チェイサー（退場）曲の指定')
      if (data.chaser_song_designation === 'required' && !data.chaser_song) {
        errors.push('チェイサー（退場）曲音源')
      }
      if (!data.fade_out_start_time) errors.push('フェードアウト開始時間')
      if (!data.fade_out_complete_time) errors.push('フェードアウト完了時間')
      break

    case 'lighting':
      if (!data.dance_start_timing) errors.push('準決勝 - 踊り出しタイミング')
      if (!data.scene1_time) errors.push('シーン1 - 時間')
      if (!data.scene1_trigger) errors.push('シーン1 - きっかけ')
      if (!data.scene1_color_type) errors.push('シーン1 - 色・系統')
      if (!data.scene1_color_other) errors.push('シーン1 - 色・系統その他')
      if (!data.scene1_image) errors.push('シーン1 - イメージ')
      if (!data.scene1_image_path) errors.push('シーン1 - イメージ画像')
      if (!data.chaser_exit_time) errors.push('チェイサー/退場 - 時間')
      if (!data.chaser_exit_trigger) errors.push('チェイサー/退場 - きっかけ')
      if (!data.chaser_exit_color_type) errors.push('チェイサー/退場 - 色・系統')
      if (!data.chaser_exit_color_other) errors.push('チェイサー/退場 - 色・系統その他')
      if (!data.chaser_exit_image) errors.push('チェイサー/退場 - イメージ')
      if (!data.chaser_exit_image_path) errors.push('チェイサー/退場 - イメージ画像')
      break

    case 'choreographer':
      if (!data.choreographer_name) errors.push('振付師 氏名①')
      if (!data.choreographer_name_kana) errors.push('振付師 氏名フリガナ①')
      // 小道具の有無は必須
      if (!data.props_usage) errors.push('小道具の有無')
      // 小道具ありの場合は詳細が必須
      if (data.props_usage === 'あり' && !data.props_details) {
        errors.push('利用する小道具')
      }
      break

    case 'bank':
      if (!data.bank_name) errors.push('銀行名')
      if (!data.branch_name) errors.push('支店名')
      if (!data.account_type) errors.push('口座種類')
      if (!data.account_number) errors.push('口座番号')
      if (!data.account_holder) errors.push('口座名義')
      // 振込確認用紙のアップロード状態をチェック
      if (!options?.hasPaymentSlip) errors.push('振込確認用紙')
      break

    case 'regulation':
      // レギュレーションチェック項目（すべて必須）
      if (!data.lift_regulation) errors.push('リフト規定の確認')
      if (!data.no_props) errors.push('小道具使用禁止の確認')
      if (!data.performance_time) errors.push('演技時間の確認')
      if (!data.no_antisocial) errors.push('反社会的内容禁止の確認')
      break
  }

  return errors
}

export const validateAllSemifinalsSection = (data: Partial<SemifinalsInfo>, options?: { hasPaymentSlip?: boolean }) => {
  const allErrors: Record<string, string[]> = {}
  const sectionIds = ['music', 'sound', 'lighting', 'choreographer', 'bank', 'regulation']
  
  sectionIds.forEach(sectionId => {
    const errors = validateSemifinalsSection(sectionId, data, options)
    if (errors.length > 0) {
      allErrors[sectionId] = errors
    }
  })
  
  return allErrors
}

export const isSemifinalsAllRequiredFieldsValid = (data: Partial<SemifinalsInfo>, options?: { hasPaymentSlip?: boolean }) => {
  const allErrors = validateAllSemifinalsSection(data, options)
  return Object.keys(allErrors).length === 0
}

export const semifinalsSections = [
  { id: 'music', label: '楽曲情報' },
  { id: 'sound', label: '音響指示情報' },
  { id: 'lighting', label: '照明指示情報' },
  { id: 'choreographer', label: '振付情報' },
  { id: 'bank', label: '本大会エントリー料振込確認 / 賞金振込先情報' },
  { id: 'regulation', label: 'レギュレーション' }
]

export const colorTypes = ['暖色系', '寒色系', 'その他色指定']