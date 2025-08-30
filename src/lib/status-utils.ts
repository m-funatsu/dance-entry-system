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
    
    // 基本情報も他のフォームと同様にステータスを更新
    
    // ステータスを決定（申請情報は特別ロジック）
    let newStatus: string
    if (tableName === 'applications_info') {
      // 申請情報は申請あり/申請なしの2段階
      newStatus = hasAnyData ? '申請あり' : '申請なし'
    } else {
      // その他は3段階
      if (!hasAnyData) {
        newStatus = '未登録'
      } else if (isFormComplete) {
        newStatus = '登録済み'
      } else {
        newStatus = '入力中'
      }
    }
    
    console.log(`[STATUS UPDATE] ${tableName} - 新しいステータス: ${newStatus}`)
    
    const statusFieldMap: Record<string, string> = {
      'basic_info': 'basic_info_status',
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
  // フォームの必須項目（新しい要件に基づく）
  const requiredFields = [
    'work_title',
    'work_title_kana',
    'work_story',
    'music_title',
    'cd_title', // 常時必須に変更
    'artist', // 常時必須に変更
    'record_number', // 常時必須に変更
    'music_type',
    'music_rights_cleared',
    'choreographer1_name',
    'choreographer1_furigana'
    // jasrac_code は必須から除外
  ]
  
  const { isComplete } = checkFormCompletion('PRELIMINARY INFO', formData, requiredFields, hasVideo)
  return isComplete
}

/**
 * 準決勝情報フォームの完了状況をチェック
 */
