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
  
  // 基本情報フォームに実際に存在する必須フィールドのみを使用
  const requiredFields = [
    'dance_style',
    'category_division',
    'representative_name',
    'representative_furigana',
    'representative_email',
    'partner_name',
    'partner_furigana',
    'phone_number',
    'real_name',
    'real_name_kana',
    'partner_real_name',
    'partner_real_name_kana',
    'emergency_contact_name_1',
    'emergency_contact_phone_1'
    // choreographer, choreographer_furiganaは基本情報フォームに存在しないため除外
  ]
  
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
  
  // ダッシュボードと同じ同意事項チェック - basic_infoテーブルのデータから判定
  const agreementResults = {
    agreement_checked: formData.agreement_checked || checkboxes.agreement_checked,
    privacy_policy_checked: formData.privacy_policy_checked || checkboxes.privacy_policy_checked
    // media_consent_checkedはダッシュボードでチェックしていない
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
  // 予選情報フォームに実際に存在する必須フィールドのみを使用
  const requiredFields = [
    'work_title',
    'work_title_kana', // 作品タイトルふりがな（必須だがチェックされていなかった）
    'work_story', // work_summaryではなくwork_story
    'music_title',
    'cd_title',
    'artist',
    'record_number',
    'jasrac_code',
    'choreographer1_name',
    'choreographer1_furigana'
    // choreographer2は任意項目のため除外
  ]
  
  const { isComplete } = checkFormCompletion('PRELIMINARY INFO', formData, requiredFields, hasVideo)
  return isComplete
}

/**
 * 準決勝情報フォームの完了状況をチェック
 */
export function checkSemifinalsInfoCompletion(formData: Record<string, unknown>): boolean {
  // 準決勝情報フォームに実際に存在する必須フィールドのみを使用
  const requiredFields = [
    'work_title',
    'work_character_story', // work_summaryではなく実際のフィールド名
    'music_title',
    'cd_title',
    'artist',
    'record_number',
    'jasrac_code',
    'music_type',
    'copyright_permission'
    // choreographer関連は準決勝では変更可能で、基本的にはコピーされるため一旦除外
  ]
  
  const { isComplete } = checkFormCompletion('SEMIFINALS INFO', formData, requiredFields)
  return isComplete
}

/**
 * プログラム情報フォームの完了状況をチェック
 */
export function checkProgramInfoCompletion(formData: Record<string, unknown>): boolean {
  const requiredFields = [
    'player_name',
    'player_name_furigana'
  ]
  
  return requiredFields.every(field => {
    const value = formData[field]
    return value && value.toString().trim() !== ''
  })
}

/**
 * 決勝情報フォームの完了状況をチェック
 */
export function checkFinalsInfoCompletion(formData: Record<string, unknown>): boolean {
  // 決勝情報フォームに実際に存在する必須フィールドのみを使用
  const requiredFields = [
    'work_title',
    'work_character_story', // work_summaryではなく実際のフィールド名
    'music_title',
    'cd_title',
    'artist',
    'record_number',
    'jasrac_code',
    'music_type',
    'copyright_permission'
    // choreographer関連は決勝でも変更可能で、基本的にはコピーされるため一旦除外
  ]
  
  const { isComplete } = checkFormCompletion('FINALS INFO', formData, requiredFields)
  return isComplete
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