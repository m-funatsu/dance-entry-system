'use client'

import { FormField, ImageUpload } from '@/components/ui'
import type { SemifinalsInfo } from '@/lib/types'
import { colorTypes } from '@/utils/semifinalsValidation'

interface LightingSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  validationErrors: string[]
  onChange: (updates: Partial<SemifinalsInfo>) => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete: (field: string) => void
  isEditable?: boolean
  uploading?: boolean
  progress?: number
}

export const LightingSection: React.FC<LightingSectionProps> = ({
  semifinalsInfo,
  validationErrors,
  onChange,
  onFileUpload,
  onFileDelete,
  isEditable = true,
  uploading = false,
  progress = 0
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">照明指示情報</h4>
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
        label="準決勝 - 踊り出しタイミング"
        name="dance_start_timing"
        type="select"
        value={semifinalsInfo.dance_start_timing || ''}
        onChange={(e) => onChange({ dance_start_timing: e.target.value })}
        disabled={!isEditable}
        required
      >
        <option value="">選択してください</option>
        <option value="音先">音先</option>
        <option value="板付">板付</option>
      </FormField>

      {/* シーン1-5 */}
      {[1, 2, 3, 4, 5].map((sceneNum) => (
        <div key={`scene${sceneNum}`} className="border-t pt-4">
          <h5 className="font-medium mb-3 text-gray-900">シーン{sceneNum}</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={`時間${sceneNum === 1 ? ' *' : ''}`}
              name={`scene${sceneNum}_time`}
              value={semifinalsInfo[`scene${sceneNum}_time` as keyof SemifinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_time`]: e.target.value })}
              disabled={!isEditable}
              placeholder="例：0:30"
              required={sceneNum === 1}
            />

            <FormField
              label={`きっかけ${sceneNum === 1 ? ' *' : ''}`}
              name={`scene${sceneNum}_trigger`}
              value={semifinalsInfo[`scene${sceneNum}_trigger` as keyof SemifinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_trigger`]: e.target.value })}
              disabled={!isEditable}
              required={sceneNum === 1}
            />

            <FormField
              label={`色・系統${sceneNum === 1 ? ' *' : ''}`}
              name={`scene${sceneNum}_color_type`}
              type="select"
              value={semifinalsInfo[`scene${sceneNum}_color_type` as keyof SemifinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_color_type`]: e.target.value })}
              disabled={!isEditable}
              required={sceneNum === 1}
            >
              <option value="">選択してください</option>
              {colorTypes.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </FormField>

            <FormField
              label={`色・系統その他${sceneNum === 1 ? ' *' : ''}`}
              name={`scene${sceneNum}_color_other`}
              value={semifinalsInfo[`scene${sceneNum}_color_other` as keyof SemifinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_color_other`]: e.target.value })}
              disabled={!isEditable}
              placeholder="具体的な色の指定など"
              required={sceneNum === 1}
            />

            <FormField
              label={`イメージ${sceneNum === 1 ? ' *' : ''}`}
              name={`scene${sceneNum}_image`}
              value={semifinalsInfo[`scene${sceneNum}_image` as keyof SemifinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_image`]: e.target.value })}
              disabled={!isEditable}
              required={sceneNum === 1}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                イメージ画像 {sceneNum === 1 && <span className="text-red-500">*</span>}
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
                      シーン{sceneNum} イメージ画像をアップロード中... {Math.round(progress)}%
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
              <ImageUpload
                value={semifinalsInfo[`scene${sceneNum}_image_path` as keyof SemifinalsInfo] as string}
                onChange={(file) => onFileUpload(`scene${sceneNum}_image_path`, file)}
                onDelete={() => onFileDelete(`scene${sceneNum}_image_path`)}
                disabled={!isEditable}
                isEditable={isEditable}
                required={sceneNum === 1}
                maxSizeMB={20}
              />
              <p className="text-xs text-gray-600 mt-2">
                シーン{sceneNum} イメージ画像の追加/削除を行った場合は必ず画面下部の<span className="text-red-600">保存ボタンをクリック</span>してください。
              </p>
            </div>

            <div className="md:col-span-2">
              <FormField
                label="備考"
                name={`scene${sceneNum}_notes`}
                type="textarea"
                value={semifinalsInfo[`scene${sceneNum}_notes` as keyof SemifinalsInfo] as string || ''}
                onChange={(e) => onChange({ [`scene${sceneNum}_notes`]: e.target.value })}
                disabled={!isEditable}
                rows={2}
              />
              <p className="text-xs text-red-600 mt-1">
                備考欄の中に細かく時間指定をご記入することはお控えください。
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* チェイサー/退場 */}
      <div className="border-t pt-4">
        <h5 className="font-medium mb-3 text-gray-900">チェイサー/退場</h5>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="時間"
            name="chaser_exit_time"
            value={semifinalsInfo.chaser_exit_time || ''}
            onChange={(e) => onChange({ chaser_exit_time: e.target.value })}
            disabled={!isEditable}
            required
          />

          <FormField
            label="きっかけ"
            name="chaser_exit_trigger"
            value={semifinalsInfo.chaser_exit_trigger || ''}
            onChange={(e) => onChange({ chaser_exit_trigger: e.target.value })}
            disabled={!isEditable}
            required
          />

          <FormField
            label="色・系統"
            name="chaser_exit_color_type"
            type="select"
            value={semifinalsInfo.chaser_exit_color_type || ''}
            onChange={(e) => onChange({ chaser_exit_color_type: e.target.value })}
            disabled={!isEditable}
            required
          >
            <option value="">選択してください</option>
            {colorTypes.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </FormField>

          <FormField
            label="色・系統その他"
            name="chaser_exit_color_other"
            value={semifinalsInfo.chaser_exit_color_other || ''}
            onChange={(e) => onChange({ chaser_exit_color_other: e.target.value })}
            disabled={!isEditable}
            placeholder="具体的な色の指定など"
            required
          />

          <FormField
            label="イメージ"
            name="chaser_exit_image"
            value={semifinalsInfo.chaser_exit_image || ''}
            onChange={(e) => onChange({ chaser_exit_image: e.target.value })}
            disabled={!isEditable}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              イメージ画像 <span className="text-red-500">*</span>
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
                    イメージ画像をアップロード中... {Math.round(progress)}%
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
            <ImageUpload
              value={semifinalsInfo.chaser_exit_image_path}
              onChange={(file) => onFileUpload('chaser_exit_image_path', file)}
              onDelete={() => onFileDelete('chaser_exit_image_path')}
              disabled={!isEditable}
              isEditable={isEditable}
              required
              maxSizeMB={20}
            />
            <p className="text-xs text-gray-600 mt-2">
              チェイサー/退場 イメージ画像の追加/削除を行った場合は必ず画面下部の<span className="text-red-600">保存ボタンをクリック</span>してください。
            </p>
          </div>

          <div className="md:col-span-2">
            <FormField
              label="備考"
              name="chaser_exit_notes"
              type="textarea"
              value={semifinalsInfo.chaser_exit_notes || ''}
              onChange={(e) => onChange({ chaser_exit_notes: e.target.value })}
              disabled={!isEditable}
              rows={2}
            />
            <p className="text-xs text-red-600 mt-1">
              備考欄の中に細かく時間指定をご記入することはお控えください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}