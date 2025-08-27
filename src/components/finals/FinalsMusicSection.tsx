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
  audioFiles?: Record<string, { file_name: string }>
}

export const FinalsMusicSection: React.FC<FinalsMusicSectionProps> = ({
  finalsInfo,
  musicChangeOption,
  validationErrors,
  onChange,
  onMusicChangeOption,
  onFileUpload,
  onFileDelete,
  audioFiles
}) => {
  console.log('[FINALS MUSIC SECTION DEBUG] === FinalsMusicSection レンダリング ===')
  console.log('[FINALS MUSIC SECTION DEBUG] audioFiles:', audioFiles)
  console.log('[FINALS MUSIC SECTION DEBUG] audioFiles?.music_data_path:', audioFiles?.music_data_path)
  console.log('[FINALS MUSIC SECTION DEBUG] finalsInfo.music_data_path:', finalsInfo.music_data_path)
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">楽曲情報</h4>
      
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
          楽曲情報の変更 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center text-gray-900">
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
          <label className="flex items-center text-gray-900">
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
        <label className="block text-sm font-medium text-gray-900 mb-2">
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
        
        {musicChangeOption === 'changed' && finalsInfo.copyright_permission === 'commercial' && (
          <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <div className="text-sm text-orange-800 space-y-2">
              <p className="font-medium">◆「A.市販の楽曲を使用する」を選択される場合</p>
              <p>
                JASRAC、NexTone 等の音楽著作権管理団体の管理楽曲（管理状況で演奏、ビデオ、放送、配信にすべて〇がついているもの）である必要があります。
              </p>
              <p>
                下記の検索から規定を満たす楽曲であるかご確認をお願いいたします。
              </p>
              <div className="space-y-1 mt-2">
                <p>
                  <a href="https://www2.jasrac.or.jp/eJwid/main?trxID=F00100" target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline">
                    JASRAC検索
                  </a>
                </p>
                <p>
                  <a href="https://search.nex-tone.co.jp/list" target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:text-blue-800 underline">
                    NexTone検索
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
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
      />

      <FormField
        label="アーティスト"
        name="artist"
        value={finalsInfo.artist || ''}
        onChange={(e) => onChange({ artist: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
      />

      <FormField
        label="レコード番号"
        name="record_number"
        value={finalsInfo.record_number || ''}
        onChange={(e) => onChange({ record_number: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
      />

      <FormField
        label="JASRAC作品コード"
        name="jasrac_code"
        value={finalsInfo.jasrac_code || ''}
        onChange={(e) => onChange({ jasrac_code: e.target.value })}
        disabled={musicChangeOption === 'unchanged'}
        required={musicChangeOption === 'changed' && finalsInfo.copyright_permission === 'commercial'}
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
      
      {musicChangeOption === 'changed' && (finalsInfo.music_type === 'cd' || finalsInfo.music_type === 'download') && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800 space-y-2">
            <p className="font-medium">◆「CD楽曲」または「データダウンロード楽曲」を選択される場合</p>
            <p>
              日本レコード協会に加盟している出版社から市販されている音源を使用する必要があります。
            </p>
            <p>
              下記の出版社検索から加盟済であるかご確認をお願いいたします。
            </p>
            <div className="mt-2">
              <p>
                <a href="https://www.riaj.or.jp/about/member/" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 underline">
                  日本レコード協会加盟出版社検索
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          楽曲データ {musicChangeOption === 'changed' && <span className="text-red-500">*</span>}
        </label>
        <AudioUpload
          label=""
          value={(() => {
            console.log('[FINALS MUSIC DATA DISPLAY] === 決勝楽曲データ表示値の計算 ===')
            console.log('[FINALS MUSIC DATA DISPLAY] audioFiles:', audioFiles)
            console.log('[FINALS MUSIC DATA DISPLAY] audioFiles?.music_data_path:', audioFiles?.music_data_path)
            console.log('[FINALS MUSIC DATA DISPLAY] finalsInfo.music_data_path:', finalsInfo.music_data_path)
            
            // URLが存在する場合はURL、そうでなければfile_name
            const urlValue = finalsInfo.music_data_path
            const displayValue = urlValue || audioFiles?.music_data_path?.file_name || ''
            console.log('[FINALS MUSIC DATA DISPLAY] URL値:', urlValue)
            console.log('[FINALS MUSIC DATA DISPLAY] 最終表示値:', displayValue)
            
            return displayValue
          })()}
          onChange={(file) => {
            console.log('[FINALS MUSIC DATA UPLOAD] === 決勝楽曲データファイル選択 ===')
            console.log('[FINALS MUSIC DATA UPLOAD] 選択されたファイル:', file.name)
            onFileUpload('music_data_path', file)
          }}
          onDelete={onFileDelete ? () => {
            console.log('[FINALS MUSIC DATA DELETE] === 決勝楽曲データ削除 ===')
            onFileDelete('music_data_path')
          } : undefined}
          disabled={musicChangeOption === 'unchanged'}
          required={musicChangeOption === 'changed'}
          accept=".wav,.mp3,.m4a"
        />
      </div>
    </div>
  )
}