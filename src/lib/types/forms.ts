// Form-specific types and interfaces
import { Entry, SemifinalsInfo, FinalsInfo } from './database'

// Generic form props
export interface BaseFormProps {
  entry: Entry
}

// Specific form component props
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BasicInfoFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProgramInfoFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PreliminaryFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SemifinalsFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FinalsFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ApplicationsFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SnsFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConsentFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AdditionalInfoFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EntryFormProps extends BaseFormProps {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MusicInfoFormProps extends BaseFormProps {}

// Form section props
export interface FormSectionProps<T> {
  data: Partial<T>
  validationErrors: string[]
  onChange: (updates: Partial<T>) => void
  onFileUpload: (field: string, file: File) => void
  disabled?: boolean
}

// Specific section props for complex forms
export interface MusicSectionProps extends FormSectionProps<SemifinalsInfo> {
  musicChangeOption: 'changed' | 'unchanged' | ''
  onMusicChangeOption: (option: 'changed' | 'unchanged') => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SoundSectionProps extends FormSectionProps<SemifinalsInfo> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LightingSectionProps extends FormSectionProps<SemifinalsInfo> {}

export interface ChoreographerSectionProps extends FormSectionProps<SemifinalsInfo> {
  choreographerChangeOption: 'changed' | 'unchanged' | ''
  onChoreographerChangeOption: (option: 'changed' | 'unchanged') => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BankSectionProps extends FormSectionProps<SemifinalsInfo> {}

// Finals form section props
export interface FinalsMusicSectionProps extends FormSectionProps<FinalsInfo> {
  finalsInfo: Partial<FinalsInfo>
  musicChangeOption: 'changed' | 'unchanged' | ''
  onMusicChangeOption: (option: 'changed' | 'unchanged') => void
}

export interface FinalsSoundSectionProps extends FormSectionProps<FinalsInfo> {
  finalsInfo: Partial<FinalsInfo>
  soundChangeOption: 'same' | 'different' | ''
  onSoundChangeOption: (option: 'same' | 'different') => void
}

export interface FinalsLightingSectionProps extends FormSectionProps<FinalsInfo> {
  finalsInfo: Partial<FinalsInfo>
  lightingChangeOption: 'same' | 'different' | ''
  onLightingChangeOption: (option: 'same' | 'different') => void
}

export interface FinalsChoreographerSectionProps extends FormSectionProps<FinalsInfo> {
  finalsInfo: Partial<FinalsInfo>
  choreographerChangeOption: 'same' | 'different' | ''
  onChoreographerChangeOption: (option: 'same' | 'different') => void
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Form save options
export interface FormSaveOptions {
  tableName: string
  uniqueField?: string
  redirectPath?: string
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

// File upload result
export interface FileUploadResult {
  url: string
  fileName: string
  error?: string
}