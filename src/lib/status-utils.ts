import { createClient } from '@/lib/supabase/client'

/**
 * フォームのステータスを更新する関数
 * 必須項目がすべて入力されている場合は「登録済み」に変更
 */
export async function updateFormStatus(
  tableName: string,
  entryId: string,
  isFormComplete: boolean
) {
  try {
    const supabase = createClient()
    
    console.log(`[STATUS UPDATE] ${tableName} - エントリーID: ${entryId}, 完了状況: ${isFormComplete}`)
    
    // フォームが完了している場合のみステータスを更新
    if (isFormComplete) {
      // 各フォームのステータスフィールドを更新
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
      
      console.log(`[STATUS UPDATE] ${tableName} - ${statusFieldName} を「登録済み」に更新`)
      
      if (statusFieldName) {
        // entriesテーブルの該当ステータスフィールドを更新
        const updateData = { [statusFieldName]: '登録済み' }
        
        const { data, error } = await supabase
          .from('entries')
          .update(updateData)
          .eq('id', entryId)
          .select()
        
        if (error) {
          console.error(`[STATUS UPDATE ERROR] ${tableName}:`, error)
        } else {
          console.log(`[STATUS UPDATE SUCCESS] ${tableName} ${statusFieldName}を「登録済み」に更新完了`, data)
        }
      } else {
        console.warn(`[STATUS UPDATE WARNING] ${tableName} に対応するステータスフィールドが見つかりません`)
      }
    } else {
      console.log(`[STATUS UPDATE] ${tableName} - フォーム未完了のためステータス更新をスキップ`)
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
  const requiredFields = [
    'representative_name',
    'representative_furigana', 
    'dance_style',
    'category_division',
    'phone_number',
    'emergency_contact'
  ]
  
  // 必須フィールドの入力チェック
  const hasAllRequiredFields = requiredFields.every(field => {
    const value = formData[field]
    const isValid = value && value.toString().trim() !== ''
    console.log(`[BASIC INFO CHECK] ${field}: "${value}" -> ${isValid}`)
    return isValid
  })
  
  // 同意事項のチェック
  const hasAllAgreements = checkboxes.agreement_checked && 
    checkboxes.media_consent_checked && 
    checkboxes.privacy_policy_checked
  
  const result = hasAllRequiredFields && hasAllAgreements
  console.log(`[BASIC INFO CHECK] フィールド完了: ${hasAllRequiredFields}, 同意事項完了: ${hasAllAgreements}, 最終結果: ${result}`)
  
  return result
}

/**
 * 予選情報フォームの完了状況をチェック
 */
export function checkPreliminaryInfoCompletion(
  formData: Record<string, unknown>,
  hasVideo: boolean
): boolean {
  const requiredFields = [
    'work_title',
    'work_summary',
    'choreographer1_name',
    'choreographer1_furigana'
  ]
  
  const hasAllRequiredFields = requiredFields.every(field => {
    const value = formData[field]
    return value && value.toString().trim() !== ''
  })
  
  return hasAllRequiredFields && hasVideo
}

/**
 * 準決勝情報フォームの完了状況をチェック
 */
export function checkSemifinalsInfoCompletion(formData: Record<string, unknown>): boolean {
  const requiredFields = [
    'choreographer1_name',
    'choreographer1_furigana',
    'work_title',
    'work_summary',
    'music_title',
    'copyright_permission'
  ]
  
  return requiredFields.every(field => {
    const value = formData[field]
    return value && value.toString().trim() !== ''
  })
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
  const requiredFields = [
    'choreographer1_name',
    'choreographer1_furigana',
    'work_title',
    'work_summary',
    'music_title',
    'copyright_permission'
  ]
  
  return requiredFields.every(field => {
    const value = formData[field]
    return value && value.toString().trim() !== ''
  })
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