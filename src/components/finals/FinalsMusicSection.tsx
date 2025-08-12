'use client'

import { FormField, AudioUpload } from '@/components/ui'
import type { FinalsInfo } from '@/lib/types'

interface FinalsMusicSectionProps {
  finalsInfo: Partial<FinalsInfo>
  musicChangeOption: 'changed' | 'unchanged' | ''
  validationErrors: string[]
  onChange: (updates: Partial<FinalsInfo>) => void
  onMusicChangeOption: (option: 'changed' | 'unchanged') => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete?: (field: string) => void
}

export const FinalsMusicSection: React.FC<FinalsMusicSectionProps> = ({
  finalsInfo,
  musicChangeOption,
  validationErrors,
  onChange,
  onMusicChangeOption,
  onFileUpload,
  onFileDelete
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">楽曲情報</h4>
      
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          楽曲情報の変更 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="music_change_option"
              value="unchanged"
              checked={musicChangeOption === 'unchanged'}
              onChange={() => onMusicChangeOption('unchanged')}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝から変更なし
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="music_change_option"
              value="changed"
              checked={musicChangeOption === 'changed'}
              onChange={() => onMusicChangeOption('changed')}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝から変更あり
          </label>
        </div>
      </div>

      <FormField
        label="作品タイトル"
        name="work_title"
        value={finalsInfo.work_title || ''}
        onChange={(e) => onChange({ work_title: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed'}
      />

      <FormField
        label="作品タイトル(ふりがな)"
        name="work_title_kana"
        value={finalsInfo.work_title_kana || ''}
        onChange={(e) => onChange({ work_title_kana: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed'}
        placeholder="ひらがなで入力"
      />

      <FormField
        label="作品キャラクター・ストーリー等（50字以内）"
        name="work_character_story"
        type="textarea"
        value={finalsInfo.work_character_story || ''}
        onChange={(e) => onChange({ work_character_story: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed'}
        maxLength={50}
        rows={2}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          楽曲著作権許諾 {musicChangeOption === 'changed' && <span className="text-red-500">*</span>}
        </label>
        <div className="space-y-2">
          <label className={`flex items-center ${musicChangeOption === 'unchanged' ? 'text-gray-400' : ''}`}>
            <input
              type="radio"
              name="copyright_permission"
              value="commercial"
              checked={finalsInfo.copyright_permission === 'commercial'}
              onChange={() => onChange({ copyright_permission: 'commercial' })}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              disabled={musicChangeOption === 'unchanged'}
            />
            A.市販の楽曲を使用する
          </label>
          <label className={`flex items-center ${musicChangeOption === 'unchanged' ? 'text-gray-400' : ''}`}>
            <input
              type="radio"
              name="copyright_permission"
              value="licensed"
              checked={finalsInfo.copyright_permission === 'licensed'}
              onChange={() => onChange({ copyright_permission: 'licensed' })}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              disabled={musicChangeOption === 'unchanged'}
            />
            B.自身で著作権に対し許諾を取った楽曲を使用する
          </label>
          <label className={`flex items-center ${musicChangeOption === 'unchanged' ? 'text-gray-400' : ''}`}>
            <input
              type="radio"
              name="copyright_permission"
              value="original"
              checked={finalsInfo.copyright_permission === 'original'}
              onChange={() => onChange({ copyright_permission: 'original' })}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              disabled={musicChangeOption === 'unchanged'}
            />
            C.独自に製作されたオリジナル楽曲を使用する
          </label>
        </div>
      </div>

      <FormField
        label="使用楽曲タイトル"
        name="music_title"
        value={finalsInfo.music_title || ''}
        onChange={(e) => onChange({ music_title: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed'}
      />

      <FormField
        label="収録CDタイトル"
        name="cd_title"
        value={finalsInfo.cd_title || ''}
        onChange={(e) => onChange({ cd_title: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed'}
      />

      <FormField
        label="アーティスト"
        name="artist"
        value={finalsInfo.artist || ''}
        onChange={(e) => onChange({ artist: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed'}
      />

      <FormField
        label="レコード番号"
        name="record_number"
        value={finalsInfo.record_number || ''}
        onChange={(e) => onChange({ record_number: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed'}
      />

      <FormField
        label="JASRAC作品コード"
        name="jasrac_code"
        value={finalsInfo.jasrac_code || ''}
        onChange={(e) => onChange({ jasrac_code: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed'}
      />

      <FormField
        label="楽曲種類"
        name="music_type"
        type="select"
        value={finalsInfo.music_type || ''}
        onChange={(e) => onChange({ music_type: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed'}
      >
        <option value="">選択してください</option>
        <option value="cd">CD楽曲</option>
        <option value="download">データダウンロード楽曲</option>
        <option value="other">その他（オリジナル曲）</option>
      </FormField>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          楽曲データ {musicChangeOption === 'changed' && <span className="text-red-500">*</span>}
        </label>
        <AudioUpload
          label=""
          value={finalsInfo.music_data_path}
          onChange={(file) => onFileUpload('music_data_path', file)}
          onDelete={onFileDelete ? () => onFileDelete('music_data_path') : undefined}
          disabled={musicChangeOption === 'unchanged'}
          required={musicChangeOption === 'changed'}
          accept=".wav,.mp3,.m4a"
        />
      </div>
    </div>
  )
}