'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { Alert, TabNavigation, TemporarySaveButton, SaveButton, CancelButton } from '@/components/ui'
import { useFormSave } from '@/hooks'
import { MusicSection, SoundSection, LightingSection, ChoreographerSection, BankSection } from '@/components/semifinals'
import { 
  validateSemifinalsSection, 
  validateAllSemifinalsSection, 
  isSemifinalsAllRequiredFieldsValid,
  semifinalsSections 
} from '@/utils/semifinalsValidation'
import type { Entry, SemifinalsInfo, BasicInfo, PreliminaryInfo } from '@/lib/types'

interface SemifinalsFormProps {
  userId: string
  entry: Entry | null
}

export default function SemifinalsForm({ entry }: SemifinalsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null)
  const [preliminaryInfo, setPreliminaryInfo] = useState<PreliminaryInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('music')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  
  const [semifinalsInfo, setSemifinalsInfo] = useState<Partial<SemifinalsInfo>>({
    entry_id: entry?.id || '',
    music_change_from_preliminary: false,
    copyright_permission: '',
    choreographer_change_from_preliminary: false
  })

  // フォーム保存フック
  const { save, saving, error, success } = useFormSave({
    tableName: 'semifinals_info',
    uniqueField: 'entry_id',
    redirectPath: '/dashboard',
    onSuccess: (message) => showToast(message, 'success'),
    onError: (message) => showToast(message, 'error')
  })

  // データを読み込む
  useEffect(() => {
    if (!entry?.id) {
      setLoading(false)
      return
    }
    
    const loadData = async () => {
      try {
        // 基本情報を取得
        const { data: basicData } = await supabase
          .from('basic_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (basicData) {
          setBasicInfo(basicData)
        }
        
        // 予選情報を取得
        const { data: prelimData } = await supabase
          .from('preliminary_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (prelimData) {
          setPreliminaryInfo(prelimData)
        }
        
        // 準決勝情報を取得
        const { data: semiData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (semiData) {
          setSemifinalsInfo(semiData)
        } else {
          // 新規作成時の初期設定
          const initialData: Partial<SemifinalsInfo> = {
            entry_id: entry.id,
            music_change_from_preliminary: false,
            copyright_permission: '',
            choreographer_change_from_preliminary: false
          }
          
          if (basicData) {
            // 基本情報から振付師情報をデフォルト設定
            initialData.choreographer_name = basicData.choreographer || ''
            initialData.choreographer_name_kana = basicData.choreographer_furigana || ''
          }
          
          if (prelimData) {
            // 予選情報から楽曲情報をデフォルト設定
            initialData.work_title = prelimData.work_title || ''
            initialData.work_character_story = prelimData.work_story || ''
            initialData.music_title = prelimData.music_title || ''
            initialData.cd_title = prelimData.cd_title || ''
            initialData.artist = prelimData.artist || ''
            initialData.record_number = prelimData.record_number || ''
            initialData.jasrac_code = prelimData.jasrac_code || ''
            initialData.music_type = prelimData.music_type || ''
          }
          
          setSemifinalsInfo(initialData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        showToast('データの読み込みに失敗しました', 'error')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [entry?.id, supabase, showToast])

  // タブ切り替え時の検証
  const handleSectionChange = (sectionId: string) => {
    // 現在のセクションの検証
    const currentErrors = validateSemifinalsSection(activeSection, semifinalsInfo)
    setValidationErrors(prev => ({
      ...prev,
      [activeSection]: currentErrors
    }))
    
    setActiveSection(sectionId)
  }

  const handleFieldChange = (updates: Partial<SemifinalsInfo>) => {
    setSemifinalsInfo(prev => ({ ...prev, ...updates }))
  }

  const handleFileUpload = async (field: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry?.id}/semifinals/${field}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      setSemifinalsInfo(prev => ({
        ...prev,
        [field]: publicUrl
      }))
    } catch (err) {
      console.error('ファイルアップロードエラー:', err)
      showToast('ファイルのアップロードに失敗しました', 'error')
    }
  }

  const handleSave = async (isTemporary = false) => {
    if (!entry?.id) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    // 必須項目チェック（一時保存時はスキップ）
    if (!isTemporary) {
      const allErrors = validateAllSemifinalsSection(semifinalsInfo)
      if (Object.keys(allErrors).length > 0) {
        setValidationErrors(allErrors)
        const firstErrorSection = Object.keys(allErrors)[0]
        setActiveSection(firstErrorSection)
        showToast('必須項目を入力してください', 'error')
        return
      }
    }

    // 50文字制限のチェック
    if (semifinalsInfo.work_character_story && semifinalsInfo.work_character_story.length > 50) {
      showToast('作品キャラクター・ストーリー等は50文字以内で入力してください', 'error')
      return
    }

    const dataToSave = {
      ...semifinalsInfo,
      entry_id: entry.id
    }

    const savedData = await save(dataToSave, isTemporary)
    if (savedData) {
      // 保存成功時はエラーをクリア
      setValidationErrors({})
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  // タブ用のデータを準備
  const tabs = semifinalsSections.map(section => ({
    ...section,
    hasErrors: validationErrors[section.id]?.length > 0,
    isComplete: validateSemifinalsSection(section.id, semifinalsInfo).length === 0
  }))

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          準決勝に進出された場合の詳細情報をご記入ください。
        </p>
      </div>

      {/* セクションタブ */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeSection}
        onTabChange={handleSectionChange}
      />

      {/* 各セクションのコンテンツ */}
      {activeSection === 'music' && (
        <MusicSection
          semifinalsInfo={semifinalsInfo}
          preliminaryInfo={preliminaryInfo}
          validationErrors={validationErrors.music || []}
          onChange={handleFieldChange}
          onFileUpload={handleFileUpload}
        />
      )}

      {activeSection === 'sound' && (
        <SoundSection
          semifinalsInfo={semifinalsInfo}
          validationErrors={validationErrors.sound || []}
          onChange={handleFieldChange}
          onFileUpload={handleFileUpload}
        />
      )}

      {activeSection === 'lighting' && (
        <LightingSection
          semifinalsInfo={semifinalsInfo}
          validationErrors={validationErrors.lighting || []}
          onChange={handleFieldChange}
          onFileUpload={handleFileUpload}
        />
      )}

      {activeSection === 'choreographer' && (
        <ChoreographerSection
          semifinalsInfo={semifinalsInfo}
          basicInfo={basicInfo}
          onChange={handleFieldChange}
        />
      )}

      {activeSection === 'bank' && (
        <BankSection
          semifinalsInfo={semifinalsInfo}
          validationErrors={validationErrors.bank || []}
          onChange={handleFieldChange}
        />
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          ※ 準決勝情報は準決勝進出が決定してからでも追加・修正可能です。
        </p>
      </div>

      <div className="flex justify-between pt-6">
        <CancelButton onClick={() => router.push('/dashboard')} />
        <div className="space-x-4">
          <TemporarySaveButton
            onClick={() => handleSave(true)}
            disabled={saving || !entry}
            loading={saving}
          />
          <SaveButton
            onClick={() => handleSave(false)}
            disabled={saving || !entry || !isSemifinalsAllRequiredFieldsValid(semifinalsInfo)}
            loading={saving}
          />
        </div>
      </div>

      {!entry && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            基本情報を先に保存してください。
          </p>
        </div>
      )}
    </div>
  )
}