// UI Component Props Types
import { ReactNode, ChangeEvent } from 'react'

// Button component props
export interface ButtonProps {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'cancel'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

// Form field component props
export interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'date' | 'datetime-local'
  value: string | number
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
  error?: string
  maxLength?: number
  rows?: number
  children?: ReactNode // for select options
  className?: string
  autoComplete?: string
  min?: string // for date/number inputs
  max?: string // for date/number inputs
}

// Alert component props
export interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  className?: string
  onClose?: () => void
}

// File upload component props
export interface FileUploadProps {
  label?: string
  value?: string | File | null
  onChange: (file: File) => void
  onDelete?: () => void
  disabled?: boolean
  required?: boolean
  maxSizeMB?: number
  accept?: string
  isEditable?: boolean
}

export interface ImageUploadProps extends FileUploadProps {
  accept?: string
  showStatusBar?: boolean // 統一ステータスバー表示
  hidePreviewUntilComplete?: boolean // アップロード完了までプレビュー非表示
}

export interface AudioUploadProps extends FileUploadProps {
  displayName?: string
  accept?: string
  deletable?: boolean // 削除ボタンの表示制御
  showStatusBar?: boolean // 統一ステータスバー表示
  hidePreviewUntilComplete?: boolean // アップロード完了までプレビュー非表示
}

export interface VideoUploadProps extends FileUploadProps {
  accept?: string
  showStatusBar?: boolean // 統一ステータスバー表示
  hidePreviewUntilComplete?: boolean // アップロード完了までプレビュー非表示
}

// Tab navigation props
export interface Tab {
  id: string
  label: string
  hasErrors?: boolean
  isComplete?: boolean
}

export interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

// Toast props
export interface ToastProps {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose: (id: string) => void
}

// Modal props
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
}

// Common form button props
export interface SaveButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
}

export interface TemporarySaveButtonProps extends SaveButtonProps {
  label?: string
}