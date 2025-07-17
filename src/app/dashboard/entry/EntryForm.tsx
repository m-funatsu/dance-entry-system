'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Entry } from '@/lib/types'
import { ToastProvider } from '@/contexts/ToastContext'

interface EntryFormProps {
  userId: string
  existingEntry?: Entry | null
}

export default function EntryForm({ userId, existingEntry }: EntryFormProps) {
  const [formData, setFormData] = useState(() => ({
    dance_style: existingEntry?.dance_style || '',
    team_name: existingEntry?.team_name || '',
    participant_names: existingEntry?.participant_names || '',
    representative_name: existingEntry?.representative_name || '',
    representative_furigana: existingEntry?.representative_furigana || '',
    partner_name: existingEntry?.partner_name || '',
    partner_furigana: existingEntry?.partner_furigana || '',
    phone_number: existingEntry?.phone_number || '',
    emergency_contact: existingEntry?.emergency_contact || '',
    photo_url: existingEntry?.photo_url || '',
    music_title: existingEntry?.music_title || '',
    choreographer: existingEntry?.choreographer || '',
    choreographer_furigana: existingEntry?.choreographer_furigana || '',
    story: existingEntry?.story || '',
    agreement_checked: existingEntry?.agreement_checked || false,
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const router = useRouter()

  // 既存エントリーがある場合、フォームデータを設定
  useEffect(() => {
    if (existingEntry) {
      setFormData({
        dance_style: existingEntry.dance_style || '',
        team_name: existingEntry.team_name || '',
        participant_names: existingEntry.participant_names || '',
        representative_name: existingEntry.representative_name || '',
        representative_furigana: existingEntry.representative_furigana || '',
        partner_name: existingEntry.partner_name || '',
        partner_furigana: existingEntry.partner_furigana || '',
        phone_number: existingEntry.phone_number || '',
        emergency_contact: existingEntry.emergency_contact || '',
        photo_url: existingEntry.photo_url || '',
        music_title: existingEntry.music_title || '',
        choreographer: existingEntry.choreographer || '',
        choreographer_furigana: existingEntry.choreographer_furigana || '',
        story: existingEntry.story || '',
        agreement_checked: existingEntry.agreement_checked || false,
      })
    }
  }, [existingEntry])

  const handlePhotoUpload = async (file: File): Promise<string | null> => {
    setPhotoUploading(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}_${Date.now()}.${fileExt}`
      const filePath = `photos/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('entries')
        .upload(filePath, file)
        
      if (uploadError) {
        console.error('Photo upload error:', uploadError)
        return null
      }
      
      const { data: publicUrl } = supabase.storage
        .from('entries')
        .getPublicUrl(filePath)
        
      return publicUrl.publicUrl
    } catch (error) {
      console.error('Photo upload error:', error)
      return null
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // バリデーション
    if (!formData.agreement_checked) {
      setError('参加資格への同意が必要です')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // 写真アップロード処理
      let photoUrl = formData.photo_url
      if (photoFile) {
        const uploadedUrl = await handlePhotoUpload(photoFile)
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        } else {
          setError('写真のアップロードに失敗しました')
          return
        }
      }
      
      if (existingEntry) {
        const { error } = await supabase
          .from('entries')
          .update({
            dance_style: formData.dance_style,
            team_name: formData.team_name,
            participant_names: formData.participant_names,
            representative_name: formData.representative_name,
            representative_furigana: formData.representative_furigana,
            partner_name: formData.partner_name,
            partner_furigana: formData.partner_furigana,
            phone_number: formData.phone_number,
            emergency_contact: formData.emergency_contact,
            photo_url: photoUrl,
            music_title: formData.music_title,
            choreographer: formData.choreographer,
            choreographer_furigana: formData.choreographer_furigana,
            story: formData.story,
            agreement_checked: formData.agreement_checked,
          })
          .eq('id', existingEntry.id)

        if (error) {
          setError('基本情報の更新に失敗しました')
          return
        }
      } else {
        // 既存エントリーがないことを再確認してから作成
        const { data: checkEntries } = await supabase
          .from('entries')
          .select('id')
          .eq('user_id', userId)
          .limit(1)

        if (checkEntries && checkEntries.length > 0) {
          setError('既にエントリーが存在します。ページを再読み込みしてください。')
          return
        }

        const { error } = await supabase
          .from('entries')
          .insert([
            {
              user_id: userId,
              dance_style: formData.dance_style,
              team_name: formData.team_name,
              participant_names: formData.participant_names,
              representative_name: formData.representative_name,
              representative_furigana: formData.representative_furigana,
              partner_name: formData.partner_name,
              partner_furigana: formData.partner_furigana,
              phone_number: formData.phone_number,
              emergency_contact: formData.emergency_contact,
              photo_url: photoUrl,
              music_title: formData.music_title,
              choreographer: formData.choreographer,
              choreographer_furigana: formData.choreographer_furigana,
              story: formData.story,
              agreement_checked: formData.agreement_checked,
              status: 'pending',
            }
          ])

        if (error) {
          setError('基本情報の登録に失敗しました')
          return
        }
      }

      router.push('/dashboard?message=基本情報を保存しました')
    } catch {
      setError('基本情報の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen p-5 bg-gray-50">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg p-6 shadow-lg">
        {/* 写真アップロード */}
        <div>
          <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
            写真 *
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {photoUploading && (
              <span className="text-sm text-gray-500">アップロード中...</span>
            )}
          </div>
          {formData.photo_url && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.photo_url}
                alt="アップロード済み写真"
                className="h-32 w-32 object-cover rounded-lg border border-gray-300"
              />
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500">
            ペア写真や過去の競技写真をアップロードしてください
          </p>
        </div>

        {/* ダンスジャンル */}
        <div>
          <label htmlFor="dance_style" className="block text-sm font-medium text-gray-700">
            ダンスジャンル *
          </label>
          <select
            id="dance_style"
            name="dance_style"
            required
            value={formData.dance_style}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">選択してください</option>
            <option value="社交ダンス">社交ダンス</option>
            <option value="バレエ・コンテンポラリーダンス">バレエ・コンテンポラリーダンス</option>
            <option value="ジャズダンス">ジャズダンス</option>
            <option value="ストリートダンス全般">ストリートダンス全般</option>
          </select>
        </div>

        {/* ペア名 */}
        <div>
          <label htmlFor="team_name" className="block text-sm font-medium text-gray-700">
            ペア名 *
          </label>
          <input
            type="text"
            id="team_name"
            name="team_name"
            required
            value={formData.team_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="ペア名を入力"
          />
        </div>

        {/* 代表者名 */}
        <div>
          <label htmlFor="representative_name" className="block text-sm font-medium text-gray-700">
            代表者名 *
          </label>
          <input
            type="text"
            id="representative_name"
            name="representative_name"
            required
            value={formData.representative_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="代表者の氏名を入力"
          />
        </div>

        {/* 代表者フリガナ */}
        <div>
          <label htmlFor="representative_furigana" className="block text-sm font-medium text-gray-700">
            代表者フリガナ *
          </label>
          <input
            type="text"
            id="representative_furigana"
            name="representative_furigana"
            required
            value={formData.representative_furigana}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="代表者のフリガナを入力"
          />
        </div>

        {/* パートナ名 */}
        <div>
          <label htmlFor="partner_name" className="block text-sm font-medium text-gray-700">
            パートナ名 *
          </label>
          <input
            type="text"
            id="partner_name"
            name="partner_name"
            required
            value={formData.partner_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="パートナの氏名を入力"
          />
        </div>

        {/* パートナフリガナ */}
        <div>
          <label htmlFor="partner_furigana" className="block text-sm font-medium text-gray-700">
            パートナフリガナ *
          </label>
          <input
            type="text"
            id="partner_furigana"
            name="partner_furigana"
            required
            value={formData.partner_furigana}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="パートナのフリガナを入力"
          />
        </div>

        {/* 旧参加者名（下位互換のため残す） */}
        <div>
          <label htmlFor="participant_names" className="block text-sm font-medium text-gray-700">
            参加者名（全員）
          </label>
          <textarea
            id="participant_names"
            name="participant_names"
            rows={3}
            value={formData.participant_names}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="全参加者の氏名を入力（複数人の場合は改行で区切る）"
          />
        </div>

        {/* 電話番号 */}
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
            電話番号 *
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            required
            value={formData.phone_number}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="090-1234-5678"
          />
        </div>

        {/* 緊急連絡先 */}
        <div>
          <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
            緊急連絡先 *
          </label>
          <input
            type="text"
            id="emergency_contact"
            name="emergency_contact"
            required
            value={formData.emergency_contact}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="緊急時の連絡先（氏名・電話番号）"
          />
        </div>

        {/* 振付師名 */}
        <div>
          <label htmlFor="choreographer" className="block text-sm font-medium text-gray-700">
            振付師名
          </label>
          <input
            type="text"
            id="choreographer"
            name="choreographer"
            value={formData.choreographer}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="振付師の氏名を入力"
          />
        </div>

        {/* 振付師フリガナ */}
        <div>
          <label htmlFor="choreographer_furigana" className="block text-sm font-medium text-gray-700">
            振付師フリガナ
          </label>
          <input
            type="text"
            id="choreographer_furigana"
            name="choreographer_furigana"
            value={formData.choreographer_furigana}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="振付師のフリガナを入力"
          />
        </div>

        {/* 参加資格同意 */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">参加資格</h3>
          <div className="text-sm text-gray-600 mb-4 space-y-2">
            <p>• ペアであれば、プロ、アマを問わず全ての選手がエントリー可能</p>
            <p>• ダンスによる教師、デモンストレーション等で収入を少額でも得ている場合はプロとみなす</p>
            <p>• プロとアマチュアの混合での出場は不可</p>
            <p>• ペアにおける性別は問わない</p>
            <p>• ペアの年齢合計は20歳以上90歳未満とする</p>
          </div>
          <div className="flex items-center">
            <input
              id="agreement_checked"
              name="agreement_checked"
              type="checkbox"
              checked={formData.agreement_checked}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="agreement_checked" className="ml-2 block text-sm text-gray-900">
              上記の参加資格に同意します *
            </label>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading || photoUploading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
      </div>
    </ToastProvider>
  )
}