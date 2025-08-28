import { createClient } from '@/lib/supabase/client'

/**
 * バリデーションルールから必須フィールドを抽出する汎用関数
 */
export function getRequiredFieldsFromValidation(validationRules: Record<string, Record<string, unknown>>): string[] {
  return Object.keys(validationRules).filter(field => 
    validationRules[field]?.required === true
  )
}

/**
 * フォームデータが存在するかチェックする汎用関数
 */
function hasAnyFormData(formData: Record<string, unknown>): boolean {
  return Object.values(formData).some(value => {
    if (typeof value === 'boolean') return true // booleanは常にデータありとみなす
    return value && value.toString().trim() !== ''
  })
}

/**
 * 汎用的なフォーム完了チェック関数
 */
export function checkFormCompletion(
  formName: string,
  formData: Record<string, unknown>,
  requiredFields: string[],
  additionalConditions: boolean = true
): { isComplete: boolean; hasData: boolean; missingFields: string[] } {
  console.log(`[${formName.toUpperCase()} CHECK] === ${formName}完了チェック開始 ===`)
  console.log(`[${formName.toUpperCase()} CHECK] 受信したformData:`, formData)
  console.log(`[${formName.toUpperCase()} CHECK] チェック対象フィールド:`, requiredFields)
  console.log(`[${formName.toUpperCase()} CHECK] 追加条件:`, additionalConditions)
  
  const hasData = hasAnyFormData(formData)
  console.log(`[${formName.toUpperCase()} CHECK] データ存在判定: ${hasData}`)
  
  const fieldResults: Record<string, boolean> = {}
  const missingFields: string[] = []
  
  requiredFields.forEach(field => {
    const value = formData[field]
    const isValid = !!(value && value.toString().trim() !== '')
    fieldResults[field] = isValid
    console.log(`[${formName.toUpperCase()} CHECK] ${field}: "${value}" -> ${isValid}`)
    
    if (!isValid) {
      missingFields.push(field)
    }
  })
  
  const hasAllRequiredFields = Object.values(fieldResults).every(result => result === true)
  const isComplete = hasAllRequiredFields && additionalConditions
  
  console.log(`[${formName.toUpperCase()} CHECK] === チェック結果まとめ ===`)
  console.log(`[${formName.toUpperCase()} CHECK] データ存在: ${hasData}`)
  console.log(`[${formName.toUpperCase()} CHECK] 必須フィールド完了: ${hasAllRequiredFields}`)
  console.log(`[${formName.toUpperCase()} CHECK] 追加条件満足: ${additionalConditions}`)
  console.log(`[${formName.toUpperCase()} CHECK] 未入力フィールド:`, missingFields)
  console.log(`[${formName.toUpperCase()} CHECK] 最終完了判定: ${isComplete}`)
  console.log(`[${formName.toUpperCase()} CHECK] === ${formName}完了チェック終了 ===`)
  
  return { isComplete, hasData, missingFields }
}

/**
 * フォームのステータスを更新する関数
 * データの状況に応じて「未入力」「入力中」「登録済み」のステータスを管理
 */
