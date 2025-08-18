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
    
    // フォームが完了している場合のみステータスを更新
    if (isFormComplete) {
      const statusField = `${tableName.replace('_info', '')}_info_status`
      
      console.log(`[STATUS UPDATE] ${tableName} - ${statusField} を「登録済み」に更新`)
      
      // basic_infoテーブルの場合
      if (tableName === 'basic_info') {
        // entriesテーブルのbasic_info_statusを更新
        const { error } = await supabase
          .from('entries')
          .update({ basic_info_status: '登録済み' })
          .eq('id', entryId)
        
        if (error) {
          console.error(`[STATUS UPDATE ERROR] ${tableName}:`, error)
        } else {
          console.log(`[STATUS UPDATE SUCCESS] ${tableName} ステータスを「登録済み」に更新`)
        }
      }
      // 他のフォームの場合は、将来的にステータスフィールドを追加可能
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
    'representative_name_furigana', 
    'dance_style',
    'category_division',
    'phone_number',
    'emergency_contact'
  ]
  
  // 必須フィールドの入力チェック
  const hasAllRequiredFields = requiredFields.every(field => {
    const value = formData[field]
    return value && value.toString().trim() !== ''
  })
  
  // 同意事項のチェック
  const hasAllAgreements = checkboxes.agreement_checked && 
    checkboxes.media_consent_checked && 
    checkboxes.privacy_policy_checked
  
  return hasAllRequiredFields && hasAllAgreements
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