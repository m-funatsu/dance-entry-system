'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Entry, SnsInfo } from '@/lib/types'

interface SnsInfoFormProps {
  entry: Entry
}

export default function SnsInfoForm({ entry }: SnsInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [snsInfo, setSnsInfo] = useState<Partial<SnsInfo>>({
    entry_id: entry.id,
    introduction_highlight: '',
    sns_notes: ''
  })

  useEffect(() => {
    loadSnsInfo()
  }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSnsInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sns_info')
        .select('*')
        .eq('entry_id', entry.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSnsInfo(data)
      }
    } catch (err) {
      console.error('SNS掲載情報の読み込みエラー:', err)
      setError('SNS掲載情報の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true)
    setError(null)
    setSuccess(null)

    try {
      // ファイルサイズチェック（50MBまで）
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error(`ファイルサイズが大きすぎます。50MB以下の動画を選択してください。`)
      }

      // ファイル形式チェック
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('動画形式はMP4、MOV、AVIのみ対応しています')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${entry.id}/sns/practice_video_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      setSnsInfo(prev => ({
        ...prev,
        practice_video_path: publicUrl,
        practice_video_filename: file.name
      }))
      setSuccess('練習動画をアップロードしました')
    } catch (err) {
      console.error('動画アップロードエラー:', err)
      setError(err instanceof Error ? err.message : '動画のアップロードに失敗しました')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const { data: existingData } = await supabase
        .from('sns_info')
        .select('id')
        .eq('entry_id', entry.id)
        .single()

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('sns_info')
          .update({
            ...snsInfo,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('sns_info')
          .insert({
            ...snsInfo,
            entry_id: entry.id
          })

        if (error) throw error
      }

      setSuccess('SNS掲載情報を保存しました')
      router.refresh()
    } catch (err) {
      console.error('保存エラー:', err)
      setError(err instanceof Error ? err.message : 'SNS掲載情報の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">SNS掲載情報</h3>

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

      <div className="space-y-6">
        {/* 練習動画 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-base font-medium text-gray-900 mb-4">練習動画（約30秒）</h4>
          <p className="text-sm text-gray-600 mb-4">
            横長動画で約30秒の練習風景を撮影してアップロードしてください。
          </p>
          
          {snsInfo.practice_video_filename ? (
            <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {snsInfo.practice_video_filename}
                    </p>
                    <p className="text-sm text-gray-600">
                      ビデオファイル • アップロード完了
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('練習動画を削除してもよろしいですか？')) {
                      setSnsInfo(prev => ({
                        ...prev,
                        practice_video_path: undefined,
                        practice_video_filename: undefined
                      }))
                    }
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/avi,video/x-msvideo"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleVideoUpload(file)
                }}
                disabled={uploadingVideo}
                className="hidden"
                id="practice-video-upload"
              />
              <label
                htmlFor="practice-video-upload"
                className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-200 ${
                  uploadingVideo ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25H13.5" />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">
                  {uploadingVideo ? 'アップロード中...' : 'クリックして動画を選択'}
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  またはドラッグ＆ドロップ
                </span>
                <span className="mt-2 block text-xs text-gray-500">
                  MP4、MOV、AVI形式（最大50MB）
                </span>
                {uploadingVideo && (
                  <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2 w-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{ width: '50%' }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-indigo-600">アップロード中...</p>
                  </div>
                )}
              </label>
            </div>
          )}
        </div>

        {/* 紹介・見どころ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            紹介・見どころ（30秒で紹介する内容）
          </label>
          <p className="text-sm text-gray-600 mb-2">
            作品の見どころや選手の紹介を30秒で説明する内容を記入してください。
          </p>
          <textarea
            value={snsInfo.introduction_highlight || ''}
            onChange={(e) => setSnsInfo(prev => ({ ...prev, introduction_highlight: e.target.value }))}
            rows={4}
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="例：今回の作品では〇〇を表現しました。特に注目していただきたいのは..."
          />
          <p className="mt-1 text-sm text-gray-500">
            {snsInfo.introduction_highlight?.length || 0}/200文字
          </p>
        </div>

        {/* 備考 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            備考
          </label>
          <textarea
            value={snsInfo.sns_notes || ''}
            onChange={(e) => setSnsInfo(prev => ({ ...prev, sns_notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="その他、SNS掲載に関する要望や注意事項があれば記入してください"
          />
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}