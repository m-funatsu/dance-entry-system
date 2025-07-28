'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry, SemifinalsInfo, BasicInfo } from '@/lib/types'

interface SemifinalsFormProps {
  userId: string
  entry: Entry | null
}

export default function SemifinalsForm({ entry }: SemifinalsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null)
  const [semiInfo, setSemiInfo] = useState<SemifinalsInfo | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    // 楽曲情報
    music_change_from_preliminary: false,
    work_title: '',
    work_character_story: '',
    copyright_permission: false,
    music_title: '',
    cd_title: '',
    artist: '',
    record_number: '',
    jasrac_code: '',
    music_type: '',
    music_data_path: '',
    music_usage_method: '',
    
    // 音響指示情報
    sound_start_timing: '',
    chaser_song_designation: '',
    chaser_song: '',
    fade_out_start_time: '',
    fade_out_complete_time: '',
    
    // 照明指示情報
    dance_start_timing: '',
    
    // シーン1-5
    scene1_time: '',
    scene1_trigger: '',
    scene1_color_type: '',
    scene1_color_other: '',
    scene1_image: '',
    scene1_image_path: '',
    scene1_notes: '',
    
    scene2_time: '',
    scene2_trigger: '',
    scene2_color_type: '',
    scene2_color_other: '',
    scene2_image: '',
    scene2_image_path: '',
    scene2_notes: '',
    
    scene3_time: '',
    scene3_trigger: '',
    scene3_color_type: '',
    scene3_color_other: '',
    scene3_image: '',
    scene3_image_path: '',
    scene3_notes: '',
    
    scene4_time: '',
    scene4_trigger: '',
    scene4_color_type: '',
    scene4_color_other: '',
    scene4_image: '',
    scene4_image_path: '',
    scene4_notes: '',
    
    scene5_time: '',
    scene5_trigger: '',
    scene5_color_type: '',
    scene5_color_other: '',
    scene5_image: '',
    scene5_image_path: '',
    scene5_notes: '',
    
    // チェイサー/退場
    chaser_exit_time: '',
    chaser_exit_trigger: '',
    chaser_exit_color_type: '',
    chaser_exit_color_other: '',
    chaser_exit_image: '',
    chaser_exit_image_path: '',
    chaser_exit_notes: '',
    
    // 振付情報
    choreographer_change_from_preliminary: false,
    choreographer_name: '',
    choreographer_name_kana: '',
    
    // 賞金振込先情報
    bank_name: '',
    branch_name: '',
    account_type: '',
    account_number: '',
    account_holder: ''
  })
  
  const [saving, setSaving] = useState(false)
  const [savingMode, setSavingMode] = useState<'save' | 'submit'>('save')

  // データを読み込む
  useEffect(() => {
    if (!entry?.id) return
    
    const loadData = async () => {
      try {
        // 基本情報を取得
        const { data: basicData } = await supabase
          .from('basic_info')
          .select('*')
          .eq('entry_id', entry.id)
          .single()
        
        if (basicData) {
          setBasicInfo(basicData)
        }
        
        // 準決勝情報を取得
        const { data: semiData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .single()
        
        if (semiData) {
          setSemiInfo(semiData)
          // 既存データでフォームを更新
          setFormData({
            music_change_from_preliminary: semiData.music_change_from_preliminary || false,
            work_title: semiData.work_title || '',
            work_character_story: semiData.work_character_story || '',
            copyright_permission: semiData.copyright_permission || false,
            music_title: semiData.music_title || '',
            cd_title: semiData.cd_title || '',
            artist: semiData.artist || '',
            record_number: semiData.record_number || '',
            jasrac_code: semiData.jasrac_code || '',
            music_type: semiData.music_type || '',
            music_data_path: semiData.music_data_path || '',
            music_usage_method: semiData.music_usage_method || '',
            sound_start_timing: semiData.sound_start_timing || '',
            chaser_song_designation: semiData.chaser_song_designation || '',
            chaser_song: semiData.chaser_song || '',
            fade_out_start_time: semiData.fade_out_start_time || '',
            fade_out_complete_time: semiData.fade_out_complete_time || '',
            dance_start_timing: semiData.dance_start_timing || '',
            scene1_time: semiData.scene1_time || '',
            scene1_trigger: semiData.scene1_trigger || '',
            scene1_color_type: semiData.scene1_color_type || '',
            scene1_color_other: semiData.scene1_color_other || '',
            scene1_image: semiData.scene1_image || '',
            scene1_image_path: semiData.scene1_image_path || '',
            scene1_notes: semiData.scene1_notes || '',
            scene2_time: semiData.scene2_time || '',
            scene2_trigger: semiData.scene2_trigger || '',
            scene2_color_type: semiData.scene2_color_type || '',
            scene2_color_other: semiData.scene2_color_other || '',
            scene2_image: semiData.scene2_image || '',
            scene2_image_path: semiData.scene2_image_path || '',
            scene2_notes: semiData.scene2_notes || '',
            scene3_time: semiData.scene3_time || '',
            scene3_trigger: semiData.scene3_trigger || '',
            scene3_color_type: semiData.scene3_color_type || '',
            scene3_color_other: semiData.scene3_color_other || '',
            scene3_image: semiData.scene3_image || '',
            scene3_image_path: semiData.scene3_image_path || '',
            scene3_notes: semiData.scene3_notes || '',
            scene4_time: semiData.scene4_time || '',
            scene4_trigger: semiData.scene4_trigger || '',
            scene4_color_type: semiData.scene4_color_type || '',
            scene4_color_other: semiData.scene4_color_other || '',
            scene4_image: semiData.scene4_image || '',
            scene4_image_path: semiData.scene4_image_path || '',
            scene4_notes: semiData.scene4_notes || '',
            scene5_time: semiData.scene5_time || '',
            scene5_trigger: semiData.scene5_trigger || '',
            scene5_color_type: semiData.scene5_color_type || '',
            scene5_color_other: semiData.scene5_color_other || '',
            scene5_image: semiData.scene5_image || '',
            scene5_image_path: semiData.scene5_image_path || '',
            scene5_notes: semiData.scene5_notes || '',
            chaser_exit_time: semiData.chaser_exit_time || '',
            chaser_exit_trigger: semiData.chaser_exit_trigger || '',
            chaser_exit_color_type: semiData.chaser_exit_color_type || '',
            chaser_exit_color_other: semiData.chaser_exit_color_other || '',
            chaser_exit_image: semiData.chaser_exit_image || '',
            chaser_exit_image_path: semiData.chaser_exit_image_path || '',
            chaser_exit_notes: semiData.chaser_exit_notes || '',
            choreographer_change_from_preliminary: semiData.choreographer_change_from_preliminary || false,
            choreographer_name: semiData.choreographer_name || '',
            choreographer_name_kana: semiData.choreographer_name_kana || '',
            bank_name: semiData.bank_name || '',
            branch_name: semiData.branch_name || '',
            account_type: semiData.account_type || '',
            account_number: semiData.account_number || '',
            account_holder: semiData.account_holder || ''
          })
        } else if (basicData) {
          // 新規作成時は基本情報から振付師情報をデフォルト設定
          setFormData(prev => ({
            ...prev,
            choreographer_name: basicData.choreographer || '',
            choreographer_name_kana: basicData.choreographer_furigana || ''
          }))
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

  // 振付師変更チェックボックスの処理
  const handleChoreographerChange = (checked: boolean) => {
    if (checked) {
      // チェックが入った場合：クリア
      setFormData(prev => ({
        ...prev,
        choreographer_change_from_preliminary: true,
        choreographer_name: '',
        choreographer_name_kana: ''
      }))
    } else {
      // チェックが外れた場合：基本情報から復元
      setFormData(prev => ({
        ...prev,
        choreographer_change_from_preliminary: false,
        choreographer_name: basicInfo?.choreographer || '',
        choreographer_name_kana: basicInfo?.choreographer_furigana || ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent, mode: 'save' | 'submit' = 'submit') => {
    e.preventDefault()
    setSaving(true)
    setSavingMode(mode)

    try {
      if (!entry?.id) {
        showToast('基本情報を先に保存してください', 'error')
        router.push('/dashboard/basic-info')
        return
      }

      const dataToSave = {
        entry_id: entry.id,
        ...formData
      }

      if (semiInfo) {
        // 更新
        const { error } = await supabase
          .from('semifinals_info')
          .update(dataToSave)
          .eq('id', semiInfo.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('semifinals_info')
          .insert([dataToSave])

        if (error) throw error
      }

      showToast(
        mode === 'submit' 
          ? '準決勝情報を保存しました' 
          : '準決勝情報を一時保存しました', 
        'success'
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving semifinals info:', error)
      const errorMessage = error instanceof Error ? error.message : '準決勝情報の保存に失敗しました'
      showToast(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          準決勝に進出された場合の詳細情報をご記入ください。
        </p>
      </div>

      {/* 振付情報セクション */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          振付情報
        </h3>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.choreographer_change_from_preliminary}
              onChange={(e) => handleChoreographerChange(e.target.checked)}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              予選から振付師を変更する
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="choreographer_name" className="block text-sm font-medium text-gray-700">
              振付師名
            </label>
            <input
              type="text"
              id="choreographer_name"
              value={formData.choreographer_name}
              onChange={(e) => setFormData({ ...formData, choreographer_name: e.target.value })}
              disabled={!formData.choreographer_change_from_preliminary}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !formData.choreographer_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            />
          </div>
          
          <div>
            <label htmlFor="choreographer_name_kana" className="block text-sm font-medium text-gray-700">
              振付師名（ふりがな）
            </label>
            <input
              type="text"
              id="choreographer_name_kana"
              value={formData.choreographer_name_kana}
              onChange={(e) => setFormData({ ...formData, choreographer_name_kana: e.target.value })}
              disabled={!formData.choreographer_change_from_preliminary}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !formData.choreographer_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            />
          </div>
        </div>
        
        {!formData.choreographer_change_from_preliminary && (
          <p className="text-xs text-gray-500">
            基本情報で登録された振付師情報が使用されます。
          </p>
        )}
      </div>

      {/* 賞金振込先情報セクション */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
          賞金振込先情報
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">
              銀行名
            </label>
            <input
              type="text"
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="branch_name" className="block text-sm font-medium text-gray-700">
              支店名
            </label>
            <input
              type="text"
              id="branch_name"
              value={formData.branch_name}
              onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="account_type" className="block text-sm font-medium text-gray-700">
              口座種別
            </label>
            <select
              id="account_type"
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">選択してください</option>
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
              口座番号
            </label>
            <input
              type="text"
              id="account_number"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="account_holder" className="block text-sm font-medium text-gray-700">
              口座名義人
            </label>
            <input
              type="text"
              id="account_holder"
              value={formData.account_holder}
              onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="カタカナで入力してください"
            />
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          ※ 準決勝情報は準決勝進出が決定してからでも追加・修正可能です。
        </p>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          キャンセル
        </button>
        <div className="space-x-3">
          <button
            type="button"
            onClick={(e) => handleSubmit(e as React.FormEvent, 'save')}
            disabled={saving || !entry}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              saving || !entry
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {saving && savingMode === 'save' ? '一時保存中...' : '一時保存'}
          </button>
          <button
            type="submit"
            disabled={saving || !entry}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
              saving || !entry
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saving && savingMode === 'submit' ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {!entry && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            基本情報を先に保存してください。
          </p>
        </div>
      )}
    </form>
  )
}