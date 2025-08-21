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
      if (!semifinalsInfo.entry_id) return

      try {
        // entry_filesテーブルから振込確認用紙を取得
        const { data: fileData } = await supabase
          .from('entry_files')
          .select('*')
          .eq('entry_id', semifinalsInfo.entry_id)
          .eq('purpose', 'semifinals_payment_slip')
          .single()

        if (fileData) {
          // 署名付きURLを生成
          const { data: urlData } = await supabase.storage
            .from('files')
            .createSignedUrl(fileData.file_path, 3600)

          if (urlData?.signedUrl) {
            setPaymentSlipUrl(urlData.signedUrl)
          }
        }
      } catch (error) {
        console.error('振込確認用紙の読み込みエラー:', error)
      }
    }

    loadPaymentSlip()
  }, [semifinalsInfo.entry_id, supabase])

  // ファイルアップロード処理
  const handleFileUpload = async (file: File) => {
    setPaymentSlip(file)
    
    // 保存処理はSemifinalsInfoFormで行うため、ここではファイルを保持するのみ
    // 親コンポーネントに通知する場合は、onChangeを使用
    if (onChange) {
      onChange({ payment_slip_file: file } as Partial<SemifinalsInfo> & { payment_slip_file: File })
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
            accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
            maxSizeMB={10}
            category="document"
            required
          />
          
          {paymentSlipUrl && (
            <button
              type="button"
              onClick={() => {
                setPaymentSlip(null)
                setPaymentSlipUrl('')
              }}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              ファイルを削除
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          ※振込明細書、振込確認画面のスクリーンショット、PDFファイル等をアップロードしてください
        </p>
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