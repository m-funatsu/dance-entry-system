'use client'

import { FormField, AudioUpload } from '@/components/ui'
import type { SemifinalsInfo, PreliminaryInfo } from '@/lib/types'

interface MusicSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  preliminaryInfo: PreliminaryInfo | null
  validationErrors: string[]
  onChange: (updates: Partial<SemifinalsInfo>) => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete?: (field: string) => void
  audioFiles?: Record<string, { file_name: string }>
  isEditable?: boolean
}

export const MusicSection: React.FC<MusicSectionProps> = ({
  semifinalsInfo,
  preliminaryInfo,
  validationErrors,
  onChange,
  onFileUpload,
  onFileDelete,
  audioFiles,
  isEditable = true
}) => {
  console.log('[MUSIC SECTION DEBUG] === MusicSection レンダリング ===')
  console.log('[MUSIC SECTION DEBUG] audioFiles:', audioFiles)
  console.log('[MUSIC SECTION DEBUG] audioFiles.music_data_path:', audioFiles?.music_data_path)
  console.log('[MUSIC SECTION DEBUG] file_name for display:', audioFiles?.music_data_path?.file_name)
  console.log('[MUSIC SECTION DEBUG] semifinalsInfo.music_data_path:', semifinalsInfo.music_data_path)
  const handleMusicChange = (useSameMusic: boolean) => {
    if (useSameMusic) {
      // 予選の楽曲著作権許諾値を準決勝形式にマッピング
      const mapCopyrightPermission = (prelimValue: string | undefined) => {
        switch (prelimValue) {
          case 'A': return 'commercial'
          case 'B': return 'licensed'
          case 'C': return 'original'
          default: return ''
        }
      }

      // 予選と同じ楽曲を使用する場合：予選情報からコピー
      onChange({
        music_change_from_preliminary: false,
        work_title: preliminaryInfo?.work_title || '',
        work_title_kana: preliminaryInfo?.work_title_kana || '',
        work_story: preliminaryInfo?.work_story || '',
        music_title: preliminaryInfo?.music_title || '',
        cd_title: preliminaryInfo?.cd_title || '',
        artist: preliminaryInfo?.artist || '',
        record_number: preliminaryInfo?.record_number || '',
        jasrac_code: preliminaryInfo?.jasrac_code || '',
        music_type: preliminaryInfo?.music_type || '',
        copyright_permission: mapCopyrightPermission(preliminaryInfo?.music_rights_cleared)
      })
    } else {
      // 予選とは異なる楽曲を使用する場合：クリア
      onChange({
        music_change_from_preliminary: true,
        work_title: '',
        work_title_kana: '',
        work_story: '',
        music_title: '',
        cd_title: '',
        artist: '',
        record_number: '',
        jasrac_code: '',
        music_type: '',
        copyright_permission: ''
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">楽曲情報</h4>
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
      
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          予選との楽曲情報の変更 <span className="text-red-500">*</span>
        </label>
        <select
          value={
            semifinalsInfo.music_change_from_preliminary === true ? 'different' :
            semifinalsInfo.music_change_from_preliminary === false ? 'same' :
            ''
          }
          onChange={(e) => {
            if (e.target.value === 'same') {
              handleMusicChange(true)
            } else if (e.target.value === 'different') {
              handleMusicChange(false)
            } else if (e.target.value === '') {
              // 「選択してください」に戻す場合は未選択状態にリセット
              onChange({ 
                music_change_from_preliminary: undefined,
                work_title: '',
                work_title_kana: '',
                work_story: '',
                music_title: '',
                cd_title: '',
                artist: '',
                record_number: '',
                jasrac_code: '',
                music_type: '',
                copyright_permission: ''
              })
            }
          }}
          disabled={!isEditable}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          required
        >
          <option value="">選択してください</option>
          <option value="same">予選と同じ楽曲を使用する</option>
          <option value="different">予選とは異なる楽曲を使用する</option>
        </select>
        
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800 font-medium">
            📌 シード選手の方へ
          </p>
          <p className="text-xs text-blue-700 mt-1">
            シード選手の方は「予選とは異なる楽曲を使用する」を選択してください
          </p>
        </div>
        
        {!semifinalsInfo.music_change_from_preliminary && (
          <p className="text-xs text-gray-500 mt-2">
            予選で登録された楽曲情報が使用されます。
          </p>
        )}
      </div>

      <FormField
        label="作品タイトル"
        name="work_title"
        value={semifinalsInfo.work_title || ''}
        onChange={(e) => onChange({ work_title: e.target.value })}
        disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
        required
      />

      <FormField
        label="作品タイトル(ふりがな)"
        name="work_title_kana"
        value={semifinalsInfo.work_title_kana || ''}
        onChange={(e) => onChange({ work_title_kana: e.target.value })}
        disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
        required
        placeholder="ひらがなで入力"
      />

      <FormField
        label="作品キャラクター・ストーリー等（50字以内）"
        name="work_story"
        type="textarea"
        value={semifinalsInfo.work_story || ''}
        onChange={(e) => onChange({ work_story: e.target.value })}
        disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
        required
        maxLength={50}
        rows={2}
      />

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          楽曲著作権許諾 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className={`flex items-center ${!semifinalsInfo.music_change_from_preliminary ? 'cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              name="copyright_permission"
              value="commercial"
              checked={semifinalsInfo.copyright_permission === 'commercial'}
              onChange={() => onChange({ copyright_permission: 'commercial' })}
              disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
              className={`mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${
                !semifinalsInfo.music_change_from_preliminary 
                  ? 'disabled:cursor-not-allowed disabled:bg-gray-100' 
                  : ''
              }`}
            />
            <span className={!semifinalsInfo.music_change_from_preliminary ? 'text-gray-600' : 'text-gray-900'}>
              A.市販の楽曲を使用する
            </span>
          </label>
          <label className={`flex items-center ${!semifinalsInfo.music_change_from_preliminary ? 'cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              name="copyright_permission"
              value="licensed"
              checked={semifinalsInfo.copyright_permission === 'licensed'}
              onChange={() => onChange({ copyright_permission: 'licensed' })}
              disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
              className={`mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${
                !semifinalsInfo.music_change_from_preliminary 
                  ? 'disabled:cursor-not-allowed disabled:bg-gray-100' 
                  : ''
              }`}
            />
            <span className={!semifinalsInfo.music_change_from_preliminary ? 'text-gray-600' : 'text-gray-900'}>
              B.自身で著作権に対し許諾を取った楽曲を使用する
            </span>
          </label>
          <label className={`flex items-center ${!semifinalsInfo.music_change_from_preliminary ? 'cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              name="copyright_permission"
              value="original"
              checked={semifinalsInfo.copyright_permission === 'original'}
              onChange={() => onChange({ copyright_permission: 'original' })}
              disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
              className={`mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${
                !semifinalsInfo.music_change_from_preliminary 
                  ? 'disabled:cursor-not-allowed disabled:bg-gray-100' 
                  : ''
              }`}
            />
            <span className={!semifinalsInfo.music_change_from_preliminary ? 'text-gray-600' : 'text-gray-900'}>
              C.独自に製作されたオリジナル楽曲を使用する
            </span>
          </label>
        </div>
        
        {!semifinalsInfo.music_change_from_preliminary && (
          <p className="text-xs text-gray-500 mt-2">
            予選で選択された楽曲著作権許諾が使用されます。
          </p>
        )}
        
        {semifinalsInfo.music_change_from_preliminary && semifinalsInfo.copyright_permission === 'commercial' && (
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
        value={semifinalsInfo.music_title || ''}
        onChange={(e) => onChange({ music_title: e.target.value })}
        disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
        required
      />

      <div>
        <FormField
          label="収録アルバムタイトル"
          name="cd_title"
          value={semifinalsInfo.cd_title || ''}
          onChange={(e) => onChange({ cd_title: e.target.value })}
          disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
          required
        />
        <p className="text-xs text-gray-500 mt-1">シングルの場合は楽曲名を記載ください</p>
      </div>

      <FormField
        label="アーティスト"
        name="artist"
        value={semifinalsInfo.artist || ''}
        onChange={(e) => onChange({ artist: e.target.value })}
        disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
        required
      />

      <div>
        <FormField
          label="レコード番号"
          name="record_number"
          value={semifinalsInfo.record_number || ''}
          onChange={(e) => onChange({ record_number: e.target.value })}
          disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
          required
        />
        <p className="text-xs text-gray-500 mt-1">ダウンロード楽曲の場合は「ダウンロード」と記載ください</p>
      </div>

      <div>
        <FormField
          label="JASRAC作品コード"
          name="jasrac_code"
          value={semifinalsInfo.jasrac_code || ''}
          onChange={(e) => onChange({ jasrac_code: e.target.value })}
          disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
        />
        <p className="text-xs text-gray-500 mt-1">既成楽曲の場合は必須とします。オリジナル楽曲は不要です。</p>
      </div>

      <FormField
        label="楽曲種類"
        name="music_type"
        type="select"
        value={semifinalsInfo.music_type || ''}
        onChange={(e) => onChange({ music_type: e.target.value })}
        disabled={!semifinalsInfo.music_change_from_preliminary || !isEditable}
        required
      >
        <option value="">選択してください</option>
        <option value="cd">CD楽曲</option>
        <option value="download">データダウンロード楽曲</option>
        <option value="other">その他（オリジナル曲）</option>
      </FormField>
      
      {semifinalsInfo.music_change_from_preliminary && (semifinalsInfo.music_type === 'cd' || semifinalsInfo.music_type === 'download') && (
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
        <AudioUpload
          label="楽曲データ"
          value={semifinalsInfo.music_data_path || ''}
          displayName={audioFiles?.music_data_path?.file_name}
          onChange={(file) => {
            console.log('[MUSIC DATA UPLOAD] === 楽曲データファイル選択 ===')
            console.log('[MUSIC DATA UPLOAD] 選択されたファイル:', file.name)
            onFileUpload('music_data_path', file)
          }}
          onDelete={() => {
            console.log('[MUSIC DATA DELETE] === 楽曲データ削除 ===')
            if (onFileDelete) {
              onFileDelete('music_data_path')
            }
          }}
          disabled={!isEditable}
          required
          accept=".wav,.mp3,.m4a"
        />
      </div>
    </div>
  )
}