'use client'

import { FormField, ImageUpload } from '@/components/ui'
import type { FinalsInfo } from '@/lib/types'
import { finalsColorTypes } from '@/utils/finalsValidation'

interface FinalsLightingSectionProps {
  finalsInfo: Partial<FinalsInfo>
  lightingChangeOption: 'same' | 'different' | ''
  validationErrors: string[]
  onChange: (updates: Partial<FinalsInfo>) => void
  onLightingChangeOption: (option: 'same' | 'different') => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete?: (field: string) => void
  isEditable?: boolean
}

export const FinalsLightingSection: React.FC<FinalsLightingSectionProps> = ({
  finalsInfo,
  lightingChangeOption,
  validationErrors,
  onChange,
  onLightingChangeOption,
  onFileUpload,
  onFileDelete,
  isEditable = true
}) => {
  return (
    <div className="space-y-6">
      <h4 className="font-medium text-gray-900">照明指示情報</h4>
      
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
      
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          準決勝との照明指示変更の有無 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center text-gray-900">
            <input
              type="radio"
              name="lighting_change_option"
              value="same"
              checked={lightingChangeOption === 'same'}
              onChange={(e) => {
                if (e.target.checked) {
                  onLightingChangeOption('same')
                }
              }}
              disabled={!isEditable}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝と同じ照明指示
          </label>
          <label className="flex items-center text-gray-900">
            <input
              type="radio"
              name="lighting_change_option"
              value="different"
              checked={lightingChangeOption === 'different'}
              onChange={(e) => {
                if (e.target.checked) {
                  onLightingChangeOption('different')
                }
              }}
              disabled={!isEditable}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝と異なる照明指示
          </label>
        </div>
      </div>

      <FormField
        label="決勝 - 踊り出しタイミング"
        name="dance_start_timing"
        type="select"
        value={finalsInfo.dance_start_timing || ''}
        onChange={(e) => onChange({ dance_start_timing: e.target.value })}
        disabled={lightingChangeOption === 'same'}
        required={lightingChangeOption === 'different'}
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
              label={`時間${sceneNum === 1 && lightingChangeOption === 'different' ? ' *' : ''}`}
              name={`scene${sceneNum}_time`}
              value={finalsInfo[`scene${sceneNum}_time` as keyof FinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_time`]: e.target.value })}
              placeholder="例：0:30"
              disabled={lightingChangeOption === 'same'}
              required={sceneNum === 1 && lightingChangeOption === 'different'}
            />

            <FormField
              label={`きっかけ${sceneNum === 1 && lightingChangeOption === 'different' ? ' *' : ''}`}
              name={`scene${sceneNum}_trigger`}
              value={finalsInfo[`scene${sceneNum}_trigger` as keyof FinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_trigger`]: e.target.value })}
              disabled={lightingChangeOption === 'same'}
              required={sceneNum === 1 && lightingChangeOption === 'different'}
            />

            <FormField
              label={`色・系統${sceneNum === 1 && lightingChangeOption === 'different' ? ' *' : ''}`}
              name={`scene${sceneNum}_color_type`}
              type="select"
              value={finalsInfo[`scene${sceneNum}_color_type` as keyof FinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_color_type`]: e.target.value })}
              disabled={lightingChangeOption === 'same'}
              required={sceneNum === 1 && lightingChangeOption === 'different'}
            >
              <option value="">選択してください</option>
              {finalsColorTypes.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </FormField>

            <FormField
              label={`色・系統その他${sceneNum === 1 && lightingChangeOption === 'different' ? ' *' : ''}`}
              name={`scene${sceneNum}_color_other`}
              value={finalsInfo[`scene${sceneNum}_color_other` as keyof FinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_color_other`]: e.target.value })}
              placeholder="具体的な色の指定など"
              disabled={lightingChangeOption === 'same'}
              required={sceneNum === 1 && lightingChangeOption === 'different'}
            />

            <FormField
              label={`イメージ${sceneNum === 1 && lightingChangeOption === 'different' ? ' *' : ''}`}
              name={`scene${sceneNum}_image`}
              value={finalsInfo[`scene${sceneNum}_image` as keyof FinalsInfo] as string || ''}
              onChange={(e) => onChange({ [`scene${sceneNum}_image`]: e.target.value })}
              disabled={lightingChangeOption === 'same'}
              required={sceneNum === 1 && lightingChangeOption === 'different'}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                イメージ画像 {sceneNum === 1 && lightingChangeOption === 'different' && <span className="text-red-500">*</span>}
              </label>
              <ImageUpload
                value={finalsInfo[`scene${sceneNum}_image_path` as keyof FinalsInfo] as string}
                onChange={(file) => onFileUpload(`scene${sceneNum}_image_path`, file)}
                onDelete={onFileDelete ? () => onFileDelete(`scene${sceneNum}_image_path`) : undefined}
                required={sceneNum === 1 && lightingChangeOption === 'different'}
                disabled={lightingChangeOption === 'same' || !isEditable}
                isEditable={isEditable && lightingChangeOption !== 'same'}
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                label="備考"
                name={`scene${sceneNum}_notes`}
                type="textarea"
                value={finalsInfo[`scene${sceneNum}_notes` as keyof FinalsInfo] as string || ''}
                onChange={(e) => onChange({ [`scene${sceneNum}_notes`]: e.target.value })}
                disabled={lightingChangeOption === 'same'}
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
            label={`時間${lightingChangeOption === 'different' ? ' *' : ''}`}
            name="chaser_exit_time"
            value={finalsInfo.chaser_exit_time || ''}
            onChange={(e) => onChange({ chaser_exit_time: e.target.value })}
            disabled={lightingChangeOption === 'same'}
            required={lightingChangeOption === 'different'}
          />

          <FormField
            label={`きっかけ${lightingChangeOption === 'different' ? ' *' : ''}`}
            name="chaser_exit_trigger"
            value={finalsInfo.chaser_exit_trigger || ''}
            onChange={(e) => onChange({ chaser_exit_trigger: e.target.value })}
            disabled={lightingChangeOption === 'same'}
            required={lightingChangeOption === 'different'}
          />

          <FormField
            label={`色・系統${lightingChangeOption === 'different' ? ' *' : ''}`}
            name="chaser_exit_color_type"
            type="select"
            value={finalsInfo.chaser_exit_color_type || ''}
            onChange={(e) => onChange({ chaser_exit_color_type: e.target.value })}
            disabled={lightingChangeOption === 'same'}
            required={lightingChangeOption === 'different'}
          >
            <option value="">選択してください</option>
            {finalsColorTypes.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </FormField>

          <FormField
            label={`色・系統その他${lightingChangeOption === 'different' ? ' *' : ''}`}
            name="chaser_exit_color_other"
            value={finalsInfo.chaser_exit_color_other || ''}
            onChange={(e) => onChange({ chaser_exit_color_other: e.target.value })}
            placeholder="具体的な色の指定など"
            disabled={lightingChangeOption === 'same'}
            required={lightingChangeOption === 'different'}
          />

          <FormField
            label={`イメージ${lightingChangeOption === 'different' ? ' *' : ''}`}
            name="chaser_exit_image"
            value={finalsInfo.chaser_exit_image || ''}
            onChange={(e) => onChange({ chaser_exit_image: e.target.value })}
            disabled={lightingChangeOption === 'same'}
            required={lightingChangeOption === 'different'}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              イメージ画像 {lightingChangeOption === 'different' && <span className="text-red-500">*</span>}
            </label>
            <ImageUpload
              value={finalsInfo.chaser_exit_image_path}
              onChange={(file) => onFileUpload('chaser_exit_image_path', file)}
              onDelete={onFileDelete ? () => onFileDelete('chaser_exit_image_path') : undefined}
              required={lightingChangeOption === 'different'}
              disabled={lightingChangeOption === 'same' || !isEditable}
              isEditable={isEditable && lightingChangeOption !== 'same'}
            />
          </div>

          <div className="md:col-span-2">
            <FormField
              label="備考"
              name="chaser_exit_notes"
              type="textarea"
              value={finalsInfo.chaser_exit_notes || ''}
              onChange={(e) => onChange({ chaser_exit_notes: e.target.value })}
              disabled={lightingChangeOption === 'same'}
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