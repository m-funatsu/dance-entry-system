'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Entry, User, EntryFile } from '@/lib/types'

interface IntegratedEntryFormProps {
  userId: string
  existingEntry: Entry | null
  existingFiles: EntryFile[]
  userProfile: User
}

type FormSection = 'basic' | 'music' | 'additional' | 'optional'

interface FormData {
  // 基本情報
  dance_style: string
  team_name: string
  representative_name: string
  representative_furigana: string
  partner_name: string
  partner_furigana: string
  phone_number: string
  emergency_contact: string
  agreement_checked: boolean
  
  // 楽曲情報
  use_different_songs: boolean
  
  // 追加情報
  choreographer: string
  choreographer_furigana: string
  story: string
  
  // ファイル
  photo?: File
  music?: File
  music2?: File
  video?: File
}

export default function IntegratedEntryForm({ userId, existingEntry, userProfile }: IntegratedEntryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<FormSection>('basic')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<FormData>({
    dance_style: existingEntry?.dance_style || '',
    team_name: existingEntry?.team_name || '',
    representative_name: existingEntry?.representative_name || '',
    representative_furigana: existingEntry?.representative_furigana || '',
    partner_name: existingEntry?.partner_name || '',
    partner_furigana: existingEntry?.partner_furigana || '',
    phone_number: existingEntry?.phone_number || '',
    emergency_contact: existingEntry?.emergency_contact || '',
    use_different_songs: false,
    choreographer: existingEntry?.choreographer || '',
    choreographer_furigana: existingEntry?.choreographer_furigana || '',
    story: existingEntry?.story || '',
    agreement_checked: existingEntry?.agreement_checked || false,
  })

  const sections: { id: FormSection; label: string; required?: boolean }[] = [
    { id: 'basic', label: '基本情報', required: true },
    { id: 'music', label: '楽曲情報', required: true },
    { id: 'additional', label: '追加情報' },
    { id: 'optional', label: '任意申請' },
  ]

  const validateSection = (section: FormSection): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (section) {
      case 'basic':
        if (!formData.dance_style) newErrors.dance_style = 'ダンスジャンルを選択してください'
        if (!formData.phone_number) newErrors.phone_number = '電話番号を入力してください'
        if (!formData.emergency_contact) newErrors.emergency_contact = '緊急連絡先を入力してください'
        if (!formData.agreement_checked) newErrors.agreement = '参加資格への同意が必要です'
        break
      case 'music':
        // 楽曲情報の必須項目なし（ファイルは別途チェック）
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSectionChange = (section: FormSection) => {
    const currentIndex = sections.findIndex(s => s.id === activeSection)
    const targetIndex = sections.findIndex(s => s.id === section)
    
    // 前のセクションに戻る場合は検証不要
    if (targetIndex < currentIndex) {
      setActiveSection(section)
      return
    }
    
    // 必須セクションの検証
    if (sections[currentIndex].required && !validateSection(activeSection)) {
      return
    }
    
    setActiveSection(section)
  }

  const handleFileChange = (field: 'photo' | 'music' | 'music2' | 'video', file: File | undefined) => {
    setFormData(prev => ({ ...prev, [field]: file }))
  }

  const uploadFile = async (file: File, fileType: 'photo' | 'music' | 'video', entryId: string) => {
    const supabase = createClient()
    const fileName = `${entryId}_${fileType}_${Date.now()}_${file.name}`
    const filePath = `entries/${entryId}/${fileName}`

    const { error: uploadError, data } = await supabase.storage
      .from('files')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // ファイル情報をDBに保存
    const { error: dbError } = await supabase
      .from('entry_files')
      .insert({
        entry_id: entryId,
        file_type: fileType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })

    if (dbError) throw dbError

    return data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 必須セクションの検証
    const requiredSections = sections.filter(s => s.required).map(s => s.id)
    for (const section of requiredSections) {
      if (!validateSection(section)) {
        setActiveSection(section)
        return
      }
    }
    

    setLoading(true)
    setErrors({})

    try {
      const supabase = createClient()
      
      // エントリーデータの保存
      const entryData = {
        user_id: userId,
        dance_style: formData.dance_style,
        team_name: formData.team_name,
        participant_names: '', // 一時的に空文字を設定
        representative_name: formData.representative_name,
        representative_furigana: formData.representative_furigana,
        partner_name: formData.partner_name,
        partner_furigana: formData.partner_furigana,
        phone_number: formData.phone_number,
        emergency_contact: formData.emergency_contact,
        music_title: '',
        choreographer: formData.choreographer,
        choreographer_furigana: formData.choreographer_furigana,
        story: formData.story,
        agreement_checked: formData.agreement_checked,
        status: userProfile.has_seed ? 'selected' : 'pending',
        created_at: existingEntry ? existingEntry.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      let entryId: string
      
      if (existingEntry) {
        // 更新
        const { error } = await supabase
          .from('entries')
          .update(entryData)
          .eq('id', existingEntry.id)
        
        if (error) throw error
        entryId = existingEntry.id
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from('entries')
          .insert(entryData)
          .select()
          .single()
        
        if (error) throw error
        entryId = data.id
      }

      // ファイルのアップロード
      const uploadPromises = []
      if (formData.photo) {
        uploadPromises.push(uploadFile(formData.photo, 'photo', entryId))
      }
      if (formData.music) {
        uploadPromises.push(uploadFile(formData.music, 'music', entryId))
      }
      if (formData.video) {
        uploadPromises.push(uploadFile(formData.video, 'video', entryId))
      }
      if (formData.use_different_songs && formData.music2) {
        uploadPromises.push(uploadFile(formData.music2, 'music', entryId))
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises)
      }

      router.push('/dashboard?message=エントリー情報を保存しました')
    } catch (error) {
      console.error('Error saving entry:', error)
      setErrors({ submit: 'エントリーの保存中にエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* タブナビゲーション */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionChange(section.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeSection === section.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {section.label}
                {section.required && <span className="text-red-500 ml-1">*</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-6 py-6">
          {/* 基本情報セクション */}
          {activeSection === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ダンスジャンル <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.dance_style}
                  onChange={(e) => setFormData(prev => ({ ...prev, dance_style: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">選択してください</option>
                  <option value="JAZZ">JAZZ</option>
                  <option value="HIPHOP">HIPHOP</option>
                  <option value="CONTEMPORARY">CONTEMPORARY</option>
                  <option value="その他">その他</option>
                </select>
                {errors.dance_style && <p className="mt-1 text-sm text-red-600">{errors.dance_style}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  チーム名
                </label>
                <input
                  type="text"
                  value={formData.team_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    代表者名
                  </label>
                  <input
                    type="text"
                    value={formData.representative_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, representative_name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    代表者フリガナ
                  </label>
                  <input
                    type="text"
                    value={formData.representative_furigana}
                    onChange={(e) => setFormData(prev => ({ ...prev, representative_furigana: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    パートナー名
                  </label>
                  <input
                    type="text"
                    value={formData.partner_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, partner_name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    パートナーフリガナ
                  </label>
                  <input
                    type="text"
                    value={formData.partner_furigana}
                    onChange={(e) => setFormData(prev => ({ ...prev, partner_furigana: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  緊急連絡先 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.emergency_contact && <p className="mt-1 text-sm text-red-600">{errors.emergency_contact}</p>}
              </div>

              {/* 参加資格への同意 */}
              <div className="space-y-4 mt-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">参加資格</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• ペアにおける性別は問わない</p>
                    <p>• ペアの年齢合計は20歳以上90歳未満とする</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <input
                    id="agreement"
                    type="checkbox"
                    checked={formData.agreement_checked}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreement_checked: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agreement" className="ml-2 block text-sm text-gray-900">
                    上記の参加資格に同意します *
                  </label>
                </div>
                {errors.agreement && <p className="mt-1 text-sm text-red-600">{errors.agreement}</p>}
              </div>
            </div>
          )}

          {/* 楽曲情報セクション */}
          {activeSection === 'music' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">楽曲情報</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  写真 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('photo', e.target.files?.[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {formData.photo && (
                  <p className="mt-1 text-sm text-gray-600">選択: {formData.photo.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  動画 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange('video', e.target.files?.[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {formData.video && (
                  <p className="mt-1 text-sm text-gray-600">選択: {formData.video.name}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  ※ 動画ファイルは200MBまでアップロード可能です
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  楽曲ファイル（音源） <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange('music', e.target.files?.[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {formData.music && (
                  <p className="mt-1 text-sm text-gray-600">選択: {formData.music.name}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="use_different_songs"
                    type="checkbox"
                    checked={formData.use_different_songs}
                    onChange={(e) => setFormData(prev => ({ ...prev, use_different_songs: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="use_different_songs" className="ml-2 block text-sm text-gray-900">
                    準決勝と決勝で異なる曲を使用する場合
                  </label>
                </div>
                
                {formData.use_different_songs && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      決勝用楽曲ファイル（音源） <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange('music2', e.target.files?.[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {formData.music2 && (
                      <p className="mt-1 text-sm text-gray-600">選択: {formData.music2.name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 追加情報セクション */}
          {activeSection === 'additional' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">追加情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    振付師
                  </label>
                  <input
                    type="text"
                    value={formData.choreographer}
                    onChange={(e) => setFormData(prev => ({ ...prev, choreographer: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    振付師フリガナ
                  </label>
                  <input
                    type="text"
                    value={formData.choreographer_furigana}
                    onChange={(e) => setFormData(prev => ({ ...prev, choreographer_furigana: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ストーリー・作品説明
                </label>
                <textarea
                  value={formData.story}
                  onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="作品のストーリーや説明を入力してください"
                />
              </div>
            </div>
          )}

          {/* 任意申請セクション */}
          {activeSection === 'optional' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">任意申請</h3>
              <p className="text-sm text-gray-600">
                今後、任意の申請事項がある場合はこちらに表示されます。
              </p>
            </div>
          )}

          {/* 送信ボタン */}
          <div className="mt-8 space-y-4">

            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : (existingEntry ? '更新する' : '登録する')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}