export async function updateFormStatus(
  tableName: string,
  entryId: string,
  isFormComplete: boolean,
  hasAnyData: boolean = true // デフォルトはデータありとして扱う
) {
  try {
    const supabase = createClient()
    
    console.log(`[STATUS UPDATE] ${tableName} - エントリーID: ${entryId}`)
    console.log(`[STATUS UPDATE] ${tableName} - 完了状況: ${isFormComplete}`)
    console.log(`[STATUS UPDATE] ${tableName} - データ存在: ${hasAnyData}`)
    
    // basic_infoの場合は特別な処理（ステータス更新をスキップ）
    if (tableName === 'basic_info') {
      console.log(`[STATUS UPDATE] ${tableName} - 独立したテーブルのため、entriesでのステータス更新をスキップ`)
      console.log(`[STATUS UPDATE] ${tableName} - 完了状況: ${isFormComplete} をログに記録（ダッシュボードは基本情報テーブルの存在で判定）`)
      return
    }
    
    // ステータスを決定
    let newStatus: string
    if (!hasAnyData) {
      newStatus = '未入力'
    } else if (isFormComplete) {
      newStatus = '登録済み'
    } else {
      newStatus = '入力中'
    }
    
    console.log(`[STATUS UPDATE] ${tableName} - 新しいステータス: ${newStatus}`)
    
    const statusFieldMap: Record<string, string> = {
      'preliminary_info': 'preliminary_info_status',
      'semifinals_info': 'semifinals_info_status',
      'finals_info': 'finals_info_status',
      'program_info': 'program_info_status',
      'sns_info': 'sns_info_status',
      'applications_info': 'applications_info_status'
    }
    
    const statusFieldName = statusFieldMap[tableName]
    
    if (statusFieldName) {
      // entriesテーブルの該当ステータスフィールドを更新
      const updateData = { [statusFieldName]: newStatus }
      
      console.log(`[STATUS UPDATE] 更新データ:`, updateData)
      console.log(`[STATUS UPDATE] 対象エントリーID:`, entryId)
      
      const { data, error } = await supabase
        .from('entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
      
      if (error) {
        console.error(`[STATUS UPDATE ERROR] ${tableName}:`, error)
        console.error(`[STATUS UPDATE ERROR] 詳細 - コード:`, error.code)
        console.error(`[STATUS UPDATE ERROR] 詳細 - メッセージ:`, error.message)
        console.error(`[STATUS UPDATE ERROR] 詳細 - 更新しようとしたフィールド:`, statusFieldName)
        console.error(`[STATUS UPDATE ERROR] 詳細 - 更新データ:`, updateData)
      } else {
        console.log(`[STATUS UPDATE SUCCESS] ${tableName} ${statusFieldName}を「${newStatus}」に更新完了`, data)
      }
    } else {
      console.warn(`[STATUS UPDATE WARNING] ${tableName} に対応するステータスフィールドが見つかりません`)
    }
  } catch (error) {
    console.error(`[STATUS UPDATE ERROR] ${tableName}:`, error)
  }
}

/**
 * 基本情報フォームの完了状況をチェック
 */
export function checkBasicInfoCompletion(
  formData: Record<string, unknown>,
  checkboxes: Record<string, boolean>
): boolean {
  console.log(`[BASIC INFO CHECK] === 基本情報完了チェック開始 ===`)
  console.log(`[BASIC INFO CHECK] 受信したformData:`, formData)
  console.log(`[BASIC INFO CHECK] 受信したcheckboxes:`, checkboxes)
  
  // 基本情報フォームのバリデーションルールと完全一致させる
  const requiredFields = [
    'dance_style',
    'category_division',
    'representative_name',
    'representative_furigana',
    'representative_romaji',
    'representative_birthdate',
    'representative_email',
    'phone_number',
    'emergency_contact_name_1',
    'emergency_contact_phone_1',
    'partner_name',
    'partner_furigana',
    'partner_romaji',
    'partner_birthdate'
  ]
  
  // 年齢による保護者情報の動的必須チェック
  const calculateAge = (birthdate: string): number => {
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // 代表者の年齢チェック
  const repAge = formData.representative_birthdate ? calculateAge(formData.representative_birthdate as string) : 999
  const partnerAge = formData.partner_birthdate ? calculateAge(formData.partner_birthdate as string) : 999

  // 18歳未満の場合、保護者情報を必須に追加
  if (repAge < 18) {
    requiredFields.push('guardian_name', 'guardian_phone', 'guardian_email')
  }
  
  if (partnerAge < 18) {
    requiredFields.push('partner_guardian_name', 'partner_guardian_phone', 'partner_guardian_email')
  }
  
  console.log(`[BASIC INFO CHECK] チェック対象フィールド:`, requiredFields)
  
  // 必須フィールドの入力チェック
  const fieldResults: Record<string, boolean> = {}
  requiredFields.forEach(field => {
    const value = formData[field]
    const isValid = !!(value && value.toString().trim() !== '')
    fieldResults[field] = isValid
    console.log(`[BASIC INFO CHECK] ${field}: "${value}" -> ${isValid}`)
  })
  
  const hasAllRequiredFields = Object.values(fieldResults).every(result => result === true)
  
  // すべての必須同意事項をチェック（フォームと完全一致）
  const agreementResults = {
    agreement_checked: formData.agreement_checked || checkboxes.agreement_checked,
    privacy_policy_checked: formData.privacy_policy_checked || checkboxes.privacy_policy_checked,
    media_consent_checked: formData.media_consent_checked || checkboxes.media_consent_checked
  }
  
  console.log(`[BASIC INFO CHECK] 同意事項チェック（ダッシュボード準拠）:`, agreementResults)
  
  const hasAllAgreements = Object.values(agreementResults).every(result => result === true)
  
  const result = hasAllRequiredFields && hasAllAgreements
  console.log(`[BASIC INFO CHECK] === チェック結果まとめ ===`)
  console.log(`[BASIC INFO CHECK] 必須フィールド完了: ${hasAllRequiredFields}`)
  console.log(`[BASIC INFO CHECK] フィールド詳細:`, fieldResults)
  console.log(`[BASIC INFO CHECK] 同意事項完了: ${hasAllAgreements}`)
  console.log(`[BASIC INFO CHECK] 同意事項詳細:`, agreementResults)
  console.log(`[BASIC INFO CHECK] 最終結果: ${result}`)
  console.log(`[BASIC INFO CHECK] === 基本情報完了チェック終了 ===`)
  
  return result
}

/**
 * 予選情報フォームの完了状況をチェック
 */
export function checkPreliminaryInfoCompletion(
  formData: Record<string, unknown>,
  hasVideo: boolean
): boolean {
  // フォームの必須項目のみ（任意項目は除外、条件付き必須は別途チェック）
  const baseRequiredFields = [
    'work_title',
    'work_title_kana',
    'work_story',
    'music_title',
    'music_type',
    'music_rights_cleared',
    'choreographer1_name',
    'choreographer1_furigana'
  ]
  
  // 条件付き必須項目: JASRAC作品コード（A.市販の楽曲を使用する場合のみ）
  const conditionallyRequired: string[] = []
  if (formData.music_rights_cleared === 'A') {
    conditionallyRequired.push('jasrac_code')
  }
  
  const allRequiredFields = [...baseRequiredFields, ...conditionallyRequired]
  
  const { isComplete } = checkFormCompletion('PRELIMINARY INFO', formData, allRequiredFields, hasVideo)
  return isComplete
}

/**
 * 準決勝情報フォームの完了状況をチェック
 */
export async function checkSemifinalsInfoCompletion(
  formData: Record<string, unknown>, 
  entryId?: string
): Promise<boolean> {
  console.log(`[SEMIFINALS INFO COMPLETION] === 準決勝情報完了チェック開始 ===`)
  console.log(`[SEMIFINALS INFO COMPLETION] 受信したformData:`, formData)
  console.log(`[SEMIFINALS INFO COMPLETION] entryId:`, entryId)

  // 基本必須フィールド
  const baseRequiredFields = [
    'music_change_from_preliminary', // 選択必須
    'work_title',
    'work_character_story',
    'copyright_permission',
    'music_title',
    'music_type',
    'music_data_path',
    // Sound Section
    'sound_start_timing',
    'chaser_song_designation',
    'fade_out_start_time',
    'fade_out_complete_time',
    // Lighting Section
    'dance_start_timing',
    'scene1_time',
    'scene1_trigger', 
    'scene1_color_type',
    'scene1_color_other',
    'scene1_image',
    'scene1_image_path',
    'chaser_exit_time',
    'chaser_exit_trigger',
    'chaser_exit_color_type', 
    'chaser_exit_color_other',
    'chaser_exit_image',
    'chaser_exit_image_path',
    // Choreographer Section
    'props_usage',
    // Bank Section
    'bank_name',
    'branch_name', 
    'account_type',
    'account_number',
    'account_holder'
  ]
  
  // 条件付き必須項目を追加
  const conditionallyRequired: string[] = []
  
  // JASRAC作品コード（市販楽曲の場合のみ必須）
  if (formData.copyright_permission === 'commercial') {
    conditionallyRequired.push('jasrac_code')
  }
  
  // チェイサー曲（必要な場合のみ必須）
  if (formData.chaser_song_designation === 'required') {
    conditionallyRequired.push('chaser_song')
  }
  
  // 小道具詳細（小道具ありの場合のみ必須）
  if (formData.props_usage === 'あり') {
    conditionallyRequired.push('props_details')
  }
  
  const allRequiredFields = [...baseRequiredFields, ...conditionallyRequired]
  
  console.log(`[SEMIFINALS INFO COMPLETION] 基本必須フィールド数: ${baseRequiredFields.length}`)
  console.log(`[SEMIFINALS INFO COMPLETION] 条件付き必須フィールド数: ${conditionallyRequired.length}`)
  console.log(`[SEMIFINALS INFO COMPLETION] 条件付き必須フィールド:`, conditionallyRequired)
  console.log(`[SEMIFINALS INFO COMPLETION] 全必須フィールド数: ${allRequiredFields.length}`)
  
  const { isComplete: fieldsComplete } = checkFormCompletion('SEMIFINALS INFO', formData, allRequiredFields)
  
  // 振込確認用紙のチェック
  let hasPaymentSlip = false
  if (entryId) {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: paymentSlipData, error: paymentSlipError } = await supabase
        .from('entry_files')
        .select('id')
        .eq('entry_id', entryId)
        .eq('purpose', 'semifinals_payment_slip')
        .maybeSingle()
      
      console.log(`[SEMIFINALS INFO COMPLETION] 振込確認用紙検索結果:`, paymentSlipData)
      console.log(`[SEMIFINALS INFO COMPLETION] 振込確認用紙検索エラー:`, paymentSlipError)
      
      hasPaymentSlip = !!paymentSlipData
    } catch (error) {
      console.log('[SEMIFINALS INFO COMPLETION] 振込確認用紙チェックエラー:', error)
      hasPaymentSlip = false
    }
  }
  
  const result = fieldsComplete && hasPaymentSlip
  
  console.log(`[SEMIFINALS INFO COMPLETION] === チェック結果まとめ ===`)
  console.log(`[SEMIFINALS INFO COMPLETION] フィールド完了: ${fieldsComplete}`)
  console.log(`[SEMIFINALS INFO COMPLETION] 振込確認用紙: ${hasPaymentSlip}`)
  console.log(`[SEMIFINALS INFO COMPLETION] 最終結果: ${result}`)
  console.log(`[SEMIFINALS INFO COMPLETION] === 準決勝情報完了チェック終了 ===`)
  
  return result
}

