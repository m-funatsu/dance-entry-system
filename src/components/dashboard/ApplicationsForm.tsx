'use client'

import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DeadlineNoticeAsync } from '@/components/ui'
import Image from 'next/image'
import type { Entry, ApplicationsInfo, EntryFile, SeatRequest, BasicInfo } from '@/lib/types'

interface ApplicationsFormProps {
  entry: Entry
}

const TICKET_PRICE = 5000 // チケット単価（円）
const COMPANION_FEE = 4000 // 同伴料（円）

export default function ApplicationsForm({ entry }: ApplicationsFormProps) {
  // const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('ticket')
  const [applicationsInfo, setApplicationsInfo] = useState<Partial<ApplicationsInfo>>({
    entry_id: entry.id,
    related_ticket_count: 0,
    related_ticket_total_amount: 0,
    companion_total_amount: 0
  })
  const [seatRequest, setSeatRequest] = useState<Partial<SeatRequest>>({
    entry_id: entry.id,
    premium_seats: 0,
    ss_seats: 0,
    s_seats: 0,
    a_seats: 0,
    b_seats: 0
  })
  const [paymentSlipFiles, setPaymentSlipFiles] = useState<EntryFile[]>([])  // 複数の払込用紙を管理
  const [paymentSlipUrls, setPaymentSlipUrls] = useState<{ [key: string]: string }>({})  // ファイルIDとURLのマッピング
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)  // 拡大表示用PDF URL
  const [makeupStyle1File, setMakeupStyle1File] = useState<EntryFile | null>(null)  // 希望スタイル①画像（準決勝）
  const [makeupStyle1Url, setMakeupStyle1Url] = useState<string>('')  // 希望スタイル①画像URL（準決勝）
  const [makeupStyle2File, setMakeupStyle2File] = useState<EntryFile | null>(null)  // 希望スタイル②画像（準決勝）
  const [makeupStyle2Url, setMakeupStyle2Url] = useState<string>('')  // 希望スタイル②画像URL（準決勝）
  const [uploadingMakeupFile, setUploadingMakeupFile] = useState(false)
  const [basicInfo, setBasicInfo] = useState<Partial<BasicInfo> | null>(null)  // 基本情報
  const [makeupApplicant, setMakeupApplicant] = useState<'representative' | 'partner' | ''>('')  // メイク申請者（準決勝）
  // 決勝用の状態
  const [makeupApplicantFinal, setMakeupApplicantFinal] = useState<'representative' | 'partner' | ''>('')  // メイク申請者（決勝）
  const [makeupStyle1FileFinal, setMakeupStyle1FileFinal] = useState<EntryFile | null>(null)  // 希望スタイル①画像（決勝）
  const [makeupStyle1UrlFinal, setMakeupStyle1UrlFinal] = useState<string>('')  // 希望スタイル①画像URL（決勝）
  const [makeupStyle2FileFinal, setMakeupStyle2FileFinal] = useState<EntryFile | null>(null)  // 希望スタイル②画像（決勝）
  const [makeupStyle2UrlFinal, setMakeupStyle2UrlFinal] = useState<string>('')  // 希望スタイル②画像URL（決勝）

  useEffect(() => {
    loadApplicationsInfo()
  }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
        setApplicationsInfo(data)
      }

      // 観覧席希望申請データを取得
      const { data: seatData } = await supabase
        .from('seat_request')
        .select('*')
        .eq('entry_id', entry.id)
        .maybeSingle()

      if (seatData) {
        setSeatRequest(seatData)
      }
      
      // 基本情報を取得
      const { data: basicData } = await supabase
        .from('basic_info')
        .select('*')
        .eq('entry_id', entry.id)
        .maybeSingle()
      
      if (basicData) {
        setBasicInfo(basicData)
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
      
      // 希望スタイル①画像を取得
      const { data: style1File } = await supabase
        .from('entry_files')
        .select('*')
        .eq('entry_id', entry.id)
        .eq('purpose', 'makeup_style1')
        .maybeSingle()
      
      if (style1File) {
        setMakeupStyle1File(style1File)
        const { data } = await supabase.storage
          .from('files')
          .createSignedUrl(style1File.file_path, 3600)
        if (data?.signedUrl) {
          setMakeupStyle1Url(data.signedUrl)
        }
      }
      
      // 希望スタイル②画像を取得（準決勝）
      const { data: style2File } = await supabase
        .from('entry_files')
        .select('*')
        .eq('entry_id', entry.id)
        .eq('purpose', 'makeup_style2')
        .maybeSingle()
      
      if (style2File) {
        setMakeupStyle2File(style2File)
        const { data } = await supabase.storage
          .from('files')
          .createSignedUrl(style2File.file_path, 3600)
        if (data?.signedUrl) {
          setMakeupStyle2Url(data.signedUrl)
        }
      }
      
      // 決勝用の希望スタイル①画像を取得
      const { data: style1FileFinal } = await supabase
        .from('entry_files')
        .select('*')
        .eq('entry_id', entry.id)
        .eq('purpose', 'makeup_style1_final')
        .maybeSingle()
      
      if (style1FileFinal) {
        setMakeupStyle1FileFinal(style1FileFinal)
        const { data } = await supabase.storage
          .from('files')
          .createSignedUrl(style1FileFinal.file_path, 3600)
        if (data?.signedUrl) {
          setMakeupStyle1UrlFinal(data.signedUrl)
        }
      }
      
      // 決勝用の希望スタイル②画像を取得
      const { data: style2FileFinal } = await supabase
        .from('entry_files')
        .select('*')
        .eq('entry_id', entry.id)
        .eq('purpose', 'makeup_style2_final')
        .maybeSingle()
      
      if (style2FileFinal) {
        setMakeupStyle2FileFinal(style2FileFinal)
        const { data } = await supabase.storage
          .from('files')
          .createSignedUrl(style2FileFinal.file_path, 3600)
        if (data?.signedUrl) {
          setMakeupStyle2UrlFinal(data.signedUrl)
        }
      }
    } catch (err) {
      console.error('各種申請情報の読み込みエラー:', err)
      setError('各種申請情報の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const calculateTicketTotal = () => {
    let count = 0
    for (let i = 1; i <= 5; i++) {
      if (applicationsInfo[`related${i}_name` as keyof ApplicationsInfo]) {
        count++
      }
    }
    const total = count * TICKET_PRICE
    setApplicationsInfo(prev => ({
      ...prev,
      related_ticket_count: count,
      related_ticket_total_amount: total
    }))
  }

  const calculateCompanionTotal = () => {
    let count = 0
    for (let i = 1; i <= 3; i++) {
      if (applicationsInfo[`companion${i}_name` as keyof ApplicationsInfo]) {
        count++
      }
    }
    const total = count * COMPANION_FEE
    setApplicationsInfo(prev => ({
      ...prev,
      companion_total_amount: total
    }))
  }

  const handleSave = async (isTemporary = false) => {
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
        const { error } = await supabase
          .from('applications_info')
          .update({
            ...applicationsInfo,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('applications_info')
          .insert({
            ...applicationsInfo,
            entry_id: entry.id
          })

        if (error) throw error
      }

      // 観覧席希望申請データを保存
      const { data: existingSeatData } = await supabase
        .from('seat_request')
        .select('id')
        .eq('entry_id', entry.id)
        .maybeSingle()

      if (existingSeatData) {
        // 更新
        const { error } = await supabase
          .from('seat_request')
          .update({
            ...seatRequest,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('seat_request')
          .insert({
            ...seatRequest,
            entry_id: entry.id
          })

        if (error) throw error
      }

      setSuccess(isTemporary ? '各種申請情報を一時保存しました' : '各種申請情報を保存しました')
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
      
      // ファイルタイプの検証
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`許可されていないファイル形式です。JPG、PNG、GIF、WEBP、PDFのみアップロード可能です。(現在のファイル: ${file.type || '不明'})`)
      }
      
      // ファイルサイズの検証（10MB以下）
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('ファイルサイズが10MBを超えています')
      }
      
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${entry.id}/applications/payment_slip_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

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

  // メイクスタイル画像のアップロード処理
  const handleMakeupStyleUpload = async (file: File, styleNumber: 1 | 2, isFinal: boolean = false) => {
    try {
      setUploadingMakeupFile(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry.id}/makeup/${isFinal ? 'final_' : ''}style${styleNumber}_${Date.now()}.${fileExt}`
      
      // 既存のファイルがある場合は削除
      const existingFile = isFinal 
        ? (styleNumber === 1 ? makeupStyle1FileFinal : makeupStyle2FileFinal)
        : (styleNumber === 1 ? makeupStyle1File : makeupStyle2File)
      if (existingFile) {
        await supabase.storage.from('files').remove([existingFile.file_path])
        await supabase.from('entry_files').delete().eq('id', existingFile.id)
      }
      
      // 新しいファイルをアップロード
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // entry_filesテーブルに保存
      const { data: fileData, error: dbError } = await supabase
        .from('entry_files')
        .insert({
          entry_id: entry.id,
          file_type: 'photo',
          file_name: file.name,
          file_path: fileName,
          purpose: `makeup_style${styleNumber}${isFinal ? '_final' : ''}`
        })
        .select()
        .single()

      if (dbError) throw dbError

      // 署名付きURLを取得
      const { data } = await supabase.storage
        .from('files')
        .createSignedUrl(fileName, 3600)
      
      if (data?.signedUrl) {
        if (isFinal) {
          if (styleNumber === 1) {
            setMakeupStyle1FileFinal(fileData)
            setMakeupStyle1UrlFinal(data.signedUrl)
          } else {
            setMakeupStyle2FileFinal(fileData)
            setMakeupStyle2UrlFinal(data.signedUrl)
          }
        } else {
          if (styleNumber === 1) {
            setMakeupStyle1File(fileData)
            setMakeupStyle1Url(data.signedUrl)
          } else {
            setMakeupStyle2File(fileData)
            setMakeupStyle2Url(data.signedUrl)
          }
        }
      }
      
      const stage = isFinal ? '（決勝）' : '（準決勝）'
      setSuccess(`希望スタイル${styleNumber === 1 ? '①' : '②'}${stage}の画像をアップロードしました`)
    } catch (err) {
      console.error('メイクスタイル画像アップロードエラー:', err)
      const stage = isFinal ? '（決勝）' : '（準決勝）'
      setError(`希望スタイル${styleNumber === 1 ? '①' : '②'}${stage}の画像アップロードに失敗しました`)
    } finally {
      setUploadingMakeupFile(false)
    }
  }

  // メイクスタイル画像の削除処理
  const handleMakeupStyleDelete = async (styleNumber: 1 | 2, isFinal: boolean = false) => {
    const stage = isFinal ? '（決勝）' : '（準決勝）'
    if (!window.confirm(`希望スタイル${styleNumber === 1 ? '①' : '②'}${stage}の画像を削除してもよろしいですか？`)) return

    try {
      const fileToDelete = isFinal
        ? (styleNumber === 1 ? makeupStyle1FileFinal : makeupStyle2FileFinal)
        : (styleNumber === 1 ? makeupStyle1File : makeupStyle2File)
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
        .eq('id', fileToDelete.id)

      if (dbError) throw dbError

      // 状態を更新
      if (isFinal) {
        if (styleNumber === 1) {
          setMakeupStyle1FileFinal(null)
          setMakeupStyle1UrlFinal('')
        } else {
          setMakeupStyle2FileFinal(null)
          setMakeupStyle2UrlFinal('')
        }
      } else {
        if (styleNumber === 1) {
          setMakeupStyle1File(null)
          setMakeupStyle1Url('')
        } else {
          setMakeupStyle2File(null)
          setMakeupStyle2Url('')
        }
      }

      setSuccess(`希望スタイル${styleNumber === 1 ? '①' : '②'}${stage}の画像を削除しました`)
    } catch (err) {
      console.error('メイクスタイル画像削除エラー:', err)
      setError(`希望スタイル${styleNumber === 1 ? '①' : '②'}${stage}の画像削除に失敗しました`)
    }
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  const relationshipOptions = [
    '振付師',
    '振付師の代理人',
    'スポンサー'
  ]


  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">各種申請</h3>

      <DeadlineNoticeAsync deadlineKey="optional_request_deadline" />

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
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ticket'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            関係者チケット注文申請
          </button>
          <button
            onClick={() => setActiveTab('companion')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'companion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            選手同伴申請
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            払込用紙
          </button>
          <button
            onClick={() => setActiveTab('makeup')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'makeup'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            メイク・ヘアメイク予約申請
          </button>
          <button
            onClick={() => setActiveTab('seat')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'seat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            観覧席希望申請
          </button>
        </nav>
      </div>

      {/* 関係者チケット注文申請 */}
      {activeTab === 'ticket' && (
        <div className="space-y-6">
          <h4 className="font-medium">関係者チケット注文申請</h4>
          <p className="text-sm text-gray-600">
            関係者チケット（1枚 {TICKET_PRICE.toLocaleString()}円）を購入される方の情報を入力してください。
          </p>

          {[1, 2, 3, 4, 5].map((num) => (
            <div key={`related${num}`} className="border rounded-lg p-4 space-y-4">
              <h5 className="font-medium">関係者{num}</h5>
              
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">合計人数</span>
              <span className="text-lg">{applicationsInfo.related_ticket_count || 0}人</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">合計金額</span>
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
          <h4 className="font-medium">選手同伴申請</h4>
          <p className="text-sm text-gray-600">
            選手と同伴される方の情報を入力してください。（1名につき {COMPANION_FEE.toLocaleString()}円）
          </p>

          {[1, 2, 3].map((num) => (
            <div key={`companion${num}`} className="border rounded-lg p-4 space-y-4">
              <h5 className="font-medium">同伴者{num}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    同伴氏名
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`companion${num}_name` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => {
                      setApplicationsInfo(prev => ({ ...prev, [`companion${num}_name`]: e.target.value }))
                      setTimeout(calculateCompanionTotal, 0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    placeholder="例：付き添い、撮影、介助など"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">合計金額</span>
              <span className="text-lg font-bold text-blue-600">
                ¥{(applicationsInfo.companion_total_amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* メイク・ヘアメイク予約申請 */}
      {activeTab === 'makeup' && (
        <div className="space-y-8">
          <h4 className="font-medium">メイク・ヘアメイク予約申請</h4>

          {/* 準決勝用 */}
          <div className="border rounded-lg p-6 space-y-4">
            <h5 className="font-medium text-lg border-b pb-2">準決勝用</h5>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                希望美容師
              </label>
              <input
                type="text"
                value={applicationsInfo.makeup_preferred_stylist || ''}
                onChange={(e) => setApplicationsInfo(prev => ({ ...prev, makeup_preferred_stylist: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="希望がある場合は美容師名を入力してください"
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              申請者氏名 <span className="text-red-500">*</span>
            </label>
            <select
              value={makeupApplicant}
              onChange={(e) => {
                const value = e.target.value as 'representative' | 'partner' | ''
                setMakeupApplicant(value)
                
                // 選択に応じて氏名、メール、電話番号を自動設定
                if (value === 'representative' && basicInfo) {
                  setApplicationsInfo(prev => ({
                    ...prev,
                    makeup_name: basicInfo.representative_name || '',
                    makeup_email: basicInfo.representative_email || '',
                    makeup_phone: basicInfo.phone_number || ''
                  }))
                } else if (value === 'partner' && basicInfo && basicInfo.partner_name) {
                  setApplicationsInfo(prev => ({
                    ...prev,
                    makeup_name: basicInfo.partner_name || '',
                    makeup_email: '', // パートナーのメールアドレスは基本情報にないため空にする
                    makeup_phone: basicInfo.phone_number || '' // 電話番号は共通
                  }))
                } else {
                  setApplicationsInfo(prev => ({
                    ...prev,
                    makeup_name: '',
                    makeup_email: '',
                    makeup_phone: ''
                  }))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">選択してください</option>
              <option value="representative">
                {basicInfo?.representative_name || 'エントリー者'}
              </option>
              {basicInfo?.partner_name && (
                <option value="partner">
                  {basicInfo.partner_name} (ペア)
                </option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={applicationsInfo.makeup_email || ''}
              onChange={(e) => setApplicationsInfo(prev => ({ ...prev, makeup_email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ご連絡先電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={applicationsInfo.makeup_phone || ''}
              onChange={(e) => setApplicationsInfo(prev => ({ ...prev, makeup_phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例: 090-1234-5678"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                希望スタイル① （画像アップロード）
              </label>
              {makeupStyle1Url ? (
                <div className="relative border rounded-lg p-3 bg-white">
                  <div className="relative h-40 mb-2 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={makeupStyle1Url}
                      alt="希望スタイル①"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMakeupStyleDelete(1, false)}
                    className="w-full mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    画像を削除
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleMakeupStyleUpload(file, 1, false)
                        e.target.value = ''
                      }
                    }}
                    disabled={uploadingMakeupFile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {uploadingMakeupFile && (
                    <p className="mt-2 text-sm text-blue-600">アップロード中...</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    参考にしたいメイク・ヘアスタイルの画像をアップロードしてください
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                希望スタイル② （画像アップロード）
              </label>
              {makeupStyle2Url ? (
                <div className="relative border rounded-lg p-3 bg-white">
                  <div className="relative h-40 mb-2 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={makeupStyle2Url}
                      alt="希望スタイル②"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMakeupStyleDelete(2, false)}
                    className="w-full mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    画像を削除
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleMakeupStyleUpload(file, 2, false)
                        e.target.value = ''
                      }
                    }}
                    disabled={uploadingMakeupFile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {uploadingMakeupFile && (
                    <p className="mt-2 text-sm text-blue-600">アップロード中...</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    参考にしたいメイク・ヘアスタイルの画像をアップロードしてください
                  </p>
                </div>
              )}
            </div>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                備考欄
              </label>
              <textarea
                value={applicationsInfo.makeup_notes || ''}
                onChange={(e) => setApplicationsInfo(prev => ({ ...prev, makeup_notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="その他、ご要望や注意事項があればご記入ください"
              />
            </div>
          </div>

          {/* 決勝用 */}
          <div className="border rounded-lg p-6 space-y-4">
            <h5 className="font-medium text-lg border-b pb-2">決勝用</h5>
            <p className="text-sm text-gray-600">※決勝でメイク・ヘアメイクを変更される場合はご記入ください。</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                希望美容師
              </label>
              <input
                type="text"
                value={applicationsInfo.makeup_preferred_stylist_final || ''}
                onChange={(e) => setApplicationsInfo(prev => ({ ...prev, makeup_preferred_stylist_final: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="希望がある場合は美容師名を入力してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                申請者氏名
              </label>
              <select
                value={makeupApplicantFinal}
                onChange={(e) => {
                  const value = e.target.value as 'representative' | 'partner' | ''
                  setMakeupApplicantFinal(value)
                  
                  // 選択に応じて氏名を設定（メールと電話番号は手動入力）
                  if (value === 'representative' && basicInfo) {
                    setApplicationsInfo(prev => ({
                      ...prev,
                      makeup_name_final: basicInfo.representative_name || ''
                    }))
                  } else if (value === 'partner' && basicInfo && basicInfo.partner_name) {
                    setApplicationsInfo(prev => ({
                      ...prev,
                      makeup_name_final: basicInfo.partner_name || ''
                    }))
                  } else {
                    setApplicationsInfo(prev => ({
                      ...prev,
                      makeup_name_final: ''
                    }))
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">選択してください</option>
                <option value="representative">
                  {basicInfo?.representative_name || 'エントリー者'}
                </option>
                {basicInfo?.partner_name && (
                  <option value="partner">
                    {basicInfo.partner_name} (ペア)
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={applicationsInfo.makeup_email_final || ''}
                onChange={(e) => setApplicationsInfo(prev => ({ ...prev, makeup_email_final: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ご連絡先電話番号
              </label>
              <input
                type="tel"
                value={applicationsInfo.makeup_phone_final || ''}
                onChange={(e) => setApplicationsInfo(prev => ({ ...prev, makeup_phone_final: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="090-1234-5678"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  希望スタイル① （画像アップロード）
                </label>
                {makeupStyle1UrlFinal ? (
                  <div className="relative border rounded-lg p-3 bg-white">
                    <div className="relative h-40 mb-2 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={makeupStyle1UrlFinal}
                        alt="希望スタイル①（決勝）"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMakeupStyleDelete(1, true)}
                      className="w-full mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      画像を削除
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleMakeupStyleUpload(file, 1, true)
                          e.target.value = ''
                        }
                      }}
                      disabled={uploadingMakeupFile}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {uploadingMakeupFile && (
                      <p className="mt-2 text-sm text-blue-600">アップロード中...</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      参考にしたいメイク・ヘアスタイルの画像をアップロードしてください
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  希望スタイル② （画像アップロード）
                </label>
                {makeupStyle2UrlFinal ? (
                  <div className="relative border rounded-lg p-3 bg-white">
                    <div className="relative h-40 mb-2 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={makeupStyle2UrlFinal}
                        alt="希望スタイル②（決勝）"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMakeupStyleDelete(2, true)}
                      className="w-full mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      画像を削除
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleMakeupStyleUpload(file, 2, true)
                          e.target.value = ''
                        }
                      }}
                      disabled={uploadingMakeupFile}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {uploadingMakeupFile && (
                      <p className="mt-2 text-sm text-blue-600">アップロード中...</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      参考にしたいメイク・ヘアスタイルの画像をアップロードしてください
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                備考欄
              </label>
              <textarea
                value={applicationsInfo.makeup_notes_final || ''}
                onChange={(e) => setApplicationsInfo(prev => ({ ...prev, makeup_notes_final: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="その他、ご要望や注意事項があればご記入ください"
              />
            </div>
          </div>
        </div>
      )}

      {/* 払込用紙 */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <h4 className="font-medium">払込用紙</h4>
          <p className="text-sm text-gray-600">
            関係者チケットまたは選手同伴申請をされた場合は、払込用紙をアップロードしてください。
          </p>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span>関係者チケット合計</span>
              <span>¥{(applicationsInfo.related_ticket_total_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>選手同伴申請合計</span>
              <span>¥{(applicationsInfo.companion_total_amount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-bold">
                <span>総合計</span>
                <span className="text-lg text-blue-600">
                  ¥{((applicationsInfo.related_ticket_total_amount || 0) + (applicationsInfo.companion_total_amount || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                払込用紙のアップロード（複数枚可）
              </label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload(file)
                      e.target.value = ''  // inputをリセット
                    }
                  }}
                  disabled={uploadingFile}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">
                  対応形式: JPG、PNG、GIF、WEBP、PDF（最大10MB）
                </p>
                {uploadingFile && (
                  <p className="mt-2 text-sm text-blue-600">アップロード中...</p>
                )}
              </div>
            </div>

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
                          paymentSlipUrls[file.id] ? (
                            <div 
                              className="h-40 mb-2 bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedPdfUrl(paymentSlipUrls[file.id])}
                              title="クリックで拡大表示"
                            >
                              <iframe
                                src={paymentSlipUrls[file.id]}
                                className="w-full h-full pointer-events-none"
                                title={file.file_name}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                                <svg className="h-8 w-8 text-white opacity-0 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <div className="h-40 mb-2 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-sm text-gray-500">PDFを読み込み中...</span>
                            </div>
                          )
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
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="その他、申請に関する注意事項や要望があれば記入してください"
            />
          </div>
        </div>
      )}

      {/* PDFモーダル */}
      {selectedPdfUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPdfUrl(null)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-6xl h-5/6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPdfUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="h-full rounded-lg overflow-hidden">
              <iframe
                src={selectedPdfUrl}
                className="w-full h-full"
                title="PDFプレビュー"
              />
            </div>
          </div>
        </div>
      )}

      {/* 観覧席希望申請 */}
      {activeTab === 'seat' && (
        <div className="space-y-6">
          <h4 className="font-medium">観覧席希望申請</h4>
          <p className="text-sm text-gray-600">
            観覧席のご希望を申請してください。座席種別ごとに希望枚数を入力してください。
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              ※観覧席の申請は希望であり、確約ではありません。抽選により決定いたします。
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  プレミアム席（希望枚数）
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={seatRequest.premium_seats || 0}
                  onChange={(e) => setSeatRequest(prev => ({ ...prev, premium_seats: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">最前列中央エリア</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SS席（希望枚数）
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={seatRequest.ss_seats || 0}
                  onChange={(e) => setSeatRequest(prev => ({ ...prev, ss_seats: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">前方席</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  S席（希望枚数）
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={seatRequest.s_seats || 0}
                  onChange={(e) => setSeatRequest(prev => ({ ...prev, s_seats: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">中央エリア</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  A席（希望枚数）
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={seatRequest.a_seats || 0}
                  onChange={(e) => setSeatRequest(prev => ({ ...prev, a_seats: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">サイド・後方席</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  B席（希望枚数）
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={seatRequest.b_seats || 0}
                  onChange={(e) => setSeatRequest(prev => ({ ...prev, b_seats: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">最後方席</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h5 className="font-medium text-sm mb-2">合計希望枚数</h5>
              <p className="text-2xl font-bold text-gray-900">
                {(seatRequest.premium_seats || 0) + (seatRequest.ss_seats || 0) + 
                 (seatRequest.s_seats || 0) + (seatRequest.a_seats || 0) + 
                 (seatRequest.b_seats || 0)} 枚
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 space-x-4">
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? '一時保存中...' : '一時保存'}
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}