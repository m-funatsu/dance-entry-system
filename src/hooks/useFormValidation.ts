import { useState, useEffect } from 'react'

interface ValidationRule {
  required?: boolean
  maxLength?: number
  minLength?: number
  pattern?: RegExp
  custom?: (value: unknown) => boolean | string
}

interface ValidationRules {
  [field: string]: ValidationRule
}

interface ValidationErrors {
  [field: string]: string
}

export const useFormValidation = <T extends Record<string, unknown>>(
  initialData: T,
  rules: ValidationRules
) => {
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isValid, setIsValid] = useState(false)

  const validateField = (field: string, value: unknown): string | null => {
    const rule = rules[field]
    if (!rule) return null

    // Required validation
    if (rule.required && (!value || value === '')) {
      return 'この項目は必須です'
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${rule.minLength}文字以上入力してください`
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${rule.maxLength}文字以内で入力してください`
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return '正しい形式で入力してください'
      }
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value)
      if (typeof result === 'string') {
        return result
      }
      if (!result) {
        return '入力値が正しくありません'
      }
    }

    return null
  }

  const validateAll = (data: T): boolean => {
    const newErrors: ValidationErrors = {}
    let hasError = false

    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field])
      if (error) {
        newErrors[field] = error
        hasError = true
      }
    })

    setErrors(newErrors)
    return !hasError
  }

  const validateSingleField = (field: string, value: unknown) => {
    const error = validateField(field, value)
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }))
  }

  const getRequiredFields = (): string[] => {
    return Object.entries(rules)
      .filter(([, rule]) => rule.required)
      .map(([field]) => field)
  }

  const getMissingRequiredFields = (data: T): string[] => {
    return getRequiredFields().filter(field => !data[field] || data[field] === '')
  }

  const isAllRequiredFieldsValid = (data: T): boolean => {
    return getMissingRequiredFields(data).length === 0
  }

  useEffect(() => {
    setIsValid(Object.keys(errors).length === 0)
  }, [errors])

  return {
    errors,
    isValid,
    validateAll,
    validateSingleField,
    isAllRequiredFieldsValid,
    getMissingRequiredFields,
    clearErrors: () => setErrors({})
  }
}