export async function checkSemifinalsInfoCompletion(
  formData: Record<string, unknown>, 
  entryId?: string
): Promise<boolean> {
  console.log(`🔥🔥🔥 [SEMIFINALS INFO COMPLETION] === 準決勝情報完了チェック開始 === 🔥🔥🔥`)
  console.log(`🔥 [SEMIFINALS INFO COMPLETION] 受信したformData:`, formData)
  console.log(`🔥 [SEMIFINALS INFO COMPLETION] entryId:`, entryId)

  // 正しい必須項目のみ（ユーザー指定の完全なリスト）
  const baseRequiredFields = [
    // 楽曲情報セクション
    'music_change_from_preliminary',    // 予選との楽曲情報の変更
    'work_title',                       // 作品タイトル
    'work_title_kana',                  // 作品タイトル(ふりがな)
    'work_character_story',             // 作品キャラクター・ストーリー等（50字以内）
    'copyright_permission',             // 楽曲著作権許諾
    'music_title',                      // 使用楽曲タイトル
    'cd_title',                         // 収録アルバムタイトル
    'artist',                           // アーティスト
    'record_number',                    // レコード番号
    'music_type',                       // 楽曲種類
    'music_data_path',                  // 楽曲データ
    'sound_start_timing',               // 音楽スタートのタイミング（きっかけ、ポーズなど）
    'chaser_song_designation',          // チェイサー（退場）曲の指定
    'fade_out_start_time',              // フェードアウト開始時間
    'fade_out_complete_time',           // フェードアウト完了時間
    
    // 照明指示情報セクション
    'dance_start_timing',               // 準決勝 - 踊り出しタイミング ★追加
    'scene1_time',                      // シーン1 時間
    'scene1_trigger',                   // シーン1 きっかけ
    'scene1_color_type',                // シーン1 色・系統
    'scene1_color_other',               // シーン1 色・系統その他
    'scene1_image',                     // シーン1 イメージ
    'scene1_image_path',                // シーン1 イメージ画像
    'chaser_exit_time',                 // チェイサー/退場 時間
    'chaser_exit_trigger',              // チェイサー/退場 きっかけ
    'chaser_exit_color_type',           // チェイサー/退場 色・系統
    'chaser_exit_color_other',          // チェイサー/退場 色・系統その他
    'chaser_exit_image',                // チェイサー/退場 イメージ
    'chaser_exit_image_path',           // チェイサー/退場 イメージ画像
    
    // 振付師情報
    'choreographer_name',               // 振付師 氏名①
    'choreographer_name_kana',          // 振付師 氏名フリガナ①
    'props_usage',                      // 小道具の有無
    
    // 賞金振込先情報
    'bank_name',                        // 銀行名
    'branch_name',                      // 支店名
    'account_type',                     // 口座種類
    'account_number',                   // 口座番号
    'account_holder'                    // 口座名義
  ]
  
  // 条件付き必須項目を追加
  const conditionallyRequired: string[] = []
  
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
  
  const { isComplete: fieldsComplete, missingFields } = checkFormCompletion('SEMIFINALS INFO', formData, allRequiredFields)
  
  // 不足フィールドの詳細ログ
  console.log(`🔥 [SEMIFINALS INFO COMPLETION] === 不足フィールド詳細ログ === 🔥`)
  if (missingFields.length > 0) {
    console.log(`🔥 [SEMIFINALS INFO COMPLETION] ❌ 不足している必須フィールド (${missingFields.length}個):`, missingFields)
    missingFields.forEach(field => {
      const value = formData[field]
      console.log(`🔥 [SEMIFINALS INFO COMPLETION]   - ${field}: "${value}" (${typeof value})`)
    })
  } else {
    console.log(`🔥 [SEMIFINALS INFO COMPLETION] ✅ 全必須フィールド入力済み`)
  }
  
  // 必須ファイルのチェック
  let hasRequiredFiles = true
  if (entryId) {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      // 全ファイルを取得
      const { data: allFiles, error: filesError } = await supabase
        .from('entry_files')
        .select('*')
        .eq('entry_id', entryId)
      
      console.log(`[SEMIFINALS INFO COMPLETION] ファイル検索結果:`, allFiles)
      console.log(`[SEMIFINALS INFO COMPLETION] ファイル検索エラー:`, filesError)
      
      if (allFiles) {
        // 1. 振込確認用紙（必須）
        const hasPaymentSlip = allFiles.some(file => 
          file.purpose === 'payment_slip_path' || 
          file.purpose === 'semifinals_payment_slip' ||
          file.purpose === 'bank_slip' ||
          file.file_path?.includes('payment_slip') ||
          file.file_path?.includes('bank_slip')
        )
        console.log(`[SEMIFINALS INFO COMPLETION] 振込確認用紙: ${hasPaymentSlip}`)
        
        // 2. 楽曲データ（常に必須）
        const hasMusicData = allFiles.some(file => 
          (file.file_type === 'music' || file.file_type === 'audio') && 
          (file.purpose === 'music_data_path' || file.file_path?.includes('music_data_path'))
        )
        console.log(`[SEMIFINALS INFO COMPLETION] 楽曲データ（必須）: ${hasMusicData}`)
        
        // 3. シーン1イメージ画像（必須）
        const hasScene1Image = allFiles.some(file => 
          file.file_type === 'photo' && 
          (file.purpose === 'scene1_image_path' || file.file_path?.includes('scene1_image_path'))
        )
        console.log(`[SEMIFINALS INFO COMPLETION] シーン1イメージ画像: ${hasScene1Image}`)
        
        // 4. チェイサー/退場イメージ画像（必須）
        const hasChaserImage = allFiles.some(file => 
          file.file_type === 'photo' && 
          (file.purpose === 'chaser_exit_image_path' || file.file_path?.includes('chaser_exit_image_path'))
        )
        console.log(`[SEMIFINALS INFO COMPLETION] チェイサー/退場イメージ画像: ${hasChaserImage}`)
        
        // ファイル不足の詳細ログ
        console.log(`[SEMIFINALS INFO COMPLETION] === 必須ファイル詳細チェック ===`)
        const missingFiles: string[] = []
        if (!hasPaymentSlip) missingFiles.push('振込確認用紙')
        if (!hasMusicData) missingFiles.push('楽曲データ')
        if (!hasScene1Image) missingFiles.push('シーン1イメージ画像')
        if (!hasChaserImage) missingFiles.push('チェイサー/退場イメージ画像')
        
        if (missingFiles.length > 0) {
          console.log(`🔥 [SEMIFINALS INFO COMPLETION] ❌ 不足している必須ファイル (${missingFiles.length}個):`, missingFiles)
        } else {
          console.log(`🔥 [SEMIFINALS INFO COMPLETION] ✅ 全必須ファイルアップロード済み`)
        }
        
        hasRequiredFiles = hasPaymentSlip && hasMusicData && hasScene1Image && hasChaserImage
      } else {
        hasRequiredFiles = false
      }
    } catch (error) {
      console.log('[SEMIFINALS INFO COMPLETION] ファイルチェックエラー:', error)
      hasRequiredFiles = false
    }
  }
  
  // 全必須項目（フィールド + ファイル）の完了チェック
  const result = fieldsComplete && hasRequiredFiles
  
  console.log(`🔥🔥🔥 [SEMIFINALS INFO COMPLETION] === チェック結果まとめ === 🔥🔥🔥`)
  console.log(`🔥 [SEMIFINALS INFO COMPLETION] フィールド完了: ${fieldsComplete}`)
  console.log(`🔥 [SEMIFINALS INFO COMPLETION] ファイル完了: ${hasRequiredFiles}`)
  console.log(`🔥 [SEMIFINALS INFO COMPLETION] 最終結果: ${result}`)
  console.log(`🔥🔥🔥 [SEMIFINALS INFO COMPLETION] === 準決勝情報完了チェック終了 === 🔥🔥🔥`)
  
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
  
  // 楽曲情報の変更 * （必須選択）
  if (musicChange === null || musicChange === undefined) {
    missingFields.push('楽曲情報の変更選択')
    allSectionsValid = false
  } else if (musicChange === true) {
    // 楽曲変更ありの場合のみ以下が必須
    // 楽曲著作権許諾 * （条件付き必須）
    if (!formData.copyright_permission || formData.copyright_permission.toString().trim() === '') {
      missingFields.push('copyright_permission')
      allSectionsValid = false
    }
    
    // 楽曲データ * （条件付き必須）
    if (!formData.music_data_path || formData.music_data_path.toString().trim() === '') {
      missingFields.push('music_data_path')
      allSectionsValid = false
    }
    
    requiredFields.push('copyright_permission', 'music_data_path')
  }

  // 2. 音響指示セクション  
  console.log('[FINALS INFO COMPLETION] === 音響指示セクション ===')
  const soundChange = formData.sound_change_from_semifinals
  console.log('[FINALS INFO COMPLETION] sound_change_from_semifinals:', soundChange)
  
  // 準決勝との音響指示 * （必須選択）
  if (soundChange === null || soundChange === undefined) {
    missingFields.push('準決勝との音響指示選択')
    allSectionsValid = false
  }
  // 音響指示変更の場合、条件付き必須項目は現在なし（UIに*マークがない）

  // 3. 照明指示セクション
  console.log('[FINALS INFO COMPLETION] === 照明指示セクション ===')
  const lightingChange = formData.lighting_change_from_semifinals
  console.log('[FINALS INFO COMPLETION] lighting_change_from_semifinals:', lightingChange)
  
  // 準決勝との照明指示変更の有無 * （必須選択）
  if (lightingChange === null || lightingChange === undefined) {
    missingFields.push('準決勝との照明指示変更選択')
    allSectionsValid = false
  } else if (lightingChange === true) {
    // 照明指示変更ありの場合、シーン1とチェイサー/退場の項目が必須（*マーク付き）
    const lightingRequiredFields = [
      // シーン1必須項目（*マーク付き、lightingChangeOption === 'different'の場合）
      'scene1_time', 'scene1_trigger', 'scene1_color_type', 
      'scene1_color_other', 'scene1_image', 'scene1_image_path',
      // チェイサー/退場必須項目（*マーク付き、lightingChangeOption === 'different'の場合）
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
  
  // 振付師の変更 * （必須選択）
  if (choreographerChange === null || choreographerChange === undefined) {
    missingFields.push('振付師の変更選択')
    allSectionsValid = false
  }
  
  // 小道具の有無 * （常に必須）
  const propsUsage = formData.props_usage
  if (!propsUsage || propsUsage.toString().trim() === '') {
    missingFields.push('props_usage')
    allSectionsValid = false
  } else if (propsUsage === 'あり') {
    // 小道具詳細は条件付き必須
    const propsDetails = formData.props_details
    if (!propsDetails || propsDetails.toString().trim() === '') {
      missingFields.push('props_details')
      allSectionsValid = false
    }
  }
  
  // 作品振付師写真掲載 * （常に必須）
  const choreographerPhotoPermission = formData.choreographer_photo_permission
  if (!choreographerPhotoPermission || choreographerPhotoPermission.toString().trim() === '') {
    missingFields.push('choreographer_photo_permission')
    allSectionsValid = false
  }
  
  // 作品振付師写真 * （常に必須）
  const choreographerPhotoPath = formData.choreographer_photo_path
  if (!choreographerPhotoPath || choreographerPhotoPath.toString().trim() === '') {
    missingFields.push('choreographer_photo_path')
    allSectionsValid = false
  }
  
  requiredFields.push('props_usage', 'choreographer_photo_permission', 'choreographer_photo_path')

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
 * SNSInfoForm.tsxの必須項目と完全一致：
 * - 練習動画（約30秒）横長動画（*必須）
 * - 選手紹介・見どころ（30秒）（*必須）
 */
export function checkSnsInfoCompletion(
  formData: Record<string, unknown>,
  hasPracticeVideo: boolean,
  hasIntroductionVideo: boolean
): boolean {
  console.log(`[SNS INFO CHECK] === SNS情報完了チェック開始 ===`)
  console.log(`[SNS INFO CHECK] 受信したformData:`, formData)
  console.log(`[SNS INFO CHECK] 練習動画存在: ${hasPracticeVideo}`)
  console.log(`[SNS INFO CHECK] 紹介動画存在: ${hasIntroductionVideo}`)
  
  // SNS情報フォームでは動画アップロードが必須項目
  const result = hasPracticeVideo && hasIntroductionVideo
  
  console.log(`[SNS INFO CHECK] === チェック結果まとめ ===`)
  console.log(`[SNS INFO CHECK] 練習動画（必須）: ${hasPracticeVideo}`)
  console.log(`[SNS INFO CHECK] 紹介動画（必須）: ${hasIntroductionVideo}`)
  console.log(`[SNS INFO CHECK] 最終完了判定: ${result}`)
  console.log(`[SNS INFO CHECK] === SNS情報完了チェック終了 ===`)
  
  return result
}

/**
 * 申請情報フォームの完了状況をチェック
 * ApplicationsForm.tsxの必須項目と完全一致：
 * - 関係者チケット申請: 任意（申請がある場合は関係性と氏名が必要）
 * - 選手同伴申請: 任意（申請がある場合は氏名が必要）
 * - メイク・ヘアメイク申請（準決勝）: 条件付き必須
 *   - 申請者氏名（*必須 - メイク申請をする場合）
 *   - メールアドレス（*必須 - メイク申請をする場合）
 *   - ご連絡先電話番号（*必須 - メイク申請をする場合）
 * - 払込用紙: 条件付き必須（チケットや同伴申請がある場合）
 */
export function checkApplicationsInfoCompletion(
  formData: Record<string, unknown>
): boolean {
  console.log(`[APPLICATIONS INFO CHECK] === 申請情報完了チェック開始 ===`)
  console.log(`[APPLICATIONS INFO CHECK] 受信したformData:`, formData)
  
  // 何かひとつでもデータがあるかチェック
  const hasAnyData = !!(
    // 関係者チケット申請
    formData.related1_name || formData.related2_name || formData.related3_name ||
    formData.related4_name || formData.related5_name || formData.related_ticket_count ||
    // 選手同伴申請
    formData.companion1_name || formData.companion2_name || formData.companion3_name ||
    // メイク申請（準決勝）
    formData.makeup_name || formData.makeup_email || formData.makeup_phone ||
    formData.makeup_preferred_stylist || formData.makeup_notes ||
    // メイク申請（決勝）
    formData.makeup_name_final || formData.makeup_email_final || formData.makeup_phone_final ||
    formData.makeup_preferred_stylist_final || formData.makeup_notes_final
  )
  
  console.log(`[APPLICATIONS INFO CHECK] 何らかのデータ入力: ${hasAnyData}`)
  
  // データが何もない場合はfalse（申請なし）
  if (!hasAnyData) {
    console.log(`[APPLICATIONS INFO CHECK] データなし -> false`)
    return false
  }
  
  // データがある場合は、メイク申請の必須項目チェック
  let hasRequiredIssues = false
  const missingFields: string[] = []
  
  // メイク申請（準決勝）の条件付き必須チェック
  const hasMakeupApplication = !!(
    formData.makeup_name || formData.makeup_email || formData.makeup_phone ||
    formData.makeup_preferred_stylist || formData.makeup_notes
  )
  
  if (hasMakeupApplication) {
    console.log(`[APPLICATIONS INFO CHECK] === メイク申請（準決勝）必須項目チェック ===`)
    
    const makeupRequiredFields = ['makeup_name', 'makeup_email', 'makeup_phone']
    
    makeupRequiredFields.forEach(field => {
      const value = formData[field]
      const isValid = !!(value && value.toString().trim() !== '')
      console.log(`[APPLICATIONS INFO CHECK] ${field}: "${value}" -> ${isValid}`)
      
      if (!isValid) {
        hasRequiredIssues = true
        missingFields.push(field)
      }
    })
  }
  
  // メイク申請（決勝）の条件付き必須チェック
  const hasMakeupApplicationFinal = !!(
    formData.makeup_name_final || formData.makeup_email_final || formData.makeup_phone_final ||
    formData.makeup_preferred_stylist_final || formData.makeup_notes_final
  )
  
  if (hasMakeupApplicationFinal) {
    console.log(`[APPLICATIONS INFO CHECK] === メイク申請（決勝）必須項目チェック ===`)
    
    const makeupRequiredFields = ['makeup_name_final', 'makeup_email_final', 'makeup_phone_final']
    
    makeupRequiredFields.forEach(field => {
      const value = formData[field]
      const isValid = !!(value && value.toString().trim() !== '')
      console.log(`[APPLICATIONS INFO CHECK] ${field}: "${value}" -> ${isValid}`)
      
      if (!isValid) {
        hasRequiredIssues = true
        missingFields.push(field)
      }
    })
  }
  
  const result = !hasRequiredIssues
  
  console.log(`[APPLICATIONS INFO CHECK] === チェック結果まとめ ===`)
  console.log(`[APPLICATIONS INFO CHECK] データ存在: ${hasAnyData}`)
  console.log(`[APPLICATIONS INFO CHECK] 必須項目問題: ${hasRequiredIssues}`)
  console.log(`[APPLICATIONS INFO CHECK] 未入力フィールド:`, missingFields)
  console.log(`[APPLICATIONS INFO CHECK] 最終判定: ${result}`)
  console.log(`[APPLICATIONS INFO CHECK] === 申請情報完了チェック終了 ===`)
  
  return result
}