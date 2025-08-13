'use client'

import React, { memo } from 'react'
import type { FormFieldProps } from '@/lib/types'

export const FormField = memo<FormFieldProps>(({
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
  autoComplete,
  min,
  max
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
            min={min}
            max={max}
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
})

FormField.displayName = 'FormField'