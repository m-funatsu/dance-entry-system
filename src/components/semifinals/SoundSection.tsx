'use client'

import { FormField, AudioUpload } from '@/components/ui'
import type { SemifinalsInfo } from '@/lib/types'
import { useFileUploadV2 } from '@/hooks/useFileUploadV2'

interface SoundSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  validationErrors: string[]
  onChange: (updates: Partial<SemifinalsInfo>) => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete?: (field: string) => void
  onSave?: (isTemporary?: boolean, customData?: Partial<SemifinalsInfo>) => Promise<void>
  audioFiles?: Record<string, { file_name: string }>
  isEditable?: boolean
}

export const SoundSection: React.FC<SoundSectionProps> = ({
  semifinalsInfo,
  validationErrors,
  onChange,
  onFileUpload,
  onFileDelete,
  onSave,
  audioFiles,
  isEditable = true
}) => {
  // プログレスバー用フック
  const { uploading, progress } = useFileUploadV2({
    category: 'audio'
  })
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">音響指示情報</h4>
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
        label="音楽スタートのタイミング（きっかけ、ポーズなど）"
        name="sound_start_timing"
        value={semifinalsInfo.sound_start_timing || ''}
        onChange={(e) => onChange({ sound_start_timing: e.target.value })}
        disabled={!isEditable}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          チェイサー（退場）曲の指定 <span className="text-red-500">*</span>
        </label>
        <select
          value={semifinalsInfo.chaser_song_designation || ''}
          onChange={async (e) => {
            if (e.target.value === 'included') {
              console.log('[CHASER CHANGE] 「自作曲に組み込む」選択 - 状態変更と保存を実行')
              
              // 音源ファイルが存在する場合は削除前に保存処理（準決勝ファイルのみ）
              if ((semifinalsInfo.chaser_song && semifinalsInfo.chaser_song.trim()) || audioFiles?.chaser_song) {
                const chaserUrl = semifinalsInfo.chaser_song || ''
                // 決勝ファイルは削除しない
                if (!chaserUrl.includes('/finals/')) {
                  // 先に新しい状態でデータベースを更新
                  if (onSave) {
                    try {
                      console.log('[CHASER CHANGE] 新しい状態でデータベース更新実行中...')
                      const updatedData = {
                        ...semifinalsInfo,
                        chaser_song_designation: 'included',
                        chaser_song: ''
                      }
                      
                      // onSaveに明示的に新しいデータを渡すため、一時的にカスタムSave関数を作成
                      await onSave(true, updatedData)
                      console.log('[CHASER CHANGE] 新しい状態でデータベース更新完了')
                      // データベース反映待機時間を長くする
                      await new Promise(resolve => setTimeout(resolve, 500))
                    } catch (saveError) {
                      console.error('[CHASER CHANGE] データベース更新エラー:', saveError)
                    }
                  }
                  
                  console.log('[CHASER CHANGE] チェイサー音源を削除')
                  if (onFileDelete) {
                    onFileDelete('chaser_song')
                  }
                } else {
                  console.log('[CHASER CHANGE] 決勝ファイルのため削除をスキップ')
                }
              }
              
              // UI状態を最後に更新（データベース更新後）
              onChange({ chaser_song_designation: 'included', chaser_song: '' })
            } else if (e.target.value === 'required') {
              onChange({ chaser_song_designation: 'required' })
            } else if (e.target.value === 'not_required') {
              console.log('[CHASER CHANGE] 「不要（無音）」選択 - 状態変更と保存を実行')
              
              // 音源ファイルが存在する場合は削除前に保存処理（準決勝ファイルのみ）
              if ((semifinalsInfo.chaser_song && semifinalsInfo.chaser_song.trim()) || audioFiles?.chaser_song) {
                const chaserUrl = semifinalsInfo.chaser_song || ''
                // 決勝ファイルは削除しない
                if (!chaserUrl.includes('/finals/')) {
                  // 先に新しい状態でデータベースを更新
                  if (onSave) {
                    try {
                      console.log('[CHASER CHANGE] 新しい状態でデータベース更新実行中...')
                      const updatedData = {
                        ...semifinalsInfo,
                        chaser_song_designation: 'not_required',
                        chaser_song: ''
                      }
                      
                      await onSave(true, updatedData)
                      console.log('[CHASER CHANGE] 新しい状態でデータベース更新完了')
                      await new Promise(resolve => setTimeout(resolve, 500))
                    } catch (saveError) {
                      console.error('[CHASER CHANGE] データベース更新エラー:', saveError)
                    }
                  }
                  
                  console.log('[CHASER CHANGE] チェイサー音源を削除')
                  if (onFileDelete) {
                    onFileDelete('chaser_song')
                  }
                } else {
                  console.log('[CHASER CHANGE] 決勝ファイルのため削除をスキップ')
                }
              }
              
              // UI状態を最後に更新
              onChange({ chaser_song_designation: 'not_required', chaser_song: '' })
            } else if (e.target.value === '') {
              console.log('[CHASER CHANGE] 「選択してください」選択 - 状態変更と保存を実行')
              
              // 音源ファイルが存在する場合は削除前に保存処理（準決勝ファイルのみ）
              if ((semifinalsInfo.chaser_song && semifinalsInfo.chaser_song.trim()) || audioFiles?.chaser_song) {
                const chaserUrl = semifinalsInfo.chaser_song || ''
                // 決勝ファイルは削除しない
                if (!chaserUrl.includes('/finals/')) {
                  // 先に新しい状態でデータベースを更新
                  if (onSave) {
                    try {
                      console.log('[CHASER CHANGE] 新しい状態でデータベース更新実行中...')
                      const updatedData = {
                        ...semifinalsInfo,
                        chaser_song_designation: '',
                        chaser_song: ''
                      }
                      
                      await onSave(true, updatedData)
                      console.log('[CHASER CHANGE] 新しい状態でデータベース更新完了')
                      await new Promise(resolve => setTimeout(resolve, 500))
                    } catch (saveError) {
                      console.error('[CHASER CHANGE] データベース更新エラー:', saveError)
                    }
                  }
                  
                  console.log('[CHASER CHANGE] チェイサー音源を削除')
                  if (onFileDelete) {
                    onFileDelete('chaser_song')
                  }
                } else {
                  console.log('[CHASER CHANGE] 決勝ファイルのため削除をスキップ')
                }
              }
              
              // UI状態を最後に更新
              onChange({ chaser_song_designation: '', chaser_song: '' })
            }
          }}
          disabled={!isEditable}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          required
        >
          <option value="">選択してください</option>
          <option value="included">自作曲に組み込み</option>
          <option value="required">必要</option>
          <option value="not_required">不要（無音）</option>
        </select>
      </div>

      {semifinalsInfo.chaser_song_designation === 'required' && (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-800 space-y-2">
              <p className="font-medium">チェイサー（退場曲）について</p>
              <p>
                作品に一般曲（自作曲ではない楽曲）をご指定の場合、作品と同じ楽曲を使用することは不可とさせていただきます。
              </p>
              <p>
                チェイサー楽曲が必要な場合は、下記サイトより楽曲をお選びいただき、下記に楽曲データをアップロードお願いいたします。
              </p>
              <div className="space-y-1 mt-2">
                <p>
                  <a href="https://dova-s.jp/" target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline">
                    DOVA-SYNDROME
                  </a>
                </p>
                <p>
                  <a href="https://bgmer.net/" target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:text-blue-800 underline">
                    BGMer
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          {/* アップロード中のプログレスバー */}
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <div className="flex items-center mb-2">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  チェイサー曲音源をアップロード中... {Math.round(progress)}%
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
          
          <AudioUpload
            label="チェイサー（退場）曲音源"
            value={semifinalsInfo.chaser_song || ''}
            displayName={audioFiles?.chaser_song?.file_name}
            onChange={(file) => {
              console.log('[SOUND SECTION] Uploading chaser_song file:', file.name)
              onFileUpload('chaser_song', file)
            }}
            onDelete={async () => {
              console.log('[SOUND SECTION] AudioUpload削除ボタンがクリックされました')
              const chaserUrl = semifinalsInfo.chaser_song || ''
              console.log('[SOUND SECTION] 現在のchaser_song URL:', chaserUrl)
              console.log('[SOUND SECTION] 決勝ファイル判定:', chaserUrl.includes('/finals/'))
              
              // 決勝ファイルは削除しない
              if (!chaserUrl.includes('/finals/')) {
                console.log('[SOUND SECTION] 準決勝ファイルのため削除実行')
                
                // 削除前に保存
                if (onSave) {
                  console.log('[SOUND SECTION] 削除前に一時保存実行中...')
                  try {
                    await onSave(true)
                    console.log('[SOUND SECTION] 一時保存完了')
                  } catch (saveError) {
                    console.error('[SOUND SECTION] 一時保存エラー:', saveError)
                  }
                }
                
                if (onFileDelete) {
                  onFileDelete('chaser_song')
                }
              } else {
                console.log('[SOUND SECTION] 決勝ファイルのため削除をスキップ')
              }
            }}
            disabled={!isEditable}
            required
            accept=".wav,.mp3,.m4a"
          />
          <p className="text-xs text-gray-600 mt-2">
            チェイサー（退場）曲音源の追加/削除を行った場合は必ず画面下部の<span className="text-red-600">保存ボタンをクリック</span>してください。
          </p>
        </div>
      )}

      <FormField
        label="フェードアウト開始時間"
        name="fade_out_start_time"
        value={semifinalsInfo.fade_out_start_time || ''}
        onChange={(e) => onChange({ fade_out_start_time: e.target.value })}
        disabled={!isEditable}
        placeholder="例：3:45"
        required
      />

      <FormField
        label="フェードアウト完了時間"
        name="fade_out_complete_time"
        value={semifinalsInfo.fade_out_complete_time || ''}
        onChange={(e) => onChange({ fade_out_complete_time: e.target.value })}
        disabled={!isEditable}
        placeholder="例：4:00"
        required
      />
    </div>
  )
}