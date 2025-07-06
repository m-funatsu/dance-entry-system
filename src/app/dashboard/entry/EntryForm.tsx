'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Entry } from '@/lib/types'
import BackgroundLoader from '@/components/BackgroundLoader'

interface EntryFormProps {
  userId: string
  existingEntry?: Entry | null
}

export default function EntryForm({ userId, existingEntry }: EntryFormProps) {
  const [formData, setFormData] = useState(() => ({
    dance_style: existingEntry?.dance_style || '',
    team_name: existingEntry?.team_name || '',
    participant_names: existingEntry?.participant_names || '',
    phone_number: existingEntry?.phone_number || '',
    emergency_contact: existingEntry?.emergency_contact || '',
    photo_url: existingEntry?.photo_url || '',
    music_title: existingEntry?.music_title || '',
    choreographer: existingEntry?.choreographer || '',
    story: existingEntry?.story || '',
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
        phone_number: existingEntry.phone_number || '',
        emergency_contact: existingEntry.emergency_contact || '',
        photo_url: existingEntry.photo_url || '',
        music_title: existingEntry.music_title || '',
        choreographer: existingEntry.choreographer || '',
        story: existingEntry.story || '',
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
            phone_number: formData.phone_number,
            emergency_contact: formData.emergency_contact,
            photo_url: photoUrl,
            music_title: formData.music_title,
            choreographer: formData.choreographer,
            story: formData.story,
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
              phone_number: formData.phone_number,
              emergency_contact: formData.emergency_contact,
              photo_url: photoUrl,
              music_title: formData.music_title,
              choreographer: formData.choreographer,
              story: formData.story,
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
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
    }
  }

  return (
    <>
      <BackgroundLoader pageType="entry" />
      <div style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), var(--entry-bg-image, none)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh'
      }}>
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* 参加者名 */}
        <div>
          <label htmlFor="participant_names" className="block text-sm font-medium text-gray-700">
            参加者名 *
          </label>
          <textarea
            id="participant_names"
            name="participant_names"
            required
            rows={3}
            value={formData.participant_names}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="参加者の氏名を入力（複数人の場合は改行で区切る）"
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
    </>
  )
}