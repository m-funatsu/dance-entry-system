// 既存エントリーのステータスを正しい値に更新するスクリプト
// 新しく追加されたステータスカラムに適切な値を設定

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 環境変数が設定されていません')
  console.error('必要: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// 年齢計算関数
function calculateAge(birthdate) {
  if (!birthdate) return 999
  const today = new Date()
  const birth = new Date(birthdate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// 基本情報完了チェック
function checkBasicInfoCompletion(basicInfo) {
  if (!basicInfo) return false
  
  const baseRequiredFields = [
    'dance_style', 'category_division', 'representative_name', 'representative_furigana',
    'representative_romaji', 'representative_birthdate', 'representative_email', 'phone_number',
    'emergency_contact_name_1', 'emergency_contact_phone_1', 'partner_name', 'partner_furigana',
    'partner_romaji', 'partner_birthdate'
  ]
  
  const requiredFields = [...baseRequiredFields]
  
  // 年齢による動的必須チェック
  const repAge = basicInfo.representative_birthdate ? calculateAge(basicInfo.representative_birthdate) : 999
  const partnerAge = basicInfo.partner_birthdate ? calculateAge(basicInfo.partner_birthdate) : 999
  
  if (repAge < 18) {
    requiredFields.push('guardian_name', 'guardian_phone', 'guardian_email')
  }
  
  if (partnerAge < 18) {
    requiredFields.push('partner_guardian_name', 'partner_guardian_phone', 'partner_guardian_email')
  }
  
  // 必須フィールドチェック
  const hasAllRequiredFields = requiredFields.every(field => {
    const value = basicInfo[field]
    return value && value.toString().trim() !== ''
  })
  
  // 必須同意チェック
  const hasAllAgreements = ['agreement_checked', 'privacy_policy_checked', 'media_consent_checked'].every(field => {
    return basicInfo[field] === true
  })
  
  return hasAllRequiredFields && hasAllAgreements
}

// 予選情報完了チェック
function checkPreliminaryInfoCompletion(preliminaryInfo, hasVideo) {
  if (!preliminaryInfo || !hasVideo) return false
  
  const requiredFields = [
    'work_title', 'work_title_kana', 'work_story', 'music_title', 'cd_title',
    'artist', 'record_number', 'music_type', 'music_rights_cleared',
    'choreographer1_name', 'choreographer1_furigana'
  ]
  
  return requiredFields.every(field => {
    const value = preliminaryInfo[field]
    return value && value.toString().trim() !== ''
  })
}

// プログラム情報完了チェック
function checkProgramInfoCompletion(programInfo) {
  if (!programInfo) return false
  
  const requiredFields = ['player_photo_path', 'semifinal_story']
  
  if (programInfo.song_count === '2曲') {
    requiredFields.push('final_story')
  }
  
  return requiredFields.every(field => {
    const value = programInfo[field]
    return value && value.toString().trim() !== ''
  })
}

// 準決勝情報完了チェック（振込確認用紙も含む）
async function checkSemifinalsInfoCompletion(semifinalsInfo, entryId) {
  if (!semifinalsInfo) return false
  
  const requiredFields = [
    'music_change_from_preliminary', 'copyright_permission', 'chaser_song_designation',
    'scene1_time', 'scene1_trigger', 'scene1_color_type', 'scene1_color_other',
    'scene1_image', 'scene1_image_path', 'chaser_exit_time', 'chaser_exit_trigger',
    'chaser_exit_color_type', 'chaser_exit_color_other', 'chaser_exit_image',
    'chaser_exit_image_path', 'props_usage', 'bank_name', 'branch_name',
    'account_type', 'account_number', 'account_holder'
  ]
  
  const hasAllFields = requiredFields.every(field => {
    const value = semifinalsInfo[field]
    return value && value.toString().trim() !== ''
  })
  
  // 小道具詳細の条件付きチェック
  if (semifinalsInfo.props_usage === 'あり') {
    if (!semifinalsInfo.props_details || semifinalsInfo.props_details.toString().trim() === '') {
      return false
    }
  }
  
  // 振込確認用紙チェック
  const { data: paymentSlip } = await supabase
    .from('entry_files')
    .select('id')
    .eq('entry_id', entryId)
    .eq('purpose', 'semifinals_payment_slip')
    .maybeSingle()
  
  return hasAllFields && !!paymentSlip
}

// 決勝情報完了チェック
function checkFinalsInfoCompletion(finalsInfo) {
  if (!finalsInfo) return false
  
  let allValid = true
  
  // 楽曲情報の変更チェック
  if (finalsInfo.music_change === null || finalsInfo.music_change === undefined) {
    allValid = false
  } else if (finalsInfo.music_change === true) {
    const musicFields = ['copyright_permission', 'music_data_path']
    if (!musicFields.every(field => finalsInfo[field] && finalsInfo[field].toString().trim() !== '')) {
      allValid = false
    }
  }
  
  // 音響指示チェック
  if (finalsInfo.sound_change_from_semifinals === null || finalsInfo.sound_change_from_semifinals === undefined) {
    allValid = false
  }
  
  // 照明指示チェック
  if (finalsInfo.lighting_change_from_semifinals === null || finalsInfo.lighting_change_from_semifinals === undefined) {
    allValid = false
  } else if (finalsInfo.lighting_change_from_semifinals === true) {
    const lightingFields = [
      'scene1_time', 'scene1_trigger', 'scene1_color_type', 'scene1_color_other',
      'scene1_image', 'scene1_image_path', 'chaser_exit_time', 'chaser_exit_trigger',
      'chaser_exit_color_type', 'chaser_exit_color_other', 'chaser_exit_image', 'chaser_exit_image_path'
    ]
    if (!lightingFields.every(field => finalsInfo[field] && finalsInfo[field].toString().trim() !== '')) {
      allValid = false
    }
  }
  
  // 振付師チェック
  if (finalsInfo.choreographer_change === null || finalsInfo.choreographer_change === undefined) {
    allValid = false
  }
  
  // 小道具と振付師写真（常に必須）
  const alwaysRequiredFields = ['props_usage', 'choreographer_photo_permission', 'choreographer_photo_path']
  if (!alwaysRequiredFields.every(field => finalsInfo[field] && finalsInfo[field].toString().trim() !== '')) {
    allValid = false
  }
  
  // 小道具詳細の条件付きチェック
  if (finalsInfo.props_usage === 'あり') {
    if (!finalsInfo.props_details || finalsInfo.props_details.toString().trim() === '') {
      allValid = false
    }
  }
  
  return allValid
}

// SNS情報完了チェック
function checkSnsInfoCompletion(snsInfo, entryFiles) {
  if (!snsInfo) return false
  
  const practiceVideo = entryFiles.find(file => 
    file.file_type === 'video' && file.purpose === 'sns_practice_video'
  )
  const introVideo = entryFiles.find(file => 
    file.file_type === 'video' && file.purpose === 'sns_introduction_highlight'
  )
  
  return !!practiceVideo && !!introVideo
}

// メイン処理
async function updateExistingStatuses() {
  try {
    console.log('🚀 既存エントリーのステータス更新開始...')
    
    // 全エントリーと関連データを取得
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select(`
        id,
        basic_info_status,
        preliminary_info_status,
        program_info_status,
        semifinals_info_status,
        finals_info_status,
        sns_info_status,
        applications_info_status,
        basic_info(*),
        preliminary_info(*),
        program_info(*),
        semifinals_info(*),
        finals_info(*),
        sns_info(*),
        applications_info(*),
        entry_files(id, file_type, purpose)
      `)
    
    if (entriesError) {
      throw new Error(`エントリー取得エラー: ${entriesError.message}`)
    }
    
    console.log(`📊 処理対象エントリー数: ${entries.length}件`)
    
    let updatedCount = 0
    
    for (const entry of entries) {
      console.log(`\n🔍 エントリーID: ${entry.id} の処理開始`)
      
      const updates = {}
      
      // 基本情報ステータス
      if (entry.basic_info && entry.basic_info.length > 0) {
        const basicInfo = entry.basic_info[0]
        const isComplete = checkBasicInfoCompletion(basicInfo)
        updates.basic_info_status = isComplete ? '登録済み' : '入力中'
        console.log(`   基本情報: ${updates.basic_info_status}`)
      } else {
        updates.basic_info_status = '未登録'
        console.log(`   基本情報: 未登録`)
      }
      
      // 予選情報ステータス
      if (entry.preliminary_info && entry.preliminary_info.length > 0) {
        const preliminaryInfo = entry.preliminary_info[0]
        const hasVideo = entry.entry_files.some(file => 
          file.file_type === 'video' && file.purpose === 'preliminary'
        )
        const isComplete = checkPreliminaryInfoCompletion(preliminaryInfo, hasVideo)
        updates.preliminary_info_status = isComplete ? '登録済み' : '入力中'
        console.log(`   予選情報: ${updates.preliminary_info_status}`)
      } else {
        updates.preliminary_info_status = '未登録'
        console.log(`   予選情報: 未登録`)
      }
      
      // プログラム情報ステータス
      if (entry.program_info && entry.program_info.length > 0) {
        const programInfo = entry.program_info[0]
        const isComplete = checkProgramInfoCompletion(programInfo)
        updates.program_info_status = isComplete ? '登録済み' : '入力中'
        console.log(`   プログラム情報: ${updates.program_info_status}`)
      } else {
        updates.program_info_status = '未登録'
        console.log(`   プログラム情報: 未登録`)
      }
      
      // 準決勝情報ステータス
      if (entry.semifinals_info && entry.semifinals_info.length > 0) {
        const semifinalsInfo = entry.semifinals_info[0]
        const isComplete = await checkSemifinalsInfoCompletion(semifinalsInfo, entry.id)
        updates.semifinals_info_status = isComplete ? '登録済み' : '入力中'
        console.log(`   準決勝情報: ${updates.semifinals_info_status}`)
      } else {
        updates.semifinals_info_status = '未登録'
        console.log(`   準決勝情報: 未登録`)
      }
      
      // 決勝情報ステータス
      if (entry.finals_info && entry.finals_info.length > 0) {
        const finalsInfo = entry.finals_info[0]
        const isComplete = checkFinalsInfoCompletion(finalsInfo)
        updates.finals_info_status = isComplete ? '登録済み' : '入力中'
        console.log(`   決勝情報: ${updates.finals_info_status}`)
      } else {
        updates.finals_info_status = '未登録'
        console.log(`   決勝情報: 未登録`)
      }
      
      // SNS情報ステータス
      if (entry.sns_info && entry.sns_info.length > 0) {
        const snsInfo = entry.sns_info[0]
        const isComplete = checkSnsInfoCompletion(snsInfo, entry.entry_files)
        updates.sns_info_status = isComplete ? '登録済み' : '入力中'
        console.log(`   SNS情報: ${updates.sns_info_status}`)
      } else {
        updates.sns_info_status = '未登録'
        console.log(`   SNS情報: 未登録`)
      }
      
      // 申請情報ステータス
      if (entry.applications_info && entry.applications_info.length > 0) {
        updates.applications_info_status = '入力中' // 申請は常に「入力中」扱い
        console.log(`   申請情報: 入力中`)
      } else {
        updates.applications_info_status = '未登録'
        console.log(`   申請情報: 未登録`)
      }
      
      // エントリーを更新
      const { error: updateError } = await supabase
        .from('entries')
        .update(updates)
        .eq('id', entry.id)
      
      if (updateError) {
        console.error(`❌ エントリー ${entry.id} の更新エラー:`, updateError)
      } else {
        console.log(`✅ エントリー ${entry.id} を更新完了`)
        updatedCount++
      }
    }
    
    console.log(`\n🎉 処理完了: ${updatedCount}/${entries.length}件のエントリーを更新しました`)
    
  } catch (error) {
    console.error('💥 スクリプト実行エラー:', error)
    process.exit(1)
  }
}

// 実行
updateExistingStatuses()