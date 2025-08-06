'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Entry, User, EntryFile } from '@/lib/types'
import Image from 'next/image'
import {
  BasicInfoSection,
  MusicInfoSection,
  AdditionalInfoSection,
  OptionalApplicationSection
} from '@/components/dashboard/form-sections'

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
  representative_name: string
  representative_furigana: string
  partner_name: string
  partner_furigana: string
  phone_number: string
  agreement_checked: boolean
  
  // 楽曲情報
  use_different_songs: boolean
  
  // 追加情報
  choreographer: string
  choreographer_furigana: string
  story: string
  
  // ファイル
  photo?: File
  photoUrl?: string
  music?: File
  musicUrl?: string
  music2?: File
  music2Url?: string
  video?: File
  videoUrl?: string
}

export default function IntegratedEntryForm({ userId, existingEntry, userProfile }: IntegratedEntryFormProps) {
  const [activeSection, setActiveSection] = useState<FormSection>('basic')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({})
  const [sectionSaved, setSectionSaved] = useState<Record<string, boolean>>({})
  const [entryId, setEntryId] = useState<string>(existingEntry?.id || '')
  const [fileListRefreshKey, setFileListRefreshKey] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<{
    photo: number
    video: number
    music: number
  }>({
    photo: 0,
    video: 0,
    music: 0
  })
  
  
  const [formData, setFormData] = useState<FormData>({
    dance_style: existingEntry?.dance_style || '',
    representative_name: existingEntry?.representative_name || '',
    representative_furigana: existingEntry?.representative_furigana || '',
    partner_name: existingEntry?.partner_name || '',
    partner_furigana: existingEntry?.partner_furigana || '',
    phone_number: existingEntry?.phone_number || '',
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
    { id: 'optional', label: '各種申請' },
  ]

  // アップロード済みファイル数を取得
  const fetchUploadedFileCounts = useCallback(async () => {
    if (!entryId) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('entry_files')
      .select('file_type')
      .eq('entry_id', entryId)

    if (!error && data) {
      const counts = data.reduce((acc, file) => {
        const type = file.file_type as 'photo' | 'video' | 'music' | 'audio'
        const key = type === 'audio' ? 'music' : type
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setUploadedFiles({
        photo: counts.photo || 0,
        video: counts.video || 0,
        music: (counts.music || 0) + (counts.audio || 0)
      })
    }
  }, [entryId])

  useEffect(() => {
    fetchUploadedFileCounts()
  }, [fetchUploadedFileCounts, fileListRefreshKey])

  const validateSection = (section: FormSection): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (section) {
      case 'basic':
        if (!formData.dance_style) newErrors.dance_style = 'ダンスジャンルを選択してください'
        if (!formData.phone_number) newErrors.phone_number = '電話番号を入力してください'
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

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: string, file: File | undefined) => {
    setFormData(prev => ({ ...prev, [field]: file }))
  }
  
  const handleFileUploaded = (field: string, url: string) => {
    setFormData(prev => ({ ...prev, [`${field}Url`]: url }))
    setFileListRefreshKey(prev => prev + 1)
  }

  const handleFileDeleted = (fileType: string) => {
    setFileListRefreshKey(prev => prev + 1)
    if (fileType === 'photo' || fileType === 'video' || fileType === 'music') {
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: Math.max(0, prev[fileType] - 1)
      }))
    }
  }

  const getFilePreview = (file: File | undefined, type: string): React.ReactNode => {
    if (!file) return null

    const objectUrl = URL.createObjectURL(file)

    if (type === 'photo') {
      return (
        <div className="mt-2">
          <div className="max-w-full max-h-64 bg-gray-100 rounded overflow-hidden relative">
            <Image
              src={objectUrl}
              alt={file.name}
              width={300}
              height={300}
              className="max-w-full max-h-64 object-contain rounded"
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '16rem' }}
              onLoad={() => URL.revokeObjectURL(objectUrl)}
            />
          </div>
        </div>
      )
    }

    if (type === 'video') {
      return (
        <div className="mt-2">
          <video
            src={objectUrl}
            controls
            className="max-w-full max-h-64 rounded"
            onLoadedData={() => URL.revokeObjectURL(objectUrl)}
          >
            お使いのブラウザは動画再生に対応していません。
          </video>
        </div>
      )
    }

    if (type === 'music') {
      return (
        <div className="mt-2">
          <audio
            src={objectUrl}
            controls
            className="w-full"
            onLoadedData={() => URL.revokeObjectURL(objectUrl)}
          >
            お使いのブラウザは音声再生に対応していません。
          </audio>
        </div>
      )
    }

    return null
  }

  const handleSaveSection = async (section: FormSection) => {
    // バリデーション
    if (!validateSection(section)) {
      return
    }

    setSectionLoading({ ...sectionLoading, [section]: true })
    setErrors({})

    try {
      const supabase = createClient()
      
      // エントリーデータの準備
      let updateData: Partial<Entry> = {}
      
      switch (section) {
        case 'basic':
          updateData = {
            dance_style: formData.dance_style,
            participant_names: '',
            representative_name: formData.representative_name,
            representative_furigana: formData.representative_furigana,
            partner_name: formData.partner_name,
            partner_furigana: formData.partner_furigana,
            phone_number: formData.phone_number,
            agreement_checked: formData.agreement_checked,
          }
          break
        case 'music':
          // 楽曲情報はファイルのみなので、バリデーションのみ実行
          setSectionSaved({ ...sectionSaved, [section]: true })
          setSectionLoading({ ...sectionLoading, [section]: false })
          return
        case 'additional':
          updateData = {
            choreographer: formData.choreographer,
            choreographer_furigana: formData.choreographer_furigana,
            story: formData.story,
          }
          break
      }

      // 既存エントリーがない場合は新規作成
      if (!entryId) {
        const { data, error } = await supabase
          .from('entries')
          .insert({
            user_id: userId,
            ...updateData,
            music_title: '',
            status: userProfile.has_seed ? 'selected' : 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (error) throw error
        setEntryId(data.id)
      } else {
        // 既存エントリーの更新
        const { error } = await supabase
          .from('entries')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', entryId)
        
        if (error) throw error
      }

      setSectionSaved({ ...sectionSaved, [section]: true })
    } catch (error) {
      console.error('Error saving section:', error)
      setErrors({ submit: `${section}の保存中にエラーが発生しました` })
    } finally {
      setSectionLoading({ ...sectionLoading, [section]: false })
    }
  }


  return (
    <form onSubmit={(e) => e.preventDefault()} className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">エントリーフォーム</h2>
          <p className="text-purple-100 mt-1">必要な情報を入力してください</p>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b">
          <nav className="flex -mb-px px-6 pt-4">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionChange(section.id)}
                className={`
                  py-2 px-4 mr-2 border-b-2 font-medium text-sm rounded-t-lg transition-colors
                  ${activeSection === section.id
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }
                  ${sectionSaved[section.id] ? 'bg-green-50' : ''}
                `}
              >
                {section.label}
                {section.required && <span className="text-red-500 ml-1">*</span>}
                {sectionSaved[section.id] && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-6 py-6">
          {/* 基本情報セクション */}
          {activeSection === 'basic' && (
            <BasicInfoSection
              formData={{
                dance_style: formData.dance_style,
                representative_name: formData.representative_name,
                representative_furigana: formData.representative_furigana,
                partner_name: formData.partner_name,
                partner_furigana: formData.partner_furigana,
                phone_number: formData.phone_number,
                agreement_checked: formData.agreement_checked
              }}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}

          {/* 楽曲情報セクション */}
          {activeSection === 'music' && (
            <MusicInfoSection
              formData={{
                use_different_songs: formData.use_different_songs,
                photo: formData.photo,
                photoUrl: formData.photoUrl,
                music: formData.music,
                musicUrl: formData.musicUrl,
                music2: formData.music2,
                music2Url: formData.music2Url,
                video: formData.video,
                videoUrl: formData.videoUrl
              }}
              errors={errors}
              entryId={entryId}
              uploadedFiles={uploadedFiles}
              fileListRefreshKey={fileListRefreshKey}
              onChange={handleFieldChange}
              onFileChange={handleFileChange}
              onFileUploaded={handleFileUploaded}
              onFileDeleted={handleFileDeleted}
              getFilePreview={getFilePreview}
            />
          )}

          {/* 追加情報セクション */}
          {activeSection === 'additional' && (
            <AdditionalInfoSection
              formData={{
                choreographer: formData.choreographer,
                choreographer_furigana: formData.choreographer_furigana,
                story: formData.story
              }}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}

          {/* 各種申請セクション */}
          {activeSection === 'optional' && (
            <OptionalApplicationSection />
          )}

          {/* エラー表示 */}
          {errors.submit && (
            <div className="mt-8 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* 保存ボタン */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => {
                const currentIndex = sections.findIndex(s => s.id === activeSection)
                if (currentIndex > 0) {
                  setActiveSection(sections[currentIndex - 1].id)
                }
              }}
              disabled={sections.findIndex(s => s.id === activeSection) === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            
            <div className="space-x-4">
              <button
                type="button"
                onClick={() => handleSaveSection(activeSection)}
                disabled={sectionLoading[activeSection]}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sectionLoading[activeSection] ? '保存中...' : 'このセクションを保存'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === activeSection)
                  if (currentIndex < sections.length - 1) {
                    handleSectionChange(sections[currentIndex + 1].id)
                  }
                }}
                disabled={sections.findIndex(s => s.id === activeSection) === sections.length - 1}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}