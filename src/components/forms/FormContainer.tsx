'use client'

import React from 'react'
import { Alert } from '@/components/ui/Alert'
import { SaveButton, TemporarySaveButton, CancelButton } from '@/components/ui/Button'

export interface FormContainerProps {
  children: React.ReactNode
  title?: string
  description?: string
  error?: string | null
  success?: string | null
  onSubmit?: (e: React.FormEvent) => void
  className?: string
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  description,
  error,
  success,
  onSubmit,
  className = ''
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* ヘッダー */}
        {(title || description) && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
            {description && <p className="text-purple-100 mt-1">{description}</p>}
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="px-6 py-6">
          {/* エラー/成功メッセージ */}
          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} />
            </div>
          )}
          {success && (
            <div className="mb-6">
              <Alert type="success" message={success} />
            </div>
          )}

          {/* フォームコンテンツ */}
          {children}
        </div>
      </div>
    </form>
  )
}

// フォームセクションコンポーネント
export interface FormSectionProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export const FormSection: React.FC<FormSectionProps> = ({
  children,
  title,
  description,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
      {description && <p className="text-sm text-gray-600">{description}</p>}
      {children}
    </div>
  )
}

// フォームフッターコンポーネント
export interface FormFooterProps {
  onTemporarySave?: () => void
  onSave?: () => void
  onCancel?: () => void
  saving?: boolean
  loading?: boolean
  showTemporarySave?: boolean
  showCancel?: boolean
  saveLabel?: string
  temporarySaveLabel?: string
  cancelLabel?: string
  disabled?: boolean
  className?: string
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onTemporarySave,
  onSave,
  onCancel,
  saving = false,
  loading = false,
  showTemporarySave = true,
  showCancel = false,
  disabled = false,
  className = ''
}) => {
  const isDisabled = disabled || saving || loading

  return (
    <div className={`flex justify-between items-center pt-6 border-t ${className}`}>
      <div className="flex space-x-3">
        {showCancel && onCancel && (
          <CancelButton
            onClick={onCancel}
            disabled={isDisabled}
          />
        )}
      </div>
      
      <div className="flex space-x-3">
        {showTemporarySave && onTemporarySave && (
          <TemporarySaveButton
            onClick={onTemporarySave}
            disabled={isDisabled}
            loading={saving}
          />
        )}
        
        {onSave && (
          <SaveButton
            onClick={onSave}
            disabled={isDisabled}
            loading={saving}
          />
        )}
      </div>
    </div>
  )
}

// セクションナビゲーションコンポーネント
export interface SectionNavigationProps {
  sections: Array<{
    id: string
    label: string
    required?: boolean
  }>
  activeSection: string
  sectionSaved?: Record<string, boolean>
  onSectionChange: (sectionId: string) => void
  className?: string
}

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  sections,
  activeSection,
  sectionSaved = {},
  onSectionChange,
  className = ''
}) => {
  return (
    <div className={`border-b ${className}`}>
      <nav className="flex -mb-px px-6 pt-4">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSectionChange(section.id)}
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
  )
}

// セクション付きフォームコンテナー
export interface SectionFormContainerProps extends FormContainerProps {
  sections: Array<{
    id: string
    label: string
    required?: boolean
  }>
  activeSection: string
  sectionSaved?: Record<string, boolean>
  onSectionChange: (sectionId: string) => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  navigationDisabled?: boolean
}

export const SectionFormContainer: React.FC<SectionFormContainerProps> = ({
  sections,
  activeSection,
  sectionSaved,
  onSectionChange,
  onPrevious,
  onNext,
  hasPrevious = true,
  hasNext = true,
  navigationDisabled = false,
  children,
  ...containerProps
}) => {
  return (
    <FormContainer {...containerProps}>
      <SectionNavigation
        sections={sections}
        activeSection={activeSection}
        sectionSaved={sectionSaved}
        onSectionChange={onSectionChange}
      />
      
      <div className="px-6 py-6">
        {children}
        
        {/* ナビゲーションボタン */}
        {(onPrevious || onNext) && (
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!hasPrevious || navigationDisabled}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext || navigationDisabled}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            )}
          </div>
        )}
      </div>
    </FormContainer>
  )
}