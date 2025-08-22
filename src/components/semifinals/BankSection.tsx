'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FormField, FileUploadField } from '@/components/ui'
import type { SemifinalsInfo } from '@/lib/types'

interface BankSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  validationErrors: string[]
  onChange: (updates: Partial<SemifinalsInfo>) => void
}

export const BankSection: React.FC<BankSectionProps> = ({
  semifinalsInfo,
  validationErrors,
  onChange
}) => {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null)
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string>('')
  
  // 既存の振込確認用紙を読み込む
  useEffect(() => {
    const loadPaymentSlip = async () => {
      console.log('[BANK SECTION LOAD] === 振込確認用紙読み込み開始 ===')
      console.log('[BANK SECTION LOAD] entry_id:', semifinalsInfo.entry_id)
      
      if (!semifinalsInfo.entry_id) {
        console.log('[BANK SECTION LOAD] entry_idがないため読み込みスキップ')
        return
      }

      try {
        console.log('[BANK SECTION LOAD] データベースから振込確認用紙を検索...')
        
        // entry_filesテーブルから振込確認用紙を取得
        const { data: fileData, error: searchError } = await supabase
          .from('entry_files')
          .select('*')
          .eq('entry_id', semifinalsInfo.entry_id)
          .eq('purpose', 'semifinals_payment_slip')
          .single()

        console.log('[BANK SECTION LOAD] 検索結果:', fileData)
        console.log('[BANK SECTION LOAD] 検索エラー:', searchError)

        if (fileData) {
          console.log('[BANK SECTION LOAD] 振込確認用紙が見つかりました:', fileData.file_name)
          
          // パブリックURLを生成
          const { data: urlData } = supabase.storage
            .from('files')
            .getPublicUrl(fileData.file_path)

          console.log('[BANK SECTION LOAD] パブリックURL:', urlData?.publicUrl)

          if (urlData?.publicUrl) {
            setPaymentSlipUrl(urlData.publicUrl)
            console.log('[BANK SECTION LOAD] URL設定完了')
          }
        } else {
          console.log('[BANK SECTION LOAD] 振込確認用紙が見つかりませんでした')
        }
      } catch (error) {
        console.error('[BANK SECTION LOAD] 振込確認用紙の読み込みエラー:', error)
      }
      
      console.log('[BANK SECTION LOAD] === 振込確認用紙読み込み完了 ===')
    }

    loadPaymentSlip()
  }, [semifinalsInfo.entry_id, supabase])

  // ファイルアップロード処理
  const handleFileUpload = async (file: File) => {
    console.log('[BANK SECTION] === 振込確認用紙アップロード開始 ===')
    console.log('[BANK SECTION] ファイル情報:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    })
    console.log('[BANK SECTION] entry_id:', semifinalsInfo.entry_id)
    
    try {
      if (!semifinalsInfo.entry_id) {
        console.error('[BANK SECTION] エラー: entry_idが存在しません')
        console.log('[BANK SECTION] 現在のsemifinalsInfo:', semifinalsInfo)
        return
      }

      // ファイルアップロード処理を実行
      console.log('[BANK SECTION] Supabaseアップロード開始...')
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${semifinalsInfo.entry_id}/semifinals/payment_slip_${Date.now()}.${fileExt}`
      
      console.log('[BANK SECTION] アップロードファイル名:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) {
        console.error('[BANK SECTION] ストレージアップロードエラー:', uploadError)
        return
      }
      
      console.log('[BANK SECTION] ストレージアップロード成功:', uploadData)

      // データベースに記録（ファイルタイプを適切に判定）
      const fileType = file.type.startsWith('image/') ? 'photo' : 
                      file.type === 'application/pdf' ? 'pdf' : 'photo'
      console.log('[BANK SECTION] ファイルタイプ判定:', {
        originalType: file.type,
        determinedType: fileType
      })
      
      const insertData = {
        entry_id: semifinalsInfo.entry_id,
        file_type: fileType,
        file_name: file.name,
        file_path: fileName,
        purpose: 'semifinals_payment_slip'
      }
      
      console.log('[BANK SECTION] データベース挿入データ:', insertData)

      const { data: fileData, error: dbError } = await supabase
        .from('entry_files')
        .insert(insertData)
        .select()
        .single()

      if (dbError) {
        console.error('[BANK SECTION] データベースエラー:', dbError)
        return
      }
      
      console.log('[BANK SECTION] データベース保存成功:', fileData)

      // パブリックURLを取得
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      if (urlData?.publicUrl) {
        console.log('[BANK SECTION] パブリックURL取得成功:', urlData.publicUrl)
        setPaymentSlipUrl(urlData.publicUrl)
      }

      setPaymentSlip(file)
      console.log('[BANK SECTION] === 振込確認用紙アップロード完了 ===')
      
    } catch (error) {
      console.error('[BANK SECTION] 予期しないエラー:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* 振込確認用紙アップロードセクション */}
      <div className="border-b pb-6 mb-6">
        <h4 className="font-medium mb-4">振込確認用紙アップロード</h4>
        
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="text-sm text-gray-700 space-y-2">
            <p className="font-semibold">■本大会エントリー料</p>
            <p className="ml-4">12,000円</p>
            
            <p className="font-semibold mt-3">■お振込先</p>
            <div className="ml-4 space-y-1">
              <p>三井住友銀行</p>
              <p>新宿西口支店</p>
              <p>普通　２２４１７６９</p>
              <p>カ）バルカー</p>
            </div>
          </div>
        </div>
        
        <div>
          <FileUploadField
            label="振込確認用紙"
            value={paymentSlipUrl}
            onChange={handleFileUpload}
            accept=".jpg,.jpeg,.png,.gif,.pdf"
            maxSizeMB={10}
            category="document"
            required
            placeholder={{
              formats: "JPEG, JPG, PNG, GIF, PDF"
            }}
          />
          
          {paymentSlipUrl && (
            <button
              type="button"
              onClick={async () => {
                console.log('[BANK SECTION DELETE] === 振込確認用紙削除開始 ===')
                console.log('[BANK SECTION DELETE] 現在のURL:', paymentSlipUrl)
                console.log('[BANK SECTION DELETE] entry_id:', semifinalsInfo.entry_id)
                
                try {
                  if (!semifinalsInfo.entry_id) {
                    console.error('[BANK SECTION DELETE] エラー: entry_idが存在しません')
                    return
                  }

                  // データベースからファイル情報を取得
                  const { data: fileData, error: searchError } = await supabase
                    .from('entry_files')
                    .select('*')
                    .eq('entry_id', semifinalsInfo.entry_id)
                    .eq('purpose', 'semifinals_payment_slip')
                    .single()

                  console.log('[BANK SECTION DELETE] 削除対象ファイル:', fileData)
                  console.log('[BANK SECTION DELETE] 検索エラー:', searchError)

                  if (fileData) {
                    // ストレージからファイル削除
                    console.log('[BANK SECTION DELETE] ストレージから削除中:', fileData.file_path)
                    const { error: storageError } = await supabase.storage
                      .from('files')
                      .remove([fileData.file_path])

                    if (storageError) {
                      console.error('[BANK SECTION DELETE] ストレージ削除エラー:', storageError)
                    } else {
                      console.log('[BANK SECTION DELETE] ストレージ削除成功')
                    }

                    // データベースからレコード削除
                    console.log('[BANK SECTION DELETE] データベースから削除中:', fileData.id)
                    const { error: dbError } = await supabase
                      .from('entry_files')
                      .delete()
                      .eq('id', fileData.id)

                    if (dbError) {
                      console.error('[BANK SECTION DELETE] データベース削除エラー:', dbError)
                    } else {
                      console.log('[BANK SECTION DELETE] データベース削除成功')
                    }
                  }

                  // UI状態をクリア
                  setPaymentSlip(null)
                  setPaymentSlipUrl('')
                  console.log('[BANK SECTION DELETE] UI状態クリア完了')
                  console.log('[BANK SECTION DELETE] === 振込確認用紙削除完了 ===')
                  
                } catch (error) {
                  console.error('[BANK SECTION DELETE] 削除処理エラー:', error)
                }
              }}
              className="mt-2 text-sm text-red-600 hover:text-red-800 cursor-pointer"
            >
              ファイルを削除
            </button>
          )}
        </div>
        
        <div className="mt-2 space-y-2">
          <p className="text-sm text-gray-600">
            ※振込明細書、振込確認画面のスクリーンショット、PDFファイル等をアップロードしてください
          </p>
          <p className="text-xs text-gray-500">
            <strong>対応ファイル形式:</strong> JPEG, JPG, PNG, GIF, PDF（最大10MB）
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="font-medium">本大会エントリー料振込確認 / 賞金振込先情報</h4>
        <p className="text-sm text-gray-500">
          <span className="text-red-500">*</span> は必須項目です
        </p>
      </div>
      
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800 font-medium">以下の項目を入力してください：</p>
          <ul className="list-disc list-inside text-sm text-red-700 mt-2">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <FormField
        label="銀行名"
        name="bank_name"
        value={semifinalsInfo.bank_name || ''}
        onChange={(e) => onChange({ bank_name: e.target.value })}
        required
      />

      <FormField
        label="支店名"
        name="branch_name"
        value={semifinalsInfo.branch_name || ''}
        onChange={(e) => onChange({ branch_name: e.target.value })}
        required
      />

      <FormField
        label="口座種類"
        name="account_type"
        type="select"
        value={semifinalsInfo.account_type || ''}
        onChange={(e) => onChange({ account_type: e.target.value })}
        required
      >
        <option value="">選択してください</option>
        <option value="普通">普通</option>
        <option value="当座">当座</option>
      </FormField>

      <FormField
        label="口座番号"
        name="account_number"
        value={semifinalsInfo.account_number || ''}
        onChange={(e) => onChange({ account_number: e.target.value })}
        required
      />

      <FormField
        label="口座名義"
        name="account_holder"
        value={semifinalsInfo.account_holder || ''}
        onChange={(e) => onChange({ account_holder: e.target.value })}
        placeholder="カタカナで入力してください"
        required
      />
    </div>
  )
}