'use client'

import { FormField } from '@/components/ui'
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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">賞金振込先情報</h4>
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