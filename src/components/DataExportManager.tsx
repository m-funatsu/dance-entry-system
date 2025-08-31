'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DataExportManagerProps {
  totalEntries: number
  totalFiles: number
}

export default function DataExportManager({ totalEntries, totalFiles }: DataExportManagerProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<string>('')

  // カラム名のマッピング
  const columnNameMap: Record<string, string> = {
    // エントリー基本情報
    'id': 'エントリーID',
    'user_id': 'ユーザーID',
    'user_name': 'ユーザー名',
    'user_email': 'メールアドレス',
    'dance_style': 'ダンススタイル',
    'participant_names': '参加者名',
    'status': 'ステータス',
    'created_at': '作成日時',
    'updated_at': '更新日時',
    
    // 基本情報
    'basic_info_category_division': 'カテゴリー区分',
    'basic_info_representative_name': '代表者氏名',
    'basic_info_representative_furigana': '代表者ふりがな',
    'basic_info_representative_romaji': '代表者ローマ字',
    'basic_info_representative_birthdate': '代表者生年月日',
    'basic_info_representative_email': '代表者メールアドレス',
    'basic_info_partner_name': 'パートナー氏名',
    'basic_info_partner_furigana': 'パートナーふりがな',
    'basic_info_partner_romaji': 'パートナーローマ字',
    'basic_info_partner_birthdate': 'パートナー生年月日',
    'basic_info_phone_number': '電話番号',
    'basic_info_real_name': '本名',
    'basic_info_real_name_kana': '本名かな',
    'basic_info_partner_real_name': 'パートナー本名',
    'basic_info_partner_real_name_kana': 'パートナー本名かな',
    'basic_info_choreographer': '振付師',
    'basic_info_choreographer_furigana': '振付師ふりがな',
    'basic_info_emergency_contact_name_1': '緊急連絡先1氏名',
    'basic_info_emergency_contact_phone_1': '緊急連絡先1電話番号',
    'basic_info_emergency_contact_name_2': '緊急連絡先2氏名',
    'basic_info_emergency_contact_phone_2': '緊急連絡先2電話番号',
    'basic_info_guardian_name': '保護者氏名',
    'basic_info_guardian_phone': '保護者電話番号',
    'basic_info_guardian_email': '保護者メールアドレス',
    'basic_info_partner_guardian_name': 'パートナー保護者氏名',
    'basic_info_partner_guardian_phone': 'パートナー保護者電話番号',
    'basic_info_partner_guardian_email': 'パートナー保護者メールアドレス',
    'basic_info_agreement_checked': '同意確認',
    'basic_info_media_consent_checked': 'メディア同意',
    'basic_info_privacy_policy_checked': 'プライバシーポリシー同意',
    
    // 予選情報
    'preliminary_info_work_title': '予選作品タイトル',
    'preliminary_info_work_title_kana': '予選作品タイトルかな',
    'preliminary_info_work_story': '予選作品ストーリー',
    'preliminary_info_video_submitted': '予選動画提出済み',
    'preliminary_info_music_rights_cleared': '予選音楽権利クリア',
    'preliminary_info_music_title': '予選楽曲タイトル',
    'preliminary_info_cd_title': '予選CDタイトル',
    'preliminary_info_artist': '予選アーティスト',
    'preliminary_info_record_number': '予選レコード番号',
    'preliminary_info_jasrac_code': '予選JASRACコード',
    'preliminary_info_music_type': '予選音楽タイプ',
    'preliminary_info_choreographer1_name': '予選振付師1氏名',
    'preliminary_info_choreographer1_furigana': '予選振付師1ふりがな',
    'preliminary_info_choreographer2_name': '予選振付師2氏名',
    'preliminary_info_choreographer2_furigana': '予選振付師2ふりがな',
    
    // 準決勝情報
    'semifinals_info_music_change_from_preliminary': '準決勝楽曲変更',
    'semifinals_info_work_title': '準決勝作品タイトル',
    'semifinals_info_work_title_kana': '準決勝作品タイトルかな',
    'semifinals_info_work_character_story': '準決勝作品ストーリー',
    'semifinals_info_copyright_permission': '準決勝著作権許可',
    'semifinals_info_music_title': '準決勝楽曲タイトル',
    'semifinals_info_cd_title': '準決勝CDタイトル',
    'semifinals_info_artist': '準決勝アーティスト',
    'semifinals_info_chaser_song_designation': '準決勝チェイサー曲指定',
    'semifinals_info_choreographer_name': '準決勝振付師氏名',
    'semifinals_info_choreographer_furigana': '準決勝振付師ふりがな',
    'semifinals_info_choreographer2_name': '準決勝振付師2氏名',
    'semifinals_info_choreographer2_furigana': '準決勝振付師2ふりがな',
    'semifinals_info_props_usage': '準決勝小道具使用',
    'semifinals_info_props_details': '準決勝小道具詳細',
    
    // 照明シーン情報
    'semifinals_info_lighting_scene1_color': '照明シーン1 色',
    'semifinals_info_lighting_scene1_color_other': '照明シーン1 色・系統その他',
    'semifinals_info_lighting_scene1_image': '照明シーン1 イメージ',
    'semifinals_info_lighting_scene2_color': '照明シーン2 色',
    'semifinals_info_lighting_scene2_color_other': '照明シーン2 色・系統その他',
    'semifinals_info_lighting_scene2_image': '照明シーン2 イメージ',
    'semifinals_info_lighting_scene3_color': '照明シーン3 色',
    'semifinals_info_lighting_scene3_color_other': '照明シーン3 色・系統その他',
    'semifinals_info_lighting_scene3_image': '照明シーン3 イメージ',
    'semifinals_info_lighting_scene4_color': '照明シーン4 色',
    'semifinals_info_lighting_scene4_color_other': '照明シーン4 色・系統その他',
    'semifinals_info_lighting_scene4_image': '照明シーン4 イメージ',
    'semifinals_info_lighting_scene5_color': '照明シーン5 色',
    'semifinals_info_lighting_scene5_color_other': '照明シーン5 色・系統その他',
    'semifinals_info_lighting_scene5_image': '照明シーン5 イメージ',
    'semifinals_info_lighting_chaser_color': '照明シーン チェイサー 色',
    'semifinals_info_lighting_chaser_color_other': '照明シーン チェイサー 色・系統その他',
    'semifinals_info_lighting_chaser_image': '照明シーン チェイサー イメージ',
    
    // 決勝情報
    'finals_info_music_change': '決勝楽曲変更',
    'finals_info_work_title': '決勝作品タイトル',
    'finals_info_work_title_kana': '決勝作品タイトルかな',
    'finals_info_choreographer_change': '決勝振付変更',
    'finals_info_choreographer_name': '決勝振付師氏名',
    'finals_info_choreographer_furigana': '決勝振付師ふりがな',
    'finals_info_choreographer2_name': '決勝振付師2氏名',
    'finals_info_choreographer2_furigana': '決勝振付師2ふりがな',
    'finals_info_props_usage': '決勝小道具使用',
    'finals_info_props_details': '決勝小道具詳細',
    'finals_info_choreographer_attendance': '振付師出席予定',
    'finals_info_choreographer_photo_permission': '振付師写真掲載許可',
    
    // 申請情報
    'applications_info_related_ticket_count': '関連チケット数',
    'applications_info_related_ticket_total_amount': '関連チケット総額',
    'applications_info_companion_total_amount': '同伴者総額',
    'applications_info_makeup_preferred_stylist': 'メイク希望スタイリスト',
    'applications_info_makeup_name': 'メイク申請者名',
    'applications_info_makeup_email': 'メイク申請者メール',
    'applications_info_makeup_phone': 'メイク申請者電話',
    
    // 座席リクエスト
    'seat_request_premium_seats': 'プレミアム席',
    'seat_request_ss_seats': 'SS席',
    'seat_request_s_seats': 'S席',
    'seat_request_a_seats': 'A席',
    'seat_request_b_seats': 'B席'
  }

  // オブジェクトをフラット化する関数
  const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string | number | boolean> => {
    const flattened: Record<string, string | number | boolean> = {}
    
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) {
        flattened[prefix + key] = ''
      } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        Object.assign(flattened, flattenObject(obj[key] as Record<string, unknown>, prefix + key + '_'))
      } else if (Array.isArray(obj[key])) {
        flattened[prefix + key] = JSON.stringify(obj[key])
      } else {
        flattened[prefix + key] = obj[key] as string | number | boolean
      }
    }
    
    return flattened
  }

  // CSVエクスポート関数
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      setExportStatus('エクスポートするデータがありません')
      return
    }

    // フラットなオブジェクトに変換
    const flattenedData = data.map(item => flattenObject(item))
    
    // CSVヘッダーを作成（日本語名に変換）
    const headers = Object.keys(flattenedData[0])
    const csvHeaders = headers.map(header => {
      // IDフィールドは除外、ユーザー関連の特別処理
      if (header === 'user_id' || header.includes('_id') && !header.includes('entry_id')) {
        return null
      }
      return columnNameMap[header] || header
    }).filter(h => h !== null).join(',')
    
    // CSVデータを作成
    const csvData = flattenedData.map(row => {
      return headers.map(header => {
        // IDフィールドは除外
        if (header === 'user_id' || header.includes('_id') && !header.includes('entry_id')) {
          return null
        }
        let value = row[header]
        
        // 特別な値の変換
        if (typeof value === 'boolean') {
          value = value ? 'はい' : 'いいえ'
        } else if (header === 'status') {
          const statusMap: Record<string, string> = {
            'pending': '保留中',
            'submitted': '提出済み',
            'selected': '選考通過',
            'rejected': '不選考'
          }
          value = statusMap[String(value)] || value
        } else if ((header === 'created_at' || header === 'updated_at') && value) {
          // 日時のフォーマット
          const date = new Date(String(value))
          if (!isNaN(date.getTime())) {
            value = date.toLocaleString('ja-JP', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        }
        
        // 値にカンマ、改行、ダブルクォートが含まれる場合は適切にエスケープ
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).filter(v => v !== null).join(',')
    }).join('\n')
    
    const csv = `${csvHeaders}\n${csvData}`
    
    // BOMを追加（Excel対応）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8' })
    
    // ダウンロード
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    // 安全にremoveChildを実行
    if (link.parentNode) {
      link.parentNode.removeChild(link)
    }
    URL.revokeObjectURL(url)
  }


  const handleExportData = async () => {
    setIsExporting(true)
    setExportStatus('データベースデータをエクスポート中...')

    try {
      const supabase = createClient()
      
      // エントリーと基本的な関連データを取得
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select(`
          *,
          users(name, email)
        `)
        .order('created_at', { ascending: false })
      
      if (entriesError) throw entriesError
      
      // 各テーブルのデータを個別に取得
      const [
        basicInfoResult,
        preliminaryInfoResult,
        semifinalsInfoResult,
        finalsInfoResult,
        applicationsInfoResult,
        programInfoResult,
        snsInfoResult,
        seatRequestResult
      ] = await Promise.all([
        supabase.from('basic_info').select('*'),
        supabase.from('preliminary_info').select('*'),
        supabase.from('semifinals_info').select('*'),
        supabase.from('finals_info').select('*'),
        supabase.from('applications_info').select('*'),
        supabase.from('program_info').select('*'),
        supabase.from('sns_info').select('*'),
        supabase.from('seat_request').select('*')
      ])
      
      // エントリーデータに関連データをマージ
      const mergedData = (entries || []).map(entry => {
        const basicInfo = basicInfoResult.data?.find(b => b.entry_id === entry.id)
        const preliminaryInfo = preliminaryInfoResult.data?.find(p => p.entry_id === entry.id)
        const semifinalsInfo = semifinalsInfoResult.data?.find(s => s.entry_id === entry.id)
        const finalsInfo = finalsInfoResult.data?.find(f => f.entry_id === entry.id)
        const applicationsInfo = applicationsInfoResult.data?.find(a => a.entry_id === entry.id)
        const programInfo = programInfoResult.data?.find(p => p.entry_id === entry.id)
        const snsInfo = snsInfoResult.data?.find(s => s.entry_id === entry.id)
        const seatRequest = seatRequestResult.data?.find(s => s.entry_id === entry.id)
        
        // ユーザー情報を展開
        const userData = entry.users as { name?: string; email?: string } | undefined
        
        return {
          ...entry,
          // ユーザー情報を分かりやすく追加
          user_name: userData?.name || '不明',
          user_email: userData?.email || '',
          // 関連データをマージ
          basic_info: basicInfo || {},
          preliminary_info: preliminaryInfo || {},
          semifinals_info: semifinalsInfo || {},
          finals_info: finalsInfo || {},
          applications_info: applicationsInfo || {},
          program_info: programInfo || {},
          sns_info: snsInfo || {},
          seat_request: seatRequest || {}
        }
      })
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const filename = `dance_entry_data_${timestamp}.csv`
      
      exportToCSV(mergedData, filename)
      
      setExportStatus('データエクスポートが完了しました')
    } catch (error) {
      console.error('Export error:', error)
      setExportStatus('エクスポートに失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
    } finally {
      setIsExporting(false)
    }
  }


  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          データエクスポート
        </h3>
        
        {exportStatus && (
          <div className={`mb-4 p-4 rounded-md ${
            exportStatus.includes('失敗') || exportStatus.includes('エラー')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : exportStatus.includes('完了')
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {exportStatus.includes('中...') && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{exportStatus}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">データベースデータ</h4>
                <p className="text-sm text-gray-500">{totalEntries}件のエントリー</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">アップロードファイル</h4>
                <p className="text-sm text-gray-500">{totalFiles}個のファイル</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* データベースデータエクスポート */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">データベースデータのエクスポート</h4>
            <p className="text-sm text-gray-500 mb-3">
              参加者情報、エントリー詳細、選考結果などの全データをエクスポートします。
            </p>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📄 CSVでダウンロード
            </button>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p className="mb-2">📝 <strong>エクスポートされるデータ:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>エントリー基本情報（ユーザー名、メールアドレス、ステータス等）</li>
            <li>基本情報（代表者名、パートナー名、連絡先等）</li>
            <li>予選情報（作品タイトル、楽曲情報、振付師情報等）</li>
            <li>準決勝情報（音響・照明指示、振付変更情報等）</li>
            <li>決勝情報（振付変更、小道具使用情報等）</li>
            <li>申請情報（チケット申請、メイク予約等）</li>
            <li>プログラム掲載情報</li>
            <li>SNS情報</li>
            <li>座席リクエスト情報</li>
          </ul>
        </div>
      </div>
    </div>
  )
}