/**
 * プログラム情報フォームの完了状況をチェック
 */
export function checkProgramInfoCompletion(formData: Record<string, unknown>): boolean {
  // フォームの実際の必須項目
  const baseRequiredFields = [
    'player_photo_path',
    'semifinal_story'
  ]
  
  // 楽曲数による条件付き必須項目
  const allRequiredFields = [...baseRequiredFields]
  if (formData.song_count === '2曲') {
    allRequiredFields.push('final_story')
  }
  
  console.log(`[PROGRAM INFO CHECK] 楽曲数: ${formData.song_count}`)
  console.log(`[PROGRAM INFO CHECK] チェック対象フィールド:`, allRequiredFields)
  
  return allRequiredFields.every(field => {
    const value = formData[field]
    const isValid = !!(value && value.toString().trim() !== '')
    console.log(`[PROGRAM INFO CHECK] ${field}: "${value}" -> ${isValid}`)
    return isValid
  })
}

/**
 * 決勝情報フォームの完了状況をチェック
 * バリデーションルール（finalsValidation.ts）と完全一致させた条件付き必須チェック
 */
export function checkFinalsInfoCompletion(formData: Record<string, unknown>): boolean {
  console.log('[FINALS INFO COMPLETION] === 決勝情報完了チェック開始 ===')
  console.log('[FINALS INFO COMPLETION] 受信したformData:', formData)

  // 必須項目を動的に構築（バリデーションルールと完全一致）
  const requiredFields: string[] = []
  const missingFields: string[] = []
  let allSectionsValid = true

  // 1. 楽曲情報セクション
  console.log('[FINALS INFO COMPLETION] === 楽曲情報セクション ===')
  const musicChange = formData.music_change
  console.log('[FINALS INFO COMPLETION] music_change:', musicChange)
  
  if (!musicChange && musicChange !== false) {
    missingFields.push('楽曲情報の変更選択')
    allSectionsValid = false
  } else if (musicChange === true) {
    // 楽曲変更ありの場合のみ必須
    const musicRequiredFields = [
      'work_title', 'work_character_story', 'copyright_permission', 
      'music_title', 'music_type', 'music_data_path'
    ]
    
    musicRequiredFields.forEach(field => {
      const value = formData[field]
      if (!value || value.toString().trim() === '') {
        missingFields.push(field)
        allSectionsValid = false
      }
    })
    
    // JASRAC作品コードは市販楽曲選択時のみ必須
    if (formData.copyright_permission === 'commercial') {
      const jasracCode = formData.jasrac_code
      if (!jasracCode || jasracCode.toString().trim() === '') {
        missingFields.push('jasrac_code')
        allSectionsValid = false
      }
    }
    
    requiredFields.push(...musicRequiredFields)
  }

  // 2. 音響指示セクション  
  console.log('[FINALS INFO COMPLETION] === 音響指示セクション ===')
  const soundChange = formData.sound_change_from_semifinals
  console.log('[FINALS INFO COMPLETION] sound_change_from_semifinals:', soundChange)
  
  if (!soundChange && soundChange !== false) {
    missingFields.push('準決勝との音響指示選択')
    allSectionsValid = false
  } else if (soundChange === true) {
    // 音響指示変更ありの場合のみ必須
    const soundRequiredFields = [
      'sound_start_timing', 'chaser_song_designation', 
      'fade_out_start_time', 'fade_out_complete_time'
    ]
    
    soundRequiredFields.forEach(field => {
      const value = formData[field]
      if (!value || value.toString().trim() === '') {
        missingFields.push(field)
        allSectionsValid = false
      }
    })
    
    // チェイサー曲は「必要」選択時のみ必須
    if (formData.chaser_song_designation === '必要') {
      const chaserSong = formData.chaser_song
      if (!chaserSong || chaserSong.toString().trim() === '') {
        missingFields.push('chaser_song')
        allSectionsValid = false
      }
    }
    
    requiredFields.push(...soundRequiredFields)
  }

  // 3. 照明指示セクション
  console.log('[FINALS INFO COMPLETION] === 照明指示セクション ===')
  const lightingChange = formData.lighting_change_from_semifinals
  console.log('[FINALS INFO COMPLETION] lighting_change_from_semifinals:', lightingChange)
  
  if (!lightingChange && lightingChange !== false) {
    missingFields.push('準決勝との照明指示変更選択')
    allSectionsValid = false
  } else if (lightingChange === true) {
    // 照明指示変更ありの場合のみ必須
    const lightingRequiredFields = [
      'dance_start_timing',
      // シーン1必須項目
      'scene1_time', 'scene1_trigger', 'scene1_color_type', 
      'scene1_color_other', 'scene1_image', 'scene1_image_path',
      // チェイサー/退場必須項目  
      'chaser_exit_time', 'chaser_exit_trigger', 'chaser_exit_color_type',
      'chaser_exit_color_other', 'chaser_exit_image', 'chaser_exit_image_path'
    ]
    
    lightingRequiredFields.forEach(field => {
      const value = formData[field]
      if (!value || value.toString().trim() === '') {
        missingFields.push(field)
        allSectionsValid = false
      }
    })
    
    requiredFields.push(...lightingRequiredFields)
  }

  // 4. 振付師セクション
  console.log('[FINALS INFO COMPLETION] === 振付師セクション ===')
  const choreographerChange = formData.choreographer_change
  console.log('[FINALS INFO COMPLETION] choreographer_change:', choreographerChange)
  
  if (!choreographerChange && choreographerChange !== false) {
    missingFields.push('振付師の変更選択')
    allSectionsValid = false
  } else if (choreographerChange === true) {
    // 振付師変更ありの場合、振付師名が必須
    const choreographerName = formData.choreographer_name
    if (!choreographerName || choreographerName.toString().trim() === '') {
      missingFields.push('choreographer_name')
      allSectionsValid = false
    }
    requiredFields.push('choreographer_name')
  }
  
  // 小道具情報は常に必須
  const propsUsage = formData.props_usage
  if (!propsUsage) {
    missingFields.push('props_usage')
    allSectionsValid = false
  } else if (propsUsage === 'あり') {
    const propsDetails = formData.props_details
    if (!propsDetails || propsDetails.toString().trim() === '') {
      missingFields.push('props_details') 
      allSectionsValid = false
    }
    requiredFields.push('props_details')
  }
  
  // 振付師出席情報は常に必須
  const choreographerRequiredFields = [
    'choreographer_attendance', 'choreographer_photo_permission', 'choreographer_photo_path'
  ]
  
  choreographerRequiredFields.forEach(field => {
    const value = formData[field]
    if (!value || value.toString().trim() === '') {
      missingFields.push(field)
      allSectionsValid = false
    }
  })
  
  requiredFields.push('props_usage', ...choreographerRequiredFields)

  console.log('[FINALS INFO COMPLETION] === チェック結果まとめ ===')
  console.log('[FINALS INFO COMPLETION] 全必須フィールド数:', requiredFields.length)
  console.log('[FINALS INFO COMPLETION] 未入力フィールド数:', missingFields.length)
  console.log('[FINALS INFO COMPLETION] 未入力フィールド:', missingFields)
  console.log('[FINALS INFO COMPLETION] 全セクション有効:', allSectionsValid)
  console.log('[FINALS INFO COMPLETION] === 決勝情報完了チェック終了 ===')

  return allSectionsValid
}

/**
 * SNS情報フォームの完了状況をチェック
 */
export function checkSnsInfoCompletion(
  formData: Record<string, unknown>,
  hasPracticeVideo: boolean,
  hasIntroductionVideo: boolean
): boolean {
  // SNS情報は動画のアップロードが主要な要素
  return hasPracticeVideo && hasIntroductionVideo
}