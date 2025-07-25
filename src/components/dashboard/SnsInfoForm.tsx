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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            練習動画（約30秒）
          </label>
          <p className="text-sm text-gray-600 mb-2">
            横長動画で約30秒の練習風景を撮影してアップロードしてください。
          </p>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/avi,video/x-msvideo"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleVideoUpload(file)
            }}
            disabled={uploadingVideo}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {uploadingVideo && (
            <p className="mt-2 text-sm text-blue-600">動画をアップロード中...</p>
          )}
          {snsInfo.practice_video_filename && (
            <div className="mt-2 text-sm text-gray-600">
              アップロード済み: {snsInfo.practice_video_filename}
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