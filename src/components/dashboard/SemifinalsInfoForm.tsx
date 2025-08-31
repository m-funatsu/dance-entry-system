'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DeadlineNoticeAsync } from '@/components/ui'
import { BankSection } from '@/components/semifinals/BankSection'
import { useFileUploadV2 } from '@/hooks/useFileUploadV2'
import type { Entry, SemifinalsInfo, FinalsInfo } from '@/lib/types'

interface SemifinalsInfoFormProps {
  entry: Entry
}

export default function SemifinalsInfoForm({ entry }: SemifinalsInfoFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('music')
  const [semifinalsInfo, setSemifinalsInfo] = useState<Partial<SemifinalsInfo>>({
    entry_id: entry.id,
    // 賞金振込先情報を明示的に空文字で初期化
    bank_name: '',
    branch_name: '',
    account_type: '',
    account_number: '',
    account_holder: ''
  })
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)
  const [userSelectedFields, setUserSelectedFields] = useState<Set<string>>(new Set())
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null)
  const [hasPaymentSlip, setHasPaymentSlip] = useState<boolean>(false)
  const [paymentSlipInitialized, setPaymentSlipInitialized] = useState<boolean>(false)

  // ファイルアップロードフック（プログレスバー用）
  const { uploading, progress } = useFileUploadV2({
    category: 'audio' // デフォルト（実際のファイル種別は動的に変更）
  })

  // 振込確認用紙の状態変更ハンドラー
  const handlePaymentSlipStatusChange = useCallback((hasFile: boolean) => {
    console.log('[SEMIFINALS FORM] 振込確認用紙状態変更:', { hasFile })
    setHasPaymentSlip(hasFile)
    setPaymentSlipInitialized(true)
  }, [])

  // 決勝情報への同期処理
  const syncToFinals = async () => {
    console.log('[FINALS SYNC] 決勝同期チェック開始')
    
    // 決勝情報を取得して同期設定を確認
    const { data: finalsData, error: finalsError } = await supabase
      .from('finals_info')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle()

    if (finalsError) {
      console.error('[FINALS SYNC] 決勝情報取得エラー:', finalsError)
      return
    }

    if (!finalsData) {
      console.log('[FINALS SYNC] 決勝情報が存在しないため同期をスキップ')
      return
    }

    let hasUpdated = false
    const updatedData: Partial<FinalsInfo> = {}

    console.log('[FINALS SYNC] 同期設定確認:')
    console.log('[FINALS SYNC] - 楽曲情報:', finalsData.music_change === false ? '同期対象' : '非同期')
    console.log('[FINALS SYNC] - 音響指示:', finalsData.sound_change_from_semifinals === false ? '同期対象' : '非同期')
    console.log('[FINALS SYNC] - 照明指示:', finalsData.lighting_change_from_semifinals === false ? '同期対象' : '非同期')

    // 楽曲情報の同期
    if (finalsData.music_change === false) {
      console.log('[FINALS SYNC] 楽曲情報を同期')
      updatedData.work_title = semifinalsInfo.work_title || ''
      updatedData.work_title_kana = semifinalsInfo.work_title_kana || ''
      updatedData.work_character_story = semifinalsInfo.work_character_story || ''
      updatedData.copyright_permission = semifinalsInfo.copyright_permission || ''
      updatedData.music_title = semifinalsInfo.music_title || ''
      updatedData.artist = semifinalsInfo.artist || ''
      updatedData.cd_title = semifinalsInfo.cd_title || ''
      updatedData.record_number = semifinalsInfo.record_number || ''
      updatedData.jasrac_code = semifinalsInfo.jasrac_code || ''
      updatedData.music_type = semifinalsInfo.music_type || ''
      updatedData.music_data_path = semifinalsInfo.music_data_path || ''
      hasUpdated = true
    }

    // 音響指示の同期
    if (finalsData.sound_change_from_semifinals === false) {
      console.log('[FINALS SYNC] 音響指示を同期')
      
      // 追い出し楽曲指定の値変換
      const mapChaserSongDesignation = (value: string): string => {
        switch (value) {
          case 'included': return '自作曲に組み込み'
          case 'required': return '必要'
          case 'not_required': return '不要（無音）'
          default: return value
        }
      }
      
      updatedData.sound_start_timing = semifinalsInfo.sound_start_timing || ''
      updatedData.chaser_song_designation = mapChaserSongDesignation(semifinalsInfo.chaser_song_designation || '')
      updatedData.chaser_song = semifinalsInfo.chaser_song || ''
      updatedData.fade_out_start_time = semifinalsInfo.fade_out_start_time || ''
      updatedData.fade_out_complete_time = semifinalsInfo.fade_out_complete_time || ''
      hasUpdated = true
    }

    // 照明指示の同期
    if (finalsData.lighting_change_from_semifinals === false) {
      console.log('[FINALS SYNC] 照明指示を同期')
      updatedData.dance_start_timing = semifinalsInfo.dance_start_timing || ''
      updatedData.scene1_time = semifinalsInfo.scene1_time
      updatedData.scene1_trigger = semifinalsInfo.scene1_trigger || ''
      updatedData.scene1_color_type = semifinalsInfo.scene1_color_type || ''
      updatedData.scene1_color_other = semifinalsInfo.scene1_color_other || ''
      updatedData.scene1_image = semifinalsInfo.scene1_image || ''
      updatedData.scene1_image_path = semifinalsInfo.scene1_image_path || ''
      updatedData.scene1_notes = semifinalsInfo.scene1_notes || ''
      updatedData.scene2_time = semifinalsInfo.scene2_time
      updatedData.scene2_trigger = semifinalsInfo.scene2_trigger || ''
      updatedData.scene2_color_type = semifinalsInfo.scene2_color_type || ''
      updatedData.scene2_color_other = semifinalsInfo.scene2_color_other || ''
      updatedData.scene2_image = semifinalsInfo.scene2_image || ''
      updatedData.scene2_image_path = semifinalsInfo.scene2_image_path || ''
      updatedData.scene2_notes = semifinalsInfo.scene2_notes || ''
      updatedData.scene3_time = semifinalsInfo.scene3_time
      updatedData.scene3_trigger = semifinalsInfo.scene3_trigger || ''
      updatedData.scene3_color_type = semifinalsInfo.scene3_color_type || ''
      updatedData.scene3_color_other = semifinalsInfo.scene3_color_other || ''
      updatedData.scene3_image = semifinalsInfo.scene3_image || ''
      updatedData.scene3_image_path = semifinalsInfo.scene3_image_path || ''
      updatedData.scene3_notes = semifinalsInfo.scene3_notes || ''
      updatedData.scene4_time = semifinalsInfo.scene4_time
      updatedData.scene4_trigger = semifinalsInfo.scene4_trigger || ''
      updatedData.scene4_color_type = semifinalsInfo.scene4_color_type || ''
      updatedData.scene4_color_other = semifinalsInfo.scene4_color_other || ''
      updatedData.scene4_image = semifinalsInfo.scene4_image || ''
      updatedData.scene4_image_path = semifinalsInfo.scene4_image_path || ''
      updatedData.scene4_notes = semifinalsInfo.scene4_notes || ''
      updatedData.scene5_time = semifinalsInfo.scene5_time
      updatedData.scene5_trigger = semifinalsInfo.scene5_trigger || ''
      updatedData.scene5_color_type = semifinalsInfo.scene5_color_type || ''
      updatedData.scene5_color_other = semifinalsInfo.scene5_color_other || ''
      updatedData.scene5_image = semifinalsInfo.scene5_image || ''
      updatedData.scene5_image_path = semifinalsInfo.scene5_image_path || ''
      updatedData.scene5_notes = semifinalsInfo.scene5_notes || ''
      updatedData.chaser_exit_time = semifinalsInfo.chaser_exit_time
      updatedData.chaser_exit_trigger = semifinalsInfo.chaser_exit_trigger || ''
      updatedData.chaser_exit_color_type = semifinalsInfo.chaser_exit_color_type || ''
      updatedData.chaser_exit_color_other = semifinalsInfo.chaser_exit_color_other || ''
      updatedData.chaser_exit_image = semifinalsInfo.chaser_exit_image || ''
      updatedData.chaser_exit_image_path = semifinalsInfo.chaser_exit_image_path || ''
      updatedData.chaser_exit_notes = semifinalsInfo.chaser_exit_notes || ''
      hasUpdated = true
    }

    // 振付師情報の同期（choreographer_change設定が存在する場合）
    if (finalsData.choreographer_change === false) {
      console.log('[FINALS SYNC] 振付師情報を同期')
      updatedData.choreographer_name = semifinalsInfo.choreographer_name || ''
      updatedData.choreographer_furigana = semifinalsInfo.choreographer_name_kana || ''
      updatedData.choreographer2_name = semifinalsInfo.choreographer2_name || ''
      updatedData.choreographer2_furigana = semifinalsInfo.choreographer2_furigana || ''
      hasUpdated = true
    }

    if (hasUpdated) {
      console.log('[FINALS SYNC] 決勝情報を更新中...')
      const { error } = await supabase
        .from('finals_info')
        .update(updatedData)
        .eq('entry_id', entry.id)

      if (error) {
        console.error('[FINALS SYNC] 決勝更新エラー:', error)
        throw error
      }

      console.log('[FINALS SYNC] 決勝情報の同期完了')
    } else {
      console.log('[FINALS SYNC] 同期対象項目がないため同期をスキップ')
    }
  }

  useEffect(() => {
    if (!hasLoadedInitialData) {
      loadSemifinalsInfo()
    }
  }, [entry.id, hasLoadedInitialData]) // eslint-disable-line react-hooks/exhaustive-deps

  // 各タブの必須項目が入力されているかチェック
  const isTabValid = (tab: string) => {
    switch (tab) {
      case 'music':
        // 楽曲情報の必須項目（ユーザーが選択したかチェック）
        return userSelectedFields.has('music_change_from_preliminary')
      case 'sound':
        // 音響指示情報の必須項目
        return !!semifinalsInfo.sound_start_timing
      case 'lighting':
        // 照明指示情報の必須項目
        return !!semifinalsInfo.dance_start_timing
      case 'choreographer':
        // 振付情報の必須項目（振付師①の氏名とフリガナが必須）
        return userSelectedFields.has('choreographer_change_from_preliminary') &&
               !!semifinalsInfo.choreographer_name &&
               semifinalsInfo.choreographer_name.trim() !== '' &&
               !!semifinalsInfo.choreographer_name_kana &&
               semifinalsInfo.choreographer_name_kana.trim() !== ''
      case 'bank':
        // 賞金振込先情報の必須項目（全フィールドが必須）+ 振込確認用紙
        const bankFieldsValid = !!(
          semifinalsInfo.bank_name && 
          semifinalsInfo.bank_name.trim() !== '' &&
          semifinalsInfo.branch_name && 
          semifinalsInfo.branch_name.trim() !== '' &&
          semifinalsInfo.account_type && 
          semifinalsInfo.account_type.trim() !== '' &&
          semifinalsInfo.account_number && 
          semifinalsInfo.account_number.trim() !== '' &&
          semifinalsInfo.account_holder &&
          semifinalsInfo.account_holder.trim() !== ''
        )
        // 振込確認用紙の初期化が完了していない場合は未完了とする
        if (!paymentSlipInitialized) {
          console.log('[SEMIFINALS FORM] 振込確認用紙初期化待機中...')
          return false
        }
        return bankFieldsValid && hasPaymentSlip
      default:
        return true
    }
  }

  // 全ての必須項目が入力されているかチェック
  const isAllRequiredFieldsValid = () => {
    return isTabValid('music') && isTabValid('sound') && isTabValid('lighting') && 
           isTabValid('choreographer') && isTabValid('bank')
  }


  const loadSemifinalsInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('semifinals_info')
        .select('*')
        .eq('entry_id', entry.id)
        .maybeSingle()

      if (error) {
        // PGRST116は「No rows found」エラー（正常）
        if (error.code !== 'PGRST116') {
          console.error('Supabase error:', error)
          throw error
        }
      }

      if (data) {
        // データベースからのデータを設定
        // boolean型のフィールドがfalseの場合、未選択として扱うためにundefinedに設定
        const processedData = {
          ...data
        }
        setSemifinalsInfo(processedData)
        
        // データベースに保存されたboolean値がある場合は、ユーザーが選択済みとして扱う
        if (data.music_change_from_preliminary !== null && data.music_change_from_preliminary !== undefined) {
          setUserSelectedFields(prev => new Set(prev).add('music_change_from_preliminary'))
        }
        if (data.choreographer_change_from_preliminary !== null && data.choreographer_change_from_preliminary !== undefined) {
          setUserSelectedFields(prev => new Set(prev).add('choreographer_change_from_preliminary'))
        }
      }
      setHasLoadedInitialData(true)
    } catch (err) {
      console.error('準決勝情報の読み込みエラー:', err)
      console.error('エラー詳細:', JSON.stringify(err))
      setError(`準決勝情報の読み込みに失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (isTemporary = false) => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      // 50文字制限のチェック
      if (semifinalsInfo.work_character_story && semifinalsInfo.work_character_story.length > 50) {
        throw new Error('作品キャラクター・ストーリー等は50文字以内で入力してください')
      }

      const { data: existingData } = await supabase
        .from('semifinals_info')
        .select('id')
        .eq('entry_id', entry.id)
        .maybeSingle()

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('semifinals_info')
          .update({
            ...semifinalsInfo,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('semifinals_info')
          .insert({
            ...semifinalsInfo,
            entry_id: entry.id
          })

        if (error) throw error
      }

      // 振込確認用紙をアップロード
      if (paymentSlipFile) {
        try {
          // ファイル名を生成
          const fileExt = paymentSlipFile.name.split('.').pop()?.toLowerCase()
          const fileName = `${entry.id}_semifinals_payment_slip_${Date.now()}.${fileExt}`
          const filePath = `${entry.id}/${fileName}`

          // Supabaseストレージにアップロード
          const { error: uploadError } = await supabase.storage
            .from('files')
            .upload(filePath, paymentSlipFile, {
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) throw uploadError

          // entry_filesテーブルに記録
          const { error: dbError } = await supabase
            .from('entry_files')
            .insert({
              entry_id: entry.id,
              file_type: 'photo',  // PDFも画像カテゴリとして保存
              file_name: fileName,
              file_path: filePath,
              purpose: 'semifinals_payment_slip',
              mime_type: paymentSlipFile.type
            })

          if (dbError) throw dbError
          
          // ファイルをリセット
          setPaymentSlipFile(null)
        } catch (error) {
          console.error('振込確認用紙のアップロードエラー:', error)
          // エラーがあっても保存は成功扱いにし、エラーメッセージを追加
          setError('振込確認用紙のアップロードに失敗しました。後で再度お試しください。')
        }
      }

      // 決勝情報の同期チェック（一時保存・正式保存両方で実行）
      try {
        await syncToFinals()
      } catch (syncError) {
        console.error('決勝同期エラー:', syncError)
        // 同期エラーがあっても保存は成功扱いにする
      }
      
      setSuccess(isTemporary ? '準決勝情報を一時保存しました' : '準決勝情報を保存しました')
      // データを保持するため、再読み込みはしない
    } catch (err) {
      console.error('保存エラー:', err)
      setError(err instanceof Error ? err.message : '準決勝情報の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (field: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry.id}/semifinals/${field}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      setSemifinalsInfo(prev => ({
        ...prev,
        [field]: publicUrl
      }))
    } catch (err) {
      console.error('ファイルアップロードエラー:', err)
      setError('ファイルのアップロードに失敗しました')
    }
  }

  const handleFileDelete = async (field: string) => {
    try {
      console.log('[SEMIFINALS DELETE] === ファイル削除開始 ===')
      console.log('[SEMIFINALS DELETE] 削除対象フィールド:', field)
      
      const currentValue = semifinalsInfo[field as keyof SemifinalsInfo] as string
      console.log('[SEMIFINALS DELETE] 現在の値:', currentValue)
      
      // 決勝のファイル（/finals/パス）は削除しない
      if (currentValue && currentValue.includes('/finals/')) {
        console.log('[SEMIFINALS DELETE] 決勝ファイルのため削除をスキップ')
        setError('決勝のファイルは準決勝フォームから削除できません')
        return
      }
      
      // 削除前に現在のデータを保存
      console.log('[SEMIFINALS DELETE] 削除前にデータを保存中...')
      console.log('[SEMIFINALS DELETE] 保存前のsemifinalsInfo:', semifinalsInfo)
      
      await handleSave(true) // 一時保存
      console.log('[SEMIFINALS DELETE] 一時保存完了')
      
      // UIからファイルをクリア
      console.log('[SEMIFINALS DELETE] UIからファイルをクリア中...')
      setSemifinalsInfo(prev => {
        const updated = {
          ...prev,
          [field]: ''
        }
        console.log('[SEMIFINALS DELETE] 更新後のsemifinalsInfo:', updated)
        return updated
      })
      
      console.log('[SEMIFINALS DELETE] ファイル削除完了')
    } catch (err) {
      console.error('[SEMIFINALS DELETE] ファイル削除エラー:', err)
      setError('ファイルの削除に失敗しました')
    }
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  const sections = [
    { id: 'music', label: '楽曲情報' },
    { id: 'sound', label: '音響指示情報' },
    { id: 'lighting', label: '照明指示情報' },
    { id: 'choreographer', label: '振付情報' },
    { id: 'bank', label: 'エントリー振込確認/賞金振込先情報' }
  ]

  const colorTypes = [
    '赤系',
    '青系',
    '緑系',
    '黄系',
    '紫系',
    '白系',
    '暖色系',
    '寒色系',
    'その他'
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">準決勝情報</h3>

      <DeadlineNoticeAsync deadlineKey="semifinals_deadline" />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md">
          {success}
        </div>
      )}

      {!isAllRequiredFieldsValid() && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md">
          <p className="font-medium">全ての必須項目を入力してください。</p>
          <ul className="mt-2 text-sm list-disc list-inside">
            {!isTabValid('music') && <li>楽曲情報：予選との楽曲情報の変更</li>}
            {!isTabValid('sound') && <li>音響指示情報：音楽スタートのタイミング</li>}
            {!isTabValid('lighting') && <li>照明指示情報：踊り出しタイミング</li>}
            {!isTabValid('choreographer') && <li>振付情報：予選との振付師の変更、振付師①の氏名・フリガナ</li>}
            {!isTabValid('bank') && <li>賞金振込先情報：全項目（銀行名、支店名、口座種類、口座番号、口座名義）および振込確認用紙</li>}
          </ul>
        </div>
      )}

      {/* セクションタブ */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 楽曲情報セクション */}
      {activeSection === 'music' && (
        <>
          <div className="space-y-4">
            <h4 className="font-medium">楽曲情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予選との楽曲情報の変更 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change_option"
                  value="true"
                  checked={semifinalsInfo.music_change_from_preliminary === true}
                  onChange={() => {
                    // 変更ありの場合は楽曲情報をクリア
                    setSemifinalsInfo(prev => ({ 
                      ...prev, 
                      music_change_from_preliminary: true,
                      work_title: '',
                      work_title_kana: '',
                      work_character_story: '',
                      music_title: '',
                      cd_title: '',
                      artist: '',
                      record_number: '',
                      jasrac_code: '',
                      music_type: '',
                      copyright_permission: ''
                    }))
                    setUserSelectedFields(prev => new Set(prev).add('music_change_from_preliminary'))
                  }}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                変更あり
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change_option"
                  value="false"
                  checked={semifinalsInfo.music_change_from_preliminary === false}
                  onChange={async () => {
                    // 予選情報から楽曲データをコピー
                    try {
                      const { data: prelimData } = await supabase
                        .from('preliminary_info')
                        .select('*')
                        .eq('entry_id', entry.id)
                        .maybeSingle()
                      
                      if (prelimData) {
                        setSemifinalsInfo(prev => ({
                          ...prev,
                          music_change_from_preliminary: false,
                          work_title: prelimData.work_title || '',
                          work_title_kana: prelimData.work_title_kana || '',
                          work_character_story: prelimData.work_character_story || '',
                          music_title: prelimData.music_title || '',
                          cd_title: prelimData.cd_title || '',
                          artist: prelimData.artist || '',
                          record_number: prelimData.record_number || '',
                          jasrac_code: prelimData.jasrac_code || '',
                          music_type: prelimData.music_type || '',  // 楽曲種類も確実にコピー
                          copyright_permission: prelimData.music_rights_cleared || ''
                        }))
                      } else {
                        setSemifinalsInfo(prev => ({ ...prev, music_change_from_preliminary: false }))
                      }
                    } catch (err) {
                      console.error('予選情報の取得エラー:', err)
                      setSemifinalsInfo(prev => ({ ...prev, music_change_from_preliminary: false }))
                    }
                    setUserSelectedFields(prev => new Set(prev).add('music_change_from_preliminary'))
                  }}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                変更なし
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品タイトル
            </label>
            <input
              type="text"
              value={semifinalsInfo.work_title || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, work_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品タイトル(ふりがな)
            </label>
            <input
              type="text"
              value={semifinalsInfo.work_title_kana || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, work_title_kana: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="ひらがなで入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品キャラクター・ストーリー等（50字以内）
            </label>
            <textarea
              value={semifinalsInfo.work_character_story || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, work_character_story: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              maxLength={50}
            />
            <div className="text-sm text-gray-500 mt-1">
              {semifinalsInfo.work_character_story?.length || 0}/50文字
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              楽曲著作権許諾
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="copyright_permission"
                  value="commercial"
                  checked={semifinalsInfo.copyright_permission === 'commercial'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, copyright_permission: 'commercial' }))}
                  className="mr-2"
                />
                A.市販の楽曲を使用する
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="copyright_permission"
                  value="licensed"
                  checked={semifinalsInfo.copyright_permission === 'licensed'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, copyright_permission: 'licensed' }))}
                  className="mr-2"
                />
                B.自身で著作権に対し許諾を取った楽曲を使用する
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="copyright_permission"
                  value="original"
                  checked={semifinalsInfo.copyright_permission === 'original'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, copyright_permission: 'original' }))}
                  className="mr-2"
                />
                C.独自に製作されたオリジナル楽曲を使用する
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              使用楽曲タイトル
            </label>
            <input
              type="text"
              value={semifinalsInfo.music_title || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, music_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              収録CDタイトル
            </label>
            <input
              type="text"
              value={semifinalsInfo.cd_title || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, cd_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アーティスト
            </label>
            <input
              type="text"
              value={semifinalsInfo.artist || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, artist: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レコード番号
            </label>
            <input
              type="text"
              value={semifinalsInfo.record_number || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, record_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JASRAC作品コード
            </label>
            <input
              type="text"
              value={semifinalsInfo.jasrac_code || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, jasrac_code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              楽曲種類
            </label>
            <select
              value={semifinalsInfo.music_type || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, music_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">選択してください</option>
              <option value="cd">CD楽曲</option>
              <option value="download">データダウンロード楽曲</option>
              <option value="other">その他（オリジナル曲）</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              楽曲データ
            </label>
            {/* アップロード中のプログレスバー */}
            {uploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center mb-2">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    楽曲データをアップロード中... {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload('music_data_path', file)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {semifinalsInfo.music_data_path && (
              <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-600">アップロード済み</span>
                <button
                  type="button"
                  onClick={() => handleFileDelete('music_data_path')}
                  className="text-red-600 hover:text-red-800 text-sm underline"
                >
                  削除
                </button>
              </div>
            )}
          </div>

          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !isAllRequiredFieldsValid()}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? '一時保存中...' : '一時保存'}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !isAllRequiredFieldsValid()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </>
      )}

      {/* 音響指示情報セクション */}
      {activeSection === 'sound' && (
        <>
          <div className="space-y-4">
            <h4 className="font-medium">音響指示情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音楽スタートのタイミング（きっかけ、ポーズなど） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.sound_start_timing || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, sound_start_timing: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チェイサー（退場）曲の指定
            </label>
            <select
              value={semifinalsInfo.chaser_song_designation || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_song_designation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">選択してください</option>
              <option value="主催者一任">主催者一任</option>
              <option value="指定あり">指定あり</option>
              <option value="なし">なし</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チェイサー（退場）曲音源
            </label>
            {/* アップロード中のプログレスバー */}
            {uploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center mb-2">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    チェイサー曲音源をアップロード中... {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload('chaser_song', file)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {semifinalsInfo.chaser_song && (
              <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-600">アップロード済み</span>
                <button
                  type="button"
                  onClick={() => {
                    console.log('[CHASER DELETE BUTTON] チェイサー曲削除ボタンがクリックされました')
                    console.log('[CHASER DELETE BUTTON] 現在のchaser_song値:', semifinalsInfo.chaser_song)
                    handleFileDelete('chaser_song')
                  }}
                  className="text-red-600 hover:text-red-800 text-sm underline"
                >
                  削除
                </button>
                </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フェードアウト開始時間
            </label>
            <input
              type="text"
              value={semifinalsInfo.fade_out_start_time || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, fade_out_start_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例：3:45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フェードアウト完了時間
            </label>
            <input
              type="text"
              value={semifinalsInfo.fade_out_complete_time || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, fade_out_complete_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例：4:00"
            />
          </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !isAllRequiredFieldsValid()}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? '一時保存中...' : '一時保存'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !isAllRequiredFieldsValid()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          </div>
        </>
      )}

      {/* 照明指示情報セクション */}
      {activeSection === 'lighting' && (
        <>
          <div className="space-y-6">
          <h4 className="font-medium">照明指示情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              準決勝 - 踊り出しタイミング <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.dance_start_timing || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, dance_start_timing: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* シーン1-5とチェイサー/退場 */}
          {[1, 2, 3, 4, 5].map((sceneNum) => (
            <div key={`scene${sceneNum}`} className="border-t pt-4">
              <h5 className="font-medium mb-3">シーン{sceneNum}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時間
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_time` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_time`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例：0:30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    きっかけ
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_trigger` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_trigger`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    色・系統
                  </label>
                  <select
                    value={semifinalsInfo[`scene${sceneNum}_color_type` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_type`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">選択してください</option>
                    {colorTypes.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    色・系統その他
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_color_other` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_other`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_image` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_image`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ画像
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(`scene${sceneNum}_image_path`, file)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    備考
                  </label>
                  <textarea
                    value={semifinalsInfo[`scene${sceneNum}_notes` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_notes`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* チェイサー/退場 */}
          <div className="border-t pt-4">
            <h5 className="font-medium mb-3">チェイサー/退場</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  時間
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_time || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  きっかけ
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_trigger || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_trigger: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色・系統
                </label>
                <select
                  value={semifinalsInfo.chaser_exit_color_type || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_color_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {colorTypes.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色・系統その他
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_color_other || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_color_other: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_image || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_image: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ画像
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload('chaser_exit_image_path', file)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={semifinalsInfo.chaser_exit_notes || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>
            </div>
          </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !isAllRequiredFieldsValid()}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? '一時保存中...' : '一時保存'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !isAllRequiredFieldsValid()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          </div>
        </>
      )}

      {/* 振付情報セクション */}
      {activeSection === 'choreographer' && (
        <>
          <div className="space-y-4">
          <h4 className="font-medium">振付情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予選との振付師の変更 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="choreographer_change"
                  value="true"
                  checked={semifinalsInfo.choreographer_change_from_preliminary === true}
                  onChange={() => {
                    setSemifinalsInfo(prev => ({ ...prev, choreographer_change_from_preliminary: true }))
                    setUserSelectedFields(prev => new Set(prev).add('choreographer_change_from_preliminary'))
                  }}
                  className="mr-2"
                />
                変更あり
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="choreographer_change"
                  value="false"
                  checked={semifinalsInfo.choreographer_change_from_preliminary === false}
                  onChange={() => {
                    setSemifinalsInfo(prev => ({ ...prev, choreographer_change_from_preliminary: false }))
                    setUserSelectedFields(prev => new Set(prev).add('choreographer_change_from_preliminary'))
                  }}
                  className="mr-2"
                />
                変更なし
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              振付師 氏名① <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.choreographer_name || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, choreographer_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              振付師 氏名フリガナ① <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.choreographer_name_kana || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, choreographer_name_kana: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="ひらがなで入力"
              required
            />
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              ※振付師が2名いる場合のみ記入してください。
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                振付師 氏名②
              </label>
              <input
                type="text"
                value={semifinalsInfo.choreographer2_name || ''}
                onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, choreographer2_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                振付師 氏名フリガナ②
              </label>
              <input
                type="text"
                value={semifinalsInfo.choreographer2_furigana || ''}
                onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, choreographer2_furigana: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="ひらがなで入力"
              />
            </div>
          </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !isAllRequiredFieldsValid()}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? '一時保存中...' : '一時保存'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !isAllRequiredFieldsValid()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          </div>
        </>
      )}

      {/* エントリー振込確認/賞金振込先情報セクション */}
      {activeSection === 'bank' && (
        <>
          <BankSection
            semifinalsInfo={semifinalsInfo}
            validationErrors={!isTabValid('bank') ? [
              '銀行名、支店名、口座種類、口座番号、口座名義を全て入力してください。',
              ...(hasPaymentSlip ? [] : ['振込確認用紙をアップロードしてください。'])
            ] : []}
            onChange={(updates) => {
              // payment_slip_fileの特別処理
              if ('payment_slip_file' in updates) {
                setPaymentSlipFile(updates.payment_slip_file as File)
                // payment_slip_fileはsemifinalsInfoに含めない
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { payment_slip_file, ...rest } = updates
                setSemifinalsInfo(prev => ({ ...prev, ...rest }))
              } else {
                setSemifinalsInfo(prev => ({ ...prev, ...updates }))
              }
            }}
            onPaymentSlipStatusChange={handlePaymentSlipStatusChange}
          />

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !isAllRequiredFieldsValid()}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? '一時保存中...' : '一時保存'}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !isAllRequiredFieldsValid()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}