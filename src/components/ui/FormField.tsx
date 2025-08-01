'use client'

import React from 'react'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select'
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
  error?: string
  maxLength?: number
  rows?: number
  children?: React.ReactNode // for select options
  className?: string
  autoComplete?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  error,
  maxLength,
  rows = 3,
  children,
  className = '',
  autoComplete
}) => {
  const baseInputClass = `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
    disabled ? 'bg-gray-300 cursor-not-allowed' : ''
  } ${error ? 'border-red-300' : 'border-gray-300'} ${className}`

  const renderField = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={rows}
            className={baseInputClass}
          />
        )
      case 'select':
        return (
          <select
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={baseInputClass}
          >
            {children}
          </select>
        )
      default:
        return (
          <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
            className={baseInputClass}
            autoComplete={autoComplete}
          />
        )
    }
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {renderField()}
      {type === 'textarea' && maxLength && (
        <div className="text-sm text-gray-500 mt-1">
          {value.toString().length}/{maxLength}文字
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}