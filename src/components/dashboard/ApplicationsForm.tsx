'use client'

import { useState, useEffect, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateFormStatus, checkApplicationsInfoCompletion } from '@/lib/status-utils'
import { DeadlineNoticeAsync } from '@/components/ui'
import { StartDateNotice } from '@/components/ui/StartDateNotice'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { useFileUploadV2 } from '@/hooks'
import Image from 'next/image'
import type { Entry, ApplicationsInfo, EntryFile } from '@/lib/types'

interface ApplicationsFormProps {
  entry: Entry
  isEditable?: boolean
}

const TICKET_PRICE = 5000 // チケット単価（円）
const COMPANION_FEE = 4000 // 同伴料（円）

export default function ApplicationsForm({ entry, isEditable = true }: ApplicationsFormProps) {
  // const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  console.log('ApplicationsForm isEditable:', isEditable)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('ticket')
  const [applicationsInfo, setApplicationsInfo] = useState<Partial<ApplicationsInfo>>({
    entry_id: entry.id,
    related_ticket_count: 0,
    related_ticket_total_amount: 0,
    companion_total_amount: 0
  })
  const [paymentSlipFiles, setPaymentSlipFiles] = useState<EntryFile[]>([])  // 複数の払込用紙を管理
  const [paymentSlipUrls, setPaymentSlipUrls] = useState<{ [key: string]: string }>({})  // ファイルIDとURLのマッピング
  const [uploadingFile, setUploadingFile] = useState(false)

  // ファイルアップロードフック（ドキュメント用）
  const { uploadImage, uploading: uploadingDocument, progress: progressDocument } = useFileUploadV2({
    onSuccess: () => {
      // 成功時は個別のhandleFileUpload関数で処理
    },
    onError: (error: string) => setError(error)
  })

  // 関数定義（useEffectより前に配置）
  const calculateTicketTotal = useCallback(() => {
    setApplicationsInfo(prev => {
      let count = 0
      for (let i = 1; i <= 5; i++) {
        if (prev[`related${i}_name` as keyof ApplicationsInfo]) {
          count++
        }
      }
      const total = count * TICKET_PRICE
      return {
        ...prev,
        related_ticket_count: count,
        related_ticket_total_amount: total
      }
    })
  }, [])

  const calculateCompanionTotal = useCallback(() => {
    setApplicationsInfo(prev => {
      let count = 0
      for (let i = 1; i <= 3; i++) {
        if (prev[`companion${i}_name` as keyof ApplicationsInfo]) {
          count++
        }
      }
      const total = count * COMPANION_FEE
      return {
        ...prev,
        companion_total_amount: total
      }
    })
  }, [])

  useEffect(() => {
    loadApplicationsInfo()
  }, [entry.id]) // eslint-disable-line

  // 同伴者情報が変更されたときに合計金額を再計算
  useEffect(() => {
    calculateCompanionTotal()
  }, [
    applicationsInfo.companion1_name,
    applicationsInfo.companion2_name,
    applicationsInfo.companion3_name,
    calculateCompanionTotal
  ])

  // 関係者チケット情報が変更されたときに合計金額を再計算
  useEffect(() => {
    calculateTicketTotal()
  }, [
    applicationsInfo.related1_name,
    applicationsInfo.related2_name,
    applicationsInfo.related3_name,
    applicationsInfo.related4_name,
    applicationsInfo.related5_name,
    calculateTicketTotal
  ])

  const loadApplicationsInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('applications_info')
        .select('*')
        .eq('entry_id', entry.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        console.log('[MAKEUP DEBUG] applications_info データ:', data)
        setApplicationsInfo(data)
      }

      
      
      // 払込用紙ファイルを取得
      const { data: files } = await supabase
        .from('entry_files')
        .select('*')
        .eq('entry_id', entry.id)
        .eq('purpose', 'payment_slip')
        .order('uploaded_at', { ascending: false })
      
      if (files && files.length > 0) {
        setPaymentSlipFiles(files)
        
        // 各ファイルの署名付きURLを取得
        const urls: { [key: string]: string } = {}
        for (const file of files) {
          const { data } = await supabase.storage
            .from('files')
            .createSignedUrl(file.file_path, 3600)
          
          if (data?.signedUrl) {
            urls[file.id] = data.signedUrl
          }
        }
        setPaymentSlipUrls(urls)
      }
      
    } catch (err) {
      console.error('各種申請情報の読み込みエラー:', err)
      setError('各種申請情報の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      // 合計金額を再計算
      calculateTicketTotal()
      calculateCompanionTotal()

      const { data: existingData } = await supabase
        .from('applications_info')
        .select('id')
        .eq('entry_id', entry.id)
        .maybeSingle()

      if (existingData) {
        // 更新
        console.log('[MAKEUP DEBUG] 更新するapplications_infoデータ:', applicationsInfo)
        console.log('[MAKEUP DEBUG] makeup_name値:', applicationsInfo.makeup_name)
        console.log('[MAKEUP DEBUG] makeup_name_final値:', applicationsInfo.makeup_name_final)
        const { error } = await supabase
          .from('applications_info')
          .update({
            ...applicationsInfo,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) {
          console.error('applications_info更新エラー:')
          console.error('エラーコード:', error.code)
          console.error('エラーメッセージ:', error.message)
          console.error('エラー詳細:', error.details)
          console.error('エラーヒント:', error.hint)
          console.error('送信したデータのキー:', Object.keys(applicationsInfo))
          console.error('送信したデータ:', JSON.stringify(applicationsInfo, null, 2))
          throw error
        }
      } else {
        // 新規作成
        console.log('[MAKEUP DEBUG] 新規作成するapplications_infoデータ:', applicationsInfo)
        console.log('[MAKEUP DEBUG] makeup_name値:', applicationsInfo.makeup_name)
        console.log('[MAKEUP DEBUG] makeup_name_final値:', applicationsInfo.makeup_name_final)
        const { error } = await supabase
          .from('applications_info')
          .insert({
            ...applicationsInfo,
            entry_id: entry.id
          })

        if (error) {
          console.error('applications_info新規作成エラー:')
          console.error('エラーコード:', error.code)
          console.error('エラーメッセージ:', error.message)
          console.error('エラー詳細:', error.details)
          console.error('エラーヒント:', error.hint)
          console.error('送信したデータのキー:', Object.keys(applicationsInfo))
          console.error('送信したデータ:', JSON.stringify(applicationsInfo, null, 2))
          throw error
        }
      }

      // 申請情報の完了判定とステータス更新
      console.log('🔍🔍🔍 [APPLICATIONS DEBUG] === 保存時デバッグ開始 === 🔍🔍🔍')
      console.log('🔍 [APPLICATIONS DEBUG] applicationsInfo全体:', applicationsInfo)
      
      // 各カテゴリーのデータ有無を詳細チェック
      const relatedTickets = !!(applicationsInfo.related1_name || applicationsInfo.related2_name || 
        applicationsInfo.related3_name || applicationsInfo.related4_name || applicationsInfo.related5_name)
      const companions = !!(applicationsInfo.companion1_name || applicationsInfo.companion2_name || applicationsInfo.companion3_name)
      const makeupSemifinals = !!(applicationsInfo.makeup_name || applicationsInfo.makeup_email || 
        applicationsInfo.makeup_phone || applicationsInfo.makeup_preferred_stylist || applicationsInfo.makeup_notes)
      const makeupFinals = !!(applicationsInfo.makeup_name_final || applicationsInfo.makeup_email_final || 
        applicationsInfo.makeup_phone_final || applicationsInfo.makeup_preferred_stylist_final || 
        applicationsInfo.makeup_notes_final)
      const paymentSlip = !!(applicationsInfo.payment_slip_path)
      
      console.log('🔍 [APPLICATIONS DEBUG] === カテゴリー別データ有無 ===')
      console.log('🔍 [APPLICATIONS DEBUG] 関係者チケット:', relatedTickets)
      console.log('🔍 [APPLICATIONS DEBUG] 選手同伴:', companions)
      console.log('🔍 [APPLICATIONS DEBUG] メイク申請（準決勝）:', makeupSemifinals)
      console.log('🔍 [APPLICATIONS DEBUG] メイク申請（決勝）:', makeupFinals)
      console.log('🔍 [APPLICATIONS DEBUG] 払込用紙:', paymentSlip)
      
      const hasAnyApplicationData = relatedTickets || companions || makeupSemifinals || makeupFinals || paymentSlip
      console.log('🔍 [APPLICATIONS DEBUG] 最終データ有無判定:', hasAnyApplicationData)
      
      // 各フィールドの詳細値もログ出力
      console.log('🔍 [APPLICATIONS DEBUG] === フィールド詳細値 ===')
      console.log('🔍 [APPLICATIONS DEBUG] related1_name:', `"${applicationsInfo.related1_name}"`)
      console.log('🔍 [APPLICATIONS DEBUG] related2_name:', `"${applicationsInfo.related2_name}"`)
      console.log('🔍 [APPLICATIONS DEBUG] companion1_name:', `"${applicationsInfo.companion1_name}"`)
      console.log('🔍 [APPLICATIONS DEBUG] makeup_name:', `"${applicationsInfo.makeup_name}"`)
      console.log('🔍 [APPLICATIONS DEBUG] makeup_name_final:', `"${applicationsInfo.makeup_name_final}"`)
      console.log('🔍 [APPLICATIONS DEBUG] payment_slip_path:', `"${applicationsInfo.payment_slip_path}"`)
      console.log('🔍 [APPLICATIONS DEBUG] related_ticket_count:', applicationsInfo.related_ticket_count)
      console.log('🔍 [APPLICATIONS DEBUG] companion_total_amount:', applicationsInfo.companion_total_amount)
      
      const isComplete = checkApplicationsInfoCompletion(applicationsInfo)
      console.log('🔍 [APPLICATIONS DEBUG] checkApplicationsInfoCompletion結果:', isComplete)
      
      await updateFormStatus('applications_info', entry.id, isComplete, hasAnyApplicationData)
      
      console.log('🔍🔍🔍 [APPLICATIONS DEBUG] === 保存時デバッグ終了 === 🔍🔍🔍')

      setSuccess('各種申請情報を保存しました')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      // router.refresh()を削除して再レンダリングを防ぐ
    } catch (err) {
      console.error('保存エラー:', err)
      setError(err instanceof Error ? err.message : '各種申請情報の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true)
      
      // useFileUploadV2を使用してプログレスバー付きでアップロード
      console.log('[APPLICATIONS UPLOAD] useFileUploadV2でアップロード開始')
      
      const result = await uploadImage(file, { 
        entryId: entry.id, 
        folder: 'applications/payment_slip' 
      })
      
      if (!result.success || !result.path) {
        throw new Error(result.error || 'アップロードに失敗しました')
      }
      
      const fileName = result.path

      // entry_filesテーブルに保存
      const { data: fileData, error: dbError } = await supabase
        .from('entry_files')
        .insert({
          entry_id: entry.id,
          file_type: 'photo',  // 払込用紙は画像またはPDFなので'photo'として扱う
          file_name: file.name,
          file_path: fileName,
          purpose: 'payment_slip'
        })
        .select()
        .single()

      if (dbError) throw dbError

      // ファイルリストを更新
      setPaymentSlipFiles(prev => [fileData, ...prev])
      
      // 署名付きURLを取得して追加
      const { data } = await supabase.storage
        .from('files')
        .createSignedUrl(fileName, 3600)
      
      if (data?.signedUrl) {
        setPaymentSlipUrls(prev => ({ ...prev, [fileData.id]: data.signedUrl }))
      }
      
      // 最初のファイルのパスをapplications_infoに保存（後方互換性のため）
      if (paymentSlipFiles.length === 0) {
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(fileName)
        
        setApplicationsInfo(prev => ({
          ...prev,
          payment_slip_path: publicUrl
        }))
      }
      
      setSuccess('払込用紙をアップロードしました')
    } catch (err) {
      console.error('ファイルアップロードエラー:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('払込用紙のアップロードに失敗しました')
      }
    } finally {
      setUploadingFile(false)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    if (!window.confirm('この払込用紙を削除してもよろしいですか？')) return

    try {
      const fileToDelete = paymentSlipFiles.find(f => f.id === fileId)
      if (!fileToDelete) return

      // ストレージから削除
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([fileToDelete.file_path])

      if (storageError) {
        console.error('ストレージ削除エラー:', storageError)
      }

      // データベースから削除
      const { error: dbError } = await supabase
        .from('entry_files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      // ファイルリストを更新
      setPaymentSlipFiles(prev => prev.filter(f => f.id !== fileId))
      
      // URLマッピングからも削除
      setPaymentSlipUrls(prev => {
        const newUrls = { ...prev }
        delete newUrls[fileId]
        return newUrls
      })
      
      // 最初のファイルが削除された場合、次のファイルのパスを設定
      if (paymentSlipFiles[0]?.id === fileId && paymentSlipFiles.length > 1) {
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(paymentSlipFiles[1].file_path)
        
        setApplicationsInfo(prev => ({
          ...prev,
          payment_slip_path: publicUrl
        }))
      } else if (paymentSlipFiles.length === 1) {
        // 最後のファイルの場合はパスをクリア
        setApplicationsInfo(prev => ({
          ...prev,
          payment_slip_path: ''
        }))
      }


      setSuccess('払込用紙を削除しました')
    } catch (err) {
      console.error('ファイル削除エラー:', err)
      setError('払込用紙の削除に失敗しました')
    }
  }


  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  const relationshipOptions = [
    '振付師',
    '振付師の代理人',
    'スポンサー',
    '保護者'
  ]


  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">各種申請</h3>

      <StartDateNotice section="optional_request" />
      {isEditable && <DeadlineNoticeAsync deadlineKey="optional_request_deadline" />}

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

      {/* タブ */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'ticket'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            関係者チケット注文申請
          </button>
          <button
            onClick={() => setActiveTab('companion')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'companion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            選手同伴申請
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            払込用紙
          </button>
        </nav>
      </div>

      {/* 関係者チケット注文申請 */}
      {activeTab === 'ticket' && (
        <div className="space-y-6">
          <h4 className="font-medium text-gray-900">関係者チケット注文申請</h4>
          <p className="text-sm text-gray-600">
            関係者チケット（1枚 {TICKET_PRICE.toLocaleString()}円）を購入される方の情報を入力してください。
          </p>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-800 space-y-2">
              <p className="font-medium">📌 関係者チケット注文申請について</p>
              <p>
                振付師の方、選手のスポンサーの方（衣装など）、選手保護者については、以下の料金で控室・飛天にお入りいただくことが可能です。
              </p>
              <p className="font-medium">
                ・場所：フロアステージ横の関係者用テーブル
              </p>
              <p className="text-orange-700 font-medium">
                ※選手保護者で飛天観覧席でのご観覧を希望の方は、別途観覧席チケットをお求めください。
              </p>
              <p className="text-blue-700 font-medium">
                ※振付師の方については、選手が3位までに入賞された場合、表彰式にて表彰を受けていただきます。
              </p>
              <p>
                必ず事前申請をお願いいたします。当日の受付はいたしかねますのでご了承ください。
              </p>
            </div>
          </div>

          {[1, 2, 3, 4, 5].map((num) => (
            <div key={`related${num}`} className="border rounded-lg p-4 space-y-4">
              <h5 className="font-medium text-gray-900">関係者{num}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    関係性
                  </label>
                  <select
                    value={applicationsInfo[`related${num}_relationship` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => {
                      setApplicationsInfo(prev => ({ ...prev, [`related${num}_relationship`]: e.target.value }))
                      setTimeout(calculateTicketTotal, 0)
                    }}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="">選択してください</option>
                    {relationshipOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`related${num}_name` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => {
                      setApplicationsInfo(prev => ({ ...prev, [`related${num}_name`]: e.target.value }))
                      setTimeout(calculateTicketTotal, 0)
                    }}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    フリガナ
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`related${num}_furigana` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => setApplicationsInfo(prev => ({ ...prev, [`related${num}_furigana`]: e.target.value }))}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">合計人数</span>
              <span className="text-lg">{applicationsInfo.related_ticket_count || 0}人</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium text-gray-900">合計金額</span>
              <span className="text-lg font-bold text-blue-600">
                ¥{(applicationsInfo.related_ticket_total_amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 選手同伴申請 */}
      {activeTab === 'companion' && (
        <div className="space-y-6">
          <h4 className="font-medium text-gray-900">選手同伴申請</h4>
          <p className="text-sm text-gray-600">
            選手と同伴される方の情報を入力してください。（1名につき {COMPANION_FEE.toLocaleString()}円）
          </p>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800 space-y-2">
              <p className="font-medium">📌 選手同伴申請について</p>
              <p>
                メイク・ヘアセット・整体等の理由で、控室にご同伴いただくことが可能です。
              </p>
              <p className="text-red-700 font-medium">
                ※会場・飛天にお入りいただくことはできませんのでご注意ください。
              </p>
              <p>
                但し、必ず事前申請をお願いいたします。当日の受付はいたしかねますのでご了承ください。
              </p>
            </div>
          </div>

          {[1, 2, 3].map((num) => (
            <div key={`companion${num}`} className="border rounded-lg p-4 space-y-4">
              <h5 className="font-medium text-gray-900">同伴者{num}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    同伴氏名
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`companion${num}_name` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => setApplicationsInfo(prev => ({ ...prev, [`companion${num}_name`]: e.target.value }))}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    フリガナ
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`companion${num}_furigana` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => setApplicationsInfo(prev => ({ ...prev, [`companion${num}_furigana`]: e.target.value }))}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目的
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`companion${num}_purpose` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => setApplicationsInfo(prev => ({ ...prev, [`companion${num}_purpose`]: e.target.value }))}
                    disabled={!isEditable}
                    placeholder="例：付き添い、撮影、介助など"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">合計金額</span>
              <span className="text-lg font-bold text-blue-600">
                ¥{(applicationsInfo.companion_total_amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 払込用紙 */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <h4 className="font-medium text-gray-900">払込用紙</h4>
          <p className="text-sm text-gray-600">
            関係者チケットまたは選手同伴申請をされた場合は、払込用紙をアップロードしてください。
          </p>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">関係者チケット合計</span>
              <span>¥{(applicationsInfo.related_ticket_total_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">選手同伴申請合計</span>
              <span>¥{(applicationsInfo.companion_total_amount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-bold">
                <span className="font-medium text-gray-900">総合計</span>
                <span className="text-lg text-blue-600">
                  ¥{((applicationsInfo.related_ticket_total_amount || 0) + (applicationsInfo.companion_total_amount || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* アップロード中のプログレスバー */}
            {uploadingDocument && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center mb-2">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    ドキュメントをアップロード中... {Math.round(progressDocument)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressDocument}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* アップロード中のプログレスバー */}
            {uploadingDocument && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center mb-2">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    払込用紙をアップロード中... {Math.round(progressDocument)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressDocument}%` }}
                  ></div>
                </div>
              </div>
            )}

            <FileUploadField
              label="払込用紙のアップロード（複数枚可）"
              category="document"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
              maxSizeMB={20}
              onChange={handleFileUpload}
              disabled={uploadingFile || !isEditable}
              placeholder={{
                title: "払込用紙をアップロード",
                subtitle: "複数枚の画像やPDFをアップロード可能",
                formats: "JPG, PNG, GIF, WEBP, PDF（最大20MB）"
              }}
            />
            <p className="text-xs text-gray-600 mt-2">
              払込用紙のアップロード（複数枚可）の追加/削除を行った場合は必ず画面下部の<span className="text-red-600">保存ボタンをクリック</span>してください。
            </p>

            {/* アップロード済みファイルのプレビューと管理 */}
            {paymentSlipFiles.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  アップロード済みの払込用紙 ({paymentSlipFiles.length}枚)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paymentSlipFiles.map((file) => (
                    <div key={file.id} className="relative border rounded-lg p-3 bg-white">
                      {/* プレビュー */}
                      {file.file_type === 'photo' || file.file_name.toLowerCase().endsWith('.pdf') ? (
                        file.file_name.toLowerCase().endsWith('.pdf') ? (
                          <div 
                            className="h-40 mb-2 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                            onClick={() => {
                              if (paymentSlipUrls[file.id]) {
                                window.open(paymentSlipUrls[file.id], '_blank')
                              }
                            }}
                            title="クリックで新しいタブで開く"
                          >
                            <div className="text-center">
                              <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <p className="text-sm text-gray-600">PDFファイル</p>
                              <p className="text-xs text-gray-500">クリックで開く</p>
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-40 mb-2 bg-gray-100 rounded overflow-hidden">
                            {paymentSlipUrls[file.id] ? (
                              <Image
                                src={paymentSlipUrls[file.id]}
                                alt={file.file_name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-sm text-gray-500">読み込み中...</span>
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="h-40 mb-2 bg-gray-100 rounded flex items-center justify-center">
                          <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="ml-2 text-sm text-gray-500">PDF</span>
                        </div>
                      )}
                      
                      {/* ファイル情報 */}
                      <div className="space-y-1">
                        <p className="text-xs text-gray-900 truncate" title={file.file_name}>
                          {file.file_name}
                        </p>
                      </div>
                      
                      {/* 削除ボタン */}
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        disabled={!isEditable}
                        className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                          !isEditable
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                            : 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                        }`}
                        title="削除"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <textarea
              value={applicationsInfo.applications_notes || ''}
              onChange={(e) => setApplicationsInfo(prev => ({ ...prev, applications_notes: e.target.value }))}
              rows={3}
              disabled={!isEditable}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="その他、申請に関する注意事項や要望があれば記入してください"
            />
          </div>
        </div>
      )}



      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          disabled={saving || !isEditable}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}