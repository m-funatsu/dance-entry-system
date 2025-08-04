'use client'

import { useState, useCallback } from 'react'
import { useBaseForm, type UseBaseFormOptions, type UseBaseFormReturn } from './useBaseForm'

export interface FormSection {
  id: string
  label: string
  required?: boolean
}

export interface UseSectionFormOptions<T extends Record<string, unknown>> extends UseBaseFormOptions<T> {
  sections: FormSection[]
  sectionValidation?: (sectionId: string, data: T) => Record<string, string>
  onSectionChange?: (from: string, to: string) => void
}

export interface UseSectionFormReturn<T> extends UseBaseFormReturn<T> {
  // セクション管理
  activeSection: string
  setActiveSection: (sectionId: string) => void
  handleSectionChange: (sectionId: string) => boolean
  
  // セクション状態
  sectionSaved: Record<string, boolean>
  sectionLoading: Record<string, boolean>
  sectionErrors: Record<string, Record<string, string>>
  
  // セクション保存
  saveSection: (sectionId?: string, isTemporary?: boolean) => Promise<boolean>
  markSectionSaved: (sectionId: string) => void
  
  // ナビゲーション
  canNavigateToSection: (sectionId: string) => boolean
  getNextSection: () => string | null
  getPreviousSection: () => string | null
  navigateToNext: () => boolean
  navigateToPrevious: () => boolean
}

export function useSectionForm<T extends Record<string, unknown>>({
  sections,
  sectionValidation,
  onSectionChange,
  ...baseOptions
}: UseSectionFormOptions<T>): UseSectionFormReturn<T> {
  // 基本フォーム機能
  const baseForm = useBaseForm(baseOptions)
  
  // セクション管理の状態
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')
  const [sectionSaved, setSectionSaved] = useState<Record<string, boolean>>({})
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({})
  const [sectionErrors, setSectionErrors] = useState<Record<string, Record<string, string>>>({})
  
  // セクションのバリデーション
  const validateSection = useCallback((sectionId: string): boolean => {
    if (!sectionValidation) return true
    
    const errors = sectionValidation(sectionId, baseForm.formData)
    setSectionErrors(prev => ({ ...prev, [sectionId]: errors }))
    
    return Object.keys(errors).length === 0
  }, [sectionValidation, baseForm.formData])
  
  // セクション変更ハンドラー
  const handleSectionChange = useCallback((targetSectionId: string): boolean => {
    const currentIndex = sections.findIndex(s => s.id === activeSection)
    const targetIndex = sections.findIndex(s => s.id === targetSectionId)
    const currentSection = sections[currentIndex]
    
    // 前のセクションに戻る場合はバリデーション不要
    if (targetIndex < currentIndex) {
      setActiveSection(targetSectionId)
      if (onSectionChange) {
        onSectionChange(activeSection, targetSectionId)
      }
      return true
    }
    
    // 必須セクションのバリデーション
    if (currentSection?.required && !validateSection(activeSection)) {
      baseForm.setError('現在のセクションの入力を完了してください')
      return false
    }
    
    setActiveSection(targetSectionId)
    if (onSectionChange) {
      onSectionChange(activeSection, targetSectionId)
    }
    return true
  }, [activeSection, sections, validateSection, onSectionChange, baseForm])
  
  // セクション保存
  const saveSection = useCallback(async (sectionId?: string, isTemporary = false): Promise<boolean> => {
    const targetSection = sectionId || activeSection
    
    // セクションのバリデーション（完全保存時のみ）
    if (!isTemporary && !validateSection(targetSection)) {
      return false
    }
    
    setSectionLoading(prev => ({ ...prev, [targetSection]: true }))
    
    try {
      // ベースの保存処理を使用
      const success = await baseForm.save(isTemporary)
      
      if (success) {
        setSectionSaved(prev => ({ ...prev, [targetSection]: true }))
      }
      
      return success
    } finally {
      setSectionLoading(prev => ({ ...prev, [targetSection]: false }))
    }
  }, [activeSection, validateSection, baseForm])
  
  // セクションを保存済みとしてマーク
  const markSectionSaved = useCallback((sectionId: string) => {
    setSectionSaved(prev => ({ ...prev, [sectionId]: true }))
  }, [])
  
  // ナビゲーション可能かチェック
  const canNavigateToSection = useCallback((targetSectionId: string): boolean => {
    const currentIndex = sections.findIndex(s => s.id === activeSection)
    const targetIndex = sections.findIndex(s => s.id === targetSectionId)
    
    // 前のセクションには常に移動可能
    if (targetIndex <= currentIndex) return true
    
    // 後のセクションへは、前のセクションが保存済みの場合のみ
    for (let i = 0; i < targetIndex; i++) {
      const section = sections[i]
      if (section.required && !sectionSaved[section.id]) {
        return false
      }
    }
    
    return true
  }, [activeSection, sections, sectionSaved])
  
  // 次/前のセクション取得
  const getNextSection = useCallback((): string | null => {
    const currentIndex = sections.findIndex(s => s.id === activeSection)
    return currentIndex < sections.length - 1 ? sections[currentIndex + 1].id : null
  }, [activeSection, sections])
  
  const getPreviousSection = useCallback((): string | null => {
    const currentIndex = sections.findIndex(s => s.id === activeSection)
    return currentIndex > 0 ? sections[currentIndex - 1].id : null
  }, [activeSection, sections])
  
  // ナビゲーション
  const navigateToNext = useCallback((): boolean => {
    const nextSection = getNextSection()
    if (nextSection) {
      return handleSectionChange(nextSection)
    }
    return false
  }, [getNextSection, handleSectionChange])
  
  const navigateToPrevious = useCallback((): boolean => {
    const previousSection = getPreviousSection()
    if (previousSection) {
      return handleSectionChange(previousSection)
    }
    return false
  }, [getPreviousSection, handleSectionChange])
  
  return {
    ...baseForm,
    
    // セクション管理
    activeSection,
    setActiveSection,
    handleSectionChange,
    
    // セクション状態
    sectionSaved,
    sectionLoading,
    sectionErrors,
    
    // セクション保存
    saveSection,
    markSectionSaved,
    
    // ナビゲーション
    canNavigateToSection,
    getNextSection,
    getPreviousSection,
    navigateToNext,
    navigateToPrevious
  }
}