import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { EntryFile } from '@/lib/types'
import Link from 'next/link'
import MessageAlert from '@/components/MessageAlert'
import BackgroundLoader from '@/components/BackgroundLoader'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import EditButton from '@/components/dashboard/EditButton'
import URLCleaner from '@/components/URLCleaner'
import SiteTitle from '@/components/SiteTitle'
import { StartDateInline } from '@/components/dashboard/StartDateInline'
import FilePreview from '@/components/FilePreview'

// Dynamic renderingを強制（cookiesやauth使用のため）
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!userProfile) {
    redirect('/auth/login')
  }

  if (userProfile.role === 'admin') {
    redirect('/admin/dashboard')
  }

  try {

  // エントリー情報の取得（最新のエントリー）
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const entry = entries && entries.length > 0 ? entries[0] : null

  // 基本情報の取得
  let basicInfo = null
  if (entry) {
    const { data } = await supabase
      .from('basic_info')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle()
    
    basicInfo = data
  }

  // 予選情報の取得
  let preliminaryInfo = null
  if (entry) {
    const { data } = await supabase
      .from('preliminary_info')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle()
    
    preliminaryInfo = data
  }

  // プログラム掲載用情報の取得
  let programInfo = null
  if (entry) {
    const { data } = await supabase
      .from('program_info')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle()
    
    programInfo = data
  }

  // 準決勝情報の取得
  let semifinalsInfo = null
  if (entry) {
    const { data } = await supabase
      .from('semifinals_info')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle()
    
    semifinalsInfo = data
  }

  // 決勝情報の取得
  let finalsInfo = null
  if (entry) {
    const { data } = await supabase
      .from('finals_info')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle()
    
    finalsInfo = data
  }

  // SNS情報の取得
  let snsInfo = null
  let practiceVideo: EntryFile | null = null
  let introductionVideo: EntryFile | null = null
  if (entry) {
    const { data, error } = await supabase
      .from('sns_info')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle()
    
    if (error) {
      console.error('SNS情報取得エラー:', error)
    }
    
    snsInfo = data
    
    // SNS動画ファイルの確認
    const { data: snsFiles, error: filesError } = await supabase
      .from('entry_files')
      .select('*')
      .eq('entry_id', entry.id)
      .in('purpose', ['sns_practice_video', 'sns_introduction_highlight'])
      .eq('file_type', 'video')
    
    if (filesError) {
      console.error('SNSファイル取得エラー:', filesError)
    }
    
    if (snsFiles) {
      practiceVideo = (snsFiles.find(file => file.purpose === 'sns_practice_video') as EntryFile) || null
      introductionVideo = (snsFiles.find(file => file.purpose === 'sns_introduction_highlight') as EntryFile) || null
    }
  }

  // 各種申請情報の取得
  let applicationsInfo = null
  if (entry) {
    const { data } = await supabase
      .from('applications_info')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle()
    
    applicationsInfo = data
  }


  // プログラム掲載用情報の完了判定関数
  const checkProgramInfoComplete = (programInfo: { [key: string]: unknown } | null) => {
    if (!programInfo) return false
    
    // フォームの実際の必須項目のみ
    const requiredFields = [
      'player_photo_path',
      'semifinal_story'
    ]
    
    // 楽曲数による条件付き必須項目
    if (programInfo['song_count'] === '2曲') {
      requiredFields.push('final_story')
    }
    
    return requiredFields.every(field => {
      const value = programInfo[field]
      return value && value.toString().trim() !== ''
    })
  }

  // ファイル情報の取得
  const fileStats = { music: 0, video: 0, photo: 0, preliminaryVideo: 0 }
  let preliminaryVideoFile: EntryFile | null = null
  if (entry) {
    const { data: files } = await supabase
      .from('entry_files')
      .select('*')
      .eq('entry_id', entry.id)

    if (files) {
      files.forEach(file => {
        if (file.file_type === 'music') fileStats.music++
        else if (file.file_type === 'video') {
          fileStats.video++
          if (file.purpose === 'preliminary') {
            fileStats.preliminaryVideo++
            preliminaryVideoFile = file as EntryFile
          }
        }
        else if (file.file_type === 'photo') fileStats.photo++
      })
    }
  }

  // 必須項目のチェック関数
  const checkBasicInfoComplete = (basicInfo: { [key: string]: unknown } | null) => {
    if (!basicInfo) return false
    
    // 基本必須フィールド（フォームのvalidationRulesと一致）
    const baseRequiredFields = [
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
    
    // 年齢による動的必須チェック
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

    const requiredFields = [...baseRequiredFields]
    
    // 代表者18歳未満の場合、保護者情報を必須に追加
    const repAge = basicInfo.representative_birthdate ? calculateAge(basicInfo.representative_birthdate as string) : 999
    if (repAge < 18) {
      requiredFields.push('guardian_name', 'guardian_phone', 'guardian_email')
    }
    
    // パートナー18歳未満の場合、保護者情報を必須に追加  
    const partnerAge = basicInfo.partner_birthdate ? calculateAge(basicInfo.partner_birthdate as string) : 999
    if (partnerAge < 18) {
      requiredFields.push('partner_guardian_name', 'partner_guardian_phone', 'partner_guardian_email')
    }

    // 必須同意チェックボックス
    const requiredAgreements = [
      'agreement_checked',
      'privacy_policy_checked',
      'media_consent_checked'
    ]
    
    // 必須フィールドのチェック
    const hasAllRequiredFields = requiredFields.every(field => {
      const value = basicInfo[field]
      return value && value.toString().trim() !== ''
    })
    
    // 必須同意のチェック
    const hasAllAgreements = requiredAgreements.every(field => {
      const value = basicInfo[field]
      return value === true
    })
    
    return hasAllRequiredFields && hasAllAgreements
  }

  const checkPreliminaryInfoComplete = (preliminaryInfo: { [key: string]: unknown } | null, hasVideo: boolean) => {
    if (!preliminaryInfo) return false
    if (!hasVideo) return false
    
    // 予選フォームの*マーク付き必須項目
    const requiredFields = [
      'work_title',              // 作品タイトル *
      'work_title_kana',         // 作品タイトルかな *
      'work_story',              // 作品ストーリー *
      'music_title',             // 楽曲タイトル *
      'cd_title',                // CDタイトル *
      'artist',                  // アーティスト *
      'record_number',           // レコード番号 *
      'music_type',              // 楽曲種類 *
      'music_rights_cleared',    // 楽曲著作権許可 *
      'choreographer1_name',     // 振付師1氏名 *
      'choreographer1_furigana'  // 振付師1フリガナ *
      // 予選提出動画はhasVideoパラメータでチェック
      // jasrac_code は任意項目
    ]
    
    return requiredFields.every(field => {
      const value = preliminaryInfo[field]
      return value && value.toString().trim() !== ''
    })
  }

  // 準決勝情報の完了判定関数
  const checkSemifinalsInfoComplete = (semifinalsInfo: { [key: string]: unknown } | null) => {
    if (!semifinalsInfo) return false
    
    console.log('[DASHBOARD SEMIFINALS CHECK] === 準決勝情報完了チェック（ダッシュボード）===')
    console.log('[DASHBOARD SEMIFINALS CHECK] semifinalsInfo:', semifinalsInfo)
    
    // *マークのついた必須項目すべて
    const baseRequiredFields = [
      // 音響指示情報
      'sound_start_timing',      // 音楽スタートのタイミング *
      'chaser_song_designation', // チェイサー曲の指定 *
      'fade_out_start_time',     // フェードアウト開始時間 *
      'fade_out_complete_time',  // フェードアウト完了時間 *
      // 照明指示情報 
      'dance_start_timing',      // 踊り出しタイミング *
      'scene1_time',             // シーン1時間 *
      'scene1_trigger',          // シーン1きっかけ *
      'scene1_color_type',       // シーン1色系統 *
      'scene1_color_other',      // シーン1色その他 *
      'scene1_image',            // シーン1イメージ *
      'scene1_image_path',       // シーン1イメージ画像 *
      'chaser_exit_time',        // チェイサー時間 *
      'chaser_exit_trigger',     // チェイサーきっかけ *
      'chaser_exit_color_type',  // チェイサー色系統 *
      'chaser_exit_color_other', // チェイサー色その他 *
      'chaser_exit_image',       // チェイサーイメージ *
      'chaser_exit_image_path',  // チェイサーイメージ画像 *
      // 振付情報
      'choreographer_name',      // 振付師氏名① *
      'choreographer_furigana',  // 振付師フリガナ① *
      'props_usage',             // 小道具の有無 *
      // 賞金振込先情報（全て必須）
      'bank_name',
      'branch_name', 
      'account_type',
      'account_number',
      'account_holder'
    ]
    
    // 1. music_change_from_preliminary の選択チェック（boolean値として必須）
    const musicChangeSelected = semifinalsInfo.music_change_from_preliminary !== null && 
                               semifinalsInfo.music_change_from_preliminary !== undefined
    
    console.log('[DASHBOARD SEMIFINALS CHECK] 楽曲変更選択:', musicChangeSelected, semifinalsInfo.music_change_from_preliminary)
    
    if (!musicChangeSelected) {
      console.log('[DASHBOARD SEMIFINALS CHECK] === 楽曲変更の選択が未完了 ===')
      return false
    }
    
    // 2. copyright_permission のチェック（必須） 
    const copyrightPermissionValid = !!(semifinalsInfo.copyright_permission && 
                                       semifinalsInfo.copyright_permission.toString().trim() !== '')
    
    console.log('[DASHBOARD SEMIFINALS CHECK] 楽曲著作権許可:', copyrightPermissionValid, semifinalsInfo.copyright_permission)
    
    if (!copyrightPermissionValid) {
      console.log('[DASHBOARD SEMIFINALS CHECK] === 楽曲著作権許可が未完了 ===')
      return false
    }
    
    // 3. 基本必須フィールドチェック
    const fieldResults: Record<string, boolean> = {}
    const missingFields: string[] = []
    
    baseRequiredFields.forEach(field => {
      const value = semifinalsInfo[field]
      const isValid = !!(value && value.toString().trim() !== '')
      
      fieldResults[field] = isValid
      console.log(`[DASHBOARD SEMIFINALS CHECK] ${field}: "${value}" -> ${isValid}`)
      
      if (!isValid) {
        missingFields.push(field)
      }
    })
    
    // 4. 条件付き必須項目のチェック
    // 小道具詳細（props_usageが「あり」の場合のみ必須）
    if (semifinalsInfo.props_usage === 'あり') {
      const propsDetailsValid = !!(semifinalsInfo.props_details && 
                                 semifinalsInfo.props_details.toString().trim() !== '')
      if (!propsDetailsValid) {
        missingFields.push('props_details')
        fieldResults['props_details'] = false
        console.log('[DASHBOARD SEMIFINALS CHECK] props_details: 小道具ありのため詳細が必須')
      }
    }
    
    const hasAllRequiredFields = Object.values(fieldResults).every(result => result === true) && 
                                missingFields.length === 0
    
    console.log('[DASHBOARD SEMIFINALS CHECK] === チェック結果まとめ ===')
    console.log('[DASHBOARD SEMIFINALS CHECK] 楽曲変更選択:', musicChangeSelected)
    console.log('[DASHBOARD SEMIFINALS CHECK] 楽曲著作権許可:', copyrightPermissionValid)
    console.log('[DASHBOARD SEMIFINALS CHECK] 基本必須フィールド完了:', hasAllRequiredFields)
    console.log('[DASHBOARD SEMIFINALS CHECK] 未入力フィールド数:', missingFields.length)
    console.log('[DASHBOARD SEMIFINALS CHECK] 未入力フィールド:', missingFields)
    console.log('[DASHBOARD SEMIFINALS CHECK] === 準決勝情報完了チェック終了（ダッシュボード）===')
    
    return musicChangeSelected && copyrightPermissionValid && hasAllRequiredFields
  }

  // 決勝情報の完了判定関数
  const checkFinalsInfoComplete = (finalsInfo: { [key: string]: unknown } | null) => {
    if (!finalsInfo) return false
    
    console.log('[DASHBOARD FINALS CHECK] === 決勝情報完了チェック（ダッシュボード）===')
    console.log('[DASHBOARD FINALS CHECK] finalsInfo:', finalsInfo)
    
    // status-utils.tsのcheckFinalsInfoCompletionと同じロジックを使用
    let allSectionsValid = true
    const missingFields: string[] = []

    // 1. 楽曲情報セクション
    const musicChange = finalsInfo.music_change
    if (!musicChange && musicChange !== false) {
      missingFields.push('楽曲情報の変更選択')
      allSectionsValid = false
    } else if (musicChange === true) {
      const musicRequiredFields = [
        'work_title', 'work_character_story', 'copyright_permission', 
        'music_title', 'music_type', 'music_data_path'
      ]
      
      musicRequiredFields.forEach(field => {
        const value = finalsInfo[field]
        if (!value || value.toString().trim() === '') {
          missingFields.push(field)
          allSectionsValid = false
        }
      })
      
      if (finalsInfo.copyright_permission === 'commercial') {
        const jasracCode = finalsInfo.jasrac_code
        if (!jasracCode || jasracCode.toString().trim() === '') {
          missingFields.push('jasrac_code')
          allSectionsValid = false
        }
      }
    }

    // 2. 音響指示セクション
    const soundChange = finalsInfo.sound_change_from_semifinals
    if (!soundChange && soundChange !== false) {
      missingFields.push('準決勝との音響指示選択')
      allSectionsValid = false
    } else if (soundChange === true) {
      const soundRequiredFields = [
        'sound_start_timing', 'chaser_song_designation', 
        'fade_out_start_time', 'fade_out_complete_time'
      ]
      
      soundRequiredFields.forEach(field => {
        const value = finalsInfo[field]
        if (!value || value.toString().trim() === '') {
          missingFields.push(field)
          allSectionsValid = false
        }
      })
      
      if (finalsInfo.chaser_song_designation === '必要') {
        const chaserSong = finalsInfo.chaser_song
        if (!chaserSong || chaserSong.toString().trim() === '') {
          missingFields.push('chaser_song')
          allSectionsValid = false
        }
      }
    }

    // 3. 照明指示セクション
    const lightingChange = finalsInfo.lighting_change_from_semifinals
    if (!lightingChange && lightingChange !== false) {
      missingFields.push('準決勝との照明指示変更選択')
      allSectionsValid = false
    } else if (lightingChange === true) {
      const lightingRequiredFields = [
        'dance_start_timing',
        'scene1_time', 'scene1_trigger', 'scene1_color_type', 
        'scene1_color_other', 'scene1_image', 'scene1_image_path',
        'chaser_exit_time', 'chaser_exit_trigger', 'chaser_exit_color_type',
        'chaser_exit_color_other', 'chaser_exit_image', 'chaser_exit_image_path'
      ]
      
      lightingRequiredFields.forEach(field => {
        const value = finalsInfo[field]
        if (!value || value.toString().trim() === '') {
          missingFields.push(field)
          allSectionsValid = false
        }
      })
    }

    // 4. 振付師セクション
    const choreographerChange = finalsInfo.choreographer_change
    if (choreographerChange === null || choreographerChange === undefined) {
      missingFields.push('振付師の変更選択')
      allSectionsValid = false
    } else if (choreographerChange === true) {
      const choreographerName = finalsInfo.choreographer_name
      if (!choreographerName || choreographerName.toString().trim() === '') {
        missingFields.push('choreographer_name')
        allSectionsValid = false
      }
    }
    
    // 5. 小道具情報は常に必須
    const propsUsage = finalsInfo.props_usage
    if (!propsUsage || propsUsage.toString().trim() === '') {
      missingFields.push('props_usage')
      allSectionsValid = false
    } else if (propsUsage === 'あり') {
      const propsDetails = finalsInfo.props_details
      if (!propsDetails || propsDetails.toString().trim() === '') {
        missingFields.push('props_details')
        allSectionsValid = false
      }
    }
    
    // 6. 振付師出席情報は常に必須（写真は条件付き）
    const choreographerAttendance = finalsInfo.choreographer_attendance
    const choreographerPhotoPermission = finalsInfo.choreographer_photo_permission
    
    if (!choreographerAttendance || choreographerAttendance.toString().trim() === '') {
      missingFields.push('choreographer_attendance')
      allSectionsValid = false
    }
    
    if (!choreographerPhotoPermission || choreographerPhotoPermission.toString().trim() === '') {
      missingFields.push('choreographer_photo_permission')
      allSectionsValid = false
    }
    
    // 振付師写真は写真許可が「許可する」の場合のみ必須
    if (choreographerPhotoPermission === '許可する') {
      const choreographerPhotoPath = finalsInfo.choreographer_photo_path
      if (!choreographerPhotoPath || choreographerPhotoPath.toString().trim() === '') {
        missingFields.push('choreographer_photo_path')
        allSectionsValid = false
      }
    }

    console.log('[DASHBOARD FINALS CHECK] === チェック結果まとめ ===')
    console.log('[DASHBOARD FINALS CHECK] 全セクション有効:', allSectionsValid)
    console.log('[DASHBOARD FINALS CHECK] 未入力フィールド数:', missingFields.length)
    console.log('[DASHBOARD FINALS CHECK] 未入力フィールド:', missingFields)
    console.log('[DASHBOARD FINALS CHECK] === 決勝情報完了チェック終了（ダッシュボード）===')
    
    return allSectionsValid
  }

  const checkSnsInfoComplete = (snsInfo: { [key: string]: unknown } | null, practiceVideo: EntryFile | null, introductionVideo: EntryFile | null) => {
    console.log('[DASHBOARD SNS CHECK] === SNS情報完了チェック（ダッシュボード）===')
    console.log('[DASHBOARD SNS CHECK] snsInfo:', !!snsInfo)
    console.log('[DASHBOARD SNS CHECK] 練習動画:', !!practiceVideo)
    console.log('[DASHBOARD SNS CHECK] 紹介動画:', !!introductionVideo)
    
    // SNSInfoForm.tsxの必須項目と完全一致：
    // - 練習動画（約30秒）横長動画（*必須）
    // - 選手紹介・見どころ（30秒）（*必須）
    const hasPracticeVideo = !!practiceVideo
    const hasIntroductionVideo = !!introductionVideo
    
    const result = hasPracticeVideo && hasIntroductionVideo
    
    console.log('[DASHBOARD SNS CHECK] === チェック結果まとめ ===')
    console.log('[DASHBOARD SNS CHECK] 練習動画（必須）:', hasPracticeVideo)
    console.log('[DASHBOARD SNS CHECK] 紹介動画（必須）:', hasIntroductionVideo)
    console.log('[DASHBOARD SNS CHECK] 最終完了判定:', result)
    console.log('[DASHBOARD SNS CHECK] === SNS情報完了チェック終了（ダッシュボード）===')
    
    return result
  }

  // 各種申請の完了判定関数（必須項目なし）
  const checkApplicationsInfoComplete = (applicationsInfo: { [key: string]: unknown } | null) => {
    console.log('[DASHBOARD APPLICATIONS CHECK] === 申請情報完了チェック（ダッシュボード）===')
    console.log('[DASHBOARD APPLICATIONS CHECK] applicationsInfo:', !!applicationsInfo)
    
    if (!applicationsInfo) {
      console.log('[DASHBOARD APPLICATIONS CHECK] applications_infoなし: false（申請なし）')
      console.log('[DASHBOARD APPLICATIONS CHECK] === 申請情報完了チェック終了（ダッシュボード）===')
      return false
    }
    
    // 何かひとつでもデータがあるかチェック（必須項目なしのため、任意項目のみ）
    const hasAnyData = !!(
      // 関係者チケット申請（任意）
      applicationsInfo.related1_name || applicationsInfo.related2_name || applicationsInfo.related3_name ||
      applicationsInfo.related4_name || applicationsInfo.related5_name || applicationsInfo.related_ticket_count ||
      // 選手同伴申請（任意）
      applicationsInfo.companion1_name || applicationsInfo.companion2_name || applicationsInfo.companion3_name ||
      // メイク申請（準決勝）（任意）
      applicationsInfo.makeup_name || applicationsInfo.makeup_email || applicationsInfo.makeup_phone ||
      applicationsInfo.makeup_preferred_stylist || applicationsInfo.makeup_notes ||
      // メイク申請（決勝）（任意）
      applicationsInfo.makeup_name_final || applicationsInfo.makeup_email_final || applicationsInfo.makeup_phone_final ||
      applicationsInfo.makeup_preferred_stylist_final || applicationsInfo.makeup_notes_final
    )
    
    console.log('[DASHBOARD APPLICATIONS CHECK] 何らかのデータ入力:', hasAnyData)
    
    // 必須項目なしのため、データがある場合は常に「申請あり」状態
    const result = hasAnyData
    
    console.log('[DASHBOARD APPLICATIONS CHECK] === チェック結果まとめ ===')
    console.log('[DASHBOARD APPLICATIONS CHECK] データ入力有無:', hasAnyData)
    console.log('[DASHBOARD APPLICATIONS CHECK] 最終判定:', result, '（必須項目なしのためデータあり=申請あり）')
    console.log('[DASHBOARD APPLICATIONS CHECK] === 申請情報完了チェック終了（ダッシュボード）===')
    
    return result
  }


  // システム設定から期限を取得
  const { data: settings } = await supabase
    .from('settings')
    .select('*')

  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>) || {}

  // 期限情報を取得して表示用に整形
  const getDeadlineInfo = (deadline: string | null) => {
    if (!deadline || deadline === '') return null
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // 期限をフォーマット（日本時間で表示）
    const formattedDate = deadlineDate.toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return {
      date: formattedDate,
      daysLeft: diffDays,
      isExpired: diffDays < 0,
      isUrgent: diffDays >= 0 && diffDays <= 3
    }
  }

  // 期限チェック機能
  const isFormEditable = (deadlineKey: string) => {
    const deadline = getDeadlineInfo(settingsMap[deadlineKey])
    return !deadline || !deadline.isExpired
  }

  return (
    <>
      <URLCleaner />
      <BackgroundLoader pageType="dashboard" />
      <div className="min-h-screen bg-gray-50" style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), var(--dashboard-bg-image, none)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
      <DashboardHeader user={user} showDefaultTitle={true}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              <SiteTitle fallback="2025 バルカーカップ" />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              ようこそ、{userProfile.name}さん
            </span>
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </DashboardHeader>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="px-4 py-6 sm:px-0">
          <Suspense fallback={null}>
            <MessageAlert />
          </Suspense>
          
          {/* 選考状況セクション（スリム版） */}
          {!userProfile.has_seed && entry && (
            <div className="mb-6">
              <div className={`border-l-4 bg-white shadow rounded-lg p-4 ${
                entry.status === 'selected' ? 'border-green-500' :
                entry.status === 'rejected' ? 'border-red-500' :
                entry.status === 'submitted' ? 'border-blue-500' :
                'border-yellow-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">選考状況</h3>
                    <div className="mt-1 flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === 'selected' ? 'bg-green-100 text-green-800' :
                        entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        entry.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status === 'pending' && '審査待ち'}
                        {entry.status === 'submitted' && '提出済み'}
                        {entry.status === 'selected' && '選考通過'}
                        {entry.status === 'rejected' && '不選考'}
                      </span>
                      <span className="ml-3 text-sm text-gray-600">
                        {entry.status === 'pending' && '審査をお待ちください'}
                        {entry.status === 'submitted' && '審査中です'}
                        {entry.status === 'selected' && 'おめでとうございます！'}
                        {entry.status === 'rejected' && '残念ながら不選考となりました'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* シード権ユーザー専用の選考状況 */}
          {userProfile.has_seed && (
            <div className="mb-6">
              <div className="border-l-4 border-green-500 bg-green-50 shadow rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-700">選考状況</h3>
                    <div className="mt-1 flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        シード権保持
                      </span>
                      <span className="ml-3 text-sm text-green-700">
                        自動的に選考を通過します
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* エントリー情報カード */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
            {/* 基本情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        基本情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {checkBasicInfoComplete(basicInfo) ? '登録済み' : basicInfo ? '入力中' : '未登録'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.basic_info_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <EditButton href="/dashboard/basic-info">
                    {isFormEditable('basic_info_deadline') 
                      ? (basicInfo ? '編集' : '登録')
                      : '確認（編集不可）'
                    } →
                  </EditButton>
                </div>
              </div>
            </div>

            {/* 予選情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        予選情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {checkPreliminaryInfoComplete(preliminaryInfo, fileStats.preliminaryVideo > 0) ? '登録済み' : preliminaryInfo ? '入力中' : '未登録'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.music_info_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <EditButton href="/dashboard/preliminary">
                    {isFormEditable('music_info_deadline') 
                      ? (preliminaryInfo ? '編集' : '登録')
                      : '確認（編集不可）'
                    } →
                  </EditButton>
                </div>
              </div>
            </div>

            {/* プログラム掲載用情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        プログラム掲載用情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {checkProgramInfoComplete(programInfo) ? '登録済み' : programInfo ? '入力中' : '未登録'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.program_info_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <EditButton href="/dashboard/program-info">
                    {isFormEditable('program_info_deadline')
                      ? (entry && entry.program_info_submitted ? '編集' : '登録')
                      : '確認（編集不可）'
                    } →
                  </EditButton>
                </div>
              </div>
            </div>

            {/* 参加同意書カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        参加同意書
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry && entry.consent_form_submitted ? '提出済み' : '未提出'}
                      </dd>
                      <StartDateInline section="consent_form" />
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.consent_form_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <EditButton href="/dashboard/consent-form">
                    {isFormEditable('consent_form_deadline')
                      ? (entry && entry.consent_form_submitted ? '確認' : '提出')
                      : '確認（編集不可）'
                    } →
                  </EditButton>
                </div>
              </div>
            </div>

            {/* 準決勝情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        準決勝情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {checkSemifinalsInfoComplete(semifinalsInfo) ? '登録済み' : semifinalsInfo ? '入力中' : '未登録'}
                      </dd>
                      <StartDateInline section="semifinals" />
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.semifinals_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <EditButton href="/dashboard/semifinals">
                    {isFormEditable('music_info_deadline')
                      ? (semifinalsInfo ? '編集' : '登録')
                      : '確認（編集不可）'
                    } →
                  </EditButton>
                </div>
              </div>
            </div>

            {/* 決勝情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        決勝情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {checkFinalsInfoComplete(finalsInfo) ? '登録済み' : finalsInfo ? '入力中' : '未登録'}
                      </dd>
                      <StartDateInline section="finals" />
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.finals_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <EditButton href="/dashboard/finals">
                    {isFormEditable('finals_deadline')
                      ? (finalsInfo ? '編集' : '登録')
                      : '確認（編集不可）'
                    } →
                  </EditButton>
                </div>
              </div>
            </div>
            
            {/* SNS情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        SNS情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {checkSnsInfoComplete(snsInfo, practiceVideo, introductionVideo) ? '登録済み' : '未登録'}
                      </dd>
                      <StartDateInline section="sns" />
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.sns_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <EditButton href="/dashboard/sns">
                    {isFormEditable('sns_deadline')
                      ? (entry && (entry.instagram || entry.twitter || entry.facebook) ? '編集' : '登録')
                      : '確認（編集不可）'
                    } →
                  </EditButton>
                </div>
              </div>
            </div>
            

            {/* 各種申請カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        各種申請
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {checkApplicationsInfoComplete(applicationsInfo) ? '申請あり' : '申請なし'}
                      </dd>
                      <StartDateInline section="optional_request" />
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.optional_request_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <EditButton href="/dashboard/applications">
                    {isFormEditable('optional_request_deadline')
                      ? (applicationsInfo ? '編集' : '登録')
                      : '確認（編集不可）'
                    } →
                  </EditButton>
                </div>
              </div>
            </div>

          </div>

          {/* エントリー情報詳細表示 */}
          {entry && (
            <div className="space-y-6">
              {/* 基本情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">基本情報</h3>
                    {isFormEditable('basic_info_deadline') ? (
                      <EditButton href="/dashboard/basic-info" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </EditButton>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">ダンスジャンル</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.dance_style || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">エントリー名</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.representative_name || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">パートナーエントリー名</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.partner_name || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">代表者メールアドレス</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.representative_email || '未設定'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">代表者電話番号</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.phone_number || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">参加資格</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.agreement_checked ? '同意済み' : '未確認'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">写真・映像使用許諾</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.media_consent_checked ? '同意済み' : '未確認'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">プライバシーポリシー</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.privacy_policy_checked ? '同意済み' : '未確認'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 予選情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">オンライン予選情報</h3>
                    {isFormEditable('music_info_deadline') ? (
                      <EditButton href="/dashboard/preliminary" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </EditButton>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">作品タイトル</label>
                        <p className="mt-1 text-base text-gray-900">{preliminaryInfo?.work_title || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">作品キャラクター・ストーリー等(50字以内)</label>
                        <p className="mt-1 text-base text-gray-900">{preliminaryInfo?.work_story || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">予選提出動画</label>
                        <div className="mt-1 text-base text-gray-900">
                          {preliminaryVideoFile ? (
                            <FilePreview
                              filePath={(preliminaryVideoFile as EntryFile).file_path}
                              fileName={(preliminaryVideoFile as EntryFile).file_name}
                              fileType="video"
                            />
                          ) : (
                            <span className="text-gray-500">未アップロード</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">予選 - 振付師1</label>
                        <p className="mt-1 text-base text-gray-900">{preliminaryInfo?.choreographer1_name || '未設定'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">予選 - 振付師1 フリガナ</label>
                        <p className="mt-1 text-base text-gray-900">{preliminaryInfo?.choreographer1_furigana || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">予選 - 振付師2</label>
                        <p className="mt-1 text-base text-gray-900">{preliminaryInfo?.choreographer2_name || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">予選 - 振付師2 フリガナ</label>
                        <p className="mt-1 text-base text-gray-900">{preliminaryInfo?.choreographer2_furigana || '未設定'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* プログラム掲載用情報詳細表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">プログラム掲載用情報</h3>
                    {isFormEditable('program_info_deadline') ? (
                      <EditButton href="/dashboard/program-info" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </EditButton>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">選手紹介用画像</label>
                      <div className="mt-1 text-base text-gray-900">
                        {programInfo?.player_photo_path ? (
                          <FilePreview
                            filePath={programInfo.player_photo_path}
                            fileName="選手紹介用画像"
                            fileType="image"
                          />
                        ) : (
                          <span className="text-gray-500">未アップロード</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500">所属教室または所属</label>
                      <p className="mt-1 text-base text-gray-900">{programInfo?.affiliation || '未設定'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">楽曲数</label>
                      <p className="mt-1 text-base text-gray-900">{programInfo?.song_count || '未設定'}</p>
                    </div>
                    
                    {/* 準決勝用 */}
                    <div className="border-t pt-4">
                      <h4 className="text-base font-medium text-gray-700 mb-3">準決勝用</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">作品あらすじ・ストーリー(100文字以内)</label>
                        <p className="mt-1 text-base text-gray-900">{programInfo?.semifinal_story || '未設定'}</p>
                      </div>
                    </div>
                    
                    {/* 決勝用 */}
                    {programInfo?.song_count === '2曲' && (
                      <div className="border-t pt-4">
                        <h4 className="text-base font-medium text-gray-700 mb-3">決勝用</h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">作品あらすじ・ストーリー(100文字以内)</label>
                          <p className="mt-1 text-base text-gray-900">{programInfo?.final_story || '未設定'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 準決勝情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">準決勝情報</h3>
                    {isFormEditable('music_info_deadline') ? (
                      <EditButton href="/dashboard/semifinals" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </EditButton>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">作品タイトル</label>
                        <p className="mt-1 text-base text-gray-900">{semifinalsInfo?.work_title || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">作品キャラクター・ストーリー等(50字以内)</label>
                        <p className="mt-1 text-base text-gray-900">{semifinalsInfo?.work_character_story || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">楽曲データ</label>
                        <div className="mt-1 text-base text-gray-900">
                          {semifinalsInfo?.music_data_path ? (
                            <FilePreview
                              filePath={semifinalsInfo.music_data_path}
                              fileName="準決勝用楽曲データ"
                              fileType="audio"
                            />
                          ) : (
                            <span className="text-gray-500">未アップロード</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">音楽スタートのタイミング(きっかけ、ポーズなど)</label>
                        <p className="mt-1 text-base text-gray-900">{semifinalsInfo?.sound_start_timing || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">準決勝 - 踊り出しタイミング</label>
                        <p className="mt-1 text-base text-gray-900">{semifinalsInfo?.dance_start_timing || '未設定'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付師 氏名①</label>
                        <p className="mt-1 text-base text-gray-900">{semifinalsInfo?.choreographer_name || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付師 氏名フリガナ①</label>
                        <p className="mt-1 text-base text-gray-900">{semifinalsInfo?.choreographer_furigana || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付師 氏名②</label>
                        <p className="mt-1 text-base text-gray-900">{semifinalsInfo?.choreographer2_name || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付師 氏名フリガナ②</label>
                        <p className="mt-1 text-base text-gray-900">{semifinalsInfo?.choreographer2_furigana || '未設定'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 決勝情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">決勝情報</h3>
                    {isFormEditable('finals_deadline') ? (
                      <EditButton href="/dashboard/finals" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </EditButton>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">楽曲情報の変更</label>
                        <p className="mt-1 text-base text-gray-900">
                          {finalsInfo?.music_change 
                            ? (finalsInfo?.copy_preliminary_music ? '予選と同じ楽曲' : '新しい楽曲')
                            : '準決勝と同じ楽曲'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">作品キャラクター・ストーリー等(50字以内)</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.work_character_story || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">楽曲データ</label>
                        <div className="mt-1 text-base text-gray-900">
                          {finalsInfo?.music_data_path ? (
                            <FilePreview
                              filePath={finalsInfo.music_data_path}
                              fileName="決勝用楽曲データ"
                              fileType="audio"
                            />
                          ) : (
                            <span className="text-gray-500">未アップロード</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">音楽スタートのタイミング(きっかけ、ポーズなど)</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.sound_start_timing || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">決勝 - 踊り出しタイミング</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.dance_start_timing || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付変更部分(曲が始まってから何分何秒の部分か)</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.choreography_change_timing || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">変更前（準決勝振付）</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.choreography_before_change || '未設定'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">変更後（決勝振付）</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.choreography_after_change || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付師 氏名①</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.choreographer_name || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付師 氏名フリガナ①</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.choreographer_furigana || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付師 氏名②</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.choreographer2_name || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付師 氏名フリガナ②</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.choreographer2_furigana || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">作品振付師出席予定</label>
                        <p className="mt-1 text-base text-gray-900">{finalsInfo?.choreographer_attendance || '未設定'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SNS情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">SNS情報</h3>
                    {isFormEditable('sns_deadline') ? (
                      <EditButton href="/dashboard/sns" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </EditButton>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">練習動画(約30秒)横長動画</label>
                      <div className="mt-1 text-base text-gray-900">
                        {practiceVideo ? (
                          <FilePreview
                            filePath={practiceVideo.file_path}
                            fileName={practiceVideo.file_name}
                            fileType="video"
                          />
                        ) : (
                          <span className="text-gray-500">未設定</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">選手紹介・見所（30秒）</label>
                      <div className="mt-1 text-base text-gray-900">
                        {introductionVideo ? (
                          <FilePreview
                            filePath={introductionVideo.file_path}
                            fileName={introductionVideo.file_name}
                            fileType="video"
                          />
                        ) : (
                          <span className="text-gray-500">未設定</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
      
      {/* フッター */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">問い合わせ</p>
            <p className="font-medium">
              <SiteTitle fallback="2025バルカーカップ" />エントリー事務局
            </p>
            <p>
              <a 
                href="mailto:entry-vqcup@valqua.com" 
                className="text-indigo-600 hover:text-indigo-500"
              >
                Mail:entry-vqcup@valqua.com
              </a>
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
  } catch (error) {
    console.error('ダッシュボードエラー:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">ダッシュボードの読み込みに失敗しました。</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
          <Link 
            href="/auth/login"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-block text-center"
          >
            ログインページに戻る
          </Link>
        </div>
      </div>
    )
  }
}